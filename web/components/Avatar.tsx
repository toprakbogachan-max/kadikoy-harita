import { KISILER } from "@/lib/demo";

/** Profil fotoğrafı varsa onu, yoksa baş harfi gösterir. */
export default function Avatar({ kisi, boyut }: { kisi: string; boyut: number }) {
  const p = KISILER[kisi];
  if (!p) return null;

  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-tabela text-white shadow-[0_1px_3px_rgba(74,58,30,.25)]"
      style={{
        width: boyut,
        height: boyut,
        fontSize: boyut * 0.42,
        ...(p.foto
          ? { backgroundImage: `url(${p.foto})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: p.renk }),
      }}
    >
      {p.foto ? "" : p.ad[0]}
    </div>
  );
}
