"use client";

import type { ReactNode } from "react";

/**
 * Avatar — daire ve squircle, boyut kademeleri, rozet yuvası.
 *
 * Şekil kasıtlı olarak iki türlü (skill §5) ve bu tutarsızlık değil,
 * ayrımın kendisi:
 *   squircle → KİMLİK. Profil, akış kartı, arama sonucu.
 *   daire    → HARİTADAKİ NOKTA ve satır içi küçük iz (kaydedenler şeridi,
 *              alt menüdeki sekme avatarı).
 *
 * `components/Avatar.tsx` bunun ürün tarafındaki hâli: kişi kimliğini
 * bağlamdan (useKisi) çekiyor. Bu primitif BAĞLAM BİLMİYOR — ad, foto ve
 * renk dışarıdan gelir. Sebep basit: primitif önizleme sayfasında da,
 * paylaşım kartında da, bağlamı olmayan yerlerde de çizilebilmeli.
 *
 * Yarıçap boyuta göre ölçekleniyor: sabit 22px, 20 pikselik avatarda
 * neredeyse daire yapıyor, 84 piksellikte köşeler sert kalıyor.
 */

export type AvatarBoyut = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type AvatarHalka = "yok" | "beyaz" | "siyah" | "kagit";

/* Kademeler mevcut ekranlarda fiilen kullanılan ölçüler:
   xs satır içi iz · sm yorum/şerit · md liste satırı · lg akış kartı ·
   xl profil başlığı · 2xl kapak. */
const OLCEK: Record<AvatarBoyut, number> = {
  xs: 20,
  sm: 26,
  md: 32,
  lg: 44,
  xl: 64,
  "2xl": 84,
};

const HALKA: Record<AvatarHalka, string> = {
  yok: "",
  beyaz: "0 0 0 2px #fff",
  siyah: "0 0 0 2px var(--color-gri-900)",
  kagit: "0 0 0 2px var(--color-kagit)",
};

export interface AvatarProps {
  /** baş harf buradan; foto varsa yalnızca alt metin için kullanılır. */
  ad?: string;
  foto?: string;
  /** fotosuz avatarın zemini. Verilmezse nötr gri. */
  renk?: string;
  boyut?: AvatarBoyut | number;
  sekil?: "squircle" | "daire";
  halka?: AvatarHalka;
  kat?: 0 | 1 | 2 | 3 | 4 | 5;
  /** rozet yuvası — streak sayacı, kategori emojisi, çevrimiçi noktası. */
  rozet?: ReactNode;
  rozetKonum?: "sag-alt" | "sag-ust";
  className?: string;
}

export default function Avatar({
  ad,
  foto,
  renk,
  boyut = "md",
  sekil = "squircle",
  halka = "yok",
  kat = 1,
  rozet,
  rozetKonum = "sag-alt",
  className = "",
}: AvatarProps) {
  const px = typeof boyut === "number" ? boyut : OLCEK[boyut];
  const yaricap = sekil === "daire" ? "50%" : Math.round(px * 0.28);
  /* Türkçe kasa JS'te: CSS `uppercase` tarayıcıya göre "i"yi "I" yapıyor,
     lang="tr" her yerde güvenilir değil. toLocaleUpperCase("tr") kesin. */
  const harf = ad?.trim() ? ad.trim()[0].toLocaleUpperCase("tr") : "";
  const golge = [halka === "yok" ? "" : HALKA[halka], kat ? `var(--shadow-kat-${kat})` : ""]
    .filter(Boolean)
    .join(", ");

  const kutu = (
    <span
      className="grid size-full place-items-center overflow-hidden bg-gri-100 bg-cover bg-center font-extrabold tracking-siki text-white"
      style={{
        borderRadius: yaricap,
        fontSize: Math.round(px * 0.4),
        boxShadow: golge || undefined,
        /* Tırnak şart: tırnaksız url-token adresin içindeki ilk `)`
           karakterinde biter ve bildirim sessizce düşer. */
        ...(foto
          ? { backgroundImage: `url("${foto}")` }
          : renk
            ? { background: renk }
            : null),
      }}
    >
      {/* Ne foto ne ad varsa nötr kutu kalıyor — boşluk bırakmak yerleşimi
          yükleme sırasında zıplatıyor. */}
      {foto ? "" : harf}
    </span>
  );

  if (!rozet) {
    return (
      <span
        className={`inline-grid shrink-0 ${className}`}
        style={{ width: px, height: px }}
        aria-hidden={ad ? undefined : true}
        title={ad || undefined}
      >
        {kutu}
      </span>
    );
  }

  /* Rozet yuvası: avatarın köşesinden TAŞIYOR (-2px). İçeride dursaydı
     avatarın kendi görüntüsünü yiyecekti; taşınca "üstüne iliştirilmiş"
     okunuyor — çıkartma mantığının küçük akrabası. */
  return (
    <span
      className={`relative inline-grid shrink-0 ${className}`}
      style={{ width: px, height: px }}
      title={ad || undefined}
    >
      {kutu}
      <span
        className={`absolute -right-0.5 grid place-items-center ${
          rozetKonum === "sag-alt" ? "-bottom-0.5" : "-top-0.5"
        }`}
        style={{ minWidth: Math.max(16, Math.round(px * 0.34)) }}
      >
        {rozet}
      </span>
    </span>
  );
}
