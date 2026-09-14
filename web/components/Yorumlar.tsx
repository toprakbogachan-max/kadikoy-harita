"use client";

import { useEffect, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { pinYorumlari, yorumYaz, yorumSil } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import { useKisiler } from "@/lib/kisiler-baglam";
import { zaman } from "@/lib/gorsel";
import type { Yorum } from "@/lib/model";
import Avatar from "./Avatar";

/**
 * Yorumlar çekmecesi — gönderi detayının üstünde açılır.
 *
 * Yazma RLS altında: pin_comments policy'si `author_id = auth.uid()` istiyor,
 * silme de yalnızca yazarına açık. Oturum yoksa kutu giriş çağrısına dönüyor.
 */
export default function Yorumlar({
  pinId, onKapat, onGirisIste,
}: { pinId: string; onKapat: () => void; onGirisIste: () => void }) {
  const { ben } = useOturum();
  const [tazele, setTazele] = useState(0);
  const { veri: liste, yukleniyor } = useVeri<Yorum[]>(
    () => pinYorumlari(pinId), [pinId, tazele], []);
  const kisiler = useKisiler();
  const [metin, setMetin] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metin.trim()) return;
    setGonderiliyor(true); setHata(null);
    try {
      await yorumYaz(pinId, metin);
      setMetin("");
      setTazele((n) => n + 1);
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally {
      setGonderiliyor(false);
    }
  };

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
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-[15px]">
        <div>
          <h2 className="text-xl font-semibold leading-tight">Yorumlar</h2>
          <div className="mt-1.5 text-2xs font-bold uppercase tracking-etiket text-gri-700">
            {yukleniyor ? "yükleniyor…" : liste.length ? `${liste.length} yorum` : "ilk yorumu sen yaz"}
          </div>
        </div>
        <button
          onClick={onKapat}
          aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-lg bg-yuzey shadow-kat-1 text-base leading-none"
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
                      <span className="text-sm font-semibold">
                        {k?.ad ?? "…"}{k?.ben ? " · sen" : ""}
                      </span>
                      <span className="font-sayi text-2xs text-gri-600">{zaman(y.saat)}</span>
                    </div>
                    <p className="mt-0.5 text-base leading-snug">{y.metin}</p>
                  </div>
                  {ben?.id === y.kisi && (
                    <button
                      onClick={async () => {
                        try { await yorumSil(y.id); setTazele((n) => n + 1); }
                        catch (err) { setHata(err instanceof Error ? err.message : String(err)); }
                      }}
                      aria-label="Yorumu sil"
                      className="shrink-0 border-none bg-transparent p-0 text-sm text-gri-600"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-1 py-5 text-sm leading-relaxed text-gri-600">
            {yukleniyor ? "Yükleniyor…" : "Henüz yorum yok."}
          </p>
        )}
      </div>

      {hata && (
        <p className="shrink-0 bg-[rgba(224,39,28,.07)] px-3 py-2 text-sm">
          {hata}
        </p>
      )}

      {ben ? (
        <form onSubmit={gonder} className="flex shrink-0 gap-2 bg-yuzey p-3">
          <input
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            maxLength={500}
            placeholder="Yorum yaz…"
            aria-label="Yorum yaz"
            className="min-w-0 flex-1 rounded-lg bg-gomuk px-2.5 py-2 text-base text-murekkep outline-none placeholder:text-gri-600 focus:border-jeton"
          />
          <button
            type="submit"
            disabled={gonderiliyor || !metin.trim()}
            className="shrink-0 rounded-full border-none bg-gri-900 px-3.5 py-2 text-sm font-semibold lowercase tracking-ui text-white disabled:opacity-40"
          >
            {gonderiliyor ? "…" : "Gönder"}
          </button>
        </form>
      ) : (
        <div className="shrink-0 bg-yuzey p-3">
          <button
            onClick={onGirisIste}
            className="w-full rounded-lg bg-gomuk px-3 py-2.5 text-sm text-gri-600"
          >
            Yorum yazmak için giriş yap
          </button>
        </div>
      )}
    </div>
  );
}
