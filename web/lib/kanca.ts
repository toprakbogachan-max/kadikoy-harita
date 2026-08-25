"use client";

import { useEffect, useState } from "react";

/**
 * Tek seferlik veri çekme — yükleniyor / hata / veri üçlüsünü tek yerde tutar.
 *
 * Next 16 dokümanı istemci tarafı için React'in `use` API'sini ya da
 * SWR/React Query'yi öneriyor. `use` başlangıç verisini sunucudan akıtmak için;
 * bizde filtre her değiştiğinde yeni sorgu gerekiyor, o yüzden kanca. SWR'ın
 * getirdiği önbellek/tekilleştirme ileride gerekirse eklenebilir — şimdilik
 * tek bağımlılık eklememek için elde tutuluyor.
 *
 * `yukleniyor` ayrı bir state DEĞİL, türetiliyor: sonuç hangi bağımlılıklar
 * için geldiyse onu da saklıyoruz, güncel anahtarla eşleşmiyorsa yükleniyor
 * demektir. Efektin başında setState çağırmak (React'in uyardığı basamaklı
 * render) böylece gerekmiyor — ve şu ince hata da kapanıyor: filtre değişip
 * yeni sonuç gelene kadar `veri` ESKİ sonucu tutuyordu, artık bayat olduğunu
 * biliyoruz.
 *
 * `iptal` bayrağı şart: filtre hızlı değişince önceki istek sonradan dönüp
 * yeni sonucun üstüne yazabilir (yarış durumu). Sökülen efektin sonucu atılır.
 */
export function useVeri<T>(
  getir: () => Promise<T>,
  bagimliliklar: unknown[],
  baslangic: T,
) {
  /* Bağımlılıklar nesne olabiliyor (filtre sorgusu gibi); referans değil
     değer karşılaştırması istiyoruz. */
  const anahtar = JSON.stringify(bagimliliklar);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri: T; hata: string | null } | null>(null);

  useEffect(() => {
    let iptal = false;
    getir()
      .then((d) => { if (!iptal) setSonuc({ anahtar, veri: d, hata: null }); })
      .catch((e: unknown) => {
        if (iptal) return;
        const m = e instanceof Error ? e.message : String(e);
        console.error("veri çekilemedi:", e);
        setSonuc({ anahtar, veri: baslangic, hata: m });
      });
    return () => { iptal = true; };
    /* `getir` her render'da yeniden oluşuyor, listeye girseydi sonsuz döngü
       olurdu; `baslangic` de çağıran tarafta satır içi yazılıyor. Sorgunun
       kimliğini `anahtar` taşıyor. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar]);

  const guncel = sonuc?.anahtar === anahtar;
  return {
    veri: guncel ? sonuc.veri : baslangic,
    yukleniyor: !guncel,
    hata: guncel ? sonuc.hata : null,
  };
}
