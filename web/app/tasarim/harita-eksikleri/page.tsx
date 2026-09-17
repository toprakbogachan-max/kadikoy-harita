"use client";

/**
 * /tasarim/harita-eksikleri — harita katmanında karşılığı olmayan dört
 * bileşen.
 *
 * `/tasarim` tokenları, `/tasarim/primitifler` altı primitifi,
 * `/tasarim/mekan-eksikleri` mekan detayının üçünü denetliyor; burası
 * haritanın dördünü:
 *   B4 YerImiPini     (saf SVG + token)
 *   B5 ArkadasMarkeri (Avatar primitifi üstüne)
 *   B6 SemtCipi       (Cip primitifi üstüne)
 *   B7 BuradaAra      (Pill primitifi üstüne, `yukleniyor` yuvası)
 *
 * Kurallar önceki vitrinlerle aynı:
 *   1) Ürün değil ALET. Buradaki hiçbir düzen gerçek bir ekran değil.
 *   2) ÖRNEK VERİ BURADA DURUR. Bileşenler kendi içeriğini uydurmuyor.
 *   3) Sayfa denetlediği dile uyuyor: iridesan zemin, beyaz kart, ayraç
 *      çizgisi yok, iki kademeli tipografi.
 *
 * ⚠ MONTAJ YOK. Dördü de MapLibre'ye BAĞLI DEĞİL; `Harita.tsx`
 * marker'ları ham DOM ile kuruyor ve ona dokunmak Faz 3'ün işi. Burada
 * hepsi normal React olarak, sahte bir altlık haritanın üstünde duruyor.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import YerImiPini from "@/components/corner/YerImiPini";
import ArkadasMarkeri from "@/components/corner/ArkadasMarkeri";
import SemtCipi from "@/components/corner/SemtCipi";
import BuradaAra from "@/components/corner/BuradaAra";
import { IkiliPill } from "@/components/corner/primitives/Pill";

/* ---------- vitrin iskeleti (mekan vitriniyle aynı kalıp) ---------- */

function Baslik({ no, ad, kod, not }: { no: string; ad: string; kod: string; not: string }) {
  return (
    <header className="mb-4 mt-12 first:mt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-sayi text-2xs text-gri-500">{no}</span>
        <h2 className="text-xs font-bold uppercase tracking-etiket text-gri-900">{ad}</h2>
        <span className="font-sayi text-2xs text-gri-400">{kod}</span>
      </div>
      <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-700">{not}</p>
    </header>
  );
}

function Etiket({ children }: { children: ReactNode }) {
  return <div className="mb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-500">{children}</div>;
}

function Kutu({ baslik, children, className = "" }: { baslik: string; children: ReactNode; className?: string }) {
  return (
    <section className="mb-3">
      <Etiket>{baslik}</Etiket>
      <div className={`rounded-lg bg-kagit p-4 ${className}`} style={{ border: "1px solid var(--cizgi)" }}>
        {children}
      </div>
    </section>
  );
}

function Alt({ children }: { children: ReactNode }) {
  return <div className="mt-2 text-2xs lowercase tracking-ui text-gri-500">{children}</div>;
}

/**
 * Sahte altlık harita. Marker'ların tek sınavı bu: beyaz kenar ve gölge
 * ancak RENKLİ ve yer yer KOYU bir zeminin üstünde denetlenebilir —
 * beyaz kartın üstünde her işaret iyi görünür.
 */
function HaritaZemini({
  children,
  yukseklik = 190,
  className = "",
}: {
  children: ReactNode;
  yukseklik?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        minHeight: yukseklik,
        background: [
          "radial-gradient(150px 110px at 76% 78%, #5F7E52, transparent 72%)",
          "radial-gradient(130px 95px at 16% 26%, #DCE8D2, transparent 70%)",
          "radial-gradient(170px 120px at 92% 18%, #CFE0EA, transparent 72%)",
          "repeating-linear-gradient(28deg, transparent 0 36px, rgba(255,255,255,.85) 36px 43px)",
          "repeating-linear-gradient(-58deg, transparent 0 54px, rgba(255,255,255,.7) 54px 60px)",
          "#EBE8E1",
        ].join(","),
      }}
    >
      {children}
    </div>
  );
}

/** Mutlak konumlu yuva — marker'ı haritanın bir noktasına oturtur. */
function Nokta({ sol, ust, children }: { sol: string; ust: string; children: ReactNode }) {
  return (
    <span className="absolute" style={{ left: sol, top: ust }}>
      {children}
    </span>
  );
}

