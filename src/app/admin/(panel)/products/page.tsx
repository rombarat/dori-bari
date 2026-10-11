import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-parts";
import { CatalogTabs } from "@/components/admin/catalog-tabs";
import { ProductsManager } from "@/components/admin/products-manager";
import { LinkButton } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <>
      <PageHeader
        title="התפריט"
        description="מה שמסומן כזמין מופיע בחנות. נגמר משהו? מכבים את המתג והוא יורד מההזמנות."
        actions={
          <LinkButton href="/admin/products/new" icon={<Plus className="size-[18px]" />}>
            הוספת מוצר
          </LinkButton>
        }
      />
      <CatalogTabs active="products" />
      <ProductsManager products={products} categories={categories} />
    </>
  );
}
