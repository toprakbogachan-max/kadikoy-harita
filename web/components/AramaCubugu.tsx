"use client";

/**
 * Üstte duran arama çubuğu.
 *
 * Arama eskiden alt menüde bir sekmeydi. Sorun şuydu: alt menü GEZİNME
 * çubuğu — "neredeyim" sorusunu yanıtlıyor. Arama ise bir yere gitmek
 * değil, bir şey BULMAK; haritanın üstünde durması gereken bir araç.
 * Sekme olduğu sürece kullanıcı haritadan çıkıp ayrı bir ekrana geçmek
 * zorundaydı ve arama, gezinmenin dördüncü durağı gibi görünüyordu.
 *
 * Bu gerçek bir input DEĞİL, düğme. Dokununca arama ekranı açılıyor ve
 * odak oradaki asıl alana gidiyor. Sebep: haritanın üstünde canlı bir
 * input tutmak, her tuşta sorgu atan bir ekranı harita katmanının içine
 * gömmek demekti; iki ayrı sonuç listesi (harita marker'ları ve arama
 * sonuçları) aynı anda yaşardı.
 *
 * Zemin BEYAZ, referanstaki gibi siyah değil: ekranda zaten iki koyu cam
 * baloncuk var (alt menü ve filtre çipi). Üçüncü bir koyu eleman
 * "en fazla iki siyah" kuralını kırar ve yüzen chrome'un geri çekilmiş
 * olması gereken kısmı öne çıkardı.
 */
export default function AramaCubugu({
  onAc,
  className = "",
}: {
  onAc: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onAc}
      aria-label="Ara"
      className={`flex w-full min-w-0 flex-1 items-center gap-2.5 rounded-full border-none bg-yuzey py-3 pl-3.5 pr-4 text-left shadow-kat-2 transition-transform duration-[160ms] ease-out active:scale-[.98] ${className}`}
    >
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.1" strokeLinecap="round"
        className="shrink-0 text-gri-600"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M16.2 16.2 21 21" />
      </svg>
      {/* Kademe B: arayüz küçük harf fısıldar. Metin dar ekranda taşmasın
          diye truncate — kesilse bile baştaki "yeni mekanlar" niyeti
          anlatıyor. */}
      <span className="truncate text-xs lowercase text-gri-600">
        yeni mekanlar, kişiler ve pinler için ara
      </span>
    </button>
  );
}
