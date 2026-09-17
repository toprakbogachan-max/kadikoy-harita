"use client";

import Pill from "@/components/corner/primitives/Pill";

/**
 * B7 — `burada ara` hapı. Referansta `search here`.
 *
 * Envanter bölüm 6 madde 3: siyah (boşta) → MAVİ (çalışıyor), ikon
 * dönüyor. Bu, skill §14'ün "UI elemanını renklendirme" kuralının tek
 * istisnasının tam olarak yeri: mavi bu üründe "çalışıyor / burada ara"
 * için ayrıldı, kaydetmenin rengi nane. Yani buradaki mavi doğru ve
 * başka hiçbir yerde bu anlamı taşımıyor.
 *
 * Biçimin tamamı `Pill` primitifinden: `yukleniyor` yuvası zaten dönen
 * halkayı ikon yerine koyuyor.
 *
 * ── Metin çalışırken DEĞİŞMİYOR ────────────────────────────────────
 * Bilinçli. Etiket "aranıyor…"a dönseydi hap genişlik değiştirirdi ve
 * hareket bitince yerinden sıçrardı; referansta da yazı sabit, dönen
 * yalnızca ikon. Büyüteç ile dönen halka aynı ölçüde (14px), böylece
 * geçişte tek değişen şey renk.
 *
 * Durum değişimini ekran okuyucuya yazı taşımadığı için `aria-label`
 * taşıyor (Pill `etiket`i oraya bağlıyor), `aria-busy` da Pill'den
 * geliyor.
 *
 * ⚠ SAF SUNUM: ne zaman görüneceğine, neyi arayacağına ve sonucu kime
 * vereceğine çağıran karar verir. Bileşen sorgu çalıştırmaz.
 */

/* Büyüteç — dönen halkayla AYNI kutuda (14px), yoksa geçişte hap
   genişliği oynar. */
function Buyutec() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="m15.5 15.5 4.4 4.4" />
    </svg>
  );
}

export interface BuradaAraProps {
  /** ağ isteği sürüyor: hap maviye döner, ikon yerine halka döner. */
  calisiyor?: boolean;
  onTikla?: () => void;
  /** giriş yok / demo hesap gibi durumlarda. */
  pasif?: boolean;
  /**
   * Etiket. Varsayılan marka sesiyle ve küçük harf (Kademe B). Değişirse
   * `calisiyor` hâlinde de aynısı kalır — genişlik oynamasın diye.
   */
  metin?: string;
  /**
   * Harita durunca beliriyorsa girişi de olsun: kademeli beliriş
   * (globals `.belir`, hareket azaltmada kapalı).
   */
  belir?: boolean;
  className?: string;
}

export default function BuradaAra({
  calisiyor = false,
  onTikla,
  pasif = false,
  metin = "burada ara",
  belir = false,
  className = "",
}: BuradaAraProps) {
  return (
    <Pill
      ikon={<Buyutec />}
      /* Çalışırken `pasif` VERMİYORUZ: Pill'de pasif = opacity .45 ve
         solmuş bir mavi "çalışıyor" değil "kapalı" okunur. Tıklamayı
         geri çağrıyı kaldırarak susturuyoruz; `aria-busy` zaten var. */
      onTikla={calisiyor ? undefined : onTikla}
      pasif={pasif}
      dolgu={calisiyor ? "mavi" : "siyah"}
      yukleniyor={calisiyor}
      /* Haritanın üstünde yüzen en üst katman (skill §5, kademe 3). */
      kat={3}
      etiket={calisiyor ? "aranıyor" : metin}
      className={`${belir ? "belir" : ""} ${className}`.trim()}
    >
      {metin}
    </Pill>
  );
}
