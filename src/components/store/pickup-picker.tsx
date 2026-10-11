"use client";

import clsx from "clsx";
import { formatDateShort, formatWeekday } from "@/lib/format";
import type { PickupDay } from "@/lib/pickup";

type Props = {
  days: PickupDay[];
  date: string | null;
  time: string | null;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
  error?: string;
};

export function PickupPicker({ days, date, time, onDate, onTime, error }: Props) {
  const selectedDay = days.find((d) => d.date === date);

  return (
    <div>
      <p id="pickup-date-label" className="mb-2.5 text-[15px] font-semibold">
        יום
      </p>
      <div role="radiogroup" aria-labelledby="pickup-date-label" className="rail -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {days.map((d) => {
          const selected = d.date === date;
          return (
            <button
              key={d.date}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onDate(d.date)}
              className={clsx(
                "flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-xl border transition-colors",
                selected ? "border-ganache bg-ganache text-white" : "border-crumb bg-white hover:border-cocoa/40",
              )}
            >
              <span className="text-[14px] font-semibold">{formatWeekday(d.date)}</span>
              <span className={clsx("tabular text-[15px]", selected ? "text-white/80" : "text-muted")}>
                {formatDateShort(d.date)}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <>
          <p id="pickup-time-label" className="mb-2.5 mt-6 text-[15px] font-semibold">
            שעה
          </p>
          <div role="radiogroup" aria-labelledby="pickup-time-label" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {selectedDay.slots.map((slot) => {
              const selected = slot === time;
              return (
                <button
                  key={slot}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onTime(slot)}
                  className={clsx(
                    "tabular h-11 rounded-xl border text-[15px] font-semibold transition-colors",
                    selected ? "border-ganache bg-ganache text-white" : "border-crumb bg-white hover:border-cocoa/40",
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </>
      )}
      {error && (
        <p className="mt-3 text-[14px] text-raspberry" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
