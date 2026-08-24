# Tohumlama

Veritabanını gerçek Kadıköy verisiyle doldurur.

## Çalıştırma sırası (Supabase → SQL Editor)

1. `../../../schema.sql` — şema değiştiyse tekrar çalıştır (yeniden çalıştırmaya dayanıklı)
2. `tohum-mekanlar-1.sql` … `-4.sql` — 1052 gerçek mekan
3. `tohum-demo.sql` — demo hesaplar, hayali mekanlar, pinler *(isteğe bağlı)*

Yayına çıkmadan önce: **`tohum-temizle.sql`**

## Üretim

```
node scripts/tohum/osm-cek.mjs        # OpenStreetMap → mekanlar.json
node scripts/tohum/commons-kapak.mjs  # Wikimedia kapakları → mekanlar.json
node scripts/tohum/sql-uret.mjs       # mekanlar.json → tohum-mekanlar-*.sql
node scripts/tohum/demo-uret.mjs      # lib/demo.ts → tohum-demo.sql
```

`.sql` dosyaları üretilmiştir — elle düzenleme, kaynağı düzeltip yeniden üret.

## Neden SQL dosyası, neden istemciden değil?

SQL Editor `postgres` rolüyle çalışır, RLS'e takılmaz. İstemciden yazmak gizli
`service_role` anahtarını gerektirirdi; o anahtara hiç dokunmuyoruz.

## Atıf yükümlülüğü

- **Mekan verisi:** © OpenStreetMap katkıcıları, ODbL. Arayüzde atıf **zorunlu**.
- **Kapak görselleri:** Wikimedia Commons. Lisans ve fotoğrafçı `places.cover_credit`
  alanında; CC-BY ailesi bunu **görünür yerde** göstermeyi şart koşar.

## Demo verisi hakkında

`tohum-demo.sql` prototipin 12 **hayali** mekanını `demo-` ön ekli slug'larla ekler.
Pin metinleri bu hayali yerler için yazılmıştı; gerçek işletmelere bağlanmıyorlar —
yoksa gerçek işletmeler hakkında uydurma iddia yayınlamış olurduk.

Yine de yayına çıkmamalı: haritada var olmayan yerler görünür. İşaretler:
slug `demo-*` · e-posta `@demo.invalid` · medya yolu `demo://*`

Demo hesap şifresi: `demo12345`

## Bilinen tuzaklar

- **Türkçe İ:** `"İ".toLowerCase()` tek harf değil, `i` + U+0307 verir. Naif bir
  `[^a-z0-9]` temizliği o noktayı ayraç sanıp "İsmail" → "i-smail" yapar.
  `ortak.mjs` bunu NFD ile çözer — slug üretiminde mutlaka onu kullan.
- **Kesme işareti:** `'Karusel'de'` SQL metnini erken kapatır. Üreteçler `''` ile
  kaçırıyor; elle SQL yazarsan dikkat.
- **Overpass 504:** sunucu sık meşgul olur, `osm-cek.mjs` aynalar arasında dönüyor.
- **Commons 429:** hız sınırı. `commons-kapak.mjs` üstel geri çekilme yapıyor,
  User-Agent'ta iletişim bilgisi olmadan istekler reddedilir.
