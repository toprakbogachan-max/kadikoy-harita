"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Kart kabuğu — F1, F4, F6, G1–G4, D11, E5 ve H7'nin ortak gövdesi.
 *
 * Sadece KABUK: zemin, yarıçap, gölge, dolgu ve gerekiyorsa koyu örtü.
 * İçeriği (avatar + ad + not + eylem daireleri) çağıran taraf koyar —
 * o düzenler kart kabuğunun değil, montaj fazının işi.
 *
 * Zemin kuralları skill §5, §6 ve §14'ten:
 *   beyaz   — varsayılan. Kullanıcı içeriği beyaz kartta durur.
 *   degrade — SİSTEM/AKTİVİTE mesajı (G3). Renk burada anlam taşıyor:
 *             gradyan = "bu bir kişinin notu değil, bir olay".
 *   foto    — beyaz kart kuralının TEK istisnası (F6, boş durum CTA).
 *             Üstüne beyaz metin binecekse koyu örtü ZORUNLU, dekorasyon
 *             değil; bu yüzden `ortu` varsayılan olarak açık.
 *   bos     — ızgarada yeri olan ama içeriği olmayan hücre (§14): kesik
 *             çizgili çerçeve ya da "+" kutusu değil, yalnızca soluk gri
 *             bir dikdörtgen. Sessiz, çünkü orası bir hata değil.
 *   kagit   — panel içindeki gömülü bölüm; zeminle aynı, gölgesiz.
 *
 * Ayraç çizgisi ve kalın kenarlık YOK. `sacTeli` yalnızca gölgeyi
 * DESTEKLEMEK için (skill §5), ayırmak için değil.
 */

export type KartZemin = "beyaz" | "degrade" | "foto" | "bos" | "kagit";
export type KartYaricap = "sm" | "md" | "lg" | "xl" | "2xl";
export type KartDolgu = "yok" | "dar" | "normal" | "genis";

const YARICAP: Record<KartYaricap, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

const DOLGU: Record<KartDolgu, string> = {
  yok: "p-0",
  dar: "p-3",
  normal: "p-4",
  genis: "p-6",
};

const ZEMIN: Record<KartZemin, string> = {
  beyaz: "bg-yuzey",
  degrade: "bg-[linear-gradient(135deg,var(--color-rozet-lila),var(--color-rozet-pembe))]",
  foto: "bg-gri-200 bg-cover bg-center",
  bos: "bg-gri-100",
  kagit: "bg-kagit",
};

export interface KartProps {
  children?: ReactNode;
  zemin?: KartZemin;
  /** zemin="foto" ile: kapak görselinin adresi. */
  foto?: string;
  /** object-position'ın dikey yüzdesi — kullanıcının seçtiği kadraj. */
  fotoKonum?: number;
  /** koyu degrade örtü. Fotoğraf zemininde varsayılan AÇIK. */
  ortu?: boolean;
  yaricap?: KartYaricap;
  /** gölge kademesi. 1 = duran içerik (varsayılan), 3 = en üst katman. */
  kat?: 0 | 1 | 2 | 3 | 4 | 5;
  dolgu?: KartDolgu;
  /** en/boy oranı — ızgara kartlarında "1/1", kapaklarda "4/3". */
  oran?: string;
  /** saç teli kenarlık: gölgeyi destekler, ayırmaz. */
  sacTeli?: boolean;
  onTikla?: () => void;
  etiket?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Kart({
  children,
  zemin = "beyaz",
  foto,
  fotoKonum = 50,
  ortu,
  yaricap = "lg",
  kat = 1,
  dolgu = "normal",
  oran,
  sacTeli = false,
  onTikla,
  etiket,
  className = "",
  style,
}: KartProps) {
  const fotolu = zemin === "foto";
  /* Boş yuva gölgesiz: gölge "bu bir nesne" der, boş hücre bir nesne değil. */
  const golgeKademesi = zemin === "bos" || zemin === "kagit" ? 0 : kat;
  const ortuAcik = ortu ?? fotolu;

  /* Genişlik ve display BİLEREK verilmiyor: ızgara ya da flex içinde kart
     kendiliğinden geriliyor (grid/flex çocuğu bloklaşır), normal akışta
     çağıran `w-full` ekliyor. Temel sınıfa `w-full` koymak, çağıranın
     `w-[104px]`i ile ÇAKIŞIYOR ve kazananı sınıf sırası değil Tailwind'in
     üretim sırası belirlediği için sessizce yanlış genişlik çıkıyor. */
  const sinif = [
    "relative overflow-hidden text-left",
    ZEMIN[zemin],
    YARICAP[yaricap],
    DOLGU[dolgu],
    onTikla ? "bas border-none" : "",
    ortuAcik ? "ortulu" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const stil: CSSProperties = {
    boxShadow: golgeKademesi ? `var(--shadow-kat-${golgeKademesi})` : undefined,
    border: sacTeli ? "1px solid var(--cizgi)" : undefined,
    aspectRatio: oran,
    /* url() TIRNAKLI: tırnaksız bir url-token ilk `)` karakterinde biter.
       Adresin içinde parantez geçtiğinde (data: URI'li SVG, Wikimedia'nın
       "Foo_(building).jpg" gibi dosya adları) bildirim geçersiz oluyor ve
       tarayıcı onu SESSİZCE atıyor — kart boş gri kalıyor, konsolda hata
       yok. Tırnak içinde parantez zararsız. */
    ...(fotolu && foto
      ? { backgroundImage: `url("${foto}")`, backgroundPosition: `50% ${fotoKonum}%` }
      : null),
    ...style,
  };

  /* İçerik örtünün ÜSTÜNDE: .ortulu::after inset-0 ile kaplıyor, z yoksa
     metin örtünün altında kalır ve okunmaz — örtünün varlık sebebi tam
     olarak o metnin okunması. */
  const ic = ortuAcik ? <div className="relative z-[1]">{children}</div> : children;

  if (onTikla) {
    return (
      <button type="button" onClick={onTikla} aria-label={etiket} className={sinif} style={stil}>
        {ic}
      </button>
    );
  }

  return (
    <div className={sinif} style={stil} aria-label={etiket}>
      {ic}
    </div>
  );
}
