import type { OrderStatus } from "./types";

type StatusMeta = {
  label: string;
  /** Compact label for the progress bar */
  short: string;
  /** Badge colours */
  className: string;
  /** Label for the button that moves an order *into* this status */
  action?: string;
};

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: { label: "חדשה", short: "חדשה", className: "bg-raspberry text-white" },
  confirmed: { label: "אושרה", short: "אושרה", className: "bg-[#efe3df] text-cocoa-dark", action: "אישור ההזמנה" },
  preparing: { label: "בהכנה", short: "בהכנה", className: "bg-[#f6e6d3] text-[#8a5527]", action: "התחלת הכנה" },
  ready: { label: "מוכנה לאיסוף", short: "מוכנה", className: "bg-pistachio-soft text-pistachio", action: "מוכנה לאיסוף" },
  completed: { label: "נמסרה", short: "נמסרה", className: "bg-[#ecebea] text-[#5f5955]", action: "סימון כנמסרה" },
  cancelled: { label: "בוטלה", short: "בוטלה", className: "bg-[#ecebea] text-[#8b8581] line-through", action: "ביטול ההזמנה" },
};

/** The happy-path order of statuses; used for the "next step" button. */
export const STATUS_FLOW: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "completed"];

export const ACTIVE_STATUSES: OrderStatus[] = ["new", "confirmed", "preparing", "ready"];

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}
