"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Çekilebilir alt panel — A7 (+ tutamaç + duraklama noktaları).
 *
 * Envanter bölüm 6'nın 8 numaralı bulgusu: aynı panel üç FARKLI
 * yükseklikte yakalanmış, yani sürüklenebilir ve kilitlenen durakları var.
 * Bu, statik tasarımdan çıkmayan üç şeyden biri ve panelin "his"ini taşıyan
 * şey tam olarak bu — tek yükseklikte açılıp kapanan bir panel doğru
 * görünür ama ölü hisseder.
 *
 * Duraklar GÖRÜNÜR ORAN olarak veriliyor (kapsayıcı yüksekliğinin kesri):
 * 0.34 = panel ekranın üçte birini kaplıyor. Artan sırada olmaları gerekir;
 * bileşen kopyasını kendisi sıralıyor.
 *
 * Konumlandırma `top` yüzdesiyle: yükseklik ölçüp piksel yazmaya gerek
 * kalmıyor, kapsayıcı büyüyüp küçüldüğünde duraklar kendiliğinden doğru
 * yerde kalıyor. Sürükleme sırasında `translateY` biniyor — aynı anda iki
 * özelliğe yazmak, `top`u her karede güncellemekten ucuz.
 *
 * KAPSAYICI `position: relative` OLMAK ZORUNDA: panel `absolute` ve
 * yüksekliğini offsetParent'tan ölçüyor.
 */

export type PanelZemin = "iridesan" | "yuzey" | "kagit" | "cam";

const ZEMIN: Record<PanelZemin, string> = {
  iridesan: "iridesan",
  yuzey: "bg-yuzey",
  kagit: "bg-kagit",
  cam: "cam",
};

