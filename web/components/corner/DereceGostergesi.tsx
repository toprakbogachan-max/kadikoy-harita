"use client";

import Pill from "@/components/corner/primitives/Pill";

/**
 * E1 — derece göstergesi. Referansta `disliked / okay / liked / favorite`.
 *
 * ⚠ VERİ MODELİ DEĞİŞMİYOR (karar 2026-09-15). Uygulamada `pins.rating`
 * üstünde çalışan sayısal puan var ve o puan KALIYOR. Bu bileşen yalnızca
 * o sayıyı Corner'ın dört kademeli çip görünümüyle GÖSTERİR: girdi değil,
 * seçim yapmaz, yazmaz. Kademe bir veri değil, sayının okunuşu.
 *
 * Şemadaki gerçek aralık 1–10, yarım adımlı (`numeric(3,1)`, `PinFormu`
 * kaydırıcısı `step={0.5}`). Mekan özetindeki ortalama ise 8,3 gibi
 * herhangi bir ondalık olabilir. Bu yüzden eşikler tam sayı kovası değil,
 * sürekli aralık — `puanKademesi` her ondalığı tek bir kademeye düşürüyor.
 *
 * ── Eşik (karar 2026-09-17) ────────────────────────────────────────
 *   1 – 3,5  → beğenmedim   (puan < 4)
 *   4 – 6,5  → idare eder   (puan < 7)
 *   7 – 8,5  → beğendim     (puan < 9)
 *   9 – 10   → favorim
 * Gerekçe `NOT.md`'de. `favorim` bandı aynı zamanda ürünün favori tanımı:
 * ayrı bir favori sütunu yok, `YineGiderMisin`'in kalbi de buradan okuyor.
 * Gerçek pin birikince `place_summary.rating_buckets` ile yeniden bakılacak.
 *
 * ── Biçim ──────────────────────────────────────────────────────────
 * Dört Pill yan yana, ama yalnızca SEÇİLİ olan yazısını taşıyor; diğer
 * üçü emoji kadar. Dördünün de tam etiketi 390 pikselde sığmıyor (~480 px),
 * iki satıra kırılan ya da kayan bir ölçek ise sıralı bir şey gibi
 * okunmuyor. Böylece hem dört kademe hem sıra görünür kalıyor hem de göz
 * doğrudan tek yazılı çipe gidiyor.
 *
 * Dar kapta taşmıyor: önce sayı alt satıra iniyor, en son çare olarak
 * seçili çipin yazısı kırpılıyor — emoji çipler hiç küçülmüyor, çünkü
 * sıra onlarda. Gerçekten dar yerler (akış kartı) için `boy="kucuk"`.
 *
 * Seçili hâl siyah HALKA (skill §14), dolu siyah değil: bu gösterge
 * kaydetme akışında dolu siyah `gittim` dairesiyle aynı ekranda durabiliyor.
 * Seçili olmayanlar soluk ve gri tonlu — seçimi renk körü bir göz de
 * halkadan ve yazıdan alıyor, renkten değil.
 *
 * ── Erişilebilirlik ────────────────────────────────────────────────
 * Göstergede basılacak bir şey yok: çipler `Pill etkilesimsiz`, yani
 * düğme değil `<span>`. Dış kap tek bir `role="img"` + cümle taşıyor
 * ("puan 8,5 · beğendim"); `role="img"` içeriğini ekran okuyucudan
 * saklıyor, dört çip okunmuyor. (Faz 3'e kadar Pill'in etkileşimsiz hâli
 * yoktu ve çipler `inert` bir kapla susturuluyordu — DENETIM-faz3 T1.)
 *
 * Saf sunum: `puan` props'tan gelir, `lib/` çağrılmaz.
 */

export type DereceKademe = "begenmedim" | "idare-eder" | "begendim" | "favorim";

export const DERECE_KADEMELERI: readonly {
  id: DereceKademe;
  ad: string;
  emoji: string;
  /** Bu kademenin ALT sınırı (dahil). Bir üst kademenin altı bunun üstüdür. */
  alt: number;
}[] = [
  { id: "begenmedim", ad: "beğenmedim", emoji: "😕", alt: 0 },
  { id: "idare-eder", ad: "idare eder", emoji: "😐", alt: 4 },
  { id: "begendim", ad: "beğendim", emoji: "😋", alt: 7 },
  { id: "favorim", ad: "favorim", emoji: "😍", alt: 9 },
];

/**
 * Sayıyı kademeye çevirir. Aralık dışı değer sınıra çekilir (0–10);
 * NaN'ı çağıran göndermemeli, gelirse en alt kademe.
 */
export function puanKademesi(puan: number): DereceKademe {
  const p = Math.min(10, Math.max(0, puan));
  let sonuc: DereceKademe = "begenmedim";
  for (const k of DERECE_KADEMELERI) if (p >= k.alt) sonuc = k.id;
  return sonuc;
}

/* 8.5 → "8,5", 9 → "9". Türkçe ondalık virgül; toFixed yerine
   Intl, çünkü "9,0" yazmak bir yarım adımın varlığını ima ediyor. */
