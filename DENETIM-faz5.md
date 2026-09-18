# Faz 5 — eski ekranları Corner diline çevirme

Faz 2 kütüphaneyi kurdu, Faz 3 tutarlı hâle getirdi, Faz 4 verisi hazır altı
bileşeni gerçek ekranlara taktı. Bu faz **kalanı** çeviriyor: uygulamanın
eski usul (primitifsiz) yazılmış ekranları, aynı primitifleri kullanır hâle
geliyor.

**Kural:** görünüm korunur. Bir şey değişiyorsa ya bir tutarsızlığın
düzeltilmesidir ya da burada gerekçesiyle yazılır. Karşılama ekranı
(`Giris.tsx`) ürün kararıyla kapsam dışı.

**Doğrulama:** her dalga tıklanarak sınanıyor (390 px cihaz emülasyonu ve
1280 px), taşma ve konsol kontrol ediliyor, kritik yerler kırpılmış ekran
görüntüsüyle karşılaştırılıyor.

## Dalga 1 — filtre çipleri (C2, C3, C4)

`components/FiltreCipleri.tsx` kendi çip bileşenini çiziyordu (173 → 144
satır). Artık `Cip` primitifi:
- Yatay çipler `aktifBicim="seffaf"` — `KayanSecim`'in buzlu baloncuğu
  çipin altından aktığı için çipin kendi zemini olmamalı (primitifte bu
  varyant zaten vardı).
- "tür ▾" etiketine gömülü ok kalktı; primitifin kendi `acilir`/`acik`
  oku ve `aria-expanded` geldi.
- Tür paneli dikey çip (emoji kendi dairesinde üstte, etiket altta).
- Geçiş süresi artık token (`--sure-gecis`), basma tepkisi `bas` eklendi.

**Tıklanan akış (390 px):** çipler göründü → aktif çipin zemini şeffaf,
yazısı beyaz, altında baloncuk (kırpılmış görüntüyle bakıldı) → "tür"e
dokunuldu, panel açıldı (`aria-expanded=true`), dikey çipler göründü →
"kahve" seçildi, aktif çip "☕ kahve ⌄" oldu ve harita tazelendi.
Taşma yok, konsolda yalnızca haritanın eski uyarıları.

## Dalga 2 — ikon düğmesi primitifi

Aynı sınıf dizisi (`grid size-9 place-items-center rounded-md border-none
bg-yuzey shadow-kat-*`) uygulamada **on sekiz** yerde elle yazılıydı.
`components/corner/primitives/IkonDugmesi.tsx` eklendi: boyut, şekil
(squircle/daire), dolgu, gölge kademesi, `aktif`/`guncel`/`acik`,
`menuAcar` ve zorunlu `okunur` (yazısı olmayan düğmede ekran okuyucu
metni şart). Yarıçap tokena bağlı (`--radius-md`), basma tepkisi içinde.

Çevrilenler: `AltMenu`'nün "+" düğmesi, `MekanSayfasi`'nın paylaş ve
"buraya pin at" düğmeleri.

**Bilerek çevrilmeyenler (gerekçeli):**
- `AltMenu`'nün sekme düğmeleri: renk geçişi bilerek 240 ms (baloncuktan
  yavaş, yoksa beyaz zeminde beyaz ikon bir an görünüyor). Primitif tek
  süre tokeni kullanıyor; görünümü korumak primitif saflığından önce.
- `MekanSayfasi`'nın kapat düğmesi: odak yönetimi için `ref` gerekiyor.
- `KonumDugmesi`: çift dokunuş ve `title` davranışları primitifte yok.
  Ama orada **sabit yazılmış mavi** (`bg-[#2F6FB8]`) bulundu ve
  `bg-mavi` tokenına bağlandı.

**Tıklanan akış (390 px):** "+" 52 px daire, gölge kademe 3,
`aria-haspopup=menu`; dokununca menü açıldı ("pin at", "liste oluştur"),
düğme 45° döndü (Tailwind 4 bunu `rotate` özelliğiyle yapıyor), tekrar
dokununca kapandı. Alt menüden akışa geçildi (`aria-current=page`),
haritaya dönüldü, mekan sayfası açıldı: pin düğmesi 36 px / 16 px
yarıçap, paylaş yerinde. Taşma yok, konsol temiz.

## Dalga 3 — kategori rengi arayüzden çıktı

Tarama: uygulama ekranlarında sabit yazılmış renk aranınca on iki dosyada
aynı kalıp çıktı — zorunlu alan yıldızları ve hata/uyarı kutuları
**kategori paletindeki yemek kırmızısını** (`#E0271C` = `--color-yemek`,
mürekkebi `#921008`) kullanıyordu.

