-- Dor.Bari store schema
-- Store + admin share these tables. Customers never write tables directly:
-- orders go through public.place_order(), which re-prices and validates everything.

create extension if not exists pgcrypto with schema extensions;

-- ───────────────────────── admins ─────────────────────────
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────── catalog ─────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  unit_label text not null default '',
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  -- Optional price options, e.g. [{"id":"single","label":"עוגייה אחת","price":20}]
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id, sort_order);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ───────────────────────── settings ─────────────────────────
create table public.business_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Dor.Bari',
  phone text not null default '',
  email text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  pickup_address text not null default '',
  pickup_notes text not null default '',
  accepting_orders boolean not null default true,
  closed_message text not null default '',
  min_lead_hours int not null default 24 check (min_lead_hours between 0 and 336),
  max_days_ahead int not null default 21 check (max_days_ahead between 1 and 120),
  slot_interval_minutes int not null default 30 check (slot_interval_minutes in (15, 30, 60, 90, 120)),
  -- keys "0".."6" = Sunday..Saturday → {"open":bool,"start":"HH:MM","end":"HH:MM"}
  weekly_hours jsonb not null,
  delivery_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on public.business_settings
  for each row execute function public.touch_updated_at();

create table public.blocked_dates (
  date date primary key,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- ───────────────────────── orders ─────────────────────────
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null unique default nextval('public.order_number_seq'),
  customer_name text not null,
  phone text not null,
  notes text not null default '',
  fulfillment_type text not null default 'pickup' check (fulfillment_type in ('pickup', 'delivery')),
  delivery_address text,
  pickup_date date not null,
  pickup_time time not null,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter sequence public.order_number_seq owned by public.orders.order_number;
create index orders_status_idx on public.orders (status, pickup_date);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  variant_label text,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- ───────────────────────── RLS ─────────────────────────
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.business_settings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "catalog readable" on public.categories for select to anon, authenticated using (true);
create policy "admin manages categories" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products readable" on public.products for select to anon, authenticated using (true);
create policy "admin manages products" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "settings readable" on public.business_settings for select to anon, authenticated using (true);
create policy "admin updates settings" on public.business_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "blocked dates readable" on public.blocked_dates for select to anon, authenticated using (true);
create policy "admin manages blocked dates" on public.blocked_dates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin reads orders" on public.orders for select to authenticated using ((select public.is_admin()));
create policy "admin updates orders" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes orders" on public.orders for delete to authenticated using ((select public.is_admin()));

create policy "admin reads order items" on public.order_items for select to authenticated using ((select public.is_admin()));

-- ───────────────────────── place_order ─────────────────────────
-- Errors are raised as stable codes; the storefront maps them to Hebrew messages.
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_notes text,
  p_pickup_date date,
  p_pickup_time time,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.business_settings;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_notes text := left(trim(coalesce(p_notes, '')), 600);
  v_now timestamp := (now() at time zone 'Asia/Jerusalem');
  v_pickup timestamp := p_pickup_date + p_pickup_time;
  v_day jsonb;
  v_item jsonb;
  v_product public.products;
  v_variant jsonb;
  v_qty int;
  v_price numeric(10, 2);
  v_total numeric(10, 2) := 0;
  v_order_id uuid;
  v_order_number int;
  v_lines jsonb := '[]'::jsonb;
begin
  select * into s from public.business_settings where id = 1;
  if not s.accepting_orders then raise exception 'ORDERS_CLOSED'; end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'INVALID_NAME'; end if;
  if v_phone like '+972%' then v_phone := '0' || substr(v_phone, 5); end if;
  if v_phone !~ '^0[0-9]{8,9}$' then raise exception 'INVALID_PHONE'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 40 then raise exception 'TOO_MANY_ITEMS'; end if;

  -- pickup slot
  if p_pickup_date is null or p_pickup_time is null then raise exception 'INVALID_SLOT'; end if;
  if exists (select 1 from public.blocked_dates where date = p_pickup_date) then raise exception 'DATE_BLOCKED'; end if;
  if p_pickup_date > (v_now::date + s.max_days_ahead) then raise exception 'DATE_TOO_FAR'; end if;
  v_day := s.weekly_hours -> extract(dow from p_pickup_date)::int::text;
  if v_day is null or not coalesce((v_day ->> 'open')::boolean, false) then raise exception 'DAY_CLOSED'; end if;
  if p_pickup_time < (v_day ->> 'start')::time or p_pickup_time > (v_day ->> 'end')::time then
    raise exception 'TIME_OUTSIDE_HOURS';
  end if;
  if v_pickup < v_now + make_interval(hours => s.min_lead_hours) then raise exception 'LEAD_TIME'; end if;

  -- price every line from the database, never from the client
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if not v_product.is_available then raise exception 'PRODUCT_UNAVAILABLE:%', v_product.name; end if;

    v_variant := null;
    if jsonb_array_length(v_product.variants) > 0 then
      select v into v_variant from jsonb_array_elements(v_product.variants) v
        where v ->> 'id' = v_item ->> 'variant_id';
      if v_variant is null then raise exception 'VARIANT_REQUIRED:%', v_product.name; end if;
      v_price := (v_variant ->> 'price')::numeric;
    else
      v_price := v_product.price;
    end if;

    v_total := v_total + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'variant_label', v_variant ->> 'label',
      'unit_price', v_price,
      'quantity', v_qty
    );
  end loop;

  insert into public.orders (customer_name, phone, notes, pickup_date, pickup_time, total)
  values (v_name, v_phone, v_notes, p_pickup_date, p_pickup_time, v_total)
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, product_name, variant_label, unit_price, quantity, line_total)
  select v_order_id,
         (l ->> 'product_id')::uuid,
         l ->> 'product_name',
         l ->> 'variant_label',
         (l ->> 'unit_price')::numeric,
         (l ->> 'quantity')::int,
         (l ->> 'unit_price')::numeric * (l ->> 'quantity')::int
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
end;
$$;

-- Confirmation page lookup by the (unguessable) order id.
create or replace function public.get_order_summary(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'pickup_date', o.pickup_date,
    'pickup_time', to_char(o.pickup_time, 'HH24:MI'),
    'status', o.status,
    'total', o.total,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name,
        'variant_label', i.variant_label,
        'quantity', i.quantity,
        'line_total', i.line_total) order by i.product_name)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_id;
$$;

revoke all on function public.place_order(text, text, text, date, time, jsonb) from public;
grant execute on function public.place_order(text, text, text, date, time, jsonb) to anon, authenticated;
revoke all on function public.get_order_summary(uuid) from public;
grant execute on function public.get_order_summary(uuid) to anon, authenticated;

-- ───────────────────────── storage + realtime ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin uploads product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin updates product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin deletes product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

alter publication supabase_realtime add table public.orders;
