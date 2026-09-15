"use client";

import { useMemo, useState } from "react";
import Harita from "@/components/Harita";
import HikayeSeridi from "@/components/HikayeSeridi";
import FiltreCipleri from "@/components/FiltreCipleri";
import AltMenu, { type Ekran } from "@/components/AltMenu";
import KayanGecis from "@/components/KayanGecis";
import Akis from "@/components/Akis";
import GonderiDetay from "@/components/GonderiDetay";
import Profil from "@/components/Profil";
import MekanSayfasi from "@/components/MekanSayfasi";
import AraEkrani from "@/components/AraEkrani";
import AramaCubugu from "@/components/AramaCubugu";
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
import type { Yer, Liste } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
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

/* Yatay geçiş YÖNÜ bu sıradan türüyor: soldan sağa gidiliyorsa içerik
   sağdan gelir, tersinde soldan. Bunlar alt menünün SEKMELERİ — yan yana
   duran yerler. */
const EKRAN_SIRASI = ["harita", "akis", "profil"] as const;

/* Arama bir sekme değil, üstteki çubuktan açılan bir KATMAN: yandan değil
   aşağıdan yükseliyor. Yatay "yanındaki yere geçtim", dikey "üstüne bir
   şey açtım" demek — ikisini karıştırmak nereye gittiğini bulanıklaştırır.
   Kapanırken de yandan kaymıyor, altındaki ekran olduğu yerde beliriyor. */
