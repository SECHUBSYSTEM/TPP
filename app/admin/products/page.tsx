"use client";

import { useEffect, useState } from "react";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number | string;
  productLineId: number;
  productLine: { name: string };
};

type ProductLine = { id: number; name: string };

function fetchProducts() {
  return $axios.get<Product[]>("/products").then((r) => r.data);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "", price: "", productLineId: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", price: "", productLineId: 0 });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      $axios.get<ProductLine[]>("/product-lines").then((r) => r.data),
    ]).then(([p, pl]) => {
      setProducts(p);
      setProductLines(pl);
      if (pl.length && !form.productLineId) setForm((f) => ({ ...f, productLineId: pl[0].id }));
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price <= 0) {
      setError("Enter a valid price");
      setSubmitting(false);
      return;
    }
    try {
      await $axios.post("/products", {
        name: form.name,
        category: form.category,
        price,
        productLineId: form.productLineId,
      });
      const next = await fetchProducts();
      setProducts(next);
      setShowForm(false);
      setForm({ name: "", category: "", price: "", productLineId: productLines[0]?.id ?? 0 });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to create product";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: number) {
    const price = parseFloat(editForm.price);
    if (!editForm.name.trim() || Number.isNaN(price) || price <= 0) {
      setError("Enter valid name and price");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await $axios.patch(`/products/${id}`, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        price,
        productLineId: editForm.productLineId,
      });
      const next = await fetchProducts();
      setProducts(next);
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
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await $axios.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
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
          <h1 className="text-lg font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage products and their product lines.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Add product"}
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
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. electronics"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Product line</label>
              <select
                value={form.productLineId || productLines[0]?.id}
                onChange={(e) => setForm((f) => ({ ...f, productLineId: Number(e.target.value) }))}
                className="mt-1 w-full text-black rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {productLines.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-70"
          >
            {submitting ? "Creating…" : "Create product"}
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
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Category</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Price</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700 sm:px-6 sm:py-3">Product line</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-6 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">{p.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-6 sm:py-4">
                  {editingId === p.id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full max-w-[140px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    p.name
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {editingId === p.id ? (
                    <input
                      value={editForm.category}
                      onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full max-w-[120px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    p.category
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {editingId === p.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.price}
                      onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    `$${Number(p.price).toFixed(2)}`
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600 sm:px-6 sm:py-4">
                  {editingId === p.id ? (
                    <select
                      value={editForm.productLineId}
                      onChange={(e) => setEditForm((f) => ({ ...f, productLineId: Number(e.target.value) }))}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {productLines.map((pl) => (
                        <option key={pl.id} value={pl.id}>{pl.name}</option>
                      ))}
                    </select>
                  ) : (
                    p.productLine.name
                  )}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-6 sm:py-4">
                  {editingId === p.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(p.id)}
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
                          setEditingId(p.id);
                          setEditForm({
                            name: p.name,
                            category: p.category,
                            price: String(Number(p.price)),
                            productLineId: p.productLineId ?? productLines[0]?.id ?? 0,
                          });
                          setError("");
                        }}
                        className="cursor-pointer text-sm text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="cursor-pointer text-sm text-red-600 hover:text-red-700 disabled:opacity-70"
                      >
                        {deletingId === p.id ? "Deleting…" : "Delete"}
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
