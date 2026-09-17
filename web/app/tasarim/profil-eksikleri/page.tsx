"use client";

/**
 * /tasarim/profil-eksikleri — profilde ve listede eksik olan iki bileşen.
 *
 * `/tasarim` tokenları, `/tasarim/primitifler` primitifleri,
 * `/tasarim/mekan-eksikleri` mekan detayının üç bileşenini denetliyor;
 * burası kalan ikisini denetliyor:
 *   F2 OrtakListeHapi  (Pill + Avatar üstüne)
 *   H2 SeriRozeti      (RozetSayac üstüne)
 *
 * Kurallar diğer vitrinlerle aynı:
 *   1) Ürün değil ALET. Buradaki hiçbir düzen gerçek bir ekran değil.
 *   2) ÖRNEK VERİ BURADA DURUR. İkisinin de arkasında veri modeli YOK —
 *      katkıcılar da hafta sayısı da bu sayfanın state/sabitleri.
 *   3) Sayfa denetlediği dile uyuyor: iridesan zemin, beyaz kart, ayraç
 *      çizgisi yok, iki kademeli tipografi.
 *
 * Montaj yok: ikisi de hiçbir ekrana bağlı değil, o iş sonraki fazın.
 */

import { useEffect, useRef, useState } from "react";
import OrtakListeHapi, { type Katkici } from "@/components/corner/OrtakListeHapi";
import SeriRozeti, { SeriRozetSatiri } from "@/components/corner/SeriRozeti";
import { RozetSayac } from "@/components/corner/primitives/Rozet";

/* Örnek katkıcılar — fotosuz, baş harf + renk. Renkler kategori paletinin
   doygun ucundan: 20 piksellik daire "geniş yüzey" değil (skill §3). */
const CREW: Katkici[] = [
  { id: "1", ad: "Deniz", renk: "#7360C4" },
  { id: "2", ad: "Sinem", renk: "#DE9B2E" },
  { id: "3", ad: "İsmail", renk: "#329179" },
  { id: "4", ad: "Kerem", renk: "#DC6389" },
  { id: "5", ad: "Ayla", renk: "#569E4C" },
];

const UZUN_METIN = "bu listeyi birlikte dolduralım, sen de ekle";

/* ---------- vitrin iskeleti (diğer vitrinlerle aynı kalıp) ---------- */

function Baslik({ no, ad, kod, not }: { no: string; ad: string; kod: string; not: string }) {
  return (
    <header className="mb-4 mt-12 first:mt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-sayi text-2xs text-gri-500">{no}</span>
        <h2 className="text-xs font-bold uppercase tracking-etiket text-gri-900">{ad}</h2>
        <span className="font-sayi text-2xs text-gri-400">{kod}</span>
      </div>
      <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-700">{not}</p>
    </header>
  );
}

