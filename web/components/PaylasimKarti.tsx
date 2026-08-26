"use client";

import { useEffect, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { kisininPinleri, kisininYerleri } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import type { Yer, Pin } from "@/lib/model";
import MiniHarita from "./MiniHarita";

/**
 * Instagram story önizlemesi — "haritamı paylaş".
 *
 * Gerçek bir görsel üretmiyoruz; kart HTML/SVG olarak çiziliyor ve link
 * kopyalanıyor. Görseli indirilebilir PNG yapmak canvas'a çizmeyi gerektirir,
 * o ayrı bir iş.
 */
export default function PaylasimKarti({ onKapat }: { onKapat: () => void }) {
  const { ben } = useOturum();
  const [kopyalandi, setKopyalandi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const { veri: pinler } = useVeri<Pin[]>(
    () => (ben ? kisininPinleri(ben.id) : Promise.resolve([])), [ben?.id], []);
  const { veri: yerler } = useVeri<Yer[]>(
    () => (ben ? kisininYerleri(ben.id, { lat: 40.9885, lng: 29.0295 }) : Promise.resolve([])),
    [ben?.id], []);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  if (!ben) return null;
  const link = `kadikoy.app/@${ben.k}`;
  /* pinlerdeki üç kelimelerin en sık geçen altısı */
  const sayac = new Map<string, number>();
  for (const p of pinler) for (const k of p.kelimeler) sayac.set(k, (sayac.get(k) ?? 0) + 1);
  const kelimeler = [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText("https://" + link);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      /* İzin verilmezse kullanıcı elle kopyalayabilsin diye seçilebilir metin var */
      setHata("Kopyalanamadı — linki elle seçebilirsin.");
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Haritamı paylaş"
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">Haritamı paylaş</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            Instagram story önizlemesi
          </div>
        </div>
        <button onClick={onKapat} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* 9:16 story oranı */}
        <div className="mx-auto aspect-[9/16] w-full max-w-[248px] rounded-[14px] bg-[#241E14] p-3 shadow-[0_16px_40px_rgba(0,0,0,.35)]">
          <div className="flex size-full flex-col items-center justify-center gap-3 rounded-[10px] bg-kagit p-3.5">
            <div className="w-full overflow-hidden rounded-sm bg-su shadow-kagit">
              <MiniHarita yerler={yerler} noktaBoyutu={2.8} />
            </div>

            <div className="text-center">
              <div className="font-tabela text-[15px] uppercase leading-tight tracking-[0.07em]">
                {ben.ad}’in
              </div>
              <div className="font-tabela text-[15px] uppercase leading-tight tracking-[0.07em]">
                Kadıköy Haritası
              </div>
            </div>

            <div className="font-sayi text-[11.5px] text-murekkep2">
              {pinler.length} pin · {yerler.length} mekan
            </div>

            {/* Üç kelime bulutu: kartın ortası boş kalmasın ve paylaşan
                kişinin sesini taşısın — "3 pin" kuru bir sayı, kelimeler değil. */}
            {kelimeler.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1">
                {kelimeler.map((k) => (
                  <span key={k} className="rounded-sm border border-[var(--cizgi)] px-1.5 py-0.5 font-el text-[11px] font-bold">
                    {k}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-sm bg-jeton px-2.5 py-1.5 font-sayi text-[10.5px] text-white">
              {link}
            </div>
          </div>
        </div>

        {ben.acikMi === false ? (
          <div className="mt-3.5 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-3 text-[13px] leading-snug">
            <strong className="mb-1 block font-tabela text-[11px] uppercase tracking-[0.1em] text-[#921008]">
              Profilin gizli
            </strong>
            Bu link kimsede açılmaz. Ayarlardan “Profilim herkese açık”ı aç.
          </div>
        ) : (
          <p className="mt-3.5 text-center text-[12px] leading-relaxed text-murekkep2">
            Instagram story’ye eklendiğinde böyle görünür — linke dokunan doğrudan haritana gelir.
          </p>
        )}

        <p className="mt-2 select-all text-center font-sayi text-[12px] text-murekkep2">
          https://{link}
        </p>

        {hata && <p className="mt-2 text-center text-[12px] text-murekkep2">{hata}</p>}

        <p className="mt-4 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-[11.5px] leading-snug text-murekkep2">
          <b>Not:</b> kadikoy.app henüz yayında değil — link şimdilik çalışmıyor,
          kart nasıl görüneceğini gösteriyor.
        </p>
      </div>

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={kopyala} disabled={ben.acikMi === false}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {kopyalandi ? "Kopyalandı ✓" : "Linki kopyala"}
        </button>
      </div>
    </div>
  );
}
