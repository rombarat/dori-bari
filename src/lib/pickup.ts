import type { BlockedDate, BusinessSettings } from "./types";

/**
 * Pickup availability, computed on Israel wall-clock time.
 * Mirrors the checks in the `place_order` database function, which re-validates every order.
 */

export type PickupDay = { date: string; weekday: number; slots: string[] };

const TZ = "Asia/Jerusalem";

export function israelNow(at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayNumber(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function getPickupDays(
  settings: Pick<
    BusinessSettings,
    "weekly_hours" | "min_lead_hours" | "max_days_ahead" | "slot_interval_minutes" | "accepting_orders"
  >,
  blocked: BlockedDate[],
  now = israelNow(),
): PickupDay[] {
  if (!settings.accepting_orders) return [];
  const blockedSet = new Set(blocked.map((b) => b.date));
  const earliest = dayNumber(now.date) * 1440 + now.minutes + settings.min_lead_hours * 60;
  const days: PickupDay[] = [];

  for (let i = 0; i <= settings.max_days_ahead; i++) {
    const date = addDays(now.date, i);
    if (blockedSet.has(date)) continue;
    const weekday = weekdayOf(date);
    const hours = settings.weekly_hours[String(weekday)];
    if (!hours?.open) continue;

    const start = toMinutes(hours.start);
    const end = toMinutes(hours.end);
    const base = dayNumber(date) * 1440;
    const slots: string[] = [];
    for (let t = start; t <= end; t += settings.slot_interval_minutes) {
      if (base + t >= earliest) slots.push(fromMinutes(t));
    }
    if (slots.length) days.push({ date, weekday, slots });
  }
  return days;
}

export const WEEKDAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** "ראשון–חמישי 08:30–18:00" style summary for the storefront. */
export function summarizeHours(weekly: BusinessSettings["weekly_hours"]) {
  const open = [0, 1, 2, 3, 4, 5, 6].filter((d) => weekly[String(d)]?.open);
  if (!open.length) return [];
  const groups: { from: number; to: number; start: string; end: string }[] = [];
  for (const d of open) {
    const h = weekly[String(d)];
    const last = groups[groups.length - 1];
    if (last && last.to === d - 1 && last.start === h.start && last.end === h.end) last.to = d;
    else groups.push({ from: d, to: d, start: h.start, end: h.end });
  }
  return groups.map((g) => ({
    days: g.from === g.to ? WEEKDAY_NAMES[g.from] : `${WEEKDAY_NAMES[g.from]}–${WEEKDAY_NAMES[g.to]}`,
    hours: `${g.start}–${g.end}`,
  }));
}
