"use client";

import { useState } from "react";
import { RENK, KAGIT, TUR_AD } from "@/lib/paleti";
import { egim } from "@/lib/gorsel";

/** kategori olmayan filtreler için ayrı kağıt temaları */
const CIP_TEMA: Record<string, { kag: string; pin: string; isik: string; koyu: string }> = {
  acik: { kag: "#FBF3D9", pin: "#DE9B2E", isik: "#F5C87C", koyu: "#8E5C11" },
  hepsi: { kag: "#EAE3CE", pin: "#8B7A55", isik: "#C9B98E", koyu: "#5C4E30" },
  takip: { kag: "#DCE9F3", pin: "#2A6F97", isik: "#86C0DE", koyu: "#123F58" },
  kaydettiklerim: { kag: "#EFE2C2", pin: "#8A5E0E", isik: "#C9A25E", koyu: "#4A3106" },
  tur: { kag: "#E7E0D0", pin: "#7E6C55", isik: "#C6B7A2", koyu: "#453A2C" },
};

/* Üst sıra: uygulamanın ekseni olan filtreler. Kategoriler burada DEĞİL —
   dokuz kategori çipi on dört öğelik bir şerit yapıyordu ve kategoriye göre
   süzmek rehber davranışı; bu uygulamanın ekseni ise insanlar. */
const ANA = [
  { id: "hepsi", ad: "Hepsi" },
  { id: "takip", ad: "Takip ettiklerim" },
  { id: "kaydettiklerim", ad: "Kaydettiklerim" },
  { id: "acik", ad: "Şu an açık" },
];

const TURLER = Object.keys(TUR_AD).map((t) => ({ id: t, ad: TUR_AD[t] }));

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


/* Modül seviyesinde: render içinde bileşen tanımlamak her render'da yeni bir
   tip üretir, React ağacı söküp yeniden kurar. */
function Cip({ id, ad, aktif, i, onTikla }: {
  id: string; ad: string; aktif: boolean; i: number; onTikla: () => void;
}) {
  return (
    <button
      onClick={onTikla}
      aria-pressed={aktif}
      style={{
        ...cipStil(id),
        background: "var(--kag)",
        transform: `rotate(${aktif ? 0 : egim(i)}deg) translateY(${aktif ? -1 : 0}px)`,
        outline: aktif ? "2px solid var(--color-jeton)" : undefined,
        outlineOffset: aktif ? 1 : undefined,
      }}
      className="relative shrink-0 whitespace-nowrap rounded-sm border-none px-3.5 pb-1.5 pt-2.5 font-el text-[14.5px] font-bold text-murekkep shadow-kagit transition-transform"
    >
      <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
      {ad}
    </button>
  );
}

/** Filtreler mantar panoya iğnelenmiş post-it'ler olarak duruyor. */
export default function FiltreCipleri({
  secili,
  onSec,
}: {
  secili: string;
  onSec: (id: string) => void;
}) {
  /* Seçili bir kategori varsa "Tür" çipi onun adını taşıyor ve aktif görünüyor
     — yoksa kullanıcı hangi süzgecin açık olduğunu göremezdi. */
  const seciliTur = TURLER.find((t) => t.id === secili);
  const [turAcik, setTurAcik] = useState(false);

  /* Harita üstünde yüzerken pano dokusu opak değil: altındaki harita görünsün
     ama çipler okunur kalsın diye yumuşak bir degrade. */
  return (
    <div className="shrink-0 bg-[linear-gradient(to_top,rgba(244,238,224,.97)_55%,rgba(244,238,224,0))] pt-4">
      {/* Şerit "Tür"e kadar kayıyor ama scrollbar'ı gizli (aşağıda), bu yüzden
          sağda kaymanın devam ettiğini gösteren bir uç fade şart — yoksa
          "Şu an açık" sonrası her şey keşfedilmeden kesiliyormuş gibi duruyor. */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-4 py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ANA.map((c, i) => (
            <Cip key={c.id} id={c.id} ad={c.ad} i={i}
                 aktif={secili === c.id} onTikla={() => { setTurAcik(false); onSec(c.id); }} />
          ))}
          <Cip
            id={seciliTur?.id ?? "tur"}
            ad={seciliTur ? `${seciliTur.ad} ▾` : "Tür ▾"}
            i={ANA.length}
            aktif={!!seciliTur}
            onTikla={() => setTurAcik((a) => !a)}
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-[linear-gradient(to_right,rgba(244,238,224,0),rgba(244,238,224,.95))]" />
      </div>

      {turAcik && (
        <div className="flex flex-wrap gap-2.5 border-t border-[var(--cizgi)] px-4 pb-3.5 pt-3">
          {TURLER.map((t, i) => (
            <Cip key={t.id} id={t.id} ad={t.ad} i={i}
                 aktif={secili === t.id}
                 onTikla={() => { setTurAcik(false); onSec(t.id); }} />
          ))}
        </div>
      )}
    </div>
  );
}
