import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getBlockedDates, getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "סיום הזמנה" };

export default async function CheckoutPage() {
  const [settings, blocked] = await Promise.all([getSettings(), getBlockedDates()]);
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8 md:pt-12">
      <h1 className="font-display text-[42px] leading-none md:text-[56px]">סיום הזמנה</h1>
      <CheckoutForm settings={settings} blocked={blocked} />
    </div>
  );
}
