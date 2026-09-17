"use client";

import Avatar from "@/components/corner/primitives/Avatar";
import Pill from "@/components/corner/primitives/Pill";

/**
 * B5 — arkadaş marker'ı. Referansta mor kişi silüeti + `@jake saved`.
 *
 * Envanter bölüm 6 madde 11: `everyone` → `sadece arkadaşlar` seçilince
 * haritadaki TÜM marker'lar fotoğraftan mor kişi ikonuna dönüyor. Yani
 * bu bir marker çeşidi değil, haritanın bir MODU: soru "burada ne var"
 * olmaktan çıkıp "burada kim ne yaptı" oluyor, işaret de mekanı değil
 * kişiyi göstermeye başlıyor.
 *
 * ⚠ SAF SUNUM — VE BAŞKA TÜRLÜSÜ ŞU AN MÜMKÜN DEĞİL.
 * Yakınlık sorgusu (`places_nearby`) "bu mekanı kim kaydetti" bilgisini
 * döndürmüyor; şemada mekan → kaydeden kişi yolu istemciye hiç gelmiyor.
 * Bu yüzden kişi adı, fotoğrafı ve eylem metni PROPS olarak gelir.
 * Burada fetch, şema tahmini ya da `lib/` çağrısı YOKTUR.
 *
 * Ürün kararı (2026-09-17): veri AYRI BİR RPC'den gelecek, yalnızca
 * arkadaş modunda çağrılan — `places_nearby` her harita hareketinde
 * koştuğu için genişletilmiyor. RPC henüz yazılmadı (NOT.md).
 *
 * ── Renk: referanstan bilinçli ayrım ───────────────────────────────
 * Referansın moru doygun. Bizde haritadaki son doygun renk (kategori
 * noktası) BİLEREK kaldırılmıştı — "dokuz doygun renk haritayı bir renk
 * tablosuna çeviriyordu" (Harita.tsx). Aynı hatayı onuncu renkle geri
 * getirmemek için mor pastel uçtan alınıyor: zemin `--color-rozet-lila`,
 * glif `--color-rozet-lila-ink`. Çift AA geçiyor, beyaz kenar + gölge
 * ayrışmayı zaten sağlıyor.
 *
 * ── Etiket ─────────────────────────────────────────────────────────
 * Haritada çıplak yazı okunmaz; etiket kendi beyaz hapında duruyor
 * (.foto-marker-etiket'in kuralı). MUTLAKA mutlak konumlu: normal akışta
 * dursaydı daire koordinatın üstünden kayardı. `pointer-events-none` —
 * etikete dokunmak haritayı kaydırmaya devam etsin.
 */

/* Kişi silüeti — kimin kaydettiği bilinmiyorsa ya da kalabalık kadrajda
   yüz göstermeye gerek yoksa. Baş + omuz; 24'lük ızgarada çizilip
   kapsayıcıyla ölçekleniyor. */
function Siluet({ boyut }: { boyut: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={boyut}
      height={boyut}
      fill="currentColor"
      aria-hidden
      className="block"
    >
      <circle cx="12" cy="9.1" r="3.9" />
      <path d="M4.7 20.6c0-4.2 3.3-6.7 7.3-6.7s7.3 2.5 7.3 6.7z" />
    </svg>
  );
}

/* Harita işaretlerinin beyaz kenarı — .foto-marker-kutu ile aynı 2.5 px. */
const HARITA_KENARI = "0 0 0 2.5px var(--color-yuzey)";

export interface ArkadasMarkeriProps {
  /** `@` olmadan kullanıcı adı. Etikette başına `@` konuyor. */
  kullaniciAdi?: string;
  /**
   * Eylem metni — `kaydetti`, `beğendi`, `gitti`. Uygulamadan gelir,
   * bileşen uydurmaz: hangi eylemlerin var olduğu veri modelinin kararı.
   */
  eylem?: string;
  /** kişinin görünen adı — avatarın baş harfi buradan. */
  ad?: string;
  /** verilirse silüet yerine kişinin kendi fotoğrafı çizilir. */
  foto?: string;
  /** fotosuz avatarın zemini (lib/gorsel.ts `kisiRengi` çıktısı gibi). */
  renk?: string;
  /** etiketi gizle — kalabalık kadrajda yalnız daireler kalır. */
  etiketsiz?: boolean;
  secili?: boolean;
  /** dairenin çapı (px). */
  boyut?: number;
  className?: string;
}

