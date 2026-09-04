"use client";

import { useEffect, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { mekanAra, listeOlustur, kaydettigimYerler, pinlediklerim } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import { igneStil, simgeSvg } from "@/lib/gorsel";

/**
 * Liste oluşturma — "kendi küratörlüğün".
 *
 * Mekanlar üç kaynaktan seçiliyor: kaydettiklerin, PİNLEDİKLERİN, ya da
 * arama. İlk ikisi liste yapmanın doğal kaynağı — küratörlük yaparken zaten
 * gittiğin ya da not aldığın yerlerden seçiyorsun; her birini adıyla
 * aramak zorunda kalmak gereksiz sürtünmeydi.
 */
export default function ListeOlustur({
  onKapat, onOlusturuldu,
}: { onKapat: () => void; onOlusturuldu: () => void }) {
  const [baslik, setBaslik] = useState("");
  const [not, setNot] = useState("");
  const [q, setQ] = useState("");
  const [gecikmeli, setGecikmeli] = useState("");
  const [secilenler, setSecilenler] = useState<Yer[]>([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const z = setTimeout(() => setGecikmeli(q.trim()), 250);
    return () => clearTimeout(z);
  }, [q]);

  /* Hangi kaynağa bakılıyor — arama yapılırken ikisi de devre dışı. */
  const [kaynak, setKaynak] = useState<"kayit" | "pin">("kayit");
  const { veri: kayitlar } = useVeri<Yer[]>(kaydettigimYerler, [], []);
  const { veri: pinlerim } = useVeri<Yer[]>(pinlediklerim, [], []);
  const { veri: bulunanlar } = useVeri<Yer[]>(
    () => (gecikmeli.length >= 2 ? mekanAra(gecikmeli, 12) : Promise.resolve([])),
    [gecikmeli], []);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !gonderiliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, gonderiliyor]);

  const secili = (y: Yer) => secilenler.some((x) => x.id === y.id);
  const degistir = (y: Yer) =>
    setSecilenler((s) => (s.some((x) => x.id === y.id) ? s.filter((x) => x.id !== y.id) : [...s, y]));

  const aday = gecikmeli.length >= 2 ? bulunanlar : kaynak === "kayit" ? kayitlar : pinlerim;
  const gecerli = baslik.trim().length >= 2 && secilenler.length > 0;

  const gonder = async () => {
    setGonderiliyor(true); setHata(null);
    try {
      await listeOlustur(baslik, not, secilenler.map((y) => y.id));
      onOlusturuldu();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  const girdi = "w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2 text-[14px] outline-none placeholder:text-murekkep2 focus:border-jeton";
  const etiket = "mb-1.5 block font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2";

  return (
    <div role="dialog" aria-modal="true" aria-label="Yeni liste"
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">Yeni liste</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            Kendi küratörlüğün
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <label className="mb-3 block">
          <span className={etiket}>Başlık <span className="text-[#E0271C]">*</span></span>
          <input value={baslik} onChange={(e) => setBaslik(e.target.value)}
            maxLength={60} placeholder="örn. Yağmurlu günde Kadıköy" className={girdi} />
        </label>

        <label className="mb-4 block">
          <span className={etiket}>Kısa not</span>
          <input value={not} onChange={(e) => setNot(e.target.value)}
            maxLength={120} placeholder="Bu liste ne işe yarıyor?" className={girdi} />
        </label>

        <div className={etiket}>
          Mekanlar <span className="text-[#E0271C]">*</span>
          {secilenler.length > 0 && (
            <span className="ml-2 font-sayi normal-case tracking-normal">{secilenler.length} seçili</span>
          )}
        </div>

        {secilenler.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {secilenler.map((y) => (
              <button key={y.id} onClick={() => degistir(y)}
                className="flex items-center gap-1.5 rounded-sm border-none bg-jeton px-2 py-1.5 text-[12px] text-white">
                {y.ad} <span aria-hidden>✕</span>
              </button>
            ))}
          </div>
        )}

        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Mekan ara" aria-label="Mekan ara" className={girdi + " mb-2"} />

        {gecikmeli.length >= 2 ? (
          <div className="mb-1.5 text-[11.5px] text-murekkep2">Arama sonuçları</div>
        ) : (
          <div className="mb-1.5 flex gap-1.5">
            {([["kayit", "Kaydettiklerin", kayitlar.length], ["pin", "Pinlediklerin", pinlerim.length]] as const).map(
              ([id, ad, sayi]) => (
                <button
                  key={id}
                  onClick={() => setKaynak(id)}
                  aria-pressed={kaynak === id}
                  className={`rounded-sm px-2.5 py-1 font-tabela text-[11px] uppercase tracking-[0.1em] ${
                    kaynak === id
                      ? "border-none bg-jeton text-white"
                      : "border border-[var(--cizgi)] bg-yuzey text-murekkep2"
                  }`}
                >
                  {ad}{sayi > 0 && <span className="ml-1 font-sayi normal-case tracking-normal">{sayi}</span>}
                </button>
              ),
            )}
          </div>
        )}

        {aday.length ? (
          <ul className="m-0 list-none rounded-sm border border-[var(--cizgi)] bg-yuzey p-0">
            {aday.map((y) => (
              <li key={y.id}>
                <button onClick={() => degistir(y)} aria-pressed={secili(y)}
                  className="flex w-full items-center gap-2.5 border-none border-b border-[var(--cizgi)] bg-transparent px-2.5 py-2 text-left last:border-0">
                  <span style={igneStil(y.tur)} className="shrink-0"
                    dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 17, "var(--pin)") }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{y.ad}</span>
                    <span className="block font-sayi text-[10.5px] text-murekkep2">{y.semt}</span>
                  </span>
                  <span className={`grid size-[18px] shrink-0 place-items-center rounded-sm text-[11px] ${
                    secili(y) ? "bg-jeton text-white" : "border border-[var(--cizgi)]"
                  }`}>
                    {secili(y) ? "✓" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-[13px] leading-relaxed text-murekkep2">
            {gecikmeli.length >= 2
              ? "Eşleşen mekan yok."
              : kaynak === "kayit"
                ? "Henüz bir yer kaydetmedin — yukarıdan arayarak ekleyebilirsin."
                : "Henüz pin atmadın — yukarıdan arayarak da mekan ekleyebilirsin."}
          </p>
        )}

        {hata && (
          <p className="mt-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={gonder} disabled={!gecerli || gonderiliyor}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {gonderiliyor ? "…" : "Listeyi oluştur"}
        </button>
      </div>
    </div>
  );
}
