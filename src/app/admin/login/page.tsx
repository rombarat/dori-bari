import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "כניסה לניהול", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-meringue px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/logo.png" alt="Dor.Bari" width={404} height={132} priority className="h-16 w-auto" />
          <h1 className="mt-6 font-display text-[34px] leading-none">ניהול החנות</h1>
          <p className="mt-2 text-muted">הזמנות, מוצרים וזמני איסוף במקום אחד</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
