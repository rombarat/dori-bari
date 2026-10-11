"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { productPriceLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const href = `/product/${product.id}`;
  const needsChoice = product.variants.length > 0;
  const soldOut = !product.is_available;

  const quickAdd = () => {
    if (needsChoice) {
      router.push(href);
      return;
    }
    add({ product, quantity: 1 });
    toast.success(`${product.name} נוסף לסל`, { action: { label: "לסל", onClick: openDrawer } });
  };

  return (
    <article className="group flex flex-col">
      <div className="relative">
        <Link
          href={href}
          className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-photo)] bg-meringue"
          tabIndex={-1}
          aria-hidden="true"
        >
          {product.image_url && (
            <Image
              src={product.image_url}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
              className={
                soldOut
                  ? "object-cover opacity-55 grayscale-[60%]"
                  : "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              }
            />
          )}
        </Link>
        {soldOut ? (
          <span className="pointer-events-none absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold text-ganache">
            אזל כרגע
          </span>
        ) : (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute bottom-2.5 end-2.5 flex size-11 items-center justify-center rounded-full bg-white text-ganache shadow-[0_2px_10px_rgba(42,27,23,0.18)] transition-colors hover:bg-cocoa hover:text-white"
            aria-label={needsChoice ? `בחירת אפשרות עבור ${product.name}` : `הוספת ${product.name} לסל`}
          >
            <Plus className="size-5" strokeWidth={2.25} />
          </button>
        )}
      </div>

      <Link href={href} className="mt-3 flex flex-1 flex-col rounded-md">
        {product.tags.length > 0 && <p className="mb-0.5 text-[13px] font-semibold text-pistachio">{product.tags.join(", ")}</p>}
        <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug md:text-[17px]">{product.name}</h3>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="tabular text-[16px] font-bold text-cocoa">{productPriceLabel(product)}</span>
          {product.unit_label && <span className="truncate text-[13px] text-muted">{product.unit_label}</span>}
        </div>
        {soldOut && <span className="sr-only">אזל כרגע</span>}
      </Link>
    </article>
  );
}
