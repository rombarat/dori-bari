"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Cookie } from "lucide-react";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Category, Product } from "@/lib/types";

type Props = { categories: Category[]; products: Product[]; initialCategory: string | null };

export function ShopCatalog({ categories, products, initialCategory }: Props) {
  const [active, setActive] = useState<string | null>(initialCategory);

  const visibleCategories = useMemo(
    () => categories.filter((c) => products.some((p) => p.category_id === c.id)),
    [categories, products],
  );

  const select = (id: string | null) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("category", id);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
  };

  // Available first, sold-out last, within category order.
  const ordered = useMemo(() => {
    const catOrder = new Map(categories.map((c, i) => [c.id, i]));
    return products
      .filter((p) => !active || p.category_id === active)
      .sort(
        (a, b) =>
          Number(!a.is_available) - Number(!b.is_available) ||
          (catOrder.get(a.category_id ?? "") ?? 99) - (catOrder.get(b.category_id ?? "") ?? 99) ||
          a.sort_order - b.sort_order,
      );
  }, [products, categories, active]);

  const chip = (selected: boolean) =>
    clsx(
      "h-10 shrink-0 rounded-full border px-4 text-[15px] font-semibold transition-colors",
      selected ? "border-ganache bg-ganache text-white" : "border-crumb bg-white text-ganache hover:border-cocoa/40",
    );

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mt-7 bg-sugar/95 py-3 backdrop-blur-md md:top-[72px] md:mx-0">
        <div role="tablist" aria-label="סינון לפי קטגוריה" className="rail flex gap-2 overflow-x-auto px-4 md:px-0">
          <button type="button" role="tab" aria-selected={!active} className={chip(!active)} onClick={() => select(null)}>
            הכול
          </button>
          {visibleCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active === c.id}
              className={chip(active === c.id)}
              onClick={() => select(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {ordered.length === 0 ? (
        <EmptyState icon={<Cookie className="size-6" />} title="אין כאן מוצרים כרגע" body="נסו קטגוריה אחרת." />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {ordered.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}
