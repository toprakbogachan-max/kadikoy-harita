"use client";

import { fotoZemin, simgeSvg, zeminSimgeRengi } from "@/lib/gorsel";
import { emoji } from "@/lib/paleti";
import { oranliKucukUrl } from "@/lib/veri";
import type { Liste, Yer } from "@/lib/model";

/**
 * Bir listenin kapak görüntüsü — kart, liste sayfası ve kapak seçici
 * aynı kareyi çizsin diye tek yerde.
 *
 * Üç kademeli yedekleme, hiçbirinde boş gri kutu yok:
 *   1. sahibinin seçtiği kapak (lists.cover_url)
 *   2. listedeki ilk 3 mekanın kategori degradesinden kolaj
 *   3. hiç mekan yoksa tek degrade + kategori simgesi
 *
 * Kadraj (`kapakKonum`) object-position'ın DİKEY yüzdesi. Kapak kare kartta
 * gösteriliyor ama yüklenen fotoğraf kare değil; kullanıcı hangi bandın
 * görüneceğini seçiyor (göç 16, cover_pos). Yatay kaydırmıyoruz bilerek:
 * iki eksenli kadraj dokunmatik ekranda liste kaydırmasıyla kavga ediyor
 * ve kazandığı şey dikey seçimin yanında küçük.
 */
export default function ListeKapagi({
  liste,
  /* CDN'den kaç piksellik hâli istensin — ızgara kartı 320, liste sayfası
     ve seçici önizlemesi 800. Aynı tam boy fotoğrafı her yerde indirmek
     uygulamanın bilinen performans sorunu, burada tekrarlanmıyor. */
  genislik = 320,
  className = "",
}: {
  liste: Pick<Liste, "kapak" | "kapakKonum" | "yerler">;
  genislik?: number;
  className?: string;
}) {
  /* kucukUrl DEĞİL: o kareye kırpıyor ve kullanıcının seçtiği kadrajı
     anlamsız kılıyor (objectPosition olmayan pikseli gösteremez). */
  const foto = oranliKucukUrl(liste.kapak, genislik) ?? liste.kapak;

  if (foto) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={foto}
        alt=""
        loading="lazy"
        decoding="async"
        className={`size-full object-cover ${className}`}
        style={{ objectPosition: `50% ${liste.kapakKonum}%` }}
      />
    );
  }

  return <KolajZemin yerler={liste.yerler} className={className} />;
}

/**
 * Kapaksız listenin zemini: nötr zemin + ilk üç mekanın kategori EMOJİSİ.
 *
 * Neden mekanların kendi fotoğrafı değil: mekan kapağı en çok beğenilen
 * pinden geliyor (göç 07) ve sık değişiyor. Listenin kimliği bir sabah
 * birinin pini beğenildi diye değişmemeli.
 *
 * Eskiden kategori DEGRADELERİ yan yanaydı. Kategori rengi arayüzden
 * çekilince o üç şerit birbirinin aynı üç gri olarak kaldı — hiçbir şey
 * söylemiyordu. "Bu liste kahve + tatlı" bilgisini artık emoji taşıyor.
 */
export function KolajZemin({
  yerler,
  className = "",
}: {
  yerler: Pick<Yer, "id" | "tur">[];
  className?: string;
}) {
  const ilk = yerler.slice(0, 3);

  if (!ilk.length) {
    return (
      <div
        className={`grid size-full place-items-center ${className}`}
        style={{ background: fotoZemin() }}
      >
        <div
          className="opacity-50"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: simgeSvg("diger", 28, zeminSimgeRengi()) }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex size-full items-center justify-center gap-[6%] ${className}`}
      /* containerType: emoji kapağın boyutuna göre ölçekleniyor (cqw).
         Aynı bileşen hem 72 piksellik küçük kareyi hem tam genişlikteki
         bandı çiziyor; sabit punto birinde minicik, ötekinde devasa. */
      style={{ background: fotoZemin(), containerType: "size" }}
    >
      {ilk.map((y) => (
        <span key={y.id} aria-hidden className="text-[22cqw] leading-none">
          {emoji(y.tur)}
        </span>
      ))}
    </div>
  );
}
