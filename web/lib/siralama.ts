"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* Sürükleme sayılması için gereken dikey hareket. Altında kalan her şey
   dokunuş: parmak hiç kıpırdamadan basmak da bir miktar kayıyor. */
const ESIK = 6;
/* Dokunmatikte basılı tutma süresi. Hemen başlatmak listeyi kaydırılamaz
   yapardı — liste uzun bir formun içinde ve kullanıcı oradan da kaydırıyor.
   Farede beklemek gereksiz: fare sürüklemesi sayfayı kaydırmıyor. */
const BASILI_TUTMA_MS = 220;
/* Satırlar arasındaki boşluk (mb-2). Adım hesabı buna dayanıyor. */
const ARALIK = 8;

export interface Tasinan { i: number; dy: number; adim: number }

const hedefi = (t: Tasinan, sayi: number) =>
  Math.max(0, Math.min(sayi - 1, t.i + Math.round(t.dy / t.adim)));

/**
 * Sürüklenen satırın ve ona yer açan satırların stili.
 *
 * Kancanın DIŞINDA, saf bir fonksiyon: react-hooks/refs kancadan dönen
 * fonksiyonların render sırasında çağrılmasına izin vermiyor (haklı olarak —
 * ref okuyabilirler). Bu yalnızca state'e bakıyor.
 */
export function siraStili(tasinan: Tasinan | null, j: number, sayi: number): CSSProperties {
  if (!tasinan) return {};
  const { i, dy, adim } = tasinan;
  if (j === i) {
    return {
      transform: `translateY(${dy}px)`,
      position: "relative",
      zIndex: 2,
      boxShadow: "0 8px 20px rgba(20,15,8,.22)",
      touchAction: "none",
    };
  }
  const hedef = hedefi(tasinan, sayi);
  const kaydir =
    hedef > i && j > i && j <= hedef ? -adim
    : hedef < i && j < i && j >= hedef ? adim
    : 0;
  return { transform: `translateY(${kaydir}px)`, transition: "transform 130ms", touchAction: "none" };
}

/**
 * Listeyi sürükleyerek sıralama.
 *
 * Ok düğmelerinin yerine geçti. Satırın kendisi zaten dokunulabilir (görseli
 * büyütüyor) ve içinde not kutusu var; bu yüzden:
 *   * `data-suruklenmez` taşıyan öğeden başlayan basış sürükleme SAYILMIYOR
 *     (not kutusu, kaldır düğmesi),
 *   * dokunmatikte sürükleme basılı tutunca başlıyor — kısa dokunuş tıklama,
 *     parmak hemen kayarsa liste kaydırması,
 *   * sürükleme olduysa bırakıştaki tıklama yakalama aşamasında yutuluyor,
 *     yoksa parmağı kaldırınca görsel büyüyordu.
 *
 * Olaylar tek tek satırlara değil KAPSAYICIYA bağlanıyor: kancadan dönen bir
 * fonksiyonu render sırasında çağırmak yasak (react-hooks/refs). Satırların
 * tek yapması gereken `data-sira={index}` taşımak.
 */
