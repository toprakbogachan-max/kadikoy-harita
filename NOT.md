# Faz 2 — açık kararlar

`SPEC-faz2.md`'nin istediği not: atlanan paketler ve insana sorulması gereken
kararlar. Buradaki hiçbir madde kesinleşmiş değil; bileşenler her birinde iki
seçeneğe de açık bırakıldı.

**Atlanan paket yok.**

## Paket 1 — harita ek işaretleri

Dosyalar: `YerImiPini` (spec: BookmarkPin), `ArkadasMarkeri` (AktifKisiIsareti),
`SemtCipi` (SehirCipi). Önizleme: `/tasarim/harita-eksikleri`.

- **Yer imi pininin rengi.** Spec ve referans mavi diyor. Ürün kuralı ise
  "kaydetmenin rengi nane, mavi yalnızca çalışıyor / burada ara" ve
  `--color-mavi` haritada zaten kullanıcının kendi konum noktası. Varsayılan
  nane yapıldı, `ton="mavi"` duruyor. Nane'nin doygun bir tokenı yok, dolgu
  şimdilik `--color-rozet-nane-ink`. **Soru:** hangisi, ve nane kalırsa
  doygun bir nane tokenı açılsın mı?
- **Arkadaş marker'ının verisi yok.** `places_nearby` "bu mekanı kim kaydetti"
  bilgisini döndürmüyor. Bileşen saf sunum; `eylem` spec'teki üç değerli
  birleşim yerine düz `string`, çünkü hangi eylemlerin var olduğu veri
  modelinin kararı. **Soru:** arkadaş modu için RPC'ye mi eklenecek?
- **Şehir çipi semt çipine uyarlandı.** Kadıköy tek ilçe, dünya zoom'u yok.
  Çip ancak pin sayısı taşırsa altlık haritanın semt etiketinden fazlasını
  söylüyor. **Soru:** semt çipi kalsın mı, yoksa "bu üründe karşılığı yok"
  deyip atlansın mı?

## Paket 2 — burada ara

Dosya: `BuradaAra` (spec: AraBuradan). Önizleme: `/tasarim/harita-eksikleri`
(Paket 1 ile aynı sayfa; 390 px çerçevede dördü birlikte sınanıyor).

Açık karar yok. Metin çalışırken değişmiyor ("aranıyor…"a dönseydi hap
genişlik değiştirip yerinden sıçrardı); durum ekran okuyucuya `aria-label` ve
`aria-busy` ile gidiyor.

## Paket 4 — değerlendirme

Dosyalar: `DereceGostergesi`, `YineGiderMisin` (spec: TekrarGiderMiydin).
Önizleme: `/tasarim/degerlendirme`.

### Puan eşiği (öneri — kesinleştirilmedi)

Şemadaki gerçek aralık spec'in yazdığı 0–10 değil, **1–10 ve yarım adımlı**
(`pins.rating numeric(3,1)`, `PinFormu` kaydırıcısı `step={0.5}`, varsayılan 7).
Mekan özetindeki ortalama ise herhangi bir ondalık olabilir. Bu yüzden eşik tam
sayı kovası değil, sürekli aralık:

| puan | kademe |
|---|---|
| < 4 (1–3,5) | beğenmedim 😕 |
| 4 – < 7 (4–6,5) | idare eder 😐 |
| 7 – < 9 (7–8,5) | beğendim 😋 |
| ≥ 9 (9–10) | favorim 😍 |

Neden bu eşik:

- **Puanlar yukarı yığılıyor.** Elimizdeki tek puan verisi demo pinleri (15
  pin, `scripts/tohum/tohum-demo.sql`): hepsi 6,5 ile 9,5 arasında, ortanca 8.
  İnsanlar zaten sevdikleri yere pin atıyor. Spec'teki örnek eşikle (6–8
  beğendim) 6'lık bir puan, ortancanın iki puan altında olduğu hâlde
  "beğendim" okunurdu.
