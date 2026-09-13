"use client";

import { useEffect, useState } from "react";
import { kunyeYaz, yerSaatiYaz, type Kunye } from "@/lib/veri";

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
/* Dizin = şemadaki d (0=Pazar), JS getDay() ile aynı. */
const GUNLER = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default function KunyeDuzenle({
  yerId, yerAdi, mevcut, saatler, onKapat, onKaydedildi,
}: {
  yerId: string;
  yerAdi: string;
  mevcut: Kunye | null;
  /** places.opening_hours — [[gun, "HH:MM", "HH:MM"]]; null = bilinmiyor */
  saatler: number[][] | null;
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
  /* Gün dizisi 0=Pazar (şemadaki d ile aynı). Bilinmiyorsa hepsi kapalı
     başlıyor ve hiçbir şey yazılmıyor — "kapalı" ile "bilmiyoruz" farklı. */
  const [gunler, setGunler] = useState<{ acik: boolean; o: string; k: string }[]>(() =>
    Array.from({ length: 7 }, (_, g) => {
      const v = saatler?.find((s) => s[0] === g);
      return v
        ? { acik: true, o: String(v[1]), k: String(v[2]) }
        : { acik: false, o: "09:00", k: "22:00" };
    }),
  );
  /* Karşılaştırma için başlangıç hâli — kaydederken değişip değişmediğini
     anlamak gerekiyor. */
  const [baslangicSaatleri] = useState(() =>
    (saatler ?? [])
      .map((v) => ({ d: Number(v[0]), open: String(v[1]), close: String(v[2]) }))
      .sort((a, b) => a.d - b.d),
  );
  const [hepsiO, setHepsiO] = useState("09:00");
  const [hepsiK, setHepsiK] = useState("22:00");
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
      /* Çalışma saati places'ta duruyor (is_open_now onu okuyor), place_facts'te
         değil; ayrı çağrı. Hiçbir gün işaretli değilse null yazılıyor: mekan
         "saat bilgisi yok"a geri dönüyor.
         DEĞİŞMEDİYSE hiç çağrılmıyor: künyenin başka bir alanını düzelten
         kullanıcıya saat yazma yetkisi/hatası bulaşmasın. */
      const yeniSaatler = gunler.flatMap((v, g) =>
        v.acik && v.o && v.k ? [{ d: g, open: v.o, close: v.k }] : []);
      if (JSON.stringify(yeniSaatler) !== JSON.stringify(baslangicSaatleri)) {
        await yerSaatiYaz(yerId, yeniSaatler);
      }
      onKaydedildi();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  const girdi = "w-full rounded-lg bg-yuzey shadow-kat-1 px-2.5 py-2 text-base text-murekkep outline-none placeholder:text-gri-600 focus:border-jeton";
  const etiket = "mb-1.5 block font-tabela text-xs uppercase tracking-[0.12em] text-gri-600";

  return (
    <div role="dialog" aria-modal="true" aria-label="Künye düzenle"
         className="absolute inset-0 z-[44] flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-[15px]">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-tight">Künye</h2>
          <div className="mt-1.5 truncate text-2xs font-bold uppercase tracking-etiket text-gri-700">
            {yerAdi}
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-lg bg-yuzey shadow-kat-1 text-base leading-none disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-4 rounded-lg bg-yuzey shadow-kat-1 p-2.5 text-sm leading-snug text-gri-600">
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
          <span className="mt-1 block text-xs leading-snug text-gri-600">
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
                  className={`rounded-md px-2.5 py-1.5 font-tabela text-xs uppercase tracking-[0.1em] ${
                    rezervasyon === id ? "border-none bg-gri-900 text-white"
                      : "bg-yuzey shadow-kat-1 text-gri-600"
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

        {/* ---- çalışma saati ---- */}
        <div className="mb-4">
          <span className={etiket}>Çalışma saati</span>
          <p className="mb-2 text-xs leading-snug text-gri-600">
            Girilmezse mekan “saat bilgisi yok” olarak kalıyor ve “Şu an açık”
            filtresinde çıkmıyor. Bilmediğin günü işaretleme — boş bırakmak
            “kapalı” demek değil.
          </p>

          {/* Tek tek yedi satır doldurmak sıkıcı: çoğu yer her gün aynı
              saatte açık. Bu satır hepsini bir dokunuşta dolduruyor. */}
          <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-yuzey shadow-kat-1 px-2.5 py-2">
            <span className="shrink-0 text-sm text-gri-600">Her gün</span>
            <input type="time" value={hepsiO} onChange={(e) => setHepsiO(e.target.value)}
              aria-label="Her gün açılış"
              className="min-w-0 flex-1 rounded-lg bg-gomuk px-1.5 py-1 font-sayi text-sm" />
            <span className="shrink-0 text-gri-600">–</span>
            <input type="time" value={hepsiK} onChange={(e) => setHepsiK(e.target.value)}
              aria-label="Her gün kapanış"
              className="min-w-0 flex-1 rounded-lg bg-gomuk px-1.5 py-1 font-sayi text-sm" />
            <button
              onClick={() => setGunler(Array.from({ length: 7 }, () => ({ acik: true, o: hepsiO, k: hepsiK })))}
              className="shrink-0 rounded-full border-none bg-gri-900 px-2 py-1.5 font-tabela text-2xs uppercase tracking-[0.1em] text-white">
              Uygula
            </button>
          </div>

          {/* Pazartesiden başlıyor: haftanın günleri Türkiye'de böyle okunuyor.
              Dizideki sıra ise 0=Pazar, çünkü şemadaki d ve JS getDay() öyle. */}
          {[1, 2, 3, 4, 5, 6, 0].map((g) => {
            const v = gunler[g];
            const yaz = (y: Partial<typeof v>) =>
              setGunler((l) => l.map((x, j) => (j === g ? { ...x, ...y } : x)));
            return (
              <div key={g} className="mb-1.5 flex items-center gap-1.5">
                <button onClick={() => yaz({ acik: !v.acik })} aria-pressed={v.acik}
                  className={`w-[52px] shrink-0 rounded-md py-1.5 font-tabela text-2xs uppercase tracking-[0.08em] ${
                    v.acik ? "border-none bg-gri-900 text-white" : "bg-yuzey shadow-kat-1 text-gri-600"
                  }`}>
                  {GUNLER[g]}
                </button>
                {v.acik ? (
                  <>
                    <input type="time" value={v.o} onChange={(e) => yaz({ o: e.target.value })}
                      aria-label={`${GUNLER[g]} açılış`}
                      className="min-w-0 flex-1 rounded-lg bg-yuzey shadow-kat-1 px-1.5 py-1 font-sayi text-sm" />
                    <span className="shrink-0 text-gri-600">–</span>
                    <input type="time" value={v.k} onChange={(e) => yaz({ k: e.target.value })}
                      aria-label={`${GUNLER[g]} kapanış`}
                      className="min-w-0 flex-1 rounded-lg bg-yuzey shadow-kat-1 px-1.5 py-1 font-sayi text-sm" />
                  </>
                ) : (
                  <span className="flex-1 text-sm text-gri-600">kapalı / bilinmiyor</span>
                )}
              </div>
            );
          })}
          <p className="mt-1 text-xs leading-snug text-gri-600">
            Gece yarısını geçen saatler yazılabilir: 20:00–02:00 ertesi güne sarkar.
          </p>
        </div>

        <label className="mb-4 block">
          <span className={etiket}>En iyi saat</span>
          <input value={enIyiSaat} onChange={(e) => setEnIyiSaat(e.target.value)}
            maxLength={60} placeholder="örn. hafta içi 15:00–17:00" className={girdi} />
        </label>

        <button onClick={() => setSadeceNakit((v) => !v)} aria-pressed={sadeceNakit}
          className="mb-4 flex w-full items-center justify-between rounded-lg bg-yuzey shadow-kat-1 px-3 py-2.5 text-left">
          <span className="text-base">Sadece nakit</span>
          <span className={`grid size-[20px] place-items-center rounded-md text-sm ${
            sadeceNakit ? "bg-gri-900 text-white" : "border border-[var(--cizgi)]"
          }`}>
            {sadeceNakit ? "✓" : ""}
          </span>
        </button>

        {hata && (
          <p className="rounded-md border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-sm">
            {hata}
          </p>
        )}
      </div>

      <div className="shrink-0 bg-yuzey p-3">
        <button onClick={gonder} disabled={gonderiliyor}
          className="w-full rounded-full border-none bg-gri-900 px-4 py-3 text-sm font-semibold lowercase tracking-ui text-white shadow-kat-2 disabled:opacity-40">
          {gonderiliyor ? "…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
