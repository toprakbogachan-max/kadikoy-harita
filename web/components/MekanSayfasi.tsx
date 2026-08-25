"use client";

import { useEffect, useRef, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { yerGetir, yerinPinleri, mekanOzeti, kayitDegistir, kayitliMi, medyaUrl, type YerDetay } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import { useKisiler } from "@/lib/kisiler-baglam";
import type { Pin } from "@/lib/model";
import type { PlaceSummary } from "@/lib/types";
import { TUR_AD } from "@/lib/paleti";
import { igneStil, egim, fotoZemin, simgeSvg, acikMi, zaman } from "@/lib/gorsel";
import Avatar from "./Avatar";

type Kademe = "yarim" | "tam";

interface Props {
  yerId: string;
  onKapat: () => void;
  onGonderiAc: (pinId: string, liste: string[]) => void;
  onGirisIste: () => void;
  onPinAt: (yer: YerDetay) => void;
}

const GUN_AD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/**
 * Mekan sayfası — Google Maps tarzı iki kademeli çekmece.
 *
 * Yarım kademede harita üstte görünür kalır (nerede olduğunu görmeden karar
 * veremiyorsun); tutamağa dokunup ya da yukarı sürükleyip tam ekrana çıkar.
 *
 * Bölüm sırası BRIEF kararı: uyarı → hızlı bakış → buraya bırakılanlar →
 * künye → özetler. Önce "buraya gitmeli miyim", sonra ayrıntı.
 */
export default function MekanSayfasi({ yerId, onKapat, onGonderiAc, onGirisIste, onPinAt }: Props) {
  const { ben } = useOturum();
  const [kademe, setKademe] = useState<Kademe>("yarim");
  const [pinIndex, setPinIndex] = useState(0);
  const kapatDugmesi = useRef<HTMLButtonElement>(null);

  const { veri: yer } = useVeri<YerDetay | null>(() => yerGetir(yerId), [yerId], null);
  const { veri: pinler } = useVeri<Pin[]>(() => yerinPinleri(yerId), [yerId], []);
  const { veri: ozet } = useVeri<PlaceSummary | null>(
    () => mekanOzeti(yerId), [yerId], null);
  const kisiler = useKisiler();
  const { veri: kayitSunucu } = useVeri<boolean>(
    () => (ben ? kayitliMi(yerId) : Promise.resolve(false)), [yerId, ben?.id], false);
  const [kayitYerel, setKayitYerel] = useState<boolean | null>(null);
  const kayitli = kayitYerel ?? kayitSunucu;

  /* mekan değişince karusel ve kademe başa döner */
  const [oncekiYer, setOncekiYer] = useState(yerId);
  if (oncekiYer !== yerId) {
    setOncekiYer(yerId);
    setPinIndex(0);
    setKademe("yarim");
    setKayitYerel(null);
  }

  useEffect(() => {
    /* preventScroll şart: odaklanma çerçeveyi kaydırıp yerleşimi bozuyordu */
    kapatDugmesi.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  if (!yer) {
    return (
      <div className="absolute inset-x-0 bottom-0 top-[56%] z-20 rounded-t-[14px] bg-kagit p-4 text-[13px] text-murekkep2 shadow-[0_-8px_24px_rgba(74,58,30,.18)]">
        Yükleniyor…
      </div>
    );
  }

  const t = new Date();
  const acik = acikMi(yer.saatler, t);
  const bugun = yer.saatler?.find((s) => s[0] === t.getDay());
  const pin = pinler[Math.min(pinIndex, Math.max(0, pinler.length - 1))];
  const ilkFoto = pin?.medyalar.find((m) => m.tur === "foto");
  const pinKapak = ilkFoto ? medyaUrl(ilkFoto.yol) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={yer.ad}
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col bg-kagit transition-[top] duration-300 ${
        kademe === "yarim"
          ? "top-[56%] rounded-t-[14px] shadow-[0_-8px_24px_rgba(74,58,30,.18)]"
          : "top-0"
      }`}
    >
      {/* tutamak: dokunuş kademeyi değiştirir */}
      <button
        onClick={() => setKademe((k) => (k === "yarim" ? "tam" : "yarim"))}
        aria-label={kademe === "yarim" ? "Sayfayı genişlet" : "Sayfayı küçült"}
        className="w-full shrink-0 border-none bg-transparent px-0 pb-[3px] pt-[9px]"
      >
        <span className="mx-auto block h-1 w-[38px] rounded-sm bg-[rgba(35,52,60,.22)]" />
      </button>

      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-tight">{yer.ad}</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            {TUR_AD[yer.tur] ?? yer.tur} · {yer.semt} ·{" "}
            {/* üç durumlu: saat bilgisi yoksa "kapalı" DEMİYORUZ */}
            {acik === null ? "saat bilgisi yok" : acik ? "şu an açık" : "şu an kapalı"}
          </div>
        </div>
        <button
          ref={kapatDugmesi}
          onClick={onKapat}
          aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none text-murekkep"
        >
          ✕
        </button>
      </div>

      <div className={`min-h-0 flex-1 ${kademe === "yarim" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {/* ---- kapak: yalnızca serbest lisanslı referans görseli ---- */}
        {yer.kapak && (
          <figure className="m-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={yer.kapak}
              alt={`${yer.ad} — Wikimedia Commons`}
              className="block h-[168px] w-full object-cover"
            />
            {/* CC-BY ailesi atfı GÖRÜNÜR yerde göstermeyi şart koşuyor */}
            {yer.kapakKredi && (
              <figcaption className="bg-[rgba(35,52,60,.05)] px-4 py-1.5 text-[10px] leading-snug text-murekkep2">
                Görsel: {yer.kapakKredi}
              </figcaption>
            )}
          </figure>
        )}

        {/* ---- uyarı: BRIEF kararı, hep en üstte ---- */}
        {yer.kunye?.uyari && (
          <div className="mx-4 mt-3.5 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-3 text-[13px] leading-snug">
            <strong className="mb-1 block font-tabela text-[11px] uppercase tracking-[0.1em] text-[#921008]">
              Gitmeden önce
            </strong>
            {yer.kunye.uyari}
          </div>
        )}

        {/* ---- hızlı bakış ---- */}
        {ozet && ozet.pin_count > 0 && (
          <section className="mx-4 mt-3.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-3.5">
            <div className="mb-2 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
              Hızlı bakış
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sayi text-[30px] font-bold leading-none text-jeton">
                {ozet.rating_avg?.toFixed(1) ?? "—"}
              </span>
              <span className="text-[12px] text-murekkep2">/10 · {ozet.pin_count} pin</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12.5px] text-murekkep2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
                <path d="M6 3.6h12v17l-6-4.2-6 4.2z" />
              </svg>
              <span><b className="font-sayi text-murekkep">{yer.kaydeden}</b> kişi kaydetti</span>
            </div>
            {ozet.following_ids.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[12.5px] text-murekkep2">
                <div className="flex -space-x-2">
                  {ozet.following_ids.slice(0, 4).map((k) => (
                    <Avatar key={k} kisi={k} boyut={24} />
                  ))}
                </div>
                <span>
                  Takip ettiklerinden <b className="text-murekkep">{ozet.following_ids.length}</b> kişi burayı pinledi
                </span>
              </div>
            )}
          </section>
        )}

        {/* ---- buraya bırakılanlar: tek tek, oklar kartın kenarlarında ---- */}
        <div className="mt-4 flex items-center justify-between px-4 pb-2.5">
          <div className="font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            Buraya bırakılanlar
          </div>
          {pinler.length > 1 && (
            <span className="font-sayi text-[11.5px] text-murekkep2">
              {pinIndex + 1}/{pinler.length}
            </span>
          )}
        </div>

        {pin ? (
          <div className="relative mx-4 mb-4">
            <button
              onClick={() => onGonderiAc(pin.id, pinler.map((p) => p.id))}
              style={{ ...igneStil(yer.tur), transform: `rotate(${egim(pinIndex)}deg)` }}
              className="block w-full rounded-sm border-none bg-[var(--kag)] p-[3px] text-left shadow-kagit"
            >
              <span className="absolute -top-[5px] left-1/2 z-[2] size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
              <div
                className="relative grid h-[132px] place-items-center overflow-hidden rounded-sm"
                style={{ background: fotoZemin(yer.tur) }}
              >
                {pinKapak ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pinKapak} alt="" className="size-full object-cover" />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: simgeSvg(yer.tur, 40) }} />
                )}
              </div>
              <div className="px-2 pb-2.5 pt-2">
                <div className="mb-1.5 flex items-center gap-2">
                  <Avatar kisi={pin.kisi} boyut={22} />
                  <span className="text-[12.5px] font-semibold">{kisiler[pin.kisi]?.ad ?? ""}</span>
                  <span className="font-sayi text-[10.5px] text-murekkep2">{zaman(pin.saat)}</span>
                  <span className="ml-auto font-sayi text-[13px] font-bold text-jeton">{pin.puan}</span>
                </div>
                <p className="line-clamp-3 font-el text-[15px] leading-snug">{pin.metin}</p>
              </div>
            </button>

            {pinler.length > 1 && (
              <>
                <button
                  onClick={() => setPinIndex((i) => Math.max(0, i - 1))}
                  disabled={pinIndex === 0}
                  aria-label="Önceki pin"
                  className="absolute -left-1.5 top-1/2 z-[3] grid size-7 -translate-y-1/2 place-items-center rounded-full border border-[var(--cizgi)] bg-yuzey text-murekkep shadow-kagit disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  onClick={() => setPinIndex((i) => Math.min(pinler.length - 1, i + 1))}
                  disabled={pinIndex === pinler.length - 1}
                  aria-label="Sonraki pin"
                  className="absolute -right-1.5 top-1/2 z-[3] grid size-7 -translate-y-1/2 place-items-center rounded-full border border-[var(--cizgi)] bg-yuzey text-murekkep shadow-kagit disabled:opacity-30"
                >
                  ›
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="px-4 pb-4 text-[13px] leading-relaxed text-murekkep2">
            Buraya henüz kimse pin atmamış. İlk sen ol.
          </p>
        )}

        {/* ---- künye ---- */}
        <div className="px-4 pb-2.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
          Künye
        </div>
        <dl className="mx-4 mb-4 rounded-sm border border-[var(--cizgi)] bg-yuzey px-3 py-1">
          <Satir e="Pin" d={`${yer.pinSayisi ?? 0} kişi pinledi`} sayi />
          <Satir
            e="Bugün"
            sayi
            d={!yer.saatler ? "bilinmiyor" : bugun ? `${GUN_AD[t.getDay()]} ${bugun[1]}–${bugun[2]}` : "kapalı"}
          />
          {yer.adres && <Satir e="Adres" d={yer.adres} />}
          {yer.kunye?.rezervasyon && <Satir e="Rezervasyon" d={yer.kunye.rezervasyon} />}
          {yer.kunye?.kisiBasi != null && <Satir e="Kişi başı" d={`≈ ${yer.kunye.kisiBasi} ₺`} sayi />}
          {yer.kunye?.enIyiSaat && <Satir e="En iyi saat" d={yer.kunye.enIyiSaat} />}
          {yer.kunye?.sadeceNakit && <Satir e="Ödeme" d="sadece nakit" />}
        </dl>

        {/* ---- kelimeler ve puan dağılımı ---- */}
        {ozet && ozet.pin_count > 0 && (
          <>
            <section className="mx-4 mb-3.5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-3.5">
              <div className="mb-2 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
                Bu mekan üç kelimeyle
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ozet.words.map(([k, n]) => (
                  <span key={k} className="rounded-sm border border-[var(--cizgi)] bg-kagit px-2 py-1 font-el text-[13.5px] font-bold leading-none">
                    {k}{n > 1 && <span className="font-sayi text-[10px] text-murekkep2"> ×{n}</span>}
                  </span>
                ))}
              </div>
              {ozet.top_scenario && (
                <p className="mt-2.5 text-[12.5px] text-murekkep2">
                  Çoğunlukla <b className="text-jeton">{ozet.top_scenario}</b> geliniyor
                </p>
              )}
            </section>

            <section className="mx-4 mb-5 rounded-sm border border-[var(--cizgi)] bg-yuzey p-3.5">
              <div className="mb-2 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
                Kişisel puanlar
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-sayi text-[26px] font-bold leading-none">
                  {ozet.rating_avg?.toFixed(1) ?? "—"}
                </span>
                <span className="text-[12px] text-murekkep2">herkes · {ozet.pin_count} kişi</span>
              </div>
              {ozet.following_avg != null && (
                <div className="mt-1 font-sayi text-[13px] text-jeton">
                  {ozet.following_avg.toFixed(1)} — takip ettiklerin
                </div>
              )}
              <div className="mt-3 flex h-11 items-end gap-[3px]">
                {ozet.rating_buckets.map((n, i) => (
                  <i
                    key={i}
                    title={`${i + 1} puan: ${n}`}
                    className={`flex-1 rounded-t-[1px] ${n ? "bg-jeton" : "bg-[rgba(35,52,60,.13)]"}`}
                    style={{ height: n ? `${Math.min(100, 25 + n * 38)}%` : "8%" }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between font-sayi text-[9.5px] text-murekkep2">
                <span>1</span><span>10</span>
              </div>
              <p className="mt-2.5 text-[12px] text-murekkep2">
                {ozet.would_return}/{ozet.pin_count} kişi tekrar gider dedi
              </p>
            </section>

            {ozet.improvements.length > 0 && (
              <>
                <div className="px-4 pb-2.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
                  Bir şey değişse
                </div>
                <ul className="mx-4 mb-5 list-none space-y-2 p-0">
                  {ozet.improvements.map((d, i) => (
                    <li key={i} className="rounded-sm border border-[var(--cizgi)] bg-yuzey p-2.5 text-[13px] leading-snug">
                      {d.text}
                      <span className="mt-1 block font-sayi text-[10.5px] text-murekkep2">
                        @{kisiler[d.author]?.k ?? "…"}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[var(--cizgi)] bg-yuzey p-3">
        <button
          onClick={() => (ben ? onPinAt(yer) : onGirisIste())}
          className="flex-1 rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white"
        >
          Buraya pin at
        </button>
        <button
          onClick={async () => {
            if (!ben) return onGirisIste();
            const su = kayitli;
            setKayitYerel(!su);
            try { await kayitDegistir(yerId, su); }
            catch (e) { setKayitYerel(su); alert(e instanceof Error ? e.message : String(e)); }
          }}
          aria-pressed={kayitli}
          className={`flex-1 rounded-sm px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] ${
            kayitli ? "border-none bg-[#3B2C12] text-white" : "border border-[var(--cizgi)] bg-kagit"
          }`}
        >
          {kayitli ? "Kaydedildi ✓" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

function Satir({ e, d, sayi }: { e: string; d: string; sayi?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--cizgi)] py-2 last:border-0">
      <dt className="shrink-0 text-[12.5px] text-murekkep2">{e}</dt>
      <dd className={`m-0 text-right text-[13px] ${sayi ? "font-sayi" : ""}`}>{d}</dd>
    </div>
  );
}
