"use client";

import { useEffect, useRef, useState } from "react";
import { useOturum } from "@/lib/oturum";
import { profilGuncelle, avatarYukle } from "@/lib/veri";
import { kisiRengi } from "@/lib/gorsel";

/** Profil fotoğrafı bu boyuta indiriliyor — avatar en fazla 62px gösteriliyor,
 *  retina için 2x fazlasıyla yeter. Ham telefon fotoğrafı 4 MB olabiliyor. */
const AVATAR_PX = 256;

export default function ProfilDuzenle({ onKapat }: { onKapat: () => void }) {
  const { ben, tazele } = useOturum();
  const [ad, setAd] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const dosyaGirdi = useRef<HTMLInputElement>(null);

  /* Profil yüklenince formu bir kez doldur — sonraki yazışları ezmesin */
  const [dolduruldu, setDolduruldu] = useState(false);
  if (ben && !dolduruldu) {
    setDolduruldu(true);
    setAd(ben.ad); setBio(ben.bio); setFoto(ben.foto);
  }

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !kaydediliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, kaydediliyor]);

  const fotoSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.files?.[0];
    e.target.value = "";
    if (!d) return;
    setHata(null); setKaydediliyor(true);
    try {
      const kucuk = await kucult(d);
      const url = await avatarYukle(kucuk, "jpg");
      setFoto(url);
      tazele();
      setBilgi("Fotoğraf güncellendi.");
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally { setKaydediliyor(false); }
  };

  const kaydet = async () => {
    setKaydediliyor(true); setHata(null); setBilgi(null);
    try {
      await profilGuncelle({ ad, bio });
      tazele();
      onKapat();
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally { setKaydediliyor(false); }
  };

  const girdi = "w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2 text-[14px] outline-none placeholder:text-murekkep2 focus:border-jeton";

  return (
    <div role="dialog" aria-modal="true" aria-label="Profili düzenle"
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div className="flex items-center gap-2.5">
          <button onClick={onKapat} aria-label="Geri" disabled={kaydediliyor}
            className="shrink-0 border-none bg-transparent p-0 text-[18px] leading-none text-murekkep2 disabled:opacity-40">
            ‹
          </button>
          <h2 className="text-[20px] font-semibold leading-tight">Profili düzenle</h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center gap-3.5">
          {foto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={foto} alt="" className="size-[72px] shrink-0 rounded-full object-cover" />
          ) : (
            <div className="grid size-[72px] shrink-0 place-items-center rounded-full font-tabela text-[30px] text-white"
                 style={{ background: kisiRengi(ben?.k ?? "?") }}>
              {(ben?.ad ?? "?")[0]}
            </div>
          )}
          <div>
            <input ref={dosyaGirdi} type="file" accept="image/*" onChange={fotoSec} className="hidden" />
            <button onClick={() => dosyaGirdi.current?.click()} disabled={kaydediliyor}
              className="rounded-sm border border-[var(--cizgi)] bg-yuzey px-3 py-2 text-[13px] disabled:opacity-50">
              Fotoğraf seç
            </button>
            <p className="mt-1.5 text-[11.5px] text-murekkep2">
              Kare kırpılıp {AVATAR_PX}px’e küçültülür.
            </p>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2">
            Görünen ad
          </span>
          <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={40} className={girdi} />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2">
            Bio
          </span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            maxLength={200} rows={3}
            placeholder="Kendini bir iki cümleyle anlat"
            className={girdi + " resize-none leading-snug"} />
          <span className="mt-1 block text-right font-sayi text-[11px] text-murekkep2">
            {bio.length}/200
          </span>
        </label>

        <p className="mt-1 text-[11.5px] text-murekkep2">
          Kullanıcı adın <b className="font-sayi">@{ben?.k}</b> — şimdilik değiştirilemiyor.
        </p>

        {hata && (
          <p className="mt-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}
        {bilgi && (
          <p className="mt-3 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-[13px]">{bilgi}</p>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={kaydet} disabled={kaydediliyor || !ad.trim()}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {kaydediliyor ? "…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

/**
 * Fotoğrafı kare kırpıp küçültür — tarayıcıda, yüklemeden önce.
 *
 * Ham telefon fotoğrafı 4–8 MB olabiliyor; avatar en fazla 72px gösteriliyor.
 * Küçültmeden yüklemek hem kotayı hem kullanıcının internetini boşa harcar.
 * Merkezden kare kırpılıyor ki oran bozulmasın.
 */
function kucult(dosya: File): Promise<Blob> {
  return new Promise((coz, red) => {
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const kenar = Math.min(img.width, img.height);
      const sx = (img.width - kenar) / 2;
      const sy = (img.height - kenar) / 2;
      const t = document.createElement("canvas");
      t.width = t.height = AVATAR_PX;
      const c = t.getContext("2d");
      if (!c) return red(new Error("Görsel işlenemedi."));
      c.drawImage(img, sx, sy, kenar, kenar, 0, 0, AVATAR_PX, AVATAR_PX);
      t.toBlob((b) => (b ? coz(b) : red(new Error("Görsel dönüştürülemedi."))), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); red(new Error("Görsel okunamadı.")); };
    img.src = url;
  });
}
