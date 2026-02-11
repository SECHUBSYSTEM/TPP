"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

const nav = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/managers", label: "Managers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/product-lines", label: "Product lines" },
  { href: "/admin/products", label: "Products" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    $axios.get("/auth/me").then(({ data }) => {
      if (data.role !== "ADMIN") router.replace("/dashboard");
      else setOk(true);
    }).catch(() => router.replace("/login")).finally(() => setOk((v) => (v === true ? true : false)));
  }, [router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (ok === null) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner className="size-8!" />
    </div>
  );
  if (!ok) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <Link href="/admin/users" className="text-base font-semibold text-slate-900 sm:text-lg">Admin</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden items-center gap-2 md:flex md:gap-4">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className={"text-sm font-medium " + (pathname === n.href ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}>{n.label}</Link>
              ))}
            </nav>
            <Link href="/dashboard" className="hidden text-sm text-slate-500 hover:text-slate-700 sm:inline">Dashboard</Link>
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
              className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-default disabled:opacity-70 sm:min-h-[44px] sm:px-3"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {menuOpen ? (
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 md:hidden">
            <Link href="/dashboard" className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Dashboard</Link>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={"cursor-pointer rounded-lg px-3 py-2.5 text-sm " + (pathname === n.href ? "font-medium text-slate-900 bg-slate-100" : "text-slate-600 hover:bg-slate-50")}>{n.label}</Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
