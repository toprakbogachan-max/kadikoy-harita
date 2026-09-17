"use client";

import type { ReactNode } from "react";

import Cip from "@/components/corner/primitives/Cip";

/**
 * B6 — referansın ŞEHİR ÇİPİ'nin bu üründeki karşılığı: SEMT çipi.
 *
 * ⚠ BU BİR UYARLAMA, BİREBİR KARŞILIK DEĞİL. Kararı ürün sahibinin.
 *
 * Referansta B6 dünya zoom'unda beliren `🌐 singapore`, `🌐 melbourne`
 * çipleridir: haritayı sonuna kadar uzaklaştırdığında "içerik OLAN
 * yerler" listesi çıkar, dokununca oraya uçarsın. İşlevi gezinme.
 *
 * Kadıköy Harita tek bir ilçe; dünya zoom'u yok, şehir listesi yok.
 * Bileşeni birebir taşımak boş bir kabuk üretirdi. Ama işlevin
 * karşılığı var: `semt` bu üründe gerçek bir kimlik (Profil.tsx onu
 * istatistik olarak sayıyor: "Kadıköy tek ilçe ama semt bu şehirde
 * gerçek bir kimlik"), ve mekanlar Moda / Yeldeğirmeni / Bahariye diye
 * kümeleniyor.
 *
 * Dürüst karşı argüman: altlık harita semt adlarını ZATEN yazıyor
 * (Harita.tsx `uygunSiniflar`, neighbourhood/quarter/suburb). Aynı adı
 * ikinci kez söylemek Harita.tsx'in pinsiz mekanları çizmeme gerekçesiyle
 * birebir aynı hataya düşmek olur. Bu yüzden çip ancak altlığın
 * SÖYLEYEMEDİĞİ şeyi taşırsa hak ediyor: o semtte kaç pin olduğu.
 * `sayi` verilmediğinde çip bilgi olarak altlıkla eş değerdedir.
 *
 * Bileşen bilerek İNCE: tüm biçim `Cip` primitifinden geliyor
 * (bicim="yatay", C7'nin üst simge sayısı dahil). Buradaki tek katkı
 * kararların tek yerde durması — varsayılan simge, sayının anlamı, ve
 * "hangi soruyu soruyor" ayrımı (skill §14: yatay çip = "nereye
 * bakıyorum", dikey çip = "ne arıyorum"; semt birincisi).
 */

export interface SemtCipiProps {
  /** semt adı — "Moda", "Yeldeğirmeni", "Bahariye". */
  semt: string;
  /**
   * O semtteki pin sayısı. Çipi altlık haritanın etiketinden ayıran
   * TEK şey bu; yoksa çip yalnızca bir gezinme kısayolu olur.
   */
  sayi?: number;
  /** başka bir emoji gerekiyorsa. Referansın 🌐'u burada anlamsız. */
  simge?: ReactNode;
  aktif?: boolean;
  /** gölge kademesi. Haritanın üstünde yüzüyorsa 2 (skill §5). */
  kat?: 0 | 1 | 2 | 3 | 4 | 5;
  onTikla?: () => void;
  className?: string;
}

export default function SemtCipi({
  semt,
  sayi,
  simge = "🏘️",
  aktif = false,
  kat = 2,
  onTikla,
  className = "",
}: SemtCipiProps) {
  return (
    <Cip
      ad={semt}
      simge={simge}
      sayi={sayi}
      bicim="yatay"
      /* Seçili hâl siyah HALKA, dolu siyah değil (skill §14): dolu siyah
         ekranda bir tane olabilir ve haritada o yer B7'nin. */
      aktif={aktif}
      aktifBicim="halka"
      kat={kat}
      onTikla={onTikla}
      className={className}
    />
  );
}
