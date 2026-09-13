"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as DokunusOlayi } from "react";
import { useVeri } from "@/lib/kanca";
import { yerGetir, yerinPinleri, mekanOzeti, kayitDegistir, kayitliMi, kucukUrl, medyaUrl, type YerDetay } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import { useKisiler } from "@/lib/kisiler-baglam";
import type { Pin } from "@/lib/model";
import type { PlaceSummary } from "@/lib/types";
import { TUR_AD, emoji } from "@/lib/paleti";
import { fotoZemin, simgeSvg, acikMi, zaman, zeminSimgeRengi } from "@/lib/gorsel";
import Avatar from "./Avatar";
import KunyeDuzenle from "./KunyeDuzenle";
import BosDurum from "./BosDurum";
import Cikartma from "./Cikartma";

type Kademe = "yarim" | "tam";

interface Props {
  yerId: string;
  /** bu kişinin pinleri karuselde önce gösterilsin */
  oncelikliKisi?: string;
  onKapat: () => void;
  onGonderiAc: (pinId: string, liste: string[]) => void;
  onGirisIste: () => void;
  onPinAt: (yer: YerDetay) => void;
}

const GUN_AD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/* Yarım kademenin üst kenarı — kapsayıcı yüksekliğinin oranı. Tek yerde
   duruyor: sürükleme sınırı da, dinlenme konumu da bunu okuyor. */
