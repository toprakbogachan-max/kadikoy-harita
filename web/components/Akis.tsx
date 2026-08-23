"use client";

import { useMemo, useState } from "react";
import { PINLER, KISILER, yerBul, medyalari, type DemoPin } from "@/lib/demo";
import { igneStil, egim, fotoZemin, simgeSvg } from "@/lib/gorsel";
import Avatar from "./Avatar";

const TAKIPTEKILER = new Set(["elif", "mert"]);
const HAFTA_SAAT = 24 * 7;

/* Üç sekmenin sıralaması kasıtlı olarak farklı — aynı olursa biri
   diğerinin kopyası olur (BRIEF → Üç yüzey). */
const SEKMELER = [
  { id: "kesfet", ad: "Keşfet", kag: "#FBF3D9", pin: "#DE9B2E", isik: "#F5C87C", koyu: "#8E5C11" },
  { id: "populer", ad: "Popüler", kag: "#FCE8B4", pin: "#E0A33E", isik: "#FFE9A8", koyu: "#C07A16" },
  { id: "takip", ad: "Takip", kag: "#E3DDF8", pin: "#7360C4", isik: "#B4A8F2", koyu: "#412F86" },
] as const;

export default function Akis({ onGonderiAc }: { onGonderiAc: (id: number, liste: number[]) => void }) {
  const [sekme, setSekme] = useState<string>("kesfet");

  const sirali = useMemo<DemoPin[]>(() => {
    if (sekme === "takip")
      return PINLER.filter((p) => TAKIPTEKILER.has(p.kisi) || KISILER[p.kisi]?.ben).sort(
        (a, b) => a.saat - b.saat,
      );
    if (sekme === "populer")
      return PINLER.filter((p) => p.saat < HAFTA_SAAT).sort((a, b) => b.begeni - a.begeni);
    /* keşfet: beğeni ÷ tazelik */
    return [...PINLER].sort(
      (a, b) => b.begeni / Math.pow(a.saat + 2, 0.6) - a.begeni / Math.pow(b.saat + 2, 0.6),
    );
  }, [sekme]);

  const idler = sirali.map((p) => p.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* sekmeler de post-it */}
      <div className="pano-doku flex shrink-0 gap-3 overflow-x-auto border-b border-[var(--cizgi)] px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SEKMELER.map((s, i) => {
          const aktif = sekme === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSekme(s.id)}
              aria-selected={aktif}
              role="tab"
              style={{
                background: s.kag,
                ["--pin" as string]: s.pin,
                ["--pin-isik" as string]: s.isik,
                ["--pin-koyu" as string]: s.koyu,
                transform: `rotate(${aktif ? 0 : egim(i)}deg) translateY(${aktif ? -1 : 0}px)`,
                outline: aktif ? "2px solid var(--color-jeton)" : undefined,
                outlineOffset: aktif ? 1 : undefined,
              }}
              className="relative shrink-0 whitespace-nowrap rounded-sm border-none px-3.5 pb-1.5 pt-2.5 font-tabela text-[11.5px] uppercase tracking-[0.06em] text-murekkep shadow-kagit"
            >
              <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
              {s.ad}
            </button>
          );
        })}
      </div>

      {/* Instagram Explore tarzı ızgara: yan yana küçük post-it'ler */}
      <div className="pano-doku min-h-0 flex-1 overflow-y-auto px-0 pb-2.5 pt-1">
        {sirali.length ? (
          <div className="grid grid-cols-3 gap-x-[11px] gap-y-3.5 px-[15px] pb-5 pt-2.5">
            {sirali.map((p, i) => {
              const y = yerBul(p.yer);
              if (!y) return null;
              const medya = medyalari(p);
              const video = medya[0].tur === "video";
              const coklu = medya.length > 1;
              return (
                <button
                  key={p.id}
                  onClick={() => onGonderiAc(p.id, idler)}
                  style={{ ...igneStil(y.tur), transform: `rotate(${egim(i)}deg)` }}
                  className="relative aspect-[0.8] rounded-sm border-none bg-[var(--kag)] p-[3px] shadow-kagit"
                >
                  <span className="absolute -top-[5px] left-1/2 z-[2] size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                  <div
                    className="relative grid size-full place-items-center overflow-hidden rounded-sm"
                    style={{ background: fotoZemin(y.tur) }}
                    dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 32) }}
                  />
                  {/* beğeni sol üstte */}
                  <span className="absolute left-2 top-2 z-[1] flex items-center gap-[3px] rounded-sm bg-[rgba(20,15,8,.5)] px-[5px] py-[2px] font-sayi text-[9px] text-white">
                    ♥ {p.begeni}
                  </span>
                  {(video || coklu) && (
                    <span className="absolute right-1.5 top-1.5 z-[2] flex gap-1">
                      {video && (
                        <span className="grid size-[19px] place-items-center rounded-full bg-[rgba(20,15,8,.62)] text-[8px] text-white">▶</span>
                      )}
                      {coklu && (
                        <span className="grid size-[19px] place-items-center rounded bg-[rgba(20,15,8,.62)] text-[9px] text-white">▤</span>
                      )}
                    </span>
                  )}
                  {/* alt perde: mekan + kişi + puan */}
                  <div className="absolute inset-x-[3px] bottom-[3px] bg-gradient-to-t from-[rgba(0,0,0,.7)] to-transparent px-1.5 pb-1.5 pt-4 text-left text-white">
                    <div className="mb-[3px] truncate text-[10px] font-semibold leading-tight">{y.ad}</div>
                    <div className="flex items-center gap-1 overflow-hidden text-[9px] text-white/85">
                      <Avatar kisi={p.kisi} boyut={15} />
                      <span className="truncate">{KISILER[p.kisi]?.ad}</span>
                      {p.puan != null && (
                        <span className="ml-auto shrink-0 font-sayi text-[11px] font-bold">{p.puan}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-6 text-[13px] leading-relaxed text-murekkep2">
            {sekme === "takip"
              ? "Takip ettiğin kimsenin yeni pini yok. Keşfet sekmesinden birilerini bul."
              : "Bu hafta pin atılmamış."}
          </p>
        )}
      </div>
    </div>
  );
}
