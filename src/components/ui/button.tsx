import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-cocoa text-white hover:bg-cocoa-dark",
  secondary: "border border-crumb bg-white text-ganache hover:border-cocoa/40 hover:bg-meringue/60",
  ghost: "text-ganache hover:bg-meringue",
  danger: "border border-raspberry/30 bg-white text-raspberry hover:bg-raspberry-soft",
  light: "bg-white text-ganache hover:bg-meringue",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[15px]",
  md: "h-11 px-5 text-[16px]",
  lg: "h-13 px-7 text-[17px] min-h-[52px]",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return clsx(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant, size, loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, className })}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function LinkButton({ variant, size, icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link {...rest} className={buttonClass({ variant, size, className })}>
      {icon}
      {children}
    </Link>
  );
}
