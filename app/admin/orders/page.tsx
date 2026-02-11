"use client";

import { useEffect, useState } from "react";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type OrderItem = {
  quantity: number;
  unitPrice: number | string;
  product: { name: string; price: number | string; productLine: { name: string } };
};

type Order = {
  id: number;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  customer: { id: number; name: string; email: string; location: { name: string } };
  items: OrderItem[];
};

function fetchOrders() {
  return $axios.get<Order[]>("/orders").then((r) => r.data);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders().then(setOrders).finally(() => setLoading(false));
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
        <h1 className="text-lg font-semibold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500">All orders across customers and locations.</p>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Customer</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Location</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Status</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Total</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Date</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{order.id}</td>
                <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                  <span className="font-medium text-slate-900">{order.customer.name}</span>
                  <span className="block text-xs text-slate-500">{order.customer.email}</span>
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{order.customer.location.name}</td>
                <td className="px-3 py-2.5 text-slate-700 sm:px-6 sm:py-4">{order.status}</td>
                <td className="px-3 py-2.5 text-right font-medium text-slate-900 sm:px-6 sm:py-4">
                  ${Number(order.totalAmount).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  <ul className="list-inside list-disc space-y-0.5">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.product.name} × {item.quantity} @ ${Number(item.unitPrice).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
