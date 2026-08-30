"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useVeri } from "@/lib/kanca";
import { mekanAra } from "@/lib/veri";
import { haritadanAra, type HaritaSonucu } from "@/lib/haritadan";
import { aramaMetni } from "@/lib/metin";
import type { Yer } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
import { igneStil, simgeSvg } from "@/lib/gorsel";

const HARITA_STILI =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

/** Yeni mekan adayı — haritaya dokunarak ya da coğrafi aramadan gelir. */
export interface YeniNokta {
  lat: number;
  lng: number;
  ad?: string;
  tur?: PlaceCategory;
  semt?: string;
}

interface Props {
  onYerSec: (y: Yer) => void;
  onYeniNokta: (n: YeniNokta) => void;
}

/**
 * Pin formunun mekan adımı: arama + harita.
 *
 * Üç yol var:
 *   1) bizde kayıtlı mekanı seçmek,
 *   2) haritadan (OpenStreetMap) bulup yeni mekan olarak eklemek,
 *   3) haritada boş bir noktaya dokunup adını elle yazmak.
 *
 * İkinci yol olmadan şu oluyordu: altlık haritanın etiketleri OpenMapTiles'tan
 * geliyor, bizim 1064 mekanımızdan değil — kullanıcı haritada okuduğu adı
 * aratınca hiçbir şey bulamıyor, "buraya pin atılamıyor" sanıyordu.
 */
