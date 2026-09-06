/* Kadıköy kara sınırı testi — `node scripts/kontrol/kara-testi.mjs`
 *
 * karadaMi() yeni mekan eklerken "burası deniz görünüyor" uyarısını veriyor.
 * Sessizce yanlışa dönmesi kolay bir hesap (çokgen, izdüşüm sabitleri), o
 * yüzden bilinen noktalarla sabitlendi. Beklenenler gerçek olaylardan:
 * tohum verisindeki iki mekan tam olarak bu testle denizde bulunmuştu.
 *
 * Node .ts'i doğrudan çalıştırabiliyor (tip soyma), yani ÜRÜN kodu test
 * ediliyor — kopyası değil. */
import { karadaMi } from "../../lib/kadikoy-icinde.ts";

const DURUMLAR = [
  ["Moda Sahil Parkı (düzeltilmiş)", 40.9802, 29.0281, true],
  ["Poyraz Kahve (düzeltilmiş)", 40.9805, 29.0255, true],
  ["Moda Sahil Parkı (eski, denizde)", 40.9772, 29.0301, false],
  ["Poyraz Kahve (eski, denizde)", 40.9788, 29.0246, false],
  ["Moda Burnu açığı", 40.974, 29.027, false],
  ["Marmara açığı", 40.96, 29.03, false],
  ["Kadıköy Çarşı", 40.9903, 29.0246, true],
  ["Fenerbahçe Parkı", 40.97, 29.043, true],
  ["Üsküdar (başka ilçe)", 41.025, 29.015, false],
];

let hata = 0;
for (const [ad, lat, lng, beklenen] of DURUMLAR) {
  const sonuc = karadaMi(lat, lng);
  if (sonuc !== beklenen) hata++;
  console.log(` ${sonuc === beklenen ? "✓" : "✗"} ${ad.padEnd(34)} ${sonuc ? "karada" : "dışarıda"}`);
}
console.log(hata ? `${hata} test başarısız` : `${DURUMLAR.length} testin hepsi geçti`);
process.exit(hata ? 1 : 0);
