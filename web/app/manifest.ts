import type { MetadataRoute } from "next";

/**
 * PWA manifesti — "Ana Ekrana Ekle" ile uygulama gibi açılsın diye.
 *
 * display: "standalone" adres çubuğunu gizliyor; bu olmadan ana ekrana
 * eklense bile sekme gibi açılır.
 *
 * background_color açılış ekranının rengi, theme_color iOS'ta durum
 * çubuğunun arkasındaki renk — ikisi de uygulamanın koyu çerçevesiyle
 * aynı, yoksa açılışta beyaz bir çakma oluyor.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kadıköy Harita",
    short_name: "Kadıköy",
    description:
      "Gitmeden ne bilmen lazım, sana uygun mu — Kadıköy'ü pinleyenlerin haritası.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#241E14",
    theme_color: "#241E14",
    lang: "tr",
    icons: [
      { src: "/simge-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/simge-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /* maskable: Android simgeyi kendi şekline kırpıyor; jeton ortada
         olduğu için kırpma güvenli */
      { src: "/simge-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
