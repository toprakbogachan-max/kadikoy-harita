# Faz 2 — kararlar

`SPEC-faz2.md`'nin istediği not. İlk hâlinde atlanan paketleri ve insana
sorulacak kararları topluyordu; soruların hepsi **2026-09-17**'de
cevaplandı ve aşağıya karar olarak işlendi.

**Atlanan paket yok.** Kararların doğurduğu ama Faz 2'nin kapsamında
olmayan işler en altta, "Sonraya kalan işler"de.

## Paket 1 — harita ek işaretleri

Dosyalar: `YerImiPini` (spec: BookmarkPin), `ArkadasMarkeri` (AktifKisiIsareti),
`SemtCipi` (SehirCipi). Önizleme: `/tasarim/harita-eksikleri`.

- **Yer imi pini nane.** Mavi haritada zaten kullanıcının kendi konum noktası,
  kaydetmenin rengi nane. Pin için doygun `--color-nane` (`#0F7F62`) tokeni
  açıldı: beyazla 4.96:1, harita zemini ile 4.05:1 — mavinin (5.14 / 4.20)
  ışıklığına yakın. Yalnızca bu pinin dolgusu; buton ya da yüzey rengi değil.
  Referansa sadık mavi varyant kaldırıldı.
- **Arkadaş verisi ayrı bir RPC'den gelecek.** Yalnızca arkadaş modunda
  çağrılacak; `places_nearby` her harita hareketinde koştuğu için
  genişletilmiyor.
- **Semt çipi kalıyor, yalnızca pin sayısıyla.** Sayısız çip altlık haritanın
  semt etiketini tekrar ediyordu; `sayi` zorunlu prop yapıldı. `ArkadasMarkeri`
  içindeki `eylem` düz `string` kaldı, çünkü hangi eylemlerin var olduğu veri
  modelinin kararı.

## Paket 2 — burada ara

Dosya: `BuradaAra` (spec: AraBuradan). Önizleme: `/tasarim/harita-eksikleri`.

Karar gerektirmedi. Metin çalışırken değişmiyor ("aranıyor…"a dönseydi hap
genişlik değiştirip yerinden sıçrardı); durum ekran okuyucuya `aria-label` ve
`aria-busy` ile gidiyor.

## Paket 3 — mekan detayı

Dosyalar: `KayitRozeti`, `GidecegimGittim` (spec: ToTryBeen), `MekanNotu`
(EditoryalBolum). Önizleme: `/tasarim/mekan-eksikleri`. Commit `3011ac9`.

- **Gideceğim / gittim iki ayrı daire olarak kalıyor.** Spec, Faz 1.5'in
  segmented pill kararının bozulmamasını istiyordu; bileşen daire çifti olarak
  yazılmıştı ve bu bilinçli bir karar değişikliği olarak kabul edildi.
  `IkiliPill` primitifi başka yerler için duruyor.

## Paket 4 — değerlendirme

Dosyalar: `DereceGostergesi`, `YineGiderMisin` (spec: TekrarGiderMiydin).
Önizleme: `/tasarim/degerlendirme`.

### Puan eşiği

Şemadaki gerçek aralık spec'in yazdığı 0–10 değil, **1–10 ve yarım adımlı**
(`pins.rating numeric(3,1)`, `PinFormu` kaydırıcısı `step={0.5}`). Mekan
özetindeki ortalama ise herhangi bir ondalık olabilir. Bu yüzden eşik tam sayı
kovası değil, sürekli aralık (`puanKademesi`):

| puan | kademe |
|---|---|
| < 4 (1–3,5) | beğenmedim 😕 |
| 4 – < 7 (4–6,5) | idare eder 😐 |
| 7 – < 9 (7–8,5) | beğendim 😋 |
| ≥ 9 (9–10) | favorim 😍 |

Neden bu eşik, spec'in örneği (0–2 / 3–5 / 6–8 / 9–10) değil:

- **Puanlar yukarı yığılıyor.** Elimizdeki tek puan verisi demo pinleri (15
  pin, `scripts/tohum/tohum-demo.sql`): hepsi 6,5 ile 9,5 arasında, ortanca 8.
  İnsanlar zaten sevdikleri yere pin atıyor. Spec'in örneğinde 6'lık bir puan,
  ortancanın iki puan altında olduğu hâlde "beğendim" okunurdu ve alt iki
  kademe neredeyse hiç görünmezdi.
- **"Belki" cevapları sınırı gösteriyor.** `would_return = 'belki'` diyen iki
  pin 6,5 ve 7'de; idare eder / beğendim sınırı tam oradan geçiyor.
- **Favorim nadir kalıyor.** ≥ 9 demo verisinde 15 pinin 3'ü; eşik 8,5 olsaydı
  6'sı olurdu ve ayırt edici olmaktan çıkardı.
