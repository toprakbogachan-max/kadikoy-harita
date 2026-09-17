"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Hap (pill) — yatay, metin taşıyan HER ŞEY (skill §5).
 *
 * Envanter karşılıkları: A3 arama hapı · A4 yuvarlak chrome düğmesi ·
 * A6 iki bölmeli segmented (aşağıda `IkiliPill`) · D8 eylem hapı satırı ·
 * E7 tam genişlik kaydet · F2 degrade kenarlıklı `collaborate` ·
 * I7 kaynak seçimi · I9 degrade CTA · J3 öneri hapı.
 *
 * Bileşen İÇERİĞİNİ UYDURMUYOR: ikon, metin ve sağ yuva dışarıdan gelir.
 * Tek karar verdiği şey biçim — dolgu, boy, kenar, gölge kademesi.
 *
 * İki kural burada kodlanmış durumda:
 *   1) Dolu koyu eleman ekranda BİR tane olur (skill §3). `dolgu="siyah"`
 *      bu yüzden varsayılan değil; varsayılan beyaz.
 *   2) Arayüz küçük harf konuşur (Kademe B). Ama özel isim taşıyan bir
 *      hapta (`kasa="aynen"`) kasa kullanıcının — "Fazıl Bey"i "fazıl bey"
 *      yapmak onun adını elinden almak olur.
 */

export type PillDolgu = "beyaz" | "siyah" | "mavi" | "nane" | "degrade" | "seffaf" | "cam";
export type PillBoy = "kucuk" | "orta" | "buyuk";
export type PillKenar = "yok" | "halka" | "degrade";
export type Kat = 0 | 1 | 2 | 3 | 4 | 5;

/* Dolgular. "mavi" skill §14'ün tek istisnası (birincil eylem / çalışıyor
   durumu), "nane" bu üründe kaydetmenin rengi — referansta orası mavi ama
   ürün kararı naneden yana, ikisi de token olarak duruyor.

   "seffaf" renk vermiyor: KayanSecim'in siyah baloncuğu hapın ALTINDAN
   aktığı için hapın kendi zemini olmamalı, yoksa baloncuğu örter. */
const DOLGU: Record<PillDolgu, string> = {
  beyaz: "bg-yuzey text-gri-900",
  siyah: "bg-gri-900 text-white",
  mavi: "bg-mavi text-white active:bg-mavi-koyu",
  nane: "bg-rozet-nane text-rozet-nane-ink",
  degrade:
    "bg-[linear-gradient(135deg,var(--color-rozet-lila),var(--color-rozet-pembe))] text-rozet-lila-ink",
  seffaf: "bg-transparent",
  cam: "cam text-gri-900",
};

const BOY: Record<PillBoy, string> = {
  kucuk: "gap-1 px-2.5 py-1 text-xs",
  orta: "gap-1.5 px-3.5 py-2 text-sm",
  buyuk: "gap-2 px-5 py-3 text-base",
};

/* Degrade KENARLIK (F2 `collaborate`): iki zemin üst üste — içteki
   padding-box'ta düz beyaz, dıştaki border-box'ta degrade. Tek elemanla
   degrade çerçeve üretmenin ek DOM'suz tek yolu bu. */
const DEGRADE_KENAR =
  "linear-gradient(var(--color-yuzey), var(--color-yuzey)) padding-box," +
  " linear-gradient(135deg, var(--color-rozet-lila), var(--color-rozet-pembe)) border-box";

export interface PillProps {
  children?: ReactNode;
  /** sol yuva — emoji ya da svg. Durum değişiminde zıplayan da bu (skill §13). */
  ikon?: ReactNode;
  /** sağ yuva — `⌄`, `✕`, `↗`, sayaç. */
  sag?: ReactNode;
  dolgu?: PillDolgu;
  boy?: PillBoy;
  kenar?: PillKenar;
  /** gölge kademesi. 2 = yüzen chrome (varsayılan), 1 = duran içerik. */
  kat?: Kat;
  tamGenislik?: boolean;
  /** basılı/seçili durum. `aria-pressed` buna bağlanır. */
  aktif?: boolean;
  /**
   * `aktif` her değiştiğinde İKON zıplasın (skill §13 kalıp 4).
   * Kaydet/beğen gibi DURUM DEĞİŞTİREN düğmelerde açılır; sekme
   * seçiminde açılmaz — orada zıplama "oldu" değil "titredi" okunur.
   */
  zipla?: boolean;
  /** çalışıyor durumu: ikon yuvasına dönen halka girer (B7, I6). */
  yukleniyor?: boolean;
  pasif?: boolean;
  /** Kademe B küçük harf varsayılan; özel isim taşıyorsa "aynen". */
  kasa?: "kucuk" | "aynen";
  etiket?: string;
  href?: string;
  onTikla?: () => void;
  /** KayanSecim akan baloncuğu bu öznitelikle buluyor. */
  kayan?: string;
  /**
   * Yalnızca gösterim: `<button>` yerine `<span>` üretir. Basma tepkisi,
   * `aria-pressed` / `disabled` / `aria-busy` yok; `onTikla` ve `href`
   * yok sayılır. Haritanın üstündeki etiket ya da bir puanın kademesi gibi
   * dokunulmayan haplar için — düğme olmayan şeyi düğme yapıp sonra
   * `inert` ile susturmak yerine.
   *
   * Anlamı çağıran taraf verir (`role`, `aria-label` dış kapta): tek
   * başına bir `<span>` ekran okuyucuya bir şey söylemez.
   */
  etkilesimsiz?: boolean;
  className?: string;
}

