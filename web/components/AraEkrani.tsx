"use client";

import { useEffect, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { mekanAra, kisiAra, populerler } from "@/lib/veri";
import type { Yer, Kisi } from "@/lib/model";
import { RENK } from "@/lib/paleti";
import { igneStil, egim, simgeSvg, kisiRengi } from "@/lib/gorsel";
import Avatar from "./Avatar";

interface Props {
  onYerAc: (yerId: string) => void;
  onKisiAc: (kullaniciAdi: string) => void;
}

/** Yazdıkça sorgu atmamak için gecikmeli değer. */
function useGecikmeli<T>(deger: T, ms: number): T {
  const [g, setG] = useState(deger);
  useEffect(() => {
    const z = setTimeout(() => setG(deger), ms);
    return () => clearTimeout(z);
  }, [deger, ms]);
  return g;
}

export default function AraEkrani({ onYerAc, onKisiAc }: Props) {
  const [q, setQ] = useState("");
  /* Her tuşta sorgu atmak 1052 satırlık tabloya gereksiz yük; 250 ms bekliyoruz */
  const sorgu = useGecikmeli(q.trim(), 250);
  const arıyor = sorgu.length >= 2;

  const { veri: pop } = useVeri(populerler, [], { kisiler: [] as Kisi[], yerler: [] as Yer[] });
  const { veri: bulunanKisiler, yukleniyor: ky } = useVeri<Kisi[]>(
    () => (arıyor ? kisiAra(sorgu) : Promise.resolve([])), [sorgu], []);
  const { veri: bulunanYerler, yukleniyor: yy } = useVeri<Yer[]>(
    () => (arıyor ? mekanAra(sorgu) : Promise.resolve([])), [sorgu], []);

  const kisiler = arıyor ? bulunanKisiler : pop.kisiler;
  const yerler = arıyor ? bulunanYerler : pop.yerler;
  const yukleniyor = arıyor && (ky || yy);

  const baslik = "px-4 pb-2.5 pt-3.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-murekkep2">
            <circle cx="11" cy="11" r="7" /><path d="M16.2 16.2 21 21" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Kişi veya mekan ara"
            autoComplete="off"
            aria-label="Kişi veya mekan ara"
            className="w-full border-none bg-transparent text-[14px] text-murekkep outline-none placeholder:text-murekkep2"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Temizle"
              className="shrink-0 border-none bg-transparent text-[15px] leading-none text-murekkep2">
              ✕
            </button>
          )}
        </div>
        {/* Aksansız yazan da bulsun: sorgu ve veritabanı aynı biçime iniyor */}
        <p className="mt-1.5 text-[11px] text-murekkep2">
          Türkçe karakter kullanmasan da olur — “ciya” yazınca Çiya çıkar.
        </p>
      </div>

      <div className="pano-doku min-h-0 flex-1 overflow-y-auto pb-5">
        <div className={baslik}>{arıyor ? "Kişiler" : "Popüler kişiler"}</div>
        {kisiler.length ? (
          <div className="grid grid-cols-3 gap-x-[11px] gap-y-3.5 px-4">
            {kisiler.map((k, i) => (
              <button
                key={k.id}
                onClick={() => onKisiAc(k.k)}
                style={{
                  ["--pin" as string]: kisiRengi(k.k),
                  ["--pin-isik" as string]: kisiRengi(k.k),
                  ["--pin-koyu" as string]: kisiRengi(k.k),
                  transform: `rotate(${egim(i)}deg)`,
                }}
                className="relative flex aspect-[0.92] flex-col items-center justify-center gap-[5px] rounded-sm border-none bg-[#FBF3D9] px-[5px] pb-[7px] pt-2.5 shadow-kagit"
              >
                <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                <Avatar kisi={k.id} boyut={36} />
                <span className="text-center text-[11.5px] font-semibold leading-tight">{k.ad}</span>
                <span className="text-center font-sayi text-[9px] text-murekkep2">
                  {k.takipci} takipçi
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-4 text-[13px] text-murekkep2">
            {yukleniyor ? "Aranıyor…" : "Eşleşen kişi yok."}
          </p>
        )}

        <div className={baslik}>{arıyor ? "Mekanlar" : "Popüler mekanlar"}</div>
        {yerler.length ? (
          <div className="grid grid-cols-3 gap-x-[11px] gap-y-3.5 px-4">
            {yerler.map((y, i) => (
              <button
                key={y.id}
                onClick={() => onYerAc(y.id)}
                style={{ ...igneStil(y.tur), transform: `rotate(${egim(i)}deg)` }}
                className="relative flex aspect-[0.92] flex-col items-center justify-center gap-[5px] rounded-sm border-none bg-[var(--kag)] px-[5px] pb-[7px] pt-2.5 shadow-kagit"
              >
                <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                <div dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 26, RENK[y.tur]?.ana) }} />
                <span className="line-clamp-2 break-words text-center text-[11.5px] font-semibold leading-tight">
                  {y.ad}
                </span>
                <span className="text-center font-sayi text-[9px] text-murekkep2">
                  {y.pinSayisi ? `${y.pinSayisi} pin` : y.semt}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-4 text-[13px] text-murekkep2">
            {yukleniyor ? "Aranıyor…" : "Eşleşen mekan yok."}
          </p>
        )}
      </div>
    </div>
  );
}
