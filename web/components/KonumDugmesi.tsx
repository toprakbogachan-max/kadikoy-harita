"use client";

import { useEffect, useState } from "react";
import { KONUM_MESAJI, type Konum, type KonumDurumu } from "@/lib/konum";

interface Props {
  durum: KonumDurumu;
  konum: Konum | null;
  kadikoyDisinda: boolean;
  onIste: () => void;
  onGit: () => void;
  onKapat: () => void;
}

/**
 * Haritadaki "konumum" düğmesi ve durum şeridi.
 *
 * İzni açılışta İSTEMİYORUZ. Uygulamayı ilk açan birine hemen konum sormak,
 * ne işe yarayacağını anlamadan reddetmesine yol açıyor — reddedilen izni
 * geri almak tarayıcı ayarlarından gerektiği için de bir daha sorulamıyor.
 * Kullanıcı düğmeye basınca soruyoruz.
 */
export default function KonumDugmesi({
  durum, konum, kadikoyDisinda, onIste, onGit, onKapat,
}: Props) {
  /* Bilgi/hata şeridi birkaç saniye görünüp kayboluyor — haritanın üstünde
     kalıcı kutu tutmak ekranı daraltıyor.

     Görünürlük ayrı bir state DEĞİL, türetiliyor: "bu durumun mesajı
     gizlendi mi" saklanıyor. Durum değişince gizleme sıfırlanıyor. Efektte
     senkron setState çağırmak (React'in uyardığı basamaklı render) böylece
     gerekmiyor — efektin tek işi zamanlayıcı. */
  const [gizlenen, setGizlenen] = useState<KonumDurumu | null>(null);
  const [oncekiDurum, setOncekiDurum] = useState(durum);
  if (oncekiDurum !== durum) {
    setOncekiDurum(durum);
    setGizlenen(null);
  }
  const mesajGorunur =
    durum !== "kapali" && durum !== "acik" && gizlenen !== durum;

  useEffect(() => {
    if (!mesajGorunur) return;
    const z = setTimeout(() => setGizlenen(durum), 6000);
    return () => clearTimeout(z);
  }, [mesajGorunur, durum]);

  const acik = durum === "acik" && !!konum;
  const mesaj = KONUM_MESAJI[durum];

  return (
    <>
      {(mesajGorunur && mesaj) || kadikoyDisinda ? (
        <div className="absolute inset-x-4 top-3.5 z-[3] rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-center text-[12.5px] leading-snug shadow-kagit2">
          {kadikoyDisinda
            ? "Kadıköy dışındasın — harita burada kalıyor, uygulama şimdilik yalnızca Kadıköy'ü kapsıyor."
            : mesaj}
        </div>
      ) : null}

      <button
        onClick={acik ? onGit : onIste}
        onDoubleClick={acik ? onKapat : undefined}
        aria-label={acik ? "Konumuma git" : "Konumumu göster"}
        aria-pressed={acik}
        title={
          acik
            ? `Konumuma git${konum ? ` (±${Math.round(konum.dogruluk)} m)` : ""} · çift dokunuş kapatır`
            : "Konumumu göster"
        }
        className={`absolute bottom-3 right-3 z-[3] grid size-10 place-items-center rounded-full border border-[var(--cizgi)] shadow-kagit2 ${
          acik ? "bg-[#2F6FB8] text-white" : "bg-yuzey text-murekkep"
        } ${durum === "isteniyor" ? "animate-pulse" : ""}`}
      >
        {/* nişangâh — konum düğmelerinin yerleşik dili */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.9" strokeLinecap="round">
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="12" cy="12" r="8" opacity=".55" />
          <path d="M12 1.6v2.6M12 19.8v2.6M22.4 12h-2.6M4.2 12H1.6" />
        </svg>
      </button>
    </>
  );
}
