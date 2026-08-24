/**
 * Park ve kültür mekanlarına Wikimedia Commons'tan serbest lisanslı kapak görseli bulur.
 *
 * YÖNTEM: metin araması değil, COĞRAFİ arama. Commons'ta o koordinata etiketlenmiş
 * görseller alınır, sonra dosya adı mekan adıyla örtüşüyor mu diye süzülür.
 *   - Sadece yakınlık yetmez: Süreyya Operası'nın 53 m yanında Osmanağa Camii var.
 *   - Sadece metin araması hiç yetmez: "Kemal Sunal Parkı" araması 1929 Milliyet
 *     gazetesi taramasını getiriyor.
 * İkisi birden tutmazsa kapak konmaz. Yanlış fotoğraf, fotoğrafsızlıktan kötüdür.
 *
 * LİSANS: yalnızca CC-BY / CC-BY-SA / CC0 / kamu malı. cover_credit arayüzde
 * GÖRÜNÜR yerde gösterilmek zorunda.
 *
 *   node scripts/tohum/commons-kapak.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { sade } from "./ortak.mjs";

const API = "https://commons.wikimedia.org/w/api.php";
/* Wikimedia UA politikası: uygulama adı + sürüm + iletişim. Kimliksiz istekler 429 yer. */
const UA  = "kadikoy-harita-tohumlama/0.1 (https://github.com/kadikoy-harita; toprakbogachan@gmail.com)";
const IZINLI = /^(cc[- ]?by([- ]sa)?([- ]\d(\.\d)?)?|cc0|public domain|pd-)/i;
const KAPAK_ARANAN = new Set(["park", "kultur"]);
const YARICAP_M = 300;

/* Semt adları tek başına eşleşme kanıtı sayılmaz — Kadıköy'de yüzlerce dosya
   adında "Moda" geçer, hiçbiri o parkın fotoğrafı olmak zorunda değil. */
const SEMT_ADLARI = new Set(["moda","bahariye","yeldegirmeni","kalamis","fenerbahce",
  "kadikoy","rihtim","kusdili","caferaga","osmanaga","carsi","rasimpasa","istanbul"]);

/* dosya adı bunlardan biriyse fotoğraf değil, arşiv taraması */
const COP = /\.(pdf|djvu|ogv|webm|svg|tif)|^page\d|gazete|_19\d\d_|gps.shift|panoramio.jpg$/i;

/* mekan adında ayırt edici olmayan kelimeler — eşleşme bunlara dayanamaz */
const DOLGU = new Set(["parki","parkı","park","muzesi","müzesi","muze","müze","kultur","kültür",
  "merkezi","merkez","sanat","tiyatro","tiyatrosu","sahne","sahnesi","kutuphane","kütüphane",
  "kutuphanesi","kütüphanesi","sinema","sineması","sinemasi","evi","ev","atolye","atölye",
  "atolyesi","atölyesi","istanbul","kadikoy","kadıköy","belediyesi","cafe","the","bahce","bahçe",
  "bostani","bostanı","galeri","gallery","opera","operasi","operası","genclik","gençlik"]);


const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/* 429/503'te üstel geri çekilme. Commons paylaşılan bir kaynak, sıkıştırmıyoruz. */
async function api(params, deneme = 0) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  const y = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
  if (y.status === 429 || y.status === 503) {
    if (deneme >= 5) throw new Error(`HTTP ${y.status} (5 denemede geçmedi)`);
    const s = Number(y.headers.get("retry-after")) || 2 ** deneme * 5;
    console.error(`    ...${y.status}, ${s} sn bekleniyor`);
    await bekle(s * 1000);
    return api(params, deneme + 1);
  }
  if (!y.ok) throw new Error(`HTTP ${y.status}`);
  return y.json();
}

async function kapakBul(m) {
  /* ayırt edici kelimeler: "Yoğurtçu Parkı" → ["yogurtcu"] */
  const anahtarlar = sade(m.name).split(" ").filter((k) => k.length >= 4 && !DOLGU.has(k));
  if (!anahtarlar.length) return null;

  const g = await api({
    action: "query", list: "geosearch", gsnamespace: "6",
    gscoord: `${m.lat}|${m.lng}`, gsradius: String(YARICAP_M), gslimit: "50",
  });
  /* Eşleşme kuralı — tek kelime tutması yetmez:
     1) mekan adındaki AYIRT EDİCİ kelimelerin HEPSİ dosya adında geçmeli.
        ("Moda Sahil Parkı" için "Kadıköy,Moda 07.jpg" yetmez — sahil yok.)
     2) ayırt edici kelimelerin tamamı semt adıysa, dosya adında mekanın tür
        kelimesi de geçmeli. ("Moda Bostanı" ↔ "Moda Caddesi.jpg" elenir;
        "Kalamış Parkı" ↔ "Kalamış Atatürk Parkı.jpg" kalır.) */
  const turKelimeleri = sade(m.name).split(" ").filter((k) => DOLGU.has(k));
  const hepsiSemt = anahtarlar.every((k) => SEMT_ADLARI.has(k));

  const yakinlar = (g.query?.geosearch || [])
    .filter((x) => !COP.test(x.title))
    .filter((x) => {
      const t = sade(x.title);
      if (!anahtarlar.every((k) => t.includes(k))) return false;
      if (hepsiSemt && turKelimeleri.length && !turKelimeleri.some((k) => t.includes(k.slice(0, 4))))
        return false;
      return true;
    });
  if (!yakinlar.length) return null;

  /* en yakından başlayarak lisansı uygun ilkini al */
  for (const aday of yakinlar.slice(0, 6)) {
    const d = await api({
      action: "query", titles: aday.title,
      prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "1200",
    });
    const ii = Object.values(d.query?.pages || {})[0]?.imageinfo?.[0];
    if (!ii || ii.width < 700) continue;
    const meta = ii.extmetadata || {};
    const lisans = (meta.LicenseShortName?.value || "").trim();
    if (!IZINLI.test(lisans)) continue;
    const yazar = (meta.Artist?.value || "bilinmiyor")
      .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
    return {
      url: ii.thumburl || ii.url,
      credit: `${yazar}, ${lisans} — Wikimedia Commons`,
      dosya: aday.title.replace("File:", ""),
      uzaklik: Math.round(aday.dist),
    };
  }
  return null;
}

const mekanlar = JSON.parse(readFileSync(new URL("./mekanlar.json", import.meta.url)));
/* önceki hatalı çalıştırmadan kalanları temizle */
for (const m of mekanlar) { delete m.cover_url; delete m.cover_credit; }

const hedef = mekanlar.filter((m) => KAPAK_ARANAN.has(m.category));
console.error(`${hedef.length} park/kültür mekanı taranıyor (yarıçap ${YARICAP_M} m)\n`);

let bulunan = 0;
for (const m of hedef) {
  try {
    const k = await kapakBul(m);
    if (k) {
      m.cover_url = k.url; m.cover_credit = k.credit; bulunan++;
      console.error(`  + ${m.name.padEnd(32)} ${k.uzaklik}m  ${k.dosya.slice(0, 46)}`);
    }
  } catch (e) { console.error(`  ! ${m.name.padEnd(32)} ${e.message}`); }
  await bekle(1200);
}

writeFileSync(new URL("./mekanlar.json", import.meta.url), JSON.stringify(mekanlar, null, 2));
console.error(`\n${bulunan}/${hedef.length} mekana kapak bulundu (eşleşmeyene konmadı).`);
