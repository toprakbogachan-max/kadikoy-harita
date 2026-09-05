-- ============================================================
--  Kadıköy Harita — Supabase / Postgres şeması (sosyal sürüm)
--  Merkez nesne: PIN (bir kullanıcının bir mekana bıraktığı gönderi)
--  places = kanonik mekan kaydı, pins = üstünde biriken içerik
-- ============================================================

create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ---------- enum'lar ----------
do $$ begin
  create type place_category as enum ('kahve','yemek','bar','tatli','kultur','park','otel','magaza','diger');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft','published','hidden','removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_platform as enum ('tiktok','instagram','youtube','web','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('photo','video');
exception when duplicate_object then null; end $$;

-- ============================================================
--  1. PROFİLLER
-- ============================================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name  text not null,
  bio           text check (char_length(bio) <= 200),
  avatar_url    text,
  home_city     text default 'İstanbul',
  is_verified   boolean not null default false,
  -- sayaçlar (trigger'la güncellenir, her seferinde count(*) atmamak için)
  pin_count      integer not null default 0,
  follower_count integer not null default 0,
  following_count integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists profiles_username_trgm on profiles using gin (username gin_trgm_ops);

-- Profiller için de aynısı: "bogac" araması "Bogaç"ı bulsun.
alter table profiles add column if not exists search_text text
  generated always as (
    lower(translate(display_name || ' ' || username,
                    'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'))
  ) stored;
create index if not exists profiles_search_trgm on profiles using gin (search_text gin_trgm_ops);

-- ============================================================
--  2. MEKANLAR (kanonik kayıt — aynı yere 50 pin atılınca 50 mekan olmasın)
-- ============================================================
create table if not exists places (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  category      place_category not null,
  neighborhood  text,
  address       text,
  geo           geography(Point, 4326) not null,
  google_place_id text unique,
  google_synced_at timestamptz,        -- Google ToS: place_id dışındaki alanlar ~30 gün cache
  -- [{"d":1,"open":"08:00","close":"22:00"}, ...]
  -- NULL = saat bilgisi YOK (kapali degil). is_open_now() bu durumda null doner,
  -- arayuz "saat bilgisi yok" gosterir. Kullanicinin ekledigi mekanlar boyle baslar.
  opening_hours jsonb,
  phone         text,
  website       text,
  status        content_status not null default 'published',
  -- Referans görseli: yalnızca serbest lisanslı kaynaklardan (Wikimedia Commons).
  -- Kullanıcı fotoğrafı DEĞİL — o pin_media'da durur. Arayüz bunu "kapak" olarak
  -- gösterir ve cover_credit'i görünür yerde yazmak ZORUNDA (CC-BY / CC-BY-SA gereği).
  cover_url     text,
  cover_credit  text,
  created_by    uuid references profiles(id) on delete set null,
  -- türetilmiş sayaçlar
  pin_count     integer not null default 0,
  save_count    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Şema daha önce kurulmuşsa: create table if not exists yeni sütun eklemez,
-- bu yüzden sonradan gelen alanlar ayrıca alter ile de yazılır. Dosya
-- baştan sona tekrar çalıştırılabilir kalsın diye hepsi "if not exists".
alter table places add column if not exists cover_url    text;
alter table places add column if not exists cover_credit text;

-- ---------- aksansız arama ----------
-- ilike büyük/küçük harfi çözüyor ama aksanı çözmüyor: "ciya" araması
-- "Çiya Sofrası"nı bulamıyor, "ismail" araması "Ali İsmail Korkmaz Parkı"nı
-- bulamıyor. Türkçe klavyesi olmayan ya da hızlı yazan kullanıcı hiçbir şey
-- bulamaz. Çözüm: türetilmiş sütunda Türkçe harfler ASCII'ye indiriliyor,
-- istemci de sorguyu aynı şekilde indirip karşılaştırıyor.
--
-- translate ÖNCE, lower SONRA olmalı: lower('İ') Türkçe olmayan collation'da
-- tek harf değil "i" + U+0307 (birleşen nokta) veriyor.
alter table places add column if not exists search_text text
  generated always as (
    lower(translate(name || ' ' || coalesce(neighborhood, ''),
                    'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'))
  ) stored;
create index if not exists places_search_trgm on places using gin (search_text gin_trgm_ops);

create index if not exists places_geo_gist on places using gist (geo);
create index if not exists places_category_idx on places (category) where status = 'published';
create index if not exists places_name_trgm on places using gin (name gin_trgm_ops);

-- Pratik bilgiler: topluluk düzenler, "gitmeden bilmen gerekenler"
create table if not exists place_facts (
  place_id        uuid primary key references places(id) on delete cascade,
  needs_booking   boolean,
  booking_note    text,
  closed_days     smallint[],          -- 0=pazar
  best_time       text,
  price_per_person integer,            -- ₺
  cash_only       boolean,
  good_for        text[],
  vibe_tags       text[],
  warning         text,                -- kırmızı kutuda çıkan uyarı
  updated_by      uuid references profiles(id) on delete set null,
  confirm_count   integer not null default 0,   -- "hâlâ geçerli" diyen kullanıcı sayısı
  updated_at      timestamptz not null default now()
);

-- Scraper kaynakları (kullanıcıya açılmaz)
create table if not exists place_sources (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references places(id) on delete cascade,
  platform   source_platform not null,
  url        text not null,
  author     text,
  confidence real check (confidence between 0 and 1),
  found_at   timestamptz not null default now(),
  unique (place_id, url)
);

-- ============================================================
--  3. PİNLER — uygulamanın merkezi nesnesi
-- ============================================================
create table if not exists pins (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles(id) on delete cascade,
  place_id    uuid not null references places(id) on delete cascade,

  -- ---- kalite kapısı: BRIEF'te zorunlu sayılan alanlar (formda da zorunlu) ----
  -- body ZORUNLU DEĞİL (göç 13): en az 15 karakter isteniyordu, söyleyecek
  -- somut bir şeyi olmayan kullanıcı pin atamıyordu. Boş not '' olarak
  -- yazılıyor; NULL olsaydı arayüzde "null mı boş mu" ayrımı çıkardı.
  body        text not null check (char_length(body) <= 1000),              -- somut not
  words       text[] not null check (array_length(words, 1) = 3),           -- üç kelime
  scenario    text not null,                                               -- geliş senaryosu
  -- Prototip yarım puan gösteriyor (8.5/10), o yüzden smallint değil numeric.
  -- İkinci koşul yarım adımı zorunlu kılar: 8.5 geçer, 8.3 geçmez.
  rating      numeric(3,1) not null
                check (rating >= 1 and rating <= 10 and rating * 2 = floor(rating * 2)),
  -- (fotoğraf/video zorunluluğu pin_media + assert_pin_has_media trigger'ında)

  -- ---- isteğe bağlı alanlar ----
  improve     text,                     -- "bir şey değişse" — mekanın yapılacaklar listesi
  frequency   text,                     -- hangi sıklıkla gelinir
  would_return text check (would_return in ('evet','belki','hayır')),
  price_paid  integer,                  -- kişi başı ödediği, ₺
  visit_date  date,

  status      content_status not null default 'published',
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at  timestamptz not null default now(),
  -- kalite kapısı: aynı kişi aynı mekana aynı gün tek pin
  unique (author_id, place_id, visit_date)
);

comment on column pins.rating is
  'Yildiz degil: "bana uygun mu" puani. Mekan sayfasinda ortalama degil dagilim gosterilir.';
comment on column pins.words is
  'Uc kelime. Serbest metin oldugu icin zamanla dagilir; 200 pinden sonra otomatik tamamlama gerekecek.';
comment on column pins.improve is
  '"Bir sey degisse" — mekanin yapilacaklar listesi olarak gosteriliyor.';

-- Şema daha önce smallint ile kurulduysa create table çalışmaz; tipi burada taşı.
alter table pins alter column rating type numeric(3,1);
alter table pins drop constraint if exists pins_rating_check;
alter table pins add  constraint pins_rating_check
  check (rating >= 1 and rating <= 10 and rating * 2 = floor(rating * 2));

create index if not exists pins_words_idx on pins using gin (words);
create index if not exists pins_place_idx on pins (place_id, created_at desc) where status = 'published';
create index if not exists pins_author_idx on pins (author_id, created_at desc) where status = 'published';
create index if not exists pins_recent_idx on pins (created_at desc) where status = 'published';

create table if not exists pin_media (
  id        uuid primary key default gen_random_uuid(),
  pin_id    uuid not null references pins(id) on delete cascade,
  kind      media_kind not null default 'photo',   -- fotograf mi video mu
  storage_path text not null,           -- Supabase Storage yolu
  caption   text check (char_length(caption) <= 120),  -- her medyanin kendi notu
  width     integer,
  height    integer,
  duration_s numeric(6,2),              -- video ise suresi
  ordering  smallint not null default 0
);

comment on column pin_media.caption is
  'Karusel''de o gorselin/videonun hemen altinda gosterilir.';
create index if not exists pin_media_pin_idx on pin_media (pin_id, ordering);

-- Fotoğraf zorunlu: pin yayına girerken en az 1 medya olsun
create or replace function assert_pin_has_media() returns trigger language plpgsql as $$
begin
  if new.status = 'published'
     and not exists (select 1 from pin_media where pin_id = new.id) then
    raise exception 'Pin yayınlanamaz: en az bir fotoğraf gerekli';
  end if;
  return new;
end $$;

create table if not exists pin_likes (
  pin_id  uuid not null references pins(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

create table if not exists pin_comments (
  id        uuid primary key default gen_random_uuid(),
  pin_id    uuid not null references pins(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body      text not null check (char_length(body) between 1 and 500),
  status    content_status not null default 'published',
  created_at timestamptz not null default now()
);
create index if not exists pin_comments_pin_idx on pin_comments (pin_id, created_at);

-- ============================================================
--  4. SOSYAL GRAF
-- ============================================================
create table if not exists follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on follows (following_id);

create table if not exists saves (
  user_id  uuid not null references profiles(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- Listeler = kişinin küratörlüğü ("Kadıköy'de yağmurlu gün")
create table if not exists lists (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null references profiles(id) on delete cascade,
  slug      text not null,
  title     text not null,
  intro     text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (owner_id, slug)
);
create table if not exists list_items (
  list_id  uuid not null references lists(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  note     text,
  ordering smallint not null default 0,
  primary key (list_id, place_id)
);

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  pin_id      uuid references pins(id) on delete cascade,
  comment_id  uuid references pin_comments(id) on delete cascade,
  reason      text not null,
  handled     boolean not null default false,
  created_at  timestamptz not null default now(),
  check (pin_id is not null or comment_id is not null)
);

-- ============================================================
--  5. SAYAÇ TRIGGER'LARI
-- ============================================================
-- security definer ŞART: trigger'ın içindeki UPDATE'ler de RLS'e tabi.
-- Elif, Bogaç'ın pinini beğenince trigger `update pins set like_count...`
-- çalıştırıyor ama p_pins_update policy'si author_id = auth.uid() istiyor —
-- güncelleme HATA VERMEDEN 0 satırı etkiliyor, sayaç olduğu yerde kalıyor.
-- Aynı sorun saves → places.save_count'ta da var (places'ta UPDATE policy'si
-- hiç yok). Sayaçlar yalnızca kendi içeriğinde doğru görünüyordu.
-- search_path sabitleniyor: security definer fonksiyonda arama yolu
-- saldırgan tarafından değiştirilebilir olmamalı.
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

drop trigger if exists trg_pins_count on pins;
create trigger trg_pins_count after insert or delete on pins
  for each row execute function bump_counter();
drop trigger if exists trg_likes_count on pin_likes;
create trigger trg_likes_count after insert or delete on pin_likes
  for each row execute function bump_counter();
drop trigger if exists trg_comments_count on pin_comments;
create trigger trg_comments_count after insert or delete on pin_comments
  for each row execute function bump_counter();
drop trigger if exists trg_follows_count on follows;
create trigger trg_follows_count after insert or delete on follows
  for each row execute function bump_counter();
drop trigger if exists trg_saves_count on saves;
create trigger trg_saves_count after insert or delete on saves
  for each row execute function bump_counter();

-- ============================================================
--  5b. KAYIT AKIŞI — auth.users satırından profiles satırı
-- ============================================================
-- Supabase kayıt olan kişiyi auth.users'a yazar, profiles'ı bizim açmamız gerekir.
-- Bu trigger olmadan kayıt olan kullanıcının profili olmaz; pins.author_id →
-- profiles(id) yabancı anahtarı hemen kırılır. security definer, çünkü RLS'in
-- üstünde çalışıp yeni satırı açması gerekiyor.

create or replace function kullanici_adi_sadelestir(ham text)
returns text language sql immutable as $$
  select left(
    regexp_replace(
      translate(lower(coalesce(ham, '')), 'çğıöşüâîû', 'cgiosuaiu'),
      '[^a-z0-9_]', '', 'g'),
    24);
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  istenen text;
  aday    text;
  n       integer := 0;
begin
  istenen := kullanici_adi_sadelestir(new.raw_user_meta_data->>'username');
  -- username check'i en az 3 karakter istiyor; boş/kısa gelirse kimlikten üret
  if length(istenen) < 3 then
    istenen := 'kullanici' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  -- username unique: doluysa sonuna sayı ekleyerek boş bir tane bul
  aday := istenen;
  while exists (select 1 from profiles where username = aday) loop
    n := n + 1;
    aday := left(istenen, 21) || n::text;
  end loop;

  insert into profiles (id, username, display_name)
  values (new.id, aday,
          coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), aday))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
--  6. AÇIK MI? (Europe/Istanbul, gece yarısını aşan saatler dahil)
-- ============================================================
create or replace function is_open_now(hours jsonb, at_time timestamptz default now())
returns boolean language plpgsql immutable as $$
declare
  local_ts timestamp; dow int; cur time; rec jsonb; o time; c time;
begin
  if hours is null then return null; end if;
  local_ts := at_time at time zone 'Europe/Istanbul';
  dow := extract(dow from local_ts);
  cur := local_ts::time;
  for rec in select * from jsonb_array_elements(hours) loop
    o := (rec->>'open')::time;
    c := (rec->>'close')::time;
    if c > o then
      if (rec->>'d')::int = dow and cur >= o and cur < c then return true; end if;
    else
      if (rec->>'d')::int = dow and cur >= o then return true; end if;
      if (rec->>'d')::int = (dow + 6) % 7 and cur < c then return true; end if;
    end if;
  end loop;
  return false;
end $$;

-- ============================================================
--  6b. MEKAN KAPAĞI — en çok beğenilen pinden
-- ============================================================
-- Mekanın kapak fotoğrafını kimse "seçmiyor": oraya gidenlerin bıraktığı
-- pinlerden en çok beğenileni kendiliğinden kapak oluyor. Herkesin
-- koyabilmesi "son yükleyen kazanır" olurdu; sadece editör ölçeklenmezdi.
-- Wikimedia'dan gelen places.cover_url yedek kalıyor (park/anıt gibi henüz
-- pin gelmemiş yerler boş görünmesin diye).

create or replace function place_cover_path(in_place uuid) returns text
language sql stable as $$
  select m.storage_path
  from pins p
  join pin_media m on m.pin_id = p.id and m.kind = 'photo'
  where p.place_id = in_place
    and p.status = 'published'
    and m.storage_path not like 'demo://%'   -- tohum verisinin sahte yolları
  order by p.like_count desc, p.created_at desc, m.ordering
  limit 1;
$$;

-- PostgREST "hesaplanan alan": tablo tipini alan fonksiyon, sorguda normal
-- sütun gibi seçilebiliyor (select=id,name,cover_path). Liste ekranlarında
-- mekan başına ayrı sorgu atmaya gerek kalmıyor.
create or replace function cover_path(places) returns text
language sql stable as $$
  select place_cover_path($1.id);
$$;

-- Aynı desen koordinat için: geo sütunu geography tipinde ve PostgREST onu
-- sayı olarak vermiyor. Bu ikisi olmadan liste sorguları lat/lng okuyamıyor.
create or replace function lat(places) returns double precision
language sql stable as $$
  select st_y($1.geo::geometry);
$$;

create or replace function lng(places) returns double precision
language sql stable as $$
  select st_x($1.geo::geometry);
$$;

create index if not exists pins_place_begeni_idx
  on pins (place_id, like_count desc) where status = 'published';

-- ============================================================
--  7. HARİTA SORGUSU — konum + filtre + pin sayısı tek çağrıda
-- ============================================================
-- Dönüş tipi değişiyor; create or replace bunu yapamaz (42P13).
-- İmzayı tam yazmak şart, yoksa hangi aşırı yükleme düşürüleceği belirsiz.
drop function if exists places_nearby(
  double precision, double precision, integer, place_category, boolean, integer);

create or replace function places_nearby(
  in_lat double precision,
  in_lng double precision,
  in_radius_m integer default 2000,
  in_category place_category default null,
  in_open_only boolean default false,
  in_limit integer default 200
) returns table (
  id uuid, slug text, name text, category place_category, neighborhood text,
  lat double precision, lng double precision, distance_m double precision,
  is_open boolean, pin_count integer, warning text, price_per_person integer,
  cover_path text, cover_url text
) language sql stable as $$
  select p.id, p.slug, p.name, p.category, p.neighborhood,
         st_y(p.geo::geometry), st_x(p.geo::geometry),
         st_distance(p.geo, st_point(in_lng, in_lat)::geography),
         is_open_now(p.opening_hours),
         p.pin_count, f.warning, f.price_per_person,
         place_cover_path(p.id), p.cover_url
  from places p
  left join place_facts f on f.place_id = p.id
  where p.status = 'published'
    and st_dwithin(p.geo, st_point(in_lng, in_lat)::geography, in_radius_m)
    and (in_category is null or p.category = in_category)
    and (not in_open_only or is_open_now(p.opening_hours) is true)
  order by p.pin_count desc, 8
  limit in_limit;
$$;

-- ============================================================
--  7a. MEKAN AÇMA — kopya kayıt üretmeden
-- ============================================================
-- Gizli ('hidden') mekan RLS yüzünden istemciye görünmüyor ama coğrafi arama
-- onu buluyor; istemci tarafında açılan kayıt kopya olurdu. Arama ve geri
-- açma burada, tek çağrıda ve yarış olmadan yapılıyor.
--
-- security definer, dar yetkiyle: giriş şart, yalnızca 'hidden' geri açılıyor
-- ('removed' asla — o moderasyon kararı), eşleşme için ad aynı ve mesafe
-- 30 m'den yakın olmak zorunda, search_path sabit.

create or replace function public.yer_bul_ya_da_olustur(
  in_ad   text,
  in_tur  place_category,
  in_lat  double precision,
  in_lng  double precision,
  in_semt text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kisi  uuid := auth.uid();
  v_nokta geography := st_setsrid(st_point(in_lng, in_lat), 4326)::geography;
  v_ad    text := lower(translate(btrim(in_ad),
                        'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'));
  v_id    uuid;
  v_taban text;
  v_slug  text;
begin
  if v_kisi is null then
    raise exception 'Giriş gerekiyor.' using errcode = '42501';
  end if;
  if length(btrim(in_ad)) < 2 then
    raise exception 'Mekan adı çok kısa.' using errcode = '22023';
  end if;

  -- Aynı adla, 30 m içinde kayıt var mı? Gizliler dahil.
  select id into v_id
    from places
   where status in ('published', 'hidden')
     and lower(translate(name, 'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu')) = v_ad
     and st_dwithin(geo, v_nokta, 30)
   order by st_distance(geo, v_nokta)
   limit 1;

  if v_id is not null then
    update places set status = 'published'
     where id = v_id and status = 'hidden';
    return v_id;
  end if;

  -- Yeni kayıt. Slug çakışırsa sona kısa bir ek.
  v_taban := left(coalesce(nullif(btrim(regexp_replace(v_ad, '[^a-z0-9]+', '-', 'g'), '-'), ''), 'mekan'), 50);
  v_slug  := v_taban;
  for i in 1..5 loop
    begin
      insert into places (slug, name, category, neighborhood, geo, opening_hours, created_by)
      values (v_slug, btrim(in_ad), in_tur,
              coalesce(nullif(btrim(coalesce(in_semt, '')), ''), 'Kadıköy'),
              v_nokta, null, v_kisi)
      returning id into v_id;
      return v_id;
    exception when unique_violation then
      v_slug := v_taban || '-' || substr(md5(random()::text), 1, 4);
    end;
  end loop;

  raise exception 'Mekan eklenemedi, adı biraz değiştirip tekrar dene.';
end $$;

-- ============================================================
--  7b. MEKAN ÖZETİ
--  Mekan sayfasindaki "hizli bakis" ve dagilim bloklari.
--  BRIEF: ortalama tek basina gosterilmiyor; dagilim + takip
--  ettiklerinin ayri ortalamasi asil deger.
-- ============================================================
create or replace function place_summary(in_place uuid, in_viewer uuid default null)
returns jsonb language sql stable as $$
  with p as (
    select * from pins where place_id = in_place and status = 'published'
  ),
  takip as (                       -- izleyicinin takip ettikleri (+ kendisi)
    select following_id as id from follows where follower_id = in_viewer
    union select in_viewer::uuid
  )
  select jsonb_build_object(
    'pin_count',      (select count(*) from p),
    'rating_avg',     (select round(avg(rating)::numeric, 1) from p),
    -- 1..10 kovalari: [n1, n2, ... n10]  — yarım puanlar aşağı yuvarlanır (8.5 → 8)
    'rating_buckets', (select coalesce(jsonb_agg(x.c order by x.g), '[]'::jsonb)
                       from (select g, (select count(*) from p where floor(p.rating) = g) c
                             from generate_series(1,10) g) x),
    'following_avg',  (select round(avg(rating)::numeric, 1)
                       from p where in_viewer is not null and author_id in (select id from takip)),
    'following_ids',  (select coalesce(jsonb_agg(distinct author_id), '[]'::jsonb)
                       from p where in_viewer is not null and author_id in (select id from takip)),
    -- uc kelimeler, sikliga gore
    -- set-returning fonksiyonu select listesinde group by ile birlestirmek yerine
    -- lateral unnest: daha guvenli ve okunur
    'words',          (select coalesce(jsonb_agg(jsonb_build_array(t.w, t.n) order by t.n desc), '[]'::jsonb)
                       from (select w, count(*) n from p, unnest(p.words) w group by w
                             order by n desc limit 8) t),
    'top_scenario',   (select scenario from p group by scenario order by count(*) desc limit 1),
    'would_return',   (select count(*) from p where would_return = 'evet'),
    -- "bir sey degisse" listesi: mekanin yapilacaklar listesi
    'improvements',   (select coalesce(jsonb_agg(jsonb_build_object('author', author_id, 'text', improve)), '[]'::jsonb)
                       from p where improve is not null and improve <> ''),
    'save_count',     (select count(*) from saves where place_id = in_place)
  );
$$;

-- ============================================================
--  8. AKIŞLAR
-- ============================================================
-- Takip akışı: takip ettiklerinin pinleri
create or replace function feed_following(in_user uuid, in_limit int default 30, in_before timestamptz default now())
returns setof pins language sql stable as $$
  select pn.* from pins pn
  join follows f on f.following_id = pn.author_id and f.follower_id = in_user
  where pn.status = 'published' and pn.created_at < in_before
  order by pn.created_at desc limit in_limit;
$$;

-- Keşfet: kimseyi takip etmeyen de değer alsın (TikTok dersi)
-- basit sıralama: tazelik + beğeni. Gerçek sürümde konum da girecek.
create or replace function feed_discover(in_limit int default 30, in_offset int default 0)
returns setof pins language sql stable as $$
  select * from pins
  where status = 'published'
  order by (like_count + comment_count * 2)::numeric
           / power(extract(epoch from (now() - created_at)) / 3600 + 2, 1.5) desc
  limit in_limit offset in_offset;
$$;

-- ============================================================
--  9. RLS
-- ============================================================
-- Postgres'te "create policy if not exists" YOK. Şema dosyası baştan sona
-- yeniden çalıştırılabilir kalsın diye her policy önce düşürülüp yeniden
-- kuruluyor. Aksi halde ikinci çalıştırma 42710 "already exists" ile patlar.
-- ============================================================
alter table profiles      enable row level security;
alter table places        enable row level security;
alter table place_facts   enable row level security;
alter table place_sources enable row level security;
alter table pins          enable row level security;
alter table pin_media     enable row level security;
alter table pin_likes     enable row level security;
alter table pin_comments  enable row level security;
alter table follows       enable row level security;
alter table saves         enable row level security;
alter table lists         enable row level security;
alter table list_items    enable row level security;
alter table reports       enable row level security;

-- okuma
drop policy if exists p_profiles_read on profiles;
create policy p_profiles_read on profiles for select using (true);
drop policy if exists p_places_read on places;
create policy p_places_read   on places   for select using (status = 'published');
drop policy if exists p_facts_read on place_facts;
create policy p_facts_read    on place_facts for select using (true);
drop policy if exists p_pins_read on pins;
create policy p_pins_read     on pins     for select using (status = 'published');
drop policy if exists p_media_read on pin_media;
create policy p_media_read    on pin_media for select using (true);
drop policy if exists p_likes_read on pin_likes;
create policy p_likes_read    on pin_likes for select using (true);
drop policy if exists p_comments_read on pin_comments;
create policy p_comments_read on pin_comments for select using (status = 'published');
drop policy if exists p_follows_read on follows;
create policy p_follows_read  on follows  for select using (true);
drop policy if exists p_lists_read on lists;
create policy p_lists_read    on lists    for select using (is_public or owner_id = auth.uid());
drop policy if exists p_list_items_read on list_items;
create policy p_list_items_read on list_items for select using (true);
-- scraper kaynakları kullanıcıya kapalı (service_role bypass eder)
drop policy if exists p_sources_none on place_sources;
create policy p_sources_none  on place_sources for select using (false);

-- yazma: herkes serbest ama sadece kendi adına
drop policy if exists p_profiles_write on profiles;
create policy p_profiles_write  on profiles for update using (id = auth.uid());
-- Trigger security definer olduğu için normalde buna gerek yok; istemci kendi
-- profilini elle oluşturmak isterse diye duruyor. Başkasının adına açamaz.
drop policy if exists p_profiles_insert on profiles;
create policy p_profiles_insert on profiles for insert with check (id = auth.uid());
drop policy if exists p_places_insert on places;
create policy p_places_insert  on places for insert with check (auth.uid() is not null);
-- place_facts wiki tarzı ama İMZALI: yazan kişi kayda geçiyor.
-- "for all using (auth.uid() is not null)" idi — giriş yapan herkes her
-- mekanın künyesini silebiliyordu. warning alanı mekan sayfasının en üstünde
-- kırmızı kutuda çıktığı için biri gerçek bir işletmeye asılsız uyarı
-- yazabilirdi. Silme kaldırıldı, yazan kişi zorunlu.
drop policy if exists p_facts_write on place_facts;
drop policy if exists p_facts_ekle on place_facts;
create policy p_facts_ekle on place_facts for insert
  with check (auth.uid() is not null and updated_by = auth.uid());
drop policy if exists p_facts_guncelle on place_facts;
create policy p_facts_guncelle on place_facts for update
  using (auth.uid() is not null) with check (updated_by = auth.uid());
-- DELETE policy'si bilerek yok.

drop policy if exists p_pins_insert on pins;
create policy p_pins_insert on pins for insert with check (author_id = auth.uid());
drop policy if exists p_pins_update on pins;
create policy p_pins_update on pins for update using (author_id = auth.uid());
drop policy if exists p_pins_delete on pins;
create policy p_pins_delete on pins for delete using (author_id = auth.uid());

drop policy if exists p_media_write on pin_media;
create policy p_media_write on pin_media for all
  using (exists (select 1 from pins where pins.id = pin_media.pin_id and pins.author_id = auth.uid()))
  with check (exists (select 1 from pins where pins.id = pin_media.pin_id and pins.author_id = auth.uid()));

drop policy if exists p_likes_write on pin_likes;
create policy p_likes_write on pin_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_comments_insert on pin_comments;
create policy p_comments_insert on pin_comments for insert with check (author_id = auth.uid());
drop policy if exists p_comments_delete on pin_comments;
create policy p_comments_delete on pin_comments for delete using (author_id = auth.uid());
drop policy if exists p_follows_write on follows;
create policy p_follows_write on follows for all
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());
drop policy if exists p_saves_write on saves;
create policy p_saves_write on saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_lists_write on lists;
create policy p_lists_write on lists for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists p_list_items_write on list_items;
create policy p_list_items_write on list_items for all
  using (exists (select 1 from lists where lists.id = list_items.list_id and lists.owner_id = auth.uid()))
  with check (exists (select 1 from lists where lists.id = list_items.list_id and lists.owner_id = auth.uid()));
drop policy if exists p_reports_insert on reports;
create policy p_reports_insert on reports for insert with check (auth.uid() is not null);

-- ============================================================
--  10. ÖRNEK KAYIT
-- ============================================================
-- insert into places (slug, name, category, neighborhood, geo, opening_hours)
-- values ('poyraz-kahve','Poyraz Kahve','kahve','Moda',
--         st_point(29.0246, 40.9788)::geography,   -- DİKKAT: önce boylam!
--         '[{"d":1,"open":"08:00","close":"22:00"}]'::jsonb);

-- ============================================================
--  10. PostGIS TABLOSUNU YAZMAYA KAPAT
-- ============================================================
-- Supabase, public şemasındaki TÜM tablolara anon ve authenticated için
-- GRANT ALL veriyor. PostGIS public'e kurulunca spatial_ref_sys de bu
-- yetkiyi alıyor: anon anahtarla INSERT/UPDATE/DELETE yapılabiliyordu.
-- Ölçüldü — srid 4326 (WGS 84) silindiğinde places_nearby "Cannot find
-- SRID" ile çöküyor, harita tamamen kararıyor.
--
-- REVOKE ve RLS burada işe yaramıyor: tablonun sahibi supabase_admin,
-- biz postgres'iz ve üyesi değiliz. Yetkiyi ancak VEREN rol geri alabilir;
-- REVOKE hata vermeden hiçbir şey yapmıyor. RLS de sahiplik istiyor.
-- PostGIS SET SCHEMA'yı desteklemediği için eklentiyi taşımak da yok.
--
-- Yetki listesinde TRIGGER var ve trigger oluşturmak sahiplik değil
-- TRIGGER yetkisi istiyor — koruma oradan geliyor.
--
-- DİKKAT: PostGIS sürüm yükseltmesi bu tabloya yazar. Yükseltmeden önce
--   drop trigger spatial_ref_sys_koruma on public.spatial_ref_sys;
-- çalıştırılmalı, sonra buradaki blok tekrar uygulanmalı.

create or replace function public.spatial_ref_sys_yazma_engeli()
returns trigger language plpgsql as $$
begin
  raise exception
    'spatial_ref_sys salt okunur (sema bolum 10). PostGIS yukseltmesi icin trigger gecici olarak dusurulmeli.'
    using errcode = 'insufficient_privilege';
end $$;

drop trigger if exists spatial_ref_sys_koruma on public.spatial_ref_sys;
create trigger spatial_ref_sys_koruma
  before insert or update or delete on public.spatial_ref_sys
  for each statement execute function public.spatial_ref_sys_yazma_engeli();
