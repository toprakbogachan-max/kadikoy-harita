"use client";

import type { ReactNode } from "react";

/**
 * İkon düğmesi — yazısı olmayan, dokunulabilir kare ya da daire.
 *
 * Skill §6: üst bar kenardan kenara dolu bir şerit değil; geri, paylaş,
 * kapat, konum gibi eylemler içeriğin üstünde AYRI AYRI yüzen beyaz
 * düğmelerdir. Bu dosya o düğmenin tek tanımı.
 *
 * Faz 5'e kadar aynı sınıf dizisi (`grid size-9 place-items-center
 * rounded-md border-none bg-yuzey shadow-kat-1`) on sekiz yerde elle
 * yazılıydı; gölge kademesi ve yarıçap yer yer kayıyordu.
 *
 * ── Şekil ──────────────────────────────────────────────────────────
 * squircle = chrome düğmesi (kapat, paylaş, künye), daire = haritanın
 * ya da içeriğin üstündeki yuvarlak eylem (konum, "+"). Skill §5'in
 * ayrımı: daire haritaya, squircle arayüze ait.
 *
 * Yazısı olmadığı için `okunur` ZORUNLU: ekran okuyucu bir simgeyi
 * okuyamaz.
 */

export type IkonDolgu = "beyaz" | "siyah" | "mavi" | "cam" | "camKoyu" | "seffaf";
export type IkonSekil = "squircle" | "daire";

const DOLGU: Record<IkonDolgu, string> = {
  beyaz: "bg-yuzey text-gri-900",
  siyah: "bg-gri-900 text-white",
  /* mavi: skill §14'ün tek istisnası — "şu an çalışıyor" durumu. */
  mavi: "bg-mavi text-white",
  cam: "cam text-gri-900",
  /* Koyu cam: FOTOĞRAFIN üstünde duran düğme. Beyaz olsaydı açık bir
     karede kaybolurdu; blur'lu koyu zemin hem ikonu tutuyor hem
     fotoğrafı örtmüyor. */
  camKoyu: "bg-[rgba(10,10,12,.5)] text-white",
  seffaf: "bg-transparent",
};

export interface IkonDugmesiProps {
  /** simge: svg ya da emoji. */
  children: ReactNode;
  /** ekran okuyucu metni — zorunlu, düğmenin görünen yazısı yok. */
  okunur: string;
  /** kenar uzunluğu (px). 36 = eski `size-9`, 52 = yuvarlak eylem. */
  boyut?: number;
  sekil?: IkonSekil;
  dolgu?: IkonDolgu;
  /** gölge kademesi. 1 = duran içerik, 3 = yüzen chrome (skill §5). */
  kat?: 0 | 1 | 2 | 3 | 4 | 5;
  /** basılı/seçili durum — `aria-pressed`. */
  aktif?: boolean;
  /** bulunulan sekme — `aria-current="page"`. */
  guncel?: boolean;
  pasif?: boolean;
  /** açılır panel varsa. */
  acik?: boolean;
  /** açtığı şey bir menü mü (`aria-haspopup`). */
  menuAcar?: boolean;
  /** KayanSecim baloncuğu bu öznitelikle buluyor. */
  kayan?: string;
  /**
   * `title` — masaüstünde ipucu. `okunur` ile aynı şey DEĞİL: ipucu
   * fareyle gezen kullanıcıya, `aria-label` ekran okuyucuya konuşur ve
   * ipucu genelde daha uzun (konumun doğruluğu, "çift dokunuş kapatır").
   */
  baslik?: string;
  onTikla?: () => void;
  /** Çift dokunuş — konum düğmesinde "takibi kapat". */
  onCiftTikla?: () => void;
  className?: string;
}

export default function IkonDugmesi({
  children,
  okunur,
  boyut = 36,
  sekil = "squircle",
  dolgu = "beyaz",
  kat = 1,
  aktif,
  guncel = false,
  pasif = false,
  acik,
  menuAcar = false,
  kayan,
  baslik,
  onTikla,
  onCiftTikla,
  className = "",
}: IkonDugmesiProps) {
  return (
    <button
      type="button"
      onClick={onTikla}
      onDoubleClick={onCiftTikla}
      disabled={pasif}
      title={baslik}
      aria-label={okunur}
      aria-pressed={aktif}
      aria-current={guncel ? "page" : undefined}
      aria-expanded={acik}
      aria-haspopup={menuAcar ? "menu" : undefined}
      data-kayan={kayan}
      style={{
        width: boyut,
        height: boyut,
        /* Squircle yarıçapı token: ikon düğmesi bu üründe her boyutta
           --radius-md (16px) kullanıyordu, oranlı hesap onu kaydırırdı. */
        borderRadius: sekil === "daire" ? "50%" : "var(--radius-md)",
        boxShadow: kat ? `var(--shadow-kat-${kat})` : undefined,
      }}
      className={`bas grid shrink-0 place-items-center border-none p-0 ${DOLGU[dolgu]} ${
        pasif ? "pointer-events-none opacity-45" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