- **Kaydırıcının varsayılanı 7 kalıyor.** Dokunulmadan atılan pin "beğendim"
  okunuyor; bu kabul edildi.

Demo verisi uydurma olduğu için gerçek pinler birikince eşiğe
`place_summary`'nin `rating_buckets` çıktısıyla yeniden bakılacak.

### Favorim = puanın ≥ 9 okunuşu

Ayrı bir favori sütunu açılmadı. Favorim, eşiğin en üst kademesi; kalp
`YineGiderMisin`'de düğme değil, sorunun yanında beliren bir rozet ve
`puanKademesi`'nden okunuyor. Kalbi açıp kapatmanın yolu puanı değiştirmek.

### Üç seçenek kalıyor

Spec 👎 / 👍 ikilisi diyordu. `pins.would_return` ve `PinFormu` evet / belki /
hayır tutuyor; "belki" bu üründe bilgi taşıdığı için kalıyor.

## Paket 5 — liste / curation

Dosyalar: `ListeSecimKarti` + `ListeSecici` (spec: CurationSecici),
`ListeAcKarosu` (YeniCurationKarosu), `OrtakListeHapi` (BirlikteCalis).
Önizleme: `/tasarim/kaydetme-eksikleri` (seçici + karo) ve
`/tasarim/profil-eksikleri` (ortak liste hapı).

- **Ortak liste yol haritasında.** Katkıcı tablosu, davet bağlantısı ve çoklu
  yazma için RLS ayrı bir veri modeli işi olarak planlanacak; o kurulana kadar
  `OrtakListeHapi` montaja girmiyor.
- **Not var, bağlantı yok.** Referans kartında "not ekle" ve "bağlantı ekle"
  var; `list_items.note` sütunu olduğu için yalnızca not çizildi.
- Pill'in degrade kenarlık varyantı Faz 1.5'te zaten vardı (`kenar="degrade"`);
  yeni varyant ya da token açılmadı.

## Paket 6 — haftalık seri rozeti

Dosya: `SeriRozeti` (+ çift rozet için `SeriRozetSatiri`). Önizleme:
`/tasarim/profil-eksikleri`.

- **Seri tanımı:** bir haftayı seriye sayan şey **en az bir pin** (kaydetmek
  saymaz). Hafta **pazartesi** başlar, **İstanbul saatine** göre (ISO hafta).
  `risk` = seri sürüyor ama içinde bulunulan haftada henüz pin yok.
- **Etiket altta değil yanda.** Spec "altında iki satır" diyordu; uygulama
  `corner-tasarim` skill'inin ekran görüntüsünden doğrulanan §14 kalıbını
  izliyor ("yanlarında iki satırlık küçük harf gri etiket").
- **Ateş eşiği 4 hafta** (`atesEsigi`, "bir ay").
- Çift rozetin ikinci yarısı ("kadıköy sırası") için ayrı bileşen yazılmadı;
  ne verisi ne hesabı var, önizlemede doğrudan `RozetSayac` ile gösteriliyor.

## Paket 7 — çıkartma açısı

`.yapistir` keyframe'inin `--aci-cikartma`'ya bağlanması Faz 1.5'te
(`2779396`) yapılmıştı. `/tasarim/primitifler`'de −9°, +7° ve −18° çıkartmalar
animasyonlu; bu fazda ayrıca iş çıkmadı.

## Adlar Türkçe kalıyor

Bileşenler spec'teki İngilizce/karma adlar yerine Türkçe envanter adlarıyla
yazıldı (projenin "dosya adları Türkçe" kuralı) ve bu kalıcı. Önizlemeler de
paket başına değil ekran başına toplandı; aynı ekranda duracak bileşenler
390 px çerçevede yan yana sınanıyor.

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

## Sonraya kalan işler

Faz 2 bileşen + önizleme fazıydı; aşağıdakiler kararlarla netleşti ama veri
katmanı ya da montaj işi olduğu için burada yapılmadı.

- **Arkadaş modu RPC'si** — "bu mekanı kim kaydetti, ne yaptı"; yalnızca
  arkadaş modunda çağrılır (Paket 1).
- **Ortak liste veri modeli** — katkıcı tablosu, davet bağlantısı, RLS
  (Paket 5).
- **Seri hesabı** — en az bir pin / pazartesi / İstanbul tanımıyla hafta
  sayacı ve `risk` durumu (Paket 6).
- **`lists.is_public` modele** — şemada var ama `lib/model.ts`'teki `Liste`
  tipinde yok; kilit rozeti montajda bunu bekliyor (Paket 5).
- **Eşiği gerçek veriyle yeniden değerlendirme** — `rating_buckets` (Paket 4).
- **Montaj** — bileşenlerin gerçek ekranlara ve `Harita.tsx`'in ham DOM
  marker'larına taşınması.
