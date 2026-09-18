/**
 * Haftalık seri hesabı — `SeriRozeti`'nin beklediği sayı ve durum.
 *
 * Tanım Faz 2 Paket 6'da kararlaştırıldı (`NOT.md`), hesap buraya yazıldı:
 *   - bir haftayı seriye sayan şey EN AZ BİR PİN (kaydetmek saymaz),
 *   - hafta PAZARTESİ başlar, İSTANBUL saatine göre,
 *   - `risk` = seri sürüyor ama içinde bulunulan haftada henüz pin yok.
 *
 * Saf fonksiyon: veri çekmiyor, `Date.now()` bile dışarıdan alınabiliyor.
 * Sebebi test — `scripts/kontrol/seri-testi.mjs` bu dosyayı doğrudan
 * import ediyor ve "bu hafta" sabitlenmeden sınır durumları sınanamaz.
 *
 * ⚠ Saat dilimini elle +3 diye yazma. Türkiye 2016'dan beri sabit UTC+3
 * ama bu bir YASA, fizik değil; değişirse `Intl` güncellenir, elle yazılan
 * sabit sessizce yanlışa döner.
 */

export type SeriDurumu = "yok" | "suruyor" | "risk";

const GUN_MS = 86_400_000;
const HAFTA_MS = 7 * GUN_MS;

/* en-CA: "2026-09-18" — ayrıştırması en ucuz ISO benzeri çıktı. */
const ISTANBUL_GUN = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Bir anın İSTANBUL'daki takvim günü, UTC gece yarısına sabitlenmiş. */
function istanbulGunu(an: Date): number {
  const [yil, ay, gun] = ISTANBUL_GUN.format(an).split("-").map(Number);
  return Date.UTC(yil, ay - 1, gun);
}

/**
 * Pazartesi başlangıçlı hafta numarası (epoch'tan beri kaçıncı hafta).
 * Mutlak değeri anlamsız; iki hafta arasındaki FARK anlamlı.
 */
export function haftaNo(an: Date | string): number {
  const gun = istanbulGunu(typeof an === "string" ? new Date(an) : an);
  /* getUTCDay: 0 = pazar. Pazartesi'ye kaç gün geri gidilecek: */
  const kaydir = (new Date(gun).getUTCDay() + 6) % 7;
  return Math.floor((gun - kaydir * GUN_MS) / HAFTA_MS);
}

export interface Seri {
  hafta: number;
  durum: SeriDurumu;
}

/**
 * @param tarihler pinlerin atılma anları (sıralı olmak zorunda değil)
 * @param simdi    testte sabitlenebilsin diye dışarıdan
 */
export function seriHesapla(tarihler: readonly (string | Date)[], simdi: Date = new Date()): Seri {
  if (!tarihler.length) return { hafta: 0, durum: "yok" };

  const haftalar = new Set(tarihler.map(haftaNo));
  const buHafta = haftaNo(simdi);

  /* Seri bu haftadan da başlayabilir geçen haftadan da: bu hafta henüz pin
     yoksa seri DÜŞMÜŞ değil, RİSKTE. Pazartesi sabahı herkesin serisini
     sıfırlamak, sayacın kendisini anlamsız kılardı. */
  const bas = haftalar.has(buHafta) ? buHafta
    : haftalar.has(buHafta - 1) ? buHafta - 1
    : null;
  if (bas === null) return { hafta: 0, durum: "yok" };

  let hafta = 0;
  for (let h = bas; haftalar.has(h); h--) hafta++;
  return { hafta, durum: bas === buHafta ? "suruyor" : "risk" };
}
