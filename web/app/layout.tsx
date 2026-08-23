import type { Metadata, Viewport } from "next";
import { Oswald, Karla, JetBrains_Mono, Kalam } from "next/font/google";
import "./globals.css";

/* BRIEF → Tasarım dili: Oswald (tabela/etiket), Karla (metin),
   JetBrains Mono (sayı), Kalam (el yazısı — post-it notları).
   latin-ext alt kümesi Türkçe karakterler için şart. */
const oswald = Oswald({ subsets: ["latin-ext"], weight: ["400", "600"], variable: "--font-tabela" });
const karla = Karla({ subsets: ["latin-ext"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-metin" });
const mono = JetBrains_Mono({ subsets: ["latin-ext"], weight: ["400", "700"], variable: "--font-sayi" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-el" });

export const metadata: Metadata = {
  title: "Kadıköy Harita",
  description:
    "Gitmeden ne bilmen lazım, sana uygun mu — Kadıköy'ü pinleyenlerin haritası.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${oswald.variable} ${karla.variable} ${mono.variable} ${kalam.variable}`}>
        {children}
      </body>
    </html>
  );
}
