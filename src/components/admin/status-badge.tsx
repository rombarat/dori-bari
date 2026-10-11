import clsx from "clsx";
import { STATUS_META } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={clsx("inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-bold", meta.className, className)}>
      {meta.label}
    </span>
  );
}
