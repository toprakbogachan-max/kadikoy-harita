-- ============================================================
--  Göç 11 — OSM'den gelen "boş" mekanları gizle
-- ============================================================
-- Sorun: 1064 mekan haritada kafa karıştırıcı bir yoğunluk yaratıyordu.
-- Merkezin 800 m çevresinde 800 mekan var; harita 160 ile sınırlı çiziyor
-- ama 160 jeton birkaç sokağa yığılınca duvar gibi görünüyor.
--
-- SİLMİYORUZ. status'ü 'hidden' yapıyoruz — p_places_read politikası zaten
-- yalnızca 'published' satırları gösteriyor, yani mekanlar haritadan ve
-- aramadan çekiliyor ama satır duruyor. Geri almak tek satır:
--
--   update places set status = 'published' where status = 'hidden';
--
-- Ölçüt: OSM'in o yer hakkında adı dışında BİR ŞEY bildiği kayıtlar kalıyor
-- — çalışma saati, web sitesi, telefon ya da adresten en az biri. Hiçbiri
-- olmayan kayıt çoğunlukla tek satırlık bir düğüm; gerçek mi, hâlâ açık mı,
-- bilmiyoruz.
--
-- Pini olan hiçbir mekan gizlenmiyor (pin_count = 0 koşulu).
--
-- Daha da azaltmak istersen `address is null` satırını sil: o zaman ölçüt
-- saat/web/telefona iner ve kalan 412 değil 251 olur.

update places
   set status = 'hidden'
 where status = 'published'
   and pin_count = 0
   and opening_hours is null
   and website  is null
   and phone    is null
   and address  is null;

-- Doğrulama — beklenen: published 412, hidden 652
select status, count(*) as adet
  from places
 group by status
 order by adet desc;
