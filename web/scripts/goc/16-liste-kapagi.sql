-- ============================================================
--  GÖÇ 16 — liste kapağı ve kadrajı
--
--  KARAR: mekanın kapağını kimse seçmiyor (göç 07), ama LİSTENİN kapağını
--  sahibi seçiyor. İkisi farklı şeyler:
--    · mekan  → ortak bir gerçeklik, oraya gidenlerin fotoğrafı temsil eder
--    · liste  → birinin kişisel seçkisi, kapağı da o seçkinin bir parçası
--  "Yağmurlu günde Kadıköy" listesinin kapağı yağmurlu bir cam olmalı, o
--  listedeki en çok beğenilen pinin fotoğrafı değil.
--
--  İki sütun:
--    cover_url  tam genel URL (profiles.avatar_url ile aynı kalıp)
--    cover_pos  dikey kadraj, 0–100. Kare kartta fotoğrafın hangi bandının
--               görüneceği. object-position'ın yüzdesi. Kapağı "istediği
--               gibi yerleştirme" bu sütunda yaşıyor: kullanıcı önizlemede
--               fotoğrafı yukarı aşağı sürüklüyor, yüzde buraya yazılıyor.
--               Varsayılan 50 = ortadan.
--
--  Kova neden ayrı (pin-media ya da avatars değil):
--    · pin-media bir gün topluca temizlenirse liste kapakları da giderdi
--    · avatars 2 MB sınırlı ve "avatar" adı yalan olurdu
--  Yol düzeni her üçünde de aynı: <kullanıcı-kimliği>/<dosya>. RLS bu
--  düzene dayanıyor, bozma.
-- ============================================================

-- ---------- 1. sütunlar ----------
alter table lists add column if not exists cover_url text;
alter table lists add column if not exists cover_pos smallint not null default 50;

-- Kadraj yüzde; arayüz hatası yüzünden 900 yazılırsa kart bozulur.
alter table lists drop constraint if exists lists_cover_pos_araligi;
alter table lists add constraint lists_cover_pos_araligi
  check (cover_pos between 0 and 100);

-- ---------- 2. list-covers kovası ----------
-- Kova SQL'le açılamıyorsa (göç 03b'deki sahiplik sorunu) panelden aç:
--   Storage → New bucket → adı "list-covers" → Public bucket AÇIK → Save
-- sonra bu dosyanın yalnızca policy kısmını çalıştır.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('list-covers', 'list-covers', true, 3145728,   -- 3 MB; kapak zaten 640px'e küçültülüp yükleniyor
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists p_listekapak_oku    on storage.objects;
drop policy if exists p_listekapak_yaz    on storage.objects;
drop policy if exists p_listekapak_guncel on storage.objects;
drop policy if exists p_listekapak_sil    on storage.objects;

create policy p_listekapak_oku on storage.objects for select
  using (bucket_id = 'list-covers');

-- Yol düzeni: <kullanıcı-kimliği>/<dosya>
create policy p_listekapak_yaz on storage.objects for insert
  with check (bucket_id = 'list-covers' and auth.uid() is not null
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy p_listekapak_guncel on storage.objects for update
  using (bucket_id = 'list-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy p_listekapak_sil on storage.objects for delete
  using (bucket_id = 'list-covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 3. güncelleme izni ----------
-- Ek policy GEREKMİYOR: schema.sql'deki p_lists_write "for all" olduğu için
-- update'i de kapsıyor (göç 15 demo kısıtıyla birlikte yeniden yazıyor).
-- Buraya bakan bir sonraki kişi "kapak update'i RLS'e takılır mı" diye
-- düşünmesin diye yazıldı — takılmaz, ama demo hesapta bilerek takılır.

select
  (select count(*) from information_schema.columns
     where table_name = 'lists' and column_name in ('cover_url','cover_pos')) as sutun,
  (select count(*) from storage.buckets where id = 'list-covers') as kova,
  (select count(*) from pg_policies
     where schemaname = 'storage' and policyname like 'p_listekapak%') as kova_policy;
