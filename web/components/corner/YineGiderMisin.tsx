"use client";

import { useId } from "react";
import Kart from "@/components/corner/primitives/Kart";
import Pill from "@/components/corner/primitives/Pill";

/**
 * E2 — `yine gider miydin?` kartı. Referansta `would you go back?`.
 *
 * ⚠ BU BİLEŞENİN VERİSİ ZATEN VAR, uydurma:
 * `schema.sql` → `pins.would_return text check (would_return in
 * ('evet','belki','hayır'))`. Yani alan ÜÇ kademeli ve değerler Türkçe.
 * `lib/model.ts`'te `Pin.tekrar`, `lib/veri.ts`'te `p.would_return` olarak
 * çevriliyor; `PinFormu` ve `PinDuzenle` aynı üç değeri düz çip olarak
 * gösteriyor. Bu bileşen o üç değerin Corner dilindeki hâli — yeni bir
 * değer, yeni bir kademe ya da şema önerisi TAŞIMIYOR.
 *
 * Referanstan iki bilinçli ayrım:
 *
 *  1) ÜÇ SEÇENEK, iki değil. Referans `👎` / `👍` ikilisi gösteriyor;
 *     bizim şemada arada `belki` var ve o orta kademe bu üründe bilgi
 *     taşıyor ("gene giderim ama sırf o yüzden yoldan çıkmam"). İkiye
 *     indirmek veriyi kaybetmek olurdu.
 *
 *  2) SEÇİLİ HÂL DOLU SİYAH DEĞİL, SİYAH HALKA. Referansta aktif seçenek
 *     dolu siyah; ama skill §14 seçenek listeleri için halkayı söylüyor ve
 *     §3 ekranda tek dolu siyah çapa istiyor. Bu kart kaydetme akışında
 *     `GidecegimGittim` ile AYNI ekranda duruyor ve oradaki `gittim`
 *     dairesi dolu siyah — ikisi birden dolu olursa çapa ikiye çıkar ve
 *     göz hangisinin asıl eylem olduğunu bilemez. Halka istediğin kadar
 *     olabilir, dolu siyah bir tane.
 *
 * ── Favorim kalbi ─────────────────────────────────────────────────
 * Referansta sorunun yanında ayrı bir `♥ fav'd` kutusu var. Bizde "favori"
 * diye bir sütun YOK — en yakın karşılık `DereceGostergesi`'nin 9–10
 * bandı (`favorim`), ama o puandan türeyen bir okunuş, ayrı bir işaret
 * değil. Kalbin ayrı bir bayrak mı yoksa puanın ≥ 9 okunuşu mu olacağı
 * ürünün kararı (NOT.md). Bileşen ikisine de açık: kalp yalnızca
 * `onFavoriDegis` verilirse çiziliyor, durumu da dışarıdan geliyor.
 *
 * Saf sunum: `deger`, `favori` ve geri çağrılar props'tan gelir, `lib/`
 * çağrılmaz.
 */

/** `pins.would_return`'ün izin verdiği üç değer — şemadan birebir. */
export type YineGiderDegeri = "evet" | "belki" | "hayır";

/** Çağıran tarafın döngüye sokabilmesi için; sıra ekrandaki sırayla aynı. */
export const YINE_GIDER_DEGERLERI: readonly YineGiderDegeri[] = ["evet", "belki", "hayır"];

/* Etiket = değerin kendisi. Marka sesi kuralı ("jenerik `Tamam` yazma")
   burada SORUDA yaşıyor: "yine gider miydin?" → "evet / belki / hayır"
   zaten bir konuşma. Etiketi "yine giderim"e çevirmek hem üç kutuyu
   dar ekranda taşırıyor hem de PinFormu'nun gösterdiği değerden
   uzaklaştırıyor — aynı alanın iki yerde iki farklı adı olurdu.
   Emoji burada süs değil arayüz elemanı (skill §6): göz üç kutuyu
   okumadan önce yönü emojiden alıyor. */
const SECENEKLER: readonly { id: YineGiderDegeri; emoji: string }[] = [
  { id: "evet", emoji: "👍" },
  { id: "belki", emoji: "🤔" },
  { id: "hayır", emoji: "👎" },
];

