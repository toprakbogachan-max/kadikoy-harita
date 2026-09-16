# Spec — Faz 2: Eksik Corner Bileşenleri

**Bu dosya kendi kendine yeterlidir.** Başka bir dosyayı (Obsidian vault, envanter
notu) okumana gerek yok — ihtiyacın olan her şey burada.

## Bağlam (neden buradasın)

Bu proje, Corner (corner.inc) adlı bir uygulamanın tasarım dilini referans alarak
bir bileşen kütüphanesi kuruyor. Süreç şu ana kadar üç aşamadan geçti:

1. **Faz 1 (bitti, commit `ce90b6f`):** Tasarım tokenları kuruldu — renkler,
   radius, gölge, tipografi. `web/app/globals.css` ve `web/app/tasarim/page.tsx`.
2. **Faz 1.5 (bitti, commit `2779396`):** Paylaşılan primitifler kuruldu —
   `web/components/corner/primitives/{Pill,Cip,Kart,Avatar,Rozet,Panel}.tsx`.
   Önizlemesi: `web/app/tasarim/primitifler/page.tsx`.
3. **Faz 2 (şimdi burada):** Aşağıdaki 7 bileşen **gerçekten eksik** — mevcut
   uygulama ekranlarında hiçbir karşılığı yok, sıfırdan yazılacak.

**Bir önceki tur bulgusu:** Bu projede Corner'ın diğer birçok bileşeni (mekan
başlığı, harita marker'ları, filtre barı, kayıt ekranları, akış kartları, liste
kartları, profil, paylaşım kartı) **zaten eski usul (primitifsiz) yazılmış**
durumda — onlar bu spec'in KAPSAMI DIŞINDA. Onlara dokunma, üstüne ikinci bir
uygulama yazma. Bu spec sadece aşağıdaki 7 paket içindir.

## Sınırlar (Boundaries)

- **Sadece yeni dosyalar oluştur** — her paket için belirtilen component + önizleme
  dosyası. Mevcut hiçbir dosyaya (globals.css, tailwind config, lib/, mevcut
  bileşenler, app/page.tsx) dokunma. İstisna: Paket 6 (çıkartma açısı) — o paket
  özellikle `globals.css`'e dokunmana izin veriyor, açıkça yazılı.
- **Sadece `components/corner/primitives/` altındaki hazır primitifleri kullan**
  (Pill, Cip, Kart, Avatar, Rozet, Panel). Yeni bir pill/kart/çip tipi TANIMLAMA.
  Primitiflerin mevcut varyantları yetmezse, o paketi atla ve neden yetmediğini
  bir NOT.md dosyasına yaz — uydurma.
- **Sürüm B'yi uygula.** Bu uygulama Corner'ın iki farklı ekran kuşağından
  (Sürüm A/B) B'yi temel alıyor: ayrı `+` FAB, `everyone ⌄`/`open now` filtreleri,
  fotoğraflı/emoji'li kategori çipleri. Mevcut ekranlara (`AltMenu.tsx`,
  `FiltreCipleri.tsx`) bakarak o dilin neye benzediğini gözlemleyebilirsin.
- **Mevcut uygulama ekranlarına montaj YAPMA.** Bu faz sadece bileşen + önizleme.
  Gerçek sayfalara (`MekanSayfasi.tsx` vb.) yerleştirme ayrı, sonraki bir iş.
- **Türkçe metin kullan** (uygulama Türkçe) ama buton dili jenerik olmasın —
  "Devam"/"Tamam" değil, marka sesiyle samimi karşılık (örn. Corner'ın "want to
  try" yerine "denemek istiyorum" gibi doğal bir çeviri, birebir İngilizce'den
  kelime kelime çevirme).
- Bileşen kendi verisini uydurmasın — props alsın, önizleme sayfası örnek veri
  versin.
- **`.maplibregl-ctrl-bottom-right { bottom: 84px }` kuralına dokunma**
  (`globals.css` içinde) — OpenStreetMap atıf metninin görünür kalması ODbL
  gereği yasal zorunluluk, bu spec'in hiçbir paketi bunu etkilemez ama bilgin
  olsun.

## Bitmişliğin Tanımı (her paket için)

Bir paket şu şartların HEPSİ sağlanmadan "bitti" sayılmaz:

1. Belirtilen component dosyası oluşturuldu, TypeScript hatasız (`npx tsc
   --noEmit`, `web/` dizininden).
2. Belirtilen önizleme sayfası oluşturuldu, bileşenin TÜM durumlarını gösteriyor
   (normal, aktif, pasif, boş, uzun metin, yükleniyor — paket açıklamasında
   "durumlar" yazıyorsa hepsi).
3. `npm run dev` ile açılıp gözle kontrol edildi — hem masaüstü hem telefon
   genişliğinde (tarayıcı geliştirici araçlarıyla responsive test).
