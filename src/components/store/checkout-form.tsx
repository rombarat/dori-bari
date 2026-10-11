"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, MapPin, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { cartTotals, useCart, useCartHydrated } from "@/lib/cart-store";
import { formatDateLong, formatPrice, telHref } from "@/lib/format";
import { getPickupDays } from "@/lib/pickup";
import { isProductError, isSlotError, orderErrorMessage } from "@/lib/order-errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { BlockedDate, BusinessSettings, Product } from "@/lib/types";
import { CartLines } from "./cart-lines";
import { PickupPicker } from "./pickup-picker";
import { useCartSync } from "./use-cart-sync";

const schema = z.object({
  name: z.string().trim().min(2, "נא למלא שם מלא").max(80, "השם ארוך מדי"),
  phone: z
    .string()
    .transform((v) => v.replace(/[^\d+]/g, "").replace(/^\+972/, "0"))
    .refine((v) => /^0\d{8,9}$/.test(v), "מספר טלפון לא תקין. לדוגמה: 050-1234567"),
  notes: z.string().max(600, "ההערה ארוכה מדי (עד 600 תווים)"),
  date: z.string({ error: "בחרו יום ושעה לאיסוף" }),
  time: z.string({ error: "בחרו שעה לאיסוף" }),
});

type Errors = Partial<Record<"name" | "phone" | "notes" | "pickup", string>>;

