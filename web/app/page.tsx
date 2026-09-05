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
import KonumDugmesi from "@/components/KonumDugmesi";
import { useVeri } from "@/lib/kanca";
import { yerleriGetir, kisininYerleri, ozetSayilar, kaydettiklerim, okunmamisBildirim, takiptekilerinYerleri } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
import { jetonGradyanlari } from "@/lib/gorsel";
import { useKonum, kadikoydeMi } from "@/lib/konum";

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
/* Şemadaki place_category enum'unun TAMAMI. Eksik bırakılan bir kategori
   çip olarak görünüp filtrelemiyor — burada olmayan id `kategori: null`a
   düşüyor, yani "Diğer"e basınca her şey geliyordu. */
const KATEGORILER: PlaceCategory[] = [
  "kahve", "yemek", "bar", "tatli", "kultur", "park", "otel", "magaza", "diger",
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
  /* Varsayılan artık "acik" DEĞİL. Saat bilgisi olmayan mekan is_open_now'da
     null dönüyor ve "şu an açık" sorgusundan eleniyor — 412 mekanın 281'i
     böyle. Yani uygulamayı ilk açan biri mekanların üçte ikisini hiç görmüyor
     ve neden görmediğini anlayamıyordu. */
  const [filtre, setFiltre] = useState("hepsi");
  /* Hikâye şeridi haritaya dokunulunca kapanıyor: 92px yer açıyor, harita
     ekranın %54'ünden ~%70'ine çıkıyor. Şeride dokunmak geri açıyor. */
  const [seritAcik, setSeritAcik] = useState(true);
  /* Yalnızca id yetmiyordu: şerit sadece takip ettiklerini gösterdiği için
     yabancı bir profilden filtrelenince kimin haritasına baktığın belli
     olmuyor ve filtreyi kapatmanın yolu kalmıyordu. Ad da tutuluyor. */
  const [kisiFiltre, setKisiFiltre] = useState<{ id: string; etiket: string } | null>(null);
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

  /* Kullanıcının kendi konumu. Cihazdan çıkmıyor — sunucuya gönderilmiyor,
     kaydedilmiyor; yalnızca haritayı kaydırmak ve yakındaki mekanları
     sormak için kullanılıyor. */
  const { durum: konumDurumu, konum, baslat: konumBaslat, kapat: konumKapat } = useKonum();
  const [konumaGit, setKonumaGit] = useState(0);
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
      if (kisiFiltre) return kisininYerleri(kisiFiltre.id, sorgu);
      /* Takip filtresi yarıçapa bakmıyor: takip ettiklerinin pinlediği her
         yeri görmek istersin, ekranın neresine düştüğünü değil. */
      if (filtre === "takip") return takiptekilerinYerleri();
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
    [sorgu, kisiFiltre?.id, filtre, ben?.id, tazele],
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
  /* etiket hazır geliyor, ad değil: "Senin" + "’in pinleri" = "Senin’in
     pinleri" oluyordu. İyelik ekini çağıran biliyor. */
  const kisiSec = (k: string, etiket: string) => {
    setKisiFiltre((onceki) => {
      const yeni = onceki?.id === k ? null : { id: k, etiket };
      if (yeni) setFiltre("hepsi");
      return yeni;
    });
  };

  /* Profildeki kişisel haritaya dokununca: o kişinin pinleri ana haritada.
     Şeritten kişi seçmekle aynı durum, yalnızca giriş noktası farklı. */
  const kisininHaritasi = (k: string, etiket: string) => {
    setKisiFiltre({ id: k, etiket });
    setFiltre("hepsi");
    setSecili(null);
    setEkran("harita");
  };

  /* Bir KİŞİ üzerinden mekana gidiliyorsa (listesinden ya da pininden),
     mekan sayfası onun pinini önce göstersin. */
  const [oncelikliKisi, setOncelikliKisi] = useState<string | undefined>(undefined);
  const haritadaAc = (yerId: string, kisi?: string) => {
    setSecili(yerId);
    setOncelikliKisi(kisi);
    setFiltre("hepsi");
    setEkran("harita");
  };

  return (
    /* min-h-dvh, min-h-screen değil: iOS Safari'de 100vh adres çubuğunun
       altında kalıyor, sayfanın bir kısmı görünmüyordu. dvh çubuk açılıp
       kapandıkça güncelleniyor.
       Güvenli alan dolgusu çentikli ekranlar için — viewportFit: "cover"
       içeriği çentiğin altına kadar uzatıyor. */
    <main
      className="flex min-h-dvh items-center justify-center bg-[#241E14] p-4"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <svg width="0" height="0" className="absolute">
        <defs dangerouslySetInnerHTML={{ __html: jetonGradyanlari() }} />
      </svg>

      {/* Yükseklik dvh üzerinden: telefonda çerçeve ekranı doldursun, masaüstünde
          820px'de dursun. overflow-clip (hidden değil) — hidden kaydırma
          kapsayıcısı oluşturup çekmeceler açılınca çerçeveyi kaydırıyordu. */}
      <div className="relative flex h-[min(96dvh,820px)] w-full max-w-[392px] flex-col overflow-clip rounded-[26px] bg-kagit shadow-[0_30px_80px_rgba(0,0,0,.55)]">
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

            <HikayeSeridi
              secili={kisiFiltre?.id ?? null}
              onSec={kisiSec}
              acik={seritAcik}
              onAc={() => setSeritAcik(true)}
            />

            <div className="relative min-h-0 flex-1 overflow-hidden bg-su">
              <Harita
                gorunenler={gorunenler}
                secili={secili}
                onYerSec={setSecili}
                onBolgeDegisti={setBolge}
                onAlanDegisti={alaniGuncelle}
                onEtkilesim={() => setSeritAcik(false)}
                konum={konum}
                konumaGit={konumaGit}
              />
              {/* Sol üstte pin ekleme. Artı, konum iğnesinin İÇİNDE: sağ üstteki
                  yakınlaştırma +'sıyla karışmasın diye (prototipte de böyleydi). */}
              <button
                onClick={() => (ben ? setPinFormu({ acik: true, yer: null }) : setGirisAcik(true))}
                aria-label="Pin at"
                className="absolute left-2.5 top-2.5 z-[3] grid size-[38px] place-items-center rounded-sm border border-[var(--cizgi)] bg-jeton text-white shadow-kagit2"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.5s7-6.3 7-11.2a7 7 0 1 0-14 0c0 4.9 7 11.2 7 11.2z" strokeWidth="1.9" />
                  <path d="M12 7.1v6.2M8.9 10.2h6.2" strokeWidth="2.2" />
                </svg>
              </button>

              <KonumDugmesi
                durum={konumDurumu}
                konum={konum}
                kadikoyDisinda={!!konum && !kadikoydeMi(konum)}
                onIste={() => { konumBaslat(); setKonumaGit((n) => n + 1); }}
                onGit={() => setKonumaGit((n) => n + 1)}
                onKapat={konumKapat}
              />
              <Durum
                yukleniyor={yukleniyor}
                hata={hata}
                bos={gorunenler.length === 0}
                mesaj={
                  kisiFiltre
                    ? "Bu kişinin şu filtrede pinlediği yer yok."
                      : filtre === "takip"
                      ? ben ? "Takip ettiklerin henüz hiçbir yere pin atmamış." : "Takip ettiklerini görmek için giriş yap."
                      : filtre === "kaydettiklerim"
                      ? ben ? "Henüz bir yer kaydetmedin." : "Kaydettiklerini görmek için giriş yap."
                      : filtre === "acik"
                        ? "Şu an açık hiçbir yer yok. “Hepsi”ne bakabilirsin."
                        : "Bu kategoride yer yok."
                }
              />

              {/* Filtreler haritanın ÜZERİNDE yüzüyor, altında ayrı bir satır
                  değil: 64px'lik satır yerleşimden çıkınca harita %49'dan
                  ~%66'ya çıkıyor. Konum düğmesi de çakışmasın diye yukarı
                  kaydırıldı (KonumDugmesi içindeki bottom değeri). */}
              <div className="absolute inset-x-0 bottom-0 z-[4]">
                {/* Kişi filtresi açıkken kimin haritasına baktığın yazıyor ve
                    kapatılabiliyor: şerit yalnızca takip ettiklerini gösterdiği
                    için yabancı biri seçiliyken hiçbir işaret kalmıyordu. */}
                {kisiFiltre && (
                  <div className="flex justify-center pb-1.5">
                    <button
                      onClick={() => setKisiFiltre(null)}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--cizgi)] bg-yuzey px-3 py-1.5 font-tabela text-[10.5px] uppercase tracking-[0.1em] text-murekkep shadow-kagit"
                    >
                      {kisiFiltre.etiket}
                      <span aria-hidden className="text-[12px] leading-none text-murekkep2">✕</span>
                      <span className="sr-only">— filtreyi kaldır</span>
                    </button>
                  </div>
                )}
                <FiltreCipleri secili={filtre} onSec={setFiltre} />
              </div>
            </div>
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
              onHaritada={kisininHaritasi}
              onGirisIste={() => setGirisAcik(true)}
              onPaylas={() => setPaylasAcik(true)}
              onAyarlar={() => setAyarlarAcik(true)}
              onListeOlustur={() => setListeAcik(true)}
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
            oncelikliKisi={oncelikliKisi}
            onKapat={() => { setSecili(null); setOncelikliKisi(undefined); }}
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
            onKisiAc={(k) => { setGonderi(null); setProfilKisi(k); setEkran("profil"); }}
            /* Silinen pin artık yok: detayı kapat ve listeleri tazele,
               yoksa harita ve akış silinmiş pini göstermeye devam eder. */
            onPinSilindi={() => { setGonderi(null); setTazele((n) => n + 1); }}
          />
        )}

        <AltMenu
          ekran={ekran}
          /* Alt menüdeki PROFİL "benim profilim" demek. Akıştan ya da aramadan
             başkasının profiline gidildiyse profilKisi ayarlı kalıyordu ve
             sekmeye basmak o kişinin profilini açmaya devam ediyordu. */
          onGec={(e) => { if (e === "profil") setProfilKisi(undefined); setEkran(e); }}
          onPinAt={() => (ben ? setPinFormu({ acik: true, yer: null }) : setGirisAcik(true))}
          onListeOlustur={() => (ben ? setListeAcik(true) : setGirisAcik(true))}
        />
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
