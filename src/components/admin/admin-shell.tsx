"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ExternalLink, LayoutDashboard, LogOut, Package, Receipt, Settings } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "סקירה", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "הזמנות", icon: Receipt },
  { href: "/admin/products", label: "מוצרים", icon: Package },
  { href: "/admin/pickup", label: "זמני איסוף", icon: CalendarDays },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

export function AdminShell({ children, newCount }: { children: ReactNode; newCount: number }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href) || (item.href === "/admin/products" && pathname.startsWith("/admin/categories"));

  // Live: a new order appears without refreshing.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      // Orders are admin-only under RLS, so the socket must carry the admin's token before subscribing.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel(`admin-orders-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
          const order = payload.new as { id: string; order_number: number; customer_name: string };
          toast(`הזמנה חדשה #${order.order_number}`, {
            description: order.customer_name,
            duration: 10000,
            action: { label: "לצפייה", onClick: () => router.push(`/admin/orders/${order.id}`) },
          });
          router.refresh();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => router.refresh())
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const signOut = async () => {
    await getBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-[#faf6f3] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-crumb bg-white md:flex">
        <div className="px-6 pb-4 pt-6">
          <Image src="/brand/logo.png" alt="Dor.Bari" width={404} height={132} className="h-11 w-auto" />
          <p className="mt-1 text-[13px] text-muted">ניהול החנות</p>
        </div>
        <nav aria-label="ניהול" className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={clsx(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-[16px] font-semibold transition-colors",
                    isActive(item) ? "bg-meringue text-ganache" : "text-muted hover:bg-meringue/60 hover:text-ganache",
                  )}
                >
                  <item.icon className="size-5" strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/admin/orders" && newCount > 0 && (
                    <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-full bg-raspberry px-1.5 text-[12px] font-bold text-white">
                      {newCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-1 border-t border-crumb p-3">
          <a href="/" target="_blank" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-muted hover:bg-meringue/60 hover:text-ganache">
            <ExternalLink className="size-[18px]" />
            צפייה בחנות
          </a>
          <button type="button" onClick={signOut} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] text-muted hover:bg-meringue/60 hover:text-ganache">
            <LogOut className="size-[18px]" />
            התנתקות
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-crumb bg-white/95 px-4 backdrop-blur-md md:hidden">
        <Image src="/brand/logo.png" alt="Dor.Bari" width={404} height={132} className="h-9 w-auto" />
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-meringue" aria-label="צפייה בחנות">
            <ExternalLink className="size-5" />
          </a>
          <button type="button" onClick={signOut} className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-meringue" aria-label="התנתקות">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-10">
        <div className="mx-auto max-w-[1080px]">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="ניהול" className="fixed inset-x-0 bottom-0 z-30 border-t border-crumb bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={clsx(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold",
                  isActive(item) ? "text-cocoa" : "text-muted",
                )}
              >
                <item.icon className="size-[22px]" strokeWidth={isActive(item) ? 2.25 : 1.75} />
                {item.label}
                {item.href === "/admin/orders" && newCount > 0 && (
                  <span className="tabular absolute top-1.5 start-[calc(50%+6px)] flex h-5 min-w-5 items-center justify-center rounded-full bg-raspberry px-1 text-[11px] font-bold text-white">
                    {newCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