function Etiket({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-500">{children}</div>;
}

/* Kağıt zemin: beyaz hapın ve beyaz dairenin gölgesi ancak burada görünür,
   yani "kenarlık yerine gölge" kuralı ancak burada denetlenebilir. */
function Kutu({ baslik, children, className = "" }: { baslik: string; children: React.ReactNode; className?: string }) {
  return (
    <section className="mb-3">
      <Etiket>{baslik}</Etiket>
      <div className={`rounded-lg bg-kagit p-4 ${className}`} style={{ border: "1px solid var(--cizgi)" }}>
        {children}
      </div>
    </section>
  );
}

function Alt({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-2xs lowercase tracking-ui text-gri-500">{children}</div>;
}

export default function ProfilEksikleriSayfasi() {
  /* F2 canlı: davet bağlantısı üretiliyormuş gibi bekliyor, sonra
     "kopyalandı"ya düşüyor ve birkaç saniye sonra geri dönüyor. Bileşenin
     kendi hafızası yok ve olmamalı — durumu hep dışarısı tutar. */
  const [durum, setDurum] = useState<"davet" | "kopyalandi">("davet");
  const [bekliyor, setBekliyor] = useState(false);
  const zaman = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const t = zaman.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const davetEt = () => {
    if (bekliyor) return;
    setBekliyor(true);
    zaman.current.push(
      setTimeout(() => {
        setBekliyor(false);
        setDurum("kopyalandi");
      }, 900),
      setTimeout(() => setDurum("davet"), 3400),
    );
  };

  /* H2 canlı: hafta sayısı kaydırılabilir, eşik geçildiğinde ton ve emoji
     dönüyor. Gerçek uygulamada bu sayı bir sorgudan gelecek. */
  const [hafta, setHafta] = useState(3);
  const [seriAcik, setSeriAcik] = useState(false);

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 2
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Profil eksikleri
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Profilde ve liste detayında karşılığı olmayan iki bileşen:{" "}
          <code className="font-sayi text-sm">F2 · H2</code>. İkisi de mevcut
          primitiflerin üstüne kuruldu (Pill + Avatar, RozetSayac) ve hiçbiri kendi
          verisini çekmiyor — çünkü ikisinin de arkasında <strong>veri yok</strong>:
          `lists` tablosunda tek bir sahip var, “seri” diye bir kavram ise hiç yok.
          Sürüm B temel alındı.
        </p>

        {/* ============ 1 · F2 ============ */}
        <Baslik
          no="01"
          ad="Ortak liste hapı"
          kod="F2 · OrtakListeHapi"
          not="Referansta 👤 collaborate. Beyaz hap, degrade KENARLIK — degrade zemin değil 1.5 piksellik bir hat olduğu için “UI elemanını renklendirme” kuralını bozmuyor. Degrade pastel (lila → pembe); referansın doygun mor-mavisi bu üründe geniş yüzeyde yasak. Katkıcı varken emoji yerini daire avatar kümesine bırakıyor."
        />

        <Kutu baslik="canlı — dokun: bağlantı üretiliyor, sonra kopyalanıyor">
          <div className="flex flex-wrap items-center gap-4">
            <OrtakListeHapi
              katkicilar={CREW.slice(0, 2)}
              durum={durum}
              yukleniyor={bekliyor}
              onTikla={davetEt}
            />
            <div className="text-2xs lowercase tracking-ui text-gri-600">
              durum: <code className="font-sayi text-xs text-gri-900">{bekliyor ? "yükleniyor" : durum}</code>
            </div>
          </div>
          <Alt>ikon zıplıyor, kap zıplamıyor · cümle “kopyala” değil “kopyaladım, yolla”</Alt>
        </Kutu>

        <Kutu baslik="katkıcı sayısı — küme üçte duruyor, gerisi sayıya düşüyor">
          <div className="flex flex-wrap items-center gap-3">
            {[0, 1, 2, 3, 5].map((n) => (
              <OrtakListeHapi key={n} katkicilar={CREW.slice(0, n)} onTikla={() => {}} />
            ))}
          </div>
          <Alt>sıfırda emoji + davet cümlesi · birden sonra yüzler + “birini daha çağır”</Alt>
        </Kutu>

        <Kutu baslik="boy, tam genişlik, pasif ve uzun metin">
          <div className="flex flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <OrtakListeHapi boy="kucuk" katkicilar={CREW.slice(0, 3)} onTikla={() => {}} />
              <OrtakListeHapi boy="orta" katkicilar={CREW.slice(0, 3)} onTikla={() => {}} />
              <OrtakListeHapi pasif metin="sahibi davet edebilir" />
            </div>
            <div className="w-full max-w-[320px]">
              <OrtakListeHapi tamGenislik katkicilar={CREW.slice(0, 2)} onTikla={() => {}} />
              <Alt>tam genişlik · boş liste ekranında başlığın altında böyle duruyor</Alt>
            </div>
            <div className="w-[210px]">
              <OrtakListeHapi metin={UZUN_METIN} katkicilar={CREW.slice(0, 3)} onTikla={() => {}} />
              <Alt>210 px kapsayıcı · cümle kırpılıyor, degrade kenarlık bozulmuyor</Alt>
            </div>
          </div>
        </Kutu>

        {/* ============ 2 · H2 ============ */}
        <Baslik
          no="02"
          ad="Haftalık seri rozeti"
          kod="H2 · SeriRozeti"
          not="Referansta 🔥 37 week streak. Pastel gradyan daire + iki satırlık küçük harf gri etiket (skill §14). Ton soğuktan sıcağa gidiyor: yeni seri lila, bir ayı geçen seri pembe-krem, risk krem-şeftali. Sıfır bej — KayitRozeti’ndeki sıfırla aynı karar: davet övünmeyle aynı sesle konuşmaz. Kırmızı yok; kırmızı bu dilde yalnızca “kapalı” ve “sil” demek."
        />

        <Kutu baslik="canlı — hafta sayısını kaydır, eşikte ton ve emoji dönüyor">
          <div className="flex flex-wrap items-center gap-6">
            <SeriRozeti hafta={hafta} onTikla={() => setSeriAcik(true)} />
            <label className="flex items-center gap-2 text-2xs lowercase tracking-ui text-gri-600">
              hafta
              <input
                type="range"
                min={0}
                max={12}
                value={hafta}
                onChange={(e) => setHafta(Number(e.target.value))}
                aria-label="hafta sayısı"
                className="w-40 accent-gri-900"
              />
              <code className="font-sayi text-xs text-gri-900">{hafta}</code>
            </label>
          </div>
          {seriAcik && (
            <p className="mt-3 rounded-md bg-yuzey p-3 font-metin text-sm text-gri-700 shadow-kat-1">
              Dokunuş geri çağrısı çalıştı — gerçek uygulamada burada seri ayrıntısı
              (H9 ipucu kartı) açılır. Bu sayfada yalnızca kanıt satırı.{" "}
              <button
                type="button"
                onClick={() => setSeriAcik(false)}
                className="bas border-none bg-transparent p-0 text-xs font-semibold lowercase tracking-ui text-gri-900 underline"
              >
                tamamdır, kapat
              </button>
            </p>
          )}
          <Alt>onTikla verilmezse rozet düğme değil · dördüncü haftada ateş giriyor (atesEsigi)</Alt>
        </Kutu>

        <Kutu baslik="dört hâl">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {[
              { hafta: 0, not: "yok" },
              { hafta: 2, not: "sürüyor · yeni" },
              { hafta: 37, not: "sürüyor · yanıyor" },
              { hafta: 9, durum: "risk" as const, not: "risk" },
            ].map((h) => (
              <div key={h.not}>
                <SeriRozeti hafta={h.hafta} durum={h.durum} />
                <div className="mt-2 font-sayi text-2xs text-gri-500">{h.not}</div>
              </div>
            ))}
          </div>
          <Alt>emoji tonun yedeği: renk körü gözde hâli taşıyan tek işaret o</Alt>
        </Kutu>

        <Kutu baslik="boyut, basamak ve yükleniyor">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <SeriRozeti hafta={7} boyut={36} />
            <SeriRozeti hafta={7} boyut={44} />
            <SeriRozeti hafta={7} boyut={56} />
            <SeriRozeti hafta={104} boyut={44} />
            <SeriRozeti hafta={0} yukleniyor />
          </div>
          <Alt>104 hafta = iki yıl · üç basamak 36 pikselde de daireyi taşırmıyor</Alt>
        </Kutu>

        <Kutu baslik="çift rozet — sıralama rozetinin verisi de bileşeni de yok">
          <SeriRozetSatiri>
            <RozetSayac sayi="🥉" etiket="kadıköy sırası" ton="kahve" ikinciTon="magaza" />
            <SeriRozeti hafta={37} />
          </SeriRozetSatiri>
          <Alt>soldaki doğrudan RozetSayac · sıralama hesabı kurulana kadar ayrı bileşen yazılmadı</Alt>
        </Kutu>

        {/* ============ 3 · dar çerçeve ============ */}
        <Baslik
          no="03"
          ad="Dar çerçeve"
          kod="390 px · asıl kullanım"
          not="Uygulama telefonda yaşıyor; ikisi de 390 pikselde sınanmadan bitmiş sayılmaz. Aşağıdaki iki sütun tam olarak o genişlikte ve komşularını (profil başlığı, liste başlık kartı) taklit ediyor — düzen yalnızca oturuşu görmek için, montaj değil."
        />

        <Kutu baslik="390 px · profil başlığı">
          <div className="mx-auto w-[390px] max-w-full rounded-lg bg-kagit p-4" style={{ border: "1px dashed var(--cizgi)" }}>
            <div className="flex items-center gap-3">
              <span
                className="grid size-16 shrink-0 place-items-center font-extrabold text-white"
                style={{ background: "#7360C4", borderRadius: 18, fontSize: 26, boxShadow: "var(--shadow-kat-1)" }}
              >
                B
              </span>
              <div className="min-w-0">
                <h3 className="m-0 truncate text-xl font-extrabold tracking-isim text-gri-900">
                  Boğaçhan Toprak
                </h3>
                <p className="mt-0.5 text-xs lowercase tracking-ui text-gri-600">
                  @bogachan · <span className="font-sayi">48</span> pin
                </p>
              </div>
            </div>
            <div className="mt-4">
              <SeriRozetSatiri>
                <SeriRozeti hafta={hafta} />
                <RozetSayac sayi="🥉" etiket="kadıköy sırası" ton="kahve" ikinciTon="magaza" />
              </SeriRozetSatiri>
            </div>
          </div>
          <Alt>kişi adı düzgün kasa (§4: kişi adı asla BÜYÜK değil) · iki rozet sarıyor, taşmıyor</Alt>
        </Kutu>

        <Kutu baslik="390 px · liste başlık kartı">
          <div className="mx-auto w-[390px] max-w-full rounded-lg bg-kagit p-4" style={{ border: "1px dashed var(--cizgi)" }}>
            <h3 className="m-0 text-2xl font-extrabold uppercase leading-none tracking-siki text-gri-900">
              Yağmurlu günde Kadıköy
            </h3>
            <p className="mt-2 text-2xs lowercase tracking-ui text-gri-600">
              📍<span className="font-sayi">12</span> mekan · 🔖
              <span className="font-sayi">11</span> kayıt
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OrtakListeHapi katkicilar={CREW.slice(0, 3)} boy="kucuk" onTikla={() => {}} />
              <span className="text-2xs lowercase text-gri-500">← başlığın altında, tek satır</span>
            </div>
            <div className="mt-3">
              <OrtakListeHapi tamGenislik onTikla={() => {}} />
            </div>
          </div>
          <Alt>boş listede tam genişlik · degrade kenarlık dar ekranda da kesintisiz</Alt>
        </Kutu>

        <p className="mt-12 max-w-[62ch] font-metin text-2xs text-gri-600">
          İkisi de hiçbir ekrana bağlı değil ve ikisinin de arkasında veri modeli YOK.
          F2 için <code className="font-sayi">lists</code> tablosunda tek{" "}
          <code className="font-sayi">owner_id</code> var, katkıcı/davet kavramı yok;
          H2 için ise kod tabanında “seri” diye bir kavram hiç geçmiyor. İkisi de durumu
          dışarıdan alıyor — şema önerisi raporda, kararı ürünün.
        </p>
      </div>
    </main>
  );
}
