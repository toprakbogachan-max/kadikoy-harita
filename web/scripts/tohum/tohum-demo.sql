-- ============================================================
--  TOHUM: demo kullanıcılar ve pinler  ⚠️  SADECE GELİŞTİRME
--  Üretim: scripts/tohum/demo-uret.mjs
--
--  Prototipin 12 HAYALİ mekanını da ekler (slug "demo-..."). Gerçek
--  işletmelere uydurma yorum yazmamak için böyle: pin metinleri bu
--  hayali yerler için yazılmıştı, orada kalıyorlar.
--  GERÇEK KULLANICI GELMEDEN ÖNCE tohum-temizle.sql ÇALIŞTIRILMALI.
--
--  Demo hesap şifresi: demo12345   (e-postalar @demo.invalid — teslim edilemez)
-- ============================================================

-- ---------- prototipin hayali mekanları ----------
-- Not: demo mekanların koordinatları uydurma ama KARADA olmak zorunda.
-- demo-poyraz ve demo-sahil denize düşüyordu (ilçe sınırı çokgeniyle test
-- edildi); ikisi de düzeltildi. demo-sahil artık parkın OSM'deki gerçek
-- merkezinde.
insert into places (slug, name, category, neighborhood, geo, opening_hours, status)
values
  ('demo-poyraz', 'Poyraz Kahve', 'kahve'::place_category, 'Moda',
   st_point(29.0255, 40.9805)::geography, '[{"d":1,"open":"08:00","close":"22:00"},{"d":2,"open":"08:00","close":"22:00"},{"d":3,"open":"08:00","close":"22:00"},{"d":4,"open":"08:00","close":"22:00"},{"d":5,"open":"08:00","close":"23:30"},{"d":6,"open":"09:00","close":"23:30"},{"d":0,"open":"09:00","close":"21:00"}]'::jsonb, 'published'),
  ('demo-iskele', 'İskele Meyhanesi', 'yemek'::place_category, 'Rıhtım',
   st_point(29.0243, 40.9917)::geography, '[{"d":2,"open":"18:00","close":"01:00"},{"d":3,"open":"18:00","close":"01:00"},{"d":4,"open":"18:00","close":"01:00"},{"d":5,"open":"18:00","close":"02:00"},{"d":6,"open":"18:00","close":"02:00"},{"d":0,"open":"18:00","close":"00:00"}]'::jsonb, 'published'),
  ('demo-firin', 'Yeldeğirmeni Fırın', 'tatli'::place_category, 'Yeldeğirmeni',
   st_point(29.0271, 40.9968)::geography, '[{"d":1,"open":"07:30","close":"19:00"},{"d":2,"open":"07:30","close":"19:00"},{"d":3,"open":"07:30","close":"19:00"},{"d":4,"open":"07:30","close":"19:00"},{"d":5,"open":"07:30","close":"19:00"},{"d":6,"open":"08:00","close":"19:00"}]'::jsonb, 'published'),
  ('demo-ocak', 'Kuşdili Ocakbaşı', 'yemek'::place_category, 'Kuşdili',
   st_point(29.0348, 40.9906)::geography, '[{"d":1,"open":"12:00","close":"23:00"},{"d":2,"open":"12:00","close":"23:00"},{"d":3,"open":"12:00","close":"23:00"},{"d":4,"open":"12:00","close":"23:00"},{"d":5,"open":"12:00","close":"00:30"},{"d":6,"open":"12:00","close":"00:30"},{"d":0,"open":"12:00","close":"22:00"}]'::jsonb, 'published'),
  ('demo-kitap', 'Bahariye Kitap & Kahve', 'kahve'::place_category, 'Bahariye',
   st_point(29.0292, 40.9879)::geography, '[{"d":1,"open":"10:00","close":"21:00"},{"d":2,"open":"10:00","close":"21:00"},{"d":3,"open":"10:00","close":"21:00"},{"d":4,"open":"10:00","close":"21:00"},{"d":5,"open":"10:00","close":"22:00"},{"d":6,"open":"10:00","close":"22:00"},{"d":0,"open":"11:00","close":"20:00"}]'::jsonb, 'published'),
  ('demo-sahil', 'Moda Sahil Parkı', 'park'::place_category, 'Moda',
   st_point(29.0281, 40.9802)::geography, '[{"d":0,"open":"00:00","close":"23:59"},{"d":1,"open":"00:00","close":"23:59"},{"d":2,"open":"00:00","close":"23:59"},{"d":3,"open":"00:00","close":"23:59"},{"d":4,"open":"00:00","close":"23:59"},{"d":5,"open":"00:00","close":"23:59"},{"d":6,"open":"00:00","close":"23:59"}]'::jsonb, 'published'),
  ('demo-plak', 'Akmar Plak', 'kultur'::place_category, 'Bahariye',
   st_point(29.0284, 40.9892)::geography, '[{"d":1,"open":"11:00","close":"20:00"},{"d":2,"open":"11:00","close":"20:00"},{"d":3,"open":"11:00","close":"20:00"},{"d":4,"open":"11:00","close":"20:00"},{"d":5,"open":"11:00","close":"21:00"},{"d":6,"open":"11:00","close":"21:00"}]'::jsonb, 'published'),
  ('demo-bar', 'Boğa Bar', 'bar'::place_category, 'Rıhtım',
   st_point(29.0269, 40.9903)::geography, '[{"d":3,"open":"19:00","close":"02:00"},{"d":4,"open":"19:00","close":"02:00"},{"d":5,"open":"19:00","close":"03:00"},{"d":6,"open":"19:00","close":"03:00"},{"d":0,"open":"19:00","close":"01:00"}]'::jsonb, 'published'),
  ('demo-balik', 'Kalamış Balıkçısı', 'yemek'::place_category, 'Kalamış',
   st_point(29.0402, 40.9805)::geography, '[{"d":1,"open":"12:00","close":"23:30"},{"d":2,"open":"12:00","close":"23:30"},{"d":3,"open":"12:00","close":"23:30"},{"d":4,"open":"12:00","close":"23:30"},{"d":5,"open":"12:00","close":"00:30"},{"d":6,"open":"12:00","close":"00:30"},{"d":0,"open":"12:00","close":"23:00"}]'::jsonb, 'published'),
  ('demo-yogurtcu', 'Yoğurtçu Bahçe', 'kahve'::place_category, 'Kuşdili',
   st_point(29.0325, 40.9931)::geography, '[{"d":1,"open":"09:00","close":"20:00"},{"d":2,"open":"09:00","close":"20:00"},{"d":3,"open":"09:00","close":"20:00"},{"d":4,"open":"09:00","close":"20:00"},{"d":5,"open":"09:00","close":"21:00"},{"d":6,"open":"09:00","close":"21:00"},{"d":0,"open":"09:00","close":"20:00"}]'::jsonb, 'published'),
  ('demo-meze', 'Serasker Meze', 'yemek'::place_category, 'Çarşı',
   st_point(29.0257, 40.9895)::geography, '[{"d":1,"open":"11:00","close":"21:00"},{"d":2,"open":"11:00","close":"21:00"},{"d":3,"open":"11:00","close":"21:00"},{"d":4,"open":"11:00","close":"21:00"},{"d":5,"open":"11:00","close":"22:00"},{"d":6,"open":"11:00","close":"22:00"}]'::jsonb, 'published'),
  ('demo-tatlici', 'Fener Tatlıcısı', 'tatli'::place_category, 'Fenerbahçe',
   st_point(29.0431, 40.9714)::geography, '[{"d":1,"open":"10:00","close":"23:00"},{"d":2,"open":"10:00","close":"23:00"},{"d":3,"open":"10:00","close":"23:00"},{"d":4,"open":"10:00","close":"23:00"},{"d":5,"open":"10:00","close":"00:00"},{"d":6,"open":"10:00","close":"00:00"},{"d":0,"open":"10:00","close":"23:00"}]'::jsonb, 'published')
