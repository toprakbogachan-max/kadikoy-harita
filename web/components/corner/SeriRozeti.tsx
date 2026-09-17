"use client";

import type { ReactNode } from "react";
import { RozetSayac, type RozetTon } from "@/components/corner/primitives/Rozet";

/**
 * H2 — haftalık seri rozeti. Referansta `🔥 37 week streak`.
 *
 * Skill §14'ün bulgusu: oyunlaştırma sayıları küçük dairelerin içinde
 * PASTEL GRADYAN zeminde durur, yanlarında iki satırlık küçük harf gri
 * etiket. Biçimin tamamı `RozetSayac` primitifinde; bu dosya yalnızca
 * İÇERİĞE ait üç kararı veriyor —
 *   1) sayı ile durumun tona nasıl çevrildiği (soğuk → sıcak → bej),
 *   2) hangi emojinin hangi hâlin sesi olduğu,
 *   3) sıfırın ne anlama geldiği.
 * Üçü de her çağıran yerde tekrar edilecek kararlar; bir kez burada.
 *
 * Rozet ölçeğinde renk canlı olabilir (skill §3, doygunluk alanla ters
 * orantılı) — ama bu bileşeni büyütüp bir kart zeminine çevirme, 44
 * pikselde doğru olan şey 300 pikselde ucuz durur.
 *
 * ⚠ BU BİLEŞEN SAF SUNUMDUR — ve öyle kalmalı.
 * Uygulamada "seri" diye bir kavram YOK: ne tabloda bir sayaç, ne bir
 * hafta tanımı, ne de neyin seriyi ilerlettiğine dair bir karar var.
 * Hafta sayısı ve durum PROPS olarak gelir; burada fetch, şema tahmini
 * ya da `lib/` çağrısı YOKTUR. Hesaplama önerisi Faz 2 raporunda,
 * kararı ürünün.
 *
 * Kardeşi H9 (seri ipucu kartı — `bu haftayı tamamladın`, `seri şu tarihte
 * başladı`) cümleyi kuran yüzey ve ayrı bir iş. Rozet yalnızca sayıyı
 * söyler; nedenini, ne zaman düşeceğini, nasıl korunacağını o kart anlatır.
 * Bu yüzden burada üçüncü bir açıklama satırı YOK — iki satır etiket
 * rozetin sınırı.
 */

export type SeriDurumu =
  /** hiç seri yok (ya da düştü) — sayaç sıfırda */
  | "yok"
  /** seri sürüyor, bu hafta kayıtlı */
  | "suruyor"
  /** seri sürüyor ama BU HAFTA henüz boş — dokunulmazsa düşecek */
  | "risk";

export interface SeriRozetiProps {
  /** kaç haftadır sürüyor. Negatif ve ondalık gelirse sıfıra/tam sayıya çekilir. */
  hafta: number;
  /** verilmezse hafta 0 ise "yok", değilse "sürüyor" sayılır. */
  durum?: SeriDurumu;
  /** varsayılan cümleyi ez. Emoji dahil, kasa küçük harf. */
  etiket?: string;
  /** dairenin çapı. Profil başlığında 44, satır içinde 36. */
  boyut?: number;
  /**
   * Kaç haftadan sonra rozet "yanıyor" sayılsın. Bu bir ÜRÜN eşiği,
   * tasarım sabiti değil: dördüncü hafta seçildi çünkü bir ay demek.
   */
  atesEsigi?: number;
  /** veri gelmeden yer tutucu: sayı görününce satır zıplamasın. */
  yukleniyor?: boolean;
  /** seri ayrıntısı ekranına götüren dokunuş. Verilmezse rozet düğme değil. */
  onTikla?: () => void;
  className?: string;
}

