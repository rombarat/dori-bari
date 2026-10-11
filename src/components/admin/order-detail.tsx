"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, MessageCircle, MessageSquareText, Phone } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { Panel } from "./page-parts";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { STATUS_FLOW, STATUS_META, nextStatus } from "@/lib/order-status";
import { formatDateLong, formatPhone, formatPrice, formatRelative, formatTime, telHref, whatsappHref } from "@/lib/format";
import { pickupLabel } from "@/lib/admin-format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

export function OrderDetail({ order, today }: { order: Order; today: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState<OrderStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = nextStatus(status);
  const pickup = pickupLabel(order.pickup_date, today);
  const items = order.order_items ?? [];

  const update = async (to: OrderStatus) => {
    setSaving(to);
    const { error } = await getBrowserSupabase().from("orders").update({ status: to }).eq("id", order.id);
    setSaving(null);
    setConfirmCancel(false);
    if (error) {
      toast.error("הסטטוס לא עודכן. בדקו את החיבור ונסו שוב.");
      return;
    }
    setStatus(to);
    toast.success(`הזמנה #${order.order_number}: ${STATUS_META[to].label}`);
    router.refresh();
  };

  const stepIndex = STATUS_FLOW.indexOf(status);
  const firstName = order.customer_name.split(" ")[0];
  const readyMessage = `היי ${firstName}, ההזמנה שלך מ-Dor.Bari (#${order.order_number}) מוכנה לאיסוף. מחכים לך!`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-6">
        <Panel className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="tabular font-display text-[40px] leading-none">#{order.order_number}</h1>
              <p className="mt-2 text-[20px] font-semibold">{order.customer_name}</p>
              <p className="text-[14px] text-muted">התקבלה {formatRelative(order.created_at)}</p>
            </div>
            <StatusBadge status={status} className="h-8 px-4 text-[15px]" />
          </div>

          {/* Progress */}
          {status !== "cancelled" && (
            <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="התקדמות ההזמנה">
              {STATUS_FLOW.map((s, i) => (
                <li key={s} className="min-w-0">
                  <div className={clsx("h-1.5 rounded-full", i <= stepIndex ? "bg-pistachio" : "bg-crumb")} />
                  <p className={clsx("mt-1.5 truncate text-[12px] md:text-[13px]", i === stepIndex ? "font-bold" : "text-muted")}>
                    {STATUS_META[s].short}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {next && (
              <Button size="lg" onClick={() => update(next)} loading={saving === next} icon={<Check className="size-5" />}>
                {STATUS_META[next].action}
              </Button>
            )}
            {status !== "cancelled" && status !== "completed" && (
              <Button size="lg" variant="danger" onClick={() => setConfirmCancel(true)}>
                ביטול הזמנה
              </Button>
            )}
            {(status === "cancelled" || status === "completed") && (
              <Button size="lg" variant="secondary" onClick={() => update("confirmed")} loading={saving === "confirmed"}>
                החזרה לטיפול
              </Button>
            )}
          </div>
        </Panel>

        <Panel>
          <h2 className="border-b border-crumb px-5 py-4 text-[18px] font-bold">מה הוזמן</h2>
          <table className="w-full text-[16px]">
            <thead className="sr-only">
              <tr>
                <th>כמות</th>
                <th>מוצר</th>
                <th>סכום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crumb">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="tabular w-14 py-3.5 ps-5 text-[18px] font-bold">{i.quantity}×</td>
                  <td className="py-3.5">
                    <span className="font-semibold">{i.product_name}</span>
                    {i.variant_label && <span className="block text-[14px] text-muted">{i.variant_label}</span>}
                    <span className="tabular block text-[14px] text-muted">{formatPrice(i.unit_price)} ליח׳</span>
                  </td>
                  <td className="tabular py-3.5 pe-5 text-end font-semibold">{formatPrice(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-crumb">
                <td colSpan={2} className="py-4 ps-5 font-bold">
                  סה״כ
                </td>
                <td className="tabular py-4 pe-5 text-end text-[22px] font-bold">{formatPrice(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </Panel>

        {order.notes && (
          <Panel className="flex items-start gap-3 border-caramel/40 bg-[#fbf3e8] p-5">
            <MessageSquareText className="mt-0.5 size-5 shrink-0 text-caramel" />
            <div>
              <h2 className="font-bold">הערות הלקוח</h2>
              <p className="mt-1 whitespace-pre-line">{order.notes}</p>
            </div>
          </Panel>
        )}
      </div>

      <div className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-[14px] font-semibold text-muted">איסוף</h2>
          <p className={clsx("mt-1 flex items-center gap-2 text-[20px] font-bold", pickup.urgent && "text-raspberry")}>
            <CalendarDays className="size-5" />
            {pickup.label} <span className="tabular">{formatTime(order.pickup_time)}</span>
          </p>
          <p className="mt-0.5 text-muted">{formatDateLong(order.pickup_date)}</p>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-[14px] font-semibold text-muted">יצירת קשר</h2>
          <p className="tabular mt-1 text-[20px] font-bold" dir="ltr" style={{ textAlign: "right" }}>
            {formatPhone(order.phone)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={telHref(order.phone)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-crumb font-semibold hover:bg-meringue">
              <Phone className="size-[18px]" />
              חיוג
            </a>
            <a
              href={`${whatsappHref(order.phone)}?text=${encodeURIComponent(status === "ready" ? readyMessage : `היי ${firstName}, כאן Dor.Bari לגבי הזמנה #${order.order_number}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-crumb font-semibold hover:bg-meringue"
            >
              <MessageCircle className="size-[18px]" />
              וואטסאפ
            </a>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title={`לבטל את הזמנה #${order.order_number}?`}
        body="ההזמנה תסומן כמבוטלת ולא תיספר בסכומים. אפשר להחזיר אותה לטיפול בהמשך."
        confirmLabel="ביטול ההזמנה"
        cancelLabel="השארה"
        destructive
        loading={saving === "cancelled"}
        onConfirm={() => update("cancelled")}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
