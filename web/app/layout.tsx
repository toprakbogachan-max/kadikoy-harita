import type { Metadata, Viewport } from "next";
import { Inter, Karla, JetBrains_Mono, Kalam } from "next/font/google";
import "./globals.css";

/* BRIEF → Tasarım dili: Oswald (tabela/etiket), Karla (metin),
   JetBrains Mono (sayı), Kalam (el yazısı — post-it notları).
   latin-ext alt kümesi Türkçe karakterler için şart. */
/* Inter Kademe A/B/C'yi birden taşıyor: 800 ağırlık ve negatif harf
   aralığı olmadan "özel isim bağırır" kademesi kurulamıyor. Oswald
   (sıkıştırılmış tabela yazısı) bu dilde karşılığı olmadığı için
   düştü. 700 artık GERÇEKTEN yüklü — sahte kalınlaştırma bitti. */
/* weight VERİLMİYOR: Inter değişken bir font, ağırlık dizisi vermek
   statik dosya isteyip Turbopack'in font çözümleyicisini kırıyordu
   ("Can't resolve @vercel/turbopack-next/internal/font/google/font").
   Değişken hâlinde 100–900 arası her ağırlık zaten geliyor — 800 de
   dahil, yani sahte kalınlaştırma sorunu yine çözülmüş oluyor. */
const inter = Inter({ subsets: ["latin-ext"], variable: "--font-tabela" });
const karla = Karla({ subsets: ["latin-ext"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-metin" });
const mono = JetBrains_Mono({ subsets: ["latin-ext"], weight: ["400", "700"], variable: "--font-sayi" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-el" });

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
      <body className={`${inter.variable} ${karla.variable} ${mono.variable} ${kalam.variable}`}>
        {children}
      </body>
    </html>
  );
}
