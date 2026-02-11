"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Order = {
  id: number;
  totalAmount: number | string;
  status: string;
  createdAt: string;
  items: { quantity: number; product: { name: string } }[];
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    $axios.get<Order[]>("/orders").then(({ data }) => setOrders(data)).catch(() => router.replace("/login")).finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex justify-center py-12"><Spinner className="size-8!" /></div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <span className="text-base font-semibold text-slate-900 sm:text-lg">My orders</span>
          <div className="flex min-h-[44px] items-center gap-2 sm:gap-4">
            <Link href="/shop" className="cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-3">Shop</Link>
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await $axios.post("/auth/logout");
                  router.replace("/login");
                  router.refresh();
                } finally {
                  setLoggingOut(false);
                }
              }}
              className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-default disabled:opacity-70 sm:px-3"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Total</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b text-black border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{o.id}</td>
                  <td className="px-3 py-2.5 sm:px-6 sm:py-4">${Number(o.totalAmount).toFixed(2)}</td>
                  <td className="px-3 py-2.5 sm:px-6 sm:py-4">{o.status}</td>
                  <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{o.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