- **"Belki" cevapları sınırı gösteriyor.** `would_return = 'belki'` diyen iki
  pin 6,5 ve 7'de. İdare eder / beğendim sınırı tam oradan geçiyor.
- **Favorim nadir kalmalı.** ≥ 9 demo verisinde 15 pinin 3'ü. Eşik 8,5 olsaydı
  6'sı olurdu ve "favorim" ayırt edici olmaktan çıkardı.
- **7 kaydırıcının başlangıç değeri.** Kaydırıcıya dokunmadan pin atan biri
  "beğendim" okunuyor. Bu tartışmaya açık, aşağıdaki sorulardan biri.

Karşı seçenek: spec'in örneği (0–2 / 3–5 / 6–8 / 9–10). Daha eşit aralıklı ama
yukarı yığılan bir dağılımda dört kademenin ikisi neredeyse hiç görünmez.

**Sorular:**
1. Eşik bu mu olsun? Demo verisi uydurma; gerçek pin birikince
   `place_summary`'nin `rating_buckets` çıktısıyla yeniden bakılmalı.
2. Kaydırıcının varsayılanı 7 kalırsa dokunulmamış puan "beğendim" sayılıyor.
   Bu kabul mü?

### Favorim kalbi

Spec `TekrarGiderMiydin`'e ayrı bir "favorim" kalp düğmesi istiyor. Şemada
favori alanı yok. Bileşende kalp yalnızca `onFavoriDegis` verilirse çiziliyor,
durumu dışarıdan geliyor. **Soru:** favori ayrı bir bayrak mı olacak (yeni
sütun), yoksa puanın ≥ 9 okunuşu mu (yukarıdaki "favorim" bandı)? İkincisi
yeni veri gerektirmez ama kullanıcı puanı değiştirmeden kalbi açıp kapatamaz.

### İki değil üç seçenek

Spec 👎 / 👍 ikilisi diyor. `pins.would_return` ise `'evet' | 'belki' | 'hayır'`
tutuyor ve `PinFormu` üçünü de soruyor. İkiye indirmek "belki" cevaplarını
kaybettirirdi; bileşen şemaya uydu. **Soru:** "belki" üründe kalıyor mu?

## Paket 5 — liste / curation

Dosyalar: `ListeSecimKarti` + `ListeSecici` (spec: CurationSecici),
`ListeAcKarosu` (YeniCurationKarosu), `OrtakListeHapi` (BirlikteCalis).
Önizleme: `/tasarim/kaydetme-eksikleri` (seçici + karo) ve
`/tasarim/profil-eksikleri` (ortak liste hapı).

- **Gizlilik bayrağı modele çevrilmiyor.** `lists.is_public` şemada var ama
  `lib/model.ts`'teki `Liste` tipinde yok; kilit rozeti şu an yalnızca props'tan
  geliyor. Montajda model + `lib/veri.ts` o alanı taşımalı.
- **Not var, bağlantı yok.** Referans kartında "not ekle" ve "bağlantı ekle"
  var; `list_items.note` sütunu olduğu için yalnızca not çizildi.
- **Ortak listenin veri modeli yok.** `lists` tek `owner_id` tutuyor; katkıcı
  tablosu, davet bağlantısı, çoklu yazma yetkisi yok. Hap saf sunum.
  **Soru:** ortak liste yol haritasında mı? Değilse hap montajda beklesin.
- Pill primitifinin degrade kenarlık varyantı Faz 1.5'te zaten eklenmişti
  (`kenar="degrade"`); yeni varyant ya da token açılmadı.

## Paket 6 — haftalık seri rozeti

Dosya: `SeriRozeti` (+ çift rozet için `SeriRozetSatiri`). Önizleme:
`/tasarim/profil-eksikleri`.

- **"Seri" kavramı kod tabanında yok.** Ne sayaç, ne hafta tanımı, ne de
  seriyi neyin ilerlettiği belli. **Soru:** bir hafta "en az bir pin" mi,
  "en az bir kayıt" mı? Hafta pazartesi mi başlıyor?
