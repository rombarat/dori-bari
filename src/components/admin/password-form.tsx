"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Panel } from "./page-parts";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { IS_DEMO } from "@/lib/demo";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (IS_DEMO) return;
    if (password.length < 8) return setError("לפחות 8 תווים");
    if (password !== confirm) return setError("הסיסמאות לא תואמות");
    setError(null);
    setSaving(true);
    const { error } = await getBrowserSupabase().auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError("הסיסמה לא עודכנה. נסו סיסמה אחרת.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("הסיסמה עודכנה");
  };

  return (
    <Panel className="p-5 md:p-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <h2 className="text-[18px] font-bold">שינוי סיסמה</h2>
        {IS_DEMO && <p className="text-[14px] text-muted">בגרסת ההדגמה הסיסמה קבועה, כדי שכל המתעניינים יוכלו להיכנס.</p>}
        <Field label="סיסמה חדשה" htmlFor="new-password">
          <Input id="new-password" type="password" autoComplete="new-password" dir="ltr" disabled={IS_DEMO} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="שוב, לאימות" htmlFor="confirm-password" error={error ?? undefined}>
          <Input id="confirm-password" type="password" autoComplete="new-password" dir="ltr" disabled={IS_DEMO} value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={!!error} />
        </Field>
        <Button type="submit" variant="secondary" loading={saving} disabled={IS_DEMO} className="w-full">
          עדכון סיסמה
        </Button>
      </form>
    </Panel>
  );
}