export interface YineGiderMisinProps {
  /** `pins.would_return`. null = henüz cevaplanmadı (alan nullable). */
  deger: YineGiderDegeri | null;
  /** Aynı seçeneğe tekrar dokunmak null'a döner — kararı burada verip
   *  dışarı hazır veriyoruz, çağıran taraf aynı toggle'ı yazmasın. */
  onDegis: (yeni: YineGiderDegeri | null) => void;
  /** Soru metni. Kademe B: küçük harf, arayüz fısıldar. */
  baslik?: string;
  /** Sorunun sağındaki küçük açıklama — "isteğe bağlı" gibi. */
  ipucu?: string;
  /** giriş yok / demo hesap: üçü de tıklanamaz. */
  pasif?: boolean;
  /** hangi seçenek ağ isteğini bekliyor — o kutuda dönen halka çıkar. */
  yukleniyor?: YineGiderDegeri | null;
  /** favorim kalbi dolu mu. `onFavoriDegis` yoksa yok sayılır. */
  favori?: boolean;
  /**
   * Verilirse kartın altında kalp düğmesi çıkar. Veri modelinde karşılığı
   * henüz yok (yukarıdaki not) — kalbi göstermek çağıranın kararı.
   */
  onFavoriDegis?: (yeni: boolean) => void;
  /** kalp isteği bekliyor: kalbin yerinde dönen halka. */
  favoriYukleniyor?: boolean;
  className?: string;
}

export default function YineGiderMisin({
  deger,
  onDegis,
  baslik = "yine gider miydin?",
  ipucu,
  pasif = false,
  yukleniyor = null,
  favori = false,
  onFavoriDegis,
  favoriYukleniyor = false,
  className = "",
}: YineGiderMisinProps) {
  const basId = useId();

  return (
    <Kart zemin="beyaz" yaricap="lg" dolgu="normal" kat={1} className={`w-full ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 id={basId} className="m-0 text-base font-bold lowercase leading-tight tracking-ui text-gri-900">
          {baslik}
        </h3>
        {ipucu && (
          <span className="text-2xs lowercase leading-none tracking-ui text-gri-500">{ipucu}</span>
        )}
      </div>

      {/* role="group" + aria-pressed, radiogroup DEĞİL: seçili seçeneğe
          tekrar dokunmak boşaltıyor, yani bunlar radyo değil üç ayrı
          geçiş düğmesi. Radyo rolü verirsek ekran okuyucuya "birini
          seçmek zorundasın" demiş oluruz, oysa alan nullable. */}
      <div role="group" aria-labelledby={basId} className="mt-3 flex items-stretch gap-2">
        {SECENEKLER.map((s) => {
          const aktif = deger === s.id;
          return (
            <Pill
              key={s.id}
              ikon={s.emoji}
              /* Halka seçili hâlin TEK işareti; gölge de bir kademe
                 düşüyor: halkalı kutu zaten öne çıkıyor, üstüne kalın
                 gölge binince kart içinde yüzen bir chrome gibi duruyor. */
              kenar={aktif ? "halka" : "yok"}
              kat={aktif ? 1 : 2}
              aktif={aktif}
              zipla
              pasif={pasif}
              yukleniyor={yukleniyor === s.id}
              onTikla={() => onDegis(aktif ? null : s.id)}
              /* flex-1: üç kutu eşit genişlikte. 390 pikselde de,
                 tablette de aynı ritim; kutular metne göre büyürse
                 "evet" küçücük, "hayır" geniş kalıyor ve üçü bir
                 seçenek kümesi gibi okunmuyor. */
              className="min-w-0 flex-1"
            >
              {s.id}
            </Pill>
          );
        })}
      </div>

      {onFavoriDegis && (
        <div className="mt-3">
          {/* Üç seçenekten AYRI bir düğme, dördüncü seçenek değil: "yine
              giderim" ile "favorim" aynı eksende değil — biri geri dönüş,
              öbürü gönül. Sol hizalı ve eşit genişlikli satırın altında,
              yoksa göz onu da aynı sorunun cevabı sanıyor.

              Dolu kırmızı kalp skill §14'ün beğeni kalıbı; renk yalnızca
              emojide, hap beyaz kalıyor. Seçili hâl yine siyah halka.
              Cümle değişiyor çünkü durum değişiyor: boşken teklif
              ("favorim olsun"), doluyken beyan ("favorim"). */}
          <Pill
            ikon={favori ? "❤️" : "🤍"}
            kenar={favori ? "halka" : "yok"}
            kat={favori ? 1 : 2}
            aktif={favori}
            zipla
            pasif={pasif}
            yukleniyor={favoriYukleniyor}
            onTikla={() => onFavoriDegis(!favori)}
          >
            {favori ? "favorim" : "favorim olsun"}
          </Pill>
        </div>
      )}
    </Kart>
  );
}
