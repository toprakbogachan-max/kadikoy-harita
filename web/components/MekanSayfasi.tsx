"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as DokunusOlayi } from "react";
import { useVeri } from "@/lib/kanca";
import { yerGetir, yerinPinleri, mekanOzeti, kayitDegistir, kayitliMi, kucukUrl, medyaUrl, kisininListeleri, listelerimdeMi, listeyeEkle, listedenCikar, type YerDetay } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import { useKisiler } from "@/lib/kisiler-baglam";
import type { Pin } from "@/lib/model";
import type { PlaceSummary } from "@/lib/types";
import { TUR_AD, emoji } from "@/lib/paleti";
import { fotoZemin, acikMi, zaman } from "@/lib/gorsel";
import Avatar from "./Avatar";
import KunyeDuzenle from "./KunyeDuzenle";
import BosDurum from "./BosDurum";
import Cikartma from "./Cikartma";
import KayitRozeti from "./corner/KayitRozeti";
import DereceGostergesi from "./corner/DereceGostergesi";
import { ListeSecici, type SecilebilirListe } from "./corner/ListeSecimKarti";
import Panel from "./corner/primitives/Panel";
import IkonDugmesi from "./corner/primitives/IkonDugmesi";
import Pill from "./corner/primitives/Pill";

type Kademe = "yarim" | "tam";

interface Props {
  yerId: string;
  /** bu kişinin pinleri karuselde önce gösterilsin */
  oncelikliKisi?: string;
  onKapat: () => void;
  onGonderiAc: (pinId: string, liste: string[]) => void;
  onGirisIste: () => void;
  onPinAt: (yer: YerDetay) => void;
  /** liste oluşturma ekranını açar — seçicideki "yeni liste" bunu çağırır. */
  onListeOlustur?: () => void;
}

const GUN_AD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/* Yarım kademenin üst kenarı — kapsayıcı yüksekliğinin oranı. Tek yerde
   duruyor: sürükleme sınırı da, dinlenme konumu da bunu okuyor. */
/* Yarım açılım referanstaki özet kartını TAM olarak alacak kadar yer
   istiyor: ad + adres + saat + (açıklama|fotoğraf) satırı + kaydedenler +
   eylem hapları. Ölçüldü: içerik 341px, çekmece 0.48'de 348px. 0.56
   bırakılsaydı hapları kırpardı — bu değeri değiştirirsen yeniden ölç. */
const YARIM_ORAN = 0.48;
/* Yarım durağın EN AZ yüksekliği. Oran tek başına yetmiyor: özet kartının
   içeriği sabit (ad + adres + saat + kart/fotoğraf + kaydedenler + haplar
   ≈ 410px, uzun adlarda başlık iki satır) ama çerçeve yüksekliği cihazdan cihaza değişiyor — kısa ekranda
   %48 eylem haplarını kırpıyordu. Oran artık bir ÜST SINIR; asıl ölçü
   içeriğin kendisi. Özet bloğuna satır eklersen burayı da büyüt. */
const YARIM_EN_AZ = 412;

/** Yarım duraktaki üst kenar (px). Kapsayıcı yüksekliğine göre hesaplanır. */
const yarimUst = (kapYuk: number) =>
  Math.max(0, Math.min(kapYuk * YARIM_ORAN, kapYuk - YARIM_EN_AZ));
/* Tam kademede bile üstte bu kadar harita görünür kalıyor. Referansta
   sayfanın tepesinde mekanın haritadaki yeri duruyor; sıfıra indirmek
   "burası neresi" sorusunu ekrandan siliyordu. Yüzen başlık bu bandın
   üstünde yaşıyor, o yüzden 96'nın (başlık + boşluk) altına inmemeli. */
const TAM_UST = 168;
/* Bu kadar piksel altındaki hareket sürükleme değil, dokunuş sayılır. */
const CEKME_ESIGI = 4;
/* px/ms — bunun üstündeki fırlatma, yolun yarısı geçilmese de kademeyi
   değiştirir. Telefonda kısa ve sert kaydırmalar böyle yapılıyor. */
const FIRLATMA_HIZI = 0.5;
/* Bir kişi üzerinden gelindiğinde "Buraya bırakılanlar" başlığının üstünde
   bırakılan boşluk. Sıfır olsa bölüm kabın tam kenarına yapışıyor. */
const BOLUM_BOSLUGU = 12;
/* Kapanış animasyonu; aşağıdaki duration-300 ile aynı olmak zorunda. */
const GECIS_MS = 300;

/**
 * Mekan sayfası — Google Maps tarzı iki kademeli çekmece.
 *
 * Yarım kademede harita üstte görünür kalır (nerede olduğunu görmeden karar
 * veremiyorsun); tutamağa dokunup ya da yukarı sürükleyip tam ekrana çıkar.
 * Yarımdan aşağı sürüklemek kapatır.
 *
 * Bölüm sırası BRIEF kararı: uyarı → hızlı bakış → buraya bırakılanlar →
 * künye → özetler. Önce "buraya gitmeli miyim", sonra ayrıntı.
 */
