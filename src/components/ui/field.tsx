import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-xl border bg-white px-4 text-[17px] text-ganache placeholder:text-muted/60 transition-colors focus:outline-none focus-visible:outline-none focus:border-cocoa focus:ring-2 focus:ring-cocoa/15 disabled:bg-meringue/50";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ganache">
        {label}
        {optional && <span className="ms-1.5 font-normal text-muted">(לא חובה)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[14px] text-raspberry" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[14px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && rest.id ? `${rest.id}-error` : rest["aria-describedby"]}
      className={clsx(control, "h-12", invalid ? "border-raspberry" : "border-crumb", className)}
    />
  );
}

export function Textarea({ className, invalid, ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={clsx(control, "min-h-24 py-3 leading-relaxed", invalid ? "border-raspberry" : "border-crumb", className)}
    />
  );
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select {...rest} className={clsx(control, "h-12 appearance-none border-crumb bg-white pe-4", className)}>
      {children}
    </select>
  );
}
