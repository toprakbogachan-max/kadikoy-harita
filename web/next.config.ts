import type { NextConfig } from "next";

/* ============================================================
   Güvenlik başlıkları.

   Bu dosya boştu: uygulama hiçbir güvenlik başlığı göndermiyordu —
   ne CSP, ne çerçeveleme koruması, ne MIME koklama kapalı. Vercel
   yalnızca HSTS ekliyor, gerisi uygulamanın işi.

   NONCE KULLANILMIYOR — bilinçli. Next'in önerdiği nonce yöntemi her
   sayfayı dinamik render'a zorluyor (statik üretim ve CDN önbelleği
   kapanıyor). Bu uygulama tek sayfalık bir istemci uygulaması, sunucuda
   render edilecek veri yok; her isteği sunucuya çevirmek bedava değil.
   Bedeli: script-src'de 'unsafe-inline' kalıyor, yani CSP tek başına
   XSS'i durdurmuyor. Asıl XSS savunması başka yerde ve sağlam:
   innerHTML'e giren HTML'in tamamı lib/gorsel.ts'te üretiliyor ve
   içine yalnızca sayı, sabit palet rengi ve place_category ENUM'undan
   gelen anahtar giriyor — kullanıcı metni hiçbir zaman girmiyor.
   CSP'nin buradaki asıl kazancı diğer direktifler: nereye bağlanabildiği,
   kimin çerçeveleyebildiği, base-uri ve form hedefi.
   ============================================================ */

const gelistirme = process.env.NODE_ENV === "development";

/* Supabase host'u ortam değişkeninden geliyor, kodda sabit yazılı değil.
   Derleme anında okunuyor — Vercel'de de build sırasında tanımlı. */
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabase.replace(/^https:/, "wss:");

/* Haritanın konuştuğu tek host. Stil, karo, sprite ve glyph'lerin hepsi
   buradan geliyor (stil JSON'u doğrulandı — başka origin yok). */
const HARITA = "https://tiles.openfreemap.org";
/* Pin formundaki mekan araması — lib/haritadan.ts */
const PHOTON = "https://photon.komoot.io";

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `form-action 'self'`,
  /* Tıklama hırsızlığı: uygulama hiçbir yere gömülmüyor. */
  `frame-ancestors 'none'`,
  `frame-src 'none'`,
  /* 'unsafe-eval' yalnızca geliştirmede: React hata yığınını eval ile kuruyor. */
  `script-src 'self' 'unsafe-inline'${gelistirme ? " 'unsafe-eval'" : ""}`,
  /* React'in satır içi style'ları ve MapLibre'nin kendi stilleri için. */
  `style-src 'self' 'unsafe-inline'`,
  /* Yazı tipleri next/font ile kendi sunucumuzdan servis ediliyor.
     Haritanın glyph'leri font-src değil connect-src'den geçiyor (.pbf, XHR). */
  `font-src 'self'`,
  /* Kapak görselleri Wikimedia ve çeşitli kaynaklardan geliyor (places.cover_url),
     tek tek host yazmak kırılgan olurdu. img-src düşük riskli direktif. */
  `img-src 'self' data: blob: https:`,
  `media-src 'self' blob: ${supabase}`,
  /* MapLibre worker'ı public/maplibre/ altından ('self'); blob: yedek yol. */
  `worker-src 'self' blob:`,
  `child-src 'self' blob:`,
  `manifest-src 'self'`,
  [
    `connect-src 'self'`,
    supabase,
    supabaseWs,
    HARITA,
    PHOTON,
    /* Next'in geliştirme sunucusu HMR'ı websocket'le yapıyor. */
    gelistirme ? "ws: http://localhost:*" : "",
  ]
    .filter(Boolean)
    .join(" "),
  /* Geliştirmede yok: http://localhost'u https'e çevirip dev sunucusunu kırar. */
  gelistirme ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const nextConfig: NextConfig = {
  /* "X-Powered-By: Next.js" — sürüm parmak izi, kimseye faydası yok. */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          /* frame-ancestors'ın eski tarayıcılardaki karşılığı. */
          { key: "X-Frame-Options", value: "DENY" },
          /* Yüklenen dosyanın MIME türü ne diyorsa o — tarayıcı tahmin etmesin.
             Storage kovası herkese açık okunur, oradan gelen bir dosyanın
             HTML diye yorumlanması istemediğimiz tek şey. */
          { key: "X-Content-Type-Options", value: "nosniff" },
          /* Dışarı çıkan istekte tam yol gitmesin (mekan/pin kimlikleri yolda). */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* Konum ŞART (lib/konum.ts), gerisi kapalı. */
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          /* preload BİLEREK yok: preload listesine girmek geri alınamaz,
             alan adı kesinleşmeden taahhüt edilmez. */
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
