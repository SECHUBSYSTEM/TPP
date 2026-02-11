"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

const CART_KEY = "ecom_cart";

export default function CartPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Record<number, { name: string; price: number | string }>>({});
  const [cart, setCart] = useState<{ productId: number; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CART_KEY) : null;
    const items = raw ? JSON.parse(raw) : [];
    setCart(items);
    if (items.length === 0) {
      setLoading(false);
      return;
    }
    $axios.get("/products").then(({ data }) => {
      const map: Record<number, { name: string; price: number | string }> = {};
      data.forEach((p: { id: number; name: string; price: number | string }) => { map[p.id] = { name: p.name, price: p.price }; });
      setProducts(map);
    }).catch(() => router.replace("/login")).finally(() => setLoading(false));
  }, [router]);

  function removeFromCart(productId: number) {
    const next = cart.filter((i) => i.productId !== productId);
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  async function placeOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      await $axios.post("/orders", { items: cart });
      localStorage.setItem(CART_KEY, "[]");
      router.push("/orders");
      router.refresh();
    } catch (e) {
      console.error(e);
      setPlacing(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner className="size-8!" /></div>;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <span className="text-base font-semibold text-slate-900 sm:text-lg">Cart</span>
          <div className="flex min-h-[44px] items-center gap-2 sm:gap-4">
            <Link href="/shop" className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:px-3">Shop</Link>
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
        {cart.length === 0 ? (
          <p className="text-slate-600">Your cart is empty. <Link href="/shop" className="font-medium text-slate-900 underline">Browse shop</Link>.</p>
        ) : (
          <div className="rounded-xl border text-black border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <ul className="space-y-3">
              {cart.map(({ productId, quantity }) => (
                <li key={productId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex-1">{products[productId]?.name ?? `Product #${productId}`} × {quantity}</span>
                  <span className="tabular-nums">${products[productId] ? (Number(products[productId].price) * quantity).toFixed(2) : "0.00"}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(productId)}
                    className="cursor-pointer rounded px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove ${products[productId]?.name ?? "item"} from cart`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-medium">
              Total: ${cart.reduce((s, i) => s + (products[i.productId] ? Number(products[i.productId].price) * i.quantity : 0), 0).toFixed(2)}
            </p>
            <button type="button" onClick={placeOrder} disabled={placing} className="cursor-pointer mt-4 min-h-[44px] rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-70">
              {placing ? "Placing…" : "Place order"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
