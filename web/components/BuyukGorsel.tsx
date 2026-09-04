"use client";

import { useEffect, useRef, useState } from "react";
import { medyaUrl } from "@/lib/veri";

/* Kırpma çerçevesinin oranı — akıştaki kartla (aspect-[0.8]) aynı. Kart
   object-cover ile kestiği için, kullanıcı burada ne çerçevelediyse ızgarada
   birebir o görünüyor; gönderi detayı object-contain olduğu için de tamamı
   sığıyor. Profil kartı 0.86, oradaki fark kılpayı. */
const ORAN = 0.8;
/* Kırpılmış dosyanın çıkış genişliği. 1080 telefon ekranı için fazlasıyla
   yeterli, dosyayı da şişirmiyor. */
const CIKIS_EN = 1080;
const EN_COK_YAKIN = 3;

/**
 * Büyütülmüş görsel + notu.
 *
 * 52px'lik küçük kutuda ne fotoğrafı görebiliyor ne de uzun bir notu rahat
 * yazabiliyordun. Burada görsel ekranın çoğunu kaplıyor ve not çok satırlı.
 * Not aynı state'i düzenliyor — kapatınca listede de güncel.
 *
 * `onKirp` verildiğinde fotoğraf sabit oranlı bir çerçevede duruyor:
 * sürükleyip yakınlaştırarak kadrajı kullanıcı seçiyor. Yüklenen fotoğraflar
 * her orandan geliyor, kartlar ise object-cover ile ortadan kesiyordu —
 * kadraj kullanıcının olmalı.
 */
export default function BuyukGorsel({
  kaynak, not, onNot, onKapat, notaOdaklan, onKirp,
}: {
  kaynak: { tip: "yol"; yol: string } | { tip: "dosya"; dosya: File };
  not: string;
  onNot: (v: string) => void;
  onKapat: () => void;
  /* Nota dokunularak açıldıysa imleç doğrudan not alanına gitsin. Görsele
     dokunularak açıldığında ODAKLANMIYOR: telefonda klavye açılıp görseli
     örterdi, oysa oraya bakmak için açtın. */
  notaOdaklan?: boolean;
  /* Kadraj onaylandığında kırpılmış dosyayı geri veriyor. Yüklenmiş bir
     medya için de çalışıyor — çağıran onu yeni dosya olarak koyup eskisini
     düşürüyor, yani kırpma yeniden yükleme demek. Video için verilmemeli. */
  onKirp?: (dosya: File) => void;
}) {
  const notAlani = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!notaOdaklan) return;
    const el = notAlani.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [notaOdaklan]);
  const video = kaynak.tip === "dosya" && kaynak.dosya.type.startsWith("video");
  /* Bağımlılık `kaynak` DEĞİL: çağıran onu satır içinde kuruyor, her
     render'da yeni nesne oluyordu. */
  const dosya = kaynak.tip === "dosya" ? kaynak.dosya : null;
  const yol = kaynak.tip === "yol" ? kaynak.yol : null;
  const yolUrl = yol !== null ? medyaUrl(yol) : null;
  const foto = dosya && !video ? dosya : null;

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  const kirpilabilir = !!onKirp && (!!foto || !!yolUrl);

  return (
    <div role="dialog" aria-modal="true" aria-label={kirpilabilir ? "Görseli kırp" : "Görseli büyüt"}
         /* Tamamen opak: %96'da bile altındaki krem form okunuyordu ve
            görselden dikkat çalıyordu. */
         className="absolute inset-0 z-[48] flex flex-col bg-[#0C0905]">
      <div className="flex shrink-0 items-center justify-between p-3">
        <span className="font-tabela text-[10.5px] uppercase tracking-[0.12em] text-white/45">
          {kirpilabilir ? "sürükle · büyüt küçült" : ""}
        </span>
        <button onClick={onKapat} aria-label="Kapat"
          className="size-[34px] rounded-sm border-none bg-white/15 text-[17px] leading-none text-white">
          ✕
        </button>
      </div>

      {kirpilabilir ? (
        <Kirpici dosya={foto} url={yolUrl} ad={foto ? foto.name : (yol ?? "foto")}
                 onKirp={onKirp!} onBitti={onKapat}
                 not={not} onNot={onNot} notAlani={notAlani} />
      ) : (
        <>
          <div className="grid min-h-0 flex-1 place-items-center px-4">
            {yolUrl || foto ? (
              <DosyaGorsel dosya={foto} url={yolUrl} className="max-h-full max-w-full rounded-sm object-contain" />
            ) : (
              <span className="font-tabela text-[12px] uppercase tracking-[0.12em] text-white/50">
                {video ? "video — önizleme yok" : "görsel yok"}
              </span>
            )}
          </div>
          <div className="shrink-0 p-4">
            <NotAlani not={not} onNot={onNot} alan={notAlani} />
            {/* "Tamam", "Kaydet" DEĞİL: bu ekran sunucuya hiçbir şey yazmıyor,
                yalnızca formdaki state'i düzenliyor. Asıl kayıt formun altındaki
                Paylaş/Kaydet ile oluyor — burada "Kaydet" yazsaydı kullanıcı pini
                kaydettiğini sanırdı. Sağ üstteki çarpı da aynı işi yapıyor ama
                "vazgeç" gibi okunuyordu; bitirdiğini söyleyen bir düğme gerekti. */}
            <button
              onClick={onKapat}
              className="mt-3 w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white"
            >
              Tamam
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Dosyanın nesne URL'ini `src` olarak BAĞLAMIYOR, efektte atıyor.
 *
 * useMemo'da üretilen URL StrictMode'da ölüyordu: efektler iki kez çalışıyor,
 * aradaki temizlik URL'i iptal ediyor, memo da yeniden hesaplamadığı için
 * görsel ölü bir blob'a bakıp kalıyor (naturalWidth 0). Efektte atanınca
 * ikinci tur yenisini kuruyor. State kullanılmıyor: setState burada fazladan
 * bir render turu açardı.
 */
function useDosyaSrc(dosya: File | null, ref: React.RefObject<HTMLImageElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !dosya) return;
    const u = URL.createObjectURL(dosya);
    el.src = u;
    /* Geri verilmezse seçilen her dosya sekme kapanana kadar bellekte kalır. */
    return () => URL.revokeObjectURL(u);
  }, [dosya, ref]);
}

