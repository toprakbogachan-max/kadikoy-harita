# Spec — Faz 4: Montaj

**Bu dosya kendi kendine yeterlidir.** İhtiyacın olan her şey burada ve depoda.

## Bağlam (neden buradasın)

`web/components/corner/` altında Corner dilinde bir bileşen kütüphanesi var:
altı primitif (Faz 1.5) ve on üç ekran bileşeni (Faz 2), hepsi
`/tasarim` index'inden erişilen önizleme sayfalarında. Faz 3 kütüphaneyi
tutarlı hâle getirdi (`DENETIM-faz3.md`).

**Bugüne kadar bu kütüphane uygulamanın hiçbir ekranında kullanılmadı.**
Faz 4 onu ilk kez gerçek ekranlara takıyor.

Bağlayıcı kayıtlar — başlamadan oku:
- `NOT.md` — Faz 2 ürün kararları (puan eşiği, favorim = puan ≥ 9, nane
  yalnızca yer imi pini, `GidecegimGittim` iki daire, Türkçe dosya adları).
- `DENETIM-faz3.md` — tutarlılık kararları, prop adları (`okunur` = ekran
  okuyucu metni, `etiket` = görünen metin, `aktif` = seçili/basılı),
  tokenlar (`--sure-*`, `--drop-shadow-sekil`, `--degrade-aktivite`),
  `bas-gecis` sınıfı ve en sonda Faz 3 sonrası kararlar.
- `CLAUDE.md` — mimari ve tuzaklar. Özellikle: **veri katmanı tek sınır**
  (`lib/veri.ts` ⟷ `lib/model.ts` ⟷ `lib/types.ts` birlikte değişir),
  Next.js 16 farkları (`web/AGENTS.md`), Türkçe İ tuzağı.
- Tasarım dili: `corner-tasarim` skill'i (`/corner-tasarim`). Kontrol
  listesi §11.

## Bu fazın öncekilerden farkı

Faz 2 ve 3 yalnızca `components/corner/` ve `app/tasarim/` içindeydi; bir
hata en fazla bir önizlemeyi bozardı. **Faz 4 canlı ekranlara dokunuyor.**
Üç sonuç:

1. **Her paket tek başına geri alınabilir olmalı.** Bir paket = bir commit,
   `git revert` ile tek başına geri alınabilir; paketler birbirinin
   değişikliğine dayanmaz (Paket 5a hariç, 5b onun üstüne gelir).
2. **Doğrulama artık ölçümle bitmiyor.** Faz 3'ün yerleşim dökümü
   karşılaştırması burada işe yaramaz: ekranlar veriye ve oturuma bağlı.
   Yerine gerçek akışı tıklayarak sınamak ve ekran görüntüsü var.
3. **Demo hesap salt okunur** (`public.demo_hesap()`, `goc/15-*.sql`):
   yazma RLS'te reddediliyor. Yazma eylemi monte ederken arayüz bunu
   biliyor olmalı (`pasif`), yoksa kullanıcı sessiz hataya bakar.

## Sınırlar (Boundaries)

**Dokunabileceğin dosyalar**
- Montajın yapıldığı ekranlar: `web/components/{Harita,MekanSayfasi,Akis,GonderiDetay,PinFormu,PinDuzenle}.tsx`,
  `web/app/page.tsx` (yalnızca paketin gerektirdiği kadar).
- `web/lib/veri.ts` + `web/lib/model.ts` + `web/lib/types.ts` — **yalnızca
  Paket 5a'da listelenen iki iş için**, üçü birlikte.
- `web/components/corner/**` — yalnızca montajın ortaya çıkardığı eksik
  için, **geriye uyumlu** varyant ekleyerek (bugünkü her kullanım aynı
  görünmeye devam eder). Bir bileşeni montaja uydurmak için kütüphanenin
  kararlarını bozma.
- `web/app/tasarim/page.tsx` — montaj durumu etiketleri (Paket 6).
- Kök `DENETIM-faz4.md` (yeni) — kararlar, ölçümler, atlananlar.

