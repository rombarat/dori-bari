-- Real Dor.Bari menu items, names and prices from dorbari1.wordpress.com.
-- Business details from the same site; pickup address left empty (not published) → set it in the admin.

insert into public.business_settings (id, business_name, phone, email, instagram_url, facebook_url,
  pickup_address, pickup_notes, min_lead_hours, max_days_ahead, slot_interval_minutes, weekly_hours)
values (1, 'Dor.Bari', '052-8025167', 'Dorakat2801@gmail.com',
  'https://www.instagram.com/dor.bari', 'https://www.facebook.com/dorbari1',
  '', 'כתובת האיסוף המדויקת תישלח אליכם עם אישור ההזמנה.', 24, 21, 30,
  '{"0":{"open":true,"start":"08:30","end":"18:00"},
    "1":{"open":true,"start":"08:30","end":"18:00"},
    "2":{"open":true,"start":"08:30","end":"18:00"},
    "3":{"open":true,"start":"08:30","end":"18:00"},
    "4":{"open":true,"start":"08:30","end":"18:00"},
    "5":{"open":false,"start":"08:30","end":"13:00"},
    "6":{"open":false,"start":"08:30","end":"13:00"}}'::jsonb)
on conflict (id) do nothing;

with cats as (
  insert into public.categories (name, image_url, sort_order) values
    ('עוגות',   '/products/pistachio-cake.webp', 1),
    ('טארטים',  '/products/lemon-pistachio-tart.webp', 2),
    ('עוגיות',  '/products/toffifee-cookie.webp', 3),
    ('מאפים',   '/products/canele.webp', 4),
    ('מארזים',  '/products/pistachio-raspberry-blondies.webp', 5)
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
  ('מארזים', 'בלונדיז פיסטוק ופטל', 'מגש בלונדיז פיסטוק ופטל, חתוך ומוכן לאירוח.', 60, '10 יחידות', '/products/pistachio-raspberry-blondies.webp', true, false, '{}', '[]', 1),
  ('מארזים', 'כדורי אנרגיה', 'פיסטוק מאצ''ה, תמרים וטחינה, ולוז. ללא גלוטן, ללא תוספת סוכר.', 25, '5 יחידות', '/products/energy-balls.webp', true, false, array['טבעוני','ללא גלוטן','ללא תוספת סוכר'], '[]', 2),
  ('מארזים', 'עוגיות פלורנטין', 'עוגיות פלורנטין שקדים ודבש.', 50, '10 יחידות', '/products/florentine.webp', false, false, '{}', '[]', 3)
) as p(cat, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order)
join cats c on c.name = p.cat;
