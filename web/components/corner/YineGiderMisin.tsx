"use client";

import { useId } from "react";
import Kart from "@/components/corner/primitives/Kart";
import Pill from "@/components/corner/primitives/Pill";
import Rozet from "@/components/corner/primitives/Rozet";
import { puanKademesi } from "@/components/corner/DereceGostergesi";

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
 *     indirmek veriyi kaybetmek olurdu. Ürün kararı (2026-09-17): üç
 *     seçenek kalıyor.
 *
 *  2) SEÇİLİ HÂL DOLU SİYAH DEĞİL, SİYAH HALKA. Referansta aktif seçenek
 *     dolu siyah; ama skill §14 seçenek listeleri için halkayı söylüyor ve
 *     §3 ekranda tek dolu siyah çapa istiyor. Bu kart kaydetme akışında
 *     `GidecegimGittim` ile AYNI ekranda duruyor ve oradaki `gittim`
 *     dairesi dolu siyah — ikisi birden dolu olursa çapa ikiye çıkar ve
 *     göz hangisinin asıl eylem olduğunu bilemez. Halka istediğin kadar
 *     olabilir, dolu siyah bir tane.
 *
 * ── Favorim kalbi: puanın okunuşu (karar 2026-09-17) ─────────────────
 * Referansta sorunun yanında ayrı bir `♥ fav'd` kutusu var. Bizde "favori"
 * diye bir sütun YOK ve açılmıyor: favorim, puanın `DereceGostergesi`
 * eşiğindeki en üst kademesi (≥ 9). Bu yüzden kalp bir DÜĞME değil
 * GÖSTERGE — açıp kapatmanın yolu puanı değiştirmek. Eşik tek yerde
 * (`puanKademesi`) yaşıyor, burada tekrar yazılmıyor.
 *
 * Saf sunum: `deger`, `puan` ve geri çağrı props'tan gelir, `lib/`
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
  /**
   * Aynı pinin puanı (`pins.rating`). Favorim kademesindeyse (≥ 9) sorunun
   * yanında kalp rozeti çıkar; verilmezse ya da altındaysa hiçbir şey.
   */
  puan?: number | null;
  className?: string;
}

export default function YineGiderMisin({
  deger,
  onDegis,
  baslik = "yine gider miydin?",
  ipucu,
  pasif = false,
  yukleniyor = null,
  puan = null,
  className = "",
}: YineGiderMisinProps) {
  const basId = useId();
  const favori = puan != null && !Number.isNaN(puan) && puanKademesi(puan) === "favorim";

  return (
    <Kart zemin="beyaz" yaricap="lg" dolgu="normal" kat={1} className={`w-full ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 id={basId} className="m-0 text-base font-bold lowercase leading-tight tracking-ui text-gri-900">
          {baslik}
        </h3>
        {(favori || ipucu) && (
          <span className="flex items-center gap-2">
            {/* Kalp sorunun YANINDA, seçeneklerin arasında değil: "yine
                giderim" ile "favorim" aynı eksende değil — biri geri
                dönüş, öbürü gönül. Düğme değil rozet, çünkü basınca
                değişmiyor; kaynağı puan. Dolu kırmızı kalp skill §14'ün
                beğeni kalıbı, renk yalnızca emojide ve pastel rozette.
                Kasa JS'te: CSS uppercase "favorim"i "FAVORIM" yapar. */}
            {favori && (
              <Rozet ton="pembe" sekil="hap" ikon="❤️">
                FAVORİM
              </Rozet>
            )}
            {ipucu && (
              <span className="text-2xs lowercase leading-none tracking-ui text-gri-500">{ipucu}</span>
            )}
          </span>
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

    </Kart>
  );
}
