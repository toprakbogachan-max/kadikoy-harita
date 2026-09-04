"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import type { Kisi } from "./model";
import { profilimiGetirId } from "./veri";

interface OturumDurumu {
  kullanici: User | null;
  ben: Kisi | null;
  yukleniyor: boolean;
  girisYap: (eposta: string, sifre: string) => Promise<void>;
  kayitOl: (eposta: string, sifre: string, kullaniciAdi: string, ad: string) => Promise<string | null>;
  cikisYap: () => Promise<void>;
  tazele: () => void;
}

const Baglam = createContext<OturumDurumu | null>(null);

/**
 * Oturum durumu — uygulamanın tek kimlik kaynağı.
 *
 * Profil satırını auth.users'a bağlı trigger açıyor (schema.sql → handle_new_user),
 * o yüzden kayıttan sonra ayrıca profil oluşturmuyoruz. Ama trigger insert'ten
 * hemen sonra çalıştığı için profil bir an gecikebilir; profilimiGetirId
 * bulamazsa null dönüyor ve arayüz "profil hazırlanıyor" durumunda kalıyor.
 */
export function OturumSaglayici({ children }: { children: React.ReactNode }) {
  const db = useMemo(() => createClient(), []);
  const [kullanici, setKullanici] = useState<User | null>(null);
  /* Profil, hangi kimlik için çekildiğiyle birlikte saklanıyor: `yukleniyor`
     ayrı bir state değil, "elimdeki profil güncel kullanıcıya mı ait" sorusundan
     türüyor. Efektin başında setState çağırmak (React'in uyardığı basamaklı
     render) böylece gerekmiyor. */
  const [profilDurumu, setProfilDurumu] =
    useState<{ icin: string | null; profil: Kisi | null }>({ icin: null, profil: null });
  const [sayac, setSayac] = useState(0);

  useEffect(() => {
    let iptal = false;

    /* getUser() getSession()'a tercih ediliyor: getSession çerezi doğrulamadan
       okuyor, getUser sunucuya sorup jetonu doğruluyor. */
    db.auth.getUser().then(({ data }) => {
      if (!iptal) setKullanici(data.user ?? null);
    });

    const { data: abone } = db.auth.onAuthStateChange((_olay, oturum) => {
      if (!iptal) setKullanici(oturum?.user ?? null);
    });
    return () => { iptal = true; abone.subscription.unsubscribe(); };
  }, [db]);

  const kimlik = kullanici?.id ?? null;
  useEffect(() => {
    let iptal = false;
    /* Çıkışta state'i sıfırlamaya gerek yok: `guncel` karşılaştırması
       tutmayacağı için `ben` zaten null dönüyor. Efektte senkron setState
       çağırmak basamaklı render üretiyordu. */
    if (!kimlik) return;
    profilimiGetirId(kimlik)
      .then((p) => { if (!iptal) setProfilDurumu({ icin: kimlik, profil: p }); })
      .catch((e) => {
        console.error("profil okunamadı:", e);
        if (!iptal) setProfilDurumu({ icin: kimlik, profil: null });
      });
    return () => { iptal = true; };
  }, [kimlik, sayac]);

  const guncel = profilDurumu.icin === kimlik;
  const ben = guncel ? profilDurumu.profil : null;
  const yukleniyor = !!kimlik && !guncel;

  const girisYap = useCallback(async (eposta: string, sifre: string) => {
    const { error } = await db.auth.signInWithPassword({ email: eposta, password: sifre });
    if (error) throw new Error(cevirHata(error.message));
  }, [db]);

  const kayitOl = useCallback(
    async (eposta: string, sifre: string, kullaniciAdi: string, ad: string) => {
      const { data, error } = await db.auth.signUp({
        email: eposta,
        password: sifre,
        options: {
          /* Trigger bu iki alanı okuyup profiles satırını dolduruyor */
          data: { username: kullaniciAdi, display_name: ad },
          /* Bu verilmezse Supabase projenin "Site URL" ayarına düşüyor —
             oradaki localhost yüzünden onay bağlantısı hata veriyordu.
             origin'i çalışma anında okuyoruz: geliştirmede localhost,
             canlıda vercel adresi, ikisi de kendiliğinden doğru. */
          emailRedirectTo: `${window.location.origin}/auth/onay`,
        },
      });
      if (error) throw new Error(cevirHata(error.message));
      /* Oturum yoksa Supabase e-posta doğrulaması bekliyor demektir */
      if (!data.session) return "E-postana doğrulama bağlantısı gönderildi. Onayladıktan sonra giriş yapabilirsin.";
      return null;
    },
    [db],
  );

  const cikisYap = useCallback(async () => { await db.auth.signOut(); }, [db]);
  const tazele = useCallback(() => setSayac((n) => n + 1), []);

  const deger = useMemo(
    () => ({ kullanici, ben, yukleniyor, girisYap, kayitOl, cikisYap, tazele }),
    [kullanici, ben, yukleniyor, girisYap, kayitOl, cikisYap, tazele],
  );
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useOturum(): OturumDurumu {
  const b = useContext(Baglam);
  if (!b) throw new Error("useOturum, OturumSaglayici içinde çağrılmalı");
  return b;
}

/** Supabase hataları İngilizce geliyor; sık görülenleri çeviriyoruz. */
function cevirHata(m: string): string {
  const t = m.toLowerCase();
  if (t.includes("invalid login credentials")) return "E-posta veya şifre yanlış.";
  if (t.includes("email not confirmed")) return "E-postanı henüz doğrulamamışsın.";
  if (t.includes("user already registered")) return "Bu e-posta zaten kayıtlı.";
  if (t.includes("password should be at least")) return "Şifre en az 6 karakter olmalı.";
  if (t.includes("unable to validate email")) return "E-posta adresi geçersiz.";
  if (t.includes("rate limit")) return "Çok fazla deneme. Biraz bekle.";
  return m;
}
