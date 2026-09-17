"use client";

import type { ReactNode } from "react";

/**
 * Çip — süzgeç şeridinin tek öğesi. C1–C7 ve G5.
 *
 * Skill §14'ün en kolay bozulan kuralı burada: HARİTADA İKİ AYRI FİLTRE
 * BİÇİMİ VAR, karıştırılmaz.
 *
 *   bicim="yatay"  → "hangi mekanlara bakıyorum" (herkes / şu an açık /
 *                    takip ettiklerim). Beyaz hap, emoji + etiket, gerekirse
 *                    `▾`. C1, C3, C4, C5, C6, C7.
 *   bicim="dikey"  → "ne arıyorum" (kahve / bar / tatlı). Emoji KENDİ
 *                    DAİRESİNDE üstte, küçük etiket altta, yatay kayan
 *                    şerit. C2 (Sürüm B).
 *   bicim="etiket" → içerik etiketi (G5: `SERGİLER`, `MÜZELER`). Beyaz hap
 *                    ama Kademe C: BÜYÜK harf, küçük punto, ferah aralık.
 *
 * Kategoriyi yatay hap yaparsan şerit uzar ve göz her etiketi tek tek
 * okumak zorunda kalır; emoji dairede 20 piksele çıkınca bir bakışta
 * taranıyor. Ayrım işlevsel, süs değil.
 *
 * Seçili durum DOLU SİYAH DEĞİL, siyah HALKA (skill §14) — dolu siyah
 * ekranda bir tane olabilir, halka istediğin kadar. `aktifBicim` ile
 * değiştirilebilir: altından KayanSecim baloncuğu akıyorsa "seffaf",
 * şeritte tek başına duruyorsa "dolu".
 */

export type CipBicim = "yatay" | "dikey" | "etiket";
export type CipAktifBicim = "halka" | "dolu" | "seffaf";

export interface CipProps {
  ad: string;
  /** emoji ya da svg. Kategoriyi RENK değil bu taşır (skill §3). */
  simge?: ReactNode;
  /** C2'de birkaç çip emoji yerine fotoğraf taşıyor (`go out`). */
  gorsel?: string;
  bicim?: CipBicim;
  aktif?: boolean;
  aktifBicim?: CipAktifBicim;
  /** açılır panel varsa `⌄` (C3, C5). */
  acilir?: boolean;
  /**
   * Açılır panelin AÇIK olup olmadığı. `aktif`ten ayrı tutuluyor: bir çip
   * seçili olduğu hâlde paneli kapalı olabilir ("tür: kahve ⌄"). İkisini
   * tek bayrağa bağlarsak seçili çipin oku hep yukarı bakar ve kullanıcı
   * kapalı bir paneli açık sanır.
   */
  acik?: boolean;
  /** C7: şehir çipindeki üst simge sayı. */
  sayi?: number;
  kat?: 0 | 1 | 2 | 3 | 4 | 5;
  onTikla?: () => void;
  /** KayanSecim baloncuğu bu öznitelikle buluyor. */
  kayan?: string;
  className?: string;
}

