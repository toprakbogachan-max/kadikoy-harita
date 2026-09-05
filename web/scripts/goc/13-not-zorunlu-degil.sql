-- ============================================================
--  Göç 13 — "Gitmeden bilinmesi gereken" notu zorunlu olmaktan çıkıyor
-- ============================================================
-- Sorun: pins.body en az 15 karakter istiyordu. Fotoğrafını çekip puanını
-- verip üç kelimesini yazan biri, söyleyecek somut bir şeyi olmadığında pin
-- atamıyordu. "Bir şey yazmak zorundasın" kapısı, pin ATMAMAYA yol açıyor.
--
-- Karar: alan duruyor ve formda hâlâ en üstte, ama boş bırakılabiliyor.
-- Üst sınır (1000) ve zorunlu alanların geri kalanı (üç kelime, senaryo,
-- puan, en az bir medya) aynen kalıyor.
--
-- not null KALIYOR: boş not '' olarak yazılıyor. NULL olsaydı arayüzün her
-- yerinde "null mı boş mu" ayrımı çıkardı, ikisi de aynı şey demek.
--
-- Bu dosya düz ALTER komutlarından oluşuyor; PL/pgSQL bloğu YOK.

-- 1) Eski kuralı düşür. Ad, sütun içi check için Postgres'in ürettiği ad.
alter table public.pins drop constraint if exists pins_body_check;

-- 2) Yalnızca üst sınırı koyan yeni kural.
alter table public.pins
  add constraint pins_body_check check (char_length(body) <= 1000);


-- ---- DOĞRULAMA ----
-- Aşağıdakini ayrıca çalıştır. TEK satır dönmeli ve tanımı "<= 1000"
-- içermeli; "between 15" içeren ikinci bir satır çıkarsa eski kural başka
-- bir adla duruyor demektir — o adı bana söyle, ona göre düşürelim.
--
--   select conname, pg_get_constraintdef(oid) as tanim
--     from pg_constraint
--    where conrelid = 'public.pins'::regclass
--      and contype = 'c'
--      and pg_get_constraintdef(oid) like '%char_length(body)%';


-- ---- GERİ ALMA ----
-- Önce 15 karakterden kısa notlar doldurulmalı, yoksa kısıt eklenemez.
--
--   alter table public.pins drop constraint pins_body_check;
--   alter table public.pins
--     add constraint pins_body_check check (char_length(body) between 15 and 1000);
