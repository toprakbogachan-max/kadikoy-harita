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
import AraEkrani from "@/components/AraEkrani";
import { KisilerSaglayici } from "@/lib/kisiler-baglam";
import { OturumSaglayici, useOturum } from "@/lib/oturum";
import Giris from "@/components/Giris";
import PinFormu from "@/components/PinFormu";
import Ayarlar from "@/components/Ayarlar";
import ListeOlustur from "@/components/ListeOlustur";
import PaylasimKarti from "@/components/PaylasimKarti";
import Bildirimler from "@/components/Bildirimler";
import { useVeri } from "@/lib/kanca";
import { yerleriGetir, kisininYerleri, ozetSayilar, kaydettiklerim, okunmamisBildirim } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
import { jetonGradyanlari } from "@/lib/gorsel";

/* Haritanın açılış merkezi — Kadıköy iskelesi civarı */
const MERKEZ = { lat: 40.9885, lng: 29.0295, yaricapM: 2500 };

/* Marker sayısı sınırı: 1052 mekanın hepsini DOM'a basmak haritayı ağırlaştırır.
   places_nearby pin sayısına ve mesafeye göre sıraladığı için sınıra takılınca
   en alakalılar kalıyor. */
const MARKER_SINIRI = 160;

/* Haritayı her oynatışta sorgu atmamak için: merkez bu kadar metreden az
   kaydıysa yeni sorgu yok. Zoom/pan sırasında moveend arka arkaya tetikleniyor. */
const YENIDEN_SORGU_ESIGI_M = 250;

/** Filtre çipi → places_nearby parametresi. "kaydettiklerim" auth bekliyor. */
const KATEGORILER: PlaceCategory[] = [
  "kahve", "yemek", "bar", "tatli", "kultur", "park", "otel", "magaza",
];

export default function Sayfa() {
  /* Sıra önemli: KisilerSaglayici "ben kimim"i oturumdan okuyor. */
  return (
    <OturumSaglayici>
      <KisilerSaglayici>
        <Uygulama />
      </KisilerSaglayici>
    </OturumSaglayici>
  );
}

