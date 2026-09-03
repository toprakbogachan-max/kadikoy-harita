-- ============================================================
--  Göç 10 — places.lat / places.lng hesaplanan alanları
-- ============================================================
-- Sorun: geo sütunu geography tipinde, PostgREST onu sayı olarak vermiyor.
-- Bu yüzden mekanAra ve yerGetir bugüne kadar lat: 0, lng: 0 döndürüyordu;
-- pin formundaki harita seçilen mekana uçamıyor, profildeki mini harita da
-- koordinatsız kayıtları eliyordu.
--
-- Çözüm şemada zaten kullanılan desen: tablo tipini alan fonksiyon PostgREST'te
-- normal sütun gibi seçilebiliyor (bkz. cover_path(places)).
--
-- Güvenli: yalnızca okuma, RLS'i atlamıyor — fonksiyon security definer DEĞİL,
-- yani satır zaten görünüyorsa koordinatı da görünür.

create or replace function lat(places) returns double precision
language sql stable as $$
  select st_y($1.geo::geometry);
$$;

create or replace function lng(places) returns double precision
language sql stable as $$
  select st_x($1.geo::geometry);
$$;

-- PostgREST şema önbelleğini yenile, yoksa yeni alanlar 400 döner.
notify pgrst, 'reload schema';

-- Doğrulama: ikisi de sayı dönmeli.
select name, lat(places.*) as lat, lng(places.*) as lng
from places limit 3;
