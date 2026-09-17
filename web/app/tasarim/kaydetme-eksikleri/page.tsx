"use client";

/**
 * /tasarim/kaydetme-eksikleri — kaydetme akışının liste seçicisi.
 *
 * `/tasarim/tokenlar` tokenları, `/tasarim/primitifler` altı primitifi,
 * `/tasarim/mekan-eksikleri` mekan detayının üçünü,
 * `/tasarim/degerlendirme` E1 + E2'yi denetliyor; burası seçicinin ikisini:
 *   E5 ListeSecimKarti  (Kart + Rozet üstüne) + ListeSecici
 *   E6 ListeAcKarosu    (Kart üstüne)
 * ve son bölümde D5 + E2 + E5 + E6'yı yan yana.
 *
 * Kurallar önceki vitrinlerle aynı:
 *   1) Ürün değil ALET. Buradaki hiçbir düzen gerçek bir ekran değil.
 *   2) ÖRNEK VERİ BURADA DURUR. Bileşenler kendi içeriğini uydurmuyor;
 *      liste dizisi, seçim, not, kapak — hepsi bu sayfadan geçiyor.
 *   3) Sayfa denetlediği dile uyuyor: iridesan zemin, beyaz kart, ayraç
 *      çizgisi yok, iki kademeli tipografi.
 *
 * Montaj yok: hiçbiri bir ekrana bağlı değil, o iş sonraki fazın.
 */

import { useState } from "react";
import YineGiderMisin, { type YineGiderDegeri } from "@/components/corner/YineGiderMisin";
import ListeSecimKarti, {
  ListeSecici,
  type SecilebilirListe,
} from "@/components/corner/ListeSecimKarti";
import ListeAcKarosu from "@/components/corner/ListeAcKarosu";
import GidecegimGittim, { type GidisDurumu } from "@/components/corner/GidecegimGittim";
import Pill from "@/components/corner/primitives/Pill";
import { Alt, Baslik, Kutu, TelefonCercevesi } from "@/app/tasarim/_vitrin/Iskelet";

/* ---------- sahte kapaklar ----------
   Ağ isteği YOK: kapaklar data: URI'li SVG. Gerçek fotoğraf yerine
   degrade + emoji, çünkü burada denetlenen şey fotoğrafın kendisi değil,
   üstündeki koyu örtünün beyaz yazıyı okutup okutmadığı. */
