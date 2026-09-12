"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pinAt, yerOlustur, yerKoordinati, type YeniMedya } from "@/lib/veri";
import { fotograflariHazirla } from "@/lib/fotograf";
import { useSiralama, siraStili } from "@/lib/siralama";
import { karadaMi } from "@/lib/kadikoy-icinde";
import { useVeri } from "@/lib/kanca";
import type { Yer } from "@/lib/model";
import type { PlaceCategory } from "@/lib/types";
import { TUR_AD } from "@/lib/paleti";
import { igneStil, simgeSvg } from "@/lib/gorsel";
import YerSecici, { type YeniNokta, type Secim } from "./YerSecici";
import BuyukGorsel from "./BuyukGorsel";

/* Prototipten gelen seçenekler — şemada serbest metin, arayüzde sabit liste
   olması sonradan gruplamayı mümkün kılıyor ("çoğunlukla X için geliniyor"). */
export const SENARYOLAR = ["tek başına", "çalışmak için", "ilk buluşma", "kalabalık grup", "hızlı uğrak", "uzun oturma"];
export const SIKLIKLAR = ["haftalık uğrak", "ayda bir", "yılda birkaç", "bir kez görülür"];
export const TEKRARLAR = ["evet", "belki", "hayır"];
const TURLER: PlaceCategory[] = ["kahve", "yemek", "bar", "tatli", "kultur", "park", "otel", "magaza", "diger"];

/* Şemadaki check ile aynı sınırlar — sunucuya boşuna gidip hata almayalım */
/* METIN_MIN kaldırıldı (göç 13): not artık zorunlu değil. Bir şey yazmak
   zorunda kalan kullanıcı pin ATMIYORDU; fotoğraf, puan, üç kelime ve
   senaryo zaten kalite kapısını tutuyor. */
