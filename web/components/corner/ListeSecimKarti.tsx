"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Kart from "@/components/corner/primitives/Kart";
import Rozet from "@/components/corner/primitives/Rozet";
import ListeAcKarosu from "@/components/corner/ListeAcKarosu";

/**
 * E5 — curation seçici kartı. Referansta `add to a curation` / `pin to a list`.
 *
 * Envanter bölüm 7'nin 3 numaralı maddesi bunu neden önemli sayıyor:
 * **kaydetme ile listeye ekleme aynı akışta.** Bu üründe şu an iki ayrı iş —
 * `PinFormu` pin atıyor, `ListeOlustur` liste kuruyor, ikisi birbirini
 * görmüyor. Bu bileşen o iki işi tek ekranda yan yana getirebilmek için var.
 * Bölüm 5'e göre seçici 5 ekranda geçiyor (want to try, visited, create a
 * post, pin to a list), o yüzden İKİ BİÇİMİ var — aşağıda `bicim`.
 *
 * ⚠ SAF SUNUM. `lib/` çağrılmıyor, liste dizisi ve seçim geri çağrısı
 * props'tan geliyor. Mevcut `components/ListeKarti.tsx`,
 * `ListeOlustur.tsx`, `ListeKapagi.tsx` dosyalarına dokunulmadı; bu
 * bileşen onların yerine geçmiyor, onlarla BİRLEŞECEK (Faz 3, aşağıdaki
 * "kapak" notu).
 *
 * Referanstan bilinçli ayrımlar:
 *
 *  1) ✓ DAİRESİ DOLU SİYAH DEĞİL, NANE. Seçici çok seçimli: dört liste
 *     seçilirse dört dolu siyah daire olur ve skill §3'ün "tek siyah çapa"
 *     kuralı çöker. Nane bu üründe zaten kaydetmenin rengi
 *     (`GidecegimGittim`'in `gideceğim` dairesi, kaydet hapı); seçicinin
 *     onayı da aynı dili konuşuyor. Kartın kendisi seçilince SİYAH HALKA
 *     alıyor — skill §14: "seçim = siyah halka, dolu siyah değil".
 *
 *  2) `add a link` YOK. Referansın kartında `add a note` + `add a link`
 *     var; bizde `list_items.note` sütunu var, bağlantı için sütun YOK.
 *     Olmayan alana arayüz çizmiyoruz.
 *
 *  3) Liste adı BÜYÜK HARFE çevrilmiyor. Skill §4'e göre vitrindeki isim
 *     BÜYÜK, listede akan isim düzgün kasa — burası bir seçim listesi.
 *     `components/ListeKarti.tsx` aynı kararı aynı gerekçeyle vermiş:
 *     listeyi adlandırmak kullanıcının işi, kasasını elinden almıyoruz
 *     (Türkçe İ/ı da CSS `uppercase`te bozuluyor).
 */

/**
 * Seçicinin ihtiyaç duyduğu EN AZ liste bilgisi.
 *
 * Bilerek `lib/model.ts`'teki `Liste` değil: o tip `yerler: Yer[]` istiyor,
 * yani seçiciye 40 mekanın tamamını taşımak gerekiyor — seçicinin tek
 * ihtiyacı sayı. Faz 3'te eşleme şöyle:
 *   id        ← liste.id            (lists.id)
 *   baslik    ← liste.baslik        (lists.title)
 *   yerSayisi ← liste.yerler.length (list_items sayısı)
 *   kapak     ← liste.kapak         (lists.cover_url)
 *   kapakKonum← liste.kapakKonum    (lists.cover_pos)
 *   gizli     ← lists.is_public === false
 *              ⚠ `is_public` ŞEMADA VAR ama `lib/model.ts`'teki `Liste`
 *              tipine ÇEVRİLMİYOR. Kilit rozetini gerçekten göstermek
 *              için model + veri katmanı o alanı taşımalı; kararı ürünün,
 *              bu bileşen sadece bayrağı çiziyor.
 */
