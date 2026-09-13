"use client";

import { useState } from "react";
import { useOturum } from "@/lib/oturum";
import Avatar from "./Avatar";

export type Ekran = "harita" | "akis" | "ara" | "profil";

const IKON: Record<Ekran, React.ReactNode> = {
  harita: <path d="M9 4 3 6.4v13.2L9 17.2l6 2.4 6-2.4V4l-6 2.4zM9 4v13.2M15 6.4v13.2" />,
  akis: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="1.6" />
      <rect x="3.5" y="14" width="17" height="6" rx="1.6" />
    </>
  ),
  ara: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.2 16.2 21 21" />
    </>
  ),
  profil: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </>
  ),
};

const AD: Record<Ekran, string> = { harita: "Harita", akis: "Akış", ara: "Ara", profil: "Profil" };

/**
 * Kenardan kenara bar değil, ortada yüzen kapsül + ayrı "+" düğmesi.
 *
 * Ayrım kasıtlı: kapsüldeki dört sekme GEZİNME (keşfet), yanındaki daire
 * ÜRETME (ekle). İkisi aynı çubukta dururken "+" beşinci bir sekme gibi
 * okunuyordu. Ayırınca ekleme eylemi sekmelerin dışına çıkıyor.
 *
 * Etiket yazıları kalktı: ikon + aktif renk yeterli, ve yazısız kapsül
 * haritanın üstünde çok daha az yer örtüyor. Ad'lar aria-label'da duruyor,
 * ekran okuyucu için bilgi kaybı yok.
 *
 * Yerleşim: page.tsx'te çerçevenin en altına MUTLAK konumlanıyor, akışta yer
 * kaplamıyor — bu yüzden harita kapsülün altına kadar uzuyor. Kapladığı
 * dikey alan ~72px; filtre şeridi ve MapLibre atfı buna göre yukarı
 * kaydırıldı (page.tsx ve globals.css).
 */
export default function AltMenu({
  ekran,
  onGec,
  onPinAt,
  onListeOlustur,
}: {
  ekran: Ekran;
  onGec: (e: Ekran) => void;
  onPinAt: () => void;
  onListeOlustur: () => void;
}) {
  /* Artı düğmesi tek işe bağlıydı (pin at). Liste oluşturma ise Ayarlar'ın
     ya da profilin içinde kalıyordu; "bir şey ekle" niyetiyle artıya basan
     kullanıcı listeye ulaşamıyordu. Artık iki seçenek sunuyor. */
  const [acik, setAcik] = useState(false);
  /* Profil sekmesi ikon değil KULLANICININ KENDİ AVATARI (skill §6).
     Dört soyut ikonun arasında tek kişisel eleman: "burası sensin".
     Giriş yapılmamışsa ikona düşüyor — boş bir avatar anlamsız. */
  const { ben } = useOturum();
  const dugme = (e: Ekran) => (
    <button
      key={e}
      onClick={() => onGec(e)}
      aria-current={ekran === e ? "page" : undefined}
      aria-label={AD[e]}
      className={`grid size-11 place-items-center rounded-full border-none bg-transparent transition-colors ${
        ekran === e ? "text-gri-900" : "text-gri-400"
      }`}
    >
      {e === "profil" && ben ? (
        <span
          className="grid place-items-center rounded-full transition-shadow"
          style={{ boxShadow: ekran === e ? "0 0 0 2px var(--color-gri-900)" : "none" }}
        >
          <Avatar kisi={ben.id} boyut={24} sekil="daire" />
        </span>
      ) : (
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          /* Aktif sekme yalnızca renkle değil çizgi kalınlığıyla da ayrılıyor —
             renk körlüğünde tek başına ton farkı zayıf kalıyor. */
          strokeWidth={ekran === e ? 2.2 : 1.7}
          strokeLinecap="round" strokeLinejoin="round"
        >
          {IKON[e]}
        </svg>
      )}
    </button>
  );

  /* z-10: haritanın ve filtre çiplerinin (z-[4]) ÜSTÜNDE ama tam ekran
     katmanların ALTINDA. Giriş, Ayarlar, Bildirimler, Arşiv gibi ekranlar
     z-40 ve `inset-0` ile çerçeveyi kaplıyor; menü onlardan yüksek olursa
     giriş formunun üstünde yüzen bir gezinme çubuğu kalırdı. */
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2.5 px-4 pb-3">
      <nav className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-yuzey px-2 py-1.5 shadow-kat-3">
        {dugme("harita")}
        {dugme("akis")}
        {dugme("ara")}
        {dugme("profil")}
      </nav>

      <div className="pointer-events-auto relative shrink-0">
        {acik && (
          <>
            {/* Perde: dışarı dokununca kapansın. Menünün altında ama sayfanın
                üstünde durması gerekiyor, o yüzden sabit konumlu. */}
            <button
              onClick={() => setAcik(false)}
              aria-label="Kapat"
              className="fixed inset-0 z-[45] border-none bg-transparent"
            />
            <div
              role="menu"
              className="absolute bottom-[60px] right-0 z-[46] w-[176px] overflow-hidden rounded-lg bg-yuzey shadow-kat-4"
            >
              {/* Kademe B: arayüz küçük harf. */}
              {([["pin at", onPinAt], ["liste oluştur", onListeOlustur]] as const).map(([ad, islem]) => (
                <button
                  key={ad}
                  role="menuitem"
                  onClick={() => { setAcik(false); islem(); }}
                  className="block w-full border-none border-b border-[var(--cizgi-2)] bg-transparent px-4 py-3 text-left text-sm font-semibold lowercase text-gri-900 last:border-0"
                >
                  {ad}
                </button>
              ))}
            </div>
          </>
        )}
        <button
          onClick={() => setAcik((a) => !a)}
          aria-label="Ekle"
          aria-expanded={acik}
          aria-haspopup="menu"
          className="grid size-[52px] place-items-center rounded-full border-none bg-yuzey shadow-kat-3 transition-transform"
          style={{ transform: acik ? "rotate(45deg)" : undefined }}
        >
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className="text-gri-900">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
