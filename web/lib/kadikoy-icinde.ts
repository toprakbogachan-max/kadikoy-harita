import { KADIKOY_YOLU, miniX, miniY } from "./kadikoy-sekli.ts";

/**
 * Bir koordinat Kadıköy'ün KARA sınırının içinde mi?
 *
 * Neden var: yeni mekan eklerken iğneyi denize bırakmak mümkün ve kimse fark
 * etmiyor. Tohum verisinde iki mekan (Moda Sahil Parkı, Poyraz Kahve) tam
 * olarak böyle denizde duruyordu; aynı testle bulundu.
 *
 * Şekil `kadikoy-sekli.ts`ten geliyor (üretilmiş dosya, elle düzenlenmiyor);
 * bu yüzden hesap ayrı dosyada. Yol 201 noktaya SADELEŞTİRİLMİŞ, yani kıyıya
 * çok yakın gerçek bir nokta da dışarıda çıkabiliyor — İBB Moda İskelesi
 * Kütüphanesi gerçekten iskelenin üstünde ve bu test onu "dışarıda" sayıyor.
 * O yüzden sonucu ENGEL değil UYARI olarak kullanmak gerekiyor.
 */

/* Yol bir kez ayrıştırılıyor: 201 nokta, her çağrıda yeniden okumanın anlamı
   yok. Yalnızca M/L komutları var (üretici böyle yazıyor). */
const NOKTALAR: [number, number][] = Array.from(
  KADIKOY_YOLU.matchAll(/[ML]\s*([\d.]+)\s+([\d.]+)/g),
  (m) => [Number(m[1]), Number(m[2])] as [number, number],
);

/** Işın atma (ray casting): kenarları tek tek kesip geçiş sayısına bakıyor. */
export function karadaMi(lat: number, lng: number): boolean {
  const x = miniX(lng);
  const y = miniY(lat);
  let icinde = false;
  for (let i = 0, j = NOKTALAR.length - 1; i < NOKTALAR.length; j = i++) {
    const [x1, y1] = NOKTALAR[i];
    const [x2, y2] = NOKTALAR[j];
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      icinde = !icinde;
    }
  }
  return icinde;
}
