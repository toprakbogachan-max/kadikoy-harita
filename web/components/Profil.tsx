"use client";

import { KISILER, PINLER, LISTELER, YERLER, yerBul } from "@/lib/demo";
import { RENK, type DemoYer } from "@/lib/demo";
import { igneStil, egim, fotoZemin, simgeSvg } from "@/lib/gorsel";
import Avatar from "./Avatar";

/* profil mini haritası — elle çizilmiş Kadıköy soyutlaması (gerçek harita değil,
   paylaşım kartında da bu kullanılıyor) */
const X0 = 29.01, XS = 0.05, Y0 = 41.005, YS = 0.04;
const svgX = (lng: number) => ((lng - X0) / XS) * 100;
const svgY = (lat: number) => ((Y0 - lat) / YS) * 100;

function MiniHarita({ yerler }: { yerler: DemoYer[] }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="block aspect-[16/10] w-full">
      <rect width="100" height="100" fill="#D2DFE2" />
      <path
        d="M22 0 L26 14 L28 33 L26 46 L28 61 L34 74 L42 70 L46 61 L53 63 L60 79 L68 91 L63 80 L57 67 L66 62 L78 57 L88 41 L84 12 L80 0 Z"
        fill="#F4EEE0"
      />
      <g stroke="#fff" strokeWidth=".9" fill="none">
        <path d="M28 33 L45 30 L62 26 L80 20" />
        <path d="M30 40 L44 44 L58 52 L74 58" />
        <path d="M33 35 L34 55 L36 70" />
      </g>
      {yerler.map((y) => (
        <circle
          key={y.id}
          cx={svgX(y.lng)}
          cy={svgY(y.lat)}
          r="2.6"
          fill={RENK[y.tur]?.ana ?? "#B8801A"}
          stroke="#fff"
          strokeWidth=".6"
        />
      ))}
    </svg>
  );
}

export default function Profil({
  kisiId,
  onYerAc,
}: {
  kisiId: string;
  onYerAc: (id: string) => void;
}) {
  const kisi = KISILER[kisiId];
  if (!kisi) return null;
  const benim = !!kisi.ben;
  const pinleri = PINLER.filter((p) => p.kisi === kisiId).sort((a, b) => a.saat - b.saat);
  const yerleri = [...new Set(pinleri.map((p) => p.yer))].map(yerBul).filter(Boolean) as DemoYer[];
  const listeleri = LISTELER.filter((l) => l.sahip === kisiId);

  const baslik = "px-4 pb-2.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-kagit">
      <div className="flex items-center gap-3.5 p-4">
        <Avatar kisi={kisiId} boyut={62} />
        <div className="flex-1">
          <div className="text-[19px] font-semibold leading-tight">{kisi.ad}</div>
          <div className="mt-0.5 font-sayi text-[12px] text-murekkep2">@{kisi.k}</div>
        </div>
      </div>

      <p className="px-4 pb-3 text-[13.5px] leading-relaxed">{kisi.bio}</p>

      <div className="flex px-4 pb-3.5">
        {[
          [pinleri.length, "pin"],
          [yerleri.length, "mekan"],
          [kisi.takipci, "takipçi"],
          [kisi.takip, "takip"],
        ].map(([n, ad], i) => (
          <div key={ad as string} className={`flex-1 text-center ${i ? "border-l border-[var(--cizgi)]" : ""}`}>
            <b className="block font-sayi text-[16px]">{n as number}</b>
            <span className="font-tabela text-[9.5px] uppercase tracking-[0.12em] text-murekkep2">{ad as string}</span>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex gap-2 px-4">
        <button className="flex-1 rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white">
          {benim ? "Haritamı paylaş" : "Takip et"}
        </button>
        <button className="flex-1 rounded-sm border border-[var(--cizgi)] bg-yuzey px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em]">
          {benim ? "Pin at" : "Akışa dön"}
        </button>
      </div>

      <div className={baslik}>{benim ? "Senin" : kisi.ad + "’in"} Kadıköy haritası</div>
      <div className="mx-4 mb-3.5 overflow-hidden rounded-sm bg-su shadow-kagit">
        <MiniHarita yerler={yerleri} />
      </div>

      <div className={baslik}>{benim ? "Listelerin" : kisi.ad + "’in listeleri"}</div>
      {listeleri.length ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {listeleri.map((l, i) => {
            const ilk = l.yerler.slice(0, 3).map(yerBul).filter(Boolean) as DemoYer[];
            return (
              <div
                key={l.id}
                style={{
                  ["--pin" as string]: "#B8801A",
                  ["--pin-isik" as string]: "#E0A33E",
                  ["--pin-koyu" as string]: "#8A5E0E",
                  transform: `rotate(${egim(i)}deg)`,
                }}
                className="relative w-[158px] shrink-0 rounded-sm bg-[#EFE6CC] px-[3px] pt-[3px] shadow-kagit"
              >
                <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                <div className="flex h-[60px] overflow-hidden rounded-sm">
                  {ilk.map((y) => (
                    <div key={y.id} className="flex-1" style={{ background: fotoZemin(y.tur) }} />
                  ))}
                </div>
                <div className="px-2 pb-3 pt-2.5 text-left">
                  <div className="mb-1 text-[13px] font-semibold leading-tight">{l.baslik}</div>
                  <div className="font-sayi text-[10.5px] text-murekkep2">{l.yerler.length} mekan</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-4 pb-5 text-[13px] text-murekkep2">
          {benim ? "Henüz listen yok." : `${kisi.ad} henüz liste oluşturmamış.`}
        </p>
      )}

      <div className={baslik}>Pinler</div>
      {pinleri.length ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-5">
          {pinleri.map((p, i) => {
            const y = yerBul(p.yer);
            if (!y) return null;
            return (
              <button
                key={p.id}
                onClick={() => onYerAc(y.id)}
                style={{ ...igneStil(y.tur), transform: `rotate(${egim(i)}deg)` }}
                className="relative aspect-[0.86] rounded-sm border-none bg-[var(--kag)] p-[3px] shadow-kagit"
              >
                <span className="absolute -top-[5px] left-1/2 z-[2] size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                <div
                  className="relative grid size-full place-items-center overflow-hidden rounded-sm"
                  style={{ background: fotoZemin(y.tur) }}
                >
                  <div className="opacity-30" dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 34) }} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(0,0,0,.6)] to-transparent px-2 pb-[7px] pt-4 text-left text-[11.5px] font-semibold leading-tight text-white">
                    {y.ad}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-4 pb-6 text-[13px] text-murekkep2">Henüz pin atmadın.</p>
      )}
    </div>
  );
}
