"use client";

import { useEffect, useRef, useState } from "react";
import { pinGuncelle, pinSil, medyaUrl } from "@/lib/veri";
import type { Pin } from "@/lib/model";
import {
  Cip, Onizleme, SENARYOLAR, SIKLIKLAR, TEKRARLAR, METIN_MAX,
} from "./PinFormu";
import BuyukGorsel from "./BuyukGorsel";
import { fotograflariHazirla } from "@/lib/fotograf";
import { useSiralama, siraStili } from "@/lib/siralama";

/** Listedeki bir satır: ya yüklenmiş medya ya da yeni seçilmiş dosya. */
type Medya =
  | { tur: "kalan"; yol: string; not: string }
  | { tur: "yeni"; dosya: File; not: string };

/** Yüklenmiş medya video mu — kırpma yalnızca fotoğraf için. */
function kalanVideo(yol: string, pin: Pin): boolean {
  return pin.medyalar.find((m) => m.yol === yol)?.tur === "video";
}

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
  pin, onKapat, onKaydedildi, onSilindi,
}: {
  pin: Pin;
  onKapat: () => void;
  onKaydedildi: () => void;
  onSilindi: () => void;
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

  /* Yüklenmiş ve yeni eklenen medya TEK listede. Eskiden iki ayrı listeydi ve
     kaydederken yeniler daima eskilerin arkasına geçiyordu: düzenlerken
     eklediğin bir fotoğrafı kapak yapmanın yolu yoktu. */
  const [medyalar, setMedyalar] = useState<Medya[]>(
    pin.medyalar.filter((m) => m.yol).map((m) => ({ tur: "kalan", yol: m.yol, not: m.not ?? "" })),
  );
  const dosyaGirdi = useRef<HTMLInputElement>(null);

  /* Hangi görsel büyütülmüş — listedeki konumuyla. */
  const [buyuk, setBuyuk] = useState<{ i: number; nota?: boolean } | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !gonderiliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, gonderiliyor]);

  /* Pin atma formuyla aynı: fotoğraf seçilirken küçültülüyor. */
  const [hazirlaniyor, setHazirlaniyor] = useState(false);
  const dosyaEkle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const secilen = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!secilen.length) return;
    setHazirlaniyor(true); setHata(null);
    try {
      const hazir = await fotograflariHazirla(secilen);
      setMedyalar((l) => [...l, ...hazir.map((d): Medya => ({ tur: "yeni", dosya: d, not: "" }))]);
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally { setHazirlaniyor(false); }
  };

  const medyaSayisi = medyalar.length;

  const tasi = (nereden: number, nereye: number) =>
    setMedyalar((l) => {
      const k = [...l];
      const [x] = k.splice(nereden, 1);
      k.splice(nereye, 0, x);
      return k;
    });
  const siraKap = useRef<HTMLDivElement>(null);
  const tasinan = useSiralama(siraKap, medyalar.length, tasi);

  const notYaz = (i: number, v: string) =>
    setMedyalar((l) => l.map((x, j) => (j === i ? { ...x, not: v } : x)));
  const gecerli =
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
        /* Tek liste ikiye ayrılıyor ama HERKES kendi sırasını taşıyor:
           sunucu ordering'i buradan yazıyor, yani araya girmiş yeni bir
           fotoğraf yerinde kalıyor. */
        kalanMedyalar: medyalar.flatMap((m, i) =>
          m.tur === "kalan" ? [{ yol: m.yol, not: m.not, sira: i }] : []),
        yeniMedyalar: medyalar.flatMap((m, i) =>
          m.tur === "yeni" ? [{ dosya: m.dosya, not: m.not, sira: i }] : []),
      });
      onKaydedildi();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  const sil = async () => {
    /* Geri alınamaz: pin, medyası ve yorumları gidiyor. Onay şart. */
    if (!confirm(`"${pin.yerAdi}" pinin silinsin mi? Fotoğrafları ve yorumlarıyla birlikte gider, geri alınamaz.`)) return;
    setSiliniyor(true); setHata(null);
    try {
      await pinSil(pin.id);
      onSilindi();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setSiliniyor(false); }
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
          {/* Dosya girdisi gizli ve butondan tetikleniyor; başlık, label değil. */}
          <div className={etiket}>
            Fotoğraf ya da video
            <span className="ml-2 font-sayi normal-case tracking-normal">{medyaSayisi} dosya</span>
          </div>

          <div ref={siraKap}>
          {medyalar.map((m, i) => (
            /* Satırın BOŞ alanına dokunmak da görseli büyütüyor: 52px'lik
               kutuyu parmakla tutturmak zor, kartın tamamı hedef olmalı.
               Not alanı ve düğmeler kendi tıklamalarını durduruyor, yoksa
               nota yazmaya çalışırken katman açılırdı. */
            <div key={m.tur === "kalan" ? m.yol : `yeni-${i}`}
                 onClick={() => setBuyuk({ i })}
                 data-sira={i}
                 style={siraStili(tasinan, i, medyalar.length)}
                 className="mb-2 flex cursor-pointer touch-manipulation select-none gap-2.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2">
              <div className="relative shrink-0">
                {m.tur === "kalan" ? (
                  /* Demo tohumunun medyası demo:// yolunda ve medyaUrl null
                     dönüyor — boş <img> yerine yer tutucu. */
                  medyaUrl(m.yol) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={medyaUrl(m.yol)!} alt="" className="size-[52px] rounded-sm object-cover" />
                  ) : (
                    <span className="grid size-[52px] place-items-center rounded-sm bg-[rgba(35,52,60,.07)] font-sayi text-[9px] text-murekkep2">
                      görsel
                    </span>
                  )
                ) : (
                  <Onizleme dosya={m.dosya} />
                )}
                {/* Sıranın neye yaradığını söylemeden ok koymak anlamsız
                    olurdu: ilk sıradaki kapak. */}
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-[rgba(20,15,8,.6)] py-[1px] text-center font-tabela text-[7.5px] uppercase tracking-[0.08em] text-white">
                    Kapak
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 truncate font-sayi text-[10.5px] text-murekkep2">
                  {m.tur === "kalan" ? "yüklenmiş" : m.dosya.name}
                </div>
                {/* Düzenlenebilir alan DEĞİL, özet. Dokununca büyük ekran
                    açılıyor ve imleç oradaki not alanına gidiyor — tek satırlık
                    kutuya 120 karakter sığmıyordu. */}
                <div
                  data-suruklenmez
                  onClick={(e) => { e.stopPropagation(); setBuyuk({ i, nota: true }); }}
                  className={`w-full truncate rounded-sm border border-[var(--cizgi)] bg-kagit px-2 py-1.5 text-[12.5px] ${
                    m.not ? "text-murekkep" : "text-murekkep2"
                  }`}
                >
                  {m.not || "Bu görselin notu (isteğe bağlı)"}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2 self-start">
                <button data-suruklenmez
                  onClick={(e) => { e.stopPropagation(); setMedyalar((l) => l.filter((_, j) => j !== i)); }}
                  disabled={medyaSayisi <= 1}
                  aria-label="Kaldır"
                  title={medyaSayisi <= 1 ? "En az bir görsel kalmalı" : "Kaldır"}
                  className="border-none bg-transparent p-0 text-[14px] leading-none text-murekkep2 disabled:opacity-25"
                >
                  ✕
                </button>
                {/* Tutamak sürüklemeyi GÖRÜNÜR kılıyor; sürüklemek için buna
                    basmak şart değil, satırın boş alanı da tutuyor. */}
                {medyalar.length > 1 && (
                  <span aria-hidden className="text-[12px] leading-none text-murekkep2">⠿</span>
                )}
              </div>
            </div>
          ))}

          </div>

          <input ref={dosyaGirdi} type="file" accept="image/*,video/*" multiple
            onChange={dosyaEkle}
            className="hidden" />
          {/* Küçültme büyük bir fotoğrafta bir saniye sürebiliyor; sessiz
              kalırsa dokunuş işlememiş gibi duruyor. */}
          <button onClick={() => dosyaGirdi.current?.click()} disabled={hazirlaniyor}
            className="w-full rounded-sm border border-dashed border-[var(--cizgi)] bg-transparent py-2.5 text-[13px] text-murekkep2 disabled:opacity-50">
            {hazirlaniyor ? "Fotoğraf hazırlanıyor…" : "+ Fotoğraf / video ekle"}
          </button>
          {medyalar.length > 1 && (
            <p className="mt-1.5 text-[11.5px] leading-snug text-murekkep2">
              Sürükleyerek sıralayabilirsin — ilk sıradaki kapak olur.
            </p>
          )}
        </div>

        {/* ---- üç kelime ---- */}
        <div className={alan} role="group" aria-labelledby="d-kelime-basligi">
          <div className={etiket} id="d-kelime-basligi">Üç kelimeyle anlat</div>
          <div className="grid grid-cols-3 gap-2">
            {kelimeler.map((k, i) => (
              <input key={i} value={k} maxLength={20} aria-label={`${i + 1}. kelime`}
                onChange={(e) => setKelimeler((l) => l.map((x, j) => (j === i ? e.target.value : x)) as [string, string, string])}
                placeholder={`${i + 1}.`} className={girdi} />
            ))}
          </div>
        </div>

        {/* ---- senaryo ---- */}
        <div className={alan} role="group" aria-labelledby="d-senaryo-basligi">
          <div className={etiket} id="d-senaryo-basligi">Geliş senaryosu</div>
          <div className="flex flex-wrap gap-1.5">
            {SENARYOLAR.map((sc) => (
              <Cip key={sc} secili={senaryo === sc} onTikla={() => setSenaryo(sc)}>{sc}</Cip>
            ))}
          </div>
        </div>

        {/* ---- puan ---- */}
        <div className={alan}>
          <label className={etiket} htmlFor="d-puan">
            Bana hitap puanı
            <span className="ml-2 font-sayi normal-case tracking-normal text-jeton">{puan}</span>
          </label>
          <input id="d-puan" type="range" min={1} max={10} step={0.5} value={puan}
            onChange={(e) => setPuan(Number(e.target.value))} className="w-full" />
        </div>

        {/* ---- metin ---- */}
        <div className={alan}>
          <label className={etiket} htmlFor="d-metin">
            Gitmeden bilinmesi gereken
            <span className="ml-2 font-sayi normal-case tracking-normal">
              {metin.trim().length ? `${metin.trim().length}/${METIN_MAX}` : "İstersen boş bırak"}
            </span>
          </label>
          <textarea id="d-metin" value={metin} onChange={(e) => setMetin(e.target.value)}
            maxLength={METIN_MAX} rows={4} className={girdi + " resize-none"} />
        </div>

        {/* ---- isteğe bağlı ---- */}
        {/* Dört ayrı denetim tek başlık altındaydı; başlık artık grubu
            adlandırıyor, her denetim kendi etiketini taşıyor. */}
        <div className={alan} role="group" aria-labelledby="d-ekstra-basligi">
          <div className={etiket} id="d-ekstra-basligi">İstersen birkaç şey daha</div>
          <input value={degisse} onChange={(e) => setDegisse(e.target.value)}
            aria-label="Bir şey değişse"
            maxLength={200} placeholder="Bir şey değişse…" className={girdi + " mb-2"} />
          <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Hangi sıklıkla gelinir">
            {SIKLIKLAR.map((sk) => (
              <Cip key={sk} secili={siklik === sk} onTikla={() => setSiklik(siklik === sk ? "" : sk)}>{sk}</Cip>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Tekrar gider misin">
            {TEKRARLAR.map((tk) => (
              <Cip key={tk} secili={tekrar === tk} onTikla={() => setTekrar(tekrar === tk ? "" : tk)}>
                tekrar gider miyim: {tk}
              </Cip>
            ))}
          </div>
          <input value={fiyat} onChange={(e) => setFiyat(e.target.value.replace(/[^0-9]/g, ""))}
            aria-label="Kişi başı ödediğin (₺)"
            inputMode="numeric" maxLength={5} placeholder="Kişi başı ödediğin (₺)" className={girdi} />
        </div>

        {hata && (
          <p className="mx-4 mt-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}

        {/* Silme en altta ve sessiz: yıkıcı işlem kaydetmeyle yan yana
            durmamalı, yanlışlıkla basılır. */}
        <div className="px-4 py-5">
          <button onClick={sil} disabled={siliniyor || gonderiliyor}
            className="w-full border-none bg-transparent p-0 text-[12.5px] text-[#921008] underline disabled:opacity-40">
            {siliniyor ? "Siliniyor…" : "Bu pini sil"}
          </button>
        </div>
      </div>

      {buyuk && medyalar[buyuk.i] && (() => {
        const m = medyalar[buyuk.i];
        const video = m.tur === "kalan" ? kalanVideo(m.yol, pin) : m.dosya.type.startsWith("video");
        return (
          <BuyukGorsel
            kaynak={m.tur === "kalan" ? { tip: "yol", yol: m.yol } : { tip: "dosya", dosya: m.dosya }}
            not={m.not}
            onNot={(v) => notYaz(buyuk.i, v)}
            onKapat={() => setBuyuk(null)}
            notaOdaklan={buyuk.nota}
            /* Yüklenmiş bir görseli kırpmak onu YENİ dosya yapıyor: kırpılmış
               hâli yüklenip eskisi düşüyor (pinGuncelle listede olmayan medyayı
               siliyor). Notunu ve SIRASINI koruyor — tek liste olduğu için
               kırpılan fotoğraf artık sona atlamıyor.
               Video kırpılamaz: karesi yok, çerçeveleyecek bir şey yok. */
            onKirp={
              video
                ? undefined
                : (d) => setMedyalar((l) => l.map((x, j) =>
                    j === buyuk.i ? { tur: "yeni", dosya: d, not: x.not } : x))
            }
          />
        );
      })()}

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={gonder} disabled={!gecerli || gonderiliyor}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {gonderiliyor ? "…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
