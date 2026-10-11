import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Phone, ShoppingBag } from "lucide-react";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductCard } from "@/components/store/product-card";
import { getCategories, getProduct, getProducts, getSettings } from "@/lib/catalog";
import { productPriceLabel, telHref } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProduct((await params).id);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [categories, products, settings] = await Promise.all([getCategories(), getProducts(), getSettings()]);
  const category = categories.find((c) => c.id === product.category_id);
  const related = products
    .filter((p) => p.id !== product.id && p.is_available && p.category_id === product.category_id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1200px] md:px-8 md:pt-10">
      <nav aria-label="מיקום בחנות" className="hidden text-[15px] text-muted md:block">
        <Link href="/shop" className="hover:text-ganache">
          החנות
        </Link>
        {category && (
          <>
            <ChevronRight className="mx-1 inline size-4 rotate-180" aria-hidden="true" />
            <Link href={`/shop?category=${category.id}`} className="hover:text-ganache">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="md:mt-6 md:grid md:grid-cols-2 md:gap-14">
        <div className="relative aspect-[4/5] overflow-hidden bg-meringue md:rounded-[var(--radius-photo)]">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 768px) 560px, 100vw"
              className={product.is_available ? "object-cover" : "object-cover opacity-60 grayscale-[60%]"}
            />
          )}
          <Link
            href={category ? `/shop?category=${category.id}` : "/shop"}
            className="absolute start-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/95 shadow-sm md:hidden"
            aria-label="חזרה לחנות"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>

        <div className="px-4 pt-6 md:px-0 md:pt-2">
          {category && <p className="text-[15px] font-semibold text-cocoa">{category.name}</p>}
          <h1 className="mt-1 font-display text-[34px] leading-[1.1] md:text-[46px]">{product.name}</h1>
          <p className="tabular mt-3 text-[22px] font-bold">{productPriceLabel(product)}</p>
          {product.unit_label && <p className="text-[15px] text-muted">{product.unit_label}</p>}

          {product.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <li key={t} className="rounded-full bg-pistachio-soft px-3 py-1 text-[14px] font-semibold text-pistachio">
                  {t}
                </li>
              ))}
            </ul>
          )}

          {product.description && <p className="mt-5 max-w-[52ch] text-[18px] leading-[1.75]">{product.description}</p>}

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <ul className="mt-8 space-y-2.5 border-t border-crumb pt-6 text-[15px] text-ganache/85">
            <li className="flex items-center gap-3">
              <ShoppingBag className="size-[18px] shrink-0 text-cocoa" strokeWidth={1.75} />
              איסוף עצמי, בוחרים יום ושעה בסיום ההזמנה
            </li>
            {settings.min_lead_hours > 0 && (
              <li className="flex items-center gap-3">
                <Clock className="size-[18px] shrink-0 text-cocoa" strokeWidth={1.75} />
                מזמינים לפחות {settings.min_lead_hours} שעות מראש
              </li>
            )}
            {settings.phone && (
              <li className="flex items-center gap-3">
                <Phone className="size-[18px] shrink-0 text-cocoa" strokeWidth={1.75} />
                <span>
                  שאלות על המוצר?{" "}
                  <a href={telHref(settings.phone)} className="font-semibold underline-offset-4 hover:underline" dir="ltr">
                    {settings.phone}
                  </a>
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-20 px-4 md:px-0">
          <h2 id="related-title" className="font-display text-[30px] leading-none md:text-[38px]">
            עוד מ{category ? `ה${category.name}` : "התפריט"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
