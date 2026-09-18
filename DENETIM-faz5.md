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
