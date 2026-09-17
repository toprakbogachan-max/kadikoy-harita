"use client";

import type { ReactNode } from "react";
import Pill, { OnayIsareti } from "@/components/corner/primitives/Pill";

/**
 * D5 — `gideceğim` / `gittim` ikilisi. Referansta `to try` / `been`.
 *
 * İki daire, ÜSTLERİNDE küçük harf etiket, üç durum: boş / gideceğim /
 * gittim. Envanter bölüm 6'nın 5 numaralı bulgusu: geçiş yay gibi ve
 * haptik eşlik ediyor (referansın ayarlarında `haptics` anahtarı var).
 *
 * ⚠ BU BİLEŞEN SAF SUNUMDUR — ve öyle kalmalı.
 * Uygulamada "gideceğim/gittim" diye bir veri yok: `saves` tablosu tek bir
 * kaydetme bayrağı tutuyor, "gittim"in şu anki tek kanıtı ise o mekana pin
 * atmış olmak (pin fotoğraf + puan + üç kelime istiyor, yani ağır bir
 * kanıt). İkisi aynı eksenin iki ucu ama şemada karşılığı yok.
 * Durum ve geri çağrı PROPS olarak gelir; burada fetch, şema tahmini ya da
 * `lib/` çağrısı YOKTUR. Veri modeli önerisi Faz 2 raporunda, kararı ürünün.
 *
 * Referanstan bilinçli ayrım: dolu `gideceğim` MAVİ DEĞİL NANE. Bu üründe
 * kaydetmenin rengi nane (MekanSayfasi'ndaki kaydet hapı da öyle); mavi
 * "çalışıyor / burada ara" için ayrılmış tek renkli istisna (skill §14).
 */

export type GidisDurumu = "yok" | "gidecegim" | "gittim";
type Secenek = Exclude<GidisDurumu, "yok">;

export interface GidecegimGittimProps {
  durum: GidisDurumu;
  /**
   * Bir sonraki durum. Aktif daireye tekrar dokunmak "yok"a döner —
   * kararı burada verip dışarı HAZIR veriyoruz, çağıran taraf da aynı
   * toggle'ı üçüncü kez yazmasın.
   */
  onDegis: (yeni: GidisDurumu) => void;
  /** giriş yapılmamış ya da demo hesap: ikisi de tıklanamaz. */
  pasif?: boolean;
  /** hangi daire ağ isteğini bekliyor — o dairede dönen halka çıkar. */
  yukleniyor?: Secenek | null;
  /** haptik geri bildirim. Desteklemeyen tarayıcıda sessizce atlanır. */
  haptik?: boolean;
  className?: string;
}

const AD: Record<Secenek, string> = {
  gidecegim: "gideceğim",
  gittim: "gittim",
};

/* Yer imi — boş hâlde çizgi, dolu hâlde dolu. Aynı yol iki kez çizilmiyor:
   dolduğunu anlatan şey biçim değişikliği değil, biçimin DOLMASI. */
const Imlec = ({ dolu }: { dolu: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={dolu ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
  >
    <path d="M6 3.6h12v17l-6-4.2-6 4.2z" />
  </svg>
);

/* Özellik algılaması: Safari'de `vibrate` hiç yok, masaüstü Chrome'da var
   ama titreşmiyor. İkisi de sorun değil — haptik bir SÜS, eksikliği
   etkileşimi bozmuyor, o yüzden sessizce atlanıyor. */
function titret(acik: boolean) {
  if (!acik || typeof navigator === "undefined") return;
  const n = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof n.vibrate !== "function") return;
  try {
    n.vibrate(12);
  } catch {
    /* kullanıcı jesti dışında çağrılırsa bazı tarayıcılar atıyor */
  }
}

function Daire({
  ad,
  aktif,
  ikon,
  dolgu,
  pasif,
  yukleniyor,
  onTikla,
}: {
  ad: string;
  aktif: boolean;
  ikon: ReactNode;
  dolgu: "beyaz" | "nane" | "siyah";
  pasif: boolean;
  yukleniyor: boolean;
  onTikla: () => void;
}) {
  return (
    <div className="flex w-[74px] flex-col items-center gap-1.5">
      {/* Etiket dairenin ÜSTÜNDE (envanter D5). Altına alınırsa iki
          daire birbirine yaklaşır ve ikili tek bir düğme gibi okunur. */}
      <span
        className={`text-2xs lowercase tracking-ui transition-colors duration-200 ease-yumusak ${
          aktif ? "font-bold text-gri-900" : "font-semibold text-gri-600"
        }`}
      >
        {ad}
      </span>
      {/* Hap primitifi kare kutuda daire oluyor (rounded-full + size-14),
          skill §5'in "oran şekli belirler" kuralı. Zıplama da onun:
          `zipla` yalnızca İKONU oynatıyor, kabı değil. */}
      <Pill
        ikon={ikon}
        dolgu={dolgu}
        aktif={aktif}
        zipla
        kat={2}
        pasif={pasif}
        yukleniyor={yukleniyor}
        etiket={ad}
        onTikla={onTikla}
        className="size-14"
      />
    </div>
  );
}

export default function GidecegimGittim({
  durum,
  onDegis,
  pasif = false,
  yukleniyor = null,
  haptik = true,
  className = "",
}: GidecegimGittimProps) {
  const sec = (id: Secenek) => {
    titret(haptik);
    onDegis(durum === id ? "yok" : id);
  };

  const gidecek = durum === "gidecegim";
  const gitti = durum === "gittim";

  return (
    <div role="group" aria-label="Gideceğim ya da gittim" className={`flex items-start gap-2 ${className}`}>
      <Daire
        ad={AD.gidecegim}
        aktif={gidecek}
        ikon={<Imlec dolu={gidecek} />}
        dolgu={gidecek ? "nane" : "beyaz"}
        pasif={pasif || yukleniyor === "gittim"}
        yukleniyor={yukleniyor === "gidecegim"}
        onTikla={() => sec("gidecegim")}
      />
      <Daire
        ad={AD.gittim}
        aktif={gitti}
        /* Dolu hâl TEK siyah çapa (skill §3): ekranda ikinci bir dolu
           siyah eleman varsa o değil bu geri çekilmeli. */
        ikon={<OnayIsareti boyut={20} kalinlik={gitti ? 2.8 : 2} />}
        dolgu={gitti ? "siyah" : "beyaz"}
        pasif={pasif || yukleniyor === "gidecegim"}
        yukleniyor={yukleniyor === "gittim"}
        onTikla={() => sec("gittim")}
      />
    </div>
  );
}
