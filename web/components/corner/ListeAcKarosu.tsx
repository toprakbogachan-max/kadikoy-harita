"use client";

import Kart from "@/components/corner/primitives/Kart";
import type { SecimBicim } from "@/components/corner/ListeSecimKarti";

/**
 * E6 — `create a curation` karosu. Seçicinin (E5) içindeki "yeni liste aç".
 *
 * Referansta gri bir kare ve içinde `+`. Skill §14'ün "boş ızgara yuvası
 * DÜZ GRİ KARTTIR" kuralının akrabası ama aynısı değil: oradaki hücre
 * sessiz çünkü bir hata değil; burası sessiz çünkü bir EYLEM ama asıl
 * eylem değil. Seçicide asıl iş "var olan listeye ekle"; "yeni aç" onun
 * yanında duran çıkış kapısı. Beyaz kart yapılsaydı komşularıyla aynı
 * ağırlıkta görünür ve göz her seferinde ikisini karşılaştırırdı.
 *
 * Bu yüzden karo gölgesiz ve gri: `Kart zemin="bos"` gölgeyi zaten
 * sıfırlıyor — gölge "bu bir nesne" der, bu bir davet.
 *
 * ⚠ `components/ListeKarti.tsx`'teki `YeniListeKarosu` ile karıştırma:
 * o PROFİL ızgarasının son karosu (kare, beyaz, adı altında) ve
 * `app/page.tsx`'te liste oluşturma ekranını açıyor. Bu ise SEÇİCİNİN
 * içindeki karo — seçiciden çıkmadan yeni liste açmak için. Faz 3'te
 * ikisi büyük ihtimalle aynı `onYeniListe` geri çağrısına bağlanır ama
 * görevleri ayrı kalır.
 *
 * Saf sunum: ne açıyor, ne oluşturuyor — sadece `onTikla` çağırıyor.
 */

export interface ListeAcKarosuProps {
  onTikla: () => void;
  /** E5 ile aynı şeritte/listede durduğu için biçimi de onunla aynı. */
  bicim?: SecimBicim;
  /** karo genişliği (px) — şeritteki seçim kartlarıyla aynı olmalı. */
  genislik?: number;
  /**
   * Etiket. Jenerik "Ekle"/"Yeni" değil, cümlenin devamı (skill §7):
   * kullanıcı "hangi listeye?" sorusuna bakıyor, cevaplardan biri de
   * "henüz olmayan bir listeye".
   */
  etiket?: string;
  /** satır biçiminde etiketin altındaki ikinci satır. */
  altMetin?: string;
  pasif?: boolean;
  className?: string;
}

/* Artı işareti çizgiyle, metinle değil: "+" karakterinin kalınlığı ve
   optik merkezi yazı tipine göre kayıyor, 40 piksellik bir karede bu
   kayma görünür hâle geliyor. */
function Arti({ boyut = 22 }: { boyut?: number }) {
  return (
    <svg
      aria-hidden
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function ListeAcKarosu({
  onTikla,
  bicim = "satir",
  genislik = 116,
  etiket,
  altMetin,
  pasif = false,
  className = "",
}: ListeAcKarosuProps) {
  const ad = etiket ?? (bicim === "karo" ? "yeni liste" : "yeni bir liste aç");

  if (bicim === "karo") {
    return (
      <button
        type="button"
        onClick={onTikla}
        disabled={pasif}
        className={`bas block shrink-0 border-none bg-transparent p-0 disabled:pointer-events-none disabled:opacity-45 ${className}`}
        style={{ width: genislik }}
      >
        <Kart zemin="bos" dolgu="yok" yaricap="md" oran="1/1" className="w-full">
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-gri-500">
            <Arti boyut={Math.round(genislik * 0.22)} />
            <span className="text-2xs font-semibold lowercase leading-tight tracking-ui">{ad}</span>
          </span>
        </Kart>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onTikla}
      disabled={pasif}
      className={`bas block w-full border-none bg-transparent p-0 text-left disabled:pointer-events-none disabled:opacity-45 ${className}`}
    >
      {/* Satır biçiminde kabuk BEYAZ, çünkü seçim satırlarıyla aynı
          sütunda duruyor ve gri bir satır orada "devre dışı" okunur.
          "Bu asıl eylem değil" bilgisini kart değil, içindeki gri kare
          taşıyor — referanstaki gri karenin kendisi. */}
      <Kart zemin="beyaz" dolgu="yok" yaricap="lg" kat={1} className="w-full">
        <span className="flex items-center gap-3 p-3">
          <span className="grid size-13 shrink-0 place-items-center rounded-md bg-gri-100 text-gri-500">
            <Arti />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold lowercase leading-tight tracking-ui text-gri-800">
              {ad}
            </span>
            {altMetin && (
              <span className="mt-1 block truncate text-2xs lowercase leading-none tracking-ui text-gri-500">
                {altMetin}
              </span>
            )}
          </span>
        </span>
      </Kart>
    </button>
  );
}