export default function Cip({
  ad,
  simge,
  gorsel,
  bicim = "yatay",
  aktif = false,
  aktifBicim = "halka",
  acilir = false,
  acik = false,
  sayi,
  kat = 2,
  onTikla,
  kayan,
  className = "",
}: CipProps) {
  const golge = kat ? `var(--shadow-kat-${kat})` : undefined;

  /* ---- dikey (C2): emoji dairede üstte, etiket altta ---- */
  if (bicim === "dikey") {
    return (
      <button
        type="button"
        data-kayan={kayan ?? ad}
        onClick={onTikla}
        aria-pressed={aktif}
        className={`bas flex w-[62px] shrink-0 flex-col items-center gap-1.5 border-none bg-transparent px-0.5 ${className}`}
      >
        <span
          aria-hidden
          className="grid size-11 place-items-center overflow-hidden rounded-full bg-yuzey bg-cover bg-center text-[20px] leading-none transition-shadow duration-(--sure-gecis) ease-yumusak"
          style={{
            /* Halka gölgeyle AYNI özellikte yaşıyor, satır içi birleşiyor. */
            boxShadow: aktif
              ? `0 0 0 2px var(--color-gri-900)${golge ? `, ${golge}` : ""}`
              : golge,
            /* Tırnaklı: tırnaksız url-token adresteki ilk `)` ile biter. */
            backgroundImage: gorsel ? `url("${gorsel}")` : undefined,
          }}
        >
          {gorsel ? "" : simge}
        </span>
        {/* leading-none DEĞİL: truncate'in overflow-hidden'ı satır kutusunu
            kırpıyor ve leading-none'da kutu tam punto yüksekliğinde oluyor —
            "yemek"in y'si, "park"ın p'si kesiliyor. */}
        <span
          className={`w-full truncate text-center text-2xs lowercase leading-tight tracking-ui ${
            aktif ? "font-bold text-gri-900" : "font-semibold text-gri-700"
          }`}
        >
          {ad}
        </span>
      </button>
    );
  }

  /* ---- etiket (G5): Kademe C — BÜYÜK ama küçük punto, ferah aralık ---- */
  if (bicim === "etiket") {
    const icerik = (
      <>
        {simge && (
          <span aria-hidden className="shrink-0 leading-none">
            {simge}
          </span>
        )}
        <span className="min-w-0 truncate">{ad}</span>
      </>
    );
    const sinif = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-yuzey px-3 py-1.5 text-2xs font-bold uppercase tracking-etiket text-gri-800 ${className}`;
    return onTikla ? (
      <button type="button" onClick={onTikla} className={`bas border-none ${sinif}`} style={{ boxShadow: golge }}>
        {icerik}
      </button>
    ) : (
      <span className={sinif} style={{ boxShadow: golge }}>
        {icerik}
      </span>
    );
  }

  /* ---- yatay (C1, C3–C7): beyaz hap ---- */
  const aktifSinif =
    aktif && aktifBicim === "dolu"
      ? "bg-gri-900 text-white"
      : aktif && aktifBicim === "seffaf"
        ? "bg-transparent text-white"
        : "bg-yuzey text-gri-800";

  return (
    <button
      type="button"
      data-kayan={kayan ?? ad}
      onClick={onTikla}
      aria-pressed={aktif}
      aria-expanded={acilir ? acik : undefined}
      className={`bas bas-gecis inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-none py-2 pl-3 pr-3.5 text-sm font-semibold lowercase tracking-ui ${aktifSinif} ${className}`}
      style={{
        boxShadow:
          aktif && aktifBicim === "halka"
            ? `0 0 0 2px var(--color-gri-900)${golge ? `, ${golge}` : ""}`
            : /* Baloncuk akıyorsa gölge de baloncuğun: çipin kendi gölgesi
                 kalırsa baloncuğun içinde ikinci bir kutu belirir. */
              aktifBicim === "seffaf" && aktif
              ? undefined
              : golge,
      }}
    >
      {simge && (
        <span aria-hidden className="shrink-0 text-sm leading-none">
          {simge}
        </span>
      )}
      <span className="min-w-0 truncate">{ad}</span>
      {/* C7: sayı ÜST SİMGE — etiketin parçası değil, ona iliştirilmiş bir
          not. Aynı satırda normal punto yazılsa "kadıköy 131" bir mekan
          adı gibi okunur. */}
      {sayi != null && (
        <sup className="font-sayi text-2xs font-bold leading-none opacity-70">{sayi}</sup>
      )}
      {acilir && (
        <span
          aria-hidden
          className={`shrink-0 text-xs leading-none opacity-60 transition-transform duration-(--sure-gecis) ease-yumusak ${
            acik ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      )}
    </button>
  );
}