on conflict (slug) do update set
  name = excluded.name, category = excluded.category,
  neighborhood = excluded.neighborhood, geo = excluded.geo,
  opening_hours = excluded.opening_hours;

-- Supabase'de pgcrypto "extensions" şemasında durur.
-- auth.users'a doğrudan yazıyoruz: Auth API'den kayıt olmak e-posta
-- doğrulaması ister, gizli service_role anahtarı ise hiç kullanılmıyor.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '118aefb5-0000-4000-8000-118aefb50000', 'authenticated', 'authenticated',
   'bogac@demo.invalid', extensions.crypt('demo12345', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   jsonb_build_object('username', 'bogac', 'display_name', 'Bogaç'),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0092308b-0000-4000-8000-0092308b0000', 'authenticated', 'authenticated',
   'elifgezer@demo.invalid', extensions.crypt('demo12345', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   jsonb_build_object('username', 'elifgezer', 'display_name', 'Elif'),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0095ba61-0000-4000-8000-0095ba610000', 'authenticated', 'authenticated',
   'mertdmr@demo.invalid', extensions.crypt('demo12345', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   jsonb_build_object('username', 'mertdmr', 'display_name', 'Mert'),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '4842caf2-0000-4000-8000-4842caf20000', 'authenticated', 'authenticated',
   'zynp@demo.invalid', extensions.crypt('demo12345', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   jsonb_build_object('username', 'zynp', 'display_name', 'Zeynep'),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0004ae69-0000-4000-8000-0004ae690000', 'authenticated', 'authenticated',
   'canyz@demo.invalid', extensions.crypt('demo12345', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   jsonb_build_object('username', 'canyz', 'display_name', 'Can'),
   '', '', '', '')
on conflict (id) do nothing;

-- profiles satırlarını trg_auth_user_created açtı; bio ve sayaçları tamamla
update profiles set display_name = 'Bogaç', bio = 'Kadıköy’de büyüdüm. Turist gibi değil, komşu gibi gezdiriyorum.',
  follower_count = 1284, following_count = 96
  where id = '118aefb5-0000-4000-8000-118aefb50000';
update profiles set display_name = 'Elif', bio = 'Sabah kahvesi avcısı.',
  follower_count = 412, following_count = 203
  where id = '0092308b-0000-4000-8000-0092308b0000';
update profiles set display_name = 'Mert', bio = 'Akşamcı. Meyhane arşivi tutuyorum.',
  follower_count = 238, following_count = 151
  where id = '0095ba61-0000-4000-8000-0095ba610000';
update profiles set display_name = 'Zeynep', bio = 'Tatlı için yol yürürüm.',
  follower_count = 906, following_count = 88
  where id = '4842caf2-0000-4000-8000-4842caf20000';
update profiles set display_name = 'Can', bio = 'Uzaktan çalışıyorum, priz haritası bende.',
  follower_count = 157, following_count = 310
  where id = '0004ae69-0000-4000-8000-0004ae690000';

-- ---------- pinler ----------
insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c3-0000-4000-8000-009725c30000', '118aefb5-0000-4000-8000-118aefb50000', pl.id, 'Vapur düdüğü duyulan tek masa camın önündeki. Rezervasyon alırken "cam kenarı" diye ısrar et, yoksa arka salona atıyorlar.',
       array['eski','gürültülü','sahici']::text[], 'kalabalık grup', 8.5,
       'Salı akşamları da müzik olsa', 'yılda birkaç', 'evet', 880,
       (now() - interval '2 hours')::date, (now() - interval '2 hours'), 214
from places pl where pl.slug = 'demo-iskele'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c3-0000-4000-8000-009725c30000', 'photo'::media_kind,
        'demo://pin-1-1', 'Cam kenarındaki masa — ısrar etmeye değer.', 0)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c3-0000-4000-8000-009725c30000', 'video'::media_kind,
        'demo://pin-1-2', 'Vapur geçerken düdük sesi böyle duyuluyor.', 1)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c3-0000-4000-8000-009725c30000', 'photo'::media_kind,
        'demo://pin-1-3', 'Arka salon: aynı mutfak, bambaşka his.', 2)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c4-0000-4000-8000-009725c40000', '0092308b-0000-4000-8000-0092308b0000', pl.id, 'Üst katta priz bol, laptopla saatlerce oturulur. Alt kat gürültülü, kapının yanına oturma.',
       array['sakin','ferah','prizli']::text[], 'çalışmak için', 9,
       'Alt kata da priz koysalar', 'haftalık uğrak', 'evet', 210,
       (now() - interval '5 hours')::date, (now() - interval '5 hours'), 96
from places pl where pl.slug = 'demo-poyraz'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c4-0000-4000-8000-009725c40000', 'photo'::media_kind,
        'demo://pin-2-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c5-0000-4000-8000-009725c50000', '118aefb5-0000-4000-8000-118aefb50000', pl.id, 'Çay ocağının olduğu taraf değil, güneye doğru yürü. Kalabalık orada kesiliyor, 10 dakika yürüyünce sahil senin oluyor.',
       array['açık','rüzgarlı','bedava']::text[], 'tek başına', 9.5,
       'Bank sayısı artsa', 'haftalık uğrak', 'evet', null,
       (now() - interval '8 hours')::date, (now() - interval '8 hours'), 341
from places pl where pl.slug = 'demo-sahil'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c5-0000-4000-8000-009725c50000', 'video'::media_kind,
        'demo://pin-3-1', 'Gün batımı, güney ucu. Kalabalık burada bitiyor.', 0)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c5-0000-4000-8000-009725c50000', 'photo'::media_kind,
        'demo://pin-3-2', 'Bank sayısı az, erken gelmek gerekiyor.', 1)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c6-0000-4000-8000-009725c60000', '4842caf2-0000-4000-8000-4842caf20000', pl.id, 'Öğleden sonra 16:00 civarı ikinci fırın çıkıyor, sıcak yakalarsın. Kart geçmiyor, nakit al yanına.',
       array['sıcak','küçük','nakit']::text[], 'hızlı uğrak', 8,
       'Kart geçse', 'haftalık uğrak', 'evet', 110,
       (now() - interval '11 hours')::date, (now() - interval '11 hours'), 158