export interface SecilebilirListe {
  id: string;
  baslik: string;
  yerSayisi: number;
  /** lists.cover_url */
  kapak?: string | null;
  /** lists.cover_pos — karede fotoğrafın hangi dikey bandı görünsün, 0–100 */
  kapakKonum?: number;
  /** kapaksız listenin yedeği: ilk mekanların kategori emojileri */
  simgeler?: string[];
  /** lists.is_public === false */
  gizli?: boolean;
  /**
   * Faz 3 dikişi: `<ListeKapagi liste={...} />` doğrudan buraya takılır ve
   * üç kademeli yedekleme (kapak → kolaj → degrade) tek yerden gelir.
   * Verilirse `kapak` ve `simgeler`i ezer.
   */
  kapakYuvasi?: ReactNode;
}

export type SecimBicim = "satir" | "karo";

/** Karo şeridinin genişliği. Şeritteki kart ve E6 karosu aynı olmalı. */
export const KARO_GENISLIK = 116;

/* ============================================================
   ortak parçalar
   ============================================================ */

/* Seçili kart siyah halka alıyor. Halka ile gölge AYNI özellikte
   (box-shadow) yaşadığı için satır içi birleştiriliyor — iki ayrı
   Tailwind sınıfı yazılsa sonraki öncekini siler. */
const halkaGolge = (secili: boolean, kat = 1) =>
  secili
    ? `0 0 0 2px var(--color-gri-900), var(--shadow-kat-${kat})`
    : `var(--shadow-kat-${kat})`;

/**
 * Kapak görüntüsü. Üç kademe, hiçbirinde boş gri kutu yok:
 * yuva → fotoğraf → kategori emojileri. Hiçbiri yoksa sessiz bir yer imi.
 * (`components/ListeKapagi.tsx` aynı işi `lib/` ile yapıyor; bu bileşen
 * `lib/` çağıramadığı için emojiler props'tan geliyor.)
 */
function Kapak({ liste }: { liste: SecilebilirListe }) {
  if (liste.kapakYuvasi) return <>{liste.kapakYuvasi}</>;

  if (liste.kapak) {
    return (
      <span
        aria-hidden
        className="block size-full bg-gri-100 bg-cover"
        /* url() TIRNAKLI: tırnaksız url-token adresteki ilk `)` ile biter,
           "Foo_(building).jpg" gibi adlarda bildirim sessizce düşer. */
        style={{
          backgroundImage: `url("${liste.kapak}")`,
          backgroundPosition: `50% ${liste.kapakKonum ?? 50}%`,
        }}
      />
    );
  }

  const simgeler = liste.simgeler?.slice(0, 3) ?? [];
  return (
    /* containerType: emoji kutunun boyutuna göre ölçekleniyor (cqw).
       Aynı parça hem 52 piksellik satır küçüğünü hem 116 piksellik karoyu
       çiziyor; sabit punto birinde minicik, ötekinde devasa kalırdı. */
    <span
      aria-hidden
      className="grid size-full place-items-center bg-gri-100"
      style={{ containerType: "size" }}
    >
      {simgeler.length ? (
        <span className="flex items-center justify-center gap-[6%]">
          {simgeler.map((s, i) => (
            <span key={`${s}-${i}`} className="text-[24cqw] leading-none">
              {s}
            </span>
          ))}
        </span>
      ) : (
        <span className="text-[34cqw] leading-none opacity-35">🔖</span>
      )}
    </span>
  );
}

/* `secili` her değiştiğinde artan sayaç — ✓ dairesini zıplatmak için
   (skill §13 kalıp 4: durum değiştiren düğmede renk tek başına zayıf bir
   onay, göz düğmenin üstündeyken rengin döndüğünü kaçırabilir).
   İlk render sayılmıyor: sayfa açılır açılmaz zıplayan onay, onay değil
   gürültü. `Pill`'in kendi useZipla'sının aynısı; Pill burada
   kullanılamıyor çünkü ✓ dairesi zaten bir düğmenin İÇİNDE. */
function useZipla(deger: boolean) {
  const [sayac, setSayac] = useState(0);
  const ilk = useRef(true);
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    setSayac((n) => n + 1);
  }, [deger]);
  return sayac;
}

