import { addDays } from "./pickup";
import { formatDateShort, formatWeekday } from "./format";

/** "היום" / "מחר" / "שני 13.10", plus whether it needs attention soon. */
export function pickupLabel(date: string, today: string) {
  if (date === today) return { label: "היום", urgent: true };
  if (date === addDays(today, 1)) return { label: "מחר", urgent: true };
  return { label: `${formatWeekday(date)} ${formatDateShort(date)}`, urgent: false };
}