**Dokunmayacağın dosyalar**
- `schema.sql` ve `web/scripts/**` — **bu fazda şema değişmiyor.** İhtiyaç
  duyulan her şey zaten şemada: `lists.is_public`, `list_items` (sahibine
  yazma izni açık), `places.save_count`, `place_summary`, `pins.rating`,
  `pins.would_return`.
- `web/app/globals.css` — tokenlar yetiyor. Yetmezse `DENETIM-faz4.md`'ye
  yaz, ekleme.
- `web/components/Giris.tsx` ve karşılama ekranı — ürün kararı: bu fazda
  dokunulmuyor.
- `Harita.tsx`'in marker üretimi (`document.createElement` + `innerHTML`).
  `YerImiPini` ve `ArkadasMarkeri` montajı bu fazda **yok** (verileri de
  yok, `NOT.md`).
- `components/corner/primitives/**` dışındaki eski usul ekranların Corner
  diline çevrilmesi — ayrı faz. Bu fazda yalnızca **yerini aldığın parça**
  değişir, ekranın geri kalanı olduğu gibi kalır.

**Silme kuralı:** monte edilen bileşenin yerini aldığı eski JSX ve ona ait
ölü yardımcılar **silinir**. İki uygulamayı yan yana bırakma; "eskisi de
dursun" bir sonraki turda hangisinin doğru olduğunu bilinmez yapar.

**Takılırsan:** bir paket ürün kararı gerektiriyorsa (iki geçerli seçenek)
uydurma — paketi atla, `DENETIM-faz4.md`'ye seçenekleri ve önerini yaz,
sıradakine geç.

## Bitmişliğin Tanımı (her paket için)

1. `npx tsc --noEmit` ve `npx eslint components app lib` hatasız (`web/`).
2. `npm run dev` ile **gerçek akış tıklanarak** sınandı ve hangi adımların
   tıklandığı commit mesajında yazıyor. Hesap konusunda dikkat:
   - Demo hesap (`web/scripts/tohum/README.md`, şifre depoda) **salt
     okunur** — RLS yazmayı reddediyor. Görünüm, okuma ve boş hâller
     onunla doğrulanır.
   - **Yazma gerektiren paketlerde (4, 5b) demo hesap yetmez:** onunla
     yalnızca "reddin nasıl göründüğü" sınanır (arayüz `pasif` mi, hata
     anlaşılır mı). Gerçek hesapla uçtan uca deneme insana bırakılır;
     `DENETIM-faz4.md`'ye "şu akış gerçek hesapta denenmedi" diye yaz,
     sessizce "denendi" deme.
3. Hem **390 px** (cihaz emülasyonu — DevTools ya da CDP
   `Emulation.setDeviceMetricsOverride`; pencere daraltmak media query
   tetiklemez) hem **1280 px** genişlikte gözle bakıldı. Yatay taşma yok:
   sayfa düzeyinde ve kapsayıcı içinde. Konsolda hata/uyarı yok.
4. **Boş ve hata hâlleri denendi:** veri yokken (pin yok, puan yok, liste
   yok), yükleniyorken ve demo hesapla (yazma reddi) ekran ne gösteriyor?
5. Sadece izin verilen dosyalara dokunuldu; yerini aldığın eski kod silindi.
6. Paket başına tek `git commit`, açıklayıcı Türkçe mesaj, tek başına
   `git revert` edilebilir. Her commit kendi başına derleniyor.

Bir paketi bitirmeden sıradakine geçme.

## Sıra

**2 → 3 → 4 → 1 → 5a → 5b → 6.** Önce salt gösterim olanlar (risk düşük,
veri zaten ekranda), sonra davranış değiştiren harita, en sonda yeni veri
yolu isteyen liste seçici.

---

## Paket 2 — Mekan sayfası: kayıt rozeti ve puan

**Dosya:** `components/MekanSayfasi.tsx`.

- **`KayitRozeti`** (`D2`): kaç kişinin kaydettiği. Veri elde:
  `yerGetir` → `YerDetay.kaydeden` (`places.save_count`). Başlık bloğuna,
  mekan adının yakınına. Sıfırda rozet **çizilmiyor** (bileşenin kararı);
  `sifirEtiketi` verme.
