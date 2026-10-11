"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Pencil, Search, Star, Trash2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { productPriceLabel } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { removeStoredImage } from "@/lib/product-images";
import type { Category, Product } from "@/lib/types";

export function ProductsManager({ products: initial, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "ללא קטגוריה";

  const visible = useMemo(() => {
    const order = new Map(categories.map((c, i) => [c.id, i]));
    return products
      .filter((p) => (category === "all" ? true : category === "none" ? !p.category_id : p.category_id === category))
      .filter((p) => !query.trim() || p.name.includes(query.trim()))
      .sort(
        (a, b) => (order.get(a.category_id ?? "") ?? 99) - (order.get(b.category_id ?? "") ?? 99) || a.sort_order - b.sort_order,
      );
  }, [products, categories, category, query]);

  const soldOutCount = products.filter((p) => !p.is_available).length;

  const patch = async (product: Product, changes: Partial<Product>, successMessage: string) => {
    setProducts((list) => list.map((p) => (p.id === product.id ? { ...p, ...changes } : p)));
    setPending((s) => new Set(s).add(product.id));
    const { error } = await getBrowserSupabase().from("products").update(changes).eq("id", product.id);
    setPending((s) => {
      const n = new Set(s);
      n.delete(product.id);
      return n;
    });
    if (error) {
      setProducts((list) => list.map((p) => (p.id === product.id ? product : p)));
      toast.error("השינוי לא נשמר. בדקו את החיבור ונסו שוב.");
      return;
    }
    toast.success(successMessage);
    router.refresh();
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await getBrowserSupabase().from("products").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error("המוצר לא נמחק. בדקו את החיבור ונסו שוב.");
      return;
    }
    await removeStoredImage(toDelete.image_url);
    setProducts((list) => list.filter((p) => p.id !== toDelete.id));
    toast.success(`״${toDelete.name}״ נמחק מהתפריט`);
    setToDelete(null);
    router.refresh();
  };

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-6" />}
        title="התפריט ריק"
        body="הוסיפו את המוצר הראשון, והוא יופיע בחנות מיד."
        action={<LinkButton href="/admin/products/new">הוספת מוצר</LinkButton>}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">חיפוש מוצר</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מוצר"
            className="h-11 w-full rounded-full border border-crumb bg-white pe-4 ps-10 text-[16px] focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
          />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">סינון לפי קטגוריה</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-full border border-crumb bg-white px-4 text-[16px] focus:border-cocoa focus:outline-none"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {products.some((p) => !p.category_id) && <option value="none">ללא קטגוריה</option>}
          </select>
        </label>
      </div>

      <p className="mt-4 text-[14px] text-muted">
        {products.length} מוצרים{soldOutCount > 0 && `, ${soldOutCount} לא זמינים כרגע`}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={<Search className="size-6" />} title="לא נמצאו מוצרים" body="נסו חיפוש אחר או קטגוריה אחרת." />
      ) : (
        <ul className="mt-3 divide-y divide-crumb overflow-hidden rounded-[var(--radius-panel)] border border-crumb bg-white">
          {visible.map((p) => (
            <li key={p.id} className={clsx("flex items-center gap-3 p-3 md:gap-4 md:p-4", !p.is_available && "bg-[#faf7f5]")}>
              <Link href={`/admin/products/${p.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-meringue md:size-[72px]">
                {p.image_url && (
                  <Image src={p.image_url} alt="" fill sizes="72px" className={clsx("object-cover", !p.is_available && "opacity-50 grayscale")} />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/admin/products/${p.id}`} className="line-clamp-2 font-semibold leading-snug hover:underline">
                  {p.name}
                </Link>
                <p className="mt-0.5 text-[14px] text-muted">
                  <span className="tabular font-semibold text-ganache">{productPriceLabel(p)}</span>
                  <span className="mx-1.5 text-crumb">|</span>
                  {categoryName(p.category_id)}
                </p>
                <p className={clsx("mt-0.5 text-[13px] font-semibold md:hidden", p.is_available ? "text-pistachio" : "text-raspberry")}>
                  {p.is_available ? "זמין להזמנה" : "לא זמין כרגע"}
                </p>
              </div>

              <div className="flex items-center gap-1 md:gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={clsx("hidden w-24 text-end text-[14px] font-semibold md:inline", p.is_available ? "text-pistachio" : "text-raspberry")}>
                    {p.is_available ? "זמין להזמנה" : "לא זמין כרגע"}
                  </span>
                  <Switch
                    checked={p.is_available}
                    disabled={pending.has(p.id)}
                    label={`זמינות: ${p.name}`}
                    onChange={(on) => patch(p, { is_available: on }, on ? `״${p.name}״ חזר לחנות` : `״${p.name}״ סומן כלא זמין`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    patch(p, { is_featured: !p.is_featured }, p.is_featured ? "הוסר מהמומלצים" : "נוסף למומלצים בדף הבית")
                  }
                  disabled={pending.has(p.id)}
                  className={clsx(
                    "hidden size-10 items-center justify-center rounded-full hover:bg-meringue sm:flex",
                    p.is_featured ? "text-caramel" : "text-crumb",
                  )}
                  aria-label={p.is_featured ? `הסרת ${p.name} מהמומלצים` : `הוספת ${p.name} למומלצים`}
                  aria-pressed={p.is_featured}
                  title="מומלץ בדף הבית"
                >
                  <Star className="size-5" fill={p.is_featured ? "currentColor" : "none"} />
                </button>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-meringue hover:text-ganache"
                  aria-label={`עריכת ${p.name}`}
                >
                  <Pencil className="size-[18px]" />
                </Link>
                <button
                  type="button"
                  onClick={() => setToDelete(p)}
                  className="hidden size-10 items-center justify-center rounded-full text-muted hover:bg-raspberry-soft hover:text-raspberry sm:flex"
                  aria-label={`מחיקת ${p.name}`}
                >
                  <Trash2 className="size-[18px]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`למחוק את ״${toDelete?.name ?? ""}״?`}
        body="המוצר יימחק מהתפריט לצמיתות. אם הוא רק נגמר, עדיף לכבות את מתג הזמינות. הזמנות קודמות לא ייפגעו."
        confirmLabel="מחיקה"
        destructive
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
