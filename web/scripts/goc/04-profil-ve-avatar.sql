-- ============================================================
--  GÖÇ 04 — profil fotoğrafı ve profil gizliliği
--
--  1) avatars kovası: profil fotoğrafları pin medyasından ayrı dursun.
--     Aynı kovaya koymak "pin-media" adını yalan yapardı ve ileride pin
--     medyasını topluca temizlemek istersek avatarlar da gider.
--
--  2) profiles.is_public: "Profilim herkese açık" ayarı. Prototipte vardı ama
--     yalnızca arayüzdeydi — kapalıyken bile veriyi herkes okuyabiliyordu.
--     Gerçekten gizlemek için okuma policy'si buna bakmalı.
-- ============================================================

-- ---------- 1. avatar kovası ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,   -- 2 MB; avatar zaten küçültülüp yükleniyor
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists p_avatar_oku    on storage.objects;
drop policy if exists p_avatar_yaz    on storage.objects;
drop policy if exists p_avatar_guncel on storage.objects;
drop policy if exists p_avatar_sil    on storage.objects;

create policy p_avatar_oku on storage.objects for select
  using (bucket_id = 'avatars');

-- Yol düzeni: <kullanıcı-kimliği>/<dosya>
create policy p_avatar_yaz on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy p_avatar_guncel on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy p_avatar_sil on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 2. profil gizliliği ----------
alter table profiles add column if not exists is_public boolean not null default true;

-- Gizli profil gerçekten gizli olmalı. Kendi profilini her zaman görürsün.
drop policy if exists p_profiles_read on profiles;
create policy p_profiles_read on profiles for select
  using (is_public or id = auth.uid());

select
  (select count(*) from storage.buckets where id = 'avatars') as avatar_kovasi,
  (select count(*) from pg_policies
     where schemaname = 'storage' and policyname like 'p_avatar%') as avatar_policy,
  (select count(*) from profiles where is_public) as acik_profil;
