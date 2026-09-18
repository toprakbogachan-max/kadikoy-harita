# Faz 4 — montaj kaydı

`SPEC-faz4.md`'nin çıktısı. Her paket: ne değişti, hangi akış tıklandı, hangi
boş/hata hâli görüldü, neyi doğrulayamadım.

## Nasıl doğrulanıyor

Faz 3'ün önce/sonra yerleşim ölçümü burada işe yaramıyor: ekranlar veriye ve
oturuma bağlı. Yerine gerçek akış tıklanıyor (headless Chrome, 390 px cihaz
emülasyonu ve 1280 px), DOM'dan bileşenin oradalığı ve gösterdiği değer
okunuyor, kırpılmış ekran görüntüsüyle bakılıyor.

**Veritabanının bugünkü hâli** (montajı sınırlayan iki olgu):
- `saves` tablosu boş — tohum verisi hiç kayıt üretmiyor, yani her mekanın
  `save_count` değeri 0.
- Demo hesaplar salt okunur (RLS), yazma akışları onlarla uçtan uca
  denenemiyor.

## Paket 2 — mekan sayfası: kayıt rozeti ve puan

`components/MekanSayfasi.tsx`:
- `KayitRozeti` adres satırının yanına (`YerDetay.kaydeden` ←
  `places.save_count`).
- `DereceGostergesi` (`olcek`, `puanGoster`) "Kişisel puanlar" kartındaki ham
  ortalamanın (`ozet.rating_avg?.toFixed(1)`) yerine. Dağılım çubukları,
  "herkes · N kişi" ve "takip ettiklerin" satırı olduğu gibi kaldı.

**Tıklanan akış:** `/` → harita yüklendi → marker'a tıklandı → mekan sayfası
açıldı → panel kaydırıldı → puan kartı görüldü. 390 ve 1280 px.

**Görülenler:**
- Boğa Bar (2 pin, ortalama 8): ölçek "beğendim"de, yanında `8`; ekran
  okuyucuya tek cümle ("puan 8 · beğendim").
- Pini olmayan altı mekan (Kalamış Balıkçısı, Poyraz Kahve, İskele
  Meyhanesi…): "Kişisel puanlar" kartı zaten çizilmiyor, sayfa bozulmuyor.
- Kayıt rozeti hiçbir mekanda görünmüyor — **doğru davranış**, çünkü
  `save_count` her yerde 0 ve bileşen sıfırda kendini çizmiyor.
- Adres satırı rozetsiz hâlde eskisi gibi ("rıhtım · kadıköy"), taşma yok.
- Konsolda yalnızca haritanın önceden var olan uyarıları (otoyol tabelası
  filtreleri, `ferry_terminal` ikonu) — montajdan gelen hata yok.

**Doğrulanamayan:** kayıt rozetinin DOLU hâli gerçek veriyle görülemedi
(veritabanında hiç kayıt yok, demo hesap da yazamıyor). Dolu hâli
`/tasarim/mekan-eksikleri` önizlemesinde duruyor. Gerçek hesapla bir mekan
kaydedilince rozetin çıktığı teyit edilmeli.

## Paket 3 — akış kartı ve gönderi detayı: puan çipi

`components/Akis.tsx` ve `components/GonderiDetay.tsx`: ham `8.5/10` yerine
`DereceGostergesi bicim="tek" puanGoster`.

**Bileşene iki geriye uyumlu prop eklendi** (montaj gerektirdi, varsayılanlar
bugünkü görünümü koruyor):
- `kat` — gölge kademesi. Akış kartında çip kartın kenarına oturuyor ve
  yanındaki eylem düğmeleriyle aynı katmanda (kat 2); varsayılan 1 kalıyor.
- `koyu` — yalnızca yanındaki sayının rengini çeviriyor. Gönderi detayında
  çip koyu fotoğrafın üstünde; gri sayı orada sönük kalıyordu, beyaza
  döndü (ölçüldü: detayda `rgba(255,255,255,.85)`, akışta `gri-600`).

**Spec'ten sapma:** spec akış kartı için `boy="kucuk"` diyordu; orada
varsayılan `orta` kullanıldı. Sebep: çipin yanındaki eylem düğmeleri ~36 px
ve 24 piksellik çip aynı satırda kırpılmış duruyor. Gönderi detayında
`kucuk` kaldı (avatar satırının içinde).

**Tıklanan akış:** `/` → alt menüden akış → 29 kartta çipler → ilk kartın
gövdesine tıklandı → gönderi detayı açıldı. 390 px.

**Görülenler:** çipler gerçek puanları doğru okuyor — `9 → favorim`,
`8 → beğendim`, `7,5 → beğendim`, `6,5 → idare eder` (Türkçe ondalık virgül).
Puanı olmayan pin yoksa çip hiç çizilmiyor (`p.puan != null` koşulu kaldı).
Konsolda yalnızca haritanın eski uyarıları.

**Doğrulanamayan:** puanı `null` olan bir pin bugünkü veride yok; boş hâl
gerçek veriyle görülemedi (koşul kodda duruyor, çip çizilmiyor).
