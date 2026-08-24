-- ============================================================
--  TOHUM TEMİZLİĞİ — geliştirme verisini tamamen siler
--
--  GERÇEK KULLANICI GELMEDEN ÖNCE ÇALIŞTIR.
--  Siler: hayali "demo-" mekanlar, demo hesaplar ve onlara bağlı
--  her şey (pin, medya, yorum, beğeni, liste, takip).
--  DOKUNMAZ: OpenStreetMap'ten gelen gerçek mekanlar.
--
--  Silme sırası önemli değil — şemadaki tüm bağlar "on delete cascade".
-- ============================================================

-- 1) demo hesaplar: auth.users silinince profiles → pins → pin_media
--    zinciri kaskadla gider
delete from auth.users where email like '%@demo.invalid';

-- 2) prototipin hayali mekanları
delete from places where slug like 'demo-%';

-- 3) gerçek mekanlara demo dışı bir yerden pin düştüyse diye:
--    dosya yolu demo:// ile başlayan medyayı ve sahipsiz pinleri temizle
delete from pin_media where storage_path like 'demo://%';

-- doğrulama — hepsi 0 olmalı, "gercek mekan" ise ~1000
select 'demo hesap'  as ne, count(*) from auth.users where email like '%@demo.invalid'
union all select 'demo mekan',  count(*) from places where slug like 'demo-%'
union all select 'demo medya',  count(*) from pin_media where storage_path like 'demo://%'
union all select 'pin',         count(*) from pins
union all select 'gercek mekan', count(*) from places;
