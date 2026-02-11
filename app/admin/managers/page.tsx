"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Manager = {
  id: number;
  username: string;
  name: string | null;
  role: string;
  createdAt: string;
  locationAssignments: { locationId: number; location: { name: string } }[];
  productLineAssignments: { productLineId: number; productLine: { name: string } }[];
};

function fetchUsers() {
  return $axios.get<Manager[]>("/users").then((r) => r.data);
}

const MANAGER_ROLES = ["LOCATION_MANAGER", "PRODUCT_MANAGER"] as const;

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  function loadManagers() {
    fetchUsers()
      .then((users) => users.filter((u) => (MANAGER_ROLES as readonly string[]).includes(u.role)))
      .then(setManagers)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadManagers();
  }, []);

  // Refetch when tab/window gains focus so new managers (created on Users page) show up
  useEffect(() => {
    const onFocus = () => {
      fetchUsers()
        .then((users) => users.filter((u) => (MANAGER_ROLES as readonly string[]).includes(u.role)))
        .then(setManagers);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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
        <h1 className="text-lg font-semibold text-slate-900">Managers</h1>
        <p className="text-sm text-slate-500">
          All location managers and product managers. Edit role and assignments from the Users page or via Edit.
        </p>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Username</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Role</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Assigned locations</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Assigned product lines</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Created</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((m) => (
              <tr key={m.id} className="border-b  border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{m.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-6 sm:py-4">{m.name || m.username}</td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{m.username}</td>
                <td className="px-3 py-2.5 text-slate-700 sm:px-6 sm:py-4">{m.role.replace(/_/g, " ")}</td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {m.role === "LOCATION_MANAGER"
                    ? m.locationAssignments.map((a) => a.location.name).join(", ") || "—"
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {m.role === "PRODUCT_MANAGER"
                    ? m.productLineAssignments.map((a) => a.productLine.name).join(", ") || "—"
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-6 sm:py-4">
                  <Link
                    href={`/admin/users/${m.id}`}
                    className="cursor-pointer text-sm text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {managers.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-6">No managers found.</p>
      )}
    </div>
  );
}
