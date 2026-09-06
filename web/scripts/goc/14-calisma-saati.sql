-- ============================================================
--  Göç 14 — çalışma saatini künyeden girebilme
-- ============================================================
-- Sorun: places.opening_hours yalnızca tohum verisinde doluydu. Kullanıcının
-- haritadan eklediği mekanlarda null kalıyor, is_open_now() null dönüyor ve
-- mekan "saat bilgisi yok" olarak duruyordu. Girecek bir ekran da yoktu.
--
-- Neden RPC: places üstünde UPDATE politikası YOK ve olmamalı (ad, konum,
-- kategori herkesin değiştirebileceği şeyler değil). Yalnızca opening_hours'ı
-- açan, dar yetkili bir fonksiyon yazılıyor.
--
-- Yetki sınırları:
--   * giriş yapmamış çağrı reddediliyor,
--   * yalnızca 'published' mekan güncelleniyor (moderasyonla kaldırılmış bir
--     kaydı kimse geri diriltemesin),
--   * biçim doğrulanıyor: dizi, her eleman {d,open,close}, d 0..6,
--     saatler geçerli time,
--   * search_path sabit.
--
-- Künyenin geri kalanı (place_facts) wiki gibi: giriş yapan herkes yazıyor,
-- imza updated_by'da duruyor. Çalışma saati de aynı mantıkta — olgu, deneyim
-- değil. Kim yazarsa yazsın aynı cevabı vermeli.

create or replace function yer_saati_yaz(in_place uuid, in_saatler jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  rec jsonb;
  g int;
begin
  if auth.uid() is null then
    raise exception 'Giriş gerekiyor.' using errcode = '42501';
  end if;

  if in_saatler is not null then
    if jsonb_typeof(in_saatler) <> 'array' then
      raise exception 'Çalışma saati dizi olmalı.' using errcode = '22023';
    end if;
    for rec in select * from jsonb_array_elements(in_saatler) loop
      if jsonb_typeof(rec) <> 'object' then
        raise exception 'Her gün bir nesne olmalı.' using errcode = '22023';
      end if;
      g := (rec->>'d')::int;                 -- geçersizse cast hata veriyor
      if g < 0 or g > 6 then
        raise exception 'Gün 0-6 arasında olmalı.' using errcode = '22023';
      end if;
      perform (rec->>'open')::time, (rec->>'close')::time;
    end loop;
  end if;

  update places
     set opening_hours = in_saatler
   where id = in_place
     and status = 'published';

  if not found then
    raise exception 'Mekan bulunamadı.' using errcode = 'P0002';
  end if;
end $$;

revoke all on function yer_saati_yaz(uuid, jsonb) from public, anon;
grant execute on function yer_saati_yaz(uuid, jsonb) to authenticated;


-- ---- DOĞRULAMA ----
-- Fonksiyon var mı (1 dönmeli):
--   select count(*) from pg_proc where proname = 'yer_saati_yaz';
--
-- Uygulamadan bir mekana saat girip haritada jetonun soluk/kesik olmaktan
-- çıktığını görmek yeterli.


-- ---- GERİ ALMA ----
--   drop function if exists yer_saati_yaz(uuid, jsonb);
