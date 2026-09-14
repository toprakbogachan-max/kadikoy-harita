"use client";

import { useEffect } from "react";
import type { Liste } from "@/lib/model";
import { fotoZemin } from "@/lib/gorsel";
import { kucukUrl } from "@/lib/veri";
import { TUR_AD, emoji } from "@/lib/paleti";
import MiniHarita from "./MiniHarita";
import ListeKapagi from "./ListeKapagi";

/**
 * Liste içeriği.
 *
 * Neden var: liste oluşturulabiliyor, başlığı ve "N mekan" sayısı görünüyor,
 * silinebiliyordu — ama İÇİNDEKİLER hiçbir yerden açılamıyordu. Profilde kart
 * düz bir div'di, arşivde tek düğme silmeydi. "Kendi küratörlüğün" okunamayan
 * bir çıktı üretiyordu.
 *
 * Sunucuya sormuyor: Liste.yerler zaten tam Yer nesneleri taşıyor (kart bile
 * ilk mekanların renk şeritlerini onlardan çiziyordu).
 *
 * Üstteki kapak, profil ızgarasındaki karenin büyük hâli: kullanıcının
 * seçtiği fotoğraf listeyi burada da karşılıyor, başlık üstüne biniyor.
 * Kenardan kenara sabit başlık barı yok — geri ve düzenle düğmeleri
 * kapağın üstünde ayrı ayrı YÜZÜYOR (skill §6).
 */
