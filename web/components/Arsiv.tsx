"use client";

import { useEffect, useState } from "react";
import { listeSil } from "@/lib/veri";
import type { Pin, Yer, Liste } from "@/lib/model";
import { igneStil, egim, fotoZemin, simgeSvg, zaman } from "@/lib/gorsel";
import Avatar from "./Avatar";
import ListeSayfasi from "./ListeSayfasi";

interface Props {
  tur: "kaydettiklerim" | "begendiklerim" | "listelerim";
  pinler: Pin[];
  yerler: Yer[];
  listeler: Liste[];
  onKapat: () => void;
  onYerAc: (yerId: string) => void;
  onGonderiAc: (pinId: string, liste: string[]) => void;
  onListeOlustur: () => void;
}

const BASLIK = {
  kaydettiklerim: "Kaydettiklerim",
  begendiklerim: "Beğendiklerim",
  listelerim: "Listelerim",
} as const;

/** Ayarlardan açılan arşiv ekranları — üçü de aynı çerçeveyi paylaşıyor. */
export default function Arsiv({
  tur, pinler, yerler, listeler, onKapat, onYerAc, onGonderiAc, onListeOlustur,
}: Props) {
  const [acikListe, setAcikListe] = useState<Liste | null>(null);
  const [silinen, setSilinen] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  const gorunenListeler = listeler.filter((l) => !silinen.has(l.id));
  const adet = tur === "kaydettiklerim" ? yerler.length
    : tur === "begendiklerim" ? pinler.length : gorunenListeler.length;

  if (acikListe) {
    return (
      <ListeSayfasi
        liste={acikListe}
        onKapat={() => setAcikListe(null)}
        onYerAc={onYerAc}
      />
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={BASLIK[tur]}
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div className="flex items-center gap-2.5">
          <button onClick={onKapat} aria-label="Geri"
            className="shrink-0 border-none bg-transparent p-0 text-[18px] leading-none text-murekkep2">
            ‹
          </button>
          <div>
            <h2 className="text-[20px] font-semibold leading-tight">{BASLIK[tur]}</h2>
            <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
              {adet} kayıt
            </div>
          </div>
        </div>
      </div>

      <div className="pano-doku min-h-0 flex-1 overflow-y-auto p-4">
        {hata && (
          <p className="mb-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}

        {/* ---- kaydedilen mekanlar ---- */}
        {tur === "kaydettiklerim" && (
          yerler.length ? (
            <div className="grid grid-cols-2 gap-3">
              {yerler.map((y, i) => (
                <button key={y.id} onClick={() => onYerAc(y.id)}
                  style={{ ...igneStil(y.tur), transform: `rotate(${egim(i)}deg)` }}
                  className="relative aspect-[0.86] rounded-sm border-none bg-[var(--kag)] p-[3px] shadow-kagit">
                  <Igne />
                  <div className="relative grid size-full place-items-center overflow-hidden rounded-sm"
                       style={{ background: fotoZemin(y.tur) }}>
                    {y.kapak ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={y.kapak} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="opacity-30" dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 34) }} />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(0,0,0,.62)] to-transparent px-2 pb-[7px] pt-4 text-left">
                      <span className="block truncate text-[11.5px] font-semibold leading-tight text-white">{y.ad}</span>
                      <span className="block font-sayi text-[9.5px] text-white/75">{y.semt}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : <Bos>Henüz bir yer kaydetmedin. Mekan sayfasındaki “Kaydet”e dokun.</Bos>
        )}

        {/* ---- beğenilen pinler ---- */}
        {tur === "begendiklerim" && (
          pinler.length ? (
            <ul className="m-0 list-none space-y-3 p-0">
              {pinler.map((p) => (
                <li key={p.id}>
                  <button onClick={() => onGonderiAc(p.id, pinler.map((x) => x.id))}
                    className="flex w-full gap-2.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-left">
                    <span className="grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-sm"
                          style={{ background: fotoZemin(p.yerTuru) }}
                          dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 22) }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <Avatar kisi={p.kisi} boyut={16} />
                        <span className="truncate text-[12.5px] font-semibold">{p.yerAdi}</span>
                        <span className="ml-auto shrink-0 font-sayi text-[12px] font-bold text-jeton">{p.puan}</span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-murekkep2">
                        {p.metin}
                      </span>
                      <span className="mt-1 block font-sayi text-[10.5px] text-murekkep2">{zaman(p.saat)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <Bos>Henüz bir pin beğenmedin.</Bos>
        )}

        {/* ---- listeler ---- */}
        {tur === "listelerim" && (
          <>
            <button onClick={onListeOlustur}
              className="mb-3 w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white">
              + Yeni liste
            </button>
            {gorunenListeler.length ? (
              <ul className="m-0 list-none space-y-3 p-0">
                {gorunenListeler.map((l, i) => (
                  <li key={l.id}
                      style={{ ["--pin" as string]: "#B8801A", ["--pin-isik" as string]: "#E0A33E",
                               ["--pin-koyu" as string]: "#8A5E0E", transform: `rotate(${egim(i)}deg)` }}
                      className="relative rounded-sm bg-[#EFE6CC] p-[3px] shadow-kagit">
                    <Igne />
                    {/* Kart gövdesi listeyi açıyor; silme düğmesi DIŞINDA
                        kalıyor, yoksa silmeye dokunmak listeyi de açardı. */}
                    <button onClick={() => setAcikListe(l)}
                            className="block w-full border-none bg-transparent p-0 text-left">
                      <div className="flex h-[54px] overflow-hidden rounded-sm">
                        {l.yerler.slice(0, 4).map((y) => (
                          <div key={y.id} className="flex-1" style={{ background: fotoZemin(y.tur) }} />
                        ))}
                      </div>
                    </button>
                    <div className="flex items-start gap-2 px-2 pb-2.5 pt-2">
                      <button onClick={() => setAcikListe(l)}
                              className="min-w-0 flex-1 border-none bg-transparent p-0 text-left">
                        <div className="text-[13.5px] font-semibold leading-tight">{l.baslik}</div>
                        {l.not && <div className="mt-0.5 text-[11.5px] text-murekkep2">{l.not}</div>}
                        <div className="mt-1 font-sayi text-[10.5px] text-murekkep2">{l.yerler.length} mekan</div>
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`“${l.baslik}” listesi silinsin mi?`)) return;
                          setSilinen((s) => new Set(s).add(l.id));
                          try { await listeSil(l.id); }
                          catch (e) {
                            setSilinen((s) => { const y = new Set(s); y.delete(l.id); return y; });
                            setHata(e instanceof Error ? e.message : String(e));
                          }
                        }}
                        aria-label="Listeyi sil"
                        className="shrink-0 border-none bg-transparent p-0 text-[13px] text-murekkep2">
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Bos>Henüz listen yok. Yağmurlu günler, tek başına oturmalar… kendi seçkini yap.</Bos>}
          </>
        )}
      </div>
    </div>
  );
}

const Igne = () => (
  <span className="absolute -top-[5px] left-1/2 z-[2] size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
);

const Bos = ({ children }: { children: React.ReactNode }) => (
  <p className="px-1 py-6 text-[13px] leading-relaxed text-murekkep2">{children}</p>
);
