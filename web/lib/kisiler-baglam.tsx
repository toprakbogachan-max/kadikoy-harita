"use client";

import { createContext, useContext, useMemo } from "react";
import type { Kisi } from "./model";
import { kisileriGetir } from "./veri";
import { useVeri } from "./kanca";
import { useOturum } from "./oturum";

/**
 * Kişi kayıtları uygulamanın her yerinde lazım: avatar, hikaye şeridi, akıştaki
 * isim, yorum sahibi. Pin satırı yalnızca author_id (uuid) taşıyor.
 *
 * Her bileşende ayrı sorgu atmak yerine bir kez çekilip bağlamdan dağıtılıyor —
 * yoksa akıştaki 40 kart 40 profil isteği açardı.
 */
const Baglam = createContext<Record<string, Kisi>>({});

export function KisilerSaglayici({ children }: { children: React.ReactNode }) {
  const { veri } = useVeri(kisileriGetir, [], {} as Record<string, Kisi>);
  const { kullanici } = useOturum();

  /* `ben` işaretini burada koyuyoruz: veri katmanı oturumu bilmiyor, oturum
     da profilleri. İkisini birleştiren tek yer burası. */
  const kisiler = useMemo(() => {
    if (!kullanici) return veri;
    const k = { ...veri };
    if (k[kullanici.id]) k[kullanici.id] = { ...k[kullanici.id], ben: true };
    return k;
  }, [veri, kullanici]);

  return <Baglam.Provider value={kisiler}>{children}</Baglam.Provider>;
}

export const useKisiler = () => useContext(Baglam);
export const useKisi = (id: string | null | undefined): Kisi | undefined =>
  useContext(Baglam)[id ?? ""];

/** Şu an giriş yapan kişi. Auth eklenene kadar kullanıcı adından bulunuyor. */
export function useBen(): Kisi | undefined {
  const hepsi = useContext(Baglam);
  return Object.values(hepsi).find((k) => k.ben);
}
