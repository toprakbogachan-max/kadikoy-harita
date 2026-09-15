"use client";

/**
 * /tasarim/primitifler — primitif vitrini.
 *
 * `/tasarim` tokenları denetliyor, burası o tokenlardan kurulan ALTI
 * primitifi denetliyor: Pill, Cip, Kart, Avatar, Rozet, Panel.
 * (`components/corner/primitives/`).
 *
 * Üç kural:
 *   1) Ürün değil ALET. Buradaki hiçbir düzen bir ekran değil; her blok
 *      tek bir primitifin varyant listesi.
 *   2) ÖRNEK VERİ BURADA DURUR. Primitifler kendi içeriğini uydurmuyor —
 *      ad, emoji, fotoğraf, sayı hepsi bu sayfadan geçiyor. Bir primitifi
 *      içerik yazmadan gösteremiyorsan primitif fazla şey biliyor demektir.
 *   3) Sayfa kendi denetlediği dile UYMAK zorunda: iridesan zemin, beyaz
 *      kart, ayraç çizgisi yok, iki kademeli tipografi.
 */

import { useEffect, useState } from "react";
import Pill, { IkiliPill } from "@/components/corner/primitives/Pill";
import Cip from "@/components/corner/primitives/Cip";
import Kart from "@/components/corner/primitives/Kart";
import Avatar from "@/components/corner/primitives/Avatar";
import Rozet, { RozetCikartma, RozetNokta, RozetSayac } from "@/components/corner/primitives/Rozet";
import Panel from "@/components/corner/primitives/Panel";

/* Fotoğraf yerine degrade: depoda örnek görsel yok ve vitrin için ağ
   isteği yapmak (ya da repoya jpeg koymak) yanlış olur. Kartın işi zaten
   fotoğrafı GÖSTERMEK değil, üstüne koyu örtü sermek. */
const sahteFoto = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="480" height="360" fill="url(#g)"/><circle cx="360" cy="90" r="70" fill="#ffffff" opacity="0.14"/><circle cx="120" cy="290" r="110" fill="#000000" opacity="0.10"/></svg>`,
  )}`;

const FOTO_MEKAN = sahteFoto("#8C6A4A", "#2E2A25");
const FOTO_LISTE = sahteFoto("#5B6EA8", "#23304F");

const KATEGORILER = [
  ["yemek", "🍽️", "yemek"],
  ["kahve", "☕", "kahve"],
  ["bar", "🍸", "bar"],
  ["tatli", "🍰", "tatlı"],
  ["kultur", "🎭", "kültür"],
  ["park", "🌳", "park"],
  ["otel", "🛎️", "otel"],
  ["magaza", "🛍️", "mağaza"],
  ["diger", "📍", "diğer"],
] as const;

const KISILER = [
  { ad: "Deniz Kaya", renk: "#7360C4" },
  { ad: "Sinem Ünal", renk: "#DC6389" },
  { ad: "Barış Ergin", renk: "#329179" },
  { ad: "İlayda Şen", renk: "#DE9B2E" },
] as const;

/* ---------- vitrin iskeleti ---------- */

function Baslik({ no, ad, kodlar, not }: { no: string; ad: string; kodlar: string; not: string }) {
  return (
    <header className="mb-4 mt-12 first:mt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-sayi text-2xs text-gri-500">{no}</span>
        <h2 className="text-xs font-bold uppercase tracking-etiket text-gri-900">{ad}</h2>
        <span className="font-sayi text-2xs text-gri-400">{kodlar}</span>
      </div>
      <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-700">{not}</p>
    </header>
  );
}

function Etiket({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-500">{children}</div>
  );
}

/* Vitrin kutusu: primitifleri KAĞIT zeminde gösteriyor, beyaz kartın
   içinde değil — beyaz hapın beyaz kart üstündeki gölgesi görünmüyor ve
   "kenarlık yerine gölge" kuralı denetlenemiyor. */
