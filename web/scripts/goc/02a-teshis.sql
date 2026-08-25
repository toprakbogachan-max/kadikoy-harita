-- ============================================================
--  TEŞHİS — göç 02 neden uygulanmadı?
--  Bu dosya HİÇBİR ŞEY DEĞİŞTİRMEZ, sadece durumu okur.
-- ============================================================

select
  'bump_counter security definer mi' as soru,
  coalesce((select prosecdef::text from pg_proc
            where proname = 'bump_counter'
              and pronamespace = 'public'::regnamespace), 'FONKSIYON YOK') as cevap
union all
select 'fonksiyonun sahibi',
  coalesce((select pg_get_userbyid(proowner) from pg_proc
            where proname = 'bump_counter'
              and pronamespace = 'public'::regnamespace), '-')
union all
select 'su an hangi roldeyim', current_user
union all
select 'trigger sayisi (5 olmali)',
  (select count(*)::text from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
     join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and not t.tgisinternal
     and t.tgfoid = (select oid from pg_proc
                     where proname = 'bump_counter'
                       and pronamespace = 'public'::regnamespace))
union all
select 'gercek begeni satiri', (select count(*)::text from pin_likes)
union all
select 'pins.like_count toplami', (select coalesce(sum(like_count),0)::text from pins);