4. Sadece izin verilen dosyalara dokunuldu (yukarıdaki Sınırlar).
5. `git commit` atıldı, paket başına ayrı commit, açıklayıcı Türkçe mesajla.

Bir paketi bitirmeden sıradakine geçme. Bir pakette takılırsan (primitif
yetersiz, tasarım kararı belirsiz) o paketi atla, `NOT.md` dosyasına (repo
kökünde, yoksa oluştur) hangi paketi neden atladığını yaz, sıradaki pakete geç.

## Sıra

Paketler birbirinden bağımsız, istediğin sırada yapabilirsin, ama önerilen sıra
(kolaydan zora):

1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Paket 1 — Harita ek işaretleri

**Dosyalar:** `components/corner/BookmarkPin.tsx`, `components/corner/AktifKisiIsareti.tsx`,
`components/corner/SehirCipi.tsx`
**Önizleme:** `app/tasarim/harita-ekleri/page.tsx`

- **Bookmark pin:** Başkasının kaydettiği mekanları haritada göstermek için —
  mavi bookmark (kaydet) ikonu şeklinde bir harita işareti. Mevcut marker
  dosyalarına (`Harita.tsx` içinde `.foto-marker`, `.jeton-marker` sınıflarını
  ara, biçim dilini oradan al) bakıp aynı ölçek/gölge dilini kullan.
- **Aktif kişi işareti:** "Arkadaşlar" filtre modunda, bir arkadaşın son
  eylemini gösteren marker — mor bir kişi silüeti + üstünde `@kullaniciadi
  kaydetti` / `@kullaniciadi beğendi` gibi kısa bir etiket. Props: `kullaniciAdi`,
  `eylem` (`'kaydetti' | 'begendi' | 'gitti'`).
- **Şehir çipi:** Dünya haritası zoom seviyesinde şehirleri gösteren pill —
  beyaz zemin, koyu metin, sol tarafta 🌐 veya benzeri bir simge, sağında şehir
  adı. Cip primitifini kullan.

## Paket 2 — `search here` (ara buradan) pill'i

**Dosya:** `components/corner/AraBuradan.tsx`
**Önizleme:** `app/tasarim/ara-buradan/page.tsx`

Harita kaydırıldığında beliren, "bu bölgede ara" işlevi gören pill. Pill
primitifini kullan. İki görsel durumu var: **boşta** (siyah dolu) ve
**çalışıyor** (mavi dolu, muhtemelen içinde küçük bir yükleniyor animasyonu).
Önizleme sayfasında iki durumu da (buton tıklanınca boşta↔çalışıyor arası geçiş
yapan basit bir state ile) göster.

## Paket 3 — Mekan detayı eksikleri

**Dosyalar:** `components/corner/KayitRozeti.tsx`, `components/corner/ToTryBeen.tsx`,
`components/corner/EditoryalBolum.tsx`
**Önizleme:** `app/tasarim/mekan-eksikleri/page.tsx`

- **Kayıt rozeti:** "946 SAVES" tarzı bir rozet — pembe zemin, küçük ve kalın
  büyük harfli sayı+etiket (örn. "946 KAYIT"). Rozet primitifini kullan, yoksa
  Rozet'e bu varyantı ekle.
- **`ToTryBeen`:** "Denemek istiyorum" / "Gittim" ikilisi. **ÖNEMLİ:**
  `app/tasarim/primitifler/page.tsx` sayfasına bak — Faz 1.5'te bu ikili için
  zaten bir tasarım kararı verildi: **segmented pill (birleşik kapsül)**
  biçiminde kalması kararlaştırıldı, ayrı daire çifti varyantı EKLENMEDİ. O
  kararı bozma — segmented pill'i temel alıp gerçek 3-durumlu (boş / seçili-
  kaydet / seçili-gitti) davranışı ekleyen, gerçek bir bileşen hâline getir.
  Props: `durum: 'bos' | 'denemek-istiyorum' | 'gittim'`, `onDegistir`.
- **Editoryal bölüm:** "VIBE" / "NE ALINIR" gibi büyük harfli başlık + altında
  paragraf metni. Kart primitifini kullan ya da düz bir blok, karmaşık olmasın.
  Props: `baslik`, `icerik` (string).

## Paket 4 — Değerlendirme ve `would you go back`

**Dosyalar:** `components/corner/DereceGostergesi.tsx`, `components/corner/TekrarGiderMiydin.tsx`
**Önizleme:** `app/tasarim/degerlendirme/page.tsx`

