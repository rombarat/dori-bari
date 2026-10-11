"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Receipt, Search } from "lucide-react";
import { OrderCard } from "./order-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ACTIVE_STATUSES } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/types";

const VIEWS: { id: string; label: string; statuses: OrderStatus[] | null }[] = [
  { id: "active", label: "לטיפול", statuses: ACTIVE_STATUSES },
  { id: "new", label: "חדשות", statuses: ["new"] },
  { id: "completed", label: "נמסרו", statuses: ["completed"] },
  { id: "cancelled", label: "בוטלו", statuses: ["cancelled"] },
  { id: "all", label: "הכול", statuses: null },
];

export function OrdersBoard({ orders, today, initialView }: { orders: Order[]; today: string; initialView?: string }) {
  const [view, setView] = useState(VIEWS.some((v) => v.id === initialView) ? initialView! : "active");
  const [query, setQuery] = useState("");

  const current = VIEWS.find((v) => v.id === view)!;

  const filtered = useMemo(() => {
    const q = query.trim().replace(/^#/, "");
    const digits = q.replace(/\D/g, "");
    const list = orders.filter((o) => {
      if (current.statuses && !current.statuses.includes(o.status)) return false;
      if (!q) return true;
      return (
        o.customer_name.includes(q) ||
        String(o.order_number) === q ||
        (digits.length >= 3 && o.phone.replace(/\D/g, "").includes(digits))
      );
    });
    // Work queue: soonest pickup first, new orders on top. History: newest first.
    if (view === "active" || view === "new") {
      return list.sort(
        (a, b) =>
          Number(b.status === "new") - Number(a.status === "new") ||
          (a.pickup_date + a.pickup_time).localeCompare(b.pickup_date + b.pickup_time),
      );
    }
    return list;
  }, [orders, current, query, view]);

  const countFor = (statuses: OrderStatus[] | null) => (statuses ? orders.filter((o) => statuses.includes(o.status)).length : orders.length);

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="סינון הזמנות" className="rail -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {VIEWS.map((v) => {
            const n = countFor(v.statuses);
            const selected = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setView(v.id)}
                className={clsx(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors",
                  selected ? "border-ganache bg-ganache text-white" : "border-crumb bg-white hover:border-cocoa/40",
                )}
              >
                {v.label}
                <span
                  className={clsx(
                    "tabular rounded-full px-1.5 text-[12px]",
                    v.id === "new" && n > 0 ? "bg-raspberry text-white" : selected ? "bg-white/20" : "bg-meringue text-muted",
                  )}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">חיפוש הזמנה</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="שם, טלפון או מספר הזמנה"
            className="h-11 w-full rounded-full border border-crumb bg-white pe-4 ps-10 text-[16px] focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title={query ? "לא נמצאו הזמנות" : view === "active" ? "אין הזמנות שמחכות לטיפול" : "אין כאן הזמנות"}
          body={query ? "נסו שם, טלפון או מספר הזמנה אחר." : view === "active" ? "כשהזמנה חדשה תיכנס, היא תופיע כאן מיד." : undefined}
        />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} today={today} />
          ))}
        </div>
      )}
    </>
  );
}
