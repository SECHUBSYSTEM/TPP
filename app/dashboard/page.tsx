"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { $axios } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

type Me = {
  userId: number;
  username: string;
  role: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [, setLoading] = useState(true);

  useEffect(() => {
    $axios
      .get<Me>("/auth/me")
      .then(({ data }) => {
        if (data.role === "ADMIN") router.replace("/admin/users");
        else if (data.role === "LOCATION_MANAGER" || data.role === "PRODUCT_MANAGER") router.replace("/manager/orders");
        else router.replace("/shop");
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner className="size-8!" />
    </div>
  );
}
