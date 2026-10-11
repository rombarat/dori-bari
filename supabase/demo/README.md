# Showcase deployment (for prospective clients)

Same code as the real store, its own Supabase project, reset every night.
Nothing here touches the real store's database.

1. Create a separate Supabase project (e.g. `dor-bari-demo`).
2. Run `supabase/migrations/0001_init.sql`, `0002_tighten_policies.sql`, then `supabase/demo/demo.sql`.
3. Create the demo admin user, add it to `public.admins`, and store its password hash in
   `private.demo_config` (the nightly reset restores it from there).
4. `select private.reset_demo();` to load the menu and sample orders.
5. New Vercel project from the same repo, with env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the demo project's values
   - `NEXT_PUBLIC_DEMO_MODE=true`

Demo mode: not indexed by search engines, password change and "pause orders" are locked,
and the store's phone/email are left empty so visitors don't reach the real business.
