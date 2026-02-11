"use client";

import { useEffect, useState } from "react";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Customer = { id: number; name: string; email: string; locationId?: number; location: { name: string } };
type Location = { id: number; name: string };

function fetchCustomers() {
  return $axios.get<Customer[]>("/customers").then((r) => r.data);
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", locationId: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", locationId: 0 });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCustomers(),
      $axios.get<Location[]>("/locations").then((r) => r.data),
    ]).then(([c, loc]) => {
      setCustomers(c);
      setLocations(loc);
      if (loc.length && !form.locationId) setForm((f) => ({ ...f, locationId: loc[0].id }));
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const locationId = form.locationId || locations[0]?.id;
    if (!locationId) {
      setError("Please select a location.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await $axios.post("/customers", {
        name: form.name.trim(),
        email: form.email.trim(),
        locationId,
      });
      const next = await fetchCustomers();
      setCustomers(next);
      setShowForm(false);
      setForm({ name: "", email: "", locationId: locations[0]?.id ?? 0 });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to create customer";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

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
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, name: res.data.name, email: res.data.email, location: res.data.location } : c)));
      setEditingId(null);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to update";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer? This action cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await $axios.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to delete";
      setError(String(msg));
    } finally {
      setDeletingId(null);
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
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Create and manage customer profiles.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Add customer"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="border-b border-slate-200 bg-slate-50/50 px-4 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <select
                value={form.locationId || locations[0]?.id}
                onChange={(e) => setForm((f) => ({ ...f, locationId: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-70"
          >
            {submitting ? "Creating…" : "Create customer"}
          </button>
        </form>
      )}
      {error && <p className="px-4 py-2 text-sm text-red-600 sm:px-6">{error}</p>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Email</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Location</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{c.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full max-w-[140px] text-black rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full max-w-[180px] text-black rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    c.email
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {editingId === c.id ? (
                    <select
                      value={editForm.locationId}
                      onChange={(e) => setEditForm((f) => ({ ...f, locationId: Number(e.target.value) }))}
                      className="text-black rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
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
                        onClick={() => { setEditingId(null); setError(""); }}
                        className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
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
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="cursor-pointer text-sm text-red-600 hover:text-red-700 disabled:opacity-70"
                      >
                        {deletingId === c.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
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