/**
 * Bugünkü marker'ın TEMSİLİ — `Harita.tsx` + `globals.css` içindeki
 * `.foto-marker`ın yerine geçmiyor, yalnızca "arkadaş moduna geçince ne
 * değişiyor"u gösterebilmek için burada çizilen bir yer tutucu.
 */
function TemsiliMarker({ simge }: { simge: string }) {
  return (
    <span
      aria-hidden
      className="grid size-11 place-items-center rounded-full bg-yuzey text-[19px] leading-none"
      style={{ boxShadow: "var(--shadow-kat-3), inset 0 0 0 1px rgba(0,0,0,.12)" }}
    >
      {simge}
    </span>
  );
}

/* ---------- örnek veri — BİLEŞENLER DEĞİL BU SAYFA UYDURUYOR ---------- */

const ARKADASLAR = [
  { kullaniciAdi: "deniz", ad: "Deniz Arslan", eylem: "kaydetti", renk: "hsl(212 46% 42%)", simge: "☕", sol: "8%", ust: "18%" },
  { kullaniciAdi: "sinem", ad: "Sinem Kaya", eylem: "beğendi", renk: "hsl(318 46% 42%)", simge: "🍝", sol: "46%", ust: "56%" },
  { kullaniciAdi: "berk", ad: "Berk Uçar", eylem: "gitti", renk: "hsl(96 46% 42%)", simge: "🍺", sol: "16%", ust: "66%" },
] as const;

const SEMTLER = [
  { ad: "Moda", sayi: 131 },
  { ad: "Yeldeğirmeni", sayi: 64 },
  { ad: "Bahariye", sayi: 42 },
  { ad: "Rasimpaşa", sayi: 18 },
  { ad: "Fenerbahçe", sayi: 7 },
];

