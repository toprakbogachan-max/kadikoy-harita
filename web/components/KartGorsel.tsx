"use client";

/**
 * Izgara kartlarının fotoğrafı.
 *
 * Eskiden object-cover'dı: 0.8 oranlı karta yatay bir fotoğraf konunca
 * yanlarından üçte biri kesiliyordu, kullanıcı da neyin gideceğini
 * seçemiyordu. Artık fotoğrafın TAMAMI görünüyor, kalan boşluğu kendi bulanık
 * kopyası dolduruyor — kırpma ekranındaki mantığın aynısı, yani kart, detay
 * ve kadraj ekranı aynı şeyi gösteriyor.
 *
 * Kırpma ekranından geçmiş 4:5 fotoğraflarda boşluk kalmıyor, kart tam
 * kanamalı duruyor; bu düzeltme asıl eski, kırpılmamış fotoğraflar için.
 */
export default function KartGorsel({ url, alt = "" }: { url: string; alt?: string }) {
  return (
    <>
      {/* scale-110: bulanıklık kenarlarda saydamlaşıyor, biraz taşırınca
          köşelerde açık şerit kalmıyor. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 size-full scale-110 object-cover blur-md"
      />
      {/* Izgarada onlarca kart var; lazy olmadan hepsi birden iniyordu. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative size-full object-contain"
      />
    </>
  );
}
