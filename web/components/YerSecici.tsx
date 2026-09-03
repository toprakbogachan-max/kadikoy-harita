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

/** Seçim yapılınca haritanın uçtuğu yakınlık — sokak seviyesi. */
const SECIM_ZOOM = 17;

/** Yeni mekan adayı — haritaya dokunarak ya da coğrafi aramadan gelir. */
export interface YeniNokta {
  lat: number;
  lng: number;
  ad?: string;
  tur?: PlaceCategory;
  semt?: string;
}

/** Haritada gösterilecek nokta. sabit = kayıtlı mekan, taşınamaz. */
export interface Secim {
  lat: number;
  lng: number;
  sabit: boolean;
}

interface Props {
  /** iğnenin yeri; koordinat bilinmiyorsa null olabilir */
  secim: Secim | null;
  /** bir mekan seçilmiş mi — koordinatı okunamasa bile true */
  secildi: boolean;
  onYerSec: (y: Yer) => void;
  onYeniNokta: (n: YeniNokta) => void;
  onNoktaTasi: (k: { lat: number; lng: number }) => void;
}

/* Sürüklenebilir iğnede artı var (taşınabilir), kayıtlı mekanda yok. */
const igneSVG = (sabit: boolean) =>
  `<svg width="30" height="37" viewBox="0 0 28 34" style="display:block">
     <path d="M14 1C7.4 1 2 6.3 2 12.9 2 21.6 14 33 14 33s12-11.4 12-20.1C26 6.3 20.6 1 14 1z"
           fill="#B8801A" stroke="#fff" stroke-width="2"/>
     ${sabit
       ? '<circle cx="14" cy="13" r="3.6" fill="#fff"/>'
       : '<path d="M14 8v10M9 13h10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'}
   </svg>`;

/**
 * Pin formunun mekan adımı: arama + harita.
 *
 * Üç yol var:
 *   1) bizde kayıtlı mekanı seçmek,
 *   2) haritadan (OpenStreetMap) bulup yeni mekan olarak eklemek,
 *   3) haritada bir noktaya dokunup adını elle yazmak.
 *
 * Harita HER ZAMAN görünür kalıyor. Önceden seçim yapılınca yerini "Yeni
 * mekan" formu alıyordu — kullanıcı nereyi işaretlediğini göremiyordu.
 * Artık seçim haritada iğne olarak duruyor, harita oraya uçuyor, yeni
 * noktaysa iğne parmakla sürüklenip düzeltilebiliyor.
 */
