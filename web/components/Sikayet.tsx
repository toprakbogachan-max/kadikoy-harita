"use client";

import { useEffect, useState } from "react";
import { sikayetEt, SIKAYET_SEBEPLERI } from "@/lib/veri";
import Pill from "./corner/primitives/Pill";

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
            <h2 className="mb-2 text-xl font-semibold">Şikayetin alındı</h2>
            <p className="mb-4 text-sm leading-relaxed text-gri-600">
              İçerik hemen kaldırılmıyor — tek şikayet buna yetmemeli, yoksa
              kötüye kullanılır. Kayıt tutuldu, incelenecek.
            </p>
            <Pill dolgu="siyah" boy="buyuk" tamGenislik onTikla={onKapat}>
              Tamam
            </Pill>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold leading-tight">Neyi şikayet ediyorsun?</h2>
              <button onClick={onKapat} aria-label="Kapat" disabled={gonderiliyor}
                className="size-[28px] shrink-0 rounded-lg bg-yuzey shadow-kat-1 text-base leading-none disabled:opacity-40">
                ✕
              </button>
            </div>

            <div className="mb-3 flex flex-col gap-1.5">
              {SIKAYET_SEBEPLERI.map((s) => (
                <button key={s} onClick={() => setSebep(s)} aria-pressed={sebep === s}
                  className={`rounded-md px-3 py-2.5 text-left text-base ${
                    sebep === s
                      ? "border-none bg-gri-900 text-white"
                      : "bg-yuzey shadow-kat-1 text-murekkep"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {hata && (
              <p className="mb-3 rounded-md border border-[rgba(179,38,30,.3)] bg-[rgba(179,38,30,.07)] p-2.5 text-sm">
                {hata}
              </p>
            )}

            <Pill dolgu="siyah" boy="buyuk" tamGenislik
                  onTikla={gonder} pasif={!sebep || gonderiliyor} yukleniyor={gonderiliyor}>
              Şikayet et
            </Pill>
          </>
        )}
      </div>
    </div>
  );
}