export function useSiralama(
  /* Kapsayıcı ref'i çağırandan geliyor, kancadan DÖNMÜYOR: dönen nesnenin
     üstünden ref'e erişmek render sırasında ref okumak sayılıyor
     (react-hooks/refs). Yerel bir ref'i doğrudan ref= olarak vermek serbest. */
  kap: React.RefObject<HTMLDivElement | null>,
  sayi: number,
  tasi: (nereden: number, nereye: number) => void,
) {
  const [tasinan, setTasinan] = useState<Tasinan | null>(null);
  const durum = useRef<
    { i: number; y0: number; adim: number; hazir: boolean; zaman: number; suruklendi: boolean } | null
  >(null);
  /* Sürükleme bitince gelen click'i yutmak için. */
  const yut = useRef(false);
  /* tasinan'ın ref kopyası: bırakışta son konumu OKUMAK gerekiyor ve bunu
     state güncelleyicisinin içinde yapmak yanlıştı — StrictMode güncelleyiciyi
     iki kez çağırıyor, sıralama iki kez uygulanıyordu (ölçüldü: bir satırı iki
     aşağı taşıyınca liste iki tur dönüyordu). */
  const tasinanRef = useRef<Tasinan | null>(null);
  /* Dinleyiciler bir kez bağlanıyor; güncel sayı/geri çağrı ref'ten okunuyor,
     yoksa ilk render'ın değerlerinde donarlardı. */
  const guncel = useRef({ sayi, tasi });
  useEffect(() => { guncel.current = { sayi, tasi }; });

  useEffect(() => {
    const el = kap.current;
    if (!el) return;

    const satirBul = (h: EventTarget | null) =>
      h instanceof Element ? (h.closest("[data-sira]") as HTMLElement | null) : null;

    const bas = (e: PointerEvent) => {
      /* Yeni bir etkileşim başlıyor: sürükleme tıklamasız bittiyse (işaretçi
         iptal edildi, parmak dışarıda bırakıldı) bayrak asılı kalıyor ve
         SONRAKİ dokunuşu yiyordu. */
      yut.current = false;
      if (guncel.current.sayi < 2) return;
      const h = e.target;
      if (h instanceof Element && h.closest("[data-suruklenmez]")) return;
      const satir = satirBul(h);
      if (!satir) return;
      const i = Number(satir.dataset.sira);
      const adim = satir.getBoundingClientRect().height + ARALIK;
      /* Yakalama başarısız olabiliyor (işaretçi çoktan bırakılmışsa
         NotFoundError atıyor); sürükleme onsuz da yürüyor. */
      try { satir.setPointerCapture(e.pointerId); } catch { /* yoksay */ }
      const fare = e.pointerType === "mouse";
      durum.current = { i, y0: e.clientY, adim, hazir: fare, zaman: 0, suruklendi: false };
      if (!fare) {
        durum.current.zaman = window.setTimeout(() => {
          if (!durum.current) return;
          durum.current.hazir = true;
          tasinanRef.current = { i, dy: 0, adim };
          setTasinan(tasinanRef.current);
          navigator.vibrate?.(8);
        }, BASILI_TUTMA_MS);
      }
    };

    const hareket = (e: PointerEvent) => {
      const d = durum.current;
      if (!d) return;
      const dy = e.clientY - d.y0;
      if (!d.hazir) {
        /* Parmak beklemeden kaydırdıysa niyeti listeyi kaydırmak. */
        if (Math.abs(dy) > ESIK) { clearTimeout(d.zaman); durum.current = null; }
        return;
      }
      if (Math.abs(dy) > ESIK) d.suruklendi = true;
      tasinanRef.current = { i: d.i, dy, adim: d.adim };
      setTasinan(tasinanRef.current);
    };

    const bitir = () => {
      const d = durum.current;
      const t = tasinanRef.current;
      durum.current = null;
      tasinanRef.current = null;
      setTasinan(null);
      if (!d) return;
      clearTimeout(d.zaman);
      if (!d.hazir || !d.suruklendi || !t) return;
      yut.current = true;
      const hedef = hedefi(t, guncel.current.sayi);
      if (hedef !== d.i) guncel.current.tasi(d.i, hedef);
    };

    /* Yakalama aşaması: React kök dinleyicisine ulaşmadan durduruyoruz. */
    const tiklama = (e: MouseEvent) => {
      if (!yut.current) return;
      yut.current = false;
      e.stopPropagation();
      e.preventDefault();
    };

    /* Pasif OLMAYAN: React'in kök touchmove dinleyicisi pasif, preventDefault
       oradan çalışmıyor ve sürüklerken liste de kayıyordu. */
    const dokunusHareketi = (e: TouchEvent) => { if (durum.current?.hazir) e.preventDefault(); };

    el.addEventListener("pointerdown", bas);
    el.addEventListener("pointermove", hareket);
    el.addEventListener("pointerup", bitir);
    el.addEventListener("pointercancel", bitir);
    el.addEventListener("click", tiklama, true);
    el.addEventListener("touchmove", dokunusHareketi, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", bas);
      el.removeEventListener("pointermove", hareket);
      el.removeEventListener("pointerup", bitir);
      el.removeEventListener("pointercancel", bitir);
      el.removeEventListener("click", tiklama, true);
      el.removeEventListener("touchmove", dokunusHareketi);
    };
  }, [kap]);

  return tasinan;
}
