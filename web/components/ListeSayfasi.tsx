"use client";

import { useEffect } from "react";
import type { Liste } from "@/lib/model";
import { igneStil, simgeSvg, fotoZemin } from "@/lib/gorsel";
import { TUR_AD } from "@/lib/paleti";
import MiniHarita from "./MiniHarita";

/**
 * Liste içeriği.
 *
 * Neden var: liste oluşturulabiliyor, başlığı ve "N mekan" sayısı görünüyor,
 * silinebiliyordu — ama İÇİNDEKİLER hiçbir yerden açılamıyordu. Profilde kart
 * düz bir div'di, arşivde tek düğme silmeydi. "Kendi küratörlüğün" okunamayan
 * bir çıktı üretiyordu.
 *
 * Sunucuya sormuyor: Liste.yerler zaten tam Yer nesneleri taşıyor (kart bile
 * ilk mekanların renk şeritlerini onlardan çiziyordu).
 */
export default function ListeSayfasi({
  liste, sahibi, onKapat, onYerAc, onHaritada,
}: {
  liste: Liste;
  /** başkasının listesine bakarken sahibinin adı */
  sahibi?: string;
  onKapat: () => void;
  /** oncelikliKisi: mekan sayfası bu kişinin pinini önce göstersin */
  onYerAc: (yerId: string, oncelikliKisi?: string) => void;
  /** Listenin tamamını ana haritada göster. */
  onHaritada?: (liste: Liste) => void;
}) {
  /* Koordinatsız kayıt varsa (eski bir listede ya da mekan silinmişse)
     haritada gösterilecek bir şey yok, o zaman hiç çizilmiyor. */
  const haritalik = liste.yerler.filter((y) => y.lat !== 0 && y.lng !== 0);
  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  return (
    <div role="dialog" aria-modal="true" aria-label={liste.baslik}
         className="absolute inset-0 z-[42] flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start gap-2.5 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <button onClick={onKapat} aria-label="Geri"
          className="mt-0.5 shrink-0 border-none bg-transparent p-0 text-[18px] leading-none text-murekkep2">
          ‹
        </button>
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-tight">{liste.baslik}</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            {liste.yerler.length} mekan{sahibi ? ` · ${sahibi}` : ""}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {liste.not && (
          <p className="border-b border-[var(--cizgi)] px-4 py-3 font-el text-[15px] leading-snug">
            {liste.not}
          </p>
        )}

        {/* Liste düz bir addan ibaretti: "Yağmurlu günde Kadıköy" deyip
            mekanların birbirine yakın mı, ilçeye dağılmış mı olduğunu
            göstermiyordu. Harita listenin şeklini bir bakışta veriyor;
            dokununca ana harita bu listeye kadraj alıyor. */}
        {haritalik.length > 0 && (
          onHaritada ? (
            <button
              onClick={() => onHaritada(liste)}
              aria-label={`${liste.baslik} listesini haritada göster`}
              className="relative m-4 block w-[calc(100%-2rem)] overflow-hidden rounded-sm border-none bg-su p-0 shadow-kagit"
            >
              <MiniHarita yerler={haritalik} />
              <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-[rgba(20,15,8,.55)] px-1.5 py-1 font-tabela text-[9px] uppercase tracking-[0.1em] text-white">
                Haritada gör
              </span>
            </button>
          ) : (
            <div className="m-4 overflow-hidden rounded-sm bg-su shadow-kagit">
              <MiniHarita yerler={haritalik} />
            </div>
          )
        )}

        {liste.yerler.length ? (
          <ul className="m-0 list-none p-0">
            {liste.yerler.map((y) => (
              <li key={y.id}>
                {/* Mekana dokununca liste kapanıyor ve harita oraya odaklanıyor —
                    açık kalsa kullanıcı haritayı listenin altında göremezdi. */}
                <button
                  /* Liste sahibinin pini önce gösterilsin: birinin listesinden
                     bir mekana giriyorsan, merak ettiğin şey ONUN oraya ne
                     yazdığı. Sahip zaten listenin üstünde duruyor. */
                  onClick={() => { onKapat(); onYerAc(y.id, liste.sahip); }}
                  className="flex w-full items-center gap-3 border-none border-b border-[var(--cizgi)] bg-transparent px-4 py-3 text-left last:border-0"
                >
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-sm"
                        style={{ background: fotoZemin(y.tur) }}>
                    <span style={igneStil(y.tur)}
                          dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 19, "var(--pin)") }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{y.ad}</span>
                    <span className="block font-sayi text-[11px] text-murekkep2">
                      {TUR_AD[y.tur] ?? y.tur} · {y.semt}
                      {y.pinSayisi ? ` · ${y.pinSayisi} pin` : ""}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-[15px] text-murekkep2">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-5 text-[13px] leading-relaxed text-murekkep2">
            Bu listede henüz mekan yok.
          </p>
        )}
      </div>
    </div>
  );
}
