"use client";

import { useState } from "react";
import { useOturum } from "@/lib/oturum";

type Mod = "giris" | "kayit";

/**
 * Giriş / kayıt ekranı.
 *
 * Profil satırını auth.users trigger'ı açıyor (schema.sql → handle_new_user),
 * burada ayrıca profil oluşturmuyoruz. Kullanıcı adı kayıt sırasında
 * user_metadata'ya yazılıyor, trigger oradan okuyor.
 */
export default function Giris({ onKapat }: { onKapat: () => void }) {
  const { girisYap, kayitOl } = useOturum();
  const [mod, setMod] = useState<Mod>("giris");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [ad, setAd] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null); setBilgi(null); setGonderiliyor(true);
    try {
      if (mod === "giris") {
        await girisYap(eposta.trim(), sifre);
        onKapat();
      } else {
        /* Şemadaki check: ^[a-z0-9_]{3,24}$ — sunucuya boşuna gitmesin */
        const k = kullaniciAdi.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(k)) {
          throw new Error("Kullanıcı adı 3–24 karakter olmalı; sadece küçük harf, rakam ve _");
        }
        if (!ad.trim()) throw new Error("Görünen adını yaz.");
        const mesaj = await kayitOl(eposta.trim(), sifre, k, ad.trim());
        if (mesaj) setBilgi(mesaj);
        else onKapat();
      }
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally {
      setGonderiliyor(false);
    }
  };

  const girdi = "w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2 text-[14px] text-murekkep outline-none placeholder:text-murekkep2 focus:border-jeton";

  return (
    <div role="dialog" aria-modal="true" aria-label={mod === "giris" ? "Giriş yap" : "Kayıt ol"}
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <h2 className="text-[20px] font-semibold leading-tight">
          {mod === "giris" ? "Giriş yap" : "Hesap oluştur"}
        </h2>
        <button onClick={onKapat} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none">
          ✕
        </button>
      </div>

      <form onSubmit={gonder} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {mod === "kayit" && (
          <>
            <label className="block">
              <span className="mb-1 block font-tabela text-[11px] uppercase tracking-[0.11em] text-murekkep2">Görünen ad</span>
              <input value={ad} onChange={(e) => setAd(e.target.value)}
                autoComplete="name" placeholder="Bogaç" className={girdi} />
            </label>
            <label className="block">
              <span className="mb-1 block font-tabela text-[11px] uppercase tracking-[0.11em] text-murekkep2">Kullanıcı adı</span>
              <input value={kullaniciAdi} onChange={(e) => setKullaniciAdi(e.target.value)}
                autoComplete="username" placeholder="bogac" className={girdi} />
              <span className="mt-1 block text-[11px] text-murekkep2">
                Küçük harf, rakam ve alt çizgi. 3–24 karakter.
              </span>
            </label>
          </>
        )}

        <label className="block">
          <span className="mb-1 block font-tabela text-[11px] uppercase tracking-[0.11em] text-murekkep2">E-posta</span>
          <input value={eposta} onChange={(e) => setEposta(e.target.value)}
            type="email" autoComplete="email" placeholder="ornek@eposta.com" className={girdi} />
        </label>

        <label className="block">
          <span className="mb-1 block font-tabela text-[11px] uppercase tracking-[0.11em] text-murekkep2">Şifre</span>
          <input value={sifre} onChange={(e) => setSifre(e.target.value)}
            type="password"
            autoComplete={mod === "giris" ? "current-password" : "new-password"}
            placeholder="••••••••" className={girdi} />
        </label>

        {hata && (
          <p className="rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px] leading-snug">
            {hata}
          </p>
        )}
        {bilgi && (
          <p className="rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-[13px] leading-snug">
            {bilgi}
          </p>
        )}

        <button type="submit" disabled={gonderiliyor}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-50">
          {gonderiliyor ? "…" : mod === "giris" ? "Giriş yap" : "Hesap oluştur"}
        </button>

        <button type="button"
          onClick={() => { setMod(mod === "giris" ? "kayit" : "giris"); setHata(null); setBilgi(null); }}
          className="w-full border-none bg-transparent py-1 text-[13px] text-murekkep2 underline">
          {mod === "giris" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </form>
    </div>
  );
}
