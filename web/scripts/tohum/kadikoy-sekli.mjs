/**
 * Kadıköy'ün GERÇEK sınırını OpenStreetMap'ten alıp mini harita SVG'sine çevirir.
 *
 * Profil ve paylaşım kartındaki mini harita önce uydurma 18 noktalı bir
 * çokgendi — "senin Kadıköy haritan" diyip Kadıköy'e benzemeyen bir şekil
 * göstermek yanlıştı.
 *
 * Yapılan işler:
 *   1. İlçe sınırı ilişkisinin dış parçaları uç uca eklenip tek halka yapılır
 *      (OSM sınırları parça parça, sırasız gelir)
 *   2. Douglas-Peucker ile sadeleştirilir — 1264 nokta paylaşım kartında
 *      gereksiz, gözle fark edilmeyen ayrıntı
 *   3. Mercator'a yakın bir düzeltmeyle projelendirilir: enlemde 1 derece
 *      ile boylamda 1 derece aynı mesafe değil, düzeltmeden şekil yassı çıkar
 *
 *   node scripts/tohum/kadikoy-sekli.mjs
 */
import { writeFileSync } from "node:fs";

const SORGU = `
[out:json][timeout:60];
relation["name"="Kadıköy"]["admin_level"="6"]["boundary"="administrative"];
out geom;
`;

const AYNALAR = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function overpass() {
  for (const url of AYNALAR) {
    try {
      const y = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded",
                   "User-Agent": "kadikoy-harita-dev/0.1" },
        body: new URLSearchParams({ data: SORGU }),
        signal: AbortSignal.timeout(90_000),
      });
      if (y.ok) return y.json();
    } catch { /* sonraki ayna */ }
  }
  throw new Error("Overpass'a ulaşılamadı");
}

/** Sırasız parçaları uç uca ekleyip tek halka yap */
function halkaYap(parcalar) {
  const kalan = parcalar.map((p) => p.map((n) => [n.lon, n.lat]));
  const halka = kalan.shift();
  const esit = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;

  while (kalan.length) {
    const son = halka[halka.length - 1];
    let i = kalan.findIndex((p) => esit(p[0], son));
    if (i >= 0) { halka.push(...kalan.splice(i, 1)[0].slice(1)); continue; }
    i = kalan.findIndex((p) => esit(p[p.length - 1], son));
    if (i >= 0) { halka.push(...kalan.splice(i, 1)[0].reverse().slice(1)); continue; }
    /* Kopuk parça: sınır çokgeni birden fazla halkadan oluşuyor olabilir
       (adalar). En büyüğünü tuttuğumuz için kalanı atıyoruz. */
    break;
  }
  return halka;
}

/** Douglas-Peucker — noktadan doğruya uzaklık eşiğine göre sadeleştirme */
function sadelestir(nk, esik) {
  if (nk.length < 3) return nk;
  const uzaklik = (p, a, b) => {
    const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
    const dx = x2 - x1, dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  };
  let enUzak = 0, indeks = 0;
  for (let i = 1; i < nk.length - 1; i++) {
    const d = uzaklik(nk[i], nk[0], nk[nk.length - 1]);
    if (d > enUzak) { enUzak = d; indeks = i; }
  }
  if (enUzak <= esik) return [nk[0], nk[nk.length - 1]];
  return [
    ...sadelestir(nk.slice(0, indeks + 1), esik).slice(0, -1),
    ...sadelestir(nk.slice(indeks), esik),
  ];
}

const { elements } = await overpass();
const iliski = elements.find((e) => e.type === "relation");
if (!iliski) throw new Error("Kadıköy sınırı bulunamadı");

const disParcalar = iliski.members.filter((m) => m.role === "outer" && m.geometry)
  .map((m) => m.geometry);
console.error(`dış parça: ${disParcalar.length}`);

let halka = halkaYap(disParcalar);
console.error(`birleştirilmiş halka: ${halka.length} nokta`);

