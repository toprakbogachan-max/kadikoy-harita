"use client";

import { useEffect, useState } from "react";
import { kunyeYaz, type Kunye } from "@/lib/veri";

/**
 * Künye düzenleme — mekanın olgusal bilgileri.
 *
 * Bu alanlar DENEYİM değil OLGU: çalışma saati, rezervasyon gerekip
 * gerekmediği, sadece nakit olup olmadığı. Kim yazarsa yazsın aynı cevabı
 * vermeli. Pin ise tersi — orada kişinin kendi deneyimi anlatılıyor.
 *
 * place_facts wiki tarzı: giriş yapan herkes yazabiliyor ve satırın üstüne
 * yazabiliyor, ama imza (updated_by) yazana geçiyor ve mekan sayfasında
 * görünüyor. Silme politikası yok — yanlış bilgi düzeltilir, yok edilmez.
 *
 * KİŞİ BAŞI FİYAT BURADA YOK, bilerek. Pin formu zaten "ne ödedin" diye
 * soruyor (pins.price_paid); aynı olguyu ikinci kez sormak hem gereksiz
 * sürtünme hem de çelişki üretiyordu — Poyraz Kahve'de pin 210 TL derken
 * künye 180 TL diyordu. Fiyat artık pinlerin medyanından hesaplanıyor:
 * daha doğru, ve pinler biriktikçe kendini güncelliyor.
 */
export default function KunyeDuzenle({
  yerId, yerAdi, mevcut, onKapat, onKaydedildi,
}: {
  yerId: string;
  yerAdi: string;
  mevcut: Kunye | null;
  onKapat: () => void;
  onKaydedildi: () => void;
}) {
  const [uyari, setUyari] = useState(mevcut?.uyari ?? "");
  /* Üç durum: evet / hayır / bilinmiyor. "bilinmiyor" null olarak yazılıyor —
     rezervasyon gerekmediğini BİLMEK ile bilmemek farklı şeyler. */
  const [rezervasyon, setRezervasyon] = useState<"evet" | "hayir" | "">(
    mevcut?.rezervasyon === "gerekiyor" ? "evet" : mevcut?.rezervasyon === "gerekmiyor" ? "hayir" : "",
  );
  const [rezervasyonNotu, setRezervasyonNotu] = useState(mevcut?.rezervasyonNotu ?? "");
  const [enIyiSaat, setEnIyiSaat] = useState(mevcut?.enIyiSaat ?? "");
  const [sadeceNakit, setSadeceNakit] = useState(mevcut?.sadeceNakit === true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !gonderiliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, gonderiliyor]);

  const gonder = async () => {
    setGonderiliyor(true); setHata(null);
    try {
      await kunyeYaz(yerId, {
        uyari: uyari.trim() || null,
        rezervasyon: rezervasyon === "" ? null : rezervasyon === "evet",
        rezervasyonNotu: rezervasyonNotu.trim() || null,
        enIyiSaat: enIyiSaat.trim() || null,
        sadeceNakit: sadeceNakit ? true : null,
      });
      onKaydedildi();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  const girdi = "w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2 text-[14px] text-murekkep outline-none placeholder:text-murekkep2 focus:border-jeton";
  const etiket = "mb-1.5 block font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2";

  return (
    <div role="dialog" aria-modal="true" aria-label="Künye düzenle"
         className="absolute inset-0 z-[44] flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-tight">Künye</h2>
          <div className="mt-1.5 truncate font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            {yerAdi}
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-4 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-[12.5px] leading-snug text-murekkep2">
          Buradaki bilgiler <b className="text-murekkep">olgu</b>, deneyim değil — kim yazarsa
          yazsın aynı olmalı. Kendi deneyimini anlatmak için pin at. Yazdığın adınla
          görünüyor ve herkes düzeltebiliyor.
        </p>

        <label className="mb-4 block">
          <span className={etiket}>Gitmeden bilinmesi gereken</span>
          <textarea value={uyari} onChange={(e) => setUyari(e.target.value)}
            maxLength={200} rows={3}
            placeholder="örn. Pazartesi kapalı · Kapıda sadece nakit"
            className={girdi + " resize-none"} />
          <span className="mt-1 block text-[11.5px] leading-snug text-murekkep2">
            Mekan sayfasının en üstünde kırmızı kutuda çıkıyor. Yalnızca gerçekten
            önemli, doğrulanabilir şeyler için.
          </span>
        </label>

        <div className="mb-4">
          <span className={etiket}>Rezervasyon</span>
          <div className="flex gap-1.5">
            {([["evet", "Gerekiyor"], ["hayir", "Gerekmiyor"], ["", "Bilinmiyor"]] as const).map(
              ([id, ad]) => (
                <button key={ad} onClick={() => setRezervasyon(id)} aria-pressed={rezervasyon === id}
                  className={`rounded-sm px-2.5 py-1.5 font-tabela text-[11px] uppercase tracking-[0.1em] ${
                    rezervasyon === id ? "border-none bg-jeton text-white"
                      : "border border-[var(--cizgi)] bg-yuzey text-murekkep2"
                  }`}>
                  {ad}
                </button>
              ),
            )}
          </div>
          {rezervasyon === "evet" && (
            <input value={rezervasyonNotu} onChange={(e) => setRezervasyonNotu(e.target.value)}
              maxLength={80} placeholder="örn. hafta sonu 2 gün önceden"
              className={girdi + " mt-2"} />
          )}
        </div>

        <label className="mb-4 block">
          <span className={etiket}>En iyi saat</span>
          <input value={enIyiSaat} onChange={(e) => setEnIyiSaat(e.target.value)}
            maxLength={60} placeholder="örn. hafta içi 15:00–17:00" className={girdi} />
        </label>

        <button onClick={() => setSadeceNakit((v) => !v)} aria-pressed={sadeceNakit}
          className="mb-4 flex w-full items-center justify-between rounded-sm border border-[var(--cizgi)] bg-yuzey px-3 py-2.5 text-left">
          <span className="text-[13.5px]">Sadece nakit</span>
          <span className={`grid size-[20px] place-items-center rounded-sm text-[12px] ${
            sadeceNakit ? "bg-jeton text-white" : "border border-[var(--cizgi)]"
          }`}>
            {sadeceNakit ? "✓" : ""}
          </span>
        </button>

        {hata && (
          <p className="rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={gonder} disabled={gonderiliyor}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {gonderiliyor ? "…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
