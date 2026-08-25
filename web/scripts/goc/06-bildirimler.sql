-- ============================================================
--  GÖÇ 06 — bildirimler
--
--  Prototipte akışta bir zil rozeti vardı ama arkasında hiçbir şey yoktu.
--  Bildirim, olay olduğu ANDA yazılmalı: sonradan "beni kim beğendi"
--  diye sorgulamak, okundu/okunmadı bilgisini tutmayı imkânsız kılar.
--
--  Trigger'lar security definer: bildirimi ALICI adına yazıyoruz, eylemi
--  yapan kişi adına değil. RLS altında olsalardı Elif, Bogaç'ın bildirim
--  satırını açamazdı (aynı tuzağa göç 02'de düşmüştük).
-- ============================================================

do $$ begin
  create type notification_kind as enum ('like','comment','follow');
exception when duplicate_object then null; end $$;

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,   -- alıcı
  actor_id   uuid not null references profiles(id) on delete cascade,   -- eylemi yapan
  kind       notification_kind not null,
  pin_id     uuid references pins(id) on delete cascade,
  comment_id uuid references pin_comments(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  -- Kendi eylemin bildirim üretmez
  check (user_id <> actor_id)
);

create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);
create index if not exists notifications_okunmamis_idx
  on notifications (user_id) where read_at is null;

-- ---------- olay → bildirim ----------
create or replace function bildirim_yaz() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  alici uuid;
  yapan uuid;
  tur   notification_kind;
  pin   uuid;
  yorum uuid;
begin
  if tg_table_name = 'pin_likes' then
    select author_id into alici from pins where id = new.pin_id;
    yapan := new.user_id; tur := 'like'; pin := new.pin_id;

  elsif tg_table_name = 'pin_comments' then
    select author_id into alici from pins where id = new.pin_id;
    yapan := new.author_id; tur := 'comment'; pin := new.pin_id; yorum := new.id;

  elsif tg_table_name = 'follows' then
    alici := new.following_id; yapan := new.follower_id; tur := 'follow';
  end if;

  -- Alıcı yoksa (pin silinmiş) ya da kendi eylemiyse bildirim yok.
  -- check kısıtı zaten reddederdi ama trigger'da patlamak insert'i de
  -- geri alırdı; sessizce atlıyoruz.
  if alici is null or alici = yapan then
    return null;
  end if;

  insert into notifications (user_id, actor_id, kind, pin_id, comment_id)
  values (alici, yapan, tur, pin, yorum);
  return null;
end $$;

drop trigger if exists trg_bildirim_begeni on pin_likes;
create trigger trg_bildirim_begeni after insert on pin_likes
  for each row execute function bildirim_yaz();

drop trigger if exists trg_bildirim_yorum on pin_comments;
create trigger trg_bildirim_yorum after insert on pin_comments
  for each row execute function bildirim_yaz();

drop trigger if exists trg_bildirim_takip on follows;
create trigger trg_bildirim_takip after insert on follows
  for each row execute function bildirim_yaz();

-- ---------- RLS ----------
alter table notifications enable row level security;

drop policy if exists p_bildirim_oku      on notifications;
drop policy if exists p_bildirim_guncelle on notifications;
drop policy if exists p_bildirim_sil      on notifications;

-- Bildirimlerini yalnızca sahibi görür
create policy p_bildirim_oku on notifications for select
  using (user_id = auth.uid());

-- Okundu işaretlemek için
create policy p_bildirim_guncelle on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy p_bildirim_sil on notifications for delete
  using (user_id = auth.uid());

-- INSERT policy'si YOK: bildirimi yalnızca trigger yazar. İstemci
-- kendi adına sahte bildirim üretememeli.

-- ---------- şikayet: okuma da lazımdı ----------
-- reports'ta yalnızca insert policy'si vardı; kişi kendi şikayetini
-- göremiyordu (iki kez şikayet etmesin diye arayüz kontrol edecek).
drop policy if exists p_reports_read on reports;
create policy p_reports_read on reports for select
  using (reporter_id = auth.uid());

select
  (select count(*) from pg_policies where tablename = 'notifications') as bildirim_policy,
  (select count(*) from pg_trigger t join pg_proc p on p.oid = t.tgfoid
     where p.proname = 'bildirim_yaz') as bildirim_trigger,
  (select prosecdef from pg_proc where proname = 'bildirim_yaz') as security_definer;
