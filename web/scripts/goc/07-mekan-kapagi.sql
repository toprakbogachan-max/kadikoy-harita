-- ============================================================
--  GÖÇ 07 — mekan kapağı en çok beğenilen pinden gelsin
--
--  KARAR: mekanın kapak fotoğrafını kimse "seçmiyor". Oraya gidenlerin
--  bıraktığı pinlerden en çok beğenileni kendiliğinden kapak oluyor.
--
--  Alternatifleri neden değil:
--    · Herkes koyabilsin → son yükleyen kazanır, kavga çıkar
--    · Sadece editör → her mekan için elle uğraşmak gerekir, ölçeklenmez
--  Bu yol uygulamanın fikrine de uyuyor: mekanı temsil eden şey, oraya
--  gidenlerin çektiği fotoğraf.
--
--  Wikimedia'dan gelen cover_url yedek kalıyor: park/anıt gibi henüz pin
--  gelmemiş yerler boş görünmesin diye.
-- ============================================================

-- PostgREST "hesaplanan alan" özelliği: tablo tipini alan bir fonksiyon,
-- sorguda normal sütun gibi seçilebiliyor (select=id,name,cover_path).
create or replace function cover_path(places) returns text
language sql stable as $$
  select m.storage_path
  from pins p
  join pin_media m on m.pin_id = p.id and m.kind = 'photo'
  where p.place_id = $1.id
    and p.status = 'published'
    -- tohum verisinin sahte yolları kapak olmasın
    and m.storage_path not like 'demo://%'
  order by p.like_count desc, p.created_at desc, m.ordering
  limit 1;
$$;

-- Aynı mantık RPC içinden de lazım
create or replace function place_cover_path(in_place uuid) returns text
language sql stable as $$
  select m.storage_path
  from pins p
  join pin_media m on m.pin_id = p.id and m.kind = 'photo'
  where p.place_id = in_place
    and p.status = 'published'
    and m.storage_path not like 'demo://%'
  order by p.like_count desc, p.created_at desc, m.ordering
  limit 1;
$$;

-- Sıralama beğeniye göre; mevcut index created_at'e göreydi
create index if not exists pins_place_begeni_idx
  on pins (place_id, like_count desc) where status = 'published';

-- places_nearby'ye kapak alanları eklendi (haritadan açılan liste için)
-- Dönüş tipi değişiyor; create or replace bunu yapamaz (42P13).
-- İmzayı tam yazmak şart, yoksa hangi aşırı yükleme düşürüleceği belirsiz.
drop function if exists places_nearby(
  double precision, double precision, integer, place_category, boolean, integer);

create or replace function places_nearby(
  in_lat double precision,
  in_lng double precision,
  in_radius_m integer default 2000,
  in_category place_category default null,
  in_open_only boolean default false,
  in_limit integer default 200
) returns table (
  id uuid, slug text, name text, category place_category, neighborhood text,
  lat double precision, lng double precision, distance_m double precision,
  is_open boolean, pin_count integer, warning text, price_per_person integer,
  cover_path text, cover_url text
) language sql stable as $$
  select p.id, p.slug, p.name, p.category, p.neighborhood,
         st_y(p.geo::geometry), st_x(p.geo::geometry),
         st_distance(p.geo, st_point(in_lng, in_lat)::geography),
         is_open_now(p.opening_hours),
         p.pin_count, f.warning, f.price_per_person,
         place_cover_path(p.id), p.cover_url
  from places p
  left join place_facts f on f.place_id = p.id
  where p.status = 'published'
    and st_dwithin(p.geo, st_point(in_lng, in_lat)::geography, in_radius_m)
    and (in_category is null or p.category = in_category)
    and (not in_open_only or is_open_now(p.opening_hours) is true)
  order by p.pin_count desc, 8
  limit in_limit;
$$;

-- doğrulama: fotoğraflı pin olan mekanların kapağı geliyor mu
select count(*) filter (where cover_path is not null) as pinden_kapakli,
       count(*) filter (where cover_url  is not null) as wikimedia_kapakli,
       count(*) as toplam
from (
  select place_cover_path(id) as cover_path, cover_url
  from places where status = 'published'
) x;
