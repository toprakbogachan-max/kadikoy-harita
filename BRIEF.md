# Kadıköy Harita — proje brief'i

Bu dosya, projeyi devralan geliştiriciye (veya Claude Code'a) bağlamı aktarmak içindir.
Önce bunu oku, sonra `kadikoy-harita-mimari.md`, `schema.sql` ve `prototip.html` dosyalarına bak.

---

## Ürün nedir

Şehir keşif uygulaması. Merkezinde harita var, üstünde kullanıcıların pinledikleri
mekanlar ve o mekanlara bıraktıkları deneyim notları duruyor.

Fikir bir Barcelona seyahatinden çıktı: turist olarak yemek/gezi mekanı bulmak için
TikTok ve Instagram'ı tek tek taramak zorunda kalmak yorucu, üstelik kritik bilgi
eksik kalıyor — rezervasyon gerekiyor muymuş, mekan o gün kapalıymış.

**Google Maps'ten farkı:** Google "burada ne var" sorusuna cevap veriyor.
Biz "gitmeden ne bilmem lazım" ve "bana uygun mu" sorularına cevap veriyoruz.
Bu ayrım ürünün her kararında geçerli, kaybedilmemesi gereken şey bu.

---

## Alınan kararlar

| Karar | Neden |
|---|---|
| Tek şehir: İstanbul, tek semt: **Kadıköy** | Dağınık çok kullanıcıdan çok, tek alanda yoğunluk değerli. Boş harita ürünü öldürür. |
| Hedef: ~200 mekan, kullanıcı beklemeden **elle doldurulacak** | Cold start. İlk kullanıcı boş oda değil, dolu bir profil görmeli. |
| V1 **PWA**, native mobil değil | App Store onayı ve iki platform bakımı, fikir test aşamasında zaman yiyor. |
| Açılış ekranı **harita** | Keşif yüzeyi bu. Akış ikinci sekme. |
| Pin atma **herkese açık**, moderasyon yok | Hız için. Kalite kapısı moderasyon değil, **formun kendisi** (aşağıya bak). |
| Popülerlik = kaç kişinin pinlediği | Uydurma puan yok, sayılabilir bir şey. |

## Üç yüzey

1. **Harita** — nerede ne var. Keşif.
2. **Akış** — kim ne paylaştı. Üç sekme: Keşfet (beğeni ÷ tazelik), Popüler
   (ham beğeni, haftalık), Takip (kronolojik). Üçünün sıralaması kasıtlı olarak farklı;
   aynı olursa biri diğerinin kopyası olur.
3. **Profil** — kişinin kendi haritası. **Büyüme motoru burası:** `/@kullanici`
   linki Instagram story'sine atılır, tıklayan uygulamaya gelir. Instagram'ın Facebook
   üstünden büyümesinin karşılığı. Uygulama içi takipten değil, dışarıdan büyüyeceğiz.

---

## Değerlendirme sistemi

Tek yıldız kullanılmıyor. Google Maps'te her yer 4.3 çıkıyor ve hiçbir şey ayırt
edilmiyor, çünkü yıldız "ne kadar iyi" ölçüyor. Bizim alanlarımız "**bana** uygun mu"
ölçüyor. Alanlar `degerliturizm` adlı Instagram hesabının mekan değerlendirme
kartlarından uyarlandı.

**Pin atarken zorunlu:** fotoğraf · üç kelime · geliş senaryosu · bana hitap puanı (1–10) · somut not (≥15 karakter)

**İsteğe bağlı:** bir şey değişse · hangi sıklıkla gelinir · tekrar gider misin · kişi başı ödenen · servis · atmosfer · fiyat-performans

Zorunlu alanlar kalite kapısıdır. Fotoğraf ve somut not isteyince "çok güzeldi" yazan
üşengeç pin kendiliğinden düşüyor. Bu kapıyı gevşetme.

**Mekan sayfasında ortalama gösterilmiyor**, dağılım gösteriliyor:
- Üç kelimeler → frekansa göre kelime bulutu (mekanın kimliği bu)
- Puanlar → 1–10 dağılım çubuğu + **takip ettiklerinin ayrı ortalaması**
  (zevkine güvendiğin 5 kişi 8 verdiyse kalabalığın 6.5'i seni ilgilendirmiyor —
  Google bunu yapamıyor çünkü orada kim olduğun belli değil)
- "Bir şey değişse"ler → alt alta liste; bu aslında mekanın yapılacaklar listesi

**Bilinen sorun:** üç kelime serbest metin, zamanla dağılır ("sakin"/"sessiz"/"sakın").
İlk 200 pinden sonra otomatik tamamlama önerisi gerekecek — engelleyerek değil, önererek.

---

## Tasarım dili

**Metafor: mantar pano.** Harita pano, mekanlar toplu iğne, yorumlar iğnelenmiş post-it'ler.
Tema açık ve kağıt tonlarında.

- Zemin `#F6F1E4`, pano `#E9DFC9` (ince noktalı doku), yüzey `#FFFDF6`
- Mürekkep `#23343C`, soluk `#75858C`, vurgu pirinç `#B8801A`, uyarı `#B8452F`
- Font: Oswald (tabela/etiket), Karla (metin), JetBrains Mono (sayı)
- El yazısı font **kullanılmadı** — küçük ekranda okunmuyor, Türkçe karakterlerde bozuk

**Harita pinleri:** düz kuşbakışı jetonlar. Merkez açık, kenar koyu (küreye tepeden
bakınca kenarlar kıvrılıp kararır), sol üstte ince beyaz parlama yayı, sağ alta kaçmış
yumuşak gölge. İçinde kategori simgesi (fincan, çatal, kadeh, kapkek, sütun, ağaç).
Açık = kategori renginde, kapalı = gri. Popüler = altın halka + alev rozeti + biraz iri.
Popülerler en son çizilir ki üstte kalsın.

**Post-it'ler:** kağıt rengi kategoriden gelir (kahve soluk sarı, yemek somon, bar lila,
tatlı pembe, kültür nane, park açık yeşil). Üstünde aynı kategori renginde toplu iğne.
Her biri hafif eğik, üstüne gelince düzeliyor.

