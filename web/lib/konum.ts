"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type KonumDurumu =
  | "kapali"        // kullanıcı henüz istemedi
  | "isteniyor"     // izin bekleniyor
  | "acik"          // konum geliyor
  | "reddedildi"    // kullanıcı izin vermedi
  | "guvensiz"      // HTTPS değil — tarayıcı konum vermiyor
  | "yok"           // cihaz/tarayıcı desteklemiyor
  | "hata";

export interface Konum {
  lat: number;
  lng: number;
  /** metre cinsinden yatay doğruluk — haritada halka olarak çiziliyor */
  dogruluk: number;
}

/* Kadıköy'ün kabaca sınırları. Kullanıcı İzmir'deyse haritayı oraya
   uçurmak anlamsız — uygulama Kadıköy'ü gösteriyor. */
export const KADIKOY_SINIR = { guney: 40.955, kuzey: 41.02, bati: 28.99, dogu: 29.09 };
export const kadikoydeMi = (k: Konum) =>
  k.lat > KADIKOY_SINIR.guney && k.lat < KADIKOY_SINIR.kuzey &&
  k.lng > KADIKOY_SINIR.bati && k.lng < KADIKOY_SINIR.dogu;

/**
 * Kullanıcının kendi konumu.
 *
 * Konum CİHAZDAN ÇIKMIYOR: sunucuya gönderilmiyor, kaydedilmiyor. Yalnızca
 * haritayı oraya kaydırmak ve yakındaki mekanları sormak için kullanılıyor —
 * o sorgu da "şu koordinatın çevresindeki mekanlar" diyor, "ben buradayım"
 * demiyor.
 *
 * watchPosition kullanıcı isteyene kadar BAŞLAMIYOR. Sürekli dinlemek pili
 * yiyor; izin verildikten sonra bile ekran değişince durduruluyor.
 */
export function useKonum() {
  const [durum, setDurum] = useState<KonumDurumu>("kapali");
  const [konum, setKonum] = useState<Konum | null>(null);
  const izleyici = useRef<number | null>(null);

  const durdur = useCallback(() => {
    if (izleyici.current !== null) {
      navigator.geolocation.clearWatch(izleyici.current);
      izleyici.current = null;
    }
  }, []);

  const baslat = useCallback(() => {
    /* Tarayıcılar konumu yalnızca güvenli bağlamda veriyor (HTTPS ya da
       localhost). Yerel ağdaki http:// adreste sessizce başarısız olmak
       yerine bunu açıkça söylüyoruz. */
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setDurum("guvensiz");
      return;
    }
    if (!("geolocation" in navigator)) {
      setDurum("yok");
      return;
    }

    setDurum("isteniyor");
    durdur();
    izleyici.current = navigator.geolocation.watchPosition(
      (p) => {
        setKonum({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          dogruluk: p.coords.accuracy,
        });
        setDurum("acik");
      },
      (e) => {
        setDurum(e.code === e.PERMISSION_DENIED ? "reddedildi" : "hata");
        durdur();
      },
      {
        enableHighAccuracy: true,
        /* 20 sn: şehir içinde GPS bazen geç kilitleniyor, erken pes etmeyelim */
        timeout: 20_000,
        /* 15 sn'lik önbelleğe razıyız — her seferinde sıfırdan ölçmek pili yiyor */
        maximumAge: 15_000,
      },
    );
  }, [durdur]);

  const kapat = useCallback(() => {
    durdur();
    setKonum(null);
    setDurum("kapali");
  }, [durdur]);

  /* Bileşen sökülünce dinlemeyi bırak — yoksa arka planda pil yakar */
  useEffect(() => durdur, [durdur]);

  return { durum, konum, baslat, kapat };
}

export const KONUM_MESAJI: Record<KonumDurumu, string> = {
  kapali: "",
  isteniyor: "Konum alınıyor…",
  acik: "",
  reddedildi:
    "Konum izni verilmedi. Tarayıcı ayarlarından bu siteye izin verip tekrar deneyebilirsin.",
  guvensiz:
    "Konum yalnızca güvenli bağlantıda (https) çalışıyor. Uygulama yayına alınınca kullanılabilir.",
  yok: "Bu cihaz konum desteklemiyor.",
  hata: "Konum alınamadı. Açık alanda tekrar dene.",
};
