"use client";

import { Minus, Plus } from "lucide-react";
import clsx from "clsx";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label: string;
};

export function QuantityStepper({ value, onChange, min = 1, max = 20, size = "md", label }: Props) {
  const btn = clsx(
    "flex items-center justify-center rounded-full text-ganache transition-colors hover:bg-meringue disabled:opacity-30 disabled:hover:bg-transparent",
    size === "sm" ? "size-9" : "size-11",
  );
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border border-crumb bg-white",
        size === "sm" ? "h-10 px-0.5" : "h-12 px-0.5",
      )}
      role="group"
      aria-label={`כמות: ${label}`}
    >
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="הוספת יחידה">
        <Plus className="size-4" strokeWidth={2.25} />
      </button>
      <output className={clsx("tabular text-center font-semibold", size === "sm" ? "w-6 text-[15px]" : "w-8 text-[17px]")} aria-live="polite">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="הפחתת יחידה">
        <Minus className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
