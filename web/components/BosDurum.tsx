"use client";

import { fotoZeminGenis } from "@/lib/gorsel";

/**
 * Boş liste = fotoğraflı çağrı kartı, boş beyaz ekran DEĞİL.
 *
 * Skill §6: "Boş durum bir hata değil, uygulamanın en güçlü davet anıdır."
 * Bir kullanıcı listeyi boş görüyorsa ona eksik bir şey değil, yapabileceği
 * bir şey gösterilir.
 *
 * Zemin: gerçek bir mekan fotoğrafı varsa o, yoksa kategori degradesinin
 * geceye karışmış hâli. İki durumda da üstünde KOYU ÖRTÜ var (.ortulu) —
 * beyaz metnin okunması için zorunlu, dekorasyon değil.
 *
 * Metin Kademe A (BÜYÜK, 800, sıkı) + Kademe B alt satır (küçük harf).
 * Düğme etiketi jenerik değil: ekrandaki cümlenin devamı.
 */
export default function BosDurum({
  baslik,
  alt,
  foto = null,
  tur = "kahve",
  eylem,
  eylemEtiketi,
}: {
  baslik: string;
  alt: string;
  /** gerçek mekan fotoğrafı — yoksa degrade */
  foto?: string | null;
  tur?: string;
  eylem?: () => void;
  eylemEtiketi?: string;
}) {
  return (
    <div
      className="ortulu mt-1 flex min-h-[220px] w-full flex-col justify-end overflow-hidden rounded-lg p-4 shadow-kat-1"
      style={{
        background: foto ? undefined : fotoZeminGenis(tur),
        ...(foto ? { backgroundImage: `url(${foto})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
      }}
    >
      <div className="relative z-[1]">
        <h3 className="text-2xl font-extrabold uppercase leading-tight tracking-siki text-white">
          {baslik}
        </h3>
        <p className="mt-1.5 max-w-[26ch] text-sm lowercase leading-snug text-white/85">{alt}</p>
        {eylem && eylemEtiketi && (
          <button
            onClick={eylem}
            className="mt-3.5 rounded-full border-none bg-white px-4 py-2.5 text-sm font-semibold lowercase tracking-ui text-gri-900 shadow-kat-2"
          >
            {eylemEtiketi}
          </button>
        )}
      </div>
    </div>
  );
}
