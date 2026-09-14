"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Kayan seçim baloncuğu — sekmeler ve çipler arasında akan aktif durum.
 *
 * Sorun: aktif sekme yalnızca renk değiştiriyordu. Bir düğmeden diğerine
 * geçerken ekranda hiçbir şey HAREKET etmiyordu; kullanıcı seçimin nereden
 * nereye gittiğini değil yalnızca sonucunu görüyordu. Apple'ın segmented
 * control'ü bunu tek bir baloncuğu taşıyarak çözüyor: seçim bir nesne,
 * her düğmenin ayrı bir durumu değil.
 *
 * ÇALIŞMA BİÇİMİ
 * Baloncuk tek bir mutlak konumlu kutu. Aktif çocuk `data-kayan` ile
 * bulunuyor, ölçülüyor (offsetLeft/Top/Width/Height) ve baloncuk oraya
 * taşınıyor. Çocuklar hiç değişmiyor — yalnızca metin rengi geçiyor.
 *
 * NEDEN CSS transition DEĞİL, Web Animations API
 * Düz bir transition baloncuğu katı bir dikdörtgen gibi kaydırır. Buradaki
 * his "sıvı": baloncuk yola çıkarken hedefe doğru UZUYOR, varınca toparlanıyor
 * (squash & stretch). Bunun için yolun ortasında üçüncü bir kare gerekiyor ve
 * ara kare CSS transition'la ifade edilemiyor.
 *
 * Uzama miktarı mesafeyle orantılı: yan yana iki sekme arasında neredeyse
 * fark edilmiyor, şeridin bir ucundan diğerine giderken belirgin. Sabit bir
 * değer verilseydi kısa geçişte abartılı, uzun geçişte cılız kalırdı.
 *
 * transform-origin SOL: translateX + scaleX birlikte kullanılıyor ve sol
 * köşe sabitken kutu [x, x + w·s] aralığını kaplıyor — merkez origin'de
 * ikisini birlikte hesaplamak gereksiz yere zor.
 */
