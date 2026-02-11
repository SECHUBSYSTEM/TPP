"use client";

import { useEffect, useState } from "react";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Location = { id: number; name: string };

function fetchLocations() {
  return $axios.get<Location[]>("/locations").then((r) => r.data);
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchLocations().then(setLocations).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await $axios.post("/locations", { name });
      const next = await fetchLocations();
      setLocations(next);
      setShowForm(false);
      setName("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to create location";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await $axios.patch(`/locations/${id}`, { name: editName.trim() });
      const next = await fetchLocations();
      setLocations(next);
      setEditingId(null);
      setEditName("");
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
    if (!confirm("Delete this location? This action cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await $axios.delete(`/locations/${id}`);
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
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
          <h1 className="text-lg font-semibold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500">Manage locations.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Add location"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="border-b border-slate-200 bg-slate-50/50 px-4 py-4 sm:px-6">
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full text-black max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Ghana"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-70"
          >
            {submitting ? "Creating…" : "Create location"}
          </button>
        </form>
      )}
      {error && <p className="px-4 py-2 text-sm text-red-600 sm:px-6">{error}</p>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{loc.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-6 sm:py-4">
                  {editingId === loc.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    loc.name
                  )}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-6 sm:py-4">
                  {editingId === loc.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(loc.id)}
                        disabled={submitting}
                        className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-70"
                      >
                        {submitting ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setEditName(""); setError(""); }}
                        className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingId(loc.id); setEditName(loc.name); setError(""); }}
                        className="cursor-pointer text-sm text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(loc.id)}
                        disabled={deletingId === loc.id}
                        className="cursor-pointer text-sm text-red-600 hover:text-red-700 disabled:opacity-70"
                      >
                        {deletingId === loc.id ? "Deleting…" : "Delete"}
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
