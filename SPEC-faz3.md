# Spec — Faz 3: Birleştirme ve Tutarlılık Denetimi

**Bu dosya kendi kendine yeterlidir.** Obsidian notlarını okumana gerek yok —
ihtiyacın olan her şey burada ve depoda.

## Bağlam (neden buradasın)

Bu proje, Corner (corner.inc) uygulamasının tasarım dilini referans alarak
`web/components/corner/` altında bir bileşen kütüphanesi kuruyor:

1. **Faz 1 (commit `ce90b6f`):** tasarım tokenları — `web/app/globals.css`
   `@theme` bloğu ve denetim sayfası `web/app/tasarim/page.tsx`.
2. **Faz 1.5 (`2779396`):** altı primitif —
   `web/components/corner/primitives/{Pill,Cip,Kart,Avatar,Rozet,Panel}.tsx`,
   önizlemesi `/tasarim/primitifler`.
3. **Faz 2 (`3011ac9` … `6892f91`):** on üç bileşen ve beş ekran önizlemesi.
   Kararlar, ad eşlemesi ve sonraya kalan işler **`NOT.md`**'de — başlamadan
   önce oku, oradaki kararlar bu fazda bağlayıcı.

Kütüphane parça parça, farklı turlarda yazıldı. **Faz 3'ün işi onu tek bir
kütüphane hâline getirmek:** önizlemeleri tek kapıdan erişilir yapmak,
bileşenler arasındaki tutarsızlıkları bulup düzeltmek ve her bileşeni
tasarım dilinin kontrol listesinden geçirmek.

**Montaj bu fazda YOK.** Bileşenleri gerçek ekranlara (`Harita.tsx`,
`MekanSayfasi.tsx`, `PinFormu.tsx` …) yerleştirmek ayrı ve riskli bir iş;
önce kütüphanenin sağlam olduğu görülmek isteniyor.

### Bilinen olgular

- Corner kütüphanesi **uygulamanın hiçbir ekranında kullanılmıyor** —
  `components/corner` yalnızca `app/tasarim/**` sayfalarından import ediliyor.
  Yani primitif değişiklikleri canlı uygulamayı bozmaz, ama **bütün önizleme
  sayfalarını** etkiler.
- Önizleme sayfaları (7): `/tasarim` (tokenlar), `/tasarim/primitifler`,
  `/tasarim/mekan-eksikleri`, `/tasarim/harita-eksikleri`,
  `/tasarim/degerlendirme`, `/tasarim/kaydetme-eksikleri`,
  `/tasarim/profil-eksikleri`. `/tasarim` alt sayfalara bağlantı vermiyor.
- Tasarım dili kuralları `corner-tasarim` skill'inde (`/corner-tasarim`).
  Kontrol listesi skill'in **§11**'i. Başlamadan skill'i yükle.
- **Next.js 16:** `web/AGENTS.md` bu sürümün eğitim verisinden farklı
  olduğunu söylüyor; kod yazmadan önce `web/node_modules/next/dist/docs/`
  altındaki ilgili rehberi oku (private folder için
  `01-app/01-getting-started/02-project-structure.md`).

## Sınırlar (Boundaries)

- **Dokunabileceğin dosyalar:**
  - `web/components/corner/**` — primitifler dahil,
  - `web/app/tasarim/**` — yeni sayfa ve `_vitrin/` klasörü dahil,
  - repo kökünde yeni `DENETIM-faz3.md`.
- **Dokunmayacağın dosyalar:** `web/app/globals.css`, `web/lib/`,
  `web/app/page.tsx`, `web/components/` altında `corner/` dışındaki her şey,
  `schema.sql`, `web/scripts/`, `NOT.md` (Faz 2 kaydı; yalnızca oku).
- **Yeni token açma.** Denetim bir token boşluğu bulursa (ör. süre tokenı yok)
  düzeltme; `DENETIM-faz3.md`'ye "karar bekliyor" olarak yaz.
- **Yeni primitif dosyası açma.** Mevcut bir primitife varyant eklemek
  serbest, ama **geriye uyumlu** olmalı: bugün geçerli olan her prop
  kullanımı aynı görünümü üretmeye devam etmeli.
- **Görünüm korunur.** Bir sayfanın ya da bileşenin görünümü yalnızca bir
  tutarsızlığı düzeltmek için değişebilir ve o değişiklik
  `DENETIM-faz3.md`'de gerekçesiyle yazılır. "Daha güzel olur" gerekçe değil.
