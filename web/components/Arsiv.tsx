"use client";

import { useEffect, useState } from "react";
import { listeSil } from "@/lib/veri";
import type { Pin, Yer, Liste } from "@/lib/model";
import { fotoZemin, simgeSvg, zaman, zeminSimgeRengi } from "@/lib/gorsel";
import Avatar from "./Avatar";
import ListeSayfasi from "./ListeSayfasi";
import ListeKapagi from "./ListeKapagi";
import KayanGecis from "./KayanGecis";

/* Arşiv sekmelerinin soldan sağa sırası — geçiş yönü bundan türüyor. */
const ARSIV_SIRASI = ["kaydettiklerim", "begendiklerim", "listelerim"] as const;

interface Props {
  tur: "kaydettiklerim" | "begendiklerim" | "listelerim";
  pinler: Pin[];
  yerler: Yer[];
  listeler: Liste[];
  onKapat: () => void;
  onYerAc: (yerId: string, oncelikliKisi?: string) => void;
  onGonderiAc: (pinId: string, liste: string[]) => void;
  onListeOlustur: () => void;
  onListeHaritada: (liste: Liste) => void;
}

const BASLIK = {
  kaydettiklerim: "Kaydettiklerim",
  begendiklerim: "Beğendiklerim",
  listelerim: "Listelerim",
} as const;

/** Ayarlardan açılan arşiv ekranları — üçü de aynı çerçeveyi paylaşıyor. */
export default function Arsiv({
  tur, pinler, yerler, listeler, onKapat, onYerAc, onGonderiAc, onListeOlustur, onListeHaritada,
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
        onHaritada={onListeHaritada}
        onListeAc={setAcikListe}
      />
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={BASLIK[tur]}
         className="yuksel absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-[15px]">
        <div className="flex items-center gap-2.5">
          <button onClick={onKapat} aria-label="Geri"
            className="shrink-0 border-none bg-transparent p-0 text-xl leading-none text-gri-600">
            ‹
          </button>
          <div>
            <h2 className="text-xl font-semibold leading-tight">{BASLIK[tur]}</h2>
            <div className="mt-1.5 text-2xs font-bold uppercase tracking-etiket text-gri-700">
              {adet} kayıt
            </div>
          </div>
        </div>
      </div>

      <KayanGecis anahtar={tur} sira={ARSIV_SIRASI} className="min-h-0 flex-1 overflow-y-auto p-4">
        {hata && (
          <p className="mb-3 rounded-md border border-[rgba(179,38,30,.3)] bg-[rgba(179,38,30,.07)] p-2.5 text-sm">
            {hata}
          </p>
        )}

        {/* ---- kaydedilen mekanlar ---- */}
        {tur === "kaydettiklerim" && (
          yerler.length ? (
            /* Post-it kalktı (kağıt + toplu iğne + eğiklik). Profildeki pin
               ızgarasıyla BİREBİR aynı dil: kare kapak, ad kapağın altında,
               kategori rengi yok. İki ekran aynı şeyi gösteriyor, farklı
               görünmeleri için sebep yok. */
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {yerler.map((y) => (
                <button key={y.id} onClick={() => onYerAc(y.id)}
                  className="block w-full border-none bg-transparent p-0 text-left">
                  <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-lg shadow-kat-1"
                       style={{ background: fotoZemin() }}>
                    {y.kapak ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={y.kapak} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="opacity-55" dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 44, zeminSimgeRengi()) }} />
                    )}
                  </div>
                  <div className="px-0.5 pt-2 text-center">
                    <div className="line-clamp-2 text-base font-extrabold leading-tight tracking-isim">{y.ad}</div>
                    <div className="mt-0.5 text-2xs lowercase text-gri-600">{y.semt}</div>
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
                    className="flex w-full gap-2.5 rounded-lg bg-yuzey shadow-kat-1 p-2.5 text-left">
                    <span className="grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-md"
                          style={{ background: fotoZemin(p.yerTuru) }}
                          dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 22, zeminSimgeRengi(p.yerTuru)) }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <Avatar kisi={p.kisi} boyut={16} />
                        <span className="truncate text-sm font-semibold">{p.yerAdi}</span>
                        <span className="ml-auto shrink-0 font-sayi text-sm font-bold text-gri-900">{p.puan}</span>
                      </span>
                      {p.metin.trim() && (
                        <span className="mt-1 line-clamp-2 block text-sm leading-snug text-gri-600">
                          {p.metin}
                        </span>
                      )}
                      <span className="mt-1 block font-sayi text-2xs text-gri-600">{zaman(p.saat)}</span>
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
              className="mb-3 w-full rounded-full border-none bg-gri-900 px-4 py-3 text-sm font-semibold lowercase tracking-ui text-white shadow-kat-2">
              + Yeni liste
            </button>
            {gorunenListeler.length ? (
              <ul className="m-0 list-none space-y-3 p-0">
                {gorunenListeler.map((l) => (
                  <li key={l.id} className="relative rounded-lg bg-yuzey p-0 shadow-kat-1">
                    {/* Kart gövdesi listeyi açıyor; silme düğmesi DIŞINDA
                        kalıyor, yoksa silmeye dokunmak listeyi de açardı. */}
                    <button onClick={() => setAcikListe(l)}
                            className="block w-full border-none bg-transparent p-0 text-left">
                      {/* Kapak profil ızgarasındakiyle aynı kaynaktan: liste
                          nerede görünürse görünsün aynı fotoğrafla tanınmalı.
                          Kapak yoksa ListeKapagi zaten mekanların renk
                          kolajına düşüyor — eski davranışın ta kendisi. */}
                      <div className="h-[54px] overflow-hidden rounded-md">
                        <ListeKapagi liste={l} genislik={320} />
                      </div>
                    </button>
                    <div className="flex items-start gap-2 px-2 pb-2.5 pt-2">
                      <button onClick={() => setAcikListe(l)}
                              className="min-w-0 flex-1 border-none bg-transparent p-0 text-left">
                        <div className="text-base font-semibold leading-tight">{l.baslik}</div>
                        {l.not && <div className="mt-0.5 text-xs text-gri-600">{l.not}</div>}
                        <div className="mt-1 font-sayi text-2xs text-gri-600">{l.yerler.length} mekan</div>
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
                        className="shrink-0 border-none bg-transparent p-0 text-sm text-gri-600">
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Bos>Henüz listen yok. Yağmurlu günler, tek başına oturmalar… kendi seçkini yap.</Bos>}
          </>
        )}
      </KayanGecis>
    </div>
  );
}

const Bos = ({ children }: { children: React.ReactNode }) => (
  <p className="px-1 py-6 text-sm leading-relaxed text-gri-600">{children}</p>
);
