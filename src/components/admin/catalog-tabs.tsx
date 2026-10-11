import Link from "next/link";
import clsx from "clsx";

export function CatalogTabs({ active }: { active: "products" | "categories" }) {
  const tab = (selected: boolean) =>
    clsx(
      "inline-flex h-10 items-center rounded-full px-5 text-[15px] font-semibold transition-colors",
      selected ? "bg-white text-ganache shadow-sm" : "text-muted hover:text-ganache",
    );
  return (
    <nav aria-label="קטלוג" className="mb-6 inline-flex rounded-full bg-meringue p-1">
      <Link href="/admin/products" className={tab(active === "products")} aria-current={active === "products" ? "page" : undefined}>
        מוצרים
      </Link>
      <Link href="/admin/categories" className={tab(active === "categories")} aria-current={active === "categories" ? "page" : undefined}>
        קטגוריות
      </Link>
    </nav>
  );
}
