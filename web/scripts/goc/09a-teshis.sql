-- ============================================================
--  TEŞHİS — spatial_ref_sys yetkileri neden geri alınamıyor?
--  Hiçbir şey değiştirmez, sadece okur.
--
--  REVOKE, yetkiyi VEREN rol değilsen sessizce başarısız olur:
--  PostgreSQL hata değil uyarı verir, komut "başarılı" görünür.
-- ============================================================

select 'tablonun sahibi' as soru,
       (select pg_get_userbyid(relowner)
        from pg_class where oid = 'public.spatial_ref_sys'::regclass) as cevap
union all
select 'ben kimim', current_user
union all
select 'sahibin uyesi miyim',
       pg_has_role(current_user,
         (select relowner from pg_class where oid='public.spatial_ref_sys'::regclass),
         'MEMBER')::text
union all
select 'yetkiyi veren (grantor)',
       coalesce((select string_agg(distinct grantor, ', ')
                 from information_schema.role_table_grants
                 where table_name='spatial_ref_sys' and table_schema='public'
                   and grantee in ('anon','authenticated')), 'yetki yok')
union all
select 'anon yetkileri',
       coalesce((select string_agg(privilege_type, ', ' order by privilege_type)
                 from information_schema.role_table_grants
                 where table_name='spatial_ref_sys' and table_schema='public'
                   and grantee='anon'), 'yok')
union all
select 'authenticated yetkileri',
       coalesce((select string_agg(privilege_type, ', ' order by privilege_type)
                 from information_schema.role_table_grants
                 where table_name='spatial_ref_sys' and table_schema='public'
                   and grantee='authenticated'), 'yok')
union all
select 'RLS acik mi',
       (select relrowsecurity::text from pg_class
        where oid='public.spatial_ref_sys'::regclass)
union all
select 'postgis hangi semada',
       (select nspname from pg_extension e
        join pg_namespace n on n.oid = e.extnamespace where extname='postgis');
