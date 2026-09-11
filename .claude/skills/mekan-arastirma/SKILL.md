---
name: mekan-arastirma
description: Kadıköy Harita için mekan keşfi, doğrulama, fotoğraf/yorum analizi ve pin oluşturma hattı. "mekan bul", "yeni mekan araştır", "mekan havuzu çıkar", "şu mekanları pinle", "Kadıköy'de mekan" gibi isteklerde kullan. Sosyal medya öncelikli keşif → Google Maps doğrulama → Excel havuzu (onay kapısı) → fotoğraf + son 6 ay yorum analizi → pin.
---

# Mekan Araştırma Hattı

Kadıköy Harita (https://kadikoy-harita.vercel.app) için mekan bulup pin'e kadar götüren
beş fazlı hat. Fazlar sırayla çalışır ve **iki kapısı vardır** — kapıda dur, Boğaçhan onaylamadan
sonraki faza geçme.

```
1 KEŞİF → 2 DOĞRULAMA → [KAPI A: Excel] → 3 FOTOĞRAF → 4 YORUM → [KAPI B: onay] → 5 PİN
```

## Bağlayıcı kurallar

- **Yorumlar en fazla son 6 ay.** Daha eskisi analize girmez. Bu istisnasız.
- **Excel, fotoğraftan önce gelir.** Mekanlar bulunur → tabloya dökülür → onay → sonra fotoğraf.
- **Pin atma izni her seferinde ayrıca alınır.** "Mekan bul" demek "pin at" demek değildir.
- **Fotoğraflarda yazı/filigran olmaz.** Ambiyans 2 + yemek 2 + opsiyonel 1 = mekan başına 5.
- **Pin notları araştırma dili taşımaz.** "yorumlarda", "havuzda", "en çok tavsiye edilen"
  gibi ifadeler nota girmez; not oraya gitmiş birinin anlattığı gibi okunur. Uydurma birinci
  tekil deneyim de yazılmaz. Kural ve örnekler: `references/uslup.md` — **yayınlamadan önce oku.**
- **Zaten pinli mekanlar havuza girmez.** Uygulamadan mevcut pin listesini çek, çıkar.
- **Bu repo public.** Araştırma verisi (mekan listeleri, havuz tabloları) repoya girmez —
  ikinci beyinde durur. Bkz. `references/gecmis.md`.
- Halüsinasyon yasak: puan, yorum sayısı, adres, açık/kapalı — hepsi Google Haritalar'dan
  o an okunur. Eğitim verisinden yazma.

## Faz 0 — Geçmişi oku

`references/gecmis.md` seni ikinci beyindeki geçmiş dosyasına yönlendirir. Aynı mekanı
ikinci kez araştırma; tur bitince o dosyayı güncelle.

## Faz 1 — Keşif (öncelik sırası bağlayıcı)

Kaynak sırası Boğaçhan'ın tercihi, değiştirme:

1. **TikTok** — `#kadikoymekanonerileri`, `#kadikoyyemek`, `#modakafe`. Birinci öncelik;
   sosyal medyanın reklam gücü yüksek, oradaki mekanlar popülerleşiyor.
2. **Instagram** — `#kadikoyyemek`. Gönderi caption'larındaki `@etiketler` ve numaralı
   listeler mekan adı verir.
3. **Oggusto** — Moda mekanları listesi (kategori başlıklarıyla ~45 mekan).
4. **Gurman Atlas (Vedat Milor)** — Kadıköy listesi (~20 doğrulanmış işletme).
5. Varsa popüler Türk influencer'ların Google Maps listeleri.

**TripAdvisor kullanma** — Boğaçhan oradaki mekanları beğenmedi.

URL'ler ve sayfa-içi çıkarma kodu: `references/kaynaklar.md`.

Çıktı: ham aday isim listesi + her ismin hangi kaynaklarda geçtiği. **Kaç kaynakta geçtiği
en değerli sinyal** — üç kaynakta görünen bir mekan, tek kaynaktakinden daha güvenli.

## Faz 2 — Google Maps doğrulaması

Her aday için: resmi ad, kategori, puan, yorum sayısı, adres, semt, fiyat bandı, açık/kapalı.
Yöntem ve hazır extractor: `references/maps.md`.

Geçici/kalıcı kapalı olan **elenir** (skoru otomatik 0).

## KAPI A — Excel havuzu

`scripts/havuz.py` ile üret. Girdi bir JSON, çıktı biçimlendirilmiş .xlsx:

```bash
python3 scripts/havuz.py adaylar.json cikti.xlsx
```

JSON şeması ve sütun/formül mantığı script'in başındaki docstring'de. Özet:

| Sütun | Kaynak |
| --- | --- |
| Mekan, Kategori, Mutfak, Semt, Adres | Google Maps |
| Google puanı, Yorum sayısı, Kaynak sayısı | elle girilen ham veri (mavi font) |
| Kaynaklar | hangi kaynaklarda geçti |
| Popülerlik, Sosyal skor, Öncelik skoru | **formül** — hardcode etme |
| Fiyat, Açık mı, Durum, Not | Maps + değerlendirme |

Öncelik skoru = `(puan/5)×45 + (min(yorum,5000)/5000)×30 + (min(kaynak,3)/3)×25`, kapalıysa 0.

Formül yazdıktan sonra **mutlaka** `python3 /mnt/skills/public/xlsx/scripts/recalc.py cikti.xlsx`
(ya da yerelde LibreOffice ile) çalıştır; `total_errors: 0` görmeden teslim etme.

**Burada dur.** Tabloyu teslim et, hangi mekanlarla devam edileceğini sor.

## Faz 3 — Fotoğraf

Mekan başına 5 kare: 2 ambiyans, 2 yemek, 1 opsiyonel. Üzerinde yazı/filigran olmayacak.

Kaynak sırası: Oggusto/Gurman Atlas görselleri kullanılamıyorsa **Google Maps'ten** topla.
Toplama ve görsel seçim (kontakt sayfası) tekniği: `references/maps.md` → "Fotoğraf".

Bilinen tuzak: Maps'in "Ortam"/"Yeme-içme" kategori filtreleri bazen bozuk çalışıp aynı veya
alakasız seti döndürüyor. Böyle bir durumda **kötü fotoğrafla devam etme** — durumu söyle,
mekan sayısını azaltmayı öner.

## Faz 4 — Yorum analizi (son 6 ay)

Google Maps yorum panelinden topla, 6 aydan eskiyi at. Teknik: `references/maps.md` → "Yorumlar".
Sanal liste sadece **gerçek fare tekerleği** ile yükleniyor; `scrollTop` ve sentetik
`WheelEvent` çalışmıyor — `computer scroll` ile kaydır, `setInterval` biriktiriciyle topla.

Her mekan için çıkar:
- Tekrar eden 3-5 olumlu tema
- Tekrar eden 3-5 şikâyet
- Tek paragraf sentez
- **Her fotoğrafa o karenin gösterdiği şeyle ilgili somut bir not** (genel övgü değil)

Notları yazmadan önce `references/uslup.md` oku. Analizin kendisi Excel'de ve geçmiş
dosyasında kalır; pine sadece mekanı bilen birinin söyleyeceği şey girer.

## KAPI B — Pin onayı

Fotoğraflar + notlar + analiz hazır. Teslim et ve **pin atılsın mı diye sor.** Onay gelmeden
uygulamaya dokunma.

## Faz 5 — Pin oluşturma

Form şeması, alan alan doldurma sırası ve otomasyon notları: `references/pin.md`.

En kritik tuzak: **pin formundayken haritaya tıklama** — mekan seçimi sıfırlanıp "YENİ MEKAN"
moduna düşüyor. Fotoğraflar kalıyor ama mekan bağı gidiyor.