from places pl where pl.slug = 'demo-firin'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c6-0000-4000-8000-009725c60000', 'photo'::media_kind,
        'demo://pin-4-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c7-0000-4000-8000-009725c70000', '0004ae69-0000-4000-8000-0004ae690000', pl.id, 'Arka bahçe kışın da açık, soba yakıyorlar. Wi-Fi şifresi kasada, sorman lazım. Toplantı yapılacak yer değil, sessiz.',
       array['sessiz','kitaplı','yavaş']::text[], 'çalışmak için', 7.5,
       'Wi-Fi şifresi masada yazsa', 'ayda bir', 'evet', 175,
       (now() - interval '14 hours')::date, (now() - interval '14 hours'), 73
from places pl where pl.slug = 'demo-kitap'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c7-0000-4000-8000-009725c70000', 'photo'::media_kind,
        'demo://pin-5-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c8-0000-4000-8000-009725c80000', '0095ba61-0000-4000-8000-0095ba610000', pl.id, 'Canlı müzik cuma-cumartesi 22:00’de başlıyor. Sohbet edecekseniz 21:00’den önce gidin, sonrası bağırışma.',
       array['canlı','dar','samimi']::text[], 'kalabalık grup', 8,
       'Ses biraz kısılsa', 'ayda bir', 'evet', 430,
       (now() - interval '20 hours')::date, (now() - interval '20 hours'), 112
