"use client";

import type { ReactNode } from "react";

/**
 * Rozet ailesi — D2 (`946 KAYIT`), D3 (sıralama noktası), D7 (çıkartma /
 * starburst), H2 (seri / sıra sayacı).
 *
 * Skill §3'ün katman 3'ü: pastel vurgular YALNIZCA rozette yaşar. Asla
 * buton, kart ya da geniş yüzey rengi olmaz. Doygunluk alanla TERS
 * ORANTILI — küçük rozette renk canlı olabilir, çünkü alanı küçük.
 *
 * Renk `--color-rozet-{ton}` / `-ink` çiftinden satır içi okunuyor:
 * @theme static bütün değişkenleri :root'a bastığı için çalışma anında
 * ton değiştirmek güvenli, ve dokuz kategori tonu da aynı kalıpta.
 */

export type RozetTon =
  | "pembe"
  | "lila"
  | "nane"
  | "yemek"
  | "kahve"
  | "bar"
  | "tatli"
  | "kultur"
  | "park"
  | "otel"
  | "magaza"
  | "diger";

const zemin = (ton: RozetTon) => `var(--color-rozet-${ton})`;
const murekkep = (ton: RozetTon) => `var(--color-rozet-${ton}-ink)`;

/* ============================================================
   D2 — etiket rozeti (`946 KAYIT`)
   Pastel zemin, küçük punto, KALIN BÜYÜK HARF. Kademe C ayarı:
   harf aralığı pozitif, çünkü büyük harf sıkışınca okunmuyor.
   ============================================================ */
export default function Rozet({
  children,
  ton = "pembe",
  sekil = "kutu",
  boy = "kucuk",
  ikon,
  className = "",
}: {
  children: ReactNode;
  ton?: RozetTon;
  /** kutu = rounded-xs (sayaç, etiket) · hap = rounded-full (durum) */
  sekil?: "kutu" | "hap";
  boy?: "kucuk" | "orta";
  ikon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap font-extrabold uppercase leading-none tracking-etiket ${
        sekil === "hap" ? "rounded-full" : "rounded-xs"
      } ${boy === "kucuk" ? "px-1.5 py-1 text-2xs" : "px-2.5 py-1.5 text-xs"} ${className}`}
      style={{ background: zemin(ton), color: murekkep(ton) }}
    >
      {ikon && (
        <span aria-hidden className="grid place-items-center leading-none">
          {ikon}
        </span>
      )}
      {children}
    </span>
  );
}

/* ============================================================
   D3 — sıralama satırı (`● POPÜLER · #4 fırın`)
   Renkli nokta + metin. Nokta DOLU ZEMİN DEĞİL: bir rozetin içindeki
   6 piksellik daire, "doygun renkli UI elemanı" sayılmayacak kadar küçük
   ama satırın neye ait olduğunu söylemeye yetiyor.
   ============================================================ */
export function RozetNokta({
  children,
  ton = "pembe",
  className = "",
}: {
  children: ReactNode;
  ton?: RozetTon;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-2xs font-bold uppercase leading-none tracking-etiket text-gri-700 ${className}`}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: murekkep(ton) }}
      />
      {children}
    </span>
  );
}

/* ============================================================
   H2 — dairesel sayaç rozeti (`3 / haftalık seri`)
   Skill §14: oyunlaştırma sayıları küçük dairelerin içinde pastel
   GRADYAN zeminde durur, yanlarında iki satırlık küçük harf gri etiket.
   Sayı font-sayi: rakam arayüz yazısıyla değil sayı sesiyle konuşuyor.
   ============================================================ */
export function RozetSayac({
  sayi,
  etiket,
  ton = "lila",
  ikinciTon = "pembe",
  boyut = 44,
  className = "",
}: {
  sayi: ReactNode;
  /** iki satıra sarması beklenen küçük harf etiket — "haftalık seri" */
  etiket?: string;
  ton?: RozetTon;
  ikinciTon?: RozetTon;
  boyut?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="grid shrink-0 place-items-center rounded-full font-sayi font-bold leading-none"
        style={{
          width: boyut,
          height: boyut,
          background: `linear-gradient(135deg, ${zemin(ton)}, ${zemin(ikinciTon)})`,
          color: murekkep(ton),
          fontSize: Math.round(boyut * 0.36),
          boxShadow: "var(--shadow-kat-1)",
        }}
      >
        {sayi}
      </span>
      {etiket && (
        <span className="max-w-[80px] text-2xs font-semibold lowercase leading-tight tracking-ui text-gri-600">
          {etiket}
        </span>
      )}
    </span>
  );
}

/* ============================================================
   D7 — çıkartma / starburst
   Scrapbook hissini tek başına taşıyan eleman. EKRAN BAŞINA BİR TANE;
   ikiye çıktığı anda ucuzluyor.

   `components/Cikartma.tsx` bunun sabitlenmiş hâli (82px, -9deg, 16 uç).
   Burada aynı üretici parametreli: uç sayısı, yarıçap oranı, boyut ve
   açı dışarıdan geliyor.
   ============================================================ */

/* globals.css'teki `yapistir` bitiş açısını --aci-cikartma'dan okuyor ve ara
   kareleri ona göreceli kuruyor. Yani HER açı animasyonlu koşabiliyor; açıyı
   aşağıda custom property olarak geçmek yeterli. */
const VARSAYILAN_ACI = -9;

const patlama = (uc: number, dis: number, ic: number) => {
  const p: string[] = [];
  for (let i = 0; i < uc * 2; i++) {
    const r = i % 2 === 0 ? dis : ic;
    const a = (Math.PI * i) / uc - Math.PI / 2;
    p.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
  }
  return `polygon(${p.join(",")})`;
};

export function RozetCikartma({
  ust,
  alt,
  ton = "pembe",
  boyut = 82,
  aci = VARSAYILAN_ACI,
  uc = 16,
  canlan = true,
  className = "",
}: {
  /** üst satır — kısa ve BÜYÜK, örn. "POPÜLER" */
  ust: string;
  /** alt satır — küçük harf, örn. kategori adı */
  alt?: string;
  ton?: RozetTon;
  boyut?: number;
  /** duruş açısı (derece). Animasyon her açıda koşar. */
  aci?: number;
  /** patlamanın uç sayısı */
  uc?: number;
  canlan?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center text-center drop-shadow-sekil ${
        canlan ? "yapistir" : ""
      } ${className}`}
      style={{
        /* Açıyı keyframe'e veren tek kaynak. Tip tanımında olmadığı için
           cast gerekiyor; React satır içi custom property'yi böyle kabul eder. */
        ["--aci-cikartma" as string]: `${aci}deg`,
        width: boyut,
        height: boyut,
        /* Dönüş satır içi de duruyor: animasyon koşarken fill:both son kareyi
           (aynı açıyı) tutuyor, hareket azaltma tercihinde açı buradan geliyor. */
        transform: `rotate(${aci}deg)`,
        clipPath: patlama(uc, 50, 41),
        background: zemin(ton),
        color: murekkep(ton),
      }}
    >
      <span className="px-1">
        <span className="block text-2xs font-extrabold uppercase leading-none tracking-etiket">
          {ust}
        </span>
        {alt && <span className="mt-0.5 block text-2xs lowercase leading-tight opacity-85">{alt}</span>}
      </span>
    </span>
  );
}