- **Etiket altta değil yanda.** Spec "içinde sayı + altında iki satır etiket"
  diyor. Uygulama `corner-tasarim` skill'inin ekran görüntüsünden doğrulanan
  §14 kalıbını izliyor: "yanlarında iki satırlık küçük harf gri etiket".
  Profil başlığında yan yana iki rozet dar ekranda da tek satıra sığıyor.
- **Sıralama rozeti bileşeni yazılmadı.** Çift rozetin ikinci yarısının
  ("kadıköy sırası") ne verisi ne hesabı var. Önizlemede doğrudan `RozetSayac`
  ile gösteriliyor.
- **Ateş eşiği 4 hafta** (`atesEsigi`) — "bir ay". Ürün eşiği, tasarım sabiti
  değil.

## Faz 2'nin geneli

### Adlar spec'le birebir değil

Bileşenler spec'teki İngilizce/karma adlar yerine Türkçe envanter adlarıyla
yazıldı. Önizleme sayfaları da paket başına değil ekran başına toplandı; böylece
aynı ekranda duracak bileşenler 390 px çerçevede yan yana sınanabiliyor.

| paket | spec adı | dosya | önizleme |
|---|---|---|---|
| 1 | BookmarkPin | `YerImiPini` | `/tasarim/harita-eksikleri` |
| 1 | AktifKisiIsareti | `ArkadasMarkeri` | `/tasarim/harita-eksikleri` |
| 1 | SehirCipi | `SemtCipi` | `/tasarim/harita-eksikleri` |
| 2 | AraBuradan | `BuradaAra` | `/tasarim/harita-eksikleri` |
| 3 | KayitRozeti | `KayitRozeti` | `/tasarim/mekan-eksikleri` |
| 3 | ToTryBeen | `GidecegimGittim` | `/tasarim/mekan-eksikleri` |
| 3 | EditoryalBolum | `MekanNotu` | `/tasarim/mekan-eksikleri` |
| 4 | DereceGostergesi | `DereceGostergesi` | `/tasarim/degerlendirme` |
| 4 | TekrarGiderMiydin | `YineGiderMisin` | `/tasarim/degerlendirme` |
| 5 | CurationSecici | `ListeSecimKarti` | `/tasarim/kaydetme-eksikleri` |
| 5 | YeniCurationKarosu | `ListeAcKarosu` | `/tasarim/kaydetme-eksikleri` |
| 5 | BirlikteCalis | `OrtakListeHapi` | `/tasarim/profil-eksikleri` |
| 6 | SeriRozeti | `SeriRozeti` | `/tasarim/profil-eksikleri` |
| 7 | — | `globals.css` `--aci-cikartma` | `/tasarim/primitifler` |

**Soru:** Montajdan önce adlar spec'e çekilsin mi, yoksa envanter adları mı
kalıcı?

### Paket 3 — gideceğim / gittim spec kararına aykırı

Spec açıkça "segmented pill (birleşik kapsül) kalsın, ayrı daire çifti
varyantı eklenmedi, o kararı bozma" diyor. `GidecegimGittim` (commit
`3011ac9`) **iki ayrı daire** olarak yazıldı. Faz 1.5'in `IkiliPill`'i
`/tasarim/primitifler`'de segmented hâliyle duruyor. **Soru:** daire çifti
bilinçli bir karar değişikliği olarak kabul mü, yoksa bileşen `IkiliPill`
üstüne yeniden mi yazılsın?

### Paket 7 zaten bitmişti

`.yapistir` keyframe'inin `--aci-cikartma`'ya bağlanması Faz 1.5'te
(`2779396`) yapıldı. `/tasarim/primitifler`'de −9°, +7° ve −18° çıkartmalar
animasyonlu. Bu fazda ayrıca iş çıkmadı.
