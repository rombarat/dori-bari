"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Panel } from "./page-parts";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { BusinessSettings } from "@/lib/types";

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "קישור לא תקין (צריך להתחיל ב-https://)");

const schema = z.object({
  phone: z.string().trim().refine((v) => /^0\d{1,2}-?\d{7}$/.test(v.replace(/\s/g, "")), "מספר טלפון לא תקין"),
  email: z.string().trim().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "אימייל לא תקין"),
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  pickup_address: z.string().trim().max(160, "ארוך מדי"),
  pickup_notes: z.string().trim().max(300, "ארוך מדי"),
});

type Values = z.input<typeof schema>;
type Errors = Partial<Record<keyof Values, string>>;

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    phone: settings.phone,
    email: settings.email,
    instagram_url: settings.instagram_url,
    facebook_url: settings.facebook_url,
    pickup_address: settings.pickup_address,
    pickup_notes: settings.pickup_notes,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Values] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await getBrowserSupabase().from("business_settings").update(parsed.data).eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("הפרטים לא נשמרו. נסו שוב.");
      return;
    }
    toast.success("הפרטים נשמרו ומופיעים בחנות");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Panel className="space-y-5 p-5 md:p-6">
        <h2 className="text-[18px] font-bold">פרטי קשר</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="טלפון להזמנות" htmlFor="phone" error={errors.phone}>
            <Input id="phone" type="tel" dir="ltr" className="text-right" value={values.phone} onChange={set("phone")} invalid={!!errors.phone} />
          </Field>
          <Field label="אימייל" htmlFor="email" optional error={errors.email}>
            <Input id="email" type="email" dir="ltr" className="text-right" value={values.email} onChange={set("email")} invalid={!!errors.email} />
          </Field>
          <Field label="אינסטגרם" htmlFor="instagram" optional error={errors.instagram_url}>
            <Input id="instagram" dir="ltr" className="text-right" value={values.instagram_url} onChange={set("instagram_url")} invalid={!!errors.instagram_url} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="פייסבוק" htmlFor="facebook" optional error={errors.facebook_url}>
            <Input id="facebook" dir="ltr" className="text-right" value={values.facebook_url} onChange={set("facebook_url")} invalid={!!errors.facebook_url} placeholder="https://facebook.com/..." />
          </Field>
        </div>
      </Panel>

      <Panel className="space-y-5 p-5 md:p-6">
        <div>
          <h2 className="text-[18px] font-bold">איסוף עצמי</h2>
          <p className="text-[14px] text-muted">מוצג ללקוחות בעמוד ההזמנה ובאישור ההזמנה.</p>
        </div>
        <Field label="כתובת לאיסוף" htmlFor="address" optional error={errors.pickup_address} hint="אפשר להשאיר ריק ולשלוח את הכתובת ללקוח באישור">
          <Input id="address" value={values.pickup_address} onChange={set("pickup_address")} invalid={!!errors.pickup_address} placeholder="רחוב, מספר, עיר" />
        </Field>
        <Field label="הנחיות לאיסוף" htmlFor="notes" optional error={errors.pickup_notes}>
          <Textarea id="notes" value={values.pickup_notes} onChange={set("pickup_notes")} invalid={!!errors.pickup_notes} placeholder="למשל: חנייה ברחוב, צלצלו באינטרקום" />
        </Field>
      </Panel>

      <Button type="submit" size="lg" loading={saving} className="w-full md:w-auto md:px-10">
        שמירת הפרטים
      </Button>
    </form>
  );
}
