"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Kayan geçiş — sekme değişince içerik baloncuğun GİTTİĞİ YÖNE akar.
 *
 * Sorun: KayanSecim baloncuğu soldan sağa akıyor ama altındaki ekran
 * anında takas oluyordu. Göz baloncuğu takip edip aşağı indiğinde orada
 * hiçbir hareket bulamıyor; iki ayrı olay gibi duruyor. Referansta
 * baloncuk sağa giderken EKRAN DA sağdan geliyor — tek bir hareket.
 *
 * YÖN NEREDEN GELİYOR
 * `sira` sekmelerin soldan sağa dizilişi. Yeni anahtarın indeksi eskisinden
 * büyükse sağa gidiliyor demektir ve içerik SAĞDAN girer. Dizide olmayan
 * bir anahtara geçişte yön yok, yalnızca soluyor.
 *
 * NEDEN ÇIKIŞ ANİMASYONU YOK
 * Giden içeriği de animasyonla uğurlamak için iki ağacı aynı anda DOM'da
 * tutmak gerekiyor; bu, harita gibi ağır çocuklarda ikinci bir MapLibre
 * örneği demek. Sekme geçişinde yalnızca GELENİ oynatmak yaygın çözüm ve
 * gözün takip ettiği şey zaten gelen.
 *
 * Zamanlama KayanSecim'den alındı — ikisi aynı anda koştuğu için eğrileri
 * de aynı olmalı, yoksa baloncuk ve ekran farklı hızlarda gidiyor.
 */
export default function KayanGecis({
  anahtar,
  sira,
  className = "",
  mesafe = 26,
  dikeyler = [],
  dikeyMesafe = 72,
  children,
}: {
  /** Şu anki sekme. Değişince animasyon koşar. */
  anahtar: string;
  /** Sekmelerin soldan sağa sırası — yatay yön bundan türer. */
  sira: readonly string[];
  className?: string;
  /** Kaç piksel yandan gelsin. Tam ekran geçişte biraz daha cömert. */
  mesafe?: number;
  /**
   * AŞAĞIDAN YUKARI açılan ekranlar.
   *
   * Sekmeler birbirinin yanında durur, bu yüzden yatay akarlar. Ama bazı
   * ekranlar sekme değil, üstüne ÇIKAN bir katmandır (arama). Onlar
   * yandan değil aşağıdan gelir — iOS'ta "modal sunum" ile "itme" arasındaki
   * ayrımın aynısı: yatay "yanındaki yere geçtim", dikey "üstüne bir şey
   * açtım" demek.
   */
  dikeyler?: readonly string[];
  /** Dikey açılışta kaç piksel aşağıdan gelsin — yatayda olduğundan cömert,
      çünkü hareket "yükselme" hissi vermek zorunda. */
  dikeyMesafe?: number;
  children: React.ReactNode;
}) {
  const kap = useRef<HTMLDivElement>(null);
  /* İlk yerleşimde animasyon YOK: ekran açılışta yandan kaymamalı,
     kullanıcı bir yere geçmedi. */
  const onceki = useRef<string | null>(null);

  useLayoutEffect(() => {
    const k = kap.current;
    const o = onceki.current;
    onceki.current = anahtar;
    if (!k || o === null || o === anahtar) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Üç durum var ve sırası önemli:
       1. Hedef dikey bir katmansa → AŞAĞIDAN yükselir.
       2. Dikey bir katmandan ÇIKILIYORSA → yön yok, yalnızca beliriyor.
          Altındaki ekran zaten oradaydı; onu yandan kaydırmak "yeni bir
          yere gittim" der, oysa kullanıcı örtüyü kapattı.
       3. Geri kalan her şey → sekme sırasına göre yatay. */
    const dikeyGiris = dikeyler.includes(anahtar);
    const dikeyCikis = dikeyler.includes(o);

    const kare = dikeyGiris
      ? [
          { transform: `translateY(${dikeyMesafe}px)`, opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ]
      : dikeyCikis
        ? [{ opacity: 0.4 }, { opacity: 1 }]
        : (() => {
            const a = sira.indexOf(o);
            const b = sira.indexOf(anahtar);
            /* Biri dizide yoksa yön uydurmuyoruz; yalnızca beliriyor. */
            const yon = a < 0 || b < 0 || a === b ? 0 : b > a ? 1 : -1;
            return [
              { transform: `translateX(${yon * mesafe}px)`, opacity: 0.35 },
              { transform: "translateX(0)", opacity: 1 },
            ];
          })();

    k.animate(kare, {
      /* Dikey açılış biraz uzun: yol daha uzun, aynı sürede koşarsa
         fırlatılmış gibi duruyor. */
      duration: dikeyGiris ? 400 : 340,
      /* KayanSecim'in varış eğrisi: hafif aşma, "oturma" hissi. */
      easing: "cubic-bezier(.22,1.18,.36,1)",
      fill: "both",
    });
  }, [anahtar, sira, mesafe, dikeyler, dikeyMesafe]);

  return (
    <div ref={kap} className={className}>
      {children}
    </div>
  );
}
