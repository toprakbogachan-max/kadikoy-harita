"use client";

import type { Liste } from "@/lib/model";
import ListeKapagi from "./ListeKapagi";

/**
 * Profil ızgarasındaki liste kartı.
 *
 * Yerleşim bilinçli olarak Corner'ın profil ızgarası: KARE kapak, adı
 * kapağın ALTINDA. Adı kapağın üstüne bindirmek ilk akla gelen şey ama
 * yanlış — kapak kullanıcının seçtiği fotoğraf, üstüne yazı ve koyu örtü
 * koymak onu bozar. Ad dışarıda durunca kapak temiz kalıyor ve iki kademe
 * de görevini yapıyor: fotoğraf enerjiyi, yazı otoriteyi taşıyor.
 *
 * Ad KULLANICININ YAZDIĞI GİBİ duruyor — uppercase'e çevrilmiyor. Kademe A
 * ağırlığı (800) ve sıkı aralığı korunuyor ama harf kasası kullanıcının:
 * listeyi adlandırmak bu ekranın bütün meselesi, "yağmurlu günler"i
 * "YAĞMURLU GÜNLER" yapmak o kararı elinden almak olurdu. (Türkçe İ/ı
 * dönüşümü de CSS uppercase'te bozuluyor.)
 */
export default function ListeKarti({
  liste,
  onAc,
}: {
  liste: Liste;
  onAc: () => void;
}) {
  return (
    <button
      onClick={onAc}
      className="group block w-full border-none bg-transparent p-0 text-left"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gri-100 shadow-kat-1">
        <ListeKapagi liste={liste} genislik={400} />
        {/* Sayaç camdan bir pill: kapağın üstüne koyu örtü sermeden okunuyor.
            Tam örtü gerekmiyor çünkü altında beyaz metin yok. */}
        <span className="cam absolute bottom-2 left-2 rounded-full px-2 py-0.5 font-sayi text-2xs font-semibold text-gri-800">
          {liste.yerler.length}
        </span>
      </div>
      <div className="px-0.5 pt-2 text-center">
        <div className="line-clamp-2 text-base font-extrabold leading-tight tracking-isim">
          {liste.baslik}
        </div>
      </div>
    </button>
  );
}

/**
 * Izgaranın son karosu: yeni liste.
 *
 * Metin bağlantısı değil karo — "+ Yeni liste" bölüm başlığının yanında
 * küçük gri bir yazıyken kimse görmüyordu. Izgarada diğer listelerle aynı
 * boyutta durunca "buraya bir tane daha koyabilirsin" kendiliğinden
 * okunuyor.
 */
export function YeniListeKarosu({ onTikla }: { onTikla: () => void }) {
  return (
    <button
      onClick={onTikla}
      className="block w-full border-none bg-transparent p-0 text-left"
    >
      <div className="grid aspect-square w-full place-items-center rounded-lg bg-yuzey shadow-kat-1">
        <span aria-hidden className="text-3xl font-extralight leading-none text-gri-400">
          +
        </span>
      </div>
      <div className="px-0.5 pt-2 text-center">
        <div className="text-base font-extrabold leading-tight tracking-isim text-gri-500">
          yeni liste
        </div>
      </div>
    </button>
  );
}
