"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type UserDetail = {
  id: number;
  username: string;
  name: string | null;
  role: string;
  createdAt: string;
  locationAssignments: { locationId: number }[];
  productLineAssignments: { productLineId: number }[];
};

type Location = { id: number; name: string };
type ProductLine = { id: number; name: string };

const ROLES = ["ADMIN", "LOCATION_MANAGER", "PRODUCT_MANAGER", "CUSTOMER"] as const;

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "CUSTOMER" as (typeof ROLES)[number],
    locationIds: [] as number[],
    productLineIds: [] as number[],
  });

  useEffect(() => {
    if (Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    Promise.all([
      $axios.get<UserDetail>(`/users/${id}`).then((r) => r.data),
      $axios.get<Location[]>("/locations").then((r) => r.data),
      $axios.get<ProductLine[]>("/product-lines").then((r) => r.data),
    ])
      .then(([u, loc, pl]) => {
        setUser(u);
        setLocations(loc);
        setProductLines(pl);
        setForm({
          username: u.username,
          name: u.name ?? "",
          password: "",
          role: u.role as (typeof ROLES)[number],
          locationIds: u.locationAssignments.map((a) => a.locationId),
          productLineIds: u.productLineAssignments.map((a) => a.productLineId),
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleLocation(locationId: number) {
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(locationId)
        ? f.locationIds.filter((x) => x !== locationId)
        : [...f.locationIds, locationId],
    }));
  }

  function toggleProductLine(productLineId: number) {
    setForm((f) => ({
      ...f,
      productLineIds: f.productLineIds.includes(productLineId)
        ? f.productLineIds.filter((x) => x !== productLineId)
        : [...f.productLineIds, productLineId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username.trim()) return;
    if (form.role === "LOCATION_MANAGER" && form.locationIds.length === 0) {
      setError("Please select at least one location for a location manager.");
      return;
    }
    if (form.role === "PRODUCT_MANAGER" && form.productLineIds.length === 0) {
      setError("Please select at least one product line for a product manager.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body: { username: string; name?: string; password?: string; role: string; locationIds?: number[]; productLineIds?: number[] } = {
        username: form.username.trim(),
        role: form.role,
      };
      if (form.name.trim()) body.name = form.name.trim();
      if (form.password.trim()) body.password = form.password;
      if (form.role === "LOCATION_MANAGER") body.locationIds = form.locationIds;
      if (form.role === "PRODUCT_MANAGER") body.productLineIds = form.productLineIds;
      await $axios.patch(`/users/${id}`, body);
      router.push("/admin/users");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Failed to update user";
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

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-slate-600">User not found.</p>
        <Link href="/admin/users" className="mt-4 inline-block text-sm font-medium text-slate-700 hover:text-slate-900">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-slate-900">Edit user</h1>
        <p className="text-sm text-slate-500">
          Update username, password (optional), role, and scopes.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Display name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
              placeholder="e.g. Ngozi Okeke"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">New password (leave blank to keep)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
              placeholder="Optional"
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
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.role === "LOCATION_MANAGER" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Locations</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {locations.map((loc) => (
                <label key={loc.id} className="flex cursor-pointer text-black items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.locationIds.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                    className="rounded border-slate-300 text-black"
                  />
                  {loc.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {form.role === "PRODUCT_MANAGER" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Product lines</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {productLines.map((pl) => (
                <label key={pl.id} className="flex cursor-pointer text-black items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.productLineIds.includes(pl.id)}
                    onChange={() => toggleProductLine(pl.id)}
                    className="rounded border-slate-300 text-black"
                  />
                  {pl.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-70"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link
            href="/admin/users"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
