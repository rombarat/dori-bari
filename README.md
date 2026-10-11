# Dor.Bari: online store + admin (demo)

Next.js 15 + Supabase (Postgres, Auth, Storage, Realtime). Hebrew, RTL, mobile-first.

## Run
```
npm install
npm run dev        # http://localhost:3000
```
`.env.local` holds the Supabase URL + publishable key (see `.env.example`).
Admin: `/admin/login`. Demo credentials are in `ADMIN_LOGIN.md` (gitignored).

## What's where
- Store: `src/app/(store)` (home, `/shop`, `/product/[id]`, `/checkout`, `/order/[id]`)
- Admin: `src/app/admin` (dashboard, orders, products, categories, pickup times, settings)
- DB: `supabase/migrations` (schema, RLS, `place_order` function), `supabase/seed.sql`
- Design system: `DESIGN.md`

Orders are created only through `place_order()`, which re-prices items and validates the pickup slot server-side.

## Demo data
Products, prices and photos come from dorbari1.wordpress.com. There are no orders in the database:
the first order placed in the store becomes #1001 and appears in the admin live.

## Before going live
Disable public sign-ups in Supabase Auth, enable leaked-password protection, set the pickup address in the admin, change the admin password.
