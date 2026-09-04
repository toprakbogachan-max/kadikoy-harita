"use client";

import { useEffect, useRef, useState } from "react";
import { fotoZemin, simgeSvg, zaman } from "@/lib/gorsel";
import { useVeri } from "@/lib/kanca";
import { pinGetir, begeniDegistir, begendimMi, kayitDegistir, kayitliMi, medyaUrl, sikayetEttimMi } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import { useKisi } from "@/lib/kisiler-baglam";
import type { Pin } from "@/lib/model";
import Avatar from "./Avatar";
import Yorumlar from "./Yorumlar";
import Sikayet from "./Sikayet";
import PinDuzenle from "./PinDuzenle";

interface Props {
  pinId: string;
  liste: string[];
  onKapat: () => void;
  onPinDegisti: (id: string) => void;
  onGirisIste: () => void;
  /** yazarın profilini aç — kullanıcı adı ile */
  onKisiAc: (kullaniciAdi: string) => void;
  /** pin silindi: detay kapanmalı ve listeler tazelenmeli */
  onPinSilindi: () => void;
}

/**
 * Reels tarzı tam ekran gönderi:
 *  - dikey (kaydırma / tekerlek / ↑↓) → akıştaki pinler arası
 *  - yatay (oklar / ←→)               → aynı pinin medyaları arası
 * Her medyanın kendi notu görselin altında görünür.
 */
