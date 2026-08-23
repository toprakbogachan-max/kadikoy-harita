"use client";

import { RENK, KAGIT, TUR_AD } from "@/lib/demo";
import { egim } from "@/lib/gorsel";

/** kategori olmayan filtreler için ayrı kağıt temaları */
const CIP_TEMA: Record<string, { kag: string; pin: string; isik: string; koyu: string }> = {
  acik: { kag: "#FBF3D9", pin: "#DE9B2E", isik: "#F5C87C", koyu: "#8E5C11" },
  hepsi: { kag: "#EAE3CE", pin: "#8B7A55", isik: "#C9B98E", koyu: "#5C4E30" },
  populer: { kag: "#FCE8B4", pin: "#E0A33E", isik: "#FFE9A8", koyu: "#C07A16" },
  kaydettiklerim: { kag: "#EFE2C2", pin: "#8A5E0E", isik: "#C9A25E", koyu: "#4A3106" },
};

const LISTE = [
  { id: "acik", ad: "Şu an açık" },
  { id: "hepsi", ad: "Hepsi" },
  { id: "populer", ad: "Popüler" },
  { id: "kaydettiklerim", ad: "Kaydettiklerim" },
  ...Object.keys(TUR_AD).map((t) => ({ id: t, ad: TUR_AD[t] })),
];

function cipStil(id: string): React.CSSProperties {
  const r = RENK[id];
  const t = r
    ? { kag: KAGIT[id], pin: r.ana, isik: r.isik, koyu: r.golge }
    : CIP_TEMA[id] ?? CIP_TEMA.hepsi;
  return {
    ["--kag" as string]: t.kag,
    ["--pin" as string]: t.pin,
    ["--pin-isik" as string]: t.isik,
    ["--pin-koyu" as string]: t.koyu,
  };
}

/** Filtreler mantar panoya iğnelenmiş post-it'ler olarak duruyor. */
export default function FiltreCipleri({
  secili,
  onSec,
}: {
  secili: string;
  onSec: (id: string) => void;
}) {
  return (
    <div className="pano-doku flex shrink-0 gap-3 overflow-x-auto border-t border-[var(--cizgi)] px-4 py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {LISTE.map((c, i) => {
        const aktif = secili === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSec(c.id)}
            aria-pressed={aktif}
            style={{
              ...cipStil(c.id),
              background: "var(--kag)",
              transform: `rotate(${aktif ? 0 : egim(i)}deg) translateY(${aktif ? -1 : 0}px)`,
              outline: aktif ? "2px solid var(--color-jeton)" : undefined,
              outlineOffset: aktif ? 1 : undefined,
            }}
            className="relative shrink-0 whitespace-nowrap rounded-sm border-none px-3.5 pb-1.5 pt-2.5 font-el text-[14.5px] font-bold text-murekkep shadow-kagit transition-transform"
          >
            <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
            {c.ad}
          </button>
        );
      })}
    </div>
  );
}