**Detay ekranı hiyerarşisi kasıtlı:** en üstte kırmızı uyarı kutusu (rezervasyon /
kapalı gün / nakit), sonra özetler, en altta künye. Google Maps'in tam tersi —
orada önce fotoğraf ve puan gelir, kritik bilgi dipte kaybolur.

---

## Dosyalar

- `prototip.html` — çalışan tek dosyalık arayüz prototipi. Harici kütüphane yok
  (Google Fonts hariç). Gerçek harita değil, elle çizilmiş SVG soyutlama.
  12 uydurma mekan var; gerçek işletmeler hakkında yanlış bilgi vermemek için uydurma.
  **Bu dosya tasarımın referansı, mimarisi değil.**
- `schema.sql` — Supabase/Postgres şeması, çalışmaya hazır. PostGIS, RLS politikaları,
  sayaç trigger'ları, `is_open_now()`, `places_nearby()`, `place_summary()`,
  `feed_following()`, `feed_discover()`.
- `kadikoy-harita-mimari.md` — teknik mimari. **DİKKAT: bu doküman güncel değil**,
  hâlâ eski "tek kişilik editörlü rehber" kurgusunu anlatıyor. Sosyal katman kararı
  sonradan alındı. Güncellenmesi gerekiyor.

---

## Teknoloji seçimleri

Next.js App Router + TypeScript · Tailwind · MapLibre GL JS (tile: MapTiler veya
Protomaps) · Supabase (Postgres + PostGIS + Auth + Storage) · Vercel

---

## Sıradaki adımlar

1. Supabase projesi aç, `schema.sql`'i çalıştır
2. Next.js projesini kur, `prototip.html`'deki tasarımı bileşenlere böl
   (tasarımı koru, yapıyı değiştir)
3. Elle çizilmiş SVG haritayı gerçek MapLibre haritasıyla değiştir, jeton pinleri
   custom marker olarak taşı
4. 20 hesaplık kaynak YAML'ı yaz (TikTok/IG Kadıköy mekan hesapları)
5. Scraper: kaynak tara → Claude API ile mekan adı çıkar → Google Places ile zenginleştir
   → dedup → elle katma değer girişi
6. 200 mekanı doldur

**Google Places ToS uyarısı:** `place_id` süresiz saklanabilir, diğer alanlarda
~30 gün cache sınırı var. Canlıya çıkmadan güncel şartları oku.
`schema.sql`'deki `google_synced_at` bu takip için.

**Yasal:** kullanıcı içeriği barındıracağımız için kullanım şartları, gizlilik
politikası ve içerik kaldırma prosedürü gerekiyor. Avukat kontrolünden geçmeli.

---

## Çalışma notu

Koordinat sırasına dikkat: PostGIS'te `st_point(lng, lat)` — **önce boylam**.

---

## Bu oturumda alınan ek kararlar (BRIEF sonrası)

Yukarıdaki brief bu projenin ilk aşamasıydı. Sonraki geliştirme oturumunda
(prototip.html üzerinde) alınan kararlar `kadikoy-harita-mimari.md` içinde
"Sosyal katman kararı" olarak güncellendi — özetle:

- Uygulama tek-editörlü rehber değil, **sosyal/UGC** bir ürün: kullanıcı hesapları,
  herkese açık pin atma, takip, akış, profil hepsi **V1 kapsamında**, V2'ye ertelenmedi.
- Kanonik şema artık `schema.sql` (bu klasördeki, eski adıyla `schema_1.sql`) —
  `profiles`, `pins`, `follows`, `saves`, `pin_likes`, `pin_comments`, `reports` tabloları var.
- Prototipte inşa edilenler: gerçek MapLibre + OpenFreeMap haritası, takip ettiklerinin
  hikaye şeridi (tıklayınca o kişinin pinlerine filtreler), Akış'ta Instagram Explore
  tarzı ızgara (tıklayınca TikTok/Reels tarzı yukarı/aşağı kaydırmalı gönderi detayı),
  kendi pinini düzenleme/silme, bildirimler, şikayet mekanizması, mekan detayında
  Google Maps tarzı kompakt özet (puan + kaç kişi kaydetti + takip edenlerin pinleri +
  fotoğraf ızgarası).
- Marker kalem fontu (Kalam) post-it notlarında ve filtre çiplerinde kullanılıyor —
  brief'teki "el yazısı font kullanılmadı" kararı bilinçli olarak bu noktalarda gevşetildi
  (Türkçe karakter desteği doğrulanarak).

Devralan geliştirici (veya Claude Code), bu klasördeki `prototip.html`'i en güncel
tasarım referansı olarak kullanmalı.
