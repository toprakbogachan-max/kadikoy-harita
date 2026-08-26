import type { MetadataRoute } from "next";

/**
 * Arama motorlarına kapalı.
 *
 * Uygulama şu an bir demo: içinde haritada var olmayan "demo-" mekanlar,
 * uydurma pin metinleri ve @demo.invalid hesaplar duruyor. Bunların arama
 * sonuçlarında çıkması yanlış bilgi yaymak olur.
 *
 * Gerçekten yayına çıkarken burası kaldırılmalı — ve önce
 * scripts/tohum/tohum-temizle.sql çalıştırılmalı.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
