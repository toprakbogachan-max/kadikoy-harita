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
import YineGiderMisin, { type YineGiderDegeri } from "./corner/YineGiderMisin";
import Pill from "./corner/primitives/Pill";

/* Prototipten gelen seçenekler — şemada serbest metin, arayüzde sabit liste
   olması sonradan gruplamayı mümkün kılıyor ("çoğunlukla X için geliniyor"). */
export const SENARYOLAR = ["tek başına", "çalışmak için", "ilk buluşma", "kalabalık grup", "hızlı uğrak", "uzun oturma"];
export const SIKLIKLAR = ["haftalık uğrak", "ayda bir", "yılda birkaç", "bir kez görülür"];
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

  const alan = "px-4 py-3.5";
  const etiket = "mb-2 block text-2xs font-bold uppercase tracking-etiket text-gri-600";
  const girdi = "w-full rounded-lg bg-yuzey shadow-kat-1 px-2.5 py-2 text-base text-murekkep outline-none placeholder:text-gri-600 focus:border-jeton";

  return (
    <div role="dialog" aria-modal="true" aria-label="Pin at"
         className="yuksel absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-[15px]">
        <div>
          <h2 className="text-xl font-semibold leading-tight">Pin at</h2>
          <div className="mt-1.5 text-2xs font-bold uppercase tracking-etiket text-gri-700">
            Deneyimini bırak
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-lg bg-yuzey shadow-kat-1 text-base leading-none disabled:opacity-40">
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
            <div className="mt-2 rounded-lg bg-yuzey shadow-kat-1 p-3">
              <div className="mb-2 text-2xs font-bold uppercase tracking-etiket text-gri-900">
                Yeni mekan
              </div>
              {/* ENGEL değil uyarı: sınır çokgeni 201 noktaya sadeleştirilmiş,
                  kıyıdaki gerçek bir yer de dışarıda çıkabiliyor (İBB Moda
                  İskelesi Kütüphanesi iskelenin üstünde ve bu testte "dışarıda"
                  görünüyor). Karar kullanıcının. */}
              {!karadaMi(yeniYer.lat, yeniYer.lng) && (
                <p className="mb-2 rounded-md border border-[rgba(0,0,0,.12)] bg-[rgba(16,16,20,.05)] p-2 text-sm leading-snug">
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
              <p className="mt-2 text-xs leading-snug text-gri-600">
                Çalışma saatini bilmiyoruz — uygulamada “saat bilgisi yok” diye görünecek,
                “kapalı” demeyeceğiz.
              </p>
              {yeniSemt && (
                <p className="mt-2 font-sayi text-xs text-gri-600">
                  Haritadan: {yeniSemt}
                </p>
              )}
              <button onClick={() => { setYeniYer(null); setYeniAd(""); setYeniSemt(null); }}
                className="mt-2 border-none bg-transparent p-0 text-sm text-gri-600 underline">
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
                 className="mb-2 flex cursor-pointer touch-manipulation select-none gap-2.5 rounded-lg bg-yuzey shadow-kat-1 p-2">
              <div className="relative shrink-0">
                <Onizleme dosya={m.dosya} />
                {/* Sıranın neye yaradığını söylemeden ok koymak anlamsız
                    olurdu: ilk sıradaki kapak. */}
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-[rgba(16,16,20,.62)] py-[1px] text-center text-[8px] font-bold uppercase tracking-etiket text-white">
                    Kapak
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 truncate text-sm text-gri-600">{m.dosya.name}</div>
                <div
                  data-suruklenmez
                  onClick={(e) => { e.stopPropagation(); setBuyuk({ i, nota: true }); }}
                  className={`w-full truncate rounded-lg bg-gomuk px-2 py-1.5 text-sm ${
                    m.not ? "text-murekkep" : "text-gri-600"
                  }`}
                >
                  {m.not || "Bu görselin notu (isteğe bağlı)"}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2 self-start">
                <button data-suruklenmez
                  onClick={(e) => { e.stopPropagation(); setMedyalar((l) => l.filter((_, j) => j !== i)); }}
                  aria-label="Kaldır"
                  className="border-none bg-transparent p-0 text-base leading-none text-gri-600">
                  ✕
                </button>
                {/* Tutamak sürüklemeyi GÖRÜNÜR kılıyor; sürüklemek için buna
                    basmak şart değil, satırın boş alanı da tutuyor. */}
                {medyalar.length > 1 && (
                  <span aria-hidden className="text-sm leading-none text-gri-600">⠿</span>
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
            className="w-full rounded-md border border-dashed border-[var(--cizgi)] bg-transparent py-2.5 text-sm text-gri-600 disabled:opacity-50">
            {hazirlaniyor ? "Fotoğraf hazırlanıyor…" : "+ Fotoğraf / video ekle"}
          </button>
          <p className="mt-1.5 text-xs leading-snug text-gri-600">
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
            <output className="w-10 shrink-0 text-right font-sayi text-lg font-bold text-gri-900">
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
          <div className="mt-1 text-right font-sayi text-xs text-gri-600">
            {metin.trim().length
              ? `${metin.trim().length}/${METIN_MAX}`
              : "İstersen boş bırak"}
          </div>
        </div>

        {/* ---- isteğe bağlı ---- */}
        <details className={alan}>
          <summary className="cursor-pointer text-2xs font-bold uppercase tracking-etiket text-gri-600">
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
            {/* Kendi başlığını ve üç seçeneğini bileşen taşıyor; formun
                etiketi ve elle yazılmış toggle'ı kalktı. Puanı da alıyor:
                9 ve üstünde soru satırında "FAVORİM" rozeti çıkıyor
                (NOT.md: favorim = puanın okunuşu, ayrı alan değil). */}
            <YineGiderMisin
              deger={(tekrar || null) as YineGiderDegeri | null}
              onDegis={(yeni) => setTekrar(yeni ?? "")}
              puan={puan}
              pasif={gonderiliyor}
            />
            <div>
              <label className={etiket} htmlFor="fiyat">Kişi başı ödediğin (₺)</label>
              <input id="fiyat" value={fiyat} onChange={(e) => setFiyat(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric" placeholder="örn. 250" className={girdi} />
            </div>
          </div>
        </details>

        <p className="px-4 py-3.5 text-sm leading-relaxed text-gri-600">
          Fotoğraf, üç kelime, senaryo, puan ve somut bir not zorunlu.
          “Çok güzeldi” yazan pin kimseye yaramıyor.
        </p>

        {hata && (
          <p className="mx-4 mb-3 rounded-md border border-[rgba(179,38,30,.3)] bg-[rgba(179,38,30,.07)] p-2.5 text-sm leading-snug">
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

      <div className="shrink-0 bg-yuzey p-3">
        <Pill dolgu="siyah" boy="buyuk" tamGenislik
              onTikla={gonder} pasif={!gecerli || gonderiliyor} yukleniyor={gonderiliyor}>
          {gonderiliyor ? "Yükleniyor" : "Paylaş"}
        </Pill>
      </div>
    </div>
  );
}

const Zorunlu = () => <span className="text-kapali">*</span>;

export function Cip({ secili, onTikla, children }: { secili: boolean; onTikla: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onTikla} aria-pressed={secili}
      className={`rounded-md px-2.5 py-1.5 text-sm ${
        secili ? "border-none bg-gri-900 text-white" : "bg-yuzey shadow-kat-1 text-murekkep"
      }`}>
      {children}
    </button>
  );
}

function SeciliYer({ yer, onKaldir }: { yer: Yer; onKaldir: () => void }) {
  return (
    <div style={igneStil(yer.tur)}
         className="flex items-center gap-2.5 rounded-lg shadow-kat-1 bg-[var(--kag)] p-2.5">
      <div dangerouslySetInnerHTML={{ __html: simgeSvg(yer.tur, 20, "var(--pin)") }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{yer.ad}</div>
        <div className="font-sayi text-xs text-gri-600">{yer.semt}</div>
      </div>
      <button onClick={onKaldir} aria-label="Mekanı değiştir"
        className="shrink-0 border-none bg-transparent p-0 text-sm text-gri-600 underline">
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
      <div className="grid size-[52px] shrink-0 place-items-center rounded-md bg-gri-900 text-xl text-white">
        ▶
      </div>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img ref={gorsel} alt="" className="size-[52px] shrink-0 rounded-md object-cover" />;
}
