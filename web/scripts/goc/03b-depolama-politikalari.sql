-- ============================================================
--  GÖÇ 03b — SADECE POLİTİKALAR
--
--  Kovayı önce PANELDEN aç:
--    Storage → New bucket → adı "pin-media" → Public bucket AÇIK → Save
--
--  Kova SQL'le açılamıyorsa sebebi şu: storage.objects tablosunun sahibi
--  supabase_storage_admin, postgres değil. Yeni projelerde postgres o tabloya
--  policy ekleyemiyor ("must be owner of table objects") ve SQL Editor tek
--  işlem olduğu için kova insert'i de geri alınıyor.
--
--  Bu dosya da aynı sebeple patlarsa politikaları panelden gir:
--    Storage → pin-media → Policies → New policy
--  (aşağıdaki using/with check ifadeleri aynen kullanılabilir)
-- ============================================================

drop policy if exists p_pinmedya_oku    on storage.objects;
drop policy if exists p_pinmedya_yaz    on storage.objects;
drop policy if exists p_pinmedya_guncel on storage.objects;
drop policy if exists p_pinmedya_sil    on storage.objects;

-- Okuma: pin fotoğrafları zaten herkese açık pinlerin parçası
create policy p_pinmedya_oku on storage.objects for select
  using (bucket_id = 'pin-media');

-- Yazma: yalnızca kendi kimliğiyle adlandırılmış klasöre
-- (yol düzeni: <kullanıcı-kimliği>/<dosya>)
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

select policyname from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'p_pinmedya%';