from places pl where pl.slug = 'demo-bar'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c8-0000-4000-8000-009725c80000', 'photo'::media_kind,
        'demo://pin-6-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725c9-0000-4000-8000-009725c90000', '118aefb5-0000-4000-8000-118aefb50000', pl.id, 'Fiyatı sorup öyle sipariş ver, günlük balık tahtada yazmıyor. Hesap sürprizi burada klasik.',
       array['manzaralı','pahalı','klasik']::text[], 'ilk buluşma', 7,
       'Fiyatlar tahtada yazsa', 'yılda birkaç', 'belki', 1050,
       (now() - interval '26 hours')::date, (now() - interval '26 hours'), 287
from places pl where pl.slug = 'demo-balik'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725c9-0000-4000-8000-009725c90000', 'photo'::media_kind,
        'demo://pin-7-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725ca-0000-4000-8000-009725ca0000', '0095ba61-0000-4000-8000-0095ba610000', pl.id, 'Ocak başı oturmak için erken git, 20:00’den sonra sadece salon kalıyor. Salon bambaşka bir mekan gibi, tadı gitmiyor ama keyfi gidiyor.',
       array['dumanlı','doyurucu','hızlı']::text[], 'kalabalık grup', 8.5,
       'Salonda da ocak olsa', 'ayda bir', 'evet', 620,
       (now() - interval '31 hours')::date, (now() - interval '31 hours'), 64
