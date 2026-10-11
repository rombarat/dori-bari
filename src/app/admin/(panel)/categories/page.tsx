import { PageHeader } from "@/components/admin/page-parts";
import { CatalogTabs } from "@/components/admin/catalog-tabs";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category_id === c.id).length]));
  return (
    <>
      <PageHeader title="התפריט" description="הקטגוריות מופיעות בחנות בסדר שקובעים כאן." />
      <CatalogTabs active="categories" />
      <CategoriesManager categories={categories} counts={counts} />
    </>
  );
}
