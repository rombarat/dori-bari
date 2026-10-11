import type { Product } from "./types";

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return ils.format(Number(value));
}

/** "החל מ-₪20" for products with price options, otherwise the plain price. */
export function productPriceLabel(product: Pick<Product, "price" | "variants">) {
  if (product.variants.length > 0) {
    const min = Math.min(...product.variants.map((v) => Number(v.price)));
    return `החל מ-${formatPrice(min)}`;
  }
  return formatPrice(product.price);
}

function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** "יום שני, 12 באוקטובר" */
export function formatDateLong(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parseDate(date));
}

/** "12.10" */
export function formatDateShort(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", timeZone: "UTC" }).format(
    parseDate(date),
  );
}

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** "שני" */
export function formatWeekday(date: string) {
  return WEEKDAYS[parseDate(date).getUTCDay()];
}

export function formatTime(time: string) {
  return time.slice(0, 5);
}

/** "לפני 5 דק׳", "היום 14:20", "10.10 14:20" */
export function formatRelative(iso: string) {
  const then = new Date(iso);
  const diffMin = Math.round((Date.now() - then.getTime()) / 60000);
  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const time = new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  }).format(then);
  const sameDay =
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(then) ===
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  if (sameDay) return `היום ${time}`;
  const date = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(then);
  return `${date} ${time}`;
}

/** "0501234567" → "050-1234567", "031234567" → "03-1234567" */
export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 9) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return phone;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}
