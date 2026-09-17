"use client";

import type { ReactNode } from "react";
import Rozet, { type RozetTon } from "@/components/corner/primitives/Rozet";

/**
 * D2 — kayıt sayısı rozeti. Referanstaki `946 SAVES`.
 *
 * Tek işi var: bir sayıyı Kademe C sesiyle (BÜYÜK harf, küçük punto, ferah
 * aralık) pastel bir rozete yazmak. Kendi sayısını ÇEKMİYOR — kaç kayıt
 * olduğunu bilen taraf çağıran taraftır (mekan özeti `save_count` /
 * `pin_count` döndürüyor), bu bileşen yalnızca onu giydirir.
 *
 * Neden ayrı bir dosya, neden doğrudan <Rozet> değil: rozetin kendisi
 * biçim primitifi, buradaki üç karar ise İÇERİĞE ait —
 *   1) sayının binlik ayracı,
 *   2) Türkçe büyük harf JS'te (`toLocaleUpperCase("tr")`, "pin" → "PİN"),
 *   3) sıfırın ne anlama geldiği.
 * Üçü de her çağıran yerde tekrar edilecek kararlar; bir kez burada.
 *
 * Skill §3'ün katman 3'ü: pastel renk YALNIZCA rozette yaşar. Bu bileşeni
 * büyütüp bir kart başlığına çevirme — doygunluk alanla ters orantılı.
 */

export interface KayitRozetiProps {
  /** kaç kayıt/pin. Negatif ve ondalık gelirse sıfıra/tam sayıya çekilir. */
  sayi: number;
  /** sayının yanındaki sözcük. Küçük harf yazılır, kasa burada dönüyor. */
  etiket?: string;
  ton?: RozetTon;
  boy?: "kucuk" | "orta";
  /** emoji ya da svg — referansta yok, ama `🔖 946 KAYIT` da meşru. */
  ikon?: ReactNode;
  /** veri gelmeden yer tutucu: sayı görününce satır zıplamasın. */
  yukleniyor?: boolean;
  /**
   * Sayı 0 iken ne yazılacağı. Verilmezse rozet HİÇ ÇİZİLMEZ — "0 KAYIT"
   * bir bilgi değil, bir suçlama. Boş durum bir hata değil davet anıdır
   * (skill §6), o yüzden metni çağıran taraf seçer: "ilk kayıt sende".
   */
  sifirEtiketi?: string;
  className?: string;
}

/* Yer tutucu rozetin kendi ölçüsünde: text-2xs + py-1 ≈ 18px,
   text-xs + py-1.5 ≈ 25px. Rozetin dolgusunu değiştirirsen burayı da. */
const YER_TUTUCU: Record<"kucuk" | "orta", string> = {
  kucuk: "h-[18px] w-[64px]",
  orta: "h-[25px] w-[82px]",
};

/* Binlik ayracı elde: `toLocaleString("tr-TR")` sunucuda ve tarayıcıda
   farklı ICU'ya düşerse ("1240" / "1.240") hidrasyon uyuşmazlığı çıkar.
   Bu regex her yerde aynı sonucu verir ve tek işi üç basamakta bir nokta. */
const bicimle = (n: number) =>
  String(Math.max(0, Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* Türkçe kasa JS'te: `<html lang="tr">` altında Chrome CSS `uppercase`'i Türkçe yapıyor (ölçüldü: "pin" → "PİN"), ama iOS Safari doğrulanmadı ve bileşen `lang` bağlamına güvenmemeli — DENETIM-faz3 T19. */
const buyut = (s: string) => s.toLocaleUpperCase("tr");

export default function KayitRozeti({
  sayi,
  etiket = "kayıt",
  ton = "pembe",
  boy = "kucuk",
  ikon,
  yukleniyor = false,
  sifirEtiketi,
  className = "",
}: KayitRozetiProps) {
  if (yukleniyor) {
    return (
      <span
        aria-hidden
        className={`inline-block animate-pulse rounded-xs bg-gri-100 align-middle motion-reduce:animate-none ${YER_TUTUCU[boy]} ${className}`}
      />
    );
  }

  const n = Math.max(0, Math.trunc(sayi));

  if (n === 0) {
    if (!sifirEtiketi) return null;
    /* Sıfır pembe durmuyor: pembe "bak ne kadar çok" diyor. Nötr bej
       aynı rozet kalıbında ama sesi kısık — davet, övünme değil. */
    return (
      <Rozet ton="diger" boy={boy} ikon={ikon} className={className}>
        {buyut(sifirEtiketi)}
      </Rozet>
    );
  }

  return (
    <Rozet ton={ton} boy={boy} ikon={ikon} className={className}>
      {/* İkisi de rozetin doğrudan flex çocuğu: aradaki 4px boşluğu
          Rozet'in kendi gap-1'i veriyor, ayrıca boşluk koymaya gerek yok. */}
      <span className="font-sayi">{bicimle(n)}</span>
      <span>{buyut(etiket)}</span>
    </Rozet>
  );
}
