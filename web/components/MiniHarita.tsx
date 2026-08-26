"use client";

import { KADIKOY_YOLU, KADIKOY_KUTU, KADIKOY_ORAN, miniX, miniY } from "@/lib/kadikoy-sekli";
import { RENK } from "@/lib/paleti";
import type { Yer } from "@/lib/model";

/**
 * Profil ve paylaşım kartındaki mini harita.
 *
 * Şekil GERÇEK Kadıköy ilçe sınırı (OpenStreetMap, ODbL) — önceki hâli
 * uydurma 18 noktalı bir çokgendi ve "senin Kadıköy haritan" diyip
 * Kadıköy'e benzemeyen bir şey gösteriyordu.
 *
 * Karo yüklemiyor: paylaşım kartında ağ isteği olmadan çizilebilmesi ve
 * profilde anında görünmesi gerekiyor. Tek SVG yolu, 201 nokta.
 */
export default function MiniHarita({
  yerler,
  noktaBoyutu = 2.6,
}: {
  yerler: Yer[];
  noktaBoyutu?: number;
}) {
  /* lat/lng'si olmayan kayıtlar (liste ekranlarından gelenler 0,0 taşıyor)
     haritanın köşesine yığılmasın diye eleniyor */
  const cizilecek = yerler.filter((y) => y.lat !== 0 && y.lng !== 0);

  return (
    <svg
      viewBox={KADIKOY_KUTU}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full"
      /* Kutu şeklin kendi oranında; kapsayıcıyı da ona eşitleyince
         kenarlarda mavi şerit kalmıyor. */
      style={{ aspectRatio: String(KADIKOY_ORAN) }}
      role="img"
      aria-label={`Kadıköy haritası, ${cizilecek.length} mekan işaretli`}
    >
      <rect width="100%" height="100%" fill="#D2DFE2" />
      {/* kara parçası */}
      <path d={KADIKOY_YOLU} fill="#F4EEE0" stroke="#E2D7BE" strokeWidth="0.6" />

      {cizilecek.map((y) => (
        <circle
          key={y.id}
          cx={miniX(y.lng)}
          cy={miniY(y.lat)}
          r={noktaBoyutu}
          fill={RENK[y.tur]?.ana ?? "#B8801A"}
          stroke="#fff"
          strokeWidth={noktaBoyutu * 0.24}
        />
      ))}
    </svg>
  );
}
