-- ============================================================
--  RLS gercekten acilabiliyor mu — kesin cevap
--  Hicbir kalici degisiklik yapmaz; basarisiz olursa hatayi gosterir.
-- ============================================================
do $$
begin
  execute 'alter table public.spatial_ref_sys enable row level security';
  raise notice 'RLS ACILDI — beklenmedik, linter uyarisi gecmeli';
exception when others then
  raise notice 'RLS ACILAMADI → %  (SQLSTATE %)', sqlerrm, sqlstate;
end $$;

select 'RLS su an acik mi' as soru,
       (select relrowsecurity::text from pg_class
        where oid = 'public.spatial_ref_sys'::regclass) as cevap
union all
select 'yazma korumasi (trigger) var mi',
       (select count(*)::text from pg_trigger
        where tgrelid = 'public.spatial_ref_sys'::regclass
          and tgname = 'spatial_ref_sys_koruma')
union all
select 'satir sayisi',
       (select count(*)::text from public.spatial_ref_sys);
