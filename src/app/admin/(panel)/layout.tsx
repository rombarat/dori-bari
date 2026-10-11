import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminUser, getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ניהול", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const supabase = await getServerSupabase();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");

  return <AdminShell newCount={count ?? 0}>{children}</AdminShell>;
}