function sahteKapak(ust: string, alt: string, simge: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${ust}"/><stop offset="1" stop-color="${alt}"/>` +
    `</linearGradient></defs><rect width="240" height="240" fill="url(#g)"/>` +
    `<text x="120" y="158" font-size="104" text-anchor="middle">${simge}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const LISTELER: SecilebilirListe[] = [
  {
    id: "l1",
    baslik: "yağmurlu gün kahvesi",
    yerSayisi: 12,
    kapak: sahteKapak("#8E7CC3", "#4A3F73", "☕"),
  },
  {
    id: "l2",
    baslik: "Moda'da akşamüstü",
    yerSayisi: 7,
    kapak: sahteKapak("#E08A5A", "#8A3B2E", "🌇"),
    gizli: true,
  },
  /* Kapaksız liste: yedek kolaj kategori emojilerinden geliyor. */
  { id: "l3", baslik: "bir ara giderim", yerSayisi: 3, simgeler: ["🍜", "🍰", "🍺"] },
  /* Ne kapak ne emoji: en sessiz yedek. Ad da bilerek uzun — kırpma denetimi. */
  { id: "l4", baslik: "annem geldiğinde götürebileceğim yerler listesi", yerSayisi: 0 },
];

export default function KaydetmeEksikleriSayfasi() {
  /* E5 canlı: çok seçim. Bir mekan aynı anda birden çok listede olabilir,
     o yüzden dizi; tek seçimli bir ekran (örn. "hangi listeye taşı")
     aynı bileşene tek elemanlı dizi geçirir. */
  const [secililer, setSecililer] = useState<string[]>(["l2"]);
  const [notlar, setNotlar] = useState<Record<string, string>>({ l2: "gün batımı için" });
  const sec = (id: string) =>
    setSecililer((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const [seritSecili, setSeritSecili] = useState<string[]>([]);
  const seritSec = (id: string) =>
    setSeritSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  /* Birleşik düzen: E2 + E5 + mevcut D5 aynı ekranda. Denetlenen şey
     bileşenlerin kendisi değil, YAN YANA DURDUKLARINDA dillerinin tutup
     tutmadığı — kaç dolu siyah eleman var, kaç doygun renk var. */
  const [akisDurum, setAkisDurum] = useState<GidisDurumu>("gittim");
  const [akisTekrar, setAkisTekrar] = useState<YineGiderDegeri | null>("evet");
  const [akisSecili, setAkisSecili] = useState<string[]>(["l1"]);
  const akisSec = (id: string) =>
    setAkisSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const bosDegis = () => {};

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 2
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Kaydetme eksikleri
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Kaydetme akışında karşılığı olmayan liste seçicisi:{" "}
          <code className="font-sayi text-sm">E5 · E6</code>. İkisi de mevcut primitiflerin
          üstüne kuruldu (Kart, Rozet) ve hiçbiri kendi verisini çekmiyor. Sürüm B temel
          alındı. Değerlendirme bileşenleri (E1 derece göstergesi, E2 yine gider miydin){" "}
          <code className="font-sayi text-sm">/tasarim/degerlendirme</code>&apos;de; burada
          yalnızca son bölümde, akışın geri kalanıyla yan yana duruyor.
        </p>

        {/* ============ 1 · E5 satır ============ */}
        <Baslik
          no="01"
          id="ListeSecimKarti"
          ad="Liste seçim kartı — satır"
          kod="E5 · ListeSecimKarti"
          not="Referansta add to a curation / pin to a list. Kapak + 🔒 gizli + ad + N yer + sağda ✓ dairesi. Seçilince kart siyah halka alıyor, ✓ dairesi NANE doluyor — çok seçimli bir listede dört dolu siyah daire tek çapa kuralını çökertirdi. Seçili kartta list_items.note için tek satırlık hap girdi açılıyor."
        />

        <Kutu baslik="canlı — çok seçim + not">
          <ListeSecici
            baslik="hangi listene?"
            listeler={LISTELER}
            secililer={secililer}
            onSec={sec}
            notlar={notlar}
            onNotDegis={(id, n) => setNotlar((o) => ({ ...o, [id]: n }))}
            onYeniListe={bosDegis}
          />
          <Alt>
            seçili: <code className="font-sayi">[{secililer.join(", ") || "—"}]</code> · notlar
            `list_items.note`a yazılır
          </Alt>
        </Kutu>

        <Kutu baslik="tek kart durumları">
          <div className="flex flex-col gap-2">
            <ListeSecimKarti liste={LISTELER[0]} aktif={false} onSec={bosDegis} />
            <ListeSecimKarti liste={LISTELER[0]} aktif onSec={bosDegis} />
            <ListeSecimKarti liste={LISTELER[1]} aktif={false} onSec={bosDegis} />
            <ListeSecimKarti liste={LISTELER[2]} aktif={false} onSec={bosDegis} />
            <ListeSecimKarti liste={LISTELER[3]} aktif={false} onSec={bosDegis} />
            <ListeSecimKarti liste={LISTELER[0]} aktif={false} onSec={bosDegis} pasif />
          </div>
          <Alt>
            seçilmemiş · seçili (not alanı yok, çünkü `onNotDegis` verilmedi) · gizli ·
            kapaksız (emoji kolajı) · ne kapak ne emoji + uzun ad · pasif
          </Alt>
        </Kutu>

        <Kutu baslik="yükleniyor · boş">
          <div className="grid gap-4 md:grid-cols-2">
            <ListeSecici listeler={[]} secililer={[]} onSec={bosDegis} yukleniyor />
            <ListeSecici
              baslik="hangi listene?"
              listeler={[]}
              secililer={[]}
              onSec={bosDegis}
              onYeniListe={bosDegis}
            />
          </div>
          <Alt>
            boş durum beyaz alan değil davet: E6 karosu + cümle. Fotoğraflı CTA kartına
            çevirmek Faz 3 — orada gerçek kapaklar var
          </Alt>
        </Kutu>

        {/* ============ 2 · E5 karo ============ */}
        <Baslik
          no="02"
          id="ListeSecimKarti-karo"
          ad="Liste seçim kartı — karo şeridi"
          kod={'E5 · bicim="karo"'}
          not="Referansta seçicinin yanında gri create a curation KARESİ duruyor; yani o bağlamda liste kartları da kare ve yatay kayıyor. Kare biçim ad'ı fotoğrafın üstüne alıyor, bu yüzden koyu degrade örtü zorunlu. Şerit .serit sınıfıyla: son eleman kasıtlı olarak kenardan taşıyor, solma kaydırılabildiğinin tek işareti."
        />

        <Kutu baslik="canlı şerit">
          <ListeSecici
            bicim="karo"
            baslik="hangi listene?"
            listeler={[...LISTELER, ...LISTELER.map((l) => ({ ...l, id: `${l.id}b` }))]}
            secililer={seritSecili}
            onSec={seritSec}
            onYeniListe={bosDegis}
          />
          <Alt>
            seçili: <code className="font-sayi">[{seritSecili.join(", ") || "—"}]</code> · sağ
            kenarda solma var mı, son karo taşıyor mu
          </Alt>
        </Kutu>

        {/* ============ 3 · E6 ============ */}
        <Baslik
          no="03"
          id="ListeAcKarosu"
          ad="Yeni liste karosu"
          kod="E6 · ListeAcKarosu"
          not="Referansta gri kare + artı. Karo biçiminde gri ve gölgesiz (Kart zemin=bos gölgeyi sıfırlıyor): gölge 'bu bir nesne' der, bu bir davet. Satır biçiminde kabuk beyaz — seçim satırlarıyla aynı sütunda duruyor ve gri bir satır orada 'devre dışı' okunur; 'asıl eylem değil' bilgisini içindeki gri kare taşıyor."
        />

        <Kutu baslik="iki biçim">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <ListeAcKarosu onTikla={bosDegis} />
              <ListeAcKarosu onTikla={bosDegis} altMetin="adını sen koy" />
              <ListeAcKarosu onTikla={bosDegis} pasif />
            </div>
            {/* flex-wrap: üç karo (116 + 92 + 116) telefonda sütuna sığmıyor;
                sarmazsa grid izi karo satırına göre genişliyor ve yan
                sütundaki satır kartları da kutunun dışına taşıyor. */}
            <div className="flex flex-wrap items-start gap-2.5">
              <ListeAcKarosu bicim="karo" onTikla={bosDegis} />
              <ListeAcKarosu bicim="karo" onTikla={bosDegis} genislik={92} />
              <ListeAcKarosu bicim="karo" onTikla={bosDegis} pasif />
            </div>
          </div>
          <Alt>
            etiket jenerik değil cümlenin devamı: &quot;hangi listene?&quot; → &quot;yeni bir
            liste aç&quot;. `components/ListeKarti.tsx`&apos;teki `YeniListeKarosu` ayrı bir
            bileşen (profil ızgarasının son karosu), karıştırma
          </Alt>
        </Kutu>

        {/* ============ 4 · birlikte ============ */}
        <Baslik
          no="04"
          ad="Akış birlikte"
          kod="D5 + E2 + E5 + E6"
          not="Denetim düzeni, ekran değil. Burada bakılan şey bileşenler değil aralarındaki dil: kaç dolu siyah eleman var (olması gereken 1 — D5'in gittim dairesi), kaç doygun renkli UI elemanı var (0), kaydet hapı nane mi mavi mi, ✓ dairesiyle gideceğim dairesi aynı naneyi mi konuşuyor."
        />

        <Kutu baslik="geniş">
          <div className="mx-auto flex max-w-[420px] flex-col gap-3">
            <GidecegimGittim durum={akisDurum} onDegis={setAkisDurum} />
            <YineGiderMisin deger={akisTekrar} onDegis={setAkisTekrar} ipucu="isteğe bağlı" />
            <ListeSecici
              baslik="hangi listene?"
              listeler={LISTELER.slice(0, 3)}
              secililer={akisSecili}
              onSec={akisSec}
              onYeniListe={bosDegis}
            />
            {/* Kaydet NANE, mavi değil: `--color-mavi` bu üründe "çalışıyor /
                burada ara" durumuna ayrıldı. Referansta bu düğme mavi. */}
            <Pill dolgu="nane" boy="buyuk" kat={3} tamGenislik ikon="✓" onTikla={bosDegis}>
              kaydet
            </Pill>
          </div>
        </Kutu>

        {/* Dar ekran denetimi: gerçek 390 piksellik viewport alınamıyor
            (eklenti pencereyi sabitliyor, headless Chrome macOS'ta 500px
            alt sınırlı, iframe frame-ancestors ile engelli). Kapsayıcıyı
            390'a kilitlemek taşmayı da kırpmayı da aynı şekilde gösteriyor;
            asıl kullanım telefon genişliği, o yüzden denetim burada. */}
        <Kutu baslik="dar ekran — 390 piksel kapsayıcı" yalin>
          <TelefonCercevesi className="flex flex-col gap-3 overflow-hidden">
            <GidecegimGittim durum="gittim" onDegis={bosDegis} />
            <YineGiderMisin deger="belki" onDegis={bosDegis} ipucu="isteğe bağlı" />
            <ListeSecici
              baslik="hangi listene?"
              listeler={LISTELER}
              secililer={["l2"]}
              onSec={bosDegis}
              notlar={{ l2: "gün batımı için" }}
              onNotDegis={bosDegis}
              onYeniListe={bosDegis}
            />
            <ListeSecici
              bicim="karo"
              listeler={LISTELER}
              secililer={["l1"]}
              onSec={bosDegis}
              onYeniListe={bosDegis}
            />
            <Pill dolgu="nane" boy="buyuk" kat={3} tamGenislik ikon="✓" onTikla={bosDegis}>
              kaydet
            </Pill>
          </TelefonCercevesi>
          <Alt>yatay taşma var mı, uzun ad kırpılıyor mu, şerit solması duruyor mu</Alt>
        </Kutu>
      </div>
    </main>
  );
}