export default function ListeSayfasi({
  liste, sahibi, onKapat, onYerAc, onHaritada, onDuzenle,
}: {
  liste: Liste;
  /** başkasının listesine bakarken sahibinin adı */
  sahibi?: string;
  onKapat: () => void;
  /** oncelikliKisi: mekan sayfası bu kişinin pinini önce göstersin */
  onYerAc: (yerId: string, oncelikliKisi?: string) => void;
  /** Listenin tamamını ana haritada göster. */
  onHaritada?: (liste: Liste) => void;
  /** Yalnızca sahibine verilir; verilmezse düzenle düğmesi çizilmiyor. */
  onDuzenle?: () => void;
}) {
  /* Koordinatsız kayıt varsa (eski bir listede ya da mekan silinmişse)
     haritada gösterilecek bir şey yok, o zaman hiç çizilmiyor. */
  const haritalik = liste.yerler.filter((y) => y.lat !== 0 && y.lng !== 0);
  /* Paylaşım: uygulamanın liste başına ayrı bir route'u YOK (tek sayfa),
     o yüzden bağlantı değil metin paylaşılıyor. Olmayan bir URL üretmek
     kırık bir bağlantı dağıtmak olurdu. */
  const paylas = async () => {
    const metin = `${liste.baslik} — ${liste.yerler.length} mekan, Kadıköy`;
    try {
      if (navigator.share) await navigator.share({ title: liste.baslik, text: metin });
      else await navigator.clipboard.writeText(metin);
    } catch {
      /* kullanıcı vazgeçti ya da tarayıcı desteklemiyor */
    }
  };

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  return (
    <div role="dialog" aria-modal="true" aria-label={liste.baslik}
         className="iridesan absolute inset-0 z-[42] flex flex-col">
      {/* ---- harita bandı ----
          Referansta listenin İLK gösterdiği şey kapak değil, mekanların
          haritadaki dağılımı: "tokyo" listesi Japonya'yı gösteriyor.
          Kapak fotoğrafı aşağıda, başlığın yanında küçük kareye indi.
          Sebep: liste bir yer seçkisi; onu tanımlayan şey nerede olduğu. */}
      <div className="relative h-[34%] shrink-0 overflow-hidden bg-gri-100">
        {haritalik.length > 0 ? (
          onHaritada ? (
            <button
              onClick={() => onHaritada(liste)}
              aria-label={`${liste.baslik} listesini haritada göster`}
              className="block size-full border-none bg-transparent p-0"
            >
              <MiniHarita yerler={haritalik} />
            </button>
          ) : (
            <MiniHarita yerler={haritalik} />
          )
        ) : (
          <div className="grid size-full place-items-center text-sm lowercase text-gri-500">
            haritada gösterilecek mekan yok
          </div>
        )}

        {/* Yüzen chrome: kenardan kenara bar değil, ayrı düğmeler. */}
        <button onClick={onKapat} aria-label="Geri"
          className="absolute left-3 top-3 grid size-9 place-items-center rounded-md border-none bg-yuzey text-lg leading-none text-gri-900 shadow-kat-3">
          ‹
        </button>
        {onDuzenle && (
          <button onClick={onDuzenle} aria-label="Listeyi düzenle"
            className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-md border-none bg-yuzey text-gri-900 shadow-kat-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
            </svg>
          </button>
        )}
      </div>

      {/* ---- sayfa ---- */}
      <div className="-mt-5 min-h-0 flex-1 overflow-y-auto rounded-t-2xl bg-kagit pt-1">
        <span className="mx-auto mb-1 block h-1 w-[38px] rounded-full bg-gri-300" />

        {/* ---- başlık satırı: küçük kapak + ad + künye ---- */}
        <div className="flex items-start gap-3 px-4 pt-2.5">
          <div className="size-[68px] shrink-0 overflow-hidden rounded-lg bg-gri-100 shadow-kat-1">
            <ListeKapagi liste={liste} genislik={200} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Kademe A: listenin adı kullanıcının yazdığı kasada duruyor
                (ızgaradaki kartla aynı kural, ListeKarti). */}
            <h2 className="line-clamp-2 text-2xl font-extrabold leading-none tracking-isim">
              {liste.baslik}
            </h2>
            <div className="mt-1.5 text-xs lowercase text-gri-600">
              <span className="font-sayi">{liste.yerler.length}</span> mekan
            </div>
            {sahibi && (
              <div className="mt-0.5 flex items-center gap-1 text-xs lowercase text-gri-600">
                <span aria-hidden>👤</span> {sahibi}
              </div>
            )}
          </div>

          <button onClick={paylas} aria-label="Paylaş"
            className="grid size-9 shrink-0 place-items-center rounded-md border-none bg-yuzey text-gri-900 shadow-kat-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0L8 8m4-4 4 4" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
            </svg>
          </button>
        </div>

        {/* ---- açıklayıcı not ----
            Referansta başlığın hemen altında duruyor ve BOŞKEN de görünür:
            "describe this list…" yazan soluk bir satır sahibini yazmaya
            davet ediyor. Boş listede hiçbir şey göstermemek o daveti
            kaybettiriyordu. Not insanın yazdığı metin → Karla, düz. */}
        {liste.not ? (
          <p className="mx-4 mt-3 font-metin text-sm leading-relaxed text-gri-800">
            {liste.not}
          </p>
        ) : onDuzenle ? (
          <button onClick={onDuzenle}
            className="mx-4 mt-3 block border-none bg-transparent p-0 text-left text-sm lowercase text-gri-500">
            bu listeyi anlat…
          </button>
        ) : null}

        {/* ---- mekanlar ---- */}
        {liste.yerler.length ? (
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 px-4 pb-8">
            {liste.yerler.map((y) => (
              <li key={y.id}>
                {/* Mekana dokununca liste kapanıyor ve harita oraya odaklanıyor —
                    açık kalsa kullanıcı haritayı listenin altında göremezdi. */}
                <button
                  /* Liste sahibinin pini önce gösterilsin: birinin listesinden
                     bir mekana giriyorsan, merak ettiğin şey ONUN oraya ne
                     yazdığı. Sahip zaten listenin üstünde duruyor. */
                  onClick={() => { onKapat(); onYerAc(y.id, liste.sahip); }}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--cizgi)] bg-yuzey p-2.5 text-left"
                >
                  <span className="grid size-[58px] shrink-0 place-items-center overflow-hidden rounded-md"
                        style={{ background: fotoZemin() }}>
                    {y.kapak ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={kucukUrl(y.kapak, 130)!} alt="" loading="lazy" decoding="async"
                           className="size-full object-cover" />
                    ) : (
                      <span aria-hidden className="text-xl leading-none">{emoji(y.tur)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* Kademe A: mekan adı. */}
                    <span className="block truncate text-base font-extrabold leading-tight tracking-siki">
                      {y.ad}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs lowercase text-gri-600">
                      <span aria-hidden>{emoji(y.tur)}</span>
                      {(TUR_AD[y.tur] ?? y.tur).toLocaleLowerCase("tr")}
                      <span className="text-gri-400">·</span>
                      {y.semt}
                    </span>
                    {sahibi && (
                      <span className="mt-1 block truncate text-2xs lowercase text-gri-500">{sahibi}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 pb-8 pt-5">
            <p className="mb-3 text-sm lowercase leading-relaxed text-gri-600">
              bu listede henüz mekan yok.
            </p>
            {onDuzenle && (
              <button
                onClick={onDuzenle}
                className="w-full rounded-lg border-none bg-gri-900 px-4 py-3.5 text-sm font-semibold lowercase tracking-ui text-white"
              >
                ilk mekanı ekle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