from places pl where pl.slug = 'demo-ocak'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725ca-0000-4000-8000-009725ca0000', 'photo'::media_kind,
        'demo://pin-8-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '009725cb-0000-4000-8000-009725cb0000', '0092308b-0000-4000-8000-0092308b0000', pl.id, 'Park kenarında ama gürültü almıyor. Yazın gölge sabah tarafında, öğleden sonra güneş tepende.',
       array['yeşil','sakin','ucuz']::text[], 'tek başına', 7.5,
       'Şemsiye konsa', 'haftalık uğrak', 'evet', 140,
       (now() - interval '38 hours')::date, (now() - interval '38 hours'), 41
from places pl where pl.slug = 'demo-yogurtcu'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('009725cb-0000-4000-8000-009725cb0000', 'photo'::media_kind,
        'demo://pin-9-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '124d92cd-0000-4000-8000-124d92cd0000', '4842caf2-0000-4000-8000-4842caf20000', pl.id, 'Deniz tarafındaki masalar için beklemeye değer, sıra 15 dakika sürüyor. İç salon fena, orada oturacaksan gitme.',
       array['deniz','kalabalık','tatlı']::text[], 'uzun oturma', 8,
       'İç salon yenilense', 'ayda bir', 'evet', 190,
       (now() - interval '44 hours')::date, (now() - interval '44 hours'), 129
from places pl where pl.slug = 'demo-tatlici'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92cd-0000-4000-8000-124d92cd0000', 'photo'::media_kind,
        'demo://pin-10-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '124d92ce-0000-4000-8000-124d92ce0000', '0004ae69-0000-4000-8000-0004ae690000', pl.id, 'Alt kattaki ikinci el kutuları en iyisi. Üst kat turistik fiyat. Pazar kapalı, boşuna gitme.',
       array['tozlu','nostaljik','ucuz']::text[], 'tek başına', 9,
       'Pazar da açılsa', 'yılda birkaç', 'evet', null,
       (now() - interval '52 hours')::date, (now() - interval '52 hours'), 88
from places pl where pl.slug = 'demo-plak'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92ce-0000-4000-8000-124d92ce0000', 'photo'::media_kind,
        'demo://pin-11-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '124d92cf-0000-4000-8000-124d92cf0000', '118aefb5-0000-4000-8000-118aefb50000', pl.id, 'Ayaküstü meze alıp sahilde yenir. İçeride oturacak yer neredeyse yok, oturmayı planlıyorsan burası değil.',
       array['ayaküstü','taze','dar']::text[], 'hızlı uğrak', 8,
       'Dışarı iki masa koysalar', 'haftalık uğrak', 'evet', 380,
       (now() - interval '60 hours')::date, (now() - interval '60 hours'), 203
from places pl where pl.slug = 'demo-meze'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92cf-0000-4000-8000-124d92cf0000', 'photo'::media_kind,
        'demo://pin-12-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '124d92d0-0000-4000-8000-124d92d00000', '0092308b-0000-4000-8000-0092308b0000', pl.id, 'Hafta içi 15:00 sonrası tamamen boşalıyor. Cumartesi sabahı 40 dakika sıra vardı, uyarayım.',
       array['sıralı','popüler','iyi']::text[], 'hızlı uğrak', 7,
       'Sıra sistemi olsa', 'haftalık uğrak', 'evet', 230,
       (now() - interval '70 hours')::date, (now() - interval '70 hours'), 57
from places pl where pl.slug = 'demo-poyraz'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d0-0000-4000-8000-124d92d00000', 'photo'::media_kind,
        'demo://pin-13-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '124d92d1-0000-4000-8000-124d92d10000', '0095ba61-0000-4000-8000-0095ba610000', pl.id, 'Pazartesi kapalı olduğunu bilmeden gittim, kapıdan döndüm. Salı akşamı da yarı boş, sakin isteyene iyi.',
       array['kapalı','sakin','eski']::text[], 'ilk buluşma', 6.5,
       'Kapalı günü kapıda yazsa', 'yılda birkaç', 'belki', null,
       (now() - interval '78 hours')::date, (now() - interval '78 hours'), 44
from places pl where pl.slug = 'demo-iskele'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d1-0000-4000-8000-124d92d10000', 'photo'::media_kind,
        'demo://pin-14-1', null, 0)
