"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import clsx from "clsx";
import { cartTotals, useCart, useCartHydrated } from "@/lib/cart-store";

const NAV = [
  { href: "/shop", label: "החנות" },
  { href: "/#story", label: "הסיפור שלנו" },
  { href: "/#how", label: "איך מזמינים" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const bumpKey = useCart((s) => s.bumpKey);
  const openDrawer = useCart((s) => s.openDrawer);
  const hydrated = useCartHydrated();
  const { count } = cartTotals(lines);

  return (
    <header className="sticky top-0 z-40 border-b border-crumb/70 bg-sugar/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:h-[72px] md:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Dor.Bari, לדף הבית">
          <Image src="/brand/logo.png" alt="Dor.Bari Bakery" width={404} height={132} priority className="h-11 w-auto md:h-12" />
        </Link>

        <nav aria-label="ניווט ראשי" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "rounded-full px-4 py-2 text-[16px] font-medium transition-colors hover:bg-meringue",
                    pathname === item.href ? "text-cocoa" : "text-ganache",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="rounded-full px-3 py-2 text-[16px] font-medium text-ganache hover:bg-meringue md:hidden"
          >
            החנות
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="relative flex size-11 items-center justify-center rounded-full border border-crumb bg-white transition-colors hover:border-cocoa/40"
            aria-label={hydrated && count > 0 ? `סל הקניות, ${count} פריטים` : "סל הקניות"}
          >
            <ShoppingBag className="size-5" strokeWidth={1.75} />
            {hydrated && count > 0 && (
              <span
                key={bumpKey}
                className="animate-bump tabular absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-raspberry px-1 text-[12px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