const YARIM_ORAN = 0.56;
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
export default function MekanSayfasi({ yerId, oncelikliKisi, onKapat, onGonderiAc, onGirisIste, onPinAt }: Props) {
  const { ben } = useOturum();
  /* Bir kişi üzerinden gelindiyse çekmece tam ekran AÇILIYOR — kademeyi
     efekte bırakmak yarış yaratıyordu: aşağıdaki render-içi sıfırlama
     "yarim"a geri alıyor, efekt de bir kez çalıştığı için düzeltmiyordu. */
  const [kademe, setKademe] = useState<Kademe>(oncelikliKisi ? "tam" : "yarim");
  const [pinIndex, setPinIndex] = useState(0);
  const [kunyeAcik, setKunyeAcik] = useState(false);
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
    const yarim = c.kapYuk * YARIM_ORAN;
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

    const yarim = c.kapYuk * YARIM_ORAN;
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
  const [kayitYerel, setKayitYerel] = useState<boolean | null>(null);
  const kayitli = kayitYerel ?? kayitSunucu;

  /* mekan değişince karusel ve kademe başa döner */
  /* Öncelikli kişi değişince de başa dönüyor: aynı mekana bu kez başkasının
     listesinden girildiyse karusel onun pininde başlamalı. */
  const anahtar = `${yerId}|${oncelikliKisi ?? ""}`;
  const [oncekiYer, setOncekiYer] = useState(anahtar);
  if (oncekiYer !== anahtar) {
    setOncekiYer(anahtar);
    setPinIndex(0);
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
  const pin = siraliPinler[Math.min(pinIndex, Math.max(0, siraliPinler.length - 1))];

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
  const ilkFoto = pin?.medyalar.find((m) => m.tur === "foto");
  /* Çekmece en fazla 392 piksel geniş; 1600 piksellik dosyayı indirmenin
     anlamı yok. 800 = 2x retina karşılığı (veri.ts → kucukUrl). */
  const pinKapak = ilkFoto ? kucukUrl(medyaUrl(ilkFoto.yol), 800) : null;

  /* Yuvarlak köşe + gölge "çekmece havada duruyor" demek; tam ekranda
     yanlış olur. Sürüklerken kademeye değil ANLIK konuma bakıyoruz:
     tam ekrandan aşağı çekerken köşeler daha parmak yoldayken dönüyor. */
  const kenarli = cek ? cek.ust > CEKME_ESIGI : kademe === "yarim";

  return (
    <div
      ref={govde}
      role="dialog"
      aria-modal="true"
      aria-label={yer.ad}
      style={{
        top: cek ? cek.ust : kademe === "tam" ? 0 : `${YARIM_ORAN * 100}%`,
        transform: cek?.asagi ? `translateY(${cek.asagi}px)` : undefined,
      }}
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col bg-kagit ${
        cek == null || kapaniyor ? "transition-[top,transform] duration-300" : ""
      } ${kenarli ? "rounded-t-[14px] shadow-[0_-8px_24px_rgba(74,58,30,.18)]" : ""}`}
    >
      {/* Sürükleme alanı tutamak + başlık: 4 mm'lik çubuğu parmakla tam
          tutturmak zor, başlığı da çekilebilir yapınca hedef büyüyor.
          touch-action none olmasa tarayıcı bunu sayfa kaydırması sanardı. */}
      <div
        onPointerDown={cekmeBasla}
        onPointerMove={cekmeSurdur}
        onPointerUp={cekmeBitir}
        onPointerCancel={cekmeBitir}
        style={{ touchAction: "none" }}
        className="shrink-0"
      >
      {/* tutamak: dokunuş da kademeyi değiştirir (sürüklemek zorunda değilsin) */}
      <button
        /* Dokunuş/fare pointerup'ta ele alınıyor; burada yalnızca klavye var.
           preventDefault olmasa Enter ayrıca click üretip iki kez çevirirdi. */
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cevir(); }
        }}
        aria-label={kademe === "yarim" ? "Sayfayı genişlet" : "Sayfayı küçült"}
        aria-expanded={kademe === "tam"}
        title="Dokun ya da yukarı sürükle"
        className="w-full shrink-0 border-none bg-transparent px-0 pb-[3px] pt-[9px]"
      >
        <span className="mx-auto block h-1 w-[38px] rounded-full bg-gri-300" />
      </button>

      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-2.5">
        <div className="min-w-0">
          {/* Kademe A: mekan adı BÜYÜK + 800 + sıkı, önünde kategori emojisi. */}
          <h2 className="text-xl font-extrabold uppercase leading-tight tracking-siki">
            <span aria-hidden className="mr-1.5 font-normal tracking-normal">{emoji(yer.tur)}</span>
            {yer.ad}
          </h2>
          {/* Kademe B + durum RENGİ (dolu zemin değil, yalnızca metin). */}
          <div className="mt-1 text-xs lowercase text-gri-600">
            {(TUR_AD[yer.tur] ?? yer.tur).toLocaleLowerCase("tr")} · {yer.semt} ·{" "}
            {/* üç durumlu: saat bilgisi yoksa "kapalı" DEMİYORUZ */}
            {acik === null ? (
              <span>saat bilgisi yok</span>
            ) : (
              <span className={`font-semibold ${acik ? "text-acik" : "text-kapali"}`}>
                {acik ? "şu an açık" : "şu an kapalı"}
              </span>
            )}
          </div>
        </div>
        <button
          ref={kapatDugmesi}
          onClick={onKapat}
          aria-label="Kapat"
          data-cekme-disi
          className="grid size-8 shrink-0 place-items-center rounded-full border-none bg-yuzey text-base leading-none text-gri-700 shadow-kat-1"
        >
          ✕
        </button>
      </div>
      </div>

      <div ref={icerik} className={`min-h-0 flex-1 ${kademe === "yarim" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {/* ---- kapak: yalnızca serbest lisanslı referans görseli ---- */}
        {/* Kapak: önce en çok beğenilen pinin fotoğrafı, o yoksa Wikimedia
            referans görseli. Atıf yalnızca ikincisinde gösteriliyor —
            kullanıcının kendi fotoğrafı için kredi satırı anlamsız. */}
        {yer.kapak && (
          <figure className="relative m-0">
            {/* Ekranın TEK çıkartması (skill §6: ekran başına bir tane).
                Yalnızca gerçekten çok pinlenmiş yerlerde çıkıyor; her
                mekanda görünse vurgu olmaktan çıkardı. */}
            {(ozet?.pin_count ?? 0) >= 3 && (
              <Cikartma
                ust="popüler"
                alt={(TUR_AD[yer.tur] ?? yer.tur).toLocaleLowerCase("tr")}
                className="absolute -top-3 right-3 z-[2]"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kucukUrl(yer.kapak, 800)!}
              alt={yer.kapakKredi ? `${yer.ad} — Wikimedia Commons` : yer.ad}
              className="block h-[168px] w-full object-cover"
            />
            {yer.kapakKredi ? (
              /* CC-BY ailesi atfı GÖRÜNÜR yerde göstermeyi şart koşuyor */
              <figcaption className="bg-gri-50 px-4 py-1.5 text-2xs lowercase leading-snug text-gri-600">
                Görsel: {yer.kapakKredi}
              </figcaption>
            ) : (
              <figcaption className="bg-gri-50 px-4 py-1.5 text-2xs lowercase leading-snug text-gri-600">
                En çok beğenilen pinden
              </figcaption>
            )}
          </figure>
        )}

        {/* ---- uyarı: BRIEF kararı, hep en üstte ---- */}
        {yer.kunye?.uyari && (
          <div className="mx-4 mt-3.5 rounded-lg bg-[rgba(184,69,47,.09)] p-3 text-sm leading-snug shadow-kat-1">
            <strong className="mb-1 block text-2xs font-bold uppercase tracking-etiket text-kapali">
              Gitmeden önce
            </strong>
            {yer.kunye.uyari}
            {/* İmza şart: bu alanı giriş yapan herkes değiştirebiliyor.
                İmzasız olsa okuyan bir iddiaya kimin arkasında durduğunu
                bilemezdi. */}
            {imza && <span className="mt-1.5 block font-sayi text-2xs text-gri-500">{imza}</span>}
          </div>
        )}

        {/* ---- hızlı bakış ---- */}
        {ozet && ozet.pin_count > 0 && (
          <section className="mx-4 mt-3.5 rounded-lg bg-yuzey p-3.5 shadow-kat-1">
            <div className="mb-2 text-2xs font-bold uppercase tracking-etiket text-gri-700">
              Hızlı bakış
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sayi text-3xl font-semibold leading-none text-gri-900">
                {ozet.rating_avg?.toFixed(1) ?? "—"}
              </span>
              <span className="text-xs text-gri-600">/10 · {ozet.pin_count} pin</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gri-600">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
                <path d="M6 3.6h12v17l-6-4.2-6 4.2z" />
              </svg>
              <span className="italic"><b className="not-italic font-sayi text-gri-900">{yer.kaydeden}</b> kişi kaydetti</span>
            </div>
            {ozet.following_ids.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gri-600">
                <div className="flex -space-x-2">
                  {ozet.following_ids.slice(0, 4).map((k) => (
                    <Avatar key={k} kisi={k} boyut={24} sekil="daire" />
                  ))}
                </div>
                {/* Uygulamanın derlediği cümle → italik. Kullanıcının kendi
                    yazdığı notlar (aşağıdaki pin metinleri) DÜZ kalıyor; okuyan
                    kişi tek bakışta "bunu biri mi yazdı yoksa sayılardan mı
                    çıktı" ayrımını yapabilsin. Aynı kural Akis.tsx'te de var. */}
                <span className="italic">
                  Takip ettiklerinden <b className="not-italic text-gri-900">{ozet.following_ids.length}</b> kişi burayı pinledi
                </span>
              </div>
            )}
          </section>
        )}

        {/* ---- buraya bırakılanlar: tek tek, oklar kartın kenarlarında ---- */}
        <div ref={pinlerBasligi} className="mt-4 flex items-center justify-between px-4 pb-2.5">
          <div className="text-2xs font-bold uppercase tracking-etiket text-gri-700">
            Buraya bırakılanlar
          </div>
          {benimPinim && (
            <button
              onClick={() => onPinAt(yer)}
              className="rounded-full border-none bg-gri-50 px-2.5 py-1 text-2xs font-semibold lowercase text-gri-800"
            >
              + yine pin at
            </button>
          )}
          {!benimPinim && siraliPinler.length > 1 && (
            <span className="font-sayi text-xs text-gri-500">
              {pinIndex + 1}/{siraliPinler.length}
            </span>
          )}
        </div>

        {pin ? (
          <div className="relative mx-4 mb-4">
            <button
              onClick={() => onGonderiAc(pin.id, siraliPinler.map((p) => p.id))}
              /* Post-it değil kart: kraft kağıt, toplu iğne ve eğiklik
                 kalktı — akıştaki kartla aynı dil. */
              className="block w-full overflow-hidden rounded-lg border-none bg-yuzey p-0 text-left shadow-kat-1"
            >
              <div
                className="relative grid h-[132px] place-items-center overflow-hidden"
                style={{ background: fotoZemin(yer.tur) }}
              >
                {pinKapak ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pinKapak} alt="" className="size-full object-cover" />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: simgeSvg(yer.tur, 40, zeminSimgeRengi(yer.tur)) }} />
                )}
              </div>
              <div className="px-3 pb-3 pt-2.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <Avatar kisi={pin.kisi} boyut={22} sekil="daire" />
                  <span className="text-xs font-semibold">{kisiler[pin.kisi]?.ad ?? ""}</span>
                  <span className="font-sayi text-2xs text-gri-500">{zaman(pin.saat)}</span>
                  <span className="ml-auto font-sayi text-sm font-semibold text-gri-900">
                    {pin.puan}<span className="text-2xs font-normal text-gri-500">/10</span>
                  </span>
                </div>
                {/* İnsanın yazdığı not: DÜZ yazı (bkz. Akis.tsx'teki ayrım). */}
                {pin.metin.trim() && (
                  <p className="line-clamp-3 font-metin text-sm leading-snug text-gri-800">{pin.metin}</p>
                )}
              </div>
            </button>

            {siraliPinler.length > 1 && (
              <>
                <button
                  onClick={() => setPinIndex((i) => Math.max(0, i - 1))}
                  disabled={pinIndex === 0}
                  aria-label="Önceki pin"
                  className="absolute -left-1.5 top-1/2 z-[3] grid size-7 -translate-y-1/2 place-items-center rounded-full border-none bg-yuzey text-gri-800 shadow-kat-3 disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  onClick={() => setPinIndex((i) => Math.min(siraliPinler.length - 1, i + 1))}
                  disabled={pinIndex === siraliPinler.length - 1}
                  aria-label="Sonraki pin"
                  className="absolute -right-1.5 top-1/2 z-[3] grid size-7 -translate-y-1/2 place-items-center rounded-full border-none bg-yuzey text-gri-800 shadow-kat-3 disabled:opacity-30"
                >
                  ›
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="px-4 pb-4">
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

        {/* ---- künye ---- */}
        <div className="flex items-center justify-between px-4 pb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-700">
          Künye
          {ben ? (
            <button
              /* Çekmece de tam ekrana çıkıyor: form `absolute inset-0` ile
                 çekmecenin İÇİNDE duruyor, yarım kademede alanların yarısı
                 görünmüyordu. */
              onClick={() => { setKademe("tam"); setKunyeAcik(true); }}
              className="rounded-full border-none bg-gri-50 px-2.5 py-1 text-2xs font-semibold lowercase text-gri-800"
            >
              {yer.kunye ? "Düzenle" : "+ Künye ekle"}
            </button>
          ) : null}
        </div>
        <dl className="mx-4 mb-4 rounded-lg bg-yuzey px-3 py-1 shadow-kat-1">
          <Satir e="Pin" d={`${yer.pinSayisi ?? 0} kişi pinledi`} sayi />
          <Satir
            e="Bugün"
            sayi
            d={!yer.saatler ? "bilinmiyor" : bugun ? `${GUN_AD[t.getDay()]} ${bugun[1]}–${bugun[2]}` : "kapalı"}
          />
          {yer.adres && <Satir e="Adres" d={yer.adres} />}
          {yer.kunye?.rezervasyon && <Satir e="Rezervasyon" d={yer.kunye.rezervasyon} />}
          {ortancaFiyat != null && (
            <Satir
              e="Kişi başı"
              sayi
              d={`≈ ${ortancaFiyat} ₺ · ${fiyatlar.length} pinden`}
            />
          )}
          {yer.kunye?.enIyiSaat && <Satir e="En iyi saat" d={yer.kunye.enIyiSaat} />}
          {yer.kunye?.sadeceNakit && <Satir e="Ödeme" d="sadece nakit" />}
        </dl>
        {imza && (
          <p className="mx-4 -mt-2 mb-4 font-sayi text-2xs text-gri-500">{imza}</p>
        )}

        {/* ---- kelimeler ve puan dağılımı ---- */}
        {ozet && ozet.pin_count > 0 && (
          <>
            <section className="mx-4 mb-3.5 rounded-lg bg-yuzey p-3.5 shadow-kat-1">
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

            <section className="mx-4 mb-5 rounded-lg bg-yuzey p-3.5 shadow-kat-1">
              <div className="mb-2 text-2xs font-bold uppercase tracking-etiket text-gri-700">
                Kişisel puanlar
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-sayi text-2xl font-semibold leading-none">
                  {ozet.rating_avg?.toFixed(1) ?? "—"}
                </span>
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
                <ul className="mx-4 mb-5 list-none space-y-2 p-0">
                  {ozet.improvements.map((d, i) => (
                    <li key={i} className="rounded-lg bg-yuzey p-2.5 text-sm leading-snug shadow-kat-1">
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
      </div>

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

      {/* Çizgi yerine gölge ayırıyor; düğmeler de haritadaki ve akıştaki
          hap diline geçti — altın dolgu yerini mürekkebe bıraktı, renk artık
          pinlerde ve fotoğraflarda. */}
      <div className="flex shrink-0 gap-2 bg-yuzey p-3 shadow-[0_-1px_0_var(--cizgi-2),0_-6px_16px_rgba(60,50,35,.06)]">
        {/* Zaten pin attıysam düğme kendi pinimi açıyor. Yeni bir ziyaret için
            tekrar pin atmak hâlâ mümkün (şema aynı gün için tek pin diyor),
            ama o artık ana eylem değil — alttaki "yine pin at" bağlantısında. */}
        <button
          onClick={() =>
            !ben ? onGirisIste()
            : benimPinim ? onGonderiAc(benimPinim.id, siraliPinler.map((p) => p.id))
            : onPinAt(yer)
          }
          className="flex-1 rounded-full border-none bg-gri-900 px-3 py-3 text-sm font-semibold lowercase tracking-ui text-white"
        >
          {benimPinim ? "pinini aç" : "buraya pin at"}
        </button>
        <button
          onClick={async () => {
            if (!ben) return onGirisIste();
            const su = kayitli;
            setKayitYerel(!su);
            try { await kayitDegistir(yerId, su); }
            catch (e) { setKayitYerel(su); alert(e instanceof Error ? e.message : String(e)); }
          }}
          aria-pressed={kayitli}
          /* İKİNCİ siyah dolu eleman olmasın diye kaydedilmiş hâli de
             beyaz kalıyor, farkı rozet renginden alıyor (skill §3). */
          className={`flex-1 rounded-full border-none px-3 py-3 text-sm font-semibold lowercase tracking-ui ${
            kayitli ? "bg-rozet-nane text-rozet-nane-ink" : "bg-gri-50 text-gri-800"
          }`}
        >
          {kayitli ? "kaydettin ✓" : "kaydet"}
        </button>
      </div>
    </div>
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
