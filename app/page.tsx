import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">E-Commerce RBAC</h1>
      <p className="text-slate-600">User management and role-based access.</p>
      <Link
        href="/login"
        className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Sign in
      </Link>
    </div>
  );
}
