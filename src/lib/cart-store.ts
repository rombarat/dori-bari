"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Product } from "./types";

export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  unitLabel: string;
  unitPrice: number;
  image: string | null;
  quantity: number;
  /** Set by sync() when the product was marked sold out or removed from the menu. */
  unavailable?: boolean;
};

export const MAX_QTY = 20;

type AddInput = {
  product: Pick<Product, "id" | "name" | "price" | "image_url" | "unit_label" | "variants">;
  variantId?: string | null;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  /** Increments on every add so the header badge can animate. */
  bumpKey: number;
  add: (input: AddInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Re-price and re-label lines against the latest menu. Returns true if anything changed. */
  sync: (products: Product[]) => boolean;
};

const lineKey = (productId: string, variantId: string | null | undefined) => `${productId}:${variantId ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      drawerOpen: false,
      bumpKey: 0,

      add: ({ product, variantId = null, quantity }) => {
        const variant = product.variants.find((v) => v.id === variantId) ?? null;
        const key = lineKey(product.id, variant?.id);
        const existing = get().lines.find((l) => l.key === key);
        if (existing) {
          set((s) => ({
            lines: s.lines.map((l) =>
              l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l,
            ),
            bumpKey: s.bumpKey + 1,
          }));
          return;
        }
        set((s) => ({
          lines: [
            ...s.lines,
            {
              key,
              productId: product.id,
              variantId: variant?.id ?? null,
              name: product.name,
              variantLabel: variant?.label ?? null,
              unitLabel: product.unit_label,
              unitPrice: Number(variant?.price ?? product.price),
              image: product.image_url,
              quantity: Math.min(MAX_QTY, quantity),
            },
          ],
          bumpKey: s.bumpKey + 1,
        }));
      },

      setQuantity: (key, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l)),
        })),

      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),

      sync: (products) => {
        const byId = new Map(products.map((p) => [p.id, p]));
        let changed = false;
        const lines = get().lines.map((line) => {
          const p = byId.get(line.productId);
          if (!p) {
            if (!line.unavailable) changed = true;
            return { ...line, unavailable: true };
          }
          const variant = line.variantId ? p.variants.find((v) => v.id === line.variantId) : null;
          const variantMissing = (line.variantId && !variant) || (!line.variantId && p.variants.length > 0);
          const next: CartLine = {
            ...line,
            name: p.name,
            image: p.image_url,
            unitLabel: p.unit_label,
            variantLabel: variant?.label ?? null,
            unitPrice: Number(variant?.price ?? p.price),
            unavailable: !p.is_available || Boolean(variantMissing),
          };
          if (
            next.unitPrice !== line.unitPrice ||
            next.unavailable !== Boolean(line.unavailable) ||
            next.name !== line.name ||
            next.image !== line.image
          )
            changed = true;
          return next;
        });
        if (changed) set({ lines });
        return changed;
      },
    }),
    {
      name: "dorbari-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      // Rehydrated by <CartHydrator /> after mount so server and client markup match.
      skipHydration: true,
    },
  ),
);

export function cartTotals(lines: CartLine[]) {
  const available = lines.filter((l) => !l.unavailable);
  return {
    count: lines.reduce((n, l) => n + l.quantity, 0),
    total: available.reduce((n, l) => n + l.unitPrice * l.quantity, 0),
    hasUnavailable: lines.some((l) => l.unavailable),
  };
}

export function CartHydrator() {
  useEffect(() => {
    useCart.persist.rehydrate();
  }, []);
  return null;
}

/** True after the persisted cart has been read from localStorage (avoids hydration mismatch). */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useCart.persist.hasHydrated()) setHydrated(true);
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
