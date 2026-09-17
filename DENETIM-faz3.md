# Faz 3 — denetim kaydı

`SPEC-faz3.md`'nin çıktısı. Her paket kendi bölümünü ekler: bilinçli görsel
değişiklikler (Paket 1–2), tutarlılık bulguları ve düzeltmeler (Paket 3),
kontrol listesi tablosu (Paket 4). **Karar bekleyen** maddeler insana
sorulacak; kod onlara dokunmaz.

## Nasıl ölçüldü

Önce/sonra karşılaştırması ekran görüntüsüyle değil, yerleşim dökümüyle:
her `/tasarim` sayfası headless Chrome'da 390 px (cihaz emülasyonu) ve 1280 px
genişlikte, hareket azaltma açık ve fontlar yüklendikten sonra açıldı;
`main` altındaki her öğenin konumu, boyutu ve görünümü etkileyen stilleri
(renk, zemin, gölge, radius, punto, ağırlık, harf aralığı, kasa, opaklık)
kaydedildi. İki döküm etiket + metin imzasıyla hizalanıp farklar sayıldı.
Aynı sayfanın iki ayrı çekimi sıfır fark veriyor, yani ölçüm kararlı.
Fark çıkan yerlere kırpılmış ekran görüntüsüyle bakıldı.

## Paket 1 — vitrin iskeleti

Yedi önizleme sayfasındaki `Baslik` / `Etiket` / `Kutu` / `Alt` kopyaları
`web/app/tasarim/_vitrin/Iskelet.tsx`'e taşındı; `TelefonCercevesi` ve
`Kutu yalin` eklendi.

| sayfa | fark | neden |
|---|---|---|
| `/tasarim/primitifler` | yok | kopya, ortak iskeletle aynı çıktıyı üretiyordu (yalnızca prop adı `kodlar` → `kod`) |
| `/tasarim/degerlendirme` | yok | çerçeve zaten kutunun dışındaydı |
| `/tasarim` (tokenlar) | etiketlerin altı 12 → 10 px; her etikette 2 px birikiyor, sayfa 22 px kısaldı | bu sayfanın `Etiket`'i diğer altı sayfadan farklıydı (`mb-3` / `mb-2.5`); çoğunluğa uyuldu |
| `/tasarim/mekan-eksikleri` | 390 px çerçeve kutudan çıktı: telefonda 324 → 358 px genişledi, altındaki içerik 17–34 px yukarı kaydı | kutunun dolgusu çerçeveyi gerçek ekrandan dar sınatıyordu |
| `/tasarim/harita-eksikleri` | aynı | aynı |
| `/tasarim/kaydetme-eksikleri` | aynı | aynı |
| `/tasarim/profil-eksikleri` | aynı, iki çerçeve; telefonda genişleyen çerçevede başlık ve rozetler daha az satıra sarıyor (64–81 px) | aynı |

Başka hiçbir öğenin stili değişmedi. Bütün sayfalar iki genişlikte yatay
taşmasız (sayfa ve kutu içi), konsol temiz.

## Paket 2 — önizleme index'i

`/tasarim` artık bütün önizlemelerin index'i; token denetim sayfası
`git mv` ile `/tasarim/tokenlar`'a taşındı. Bileşen bölümlerine bağlantı
için altı sayfadaki başlıklara `id` eklendi (bileşen adıyla:
`#YerImiPini`, `#Pill` …).

| sayfa | fark | neden |
|---|---|---|
| `/tasarim/tokenlar` | yok (Paket 1 sonrasıyla birebir) | yalnızca adres değişti |
| diğer altı önizleme | yok | `id` yerleşimi etkilemiyor |
| `/tasarim` | yeni sayfa | — |

Hash bağlantısı gerçek gezinmeyle sınandı: `/tasarim` → `#YineGiderMisin`
hedef başlığı ekranın 32 px altına getiriyor (`scroll-mt-8`).

**Montaj durumları** (index'te her bileşenin yanında) şema taramasıyla
çıkarıldı, üç yerde `NOT.md`'den fazlasını söylüyor:

- `YerImiPini` veri bekliyor: `saves` tablosunun tek policy'si
  `user_id = auth.uid()`, başkalarının kayıtları istemciden okunamıyor.
- `SemtCipi` kısmen: `places.neighborhood` ve `pin_count` var, semt başına
  toplam sorgusu yok.
- `MekanNotu` kısmen: "ne zaman git" için `place_facts.best_time` var;
  "havası" / "ne söylesen" metni için alan yok.

Sonuç: 6 montaja hazır (B7, D2, E1, E2, E5, E6), 2 kısmen (B6, D10),
5 veri bekliyor (B4, B5, D5, F2, H2).

## Paket 3a — tutarlılık denetimi

On üç bileşen ve altı primitif altı eksende tarandı: otomatik tarama (sabit
renk, keyfi Tailwind değeri, halka/kenar kalınlığı, süre, hareket azaltma,
basma tepkisi, prop adları, glif kopyaları) + yorumları ayıklanmış kodun
okunması. Türkçe kasa davranışı tarayıcıda ölçüldü.

**Sınıflar:** `düzelt` → 3b'de düzeltilecek (görünüm değişmez ya da
değişiklik burada yazılı) · `karar` → insana sorulacak, koda dokunulmaz ·
`kalsın` → bakıldı, gerekçesi yeterli.

