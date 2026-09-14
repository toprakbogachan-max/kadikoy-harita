-- ============================================================
--  GÖÇ 17 — profile sosyal hesaplar
--
--  NEDEN: bir pin "buraya git" diyor ama "bunu yazan kim" sorusunu tek
--  başına yanıtlamıyor. Kadıköy'de kime güveneceğini seçmek, o kişinin
--  başka nerede ne paylaştığını görmekle başlıyor. Profilde bio'nun
--  altında duran üç küçük ikon bu işi yapıyor.
--
--  Üç sütun, hepsi kullanıcı adı — TAM URL DEĞİL:
--    · "@" ve "https://..." olmadan saklanıyor, bağlantıyı arayüz kuruyor
--    · böylece kullanıcı yanlış alana tam link yapıştırsa bile tek yerde
--      (lib/veri.ts → sosyalTemizle) düzeltiliyor
--    · ve ileride ikonun yanına "@ad" yazmak istersek veri hazır
--
--  Uzunluk sınırı: üç platformun da üst sınırı 30 karakterin altında;
--  50 fazlasıyla yeter ve saçma uzunlukta veri girilmesini engelliyor.
--  Boş string YOK: temizlenince null'a düşüyor (check bunu zorluyor).
-- ============================================================

alter table profiles add column if not exists twitter   text;
alter table profiles add column if not exists instagram text;
alter table profiles add column if not exists tiktok    text;

alter table profiles drop constraint if exists profiles_sosyal_bicim;
alter table profiles add constraint profiles_sosyal_bicim check (
  (twitter   is null or twitter   ~ '^[A-Za-z0-9_.]{1,50}$') and
  (instagram is null or instagram ~ '^[A-Za-z0-9_.]{1,50}$') and
  (tiktok    is null or tiktok    ~ '^[A-Za-z0-9_.]{1,50}$')
);

-- Yazma izni GEREKMİYOR: schema.sql'deki p_profiles_write zaten
-- "id = auth.uid()" ile tüm sütunları kapsıyor, göç 15 de demo hesabı
-- salt-okunur tutuyor. Yeni sütun otomatik olarak aynı kuralın altında.

select
  (select count(*) from information_schema.columns
     where table_name = 'profiles'
       and column_name in ('twitter','instagram','tiktok')) as sutun,
  (select count(*) from pg_constraint
     where conname = 'profiles_sosyal_bicim') as kisit;
