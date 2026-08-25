"use client";

import { useKisi } from "@/lib/kisiler-baglam";
import { kisiRengi } from "@/lib/gorsel";

/** Profil fotoğrafı varsa onu, yoksa baş harfi gösterir. */
export default function Avatar({ kisi, boyut }: { kisi: string; boyut: number }) {
  const p = useKisi(kisi);
  /* Kişiler bağlamı henüz dolmamış olabilir — boşluk yerine nötr bir daire
     bırakılıyor ki kartların yerleşimi yükleme sırasında zıplamasın. */
  if (!p) {
    return (
      <div
        className="shrink-0 rounded-full bg-[rgba(74,58,30,.14)]"
        style={{ width: boyut, height: boyut }}
      />
    );
  }

  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-tabela text-white shadow-[0_1px_3px_rgba(74,58,30,.25)]"
      style={{
        width: boyut,
        height: boyut,
        fontSize: boyut * 0.42,
        ...(p.foto
          ? { backgroundImage: `url(${p.foto})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: kisiRengi(p.k) }),
      }}
    >
      {p.foto ? "" : p.ad[0]}
    </div>
  );
}
