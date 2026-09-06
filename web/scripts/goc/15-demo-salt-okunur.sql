-- ============================================================
--  15. DEMO HESAPLAR SALT-OKUNUR
-- ============================================================
-- Depo herkese açık ve demo hesapların şifresi (demo12345) belgelerde yazılı.
-- Amaç, demo hesapla giren birinin uygulamayı gezebilmesi ama canlı haritaya
-- hiçbir şey yazamaması.
--
-- Kimlik testi JWT'deki e-postadan yapılıyor: demo hesapların hepsi
-- @demo.invalid uzantılı. auth.users tablosunu okumaya gerek yok, dolayısıyla
-- security definer bir fonksiyona da gerek yok.
--
-- Okuma politikalarına dokunulmadı — demo hesap her şeyi görmeye devam eder.

create or replace function public.demo_hesap()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') like '%@demo.invalid'
$$;

comment on function public.demo_hesap() is
  'Oturumdaki kullanıcı bir demo hesabı mı. Yazma politikalarında kullanılır.';

-- ---- yazma politikaları: hepsine "ve demo değil" koşulu ekleniyor ----

drop policy if exists p_profiles_write on profiles;
create policy p_profiles_write on profiles for update
  using (id = auth.uid() and not public.demo_hesap());

drop policy if exists p_profiles_insert on profiles;
create policy p_profiles_insert on profiles for insert
  with check (id = auth.uid() and not public.demo_hesap());

drop policy if exists p_places_insert on places;
create policy p_places_insert on places for insert
  with check (auth.uid() is not null and not public.demo_hesap());

drop policy if exists p_facts_ekle on place_facts;
create policy p_facts_ekle on place_facts for insert
  with check (auth.uid() is not null and updated_by = auth.uid()
              and not public.demo_hesap());

drop policy if exists p_facts_guncelle on place_facts;
create policy p_facts_guncelle on place_facts for update
  using (auth.uid() is not null and not public.demo_hesap())
  with check (updated_by = auth.uid() and not public.demo_hesap());

drop policy if exists p_pins_insert on pins;
create policy p_pins_insert on pins for insert
  with check (author_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_pins_update on pins;
create policy p_pins_update on pins for update
  using (author_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_pins_delete on pins;
create policy p_pins_delete on pins for delete
  using (author_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_media_write on pin_media;
create policy p_media_write on pin_media for all
  using (not public.demo_hesap() and exists (
    select 1 from pins where pins.id = pin_media.pin_id and pins.author_id = auth.uid()))
  with check (not public.demo_hesap() and exists (
    select 1 from pins where pins.id = pin_media.pin_id and pins.author_id = auth.uid()));

drop policy if exists p_likes_write on pin_likes;
create policy p_likes_write on pin_likes for all
  using (user_id = auth.uid() and not public.demo_hesap())
  with check (user_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_comments_insert on pin_comments;
create policy p_comments_insert on pin_comments for insert
  with check (author_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_comments_delete on pin_comments;
create policy p_comments_delete on pin_comments for delete
  using (author_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_follows_write on follows;
create policy p_follows_write on follows for all
  using (follower_id = auth.uid() and not public.demo_hesap())
  with check (follower_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_saves_write on saves;
create policy p_saves_write on saves for all
  using (user_id = auth.uid() and not public.demo_hesap())
  with check (user_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_lists_write on lists;
create policy p_lists_write on lists for all
  using (owner_id = auth.uid() and not public.demo_hesap())
  with check (owner_id = auth.uid() and not public.demo_hesap());

drop policy if exists p_list_items_write on list_items;
create policy p_list_items_write on list_items for all
  using (not public.demo_hesap() and exists (
    select 1 from lists where lists.id = list_items.list_id and lists.owner_id = auth.uid()))
  with check (not public.demo_hesap() and exists (
    select 1 from lists where lists.id = list_items.list_id and lists.owner_id = auth.uid()));

drop policy if exists p_reports_insert on reports;
create policy p_reports_insert on reports for insert
  with check (auth.uid() is not null and not public.demo_hesap());

-- ---- Storage: demo hesap dosya yükleyemesin ----
-- 03-depolama.sql / 03b-depolama-politikalari.sql ile açılan yükleme
-- politikalarının adları kuruluma göre değişebiliyor; bu yüzden burada
-- doğrudan yeniden yazmak yerine tek bir engel politikası eklenmiyor.
-- Yazma zaten pins/pin_media üzerinden kapalı olduğu için demo hesap
-- yüklediği dosyayı hiçbir kayda bağlayamaz.

-- ---- doğrulama ----
-- Demo hesapla giriş yapıp aşağıdakini çalıştırırsan true dönmeli:
--   select public.demo_hesap();
-- Ardından bir pin atmayı dene; "new row violates row-level security policy"
-- hatası beklenen sonuç.
