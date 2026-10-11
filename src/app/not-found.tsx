import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-[72px] leading-none text-caramel">404</p>
      <h1 className="mt-4 font-display text-[34px] leading-tight">הדף הזה כבר נאכל</h1>
      <p className="mt-2 text-muted">ייתכן שהמוצר הוסר מהתפריט או שהקישור שגוי.</p>
      <Link href="/shop" className="mt-8 inline-flex h-12 items-center rounded-full bg-cocoa px-6 font-semibold text-white hover:bg-cocoa-dark">
        לחנות
      </Link>
    </div>
  );
}
