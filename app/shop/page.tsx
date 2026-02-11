"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

const CART_KEY = "ecom_cart";

function getCart(): { productId: number; quantity: number }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setCart(items: { productId: number; quantity: number }[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<{ id: number; name: string; price: number | string; productLine: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cartNotice, setCartNotice] = useState(false);
  useEffect(() => {
    setCartCount(getCart().reduce((s, i) => s + i.quantity, 0));
  }, []);
  useEffect(() => {
    $axios.get("/products").then(({ data }) => setProducts(data)).catch(() => router.replace("/login")).finally(() => setLoading(false));
  }, [router]);
  function addToCart(productId: number) {
    const cart = getCart();
    const i = cart.findIndex((c) => c.productId === productId);
    if (i >= 0) cart[i].quantity += 1;
    else cart.push({ productId, quantity: 1 });
    setCart(cart);
    setCartCount(cart.reduce((s, x) => s + x.quantity, 0));
    setCartNotice(true);
    window.setTimeout(() => setCartNotice(false), 4000);
  }
  if (loading) return <div className="flex justify-center py-12"><Spinner className="!size-8" /></div>;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <span className="text-base font-semibold text-slate-900 sm:text-lg">Shop</span>
          <div className="flex min-h-[44px] items-center gap-2 sm:gap-4">
            <Link href="/cart" className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:px-3">Cart ({cartCount})</Link>
            <Link href="/orders" className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:px-3">My orders</Link>
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
      {cartNotice && (
          <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span>Added to cart. Check your cart when you&apos;re ready to checkout.</span>
              <button type="button" onClick={() => setCartNotice(false)} className="shrink-0 rounded p-1 text-emerald-600 hover:bg-emerald-100" aria-label="Dismiss">×</button>
            </div>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{p.productLine.name}</p>
              <h2 className="font-medium text-slate-900">{p.name}</h2>
              <p className="text-sm text-slate-600">${Number(p.price).toFixed(2)}</p>
              <button type="button" onClick={() => addToCart(p.id)} className="cursor-pointer mt-2 min-h-[44px] rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800 active:bg-slate-700">Add to cart</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
