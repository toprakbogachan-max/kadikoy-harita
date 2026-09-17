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