function Uygulama() {
  const [ekran, setEkran] = useState<Ekran>("harita");
  const [bolge, setBolge] = useState("KADIKÖY");
  const [filtre, setFiltre] = useState("acik");
  const [kisiFiltre, setKisiFiltre] = useState<string | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const [gonderi, setGonderi] = useState<{ id: string; liste: string[] } | null>(null);
  const [alan, setAlan] = useState(MERKEZ);
  /* Profil artık başkasının da olabilir — aramadan bir kişiye gidilebiliyor.
     undefined = oturumdaki kişi. */
  const [profilKisi, setProfilKisi] = useState<string | undefined>(undefined);
  const [girisAcik, setGirisAcik] = useState(false);
  const [pinFormu, setPinFormu] = useState<{ acik: boolean; yer: Yer | null }>({ acik: false, yer: null });
  /* pin atıldıktan sonra listeleri tazelemek için */
  const [tazele, setTazele] = useState(0);
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [listeAcik, setListeAcik] = useState(false);
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const { ben } = useOturum();

  /* Süzme artık veritabanında: kategori ve "şu an açık" places_nearby'ye
     parametre olarak gidiyor, 1052 mekanı tarayıcıya indirip elemekten iyi. */
  const sorgu = useMemo(() => ({
    lat: alan.lat,
    lng: alan.lng,
    yaricapM: alan.yaricapM,
    limit: MARKER_SINIRI,
    kategori: KATEGORILER.includes(filtre as PlaceCategory) ? (filtre as PlaceCategory) : null,
    sadeceAcik: filtre === "acik",
  }), [filtre, alan]);

  const { veri: gorunenler, yukleniyor, hata } = useVeri<Yer[]>(
    async () => {
      if (kisiFiltre) return kisininYerleri(kisiFiltre, sorgu);
      if (filtre === "kaydettiklerim") {
        const idler = new Set(await kaydettiklerim());
        if (!idler.size) return [];
        /* saves yalnızca place_id tutuyor; koordinat places_nearby'den gelmek
           zorunda (geo sütunu PostgREST'ten okunamıyor), geniş çekip süzüyoruz */
        const hepsi = await yerleriGetir({ ...sorgu, yaricapM: 4000, limit: 1500, kategori: null, sadeceAcik: false });
        return hepsi.filter((y) => idler.has(y.id));
      }
      return yerleriGetir(sorgu);
    },
    [sorgu, kisiFiltre, filtre, ben?.id, tazele],
    [],
  );

  /* Okunmamış bildirim rozeti — akış başlığındaki zil */
  const { veri: okunmamis } = useVeri<number>(
    okunmamisBildirim, [ben?.id, bildirimAcik, tazele], 0);

  const { veri: sayilar } = useVeri(
    () => ozetSayilar(alan.lat, alan.lng, alan.yaricapM),
    [alan],
    { acikYer: 0, pinSayisi: 0 },
  );

  /* Küçük oynamalarda sorgu tazelemiyoruz — moveend zoom sırasında arka arkaya
     tetikleniyor, her biri yeni sorgu olsa harita takılır. */
  const alaniGuncelle = (a: { lat: number; lng: number; yaricapM: number }) => {
    setAlan((onceki) => {
      const dLat = (a.lat - onceki.lat) * 111_320;
      const dLng = (a.lng - onceki.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
      const kaydi = Math.hypot(dLat, dLng) > YENIDEN_SORGU_ESIGI_M;
      const yaricapDegisti = Math.abs(a.yaricapM - onceki.yaricapM) / onceki.yaricapM > 0.25;
      return kaydi || yaricapDegisti ? a : onceki;
    });
  };

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
              <Harita
                gorunenler={gorunenler}
                secili={secili}
                onYerSec={setSecili}
                onBolgeDegisti={setBolge}
                onAlanDegisti={alaniGuncelle}
              />
              <Durum
                yukleniyor={yukleniyor}
                hata={hata}
                bos={gorunenler.length === 0}
                mesaj={
                  kisiFiltre
                    ? "Bu kişinin şu filtrede pinlediği yer yok."
                    : filtre === "kaydettiklerim"
                      ? ben ? "Henüz bir yer kaydetmedin." : "Kaydettiklerini görmek için giriş yap."
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
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">AKIŞ</h1>
              {ben && (
                <button
                  onClick={() => setBildirimAcik(true)}
                  aria-label={okunmamis ? `Bildirimler, ${okunmamis} okunmamış` : "Bildirimler"}
                  className="relative shrink-0 border-none bg-transparent p-1 text-murekkep2"
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
                  </svg>
                  {okunmamis > 0 && (
                    <span className="absolute right-0 top-0 grid min-w-[15px] place-items-center rounded-full bg-jeton px-1 font-sayi text-[9.5px] leading-[15px] text-white">
                      {okunmamis > 9 ? "9+" : okunmamis}
                    </span>
                  )}
                </button>
              )}
            </header>
            <Akis onGonderiAc={(id, liste) => setGonderi({ id, liste })} />
          </>
        )}

        {ekran === "profil" && (
          <>
            <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <div className="flex items-center gap-2.5">
                {profilKisi !== undefined && (
                  <button
                    onClick={() => setProfilKisi(undefined)}
                    aria-label="Kendi profiline dön"
                    className="shrink-0 border-none bg-transparent p-0 text-[18px] leading-none text-murekkep2"
                  >
                    ‹
                  </button>
                )}
                <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">
                  {profilKisi === undefined ? "PROFİL" : "@" + profilKisi}
                </h1>
              </div>
            </header>
            <Profil
              kullaniciAdi={profilKisi}
              onYerAc={haritadaAc}
              onGirisIste={() => setGirisAcik(true)}
              onPaylas={() => setPaylasAcik(true)}
              onAyarlar={() => setAyarlarAcik(true)}
            />
          </>
        )}

        {ekran === "ara" && (
          <>
            <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
              <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">ARA</h1>
            </header>
            <AraEkrani
              onYerAc={haritadaAc}
              onKisiAc={(k) => { setProfilKisi(k); setEkran("profil"); }}
            />
          </>
        )}

        {/* Mekan sayfası yalnızca haritadayken; akış/profil üstüne binmesin */}
        {secili && ekran === "harita" && !gonderi && (
          <MekanSayfasi
            yerId={secili}
            onKapat={() => setSecili(null)}
            onGonderiAc={(id, liste) => setGonderi({ id, liste })}
            onGirisIste={() => setGirisAcik(true)}
            onPinAt={(y) => setPinFormu({ acik: true, yer: y })}
          />
        )}

        {girisAcik && <Giris onKapat={() => setGirisAcik(false)} />}

        {ayarlarAcik && (
          <Ayarlar
            onKapat={() => setAyarlarAcik(false)}
            onYerAc={(id) => { setAyarlarAcik(false); haritadaAc(id); }}
            onGonderiAc={(id, liste) => { setAyarlarAcik(false); setGonderi({ id, liste }); }}
            onListeOlustur={() => setListeAcik(true)}
          />
        )}

        {listeAcik && (
          <ListeOlustur
            onKapat={() => setListeAcik(false)}
            onOlusturuldu={() => { setListeAcik(false); setTazele((n) => n + 1); }}
          />
        )}

        {paylasAcik && <PaylasimKarti onKapat={() => setPaylasAcik(false)} />}

        {bildirimAcik && (
          <Bildirimler
            onKapat={() => setBildirimAcik(false)}
            onGonderiAc={(id) => { setBildirimAcik(false); setGonderi({ id, liste: [id] }); }}
            onKisiAc={(k) => { setBildirimAcik(false); setProfilKisi(k); setEkran("profil"); }}
          />
        )}

        {pinFormu.acik && (
          <PinFormu
            hazirYer={pinFormu.yer}
            onKapat={() => setPinFormu({ acik: false, yer: null })}
            onAtildi={(_pinId, yerId) => {
              setPinFormu({ acik: false, yer: null });
              setTazele((n) => n + 1);
              setEkran("harita");
              setFiltre("hepsi");
              setSecili(yerId);
            }}
          />
        )}

        {gonderi && (
          <GonderiDetay
            pinId={gonderi.id}
            liste={gonderi.liste}
            onKapat={() => setGonderi(null)}
            onPinDegisti={(id) => setGonderi((g) => (g ? { ...g, id } : g))}
            onGirisIste={() => setGirisAcik(true)}
          />
        )}

        <AltMenu ekran={ekran} onGec={setEkran} onPinAt={() => (ben ? setPinFormu({ acik: true, yer: null }) : setGirisAcik(true))} />
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
