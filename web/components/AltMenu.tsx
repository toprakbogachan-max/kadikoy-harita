"use client";

import { useState } from "react";
import { useOturum } from "@/lib/oturum";
import Avatar from "./Avatar";
import KayanSecim from "./KayanSecim";
import IkonDugmesi from "./corner/primitives/IkonDugmesi";

export type Ekran = "harita" | "akis" | "ara" | "profil";

const IKON: Record<Ekran, React.ReactNode> = {
  harita: <path d="M9 4 3 6.4v13.2L9 17.2l6 2.4 6-2.4V4l-6 2.4zM9 4v13.2M15 6.4v13.2" />,
  /* Akış = insanlar, kart yığını değil.
     İki üst üste dikdörtgen "liste/haber akışı" diyordu; oysa buradaki
     akış bir içerik kuyruğu değil, TANIDIKLARININ nereye gittiği. İşaret
     de onu söylüyor: iki soyut figür — büyük olan önde, küçük olan
     arkada. Diğer ikisinin aksine ÇİZGİ değil DOLU: bir ikon değil bir
     damga, ve dolu olduğu için aktif/pasif farkını renk tek başına
     rahatça taşıyor. */
  akis: (
    <g fill="currentColor" stroke="none">
      <circle cx="8.5" cy="7.2" r="4.5" />
      <rect x="2.2" y="14" width="12.6" height="5.6" rx="2.8" />
      <circle cx="18.4" cy="9.4" r="2.9" />
      <rect x="15.4" y="15.2" width="6.4" height="4.4" rx="2.2" />
    </g>
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
  /* Sekme düğmeleri IkonDugmesi'ne ÇEVRİLMEDİ: renk geçişi bilerek 240ms
     (baloncuktan yavaş, aşağıdaki nota bak) ve primitif tek bir süre
     tokeni kullanıyor. Görünümü korumak primitif saflığından önce gelir. */
  const dugme = (e: Ekran) => (
    <button
      key={e}
      /* KayanSecim aktif kutuyu bu öznitelikle buluyor. */
      data-kayan={e}
      onClick={() => onGec(e)}
      aria-current={ekran === e ? "page" : undefined}
      aria-label={AD[e]}
      /* active:scale-95 — dokunulduğu an düğme hafifçe içeri basıyor.
         Baloncuk YOLA ÇIKARKEN parmağın altındaki düğmenin tepki vermesi,
         hareketin kullanıcının kendi dokunuşundan doğduğu hissini veriyor.
         Renk geçişi baloncuktan biraz yavaş (240ms): baloncuk varmadan
         yazı beyaza dönseydi bir an beyaz zeminde beyaz ikon kalırdı. */
      className={`grid size-11 place-items-center rounded-full border-none bg-transparent transition-[color,transform] duration-[240ms] ease-out active:scale-95 ${
        ekran === e ? "text-white" : "text-gri-500"
      }`}
    >
      {e === "profil" && ben ? (
        <span
          className="grid place-items-center rounded-full transition-shadow"
          /* Aktif hâlde halka beyaz: altındaki baloncuk siyah. */
          style={{ boxShadow: ekran === e ? "0 0 0 2px #fff" : "none" }}
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
      {/* Aktif sekme artık renk değil bir NESNE: buzlu cam baloncuk
          sekmeden sekmeye akıyor. Dört ayrı durum yerine tek taşınan durum.

          "Ara" bu kapsülden ÇIKTI (AramaCubugu). Alt menü "neredeyim"
          sorusunu yanıtlıyor; arama ise bir yere gitmek değil bir şey
          bulmak — haritanın üstünde duran bir araç. Arama ekranındayken
          hiçbir sekme aktif değil, baloncuk da soluyor: doğru, çünkü
          gerçekten bir sekmede değilsin. */}
      <KayanSecim
        aktif={ekran}
        className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-yuzey px-2 py-1.5 shadow-kat-3"
        baloncuk="baloncuk rounded-full"
      >
        {dugme("harita")}
        {dugme("akis")}
        {dugme("profil")}
      </KayanSecim>

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
            {/* Satırlar TEK bir kutunun içinde ayraç çizgisiyle bölünmüş
                değil, ARALIKLI ayrı beyaz kartlar. Referanstaki eylem
                sayfası (engelle / bildir / paylaş) böyle: her seçenek
                kendi kartında duruyor.

                Fark önemli, çünkü ayraç çizgisi "bunlar tek bir listenin
                parçaları" der; aralık ise "bunlar ayrı ayrı eylemler" —
                ikincisi doğru. Ayrıca skill §5'in "ayraç çizgisi yok,
                derinlik gölgeden gelir" kuralına uyan tek biçim bu. */}
            <div
              role="menu"
              className="absolute bottom-[60px] right-0 z-[46] flex w-[176px] flex-col gap-1.5"
            >
              {/* Kademe B: arayüz küçük harf. */}
              {([["pin at", onPinAt], ["liste oluştur", onListeOlustur]] as const).map(([ad, islem]) => (
                <button
                  key={ad}
                  role="menuitem"
                  onClick={() => { setAcik(false); islem(); }}
                  className="bas block w-full rounded-lg border-none bg-yuzey px-4 py-3 text-left text-sm font-semibold lowercase text-gri-900 shadow-kat-4"
                >
                  {ad}
                </button>
              ))}
            </div>
          </>
        )}
        {/* Ayrı duran "+" (skill §6: keşfet ile üret görsel olarak ayrılır).
            Açıkken 45° dönüp çarpıya dönüşüyor. */}
        <IkonDugmesi
          onTikla={() => setAcik((a) => !a)}
          okunur="Ekle"
          acik={acik}
          menuAcar
          boyut={52}
          sekil="daire"
          kat={3}
          className={`transition-transform duration-(--sure-gecis) ease-yumusak ${acik ? "rotate-45" : ""}`}
        >
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className="text-gri-900">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </IkonDugmesi>
      </div>
    </div>
  );
}