const DIKEY_EKRANLAR = ["ara"] as const;

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
  /* Liste odağı: haritada yalnızca o listenin mekanları. Sunucuya sorulmuyor,
     Liste.yerler artık koordinat da taşıyor. */
  const [listeFiltre, setListeFiltre] = useState<{ id: string; etiket: string; yerler: Yer[] } | null>(null);
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
      if (listeFiltre) return listeFiltre.yerler;
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
    [sorgu, listeFiltre?.id, kisiFiltre?.id, filtre, ben?.id, tazele],
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
      if (yeni) { setFiltre("hepsi"); setListeFiltre(null); }
      return yeni;
    });
  };

  /* Listeyi haritada göster — kişininki gibi, kaynağı liste. */
  const listeyiAc = (l: Liste) => {
    setListeFiltre({
      id: l.id,
      etiket: l.baslik,
      yerler: l.yerler.filter((y) => y.lat !== 0 && y.lng !== 0),
    });
    setKisiFiltre(null);
    setFiltre("hepsi");
    setSecili(null);
    setEkran("harita");
  };

  const odagiBirak = () => { setKisiFiltre(null); setListeFiltre(null); };

  /* Profildeki kişisel haritaya dokununca: o kişinin pinleri ana haritada.
     Şeritten kişi seçmekle aynı durum, yalnızca giriş noktası farklı. */
  const kisininHaritasi = (k: string, etiket: string) => {
    setKisiFiltre({ id: k, etiket });
    setListeFiltre(null);
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
      className="flex min-h-dvh items-center justify-center bg-[#111113] p-4"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Yükseklik dvh üzerinden: telefonda çerçeve ekranı doldursun, masaüstünde
          820px'de dursun. overflow-clip (hidden değil) — hidden kaydırma
          kapsayıcısı oluşturup çekmeceler açılınca çerçeveyi kaydırıyordu. */}
      <div className="iridesan relative flex h-[min(96dvh,820px)] w-full max-w-[392px] flex-col overflow-clip rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        {/* Sekme değişince içerik baloncuğun GİTTİĞİ YÖNE akıyor: alt
            menüdeki kayan seçim sağa giderken ekran da sağdan geliyor,
            iki ayrı olay değil tek bir hareket. Sarmalayıcı TEK: her
            ekranı ayrı sarmak onları her geçişte yeniden kurardı ve
            harita sıfırdan yüklenirdi. */}
        <KayanGecis anahtar={ekran} sira={EKRAN_SIRASI} dikeyler={DIKEY_EKRANLAR} mesafe={34} className="flex min-h-0 flex-1 flex-col">
        {ekran === "harita" && (
          /* Harita ekranı artık tek bir kutu: harita çerçevenin TAMAMINI
             kaplıyor, başlık ve şerit onun üstünde yüzüyor. */
          <div className="relative min-h-0 flex-1 overflow-hidden bg-su">
            <Harita
              gorunenler={gorunenler}
              secili={secili}
              onYerSec={setSecili}
              onBolgeDegisti={setBolge}
              onAlanDegisti={alaniGuncelle}
              onEtkilesim={() => setSeritAcik(false)}
              /* Kişi filtresi gibi takip/kaydettiklerim de haritanın
                 tamamına dağılıyor; hangi filtreye geçildiyse kadraj
                 yenilensin diye anahtar filtrenin kendisini taşıyor.
                 Kategori ve "şu an açık" dışarıda: onlar görünen alanın
                 sorgusu, haritayı oynatmaları istenmiyor. */
              sigdir={
                listeFiltre ? `liste:${listeFiltre.id}`
                : kisiFiltre ? `kisi:${kisiFiltre.id}`
                : filtre === "takip" || filtre === "kaydettiklerim" ? `filtre:${filtre}`
                : null
              }
              konum={konum}
              konumaGit={konumaGit}
            />
            {/* ---- Yüzen üst katman ----

                Başlık ve hikâye şeridi artık yerleşimde SATIR DEĞİL, haritanın
                üstünde yüzen baloncuklar. Kazanç doğrudan: ikisi 92+64px yer
                kaplıyordu, harita çerçevenin ~%66'sındayken şimdi tamamı.

                Hepsi tek bir akış içinde duruyor (absolute olan yalnızca bu
                kapsayıcı): böylece başlık, şerit ve durum kutusu birbirinin
                üstüne binmiyor, şerit kapanınca aşağıdakiler kendiliğinden
                yukarı kayıyor.

                pointer-events-none kapsayıcıda, auto tek tek çocuklarda:
                aradaki boşluklardan haritayı sürüklemek mümkün kalsın. */}
            {/* Mekan sayfası açıkken üst katman GİZLİ: o sayfanın kendi
                yüzen başlığı (geri · ad · pin at) çerçevenin tepesini
                devralıyor, ikisi üst üste binerdi. */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 z-[5] transition-opacity ${secili ? "opacity-0" : "opacity-100"}`}
              aria-hidden={!!secili}
            >
              {/* Perde ŞART, süs değil. Şeffaf bir başlık denizin ya da koyu
                  bir parkın üstüne gelince yazı okunmaz oluyor — Snapchat
                  Map'te de aynı sebeple karartma var. Burada tema açık
                  olduğu için karartma değil kağıt tonu: yukarıda neredeyse
                  opak, 150px'te tamamen siliniyor. */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[150px] bg-[linear-gradient(to_bottom,rgba(250,247,242,.92)_0%,rgba(250,247,242,.58)_42%,rgba(250,247,242,0)_100%)]"
              />

              {/* Arama en üstte ve KENARDAN KENARA: ekranı açan ilk şey
                  "burada ne var" sorusu.

                  Yanındaki pin atma düğmesi kalktı — aynı iş alt menüdeki
                  "+" içinde zaten var (pin at / liste oluştur). İki ayrı
                  giriş noktası tutmak hem üst satırı daraltıyordu hem de
                  "ekleme" eylemini ikiye bölüyordu. */}
              <div className="relative px-3 pt-3">
                <AramaCubugu onAc={() => setEkran("ara")} className="pointer-events-auto" />
              </div>

              <div className="relative flex items-start justify-between gap-2 px-3 pt-2">
                {/* Konum baloncuğu: bölge adı, saat ve tek satır özet.
                    Üç ayrı yüzen parça yerine tek kart — haritayı en az
                    örten hâli bu. */}
                <div className="pointer-events-auto inline-flex flex-col rounded-lg bg-yuzey px-3.5 py-2.5 shadow-kat-2">
                  {/* Kademe A: bölge adı özel isim — BÜYÜK, 800, sıkı aralık. */}
                  <div className="flex items-baseline gap-2.5">
                    <h1 className="text-xl font-extrabold uppercase leading-none tracking-siki">{bolge}</h1>
                    <span className="font-sayi text-xs leading-none text-gri-500">
                      {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {/* Kademe B: arayüz fısıldar — küçük harf. Altın nokta
                      kalktı; "açık" bilgisini dolu zemin değil DURUM RENGİ
                      taşıyor (skill §3: durum rengi yalnızca metinde). */}
                  <div className="mt-1 text-2xs lowercase text-gri-600">
                    <b className="font-sayi text-xs font-semibold text-acik">{sayilar.acikYer}</b> yer açık ·{" "}
                    <span className="font-sayi">{sayilar.pinSayisi}</span> pin
                  </div>
                </div>

              </div>

              <HikayeSeridi
                secili={kisiFiltre?.id ?? null}
                onSec={kisiSec}
                acik={seritAcik}
                onAc={() => setSeritAcik(true)}
              />

              {/* Şerit yalnızca SONUÇ VARKEN: sonuç yoksa aşağıdaki Durum
                  zaten ve daha doğrudan konuşuyor, iki kutu üst üste
                  gelirse ikisi de okunmuyor. */}
              {!yukleniyor && !hata && gorunenler.length > 0 && (
                <FiltreSeridi filtre={filtre} />
              )}

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
            </div>

            <KonumDugmesi
              durum={konumDurumu}
              konum={konum}
              kadikoyDisinda={!!konum && !kadikoydeMi(konum)}
              onIste={() => { konumBaslat(); setKonumaGit((n) => n + 1); }}
              onGit={() => setKonumaGit((n) => n + 1)}
              onKapat={konumKapat}
            />
            {/* Alt katman: çipler yüzen menünün (68px) hemen üstünde.
                Yerleşimden çıktıkları için harita altlarına kadar uzuyor.
                Konum düğmesi çakışmasın diye yukarıda (KonumDugmesi'ndeki
                bottom değeri), OSM atfı da öyle (globals.css). */}
            <div className="absolute inset-x-0 bottom-[68px] z-[4]">
              {/* Kişi filtresi açıkken kimin haritasına baktığın yazıyor ve
                  kapatılabiliyor: şerit yalnızca takip ettiklerini gösterdiği
                  için yabancı biri seçiliyken hiçbir işaret kalmıyordu. */}
              {(kisiFiltre || listeFiltre) && (
                <div className="flex justify-center pb-1.5">
                  <button
                    onClick={odagiBirak}
                    className="flex items-center gap-1.5 rounded-full border-none bg-gri-900 px-3.5 py-1.5 text-2xs font-semibold lowercase text-white shadow-kat-2"
                  >
                    {(listeFiltre ?? kisiFiltre)!.etiket}
                    <span aria-hidden className="text-sm leading-none opacity-70">✕</span>
                    <span className="sr-only">— filtreyi kaldır</span>
                  </button>
                </div>
              )}
              {/* Çipe dokunmak odağı bırakıyor: kişi/liste odağı sorguyu
                  tamamen devraldığı için, odak açıkken çipler görünürde
                  hiçbir şey yapmıyordu. */}
              <FiltreCipleri secili={filtre} onSec={(f) => { odagiBirak(); setFiltre(f); }} />
            </div>
          </div>
        )}

        {ekran === "akis" && (
          <>
            {/* Başlıklardan alt çizgi kalktı: ayrım artık çizgiyle değil
                boşlukla ve kartların kendi gölgesiyle kuruluyor. */}
            {/* "AKIŞ" başlığı kalktı: alt menüde hangi sekmede olduğun
                zaten belli ve ekranın kendisi bir akış olduğunu söylüyor.
                Yeri araması ve zile bırakıldı — böylece ilk kart ekranın
                çok daha yukarısından başlıyor. */}
            <header className="shrink-0 px-4 pb-2 pt-4">
              <div className="flex items-center gap-2">
              <AramaCubugu onAc={() => setEkran("ara")} />
              {ben && (
                <button
                  onClick={() => setBildirimAcik(true)}
                  aria-label={okunmamis ? `Bildirimler, ${okunmamis} okunmamış` : "Bildirimler"}
                  className="relative grid size-9 shrink-0 place-items-center rounded-md border-none bg-yuzey text-gri-800 shadow-kat-2"
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
                  </svg>
                  {okunmamis > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid min-w-[15px] place-items-center rounded-full bg-rozet-pembe px-1 font-sayi text-2xs font-bold leading-[15px] text-rozet-pembe-ink ring-2 ring-white">
                      {okunmamis > 9 ? "9+" : okunmamis}
                    </span>
                  )}
                </button>
              )}
              </div>
            </header>
            <Akis onGonderiAc={(id, liste) => setGonderi({ id, liste })} />
          </>
        )}

        {/* Profilde başlık BARI yok (skill §6): "PROFİL" yazan kenardan
            kenara şerit kalktı, geri/paylaş/ayarlar Profil'in kendi içinde
            içeriğin üstünde yüzüyor. Ekranın kim olduğunu zaten avatarla
            ad söylüyor; başlık onu ikinci kez söyleyip yer kaplıyordu. */}
        {ekran === "profil" && (
          <Profil
            kullaniciAdi={profilKisi}
            onYerAc={haritadaAc}
            onHaritada={kisininHaritasi}
            onListeHaritada={listeyiAc}
            onGirisIste={() => setGirisAcik(true)}
            onPaylas={() => setPaylasAcik(true)}
            onAyarlar={() => setAyarlarAcik(true)}
            onListeOlustur={() => setListeAcik(true)}
            {...(profilKisi !== undefined ? { onGeri: () => setProfilKisi(undefined) } : {})}
            tazele={tazele}
          />
        )}
        {/* Arama artık bir sekme değil (AltMenu'den çıktı), üstteki
            çubuktan açılan bir katman. O yüzden kapanma yolu ŞART:
            sekme olsaydı alt menüden başka bir sekmeye geçilirdi.
            Sarmalayıcının İÇİNDE: diğer ekranlarla aynı geçişi alsın. */}
        {ekran === "ara" && (
          <>
            <header className="flex shrink-0 items-center gap-2.5 px-4 pb-2 pt-4">
              <button
                onClick={() => setEkran("harita")}
                aria-label="Aramayı kapat"
                className="grid size-8 shrink-0 place-items-center rounded-md border-none bg-yuzey text-lg leading-none text-gri-800 shadow-kat-2"
              >
                ‹
              </button>
              <h1 className="text-2xl font-extrabold uppercase leading-none tracking-siki">ARA</h1>
            </header>
            <AraEkrani
              onYerAc={haritadaAc}
              onKisiAc={(k) => { setProfilKisi(k); setEkran("profil"); }}
            />
          </>
        )}
        </KayanGecis>

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
            /* Kapanışta tazele: ayarların içinde profil düzenleniyor ama
               Profil ekranı ayarların ALTINDA açık kalıyor, sökülmüyor.
               Sorgu anahtarı değişmediği için ad/bio/sosyal eskisi gibi
               duruyordu — kullanıcı kaydettiğini görmüyordu. */
            onKapat={() => { setAyarlarAcik(false); setTazele((n) => n + 1); }}
            onYerAc={(id) => { setAyarlarAcik(false); haritadaAc(id); }}
            onGonderiAc={(id, liste) => { setAyarlarAcik(false); setGonderi({ id, liste }); }}
            onListeHaritada={(l) => { setAyarlarAcik(false); listeyiAc(l); }}
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

/* Aktif filtrenin ne yaptığını söyleyen şerit.
   Referansın keşif sayfasında filtre çiplerinin altında böyle bir satır var
   ("🟢 new — be the first to try them!"): çipin adı ne olduğunu söylüyor,
   şerit NİYE önemli olduğunu.

   Bizde en çok gereken yer "şu an açık": saati bilinmeyen mekanlar bu
   sorgudan eleniyor (412 mekanın 281'i) ve kullanıcı haritanın neden
   boşaldığını anlayamıyordu. Çipin kendisi bunu söyleyemez, yeri yok.

   "hepsi" ve kategori çiplerinde şerit YOK: çipin adı zaten tam olarak ne
   olduğunu söylüyor, üstüne bir cümle eklemek gürültü. */
const FILTRE_ACIKLAMA: Record<string, { nokta: string; ad: string; not: string }> = {
  takip:          { nokta: "👥", ad: "takip ettiklerin", not: "pinledikleri her yer, ekranın neresi olursa olsun" },
  kaydettiklerim: { nokta: "🔖", ad: "kaydettiklerin",   not: "sonra bakmak için işaretlediklerin" },
  acik:           { nokta: "🟢", ad: "şu an açık",       not: "saati bilinmeyen mekanlar bu listede yok" },
};

function FiltreSeridi({ filtre }: { filtre: string }) {
  const a = FILTRE_ACIKLAMA[filtre];
  if (!a) return null;
  return (
    <div className="pointer-events-auto mx-3 mt-2 flex items-center gap-2 rounded-full bg-yuzey px-3.5 py-2 shadow-kat-2">
      <span aria-hidden className="shrink-0 text-sm leading-none">{a.nokta}</span>
      <span className="min-w-0 text-2xs leading-snug text-gri-600">
        <b className="font-semibold text-gri-900">{a.ad}</b>
        {" — "}
        {a.not}
      </span>
    </div>
  );
}

/** Harita üstündeki tek satırlık bilgi şeridi — yükleniyor / hata / boş sonuç. */
function Durum({
  yukleniyor, hata, bos, mesaj,
}: { yukleniyor: boolean; hata: string | null; bos: boolean; mesaj: string }) {
  if (!yukleniyor && !hata && !bos) return null;
  return (
    /* Yüzen üst katmanın AKIŞINDA duruyor (mutlak değil): başlığın ve
       hikâye şeridinin altına kendiliğinden diziliyor, üstlerine binmiyor. */
    <div className="pointer-events-auto mx-3 mt-2 rounded-lg bg-yuzey p-3 text-center text-sm leading-snug text-gri-800 shadow-kat-2">
      {hata
        ? `Mekanlar yüklenemedi: ${hata}`
        : yukleniyor
          ? "Mekanlar yükleniyor…"
          : mesaj}
    </div>
  );
}
