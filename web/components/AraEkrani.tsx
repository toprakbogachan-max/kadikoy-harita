"use client";

import { useEffect, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { mekanAra, kisiAra, populerler, kucukUrl } from "@/lib/veri";
import type { Yer, Kisi } from "@/lib/model";
import { fotoZemin, simgeSvg, zeminSimgeRengi } from "@/lib/gorsel";
import { emoji } from "@/lib/paleti";
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

  /* Kademe C: BÜYÜK ama küçük punto, ferah aralık. */
  const baslik = "px-4 pb-2 pt-4 text-2xs font-bold uppercase tracking-etiket text-gri-700";
  const bosluk = "px-4 text-sm lowercase text-gri-600";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-kagit">
      <div className="shrink-0 px-4 pb-2 pt-1">
        {/* Arama alanı artık çerçeveli kutu değil, hap: uygulamanın geri
            kalanındaki çip ve baloncuk diliyle aynı. Kenarlık yerine gölge. */}
        <div className="flex items-center gap-2 rounded-full bg-yuzey px-3.5 py-2.5 shadow-kat-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-gri-500">
            <circle cx="11" cy="11" r="7" /><path d="M16.2 16.2 21 21" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            /* Ekran artık üstteki arama çubuğundan açılıyor: kullanıcı
               "ara" düğmesine basmış oluyor, niyeti belli. Odağı elle
               vermesini beklemek fazladan bir dokunuş olurdu. */
            autoFocus
            placeholder="mekan, kişi ya da pin ara"
            autoComplete="off"
            aria-label="Mekan, kişi ya da pin ara"
            className="w-full border-none bg-transparent text-sm text-murekkep outline-none placeholder:text-gri-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Temizle"
              className="shrink-0 border-none bg-transparent text-base leading-none text-gri-500">
              ✕
            </button>
          )}
        </div>
        {/* Aksansız yazan da bulsun: sorgu ve veritabanı aynı biçime iniyor.
            Uygulamanın kendi açıklaması → italik (bkz. Akis.tsx'teki ayrım). */}
        <p className="mt-1.5 px-1 text-2xs italic text-gri-500">
          Türkçe karakter kullanmasan da olur — “ciya” yazınca Çiya çıkar.
        </p>
      </div>

      {/* pb: yüzen alt menünün altında kalan sonuç olmasın */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-[92px]">
        <div className={baslik}>{arıyor ? "Kişiler" : "Popüler kişiler"}</div>
        {kisiler.length ? (
          /* Kişiler yatay şeritte: mantar panoya iğnelenmiş üç sütunluk
             ızgara yerine, hikâye şeridiyle aynı okuma yönü. Dikeyde yer
             açtığı için mekanlar ekranın ilk bakışına giriyor. */
          <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [&::-webkit-scrollbar]:hidden">
            {kisiler.map((k) => (
              <button
                key={k.id}
                onClick={() => onKisiAc(k.k)}
                className="flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-lg border-none bg-yuzey px-2 py-3 shadow-kat-1"
              >
                <Avatar kisi={k.id} boyut={40} />
                <span className="w-full truncate text-center text-xs font-bold uppercase tracking-siki">{k.ad}</span>
                <span className="text-center font-sayi text-2xs text-gri-500">
                  {k.takipci} takipçi
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className={bosluk}>{yukleniyor ? "aranıyor…" : "eşleşen kişi yok."}</p>
        )}

        <div className={baslik}>{arıyor ? "Mekanlar" : "Popüler mekanlar"}</div>
        {yerler.length ? (
          /* Mekanlar tek sütun: ad post-it'in içine iki satıra sığmıyordu ve
             "Kadıköy Belediyesi Sanat Galerisi" gibi isimler kırpılıyordu. */
          <div className="flex flex-col gap-2 px-4">
            {yerler.map((y) => (
              <button
                key={y.id}
                onClick={() => onYerAc(y.id)}
                className="flex w-full items-center gap-3 rounded-lg border-none bg-yuzey p-2.5 text-left shadow-kat-1"
              >
                <div
                  className="grid size-[46px] shrink-0 place-items-center overflow-hidden rounded-md"
                  style={{ background: fotoZemin(y.tur) }}
                >
                  {y.kapak ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={kucukUrl(y.kapak, 96)!} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                  ) : (
                    <span className="opacity-60" dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 24, zeminSimgeRengi(y.tur)) }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold uppercase leading-tight tracking-siki">
                    <span aria-hidden className="mr-1.5 font-normal tracking-normal">{emoji(y.tur)}</span>
                    {y.ad}
                  </div>
                  <div className="mt-0.5 truncate text-xs lowercase text-gri-600">{y.semt}</div>
                </div>
                {!!y.pinSayisi && (
                  <span className="shrink-0 font-sayi text-2xs text-gri-500">{y.pinSayisi} pin</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className={bosluk}>{yukleniyor ? "aranıyor…" : "eşleşen mekan yok."}</p>
        )}
      </div>
    </div>
  );
}
