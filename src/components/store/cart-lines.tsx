"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useCart, type CartLine } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { MAX_QTY } from "@/lib/cart-store";

/** Editable list of cart lines, shared by the drawer and the checkout page. */
export function CartLines({ lines, compact = false }: { lines: CartLine[]; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  return (
    <ul className="divide-y divide-crumb">
      {lines.map((line) => (
        <li key={line.key} className="flex gap-4 py-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-[10px] bg-meringue">
            {line.image && (
              <Image src={line.image} alt="" fill sizes="80px" className={line.unavailable ? "object-cover opacity-40 grayscale" : "object-cover"} />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{line.name}</p>
                <p className="text-[14px] text-muted">
                  {line.variantLabel ?? line.unitLabel}
                  {!compact && !line.unavailable && <span className="tabular"> | {formatPrice(line.unitPrice)} ליח׳</span>}
                </p>
              </div>
              <p className="tabular shrink-0 font-semibold">
                {line.unavailable ? "" : formatPrice(line.unitPrice * line.quantity)}
              </p>
            </div>
            {line.unavailable ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-raspberry-soft px-3 py-2 text-[14px] text-raspberry">
                <span>אזל כרגע, לא ייכלל בהזמנה</span>
                <button type="button" onClick={() => remove(line.key)} className="font-semibold underline underline-offset-2">
                  הסרה
                </button>
              </div>
            ) : (
              <div className="mt-auto flex items-center justify-between pt-2">
                <QuantityStepper
                  size="sm"
                  value={line.quantity}
                  max={MAX_QTY}
                  label={line.name}
                  onChange={(q) => setQuantity(line.key, q)}
                />
                <button
                  type="button"
                  onClick={() => remove(line.key)}
                  className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-meringue hover:text-raspberry"
                  aria-label={`הסרת ${line.name} מהסל`}
                >
                  <Trash2 className="size-[18px]" />
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
