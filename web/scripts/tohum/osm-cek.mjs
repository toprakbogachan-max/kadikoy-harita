/**
 * Kadıköy'ün gerçek mekanlarını OpenStreetMap'ten çeker, şemamıza uyarlar.
 * Lisans: ODbL — arayüzde "Veri: © OpenStreetMap katkıcıları" atfı zorunlu.
 *
 *   node scripts/tohum/osm-cek.mjs > scripts/tohum/mekanlar.json
 */
import { writeFileSync } from "node:fs";
import { slugla } from "./ortak.mjs";

const ALAN = [40.9700, 29.0150, 41.0010, 29.0470];   // güney, batı, kuzey, doğu

/* OSM etiketi → şemadaki place_category
   Sıra önemli: ilk eşleşen kazanır (bir düğümde hem amenity hem shop olabilir) */
const ESLEME = [
  ["amenity", "cafe",            "kahve"],
  ["amenity", "restaurant",      "yemek"],
  ["amenity", "fast_food",       "yemek"],
  ["amenity", "bar",             "bar"],
  ["amenity", "pub",             "bar"],
  ["amenity", "biergarten",      "bar"],
  ["amenity", "ice_cream",       "tatli"],
  ["shop",    "pastry",          "tatli"],
  ["shop",    "bakery",          "tatli"],
  ["shop",    "confectionery",   "tatli"],
  ["amenity", "theatre",         "kultur"],
  ["amenity", "cinema",          "kultur"],
  ["amenity", "arts_centre",     "kultur"],
  ["amenity", "library",         "kultur"],
  ["tourism", "museum",          "kultur"],
  ["tourism", "gallery",         "kultur"],
  ["leisure", "park",            "park"],
  ["leisure", "garden",          "park"],
  ["tourism", "hotel",           "otel"],
  ["tourism", "hostel",          "otel"],
  ["shop",    "books",           "magaza"],
  ["shop",    "music",           "magaza"],
  ["shop",    "records",         "magaza"],
];

const SORGU = `
[out:json][timeout:60];
(
  nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub|biergarten|ice_cream|theatre|cinema|arts_centre|library)$"]["name"](${ALAN});
  nwr["shop"~"^(pastry|bakery|confectionery|books|music|records)$"]["name"](${ALAN});
  nwr["tourism"~"^(museum|gallery|hotel|hostel)$"]["name"](${ALAN});
  nwr["leisure"~"^(park|garden)$"]["name"](${ALAN});
);
out center tags;
`;

/* ---------- OSM opening_hours → şemadaki jsonb ----------
   OSM: "Mo-Fr 09:00-23:00; Sa,Su 10:00-24:00"
   Biz: [{"d":1,"open":"09:00","close":"23:00"}, ...]   d: 0=Pazar (Postgres dow)  */
const GUN = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };

function saatCevir(ham) {
  if (!ham) return null;
  const s = ham.toLowerCase().trim();
  if (s === "24/7") return [0,1,2,3,4,5,6].map((d) => ({ d, open: "00:00", close: "23:59" }));
  /* kapalı/tatil/"by appointment" gibi belirsiz ifadeleri parse etmeye çalışmıyoruz —
     yanlış "kapalı" göstermektense "bilinmiyor" (null) daha dürüst */
  if (/ph|easter|off|closed|appointment/.test(s)) return null;

  const cikti = [];
  for (const parca of s.split(";")) {
    const m = parca.trim().match(/^([a-z,\-\s]+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!m) continue;
    const [, gunler, ac, kap] = m;

    const secilen = new Set();
    for (const g of gunler.split(",")) {
      const aralik = g.trim().match(/^([a-z]{2})\s*-\s*([a-z]{2})$/);
      if (aralik) {
        const [, a, b] = aralik;
        if (!(a in GUN) || !(b in GUN)) continue;
        /* Mo-Su gibi sarmalayan aralıklar için 7 adım döneriz */
        for (let i = 0, d = GUN[a]; i < 7; i++, d = (d + 1) % 7) {
          secilen.add(d);
          if (d === GUN[b]) break;
        }
      } else if (g.trim() in GUN) {
        secilen.add(GUN[g.trim()]);
      }
    }
    const iki = (t) => (t.length === 4 ? "0" + t : t);
    for (const d of secilen) cikti.push({ d, open: iki(ac), close: iki(kap === "24:00" ? "23:59" : kap) });
  }
  return cikti.length ? cikti : null;
}

/* ---------- semt: koordinattan en yakın merkeze ---------- */
const SEMTLER = [
  ["Moda", 40.9779, 29.0263], ["Rıhtım", 40.9925, 29.0225],
  ["Yeldeğirmeni", 40.9975, 29.0265], ["Kuşdili", 40.9905, 29.0345],
  ["Bahariye", 40.9880, 29.0290], ["Çarşı", 40.9905, 29.0270],
  ["Kalamış", 40.9790, 29.0390], ["Fenerbahçe", 40.9720, 29.0430],
  ["Osmanağa", 40.9895, 29.0300], ["Caferağa", 40.9840, 29.0270],
];
const semtBul = (lat, lng) =>
  SEMTLER.reduce((en, s) => {
    const d = (lat - s[1]) ** 2 + (lng - s[2]) ** 2;
    return d < en.d ? { ad: s[0], d } : en;
  }, { ad: "Kadıköy", d: Infinity }).ad;

/* slug/sadeleştirme ortak.mjs'de — Türkçe İ tuzağı orada anlatılıyor */

/* ---------- çalıştır ---------- */
/* Overpass genelde meşgul olur (504/429). Aynaları sırayla dene. */
const AYNALAR = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
];

