/**
 * Türkçe metin sadeleştirme — iki tohum scripti de bunu kullanır.
 *
 * DİKKAT: JavaScript'te "İ".toLowerCase() tek harf vermez, "i" + U+0307
 * (birleşen nokta) verir. Naif bir [^a-z0-9] temizliği o noktayı ayraç sanıp
 * kelimeyi ikiye böler: "İsmail" → "i-smail". Slug'lar kalıcı kimlik olduğu
 * için bu sessiz bir veri hatasıdır.
 *
 * Çözüm: küçült → NFD ile ayrıştır → birleşen işaretleri at. NFD sayesinde
 * ç/ğ/ö/ş/ü/â/î/û zaten c/g/o/s/u/a/i/u'ya iner. Tek istisna "ı" (U+0131):
 * ayrı bir harf, ayrıştırılamaz, elle eşlenir.
 */
export const sade = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // birleşen aksanlar
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const slugla = (s) =>
  sade(s).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
