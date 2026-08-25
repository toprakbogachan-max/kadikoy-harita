-- ============================================================
--  GÖÇ 01 — aksansız arama
--  (schema.sql'de de var; bu yalnızca hızlı uygulamak için)
--
--  Sorun: ilike büyük/küçük harfi çözüyor ama aksanı çözmüyor.
--    "ciya"   → Çiya Sofrası'nı BULAMIYOR
--    "ismail" → Ali İsmail Korkmaz Parkı'nı BULAMIYOR
--  Türkçe karakter yazmayan kullanıcı hiçbir şey bulamıyor.
--
--  Çözüm: türetilmiş sütunda Türkçe harfler ASCII'ye iniyor; istemci de
--  sorguyu aynı şekilde indiriyor (lib/metin.ts ↔ buradaki translate).
--
--  translate ÖNCE, lower SONRA: lower('İ') Türkçe olmayan collation'da tek
--  harf değil "i" + U+0307 (birleşen nokta) veriyor.
-- ============================================================

alter table places add column if not exists search_text text
  generated always as (
    lower(translate(name || ' ' || coalesce(neighborhood, ''),
                    'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'))
  ) stored;
create index if not exists places_search_trgm on places using gin (search_text gin_trgm_ops);

alter table profiles add column if not exists search_text text
  generated always as (
    lower(translate(display_name || ' ' || username,
                    'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'))
  ) stored;
create index if not exists profiles_search_trgm on profiles using gin (search_text gin_trgm_ops);

-- doğrulama: üçü de sonuç döndürmeli
select 'ciya (aksansiz)' as sorgu, count(*) from places where search_text like '%ciya%'
union all select 'ismail (aksansiz)', count(*) from places where search_text like '%ismail%'
union all select 'sureyya (aksansiz)', count(*) from places where search_text like '%sureyya%'
union all select 'bogac (profil)', count(*) from profiles where search_text like '%bogac%';