**⚠️ Veri modeli kararı (2026-09-15 verildi, değiştirme):** Bu projede
`PinFormu.tsx`'te zaten çalışan bir **0-10 sayısal puan sistemi** var, veri
şemasına bağlı. Corner'ın kendi modeli 4 kademeli çip (`disliked/okay/liked/
favorite`) ama karar şu: **veri değişmiyor, sadece görünüm katmanı ekleniyor.**

- **`DereceGostergesi`:** 0-10 arası bir sayısal puanı, Corner'ın 4 kademeli çip
  görünümüyle **gösteren** (sadece gösterim, veri modelini değiştirmeyen) bir
  bileşen. Props: `puan: number` (0-10). İçeride bir eşleme fonksiyonu yaz —
  örneğin `0-2 → beğenmedim`, `3-5 → idare eder`, `6-8 → beğendim`,
  `9-10 → favorim` gibi (kendi mantıklı bir eşiği seç, `NOT.md`'ye hangi
  eşiği neden seçtiğini yaz — bu ayrıca insana sorulacak bir şey, senin
  önerin yeterli, kesinleştirme). 4 kademe için Cip ya da Pill primitifini
  kullan, hangisi seçili görünecek şekilde biçimlendir.
- **`TekrarGiderMiydin`:** "Tekrar gider miydin?" sorusu + 👎/👍 ikili seçim
  (seçili olan dolu/vurgulu) + ayrıca bir "favorim" kalp butonu. Kart
  primitifini kullan.

## Paket 5 — Liste/curation eksikleri

**Dosyalar:** `components/corner/CurationSecici.tsx`, `components/corner/YeniCurationKarosu.tsx`,
`components/corner/BirlikteCalis.tsx`
**Önizleme:** `app/tasarim/liste-eksikleri/page.tsx`

- **`CurationSecici`:** Bir mekanı bir listeye ("curation") eklemek için seçim
  kartı — kapak fotoğrafı + 🔒 gizlilik ikonu + liste adı + "N mekan" + not
  ekleme alanı + sağda seçili/seçilmedi dairesi. Kart primitifini temel al.
- **`YeniCurationKarosu`:** "Yeni liste oluştur" karosu — gri kare zemin +
  ortada `+` ikonu. Küçük, tek amaçlı bir bileşen.
- **`BirlikteCalis`:** "Birlikte küratörlük yap" pill'i — beyaz zemin, degrade
  (gradient) kenarlık. Pill primitifine bu varyantı ekle (kenarlık degrade
  olacak, dolgu değil — mevcut token'larda degrade kenarlık yoksa en yakın
  degrade token'ı kullan, yeni token açma).

## Paket 6 — Haftalık seri (streak) rozeti

**Dosya:** `components/corner/SeriRozeti.tsx`
**Önizleme:** `app/tasarim/seri-rozeti/page.tsx`

Dairesel bir rozet — içinde bir sayı (kaç haftadır aktif) + altında iki satırlık
küçük etiket (örn. "3 hafta" / "seri"). Rozet primitifini kullan. Çift rozet
olarak da (yan yana iki tane, örn. "şehir sıralaması" + "seri") kullanılabilmeli
— önizlemede bunu da göster.

## Paket 7 — Çıkartma açısı düzeltmesi (globals.css'e DOKUNABİLİRSİN)

**Bu paket diğerlerinden farklı — mevcut dosyayı değiştiriyorsun, izinli.**

Faz 1.5'te bırakılan açık bir iş: `.yapistir` sınıfının süzülme (float)
animasyonu şu an sabit `-9deg` açıya kilitli yazılmış. Farklı açıdaki
çıkartmalarda (`web/` içinde `.yapistir` kullanımlarını `grep -rn yapistir
web/app web/components` ile bul) animasyon çalışmıyor/bozuk duruyor.

**Kalıcı çözüm:** `globals.css`'teki `.yapistir` keyframe'ini, sabit `-9deg`
yerine bir CSS custom property'ye (`--aci-cikartma`) bağla — her çıkartma
kullanan öğe kendi `style={{ '--aci-cikartma': '15deg' }}` gibi inline stil ile
kendi açısını verebilsin, keyframe o değişkeni okusun. Varsayılan değeri
`-9deg` kalsın (mevcut kullanımlar bozulmasın).

Test: `app/tasarim/primitifler/page.tsx`'teki mevcut çıkartma örneğine ek
olarak, farklı bir açıyla (örn. 15deg) ikinci bir örnek ekle, ikisinin de
animasyonlu çalıştığını gözle doğrula.

---

## Bitirince

Her paket kendi commit'iyle bitti. Hepsi bittiğinde (ya da atladıkların
`NOT.md`'ye yazıldığında) `git push origin main` ile GitHub'a gönder — bu
depo GitHub'a bağlı, push edilmezse ilerleyen çalışma görünmez.

Kısa bir özet raporu ver: hangi paketleri bitirdin, hangilerini atladın ve
neden, `NOT.md`'de insana sorulması gereken açık kararlar (özellikle Paket
4'teki puan eşiği) var mı.
