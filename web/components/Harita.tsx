"use client";

import { useEffect, useRef, useState } from "react";
/* MapLibre v6'da varsayılan export yok — isim alanı olarak alınır */
import * as maplibregl from "maplibre-gl";
import type { LayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* MapLibre karoları bir Web Worker'da çözüyor ve worker'ı kendi içinde string
   bir URL'den kuruyor — Turbopack bunu statik göremediği için bundle'a almıyor
   ve worker isteği HTML 404 dönüyor (harita boş kalıyor).
   Çözüm: worker public/ altından servis ediliyor (scripts/maplibre-worker-kopyala.mjs). */
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
import type { Yer } from "@/lib/model";
import type { Konum } from "@/lib/konum";
import { jetonSVG, noktaSVG } from "@/lib/gorsel";

const HARITA_STILI =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

const POPULER_ESIK = 2;

/* Pini olmayan mekanlar bu yakınlığın altında HİÇ çizilmiyor.
   Sebebi: altlık harita onları zaten etiketliyor, jeton koymak aynı bilgiyi
   ikinci kez söylüyor ve haritayı okunmaz yapıyor. Yakınlaşınca sessiz
   nokta olarak beliriyorlar — dokunup mekan sayfasını açmak, oraya ilk
   pini atmak için. */
const PINSIZ_GORUNUR_ZOOM = 16;

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
  gorunenler: Yer[];
  secili: string | null;
  onYerSec: (id: string) => void;
  onBolgeDegisti: (ad: string) => void;
  /** Harita durunca yeni merkez + görünür yarıçap — sorgu buna göre tazelenir */
  onAlanDegisti: (a: { lat: number; lng: number; yaricapM: number }) => void;
  /** kullanıcının kendi konumu — null ise işaret çizilmiyor */
  konum?: Konum | null;
  /** konuma odaklanma isteği; sayı artınca harita oraya uçuyor */
  konumaGit?: number;
  /** kullanıcı haritayı sürüklemeye/yakınlaştırmaya başladı */
  onEtkilesim?: () => void;
}

