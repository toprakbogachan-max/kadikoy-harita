-- ============================================================
--  Göç 12 — yer_bul_ya_da_olustur(): kopya mekan üretmeyi engeller
-- ============================================================
-- Sorun: göç 11 mekanları silmiyor, status'ünü 'hidden' yapıyor. Gizli kayıt
-- RLS yüzünden istemciye görünmüyor (p_places_read yalnızca 'published'),
-- ama Photon coğrafi araması onu yine buluyor. Pin formundaki tekilleştirme
-- Photon sonuçlarını BİZİM arama sonuçlarımızla karşılaştırdığı için gizli
-- kayıt elenmiyordu: kullanıcı "Baylan Pastanesi"ni ekleyince veritabanında
-- ikinci bir Baylan Pastanesi açılacaktı.
--
-- Karar: gizli olmak "yok" demek değil, "haritayı kalabalıklaştırma" demek.
-- İlk pin mekanı haritaya geri getiriyor.
--
-- Neden security definer: gizli satırı görmek de status'ü değiştirmek de
-- istemcinin yetkisi dışında (places'ta UPDATE politikası hiç yok).
-- Yetki dar tutuldu:
--   * giriş yapmamış çağrı reddediliyor,
--   * yalnızca 'hidden' geri açılıyor — 'removed' ASLA, o moderasyon kararı,
--   * eşleşme için ad AYNI ve mesafe 30 m'den yakın olmak zorunda,
--   * search_path sabit.

create or replace function public.yer_bul_ya_da_olustur(
  in_ad   text,
  in_tur  place_category,
  in_lat  double precision,
  in_lng  double precision,
  in_semt text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kisi  uuid := auth.uid();
  v_nokta geography := st_setsrid(st_point(in_lng, in_lat), 4326)::geography;
  v_ad    text := lower(translate(btrim(in_ad),
                        'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'));
  v_id    uuid;
  v_taban text;
  v_slug  text;
begin
  if v_kisi is null then
    raise exception 'Giriş gerekiyor.' using errcode = '42501';
  end if;
  if length(btrim(in_ad)) < 2 then
    raise exception 'Mekan adı çok kısa.' using errcode = '22023';
  end if;

  -- Aynı adla, 30 m içinde kayıt var mı? Gizliler dahil.
  select id into v_id
    from places
   where status in ('published', 'hidden')
     and lower(translate(name, 'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu')) = v_ad
     and st_dwithin(geo, v_nokta, 30)
   order by st_distance(geo, v_nokta)
   limit 1;

  if v_id is not null then
    update places set status = 'published'
     where id = v_id and status = 'hidden';
    return v_id;
  end if;

  -- Yeni kayıt. Slug çakışırsa sona kısa bir ek.
  v_taban := left(coalesce(nullif(btrim(regexp_replace(v_ad, '[^a-z0-9]+', '-', 'g'), '-'), ''), 'mekan'), 50);
  v_slug  := v_taban;
  for i in 1..5 loop
    begin
      insert into places (slug, name, category, neighborhood, geo, opening_hours, created_by)
      values (v_slug, btrim(in_ad), in_tur,
              coalesce(nullif(btrim(coalesce(in_semt, '')), ''), 'Kadıköy'),
              v_nokta, null, v_kisi)
      returning id into v_id;
      return v_id;
    exception when unique_violation then
      v_slug := v_taban || '-' || substr(md5(random()::text), 1, 4);
    end;
  end loop;

  raise exception 'Mekan eklenemedi, adı biraz değiştirip tekrar dene.';
end $$;

notify pgrst, 'reload schema';

-- Doğrulama: fonksiyon var mı ve search_path sabit mi?
select p.proname,
       p.prosecdef        as security_definer,
       p.proconfig        as ayarlar
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'yer_bul_ya_da_olustur';