function OnayDairesi({ secili, boyut = 24 }: { secili: boolean; boyut?: number }) {
  const zip = useZipla(secili);
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full transition-colors duration-200 ease-yumusak"
      style={{
        width: boyut,
        height: boyut,
        ...(secili
          ? { background: "var(--color-rozet-nane)", color: "var(--color-rozet-nane-ink)" }
          : {
              /* Boş hâl saç teli halka: kesik çizgi ya da gri dolu kutu
                 "burada bir eksik var" der, oysa seçilmemiş olmak eksiklik
                 değil. Sessiz duruyor. */
              boxShadow: "inset 0 0 0 1.5px var(--color-gri-300)",
              color: "transparent",
            }),
      }}
    >
      {/* key: CSS animasyonunu yeniden başlatmanın en ucuz yolu elemanı
          yeniden monte etmek. Zıplayan yalnızca ✓, kabı değil. */}
      <span key={zip} className={zip ? "zipla" : ""}>
        <svg
          width={Math.round(boyut * 0.54)}
          height={Math.round(boyut * 0.54)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      </span>
    </span>
  );
}

/** `🔒 GİZLİ` rozeti. Kasa elde: CSS `uppercase` "gizli"yi "GIZLI" yapar. */
function GizliRozeti() {
  return (
    /* Bej ton bilinçli: gizlilik bir övünme değil bir ayar. Pembe/lila
       "bak ne kadar çok" diyor, bu rozetin söylediği şey o değil. */
    <Rozet ton="diger" boy="kucuk" ikon="🔒">
      GİZLİ
    </Rozet>
  );
}

function YerSayisi({ n, koyu = false }: { n: number; koyu?: boolean }) {
  return (
    <span className={`lowercase tracking-ui ${koyu ? "text-white/85" : "text-gri-500"}`}>
      <span className="font-sayi">{Math.max(0, Math.trunc(n))}</span> yer
    </span>
  );
}

/* ============================================================
   E5 — seçim kartı
   ============================================================ */

export interface ListeSecimKartiProps {
  liste: SecilebilirListe;
  secili: boolean;
  onSec: (id: string) => void;
  /**
   * satir → tam genişlik satır (kapak + ad + N yer + ✓). Kaydetme
   *         akışının ve `pin to a list` panelinin biçimi.
   * karo  → kare kapak, ad fotoğrafın üstünde, yatay kayan şerit.
   *         Referansın `add to a curation` şeridinin biçimi.
   */
  bicim?: SecimBicim;
  /** karo genişliği (px). Şeritteki E6 karosuyla aynı olmalı. */
  genislik?: number;
  /** `list_items.note` — YALNIZCA satır biçiminde ve seçiliyken görünür. */
  not?: string;
  /** verilmezse not alanı hiç çizilmez. */
  onNotDegis?: (id: string, not: string) => void;
  notIpucu?: string;
  pasif?: boolean;
  className?: string;
}

