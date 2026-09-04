"use client";

import { useEffect, useRef, useState } from "react";
import { pinGuncelle, medyaUrl, type YeniMedya, type KalanMedya } from "@/lib/veri";
import type { Pin } from "@/lib/model";
import {
  Cip, Onizleme, SENARYOLAR, SIKLIKLAR, TEKRARLAR, METIN_MIN, METIN_MAX,
} from "./PinFormu";
import BuyukGorsel from "./BuyukGorsel";

/**
 * Pin düzenleme.
 *
 * Bu ekran YOKTU: pinAt hata verirken "Var olanı düzenleyebilirsin" diyordu
 * ama düzenleme diye bir şey hiç yazılmamıştı. Politikalar (p_pins_update,
 * p_media_write) baştan beri hazırdı, eksik olan yalnızca arayüzdü.
 *
 * MEKAN değiştirilemiyor: pin bir mekana bırakılmış not, başka mekana taşımak
 * onu başka bir şey yapardı.
 *
 * Mevcut görseller listede duruyor — kullanıcının istediği buydu: pin atarken
 * yüklediğini düzenlerken de görmek. Yenileri eklenebiliyor, eskiler
 * kaldırılabiliyor, ama en az biri kalmak zorunda (assert_pin_has_media).
 */
export default function PinDuzenle({
  pin, onKapat, onKaydedildi,
}: {
  pin: Pin;
  onKapat: () => void;
  onKaydedildi: () => void;
}) {
  const [metin, setMetin] = useState(pin.metin);
  const [kelimeler, setKelimeler] = useState<[string, string, string]>([
    pin.kelimeler[0] ?? "", pin.kelimeler[1] ?? "", pin.kelimeler[2] ?? "",
  ]);
  const [senaryo, setSenaryo] = useState(pin.senaryo ?? "");
  const [puan, setPuan] = useState(pin.puan ?? 7);
  const [degisse, setDegisse] = useState(pin.degisse ?? "");
  const [siklik, setSiklik] = useState(pin.siklik ?? "");
  const [tekrar, setTekrar] = useState(pin.tekrar ?? "");
  const [fiyat, setFiyat] = useState(pin.fiyat != null ? String(pin.fiyat) : "");

  /* Mevcut medyalar yol ile tutuluyor; silinen listeden çıkıyor. */
  const [kalan, setKalan] = useState<KalanMedya[]>(
    pin.medyalar.filter((m) => m.yol).map((m) => ({ yol: m.yol, not: m.not ?? "" })),
  );
  const [yeniler, setYeniler] = useState<YeniMedya[]>([]);
  const dosyaGirdi = useRef<HTMLInputElement>(null);

  /* Hangi görsel büyütülmüş — kalan/yeni listesindeki konumuyla. */
  const [buyuk, setBuyuk] = useState<{ tur: "kalan" | "yeni"; i: number; nota?: boolean } | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !gonderiliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, gonderiliyor]);

  const medyaSayisi = kalan.length + yeniler.length;
  const gecerli =
    metin.trim().length >= METIN_MIN &&
    kelimeler.every((k) => k.trim().length > 0) &&
    !!senaryo &&
    medyaSayisi > 0;

  const gonder = async () => {
    setGonderiliyor(true); setHata(null);
    try {
      await pinGuncelle(pin.id, {
        metin,
        kelimeler: kelimeler.map((k) => k.trim()) as [string, string, string],
        senaryo, puan,
        degisse, siklik, tekrar,
        fiyat: fiyat ? Number(fiyat) : undefined,
        kalanMedyalar: kalan,
        yeniMedyalar: yeniler,
      });
      onKaydedildi();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  const alan = "px-4 py-3.5 border-b border-[var(--cizgi)]";
  const etiket = "mb-2 block font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2";
  const girdi = "w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2 text-[14px] text-murekkep outline-none placeholder:text-murekkep2 focus:border-jeton";

  return (
    <div role="dialog" aria-modal="true" aria-label="Pini düzenle"
         className="absolute inset-0 z-[46] flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-tight">Pini düzenle</h2>
          <div className="mt-1.5 truncate font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            {pin.yerAdi}
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ---- görseller ---- */}
        <div className={alan}>
          <label className={etiket}>
            Fotoğraf ya da video
            <span className="ml-2 font-sayi normal-case tracking-normal">{medyaSayisi} dosya</span>
          </label>

          {kalan.map((m, i) => (
            /* Satırın BOŞ alanına dokunmak da görseli büyütüyor: 52px'lik
               kutuyu parmakla tutturmak zor, kartın tamamı hedef olmalı.
               Not alanı ve kaldırma düğmesi kendi tıklamalarını durduruyor,
               yoksa nota yazmaya çalışırken katman açılırdı. */
            <div key={m.yol} onClick={() => setBuyuk({ tur: "kalan", i })}
                 className="mb-2 flex cursor-pointer gap-2.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2">
              {/* Küçük kutuya dokununca büyüyor: 52px'de ne fotoğraf seçilebiliyor
                  ne de not rahat yazılabiliyordu. Demo tohumunun medyası demo://
                  yolunda ve medyaUrl null dönüyor — boş <img> yerine yer tutucu. */}
              <button onClick={() => setBuyuk({ tur: "kalan", i })} aria-label="Görseli büyüt"
                      className="shrink-0 border-none bg-transparent p-0">
                {medyaUrl(m.yol) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={medyaUrl(m.yol)!} alt="" className="size-[52px] rounded-sm object-cover" />
                ) : (
                  <span className="grid size-[52px] place-items-center rounded-sm bg-[rgba(35,52,60,.07)] font-sayi text-[9px] text-murekkep2">
                    görsel
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1 font-sayi text-[10.5px] text-murekkep2">yüklenmiş</div>
                {/* Artık düzenlenebilir alan DEĞİL, özet. Dokununca büyük ekran
                    açılıyor ve imleç oradaki not alanına gidiyor — tek satırlık
                    kutuya 120 karakter sığmıyordu. */}
                <div
                  onClick={(e) => { e.stopPropagation(); setBuyuk({ tur: "kalan", i, nota: true }); }}
                  className={`w-full truncate rounded-sm border border-[var(--cizgi)] bg-kagit px-2 py-1.5 text-[12.5px] ${
                    m.not ? "text-murekkep" : "text-murekkep2"
                  }`}
                >
                  {m.not || "Bu görselin notu (isteğe bağlı)"}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setKalan((l) => l.filter((_, j) => j !== i)); }}
                disabled={medyaSayisi <= 1}
                aria-label="Kaldır"
                title={medyaSayisi <= 1 ? "En az bir görsel kalmalı" : "Kaldır"}
                className="shrink-0 self-start border-none bg-transparent p-0 text-[14px] text-murekkep2 disabled:opacity-25"
              >
                ✕
              </button>
            </div>
          ))}

          {yeniler.map((m, i) => (
            <div key={i} onClick={() => setBuyuk({ tur: "yeni", i })}
                 className="mb-2 flex cursor-pointer gap-2.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2">
              <button onClick={() => setBuyuk({ tur: "yeni", i })} aria-label="Görseli büyüt"
                      className="shrink-0 border-none bg-transparent p-0">
                <Onizleme dosya={m.dosya} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1 truncate text-[12px] text-murekkep2">{m.dosya.name}</div>
                <div
                  onClick={(e) => { e.stopPropagation(); setBuyuk({ tur: "yeni", i, nota: true }); }}
                  className={`w-full truncate rounded-sm border border-[var(--cizgi)] bg-kagit px-2 py-1.5 text-[12.5px] ${
                    m.not ? "text-murekkep" : "text-murekkep2"
                  }`}
                >
                  {m.not || "Bu görselin notu (isteğe bağlı)"}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setYeniler((l) => l.filter((_, j) => j !== i)); }}
                aria-label="Kaldır"
                className="shrink-0 self-start border-none bg-transparent p-0 text-[14px] text-murekkep2">
                ✕
              </button>
            </div>
          ))}

          <input ref={dosyaGirdi} type="file" accept="image/*,video/*" multiple
            onChange={(e) => {
              const d = Array.from(e.target.files ?? []).map((f) => ({ dosya: f, not: "" }));
              setYeniler((l) => [...l, ...d]);
              e.target.value = "";
            }}
            className="hidden" />
          <button onClick={() => dosyaGirdi.current?.click()}
            className="w-full rounded-sm border border-dashed border-[var(--cizgi)] bg-transparent py-2.5 text-[13px] text-murekkep2">
            + Fotoğraf / video ekle
          </button>
        </div>

        {/* ---- üç kelime ---- */}
        <div className={alan}>
          <label className={etiket}>Üç kelimeyle anlat</label>
          <div className="grid grid-cols-3 gap-2">
            {kelimeler.map((k, i) => (
              <input key={i} value={k} maxLength={20}
                onChange={(e) => setKelimeler((l) => l.map((x, j) => (j === i ? e.target.value : x)) as [string, string, string])}
                placeholder={`${i + 1}.`} className={girdi} />
            ))}
          </div>
        </div>

        {/* ---- senaryo ---- */}
        <div className={alan}>
          <label className={etiket}>Geliş senaryosu</label>
          <div className="flex flex-wrap gap-1.5">
            {SENARYOLAR.map((sc) => (
              <Cip key={sc} secili={senaryo === sc} onTikla={() => setSenaryo(sc)}>{sc}</Cip>
            ))}
          </div>
        </div>

        {/* ---- puan ---- */}
        <div className={alan}>
          <label className={etiket}>
            Bana hitap puanı
            <span className="ml-2 font-sayi normal-case tracking-normal text-jeton">{puan}</span>
          </label>
          <input type="range" min={1} max={10} step={0.5} value={puan}
            onChange={(e) => setPuan(Number(e.target.value))} className="w-full" />
        </div>

        {/* ---- metin ---- */}
        <div className={alan}>
          <label className={etiket}>
            Gitmeden bilinmesi gereken
            <span className="ml-2 font-sayi normal-case tracking-normal">
              {metin.trim().length}/{METIN_MIN} en az
            </span>
          </label>
          <textarea value={metin} onChange={(e) => setMetin(e.target.value)}
            maxLength={METIN_MAX} rows={4} className={girdi + " resize-none"} />
        </div>

        {/* ---- isteğe bağlı ---- */}
        <div className={alan}>
          <label className={etiket}>İstersen birkaç şey daha</label>
          <input value={degisse} onChange={(e) => setDegisse(e.target.value)}
            maxLength={200} placeholder="Bir şey değişse…" className={girdi + " mb-2"} />
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SIKLIKLAR.map((sk) => (
              <Cip key={sk} secili={siklik === sk} onTikla={() => setSiklik(siklik === sk ? "" : sk)}>{sk}</Cip>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {TEKRARLAR.map((tk) => (
              <Cip key={tk} secili={tekrar === tk} onTikla={() => setTekrar(tekrar === tk ? "" : tk)}>
                tekrar gider miyim: {tk}
              </Cip>
            ))}
          </div>
          <input value={fiyat} onChange={(e) => setFiyat(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric" maxLength={5} placeholder="Kişi başı ödediğin (₺)" className={girdi} />
        </div>

        {hata && (
          <p className="mx-4 mt-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}
      </div>

      {buyuk && (buyuk.tur === "kalan" ? kalan[buyuk.i] : yeniler[buyuk.i]) && (
        <BuyukGorsel
          kaynak={
            buyuk.tur === "kalan"
              ? { tip: "yol", yol: kalan[buyuk.i].yol }
              : { tip: "dosya", dosya: yeniler[buyuk.i].dosya }
          }
          not={buyuk.tur === "kalan" ? kalan[buyuk.i].not : yeniler[buyuk.i].not}
          onNot={(v) =>
            buyuk.tur === "kalan"
              ? setKalan((l) => l.map((x, j) => (j === buyuk.i ? { ...x, not: v } : x)))
              : setYeniler((l) => l.map((x, j) => (j === buyuk.i ? { ...x, not: v } : x)))
          }
          onKapat={() => setBuyuk(null)}
          notaOdaklan={buyuk.nota}
        />
      )}

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={gonder} disabled={!gecerli || gonderiliyor}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {gonderiliyor ? "…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