export default function HaritaEksikleriSayfasi() {
  /* B7 canlı: durum SAYFANIN state'i. Bileşenin hafızası yok. */
  const [calisiyor, setCalisiyor] = useState(false);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (zaman.current) clearTimeout(zaman.current); }, []);
  const ara = () => {
    setCalisiyor(true);
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => setCalisiyor(false), 1400);
  };

  /* B5'in asıl hikayesi: envanter §6/11 — mod değişince marker'lar
     fotoğraftan mor kişi ikonuna dönüyor. */
  const [mod, setMod] = useState<"herkes" | "arkadaslar">("herkes");

  const [aktifSemt, setAktifSemt] = useState<string | null>("Moda");
  const [seciliPin, setSeciliPin] = useState(false);

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 2
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Harita eksikleri
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Harita katmanında karşılığı olmayan dört bileşen:{" "}
          <code className="font-sayi text-sm">B4 · B5 · B6 · B7</code>. Sürüm B temel
          alındı. Üçü mevcut primitiflerin üstüne kuruldu (Avatar, Cip, Pill); B4 kendi
          silüetini çiziyor çünkü hiçbir primitif yer imi biçimi taşımıyor. Hiçbiri kendi
          verisini çekmiyor ve hiçbiri MapLibre&apos;ye bağlı değil — bağlama Faz 3&apos;ün işi.
        </p>

        {/* ============ 1 · B4 ============ */}
        <Baslik
          no="01"
          ad="Yer imi pini"
          kod="B4 · YerImiPini"
          not="Referansta “başkasının kaydettiği mekanlar mavi bookmark şeklinde”. Silüet D5’teki gideceğim yer imiyle aynı glif: kaydetme fikri uygulamanın iki yerinde de aynı şekille konuşuyor. Renk nane (karar 2026-09-17): referans mavi diyor ama bu üründe kaydetmenin rengi nane ve mavi haritada zaten kullanıcının kendi konumu. Dolgu bu pin için açılan doygun --color-nane tokeni."
        />

        <Kutu baslik="nane — konum noktasıyla yan yana">
          <HaritaZemini yukseklik={150}>
            <div className="flex h-full flex-wrap items-center gap-8 p-6">
              <span className="text-center">
                <YerImiPini simge="☕" etiket="Kaydedilmiş mekan" />
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  simgeli
                </span>
              </span>
              <span className="text-center">
                <YerImiPini etiket="Kaydedilmiş mekan" />
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  simgesiz
                </span>
              </span>
              <span className="text-center">
                {/* Konum noktasının TEMSİLİ (.benim-konum-nokta): kararın
                    gerekçesi bu ikisinin aynı haritada karışmaması. */}
                <span className="grid h-10 place-items-center">
                  <span
                    aria-hidden
                    className="block size-4 rounded-full"
                    style={{ background: "var(--color-mavi)", boxShadow: "0 0 0 3px #fff, var(--shadow-kat-2)" }}
                  />
                </span>
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  sen · mavi
                </span>
              </span>
            </div>
          </HaritaZemini>
          <Alt>
            dolgu <code className="mx-1 font-sayi">--color-nane</code> (beyazla 4.96:1, zeminle 4.05:1) ·
            konum noktasının mavisiyle aynı ışıklıkta, ama ayrı renk · koyu parkta ayrışmayı beyaz
            kenar sağlıyor
          </Alt>
        </Kutu>

        <Kutu baslik="durum ve ölçek">
          <HaritaZemini yukseklik={150}>
            <div className="flex h-full flex-wrap items-end gap-8 p-6">
              <YerImiPini simge="🍝" boyut={32} etiket="Kaydedilmiş mekan" />
              <YerImiPini simge="🍝" boyut={40} etiket="Kaydedilmiş mekan" />
              <YerImiPini simge="🍝" boyut={52} etiket="Kaydedilmiş mekan" />
              <span className="text-center">
                <YerImiPini simge="🍺" kapali etiket="Kaydedilmiş mekan, kapalı" />
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  bilinen kapalı
                </span>
              </span>
              <span className="text-center">
                <button
                  type="button"
                  onClick={() => setSeciliPin((s) => !s)}
                  className="bas border-none bg-transparent p-0"
                >
                  <YerImiPini simge="🥐" secili={seciliPin} etiket="Kaydedilmiş mekan" />
                </button>
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  seçili · dokun
                </span>
              </span>
            </div>
          </HaritaZemini>
          <Alt>
            saat bilgisi YOKSA soldurma yok — bilmediğimizi biliyormuş gibi göstermiyoruz ·
            ölçek iç katmanda, MapLibre&apos;nin transform&apos;uyla çakışmasın diye
          </Alt>
        </Kutu>

        {/* ============ 2 · B5 ============ */}
        <Baslik
          no="02"
          ad="Arkadaş marker’ı"
          kod="B5 · ArkadasMarkeri"
          not="Referansta mor kişi silüeti + @jake saved. Envanter §6/11: “sadece arkadaşlar” seçilince marker’ların hepsi fotoğraftan kişi ikonuna dönüyor — bu bir marker çeşidi değil, haritanın modu. Mor doygun uçtan değil pastel uçtan alındı: haritadaki son doygun renk (kategori noktası) bilerek kaldırılmıştı, onuncu renkle geri getirmiyoruz."
        />

        <Kutu baslik="mod değişimi — envanter §6 madde 11">
          <div className="mb-3">
            <IkiliPill
              secenekler={[
                { id: "herkes", ad: "herkes", ikon: "🌐" },
                { id: "arkadaslar", ad: "sadece arkadaşlar", ikon: "👥" },
              ] as const}
              secili={mod}
              onSec={setMod}
              etiket="Kimin mekanlarına bakıyorum"
            />
          </div>
          <HaritaZemini yukseklik={215}>
            {ARKADASLAR.map((a) => (
              <Nokta key={a.kullaniciAdi} sol={a.sol} ust={a.ust}>
                {mod === "herkes" ? (
                  <TemsiliMarker simge={a.simge} />
                ) : (
                  <ArkadasMarkeri kullaniciAdi={a.kullaniciAdi} eylem={a.eylem} />
                )}
              </Nokta>
            ))}
          </HaritaZemini>
          <Alt>
            “herkes” tarafındaki daireler bugünkü marker&apos;ın TEMSİLİ — gerçek
            <code className="mx-1 font-sayi">.foto-marker</code> Harita.tsx + globals.css&apos;te
            ve bu görevde ona dokunulmadı
          </Alt>
        </Kutu>

        <Kutu baslik="varyantlar">
          {/* Uzun ad SOL sütunda: sağda durursa etiket, bileşenin kendi 160
              piksellik kısaltmasına varmadan haritanın kenarında kesiliyor ve
              denetlenen şey görünmüyor. */}
          <HaritaZemini yukseklik={290}>
            <Nokta sol="6%" ust="7%">
              <ArkadasMarkeri kullaniciAdi="jale" eylem="kaydetti" />
            </Nokta>
            <Nokta sol="6%" ust="30%">
              <ArkadasMarkeri
                kullaniciAdi="deniz"
                ad="Deniz Arslan"
                renk="hsl(212 46% 42%)"
                eylem="beğendi"
              />
            </Nokta>
            <Nokta sol="6%" ust="53%">
              <ArkadasMarkeri kullaniciAdi="sinem" ad="Sinem Kaya" renk="hsl(318 46% 42%)" eylem="gitti" secili />
            </Nokta>
            <Nokta sol="6%" ust="78%">
              <ArkadasMarkeri kullaniciAdi="uzunbirkullaniciadi" eylem="kaydetti" boyut={34} />
            </Nokta>
            <Nokta sol="72%" ust="12%">
              <ArkadasMarkeri kullaniciAdi="berk" etiketsiz />
            </Nokta>
            <Nokta sol="84%" ust="12%">
              <ArkadasMarkeri kullaniciAdi="ece" etiketsiz />
            </Nokta>
          </HaritaZemini>
          <Alt>
            yukarıdan aşağı: silüet · avatar (baş harf + kişi rengi) · seçili · etiketsiz ikili ·
            uzun kullanıcı adı kısaltılıyor. etiket mutlak konumlu ve tıklamayı yutmuyor, yoksa
            daire koordinatın üstünden kayardı
          </Alt>
        </Kutu>

        {/* ============ 3 · B6 ============ */}
        <Baslik
          no="03"
          ad="Semt çipi"
          kod="B6 · SemtCipi — UYARLAMA"
          not="Referansın B6’sı dünya zoom’undaki 🌐 singapore çipleri. Kadıköy tek ilçe, dünya zoom’u yok; bileşeni birebir taşımak boş kabuk üretirdi. Uyarlama semt: bu üründe semt gerçek bir kimlik (Profil.tsx onu istatistik olarak sayıyor). Karar (2026-09-17): çip kalıyor ama yalnızca pin sayısıyla — altlık harita semt adını zaten yazıyor, sayısız çip aynı bilgiyi ikinci kez söylerdi. Bu yüzden sayi zorunlu prop."
        />

        <Kutu baslik="şerit — pin sayısıyla">
          <HaritaZemini yukseklik={120}>
            <div className="serit flex gap-2 p-4" style={{ ["--serit-solma" as string]: "2.5rem" }}>
              {SEMTLER.map((s) => (
                <SemtCipi
                  key={s.ad}
                  semt={s.ad}
                  sayi={s.sayi}
                  aktif={aktifSemt === s.ad}
                  onTikla={() => setAktifSemt(aktifSemt === s.ad ? null : s.ad)}
                />
              ))}
            </div>
          </HaritaZemini>
          <Alt>
            seçili hâl siyah HALKA, dolu siyah değil — haritadaki tek dolu siyah B7&apos;nin ·
            şerit kenarda soluyor (“devamı var”)
          </Alt>
        </Kutu>

        {/* ============ 4 · B7 ============ */}
        <Baslik
          no="04"
          ad="Burada ara"
          kod="B7 · BuradaAra"
          not="Envanter §6 madde 3: siyah (boşta) → mavi (çalışıyor), ikon dönüyor. Skill §14’ün tek renk istisnasının tam yeri — mavi bu üründe “çalışıyor / burada ara” için ayrıldı, kaydetmenin rengi nane. Metin çalışırken değişmiyor: büyüteç ile dönen halka aynı 14 pikselde, böylece geçişte tek değişen şey renk ve hap yerinden sıçramıyor."
        />

        <Kutu baslik="iki durum + canlı geçiş">
          <HaritaZemini yukseklik={150}>
            <div className="flex h-full flex-wrap items-center justify-center gap-4 p-6">
              <span className="text-center">
                <BuradaAra onTikla={() => {}} />
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  boşta
                </span>
              </span>
              <span className="text-center">
                <BuradaAra calisiyor />
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  çalışıyor
                </span>
              </span>
              <span className="text-center">
                <BuradaAra calisiyor={calisiyor} onTikla={ara} />
                <span className="mt-2 block rounded-full bg-yuzey/85 px-2 py-0.5 text-2xs lowercase tracking-ui text-gri-700">
                  canlı · dokun
                </span>
              </span>
            </div>
          </HaritaZemini>
          <Alt>
            çalışırken <code className="font-sayi">pasif</code> verilmiyor: Pill&apos;de pasif =
            opacity .45 ve solmuş bir mavi “çalışıyor” değil “kapalı” okunur. Tıklama geri
            çağrıyı kaldırarak susuyor, <code className="font-sayi">aria-busy</code> zaten var
          </Alt>
        </Kutu>

        <Kutu baslik="pasif ve giriş animasyonu">
          <HaritaZemini yukseklik={120}>
            <div className="flex h-full flex-wrap items-center gap-4 p-6">
              <BuradaAra pasif />
              <BuradaAra belir onTikla={() => {}} />
              <BuradaAra metin="bu mahallede ara" onTikla={() => {}} />
            </div>
          </HaritaZemini>
          <Alt>
            <code className="font-sayi">belir</code> harita durunca beliren hâl için; hareket
            azaltma tercihinde kapalı
          </Alt>
        </Kutu>

        {/* ============ 5 · dar çerçeve ============ */}
        <Baslik
          no="05"
          ad="Dar çerçeve"
          kod="390 px · asıl kullanım"
          not="Uygulama telefonda yaşıyor; dördü de 390 pikselde sınanmadan bitmiş sayılmaz. Aşağıdaki sütun tam olarak o genişlikte ve haritanın üst/alt yüzen chrome’unu taklit ediyor — düzen yalnızca oturuşu görmek için, montaj değil."
        />

        <Kutu baslik="390 px çerçeve">
          <div className="mx-auto w-[390px] max-w-full">
            <HaritaZemini yukseklik={420} className="overflow-hidden">
              {/* üst: yatay süzgeç sırası — “nereye bakıyorum” */}
              <div className="serit absolute inset-x-0 top-0 z-[4] flex gap-2 p-3" style={{ ["--serit-solma" as string]: "2rem" }}>
                {SEMTLER.slice(0, 4).map((s) => (
                  <SemtCipi
                    key={s.ad}
                    semt={s.ad}
                    sayi={s.sayi}
                    aktif={aktifSemt === s.ad}
                    onTikla={() => setAktifSemt(aktifSemt === s.ad ? null : s.ad)}
                  />
                ))}
              </div>

              {/* marker alanı */}
              <Nokta sol="10%" ust="26%">
                <YerImiPini simge="☕" />
              </Nokta>
              <Nokta sol="63%" ust="34%">
                <YerImiPini simge="🥐" secili />
              </Nokta>
              <Nokta sol="14%" ust="56%">
                <ArkadasMarkeri kullaniciAdi="deniz" eylem="kaydetti" />
              </Nokta>
              <Nokta sol="58%" ust="70%">
                <ArkadasMarkeri kullaniciAdi="berk" ad="Berk Uçar" renk="hsl(96 46% 42%)" eylem="gitti" />
              </Nokta>

              {/* alt: tek dolu siyah çapa */}
              <div className="absolute inset-x-0 bottom-0 z-[4] grid place-items-center p-4">
                <BuradaAra calisiyor={calisiyor} onTikla={ara} />
              </div>
            </HaritaZemini>
          </div>
          <Alt>
            ekranda tek dolu siyah eleman var (B7) · semt şeridi taşmıyor, kenarda soluyor ·
            arkadaş etiketleri kadrajın dışına çıkınca kırpılıyor, düzeni itmiyor
          </Alt>
        </Kutu>

        {/* ============ kapanış ============ */}
        <Baslik
          no="06"
          ad="Verilen kararlar"
          kod="2026-09-17 · NOT.md"
          not="Bu dört bileşenin üçü bir ürün kararı bekliyordu; hepsi verildi."
        />

        <div className="flex flex-col gap-2.5">
          <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
            <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">B4 · renk</div>
            <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-800">
              Nane. <code className="font-sayi">--color-mavi</code> haritada kullanıcının kendi
              konum noktası; kaydetmenin rengi nane. Doygun{" "}
              <code className="font-sayi">--color-nane</code> tokeni açıldı, referansa sadık mavi
              varyant kaldırıldı.
            </p>
          </div>
          <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
            <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">B5 · veri</div>
            <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-800">
              Ayrı bir RPC. “Bu mekanı kim kaydetti” yalnızca arkadaş modunda çağrılan yeni
              bir fonksiyondan gelecek; <code className="font-sayi">places_nearby</code> her
              harita hareketinde koştuğu için genişletilmiyor. RPC henüz yazılmadı.
            </p>
          </div>
          <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
            <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">B6 · semt çipi</div>
            <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-800">
              Kalıyor, pin sayısıyla. Sayısız hâli altlık haritanın etiketini tekrar ettiği
              için bileşende <code className="font-sayi">sayi</code> zorunlu yapıldı.
            </p>
          </div>
        </div>

        <p className="mt-12 max-w-[62ch] font-metin text-2xs text-gri-600">
          Dördü de hiçbir ekrana bağlı değil ve hiçbiri MapLibre&apos;ye bağlanmadı.{" "}
          <code className="font-sayi">Harita.tsx</code> marker&apos;ları{" "}
          <code className="font-sayi">document.createElement</code> +{" "}
          <code className="font-sayi">innerHTML</code> ile kuruyor; bu bileşenleri oraya
          taşımanın yöntemi Faz 2 raporunda, işi Faz 3&apos;ün.
        </p>
      </div>
    </main>
  );
}
