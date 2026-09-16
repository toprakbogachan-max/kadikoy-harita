"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Kart from "@/components/corner/primitives/Kart";
import Pill from "@/components/corner/primitives/Pill";

/**
 * D10 — editoryal blok. Referansta `VIBE` ve `WHAT TO GET`.
 *
 * Envanter bölüm 7 bunu "mekan detayının kalbi" diye işaretliyor ve haklı:
 * saat, mesafe, puan her uygulamada var; "burası nasıl bir yer, ne
 * söylemeli" sorusuna cevap veren tek şey bu blok. Uygulamadaki karşılığı
 * şu an yok — mekan özeti üç kelime ve pin notları üretiyor, ikisi de
 * kırpılmış cümleler. Bu blok DERLENMİŞ, tam cümle konuşan taraf.
 *
 * Biçim iki kademeli tipografinin ders kitabı örneği (skill §4):
 *   başlık → Kademe C: BÜYÜK harf, küçük punto, POZİTİF aralık.
 *   gövde  → insan metni, o yüzden Karla (`font-metin`). Uygulamanın
 *            yazdığı metinle insanın yazdığı metin yazı tipiyle ayrışıyor.
 *
 * İçerik uydurmuyor: başlık, metin ve imza props. Boşken beyaz alan
 * bırakmıyor — boş durum bir hata değil, davet (skill §6).
 */

/**
 * Önerilen başlıklar. Jenerik "Hakkında"/"Detay" değil, marka sesiyle
 * soru-cevap: her biri kullanıcının kafasındaki cümlenin kendisi.
 * Montaj fazı hangisini kullanacağına mekan türüne bakarak karar verir
 * (yeme-içme → `neSoylesen`, park/kültür → `neKacirma`).
 */
export const NOT_BASLIKLARI = {
  /** `VIBE` — "mekanın havası" zaten Türkçedeki hazır deyim. */
  havasi: "havası",
  /** `WHAT TO GET` — "söylemek" Türkçede sipariş fiili: "ne söylesem?" */
  neSoylesen: "ne söylesen",
  /** yeme-içme dışı mekanlar için `WHAT TO GET` karşılığı. */
  neKacirma: "ne kaçırma",
  /** referansta yok; saat akordeonunun anlatamadığı şey ("kalabalık saatler"). */
  neZamanGit: "ne zaman git",
} as const;

export interface MekanNotuProps {
  /** küçük harf yazılır, ekranda BÜYÜK görünür: "havası" → "HAVASI". */
  baslik: string;
  /** blok metni. Boş/undefined ise davet hâli çizilir. */
  metin?: string;
  /** emoji ya da svg — başlığın önünde. Emoji burada süs değil arayüz. */
  ikon?: ReactNode;
  /** "— deniz · mart" gibi. Bunu bir İNSAN yazdı, kim olduğu görünmeli. */
  imza?: string;
  /** kaç satırdan sonra kısaltılsın. 0 = hiç kısaltma. */
  satirSiniri?: number;
  yukleniyor?: boolean;
  /** boşken çıkan davet düğmesi. Verilmezse davet metni tek başına durur. */
  onYaz?: () => void;
  /** davet düğmesinin etiketi — jenerik "Ekle" değil, cümlenin devamı. */
  yazEtiketi?: string;
  /** boşken gösterilen davet cümlesi. */
  bosMetin?: string;
  className?: string;
}

/* Türkçe kasa JS'te: CSS `uppercase` "ne içsen"i "NE IÇSEN" yapıyor.
   `toLocaleUpperCase("tr")` "NE İÇSEN" veriyor — Avatar'daki aynı tuzak. */
const buyut = (s: string) => s.toLocaleUpperCase("tr");

/* Satır kısıtı prop'tan geldiği için `line-clamp-3` gibi sabit bir sınıf
   yazamıyoruz (Tailwind sınıf adlarını derleme anında tarıyor, çalışma
   anında üretilen ad bundle'a girmiyor). Satır içi stil tek doğru yol. */
const kirp = (satir: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: satir,
  overflow: "hidden",
});

export default function MekanNotu({
  baslik,
  metin,
  ikon,
  imza,
  satirSiniri = 0,
  yukleniyor = false,
  onYaz,
  yazEtiketi = "ilk sen yaz.",
  bosMetin = "burayı anlatan cümle henüz yazılmadı.",
  className = "",
}: MekanNotuProps) {
  const [acik, setAcik] = useState(false);
  const dolu = Boolean(metin && metin.trim());
  /* Kısaltma yalnızca uzun metinde anlamlı: 40 karakterlik bir cümlenin
     altına "devamını oku" koymak kullanıcıyı boşa tıklatır. */
  const kisaltilabilir = dolu && satirSiniri > 0 && (metin as string).length > satirSiniri * 52;

  return (
    <Kart zemin="beyaz" yaricap="lg" dolgu="normal" kat={1} className={`w-full ${className}`}>
      <div className="flex items-center gap-1.5">
        {ikon && (
          <span aria-hidden className="shrink-0 text-sm leading-none">
            {ikon}
          </span>
        )}
        <h3 className="m-0 text-xs font-bold uppercase leading-none tracking-etiket text-gri-900">
          {buyut(baslik)}
        </h3>
      </div>

      {yukleniyor ? (
        /* Yer tutucu üç satır: metin gelince kart aşağıdakileri itmesin.
           Genişlikler eşit değil — eşit bloklar tablo gibi duruyor. */
        <div aria-hidden className="mt-2.5 flex flex-col gap-1.5">
          {["w-full", "w-[92%]", "w-[58%]"].map((g) => (
            <span
              key={g}
              className={`h-3 animate-pulse rounded-xs bg-gri-100 motion-reduce:animate-none ${g}`}
            />
          ))}
        </div>
      ) : dolu ? (
        <>
          <p
            className="mt-2 mb-0 font-metin text-sm leading-relaxed text-gri-800"
            style={kisaltilabilir && !acik ? kirp(satirSiniri) : undefined}
          >
            {metin}
          </p>

          {kisaltilabilir && (
            /* Referanstaki `show more ⌄` gibi çıplak metin: kartın içinde
               ikinci bir hap, bloğun kendisiyle yarışır. */
            <button
              type="button"
              onClick={() => setAcik((a) => !a)}
              aria-expanded={acik}
              className="bas mt-1.5 inline-flex items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold lowercase tracking-ui text-gri-600"
            >
              {acik ? "kısa tut" : "devamını oku"}
              <span
                aria-hidden
                className={`leading-none transition-transform duration-200 ease-yumusak ${acik ? "rotate-180" : ""}`}
              >
                ⌄
              </span>
            </button>
          )}

          {imza && (
            /* Bu alanı giriş yapan herkes değiştirebiliyor; imza şart —
               MekanSayfasi'ndaki "Gitmeden önce" kutusunda da öyle. */
            <p className="mt-2 mb-0 font-sayi text-2xs text-gri-500">{imza}</p>
          )}
        </>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="m-0 min-w-0 flex-1 font-metin text-sm leading-snug text-gri-600">{bosMetin}</p>
          {onYaz && (
            /* Degrade PASTEL (lila → pembe): davet, uyarı değil. */
            <Pill dolgu="degrade" boy="kucuk" kat={1} ikon="✍️" onTikla={onYaz}>
              {yazEtiketi}
            </Pill>
          )}
        </div>
      )}
    </Kart>
  );
}
