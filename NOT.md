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