export default function GonderiDetay({ pinId, liste, onKapat, onPinDegisti, onGirisIste, onKisiAc, onPinSilindi }: Props) {
  const { ben } = useOturum();
  const [medyaIndex, setMedyaIndex] = useState(0);
  const [yorumlarAcik, setYorumlarAcik] = useState(false);
  const [sikayetAcik, setSikayetAcik] = useState(false);
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  /* Kaydedince pinGetir tekrar koşsun diye. */
  const [duzenSayac, setDuzenSayac] = useState(0);
  /* İyimser durum: sunucu yanıtını beklemeden düğme değişiyor, hata olursa
     geri alınıyor. Sosyal uygulamada beğeni gecikmesi hemen göze batıyor. */
  const [begeniYerel, setBegeniYerel] = useState<boolean | null>(null);
  const [kayitYerel, setKayitYerel] = useState<boolean | null>(null);
  const govde = useRef<HTMLDivElement>(null);

  const pinIndex = Math.max(0, liste.indexOf(pinId));
  /* Tek pin ayrı çekiliyor: akış listesi bellekte olsa da Reels'e doğrudan
     bağlantıyla da girilebilmeli (ileride /pin/[id] rotası). */
  const { veri: gelen } = useVeri<Pin | null>(() => pinGetir(pinId), [pinId, duzenSayac], null);

  /* Yeni pin yüklenirken `gelen` null oluyor ve bileşen tamamen kapanıyordu —
     hızlı bağlantıda göze çarpmıyor ama yavaş ağda dikey kaydırmanın her
     adımında ekran siyaha düşer. Son yüklenen pini tutup onu göstermeye
     devam ediyoruz; yalnızca ilk açılışta gerçekten boş kalıyor. */
  const [sonPin, setSonPin] = useState<Pin | null>(null);
  if (gelen && gelen !== sonPin) setSonPin(gelen);
  const p = gelen ?? sonPin;

  const kisi = useKisi(p?.kisi);

  const { veri: begenimSunucu } = useVeri<boolean>(
    () => (ben && p ? begendimMi(p.id) : Promise.resolve(false)), [p?.id, ben?.id], false);
  const { veri: kayitSunucu } = useVeri<boolean>(
    () => (ben && p ? kayitliMi(p.yer) : Promise.resolve(false)), [p?.yer, ben?.id], false);
  /* sikayetEttimMi yazılmıştı ama hiç çağrılmıyordu: aynı pini defalarca
     şikayet edebiliyordun ve reports tablosunda benzersizlik kısıtı da yok,
     yani moderasyon kuyruğuna kopya satırlar düşüyordu. */
  const { veri: sikayetEttim } = useVeri<boolean>(
    () => (ben && p ? sikayetEttimMi(p.id) : Promise.resolve(false)), [p?.id, ben?.id, sikayetAcik], false);

  /* Pin değişince medya başa döner. Efekt yerine React'in "prop değişince
     state'i ayarla" kalıbı — efektte setState basamaklı render üretiyor ve
     bir kare boyunca yanlış medya gösteriliyordu. */
  const [oncekiPin, setOncekiPin] = useState(pinId);
  if (oncekiPin !== pinId) {
    setOncekiPin(pinId);
    setMedyaIndex(0);
    setYorumlarAcik(false);
    setBegeniYerel(null);
    setKayitYerel(null);
    setSikayetAcik(false);
    setDuzenleAcik(false);
  }

  /* Medya gezinmesi tek yerden: oklar, klavye ve YATAY kaydırma aynı işlevi
     çağırsın. Önce yalnızca oklarda vardı, telefonda fotoğraflar arasında
     kaydırmak çalışmıyordu. */
  const medyaGec = (yon: number) => {
    const son = (p?.medyalar.length ?? 1) - 1;
    setMedyaIndex((i) => Math.min(son, Math.max(0, i + yon)));
  };

  const pinGec = (yon: number) => {
    const yeni = pinIndex + yon;
    if (yeni < 0 || yeni >= liste.length) return;
    onPinDegisti(liste[yeni]);
  };

  /* klavye: ↑↓ pinler, ←→ medyalar */
  useEffect(() => {
    const el = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onKapat();
      if (!p) return;
      if (e.key === "ArrowUp") pinGec(-1);
      else if (e.key === "ArrowDown") pinGec(1);
      else if (e.key === "ArrowLeft") medyaGec(-1);
      else if (e.key === "ArrowRight") medyaGec(1);
    };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  });

  /* dokunma + masaüstü tekerleği */
  useEffect(() => {
    const g = govde.current;
    if (!g) return;
    let basX: number | null = null;
    let basY: number | null = null;
    const ESIK = 70;
    /* Hangi eksende kaydırıldığına BÜYÜK olan farka bakarak karar veriyoruz:
       yatay → fotoğraflar, dikey → pinler. İki jesti aynı eksene koymak
       mümkün değil, o yüzden fotoğraf yatayda, pin dikeyde kaldı. */
    const bitir = (x: number, y: number) => {
      if (basX === null || basY === null) return;
      const dx = x - basX;
      const dy = y - basY;
      basX = null; basY = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) < ESIK) return;
        medyaGec(dx < 0 ? 1 : -1);
      } else {
        if (Math.abs(dy) < ESIK) return;
        pinGec(dy < 0 ? 1 : -1);
      }
    };
    const basla = (e: TouchEvent) => {
      basX = e.touches[0].clientX;
      basY = e.touches[0].clientY;
    };
    const bit = (e: TouchEvent) => bitir(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    /* tek jest birden çok wheel olayı üretiyor — zaman kilidi */
    let sonTeker = 0;
    const teker = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 12) return;
      const simdi = Date.now();
      if (simdi - sonTeker < 550) return;
      sonTeker = simdi;
      pinGec(e.deltaY > 0 ? 1 : -1);
    };

    g.addEventListener("touchstart", basla, { passive: true });
    g.addEventListener("touchend", bit, { passive: true });
    g.addEventListener("wheel", teker, { passive: true });
    return () => {
      g.removeEventListener("touchstart", basla);
      g.removeEventListener("touchend", bit);
      g.removeEventListener("wheel", teker);
    };
  });

  if (!p || !kisi) return null;

  const medya = p.medyalar;
  const begendim = begeniYerel ?? begenimSunucu;
  const kayitli = kayitYerel ?? kayitSunucu;
  const m = medya[Math.min(medyaIndex, medya.length - 1)];
  const coklu = medya.length > 1;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#1B1510]">
      {/* üst perde */}
      <div className="absolute inset-x-0 top-0 z-[6] flex items-start justify-between gap-3 bg-gradient-to-b from-[rgba(12,9,5,.62)] to-transparent px-4 pb-8 pt-3.5">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight text-white">
            {kisi.ad}
            {kisi.ben ? " · sen" : ""}
          </h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-white/75">
            @{kisi.k} · {zaman(p.saat)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Pinler arasi gezinme yalnizca jestle yapiliyordu (dikey kaydirma,
              tekerlek, ok tuslari) — ekranda hicbir isaret yoktu, kullanici
              birden fazla pin oldugunu ancak sayaci fark edince anliyordu.
              Oklar YUKARI/ASAGI: jestin ekseniyle ayni olsun, yandaki ‹ ›
              medya oklariyla karismasin. */}
          {liste.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => pinGec(-1)}
                disabled={pinIndex === 0}
                aria-label="Önceki pin"
                className="grid size-[26px] place-items-center rounded-sm border-none bg-white/15 text-[13px] leading-none text-white disabled:opacity-30"
              >
                ∧
              </button>
              <span className="font-sayi text-[11.5px] text-white/80">
                {pinIndex + 1}/{liste.length}
              </span>
              <button
                onClick={() => pinGec(1)}
                disabled={pinIndex === liste.length - 1}
                aria-label="Sonraki pin"
                className="grid size-[26px] place-items-center rounded-sm border-none bg-white/15 text-[13px] leading-none text-white disabled:opacity-30"
              >
                ∨
              </button>
            </div>
          )}
          <button
            onClick={onKapat}
            aria-label="Kapat"
            className="size-[30px] shrink-0 rounded-sm border-none bg-white/15 text-[15px] leading-none text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={govde} className="relative min-h-0 flex-1 overflow-hidden">
        {/* medya tam ekranı kaplar */}
        <div
          className="absolute inset-0 grid place-items-center overflow-hidden"
          style={{ background: fotoZemin(p.yerTuru) }}
        >
          {/* Gerçek dosya varsa o gösterilir; tohum verisinde (demo://) yok,
              degrade + kategori simgesi yer tutucu olarak kalıyor. */}
          {(() => {
            const url = medyaUrl(m.yol);
            if (!url) {
              return (
                <div className="opacity-[0.22]" dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 120) }} />
              );
            }
            return m.tur === "video" ? (
              <video src={url} controls playsInline className="size-full object-contain" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={url} alt={m.not ?? p.yerAdi} className="size-full object-contain" />
            );
          })()}
          {m.tur === "video" && !medyaUrl(m.yol) && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="grid size-[52px] place-items-center rounded-full bg-[rgba(20,15,8,.5)] text-[22px] text-white">▶</span>
            </div>
          )}
        </div>

        {coklu && (
          <>
            <span className="absolute right-3.5 top-[74px] z-[7] rounded-full bg-[rgba(20,15,8,.55)] px-1.5 py-0.5 font-sayi text-[10px] text-white">
              {medyaIndex + 1}/{medya.length}
            </span>
            <div className="absolute inset-x-0 top-[78px] z-[7] flex justify-center gap-1.5">
              {medya.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMedyaIndex(i)}
                  aria-label={`${i + 1}. medya`}
                  className={`size-1.5 rounded-full border-none p-0 ${i === medyaIndex ? "scale-125 bg-white" : "bg-white/35"}`}
                />
              ))}
            </div>
            {/* oklar alt panelin ÜSTÜNDE olmalı, yoksa panelin şeffaf kısmı tıklamayı yutuyor */}
            <button
              onClick={() => medyaGec(-1)}
              disabled={medyaIndex === 0}
              aria-label="Önceki medya"
              className="absolute left-2 top-[44%] z-[8] grid size-[30px] -translate-y-1/2 place-items-center rounded-full border-none bg-[rgba(20,15,8,.5)] text-white disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={() => medyaGec(1)}
              disabled={medyaIndex === medya.length - 1}
              aria-label="Sonraki medya"
              className="absolute right-2 top-[44%] z-[8] grid size-[30px] -translate-y-1/2 place-items-center rounded-full border-none bg-[rgba(20,15,8,.5)] text-white disabled:opacity-30"
            >
              ›
            </button>
          </>
        )}

        {/* alt bilgi perdesi */}
        <div className="absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-[rgba(12,9,5,.92)] via-[rgba(12,9,5,.72)] to-transparent px-4 pb-4 pt-[70px] text-white">
          <div className="mb-2.5 flex items-center gap-2.5">
            {/* Fotoğrafa ve ada dokununca yazarın profili açılıyor. Önceden
                gönderi detayından kişiye geçmenin hiçbir yolu yoktu: pini
                beğendiğin birine bakmak için aramadan adını bulman
                gerekiyordu. */}
            <button
              onClick={() => { onKapat(); onKisiAc(kisi.k); }}
              aria-label={`${kisi.ad} profilini aç`}
              className="flex flex-1 items-center gap-2.5 border-none bg-transparent p-0 text-left"
            >
              <Avatar kisi={p.kisi} boyut={34} />
              <span className="flex-1">
                <span className="block text-[13.5px] font-semibold leading-tight text-white">
                  {kisi.ad}
                  {kisi.ben ? " · sen" : ""}
                </span>
                <span className="mt-0.5 block font-sayi text-[10.5px] text-white/65">
                  @{kisi.k} · {zaman(p.saat)}
                </span>
              </span>
            </button>
            {p.puan != null && (
              <span className="font-sayi text-[14px] font-bold text-[#F2C879]">
                {p.puan}
                <span className="text-[10px] font-normal text-white/50">/10</span>
              </span>
            )}
          </div>

          <div className="mb-2.5 inline-flex items-center gap-1.5 border-b border-[rgba(242,200,121,.4)] pb-0.5 font-tabela text-[11.5px] uppercase tracking-[0.06em] text-[#F2C879]">
            {p.yerAdi} · {p.yerSemt}
          </div>

          {/* aktif medyanın kendi notu */}
          {m.not && <p className="mb-2 font-el text-[15px] leading-snug text-white/90">{m.not}</p>}

          {p.kelimeler.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {p.kelimeler.map((k) => (
                <span key={k} className="rounded-sm border border-white/45 px-2 py-1 font-el text-[13px] font-bold leading-none">
                  {k}
                </span>
              ))}
            </div>
          )}

          <p className="line-clamp-4 font-el text-[16px] leading-snug">{p.metin}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.senaryo && <span className="rounded-sm bg-white/15 px-2 py-1 text-[11px] text-white/90">{p.senaryo}</span>}
            {p.fiyat && <span className="rounded-sm bg-white/15 px-2 py-1 text-[11px] text-white/90">kişi başı {p.fiyat}₺</span>}
            {p.siklik && <span className="rounded-sm bg-white/15 px-2 py-1 text-[11px] text-white/90">{p.siklik}</span>}
          </div>

          {/* eylem çubuğu — beğeni ve kaydetme yazma işlemi, kimlik bekliyor */}
          <div className="mt-3 flex items-center gap-4 border-t border-white/15 pt-2.5">
            <Eylem
              etiket={`${p.begeni + (begendim && !begenimSunucu ? 1 : !begendim && begenimSunucu ? -1 : 0)}`}
              aria="Beğen"
              dolu={begendim}
              onTikla={async () => {
                if (!ben) return onGirisIste();
                const su = begendim;
                setBegeniYerel(!su);
                try { await begeniDegistir(p.id, su); }
                catch (e) { setBegeniYerel(su); alert(e instanceof Error ? e.message : String(e)); }
              }}
              ikon={<path d="M12 20.4 4.2 12.9a4.9 4.9 0 0 1 7-6.9l.8.8.8-.8a4.9 4.9 0 0 1 7 6.9z" />}
            />
            <Eylem
              etiket={`${p.yorumSayisi}`}
              aria="Yorumlar"
              onTikla={() => setYorumlarAcik(true)}
              ikon={<path d="M20.5 11.5a7.5 8 0 0 1-10.8 7.2L4.5 20.5l1.9-4.9A8 8 0 1 1 20.5 11.5z" />}
            />
            <Eylem
              etiket={kayitli ? "kaydedildi" : "kaydet"}
              aria="Kaydet"
              dolu={kayitli}
              onTikla={async () => {
                if (!ben) return onGirisIste();
                const su = kayitli;
                setKayitYerel(!su);
                try { await kayitDegistir(p.yer, su); }
                catch (e) { setKayitYerel(su); alert(e instanceof Error ? e.message : String(e)); }
              }}
              ikon={<path d="M6 3.6h12v17l-6-4.2-6 4.2z" />}
            />
            {/* Kendi pinini şikayet etmek anlamsız */}
            {/* Kendi pininde düzenle, başkasınınkinde şikayet. pinAt hata
                verirken "Var olanı düzenleyebilirsin" diyordu ama düzenleme
                diye bir ekran hiç yoktu. */}
            {ben && ben.id === p.kisi && (
              <button
                onClick={() => setDuzenleAcik(true)}
                className="ml-auto border-none bg-transparent p-0 text-[11.5px] text-white/70 underline"
              >
                düzenle
              </button>
            )}
            {ben && ben.id !== p.kisi && (
              sikayetEttim ? (
                <span className="ml-auto text-[11.5px] text-white/40">şikayet ettin</span>
              ) : (
                <button
                  onClick={() => setSikayetAcik(true)}
                  className="ml-auto border-none bg-transparent p-0 text-[11.5px] text-white/55 underline"
                >
                  şikayet et
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {yorumlarAcik && (
        <Yorumlar pinId={p.id} onKapat={() => setYorumlarAcik(false)} onGirisIste={onGirisIste} />
      )}

      {sikayetAcik && <Sikayet pinId={p.id} onKapat={() => setSikayetAcik(false)} />}
      {duzenleAcik && (
        <PinDuzenle
          pin={p}
          onKapat={() => setDuzenleAcik(false)}
          onKaydedildi={() => { setDuzenleAcik(false); setDuzenSayac((n) => n + 1); }}
          onSilindi={() => { setDuzenleAcik(false); onPinSilindi(); }}
        />
      )}
    </div>
  );
}

/** Reels alt çubuğundaki tek eylem düğmesi. */
function Eylem({
  etiket, aria, ikon, onTikla, dolu,
}: { etiket: string; aria: string; ikon: React.ReactNode; onTikla: () => void; dolu?: boolean }) {
  return (
    <button
      onClick={onTikla}
      aria-label={aria}
      aria-pressed={dolu}
      className={`flex items-center gap-1.5 border-none bg-transparent p-0 text-[12.5px] ${
        dolu ? "text-[#F2C879]" : "text-white/90"
      }`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={dolu ? "currentColor" : "none"}
           stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
        {ikon}
      </svg>
      {etiket}
    </button>
  );
}
