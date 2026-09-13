"use client";

import { useKisi } from "@/lib/kisiler-baglam";
import { kisiRengi } from "@/lib/gorsel";

/**
 * Profil fotoğrafı varsa onu, yoksa baş harfi gösterir.
 *
 * Şekil kasıtlı olarak iki türlü (skill §5):
 *   squircle (varsayılan) → KİMLİK. Profil, akış kartı, arama sonucu.
 *   daire   (sekil="daire") → HARİTADAKİ NOKTA ve satır içi küçük avatar.
 * Tutarsızlık değil, ayrımın kendisi: yuvarlak kare "bu bir kişi",
 * tam daire "bu bir konum işareti ya da bir listedeki ufak iz".
 *
 * Yarıçap boyuta göre ölçekleniyor: sabit 22px, 20 pikselik bir avatarda
 * neredeyse daire yapıyordu, 84 piksellikte ise köşeler sert kalıyordu.
 */
export default function Avatar({
  kisi,
  boyut,
  sekil = "squircle",
}: {
  kisi: string;
  boyut: number;
  sekil?: "squircle" | "daire";
}) {
  const p = useKisi(kisi);
  const yaricap = sekil === "daire" ? "50%" : Math.round(boyut * 0.28);

  /* Kişiler bağlamı henüz dolmamış olabilir — boşluk yerine nötr bir kutu
     bırakılıyor ki kartların yerleşimi yükleme sırasında zıplamasın. */
  if (!p) {
    return (
      <div
        className="shrink-0 bg-gri-100"
        style={{ width: boyut, height: boyut, borderRadius: yaricap }}
      />
    );
  }

  return (
    <div
      className="grid shrink-0 place-items-center font-extrabold uppercase tracking-siki text-white"
      style={{
        width: boyut,
        height: boyut,
        borderRadius: yaricap,
        fontSize: boyut * 0.4,
        boxShadow: "var(--shadow-kat-1)",
        ...(p.foto
          ? { backgroundImage: `url(${p.foto})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: kisiRengi(p.k) }),
      }}
    >
      {p.foto ? "" : p.ad[0]}
    </div>
  );
}