export default function ListeSecimKarti({
  liste,
  secili,
  onSec,
  bicim = "satir",
  genislik = KARO_GENISLIK,
  not = "",
  onNotDegis,
  notIpucu = "bu listede neden duruyor?",
  pasif = false,
  className = "",
}: ListeSecimKartiProps) {
  const notId = useId();

  /* ---- karo: kare kapak + üstünde ad ---- */
  if (bicim === "karo") {
    return (
      /* Kart'ın kendi `onTikla`sı düğme üretiyor ama `aria-pressed`
         taşımıyor; seçim durumu ekran okuyucuya ulaşsın diye düğme
         DIŞARIDA, kabuk içeride. Basma tepkisi (`bas`) da düğmenin. */
      <button
        type="button"
        onClick={() => onSec(liste.id)}
        aria-pressed={secili}
        disabled={pasif}
        className={`bas block shrink-0 border-none bg-transparent p-0 disabled:pointer-events-none disabled:opacity-45 ${className}`}
        style={{ width: genislik }}
      >
        <Kart
          zemin="beyaz"
          dolgu="yok"
          yaricap="md"
          oran="1/1"
          className="w-full"
          style={{ boxShadow: halkaGolge(secili) }}
        >
          <Kapak liste={liste} />
          {/* Koyu degrade örtü ZORUNLU, dekorasyon değil (skill §6):
              üstüne beyaz metin biniyor. Fotoğrafın tamamını karartmıyor. */}
          <span aria-hidden className="absolute inset-0" style={{ background: "var(--ortu)" }} />
          <span className="absolute inset-0 flex flex-col p-2">
            <span className="flex items-start justify-between gap-1">
              {liste.gizli ? (
                <span aria-hidden className="text-2xs leading-none drop-shadow">
                  🔒
                </span>
              ) : (
                <span />
              )}
              <OnayDairesi secili={secili} boyut={22} />
            </span>
            <span className="mt-auto min-w-0">
              <span className="line-clamp-2 text-sm font-extrabold leading-tight tracking-isim text-white">
                {liste.baslik}
              </span>
              <span className="mt-0.5 block text-2xs leading-none">
                <YerSayisi n={liste.yerSayisi} koyu />
              </span>
            </span>
          </span>
        </Kart>
      </button>
    );
  }

  /* ---- satır: tam genişlik ---- */
  return (
    <Kart
      zemin="beyaz"
      dolgu="yok"
      yaricap="lg"
      className={`w-full ${className}`}
      style={{ boxShadow: halkaGolge(secili) }}
    >
      {/* Not alanı düğmenin İÇİNDE olamaz (input in button geçersiz), o
          yüzden satır ile not kardeş; kabuk ikisini sarıyor. */}
      <button
        type="button"
        onClick={() => onSec(liste.id)}
        aria-pressed={secili}
        disabled={pasif}
        className="bas flex w-full items-center gap-3 border-none bg-transparent p-3 text-left disabled:pointer-events-none disabled:opacity-45"
      >
        <span className="block size-13 shrink-0 overflow-hidden rounded-md">
          <Kapak liste={liste} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-extrabold leading-tight tracking-isim text-gri-900">
            {liste.baslik}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-2xs leading-none">
            <YerSayisi n={liste.yerSayisi} />
            {liste.gizli && <GizliRozeti />}
          </span>
        </span>

        <OnayDairesi secili={secili} />
      </button>

      {secili && onNotDegis && (
        <div className="px-3 pb-3">
          <label htmlFor={notId} className="sr-only">
            {liste.baslik} listesi için not
          </label>
          {/* Yuvarlak dolu girdi: skill §8'in kenarlıksız-altçizgili biçimi
              YALNIZCA kayıt akışına ait, iç ekranlarda girdi hap olur.
              Zemin `gomuk` — içe gömülü alan, kartın beyazından geri çekiliyor. */}
          <input
            id={notId}
            type="text"
            value={not}
            onChange={(e) => onNotDegis(liste.id, e.target.value)}
            placeholder={notIpucu}
            disabled={pasif}
            className="w-full rounded-full border-none bg-gomuk px-3.5 py-2 font-metin text-sm text-gri-800 outline-none placeholder:text-gri-500 focus:bg-gri-50"
          />
        </div>
      )}
    </Kart>
  );
}

/* ============================================================
   seçicinin kendisi — E5 kartları + E6 karosu
   ============================================================ */

export interface ListeSeciciProps {
  listeler: SecilebilirListe[];
  /** seçili liste id'leri. Çok seçim: bir mekan birden çok listede olabilir. */
  secililer: string[];
  onSec: (id: string) => void;
  bicim?: SecimBicim;
  /** bölüm etiketi — Kademe C: BÜYÜK, küçük punto, ferah aralık. */
  baslik?: string;
  /** `list_items.note` haritası: liste id → not. */
  notlar?: Record<string, string>;
  onNotDegis?: (id: string, not: string) => void;
  /** verilirse şeridin/listenin sonuna E6 karosu eklenir. */
  onYeniListe?: () => void;
  yeniListeEtiketi?: string;
  karoGenislik?: number;
  /**
   * Karo şeridinin kapsayıcı dolgusunun DIŞINA taşma payı (px). Şerit
   * kartın kenarına kadar aksın diye negatif kenar boşluğu + aynı kadar
   * iç dolgu veriliyor: içeride bitirilirse "devamı var" sinyali kaybolur
   * ve şerit kesilmiş bir liste gibi durur. Kapsayıcının dolgusu 16 değilse
   * burayı ona eşitle; 0 taşmayı kapatır.
   */
  seritKenar?: number;
  yukleniyor?: boolean;
  /** hiç liste yokken çıkan davet cümlesi. */
  bosMetin?: string;
  pasif?: boolean;
  className?: string;
}

