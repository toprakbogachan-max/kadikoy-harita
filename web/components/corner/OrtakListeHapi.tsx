"use client";

import type { ReactNode } from "react";
import Pill, { OnayIsareti } from "@/components/corner/primitives/Pill";
import Avatar from "@/components/corner/primitives/Avatar";

/**
 * F2 — ortak liste hapı. Referansta `👤 collaborate`.
 *
 * Liste detayının başlık bloğunda duran, "bu listeyi benimle doldur" diyen
 * tek düğme. Biçimi envanterde net: BEYAZ hap, DEGRADE KENARLIK. Degrade
 * burada zemin değil çerçeve olduğu için skill §3'ün "UI elemanını
 * renklendirme" kuralını bozmuyor — renk 1.5 pikselik bir hat kadar yer
 * kaplıyor, hapın içi beyaz kalıyor. Degrade PASTEL (lila → pembe);
 * referansın doygun mor-mavisi bu üründe geniş yüzeyde yasak.
 *
 * ⚠ BU BİLEŞEN SAF SUNUMDUR — ve öyle kalmalı.
 * Uygulamada ortak liste diye bir şey YOK: `lists` tablosunda tek bir
 * `owner_id` var, katkıcı tablosu, davet bağlantısı, çoklu yazma yetkisi
 * hiçbiri kurulu değil. Buradaki katkıcı listesi ve "kopyalandı" durumu
 * PROPS olarak gelir; fetch, şema tahmini ya da `lib/` çağrısı YOKTUR.
 *
 * Ürün kararı (2026-09-17): ortak liste YOL HARİTASINDA. Katkıcı tablosu,
 * davet bağlantısı ve çoklu yazma için RLS ayrı bir veri modeli işi olarak
 * planlanacak; o kurulana kadar bu hap montaja girmiyor.
 *
 * Kardeşi F8 (`curate with your crew` modalı) bu hapın açtığı yüzey ve
 * ayrı bir iş — bu dosya onu ÇAĞIRMIYOR, yalnızca `onTikla` veriyor.
 */

/** Hapın solundaki kümede çizilecek kadarı. Kimlik `lib/model.ts` Kisi'den
 *  türetilebilir ama bileşen ONU BİLMİYOR: ad, foto ve renk yeter. */
export interface Katkici {
  id: string;
  ad?: string;
  foto?: string | null;
  /** fotosuz avatarın zemini; verilmezse nötr gri kutu. */
  renk?: string;
}

export type OrtakListeDurumu = "davet" | "kopyalandi";

export interface OrtakListeHapiProps {
  /** listeye birlikte yazan kişiler. Boşsa hap "birlikte dolduralım" der. */
  katkicilar?: Katkici[];
  durum?: OrtakListeDurumu;
  /** davet bağlantısı üretiliyor: ikon yuvasında dönen halka. */
  yukleniyor?: boolean;
  /** başkasının listesi, giriş yok ya da demo hesap. */
  pasif?: boolean;
  /** varsayılan cümleyi ez — pasif hâlde "sahibi davet edebilir" gibi. */
  etiket?: string;
  boy?: "kucuk" | "orta";
  /** liste başlığının altında tam genişlik de duruyor (boş liste ekranı). */
  tamGenislik?: boolean;
  onTikla?: () => void;
  className?: string;
}

/* Kümede en fazla üç yüz görünür, gerisi sayıya düşer. Dördüncü avatar
   hapın metnini 24 piksel daraltıyor ve dar ekranda cümleyi kırpıyor —
   "kimler var" sorusunu üç yüz zaten cevaplıyor, tam sayım F8 modalının
   işi. */
const KUME_SINIRI = 3;

/* Küçük harf küme ikonu: `👥` emoji olarak da yeterdi ama katkıcı varken
   yerini avatarlar alıyor, yani emoji yalnızca BOŞ hâlin sesi. */
const KUME_IKONU = "👥";