function DosyaGorsel({
  dosya, url, className,
}: { dosya: File | null; url: string | null; className: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useDosyaSrc(dosya, ref);
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img ref={ref} src={url ?? undefined} alt="" className={className} />;
}

function NotAlani({
  not, onNot, alan,
}: { not: string; onNot: (v: string) => void; alan: React.RefObject<HTMLTextAreaElement | null> }) {
  return (
    <>
      <label className="mb-1.5 block font-tabela text-[11px] uppercase tracking-[0.12em] text-white/60">
        Bu görselin notu
      </label>
      <textarea
        ref={alan}
        value={not}
        onChange={(e) => onNot(e.target.value)}
        maxLength={120}
        rows={2}
        placeholder="İsteğe bağlı"
        className="w-full resize-none rounded-sm border border-white/20 bg-white/10 px-3 py-2.5 text-[14px] leading-snug text-white outline-none placeholder:text-white/40 focus:border-[#F2C879]"
      />
      <div className="mt-1 text-right font-sayi text-[10.5px] text-white/45">{not.length}/120</div>
    </>
  );
}

/**
 * Kadraj seçici — kaynağı ister seçilmiş dosya, ister yüklenmiş bir görsel.
 * Görsel çerçeveyi DAİMA dolduruyor: taban ölçek "kapla"
 * hesabı, kaydırma da çerçevenin dışına taşmayacak şekilde sınırlanıyor.
 * Böylece kırpılmış dosyada boş kenar çıkmıyor.
 */
function Kirpici({
  dosya, url, ad, onKirp, onBitti, not, onNot, notAlani,
}: {
  dosya: File | null;
  url: string | null;
  ad: string;
  onKirp: (d: File) => void;
  onBitti: () => void;
  not: string;
  onNot: (v: string) => void;
  notAlani: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const cerceve = useRef<HTMLDivElement>(null);
  const gorsel = useRef<HTMLImageElement>(null);
  /* Zemin: fotoğraf çerçeveyi doldurmadığında kalan boşluk. Düz renk yerine
     fotoğrafın bulanık kopyası — kart tam kanamalı duruyor ve boşluk kazara
     bırakılmış gibi görünmüyor. */
  const zemin = useRef<HTMLImageElement>(null);
  useDosyaSrc(dosya, gorsel);
  useDosyaSrc(dosya, zemin);
  const [olcu, setOlcu] = useState<{ en: number; boy: number } | null>(null);
  const [dogal, setDogal] = useState<{ en: number; boy: number } | null>(null);
  /* null = kullanıcı kaydırıcıya dokunmadı; varsayılan aşağıda TÜMÜ SIĞSIN
     olarak türetiliyor. Taban "çerçeveyi doldur" olduğu için başlangıçta
     geniş fotoğraflar ortadan dar bir dilim hâlinde görünüyordu. */
  const [yakinEl, setYakinEl] = useState<number | null>(null);
  /* null = kullanıcı henüz oynatmadı. Başlangıç kadrajı ORTA: sıfırdan
     başlayınca geniş bir fotoğrafın sol kenarı çerçeveleniyordu. Efektte
     ortalamak yerine türetiliyor, yoksa fazladan bir render turu gerekirdi. */
  const [kayEl, setKayEl] = useState<{ x: number; y: number } | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  /* Çerçeve genişliği ekrana göre değişiyor (dönme, klavye). ResizeObserver
     şart: tek seferlik ölçüm yatay/dikey çevirmede yanlış kalıyordu. */
  useEffect(() => {
    const el = cerceve.current;
    if (!el) return;
    const oku = () => setOlcu({ en: el.clientWidth, boy: el.clientHeight });
    oku();
    const go = new ResizeObserver(oku);
    go.observe(el);
    return () => go.disconnect();
  }, []);

  /* Taban ölçek "çerçeveyi doldur" (kapla). Kaydırıcının 1'i budur; altı
     fotoğrafı küçültüp tamamını çerçeveye sığdırıyor, üstü yakınlaştırıyor. */
  const taban = olcu && dogal ? Math.max(olcu.en / dogal.en, olcu.boy / dogal.boy) : 1;
  const sigdir = olcu && dogal ? Math.min(olcu.en / dogal.en, olcu.boy / dogal.boy) : 1;
  const enAz = sigdir / taban;
  const yakin = yakinEl ?? enAz;
  const en = dogal ? dogal.en * taban * yakin : 0;
  const boy = dogal ? dogal.boy * taban * yakin : 0;
  const kay = kayEl ?? (olcu ? { x: (olcu.en - en) / 2, y: (olcu.boy - boy) / 2 } : { x: 0, y: 0 });

  /* Görsel bir eksende çerçeveden KÜÇÜKSE o eksende sürüklenmiyor, ortada
     duruyor: sınır ters dönüp fotoğrafı kenara yapıştırıyordu. */
  const eksen = (kenar: number, olcu2: number, v: number) =>
    olcu2 <= kenar ? (kenar - olcu2) / 2 : Math.min(0, Math.max(kenar - olcu2, v));
  const sinirla = (x: number, y: number) => {
    if (!olcu) return { x, y };
    return { x: eksen(olcu.en, en, x), y: eksen(olcu.boy, boy, y) };
  };

  /* Yakınlaştırma çerçevenin ORTASINI sabit tutuyor; sol üstü sabit tutsaydı
     görsel kaydırıcıyı her oynatışta kayıyormuş gibi duruyordu. */
  const yakinDegis = (yeni: number) => {
    if (!olcu || !dogal) { setYakinEl(yeni); return; }
    const k = yeni / yakin;
    const x = olcu.en / 2 - (olcu.en / 2 - kay.x) * k;
    const y = olcu.boy / 2 - (olcu.boy / 2 - kay.y) * k;
    const yeniEn = dogal.en * taban * yeni;
    const yeniBoy = dogal.boy * taban * yeni;
    setYakinEl(yeni);
    setKayEl({ x: eksen(olcu.en, yeniEn, x), y: eksen(olcu.boy, yeniBoy, y) });
  };

  const surukle = useRef<{ x: number; y: number; kx: number; ky: number } | null>(null);
  const basla = (e: React.PointerEvent) => {
    /* Yakalama basarken alınıyor: bırakılırsa ilk hareket alttaki forma
       gidiyor ve sürükleme başlamıyor. */
    e.currentTarget.setPointerCapture(e.pointerId);
    surukle.current = { x: e.clientX, y: e.clientY, kx: kay.x, ky: kay.y };
  };
  const hareket = (e: React.PointerEvent) => {
    const s = surukle.current;
    if (!s) return;
    setKayEl(sinirla(s.kx + (e.clientX - s.x), s.ky + (e.clientY - s.y)));
  };
  const bitir = () => { surukle.current = null; };

  const uygula = async () => {
    const g = gorsel.current;
    if (!g || !olcu || !dogal) return;
    setCalisiyor(true);
    try {
      const tuval = document.createElement("canvas");
      tuval.width = CIKIS_EN;
      tuval.height = Math.round(CIKIS_EN / ORAN);
      const c = tuval.getContext("2d");
      if (!c) return;
      /* Ekrandaki çerçeveden çıkış boyutuna tek bir ölçek: görselin çerçeve
         içindeki yerleşimi neyse tuvalde de o. */
      const k = tuval.width / olcu.en;
      /* JPEG saydamlığı siyaha çeviriyor; PNG'den gelen boşluk için beyaz. */
      c.fillStyle = "#fff";
      c.fillRect(0, 0, tuval.width, tuval.height);
      /* Önce bulanık zemin — ekrandaki çerçevede ne görüyorsan o. Tuvali
         kaplayacak ölçek ayrıca hesaplanıyor: kadrajın ölçeğiyle çizilseydi
         fotoğraf küçükken zemin de boşluk bırakırdı. filter desteklenmezse
         (eski Safari) bulanıksız kaplama kalıyor, yine de boşluk çıkmıyor. */
      const zk = Math.max(tuval.width / dogal.en, tuval.height / dogal.boy) * 1.1;
      const ze = dogal.en * zk;
      const zb = dogal.boy * zk;
      c.save();
      c.filter = `blur(${Math.round(tuval.width / 26)}px)`;
      c.drawImage(g, (tuval.width - ze) / 2, (tuval.height - zb) / 2, ze, zb);
      c.restore();
      c.drawImage(g, kay.x * k, kay.y * k, en * k, boy * k);
      const parca: Blob | null = await new Promise((ver) =>
        tuval.toBlob((b) => ver(b), "image/jpeg", 0.86),
      );
      if (!parca) return;
      const cikisAdi = (ad.split("/").pop() ?? "foto").replace(/\.[^.]+$/, "") + ".jpg";
      onKirp(new File([parca], cikisAdi, { type: "image/jpeg" }));
      onBitti();
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <>
      <div className="min-h-0 flex-1 px-4 pb-2">
        <div
          ref={cerceve}
          onPointerDown={basla}
          onPointerMove={hareket}
          onPointerUp={bitir}
          onPointerCancel={bitir}
          style={{ aspectRatio: String(ORAN) }}
          /* touch-none: dokunmatikte tarayıcı kaydırması sürüklemeyi çalıyordu.
             mx-auto + max-h-full: uzun ekranda büyüsün, kısa ekranda taşmasın. */
          className="relative mx-auto max-h-full overflow-hidden rounded-sm bg-black/40 touch-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={zemin}
            crossOrigin={url ? "anonymous" : undefined}
            src={url ?? undefined}
            alt=""
            aria-hidden
            draggable={false}
            /* scale-110: bulanıklık kenarlarda saydamlaşıyor, biraz taşırınca
               çerçevenin köşelerinde açık şerit kalmıyor. */
            className="pointer-events-none absolute inset-0 size-full scale-110 select-none object-cover blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={gorsel}
            /* src'den ÖNCE: yüklenmiş bir görseli tuvale çizmek CORS izni
               istiyor, izinsiz yüklenen görsel tuvali kirletiyor ve toBlob
               SecurityError veriyor. Nitelik src'den sonra atanırsa istek
               çoktan izinsiz gitmiş oluyor. */
            crossOrigin={url ? "anonymous" : undefined}
            src={url ?? undefined}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const i = e.currentTarget;
              setDogal({ en: i.naturalWidth, boy: i.naturalHeight });
            }}
            style={{ width: en || undefined, height: boy || undefined, left: kay.x, top: kay.y }}
            className="absolute max-w-none select-none"
          />
        </div>
      </div>

      <div className="shrink-0 px-4">
        <div className="flex items-center gap-2.5">
          <span className="font-tabela text-[13px] leading-none text-white/50">−</span>
          <input
            type="range"
            aria-label="Yakınlaştır"
            min={enAz}
            max={EN_COK_YAKIN}
            step={0.01}
            value={yakin}
            onChange={(e) => yakinDegis(Number(e.target.value))}
            className="h-1 flex-1 appearance-none rounded-full bg-white/25 accent-[#F2C879]"
          />
          <span className="font-tabela text-[15px] leading-none text-white/50">+</span>
        </div>
      </div>

      <div className="shrink-0 p-4 pt-3">
        <NotAlani not={not} onNot={onNot} alan={notAlani} />
        {/* Kırpma burada yapılıyor ama hâlâ sunucuya bir şey yazılmıyor:
            dosya formun state'inde değişiyor, kayıt aşağıdaki Paylaş ile. */}
        <button
          onClick={uygula}
          disabled={!dogal || calisiyor}
          className="mt-3 w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40"
        >
          {calisiyor ? "Kırpılıyor…" : "Tamam"}
        </button>
      </div>
    </>
  );
}