Skill §3 ve §10 bunu açıkça yasaklıyor: kategori rengi arayüz iskeletinde
yaşamaz. Doğru renk durum tokeni `--color-kapali` (#B3261E) — mekan
sayfasındaki "gitmeden önce" uyarı kutusu zaten onu kullanıyordu.

Değişenler (Giris.tsx ürün kararıyla kapsam dışı): `PinFormu`,
`PinDuzenle`, `ListeOlustur`, `ListeDuzenle`, `ListeKapakSecici`,
`ProfilDuzenle`, `KunyeDuzenle`, `Yorumlar`, `Ayarlar`, `Arsiv`,
`Sikayet`, `PaylasimKarti`. Uyarı kutusunun kenar/zemin tonu da aynı
tokenın şeffaf hâline çekildi.

**Ölçüldü:** liste oluşturma ekranındaki zorunlu alan yıldızı artık
`rgb(179, 38, 30)`. Kategori kırmızısı arayüzde sıfır yerde kaldı
(Giris.tsx hariç).

## Dalga 4 — akış eylem düğmeleri

`Akis.tsx`'in kendi `EylemDugmesi`'i (kaydet / yorum / beğen) `Pill`'e
devredildi. Bunun için primitife `kenar="sacTeli"` eklendi: düğmenin yarısı
kartın beyazının üstünde durduğu için gölge tek başına kenarı çizmiyor —
skill §5'in "kenarlık ayırmak için değil, gölgeyi desteklemek için" kuralı.

İki davranış düzeldi:
- `aria-pressed` artık yalnızca durumu OLAN düğmelerde basılıyor; yorum
  düğmesi bir anahtar değil, bir kapı.
- Kaydet ve beğen ikonu zıplıyor (skill §13 kalıp 4).

**Ölçüldü (390 px):** 47×35, kenarlık 1px rgba(0,0,0,.07), gölge kat-2,
ikon rgb(134,134,138), geçiş transform+color. Taşma yok.

## Dalga 5 — birincil eylem düğmesi

Aynı sınıf dizisi on bir dosyada elle yazılıydı. Hepsi `Pill`
(`dolgu="siyah" boy="buyuk" tamGenislik`).

Tek ölçü farkı: yazı 14 → 16 px, yükseklik 44 → 47. Ekranın tek
yapılabilir şeyi olan tam genişlikte bir düğme 14 puntoda çekingen
duruyordu; `ProfilDuzenle` ve `Giris` zaten elle 16'ya çekilmişti.

"…" gitti: `yukleniyor` ikon yuvasına dönen halka koyuyor ve `aria-busy`
basıyor. Üç nokta ne olduğunu söylemiyordu, etiket ise kayboluyordu.

**Ölçüldü (390 px, giriş yapılmış):** PinFormu "Paylaş" 334×47 kapalı,
ProfilDuzenle "kaydet" 326×47 açık (altındaki "çıkış yap" ile arası hâlâ
20 px), ListeOlustur "Listeyi oluştur" 334×47 kapalı.

## Dalga 6 — mekan eylem hapları, yorum gönder, boş durum

Mekan sayfasının dört hapı (yol tarifi / kaydet / listeye ekle / künye),
yorum kutusunun gönder düğmesi, `BosDurum`'un çağrısı.

`Pill`'e `tur` eklendi — yorum düğmesi gerçekten `type="submit"` ve
`onSubmit`'i `onClick`'e taşımak enter tuşunu düşürürdü. Varsayılan
"button" kaldı.

`MekanSayfasi`'nın elle tuttuğu `zipSayaci` state'i silindi; aynı hesabı
primitifin `useZipla`sı yapıyor.

**Ölçüldü (390 px):** dört hap 35 px, kat-1 gölge, 13 punto; şerit 326 px
kutuda 489 px kaydırma (taşma ipucu duruyor). Kaydet'e basınca zemin
naneye döndü (rgb(211,242,224) / yazı rgb(31,107,69)), `aria-pressed`
true oldu, `.zipla` belirdi. Test kaydı geri alındı.

## Dalga 7 — kalan ikon düğmeleri

Dalga 2'de "sonra" denen üçü de girdi. `IkonDugmesi` dört şey öğrendi:
`baslik` (`title` — `okunur`la aynı şey değil, ipucu fareyle gezene
konuşuyor ve daha uzun), `onCiftTikla`, `dolgu="mavi"`, `dolgu="camKoyu"`
(fotoğrafın üstünde duran düğme; beyaz olsa açık karede kaybolurdu).

Çevrilenler: GonderiDetay karusel okları, MekanSayfasi FAB'ı,
KonumDugmesi, Profil takip düğmesi, ListeKapakSecici'nin iki düğmesi.

**Ölçüldü (390 px):** konum 40×40 daire kat-3 + ipucu; FAB 58×58 daire
siyah kat-3; oklar 30×30 rgba(10,10,12,.5) gölgesiz, ilk karede "önceki"
kapalı (opaklık .45).

## Dalga 8 — haftalık seri

`SeriRozeti` Faz 2'de çizilmiş, "seri diye bir kavram henüz yok" notuyla
önizlemede bırakılmıştı. Hesap yazıldı (`lib/seri.ts`), rozet profile
takıldı.

Şema değişmedi, yeni sorgu yok: profil zaten o kişinin bütün pinlerini
çekiyor. `Pin` modeline ham `tarih` eklendi — `saat` yuvarlanmış bir
türev ve hafta sınırında bir saatlik kayma "37 hafta"yı "1 hafta" yapardı.

`scripts/kontrol/seri-testi.mjs` (12 durum, hepsi geçiyor) ürün kodunu
doğrudan import ediyor. Sınır durumları: pazartesi 00:00 İstanbul yeni
haftaya, pazar 23:59 eskiye düşüyor — UTC'ye kaysaydı ikisi aynı haftaya
düşerdi.

**Ölçüldü (390 px):** 44 px bej gradyan daire + "0 😴 seri yok", satır
358×56. Demo pinleri geçen haftadan eski, o yüzden sıfır durumu görünüyor.

## Çevrilmeyenler ve sebepleri

Tarama sonunda `rounded-full` + gölge/kenarlık taşıyan on altı yer kaldı.
Hiçbiri gözden kaçmadı; her birinin bir sebebi var:

| yer | sebep |
|---|---|
| `AltMenu` sekmeleri ve kapsülü | Sekme rengi 240 ms'de dönüyor ve aktif sekme kullanıcının AVATARI. Primitif ikisini de taşımıyor; Dalga 2'de bilinçli bırakıldı. |
| `Akis` sekme rayı | `role="tab"` + `aria-selected`. `Pill` `aria-pressed` konuşuyor; sekmeye basılı düğme demek yanlış. |
| `AramaCubugu` | İçeriği SOLA yaslı; `Pill` ortalıyor. Ortalamayı ezmek için sınıf yarışı gerekirdi. |
| `AraEkrani`, `Ayarlar` anahtarı, `GonderiDetay` noktaları | Düğme değil: sırasıyla input kabı, aç/kapa anahtarı, 6 px gösterge. |
| `HikayeSeridi`'nin iki hapı | Avatar yüzünden asimetrik dolgu (`py-1 pl-1 pr-3`); `boy` ölçeğinde karşılığı yok. |
| `MekanSayfasi` başlığı | `<h2>` — `etkilesimsiz` Pill `<span>` üretiyor, başlık semantiği giderdi. |
| `ListeOlustur` / `KunyeDuzenle` / `YerSecici` çipleri | `font-tabela`, `uppercase`, `tracking-etiket`. `Pill` `font-semibold` + `tracking-ui` + küçük harf dayatıyor; ezmek aynı katmanda sınıf yarışı demek. |
| `Giris.tsx`'in hepsi | Ürün kararıyla kapsam dışı. |

## Bulgular (insana kalanlar)

**F1 — "Buraya pin at" etiketli iki düğme.** Mekan sayfasında hem yüzen
başlıkta "+" ikonu (`MekanSayfasi.tsx:430`) hem çekmecenin sağ alt
FAB'ı (`:944`) var; ikisi aynı işi yapıyor ve yarım kademede AYNI ANDA
görünüyor. Ekran okuyucuda iki özdeş etiket demek. Hangisinin kalacağı
ürün kararı, dokunulmadı.

**F2 — Yer imi pini (B4) hâlâ montajsız, ama sebep artık kod değil.**
Bileşenin tanımı "BAŞKASININ kaydettiği mekanlar". Elimizdeki tek kayıt
sorgusu `kaydettiklerim()` — yani BENİM kayıtlarım. İkisi farklı şey:
"başkası burayı kaydetmiş" bir ilişki, "ben kaydettim" bir durum.
Montajdan önce verilecek karar: (a) pin "benim kayıtlarım" olarak
yeniden tanımlansın, (b) takip edilenlerin kayıtlarını getiren bir RPC
yazılsın. (b) `saves` üzerinde `follows` ile kesişim isteyen bir şema
işi.

Ek olarak `Harita.tsx` marker'ları ham DOM + HTML dizesi üretiyor
(`noktaSVG`, `fotoMarkerHTML`). React bileşenini oraya takmanın iki yolu
var ve ikisi de bedelli: her marker için `createRoot` (1052 mekan) ya da
SVG'yi `lib/gorsel.ts`'te ikinci kez yazmak. Doğrusu üçüncüsü —
YerImiPini'nin SVG'sini dize üreten tek bir fonksiyona çıkarıp ikisine
de oradan vermek. Karar (a)/(b) verilmeden bu iş başlamamalı.

**F3 — `goc/15-demo-salt-okunur.sql` hâlâ uygulanmamış görünüyor.**
Faz 4'te kanıtlanmıştı: demo hesabı canlı veritabanına yazabiliyor ve
şifresi depoda açık. Bu dosyanın Supabase SQL Editor'de koşturulması
gerekiyor; `service_role` kullanılmadığı için buradan yapılamaz.
