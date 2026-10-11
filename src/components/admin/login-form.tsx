"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("נא למלא אימייל וסיסמה.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await getBrowserSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setError(error.status === 400 ? "האימייל או הסיסמה שגויים." : "לא הצלחנו להתחבר. בדקו את החיבור ונסו שוב.");
      return;
    }
    const next = params.get("next");
    router.replace(next?.startsWith("/admin") ? next : "/admin");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-[var(--radius-panel)] border border-crumb bg-white p-6 shadow-[0_10px_40px_-20px_rgba(42,27,23,0.25)]">
      <Field label="אימייל" htmlFor="email">
        <Input id="email" type="email" autoComplete="username" dir="ltr" className="text-right" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="סיסמה" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            className="pe-12 text-right"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute end-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-meringue"
            aria-label={show ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </Field>
      {error && (
        <p className="rounded-xl bg-raspberry-soft px-4 py-3 text-[15px] text-raspberry" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        כניסה
      </Button>
    </form>
  );
}