/* Enlem düzeltmesi: bu enlemde 1° boylam, 1° enlemden ~cos(41°)=0.755 kadar
   kısa. Düzeltmeden şekil yatayda yassı çıkıyor. */
const ORTA_ENLEM = 40.98;
const k = Math.cos((ORTA_ENLEM * Math.PI) / 180);
const duz = halka.map(([lng, lat]) => [lng * k, lat]);

const sadeDuz = sadelestir(duz, 0.00022);
console.error(`sadeleştirilmiş: ${sadeDuz.length} nokta`);

/* viewBox şeklin KENDİ oranında üretiliyor.
   Kareye sığdırıp sonra 16/10 kutuda göstermek şekli ortada küçük bırakıp
   kenarlarda geniş mavi şeritler oluşturuyordu. */
const xs = sadeDuz.map((p) => p[0]), ys = sadeDuz.map((p) => p[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const y0 = Math.min(...ys), y1 = Math.max(...ys);
const PAY = 3;
const olcek = 100 / (y1 - y0);                 // yükseklik 100 birim
const kutuG = Math.round((x1 - x0) * olcek) + PAY * 2;
const kutuY = 100 + PAY * 2;
const kaydirX = PAY, kaydirY = PAY;

const yol = "M" + sadeDuz
  .map(([x, y]) =>
    `${(kaydirX + (x - x0) * olcek).toFixed(1)} ${(kaydirY + (y1 - y) * olcek).toFixed(1)}`)
  .join(" L") + " Z";

/* Pinleri aynı yere düşürmek için istemcinin kullanacağı katsayılar */
const cikti = `/* ÜRETİLMİŞ DOSYA — elle düzenleme.
   Kaynak: scripts/tohum/kadikoy-sekli.mjs
   Veri:   © OpenStreetMap katkıcıları (ODbL), Kadıköy ilçe sınırı

   Şekil gerçek sınırdan geliyor; önceki uydurma çokgen Kadıköy'e
   benzemiyordu. ${sadeDuz.length} noktaya sadeleştirildi — paylaşım
   kartındaki 40 piksellik haritada daha fazlası görünmüyor. */

/** Şeklin kendi oranındaki çizim kutusu — kenarlarda mavi şerit kalmasın diye */
export const KADIKOY_KUTU = "0 0 ${kutuG} ${kutuY}";
export const KADIKOY_ORAN = ${(kutuG / kutuY).toFixed(3)};

/** Kadıköy ilçe sınırı */
export const KADIKOY_YOLU =
  "${yol}";

/* Enlem düzeltmesi (cos 40.98°): bu enlemde 1° boylam 1° enlemden kısa,
   düzeltmeden şekil yassı çıkıyor. */
const K = ${k.toFixed(6)};
const X0 = ${x0.toFixed(6)}, Y1 = ${y1.toFixed(6)};
const OLCEK = ${olcek.toFixed(4)};
const KAYDIR_X = ${kaydirX.toFixed(3)}, KAYDIR_Y = ${kaydirY.toFixed(3)};

/** Koordinatı mini haritanın 0–100 kutusuna taşır */
export const miniX = (lng: number) => KAYDIR_X + (lng * K - X0) * OLCEK;
export const miniY = (lat: number) => KAYDIR_Y + (Y1 - lat) * OLCEK;
`;

writeFileSync(new URL("../../lib/kadikoy-sekli.ts", import.meta.url), cikti);
console.error(`\nlib/kadikoy-sekli.ts yazıldı · yol ${yol.length} karakter`);
console.error(`kutu: ${kutuG}×${kutuY} · oran ${(kutuG / kutuY).toFixed(3)}`);
console.error(`sınırlar: lng ${(x0 / k).toFixed(4)}–${(x1 / k).toFixed(4)} · lat ${y0.toFixed(4)}–${y1.toFixed(4)}`);