function Kutu({
  baslik,
  children,
  className = "",
}: {
  baslik: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="mb-3">
      <Etiket>{baslik}</Etiket>
      <div className={`rounded-lg bg-kagit p-4 ${className}`} style={{ border: "1px solid var(--cizgi)" }}>
        {children}
      </div>
    </section>
  );
}

/* ---------- ikonlar: yuva içeriği, primitifin parçası değil ---------- */

const Yer = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M9 4 3 6.4v13.2L9 17.2l6 2.4 6-2.4V4l-6 2.4zM9 4v13.2M15 6.4v13.2" />
  </svg>
);
const Imlec = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M6 3.6h12v17l-6-4.2-6 4.2z" />
  </svg>
);
const Buyutec = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M16.2 16.2 21 21" />
  </svg>
);
const Kisi = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 20c1.3-3.4 4-5.1 7-5.1s5.7 1.7 7 5.1" />
  </svg>
);

export default function PrimitiflerSayfasi() {
  /* B7: `burada ara` boşta siyah, çalışırken mavi. Envanter bölüm 6'nın
     3 numaralı bulgusu — iki durumun ardışık ekranı. */
  const [araniyor, setAraniyor] = useState(false);
  useEffect(() => {
    if (!araniyor) return;
    const z = setTimeout(() => setAraniyor(false), 1400);
    return () => clearTimeout(z);
  }, [araniyor]);

  const [kayitli, setKayitli] = useState(false);
  const [gidisDurumu, setGidisDurumu] = useState<"gidecegim" | "gittim">("gidecegim");
  const [kaynak, setKaynak] = useState("hepsi");
  /* Açık/seçili AYRI: bir çip seçili olduğu hâlde paneli kapalı olabilir. */
  const [kaynakAcik, setKaynakAcik] = useState(false);
  const [tur, setTur] = useState<string | null>("kahve");
  const [aktifBicim, setAktifBicim] = useState<"halka" | "dolu" | "seffaf">("halka");
  const [durak, setDurak] = useState(1);

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 1.5
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Primitifler
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Altı primitif:{" "}
          <code className="font-sayi text-sm">Pill · Cip · Kart · Avatar · Rozet · Panel</code>.
          Hiçbiri kendi içeriğini uydurmuyor — buradaki örnek ad, emoji ve
          fotoğraflar sayfanın kendisinden geçiyor. Sürüm B temel alındı;
          mekan detayı bileşenleri (çıkartma, kayıt rozeti, gideceğim/gittim)
          iki sürümde de aynı olduğu için Sürüm A’dan taşındı.
        </p>

        {/* ============ 1 · PILL ============ */}
        <Baslik
          no="01"
          ad="Hap"
          kodlar="A3 · A4 · A6 · D8 · E7 · F2 · I7 · I9 · J3"
          not="Yatay, metin taşıyan her şey. Dolu koyu eleman ekranda BİR tane olur, o yüzden varsayılan beyaz. Mavi ve nane iki ayrı istisna: mavi çalışıyor/birincil eylem, nane bu üründe kaydetmenin rengi."
        />

        <Kutu baslik="dolgular">
          <div className="flex flex-wrap items-center gap-2">
            <Pill ikon={<Yer />}>yol tarifi</Pill>
            <Pill dolgu="siyah" ikon={<Buyutec />}>
              mekan ara
            </Pill>
            <Pill dolgu="mavi" ikon={<Yer />}>
              burada ara
            </Pill>
            <Pill dolgu="nane" ikon={<Imlec />}>
              kaydettin
            </Pill>
            <Pill dolgu="degrade" ikon="✨">
              hadi başlayalım.
            </Pill>
            <Pill dolgu="cam" ikon="🕐">
              şu an açık
            </Pill>
          </div>
          <div className="mt-3 rounded-md bg-gri-800 p-3">
            <Etiket>
              <span className="text-gri-300">şeffaf — altından baloncuk akar</span>
            </Etiket>
            <Pill dolgu="seffaf" kat={0} className="text-white" ikon={<Kisi />}>
              takip ettiklerim
            </Pill>
          </div>
        </Kutu>

        <Kutu baslik="boylar ve yuvalar">
          <div className="flex flex-wrap items-center gap-2">
            <Pill boy="kucuk">kısa</Pill>
            <Pill boy="orta">orta</Pill>
            <Pill boy="buyuk">uzun</Pill>
            <Pill sag="⌄" ikon="🌐">
              herkes
            </Pill>
            <Pill dolgu="siyah" ikon={<Buyutec />} sag="✕">
              karga bar
            </Pill>
            <Pill dolgu="cam" sag="↗" kat={0}>
              ilk buluşma ama abartısız
            </Pill>
            <Pill kasa="aynen" ikon="🥐">
              Fazıl Bey
            </Pill>
          </div>
        </Kutu>

        <Kutu baslik="kenar: halka (seçim) · degrade (F2)">
          <div className="flex flex-wrap items-center gap-2">
            <Pill kenar="halka" aktif ikon="🔖">
              seçili
            </Pill>
            <Pill kenar="degrade" ikon="👥">
              birlikte derle
            </Pill>
            <Pill pasif ikon={<Imlec />}>
              kapalı
            </Pill>
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            Seçim dolu siyah değil siyah HALKA: dolu siyah ekranda bir tane olabilir,
            halka istediğin kadar.
          </p>
        </Kutu>

        <Kutu baslik="durum geçişleri — hareket (envanter bölüm 6)">
          <div className="flex flex-wrap items-center gap-3">
            <Pill
              dolgu={araniyor ? "mavi" : "siyah"}
              ikon={araniyor ? undefined : <Buyutec />}
              yukleniyor={araniyor}
              onTikla={() => setAraniyor(true)}
            >
              {araniyor ? "aranıyor" : "burada ara"}
            </Pill>
            <Pill
              dolgu={kayitli ? "nane" : "beyaz"}
              ikon={<Imlec />}
              aktif={kayitli}
              zipla
              onTikla={() => setKayitli((k) => !k)}
            >
              {kayitli ? "kaydettin" : "kaydet"}
            </Pill>
            <IkiliPill
              etiket="Gitme durumu"
              secili={gidisDurumu}
              onSec={setGidisDurumu}
              secenekler={[
                { id: "gidecegim", ad: "gideceğim", ikon: "🔖" },
                { id: "gittim", ad: "gittim", ikon: "✓" },
              ]}
            />
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            Zıplayan yalnızca İKON (skill §13): hapın tamamı zıplarsa komşuları da
            oynuyormuş gibi görünür. Renk değişimi tek başına zayıf bir onay — göz
            düğmenin üstündeyken rengin döndüğünü kaçırabilir, hareketi kaçıramaz.
          </p>
        </Kutu>

        <Kutu baslik="tam genişlik (E7, I9) — buton dili jenerik değil">
          <div className="flex max-w-[320px] flex-col gap-2">
            <Pill dolgu="siyah" tamGenislik boy="buyuk" ikon="✓">
              kaydet
            </Pill>
            <Pill dolgu="degrade" tamGenislik boy="buyuk">
              kulağa iyi geliyor.
            </Pill>
            <Pill tamGenislik boy="buyuk" kat={1}>
              tamam, göster.
            </Pill>
          </div>
        </Kutu>

        <Kutu baslik="yuvarlak chrome düğmeleri (A4)">
          <div className="flex flex-wrap items-center gap-2">
            {["‹", "✕", "⋯", "🔔", "✈", "⚙"].map((i) => (
              <Pill key={i} boy="orta" etiket={`Düğme ${i}`} className="size-10 !px-0">
                <span aria-hidden>{i}</span>
              </Pill>
            ))}
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            Üst bar kenardan kenara dolu bir şerit değil: geri / paylaş / menü ayrı ayrı,
            beyaz, gölgeli düğmeler olarak içeriğin üstünde yüzer.
          </p>
        </Kutu>

        {/* ============ 2 · ÇİP ============ */}
        <Baslik
          no="02"
          ad="Çip"
          kodlar="C1–C7 · G5"
          not="Haritada İKİ AYRI filtre biçimi var, karıştırılmaz: yatay hap 'hangi mekanlara bakıyorum' sorusunu, dikey emoji-daire 'ne arıyorum' sorusunu sorar. İki farklı soru, iki farklı biçim."
        />

        <Kutu baslik="yatay (C1, C3–C7) — kaynak, zaman, kapsam">
          <div className="serit flex gap-2 pb-1">
            {[
              { id: "hepsi", ad: "herkes", simge: "🌐", acilir: true },
              { id: "takip", ad: "takip ettiklerim", simge: "👥" },
              { id: "kayitli", ad: "kaydettiklerim", simge: "🔖" },
              { id: "acik", ad: "şu an açık", simge: "🕐" },
            ].map((c) => (
              <Cip
                key={c.id}
                ad={c.ad}
                simge={c.simge}
                acilir={c.acilir}
                acik={!!c.acilir && kaynakAcik}
                aktif={kaynak === c.id}
                aktifBicim={aktifBicim}
                onTikla={() => {
                  setKaynak(c.id);
                  if (c.acilir) setKaynakAcik((a) => !a);
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-2xs lowercase text-gri-600">aktif biçim:</span>
            <IkiliPill
              etiket="Aktif biçim"
              secili={aktifBicim}
              onSec={setAktifBicim}
              secenekler={[
                { id: "halka", ad: "halka" },
                { id: "dolu", ad: "dolu" },
                { id: "seffaf", ad: "şeffaf" },
              ]}
            />
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            “şeffaf” altından KayanSecim baloncuğu akan şerit için: çipin kendi zemini
            ve gölgesi kalkar, siyahı baloncuk taşır. Şeridin sağındaki solma{" "}
            <code className="font-sayi">.serit</code> sınıfından — kaydırma çubuğu gizli
            olduğu için “devamı var” sinyalinin tek taşıyıcısı o.
          </p>
        </Kutu>

        <Kutu baslik="dikey (C2, Sürüm B) — kategori">
          <div className="serit flex gap-1 pb-1">
            {KATEGORILER.map(([id, e, ad]) => (
              <Cip
                key={id}
                bicim="dikey"
                ad={ad}
                simge={e}
                aktif={tur === id}
                onTikla={() => setTur((t) => (t === id ? null : id))}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Cip bicim="dikey" ad="öne çıkan" simge="⭐" />
            <Cip bicim="dikey" ad="gece" gorsel={FOTO_MEKAN} />
            <span className="max-w-[40ch] font-metin text-2xs text-gri-600">
              Birkaç çip emojiyle değil fotoğrafla taşınır (C2). Emoji dairede 20 piksele
              çıkınca kategori bir bakışta taranıyor; yan yana yazılarda göz her etiketi
              tek tek okuyor.
            </span>
          </div>
        </Kutu>

        <Kutu baslik="şehir çipi (C7) ve etiket çipi (G5)">
          <div className="flex flex-wrap items-center gap-2">
            <Cip ad="kadıköy" simge="🌐" sayi={131} />
            <Cip ad="moda" simge="🌐" sayi={42} />
            <Cip bicim="etiket" ad="sergiler" />
            <Cip bicim="etiket" ad="meyhane" simge="🍶" />
            <Cip bicim="etiket" ad="sahaf" />
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            Etiket çipi Kademe C: BÜYÜK harf ama küçük punto ve ferah aralık — Kademe
            A’nın (sıkı, iri) tam tersi ayarı.
          </p>
        </Kutu>

        {/* ============ 3 · KART ============ */}
        <Baslik
          no="03"
          ad="Kart kabuğu"
          kodlar="F1 · F4 · F6 · G1–G4 · D11 · E5 · H7"
          not="Yalnızca kabuk: zemin, yarıçap, gölge, dolgu, gerekiyorsa koyu örtü. İçerik düzeni montaj fazının işi. Kullanıcı içeriği beyaz kartta, sistem/aktivite mesajı degrade kartta durur — renk burada anlam taşıyor."
        />

        <Kutu baslik="zeminler">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kart dolgu="dar">
              <div className="text-sm font-extrabold tracking-isim">beyaz</div>
              <div className="font-metin text-2xs text-gri-600">kullanıcı içeriği</div>
            </Kart>
            <Kart zemin="degrade" dolgu="dar">
              <div className="text-sm font-extrabold tracking-isim text-rozet-lila-ink">degrade</div>
              <div className="font-metin text-2xs text-rozet-lila-ink opacity-80">
                sistem / aktivite
              </div>
            </Kart>
            <Kart zemin="foto" foto={FOTO_MEKAN} dolgu="dar" oran="1/1" className="flex items-end">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-siki text-white">
                  fotoğraf
                </div>
                <div className="font-metin text-2xs text-white/80">koyu örtü zorunlu</div>
              </div>
            </Kart>
            <Kart zemin="bos" dolgu="dar" oran="1/1" />
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            Sondaki boş yuva kesik çizgili çerçeve ya da “+” kutusu değil, yalnızca soluk
            gri bir dikdörtgen — ızgarada yeri olan ama içeriği olmayan hücre sessizdir,
            çünkü orası bir hata değil.
          </p>
        </Kutu>

        <Kutu baslik="gölge kademeleri — derinliğin TEK kaynağı">
          <div className="flex flex-wrap gap-3">
            {([1, 2, 3, 4, 5] as const).map((k) => (
              <Kart key={k} kat={k} dolgu="dar" className="w-[104px]">
                <div className="font-sayi text-2xs font-bold text-gri-900">kat-{k}</div>
                <div className="mt-0.5 font-metin text-2xs leading-tight text-gri-600">
                  {["duran içerik", "yüzen chrome", "en üst", "alt panel", "tam ekran"][k - 1]}
                </div>
              </Kart>
            ))}
          </div>
        </Kutu>

        <Kutu baslik="yarıçap, dolgu ve saç teli">
          <div className="flex flex-wrap items-start gap-3">
            {(["sm", "md", "lg", "xl", "2xl"] as const).map((y) => (
              <Kart key={y} yaricap={y} dolgu="dar" className="w-[86px]" sacTeli>
                <div className="font-sayi text-2xs text-gri-700">{y}</div>
              </Kart>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-start gap-3">
            {(["yok", "dar", "normal", "genis"] as const).map((d) => (
              <Kart key={d} dolgu={d} className="w-[104px]">
                <div className="rounded-xs bg-gri-100 py-2 text-center font-sayi text-2xs text-gri-600">
                  {d}
                </div>
              </Kart>
            ))}
          </div>
        </Kutu>

        <Kutu baslik="tıklanabilir kabuk + fotoğraflı davet (boş durum)">
          <div className="grid gap-3 sm:grid-cols-2">
            <Kart onTikla={() => {}} dolgu="dar" etiket="Örnek kart">
              <div className="flex items-center gap-3">
                <Avatar ad="Deniz Kaya" renk="#7360C4" boyut="lg" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold tracking-isim">Deniz Kaya</div>
                  <div className="font-metin text-2xs text-gri-600">kart basıldığında içeri basılır</div>
                </div>
              </div>
            </Kart>
            <Kart zemin="foto" foto={FOTO_LISTE} dolgu="genis" oran="16/9" className="grid place-items-center">
              <div className="text-center">
                <div className="text-lg font-extrabold uppercase leading-tight tracking-siki text-white">
                  ⊕ kendi köşeni kur
                </div>
                <div className="mt-1 font-metin text-2xs text-white/80">
                  boş liste = beyaz ekran değil, davet
                </div>
              </div>
            </Kart>
          </div>
        </Kutu>

        {/* ============ 4 · AVATAR ============ */}
        <Baslik
          no="04"
          ad="Avatar"
          kodlar="squircle = kimlik · daire = haritadaki nokta"
          not="Tutarsızlık değil, ayrımın kendisi: yuvarlak kare 'bu bir kişi', tam daire 'bu bir konum işareti ya da listedeki ufak iz'. Yarıçap boyutla ölçekleniyor — sabit 22px, 20 piksellik avatarda neredeyse daire yapıyor."
        />

        <Kutu baslik="boyut kademeleri">
          <div className="flex flex-wrap items-end gap-4">
            {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((b, i) => (
              <div key={b} className="text-center">
                <Avatar ad={KISILER[i % KISILER.length].ad} renk={KISILER[i % KISILER.length].renk} boyut={b} />
                <div className="mt-1.5 font-sayi text-2xs text-gri-600">{b}</div>
              </div>
            ))}
          </div>
        </Kutu>

        <Kutu baslik="şekil, halka, fotoğraf ve rozet yuvası">
          <div className="flex flex-wrap items-end gap-4">
            <div className="text-center">
              <Avatar ad="Sinem Ünal" renk="#DC6389" boyut="xl" sekil="daire" />
              <div className="mt-1.5 font-sayi text-2xs text-gri-600">daire</div>
            </div>
            <div className="text-center">
              <Avatar ad="Kadıköy" foto={FOTO_MEKAN} boyut="xl" />
              <div className="mt-1.5 font-sayi text-2xs text-gri-600">fotoğraf</div>
            </div>
            <div className="text-center">
              <Avatar
                ad="Barış Ergin"
                renk="#329179"
                boyut="xl"
                rozet={<Rozet ton="nane" sekil="hap">12</Rozet>}
              />
              <div className="mt-1.5 font-sayi text-2xs text-gri-600">rozet · sağ alt</div>
            </div>
            <div className="text-center">
              <Avatar
                ad="İlayda Şen"
                renk="#DE9B2E"
                boyut="xl"
                rozetKonum="sag-ust"
                rozet={<span className="text-lg leading-none">☕</span>}
              />
              <div className="mt-1.5 font-sayi text-2xs text-gri-600">rozet · sağ üst</div>
            </div>
            {/* Yığın: uçtaki avatarlar hapın kavisine denk gelmesin diye yatay dolgu daha geniş. */}
            <div className="rounded-full bg-gri-800 px-4 py-2">
              <div className="flex">
                {KISILER.map((k, i) => (
                  <span key={k.ad} style={{ marginLeft: i ? -9 : 0, zIndex: 4 - i }}>
                    <Avatar ad={k.ad} renk={k.renk} boyut="sm" sekil="daire" halka="beyaz" kat={0} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Kutu>

        {/* ============ 5 · ROZET ============ */}
        <Baslik
          no="05"
          ad="Rozet"
          kodlar="D2 · D3 · D7 · H2"
          not="Pastel vurgular YALNIZCA burada yaşar. Doygunluk alanla ters orantılı: küçük rozette renk canlı olabilir, alan büyüdükçe düşer. Çıkartma ekran başına BİR tane — ikiye çıktığı anda ucuzluyor."
        />

        <Kutu baslik="etiket rozeti (D2) ve sıralama satırı (D3)">
          <div className="flex flex-wrap items-center gap-2">
            <Rozet ton="pembe">946 kayıt</Rozet>
            <Rozet ton="lila" sekil="hap">
              yeni
            </Rozet>
            <Rozet ton="nane" boy="orta" ikon="✓">
              gittim
            </Rozet>
            <Rozet ton="kahve" ikon="☕">
              kahve
            </Rozet>
            <Rozet ton="bar">bar</Rozet>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <RozetNokta ton="pembe">popüler · fırında #4</RozetNokta>
            <RozetNokta ton="nane">yeni açıldı</RozetNokta>
            <RozetNokta ton="lila">sakin</RozetNokta>
          </div>
        </Kutu>

        <Kutu baslik="dairesel sayaç (H2)">
          <div className="flex flex-wrap items-center gap-6">
            <RozetSayac sayi={3} etiket="haftalık seri" />
            <RozetSayac sayi="#7" etiket="kadıköy sırası" ton="nane" ikinciTon="lila" />
            <RozetSayac sayi={41} etiket="mekan" ton="kahve" ikinciTon="tatli" boyut={56} />
          </div>
        </Kutu>

        <Kutu baslik="çıkartma / starburst (D7)">
          <div className="flex flex-wrap items-center gap-6">
            <RozetCikartma ust="POPÜLER" alt="fırında #4" />
            {/* Farklı açılar da animasyonlu: keyframe bitişi --aci-cikartma'dan
                okuyor, ara kareler ona göreceli. Eskiden son kare -9deg'e
                çiviliydi ve bu ikisi animasyonsuz kalmak zorundaydı. */}
            <RozetCikartma ust="YENİ" ton="nane" boyut={66} aci={7} />
            <RozetCikartma ust="SAKİN" alt="gece" ton="lila" uc={12} boyut={92} aci={-18} />
            {/* Fotoğrafın üstüne yapışık duruşu: çıkartmanın gerçek yeri orası. */}
            <Kart zemin="foto" foto={FOTO_MEKAN} dolgu="dar" className="relative w-[160px]" oran="1/1">
              <div className="absolute -right-3 -top-3">
                <RozetCikartma ust="POPÜLER" alt="kahvede #2" canlan={false} />
              </div>
              <div className="absolute bottom-3 left-3 text-sm font-extrabold uppercase tracking-siki text-white">
                Karga Bar
              </div>
            </Kart>
          </div>
          <p className="mt-3 max-w-[56ch] font-metin text-2xs text-gri-600">
            Giriş animasyonu (<code className="font-sayi">.yapistir</code>) her açıda
            koşuyor: keyframe bitiş açısını{" "}
            <code className="font-sayi">--aci-cikartma</code>’dan okuyor, ara kareler ona
            göreceli (−17° gelir, +5° aşar, açısına oturur). Yukarıdakiler −9°, +7° ve −18°.
          </p>
        </Kutu>

        {/* ============ 6 · PANEL ============ */}
        <Baslik
          no="06"
          ad="Alt panel"
          kodlar="A7 · tutamaç · duraklama noktaları"
          not="Envanter bölüm 6'nın 8 numaralı bulgusu: aynı panel üç FARKLI yükseklikte yakalanmış. Sürükle, bırak, en yakın durağa otursun. Tutamaca dokunmak durakları sırayla geziyor — sürükleyemeyen kullanıcı için tek erişim yolu o."
        />

        <Kutu baslik="üç durak · sürüklenebilir" className="!p-3">
          {/* Telefon çerçevesi: panel offsetParent'ından ölçüyor, kapsayıcının
              relative + sabit yükseklikli olması ŞART. */}
          <div className="relative mx-auto h-[420px] w-full max-w-[360px] overflow-hidden rounded-2xl bg-gri-200">
            {/* "harita" yerine sahte zemin — panelin altında bir şey olduğunu
                göstermek yeterli, gerçek MapLibre vitrine ağırlık. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 40% at 30% 20%, #cfe0d4, transparent 70%), radial-gradient(50% 40% at 80% 40%, #e3dcc9, transparent 70%), #dfe3e0",
              }}
            />
            <div className="absolute left-6 top-8 flex flex-col gap-2">
              <Pill boy="kucuk" kasa="aynen" ikon="☕">
                Fazıl Bey
              </Pill>
              <Pill boy="kucuk" kasa="aynen" ikon="🍸" className="ml-10">
                Karga
              </Pill>
            </div>

            <Panel
              etiket="Mekan paneli"
              duraklar={[0.3, 0.62, 0.94]}
              durak={durak}
              onDurakDegis={setDurak}
              tepe={
                <div className="flex items-start gap-2 px-4 pb-1 pt-1">
                  <h3 className="min-w-0 flex-1 truncate text-2xl font-extrabold leading-none tracking-isim text-gri-900">
                    Karga Bar
                  </h3>
                  <Pill boy="kucuk" etiket="Paylaş" className="size-8 !px-0">
                    <span aria-hidden>✈</span>
                  </Pill>
                  <Pill boy="kucuk" etiket="Kapat" className="size-8 !px-0">
                    <span aria-hidden>✕</span>
                  </Pill>
                </div>
              }
            >
              <div className="px-4 pb-6">
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm lowercase text-gri-600">moda · kadıköy</span>
                  <RozetNokta ton="pembe">popüler · barda #3</RozetNokta>
                </div>

                <div className="serit mt-3 flex gap-2 pb-1">
                  <Pill boy="kucuk" kat={1} ikon={<Yer />}>
                    yol tarifi
                  </Pill>
                  <Pill boy="kucuk" kat={1} ikon={<Imlec />}>
                    kaydet
                  </Pill>
                  <Pill boy="kucuk" kat={1} ikon="✈">
                    paylaş
                  </Pill>
                  <Pill boy="kucuk" kat={1} ikon="📞">
                    ara
                  </Pill>
                </div>

                <div className="mt-4">
                  <Etiket>kaydedenler</Etiket>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {KISILER.map((k, i) => (
                        <span key={k.ad} style={{ marginLeft: i ? -9 : 0, zIndex: 4 - i }}>
                          <Avatar ad={k.ad} renk={k.renk} boyut="sm" sekil="daire" halka="kagit" kat={0} />
                        </span>
                      ))}
                    </div>
                    <span className="text-xs lowercase text-gri-600">ve 38 kişi daha</span>
                  </div>
                </div>

                {[0, 1, 2].map((i) => (
                  <Kart key={i} dolgu="dar" className="mt-3">
                    <div className="flex gap-2.5">
                      <Avatar ad={KISILER[i].ad} renk={KISILER[i].renk} boyut="md" />
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold tracking-isim">{KISILER[i].ad}</div>
                        <p className="mt-0.5 font-metin text-2xs leading-snug text-gri-700">
                          Panel üç durakta duruyor; içerik ancak en üst durakta kayıyor.
                          Yarım yükseklikte ikinci bir kaydırma alanı, paneli aşağı çekmek
                          isteyen parmağı yer.
                        </p>
                      </div>
                    </div>
                  </Kart>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <Pill
                key={i}
                boy="kucuk"
                kat={1}
                aktif={durak === i}
                kenar={durak === i ? "halka" : "yok"}
                onTikla={() => setDurak(i)}
              >
                {["küçük", "yarım", "tam"][i]}
              </Pill>
            ))}
          </div>
        </Kutu>

        <p className="mt-12 max-w-[62ch] font-metin text-2xs text-gri-600">
          Sonraki faz montaj: bu altı primitif mevcut ekranlara girer ve örtüşen
          bileşenler (<code className="font-sayi">Avatar</code>,{" "}
          <code className="font-sayi">Cikartma</code>,{" "}
          <code className="font-sayi">FiltreCipleri</code>,{" "}
          <code className="font-sayi">AltMenu</code>) buradaki karşılıklarıyla
          birleşir. Primitifler o zamana kadar hiçbir ekrana bağlı değil.
        </p>
      </div>
    </main>
  );
}