export default function KayanSecim({
  aktif,
  className = "",
  baloncuk = "",
  gerilme = 0.62,
  children,
}: {
  /** Aktif çocuğun `data-kayan` değeri. Eşleşen çocuk yoksa baloncuk soluyor. */
  aktif: string;
  /** Kapsayıcının kendi sınıfları (kapsül zemini, boşluk, gölge…). */
  className?: string;
  /** Baloncuğun sınıfları — dolgu rengi, yarıçap, gölge. */
  baloncuk?: string;
  /**
   * Yol ortasındaki uzama miktarı (0 = hiç uzamaz, düz kayar).
   *
   * Düğmeler BİTİŞİKSE ve zeminleri saydamsa (alt menü kapsülü) baloncuk
   * yayıldıkça sıvı gibi görünüyor. Ama filtre şeridinde çipler ayrı ayrı
   * duruyor ve her birinin kendi beyaz zemini var: uzayan baloncuk
   * komşularının ARKASINDA kalıp dilimleniyor, akmak yerine parçalanmış
   * görünüyordu. Orada uzama kısılıyor, baloncuk çiplerin arkasından
   * bütün hâlde geçiyor.
   */
  gerilme?: number;
  children: React.ReactNode;
}) {
  const kap = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLSpanElement>(null);
  /* Bir önceki kutu: ilk yerleşimde animasyon YOK (baloncuk yerine ışınlanır),
     sonraki her değişimde var. Açılışta ekranın solundan kayarak gelmesi
     sahte bir hareket olurdu — seçim zaten oradaydı. */
  const onceki = useRef<{ x: number; y: number; g: number; y2: number } | null>(null);

  useLayoutEffect(() => {
    const k = kap.current;
    const b = top.current;
    if (!k || !b) return;

    const hedef = k.querySelector<HTMLElement>(`[data-kayan="${CSS.escape(aktif)}"]`);
    if (!hedef) {
      /* Seçim bu gruptan çıktı (ör. filtre ikinci satırdan seçildi).
         Baloncuğu siliyoruz ama konumunu unutmuyoruz: geri dönerse
         oradan devam etsin. */
      b.style.opacity = "0";
      return;
    }

    const kutu = {
      x: hedef.offsetLeft,
      y: hedef.offsetTop,
      g: hedef.offsetWidth,
      y2: hedef.offsetHeight,
    };
    const o = onceki.current;
    onceki.current = kutu;

    /* Genişlik ve yükseklik anında yazılıyor; hareketi scaleX taşıyor.
       Böylece animasyonun sonunda düzeltme gerekmiyor. */
    b.style.width = `${kutu.g}px`;
    b.style.height = `${kutu.y2}px`;
    b.style.opacity = "1";
    b.style.transform = `translate(${kutu.x}px, ${kutu.y}px)`;

    const azalt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* İlk yerleşim, hareket azaltma tercihi, ya da kutu hiç değişmediyse
       (yeniden ölçüm) animasyon yok. */
    if (!o || azalt || (o.x === kutu.x && o.g === kutu.g && o.y === kutu.y)) return;

    const m0 = o.x + o.g / 2;
    const m1 = kutu.x + kutu.g / 2;
    const mesafe = Math.abs(m1 - m0);

    /* Ortadaki uzamış kare: iki kutunun arasını kapatıyor ama tamamını
       değil — tamamını kapatsa baloncuk kaymak yerine yayılıp toplanıyor
       gibi görünüyor. */
    const sinir = Math.max(o.x + o.g, kutu.x + kutu.g) - Math.min(o.x, kutu.x);
    const ortaG = Math.min(Math.max(o.g, kutu.g) + mesafe * gerilme, sinir);
    const ortaX = (m0 + m1) / 2 - ortaG / 2;
    const ortaY = (o.y + kutu.y) / 2;

    /* Süre mesafeyle büyüyor ama tavanı var: uzun bir şeritte sabit süre
       fırlatılmış gibi, uzun süre ise bekletiyor. */
    const sure = Math.min(520, 300 + mesafe * 0.42);

    b.animate(
      [
        {
          transform: `translate(${o.x}px, ${o.y}px) scaleX(${o.g / kutu.g}) scaleY(${o.y2 / kutu.y2})`,
          /* Çıkışta hızlanma; yayılma bu kareden sonra başlıyor. */
          easing: "cubic-bezier(.45,.05,.3,1)",
        },
        {
          transform: `translate(${ortaX}px, ${ortaY}px) scaleX(${ortaG / kutu.g}) scaleY(1)`,
          offset: 0.45,
          /* Varışta hafif aşma — baloncuğun "oturması" bu eğriden geliyor. */
          easing: "cubic-bezier(.22,1.18,.36,1)",
        },
        { transform: `translate(${kutu.x}px, ${kutu.y}px) scaleX(1) scaleY(1)` },
      ],
      { duration: sure, fill: "none" },
    );
  }, [aktif, gerilme]);

  /* Şerit kayınca, yazı tipi geç yüklenince ya da pencere yeniden
     boyutlanınca ölçüler değişiyor; baloncuk yerinde kalıp düğmelerin
     yanından kayıyordu. Yeniden ölçüm animasyonsuz (yukarıdaki kutu
     karşılaştırması sayesinde) — kullanıcı bir şeye basmadı. */
  useEffect(() => {
    const k = kap.current;
    if (!k || typeof ResizeObserver === "undefined") return;
    const olc = () => {
      const b = top.current;
      const hedef = k.querySelector<HTMLElement>(`[data-kayan="${CSS.escape(aktif)}"]`);
      if (!b || !hedef) return;
      onceki.current = {
        x: hedef.offsetLeft, y: hedef.offsetTop,
        g: hedef.offsetWidth, y2: hedef.offsetHeight,
      };
      b.style.width = `${hedef.offsetWidth}px`;
      b.style.height = `${hedef.offsetHeight}px`;
      b.style.transform = `translate(${hedef.offsetLeft}px, ${hedef.offsetTop}px)`;
    };
    const g = new ResizeObserver(olc);
    g.observe(k);
    for (const c of Array.from(k.children)) g.observe(c);
    return () => g.disconnect();
  }, [aktif]);

  return (
    /* Çocuklara `relative z-[1]`: baloncuk mutlak konumlu olduğu için
       konumlanmamış kardeşlerinin ÜSTÜNE boyanır ve ikonları örterdi. */
    <div ref={kap} className={`relative [&>button]:relative [&>button]:z-[1] ${className}`}>
      <span
        ref={top}
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-0 origin-left ${baloncuk}`}
        style={{ opacity: 0, transition: "opacity .18s" }}
      />
      {children}
    </div>
  );
}
