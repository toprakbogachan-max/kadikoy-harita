"use client";

import type { ReactNode } from "react";

/**
 * B4 — yer imi pini (referansta `bookmark pin`).
 *
 * Envanter: "Başkasının kaydettiği mekanlar mavi bookmark şeklinde."
 * Yani haritada iki ayrı şey var: mekanın KENDİSİ (fotoğraflı daire /
 * emoji daire / nokta) ve o mekanın BİR BAŞKASI TARAFINDAN kaydedilmiş
 * olması. İkincisi bir mekan türü değil bir ilişki, o yüzden daire
 * dilinden ayrı bir biçim alıyor.
 *
 * ⚠ SAF SUNUM. MapLibre'ye bağlı DEĞİL, veri çekmiyor, hangi mekanın
 * kimin kaydı olduğunu bilmiyor. Hepsi props.
 *
 * ── Biçim ──────────────────────────────────────────────────────────
 * Silüet, D5'teki `gideceğim` yer imiyle AYNI glif (GidecegimGittim'in
 * `Imlec`i). Bilinçli: "kaydedildi" fikri uygulamanın iki ayrı yerinde
 * aynı şekille konuşsun. Skill §5 "daire = haritadaki nokta" diyor ve
 * bu ondan sapma — ama sapmanın kendisi bilgi: daire mekanı, yer imi
 * mekana yapılmış bir işareti gösteriyor.
 *
 * ── Renk: NANE (karar 2026-09-17) ──────────────────────────────────
 * Referans MAVİ. Ürün kararı nane: kaydetmenin rengi bu üründe nane, mavi
 * yalnızca çalışıyor/burada ara için ayrıldı (skill §14'ün tek istisnası,
 * B7 orada) ve `--color-mavi` haritada ZATEN kullanıcının kendi konum
 * noktası (.benim-konum-nokta). Mavi yer imi haritada iki ayrı mavi
 * demekti — biri "sen", diğeri "başkasının kaydı". Referansa sadık mavi
 * varyant bu yüzden kaldırıldı.
 *
 * Dolgu `--color-nane`: bu pin için açılan doygun uç. Pastel
 * `--color-rozet-nane` 40 piksellik bir pinde altlıktan ayrışmıyordu.
 * Beyaz kenar zorunlu: kenarsız pin koyu bir binanın ya da parkın
 * üstünde kayboluyor (.foto-marker-kutu'nun beyaz kenarı da aynı sebeple).
 */

export interface YerImiPiniProps {
  /**
   * Pinin içine giren kategori emojisi (skill §6: emoji birinci sınıf
   * vatandaş). Verilmezse boş yer imi kalıyor — "burası kaydedilmiş"
   * bilgisi tek başına da bir şey söylüyor.
   */
  simge?: ReactNode;
  /** yükseklik (px). Genişlik oranla türüyor. */
  boyut?: number;
  secili?: boolean;
  /**
   * BİLİNEN kapalı. `undefined` = saat bilgisi yok ve o durumda
   * soldurma YOK — bilmediğimiz şeyi biliyormuş gibi göstermemek
   * haritanın mevcut kuralı (Harita.tsx'te `acik ?? null`).
   */
  kapali?: boolean;
  /** ekran okuyucu metni. Marker'a dışarıdan da verilebilir. */
  etiket?: string;
  className?: string;
}

export default function YerImiPini({
  simge,
  boyut = 40,
  secili = false,
  kapali = false,
  etiket,
  className = "",
}: YerImiPiniProps) {
  const genislik = Math.round(boyut * 0.75);

  return (
    <span
      role={etiket ? "img" : undefined}
      aria-label={etiket}
      aria-hidden={etiket ? undefined : true}
      className={`relative block ${className}`}
      style={{ width: genislik, height: boyut }}
    >
      {/* Ölçek İÇ katmanda: MapLibre kendi transform'unu marker
          elemanına yazıyor, aynı elemanda ikinci bir transform pinleri
          zoom sırasında kaydırıyor (Harita.tsx'in .jeton-ic ayrımı da
          bu yüzden var). */}
      <span
        className="block size-full origin-bottom transition-transform duration-[160ms] ease-yumusak motion-reduce:transition-none"
        style={{
          transform: secili ? "scale(1.18)" : undefined,
          /* Silüetin gölgesi box-shadow olamaz: kutuyu değil şekli
             takip etmesi gerekiyor. */
          filter: `drop-shadow(0 2px 6px rgba(16,16,20,.24))${kapali ? " grayscale(.65) brightness(.98)" : ""}`,
          opacity: kapali ? 0.62 : undefined,
        }}
      >
        <svg viewBox="0 0 30 40" className="block size-full" aria-hidden>
          <path
            d="M7 2 H23 A5 5 0 0 1 28 7 V37 L15 28.5 L2 37 V7 A5 5 0 0 1 7 2 Z"
            fill="var(--color-nane)"
            /* SVG sunum özniteliği CSS değişkenini çözmüyor; stil üzerinden. */
            style={{ stroke: "var(--color-yuzey)" }}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        </svg>
        {/* Emoji SVG <text> ile değil üstte ayrı katmanda: <text>
            içindeki emoji tarayıcıya göre ya tek renk ya hiç çizilmiyor.
            Kutu yalnızca gövdeyi (çentiğin üstünü) kaplıyor ki emoji
            optik olarak ortada dursun, geometrik ortada değil. */}
        {simge != null && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 grid place-items-center leading-none"
            style={{ height: Math.round(boyut * 0.74), fontSize: Math.round(boyut * 0.38) }}
          >
            {simge}
          </span>
        )}
      </span>
    </span>
  );
}