### Bulgular

| # | eksen | yer | bulgu | sınıf |
|---|---|---|---|---|
| T1 | primitif dışı | `Pill`; `ArkadasMarkeri` etiketi; `DereceGostergesi` | `Pill` her zaman `<button>`/`<a>` üretiyor, etkileşimsiz hâli yok. `ArkadasMarkeri` etiket hapını bu yüzden kendisi çiziyor, `DereceGostergesi` dört düğmeyi `inert` kapla susturuyor. | düzelt: Pill'e geriye uyumlu `etkilesimsiz` biçimi (`<span>`, basma tepkisi ve `aria-pressed` yok); iki bileşen onu kullansın |
| T2 | primitif dışı | `MekanNotu` "devamını oku" | kendi metin düğmesi | kalsın: hap değil satır içi metin bağlantısı; `Pill dolgu="seffaf"` dolgu ekleyip görünümü değiştirir |
| T3 | primitif dışı | `ListeSecimKarti` `OnayDairesi` | kendi 24 px dairesi | kalsın: düğmenin içindeki durum göstergesi, hap değil |
| T4 | basma tepkisi | `Panel` tutamacı | dokunulabilir ama `bas` sınıfı yok (skill §13: dokunulabilir her şey basılır) | düzelt |
| T5 | sabit değer | `Avatar` halka, `ArkadasMarkeri` silüet kenarı, `OrtakListeHapi` sayaç kenarı, `YerImiPini` SVG kenarı | beyaz `#fff` sabit yazılı; `--color-yuzey` tam olarak `#FFFFFF` | düzelt: tokena bağla, görünüm değişmez |
| T6 | sabit değer | `YerImiPini` (.24), `RozetCikartma` (.22) | şekli izleyen gölge `filter: drop-shadow(...)` sabit; gölge tokenları yalnızca `box-shadow` biçiminde | karar: `filter` için gölge tokenı açılsın mı? (`globals.css`) |
| T7 | sabit değer | 11 kullanım | süre tokenı yok: 150 / 160 / 200 / 300 ms. Eğri tokenları var, süre yok | karar: süre tokenları (`--sure-bas` 150, `--sure-gecis` 200, `--sure-panel` 300 gibi) açılsın mı? |
| T8 | sabit değer | `Pill` dolgu + kenar, `Kart` zemin | lila → pembe degradesi üç kez keyfi değer olarak yazılı | karar: degrade tokenı (`globals.css`) |
| T9 | sabit değer | `Cip.tsx` üst simge sayı | `text-[9px]`, en küçük punto tokenı 10 px | karar: 10 px'e mi çekilsin, 9 px tokenı mı açılsın? (çekilirse `SemtCipi` sayısı büyür) |
| T10 | aynı rol | `Cip` yatay (150 ms), `Cip` dikey (160 ms), `Pill` ve `IkiliPill` (200 ms) | seçili duruma renk/halka geçişi aynı rol, üç farklı süre | düzelt: `Cip` → 200 ms. Durağan görünüm değişmez |
| T11 | aynı rol | `ArkadasMarkeri` | harita işaretinin beyaz kenarı sözleşmesi 2.5 px (`.foto-marker-kutu`, silüet varyantı); aynı bileşenin avatar varyantı `Avatar halka="beyaz"` ile 2 px | düzelt: avatar varyantı da 2.5 px (0.5 px görünür fark) |
| T12 | tekrar | `Pill`, `GidecegimGittim`, `ListeSecimKarti`, `OrtakListeHapi` | onay işareti ✓ yolu dört kez çizilmiş; boy (13–20 px) ve kalınlık (2–3) bağlama göre | düzelt: tek glif (`Pill`'den export, boy + kalınlık props); her kullanım bugünkü değerleriyle |
| T13 | tekrar | `Pill`, `ListeSecimKarti` | `useZipla` iki kopya, aynı davranış | düzelt: `Pill`'den export, `ListeSecimKarti` onu kullansın |
| T14 | tekrar | `KayitRozeti`, `MekanNotu`, `Avatar` | `toLocaleUpperCase("tr")` yardımcısı üç yerde | kalsın: tek satır; paylaşmak bileşenler arasına import bağı ekler |
| T15 | yorum ≠ kod | `YerImiPini` | yorum "gövde `GidecegimGittim`'in yer imiyle AYNI glif" diyor; yollar farklı (pin yuvarlak köşeli, ikon keskin) | düzelt: yorum. Glifleri eşitlemek görünür değişiklik, istenirse ayrı karar |
| T16 | API | `etiket` prop'u | iki ayrı anlam: `Pill`, `IkiliPill`, `Kart`, `Panel`, `YerImiPini` → ekran okuyucu metni (görünmez); `RozetSayac`, `SeriRozeti`, `KayitRozeti`, `ListeAcKarosu` → görünen metin. Görünen metni değiştiren prop `BuradaAra` ve `OrtakListeHapi`'de ise `metin` | karar: adlandırma (öneri: görünmez olan `okunur`, görünen `etiket`). Kütüphane henüz hiçbir ekranda kullanılmıyor — değiştirmenin en ucuz anı şimdi |
| T17 | API | `aktif` / `secili` | `Pill`, `Cip`, `SemtCipi` `aktif`; `YerImiPini`, `ArkadasMarkeri`, `ListeSecimKarti` `secili` — ikisi de "seçili/basılı" demek (`ListeSecimKarti` da `aria-pressed` üretiyor) | karar: tek ada indirilsin mi? |
| T18 | API | `boy` / `boyut` | `boy` adlandırılmış kademe (`kucuk`/`orta`), `boyut` piksel; yalnızca `Avatar.boyut` ikisini de kabul ediyor | kalsın: kural tutarlı, `Avatar` istisnası belgeli |
| T19 | Türkçe kasa | kütüphanenin geneli | `<html lang="tr">` olduğu için Chrome CSS dönüşümünü Türkçe yapıyor — ölçüldü: `uppercase` "pin kişi" → "PİN KİŞİ", `lowercase` "İSMAİL" → "ismail". `lang="en"`'de aynı metin "PIN KIŞI" / "i̇smai̇l". Yani `KayitRozeti`, `MekanNotu`, `Avatar`'daki "CSS uppercase bozar" gerekçesi bu uygulamada Chrome için doğru değil. iOS Safari burada sınanamadı | karar: iOS Safari'de sınansın. O zamana kadar JS'te büyütme (güvenli taraf) kalıyor; yorumlar "Safari doğrulanmadı" diye düzeltilecek (düzelt: yorum) |
| T20 | Türkçe kasa | `Cip` adı, `Pill` içeriği, `RozetSayac` etiketi, `RozetCikartma` alt satırı, `IkiliPill` | dinamik metne yalnızca CSS `lowercase`, JS karşılığı yok. `lang="tr"`'de doğru; T19'un Safari sonucuna bağlı | karar (T19 ile) |
| T21 | Türkçe kasa | `Pill` ikon yuvası | `lowercase` miras kalıyor | kalsın: Faz 2'de `OrtakListeHapi`'de çözüldü; ikon yuvasına metin koyan başka kullanım yok |

**Tutarlı bulunanlar:** seçim halkası her yerde 2 px `--color-gri-900`;
yer tutucuların hepsi `animate-pulse` + `motion-reduce:animate-none`;
dönen halka hareket azaltmada duruyor; `onTikla` (tıklama) / `onSec` (id
seçimi) / `onDegis` (değer değişimi) anlamları bileşenler arasında aynı;
`pasif` ve `yukleniyor` adları ortak. Keyfi Tailwind değerlerinin geri
kalanı ya tarayıcıda ölçülmüş yer tutucu boyu (`KayitRozeti`,
`DereceGostergesi`) ya da yerleşime özgü (`Cip` dikey genişliği, etiket
kaydırması) — kalsın.

**Özet:** 21 bulgu · 8 düzelt (T1, T4, T5, T10, T11, T12, T13, T15; ayrıca
T19'un yorum kısmı) · 8 karar (T6, T7, T8, T9, T16, T17, T19, T20) · 5 kalsın
(T2, T3, T14, T18, T21).

### 3b düzeltme grupları

1. **Pill etkileşimsiz biçimi** — T1.
2. **Kenar, süre, basma** — T4, T5, T10, T11.
3. **Glif, kanca, yorum** — T12, T13, T15, T19 yorumları.

## Paket 3b — düzeltmeler

### Grup 1 — Pill etkileşimsiz biçimi (T1)

`Pill`'e `etkilesimsiz` prop'u: `<span>` üretir, `bas` sınıfı ve
`aria-pressed` / `disabled` / `aria-busy` yok, `onTikla` ve `href` yok
sayılır. Varsayılan `false`, yani mevcut her kullanım aynı. Örnek
`/tasarim/primitifler`'e eklendi.

| sayfa | fark | neden |
|---|---|---|
| `/tasarim/degerlendirme` | 53 `button` → `span`; konum, boyut ve stil farkı **0** (etiket adı yok sayılarak öğe öğe karşılaştırıldı) | `DereceGostergesi` çipleri artık `inert` kap yerine etkileşimsiz Pill |
| `/tasarim/harita-eksikleri` | arkadaş etiketleri 22 → 24 px (1 px yukarı, 1 px aşağı büyüdü) | elle çizilmiş hap standart küçük Pill'den 2 px kısaydı; artık Pill'in kendisi. Farkın kendisi düzeltilen tutarsızlık |
| `/tasarim/primitifler` | yeni "etkileşimsiz" kutusu, altındaki içerik aşağı kaydı | varyantın önizlemesi |
| diğerleri | yok | — |
