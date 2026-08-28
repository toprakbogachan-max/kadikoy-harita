-- ============================================================
--  GÖÇ 09 — spatial_ref_sys yazmaya kapatıldı (trigger ile)
--
--  SORUN (ölçüldü, tahmin değil): anon anahtarla
--    INSERT → 201 · UPDATE → 204 · DELETE → 204
--  yapılabiliyor. Test sırasında srid 4326 (WGS 84) gerçekten silindi ve
--  places_nearby "Cannot find SRID" ile çöktü; harita tamamen karardı.
--  Satır geri kondu, ama açık gerçek: bağlantıyı bilen biri haritayı
--  tek istekle durdurabilir.
--
--  NEDEN REVOKE VE RLS OLMUYOR:
--    tablonun sahibi supabase_admin, biz postgres'iz ve üyesi değiliz.
--    · REVOKE yalnızca yetkiyi VEREN rol tarafından yapılabilir →
--      komut hata vermeden hiçbir şey yapmıyor (PostgreSQL uyarı verir,
--      hata değil; bu yüzden ilk denemede "çalıştı" sanmıştık)
--    · ALTER TABLE ... ENABLE RLS sahiplik istiyor → yetkimiz yok
--    · PostGIS SET SCHEMA'yı desteklemiyor, eklentiyi taşımak da yok
--
--  ÇÖZÜM: yetki listesinde TRIGGER var ve trigger oluşturmak sahiplik
--  değil TRIGGER yetkisi istiyor. Yazma denemelerini trigger reddediyor.
--
--  DİKKAT: PostGIS sürüm yükseltmesi bu tabloya yazar. Yükseltmeden önce
--    drop trigger spatial_ref_sys_koruma on public.spatial_ref_sys;
--  çalıştırılmalı, sonra bu göç tekrar uygulanmalı.
-- ============================================================

create or replace function public.spatial_ref_sys_yazma_engeli()
returns trigger language plpgsql as $$
begin
  raise exception
    'spatial_ref_sys salt okunur (goc 09). PostGIS yukseltmesi icin trigger gecici olarak dusurulmeli.'
    using errcode = 'insufficient_privilege';
end $$;

drop trigger if exists spatial_ref_sys_koruma on public.spatial_ref_sys;
create trigger spatial_ref_sys_koruma
  before insert or update or delete on public.spatial_ref_sys
  for each statement execute function public.spatial_ref_sys_yazma_engeli();

-- doğrulama
select 'trigger kuruldu mu' as soru,
       (select count(*)::text from pg_trigger
        where tgrelid = 'public.spatial_ref_sys'::regclass
          and tgname = 'spatial_ref_sys_koruma') as cevap
union all
select 'satir sayisi (8500 olmali)',
       (select count(*)::text from public.spatial_ref_sys)
union all
select 'srid 4326 duruyor mu',
       (select count(*)::text from public.spatial_ref_sys where srid = 4326);
