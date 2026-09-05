-- ============================================================
--  Göç 13 — "Gitmeden bilinmesi gereken" notu zorunlu olmaktan çıkıyor
-- ============================================================
-- Sorun: pins.body en az 15 karakter istiyordu. Fotoğrafını çekip puanını
-- verip üç kelimesini yazan biri, söyleyecek somut bir şeyi olmadığında pin
-- atamıyordu. "Bir şey yazmak zorundasın" kapısı, pin ATMAMAYA yol açıyor.
--
-- Karar: alan duruyor ve formda hâlâ en üstte, ama boş bırakılabiliyor.
-- Üst sınır (1000) ve zorunlu alanların geri kalanı (üç kelime, senaryo,
-- puan, en az bir medya) aynen kalıyor — kalite kapısı tamamen açılmıyor,
-- yalnızca en çok yazı isteyen basamağı isteğe bağlı oluyor.
--
-- not null KALIYOR: boş not '' olarak yazılıyor. NULL yapılsaydı arayüzün
-- her yerinde "null mı boş mu" ayrımı çıkardı, ikisi de aynı şey demek.
--
-- Kısıt ADIYLA değil TANIMIYLA bulunuyor: şema dosyasında satır içi
-- yazıldığı için adı Postgres'in ürettiği ada (pins_body_check) bağlı ve
-- elle değiştirilmiş olabilir. Yanlış adı düşürüp yenisini eklemek eskisini
-- yürürlükte bırakırdı, yani göç sessizce işe yaramazdı.

begin;

do $$
declare
  k record;
begin
  for k in
    select conname
      from pg_constraint
     where conrelid = 'public.pins'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%char_length(body)%'
  loop
    execute format('alter table public.pins drop constraint %I', k.conname);
  end loop;
end $$;

alter table public.pins
  add constraint pins_body_check check (char_length(body) <= 1000);

commit;

-- Doğrulama — tek satır ve "<= 1000" içermeli, "between 15" İÇERMEMELİ:
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.pins'::regclass
--      and contype = 'c'
--      and pg_get_constraintdef(oid) ilike '%char_length(body)%';
--
-- Geri alma (önce 15 karakterden kısa notlar doldurulmalı, yoksa kısıt
-- eklenemez):
--   alter table public.pins drop constraint pins_body_check;
--   alter table public.pins add constraint pins_body_check
--     check (char_length(body) between 15 and 1000);