- **`DereceGostergesi`** (`E1`, `bicim="olcek"`, `puanGoster`): bugün
  `MekanSayfasi.tsx:813` ham sayı gösteriyor (`ozet.rating_avg?.toFixed(1)`),
  altında `rating_buckets` çubukları var. Ham sayı yerine gösterge gelir;
  çubuklar ve "herkes · N kişi" satırı **kalır** (dağılımı gösterge
  anlatmıyor). `rating_avg` null ise (`pin_count === 0`) gösterge `puan={null}`.

Eşik `NOT.md`'de kesinleşti, bileşen onu biliyor — burada yeniden eşleme
yazma.

## Paket 3 — Akış kartı ve gönderi detayı: puan çipi

**Dosyalar:** `components/Akis.tsx` (~303), `components/GonderiDetay.tsx` (~351).

İkisi de pinin puanını ham gösteriyor (`8.5/10`). Yerine
`DereceGostergesi bicim="tek" boy="kucuk" puanGoster`. Akış kartı dar:
`boy="kucuk"` ve tek çip bunun için var.

`puan` null olabilir (`p.puan != null` koşulu bugün zaten var) —
göstergeye `puan={p.puan ?? null}` geçip koşulu bileşene bırakmak da
geçerli; hangisini seçtiysen ekranda boş hâli gör.

## Paket 4 — Pin formu: yine gider miydin

**Dosyalar:** `components/PinFormu.tsx` (~399), `components/PinDuzenle.tsx`.

Bugün `TEKRARLAR` dizisi düz `Cip`'lerle çiziliyor. Yerine
`YineGiderMisin`:
- `deger` ← formun `tekrar` state'i (`"" | "evet" | "belki" | "hayır"`;
  bileşen `null` bekliyor, boş dizgiyi `null`'a çevir).
- `onDegis` ← aynı state'i yazar; bileşen "aynı seçeneğe tekrar dokunmak
  boşaltır" davranışını kendisi taşıyor, formdaki elle yazılmış toggle
  silinir.
- `puan` ← formun puan state'i. Puan 9 ve üstündeyken soru satırında
  "FAVORİM" rozeti çıkar (`NOT.md`: favorim = puanın okunuşu). Kaydırıcıyı
  9'a çekip rozetin belirdiğini gör.
- `pasif` ← form gönderilirken/demo hesapta.

Formun kendi etiket/başlık biçimi (`etiket` sınıfı) bileşenin içine
girmiyor: `YineGiderMisin` kendi başlığını taşıyor, formdaki
"Tekrar gider misin" başlığı ve `role="group"` sarmalayıcısı silinir.

## Paket 1 — Harita: burada ara

**Dosyalar:** `app/page.tsx`, `components/Harita.tsx` (yalnızca gerekirse).

Bugün harita her `moveend`'de `alaniGuncelle` çağırıyor ve eşiği aşan
kaymada sorgu kendiliğinden tazeleniyor (`app/page.tsx:154`).

**Karar (uygulanacak):** kendiliğinden tazeleme kalkar, yerine `BuradaAra`
hapı gelir — referans davranışı bu ve her kaydırmada RPC çağırmıyor.
- Harita kayınca "bu alan eski" durumu doğar → hap belirir (`belir`).
- Hapa dokununca sorgu o anki alanla koşar (`calisiyor` sürerken mavi),
  sonuç gelince hap kaybolur.
- Kategori/"şu an açık" süzgeci değişince sorgu **eskisi gibi hemen**
  koşar; hap yalnızca alan değişimi için.
- Hap haritanın üstünde yüzer; ekrandaki **tek dolu siyah** eleman
  olmasına dikkat et (alt menü kapsülü ve FAB ile aynı karede).

Denemede: haritayı kaydır → hap belirsin; dokun → mavi + dönen halka →
sonuç; süzgeci değiştir → hapsız tazelensin.

Davranış değişikliği canlı ekranda yanlış hissettiriyorsa geri al ve
`DENETIM-faz4.md`'ye yaz — otomatik tazelemeye dönmek geçerli bir sonuç.

## Paket 5a — Veri: mekanı listeye ekleme + gizlilik