export function ListeSecici({
  listeler,
  secililer,
  onSec,
  bicim = "satir",
  baslik,
  notlar,
  onNotDegis,
  onYeniListe,
  yeniListeEtiketi,
  karoGenislik = KARO_GENISLIK,
  seritKenar = 16,
  yukleniyor = false,
  bosMetin = "henüz listen yok. ilk seçkini burada açabilirsin.",
  pasif = false,
  className = "",
}: ListeSeciciProps) {
  const bos = !yukleniyor && listeler.length === 0;

  const yeni = onYeniListe && (
    <ListeAcKarosu
      bicim={bicim}
      genislik={karoGenislik}
      onTikla={onYeniListe}
      etiket={yeniListeEtiketi}
      pasif={pasif}
    />
  );

  return (
    <section className={className}>
      {baslik && (
        <h3 className="mb-2 text-2xs font-bold uppercase leading-none tracking-etiket text-gri-600">
          {baslik}
        </h3>
      )}

      {yukleniyor ? (
        <YerTutucu bicim={bicim} genislik={karoGenislik} />
      ) : bicim === "karo" ? (
        /* .serit: scrollbar gizli + sağ kenarda solma. Skill §6 — son
           eleman KASITLI olarak kenardan taşar, "devamı var" sinyalinin
           kendisi bu. Taşma payı `seritKenar` (yukarıdaki nota bak).

           pt-1 / -mt-1: `overflow-x: auto` dikeyde de kırpıyor ve seçili
           karonun 2 piksellik siyah halkası (box-shadow, kutunun DIŞINDA)
           üstten kesiliyordu. İç dolgu halkaya yer açıyor, eksi kenar
           boşluğu şeridin yerini değiştirmiyor. */
        <div
          className="serit -mt-1 flex gap-2.5 pb-1 pt-1"
          style={{ marginInline: -seritKenar, paddingInline: seritKenar }}
        >
          {listeler.map((l) => (
            <ListeSecimKarti
              key={l.id}
              liste={l}
              secili={secililer.includes(l.id)}
              onSec={onSec}
              bicim="karo"
              genislik={karoGenislik}
              pasif={pasif}
            />
          ))}
          {yeni}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Ayraç çizgisi yok, ARALIK var (skill §14): ayraç "bunlar tek
              listenin parçaları" der, aralık "bunlar ayrı seçimler". */}
          {listeler.map((l) => (
            <ListeSecimKarti
              key={l.id}
              liste={l}
              secili={secililer.includes(l.id)}
              onSec={onSec}
              bicim="satir"
              not={notlar?.[l.id] ?? ""}
              onNotDegis={onNotDegis}
              pasif={pasif}
            />
          ))}
          {yeni}
        </div>
      )}

      {/* Boş durum bir hata değil, davet anı (skill §6): boş beyaz alan
          yerine cümle + E6 karosu duruyor. Fotoğraflı CTA kartına
          çevirmek Faz 3'ün işi — orada gerçek kapaklar var. */}
      {bos && (
        <p className="mt-2 mb-0 font-metin text-sm leading-snug text-gri-600">{bosMetin}</p>
      )}
    </section>
  );
}

/* Yer tutucu: veri gelince satır zıplamasın. Genişlikler eşit değil —
   eşit bloklar tablo gibi duruyor, liste gibi değil. */
function YerTutucu({ bicim, genislik }: { bicim: SecimBicim; genislik: number }) {
  if (bicim === "karo") {
    return (
      <div aria-hidden className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="shrink-0 animate-pulse rounded-md bg-gri-100 motion-reduce:animate-none"
            style={{ width: genislik, height: genislik }}
          />
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {["w-full", "w-full", "w-[88%]"].map((g, i) => (
        <span
          key={i}
          className={`h-[70px] animate-pulse rounded-lg bg-gri-100 motion-reduce:animate-none ${g}`}
        />
      ))}
    </div>
  );
}
