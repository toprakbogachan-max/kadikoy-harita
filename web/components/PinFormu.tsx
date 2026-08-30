"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pinAt, yerOlustur, type YeniMedya } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
import { TUR_AD } from "@/lib/paleti";
import { igneStil, simgeSvg } from "@/lib/gorsel";
import YerSecici, { type YeniNokta } from "./YerSecici";

/* Prototipten gelen seçenekler — şemada serbest metin, arayüzde sabit liste
   olması sonradan gruplamayı mümkün kılıyor ("çoğunlukla X için geliniyor"). */
const SENARYOLAR = ["tek başına", "çalışmak için", "ilk buluşma", "kalabalık grup", "hızlı uğrak", "uzun oturma"];
const SIKLIKLAR = ["haftalık uğrak", "ayda bir", "yılda birkaç", "bir kez görülür"];
const TEKRARLAR = ["evet", "belki", "hayır"];
const TURLER: PlaceCategory[] = ["kahve", "yemek", "bar", "tatli", "kultur", "park", "otel", "magaza", "diger"];

/* Şemadaki check ile aynı sınırlar — sunucuya boşuna gidip hata almayalım */
const METIN_MIN = 15;
const METIN_MAX = 1000;

interface Props {
  onKapat: () => void;
  onAtildi: (pinId: string, yerId: string) => void;
  /** haritadan "buraya pin at" ile gelindiyse mekan hazır */
  hazirYer?: Yer | null;
}