export default function YerSecici({ onYerSec, onYeniNokta }: Props) {
  const [q, setQ] = useState("");
  const [gecikmeli, setGecikmeli] = useState("");
  const kapsayici = useRef<HTMLDivElement>(null);
  const harita = useRef<maplibregl.Map | null>(null);
  const isaret = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const z = setTimeout(() => setGecikmeli(q.trim()), 250);
    return () => clearTimeout(z);
  }, [q]);

  const { veri: yereller, yukleniyor: yerelYukleniyor } = useVeri<Yer[]>(
    () => (gecikmeli.length >= 2 ? mekanAra(gecikmeli, 6) : Promise.resolve([])),
    [gecikmeli], []);

  /* Ayrı kanca: coğrafi servis çökerse kendi aramamız çalışmaya devam etsin. */
  const { veri: haritadakiler, yukleniyor: haritaYukleniyor, hata: haritaHatasi } =
    useVeri<HaritaSonucu[]>(
      () => (gecikmeli.length >= 3 ? haritadanAra(gecikmeli, 4) : Promise.resolve([])),
      [gecikmeli], []);

  /* Zaten bizde olan bir yeri "haritadan" başlığı altında ikinci kez
     göstermek, kullanıcıya aynı mekanın kopyasını yarattırırdı. */
  const yerelAdlar = new Set(yereller.map((y) => aramaMetni(y.ad)));
  const yeniler = haritadakiler.filter((h) => !yerelAdlar.has(aramaMetni(h.ad)));

  const arandi = gecikmeli.length >= 2;
  const bekleniyor = yerelYukleniyor || (gecikmeli.length >= 3 && haritaYukleniyor);
  const bosSonuc = arandi && !bekleniyor && yereller.length === 0 && yeniler.length === 0;

  /* Harita tıklama işleyicisi bir kez kuruluyor, o yüzden q'yu doğrudan
     okuyamaz — kapanışta ilk değeri donardı. Ref güncel kalıyor. */
  const sorgu = useRef("");
  useEffect(() => { sorgu.current = q.trim(); }, [q]);

  useEffect(() => {
    if (harita.current || !kapsayici.current) return;
    const m = new maplibregl.Map({
      container: kapsayici.current,
      style: HARITA_STILI,
      center: [29.0295, 40.9885],
      zoom: 14.2,
      attributionControl: { compact: true, customAttribution: "Mekanlar © OpenStreetMap katkıcıları" },
    });
    harita.current = m;

    m.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      if (!isaret.current) {
        const el = document.createElement("div");
        el.className = "yeni-nokta";
        el.innerHTML =
          '<svg width="28" height="34" viewBox="0 0 28 34"><path d="M14 1C7.4 1 2 6.3 2 12.9 2 21.6 14 33 14 33s12-11.4 12-20.1C26 6.3 20.6 1 14 1z" fill="#B8801A" stroke="#fff" stroke-width="2"/><path d="M14 8v10M9 13h10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
        isaret.current = new maplibregl.Marker({ element: el, anchor: "bottom" });
      }
      isaret.current.setLngLat([lng, lat]).addTo(m);
      /* Aranıp bulunamayan metin yeni mekanın adı olarak gidiyor. */
      onYeniNokta({ lat, lng, ad: sorgu.current || undefined });
    });

    /* Kapsayıcı boyutu form açılırken oturuyor; MapLibre kendiliğinden görmüyor */
    const gozlemci = new ResizeObserver(() => m.resize());
    gozlemci.observe(kapsayici.current);
    return () => { gozlemci.disconnect(); m.remove(); harita.current = null; };
    /* onYeniNokta her render'da değişebilir ama haritayı yeniden kurmak
       istemiyoruz; ilk değeri kapanışta yakalanıyor ve kimliği sabit. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const satir =
    "flex w-full items-center gap-2.5 border-none border-b border-[var(--cizgi)] bg-transparent px-2.5 py-2 text-left last:border-0";

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-murekkep2">
          <circle cx="11" cy="11" r="7" /><path d="M16.2 16.2 21 21" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Mekan ara ya da haritadan seç" autoComplete="off"
          aria-label="Mekan ara"
          className="w-full border-none bg-transparent text-[14px] outline-none placeholder:text-murekkep2" />
      </div>

      {(yereller.length > 0 || yeniler.length > 0) && (
        <div className="mb-2 max-h-[210px] overflow-y-auto rounded-sm border border-[var(--cizgi)] bg-yuzey">
          {yereller.length > 0 && (
            <ul className="list-none p-0">
              {yereller.map((y) => (
                <li key={y.id}>
                  <button onClick={() => onYerSec(y)} className={satir}>
                    <span style={igneStil(y.tur)} className="shrink-0"
                      dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 17, "var(--pin)") }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{y.ad}</span>
                      <span className="block font-sayi text-[10.5px] text-murekkep2">
                        {y.semt}{y.pinSayisi ? ` · ${y.pinSayisi} pin` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {yeniler.length > 0 && (
            <>
              {/* Başlık, bunların bizde OLMADIĞINI söylüyor: seçilince yeni
                  mekan olarak açılacak, kullanıcı ilk pini atmış olacak. */}
              <div className="border-y border-[var(--cizgi)] bg-[rgba(35,52,60,.04)] px-2.5 py-1.5 font-tabela text-[10px] uppercase tracking-[0.12em] text-murekkep2">
                Haritadan · henüz kayıtlı değil
              </div>
              <ul className="list-none p-0">
                {yeniler.map((h) => (
                  <li key={h.anahtar}>
                    <button
                      onClick={() => onYeniNokta({ lat: h.lat, lng: h.lng, ad: h.ad, tur: h.tur, semt: h.semt ?? undefined })}
                      className={satir}
                    >
                      <span style={igneStil(h.tur)} className="shrink-0 opacity-60"
                        dangerouslySetInnerHTML={{ __html: simgeSvg(h.tur, 17, "var(--pin)") }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">{h.ad}</span>
                        <span className="block truncate font-sayi text-[10.5px] text-murekkep2">
                          {[h.semt, h.adres].filter(Boolean).join(" · ") || "Kadıköy"}
                        </span>
                      </span>
                      <span className="shrink-0 font-tabela text-[10px] uppercase tracking-[0.1em] text-jeton">
                        Ekle
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {bosSonuc && (
        <p className="mb-2 rounded-sm border border-[rgba(184,128,26,.45)] bg-[rgba(184,128,26,.09)] p-2.5 text-[12.5px] leading-snug">
          <b>“{gecikmeli}”</b> ne bizde ne haritada bulunabildi. Aşağıdaki haritada
          yerine dokun — bu adla yeni mekan olarak eklenecek.
        </p>
      )}

      {/* Servis çökerse sessiz kalmak yanlış olurdu: kullanıcı "yer yok"
          sanıp aynı mekanın kopyasını açardı. */}
      {haritaHatasi && (
        <p className="mb-2 text-[11.5px] leading-snug text-murekkep2">
          Haritadan arama şu an çalışmıyor — kendi kayıtlarımız aranmaya devam ediyor.
        </p>
      )}

      <div ref={kapsayici} className="h-[190px] w-full overflow-hidden rounded-sm bg-su"
           style={{ position: "relative" }} />
      {!bosSonuc && (
        <p className="mt-1.5 text-[11.5px] leading-snug text-murekkep2">
          Aradığın yer yoksa haritada boş bir noktaya dokun, yeni mekan ekle.
        </p>
      )}
    </div>
  );
}
