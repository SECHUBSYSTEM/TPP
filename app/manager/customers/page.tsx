"use client";

import { useEffect, useState } from "react";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Customer = { id: number; name: string; email: string; location: { name: string } };
type Location = { id: number; name: string };

function fetchCustomers() {
  return $axios.get<Customer[]>("/customers").then((r) => r.data);
}

export default function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", locationId: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchCustomers(),
      $axios.get<Location[]>("/locations").then((r) => r.data),
    ])
      .then(([c, loc]) => {
        setCustomers(c);
        setLocations(loc);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(id: number) {
    if (!editForm.name.trim() || !editForm.email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await $axios.patch<Customer>(`/customers/${id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        locationId: editForm.locationId,
      });
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: res.data.name, email: res.data.email, location: res.data.location } : c
        )
      );
      setEditingId(null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Failed to update customer";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8!" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500">View and edit customers in your scope.</p>
      </div>
      {error && <p className="px-4 py-2 text-sm text-red-600 sm:px-6">{error}</p>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Email</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Location</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b text-black border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full max-w-[140px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full max-w-[180px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    c.email
                  )}
                </td>
                <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <select
                      value={editForm.locationId}
                      onChange={(e) => setEditForm((f) => ({ ...f, locationId: Number(e.target.value) }))}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    c.location.name
                  )}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(c.id)}
                        disabled={submitting}
                        className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-70"
                      >
                        {submitting ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setError("");
                        }}
                        className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditForm({
                          name: c.name,
                          email: c.email,
                          locationId: locations.find((l) => l.name === c.location.name)?.id ?? locations[0]?.id ?? 0,
                        });
                        setError("");
                      }}
                      className="cursor-pointer text-sm text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