export default function PinFormu({ onKapat, onAtildi, hazirYer }: Props) {
  const [yer, setYer] = useState<Yer | null>(hazirYer ?? null);
  const [yeniYer, setYeniYer] = useState<{ lat: number; lng: number } | null>(null);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniTur, setYeniTur] = useState<PlaceCategory>("kahve");
  /* Coğrafi aramadan gelen semt — elle işaretlemede boş kalıyor ve
     yerOlustur "Kadıköy" varsayıyor. */
  const [yeniSemt, setYeniSemt] = useState<string | null>(null);

  const [medyalar, setMedyalar] = useState<YeniMedya[]>([]);
  const [kelimeler, setKelimeler] = useState<[string, string, string]>(["", "", ""]);
  const [senaryo, setSenaryo] = useState("");
  const [puan, setPuan] = useState(7);
  const [metin, setMetin] = useState("");
  const [degisse, setDegisse] = useState("");
  const [siklik, setSiklik] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [fiyat, setFiyat] = useState("");

  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const dosyaGirdi = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !gonderiliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, gonderiliyor]);

  const dosyaEkle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yeni = Array.from(e.target.files ?? []).map((d) => ({ dosya: d, not: "" }));
    setMedyalar((m) => [...m, ...yeni]);
    e.target.value = "";  /* aynı dosya tekrar seçilebilsin */
  };

  const yerHazir = !!yer || (!!yeniYer && yeniAd.trim().length > 1);
  const gecerli =
    yerHazir &&
    medyalar.length > 0 &&
    kelimeler.every((k) => k.trim().length > 0) &&
    !!senaryo &&
    metin.trim().length >= METIN_MIN;

  const gonder = async () => {
    setGonderiliyor(true); setHata(null);
    try {
      let yerId = yer?.id;
      if (!yerId && yeniYer) {
        yerId = await yerOlustur(yeniAd, yeniTur, yeniYer.lat, yeniYer.lng, yeniSemt ?? undefined);
      }
      if (!yerId) throw new Error("Mekan seçilmedi.");

      const pinId = await pinAt({
        yerId, metin,
        kelimeler: kelimeler.map((k) => k.trim()) as [string, string, string],
        senaryo, puan, medyalar,
        degisse, siklik, tekrar,
        fiyat: fiyat ? Number(fiyat) : undefined,
      });
      onAtildi(pinId, yerId);
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setGonderiliyor(false);
    }
  };

  const alan = "px-4 py-3.5 border-b border-[var(--cizgi)]";
  const etiket = "mb-2 block font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2";
  const girdi = "w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-2.5 py-2 text-[14px] text-murekkep outline-none placeholder:text-murekkep2 focus:border-jeton";

  return (
    <div role="dialog" aria-modal="true" aria-label="Pin at"
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">Pin at</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            Deneyimini bırak
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ---- mekan ---- */}
        <div className={alan}>
          <label className={etiket}>Mekan <Zorunlu /></label>
          {yer ? (
            <SeciliYer yer={yer} onKaldir={() => setYer(null)} />
          ) : yeniYer ? (
            <div className="rounded-sm border border-[var(--cizgi)] bg-yuzey p-3">
              <div className="mb-2 font-tabela text-[11px] uppercase tracking-[0.11em] text-jeton">
                Yeni mekan
              </div>
              <input value={yeniAd} onChange={(e) => setYeniAd(e.target.value)}
                maxLength={60} placeholder="Mekanın adı" className={girdi} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TURLER.map((t) => (
                  <Cip key={t} secili={yeniTur === t} onTikla={() => setYeniTur(t)}>
                    {TUR_AD[t] ?? t}
                  </Cip>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] leading-snug text-murekkep2">
                Çalışma saatini bilmiyoruz — uygulamada “saat bilgisi yok” diye görünecek,
                “kapalı” demeyeceğiz.
              </p>
              {yeniSemt && (
                <p className="mt-2 font-sayi text-[11.5px] text-murekkep2">
                  Haritadan: {yeniSemt}
                </p>
              )}
              <button onClick={() => { setYeniYer(null); setYeniAd(""); setYeniSemt(null); }}
                className="mt-2 border-none bg-transparent p-0 text-[12.5px] text-murekkep2 underline">
                Vazgeç
              </button>
            </div>
          ) : (
            <YerSecici
              onYerSec={setYer}
              /* Ad/tür/semt aramadan geliyorsa hazır dolduruluyor; haritaya
                 elle dokunulduysa yalnızca arama metni gelir. */
              onYeniNokta={(n: YeniNokta) => {
                setYeniYer({ lat: n.lat, lng: n.lng });
                if (n.ad) setYeniAd(n.ad);
                if (n.tur) setYeniTur(n.tur);
                setYeniSemt(n.semt ?? null);
              }}
            />
          )}
        </div>

        {/* ---- medya ---- */}
        <div className={alan}>
          <label className={etiket}>
            Fotoğraf ya da video <Zorunlu />
            {medyalar.length > 0 && (
              <span className="ml-2 font-sayi normal-case tracking-normal">{medyalar.length} dosya</span>
            )}
          </label>

          {medyalar.map((m, i) => (
            <div key={i} className="mb-2 flex gap-2.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2">
              <Onizleme dosya={m.dosya} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 truncate text-[12px] text-murekkep2">{m.dosya.name}</div>
                <input
                  value={m.not}
                  onChange={(e) => setMedyalar((l) => l.map((x, j) => (j === i ? { ...x, not: e.target.value } : x)))}
                  maxLength={120}
                  placeholder="Bu görselin notu (isteğe bağlı)"
                  className="w-full rounded-sm border border-[var(--cizgi)] bg-kagit px-2 py-1.5 text-[12.5px] outline-none focus:border-jeton"
                />
              </div>
              <button onClick={() => setMedyalar((l) => l.filter((_, j) => j !== i))}
                aria-label="Kaldır"
                className="shrink-0 self-start border-none bg-transparent p-0 text-[14px] text-murekkep2">
                ✕
              </button>
            </div>
          ))}

          <input ref={dosyaGirdi} type="file" accept="image/*,video/*" multiple
            onChange={dosyaEkle} className="hidden" />
          <button onClick={() => dosyaGirdi.current?.click()}
            className="w-full rounded-sm border border-dashed border-[var(--cizgi)] bg-transparent py-2.5 text-[13px] text-murekkep2">
            + Fotoğraf / video ekle
          </button>
          <p className="mt-1.5 text-[11.5px] leading-snug text-murekkep2">
            Birden fazla ekleyebilirsin; her birine ayrı not yazabilirsin.
          </p>
        </div>

        {/* ---- üç kelime ---- */}
        <div className={alan}>
          <label className={etiket}>Üç kelimeyle anlat <Zorunlu /></label>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <input key={i} value={kelimeler[i]} maxLength={14} placeholder={`${i + 1}.`}
                onChange={(e) => setKelimeler((k) => {
                  const y = [...k] as [string, string, string]; y[i] = e.target.value; return y;
                })}
                className={girdi + " text-center"} />
            ))}
          </div>
        </div>

        {/* ---- senaryo ---- */}
        <div className={alan}>
          <label className={etiket}>Geliş senaryosu <Zorunlu /></label>
          <div className="flex flex-wrap gap-1.5">
            {SENARYOLAR.map((s) => (
              <Cip key={s} secili={senaryo === s} onTikla={() => setSenaryo(s)}>{s}</Cip>
            ))}
          </div>
        </div>

        {/* ---- puan ---- */}
        <div className={alan}>
          <label className={etiket} htmlFor="puan">Bana hitap puanı <Zorunlu /></label>
          <div className="flex items-center gap-3">
            {/* step .5 — şemadaki check yarım adım zorunlu kılıyor */}
            <input id="puan" type="range" min={1} max={10} step={0.5} value={puan}
              onChange={(e) => setPuan(Number(e.target.value))}
              className="h-1 flex-1 accent-[var(--color-jeton)]" />
            <output className="w-10 shrink-0 text-right font-sayi text-[17px] font-bold text-jeton">
              {puan}
            </output>
          </div>
        </div>

        {/* ---- metin ---- */}
        <div className={alan}>
          <label className={etiket} htmlFor="metin">Gitmeden bilinmesi gereken <Zorunlu /></label>
          <textarea id="metin" value={metin} onChange={(e) => setMetin(e.target.value)}
            maxLength={METIN_MAX} rows={4}
            placeholder="Hangi masaya otur, ne zaman git, neye dikkat et…"
            className={girdi + " resize-none leading-snug"} />
          <div className={`mt-1 text-right font-sayi text-[11px] ${
            metin.trim().length < METIN_MIN ? "text-murekkep2" : "text-jeton"
          }`}>
            {metin.trim().length}/{METIN_MIN} en az
          </div>
        </div>

        {/* ---- isteğe bağlı ---- */}
        <details className={alan}>
          <summary className="cursor-pointer font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2">
            İstersen birkaç şey daha
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className={etiket}>Bir şey değişse</label>
              <input value={degisse} onChange={(e) => setDegisse(e.target.value)}
                maxLength={90} placeholder="Ne olsa daha iyi olurdu?" className={girdi} />
            </div>
            <div>
              <label className={etiket}>Hangi sıklıkla gelinir</label>
              <div className="flex flex-wrap gap-1.5">
                {SIKLIKLAR.map((s) => (
                  <Cip key={s} secili={siklik === s} onTikla={() => setSiklik(siklik === s ? "" : s)}>{s}</Cip>
                ))}
              </div>
            </div>
            <div>
              <label className={etiket}>Tekrar gider misin</label>
              <div className="flex flex-wrap gap-1.5">
                {TEKRARLAR.map((s) => (
                  <Cip key={s} secili={tekrar === s} onTikla={() => setTekrar(tekrar === s ? "" : s)}>{s}</Cip>
                ))}
              </div>
            </div>
            <div>
              <label className={etiket}>Kişi başı ödediğin (₺)</label>
              <input value={fiyat} onChange={(e) => setFiyat(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric" placeholder="örn. 250" className={girdi} />
            </div>
          </div>
        </details>

        <p className="px-4 py-3.5 text-[12px] leading-relaxed text-murekkep2">
          Fotoğraf, üç kelime, senaryo, puan ve somut bir not zorunlu.
          “Çok güzeldi” yazan pin kimseye yaramıyor.
        </p>

        {hata && (
          <p className="mx-4 mb-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px] leading-snug">
            {hata}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button onClick={gonder} disabled={!gecerli || gonderiliyor}
          className="w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white disabled:opacity-40">
          {gonderiliyor ? "Yükleniyor…" : "Paylaş"}
        </button>
      </div>
    </div>
  );
}

const Zorunlu = () => <span className="text-[#E0271C]">*</span>;

function Cip({ secili, onTikla, children }: { secili: boolean; onTikla: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onTikla} aria-pressed={secili}
      className={`rounded-sm px-2.5 py-1.5 text-[12.5px] ${
        secili ? "border-none bg-jeton text-white" : "border border-[var(--cizgi)] bg-yuzey text-murekkep"
      }`}>
      {children}
    </button>
  );
}

function SeciliYer({ yer, onKaldir }: { yer: Yer; onKaldir: () => void }) {
  return (
    <div style={igneStil(yer.tur)}
         className="flex items-center gap-2.5 rounded-sm border border-[var(--cizgi)] bg-[var(--kag)] p-2.5">
      <div dangerouslySetInnerHTML={{ __html: simgeSvg(yer.tur, 20, "var(--pin)") }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{yer.ad}</div>
        <div className="font-sayi text-[11px] text-murekkep2">{yer.semt}</div>
      </div>
      <button onClick={onKaldir} aria-label="Mekanı değiştir"
        className="shrink-0 border-none bg-transparent p-0 text-[13px] text-murekkep2 underline">
        değiştir
      </button>
    </div>
  );
}

/**
 * Seçilen dosyanın küçük önizlemesi — video ise ilk kare yerine ▶ rozeti.
 *
 * URL useMemo ile türetiliyor, efektte setState yok: efektin işi yalnızca
 * temizlik. Aksi halde her önizleme fazladan bir render turu açıyordu.
 * revokeObjectURL şart — yoksa seçilen her dosya sekme kapanana kadar
 * bellekte kalır.
 */
function Onizleme({ dosya }: { dosya: File }) {
  const video = dosya.type.startsWith("video");
  const url = useMemo(() => (video ? null : URL.createObjectURL(dosya)), [dosya, video]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  if (video) {
    return (
      <div className="grid size-[52px] shrink-0 place-items-center rounded-sm bg-[#3B2C12] text-[18px] text-white">
        ▶
      </div>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={url!} alt="" className="size-[52px] shrink-0 rounded-sm object-cover" />;
}
