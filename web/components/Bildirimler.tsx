"use client";

import { useEffect } from "react";
import { useVeri } from "@/lib/kanca";
import { bildirimler, bildirimleriOkundu, type Bildirim } from "@/lib/veri";
import { useKisiler } from "@/lib/kisiler-baglam";
import { zaman } from "@/lib/gorsel";
import Avatar from "./Avatar";

/**
 * Bildirimler — beğeni, yorum, takip.
 *
 * Açılınca hepsi okundu işaretleniyor: rozet kırmızı kalmasın diye kullanıcıyı
 * tek tek dokunmaya zorlamak gereksiz. Satırlar yine de okunmamışları vurguluyor
 * ki neyin yeni olduğu görülsün.
 */
export default function Bildirimler({
  onKapat, onGonderiAc, onKisiAc,
}: {
  onKapat: () => void;
  onGonderiAc: (pinId: string) => void;
  onKisiAc: (kullaniciAdi: string) => void;
}) {
  const { veri: liste, yukleniyor } = useVeri<Bildirim[]>(bildirimler, [], []);
  const kisiler = useKisiler();

  useEffect(() => {
    /* Liste geldiyse okundu yaz — boşken yazmak gereksiz istek */
    if (liste.length) bildirimleriOkundu().catch((e) => console.error("okundu yazılamadı:", e));
  }, [liste]);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  const metin = (b: Bildirim) => {
    const yer = b.yerAdi ? ` — ${b.yerAdi}` : "";
    if (b.tur === "like") return `pinini beğendi${yer}`;
    if (b.tur === "comment") return `pinine yorum yaptı${yer}`;
    return "seni takip etmeye başladı";
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Bildirimler"
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">Bildirimler</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            {yukleniyor ? "yükleniyor…" : `${liste.length} bildirim`}
          </div>
        </div>
        <button onClick={onKapat} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {liste.length ? (
          <ul className="m-0 list-none p-0">
            {liste.map((b) => {
              const k = kisiler[b.kisi];
              return (
                <li key={b.id}>
                  <button
                    onClick={() => (b.pinId ? onGonderiAc(b.pinId) : k && onKisiAc(k.k))}
                    className={`flex w-full items-start gap-2.5 border-none border-b border-[var(--cizgi)] px-4 py-3 text-left ${
                      b.okundu ? "bg-transparent" : "bg-[rgba(184,128,26,.07)]"
                    }`}
                  >
                    <Avatar kisi={b.kisi} boyut={34} />
                    <span className="min-w-0 flex-1">
                      <span className="text-[13.5px] leading-snug">
                        <b>{k?.ad ?? "…"}</b> {metin(b)}
                      </span>
                      {b.yorum && (
                        <span className="mt-1 block truncate text-[12.5px] text-murekkep2">
                          “{b.yorum}”
                        </span>
                      )}
                      {!b.yorum && b.pinMetni && (
                        <span className="mt-1 block truncate text-[12.5px] text-murekkep2">
                          {b.pinMetni}
                        </span>
                      )}
                      <span className="mt-1 block font-sayi text-[10.5px] text-murekkep2">
                        {zaman(b.saat)}
                      </span>
                    </span>
                    {!b.okundu && (
                      <span aria-label="okunmadı"
                            className="mt-1.5 size-[7px] shrink-0 rounded-full bg-jeton" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-[13px] leading-relaxed text-murekkep2">
            {yukleniyor
              ? "Yükleniyor…"
              : "Henüz bildirim yok. Biri pinini beğendiğinde ya da yorum yaptığında burada görürsün."}
          </p>
        )}
      </div>
    </div>
  );
}
