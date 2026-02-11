"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type User = {
  id: number;
  username: string;
  name: string | null;
  role: string;
  createdAt: string;
  locationAssignments: { locationId: number; location: { name: string } }[];
  productLineAssignments: { productLineId: number; productLine: { name: string } }[];
};

type Location = { id: number; name: string };
type ProductLine = { id: number; name: string };

const ROLES = ["ADMIN", "LOCATION_MANAGER", "PRODUCT_MANAGER", "CUSTOMER"] as const;

function fetchUsers() {
  return $axios.get<User[]>("/users").then((r) => r.data);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "CUSTOMER" as (typeof ROLES)[number],
    locationIds: [] as number[],
    productLineIds: [] as number[],
    customerName: "",
    customerEmail: "",
    customerLocationId: 0,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchUsers(),
      $axios.get<Location[]>("/locations").then((r) => r.data),
      $axios.get<ProductLine[]>("/product-lines").then((r) => r.data),
    ]).then(([u, loc, pl]) => {
      setUsers(u);
      setLocations(loc);
      setProductLines(pl);
      setForm((f) => (f.customerLocationId || !loc.length ? f : { ...f, customerLocationId: loc[0].id }));
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.role === "CUSTOMER") {
      const name = form.customerName.trim();
      const email = form.customerEmail.trim();
      const locId = form.customerLocationId || locations[0]?.id;
      if (!name || !email || !locId) {
        setError("For customer users, please fill Customer name, Customer email, and select a Location.");
        return;
      }
    }
    if (form.role === "LOCATION_MANAGER" && form.locationIds.length === 0) {
      setError("Please select at least one location for a location manager.");
      return;
    }
    if (form.role === "PRODUCT_MANAGER" && form.productLineIds.length === 0) {
      setError("Please select at least one product line for a product manager.");
      return;
    }
    setSubmitting(true);
    try {
      const customerLocationId = form.role === "CUSTOMER" ? (form.customerLocationId || locations[0]?.id) : undefined;
      const userDisplayName = form.role === "CUSTOMER" ? form.customerName.trim() : form.name.trim();
      await $axios.post("/users", {
        username: form.username,
        name: userDisplayName || undefined,
        password: form.password,
        role: form.role,
        locationIds: form.role === "LOCATION_MANAGER" ? form.locationIds : undefined,
        productLineIds: form.role === "PRODUCT_MANAGER" ? form.productLineIds : undefined,
        customerName: form.role === "CUSTOMER" ? form.customerName.trim() : undefined,
        customerEmail: form.role === "CUSTOMER" ? form.customerEmail.trim() : undefined,
        customerLocationId: customerLocationId ?? undefined,
      });
      const next = await fetchUsers();
      setUsers(next);
      setShowForm(false);
      setForm({ username: "", name: "", password: "", role: "CUSTOMER", locationIds: [], productLineIds: [], customerName: "", customerEmail: "", customerLocationId: locations[0]?.id ?? 0 });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to create user";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleLocation(id: number) {
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(id) ? f.locationIds.filter((x) => x !== id) : [...f.locationIds, id],
    }));
  }

  function toggleProductLine(id: number) {
    setForm((f) => ({
      ...f,
      productLineIds: f.productLineIds.includes(id) ? f.productLineIds.filter((x) => x !== id) : [...f.productLineIds, id],
    }));
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await $axios.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
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
          <h1 className="text-lg font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Create and manage users and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Add user"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="border-b border-slate-200 bg-slate-50/50 px-4 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            {form.role !== "CUSTOMER" && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Display name (optional)</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. Jane Admin, Ngozi Damola"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as (typeof ROLES)[number] }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {form.role === "LOCATION_MANAGER" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Locations</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <label key={loc.id} className="flex text-black items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={form.locationIds.includes(loc.id)}
                        onChange={() => toggleLocation(loc.id)}
                        className="text-black rounded border-slate-300"
                      />
                      {loc.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.role === "PRODUCT_MANAGER" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Product lines</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {productLines.map((pl) => (
                    <label key={pl.id} className="flex text-black items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={form.productLineIds.includes(pl.id)}
                        onChange={() => toggleProductLine(pl.id)}
                        className="text-black rounded border-slate-300"
                      />
                      {pl.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.role === "CUSTOMER" && (
              <>
                <div className="sm:col-span-2 text-sm font-medium text-slate-700 border-t border-slate-200 pt-2 mt-1">
                  Link to Customers table (required for placing orders)
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Full name (used for account and customer profile)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Customer email</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Location</label>
                  <select
                    value={form.customerLocationId || locations[0]?.id}
                    onChange={(e) => setForm((f) => ({ ...f, customerLocationId: Number(e.target.value) }))}
                    className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-70"
          >
            {submitting ? "Creating…" : "Create user"}
          </button>
        </form>
      )}
      {error && <p className="px-4 py-2 text-sm text-red-600 sm:px-6">{error}</p>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Username</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Role</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Scopes</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{u.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-6 sm:py-4">{u.name || "—"}</td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{u.username}</td>
                <td className="px-3 py-2.5 text-slate-700 sm:px-6 sm:py-4">{u.role}</td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {u.role === "LOCATION_MANAGER" && u.locationAssignments.map((a) => a.location.name).join(", ")}
                  {u.role === "PRODUCT_MANAGER" && u.productLineAssignments.map((a) => a.productLine.name).join(", ")}
                  {(u.role === "ADMIN" || u.role === "CUSTOMER") && "—"}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-6 sm:py-4">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="cursor-pointer text-sm text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </Link>
                  <span className="mx-2 text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    className="cursor-pointer text-sm text-red-600 hover:text-red-700 disabled:opacity-70"
                  >
                    {deletingId === u.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
