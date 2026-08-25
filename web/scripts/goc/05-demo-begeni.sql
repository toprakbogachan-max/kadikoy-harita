-- ============================================================
--  GÖÇ 05 — demo beğenileri (GELİŞTİRME VERİSİ)
--
--  Tohumda beğeni sayıları elle yazılmıştı (341, 312…) ama arkalarında
--  gerçek pin_likes satırı yoktu. Göç 02 sayaçları gerçek satırlardan
--  yeniden hesaplayınca hepsi 0'a indi — doğru ama akış boş görünüyor.
--
--  Bu dosya 5 demo hesapla GERÇEK beğeni satırları atıyor. Sayılar küçük
--  (en fazla 4) ama uydurma değil: sayaç trigger'ı bunları sayıyor.
--
--  Dağılım rastgele DEĞİL, deterministik: (kişi + pin) karmasından türüyor,
--  yani tekrar çalıştırınca aynı sonucu verir. Eşik pinin puanına bağlı —
--  9.5 puanlı pin neredeyse herkesten beğeni alır, 6 puanlı pek almaz.
--  Böylece akış sıralaması anlamlı olur.
--
--  Kimse kendi pinini beğenmiyor.
-- ============================================================

insert into pin_likes (pin_id, user_id)
select p.id, pr.id
from pins p
cross join profiles pr
where pr.id <> p.author_id
  and p.status = 'published'
  -- yalnızca demo hesaplar
  and pr.id in (select id from auth.users where email like '%@demo.invalid')
  -- puan 5'in üstüne çıktıkça beğenme olasılığı artıyor
  and abs(hashtext(pr.id::text || p.id::text)) % 100
      < greatest(0, ((p.rating - 5) * 24))::int
on conflict do nothing;

-- doğrulama: sayaç trigger'ı gerçekten saydı mı
select
  (select count(*) from pin_likes) as gercek_begeni_satiri,
  (select coalesce(sum(like_count), 0) from pins) as pins_like_count_toplami,
  (select max(like_count) from pins) as en_cok_begenilen,
  (select count(*) from pins where like_count = 0) as hic_begenilmeyen;