const puanYazisi = (p: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(p);

export interface DereceGostergesiProps {
  /**
   * 0–10 puan. `pins.rating` (1–10, yarım adım) ya da mekan özetindeki
   * ortalama. null = henüz puan yok (örn. hiç pin atılmamış mekan).
   */
  puan: number | null;
  /**
   * olcek → dört çip, seçili olan yazılı (pin detayı, mekan özeti).
   * tek   → yalnızca seçili kademenin çipi (akış kartı gibi dar yerler).
   */
  bicim?: "olcek" | "tek";
  /** sayıyı da yanında göster — kademe okunuşunun kaynağını saklamamak için. */
  puanGoster?: boolean;
  /**
   * Koyu zeminde mi duruyor (fotoğraf üstü, koyu katman). Yalnızca yanındaki
   * sayının rengini çeviriyor: gri sayı koyu fotoğrafın üstünde sönük
   * kalıyor. Çipler zaten beyaz hap, onlar iki zeminde de okunur.
   */
  koyu?: boolean;
  /** orta: pin detayı, mekan özeti · kucuk: akış kartı gibi dar satırlar. */
  boy?: "kucuk" | "orta";
  /**
   * Gölge kademesi. Varsayılan 1 (duran içerik). Kartın kenarına oturan ya
   * da fotoğrafın üstünde yüzen bir satırdaysa 2 (skill §5).
   */
  kat?: 0 | 1 | 2 | 3 | 4 | 5;
  /** veri gelmeden yer tutucu: çipler geldiğinde satır zıplamasın. */
  yukleniyor?: boolean;
  /** puan null iken `tek` biçiminde görünen cümle. */
  bosMetin?: string;
  className?: string;
}

export default function DereceGostergesi({
  puan,
  bicim = "olcek",
  puanGoster = false,
  koyu = false,
  boy = "orta",
  kat = 1,
  yukleniyor = false,
  bosMetin = "henüz puan yok",
  className = "",
}: DereceGostergesiProps) {
  if (yukleniyor) {
    /* Ölçüler tarayıcıda ölçülen çip boyları: yer tutucu gerçek satırla
       aynı yeri kaplasın, veri gelince satır zıplamasın. */
    const [yuk, bos, dolu] = boy === "kucuk" ? ["h-6", "w-[34px]", "w-[93px]"] : ["h-[35px]", "w-11", "w-[113px]"];
    const genislikler = bicim === "tek" ? [dolu] : [bos, bos, dolu, bos];
    return (
      <span aria-hidden className={`inline-flex items-center gap-1.5 ${className}`}>
        {genislikler.map((g, i) => (
          <span
            key={i}
            className={`shrink-0 animate-pulse rounded-full bg-gri-100 motion-reduce:animate-none ${yuk} ${g}`}
          />
        ))}
      </span>
    );
  }

  const bos = puan == null || Number.isNaN(puan);
  const secili = bos ? null : puanKademesi(puan);
  const seciliAd = DERECE_KADEMELERI.find((k) => k.id === secili)?.ad;
  const okunur = bos ? bosMetin : `puan ${puanYazisi(puan)} · ${seciliAd}`;

  const kademeler =
    bicim === "tek" ? DERECE_KADEMELERI.filter((k) => k.id === secili) : DERECE_KADEMELERI;

  return (
    <span
      role="img"
      aria-label={okunur}
      className={`inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1.5 ${className}`}
    >
      {/* items-stretch: yazılı çip yazının satır yüksekliğini taşıyor, emoji
          çipler taşımıyor (35 / 29 px). Uzatılınca dördü aynı boyda. */}
      <span className="inline-flex min-w-0 max-w-full items-stretch gap-1.5">
        {bicim === "tek" && bos ? (
          /* Boş `tek`: kademe yok, cümle var. Soluk ama okunur —
             "puan yok" bir hata değil, henüz kimse gitmemiş. */
          <Pill ikon="🫥" boy={boy} kat={kat} etkilesimsiz className="min-w-0">
            {/* Renk iç yazıda: Pill'in kendi `text-gri-900`ı ile aynı
                özellikte ikinci bir sınıf yarışır, kazananı sıra belirler. */}
            <span className="text-gri-500">{bosMetin}</span>
          </Pill>
        ) : (
          kademeler.map((k) => {
            const aktif = k.id === secili;
            return (
              <Pill
                key={k.id}
                ikon={k.emoji}
                /* `tek` biçiminde halka yok: yanında karşılaştıracak kardeş
                   yokken halka "seçildi" değil "odaklandı" okunur. */
                kenar={aktif && bicim === "olcek" ? "halka" : "yok"}
                boy={boy}
                kat={kat}
                etkilesimsiz
                /* min-h: yazısız çip 29 px, yazılı 35 px. Seçili çip varken
                   items-stretch eşitliyor; puan YOKKEN (hepsi yazısız) satır
                   yer tutucudan ve dolu hâlden kısa kalmasın diye. */
                className={
                  aktif ? "min-w-0" : `shrink-0 opacity-55 grayscale ${boy === "orta" ? "min-h-[35px]" : ""}`
                }
              >
                {aktif ? k.ad : undefined}
              </Pill>
            );
          })
        )}
      </span>

      {puanGoster && !bos && (
        <span
          aria-hidden
          className={`font-sayi text-xs font-bold leading-none ${koyu ? "text-white/85" : "text-gri-600"}`}
        >
          {puanYazisi(puan)}
        </span>
      )}
    </span>
  );
}
