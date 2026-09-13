"use client";

import { useEffect } from "react";
import type { Liste } from "@/lib/model";
import { igneStil, simgeSvg, fotoZemin } from "@/lib/gorsel";
import { TUR_AD } from "@/lib/paleti";
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
  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  return (
    <div role="dialog" aria-modal="true" aria-label={liste.baslik}
         className="iridesan absolute inset-0 z-[42] flex flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ---- kapak ---- */}
        <div className="ortulu relative aspect-[16/11] w-full overflow-hidden bg-gri-100">
          <ListeKapagi liste={liste} genislik={800} />

          {/* Yüzen chrome: dolu bir şerit değil, kapağın üstünde iki ayrı
              beyaz düğme. Kapak fotoğrafı hiçbir yerinden kesilmiyor. */}
          <button onClick={onKapat} aria-label="Geri"
            className="absolute left-3 top-3 z-[1] grid size-9 place-items-center rounded-md border-none bg-yuzey text-lg leading-none text-gri-900 shadow-kat-3">
            ‹
          </button>
          {onDuzenle && (
            <button onClick={onDuzenle}
              className="absolute right-3 top-3 z-[1] rounded-full border-none bg-yuzey px-3 py-2 text-sm font-semibold lowercase tracking-ui text-gri-900 shadow-kat-3">
              düzenle
            </button>
          )}

          {/* Kademe A beyaz metin — .ortulu'nun koyu degradesi üstünde.
              Başlık kullanıcının yazdığı kasada duruyor; ızgaradaki kartla
              aynı kural (ListeKarti). */}
          <div className="absolute inset-x-0 bottom-0 z-[1] p-4">
            <h2 className="text-2xl font-extrabold leading-tight tracking-isim text-white">
              {liste.baslik}
            </h2>
            <div className="mt-1.5 text-2xs font-bold uppercase tracking-etiket text-white/80">
              {liste.yerler.length} mekan{sahibi ? ` · ${sahibi}` : ""}
            </div>
          </div>
        </div>

        {/* Not insanın yazdığı metin — el yazısı kalıyor. Ayraç çizgisi
            kalktı, kendi beyaz kartında duruyor (skill §5: derinlik
            gölgeden gelir). */}
        {liste.not && (
          <p className="mx-4 mt-4 rounded-lg bg-yuzey p-3.5 font-el text-base leading-snug shadow-kat-1">
            {liste.not}
          </p>
        )}

        {/* Liste düz bir addan ibaretti: "Yağmurlu günde Kadıköy" deyip
            mekanların birbirine yakın mı, ilçeye dağılmış mı olduğunu
            göstermiyordu. Harita listenin şeklini bir bakışta veriyor;
            dokununca ana harita bu listeye kadraj alıyor. */}
        {haritalik.length > 0 && (
          onHaritada ? (
            <button
              onClick={() => onHaritada(liste)}
              aria-label={`${liste.baslik} listesini haritada göster`}
              className="relative m-4 block w-[calc(100%-2rem)] overflow-hidden rounded-lg border-none bg-su p-0 shadow-kat-1"
            >
              <MiniHarita yerler={haritalik} />
              <span className="absolute bottom-2 right-2 rounded-full bg-yuzey px-2.5 py-1 text-2xs font-semibold lowercase text-gri-800 shadow-kat-2">
                haritada gör
              </span>
            </button>
          ) : (
            <div className="m-4 overflow-hidden rounded-lg bg-su shadow-kat-1">
              <MiniHarita yerler={haritalik} />
            </div>
          )
        )}

        {liste.yerler.length ? (
          <ul className="m-0 list-none p-0 pb-6">
            {liste.yerler.map((y) => (
              <li key={y.id}>
                {/* Mekana dokununca liste kapanıyor ve harita oraya odaklanıyor —
                    açık kalsa kullanıcı haritayı listenin altında göremezdi. */}
                <button
                  /* Liste sahibinin pini önce gösterilsin: birinin listesinden
                     bir mekana giriyorsan, merak ettiğin şey ONUN oraya ne
                     yazdığı. Sahip zaten listenin üstünde duruyor. */
                  onClick={() => { onKapat(); onYerAc(y.id, liste.sahip); }}
                  className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left last:border-0"
                >
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-md"
                        style={{ background: fotoZemin(y.tur) }}>
                    <span style={igneStil(y.tur)}
                          dangerouslySetInnerHTML={{ __html: simgeSvg(y.tur, 19, "var(--pin-koyu)") }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold">{y.ad}</span>
                    <span className="block font-sayi text-xs text-gri-600">
                      {TUR_AD[y.tur] ?? y.tur} · {y.semt}
                      {y.pinSayisi ? ` · ${y.pinSayisi} pin` : ""}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-base text-gri-600">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-5 text-sm leading-relaxed text-gri-600">
            Bu listede henüz mekan yok.
          </p>
        )}
      </div>
    </div>
  );
}
