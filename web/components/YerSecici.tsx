"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useVeri } from "@/lib/kanca";
import { mekanAra } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import { igneStil, simgeSvg } from "@/lib/gorsel";

const HARITA_STILI =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

interface Props {
  onYerSec: (y: Yer) => void;
  onYeniNokta: (k: { lat: number; lng: number }) => void;
}

/**
 * Pin formunun mekan adımı: arama + harita.
 *
 * İki yol var — var olan mekanı seçmek, ya da haritada boş bir noktaya
 * dokunup yeni mekan eklemek. İkincisi olmadan kullanıcı yalnızca daha önce
 * kaydedilmiş yerlere pin atabilirdi; henüz kimsenin bilmediği yeri
 * paylaşmak uygulamanın asıl fikri.
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

  const { veri: sonuclar } = useVeri<Yer[]>(
    () => (gecikmeli.length >= 2 ? mekanAra(gecikmeli, 8) : Promise.resolve([])),
    [gecikmeli], []);

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
      onYeniNokta({ lat, lng });
    });

    /* Kapsayıcı boyutu form açılırken oturuyor; MapLibre kendiliğinden görmüyor */
    const gozlemci = new ResizeObserver(() => m.resize());
    gozlemci.observe(kapsayici.current);
    return () => { gozlemci.disconnect(); m.remove(); harita.current = null; };
    /* onYeniNokta her render'da değişebilir ama haritayı yeniden kurmak
       istemiyoruz; ilk değeri kapanışta yakalanıyor ve kimliği sabit. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {sonuclar.length > 0 && (
        <ul className="mb-2 max-h-[168px] list-none overflow-y-auto rounded-sm border border-[var(--cizgi)] bg-yuzey p-0">
          {sonuclar.map((y) => (
            <li key={y.id}>
              <button onClick={() => onYerSec(y)}
                className="flex w-full items-center gap-2.5 border-none border-b border-[var(--cizgi)] bg-transparent px-2.5 py-2 text-left last:border-0">
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

      <div ref={kapsayici} className="h-[190px] w-full overflow-hidden rounded-sm bg-su"
           style={{ position: "relative" }} />
      <p className="mt-1.5 text-[11.5px] leading-snug text-murekkep2">
        Aradığın yer yoksa haritada boş bir noktaya dokun, yeni mekan ekle.
      </p>
    </div>
  );
}
