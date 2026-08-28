-- ============================================================
--  GÖÇ 08 — place_facts yazma yetkisi daraltıldı
--
--  BULGU: p_facts_write "for all using (auth.uid() is not null)" idi.
--  Yani giriş yapan HERKES, HERHANGİ bir mekanın künyesini yazabiliyor,
--  değiştirebiliyor ve SİLEBİLİYORDU. Test edildi: Elif, Bogaç'ın
--  mekanına "uydurma uyarı" yazdı ve satır oluştu (HTTP 201).
--
--  Neden ciddi: place_facts.warning, mekan sayfasının en üstünde kırmızı
--  "Gitmeden önce" kutusunda çıkıyor. Biri gerçek bir işletmeye asılsız
--  bir uyarı yazabilirdi — pinlerde özenle kaçındığımız şeyin aynısı.
--
--  DÜZELTME:
--   · silme kaldırıldı — kimse başkasının katkısını yok edemesin
--   · yazan kişi kayda geçiyor (updated_by = auth.uid()), imzasız
--     değişiklik yapılamıyor
--   · okuma serbest kalıyor
--
--  KALAN RİSK (bilerek): model hâlâ wiki tarzı, giriş yapan biri var olan
--  künyeyi değiştirebilir. Moderasyon yokken bunu tamamen kapatmak
--  1052 OSM mekanının künyesini de kilitlerdi (created_by'ları null).
--  Gerçek kullanıcıya açılmadan önce ya moderasyon ya da
--  "yalnızca is_verified" kısıtı gerekiyor.
-- ============================================================

drop policy if exists p_facts_write on place_facts;

create policy p_facts_ekle on place_facts for insert
  with check (auth.uid() is not null and updated_by = auth.uid());

create policy p_facts_guncelle on place_facts for update
  using (auth.uid() is not null)
  with check (updated_by = auth.uid());

-- DELETE policy'si BİLEREK yok: künye silinemez, yalnızca güncellenebilir.

-- doğrulama
select policyname, cmd from pg_policies
where tablename = 'place_facts' order by policyname;
