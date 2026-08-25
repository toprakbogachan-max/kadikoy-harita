/**
 * Görsel yardımcılar — prototipteki jeton pin ve post-it dilinin karşılığı.
 * Tasarım kararları BRIEF.md → "Tasarım dili" bölümünden gelir.
 */
import { RENK, KAGIT, SIMGE } from "./paleti";
import type { Yer } from "./model";

/** post-it kağıdı + toplu iğne renkleri, kategoriden türer */
export function igneStil(tur: string): React.CSSProperties {
  const r = RENK[tur] ?? RENK.kahve;
  return {
    ["--pin" as string]: r.ana,
    ["--pin-isik" as string]: r.isik,
    ["--pin-koyu" as string]: r.golge,
    ["--kag" as string]: KAGIT[tur] ?? "#FBF3D9",
  };
}

/** post-it'lerin hafif eğikliği — hep aynı sırayla, rastgele değil */
export const egim = (i: number) => [-0.8, 0.6, -0.4, 0.9, -0.6][i % 5];

export const fotoZemin = (tur: string) => {
  const r = RENK[tur] ?? RENK.kahve;
  return `linear-gradient(135deg, ${r.ana} 0%, ${r.golge} 100%)`;
};

export const zaman = (s: number) =>
  s < 1 ? "az önce" : s < 24 ? `${s} sa` : `${Math.floor(s / 24)} gün`;

/**
 * "Şu an açık mı" — true / false / null (bilgi yok).
 * NULL kapalı DEĞİL: kullanıcının eklediği mekanlarda saat bilgisi olmayabilir.
 */
export function acikMi(saatler: number[][] | null | undefined, t: Date): boolean | null {
  if (!saatler) return null;
  const gun = t.getDay();
  const dk = t.getHours() * 60 + t.getMinutes();
  const toDk = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  for (const [g, ac, kap] of saatler as unknown as [number, string, string][]) {
    const a = toDk(ac), k = toDk(kap);
    if (k > a) {
      if (g === gun && dk >= a && dk < k) return true;
    } else {
      // gece yarısını aşan saatler (20:00–02:00)
      if (g === gun && dk >= a) return true;
      if (g === (gun + 6) % 7 && dk < k) return true;
    }
  }
  return false;
}

/** Kategori simgesi — jeton içinde ve etiketlerde kullanılır */
export const simgeSvg = (tur: string, boyut: number, renk = "#FFFFFF") =>
  `<svg width="${boyut}" height="${boyut}" viewBox="0 0 24 24" fill="none" stroke="${renk}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${SIMGE[tur] ?? ""}</svg>`;

const ALEV =
  "M12 1.4c0 0-1.1 3.3-3.3 5.3C6.3 8.8 5.1 10.8 5.1 13.3a6.9 6.9 0 0 0 13.8 0c0-2.2-.9-3.9-2.3-5.3-.6.9-1.3 1.3-2 1.1 1-2.5-.3-5.8-2.6-7.7z";

/**
 * Jeton pin: düz kuşbakışı jeton. Merkez açık, kenar koyu (küreye tepeden
 * bakınca kenarlar kıvrılıp kararır), sol üstte parlama yayı.
 * Açık = kategori renginde, kapalı = gri. Popüler = altın halka + alev rozeti.
 */
export function jetonSVG(
  y: Pick<Yer, "tur">,
  acik: boolean,
  populer: boolean,
  secili: boolean,
): string {
  const anahtar = acik ? y.tur : "kapali";
  const r = RENK[anahtar] ?? RENK.kapali;
  const R = 14, S = 24;
  const rz = populer ? R * 1.1 : R;
  const k = (rz * 2 * 0.62) / S;
  const yari = rz + 7, w = yari * 2;

  return `<svg viewBox="0 0 ${w} ${w}" width="${w}" height="${w}" style="display:block;overflow:visible">
    <g transform="translate(${yari} ${yari})">
      <circle class="halka" r="${rz + 3.4}" fill="none" stroke="#23343C" stroke-width="1.6" opacity="${secili ? 1 : 0}"/>
      ${populer ? `<circle r="${rz + 1.7}" fill="none" stroke="#E0A33E" stroke-width="1.4" opacity="${acik ? 1 : 0.5}"/>` : ""}
      <circle r="${rz}" fill="url(#jeton-${anahtar})"/>
      <circle r="${rz}" fill="none" stroke="${populer ? "#E0A33E" : r.golge}" stroke-width="${populer ? 1.1 : 0.7}" opacity="${populer ? (acik ? 0.95 : 0.5) : 0.55}"/>
      <path d="M ${-rz * 0.72} ${-rz * 0.34} a ${rz * 0.8} ${rz * 0.8} 0 0 1 ${rz * 0.98} ${-rz * 0.5}"
            fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity="${acik ? 0.55 : 0.35}"/>
      <g transform="translate(${(-S * k) / 2} ${(-S * k) / 2}) scale(${k})" fill="none" stroke="#fff"
         stroke-width="${1.9 / k}" stroke-linecap="round" stroke-linejoin="round" opacity="${acik ? 0.97 : 0.8}">${SIMGE[y.tur] ?? ""}</g>
      ${populer ? `<g transform="translate(${rz * 0.66} ${-rz * 0.98})">
        <circle r="6.6" fill="#3B2C12" opacity="${acik ? 1 : 0.55}"/>
        <g transform="translate(-4.3 -4.3) scale(${8.6 / 24})" opacity="${acik ? 1 : 0.55}"><path d="${ALEV}" fill="#E0A33E"/></g></g>` : ""}
    </g>
  </svg>`;
}

/** Jetonların kullandığı radyal gradyanlar — sayfada bir kez tanımlanır. */
export const jetonGradyanlari = () =>
  Object.entries(RENK)
    .map(
      ([k, r]) => `<radialGradient id="jeton-${k}" cx="38%" cy="34%" r="72%">
        <stop offset="0%" stop-color="${r.isik}"/><stop offset="45%" stop-color="${r.ana}"/>
        <stop offset="88%" stop-color="${r.ana}"/><stop offset="100%" stop-color="${r.golge}"/>
      </radialGradient>`,
    )
    .join("");

/**
 * Kişi rengi — kullanıcı adından türer.
 *
 * profiles tablosunda renk sütunu yok ve olmasına gerek de yok: renk veri
 * değil sunum. Deterministik olması önemli — aynı kişi her yerde, her açılışta
 * aynı rengi alsın diye kullanıcı adının karması kullanılıyor.
 * Doygunluk/parlaklık sabit tutuluyor ki beyaz baş harf her tonda okunsun.
 */
export function kisiRengi(kullaniciAdi: string): string {
  let h = 0;
  for (const c of kullaniciAdi) h = (h * 31 + c.codePointAt(0)!) >>> 0;
  return `hsl(${h % 360} 46% 42%)`;
}
