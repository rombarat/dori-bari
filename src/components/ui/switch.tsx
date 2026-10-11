"use client";

import clsx from "clsx";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

/** Accessible on/off switch. The visible label is supplied by the caller; `label` is for screen readers. */
export function Switch({ checked, onChange, label, disabled, size = "md" }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50",
        size === "sm" ? "h-6 w-10" : "h-7 w-12",
        checked ? "bg-pistachio" : "bg-crumb",
      )}
    >
      <span
        className={clsx(
          "absolute rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200",
          size === "sm" ? "size-5" : "size-6",
          checked ? (size === "sm" ? "start-[18px]" : "start-[22px]") : "start-0.5",
        )}
      />
    </button>
  );
}
