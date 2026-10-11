import type { Metadata } from "next";
import { ShopCatalog } from "@/components/store/shop-catalog";
import { getCategories, getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "החנות" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ category }, categories, products] = await Promise.all([searchParams, getCategories(), getProducts()]);
  const initialCategory = categories.some((c) => c.id === category) ? category! : null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 md:px-8 md:pt-12">
      <h1 className="font-display text-[46px] leading-none md:text-[64px]">החנות</h1>
      <p className="mt-3 max-w-[48ch] text-muted">כל המוצרים מוכנים בעבודת יד. בחרו, הוסיפו לסל וקבעו מועד איסוף.</p>
      <ShopCatalog categories={categories} products={products} initialCategory={initialCategory} />
    </div>
  );
}