export interface PanelProps {
  children?: ReactNode;
  /** görünür oranlar, artan sırada. Varsayılan: küçük / yarım / neredeyse tam. */
  duraklar?: number[];
  /** dışarıdan yönetilen durak sırası; verilmezse panel kendi tutar. */
  durak?: number;
  onDurakDegis?: (sira: number) => void;
  baslangicDurak?: number;
  /** verilirse en alt duraktan aşağı çekmek paneli kapatır. */
  onKapat?: () => void;
  /** kapanma için en alt durağın altına inilmesi gereken piksel. */
  kapanmaEsigi?: number;
  tutamac?: boolean;
  zemin?: PanelZemin;
  kat?: 3 | 4 | 5;
  /** ekran okuyucu metni (aria-label) — görünen metin DEĞİL. Görünen metnin adı bu kütüphanede `etiket` (DENETIM-faz3 T16). */
  okunur?: string;
  /** panelin üstünde, tutamacın altında duran sabit bölüm (başlık satırı). */
  tepe?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function Panel({
  children,
  duraklar = [0.34, 0.66, 0.94],
  durak,
  onDurakDegis,
  baslangicDurak = 0,
  onKapat,
  kapanmaEsigi = 64,
  tutamac = true,
  zemin = "iridesan",
  kat = 5,
  okunur = "Panel",
  tepe,
  className = "",
  style,
}: PanelProps) {
  const sirali = [...duraklar].sort((a, b) => a - b);
  const [icDurak, setIcDurak] = useState(() => Math.min(baslangicDurak, sirali.length - 1));
  const aktif = Math.min(durak ?? icDurak, sirali.length - 1);

  const kutu = useRef<HTMLElement>(null);
  const bas = useRef<{ y: number; ust: number; yukseklik: number } | null>(null);
  const [kaydir, setKaydir] = useState(0);
  const [cekiliyor, setCekiliyor] = useState(false);

  const ustYuzde = (1 - sirali[aktif]) * 100;

  const durakSec = (sira: number) => {
    if (durak == null) setIcDurak(sira);
    onDurakDegis?.(sira);
  };

  const cekmeBasla = (e: React.PointerEvent) => {
    const el = kutu.current;
    const anne = el?.offsetParent as HTMLElement | null;
    if (!el || !anne) return;
    el.setPointerCapture(e.pointerId);
    bas.current = { y: e.clientY, ust: el.offsetTop, yukseklik: anne.clientHeight };
    setKaydir(0);
    setCekiliyor(true);
  };

  const cekmeSurdur = (e: React.PointerEvent) => {
    const b = bas.current;
    if (!b) return;
    /* Yukarı sınır EN YÜKSEK durak: panelin üstünde kalan bandı (harita,
       fotoğraf) yemesine izin vermiyoruz. Aşağıda sınır yok, çünkü aşağı
       çekmek kapatma jesti. */
    const enUst = (1 - sirali[sirali.length - 1]) * b.yukseklik;
    const dy = e.clientY - b.y;
    setKaydir(Math.max(enUst - b.ust, Math.min(b.yukseklik - b.ust, dy)));
  };

  const cekmeBitir = () => {
    const b = bas.current;
    if (!b) return;
    bas.current = null;
    setCekiliyor(false);
    const sonUst = b.ust + kaydir;
    setKaydir(0);

    const enAltUst = (1 - sirali[0]) * b.yukseklik;
    if (onKapat && sonUst > enAltUst + kapanmaEsigi) {
      onKapat();
      return;
    }
    /* En yakın durak: mesafeyi pikselde ölçüyoruz, oranla değil — oran
       farkı kısa panelde büyük, uzun panelde küçük bir yol demek. */
    let enYakin = 0;
    let enKisa = Infinity;
    sirali.forEach((oran, i) => {
      const fark = Math.abs((1 - oran) * b.yukseklik - sonUst);
      if (fark < enKisa) {
        enKisa = fark;
        enYakin = i;
      }
    });
    durakSec(enYakin);
  };

  /* Tutamaca dokunmak durakları sırayla geziyor: sürükleyemeyen (klavye,
     yardımcı teknoloji) kullanıcı için tek erişim yolu bu. Sondan başa
     dönüyor, yoksa en üstteki durakta düğme işlevsiz kalır. */
  const sonrakiDurak = () => durakSec((aktif + 1) % sirali.length);

  const enUstte = aktif === sirali.length - 1;

  return (
    <section
      ref={kutu}
      aria-label={okunur}
      className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl ${ZEMIN[zemin]} ${
        cekiliyor ? "" : "transition-[top,transform] duration-(--sure-panel) ease-yayli motion-reduce:transition-none"
      } ${className}`}
      style={{
        top: `${ustYuzde}%`,
        transform: kaydir ? `translateY(${kaydir}px)` : undefined,
        boxShadow: `var(--shadow-kat-${kat})`,
        ...style,
      }}
    >
      {/* Sürükleme alanı tutamacın kendisinden GENİŞ: 4 milimetrelik bir
          çubuğu parmakla tutturmak zor, üst şeridin tamamı çekiliyor.
          touchAction none olmasa tarayıcı bunu sayfa kaydırması sanar. */}
      <div
        onPointerDown={cekmeBasla}
        onPointerMove={cekmeSurdur}
        onPointerUp={cekmeBitir}
        onPointerCancel={cekmeBitir}
        style={{ touchAction: "none" }}
        className="shrink-0"
      >
        {tutamac && (
          <button
            type="button"
            onClick={sonrakiDurak}
            aria-label={enUstte ? "Paneli küçült" : "Paneli büyüt"}
            aria-expanded={enUstte}
            title="Dokun ya da sürükle"
            className="bas w-full border-none bg-transparent px-0 pb-1 pt-2.5"
          >
            <span className="mx-auto block h-1 w-[38px] rounded-full bg-gri-300" />
          </button>
        )}
        {tepe}
      </div>

      {/* En üstteki durakta içerik kayar, aşağıdakilerde kaymaz: yarım
          yükseklikteki bir panelin içinde ikinci bir kaydırma alanı,
          paneli aşağı çekmek isteyen parmağı yiyor. */}
      <div className={`min-h-0 flex-1 ${enUstte ? "overflow-y-auto" : "overflow-hidden"}`}>
        {children}
      </div>
    </section>
  );
}
