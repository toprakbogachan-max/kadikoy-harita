"use client";

import { useEffect, useRef } from "react";
/* MapLibre v6'da varsayılan export yok — isim alanı olarak alınır */
import * as maplibregl from "maplibre-gl";
import type { LayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* MapLibre karoları bir Web Worker'da çözüyor ve worker'ı kendi içinde string
   bir URL'den kuruyor — Turbopack bunu statik göremediği için bundle'a almıyor
   ve worker isteği HTML 404 dönüyor (harita boş kalıyor).
   Çözüm: worker public/ altından servis ediliyor (scripts/maplibre-worker-kopyala.mjs). */
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
import { YERLER, PINLER, type DemoYer } from "@/lib/demo";
import { acikMi, jetonSVG } from "@/lib/gorsel";

const HARITA_STILI =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

const POPULER_ESIK = 2;

/** Yakınlaşmaya göre uygun isim ölçeği: sokakta mahalle, uzakta şehir. */
function uygunSiniflar(z: number): string[] {
  if (z >= 13.5) return ["neighbourhood", "quarter", "suburb", "hamlet", "village"];
  if (z >= 11) return ["suburb", "town"];
  if (z >= 7.5) return ["city", "county"];
  return ["state", "country"];
}
const YER_ONCELIK = [
  "neighbourhood", "quarter", "suburb", "hamlet", "village",
  "town", "city", "county", "state", "country",
];

interface Props {
  gorunenler: DemoYer[];
  secili: string | null;
  onYerSec: (id: string) => void;
  onBolgeDegisti: (ad: string) => void;
}

export default function Harita({ gorunenler, secili, onYerSec, onBolgeDegisti }: Props) {
  const kapsayici = useRef<HTMLDivElement>(null);
  const harita = useRef<maplibregl.Map | null>(null);
  const markerlar = useRef<Record<string, maplibregl.Marker>>({});
  const yerAdKatmanlari = useRef<string[]>([]);
  /* callback'ler her render'da değişebilir; marker'ları yeniden kurmamak için ref'te tutulur */
  const onSecRef = useRef(onYerSec);
  const onBolgeRef = useRef(onBolgeDegisti);
  onSecRef.current = onYerSec;
  onBolgeRef.current = onBolgeDegisti;

  /* ---- haritayı bir kez kur ---- */
  useEffect(() => {
    if (harita.current || !kapsayici.current) return;

    const m = new maplibregl.Map({
      container: kapsayici.current,
      style: HARITA_STILI,
      center: [29.033, 40.985],
      zoom: 14.3,
      /* Stilin kendi atfı karoları kredilendirir. Mekan kayıtları da (isim,
         konum, çalışma saati) OpenStreetMap'ten geliyor ve ODbL atıf şart
         koşuyor — o yüzden ayrıca yazılıyor. */
      attributionControl: {
        compact: true,
        customAttribution: "Mekanlar © OpenStreetMap katkıcıları",
      },
    });
    harita.current = m;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __harita?: unknown }).__harita = m;  // hata ayıklama
    }
    m.on("error", (e) => console.error("MapLibre hatası:", e?.error?.message ?? e));
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    /* MapLibre compact atfı ilk çizimde AÇIK geliyor ve telefon genişliğinde
       haritanın altını iki satır kaplıyor. Katlayıp "ⓘ" düğmesine indiriyoruz;
       dokununca yine açılıyor. Atıf erişilebilir kalıyor — ODbL bunu istiyor,
       görünürlük şartını haritalarda yaygın olan bu düğme karşılıyor.
       MapLibre başlangıç durumu için API vermiyor, sınıfı elle kaldırmak gerek. */
    m.once("idle", () => {
      kapsayici.current
        ?.querySelector(".maplibregl-ctrl-attrib")
        ?.classList.remove("maplibregl-compact-show");
    });

    /* Snapchat Map tarzı: başlık haritanın baktığı yere göre değişir.
       Ad, kendi mekanlarımızdan değil haritanın kendi etiket verisinden okunur. */
    const basligiGuncelle = () => {
      if (!yerAdKatmanlari.current.length) return;
      let ozellikler: maplibregl.MapGeoJSONFeature[];
      try {
        ozellikler = m.queryRenderedFeatures({ layers: yerAdKatmanlari.current });
      } catch {
        return;
      }
      if (!ozellikler?.length) return;

      const merkez = m.getCenter();
      const tumu = ozellikler
        .map((f) => {
          const p = (f.properties ?? {}) as Record<string, string>;
          const ad = p["name:tr"] || p.name;
          if (!ad) return null;
          const sinif = p.class ?? "";
          const i = YER_ONCELIK.indexOf(sinif);
          const g = f.geometry;
          const koor = g?.type === "Point" ? (g.coordinates as [number, number]) : null;
          return {
            ad, sinif,
            oncelik: i === -1 ? 99 : i,
            uzaklik: koor ? Math.hypot(koor[0] - merkez.lng, koor[1] - merkez.lat) : Infinity,
          };
        })
        .filter(Boolean) as { ad: string; sinif: string; oncelik: number; uzaklik: number }[];
      if (!tumu.length) return;

      const uygun = uygunSiniflar(m.getZoom());
      const adaylar = tumu.filter((a) => uygun.includes(a.sinif));
      const liste = adaylar.length ? adaylar : tumu;
      liste.sort((a, b) => a.oncelik - b.oncelik || a.uzaklik - b.uzaklik);
      onBolgeRef.current(liste[0].ad.toLocaleUpperCase("tr"));
    };

    m.on("load", () => {
      m.resize();
      yerAdKatmanlari.current = ((m.getStyle().layers ?? []) as LayerSpecification[])
        .filter((l) => "source-layer" in l && l["source-layer"] === "place")
        .map((l) => l.id);
      basligiGuncelle();
    });
    m.on("moveend", basligiGuncelle);
    /* moveend anında etiket karoları henüz gelmemiş olabiliyor */
    m.on("idle", basligiGuncelle);

    const yenidenBoyutlandir = () => m.resize();
    window.addEventListener("resize", yenidenBoyutlandir);
    /* Kapsayıcı boyutu sonradan oturursa (flex yerleşimi, çekmece açılışı)
       MapLibre bunu kendiliğinden fark etmiyor, tuval boş kalıyor. */
    const gozlemci = new ResizeObserver(() => m.resize());
    gozlemci.observe(kapsayici.current);

    return () => {
      gozlemci.disconnect();
      window.removeEventListener("resize", yenidenBoyutlandir);
      m.remove();
      harita.current = null;
      markerlar.current = {};
    };
  }, []);

  /* ---- jeton pinleri çiz / güncelle ---- */
  useEffect(() => {
    const m = harita.current;
    if (!m) return;
    const t = new Date();
    const gorunurIdler = new Set(gorunenler.map((y) => y.id));

    YERLER.forEach((y) => {
      const acik = acikMi(y.saatler, t) === true;
      const populer = PINLER.filter((p) => p.yer === y.id).length >= POPULER_ESIK;
      const seciliMi = secili === y.id;

      let mk = markerlar.current[y.id];
      if (!mk) {
        const el = document.createElement("div");
        el.className = "jeton-marker";
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.innerHTML = '<div class="jeton-ic"></div>';
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSecRef.current(y.id);
        });
        el.addEventListener("mousedown", (e) => e.stopPropagation());
        mk = markerlar.current[y.id] = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([y.lng, y.lat])
          .addTo(m);
      }
      const el = mk.getElement();
      const ic = el.querySelector(".jeton-ic");
      if (ic) ic.innerHTML = jetonSVG(y, acik, populer, seciliMi);
      el.setAttribute(
        "aria-label",
        `${y.ad}, ${y.tur}, ${acik ? "açık" : "kapalı"}, ${PINLER.filter((p) => p.yer === y.id).length} pin`,
      );
      el.classList.toggle("secili", seciliMi);
      el.style.display = gorunurIdler.has(y.id) ? "" : "none";
      el.style.zIndex = seciliMi ? "10" : populer ? "5" : "1";
    });
  }, [gorunenler, secili]);

  /* Konumlandırma satır içi: maplibre-gl.css `.maplibregl-map{position:relative}`
     tanımı Tailwind'in `absolute` sınıfını eziyor, kapsayıcı yükseklik alamıyor. */
  return (
    <div
      ref={kapsayici}
      style={{ position: "absolute", inset: 0 }}
      aria-label="Kadıköy haritası"
    />
  );
}
