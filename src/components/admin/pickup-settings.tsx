"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { toast } from "sonner";
import { Panel } from "./page-parts";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { WEEKDAY_NAMES, toMinutes } from "@/lib/pickup";
import type { BusinessSettings, WeeklyHours } from "@/lib/types";

const LEAD_OPTIONS = [
  { value: 0, label: "אפשר להזמין לאותו יום" },
  { value: 3, label: "3 שעות מראש" },
  { value: 12, label: "12 שעות מראש" },
  { value: 24, label: "יום מראש (24 שעות)" },
  { value: 48, label: "יומיים מראש" },
  { value: 72, label: "3 ימים מראש" },
];
const INTERVAL_OPTIONS = [15, 30, 60, 90, 120];
const AHEAD_OPTIONS = [7, 14, 21, 30, 60];

export function PickupSettings({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(settings.accepting_orders);
  const [closedMessage, setClosedMessage] = useState(settings.closed_message);
  const [hours, setHours] = useState<WeeklyHours>(settings.weekly_hours);
  const [lead, setLead] = useState(settings.min_lead_hours);
  const [interval, setIntervalMinutes] = useState(settings.slot_interval_minutes);
  const [ahead, setAhead] = useState(settings.max_days_ahead);
  const [saving, setSaving] = useState(false);
  const [togglingOrders, setTogglingOrders] = useState(false);

  const invalidDays = useMemo(
    () => Object.entries(hours).filter(([, h]) => h.open && toMinutes(h.end) <= toMinutes(h.start)).map(([d]) => Number(d)),
    [hours],
  );
  const noOpenDays = !Object.values(hours).some((h) => h.open);

  const setDay = (day: number, patch: Partial<WeeklyHours[string]>) =>
    setHours((h) => ({ ...h, [day]: { ...h[String(day)], ...patch } }));

  // The master switch saves immediately: it's the "close the shop now" button.
  const toggleAccepting = async (on: boolean) => {
    setAccepting(on);
    setTogglingOrders(true);
    const { error } = await getBrowserSupabase().from("business_settings").update({ accepting_orders: on }).eq("id", 1);
    setTogglingOrders(false);
    if (error) {
      setAccepting(!on);
      toast.error("השינוי לא נשמר. נסו שוב.");
      return;
    }
    toast.success(on ? "החנות פתוחה להזמנות" : "קבלת הזמנות באתר הושהתה");
    router.refresh();
  };

  const save = async () => {
    if (invalidDays.length) {
      toast.error("בדקו את השעות: שעת הסיום צריכה להיות אחרי שעת ההתחלה");
      return;
    }
    setSaving(true);
    const { error } = await getBrowserSupabase()
      .from("business_settings")
      .update({
        weekly_hours: hours,
        min_lead_hours: lead,
        slot_interval_minutes: interval,
        max_days_ahead: ahead,
        closed_message: closedMessage.trim(),
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("ההגדרות לא נשמרו. נסו שוב.");
      return;
    }
    toast.success("זמני האיסוף נשמרו");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Panel className={clsx("p-5", !accepting && "border-raspberry/40 bg-raspberry-soft/50")}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[18px] font-bold">{accepting ? "מקבלים הזמנות באתר" : "קבלת הזמנות מושהית"}</p>
            <p className="text-[14px] text-muted">
              {accepting ? "כיבוי המתג סוגר מיד את האפשרות להזמין באתר, למשל בחופשה." : "לקוחות רואים את החנות אבל לא יכולים לשלוח הזמנה."}
            </p>
          </div>
          <Switch checked={accepting} onChange={toggleAccepting} disabled={togglingOrders} label="מקבלים הזמנות באתר" />
        </div>
        {!accepting && (
          <Field label="הודעה ללקוחות" htmlFor="closed-message" optional className="mt-4" hint="תוצג בעמוד ההזמנה. נשמרת עם כפתור השמירה למטה.">
            <Textarea id="closed-message" value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)} maxLength={200} placeholder="למשל: יוצאים לחופשה עד יום ראשון. אפשר להזמין בטלפון." className="min-h-20" />
          </Field>
        )}
      </Panel>

      <Panel>
        <div className="border-b border-crumb px-5 py-4">
          <h2 className="text-[18px] font-bold">ימים ושעות איסוף</h2>
          <p className="text-[14px] text-muted">ימים כבויים לא יוצעו ללקוחות.</p>
        </div>
        <ul className="divide-y divide-crumb">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const h = hours[String(d)] ?? { open: false, start: "09:00", end: "17:00" };
            const bad = invalidDays.includes(d);
            return (
              <li key={d} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <div className="flex w-28 items-center gap-3">
                  <Switch size="sm" checked={h.open} onChange={(open) => setDay(d, { open })} label={`איסוף ביום ${WEEKDAY_NAMES[d]}`} />
                  <span className={clsx("font-semibold", !h.open && "text-muted")}>{WEEKDAY_NAMES[d]}</span>
                </div>
                {h.open ? (
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`start-${d}`}>
                      משעה
                    </label>
                    <input
                      id={`start-${d}`}
                      type="time"
                      step={900}
                      value={h.start}
                      onChange={(e) => setDay(d, { start: e.target.value })}
                      className={clsx("tabular h-11 rounded-xl border bg-white px-3 text-[16px]", bad ? "border-raspberry" : "border-crumb")}
                    />
                    <span className="text-muted">עד</span>
                    <label className="sr-only" htmlFor={`end-${d}`}>
                      עד שעה
                    </label>
                    <input
                      id={`end-${d}`}
                      type="time"
                      step={900}
                      value={h.end}
                      onChange={(e) => setDay(d, { end: e.target.value })}
                      className={clsx("tabular h-11 rounded-xl border bg-white px-3 text-[16px]", bad ? "border-raspberry" : "border-crumb")}
                    />
                  </div>
                ) : (
                  <span className="text-[15px] text-muted">אין איסוף</span>
                )}
                {bad && (
                  <p className="w-full text-[14px] text-raspberry" role="alert">
                    שעת הסיום צריכה להיות אחרי שעת ההתחלה
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {noOpenDays && <p className="border-t border-crumb px-5 py-3 text-[14px] text-raspberry">כל הימים כבויים, כך שלקוחות לא יוכלו לבחור מועד איסוף.</p>}
      </Panel>

      <Panel className="grid gap-5 p-5 sm:grid-cols-3">
        <Field label="כמה זמן מראש מזמינים" htmlFor="lead">
          <Select id="lead" value={lead} onChange={(e) => setLead(Number(e.target.value))}>
            {LEAD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="מרווח בין שעות איסוף" htmlFor="interval">
          <Select id="interval" value={interval} onChange={(e) => setIntervalMinutes(Number(e.target.value))}>
            {INTERVAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `כל ${m} דקות` : m === 60 ? "כל שעה" : `כל ${m / 60} שעות`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="אפשר להזמין עד" htmlFor="ahead">
          <Select id="ahead" value={ahead} onChange={(e) => setAhead(Number(e.target.value))}>
            {AHEAD_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} ימים קדימה
              </option>
            ))}
          </Select>
        </Field>
      </Panel>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-crumb bg-[#faf6f3]/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <Button size="lg" onClick={save} loading={saving} className="w-full md:w-auto md:px-10">
          שמירת זמני האיסוף
        </Button>
      </div>

      <p className="text-[14px] text-muted">
        כרגע הלקוחות אוספים בעצמם. המערכת בנויה כך שאפשר להוסיף בהמשך גם משלוחים.
      </p>
    </div>
  );
}
