/**
 * Altlık haritayı sessizleştirme.
 *
 * Neden: pinler, kartlar ve fotoğraflar rengi taşıyor; altlık onlarla
 * yarışmamalı. OpenFreeMap "liberty" stili turistik bir harita gibi renkli
 * — sarı otoyol, turuncu cadde, canlı yeşil park. Üstüne fotoğraflı marker
 * koyunca hangisine bakacağın belli olmuyor.
 *
 * Neden hazır gri stile (positron) geçmiyoruz: o stil suyu ve yeşili de
 * griye indiriyor. Kadıköy'ün karakteri kıyı ve park — deniz mavi, Fenerbahçe
 * yeşil kalmalı. Burada doygunluk seçici kısılıyor: su ve yeşil payını
 * koruyor, geri kalan her şey (yol, bina, sınır) nötre iniyor.
 *
 * Neden CSS filter değil: kapsayıcıya filter uygulamak marker'ları da
 * soldururdu — onlar canvas'ın üstünde ayrı DOM düğümleri ama aynı yığında.
 */
import type { Map as HaritaTipi, LayerSpecification } from "maplibre-gl";

type Hsl = { h: number; s: number; l: number; a: number };

/** #abc · #aabbcc · #aabbccdd · rgb()/rgba() · hsl()/hsla() → HSL */
function renkAyristir(deger: string): Hsl | null {
  const s = deger.trim().toLowerCase();

  const hsl = s.match(/^hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (hsl) {
    return {
      h: +hsl[1],
      s: +hsl[2] / 100,
      l: +hsl[3] / 100,
      a: hsl[4] ? (hsl[4].endsWith("%") ? parseFloat(hsl[4]) / 100 : +hsl[4]) : 1,
    };
  }

  let r: number, g: number, b: number, a = 1;
  const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (rgb) {
    [r, g, b] = [+rgb[1], +rgb[2], +rgb[3]];
    if (rgb[4]) a = rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : +rgb[4];
  } else {
    const h = s.match(/^#([0-9a-f]{3,8})$/);
    if (!h) return null;
    const d = h[1];
    if (d.length === 3 || d.length === 4) {
      [r, g, b] = [0, 1, 2].map((i) => parseInt(d[i] + d[i], 16));
      if (d.length === 4) a = parseInt(d[3] + d[3], 16) / 255;
    } else if (d.length === 6 || d.length === 8) {
      [r, g, b] = [0, 2, 4].map((i) => parseInt(d.slice(i, i + 2), 16));
      if (d.length === 8) a = parseInt(d.slice(6, 8), 16) / 255;
    } else return null;
  }

  r /= 255; g /= 255; b /= 255;
  const enB = Math.max(r, g, b), enK = Math.min(r, g, b), fark = enB - enK;
  const l = (enB + enK) / 2;
  if (!fark) return { h: 0, s: 0, l, a };
  const sat = fark / (1 - Math.abs(2 * l - 1));
  const h =
    enB === r ? ((g - b) / fark + (g < b ? 6 : 0))
    : enB === g ? (b - r) / fark + 2
    : (r - g) / fark + 4;
  return { h: h * 60, s: sat, l, a };
}

const hslYaz = ({ h, s, l, a }: Hsl) =>
  `hsla(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}% / ${a.toFixed(3)})`;

/** Katman rolü — su ve yeşil doygunluğunun bir kısmını korur. */
function rol(katmanId: string, kaynakKatman: string): "su" | "yesil" | "diger" {
  const a = `${katmanId} ${kaynakKatman}`.toLowerCase();
  if (/water|sea|ocean|river|canal|lake|bay|harbou?r/.test(a)) return "su";
  if (/park|wood|forest|grass|green|garden|pitch|scrub|meadow|golf|cemeter/.test(a)) return "yesil";
  return "diger";
}

/* Kalan doygunluk payı. Tam sıfır istemiyoruz: mürekkep gibi nötr bir
   altlık fotoğrafların altında ölü duruyor, hafif bir ton sıcaklığı kalsın.

   su payı 0.5'ten 0.34'e indi: harita tam ekrana çıkınca Kalamış koyu
   çerçevenin alt üçte birini kaplıyor ve o oranda mavi, düz bir levha gibi
   okunuyordu. Açma payı da yükseldi — deniz mavi kalıyor ama artık zemin,
   leke değil. */
const PAY = { su: 0.34, yesil: 0.42, diger: 0.14 } as const;
/* Nötre inen katmanlar aynı zamanda biraz açılıyor — Corner'ın altlığında
   yollar neredeyse beyaz, bloklar açık gri. Kontrast marker'a bırakılıyor. */
const ACMA = { su: 0.12, yesil: 0.05, diger: 0.1 } as const;

function renkKis(deger: unknown, k: keyof typeof PAY): unknown {
  if (typeof deger === "string") {
    const h = renkAyristir(deger);
    if (!h) return deger;
    return hslYaz({ ...h, s: h.s * PAY[k], l: Math.min(1, h.l + (1 - h.l) * ACMA[k]) });
  }
  /* Renkler çoğu zaman düz string değil, zoom'a göre interpolate eden bir
     ifade dizisi. Dizinin içindeki renk yapraklarını tek tek geçiyoruz;
     operatör adları ("interpolate", "linear", "zoom") renk olarak
     ayrıştırılamadığı için kendiliğinden atlanıyor. */
  if (Array.isArray(deger)) return deger.map((d) => renkKis(d, k));
  return deger;
}

/**
 * Stil yüklendikten SONRA çağrılır (m.on("load")). Katmanların renk taşıyan
 * boya özelliklerini yerinde kısar.
 */
export function altligiSessizlestir(m: HaritaTipi): void {
  let katmanlar: LayerSpecification[];
  try {
    katmanlar = (m.getStyle()?.layers ?? []) as LayerSpecification[];
  } catch {
    return;
  }

  for (const katman of katmanlar) {
    const kaynakKatman = "source-layer" in katman ? String(katman["source-layer"] ?? "") : "";
    const k = rol(katman.id, kaynakKatman);
    const boya = (katman as { paint?: Record<string, unknown> }).paint;
    if (!boya) continue;

    for (const ad of Object.keys(boya)) {
      if (!ad.endsWith("-color")) continue;
      /* Etiket yazısı ve halesi kısılmıyor: zaten nötr ve okunurluğu
         doğrudan etkiliyor — soldurmak isimleri kaybettirir. */
      if (ad.startsWith("text-") || ad.startsWith("icon-")) continue;
      try {
        const yeni = renkKis(boya[ad], k);
        /* setPaintProperty'nin özellik adı tipi katman türüne bağlı bir
           birleşim; burada katmanları tür tür ayırmadan geziyoruz, o yüzden
           ad string kalıyor. Değer zaten yerinde okunan değerin dönüşmüş
           hâli — geçersiz bir özellik adı üretmek mümkün değil. */
        if (yeni !== boya[ad]) {
          (m.setPaintProperty as (id: string, ad: string, deger: unknown) => void)(
            katman.id, ad, yeni,
          );
        }
      } catch {
        /* Tek bir katman reddederse harita çizilmeye devam etsin. */
      }
    }
  }
}
