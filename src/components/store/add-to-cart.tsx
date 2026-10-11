"use client";

import { useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { MAX_QTY, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const [variantId, setVariantId] = useState<string | null>(product.variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  if (!product.is_available) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-crumb bg-meringue/60 p-5">
        <p className="font-semibold">אזל כרגע</p>
        <p className="mt-1 text-muted">המוצר לא זמין להזמנה בימים אלה. שווה לבדוק שוב בקרוב.</p>
      </div>
    );
  }

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = Number(variant?.price ?? product.price);

  const handleAdd = () => {
    add({ product, variantId, quantity });
    toast.success(`${product.name} נוסף לסל`, { action: { label: "לסל", onClick: openDrawer } });
    setQuantity(1);
  };

  return (
    <div>
      {product.variants.length > 0 && (
        <fieldset className="mb-6">
          <legend className="mb-2.5 text-[15px] font-semibold">בחרו אפשרות</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={clsx(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cocoa",
                  variantId === v.id ? "border-ganache bg-white" : "border-crumb bg-white hover:border-cocoa/40",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={variantId === v.id}
                  onChange={() => setVariantId(v.id)}
                  className="sr-only"
                />
                <span className="font-semibold">{v.label}</span>
                <span className="tabular text-muted">{formatPrice(v.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Inline on desktop, pinned to the bottom of the screen on phones */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-crumb bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <QuantityStepper value={quantity} onChange={setQuantity} max={MAX_QTY} label={product.name} />
        <Button size="lg" className="flex-1 justify-between md:max-w-[340px]" onClick={handleAdd}>
          <span>הוספה לסל</span>
          <span className="tabular">{formatPrice(unitPrice * quantity)}</span>
        </Button>
      </div>
      {/* Keeps the fixed bar from covering the page end on phones */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}