async function overpass(sorgu) {
  let sonHata;
  for (const url of AYNALAR) {
    for (let deneme = 1; deneme <= 2; deneme++) {
      try {
        const y = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded",
                     "User-Agent": "kadikoy-harita-dev/0.1 (tohumlama)" },
          body: new URLSearchParams({ data: sorgu }),
          signal: AbortSignal.timeout(90_000),
        });
        if (y.ok) { console.error(`  ok — ${new URL(url).host}`); return y.json(); }
        sonHata = `HTTP ${y.status}`;
      } catch (e) { sonHata = e.message; }
      console.error(`  x  ${new URL(url).host} (${sonHata})`);
      if (deneme < 2) await new Promise((r) => setTimeout(r, 4000));
    }
  }
  throw new Error(`tüm aynalar başarısız: ${sonHata}`);
}

console.error("OpenStreetMap sorgulanıyor...");
const { elements } = await overpass(SORGU);

const gorulen = new Set();
const mekanlar = [];

for (const e of elements) {
  const t = e.tags || {};
  const ad = (t.name || "").trim();
  if (!ad || ad.length < 2 || ad.length > 80) continue;

  const eslesme = ESLEME.find(([k, v]) => t[k] === v);
  if (!eslesme) continue;
  const kategori = eslesme[2];

  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  if (lat == null || lng == null) continue;

  /* aynı isim + aynı kategori tekrarı (zincir şubeleri): 150 m'den yakınsa ele */
  const anahtar = `${slugla(ad)}|${kategori}`;
  const yakin = mekanlar.find(
    (m) => `${slugla(m.name)}|${m.category}` === anahtar &&
           Math.hypot(m.lat - lat, m.lng - lng) < 0.0015,
  );
  if (yakin) continue;

  let slug = slugla(ad);
  if (gorulen.has(slug)) slug = `${slug}-${slugla(semtBul(lat, lng))}`;
  if (gorulen.has(slug)) slug = `${slug}-${e.id}`;
  gorulen.add(slug);

  mekanlar.push({
    slug, name: ad, category: kategori,
    neighborhood: semtBul(lat, lng),
    address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null,
    lat, lng,
    opening_hours: saatCevir(t.opening_hours),
    phone: t.phone || t["contact:phone"] || null,
    website: t.website || t["contact:website"] || null,
    osm: `${e.type}/${e.id}`,
  });
}

mekanlar.sort((a, b) => a.name.localeCompare(b.name, "tr"));
writeFileSync(new URL("./mekanlar.json", import.meta.url), JSON.stringify(mekanlar, null, 2));

const say = (k) => mekanlar.filter((m) => m.category === k).length;
console.error(`toplam ${mekanlar.length} mekan`);
console.error(`saatli: ${mekanlar.filter((m) => m.opening_hours).length}`);
console.error(`adresli: ${mekanlar.filter((m) => m.address).length}`);
for (const k of ["kahve","yemek","bar","tatli","kultur","park","otel","magaza"])
  console.error(`  ${k.padEnd(8)} ${say(k)}`);
