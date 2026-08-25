-- ============================================================
--  GÖÇ 03 — pin fotoğrafları için Storage kovası
--
--  Şema en az bir medya zorunlu kılıyor (assert_pin_has_media trigger'ı),
--  bu yüzden pin atma formu gerçek dosya yükleyebilmeli.
--
--  Kova PUBLIC okunur: pin fotoğrafları zaten herkese açık pinlerin parçası,
--  imzalı URL üretmek her kart için ekstra istek demek olurdu.
--  YAZMA kısıtlı: kullanıcı yalnızca kendi klasörüne (kimliğiyle adlandırılmış)
--  yükleyebilir — böylece kimse başkasının medyasını ezemez.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pin-media', 'pin-media', true,
  20971520,   -- 20 MB; telefon fotoğrafı için bol, video için sınır
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Politikalar storage.objects üzerinde. Yol düzeni: <kullanıcı-kimliği>/<dosya>
-- storage.foldername(name) yolu parçalara ayırıyor, [1] ilk klasör.
drop policy if exists p_pinmedya_oku    on storage.objects;
drop policy if exists p_pinmedya_yaz    on storage.objects;
drop policy if exists p_pinmedya_guncel on storage.objects;
drop policy if exists p_pinmedya_sil    on storage.objects;

create policy p_pinmedya_oku on storage.objects for select
  using (bucket_id = 'pin-media');

create policy p_pinmedya_yaz on storage.objects for insert
  with check (
    bucket_id = 'pin-media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy p_pinmedya_guncel on storage.objects for update
  using (bucket_id = 'pin-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy p_pinmedya_sil on storage.objects for delete
  using (bucket_id = 'pin-media' and (storage.foldername(name))[1] = auth.uid()::text);

select id, public, file_size_limit from storage.buckets where id = 'pin-media';
