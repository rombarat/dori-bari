import Link from "next/link";
import { ChevronLeft, PackagePlus, PackageX, Receipt } from "lucide-react";
import clsx from "clsx";
import { PageHeader, Panel } from "@/components/admin/page-parts";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { getOrders } from "@/lib/admin-data";
import { israelNow } from "@/lib/pickup";
import { formatPrice, formatRelative, formatTime } from "@/lib/format";
import { pickupLabel } from "@/lib/admin-format";
import { ACTIVE_STATUSES } from "@/lib/order-status";

function israelMonth(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit" }).format(new Date(iso));
}

export default async function DashboardPage() {
  const orders = await getOrders();
  const now = israelNow();
  const today = now.date;
  const hour = Math.floor(now.minutes / 60);
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";
  const thisMonth = today.slice(0, 7);

  const count = (s: string[]) => orders.filter((o) => s.includes(o.status)).length;
  const newCount = count(["new"]);
  const inProgress = count(["confirmed", "preparing"]);
  const ready = count(["ready"]);
  const monthOrders = orders.filter((o) => o.status !== "cancelled" && israelMonth(o.created_at) === thisMonth);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const openValue = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).reduce((sum, o) => sum + Number(o.total), 0);

  const upcoming = orders
    .filter((o) => ACTIVE_STATUSES.includes(o.status) && o.pickup_date === today)
    .sort((a, b) => a.pickup_time.localeCompare(b.pickup_time));
  const tomorrowAndLater = orders
    .filter((o) => ACTIVE_STATUSES.includes(o.status) && o.pickup_date > today)
    .sort((a, b) => (a.pickup_date + a.pickup_time).localeCompare(b.pickup_date + b.pickup_time))
    .slice(0, 5);
  const recent = orders.slice(0, 6);

  const stats = [
    { label: "הזמנות חדשות", value: newCount, href: "/admin/orders?view=new", hot: newCount > 0, hint: newCount ? "ממתינות לאישור" : "הכול מטופל" },
    { label: "בטיפול", value: inProgress, href: "/admin/orders?view=active", hint: "אושרו או בהכנה" },
    { label: "מוכנות לאיסוף", value: ready, href: "/admin/orders?view=active", hint: "מחכות ללקוח" },
    { label: "סכום הזמנות החודש", value: formatPrice(monthRevenue), href: "/admin/orders?view=all", hint: `${monthOrders.length} הזמנות, ${formatPrice(openValue)} פתוחות` },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting}, דורה`}
        description="זה מה שקורה בחנות עכשיו."
        actions={
          <LinkButton href="/admin/products/new" icon={<PackagePlus className="size-[18px]" />}>
            הוספת מוצר
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={clsx(
              "group rounded-[var(--radius-panel)] border p-4 transition-colors md:p-5",
              s.hot ? "border-raspberry bg-raspberry text-white" : "border-crumb bg-white hover:border-cocoa/30",
            )}
          >
            <p className={clsx("text-[14px] font-semibold", s.hot ? "text-white/90" : "text-muted")}>{s.label}</p>
            <p className="tabular mt-1 text-[30px] font-bold leading-tight md:text-[34px]">{s.value}</p>
            <p className={clsx("mt-0.5 text-[13px]", s.hot ? "text-white/85" : "text-muted")}>{s.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between border-b border-crumb px-5 py-4">
            <h2 className="text-[18px] font-bold">איסופים היום</h2>
            <span className="tabular text-muted">{upcoming.length}</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-5 py-8 text-center text-muted">אין איסופים מתוכננים להיום.</p>
          ) : (
            <ul className="divide-y divide-crumb">
              {upcoming.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-meringue/40">
                    <span className="tabular w-12 text-[17px] font-bold">{formatTime(o.pickup_time)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      #{o.order_number} {o.customer_name}
                    </span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {tomorrowAndLater.length > 0 && (
            <>
              <h3 className="border-t border-crumb px-5 pb-1 pt-4 text-[14px] font-semibold text-muted">הבאים בתור</h3>
              <ul className="pb-2">
                {tomorrowAndLater.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-2.5 hover:bg-meringue/40">
                      <span className="w-24 shrink-0 text-[15px] font-semibold">
                        {pickupLabel(o.pickup_date, today).label} <span className="tabular">{formatTime(o.pickup_time)}</span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px]">
                        #{o.order_number} {o.customer_name}
                      </span>
                      <StatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center justify-between border-b border-crumb px-5 py-4">
            <h2 className="text-[18px] font-bold">הזמנות אחרונות</h2>
            <Link href="/admin/orders?view=all" className="inline-flex items-center text-[15px] font-semibold text-cocoa hover:underline">
              לכל ההזמנות
              <ChevronLeft className="size-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={<Receipt className="size-6" />} title="עוד אין הזמנות" body="הזמנות שלקוחות שולחים מהאתר יופיעו כאן מיד." />
          ) : (
            <ul className="divide-y divide-crumb">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-meringue/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        <span className="tabular">#{o.order_number}</span> {o.customer_name}
                      </p>
                      <p className="text-[13px] text-muted">{formatRelative(o.created_at)}</p>
                    </div>
                    <span className="tabular font-semibold">{formatPrice(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-6 flex flex-wrap items-center gap-4 p-5">
        <PackageX className="size-6 text-cocoa" strokeWidth={1.75} />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">משהו נגמר?</span> <span className="text-muted">אפשר להוריד מוצר מהחנות בלחיצה אחת, בלי למחוק אותו.</span>
        </p>
        <LinkButton href="/admin/products" variant="secondary">
          לניהול מוצרים
        </LinkButton>
      </Panel>
    </>
  );
}
