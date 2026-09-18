/* Haftalık seri testi — `node scripts/kontrol/seri-testi.mjs`
 *
 * seriHesapla() profilde bir sayı gösteriyor ve sessizce yanlışa dönmesi
 * kolay: hafta sınırı pazartesi 00:00 İSTANBUL, yani UTC'de pazar 21:00.
 * Bir saatlik kayma "37 hafta"yı "1 hafta" yapar ve kimse fark etmez.
 *
 * Node .ts'i doğrudan çalıştırabiliyor (tip soyma), yani ÜRÜN kodu test
 * ediliyor — kopyası değil. */
import { seriHesapla, haftaNo } from "../../lib/seri.ts";

/* Sabit "şimdi": 18 Eylül 2026, cuma, İstanbul öğleden sonra. */
const SIMDI = new Date("2026-09-18T12:00:00+03:00");
/* O haftanın pazartesisi: 14 Eylül 2026. */
const BU_PZT = "2026-09-14T09:00:00+03:00";

const gun = (iso) => new Date(iso);

const DURUMLAR = [
  ["hiç pin yok", [], 0, "yok"],
  ["yalnız bu hafta", [BU_PZT], 1, "suruyor"],
  ["bu hafta + geçen hafta", [BU_PZT, "2026-09-09T20:00:00+03:00"], 2, "suruyor"],
  ["aynı haftada üç pin bir hafta sayılır",
    [BU_PZT, "2026-09-16T10:00:00+03:00", "2026-09-18T11:00:00+03:00"], 1, "suruyor"],
  ["bu hafta boş, geçen hafta dolu → risk",
    ["2026-09-10T10:00:00+03:00"], 1, "risk"],
  ["üç hafta risk zinciri",
    ["2026-09-10T10:00:00+03:00", "2026-09-03T10:00:00+03:00", "2026-08-27T10:00:00+03:00"], 3, "risk"],
  ["arada boş hafta zinciri keser",
    [BU_PZT, "2026-09-09T10:00:00+03:00", "2026-08-26T10:00:00+03:00"], 2, "suruyor"],
  ["iki hafta önce bitmiş seri düşmüş sayılır",
    ["2026-09-02T10:00:00+03:00", "2026-08-26T10:00:00+03:00"], 0, "yok"],
  /* Sınır: pazartesi 00:00 İstanbul = pazar 21:00 UTC. Bu an YENİ haftaya
     ait; bir dakika öncesi ESKİ haftaya. Hesap UTC'ye kaysaydı ikisi de
     aynı haftaya düşer ve "bu hafta pin attım" yalan olurdu. */
  ["pazartesi 00:00 İstanbul yeni haftadır", ["2026-09-14T00:00:00+03:00"], 1, "suruyor"],
  ["pazar 23:59 İstanbul eski haftadır", ["2026-09-13T23:59:00+03:00"], 1, "risk"],
];

let hata = 0;
for (const [ad, tarihler, beklenenHafta, beklenenDurum] of DURUMLAR) {
  const s = seriHesapla(tarihler, SIMDI);
  const iyi = s.hafta === beklenenHafta && s.durum === beklenenDurum;
  if (!iyi) hata++;
  console.log(`${iyi ? "✓" : "✗"} ${ad} → ${s.hafta} hafta / ${s.durum}` +
    (iyi ? "" : `  (beklenen ${beklenenHafta} / ${beklenenDurum})`));
}

/* Hafta numarası ardışık olmalı: aynı haftanın her günü aynı numara,
   sonraki pazartesi tam bir fazla. */
const pzt = haftaNo(gun("2026-09-14T00:00:00+03:00"));
const paz = haftaNo(gun("2026-09-20T23:59:00+03:00"));
const ertesiPzt = haftaNo(gun("2026-09-21T00:00:00+03:00"));
if (pzt !== paz) { hata++; console.log(`✗ pazartesi ile pazar aynı hafta değil (${pzt} ≠ ${paz})`); }
else console.log("✓ pazartesi–pazar aynı hafta numarası");
if (ertesiPzt !== pzt + 1) { hata++; console.log(`✗ ertesi pazartesi +1 değil (${ertesiPzt})`); }
else console.log("✓ ertesi pazartesi bir sonraki hafta");

console.log(hata ? `\n${hata} hata` : "\nhepsi geçti");
process.exit(hata ? 1 : 0);