export const METIN_MAX = 1000;

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

  /* Kayıtlı mekanın koordinatı ayrı çekiliyor: mekanAra ve yerGetir lat/lng
     yerine 0 döndürüyor (geo sütunu geography, PostgREST sayı vermiyor).
     Göç 10 uygulanmamışsa null geliyor ve harita uçmuyor — form çalışmaya
     devam ediyor. */
  const { veri: yerKoord } = useVeri<{ lat: number; lng: number } | null>(
    () =>
      !yer ? Promise.resolve(null)
      : yer.lat !== 0 || yer.lng !== 0 ? Promise.resolve({ lat: yer.lat, lng: yer.lng })
      : yerKoordinati(yer.id),
    [yer?.id, yer?.lat, yer?.lng],
    null,
  );

  /* useMemo şart: satır içi kursaydım her render'da YENİ nesne olurdu,
     YerSecici'deki eşitleme efekti de her render'da çalışıp haritayı
     yeniden ortalardı — mekanın adını yazarken her harfte zıplardı. */
  const secim = useMemo<Secim | null>(
    () =>
      yer ? (yerKoord ? { ...yerKoord, sabit: true } : null)
      : yeniYer ? { ...yeniYer, sabit: false }
      : null,
    [yer, yerKoord, yeniYer],
  );

  const [medyalar, setMedyalar] = useState<YeniMedya[]>([]);
  /* Hangi görsel büyütülmüş; nota dokunularak açıldıysa imleç not alanına gider. */
  const [buyuk, setBuyuk] = useState<{ i: number; nota?: boolean } | null>(null);
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

  /* Fotoğraflar SEÇİLİRKEN küçültülüyor, yüklenirken değil: burada
     açılamayan bir dosyayı (HEIC) hemen söyleyebiliyoruz, kullanıcı formu
     doldurup Paylaş'a bastıktan sonra değil. */
  const [hazirlaniyor, setHazirlaniyor] = useState(false);
  const dosyaEkle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const secilen = Array.from(e.target.files ?? []);
    e.target.value = "";  /* aynı dosya tekrar seçilebilsin */
    if (!secilen.length) return;
    setHazirlaniyor(true); setHata(null);
    try {
      const hazir = await fotograflariHazirla(secilen);
      setMedyalar((m) => [...m, ...hazir.map((d) => ({ dosya: d, not: "" }))]);
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally { setHazirlaniyor(false); }
  };

  /* Sıra ÖNEMLİ: ilk medya kartlarda kapak oluyor, gönderi karuselinde de
     ilk sırada açılıyor. Yükledikten sonra değiştirmenin yolu yoktu; tek
     çare silip yeniden yüklemekti. */
  const tasi = (nereden: number, nereye: number) =>
    setMedyalar((l) => {
      const k = [...l];
      const [x] = k.splice(nereden, 1);
      k.splice(nereye, 0, x);
      return k;
    });
  const siraKap = useRef<HTMLDivElement>(null);
  const tasinan = useSiralama(siraKap, medyalar.length, tasi);

  const yerHazir = !!yer || (!!yeniYer && yeniAd.trim().length > 1);
  const gecerli =
    yerHazir &&
    medyalar.length > 0 &&
    kelimeler.every((k) => k.trim().length > 0) &&
    !!senaryo;

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
          {/* label DEĞİL: YerSecici'nin arama kutusu kendi aria-label'ını
              taşıyor, buradaki yalnızca görsel başlık. Hiçbir girdiye
              bağlanmayan <label> ekran okuyucuda boş bir etiket oluyordu. */}
          <div className={etiket}>Mekan <Zorunlu /></div>
          <YerSecici
            secim={secim}
            secildi={!!yer || !!yeniYer}
            onYerSec={(y) => { setYer(y); setYeniYer(null); setYeniAd(""); setYeniSemt(null); }}
            /* Ad/tür/semt aramadan geliyorsa hazır dolduruluyor; haritaya
               elle dokunulduysa yalnızca arama metni gelir. */
            onYeniNokta={(n: YeniNokta) => {
              setYer(null);
              setYeniYer({ lat: n.lat, lng: n.lng });
              if (n.ad) setYeniAd(n.ad);
              if (n.tur) setYeniTur(n.tur);
              setYeniSemt(n.semt ?? null);
            }}
            /* İğne sürüklendi: yalnızca koordinat değişiyor, ad ve tür durur. */
            onNoktaTasi={(k) => setYeniYer(k)}
          />

          {yer && (
            <div className="mt-2">
              <SeciliYer yer={yer} onKaldir={() => setYer(null)} />
            </div>
          )}

          {yeniYer && (
            <div className="mt-2 rounded-sm border border-[var(--cizgi)] bg-yuzey p-3">
              <div className="mb-2 font-tabela text-[11px] uppercase tracking-[0.11em] text-jeton">
                Yeni mekan
              </div>
              {/* ENGEL değil uyarı: sınır çokgeni 201 noktaya sadeleştirilmiş,
                  kıyıdaki gerçek bir yer de dışarıda çıkabiliyor (İBB Moda
                  İskelesi Kütüphanesi iskelenin üstünde ve bu testte "dışarıda"
                  görünüyor). Karar kullanıcının. */}
              {!karadaMi(yeniYer.lat, yeniYer.lng) && (
                <p className="mb-2 rounded-sm border border-[rgba(184,128,26,.45)] bg-[rgba(184,128,26,.09)] p-2 text-[12px] leading-snug">
                  Bu nokta <b>Kadıköy’ün karası dışında</b> görünüyor — deniz ya da
                  başka bir ilçe olabilir. İğneyi haritada sürükleyerek düzeltebilirsin.
                  İskele gibi gerçekten suyun üstündeki bir yer için olduğu gibi bırak.
                </p>
              )}
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
          )}
        </div>

        {/* ---- medya ---- */}
        <div className={alan}>
          {/* Dosya girdisi gizli ve butondan tetikleniyor; buton kendi metnini
              taşıdığı için bu satır label değil, başlık. */}
          <div className={etiket}>
            Fotoğraf ya da video <Zorunlu />
            {medyalar.length > 0 && (
              <span className="ml-2 font-sayi normal-case tracking-normal">{medyalar.length} dosya</span>
            )}
          </div>

          <div ref={siraKap}>
          {medyalar.map((m, i) => (
            /* Düzenleme formuyla aynı davranış: karta dokununca görsel
               büyüyor, nota dokununca aynı ekran not alanı odaklı açılıyor.
               Önce yalnızca düzenlemede vardı — pin ATARKEN hâlâ tek satırlık
               kutuya yazılıyordu, oysa notu asıl o an yazıyorsun. */
            <div key={i}
                 onClick={() => setBuyuk({ i })}
                 data-sira={i}
                 style={siraStili(tasinan, i, medyalar.length)}
                 className="mb-2 flex cursor-pointer touch-manipulation select-none gap-2.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-2">
              <div className="relative shrink-0">
                <Onizleme dosya={m.dosya} />
                {/* Sıranın neye yaradığını söylemeden ok koymak anlamsız
                    olurdu: ilk sıradaki kapak. */}
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-[rgba(20,15,8,.6)] py-[1px] text-center font-tabela text-[7.5px] uppercase tracking-[0.08em] text-white">
                    Kapak
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 truncate text-[12px] text-murekkep2">{m.dosya.name}</div>
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
                  aria-label="Kaldır"
                  className="border-none bg-transparent p-0 text-[14px] leading-none text-murekkep2">
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
            onChange={dosyaEkle} className="hidden" />
          {/* Küçültme büyük bir fotoğrafta bir saniye sürebiliyor; sessiz
              kalırsa dokunuş işlememiş gibi duruyor. */}
          <button onClick={() => dosyaGirdi.current?.click()} disabled={hazirlaniyor}
            className="w-full rounded-sm border border-dashed border-[var(--cizgi)] bg-transparent py-2.5 text-[13px] text-murekkep2 disabled:opacity-50">
            {hazirlaniyor ? "Fotoğraf hazırlanıyor…" : "+ Fotoğraf / video ekle"}
          </button>
          <p className="mt-1.5 text-[11.5px] leading-snug text-murekkep2">
            Birden fazla ekleyebilirsin; her birine ayrı not yazabilirsin.
            {medyalar.length > 1 && " Sürükleyerek sıralayabilirsin — ilk sıradaki kapak olur."}
          </p>
        </div>

        {/* ---- üç kelime ---- */}
        {/* Üç kutu tek bir soruyu cevaplıyor: grup başlığı aria-labelledby ile
            bağlanıyor, her kutu kaçıncı olduğunu kendi söylüyor. Tek bir
            <label> üçüne birden bağlanamaz. */}
        <div className={alan} role="group" aria-labelledby="kelime-basligi">
          <div className={etiket} id="kelime-basligi">Üç kelimeyle anlat <Zorunlu /></div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <input key={i} value={kelimeler[i]} maxLength={14} placeholder={`${i + 1}.`}
                aria-label={`${i + 1}. kelime`} aria-required="true"
                onChange={(e) => setKelimeler((k) => {
                  const y = [...k] as [string, string, string]; y[i] = e.target.value; return y;
                })}
                className={girdi + " text-center"} />
            ))}
          </div>
        </div>

        {/* ---- senaryo ---- */}
        <div className={alan} role="group" aria-labelledby="senaryo-basligi">
          <div className={etiket} id="senaryo-basligi">Geliş senaryosu <Zorunlu /></div>
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
            {/* aria-required YOK: slider rolü desteklemiyor, zaten kaydırıcının
                her zaman bir değeri var — boş bırakılamıyor. */}
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
          <label className={etiket} htmlFor="metin">Gitmeden bilinmesi gereken</label>
          <textarea id="metin" value={metin} onChange={(e) => setMetin(e.target.value)}
            maxLength={METIN_MAX} rows={4}
            placeholder="Hangi masaya otur, ne zaman git, neye dikkat et…"
            className={girdi + " resize-none leading-snug"} />
          {/* Sayaç yalnızca yazmaya başlayınca: boşken "0/1000" görmek, boş
              bırakılamazmış gibi duruyordu. */}
          <div className="mt-1 text-right font-sayi text-[11px] text-murekkep2">
            {metin.trim().length
              ? `${metin.trim().length}/${METIN_MAX}`
              : "İstersen boş bırak"}
          </div>
        </div>

        {/* ---- isteğe bağlı ---- */}
        <details className={alan}>
          <summary className="cursor-pointer font-tabela text-[11px] uppercase tracking-[0.12em] text-murekkep2">
            İstersen birkaç şey daha
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className={etiket} htmlFor="degisse">Bir şey değişse</label>
              <input id="degisse" value={degisse} onChange={(e) => setDegisse(e.target.value)}
                maxLength={90} placeholder="Ne olsa daha iyi olurdu?" className={girdi} />
            </div>
            <div role="group" aria-labelledby="siklik-basligi">
              <div className={etiket} id="siklik-basligi">Hangi sıklıkla gelinir</div>
              <div className="flex flex-wrap gap-1.5">
                {SIKLIKLAR.map((s) => (
                  <Cip key={s} secili={siklik === s} onTikla={() => setSiklik(siklik === s ? "" : s)}>{s}</Cip>
                ))}
              </div>
            </div>
            <div role="group" aria-labelledby="tekrar-basligi">
              <div className={etiket} id="tekrar-basligi">Tekrar gider misin</div>
              <div className="flex flex-wrap gap-1.5">
                {TEKRARLAR.map((s) => (
                  <Cip key={s} secili={tekrar === s} onTikla={() => setTekrar(tekrar === s ? "" : s)}>{s}</Cip>
                ))}
              </div>
            </div>
            <div>
              <label className={etiket} htmlFor="fiyat">Kişi başı ödediğin (₺)</label>
              <input id="fiyat" value={fiyat} onChange={(e) => setFiyat(e.target.value.replace(/\D/g, ""))}
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

      {buyuk && medyalar[buyuk.i] && (
        <BuyukGorsel
          kaynak={{ tip: "dosya", dosya: medyalar[buyuk.i].dosya }}
          not={medyalar[buyuk.i].not}
          onNot={(v) => setMedyalar((l) => l.map((x, j) => (j === buyuk.i ? { ...x, not: v } : x)))}
          onKapat={() => setBuyuk(null)}
          notaOdaklan={buyuk.nota}
          onKirp={(d) => setMedyalar((l) => l.map((x, j) => (j === buyuk.i ? { ...x, dosya: d } : x)))}
        />
      )}

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

export function Cip({ secili, onTikla, children }: { secili: boolean; onTikla: () => void; children: React.ReactNode }) {
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
 * URL useMemo ile türetilmiyor: StrictMode efektleri iki kez çalıştırıyor,
 * aradaki temizlik URL'i iptal ediyor ve memo yeniden hesaplamadığı için
 * önizleme ölü bir blob'a bakıp kalıyordu (kutu boş görünüyordu). Efektte
 * atanınca ikinci tur yenisini kuruyor. revokeObjectURL şart — yoksa seçilen
 * her dosya sekme kapanana kadar bellekte kalır.
 */
export function Onizleme({ dosya }: { dosya: File }) {
  const video = dosya.type.startsWith("video");
  const gorsel = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = gorsel.current;
    if (!el || video) return;
    const u = URL.createObjectURL(dosya);
    el.src = u;
    return () => URL.revokeObjectURL(u);
  }, [dosya, video]);

  if (video) {
    return (
      <div className="grid size-[52px] shrink-0 place-items-center rounded-sm bg-[#3B2C12] text-[18px] text-white">
        ▶
      </div>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img ref={gorsel} alt="" className="size-[52px] shrink-0 rounded-sm object-cover" />;
}
