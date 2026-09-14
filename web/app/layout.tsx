import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Karla, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Plus Jakarta Sans arayüzün sesi (Kademe A/B/C), Karla İNSANIN yazdığı
   metin (pin notları, yorumlar, bio), JetBrains Mono sayılar. Oswald ve
   Kalam mantar pano metaforuyla birlikte düştü.
   latin-ext alt kümesi Türkçe karakterler için şart.

   INTER'DEN NEDEN ÇIKILDI: Inter bilinçli olarak NÖTR bir arayüz fontu —
   işi kendini belli etmemek. Corner'ın sesi ise tam tersi: geniş, yuvarlak,
   geometrik ve ağır; "places", "Caffeine" gibi kısa etiketler bile bir
   karaktere sahip. Nötr bir grotesk 800 ağırlıkta bile düz kalıyordu.
   Plus Jakarta Sans o geometriyi veriyor ve Türkçe (İ ı ş ğ ç ö ü) tam
   destekli — bu ikisi birden az fontta var.

   weight VERİLMİYOR: değişken font, ağırlık dizisi vermek statik dosya
   isteyip Turbopack'in font çözümleyicisini kırıyordu ("Can't resolve
   @vercel/turbopack-next/internal/font/google/font"). Değişken hâlinde
   200–800 arası her ağırlık geliyor; 800 de dahil, yani sahte
   kalınlaştırma sorunu yok. */
const arayuz = Plus_Jakarta_Sans({ subsets: ["latin-ext"], variable: "--font-tabela" });
const karla = Karla({ subsets: ["latin-ext"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-metin" });
const mono = JetBrains_Mono({ subsets: ["latin-ext"], weight: ["400", "700"], variable: "--font-sayi" });

export const metadata: Metadata = {
  title: "Kadıköy Harita",
  description:
    "Gitmeden ne bilmen lazım, sana uygun mu — Kadıköy'ü pinleyenlerin haritası.",
  /* Demo: arama motorlarına kapalı. robots.txt tek başına yetmiyor —
     bağlantı başka yerden bulunursa sayfa yine indekslenebiliyor, meta
     etiketi onu da engelliyor. Yayına çıkarken ikisi de kaldırılmalı. */
  robots: { index: false, follow: false },
  /* iOS manifest'teki simgeyi kullanmıyor, apple-touch-icon'a bakıyor */
  icons: { apple: "/apple-touch-icon.png", icon: "/simge-192.png" },
  appleWebApp: {
    capable: true,          // ana ekrandan tam ekran açılsın
    title: "Kadıköy",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Çift dokunuşla yakınlaşmayı kapatıyoruz: harita kendi yakınlaştırmasını
     yönetiyor, tarayıcınınki üstüne binince kullanılamaz hale geliyor. */
  maximumScale: 1,
  userScalable: false,
  themeColor: "#241E14",
  /* Çentikli ekranlarda tam ekran; güvenli alanı CSS'te bırakıyoruz */
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${arayuz.variable} ${karla.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
