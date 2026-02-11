"use client";

import { useEffect, useState } from "react";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

type Order = {
  id: number;
  totalAmount: number | string;
  status: string;
  customer: { name: string };
  items: { quantity: number; product: { name: string } }[];
};

function fetchOrders() {
  return $axios.get<Order[]>("/orders").then((r) => r.data);
}

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  async function handleUpdate(id: number) {
    if (!editStatus.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await $axios.patch<Order>(`/orders/${id}`, { status: editStatus.trim() });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: res.data.status } : o)));
      setEditingId(null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Failed to update order";
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
        <h1 className="text-lg font-semibold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500">View and update order status in your scope.</p>
      </div>
      {error && <p className="px-4 py-2 text-sm text-red-600 sm:px-6">{error}</p>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Customer</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Total</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Status</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b text-black border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{o.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-6 sm:py-4">{o.customer.name}</td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">${Number(o.totalAmount).toFixed(2)}</td>
                <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                  {editingId === o.id ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="text-black rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-700">{o.status}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-6 sm:py-4">
                  {editingId === o.id ? (
                    <div className="flex text-black justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(o.id)}
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
                        setEditingId(o.id);
                        setEditStatus(o.status);
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
