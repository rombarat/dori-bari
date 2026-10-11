"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { STATUS_META } from "@/lib/order-status";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

/** One-tap status change. Native <select> so it works great on phones. */
export function StatusSelect({
  orderId,
  orderNumber,
  status,
  onChanged,
}: {
  orderId: string;
  orderNumber: number;
  status: OrderStatus;
  onChanged?: (status: OrderStatus) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const change = async (next: OrderStatus) => {
    const previous = value;
    setValue(next);
    setSaving(true);
    const { error } = await getBrowserSupabase().from("orders").update({ status: next }).eq("id", orderId);
    setSaving(false);
    if (error) {
      setValue(previous);
      toast.error("הסטטוס לא עודכן. בדקו את החיבור ונסו שוב.");
      return;
    }
    toast.success(`הזמנה #${orderNumber}: ${STATUS_META[next].label}`);
    onChanged?.(next);
    router.refresh();
  };

  return (
    <label className="relative inline-flex">
      <span className="sr-only">סטטוס הזמנה #{orderNumber}</span>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => change(e.target.value as OrderStatus)}
        className={clsx(
          "h-10 appearance-none rounded-full border-0 pe-9 ps-4 text-[14px] font-bold transition-opacity focus:ring-2 focus:ring-cocoa disabled:opacity-60",
          STATUS_META[value].className.replace("line-through", ""),
        )}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-white text-ganache">
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
    </label>
  );
}
