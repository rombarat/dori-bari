"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cartTotals, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useCartSync } from "./use-cart-sync";
import { CartLines } from "./cart-lines";

export function CartDrawer() {
  const router = useRouter();
  const open = useCart((s) => s.drawerOpen);
  const close = useCart((s) => s.closeDrawer);
  const lines = useCart((s) => s.lines);
  const { total, count, hasUnavailable } = cartTotals(lines);
  useCartSync(open);

  useEffect(() => {
    if (open) router.prefetch("/checkout");
  }, [open, router]);

  return (
    <Drawer
      open={open}
      onClose={close}
      title="הסל שלך"
      footer={
        lines.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted">סה״כ ({count} פריטים)</span>
              <span className="tabular text-[22px] font-bold">{formatPrice(total)}</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={hasUnavailable}
              onClick={() => {
                close();
                router.push("/checkout");
              }}
            >
              להמשך הזמנה
            </Button>
            {hasUnavailable && <p className="text-center text-[14px] text-raspberry">הסירו את המוצרים שאזלו כדי להמשיך.</p>}
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="הסל עדיין ריק"
          body="בחרו עוגה, טארט או משהו קטן לקפה."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                close();
                router.push("/shop");
              }}
            >
              לכל המוצרים
            </Button>
          }
        />
      ) : (
        <div className="px-5">
          <CartLines lines={lines} />
        </div>
      )}
    </Drawer>
  );
}