**Dosyalar:** `lib/veri.ts`, `lib/model.ts`, `lib/types.ts` (üçü birlikte).

Bugün `list_items`'a **yalnızca liste ilk oluşturulurken** yazılıyor
(`listeOlustur`); var olan bir listeye mekan eklemenin yolu yok. Şema
hazır: `list_items` yazma politikası liste sahibine açık
(`p_list_items_write`), okuma herkese.

Eklenecekler:
- `listeyeEkle(listeId, yerId)` — `list_items` insert; `ordering` listenin
  sonuna. Tablonun birincil anahtarı `(list_id, place_id)`, yani aynı mekan
  ikinci kez eklenirse veritabanı hata verir: ya `upsert` ile yut ya da
  23505'i sessizce başarı say (kullanıcı için sonuç aynı: mekan listede).
- `listedenCikar(listeId, yerId)` — delete.
- `listelerimdeMi(yerId)` — bu mekanın **benim** hangi listelerimde
  olduğunu döndürür (liste id dizisi). `lists.owner_id = ben` kesişimi.
- `Liste` tipine `gizli: boolean` (`lists.is_public === false`) —
  `DENETIM-faz3` §11 dipnotunun beklediği kilit rozeti bunu istiyor.
  `kisininListeleri` ve liste okuyan diğer sorgular alanı taşısın.

Demo hesapta yazma RLS'te reddedilir; hata mesajı kullanıcıya anlaşılır
dönsün (mevcut `kayitDegistir` nasıl yapıyorsa aynı kalıp).

## Paket 5b — Arayüz: liste seçici

**Dosyalar:** `components/MekanSayfasi.tsx` + gerekirse `app/page.tsx`.

Mekan sayfasındaki eylem satırında bugün "kaydet" var
(`MekanSayfasi.tsx:649`, `kayitDegistir`). Yanına **"listeye ekle"**:
dokununca alttan `Panel` primitifi açılır, içinde `ListeSecici`
(`bicim="satir"`, `baslik="hangi listene?"`).

- `listeler` ← `kisininListeleri(ben.id)` (`SecilebilirListe`'ye eşle:
  `yerSayisi` ← `liste.yerler.length`, `kapak`, `kapakKonum`, `gizli`).
- `secililer` ← `listelerimdeMi(yerId)`.
- `onSec` ← seçiliyse `listedenCikar`, değilse `listeyeEkle`; iyimser
  güncelle, hata olursa geri al.
- `onYeniListe` ← mevcut `ListeOlustur` ekranını açar (yeni bir liste
  oluşturma akışı yazma).
- Boş hâl: `bosKapak` ← mekanın kapak fotoğrafı (`YerDetay.kapak`),
  böylece "ilk listeni bununla aç" kartı çıkar.
- `pasif` ← giriş yoksa ya da demo hesap.

`ListeSecici`'nin `not` alanı (`list_items.note`) bu pakette **bağlanmıyor**:
`onNotDegis` verme (not yazma ayrı bir veri işi). Bileşen o alanı
`onNotDegis` verilmediğinde zaten çizmiyor.

## Paket 6 — İndeks ve kayıt

**Dosyalar:** `app/tasarim/page.tsx`, `DENETIM-faz4.md`, `NOT.md`.

- İndekste monte edilen bileşenlerin durumu "montaja hazır"dan **"monte
  edildi — <ekran>"**e döner (yeni bir durum tonu ekle, kalanlar aynı).
- `NOT.md`'nin "Sonraya kalan işler" listesinden montajla kapananları
  düş; kalanları (arkadaş RPC'si, seri hesabı, ortak liste modeli, semt
  sorgusu, mekan notu alanları) olduğu gibi bırak.
- `DENETIM-faz4.md`: her pakette ne değişti, hangi akış tıklandı, hangi
  boş/hata hâli görüldü, atlananlar ve açık kalan kararlar.

---

## Bitirince

Her paket kendi commit'iyle bitti. Hepsi bittiğinde `git push origin main`.

Kısa rapor: hangi paketler bitti, hangileri atlandı ve neden, hangi akışlar
tıklanarak sınandı, `DENETIM-faz4.md`'de insana sorulacak ne kaldı.