export default function Harita({
  gorunenler, secili, onYerSec, onBolgeDegisti, onAlanDegisti, konum, konumaGit = 0,
  onEtkilesim,
}: Props) {
  const kapsayici = useRef<HTMLDivElement>(null);
  const harita = useRef<maplibregl.Map | null>(null);
  /* Eşik geçildi mi — state, çünkü marker efektinin yeniden koşması gerekiyor.
     Her zoom olayında değil, yalnızca eşik DEĞİŞTİĞİNDE yazılıyor. */
  const [yakin, setYakin] = useState(false);
  const markerlar = useRef<Record<string, maplibregl.Marker>>({});
  const yerAdKatmanlari = useRef<string[]>([]);
  const benimIsaret = useRef<maplibregl.Marker | null>(null);
  /* callback'ler her render'da değişebilir; marker'ları yeniden kurmamak için
     ref'te tutulur. Yazma render sırasında değil efektte: render aşaması saf
     kalmalı, yoksa React eşzamanlı modda render'ı atıp tekrarladığında ref
     tutarsız kalabiliyor. */
  const onSecRef = useRef(onYerSec);
  const onBolgeRef = useRef(onBolgeDegisti);
  const onAlanRef = useRef(onAlanDegisti);
  const onEtkilesimRef = useRef(onEtkilesim);
  useEffect(() => {
    onSecRef.current = onYerSec;
    onBolgeRef.current = onBolgeDegisti;
    onAlanRef.current = onAlanDegisti;
    onEtkilesimRef.current = onEtkilesim;
  });

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

    /* Eşik geçişini izliyoruz. setState olay işleyicisinde, efekt gövdesinde
       değil; ve yalnızca değer gerçekten değişince yazılıyor, yoksa her
       zoom karesinde render tetiklenirdi. */
    const zoomIzle = () => {
      const y = m.getZoom() >= PINSIZ_GORUNUR_ZOOM;
      setYakin((onceki) => (onceki === y ? onceki : y));
    };
    zoomIzle();
    m.on("zoom", zoomIzle);

    /* Kullanıcı haritayla uğraşmaya başladığında hikâye şeridi kapanıyor.
       "movestart" DEĞİL "dragstart"/"zoomstart": movestart programlı
       uçuşlarda da tetikleniyor (konuma git, mekana odaklan) ve şerit
       kullanıcı dokunmadan kapanırdı. */
    const etkilesim = () => onEtkilesimRef.current?.();
    m.on("dragstart", etkilesim);
    m.on("zoomstart", etkilesim);
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
    /* Görünen alanı bildir: mekanlar sabit merkez yerine haritanın baktığı
       yerden geliyor. Yarıçap köşegenin yarısı — ekranın dışında kalan
       marker'lar için boşuna satır çekmemek adına biraz cömert tutuluyor. */
    const alaniBildir = () => {
      const s = m.getBounds();
      const merkez = m.getCenter();
      const kose = new maplibregl.LngLat(s.getEast(), s.getNorth());
      onAlanRef.current({
        lat: merkez.lat,
        lng: merkez.lng,
        yaricapM: Math.round(merkez.distanceTo(kose)),
      });
    };

    m.on("moveend", basligiGuncelle);
    m.on("moveend", alaniBildir);
    m.on("load", alaniBildir);
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
      benimIsaret.current = null;
    };
  }, []);

  /* ---- kullanıcının kendi konumu ---- */
  useEffect(() => {
    const m = harita.current;
    if (!m) return;

    if (!konum) {
      benimIsaret.current?.remove();
      benimIsaret.current = null;
      return;
    }

    if (!benimIsaret.current) {
      const el = document.createElement("div");
      el.className = "benim-konum";
      el.setAttribute("aria-label", "Buradasın");
      /* Dış halka doğruluk payını değil "beni gör" vurgusunu taşıyor;
         gerçek doğruluk yarıçapı metre cinsinden, zoom'a göre değişir ve
         DOM marker'ıyla ölçeklenemez. Halkayı sabit tutup doğruluğu
         arayüzde yazıyla veriyoruz. */
      el.innerHTML =
        '<span class="benim-konum-hale"></span><span class="benim-konum-nokta"></span>';
      benimIsaret.current = new maplibregl.Marker({ element: el, anchor: "center" });
    }
    benimIsaret.current.setLngLat([konum.lng, konum.lat]).addTo(m);
  }, [konum]);

  /* konuma odaklan — sayı her arttığında */
  useEffect(() => {
    const m = harita.current;
    if (!m || !konum || !konumaGit) return;
    try {
      /* stop() şart: yarım kalmış bir animasyon haritayı "hareket ediyor"
         durumunda bırakıyor ve sonraki flyTo çağrılarını sessizce yutuyor.
         Animasyon requestAnimationFrame'e bağlı — sekme arka plandayken ya
         da düşük güç modunda kare üretilmeyince bitmiyor. */
      m.stop();
      m.flyTo({ center: [konum.lng, konum.lat], zoom: Math.max(m.getZoom(), 15.5), duration: 900 });
    } catch (e) {
      console.warn("konuma uçulamadı", e);
    }
  }, [konumaGit, konum]);

  /* ---- seçilen mekana odaklan ----
     Uzaktan bir jetona dokunulduğunda mekan sayfası açılıyor ama harita
     olduğu yerde kalıyordu; hangi yere baktığın görünmüyordu. Zaten
     yakındaysa yakınlaştırmayı bozmuyoruz. */
  useEffect(() => {
    const m = harita.current;
    if (!m || !secili) return;
    const y = gorunenler.find((g) => g.id === secili);
    if (!y) return;

    const merkez = m.getCenter();
    const uzak = merkez.distanceTo(new maplibregl.LngLat(y.lng, y.lat)) > 120;
    const genis = m.getZoom() < 15.6;
    if (!uzak && !genis) return;

    try {
      /* stop(): yarım kalmış animasyon haritayı "hareket ediyor" durumunda
         bırakıp sonraki çağrıları yutuyor */
      m.stop();
      m.flyTo({
        center: [y.lng, y.lat],
        zoom: Math.max(m.getZoom(), 16.2),
        /* Mekan sayfası altta yarım kademede açılıyor; pin onun altında
           kalmasın diye merkez yukarı kaydırılıyor. */
        offset: [0, -70],
        duration: 700,
      });
    } catch (e) {
      console.warn("mekana odaklanılamadı", e);
    }
    /* gorunenler kasıtlı olarak listede yok: filtre değişip liste yenilendiğinde
       aynı seçim için tekrar uçmak istemiyoruz. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secili]);

  /* ---- jeton pinleri çiz / güncelle ---- */
  useEffect(() => {
    const m = harita.current;
    if (!m) return;

    /* Mekanlar artık sorgudan geliyor: gelen küme her filtrede tamamen
       değişebiliyor. Eskiden 12 sabit mekan gizlenip gösteriliyordu; şimdi
       kümede olmayan marker haritadan SÖKÜLÜYOR, yoksa filtre değiştikçe
       DOM'da yüzlerce ölü marker birikir. */
    /* Pinsizler eşiğin altında hiç çizilmiyor — soru buydu: pini olmayan
       mekan haritada neden dursun? Yakından, ilk pini atılabilsin diye. */
    const cizilecek = gorunenler.filter((y) => (y.pinSayisi ?? 0) > 0 || yakin);

    const gelen = new Set(cizilecek.map((y) => y.id));
    for (const [id, mk] of Object.entries(markerlar.current)) {
      if (!gelen.has(id)) {
        mk.remove();
        delete markerlar.current[id];
      }
    }

    cizilecek.forEach((y) => {
      /* "açık mı" veritabanında hesaplanıyor (is_open_now, Europe/Istanbul).
         Üç durum olduğu gibi jetona geçiyor: null'u "kapalı"ya indirgemek
         bilmediğimiz şeyi biliyormuş gibi göstermek olurdu. */
      const acik = y.acik ?? null;
      const populer = (y.pinSayisi ?? 0) >= POPULER_ESIK;
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
      const pinli = (y.pinSayisi ?? 0) > 0;
      const el = mk.getElement();
      el.classList.toggle("nokta", !pinli && !seciliMi);
      const ic = el.querySelector(".jeton-ic");
      /* Pinsiz mekan jeton değil nokta: hiyerarşi buradan geliyor. Seçiliyken
         jetona dönüyor, yoksa dokunduğun şey görünmez kalırdı. */
      if (ic) ic.innerHTML = (pinli || seciliMi)
        ? jetonSVG(y, acik, populer, seciliMi)
        : noktaSVG(y, acik);
      el.setAttribute(
        "aria-label",
        `${y.ad}, ${y.tur}, ${y.acik === null ? "saat bilgisi yok" : acik ? "açık" : "kapalı"}, ${y.pinSayisi ?? 0} pin`,
      );
      el.classList.toggle("secili", seciliMi);
      el.style.zIndex = seciliMi ? "10" : populer ? "5" : pinli ? "3" : "1";
    });
  }, [gorunenler, secili, yakin]);

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