/* Hâllerin sesi. Emoji burada süs değil arayüz elemanı (skill §6): rozetin
   tonu renk körü bir gözde kaybolduğunda hâli taşıyan tek işaret o kalıyor.

   Renk seçimi bilinçli olarak SOĞUKTAN SICAĞA gidiyor: yeni başlamış seri
   lila (sakin), bir ayı geçmiş seri pembe-krem (sıcak), risk ise krem-şeftali
   (uyarı ama pastel — durum rengi kırmızı DEĞİL, çünkü kırmızı bu dilde
   yalnızca "kapalı" ve "sil" demek). Sıfır bej: KayitRozeti'ndeki sıfırla
   aynı karar — davet övünmeyle aynı sesle konuşmaz. */
interface Hal {
  ton: RozetTon;
  ikinciTon: RozetTon;
  etiket: string;
}

const HAL: Record<"yok" | "yeni" | "yaniyor" | "risk", Hal> = {
  yok:     { ton: "diger", ikinciTon: "diger",  etiket: "😴 seri yok" },
  yeni:    { ton: "lila",  ikinciTon: "pembe",  etiket: "haftalık seri" },
  yaniyor: { ton: "pembe", ikinciTon: "kahve",  etiket: "🔥 haftalık seri" },
  risk:    { ton: "kahve", ikinciTon: "magaza", etiket: "⏳ bu hafta boş" },
};

export default function SeriRozeti({
  hafta,
  durum,
  etiket,
  boyut = 44,
  atesEsigi = 4,
  yukleniyor = false,
  onTikla,
  className = "",
}: SeriRozetiProps) {
  const n = Math.max(0, Math.trunc(hafta));
  const gercekDurum: SeriDurumu = durum ?? (n === 0 ? "yok" : "suruyor");

  if (yukleniyor) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center gap-2 ${className}`}
      >
        <span
          className="shrink-0 animate-pulse rounded-full bg-gri-100 motion-reduce:animate-none"
          style={{ width: boyut, height: boyut }}
        />
        <span className="flex flex-col gap-1">
          <span className="block h-2 w-14 animate-pulse rounded-xs bg-gri-100 motion-reduce:animate-none" />
          <span className="block h-2 w-9 animate-pulse rounded-xs bg-gri-100 motion-reduce:animate-none" />
        </span>
      </span>
    );
  }

  const anahtar =
    gercekDurum === "yok" ? "yok" : gercekDurum === "risk" ? "risk" : n >= atesEsigi ? "yaniyor" : "yeni";
  const hal = HAL[anahtar];
  const yazi = etiket ?? hal.etiket;

  const rozet = (
    <RozetSayac
      /* RozetSayac dairesi zaten font-sayi konuşuyor; sayı çıplak geçiyor. */
      sayi={n}
      etiket={yazi}
      ton={hal.ton}
      ikinciTon={hal.ikinciTon}
      boyut={boyut}
      className={onTikla ? "" : className}
    />
  );

  if (!onTikla) return rozet;

  /* Düğme hâlinde aria-label şart: görünen etiket emojiyle başlıyor ve
     ekran okuyucu "ateş emoji haftalık seri" diye okuyor. Sayıyı da
     cümleye alıyoruz, yoksa 37'yi hiç duymuyor. */
  return (
    <button
      type="button"
      onClick={onTikla}
      aria-label={`${n} haftalık seri — ayrıntıya bak`}
      className={`bas inline-flex border-none bg-transparent p-0 text-left ${className}`}
    >
      {rozet}
    </button>
  );
}

/**
 * Çift rozet satırı — referansta `🥉 new york rank` + `🔥 37 week streak`
 * yan yana duruyor (envanter H2: "çift rozet olarak da kullanılıyor").
 *
 * Yalnızca yerleşim: sarma, hizalama ve aralık. İkinci rozetin (sıralama)
 * KENDİ BİLEŞENİ YOK çünkü verisi de yok — "Kadıköy sıralaması" diye bir
 * hesap kurulu değil. O gelene kadar çağıran taraf `RozetSayac`ı doğrudan
 * kullanıyor; bu satır sadece ikisini aynı hizada tutuyor.
 *
 * Aralık cömert (20px): iki sayacın etiketleri birbirine yapışırsa hangi
 * etiketin hangi daireye ait olduğu okunmuyor.
 */
export function SeriRozetSatiri({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className}`}>
      {children}
    </div>
  );
}
