import Image from "next/image";
import Link from "next/link";
import { Clock, Phone, ShoppingBag } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";
import { summarizeHours } from "@/lib/pickup";
import { telHref } from "@/lib/format";

export default async function HomePage() {
  const [categories, products, settings] = await Promise.all([getCategories(), getProducts(), getSettings()]);
  const featured = products.filter((p) => p.is_featured && p.is_available).slice(0, 8);
  const hours = summarizeHours(settings.weekly_hours);
  const categoryTiles = categories
    .map((c) => {
      const inCategory = products.filter((p) => p.category_id === c.id);
      return { ...c, count: inCategory.length, image_url: c.image_url ?? inCategory.find((p) => p.image_url)?.image_url ?? null };
    })
    .filter((c) => c.count > 0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 md:grid md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12 md:px-8 md:pt-14 lg:gap-20">
        <div className="md:pb-10">
          <p className="text-[16px] font-semibold text-cocoa">קונדיטוריה בעבודת יד</p>
          <h1 className="mt-1 font-display text-[64px] leading-[0.95] tracking-[-0.01em] md:text-[96px]" dir="ltr" style={{ textAlign: "right" }}>
            Dor.Bari
          </h1>
          <p className="mt-5 max-w-[30ch] text-[19px] leading-relaxed text-ganache/85 md:text-[21px]">
            עוגות, טארטים ועוגיות מחומרי הגלם הטובים ביותר. בוחרים כאן, אוספים טריים.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <LinkButton href="/shop" size="lg" icon={<ShoppingBag className="size-5" strokeWidth={1.75} />}>
              להזמנה
            </LinkButton>
            {settings.phone && (
              <a
                href={telHref(settings.phone)}
                className="inline-flex h-[52px] items-center gap-2 rounded-full px-4 font-semibold text-ganache hover:bg-meringue"
              >
                <Phone className="size-[18px]" />
                <span dir="ltr">{settings.phone}</span>
              </a>
            )}
          </div>
        </div>

        <div className="relative mt-10 md:mt-0">
          <div className="arch relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden bg-meringue">
            <Image
              src="/products/hero-tart.webp"
              alt="טארט דקואז שקדים עם קרם לימון ופטל טרי"
              fill
              priority
              sizes="(min-width: 768px) 520px, 100vw"
              className="object-cover object-[50%_65%]"
            />
          </div>
        </div>
      </section>

      {/* ── Practical info ── */}
      <section aria-label="מידע להזמנה" className="mx-auto mt-10 max-w-[1200px] px-4 md:px-8">
        <ul className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-crumb bg-crumb sm:grid-cols-3">
          <li className="flex items-center gap-3 bg-white px-5 py-4">
            <ShoppingBag className="size-5 shrink-0 text-cocoa" strokeWidth={1.75} />
            <span>מזמינים באתר, אוספים בעצמכם</span>
          </li>
          <li className="flex items-center gap-3 bg-white px-5 py-4">
            <Clock className="size-5 shrink-0 text-cocoa" strokeWidth={1.75} />
            <span>
              {hours.map((h) => (
                <span key={h.days} className="block">
                  {h.days} <span className="tabular whitespace-nowrap" dir="ltr">{h.hours}</span>
                </span>
              ))}
            </span>
          </li>
          <li className="flex items-center gap-3 bg-white px-5 py-4">
            <Phone className="size-5 shrink-0 text-cocoa" strokeWidth={1.75} />
            <span>
              שאלות? <a href={telHref(settings.phone)} className="font-semibold underline-offset-4 hover:underline" dir="ltr">{settings.phone}</a>
            </span>
          </li>
        </ul>
      </section>

      {/* ── Categories ── */}
      <section aria-labelledby="cats-title" className="mt-20">
        <div className="mx-auto flex max-w-[1200px] items-end justify-between px-4 md:px-8">
          <h2 id="cats-title" className="font-display text-[34px] leading-none md:text-[46px]">
            מה בא לכם?
          </h2>
          <Link href="/shop" className="pb-1 text-[16px] font-semibold text-cocoa underline-offset-4 hover:underline">
            לכל המוצרים
          </Link>
        </div>
        <ul className="rail mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-auto md:grid md:max-w-[1200px] md:grid-cols-5 md:gap-5 md:overflow-visible md:px-8">
          {categoryTiles.map((c) => (
            <li key={c.id} className="w-[42vw] max-w-[200px] shrink-0 snap-start md:w-auto md:max-w-none">
              <Link href={`/shop?category=${c.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-photo)] bg-meringue">
                  {c.image_url && (
                    <Image
                      src={c.image_url}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 220px, 42vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <p className="mt-3 font-display text-[24px] leading-none">{c.name}</p>
                <p className="mt-1 text-[14px] text-muted">{c.count} מוצרים</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="mx-auto mt-20 max-w-[1200px] px-4 md:px-8">
          <h2 id="featured-title" className="font-display text-[34px] leading-none md:text-[46px]">
            המומלצים שלנו
          </h2>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <LinkButton href="/shop" variant="secondary" size="lg">
              לכל {products.length} המוצרים
            </LinkButton>
          </div>
        </section>
      )}

      {/* ── Story ── */}
      <section id="story" aria-labelledby="story-title" className="mt-24 scroll-mt-24 bg-meringue">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[var(--radius-photo)] md:order-last">
            <Image
              src="/products/about-dessert.webp"
              alt="קינוח שכבות של Dor.Bari מוגש בגינה"
              fill
              sizes="(min-width: 768px) 440px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-[46ch]">
            <h2 id="story-title" className="font-display text-[34px] leading-tight md:text-[46px]">
              הסיפור שלנו
            </h2>
            <p className="mt-5 text-[18px] leading-[1.75]">
              את Dor.Bari מובילה הקונדיטורית דורה, בוגרת קורס הקונדיטוריה הצרפתית של בית הספר לקולינריה ״דנון״.
            </p>
            <p className="mt-4 text-[18px] leading-[1.75]">
              כל פינוק נעשה בעבודת יד, מחומרי הגלם המשובחים ביותר. בתפריט תמצאו מתוקים ללא גלוטן, ללא סוכר מעובד
              וטבעוניים, לצד הקלאסיקות שגורמות לכולם לחזור.
            </p>
            <p className="mt-4 text-[18px] leading-[1.75]">
              מכינים גם מתוקים לאירועים, לחברות ולמתנות לעובדים.{" "}
              <a href={telHref(settings.phone)} className="font-semibold text-cocoa underline underline-offset-4">
                דברו איתנו
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── How to order ── */}
      <section id="how" aria-labelledby="how-title" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-4 md:px-8">
        <h2 id="how-title" className="font-display text-[34px] leading-none md:text-[46px]">
          איך מזמינים?
        </h2>
        <ol className="mt-9 grid gap-8 md:grid-cols-3 md:gap-10">
          {[
            { title: "בוחרים מוצרים", body: "עוגה לשבת, טארט לאירוח או מגש עוגיות למשרד." },
            { title: "מוסיפים לסל", body: "קובעים כמויות ורואים את הסכום המלא, בלי הפתעות." },
            { title: "בוחרים מועד איסוף ושולחים", body: "ממלאים שם וטלפון, בוחרים יום ושעה, וההזמנה אצלנו." },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-5 md:flex-col md:gap-4">
              <span className="font-display text-[56px] leading-[0.8] text-caramel" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="text-[19px] font-bold">{step.title}</h3>
                <p className="mt-1 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <LinkButton href="/shop" size="lg">
            להזמנה
          </LinkButton>
        </div>
      </section>
    </>
  );
}