on conflict do nothing;

insert into pins (id, author_id, place_id, body, words, scenario, rating,
                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)
select '124d92d2-0000-4000-8000-124d92d20000', '118aefb5-0000-4000-8000-118aefb50000', pl.id, 'Tezgahtan kendin seç, fiyatını sorarak. Deniz tarafı için hafta sonu mutlaka rezervasyon yaptır, yoksa iç salona düşüyorsun.',
       array['manzaralı','taze','pahalı']::text[], 'ilk buluşma', 8.5,
       'Fiyatlar tahtada yazsa', 'yılda birkaç', 'evet', 1050,
       (now() - interval '1 hours')::date, (now() - interval '1 hours'), 312
from places pl where pl.slug = 'demo-balik'
on conflict (id) do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d2-0000-4000-8000-124d92d20000', 'photo'::media_kind,
        'demo://pin-15-1', 'Girişteki tezgah — günlük ne geldiyse burada duruyor.', 0)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d2-0000-4000-8000-124d92d20000', 'video'::media_kind,
        'demo://pin-15-2', 'Balık seçerken: fiyatı sorup öyle seç, tahtada yazmıyor.', 1)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d2-0000-4000-8000-124d92d20000', 'photo'::media_kind,
        'demo://pin-15-3', 'Deniz tarafındaki masalar. Rezervasyon buraya yapılıyor.', 2)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d2-0000-4000-8000-124d92d20000', 'video'::media_kind,
        'demo://pin-15-4', 'Gün batımında manzara, saat 19:30 civarı.', 3)
on conflict do nothing;

insert into pin_media (pin_id, kind, storage_path, caption, ordering)
values ('124d92d2-0000-4000-8000-124d92d20000', 'photo'::media_kind,
        'demo://pin-15-5', 'Hesap: kişi başı 1050₺ çıktı, iki kişi bir şişe şarapla.', 4)
on conflict do nothing;

-- ---------- yorumlar ----------
insert into pin_comments (pin_id, author_id, body, created_at)
values ('009725c3-0000-4000-8000-009725c30000', '0092308b-0000-4000-8000-0092308b0000', 'Cam kenarı için hafta içi gitmek lazım, hafta sonu imkansız.',
        now() - interval '1 hours')
on conflict do nothing;

insert into pin_comments (pin_id, author_id, body, created_at)
values ('009725c3-0000-4000-8000-009725c30000', '0095ba61-0000-4000-8000-0095ba610000', 'Rezervasyonu 3 gün önceden aldım, yine de arka salona verdiler.',
        now() - interval '6 hours')