export default function YerSecici({ secim, secildi, onYerSec, onYeniNokta, onNoktaTasi }: Props) {
  const [q, setQ] = useState("");
  const [gecikmeli, setGecikmeli] = useState("");
  const kapsayici = useRef<HTMLDivElement>(null);
  const harita = useRef<maplibregl.Map | null>(null);
  const igne = useRef<maplibregl.Marker | null>(null);

  /* Seçimden sonra arama kutusu temizleniyor: liste yer kaplamasın, seçilen
     yerle listedeki adaylar aynı anda durup kafa karıştırmasın.
     Temizlemeyi seçimin KOORDİNATINA bağlamak yanlıştı — göç 10
     uygulanmamışsa kayıtlı mekanın koordinatı gelmiyor, kutu da hiç
     temizlenmiyordu. Burada, seçimin yapıldığı yerde yapmak hem doğru hem
     türetilmiş state'e gerek bırakmıyor. */
  const temizle = () => { setQ(""); setGecikmeli(""); };

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

  /* Harita bir kez kuruluyor; aşağıdaki iki işleyici o yüzden güncel prop'u
     ref üzerinden okuyor, yoksa ilk render'ın değerlerinde donarlardı. */
  const sorgu = useRef("");
  useEffect(() => { sorgu.current = q.trim(); }, [q]);
  const geriCagri = useRef({ onYeniNokta, onNoktaTasi });
  useEffect(() => { geriCagri.current = { onYeniNokta, onNoktaTasi }; });
  const temizleRef = useRef(temizle);
  useEffect(() => { temizleRef.current = temizle; });

  /* Konum haritanın KENDİSİNDEN geldiyse (dokunuş ya da sürükleme) tekrar
     ortalamıyoruz — parmağın altındaki iğne kayardı. */
  const haritadanGeldi = useRef(false);

  useEffect(() => {
    if (harita.current || !kapsayici.current) return;
    const m = new maplibregl.Map({
      container: kapsayici.current,
      style: HARITA_STILI,
      center: [29.0295, 40.9885],
      zoom: 14.2,
      /* Atıf harita ÜSTÜNDE değil altında: 220px'lik karede açık atıf çubuğu
         geniş bir şeridi kaplıyor ve oraya yapılan dokunuşlar haritaya hiç
         ulaşmıyordu — kullanıcı "pin atılmıyor" sanırdı. Krediler haritanın
         hemen altında, görünür şekilde duruyor; lisans bunu karşılıyor. */
      attributionControl: false,
    });
    harita.current = m;

    m.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      haritadanGeldi.current = true;
      /* Aranıp bulunamayan metin yeni mekanın adı olarak gidiyor. */
      const ad = sorgu.current || undefined;
      temizleRef.current();
      geriCagri.current.onYeniNokta({ lat, lng, ad });
    });

    /* Kapsayıcı boyutu form açılırken oturuyor; MapLibre kendiliğinden görmüyor */
    const gozlemci = new ResizeObserver(() => m.resize());
    gozlemci.observe(kapsayici.current);
    return () => { gozlemci.disconnect(); m.remove(); harita.current = null; igne.current = null; };
  }, []);

  /* İğneyi seçimle eşitle. Sabitlik değişince iğne yeniden kuruluyor
     (görünümü ve sürüklenebilirliği farklı), yalnızca konum değiştiyse
     mevcut iğne taşınıyor. */
  const sonSabit = useRef<boolean | null>(null);
  useEffect(() => {
    const m = harita.current;
    if (!m) return;

    if (!secim) {
      igne.current?.remove();
      igne.current = null;
      sonSabit.current = null;
      return;
    }

    if (!igne.current || sonSabit.current !== secim.sabit) {
      igne.current?.remove();
      const el = document.createElement("div");
      el.innerHTML = igneSVG(secim.sabit);
      const mk = new maplibregl.Marker({
        element: el, anchor: "bottom", draggable: !secim.sabit,
      });
      mk.on("dragend", () => {
        const { lat, lng } = mk.getLngLat();
        haritadanGeldi.current = true;
        geriCagri.current.onNoktaTasi({ lat, lng });
      });
      igne.current = mk.setLngLat([secim.lng, secim.lat]).addTo(m);
      sonSabit.current = secim.sabit;
    } else {
      igne.current.setLngLat([secim.lng, secim.lat]);
    }

    if (haritadanGeldi.current) { haritadanGeldi.current = false; return; }
    m.easeTo({ center: [secim.lng, secim.lat], zoom: SECIM_ZOOM, duration: 550 });
  }, [secim]);

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
                  <button onClick={() => { temizle(); onYerSec(y); }} className={satir}>
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
                      onClick={() => { temizle(); onYeniNokta({ lat: h.lat, lng: h.lng, ad: h.ad, tur: h.tur, semt: h.semt ?? undefined }); }}
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

      <div ref={kapsayici} className="h-[220px] w-full overflow-hidden rounded-sm bg-su"
           style={{ position: "relative" }} />
      <p className="mt-1 text-[10px] leading-snug text-murekkep2">
        Mekanlar © OpenStreetMap katkıcıları · Karolar OpenFreeMap / © OpenMapTiles
      </p>
      <p className="mt-1.5 text-[11.5px] leading-snug text-murekkep2">
        {!secildi
          ? "Aradığın yer yoksa haritada bir noktaya dokun, yeni mekan ekle."
          : !secim
            /* Kayıtlı mekan seçildi ama koordinatı okunamadı — göç 10
               uygulanmamış demek. Sessiz kalmak yerine söylüyoruz. */
            ? "Seçilen mekanın konumu okunamadı, haritada işaretlenemiyor."
            : secim.sabit
              ? "Seçilen mekan haritada işaretli. Başka bir yere dokunarak yeni mekan ekleyebilirsin."
              : "İğneyi sürükleyerek yerini düzeltebilirsin."}
      </p>
    </div>
  );
}
