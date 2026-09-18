"use client";

import { useEffect, useRef, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { mekanAra, listeOlustur, kaydettigimYerler, pinlediklerim, listeKapagiSil } from "@/lib/veri";
import type { Yer } from "@/lib/model";
import { igneStil, simgeSvg } from "@/lib/gorsel";
import ListeKapakSecici from "./ListeKapakSecici";
import KayanSecim from "./KayanSecim";
import Pill from "./corner/primitives/Pill";

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
  /* Kapak liste HENÜZ YOKKEN seçiliyor: fotoğraf kovaya baştan yükleniyor,
     satır oluşurken yalnızca URL'si bağlanıyor (veri.ts → listeKapakYukle).
     Tersi olsaydı "önce listeyi kaydet, sonra kapak koy" gibi iki adımlı bir
     akış çıkardı ve kapak isteğe bağlı bir ek gibi görünürdü — oysa listenin
     adı kadar onun parçası. */
  const [kapak, setKapak] = useState<{ url: string | null; konum: number }>({ url: null, konum: 50 });
  /* Kapak listeden ÖNCE yükleniyor, yani form iptal edilirse ya da başka
     bir fotoğraf seçilirse kovada sahipsiz dosya kalıyor. Bu ekranda
     yüklenen HER kapak burada birikiyor; çıkışta kaydedilmeyenler
     siliniyor. Olmasaydı her vazgeçiş kalıcı çöp üretirdi. */
  const yuklenenler = useRef<string[]>([]);
  const kaydedildi = useRef(false);
  /* Efekt sökülürken seçili kapağın son hâli lazım; state kapanışta eski
     değerini gösterirdi. Render sırasında DEĞİL, seçim anında yazılıyor. */
  const sonKapak = useRef<string | null>(null);

  useEffect(() => () => {
    for (const u of yuklenenler.current) {
      if (kaydedildi.current && u === sonKapak.current) continue;
      void listeKapagiSil(u);
    }
  }, []);
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
      await listeOlustur(baslik, not, secilenler.map((y) => y.id), kapak);
      kaydedildi.current = true;
      onOlusturuldu();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally { setGonderiliyor(false); }
  };

  const girdi = "w-full rounded-lg bg-yuzey shadow-kat-1 px-2.5 py-2 text-base outline-none placeholder:text-gri-600 focus:border-jeton";
  const etiket = "mb-1.5 block text-2xs font-bold uppercase tracking-etiket text-gri-600";

  return (
    <div role="dialog" aria-modal="true" aria-label="Yeni liste"
         className="yuksel absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-[15px]">
        <div>
          <h2 className="text-xl font-semibold leading-tight">Yeni liste</h2>
          <div className="mt-1.5 text-2xs font-bold uppercase tracking-etiket text-gri-700">
            Kendi küratörlüğün
          </div>
        </div>
        <button onClick={onKapat} disabled={gonderiliyor} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-lg bg-yuzey shadow-kat-1 text-base leading-none disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <label className="mb-3 block">
          <span className={etiket}>Başlık <span className="text-kapali">*</span></span>
          <input value={baslik} onChange={(e) => setBaslik(e.target.value)}
            maxLength={60} placeholder="örn. Yağmurlu günde Kadıköy" className={girdi} />
        </label>

        <label className="mb-4 block">
          <span className={etiket}>Kısa not</span>
          <input value={not} onChange={(e) => setNot(e.target.value)}
            maxLength={120} placeholder="Bu liste ne işe yarıyor?" className={girdi} />
        </label>

        {/* Kapak zorunlu değil ama forma başlıkla aynı ağırlıkta giriyor:
            profil ızgarasında listeyi tanıtan şey adı kadar kapağı.
            Kapaksız kalırsa seçilen mekanların renk kolajına düşüyor —
            boş gri kutu hiçbir durumda görünmüyor. */}
        <div className={etiket}>Kapak</div>
        <div className="mb-5">
          <ListeKapakSecici
            liste={{ kapak: kapak.url, kapakKonum: kapak.konum, yerler: secilenler }}
            onDegisti={(k) => {
              if (k.url) yuklenenler.current.push(k.url);
              sonKapak.current = k.url;
              setKapak(k);
            }}
            devreDisi={gonderiliyor}
          />
        </div>

        <div className={etiket}>
          Mekanlar <span className="text-kapali">*</span>
          {secilenler.length > 0 && (
            <span className="ml-2 font-sayi normal-case tracking-normal">{secilenler.length} seçili</span>
          )}
        </div>

        {secilenler.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {secilenler.map((y) => (
              <button key={y.id} onClick={() => degistir(y)}
                className="flex items-center gap-1.5 rounded-full border-none bg-gri-900 px-2 py-1.5 text-sm text-white">
                {y.ad} <span aria-hidden>✕</span>
              </button>
            ))}
          </div>
        )}

        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Mekan ara" aria-label="Mekan ara" className={girdi + " mb-2"} />

        {gecikmeli.length >= 2 ? (
          <div className="mb-1.5 text-xs text-gri-600">Arama sonuçları</div>
        ) : (
          /* İki kaynak arasında geçiş de baloncukla: alt menüdeki hareketin
             aynısı, ölçeği küçük. Tutarlılık burada işlevsel — kullanıcı
             "siyah baloncuk = şu an baktığın yer" kuralını bir kez
             öğreniyor. */
          <KayanSecim
            aktif={kaynak}
            className="mb-1.5 flex gap-1.5"
            baloncuk="baloncuk rounded-md"
          >
            {([["kayit", "Kaydettiklerin", kayitlar.length], ["pin", "Pinlediklerin", pinlerim.length]] as const).map(
              ([id, ad, sayi]) => (
                <button
                  key={id}
                  data-kayan={id}
                  onClick={() => setKaynak(id)}
                  aria-pressed={kaynak === id}
                  className={`rounded-md border-none px-2.5 py-1 text-2xs font-bold uppercase tracking-etiket transition-[color,background-color,transform] duration-[240ms] ease-out active:scale-95 ${
                    kaynak === id
                      ? "bg-transparent text-white"
                      : "bg-yuzey text-gri-600 shadow-kat-1"
                  }`}
                >
                  {ad}{sayi > 0 && <span className="ml-1 font-sayi normal-case tracking-normal">{sayi}</span>}
                </button>
              ),
            )}
          </KayanSecim>
        )}

        {aday.length ? (
          <ul className="m-0 list-none rounded-lg bg-yuzey shadow-kat-1 p-0">
            {aday.map((y) => (
              <li key={y.id}>
                <button onClick={() => degistir(y)} aria-pressed={secili(y)}
                  className="flex w-full items-center gap-2.5 border-none bg-transparent px-2.5 py-2 text-left last:border-0">
                  <span style={igneStil(y.tur)} className="shrink-0"
                    dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 17, "var(--pin)") }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{y.ad}</span>
                    <span className="block font-sayi text-2xs text-gri-600">{y.semt}</span>
                  </span>
                  <span className={`grid size-[18px] shrink-0 place-items-center rounded-md text-xs ${
                    secili(y) ? "bg-gri-900 text-white" : "border border-[var(--cizgi)]"
                  }`}>
                    {secili(y) ? "✓" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm leading-relaxed text-gri-600">
            {gecikmeli.length >= 2
              ? "Eşleşen mekan yok."
              : kaynak === "kayit"
                ? "Henüz bir yer kaydetmedin — yukarıdan arayarak ekleyebilirsin."
                : "Henüz pin atmadın — yukarıdan arayarak da mekan ekleyebilirsin."}
          </p>
        )}

        {hata && (
          <p className="mt-3 rounded-md border border-[rgba(179,38,30,.3)] bg-[rgba(179,38,30,.07)] p-2.5 text-sm">
            {hata}
          </p>
        )}
      </div>

      <div className="shrink-0 bg-yuzey p-3">
        <Pill dolgu="siyah" boy="buyuk" tamGenislik
              onTikla={gonder} pasif={!gecerli || gonderiliyor} yukleniyor={gonderiliyor}>
          Listeyi oluştur
        </Pill>
      </div>
    </div>
  );
}