export default function ArkadasMarkeri({
  kullaniciAdi,
  eylem = "kaydetti",
  ad,
  foto,
  renk,
  etiketsiz = false,
  secili = false,
  boyut = 40,
  className = "",
}: ArkadasMarkeriProps) {
  const etiketVar = !etiketsiz && !!kullaniciAdi;
  const okunur = kullaniciAdi ? `@${kullaniciAdi} ${eylem}` : `bir arkadaşın ${eylem}`;

  return (
    <span
      role="img"
      aria-label={okunur}
      className={`relative block ${className}`}
      style={{ width: boyut, height: boyut }}
    >
      {/* Ölçek iç katmanda — MapLibre'nin transform'uyla çakışmasın. */}
      <span
        className="block size-full origin-center transition-transform duration-(--sure-gecis) ease-yumusak motion-reduce:transition-none"
        style={{ transform: secili ? "scale(1.18)" : undefined }}
      >
        {foto || ad ? (
          /* Kim olduğunu BİLİYORSAK yüzü göstermek silüetten iyidir:
             "bir arkadaşın" değil "Deniz" diyor. Şekil yine DAİRE —
             squircle kimlik, daire haritadaki nokta (skill §5). */
          /* Kenar Avatar'ın kendi halkası değil, dış kapta: haritadaki
             işaretlerin beyaz kenar sözleşmesi 2.5 px (.foto-marker-kutu,
             aşağıdaki silüet), Avatar'ın `beyaz` halkası ise 2 px — aynı
             bileşenin iki varyantı farklı kalınlıkta duruyordu
             (DENETIM-faz3 T11). */
          <span
            className="block size-full rounded-full"
            style={{ boxShadow: `${HARITA_KENARI}, var(--shadow-kat-3)` }}
          >
            <Avatar ad={ad} foto={foto} renk={renk} boyut={boyut} sekil="daire" kat={0} />
          </span>
        ) : (
          <span
            aria-hidden
            className="grid size-full place-items-center rounded-full"
            style={{
              background: "var(--color-rozet-lila)",
              color: "var(--color-rozet-lila-ink)",
              boxShadow: `${HARITA_KENARI}, var(--shadow-kat-3)`,
            }}
          >
            <Siluet boyut={Math.round(boyut * 0.66)} />
          </span>
        )}
      </span>

      {etiketVar && (
        /* Beyaz hap, `Pill etkilesimsiz`: haritanın üstünde tıklamayı yutan
           bir düğme istemiyoruz (Faz 3'e kadar Pill yalnızca düğme
           üretiyordu ve bu hap elle çiziliyordu — DENETIM-faz3 T1).
           MUTLAKA mutlak konumlu ve `pointer-events-none`: etikete dokunmak
           haritayı kaydırmaya devam etsin. Okunur metin dış kapta. */
        <span aria-hidden className="pointer-events-none absolute left-full top-1/2 ml-[7px] -translate-y-1/2">
          <Pill etkilesimsiz boy="kucuk" kat={2} kasa="aynen" className="max-w-[160px]">
            {/* Kişi adı ASLA BÜYÜK HARF (skill §4): insanın adı vitrin
                değil kimlik. Kalın + sıkı aralık yeter. */}
            <b className="font-extrabold tracking-siki text-gri-900">@{kullaniciAdi}</b>{" "}
            <span className="font-semibold lowercase tracking-ui text-gri-600">{eylem}</span>
          </Pill>
        </span>
      )}
    </span>
  );
}
