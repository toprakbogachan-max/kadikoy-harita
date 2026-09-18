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

## Paket 4 — pin formu ve pin düzenleme: yine gider miydin

`components/PinFormu.tsx` ve `components/PinDuzenle.tsx`: `TEKRARLAR`
dizisiyle çizilen düz çiplerin yerine `YineGiderMisin`. Formun kendi
"Tekrar gider misin" etiketi, `role="group"` sarmalayıcısı ve elle yazılmış
toggle'ı silindi (bileşen üçünü de taşıyor). `TEKRARLAR` sabiti artık
kullanılmadığı için kaldırıldı. Bileşene `puan` da bağlandı: 9 ve üstünde
soru satırında FAVORİM rozeti çıkıyor.

**Tıklanan akış:** `/` → "+" → "pin at" → giriş katmanı → demo hesabıyla
(`canyz@demo.invalid`) e-posta ve şifre adımları → harita → "+" → "pin at"
→ pin formu açıldı. 390 px.

**Görülenler (canlı formda, DOM'dan ölçüldü):**
- Başlık `yine gider miydin?`, seçenekler `👍evet · 🤔belki · 👎hayır`.
- Puan kaydırıcısı 9'a çekilince FAVORİM rozeti belirdi.
- "evet"e dokununca `aria-pressed=true`.

**Doğrulanamayanlar:**
- Bloğun canlı formdaki **ekran görüntüsü** alınamadı: form sabit bir
  katmanın içinde kendi kabında kayıyor ve otomasyonla o kap
  kaydırılamadı (birkaç yöntem denendi). Bileşenin görünümü
  `/tasarim/degerlendirme` önizlemesinde iki genişlikte doğrulanmıştı.
- `PinDuzenle` ekranı açılmadı (kendi pinini düzenleme akışı); değişiklik
  `PinFormu` ile birebir aynı kalıpta ve tip denetiminden geçiyor.
- Pin **gönderimi** denenmedi: demo hesap salt okunur. Gerçek hesapla
  "yine gider miydin" cevabının `pins.would_return`'e yazıldığı teyit
  edilmeli.

## Paket 1 — harita: burada ara

`app/page.tsx`: harita kayınca sorgu **kendiliğinden tazelenmiyor**. Haritanın
o anki alanı (`haritaAlani`) sorgunun koştuğu alandan (`alan`) ayrıldı; ikisi
eşikten fazla ayrılınca `BuradaAra` beliriyor, dokununca sorgu o alanla
koşuyor. Eşik eskisiyle aynı (250 m ya da yarıçapta dörtte bir).

Üç incelik:
- **Açılışta hap yok.** Haritanın ilk bildirdiği alan "kayma" sayılmıyor:
  yarıçap ekran boyundan hesaplandığı için açılışta sabit merkezden farklı
  geliyordu ve hap kullanıcı haritaya dokunmadan beliriyordu. İlk rapor
  sorguyu sessizce hizalıyor.
- **Çalışıyor hâli türetiliyor**, ayrı bayrak yok: aranan alan sorgunun
  alanıyla aynı nesneyken ve `yukleniyor` doğruyken hap mavi. (İlk yazımda
  efekt içinde `setState` vardı; projenin lint kuralı onu reddediyor.)
- **Alan sorgusu olmayan kipler hariç:** kişi/liste odağı, "takip
  ettiklerim" ve "kaydettiklerim" haritanın neresine bakıldığına bakmıyor,
  orada hap çıkmıyor.

**Tıklanan akış (390 px):** harita yüklendi (hap yok) → tuval sürüklendi →
hap belirdi → dokunuldu → `aria-busy=true`, zemin mavi → sorgu bitti → hap
kayboldu, marker'lar değişti. Ayrıca: kategori filtresi değiştirildi →
marker'lar hapsız ve hemen tazelendi; "kaydettiklerim" kipinde harita
sürüklendi → hap çıkmadı.

**Not (ürün sahibine):** ekranda artık üç koyu eleman var — hap (referansta
siyah), seçili filtre çipi ve alt menünün aktif sekmesi. Skill en fazla
ikisini istiyor. Fazlalık hapta değil, eski usul filtre barının seçili
çipinde: Corner dilinde seçim dolu siyah değil siyah halka. Filtre barı
primitife çevrilince (ayrı faz) kendiliğinden çözülür; acele gerekirse hap
`cam` dolguya alınabilir.
