-- ════════════════════════════════════════════════════════════════════
-- DEMO PROJECT ONLY. Never run this on the real store's database.
-- Run after migrations 0001 and 0002, then create the demo admin
-- (see supabase/demo/README.md) and call private.reset_demo() once.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Holds the demo admin's password hash so the nightly reset can restore it.
create table if not exists private.demo_config (
  id int primary key default 1 check (id = 1),
  admin_email text not null,
  password_hash text not null
);

-- Visitors must not be able to close the demo store for everyone else.
create or replace function private.keep_demo_open()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.accepting_orders := true;
  return new;
end;
$$;

drop trigger if exists keep_demo_open on public.business_settings;
create trigger keep_demo_open before insert or update on public.business_settings
  for each row execute function private.keep_demo_open();

-- Friday/Saturday → following Sunday (the store's default closed days).
create or replace function private.next_open_day(d date)
returns date
language sql
immutable
as $$
  select d + case extract(dow from d)::int when 5 then 2 when 6 then 1 else 0 end;
$$;

-- Inserts one sample order. Items: [{"name": "...", "qty": 1, "variant": "three"}]
create or replace function private.demo_order(
  p_name text, p_phone text, p_notes text, p_date date, p_time time,
  p_status text, p_created timestamptz, p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  insert into public.orders (customer_name, phone, notes, pickup_date, pickup_time, status, total, created_at, updated_at)
  values (p_name, p_phone, p_notes, p_date, p_time, p_status, 0, p_created, p_created)
  returning id into v_order;

  insert into public.order_items (order_id, product_id, product_name, variant_label, unit_price, quantity, line_total)
  select v_order, pr.id, pr.name, v.value ->> 'label',
         coalesce((v.value ->> 'price')::numeric, pr.price),
         (i ->> 'qty')::int,
         coalesce((v.value ->> 'price')::numeric, pr.price) * (i ->> 'qty')::int
  from jsonb_array_elements(p_items) i
  join public.products pr on pr.name = i ->> 'name'
  left join lateral (
    select value from jsonb_array_elements(pr.variants) where value ->> 'id' = i ->> 'variant'
  ) v on true;

  update public.orders
     set total = (select coalesce(sum(line_total), 0) from public.order_items where order_id = v_order)
   where id = v_order;
end;
$$;

-- Restores menu, settings, sample orders and the demo password.
create or replace function private.reset_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Jerusalem')::date;
  d0 date := private.next_open_day(today);
  d1 date := private.next_open_day(d0 + 1);
  d2 date := private.next_open_day(d1 + 1);
begin
  delete from public.orders;
  delete from public.blocked_dates;
  delete from public.products;
  delete from public.categories;
  perform setval('public.order_number_seq', 1001, false);

  -- Same business as the real store, without Dora's contact details.
  insert into public.business_settings (id, business_name, phone, email, instagram_url, facebook_url,
    pickup_address, pickup_notes, accepting_orders, closed_message, min_lead_hours, max_days_ahead,
    slot_interval_minutes, weekly_hours, delivery_enabled)
  values (1, 'Dor.Bari', '', '', '', '', '', 'כתובת האיסוף המדויקת תישלח אליכם עם אישור ההזמנה.', true, '', 24, 21, 30,
    '{"0":{"open":true,"start":"08:30","end":"18:00"},
      "1":{"open":true,"start":"08:30","end":"18:00"},
      "2":{"open":true,"start":"08:30","end":"18:00"},
      "3":{"open":true,"start":"08:30","end":"18:00"},
      "4":{"open":true,"start":"08:30","end":"18:00"},
      "5":{"open":false,"start":"08:30","end":"13:00"},
      "6":{"open":false,"start":"08:30","end":"13:00"}}'::jsonb, false)
  on conflict (id) do update set
    business_name = excluded.business_name, phone = excluded.phone, email = excluded.email,
    instagram_url = excluded.instagram_url, facebook_url = excluded.facebook_url,
    pickup_address = excluded.pickup_address, pickup_notes = excluded.pickup_notes,
    accepting_orders = true, closed_message = '', min_lead_hours = excluded.min_lead_hours,
    max_days_ahead = excluded.max_days_ahead, slot_interval_minutes = excluded.slot_interval_minutes,
    weekly_hours = excluded.weekly_hours, delivery_enabled = false;

  with cats as (
    insert into public.categories (name, image_url, sort_order) values
      ('עוגות',  '/products/pistachio-cake.webp', 1),
      ('טארטים', '/products/lemon-pistachio-tart.webp', 2),
      ('עוגיות', '/products/toffifee-cookie.webp', 3),
      ('מאפים',  '/products/canele.webp', 4),
      ('מארזים', '/products/pistachio-raspberry-blondies.webp', 5)
    returning id, name
  )
  insert into public.products (category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order)
  select c.id, p.name, p.description, p.price, p.unit_label, p.image_url, p.is_available, p.is_featured, p.tags, p.variants, p.sort_order
  from (values
    ('עוגות', 'עוגת פיסטוק עם גנאש שוקולד לבן ופירות העונה', 'עוגת פיסטוק ללא גלוטן, גנאש שוקולד לבן ופירות העונה הטריים מלמעלה.', 180, 'עוגה שלמה', '/products/pistachio-cake.webp', true, true, array['ללא גלוטן'], '[]'::jsonb, 1),
    ('עוגות', 'עוגת גבינה באסקית', 'עוגת גבינה באסקית, שחומה מלמעלה וקרמית מבפנים.', 160, 'עוגה שלמה', '/products/basque-cheesecake.webp', true, true, '{}', '[]', 2),
    ('עוגות', 'עוגת שוקולד עם גנאש שוקולד', 'עוגת שוקולד ללא גלוטן עם גנאש שוקולד. אפשר להזמין גם בגרסה פרווה.', 165, 'עוגה שלמה', '/products/chocolate-cake.webp', true, false, array['ללא גלוטן','אפשרות לפרווה'], '[]', 3),
    ('עוגות', 'עוגת גבינה אפויה עם קרם', 'עוגת גבינה אפויה עם שכבת קרם ופירות יער.', 180, 'עוגה שלמה', '/products/baked-cheesecake.webp', true, false, '{}', '[]', 4),
    ('עוגות', 'קראק פאי', 'קראק פאי במילוי חמאתי ומתקתק.', 125, 'עוגה שלמה', '/products/crack-pie.webp', true, false, '{}', '[]', 5),
    ('טארטים', 'טארט דקואז שקדים עם קרם לימון', 'טארט דקואז שקדים עם קרם לימון, פרחי שוקולד לבן ופטל טרי.', 270, 'טארט גדול', '/products/dacquoise-tart.webp', true, true, '{}', '[]', 1),
    ('טארטים', 'טארט לימון עם מחית פיסטוק ופרחי ורדים', 'טארט לימון עם מחית פיסטוק ועלי ורדים.', 140, 'טארט גדול', '/products/lemon-pistachio-tart.webp', true, true, '{}', '[]', 2),
    ('טארטים', 'טארט פקאן', 'טארט פקאן קלאסי, עמוס אגוזי פקאן מקורמלים.', 170, 'טארט גדול', '/products/pecan-tart.webp', true, true, '{}', '[]', 3),
    ('טארטים', 'טארט שוקולד ולוז קלוי', 'טארט שוקולד עם אגוזי לוז קלויים.', 140, 'טארט גדול', '/products/chocolate-hazelnut-tart.webp', true, false, '{}', '[]', 4),
    ('עוגיות', 'עוגיית שוקולד עם טופיפי, לוז וקרמל מלוח', 'עוגיית שוקולד עם טופיפי, אגוזי לוז וקרמל מלוח.', 20, 'עוגייה', '/products/toffifee-cookie.webp', true, true, '{}',
       '[{"id":"single","label":"עוגייה אחת","price":20},{"id":"three","label":"3 עוגיות","price":55}]', 1),
    ('עוגיות', 'עוגיית אמסטרדם עם פרלין', 'עוגיית אמסטרדם עם פרלין חום נשפך.', 15, 'עוגייה', '/products/amsterdam-cookie.webp', true, false, '{}', '[]', 2),
    ('עוגיות', 'עוגיפלצת', 'עוגיפלצת עם 3 סוגי שוקולד וגנאש שוקולד לבן.', 70, 'עוגייה גדולה', '/products/cookie-monster.webp', true, false, '{}', '[]', 3),
    ('מאפים', 'קנלה', 'קנלה צרפתיים עם קרום מקורמל.', 40, '5 יחידות', '/products/canele.webp', true, true, '{}', '[]', 1),
    ('מאפים', 'סינבון שוקולד', 'סינבון במילוי וציפוי שוקולד.', 69, 'תבנית', '/products/chocolate-cinnabon.webp', true, true, '{}', '[]', 2),
    ('מאפים', 'מאפינס אוכמניות', 'מאפינס אוכמניות במילוי קרם.', 50, '3 יחידות', '/products/blueberry-muffins.webp', true, false, '{}', '[]', 3),
    ('מאפים', 'מאפינס לימון פטל', 'מאפינס לימון במילוי פטל.', 50, '3 יחידות', '/products/lemon-raspberry-muffins.webp', true, false, '{}', '[]', 4),
    ('מארזים', 'בלונדיז פיסטוק ופטל', 'מגש בלונדיז פיסטוק ופטל, חתוך ומוכן לאירוח.', 60, '10 יחידות', '/products/pistachio-raspberry-blondies.webp', true, false, '{}', '[]', 1),
    ('מארזים', 'כדורי אנרגיה', 'פיסטוק מאצ''ה, תמרים וטחינה, ולוז. ללא גלוטן, ללא תוספת סוכר.', 25, '5 יחידות', '/products/energy-balls.webp', true, false, array['טבעוני','ללא גלוטן','ללא תוספת סוכר'], '[]', 2),
    ('מארזים', 'עוגיות פלורנטין', 'עוגיות פלורנטין שקדים ודבש.', 50, '10 יחידות', '/products/florentine.webp', false, false, '{}', '[]', 3)
  ) as p(cat, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order)
  join cats c on c.name = p.cat;

  -- Sample orders, dated around today so the dashboard always looks current.
  perform private.demo_order('אורית שמעוני', '0500000006', '', today - 2, '12:00', 'completed', now() - interval '4 days',
    '[{"name":"טארט פקאן","qty":1}]');
  perform private.demo_order('דניאל לוי', '0500000005', '', d0, '11:30', 'ready', now() - interval '2 days',
    '[{"name":"עוגת גבינה באסקית","qty":1}]');
  perform private.demo_order('שירה פרץ', '0500000004', 'גרסה פרווה בבקשה', d0, '13:00', 'preparing', now() - interval '27 hours',
    '[{"name":"עוגת שוקולד עם גנאש שוקולד","qty":1},{"name":"כדורי אנרגיה","qty":2}]');
  perform private.demo_order('רוני מזרחי', '0500000003', 'למשרד, 20 איש', d1, '16:00', 'confirmed', now() - interval '20 hours',
    '[{"name":"בלונדיז פיסטוק ופטל","qty":2},{"name":"עוגיית שוקולד עם טופיפי, לוז וקרמל מלוח","qty":2,"variant":"three"}]');
  perform private.demo_order('יעל אברהם', '0500000002', '', d2, '12:30', 'new', now() - interval '2 hours',
    '[{"name":"טארט דקואז שקדים עם קרם לימון","qty":1},{"name":"קנלה","qty":2}]');
  perform private.demo_order('מיכל כהן', '0500000001', 'הקדשה על העוגה: מזל טוב נועה!', d1, '10:00', 'new', now() - interval '25 minutes',
    '[{"name":"עוגת פיסטוק עם גנאש שוקולד לבן ופירות העונה","qty":1}]');

  -- Undo any password change made through the API.
  update auth.users u
     set encrypted_password = c.password_hash, updated_at = now()
    from private.demo_config c
   where u.email = c.admin_email;
end;
$$;

revoke all on function private.reset_demo() from public, anon, authenticated;
revoke all on function private.demo_order(text, text, text, date, time, text, timestamptz, jsonb) from public, anon, authenticated;

-- Every night at 03:00–04:00 Israel time.
select cron.unschedule('reset-demo') where exists (select 1 from cron.job where jobname = 'reset-demo');
select cron.schedule('reset-demo', '0 1 * * *', 'select private.reset_demo()');
