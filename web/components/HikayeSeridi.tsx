"use client";

import { egim, kisiRengi } from "@/lib/gorsel";
import { useVeri } from "@/lib/kanca";
import { hikayeSeridi, type HikayeKisi } from "@/lib/veri";
import Avatar from "./Avatar";

interface Props {
  secili: string | null;
  onSec: (k: string) => void;
  /** false ise şerit ince bir çubuğa iniyor; haritaya yer açmak için */
  acik?: boolean;
  onAc?: () => void;
}

/**
 * Instagram story mantığında yuvarlak post-it'ler: takip ettiklerinin pinleri.
 * Dokununca harita o kişinin pinlediği yerlere filtrelenir.
 *
 * Takip listesi artık sabit değil — follows tablosundan geliyor.
 */
export default function HikayeSeridi({ secili, onSec, acik = true, onAc }: Props) {
  const { veri: kisiler } = useVeri<HikayeKisi[]>(hikayeSeridi, [], []);

  /* Şerit yüklenirken de yer kaplasın, yoksa harita yukarı zıplıyor */
  if (!kisiler.length) {
    return <div className={`pano-doku shrink-0 border-b border-[var(--cizgi)] ${acik ? "h-[92px]" : "h-[26px]"}`} />;
  }

  /* Kapalı hal: 92px yerine 26px. Harita ekranın %54'ünden ~%70'ine çıkıyor —
     "kompakt" isteğinin en doğrudan karşılığı bu. Avatarlar küçük halkalar
     olarak kalıyor ki şeridin var olduğu unutulmasın. */
  if (!acik) {
    return (
      <button
        onClick={onAc}
        aria-label="Takip ettiklerini göster"
        aria-expanded={false}
        className="pano-doku flex h-[26px] w-full shrink-0 items-center justify-center gap-1.5 border-none border-b border-[var(--cizgi)] px-4"
      >
        {kisiler.slice(0, 6).map((p) => (
          <span key={p.id} className="size-2.5 rounded-full border border-[rgba(74,58,30,.35)]"
                style={{ background: kisiRengi(p.id) }} />
        ))}
        <span className="ml-1 font-tabela text-[9.5px] uppercase tracking-[0.12em] text-murekkep2">
          takip ettiklerin
        </span>
      </button>
    );
  }

  return (
    <div className="pano-doku flex shrink-0 gap-3.5 overflow-x-auto border-b border-[var(--cizgi)] px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {kisiler.map((p, i) => {
        const yeni = p.sonPinSaat < 24; /* son 24 saatte yeni pin */
        const aktif = secili === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSec(p.id)}
            aria-pressed={aktif}
            className="flex w-[58px] shrink-0 flex-col items-center gap-1.5 border-none bg-transparent p-0"
          >
            <div
              className="relative grid size-[58px] place-items-center rounded-full bg-[#FBF3D9] shadow-kagit transition-transform"
              style={{
                transform: `rotate(${aktif ? 0 : egim(i)}deg)`,
                boxShadow: yeni
                  ? `var(--shadow-kagit), 0 0 0 2.5px ${kisiRengi(p.k)}`
                  : "var(--shadow-kagit)",
                outline: aktif ? "2px solid var(--color-jeton)" : undefined,
                outlineOffset: aktif ? 2 : undefined,
              }}
            >
              {/* toplu iğne */}
              <span className="absolute -top-[5px] left-1/2 size-[11px] -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,#F5C87C_16%,#DE9B2E_55%,#8E5C11_100%)]" />
              <Avatar kisi={p.id} boyut={42} />
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