export default function Pill({
  children,
  ikon,
  sag,
  dolgu = "beyaz",
  boy = "orta",
  kenar = "yok",
  kat = 2,
  tamGenislik = false,
  aktif,
  zipla = false,
  yukleniyor = false,
  pasif = false,
  kasa = "kucuk",
  etiket,
  href,
  onTikla,
  kayan,
  etkilesimsiz = false,
  className = "",
}: PillProps) {
  const zipSayaci = useZipla(zipla, aktif);

  /* Halka ile gölge AYNI özellikte yaşıyor (box-shadow), o yüzden ikisi
     satır içi birleştiriliyor — Tailwind'de iki ayrı sınıf yazılsa
     sonraki öncekini siler. */
  const golge = kat ? `var(--shadow-kat-${kat})` : "";
  const halka = kenar === "halka" ? "0 0 0 2px var(--color-gri-900)" : "";
  const boxShadow = [halka, golge].filter(Boolean).join(", ") || undefined;

  const stil =
    kenar === "degrade"
      ? { boxShadow, background: DEGRADE_KENAR, border: "1.5px solid transparent" }
      : { boxShadow };

  const sinif = [
    /* bas: dokunulabilir her şey basılır (skill §13) — dokunulmayan hariç. */
    etkilesimsiz ? "" : "bas",
    "inline-flex items-center justify-center whitespace-nowrap rounded-full border-none no-underline",
    "font-semibold tracking-ui transition-[background-color,color] duration-200 ease-yumusak",
    kasa === "kucuk" ? "lowercase" : "",
    /* Degrade kenarlıkta zemin satır içi geliyor; dolgu sınıfı yalnızca
       yazı rengini taşısın diye beyaza sabitleniyor. */
    kenar === "degrade" ? "text-gri-900" : DOLGU[dolgu],
    BOY[boy],
    tamGenislik ? "w-full" : "",
    pasif ? "pointer-events-none opacity-45" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const ic = (
    <>
      {(yukleniyor || ikon) && (
        /* key: CSS animasyonunu yeniden başlatmanın en ucuz yolu React'te
           elemanı yeniden monte etmek. Zıplayan yalnızca ikon — hapın
           tamamı zıplarsa yanındaki haplar da oynuyormuş gibi görünür. */
        <span
          key={zipSayaci}
          aria-hidden
          className={`grid shrink-0 place-items-center leading-none ${zipSayaci ? "zipla" : ""}`}
        >
          {yukleniyor ? <Donen /> : ikon}
        </span>
      )}
      {children != null && <span className="min-w-0 truncate">{children}</span>}
      {sag != null && (
        <span aria-hidden className="shrink-0 leading-none opacity-70">
          {sag}
        </span>
      )}
    </>
  );

  if (etkilesimsiz) {
    return (
      <span data-kayan={kayan} className={sinif} style={stil}>
        {ic}
      </span>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={etiket}
        data-kayan={kayan}
        className={sinif}
        style={stil}
      >
        {ic}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onTikla}
      disabled={pasif}
      aria-pressed={aktif}
      aria-label={etiket}
      aria-busy={yukleniyor || undefined}
      data-kayan={kayan}
      className={sinif}
      style={stil}
    >
      {ic}
    </button>
  );
}

/**
 * İki bölmeli segmented hap — A6 (`gidilecek / gidildi`, `takip / takipçi`).
 *
 * Aktif taraf siyah dolu + ✓. Kapsayıcı gomuk (içe gömülü) zeminde:
 * segmented'in işi "bunlar aynı sorunun iki cevabı" demek, ayrı ayrı
 * yüzen iki hap bunu söylemiyor.
 */
export function IkiliPill<T extends string>({
  secenekler,
  secili,
  onSec,
  etiket,
  className = "",
}: {
  secenekler: readonly { id: T; ad: string; ikon?: ReactNode }[];
  secili: T;
  onSec: (id: T) => void;
  etiket?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={etiket}
      className={`inline-flex items-center gap-1 rounded-full bg-gomuk p-1 ${className}`}
    >
      {secenekler.map((s) => {
        const aktif = s.id === secili;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSec(s.id)}
            aria-pressed={aktif}
            className={`bas inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-none px-3.5 py-1.5 text-sm font-semibold lowercase tracking-ui transition-[background-color,color] duration-200 ease-yumusak ${
              aktif ? "bg-gri-900 text-white" : "bg-transparent text-gri-600"
            }`}
          >
            {aktif ? (
              <span aria-hidden className="grid place-items-center">
                <Onay />
              </span>
            ) : (
              s.ikon && (
                <span aria-hidden className="grid place-items-center leading-none">
                  {s.ikon}
                </span>
              )
            )}
            {s.ad}
          </button>
        );
      })}
    </div>
  );
}

/* `aktif` her değiştiğinde artan sayaç. İlk render sayılmıyor: sayfa
   açılır açılmaz zıplayan bir düğme onay değil gürültü. */
function useZipla(acik: boolean, aktif: boolean | undefined) {
  const [sayac, setSayac] = useState(0);
  const ilk = useRef(true);
  useEffect(() => {
    if (!acik) return;
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    setSayac((n) => n + 1);
  }, [acik, aktif]);
  return acik ? sayac : 0;
}

/** Çalışıyor göstergesi — B7'nin mavi `search here`i, I6'nın `verify`i. */
function Donen() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      className="animate-spin motion-reduce:animate-none"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

function Onay() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}
