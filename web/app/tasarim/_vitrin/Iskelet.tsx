import type { ReactNode } from "react";

/**
 * Önizleme sayfalarının ortak iskeleti.
 *
 * `_vitrin` bir private folder: Next.js onu routing'e katmıyor, yani burası
 * bir sayfa değil (01-app/01-getting-started/02-project-structure.md).
 *
 * Faz 3'e kadar yedi sayfanın her biri bu dört yardımcıyı kendisi
 * tanımlıyordu ve kopyalar kaymaya başlamıştı (`kod` / `kodlar`, etiket
 * altı 10 / 12 px). Bir vitrin sayfası eklerken iskeleti buradan al,
 * kopyalama.
 *
 * Kurallar önizleme sayfalarınınkiyle aynı: bunlar ürün değil ALET, ama
 * denetledikleri dile uyuyorlar — ayraç çizgisi yok, iki kademeli
 * tipografi, kenarlık yerine kağıt zemin.
 */

/** Bölüm başlığı: numara + Kademe C ad + isteğe bağlı envanter kodu + not. */
export function Baslik({
  no,
  ad,
  kod,
  not,
  id,
}: {
  no: string;
  ad: string;
  /** envanter kodu ve dosya adı — "E1 · DereceGostergesi" gibi. */
  kod?: string;
  not: string;
  /** index sayfasından bu bölüme bağlantı için. */
  id?: string;
}) {
  return (
    /* scroll-mt: bağlantıyla gelinince başlık ekranın tepesine yapışmasın. */
    <header id={id} className="mb-4 mt-12 scroll-mt-8 first:mt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-sayi text-2xs text-gri-500">{no}</span>
        <h2 className="text-xs font-bold uppercase tracking-etiket text-gri-900">{ad}</h2>
        {kod && <span className="font-sayi text-2xs text-gri-400">{kod}</span>}
      </div>
      <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-700">{not}</p>
    </header>
  );
}

/** Kutunun üstündeki küçük etiket — Kademe C. */
export function Etiket({ children }: { children: ReactNode }) {
  return <div className="mb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-500">{children}</div>;
}

/**
 * Kağıt zeminli örnek kutusu. Kağıt zemin şart: beyaz kartın gölgesi ancak
 * burada görünür, yani "kenarlık yerine gölge" kuralı ancak burada
 * denetlenebilir.
 *
 * `yalin`: etiket ve alt boşluk kalır, kağıt kutu kalkar. Telefon çerçevesi
 * için — kutunun kendi dolgusu çerçeveyi telefon genişliğinde 390 değil
 * 324 piksele düşürüyor, gerçek ekrandan dar bir şey sınanmış oluyordu.
 */
export function Kutu({
  baslik,
  children,
  className = "",
  yalin = false,
}: {
  baslik: string;
  children: ReactNode;
  className?: string;
  yalin?: boolean;
}) {
  return (
    <section className="mb-3">
      <Etiket>{baslik}</Etiket>
      {yalin ? (
        children
      ) : (
        <div className={`rounded-lg bg-kagit p-4 ${className}`} style={{ border: "1px solid var(--cizgi)" }}>
          {children}
        </div>
      )}
    </section>
  );
}

/** Kutunun altındaki küçük açıklama satırı. */
export function Alt({ children }: { children: ReactNode }) {
  return <div className="mt-2 text-2xs lowercase tracking-ui text-gri-500">{children}</div>;
}

/**
 * 390 piksellik telefon sütunu. `Kutu yalin` içinde kullan; dolgulu bir
 * kutunun içine konursa daralır.
 *
 * Kesik çizgi bir ayraç değil, "buranın sınırı ekranın kenarı" işareti.
 * `yalin`: çerçevenin kendi zemini ve dolgusu olmasın — içindeki şey
 * (ör. sahte altlık harita) kenara kadar dayanıyorsa.
 */
export function TelefonCercevesi({
  children,
  className = "",
  yalin = false,
}: {
  children: ReactNode;
  className?: string;
  yalin?: boolean;
}) {
  if (yalin) return <div className={`mx-auto w-[390px] max-w-full ${className}`}>{children}</div>;
  return (
    <div
      className={`mx-auto w-[390px] max-w-full rounded-lg bg-kagit p-4 ${className}`}
      style={{ border: "1px dashed var(--cizgi)" }}
    >
      {children}
    </div>
  );
}
