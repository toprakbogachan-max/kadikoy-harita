"use client";

import { useEffect } from "react";
import { useVeri } from "@/lib/kanca";
import { pinYorumlari } from "@/lib/veri";
import { useKisiler } from "@/lib/kisiler-baglam";
import { zaman } from "@/lib/gorsel";
import type { Yorum } from "@/lib/model";
import Avatar from "./Avatar";

/**
 * Yorumlar çekmecesi — gönderi detayının üstünde açılır.
 *
 * Şimdilik SALT OKUNUR. Yorum yazmak pin_comments'e insert demek, policy
 * `author_id = auth.uid()` istiyor; kimlik gelmeden gönderilemez. Kutuyu
 * gizlemek yerine devre dışı gösteriyoruz — özelliğin var olduğu ama giriş
 * beklediği belli olsun.
 */
export default function Yorumlar({ pinId, onKapat }: { pinId: string; onKapat: () => void }) {
  const { veri: liste, yukleniyor } = useVeri<Yorum[]>(
    () => pinYorumlari(pinId), [pinId], []);
  const kisiler = useKisiler();

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yorumlar"
      className="absolute inset-0 z-30 flex flex-col bg-kagit"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">Yorumlar</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            {yukleniyor ? "yükleniyor…" : liste.length ? `${liste.length} yorum` : "ilk yorumu sen yaz"}
          </div>
        </div>
        <button
          onClick={onKapat}
          aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {liste.length ? (
          <ul className="m-0 list-none space-y-3.5 p-0">
            {liste.map((y) => {
              const k = kisiler[y.kisi];
              return (
                <li key={y.id} className="flex gap-2.5">
                  <Avatar kisi={y.kisi} boyut={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold">
                        {k?.ad ?? "…"}{k?.ben ? " · sen" : ""}
                      </span>
                      <span className="font-sayi text-[10.5px] text-murekkep2">{zaman(y.saat)}</span>
                    </div>
                    <p className="mt-0.5 text-[13.5px] leading-snug">{y.metin}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-1 py-5 text-[13px] leading-relaxed text-murekkep2">
            {yukleniyor ? "Yükleniyor…" : "Henüz yorum yok."}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <input
          disabled
          placeholder="Yorum yazmak için giriş gerekiyor"
          aria-label="Yorum yaz"
          className="min-w-0 flex-1 rounded-sm border border-[var(--cizgi)] bg-kagit px-2.5 py-2 text-[13.5px] text-murekkep placeholder:text-murekkep2 disabled:opacity-60"
        />
        <button
          disabled
          className="shrink-0 rounded-sm border-none bg-jeton px-3.5 py-2 font-tabela text-[12px] uppercase tracking-[0.11em] text-white disabled:opacity-40"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