export default function OrtakListeHapi({
  katkicilar = [],
  durum = "davet",
  yukleniyor = false,
  pasif = false,
  etiket,
  boy = "orta",
  tamGenislik = false,
  onTikla,
  className = "",
}: OrtakListeHapiProps) {
  const kopyalandi = durum === "kopyalandi";
  const sayi = katkicilar.length;

  /* Cümleler Kademe B: küçük harf, marka sesi, jenerik fiil yok.
     "Davet et" değil "birlikte dolduralım" — hap bir emir değil teklif.
     Katkıcı varken cümle değişiyor çünkü soru da değişiyor: artık "bu
     liste ortak mı" değil, "bir kişi daha var mı". */
  const cumle =
    etiket ??
    (kopyalandi
      ? "kopyaladım, yolla"
      : sayi > 0
        ? "birini daha çağır"
        : "birlikte dolduralım");

  /* Ekran okuyucu avatarları görmüyor: kaç kişi olduğunu cümleye ekliyoruz.
     Görsel metni tekrar etmek yerine ONU DA içeriyor, yoksa aria-label
     görünen etiketi tamamen bastırır. */
  const okunur =
    sayi > 0 && !kopyalandi ? `${sayi} kişi bu listeyi dolduruyor · ${cumle}` : cumle;

  const ikon: ReactNode = kopyalandi ? (
    <OnayIsareti boyut={14} />
  ) : sayi > 0 ? (
    <Kume katkicilar={katkicilar} />
  ) : (
    KUME_IKONU
  );

  return (
    <Pill
      kenar="degrade"
      /* Degrade kenarlıkta zemin satır içi geliyor; dolgu yalnızca yazı
         rengini taşır, o da Pill içinde gri-900'e sabitleniyor. */
      dolgu="beyaz"
      boy={boy}
      kat={2}
      ikon={ikon}
      /* Kopyalama bir DURUM DEĞİŞİMİ: renk dönmesi tek başına zayıf onay,
         ikon zıplasın (skill §13 kalıp 4). */
      zipla
      aktif={kopyalandi}
      yukleniyor={yukleniyor}
      pasif={pasif}
      tamGenislik={tamGenislik}
      okunur={okunur}
      onTikla={onTikla}
      /* max-w-full olmadan hap `whitespace-nowrap` yüzünden kapsayıcıyı
         aşıyor ve 390 pikselde degrade kenarlık ekranın dışına taşıyor.
         Sınırı burada koyunca içerideki `truncate` devreye giriyor. */
      className={`max-w-full ${className}`}
    >
      {cumle}
    </Pill>
  );
}

/* Üst üste binen daire avatarlar. Şekil DAİRE, squircle değil: Avatar
   primitifinin kuralı squircle = kimlik sayfası, daire = satır içi küçük
   iz. Buradaki yüzler kimlik değil "kimler var" izi.

   Beyaz halka üst üste binmeyi okunur yapan tek şey — halkasız avatarlar
   tek bir lekeye dönüşüyor. */
function Kume({ katkicilar }: { katkicilar: Katkici[] }) {
  const gorunen = katkicilar.slice(0, KUME_SINIRI);
  const artan = katkicilar.length - gorunen.length;

  return (
    /* normal-case ŞART: Pill içeriğine `lowercase` uyguluyor ve ikon yuvası
       onu miras alıyor. Avatar baş harfi JS'te Türkçe büyütüyor ("İsmail" →
       "İ") ama CSS onu ekranda "i"ye geri çeviriyordu — kişi adı asla
       küçültülmez (skill §4).

       zIndex: ilk yüz üstte, sonrakiler altından çıkıyor — primitif
       önizlemesindeki (`/tasarim/primitifler`) küme kalıbıyla aynı. Flex
       öğesi olduğu için konumlandırma gerekmeden işliyor. */
    <span className="inline-flex items-center normal-case">
      {gorunen.map((k, i) => (
        <span key={k.id} className={i === 0 ? "" : "-ml-1.5"} style={{ zIndex: KUME_SINIRI + 1 - i }}>
          <Avatar
            ad={k.ad}
            foto={k.foto ?? undefined}
            renk={k.renk}
            boyut="xs"
            sekil="daire"
            halka="beyaz"
            kat={0}
          />
        </span>
      ))}
      {artan > 0 && (
        <span
          className="-ml-1.5 grid size-5 place-items-center rounded-full bg-gri-100 font-sayi text-2xs font-bold leading-none text-gri-700"
          /* Sayaç yığının EN ÜSTÜNDE: yüzler ilk-üstte dizildiği için sayaç
             son yüzün altında kalıyor ve "+" işareti örtülüyordu. */
          style={{ boxShadow: "0 0 0 2px var(--color-yuzey)", zIndex: KUME_SINIRI + 2 }}
        >
          {`+${artan}`}
        </span>
      )}
    </span>
  );
}

