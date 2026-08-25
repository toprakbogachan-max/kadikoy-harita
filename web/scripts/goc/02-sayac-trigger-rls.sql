-- ============================================================
--  GÖÇ 02 — sayaç trigger'ı RLS'i aşamıyordu
--
--  SORUN: bump_counter() security definer değildi. Trigger'ın içindeki
--  UPDATE'ler de RLS'e tabi olduğu için:
--    · Elif, Bogaç'ın pinini beğeniyor → trigger `update pins set
--      like_count = like_count + 1` çalıştırıyor → p_pins_update policy'si
--      author_id = auth.uid() istiyor → Elif yazar değil → 0 satır güncellendi.
--    · Kaydetme → `update places set save_count` → places'ta UPDATE policy'si
--      hiç yok → yine 0 satır.
--  Hata verilmiyor, sayaç sessizce olduğu yerde kalıyor. Yani beğeni/kaydetme
--  sayıları yalnızca kendi içeriğinde doğruydu.
--
--  ÇÖZÜM: security definer + sabit search_path.
-- ============================================================

create or replace function bump_counter() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'pins' then
    if tg_op = 'INSERT' then
      update places   set pin_count = pin_count + 1 where id = new.place_id;
      update profiles set pin_count = pin_count + 1 where id = new.author_id;
    elsif tg_op = 'DELETE' then
      update places   set pin_count = greatest(pin_count - 1, 0) where id = old.place_id;
      update profiles set pin_count = greatest(pin_count - 1, 0) where id = old.author_id;
    end if;

  elsif tg_table_name = 'pin_likes' then
    if tg_op = 'INSERT' then
      update pins set like_count = like_count + 1 where id = new.pin_id;
    else
      update pins set like_count = greatest(like_count - 1, 0) where id = old.pin_id;
    end if;

  elsif tg_table_name = 'pin_comments' then
    if tg_op = 'INSERT' then
      update pins set comment_count = comment_count + 1 where id = new.pin_id;
    else
      update pins set comment_count = greatest(comment_count - 1, 0) where id = old.pin_id;
    end if;

  elsif tg_table_name = 'follows' then
    if tg_op = 'INSERT' then
      update profiles set follower_count  = follower_count  + 1 where id = new.following_id;
      update profiles set following_count = following_count + 1 where id = new.follower_id;
    else
      update profiles set follower_count  = greatest(follower_count - 1, 0)  where id = old.following_id;
      update profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    end if;

  elsif tg_table_name = 'saves' then
    if tg_op = 'INSERT' then
      update places set save_count = save_count + 1 where id = new.place_id;
    else
      update places set save_count = greatest(save_count - 1, 0) where id = old.place_id;
    end if;
  end if;
  return null;
end $$;

-- Sayaçları gerçek satır sayısıyla yeniden hesapla (bozuk dönemden kalanlar için)
update pins p set
  like_count    = (select count(*) from pin_likes    where pin_id = p.id),
  comment_count = (select count(*) from pin_comments where pin_id = p.id and status = 'published');

update places pl set
  pin_count  = (select count(*) from pins  where place_id = pl.id and status = 'published'),
  save_count = (select count(*) from saves where place_id = pl.id);

update profiles pr set
  pin_count       = (select count(*) from pins    where author_id = pr.id and status = 'published'),
  follower_count  = (select count(*) from follows where following_id = pr.id),
  following_count = (select count(*) from follows where follower_id  = pr.id);

select 'trigger security definer' as ne,
       (select prosecdef from pg_proc where proname = 'bump_counter') as deger;
