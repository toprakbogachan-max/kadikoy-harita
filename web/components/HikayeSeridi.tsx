"use client";

import { KISILER, PINLER } from "@/lib/demo";
import { egim } from "@/lib/gorsel";
import Avatar from "./Avatar";

/* takip edilenler — Supabase gelince follows tablosundan okunacak */
const TAKIPTEKILER = new Set(["elif", "mert"]);

interface Props {
  secili: string | null;
  onSec: (k: string) => void;
}

/**
 * Instagram story mantığında yuvarlak post-it'ler: takip ettiklerinin pinleri.
 * Dokununca harita o kişinin pinlediği yerlere filtrelenir.
 */
export default function HikayeSeridi({ secili, onSec }: Props) {
  const enSonSaat = (k: string) =>
    Math.min(Infinity, ...PINLER.filter((p) => p.kisi === k).map((p) => p.saat));

  const kisiler = Object.entries(KISILER)
    .filter(([k, p]) => p.ben || TAKIPTEKILER.has(k))
    .sort(
      (a, b) => (b[1].ben ? 1 : 0) - (a[1].ben ? 1 : 0) || enSonSaat(a[0]) - enSonSaat(b[0]),
    );

  return (
    <div className="pano-doku flex shrink-0 gap-3.5 overflow-x-auto border-b border-[var(--cizgi)] px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {kisiler.map(([k, p], i) => {
        const yeni = enSonSaat(k) < 24; /* son 24 saatte yeni pin */
        const aktif = secili === k;
        return (
          <button
            key={k}
            onClick={() => onSec(k)}
            aria-pressed={aktif}
            className="flex w-[58px] shrink-0 flex-col items-center gap-1.5 border-none bg-transparent p-0"
          >
            <div
              className="relative grid size-[58px] place-items-center rounded-full bg-[#FBF3D9] shadow-kagit transition-transform"
              style={{
                transform: `rotate(${aktif ? 0 : egim(i)}deg)`,
                boxShadow: yeni
                  ? `var(--shadow-kagit), 0 0 0 2.5px ${p.renk}`
                  : "var(--shadow-kagit)",
                outline: aktif ? "2px solid var(--color-jeton)" : undefined,
                outlineOffset: aktif ? 2 : undefined,
              }}
            >
              {/* toplu iğne */}
              <span className="absolute -top-[5px] left-1/2 size-[11px] -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,#F5C87C_16%,#DE9B2E_55%,#8E5C11_100%)]" />
              <Avatar kisi={k} boyut={42} />
            </div>
            <span
              className={`max-w-[58px] truncate font-tabela text-[10px] uppercase tracking-[0.05em] ${aktif ? "text-murekkep" : "text-murekkep2"}`}
            >
              {p.ben ? "Sen" : p.ad}
            </span>
          </button>
        );
      })}
    </div>
  );
}