export default function MekanSayfasi({ yerId, oncelikliKisi, onKapat, onGonderiAc, onGirisIste, onPinAt, onListeOlustur }: Props) {
  const { ben } = useOturum();
  /* Bir kişi üzerinden gelindiyse çekmece tam ekran AÇILIYOR — kademeyi
     efekte bırakmak yarış yaratıyordu: aşağıdaki render-içi sıfırlama
     "yarim"a geri alıyor, efekt de bir kez çalıştığı için düzeltmiyordu. */
  const [kademe, setKademe] = useState<Kademe>(oncelikliKisi ? "tam" : "yarim");
  /* Saat listesi açık mı — referanstaki "Wednesday: 9–9 ⌄" satırı. */
  const [saatAcik, setSaatAcik] = useState(false);
  const [kunyeAcik, setKunyeAcik] = useState(false);
  /* ---- liste seçici (Faz 4 Paket 5b) ----
     Panel açılınca veri çekiliyor: kapalıyken liste sorgusu atmanın anlamı
     yok, mekan sayfası zaten üç sorgu koşuyor. */
  const [listeSeciciAcik, setListeSeciciAcik] = useState(false);
  const [listeHatasi, setListeHatasi] = useState<string | null>(null);
  /* Seçimler iyimser güncelleniyor; null = "henüz dokunulmadı, sunucudaki
     hâl geçerli". */
  const [secilenler, setSecilenler] = useState<string[] | null>(null);
  /* Künye kaydedilince yerGetir tekrar çalışsın diye sayaç. */
  const [kunyeSayac, setKunyeSayac] = useState(0);
  const kapatDugmesi = useRef<HTMLButtonElement>(null);
  /* Bir kişi üzerinden gelindiyse doğrudan "Buraya bırakılanlar"a kaydırılıyor:
     birinin pinine dokunduysan mekanın kapak fotoğrafını değil ONUN notunu
     görmek istiyorsun. */
  const icerik = useRef<HTMLDivElement>(null);
  const pinlerBasligi = useRef<HTMLDivElement>(null);
  /* Kaydırmanın yapıldığı anahtar. Boolean olsa aynı çekmecede ikinci bir
     mekana geçildiğinde bir daha kaydırmıyordu. */
  const kaydirilan = useRef<string | null>(null);

  /* ---- sürükleme ----
     cek: parmak ekrandayken çekmecenin canlı konumu; null olması
     "sürükleme yok, kademenin dinlenme yerindeyiz" demek.
       ust   — üst kenar (px), 0 ile yarım arası
       asagi — yarımın ALTINA inen kısım. Burada top'u değil transform'u
               kullanıyoruz: top'u indirmek çekmeceyi kısaltıp içindeki
               yerleşimi eziyordu, translateY ise onu olduğu gibi
               ekranın dışına kaydırıyor. */
  const govde = useRef<HTMLDivElement>(null);
  const [cek, setCek] = useState<{ ust: number; asagi: number } | null>(null);
  /* Kapanırken cek dolu ama geçiş AÇIK kalmalı — o yüzden ayrı bayrak. */
  const [kapaniyor, setKapaniyor] = useState(false);
  const kapatZamani = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (kapatZamani.current) clearTimeout(kapatZamani.current); }, []);
  /* Oturum verisi state DEĞİL ref: her parmak hareketinde yeniden render
     etmemesi gerekiyor, tek okuyucusu da bu üç işleyici. */
  const cekme = useRef<{
    id: number; basY: number; basUst: number; kapYuk: number;
    sonY: number; sonT: number; hiz: number; tasindi: boolean;
  } | null>(null);
  const cevir = () => setKademe((k) => (k === "yarim" ? "tam" : "yarim"));

  function cekmeBasla(e: DokunusOlayi<HTMLDivElement>) {
    if (kapaniyor) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    /* kapat düğmesinden başlayan basış çekmeceyi sürüklemez */
    if ((e.target as HTMLElement).closest("[data-cekme-disi]")) return;
    const el = govde.current;
    if (!el) return;
    /* Yakalama BASIŞTA alınıyor. İlk harekete ertelemek çalışmıyor: parmak
       tutamaktan çıkar çıkmaz pointermove artık haritaya gidiyor, çekmece
       yerinde kalıp harita kayıyordu. */
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* imleç çoktan bırakılmış */ }
    cekme.current = {
      id: e.pointerId,
      basY: e.clientY,
      basUst: el.offsetTop,
      kapYuk: (el.offsetParent as HTMLElement | null)?.clientHeight ?? window.innerHeight,
      sonY: e.clientY, sonT: e.timeStamp, hiz: 0, tasindi: false,
    };
  }

  function cekmeSurdur(e: DokunusOlayi<HTMLDivElement>) {
    const c = cekme.current;
    if (!c || c.id !== e.pointerId) return;
    const dy = e.clientY - c.basY;
    if (!c.tasindi) {
      if (Math.abs(dy) < CEKME_ESIGI) return;
      c.tasindi = true;
    }
    const dt = e.timeStamp - c.sonT;
    if (dt > 0) c.hiz = (e.clientY - c.sonY) / dt;
    c.sonY = e.clientY;
    c.sonT = e.timeStamp;
    const yarim = yarimUst(c.kapYuk);
    const ham = c.basUst + dy;
    setCek({
      ust: Math.max(0, Math.min(yarim, ham)),
      asagi: Math.max(0, Math.min(c.kapYuk - yarim, ham - yarim)),
    });
  }

  function cekmeBitir(e: DokunusOlayi<HTMLDivElement>) {
    const c = cekme.current;
    if (!c || c.id !== e.pointerId) return;
    cekme.current = null;
    /* İptal (sistem jesti, çağrı, ekran kilidi) karar vermez, geri oturur. */
    if (e.type === "pointercancel") { setCek(null); return; }
    if (!c.tasindi) {
      /* Kımıldamadıysa bu bir dokunuş. Düğmenin click'ine bırakamıyoruz:
         imleç yakalandığı için tıklama tutamağa değil sarmalayıcıya gidiyor. */
      if (e.type === "pointerup") cevir();
      setCek(null);
      return;
    }

    const yarim = yarimUst(c.kapYuk);
    const son = Math.max(0, Math.min(c.kapYuk, c.basUst + (e.clientY - c.basY)));
    /* Üç durak var: tam (0), yarım, kapalı (kapsayıcının altı). */
    let hedef: "tam" | "yarim" | "kapali";
    if (c.hiz < -FIRLATMA_HIZI) {
      /* Yukarı fırlatma her zaman tam ekran. */
      hedef = "tam";
    } else if (c.hiz > FIRLATMA_HIZI) {
      /* Aşağı fırlatma BİR durak iner. Nerede bittiğine değil nereden
         başladığına bakıyoruz: sert bir savuruş uzağa gidebilir, ama
         kullanıcının beklediği tek kademe inmek. */
      hedef = c.basUst > CEKME_ESIGI ? "kapali" : "yarim";
    } else {
      /* Yavaş bırakma: en yakın durak. */
      hedef = son < yarim / 2 ? "tam"
        : son < (yarim + c.kapYuk) / 2 ? "yarim"
        : "kapali";
    }

    if (hedef === "kapali") {
      /* Anında sökmek çekmeceyi parmağın bıraktığı yerde yok ediyor.
         Önce aşağı kaydırıp sonra haber veriyoruz. */
      setKapaniyor(true);
      setCek({ ust: yarim, asagi: c.kapYuk - yarim });
      kapatZamani.current = setTimeout(onKapat, GECIS_MS);
      return;
    }
    setKademe(hedef);
    setCek(null);
  }

  const { veri: yer } = useVeri<YerDetay | null>(() => yerGetir(yerId), [yerId, kunyeSayac], null);
  const { veri: pinler } = useVeri<Pin[]>(() => yerinPinleri(yerId), [yerId], []);
  /* Bir kişi üzerinden gelindiyse onun pinleri başa alınıyor. sort kararlı,
     yani grup içindeki sıra (beğeni/tarih) bozulmuyor — yalnızca o kişinin
     pinleri öne çekiliyor. */
  const siraliPinler = useMemo(
    () =>
      oncelikliKisi
        ? [...pinler].sort(
            (a, b) => (b.kisi === oncelikliKisi ? 1 : 0) - (a.kisi === oncelikliKisi ? 1 : 0),
          )
        : pinler,
    [pinler, oncelikliKisi],
  );
  const { veri: ozet } = useVeri<PlaceSummary | null>(
    () => mekanOzeti(yerId), [yerId], null);
  const kisiler = useKisiler();
  const { veri: kayitSunucu } = useVeri<boolean>(
    () => (ben ? kayitliMi(yerId) : Promise.resolve(false)), [yerId, ben?.id], false);

  const { veri: listelerim, yukleniyor: listelerYukleniyor } = useVeri(
    () => (ben && listeSeciciAcik ? kisininListeleri(ben.id) : Promise.resolve([])),
    [ben?.id, listeSeciciAcik], []);
  const { veri: sunucudakiSecim } = useVeri(
    () => (ben && listeSeciciAcik ? listelerimdeMi(yerId) : Promise.resolve([])),
    [yerId, ben?.id, listeSeciciAcik], []);
  const seciliListeler = secilenler ?? sunucudakiSecim;

  const listeSec = async (listeId: string) => {
    const vardi = seciliListeler.includes(listeId);
    const oncekiler = seciliListeler;
    setListeHatasi(null);
    setSecilenler(vardi ? oncekiler.filter((x) => x !== listeId) : [...oncekiler, listeId]);
    try {
      if (vardi) await listedenCikar(listeId, yerId);
      else await listeyeEkle(listeId, yerId);
    } catch {
      /* Geri al: demo hesap salt okunur, RLS reddediyor. */
      setSecilenler(oncekiler);
      setListeHatasi("Kaydedilemedi. Demo hesapta liste düzenlenemiyor.");
    }
  };
  const [kayitYerel, setKayitYerel] = useState<boolean | null>(null);
  const kayitli = kayitYerel ?? kayitSunucu;
  /* Zıplama sayacı burada tutuluyordu; Faz 5'te Pill'in `zipla`sına
     devredildi (aynı hesabı primitif yapıyor, bkz. `useZipla`). */

  /* Mekan değişince kademe ve açık bölümler başa döner. Karusel indeksi
     yok artık — pinler zaman tünelinde alt alta, "kaçıncı pin" diye bir
     durum kalmadı. */
  const anahtar = `${yerId}|${oncelikliKisi ?? ""}`;
  const [oncekiYer, setOncekiYer] = useState(anahtar);
  if (oncekiYer !== anahtar) {
    setOncekiYer(anahtar);
    setSaatAcik(false);
    setKademe(oncelikliKisi ? "tam" : "yarim");
    setKayitYerel(null);
  }

  useEffect(() => {
    /* preventScroll şart: odaklanma çerçeveyi kaydırıp yerleşimi bozuyordu */
    kapatDugmesi.current?.focus({ preventScroll: true });
  }, []);

  /* Kaydırma pinler YÜKLENDİKTEN sonra, çünkü öncesinde bölüm yerinde
     değil ve hedefin konumu yanlış çıkıyor. Mekan başına bir kez:
     kullanıcı sonra yukarı kaydırırsa geri zıplamasın. */
  useEffect(() => {
    if (!oncelikliKisi || kaydirilan.current === anahtar) return;
    if (!siraliPinler.length) return;
    const k = icerik.current;
    const h = pinlerBasligi.current;
    /* yer'den ÖNCE gelen pinler için: bu noktada gövde henüz iskelet,
       ref'ler boş. yer bağımlılıkta olmasa efekt bir daha çalışmazdı. */
    if (!k || !h) return;
    kaydirilan.current = anahtar;
    /* Bir kare bekleniyor: kademe "tam"a geçince kapsayıcı büyüyor,
       konum ondan önce okunursa yanlış yere kaydırıyor. */
    requestAnimationFrame(() => {
      /* offsetTop DEĞİL: başlığın konumlandırılmış üst öğesi kaydırma kabı
         değil, çekmecenin kendisi. offsetTop üstteki sabit başlığı da
         sayıyordu, bölüm o kadar yukarı kaçıyordu. Rect farkı kaba göreli. */
      const fark = h.getBoundingClientRect().top - k.getBoundingClientRect().top;
      k.scrollTo({ top: Math.max(0, k.scrollTop + fark - BOLUM_BOSLUGU), behavior: "smooth" });
    });
  }, [oncelikliKisi, anahtar, siraliPinler.length, yer]);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  if (!yer) {
    return (
      <div className="absolute inset-x-0 bottom-0 top-[56%] z-20 rounded-t-xl bg-kagit p-4 text-sm text-gri-600 shadow-kat-5">
        Yükleniyor…
      </div>
    );
  }

  const t = new Date();
  const acik = acikMi(yer.saatler, t);
  const bugun = yer.saatler?.find((s) => s[0] === t.getDay());

  /* Bu mekana kendim pin attım mı? Attıysam alt çubuktaki "Buraya pin at"
     yanlış bilgi veriyordu — attığımı zaten biliyorum, görmek istediğim
     kendi notum. */
  const benimPinim = ben ? siraliPinler.find((p) => p.kisi === ben.id) ?? null : null;

  /* Kişi başı fiyat KÜNYEDEN değil pinlerden geliyor: pin formu zaten "ne
     ödedin" diye soruyor, aynı şeyi künyede ikinci kez sormak çelişki
     üretiyordu (Poyraz Kahve'de pin 210 TL, künye 180 TL). Medyan seçildi:
     tek bir pahalı akşam ortalamayı bozuyor, medyan bozmuyor. */
  const fiyatlar = siraliPinler
    .map((p) => p.fiyat)
    .filter((f): f is number => typeof f === "number" && f > 0)
    .sort((a, b) => a - b);
  const ortancaFiyat = fiyatlar.length
    ? fiyatlar.length % 2
      ? fiyatlar[(fiyatlar.length - 1) / 2]
      : Math.round((fiyatlar[fiyatlar.length / 2 - 1] + fiyatlar[fiyatlar.length / 2]) / 2)
    : null;

  /* Künye imzası: "@kim · N gün önce". Kişi adı kisiler bağlamından geliyor;
     henüz yüklenmediyse imza hiç gösterilmiyor (yanlış isim göstermektense
     hiç göstermemek). */
  const imzaKisi = yer.kunye?.guncelleyen ? kisiler[yer.kunye.guncelleyen] : null;
  const imza =
    imzaKisi && yer.kunye?.guncellenme != null
      ? `@${imzaKisi.k} · ${zaman(yer.kunye.guncellenme)}`
      : null;
  /* ---- yarım açılımın özet metinleri ----
     Referanstaki "🎷 jazz & whisky" + açıklama ikilisinin karşılığı. */

  /* Etiket: bu ürünün üç-kelime özelliği zaten aynı işi görüyor. Kelime
     yoksa kategori adına düşüyor — boş bir başlık bırakmaktansa. */
  const etiketCumlesi =
    ozet && ozet.words.length
      ? ozet.words.slice(0, 2).map(([k]) => k.toLocaleLowerCase("tr")).join(" & ")
      : (TUR_AD[yer.tur] ?? yer.tur).toLocaleLowerCase("tr");

  /* Açıklama: önce EN ÇOK BEĞENİLEN pinin notu (insan yazdı → Karla, düz),
     o yoksa uygulamanın derlediği cümle (italik). Ayrım italik/düz
     kuralının aynısı — okuyan tek bakışta kimin yazdığını görüyor. */
  const oneCikanNot = siraliPinler.find((p) => p.metin.trim())?.metin.trim() ?? "";
  const ozetInsan = !!oneCikanNot;
  const ozetCumlesi = oneCikanNot
    || (ozet?.top_scenario ? `Çoğunlukla ${ozet.top_scenario} geliniyor` : "");

  /* "boğaç, elif ve 3 kişi pinledi" — referanstaki "saved by … and 3 other
     people". Adlar kisiler bağlamından; henüz gelmediyse o ad atlanıyor. */
  const pinleyenAdlar = siraliPinler
    .map((p) => kisiler[p.kisi]?.ad)
    .filter((a): a is string => !!a);
  const pinleyenMetni =
    pinleyenAdlar.length === 0
      ? `${siraliPinler.length} kişi pinledi`
      : pinleyenAdlar.length <= 2
        ? `${pinleyenAdlar.join(", ")} pinledi`
        : `${pinleyenAdlar.slice(0, 2).join(", ")} ve ${pinleyenAdlar.length - 2} kişi pinledi`;

  /* Paylaşım: uygulamanın mekan başına ayrı bir route'u YOK (tek sayfa),
     o yüzden bağlantı değil metin paylaşılıyor. Olmayan bir URL üretmek
     kırık bir bağlantı dağıtmak olurdu. */
  const paylas = async () => {
    const metin = `${yer.ad} — ${yer.semt}, Kadıköy`;
    try {
      if (navigator.share) await navigator.share({ title: yer.ad, text: metin });
      else await navigator.clipboard.writeText(metin);
    } catch {
      /* kullanıcı vazgeçti ya da tarayıcı desteklemiyor — sessiz geç */
    }
  };

  /* Şeritteki fotoğrafların tamamı: hangi pinden geldiğini taşıyor ki
     dokununca o pinin detayı açılsın. Referansta da üstteki şerit tek bir
     pinin değil, mekana bırakılan bütün fotoğrafların. */
  const tumFotolar = siraliPinler.flatMap((p) =>
    p.medyalar.filter((m) => m.tur === "foto").map((m) => ({ pinId: p.id, yol: m.yol })),
  );

  /* Çekmece artık tam kademede de haritanın altında duruyor (TAM_UST),
     yani yuvarlak köşe ve gölge HER ZAMAN doğru — eskiden tam ekranda
     kapatılıyordu. */
  return (
    <>
      {/* ---- yüzen başlık ----
          Referanstaki gibi çerçevenin en üstünde duruyor, çekmecenin İÇİNDE
          değil: harita bandı altından kayarken başlık yerinde kalıyor.
          Kenardan kenara dolu bir bar DEĞİL — geri, ad ve paylaş ayrı ayrı
          yüzüyor (corner-tasarim §6). */}
      {/* Yüzen başlık YALNIZCA tam kademede. Yarım açılımda ad, paylaş ve
          kapat çekmecenin İÇİNDE duruyor (referans); ikisini birden
          göstermek adı iki kez yazardı. */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start gap-2 px-3 pt-3 transition-opacity ${
        kademe === "tam" && !cek ? "opacity-100" : "pointer-events-none opacity-0"
      }`} aria-hidden={kademe !== "tam"}>
        <button
          onClick={onKapat}
          ref={kapatDugmesi}
          aria-label="Kapat"
          className="pointer-events-auto grid size-9 shrink-0 place-items-center rounded-md border-none bg-yuzey text-lg leading-none text-gri-900 shadow-kat-2"
        >
          ‹
        </button>
        {/* Kademe A: mekan adı. Haritanın üstünde durduğu için kendi
            beyaz hapında — denizin ya da koyu bir parkın üstünde yazı
            kaybolmasın. */}
        <h2 className="pointer-events-auto mt-0.5 min-w-0 flex-1 truncate rounded-full bg-yuzey px-3.5 py-1.5 text-center text-base font-extrabold uppercase leading-tight tracking-siki shadow-kat-2">
          {yer.ad}
        </h2>
        <IkonDugmesi
          onTikla={() => (ben ? onPinAt(yer) : onGirisIste())}
          okunur="Buraya pin at"
          kat={2}
          className="pointer-events-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </IkonDugmesi>
      </div>

      <div
        ref={govde}
        role="dialog"
        aria-modal="true"
        aria-label={yer.ad}
        style={{
          /* CSS min/max: JS'teki yarimUst()'un birebir karşılığı. Kapsayıcı
             yüksekliğini render sırasında ölçmeye gerek kalmıyor. */
          top: cek
            ? cek.ust
            : kademe === "tam"
              ? TAM_UST
              : `max(0px, min(${YARIM_ORAN * 100}%, calc(100% - ${YARIM_EN_AZ}px)))`,
          transform: cek?.asagi ? `translateY(${cek.asagi}px)` : undefined,
        }}
        /* Tam kademede bile üstte HARİTA BANDI kalıyor (TAM_UST): referansta
           sayfanın tepesinde mekanın haritadaki yeri duruyor ve seçili
           marker onun fotoğrafı. Burada o bant ayrı bir mini harita değil,
           ARKADAKİ GERÇEK harita — ikinci bir MapLibre örneği kurmadan aynı
           görüntü, sıfır maliyetle. */
        className={`iridesan absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl shadow-kat-5 ${
          cek == null || kapaniyor ? "transition-[top,transform] duration-300" : ""
        }`}
      >
        {/* Sürükleme alanı: 4 mm'lik çubuğu parmakla tutturmak zor, üst
            şeridin tamamı çekilebilir. touch-action none olmasa tarayıcı
            bunu sayfa kaydırması sanardı. */}
        <div
          onPointerDown={cekmeBasla}
          onPointerMove={cekmeSurdur}
          onPointerUp={cekmeBitir}
          onPointerCancel={cekmeBitir}
          style={{ touchAction: "none" }}
          className="shrink-0"
        >
          <button
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cevir(); }
            }}
            aria-label={kademe === "yarim" ? "Sayfayı genişlet" : "Sayfayı küçült"}
            aria-expanded={kademe === "tam"}
            title="Dokun ya da yukarı sürükle"
            className="w-full border-none bg-transparent px-0 pb-1 pt-2.5"
          >
            <span className="mx-auto block h-1 w-[38px] rounded-full bg-gri-300" />
          </button>
        </div>

        <div ref={icerik} className={`min-h-0 flex-1 ${kademe === "yarim" ? "overflow-hidden" : "overflow-y-auto"}`}>
          {/* ---- künye özeti: emoji satırı, konum, saat ----
              Referansın en tepesindeki üç satır. Kategori rengi yok, emoji
              taşıyor; "açık/kapalı" dolu rozet değil DURUM RENGİ. */}
          <div className="px-4 pb-1 pt-0.5">
            {/* ---- kahraman satırı ----
                Referansta ad çekmecenin İÇİNDE ve iri; paylaş/kapat onun
                karşısında. Burada BÜYÜK HARF yok: ekran görüntüsünde mekan
                adı kendi yazımıyla duruyor ("La Fontaine"), Kademe A'dan
                yalnızca ağırlık ve sıkı aralık alınıyor. */}
            <div className="flex items-start gap-2">
              <h2 className="min-w-0 flex-1 text-3xl font-extrabold leading-none tracking-isim text-gri-900">
                {yer.ad}
              </h2>
              <IkonDugmesi okunur="Paylaş" onTikla={paylas}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4m0 0L8 8m4-4 4 4" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
                </svg>
              </IkonDugmesi>
              {/* ref primitife geçmiyor: odak yönetimi için düğmenin
                  kendisine gerek var, o yüzden bu biri elle kaldı. */}
              <button
                onClick={onKapat}
                ref={kapatDugmesi}
                aria-label="Kapat"
                className="bas grid size-9 shrink-0 place-items-center rounded-md border-none bg-yuzey text-gri-900 shadow-kat-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* Adres satırı. Şemada sokak adresi yok; elimizdeki en yakın şey
                semt — uydurmak yerine olanı yazıyoruz. */}
            {/* Semtin kendisi "Kadıköy" olabiliyor (OSM'de mahalle bilgisi
                olmayan kayıtlar); o zaman "kadıköy · kadıköy" yazıyordu. */}
            {/* Kayıt rozeti (D2) adres satırının yanında: "kaç kişi
                kaydetti" mekanın kimliğine ait bir sayı, istatistik
                bloğuna değil künyeye yakın duruyor. Sıfırda bileşen
                kendini çizmiyor — "0 KAYIT" bilgi değil suçlama. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm lowercase text-gri-600">
              <span>
                {yer.semt.toLocaleLowerCase("tr") === "kadıköy" ? "kadıköy" : `${yer.semt} · kadıköy`}
                {yer.uzaklik != null && <span className="font-sayi"> · {Math.round(yer.uzaklik)} m</span>}
              </span>
              <KayitRozeti sayi={yer.kaydeden ?? 0} />
            </div>

            {/* Durum + saat tek satırda: referansta "closed" kırmızı, saat
                koyu. Üç durumlu kural duruyor — saat bilgisi yoksa "kapalı"
                DEMİYORUZ. */}
            <button
              onClick={() => setSaatAcik((a) => !a)}
              aria-expanded={saatAcik}
              className="mt-1.5 flex w-full items-baseline gap-2 border-none bg-transparent p-0 text-left text-sm"
            >
              {!yer.saatler ? (
                <span className="lowercase text-gri-600">saat bilgisi yok</span>
              ) : (
                <>
                  <span className={`font-bold lowercase ${acik === null ? "text-gri-600" : acik ? "text-acik" : "text-kapali"}`}>
                    {acik === null ? "bugün" : acik ? "açık" : "kapalı"}
                  </span>
                  {bugun && (
                    <span className="text-gri-800">
                      {GUN_AD[t.getDay()]}: <span className="font-sayi">{bugun[1]}–{bugun[2]}</span>
                    </span>
                  )}
                  <span aria-hidden className={`ml-auto text-gri-500 transition-transform ${saatAcik ? "rotate-180" : ""}`}>⌄</span>
                </>
              )}
            </button>

            {saatAcik && yer.saatler && (
              <dl className="mt-2 rounded-lg bg-yuzey px-3 py-1.5 shadow-kat-1">
                {[1, 2, 3, 4, 5, 6, 0].map((g) => {
                  const s = yer.saatler?.find((x) => x[0] === g);
                  return (
                    <div key={g} className="flex items-baseline justify-between gap-3 py-1">
                      <dt className={`text-xs lowercase ${g === t.getDay() ? "font-semibold text-gri-900" : "text-gri-600"}`}>
                        {GUN_AD[g]}
                      </dt>
                      <dd className="m-0 font-sayi text-xs text-gri-700">{s ? `${s[1]}–${s[2]}` : "kapalı"}</dd>
                    </div>
                  );
                })}
              </dl>
            )}

            {/* ---- özet karuseli: açıklama kartı + fotoğraflar ----
                TEK bir kaydırma şeridi. Açıklama kartı sabit bir sütun DEĞİL,
                şeridin ilk öğesi: kaydırınca fotoğraflarla birlikte sola
                gidiyor. Sabit bırakıldığında dar ekranda fotoğraflara kalan
                yer yarıya iniyordu; kayınca şeridin tamamı fotoğrafa açılıyor.

                Sağdan taşma kasıtlı (-mr-4): "devamı var" sinyalinin kendisi.
                snap-proximity, mandatory değil — öğeler farklı genişlikte
                (kart %72, fotoğraflar kare) ve zorunlu yapışma parmağı
                ortada bırakınca zıplama gibi duruyor. */}
            <div className="relative -mr-4 mt-3">
              {/* Ekranın TEK çıkartması (skill §6). Şeridin DIŞINDA duruyor:
                  mekana ait bir rozet, tek bir fotoğrafa değil — kayarsa
                  hangi fotoğrafın rozeti olduğu belirsizleşirdi. */}
              {(ozet?.pin_count ?? 0) >= 3 && (
                <Cikartma
                  ust="popüler"
                  alt={(TUR_AD[yer.tur] ?? yer.tur).toLocaleLowerCase("tr")}
                  className="absolute -top-2 right-4 z-[2]"
                />
              )}

              <div className="flex h-[120px] snap-x snap-proximity items-stretch gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-[var(--cizgi)] bg-yuzey p-3">
                  {/* Corner'daki "🎷 jazz & whisky" satırının karşılığı: bu
                      ürünün üç-kelime özelliği zaten aynı işi görüyor. */}
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gri-900">
                    <span aria-hidden className="shrink-0">{emoji(yer.tur)}</span>
                    <span className="line-clamp-2 lowercase leading-tight">{etiketCumlesi}</span>
                  </div>
                  {ozetCumlesi && (
                    <p className={`mt-1.5 line-clamp-3 text-xs leading-snug text-gri-600 ${
                      ozetInsan ? "font-metin" : "italic"
                    }`}>
                      {ozetCumlesi}
                    </p>
                  )}
                </div>

                {tumFotolar.map((f) => (
                  <button
                    key={f.pinId + f.yol}
                    onClick={() => onGonderiAc(f.pinId, siraliPinler.map((p) => p.id))}
                    className="aspect-square h-full shrink-0 snap-start overflow-hidden rounded-lg border-none p-0"
                    style={{ background: fotoZemin(yer.tur) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={kucukUrl(medyaUrl(f.yol), 300)!} alt="" loading="lazy" decoding="async"
                         className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* ---- kaydedenler ----
                Üst üste binen dairesel avatarlar + kim olduğunu söyleyen gri
                satır. Referanstaki "saved by … and 3 other people". */}
            {siraliPinler.length > 0 && (
              <div className="mt-3 flex items-center gap-2.5">
                <span className="flex shrink-0">
                  {siraliPinler.slice(0, 4).map((p, i) => (
                    <span key={p.id} className="rounded-full ring-2 ring-[var(--color-kagit)]"
                          style={{ marginLeft: i ? -9 : 0, zIndex: 4 - i }}>
                      <Avatar kisi={p.kisi} boyut={26} sekil="daire" />
                    </span>
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs lowercase text-gri-600">{pinleyenMetni}</span>
              </div>
            )}

            {/* Eylem hapları: çerçeveli, DOLU DEĞİL. Tek dolu koyu eleman
                sağ alttaki yuvarlak "+" (skill §3: ekranda tek siyah çapa). */}
            {/* pr: sağ alttaki yuvarlak "+" son hapın üstüne biniyordu. */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-3 pr-[72px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Pill
                kat={1}
                className="shrink-0"
                href={`https://www.google.com/maps/dir/?api=1&destination=${yer.lat},${yer.lng}`}
                ikon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                    <path d="M9 4 3 6.4v13.2L9 17.2l6 2.4 6-2.4V4l-6 2.4zM9 4v13.2M15 6.4v13.2" />
                  </svg>
                }
              >
                yol tarifi
              </Pill>
              {/* Renk değişimi tek başına zayıf bir onay: göz düğmenin
                  üstündeyken zeminin naneye döndüğünü kaçırabiliyor,
                  hareketi kaçıramıyor. `zipla` bunu primitife devrediyor —
                  zıplayan yalnızca ikon oluyor. */}
              <Pill
                kat={1}
                className="shrink-0"
                dolgu={kayitli ? "nane" : "beyaz"}
                aktif={kayitli}
                zipla
                onTikla={async () => {
                  if (!ben) return onGirisIste();
                  const su = kayitli;
                  setKayitYerel(!su);
                  try { await kayitDegistir(yerId, su); }
                  catch (e) { setKayitYerel(su); alert(e instanceof Error ? e.message : String(e)); }
                }}
                ikon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                    <path d="M6 3.6h12v17l-6-4.2-6 4.2z" />
                  </svg>
                }
              >
                {kayitli ? "kaydettin" : "kaydet"}
              </Pill>
              {/* Listeye ekleme: kaydetmenin yanında ayrı bir eylem.
                  Kaydetmek "beni ilgilendiriyor", listeye eklemek "şu
                  seçkiye ait" demek. */}
              <Pill
                kat={1}
                className="shrink-0"
                onTikla={() => (ben ? setListeSeciciAcik(true) : onGirisIste())}
                ikon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3.6h9v17l-4.5-3.2L6 20.6z" /><path d="M18 8v8M22 12h-8" />
                  </svg>
                }
              >
                listeye ekle
              </Pill>
              <Pill
                kat={1}
                className="shrink-0"
                onTikla={() => { setKademe("tam"); setKunyeAcik(true); }}
                ikon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                }
              >
                {yer.kunye ? "künye" : "künye ekle"}
              </Pill>
            </div>
          </div>

          {/* ---- uyarı: BRIEF kararı, FOTOĞRAFTAN ÖNCE ----
              Referansta böyle bir bölüm yok ama bu ürünün kuralı: "gitmeden
              önce bilmen gereken" şey fotoğrafların altında kalamaz. */}
          {yer.kunye?.uyari && (
            <div className="mx-4 mt-3 rounded-lg bg-[rgba(179,38,30,.09)] p-3 text-sm leading-snug shadow-kat-1">
              <strong className="mb-1 block text-2xs font-bold uppercase tracking-etiket text-kapali">
                Gitmeden önce
              </strong>
              {yer.kunye.uyari}
              {/* İmza şart: bu alanı giriş yapan herkes değiştirebiliyor. */}
              {imza && <span className="mt-1.5 block font-sayi text-2xs text-gri-500">{imza}</span>}
            </div>
          )}


          {/* ---- zaman tüneli ----
              Referansın omurgası: tek pini oklarla gezdiren karusel yerine
              herkesin bıraktığı iz alt alta. Avatar kartın DIŞINDA, sol alt
              köşesinde duruyor — konuşma balonunun kuyruğu gibi. */}
          {siraliPinler.length ? (
            <div className="flex flex-col gap-3.5 px-4 pb-2 pt-4">
              {siraliPinler.map((p) => {
                const k = kisiler[p.kisi];
                const fotolar = p.medyalar.filter((m) => m.tur === "foto");
                const etiketler = [p.senaryo, ...p.kelimeler.slice(0, 3)].filter(Boolean);
                return (
                  <div key={p.id}>
                    {/* Fotoğraflar kartın DIŞINDA ve üstünde — referansta da
                        "X · N fotoğraf ekledi" ayrı bir olay. */}
                    {fotolar.length > 0 && (
                      <>
                        <p className="mb-1.5 pl-14 text-2xs lowercase text-gri-600">
                          <b className="font-semibold text-gri-800">{k?.ad ?? "…"}</b>
                          {" • "}{fotolar.length} fotoğraf ekledi
                        </p>
                        <div className="mb-2 flex gap-1.5 overflow-x-auto pl-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {fotolar.map((m) => (
                            <button
                              key={m.yol}
                              onClick={() => onGonderiAc(p.id, siraliPinler.map((x) => x.id))}
                              className="size-[150px] shrink-0 overflow-hidden rounded-md border-none p-0"
                              style={{ background: fotoZemin(yer.tur) }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={kucukUrl(medyaUrl(m.yol), 340)!} alt="" loading="lazy" decoding="async"
                                   className="size-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="relative pl-14">
                      {/* Avatar kartın sol alt köşesinde asılı: kart bir
                          konuşma balonu, avatar onun kuyruğu. Daire —
                          squircle kimlik, daire "iz" (skill §5). */}
                      <span className="absolute bottom-0 left-0">
                        <Avatar kisi={p.kisi} boyut={46} sekil="daire" />
                      </span>
                      <button
                        onClick={() => onGonderiAc(p.id, siraliPinler.map((x) => x.id))}
                        className="block w-full rounded-lg border border-[var(--cizgi)] bg-yuzey p-3.5 text-left"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-bold tracking-siki text-gri-900">
                            {k?.ad ?? "…"}
                          </span>
                          {/* Akış kartındakiyle aynı çip: ham "8.5/10"
                              yerine kademe + sayı. */}
                          <DereceGostergesi puan={p.puan} bicim="tek" boy="kucuk" puanGoster className="shrink-0" />
                          <span className="ml-auto shrink-0 font-sayi text-2xs text-gri-500">
                            {zaman(p.saat)}
                          </span>
                        </div>

                        {/* İnsanın yazdığı not: DÜZ yazı ve Karla. */}
                        {p.metin.trim() && (
                          <p className="mt-1.5 font-metin text-sm leading-snug text-gri-800">{p.metin}</p>
                        )}

                        {/* Uygulamanın derlediği satırlar: referanstaki
                            "⊞ liste / 📷 kaynak" satırlarının karşılığı. */}
                        {etiketler.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {etiketler.map((e) => (
                              <span key={e} className="flex items-center gap-1.5 text-xs lowercase text-gri-600">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                                  <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                                <span className="underline decoration-gri-300 underline-offset-2">{e}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {p.tekrar && (
                          <span className="mt-1.5 flex items-center gap-1.5 text-xs italic lowercase text-gri-600">
                            {p.tekrar}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 pb-4 pt-4">
              <BosDurum
                tur={yer.tur}
                foto={kucukUrl(yer.kapak, 800)}
                baslik="ilk pin senin"
                alt="buraya kimse not bırakmamış. nasıl bir yer olduğunu sen anlat."
                eylem={() => (ben ? onPinAt(yer) : onGirisIste())}
                eylemEtiketi="anlatayım."
              />
            </div>
          )}

          {/* ---- ürünün kendi ölçüleri ----
              Referansta karşılığı YOK ve bilerek duruyor: bu uygulamanın
              ayırt edici kararı tek bir yıldız puanı yerine DAĞILIM
              göstermek (BRIEF). Corner'ı taklit etmek için silinmez,
              yalnızca zaman tünelinin altına iner. */}
          {ozet && ozet.pin_count > 0 && (
            <>
              <section className="mx-4 mb-3.5 mt-2 rounded-lg bg-yuzey p-3.5 shadow-kat-1">
                <div className="mb-2 text-2xs font-bold uppercase tracking-etiket text-gri-700">
                  Bu mekan üç kelimeyle
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ozet.words.map(([k, n]) => (
                    <span key={k} className="rounded-full bg-gri-50 px-2.5 py-1.5 text-xs font-semibold leading-none text-gri-800">
                      {k}{n > 1 && <span className="font-sayi text-2xs font-normal text-gri-500"> ×{n}</span>}
                    </span>
                  ))}
                </div>
                {ozet.top_scenario && (
                  <p className="mt-2.5 text-xs italic text-gri-600">
                    Çoğunlukla <b className="not-italic text-gri-900">{ozet.top_scenario}</b> geliniyor
                  </p>
                )}
              </section>

              <section className="mx-4 mb-3.5 rounded-lg bg-yuzey p-3.5 shadow-kat-1">
                <div className="mb-2 text-2xs font-bold uppercase tracking-etiket text-gri-700">
                  Kişisel puanlar
                </div>
                {/* Ham ortalamanın yerine derece göstergesi (E1): sayı
                    yanında duruyor (puanGoster), kademe onun okunuşu.
                    Dağılım çubukları aşağıda kalıyor — göstergenin
                    söylemediği şeyi onlar söylüyor. */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <DereceGostergesi puan={ozet.rating_avg ?? null} puanGoster />
                  <span className="text-xs text-gri-600">herkes · {ozet.pin_count} kişi</span>
                </div>
                {ozet.following_avg != null && (
                  <div className="mt-1 font-sayi text-sm text-gri-600">
                    {ozet.following_avg.toFixed(1)} — takip ettiklerin
                  </div>
                )}
                <div className="mt-3 flex h-11 items-end gap-[3px]">
                  {ozet.rating_buckets.map((n, i) => (
                    <i
                      key={i}
                      title={`${i + 1} puan: ${n}`}
                      className={`flex-1 rounded-t-[3px] ${n ? "bg-gri-800" : "bg-gri-100"}`}
                      style={{ height: n ? `${Math.min(100, 25 + n * 38)}%` : "8%" }}
                    />
                  ))}
                </div>
                <div className="mt-1 flex justify-between font-sayi text-2xs text-gri-500">
                  <span>1</span><span>10</span>
                </div>
                <p className="mt-2.5 text-xs italic text-gri-600">
                  <span className="not-italic font-sayi">{ozet.would_return}/{ozet.pin_count}</span> kişi tekrar gider dedi
                </p>
              </section>

              {ozet.improvements.length > 0 && (
                <>
                  <div className="px-4 pb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-700">
                    Bir şey değişse
                  </div>
                  <ul className="mx-4 mb-4 list-none space-y-2 p-0">
                    {ozet.improvements.map((d, i) => (
                      <li key={i} className="rounded-lg bg-yuzey p-2.5 font-metin text-sm leading-snug shadow-kat-1">
                        {d.text}
                        <span className="mt-1 block font-sayi text-2xs text-gri-500">
                          @{kisiler[d.author]?.k ?? "…"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* ---- künye ayrıntısı ---- */}
          <dl className="mx-4 mb-6 rounded-lg bg-yuzey px-3 py-1 shadow-kat-1">
            <Satir e="Pin" d={`${yer.pinSayisi ?? 0} kişi pinledi`} sayi />
            {ortancaFiyat != null && <Satir e="Kişi başı" d={`${ortancaFiyat} ₺ (ortanca)`} sayi />}
            {yer.kunye?.rezervasyon && (
              <Satir
                e="Rezervasyon"
                d={yer.kunye.rezervasyonNotu
                  ? `${yer.kunye.rezervasyon} — ${yer.kunye.rezervasyonNotu}`
                  : yer.kunye.rezervasyon}
              />
            )}
            {yer.kunye?.enIyiSaat && <Satir e="En iyi saat" d={yer.kunye.enIyiSaat} />}
            {yer.kunye?.sadeceNakit && <Satir e="Ödeme" d="sadece nakit" />}
          </dl>
        </div>

        {/* ---- yuvarlak "+" ----
            Referansta çekmecenin sağ altında yüzen tek koyu eleman. Tam
            genişlikte bir düğme yerine bunu seçmek kasıtlı: yarım açılımda
            zaten dar olan alanı bir satır daha yemiyor ve kaydırırken
            yerinde kalıyor. Etiketi yok, o yüzden aria-label şart. */}
        <button
          onClick={() =>
            !ben ? onGirisIste()
            : benimPinim ? onGonderiAc(benimPinim.id, siraliPinler.map((p) => p.id))
            : onPinAt(yer)
          }
          aria-label={benimPinim ? "Pinini aç" : "Buraya pin at"}
          title={benimPinim ? "Pinini aç" : "Buraya pin at"}
          className="absolute bottom-4 right-4 z-[5] grid size-[58px] place-items-center rounded-full border-none bg-gri-900 text-white shadow-kat-3"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round">
            {benimPinim ? <path d="M4 12h16M13 5l7 7-7 7" /> : <path d="M12 5v14M5 12h14" />}
          </svg>
        </button>

        {kunyeAcik && (
          <KunyeDuzenle
            yerId={yerId}
            yerAdi={yer.ad}
            mevcut={yer.kunye}
            saatler={yer.saatler}
            onKapat={() => setKunyeAcik(false)}
            onKaydedildi={() => { setKunyeAcik(false); setKunyeSayac((n) => n + 1); }}
          />
        )}
        {listeSeciciAcik && (
          /* Liste seçici: alttan Panel. Kapsayıcı fixed, çünkü Panel kendi
             kapsayıcısına göre konumlanıyor ve mekan çekmecesi zaten
             kaydırılabilir bir kutu. */
          <div className="fixed inset-0 z-[60]">
            <button
              aria-label="Kapat"
              onClick={() => setListeSeciciAcik(false)}
              className="absolute inset-0 border-none bg-[rgba(16,16,20,.35)]"
            />
            <Panel duraklar={[0.62]} onKapat={() => setListeSeciciAcik(false)} zemin="kagit" okunur="Listeye ekle">
              <div className="px-4 pb-8">
                <ListeSecici
                  baslik="hangi listene?"
                  listeler={(listelerim ?? []).map((l): SecilebilirListe => ({
                    id: l.id,
                    baslik: l.baslik,
                    yerSayisi: l.yerler.length,
                    kapak: l.kapak,
                    kapakKonum: l.kapakKonum,
                    gizli: l.gizli,
                  }))}
                  secililer={seciliListeler}
                  onSec={listeSec}
                  yukleniyor={listelerYukleniyor}
                  onYeniListe={onListeOlustur ? () => { setListeSeciciAcik(false); onListeOlustur(); } : undefined}
                  bosKapak={yer.kapak}
                  bosMetin="kaydettiğin yerleri gruplamak için bir liste aç."
                />
                {listeHatasi && (
                  <p className="mt-3 mb-0 text-sm text-kapali">{listeHatasi}</p>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}

function Satir({ e, d, sayi }: { e: string; d: string; sayi?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 last:border-0">
      <dt className="shrink-0 text-xs text-gri-600">{e}</dt>
      <dd className={`m-0 text-right text-sm ${sayi ? "font-sayi" : ""}`}>{d}</dd>
    </div>
  );
}
