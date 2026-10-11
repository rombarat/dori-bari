"use client";

import { useEffect, useRef } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/types";

/**
 * Refreshes cart prices/availability from the live menu whenever `active` turns true,
 * so a price change or "sold out" in the admin shows up in an existing cart.
 */
export function useCartSync(active: boolean) {
  const sync = useCart((s) => s.sync);
  const running = useRef(false);

  useEffect(() => {
    if (!active || running.current) return;
    const ids = [...new Set(useCart.getState().lines.map((l) => l.productId))];
    if (!ids.length) return;
    running.current = true;
    getBrowserSupabase()
      .from("products")
      .select("id, category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order")
      .in("id", ids)
      .then(({ data, error }) => {
        running.current = false;
        if (!error && data) sync(data as Product[]);
      });
  }, [active, sync]);
}
