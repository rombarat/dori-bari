"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "./page-parts";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatDateLong } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { BlockedDate } from "@/lib/types";

export function BlockedDates({ blocked: initial, today }: { blocked: BlockedDate[]; today: string }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initial);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const block = async (d: string, why: string) => {
    if (blocked.some((b) => b.date === d)) {
      toast.error("התאריך הזה כבר סגור");
      return false;
    }
    const { error } = await getBrowserSupabase().from("blocked_dates").insert({ date: d, reason: why });
    if (error) {
      toast.error("התאריך לא נסגר. נסו שוב.");
      return false;
    }
    setBlocked((list) => [...list, { date: d, reason: why }].sort((a, b) => a.date.localeCompare(b.date)));
    toast.success(`${formatDateLong(d)} סגור להזמנות`);
    router.refresh();
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("בחרו תאריך");
      return;
    }
    if (date < today) {
      toast.error("אי אפשר לסגור תאריך שעבר");
      return;
    }
    setSaving(true);
    const ok = await block(date, reason.trim());
    setSaving(false);
    if (ok) {
      setDate("");
      setReason("");
    }
  };

  const unblock = async (d: string) => {
    setRemoving(d);
    const { error } = await getBrowserSupabase().from("blocked_dates").delete().eq("date", d);
    setRemoving(null);
    if (error) {
      toast.error("לא הצלחנו לפתוח את התאריך. נסו שוב.");
      return;
    }
    setBlocked((list) => list.filter((b) => b.date !== d));
    toast.success(`${formatDateLong(d)} פתוח שוב להזמנות`);
    router.refresh();
  };

  const todayBlocked = blocked.some((b) => b.date === today);

  return (
    <Panel>
      <div className="border-b border-crumb px-5 py-4">
        <h2 className="text-[18px] font-bold">ימים סגורים</h2>
        <p className="text-[14px] text-muted">חג, חופשה, או יום שכבר מלא בהזמנות.</p>
      </div>

      <div className="p-5">
        <Button
          variant="secondary"
          className="w-full"
          disabled={todayBlocked}
          onClick={() => block(today, "סגור להזמנות")}
          icon={<CalendarX className="size-[18px]" />}
        >
          {todayBlocked ? "היום כבר סגור להזמנות" : "סגירת היום להזמנות"}
        </Button>

        <form onSubmit={onSubmit} className="mt-5 space-y-4 border-t border-crumb pt-5">
          <Field label="תאריך" htmlFor="block-date">
            <Input id="block-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="סיבה" htmlFor="block-reason" optional hint="לשימושך בלבד">
            <Input id="block-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={60} placeholder="למשל: ראש השנה" />
          </Field>
          <Button type="submit" loading={saving} className="w-full">
            סגירת התאריך
          </Button>
        </form>
      </div>

      {blocked.length > 0 && (
        <ul className="divide-y divide-crumb border-t border-crumb">
          {blocked.map((b) => (
            <li key={b.date} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{b.date === today ? "היום" : formatDateLong(b.date)}</p>
                {b.reason && <p className="text-[14px] text-muted">{b.reason}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                loading={removing === b.date}
                onClick={() => unblock(b.date)}
                icon={removing === b.date ? undefined : <Trash2 className="size-4" />}
                aria-label={`פתיחת ${formatDateLong(b.date)} להזמנות`}
              >
                פתיחה
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
