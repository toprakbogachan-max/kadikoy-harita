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
