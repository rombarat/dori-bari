import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, MapPin, Phone } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { getSettings } from "@/lib/catalog";
import { getServerSupabase } from "@/lib/supabase/server";
import { formatDateLong, formatPrice, telHref } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";

export const metadata: Metadata = { title: "ההזמנה התקבלה", robots: { index: false } };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await getServerSupabase();
  const [{ data }, settings] = await Promise.all([supabase.rpc("get_order_summary", { p_id: id }), getSettings()]);
  const order = data as OrderSummary | null;
  if (!order) notFound();

  const firstName = order.customer_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-[640px] px-4 pt-12 md:pt-16">
      <div className="flex size-14 items-center justify-center rounded-full bg-pistachio text-white">
        <Check className="size-7" strokeWidth={2.5} />
      </div>
      <h1 className="mt-6 font-display text-[42px] leading-[1.05] md:text-[56px]">תודה {firstName}, ההזמנה התקבלה</h1>
      <p className="mt-3 text-[18px] text-ganache/85">נחזור אליכם בהקדם לאישור. שמרו את מספר ההזמנה.</p>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-panel)] border border-crumb bg-white">
        <div className="flex items-center justify-between bg-meringue px-5 py-4">
          <span className="text-muted">מספר הזמנה</span>
          <span className="tabular font-display text-[34px] leading-none">#{order.order_number}</span>
        </div>
        <dl className="divide-y divide-crumb px-5">
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-muted">איסוף</dt>
            <dd className="text-end font-semibold">
              {formatDateLong(order.pickup_date)}, <span className="tabular">{order.pickup_time}</span>
            </dd>
          </div>
          <div className="py-4">
            <dt className="sr-only">מוצרים</dt>
            <dd>
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span>
                      <span className="tabular font-semibold">{item.quantity}×</span> {item.product_name}
                      {item.variant_label && <span className="text-muted"> ({item.variant_label})</span>}
                    </span>
                    <span className="tabular shrink-0">{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="flex items-baseline justify-between py-4">
            <dt className="font-semibold">סה״כ</dt>
            <dd className="tabular text-[22px] font-bold">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <ul className="mt-6 space-y-3 text-[16px]">
        {(settings.pickup_address || settings.pickup_notes) && (
          <li className="flex items-start gap-3">
            <MapPin className="mt-1 size-5 shrink-0 text-cocoa" />
            <span>
              {settings.pickup_address && <span className="block font-semibold">{settings.pickup_address}</span>}
              {settings.pickup_notes}
            </span>
          </li>
        )}
        {settings.phone && (
          <li className="flex items-start gap-3">
            <Phone className="mt-1 size-5 shrink-0 text-cocoa" />
            <span>
              רוצים לשנות משהו? התקשרו{" "}
              <a href={telHref(settings.phone)} className="font-semibold underline underline-offset-4" dir="ltr">
                {settings.phone}
              </a>
            </span>
          </li>
        )}
      </ul>

      <div className="mt-10">
        <LinkButton href="/" variant="secondary" size="lg">
          חזרה לדף הבית
        </LinkButton>
      </div>
    </div>
  );
}