- **Faz 2 kararlarını bozma** (`NOT.md`): Türkçe dosya adları kalıyor;
  `GidecegimGittim` iki daire; `--color-nane` yalnızca yer imi pini dolgusu;
  favorim kalbi puandan türeyen rozet; `SemtCipi`'nde `sayi` zorunlu;
  `DereceGostergesi` eşiği sabit.
- **Montaj yapma** (yukarıda).
- Takıldığın bir düzeltme tasarım kararı gerektiriyorsa (iki geçerli seçenek
  var) **uydurma**: düzeltmeyi atla, `DENETIM-faz3.md`'ye iki seçeneği ve
  önerini yaz, sıradakine geç.

## Bitmişliğin Tanımı (her paket için)

Bir paket şu şartların HEPSİ sağlanmadan "bitti" sayılmaz:

1. `npx tsc --noEmit` ve `npx eslint components/corner app/tasarim` hatasız
   (`web/` dizininden).
2. **Bütün** `/tasarim` sayfaları (Paket 2'den sonra 8 sayfa) `npm run dev`
   ile hem **390 px** hem **1280 px** genişlikte açılıp gözle kontrol edildi.
   - 390 px gerçek cihaz emülasyonu olmalı (DevTools responsive modu ya da
     CDP `Emulation.setDeviceMetricsOverride`) — pencereyi daraltmak ya da bir
     kutuyu 390 px'e kilitlemek media query'leri tetiklemez. Claude in Chrome
     eklentisi pencereyi o genişliğe indiremiyor.
   - Yatay taşma yok: hem sayfa düzeyinde (`scrollWidth`) hem **kutu içinde**
     (bir öğenin içinde durduğu önizleme kutusunun dışına çıkması). Faz 2'de
     sayfa düzeyi ölçüm iki kutu içi taşmayı kaçırdı.
   - Tarayıcı konsolunda hata ya da uyarı yok.
3. **Önce/sonra karşılaştırması:** önizleme iskeletini ya da bir primitifi
   değiştiren her düzeltmeden önce ve sonra etkilenen sayfaların ekran
   görüntüleri alındı; bilinçli olmayan görsel fark yok, bilinçli olanlar
   `DENETIM-faz3.md`'de.
4. Sadece izin verilen dosyalara dokunuldu (yukarıdaki Sınırlar).
5. Paket başına ayrı `git commit`, açıklayıcı Türkçe mesaj. Paket 3'te denetim
   raporu ve düzeltme grupları ayrı commit'ler. **Her commit kendi başına
   derleniyor** (sonraki bir commit'e bağımlı import yok).

Bir paketi bitirmeden sıradakine geçme.

## Sıra

**1 → 2 → 3 → 4.** Sıra bağımlı: Paket 1 iskeleti ortaklaştırmadan Paket 2
sayfa eklerse yedinci kopyayı üretir; Paket 4 kontrol listesi Paket 3'ün
düzeltmelerinden sonra doldurulmazsa eskimiş olur.

---

## Paket 1 — Vitrin iskeletini ortaklaştır

**Dosyalar:** `web/app/tasarim/_vitrin/` (private folder; routing dışı) +
yedi önizleme sayfasının kendi iskelet kopyalarını silip oradan import etmesi.

Yedi sayfanın her biri `Baslik`, `Etiket`, `Kutu`, `Alt` yardımcılarını ayrı
ayrı tanımlıyor ve kopyalar kaymaya başlamış: `/tasarim/primitifler`'de
`Baslik` prop'u `kodlar`, diğerlerinde `kod`.

- Dört yardımcıyı tek yerde topla, imzayı birleştir (`kod`).
- `Baslik`'a isteğe bağlı bir `id` ekle — Paket 2'nin index'i bölümlere
  bağlantı verecek.
- **390 px çerçeve** kalıbını da buraya al (`TelefonCercevesi` gibi). Bugün
  çerçeve beş sayfada `Kutu`'nun içinde duruyor
  (`harita-eksikleri:420`, `mekan-eksikleri:287`, `kaydetme-eksikleri:299`,
  `profil-eksikleri:258,286`). Kutunun dolgusu telefon genişliğinde çerçeveyi
  390 değil 324 px'e düşürüyor, yani gerçek ekrandan dar bir şey sınanıyor.
  `/tasarim/degerlendirme`'de çerçeve kutudan çıkarılarak çözüldü; aynı
  çözümü paylaşılan bileşene taşı.
- Sayfaya özgü yardımcılar (`HaritaZemini`, `Nokta`, `TemsiliMarker`,
  `sahteKapak` …) yerinde kalır; birden çok sayfada kullanılmıyorlar.

Görünüm korunur. 390 px çerçevenin 324'ten 358 px'e genişlemesi bilinçli
değişikliktir; onun dışında önce/sonra görüntüler aynı olmalı.

## Paket 2 — Önizleme index'i

**Dosyalar:** `web/app/tasarim/page.tsx` (yeni index),
`web/app/tasarim/tokenlar/page.tsx` (bugünkü token denetim sayfası buraya
taşınır, içeriği değişmez).

`/tasarim` bugün token denetim sayfası ve hiçbir alt sayfaya bağlantı vermiyor.
Token sayfasını `/tasarim/tokenlar`'a taşı (`git mv`, geçmiş korunsun),
`/tasarim`'i index yap:

- **Temel:** tokenlar, primitifler (altısı adıyla).
- **Ekran bileşenleri**, ekran başına gruplu: harita (B4 `YerImiPini`,
  B5 `ArkadasMarkeri`, B6 `SemtCipi`, B7 `BuradaAra`), mekan detayı (D2
  `KayitRozeti`, D5 `GidecegimGittim`, D10 `MekanNotu`), değerlendirme (E1
  `DereceGostergesi`, E2 `YineGiderMisin`), kaydetme (E5 `ListeSecimKarti` +
  `ListeSecici`, E6 `ListeAcKarosu`), profil ve liste (F2 `OrtakListeHapi`,
  H2 `SeriRozeti`).
- Her bileşen için: envanter kodu, dosya adı, tek cümlelik tanım, önizleme
  bölümüne bağlantı (Paket 1'deki `id`).
- Her bileşen için **montaj durumu**, `NOT.md`'den: "montaja hazır" ya da
  "veri bekliyor — <ne>". Örn. `ArkadasMarkeri` arkadaş modu RPC'sini,
  `OrtakListeHapi` ortak liste veri modelini, `SeriRozeti` seri hesabını
  bekliyor. Bu etiket bir sonraki fazın (montaj) başlangıç listesi olacak.
- Sayfa denetlediği dile uyar (iridesan zemin, beyaz kart, ayraç çizgisi yok,
  iki kademeli tipografi) ve Paket 1'in iskeletini kullanır.
- Diğer önizleme sayfalarının başındaki yorumlarda "`/tasarim` tokenları"
  gibi eski yollar varsa güncelle.

## Paket 3 — Tutarlılık denetimi ve düzeltme

**Dosyalar:** önce `DENETIM-faz3.md` (rapor), sonra `components/corner/**`
içindeki düzeltmeler.

### 3a — Rapor (ayrı commit)

On üç bileşeni ve altı primitifi şu eksenlerde tara, bulguları tablo olarak
`DENETIM-faz3.md`'ye yaz (dosya:satır, bulgu, öneri, düzelt / karar bekliyor):

1. **Primitif dışı parça:** kendi hapını, kartını, çipini, avatarını ya da
   rozetini çizen bileşen. Neden primitif kullanılmadığı yazılmışsa gerekçe
   geçerli mi, yoksa primitifte eksik bir varyant mı var?
2. **Sabit değer / token:** renk (hex, rgba), gölge, radius, punto, süre,
   eğri. Karşılığı olan token varken yazılmış sabit değer → düzelt. Karşılığı
   olan token yoksa → karar bekliyor.
3. **Aynı rol, farklı değer:** aynı görevi gören şeyin (seçili halka, beyaz
   kenar, onay dairesi, iskelet yer tutucu, basma tepkisi, zıplama) bileşenden
   bileşene farklı kalınlık, gölge kademesi, radius ya da süreyle yazılması.
4. **Tekrarlanan yardımcı:** iki yerde kopyalanmış mantık.
5. **API tutarlılığı:** aynı anlamdaki prop'ların (`pasif`, `yukleniyor`,
   `boy`, `kat`, `secili`/`aktif`, `onTikla`/`onSec`/`onDegis`) bileşenler
   arasında aynı adla ve aynı davranışla kullanılması.
6. **Türkçe kasa:** CSS `uppercase` / `lowercase`'in Türkçe harfleri bozduğu ya
   da istenmeden miras kaldığı yerler (kişi adı asla küçültülmez, "İ" asla
   "I" olmaz; büyütme JS'te `toLocaleUpperCase("tr")`).

**Başlangıç noktaları** — Faz 2'de görüldü, doğrulanmadı; rapor bunlarla
sınırlı değil:

- `Pill` her zaman `<button>`/`<a>` üretiyor, etkileşimsiz hâli yok.
  `ArkadasMarkeri.tsx` etiket hapını bu yüzden kendisi çiziyor;
  `DereceGostergesi.tsx` düğmeleri `inert` bir kapla susturuyor. Pill'e
  geriye uyumlu etkileşimsiz bir biçim adayı.
- `useZipla` iki kopya: `primitives/Pill.tsx:256`, `ListeSecimKarti.tsx:153`.
- Siyah seçim halkası `0 0 0 2px var(--color-gri-900)` beş yerde satır içi
  yazılı (Pill, Cip, Avatar, ListeSecimKarti).
- Beyaz kenar farklı kalınlıklarda: `Avatar` 2 px, `ArkadasMarkeri` silüeti
  2.5 px, `OrtakListeHapi` sayacı 2 px — hepsi `#fff` sabit.
- Harita işareti gölgesi `filter: drop-shadow(...)` ile sabit yazılı ve
  opaklık farklı: `YerImiPini.tsx:87` `.24`, `primitives/Rozet.tsx:214` `.22`.
  Gölge tokenları `box-shadow` biçiminde, `filter` için karşılığı yok.
- Süreler token değil: bileşenlerde 150 / 160 / 200 / 300 ms karışık (11
  kullanım; `duration-200`/`300` Tailwind'in varsayılanı, `[150ms]`/`[160ms]`
  keyfi değer);
  eğri tokenları (`ease-yayli`, `ease-yumusak`, `ease-cikis`) var, süre tokenı
  yok → karar bekliyor.
- `primitives/Cip.tsx:176` `text-[9px]`, en küçük punto tokenı `--text-2xs`
  10 px'in altında.
- Keyfi Tailwind değerleri en çok: `Cip` 6, `ListeSecimKarti` 5,
  `DereceGostergesi` 5, `KayitRozeti` 4 — her birinin gerekçesi var mı bak.
- `Pill`'in `lowercase` sınıfı ikon yuvasına miras kalıyor; `OrtakListeHapi`
  avatar kümesinde baş harfleri küçültüyordu (düzeltildi). Pill ikon
  yuvasına metin koyan başka yer var mı?
- `GidecegimGittim`, `KayitRozeti`, `MekanNotu` (commit `3011ac9`) Faz 2
  denetim turunda gözle ve ölçümle kontrol edilmedi — ilk bakılacaklar.

### 3b — Düzeltmeler (grup başına ayrı commit)

Raporda "düzelt" denen maddeleri gruplar hâlinde düzelt (ör. "primitif
varyantı + onu bekleyen bileşenler", "halka ve kenar değerleri", "yardımcı
tekrarları"). Her grup: Bitmişliğin Tanımı'nın 1–3'ü, sonra commit.
"Karar bekliyor" maddelerine dokunma.

## Paket 4 — Kontrol listesi tablosu

**Dosya:** `DENETIM-faz3.md` (yeni bölüm).

`corner-tasarim` skill'inin **§11 kontrol listesini** on üç bileşen ve altı
primitifin her biri için, Paket 3'ün düzeltmelerinden **sonraki** hâliyle,
kendi önizlemesi üzerinde uygula. Satırlar bileşenler, sütunlar §11
maddeleri; hücreler:

- ✓ geçiyor,
- ✗ geçmiyor (+ neden, düzeltilemediyse "karar bekliyor"),
- — uygulanmaz (ör. "zemin iridesan mı" tek bir bileşen için değil sayfa
  için anlamlı; "sabit bar kalmış mı" bir rozet için anlamsız).

Tablo yalnızca işaret değil: ✗ ve — hücrelerinin açıklaması tablonun altında
dipnot olarak. §11'de "hareket azaltma tercihiyle test edildi mi" ve
"telefon genişliğinde bakıldı mı" maddeleri gerçekten test edilerek
işaretlenir (hareket azaltma: `prefers-reduced-motion: reduce` emülasyonu).

---

## Bitirince

Her paket kendi commit'iyle bitti. Hepsi bittiğinde `git push origin main`.

Kısa bir özet raporu ver:

- hangi paketler bitti, atlanan var mı ve neden,
- Paket 3'te kaç bulgu çıktı, kaçı düzeltildi, kaçı karar bekliyor,
- `DENETIM-faz3.md`'deki **karar bekleyen maddeler** (özellikle token
  boşlukları ve primitif varyant önerileri) — bunlar insana sorulacak,
- Paket 2'deki montaj durumu listesinden çıkan "montaja hazır" bileşenler —
  bir sonraki fazın adayları.