on conflict do nothing;

insert into pin_comments (pin_id, author_id, body, created_at)
values ('009725c5-0000-4000-8000-009725c50000', '4842caf2-0000-4000-8000-4842caf20000', 'Güneye yürüme tüyosu çok işe yaradı, teşekkürler.',
        now() - interval '2 hours')
on conflict do nothing;

insert into pin_comments (pin_id, author_id, body, created_at)
values ('124d92d2-0000-4000-8000-124d92d20000', '0004ae69-0000-4000-8000-0004ae690000', 'Fiyat sorma uyarısı sayesinde hesap sürprizi yaşamadım.',
        now() - interval '0 hours')
on conflict do nothing;

insert into pin_comments (pin_id, author_id, body, created_at)
values ('009725c4-0000-4000-8000-009725c40000', '118aefb5-0000-4000-8000-118aefb50000', 'Alt kat gerçekten gürültülü, üst kat şart.',
        now() - interval '14 hours')
on conflict do nothing;

-- ---------- takipler (ben → diğerleri) ----------
insert into follows (follower_id, following_id) values ('118aefb5-0000-4000-8000-118aefb50000', '0092308b-0000-4000-8000-0092308b0000')
on conflict do nothing;
insert into follows (follower_id, following_id) values ('118aefb5-0000-4000-8000-118aefb50000', '0095ba61-0000-4000-8000-0095ba610000')
on conflict do nothing;
insert into follows (follower_id, following_id) values ('118aefb5-0000-4000-8000-118aefb50000', '4842caf2-0000-4000-8000-4842caf20000')
on conflict do nothing;
insert into follows (follower_id, following_id) values ('118aefb5-0000-4000-8000-118aefb50000', '0004ae69-0000-4000-8000-0004ae690000')
on conflict do nothing;

-- ---------- listeler ----------
insert into lists (id, owner_id, slug, title, intro)
values ('3094ac51-0000-4000-8000-3094ac510000', '118aefb5-0000-4000-8000-118aefb50000', 'yagmurlu-gunde-kadikoy',
        'Yağmurlu günde Kadıköy', null)
on conflict (id) do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac51-0000-4000-8000-3094ac510000', id, 0 from places where slug = 'demo-kitap'
on conflict do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac51-0000-4000-8000-3094ac510000', id, 1 from places where slug = 'demo-yogurtcu'
on conflict do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac51-0000-4000-8000-3094ac510000', id, 2 from places where slug = 'demo-plak'
on conflict do nothing;

insert into lists (id, owner_id, slug, title, intro)
values ('3094ac52-0000-4000-8000-3094ac520000', '0092308b-0000-4000-8000-0092308b0000', 'tek-basina-oturulacak-yerler',
        'Tek başına oturulacak yerler', null)
on conflict (id) do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac52-0000-4000-8000-3094ac520000', id, 0 from places where slug = 'demo-poyraz'
on conflict do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac52-0000-4000-8000-3094ac520000', id, 1 from places where slug = 'demo-kitap'
on conflict do nothing;

insert into lists (id, owner_id, slug, title, intro)
values ('3094ac53-0000-4000-8000-3094ac530000', '0095ba61-0000-4000-8000-0095ba610000', 'gec-saate-kadar-acik',
        'Geç saate kadar açık', null)
on conflict (id) do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac53-0000-4000-8000-3094ac530000', id, 0 from places where slug = 'demo-bar'
on conflict do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac53-0000-4000-8000-3094ac530000', id, 1 from places where slug = 'demo-iskele'
on conflict do nothing;
insert into list_items (list_id, place_id, ordering)
select '3094ac53-0000-4000-8000-3094ac530000', id, 2 from places where slug = 'demo-ocak'
on conflict do nothing;

-- doğrulama
select 'profil' as ne, count(*) from profiles
union all select 'pin', count(*) from pins
union all select 'medya', count(*) from pin_media
union all select 'yorum', count(*) from pin_comments
union all select 'liste', count(*) from lists;
