"use client";

import { useEffect, useState } from "react";
import { sikayetEt, SIKAYET_SEBEPLERI } from "@/lib/veri";

/**
 * Şikayet formu — pin ya da yorum için.
 *
 * Şikayet edilen içerik anında gizlenmiyor: tek kişinin şikayeti içeriği
 * kaldırmaya yetmemeli, yoksa kötüye kullanılır. Kayıt reports tablosuna
 * düşüyor, moderasyon ayrı bir iş.
 */
export default function Sikayet({
  pinId, yorumId, onKapat,
}: { pinId?: string; yorumId?: string; onKapat: () => void }) {
  const [sebep, setSebep] = useState<string>("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [bitti, setBitti] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !gonderiliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, gonderiliyor]);

  const gonder = async () => {
    setGonderiliyor(true); setHata(null);
    try {
      await sikayetEt({ pinId, yorumId }, sebep);
      setBitti(true);
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Şikayet et"
         className="absolute inset-0 z-[45] flex items-end bg-[rgba(20,15,8,.5)]">
      <div className="w-full rounded-t-[14px] bg-kagit p-4">
        {bitti ? (
          <>
            <h2 className="mb-2 text-[18px] font-semibold">Şikayetin alındı</h2>
            <p className="mb-4 text-[13px] leading-relaxed text-murekkep2">
              İçerik hemen kaldırılmıyor — tek şikayet buna yetmemeli, yoksa
              kötüye kullanılır. Kayıt tutuldu, incelenecek.
            </p>
            <button onClick={onKapat}
              className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white">
              Tamam
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[18px] font-semibold leading-tight">Neyi şikayet ediyorsun?</h2>
              <button onClick={onKapat} aria-label="Kapat" disabled={gonderiliyor}
                className="size-[28px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[14px] leading-none disabled:opacity-40">
                ✕
              </button>
            </div>

            <div className="mb-3 flex flex-col gap-1.5">
              {SIKAYET_SEBEPLERI.map((s) => (
                <button key={s} onClick={() => setSebep(s)} aria-pressed={sebep === s}
                  className={`rounded-sm px-3 py-2.5 text-left text-[13.5px] ${
                    sebep === s
                      ? "border-none bg-jeton text-white"
                      : "border border-[var(--cizgi)] bg-yuzey text-murekkep"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {hata && (
              <p className="mb-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
                {hata}
              </p>
            )}

            <button onClick={gonder} disabled={!sebep || gonderiliyor}
              className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
              {gonderiliyor ? "…" : "Şikayet et"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