export function CheckoutForm({ settings, blocked }: { settings: BusinessSettings; blocked: BlockedDate[] }) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const sync = useCart((s) => s.sync);
  const { total, hasUnavailable } = cartTotals(lines);
  useCartSync(hydrated);

  const days = useMemo(() => getPickupDays(settings, blocked), [settings, blocked]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (!hydrated) return <PageSpinner />;
  if (placed) return <PageSpinner label="ההזמנה נשלחה, מעבירים לאישור…" />;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title="הסל ריק"
        body="כדי להזמין, הוסיפו קודם מוצרים מהחנות."
        action={<LinkButton href="/shop">לחנות</LinkButton>}
      />
    );
  }

  const closed = !settings.accepting_orders;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse({ name, phone, notes, date: date ?? undefined, time: time ?? undefined });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "date" || key === "time") next.pickup ??= issue.message;
        else if (key === "name" || key === "phone" || key === "notes") next[key] ??= issue.message;
      }
      setErrors(next);
      const firstId = next.pickup ? "pickup" : next.name ? "name" : next.phone ? "phone" : "notes";
      document.getElementById(firstId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    const supabase = getBrowserSupabase();
    const { data, error } = await supabase.rpc("place_order", {
      p_customer_name: parsed.data.name,
      p_phone: parsed.data.phone,
      p_notes: parsed.data.notes,
      p_pickup_date: parsed.data.date,
      p_pickup_time: parsed.data.time,
      p_items: lines
        .filter((l) => !l.unavailable)
        .map((l) => ({ product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
    });

    if (error || !data) {
      setSubmitting(false);
      const message = orderErrorMessage(error?.message);
      toast.error(message);
      if (isProductError(error?.message)) {
        const { data: fresh } = await supabase
          .from("products")
          .select("id, category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order")
          .in("id", lines.map((l) => l.productId));
        if (fresh) sync(fresh as Product[]);
      }
      if (isSlotError(error?.message)) {
        setTime(null);
        setErrors({ pickup: message });
      }
      return;
    }

    const order = data as { id: string };
    setPlaced(true);
    clear();
    router.replace(`/order/${order.id}`);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-10 md:grid-cols-[1fr_380px] md:items-start md:gap-12">
      <div className="min-w-0 space-y-10">
        {closed && (
          <div className="rounded-[var(--radius-panel)] border border-raspberry/25 bg-raspberry-soft p-5 text-raspberry" role="status">
            <p className="font-semibold">כרגע לא מקבלים הזמנות דרך האתר</p>
            <p className="mt-1">
              {settings.closed_message || "אפשר להזמין בטלפון"}{" "}
              <a href={telHref(settings.phone)} className="font-semibold underline" dir="ltr">
                {settings.phone}
              </a>
            </p>
          </div>
        )}

        <section aria-labelledby="pickup-title" id="pickup" className="scroll-mt-28">
          <h2 id="pickup-title" className="font-display text-[28px] leading-none md:text-[32px]">
            מתי לאסוף?
          </h2>
          <p className="mt-2 text-muted">
            {settings.min_lead_hours > 0 && `הזמנה לפחות ${settings.min_lead_hours} שעות מראש. `}
            איסוף עצמי בלבד.
          </p>
          <div className="mt-5">
            {days.length === 0 ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-panel)] bg-meringue p-5">
                <CalendarX className="mt-0.5 size-5 shrink-0 text-cocoa" />
                <p>
                  אין כרגע מועדי איסוף פנויים באתר. אפשר להזמין בטלפון{" "}
                  <a href={telHref(settings.phone)} className="font-semibold underline" dir="ltr">
                    {settings.phone}
                  </a>
                </p>
              </div>
            ) : (
              <PickupPicker
                days={days}
                date={date}
                time={time}
                onDate={(d) => {
                  setDate(d);
                  setTime(null);
                }}
                onTime={(t) => {
                  setTime(t);
                  setErrors((e) => ({ ...e, pickup: undefined }));
                }}
                error={errors.pickup}
              />
            )}
          </div>
          {(settings.pickup_address || settings.pickup_notes) && (
            <p className="mt-5 flex items-start gap-2 text-[15px] text-muted">
              <MapPin className="mt-1 size-4 shrink-0" />
              <span>
                {settings.pickup_address && <span className="block font-semibold text-ganache">{settings.pickup_address}</span>}
                {settings.pickup_notes}
              </span>
            </p>
          )}
        </section>

        <section aria-labelledby="details-title" className="space-y-5">
          <h2 id="details-title" className="font-display text-[28px] leading-none md:text-[32px]">
            הפרטים שלך
          </h2>
          <Field label="שם מלא" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
              }}
              invalid={!!errors.name}
              maxLength={80}
            />
          </Field>
          <Field label="טלפון" htmlFor="phone" error={errors.phone} hint="נחזור אליכם למספר הזה לאישור ההזמנה">
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className="text-right"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
              }}
              invalid={!!errors.phone}
            />
          </Field>
          <Field label="הערות להזמנה" htmlFor="notes" optional error={errors.notes} hint="למשל: הקדשה, אלרגיות, גרסה פרווה">
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={600}
              invalid={!!errors.notes}
            />
          </Field>
        </section>
      </div>

      <aside aria-labelledby="summary-title" className="min-w-0 rounded-[var(--radius-panel)] border border-crumb bg-white p-5 md:sticky md:top-28">
        <h2 id="summary-title" className="font-display text-[26px] leading-none">
          ההזמנה שלך
        </h2>
        <div className="mt-2">
          <CartLines lines={lines} compact />
        </div>
        <div className="mt-2 space-y-1 border-t border-crumb pt-4">
          {date && time && (
            <p className="text-[15px] text-muted">
              איסוף: {formatDateLong(date)}, <span className="tabular">{time}</span>
            </p>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">סה״כ לתשלום</span>
            <span className="tabular text-[24px] font-bold">{formatPrice(total)}</span>
          </div>
          <p className="text-[14px] text-muted">אין צורך בתשלום עכשיו. התשלום מול העסק.</p>
        </div>
        <Button type="submit" size="lg" className="mt-5 w-full" loading={submitting} disabled={closed || hasUnavailable || days.length === 0}>
          {submitting ? "שולחים…" : "שליחת הזמנה"}
        </Button>
        {hasUnavailable && <p className="mt-2 text-center text-[14px] text-raspberry">הסירו את המוצרים שאזלו כדי להמשיך.</p>}
      </aside>
    </form>
  );
}
