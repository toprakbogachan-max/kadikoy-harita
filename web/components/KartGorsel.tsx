"use client";

/**
 * Izgara kartlarının fotoğrafı — çerçeveyi dolduruyor.
 *
 * Bir ara "tamamı görünsün" diye object-contain denendi, boşluğu da bulanık
 * kopya dolduruyordu: kart yamalı duruyordu ve bantlar fotoğraf kırpılmış
 * gibi okunuyordu. Kart bir küçük resim; işi ızgarada taranabilmek. Fotoğrafın
 * tamamı bir dokunuş ötede, gönderi detayında object-contain ile duruyor.
 *
 * Kartın neyi göstereceğine karar vermek isteyen kadraj ekranını kullanıyor;
 * oradan 4:5 çıkan fotoğrafta zaten hiçbir şey kesilmiyor.
 */
export default function KartGorsel({ url, alt = "" }: { url: string; alt?: string }) {
  return (
    /* Izgarada onlarca kart var; lazy olmadan hepsi birden iniyordu. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="size-full object-cover"
    />
  );
}
