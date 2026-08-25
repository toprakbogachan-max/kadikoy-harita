"use client";

import { useMemo, useState } from "react";
import Harita from "@/components/Harita";
import HikayeSeridi from "@/components/HikayeSeridi";
import FiltreCipleri from "@/components/FiltreCipleri";
import AltMenu, { type Ekran } from "@/components/AltMenu";
import Akis from "@/components/Akis";
import GonderiDetay from "@/components/GonderiDetay";
import Profil from "@/components/Profil";
import MekanSayfasi from "@/components/MekanSayfasi";
import { KisilerSaglayici } from "@/lib/kisiler-baglam";
import { useVeri } from "@/lib/kanca";
import { yerleriGetir, kisininYerleri, ozetSayilar } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
import { jetonGradyanlari } from "@/lib/gorsel";

/* Haritanın açılış merkezi — Kadıköy iskelesi civarı */
const MERKEZ = { lat: 40.9885, lng: 29.0295 };

/* Yarıçap Kadıköy'ü kapsıyor; sınır ekrandaki marker sayısını makul tutmak için.
   Harita gezdikçe yeniden sorgulamak sonraki adım. */
const YARICAP_M = 2500;
const MARKER_SINIRI = 160;

/** Filtre çipi → places_nearby parametresi. "kaydettiklerim" auth bekliyor. */
const KATEGORILER: PlaceCategory[] = [
  "kahve", "yemek", "bar", "tatli", "kultur", "park", "otel", "magaza",
];

export default function Sayfa() {
  return (
    <KisilerSaglayici>
      <Uygulama />
    </KisilerSaglayici>
  );
}

function Uygulama() {
  const [ekran, setEkran] = useState<Ekran>("harita");
  const [bolge, setBolge] = useState("KADIKÖY");
  const [filtre, setFiltre] = useState("acik");
  const [kisiFiltre, setKisiFiltre] = useState<string | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const [gonderi, setGonderi] = useState<{ id: string; liste: string[] } | null>(null);

  /* Süzme artık veritabanında: kategori ve "şu an açık" places_nearby'ye
     parametre olarak gidiyor, 1052 mekanı tarayıcıya indirip elemekten iyi. */
  const sorgu = useMemo(() => ({
    lat: MERKEZ.lat,
    lng: MERKEZ.lng,
    yaricapM: YARICAP_M,
    limit: MARKER_SINIRI,
    kategori: KATEGORILER.includes(filtre as PlaceCategory) ? (filtre as PlaceCategory) : null,
    sadeceAcik: filtre === "acik",
  }), [filtre]);

  const { veri: gorunenler, yukleniyor, hata } = useVeri<Yer[]>(
    () => (kisiFiltre ? kisininYerleri(kisiFiltre, sorgu) : yerleriGetir(sorgu)),
    [sorgu, kisiFiltre],
    [],
  );

  const { veri: sayilar } = useVeri(
    () => ozetSayilar(MERKEZ.lat, MERKEZ.lng, YARICAP_M),
    [],
    { acikYer: 0, pinSayisi: 0 },
  );

  /* hikayeye dokununca kategori filtresi "hepsi"ye geçer, yoksa
     o kişinin pinlediği yerlerin hepsi görünmeyebilir */
  const kisiSec = (k: string) => {
    setKisiFiltre((onceki) => {
      const yeni = onceki === k ? null : k;
      if (yeni) setFiltre("hepsi");
      return yeni;
    });
  };

  const haritadaAc = (yerId: string) => {
    setSecili(yerId);
    setFiltre("hepsi");
    setEkran("harita");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#241E14] p-4">
      <svg width="0" height="0" className="absolute">
        <defs dangerouslySetInnerHTML={{ __html: jetonGradyanlari() }} />
      </svg>

      <div className="relative flex h-[min(96vh,820px)] w-full max-w-[392px] flex-col overflow-clip rounded-[26px] bg-kagit shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        {ekran === "harita" && (
          <>
            <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">{bolge}</h1>
                <span className="font-sayi text-[13px] text-murekkep2">
                  {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12.5px] text-murekkep2">
                <span className="size-[9px] shrink-0 rounded-full bg-jeton shadow-[0_0_0_3px_rgba(184,128,26,.16)]" />
                <span>
                  <b className="font-sayi text-[13px] font-bold text-jeton">{sayilar.acikYer}</b> yer şu an açık ·{" "}
                  {sayilar.pinSayisi} pin
                </span>
              </div>
            </header>

            <HikayeSeridi secili={kisiFiltre} onSec={kisiSec} />

            <div className="relative min-h-0 flex-1 overflow-hidden bg-su">
              <Harita gorunenler={gorunenler} secili={secili} onYerSec={setSecili} onBolgeDegisti={setBolge} />
              <Durum
                yukleniyor={yukleniyor}
                hata={hata}
                bos={gorunenler.length === 0}
                mesaj={
                  kisiFiltre
                    ? "Bu kişinin şu filtrede pinlediği yer yok."
                    : filtre === "kaydettiklerim"
                      ? "Kaydettiklerin giriş yapınca gelecek."
                      : filtre === "acik"
                        ? "Şu an açık hiçbir yer yok. “Hepsi”ne bakabilirsin."
                        : "Bu kategoride yer yok."
                }
              />
            </div>

            <FiltreCipleri secili={filtre} onSec={setFiltre} />
          </>
        )}

        {ekran === "akis" && (
          <>
            <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">AKIŞ</h1>
            </header>
            <Akis onGonderiAc={(id, liste) => setGonderi({ id, liste })} />
          </>
        )}

        {ekran === "profil" && (
          <>
            <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">PROFİL</h1>
            </header>
            <Profil onYerAc={haritadaAc} />
          </>
        )}

        {ekran === "ara" && (
          <>
            <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">ARA</h1>
            </header>
            <div className="pano-doku min-h-0 flex-1 p-4 text-[13px] leading-relaxed text-murekkep2">
              Arama ekranı henüz taşınmadı — prototipte çalışıyor.
            </div>
          </>
        )}

        {/* Mekan sayfası yalnızca haritadayken; akış/profil üstüne binmesin */}
        {secili && ekran === "harita" && !gonderi && (
          <MekanSayfasi
            yerId={secili}
            onKapat={() => setSecili(null)}
            onGonderiAc={(id, liste) => setGonderi({ id, liste })}
          />
        )}

        {gonderi && (
          <GonderiDetay
            pinId={gonderi.id}
            liste={gonderi.liste}
            onKapat={() => setGonderi(null)}
            onPinDegisti={(id) => setGonderi((g) => (g ? { ...g, id } : g))}
          />
        )}

        <AltMenu ekran={ekran} onGec={setEkran} onPinAt={() => alert("Pin formu henüz taşınmadı.")} />
      </div>
    </main>
  );
}

/** Harita üstündeki tek satırlık bilgi şeridi — yükleniyor / hata / boş sonuç. */
function Durum({
  yukleniyor, hata, bos, mesaj,
}: { yukleniyor: boolean; hata: string | null; bos: boolean; mesaj: string }) {
  if (!yukleniyor && !hata && !bos) return null;
  return (
    <div className="absolute inset-x-4 top-3.5 z-[2] rounded-sm border border-[var(--cizgi)] bg-yuzey p-3 text-center text-[13px] leading-snug shadow-kagit2">
      {hata
        ? `Mekanlar yüklenemedi: ${hata}`
        : yukleniyor
          ? "Mekanlar yükleniyor…"
          : mesaj}
    </div>
  );
}
