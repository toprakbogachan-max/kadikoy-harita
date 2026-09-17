"use client";

/**
 * /tasarim/mekan-eksikleri — mekan detayında eksik olan üç bileşen.
 *
 * `/tasarim` tokenları, `/tasarim/primitifler` altı primitifi denetliyor;
 * burası o primitiflerden kurulan ÜÇ mekan bileşenini denetliyor:
 *   D2  KayitRozeti      (Rozet üstüne)
 *   D5  GidecegimGittim  (Pill üstüne)
 *   D10 MekanNotu        (Kart + Pill üstüne)
 *
 * Kurallar primitif vitriniyle aynı:
 *   1) Ürün değil ALET. Buradaki hiçbir düzen gerçek bir ekran değil.
 *   2) ÖRNEK VERİ BURADA DURUR. Bileşenler kendi içeriğini uydurmuyor;
 *      sayı, metin, imza, durum hepsi bu sayfadan geçiyor. D5'in veri
 *      modeli zaten YOK — durumu bu sayfanın state'i taşıyor.
 *   3) Sayfa denetlediği dile uyuyor: iridesan zemin, beyaz kart, ayraç
 *      çizgisi yok, iki kademeli tipografi.
 *
 * Montaj yok: üçü de hiçbir ekrana bağlı değil, o iş sonraki fazın.
 */

import { useEffect, useRef, useState } from "react";
import KayitRozeti from "@/components/corner/KayitRozeti";
import GidecegimGittim, { type GidisDurumu } from "@/components/corner/GidecegimGittim";
import MekanNotu, { NOT_BASLIKLARI } from "@/components/corner/MekanNotu";
import { Alt, Baslik, Kutu, TelefonCercevesi } from "@/app/tasarim/_vitrin/Iskelet";

const KISA = "Sabah sekizde açıyor ve o saatte içeride üç kişi oluyor; on birden sonra kuyruk kapının dışına taşıyor.";

const UZUN =
  "Dar, uzun bir dükkan; sekiz kişi zor sığıyor ama kimse acele ettirmiyor. " +
  "Öğleden sonra güneş sokağa vurunca kapının önündeki iki tabure en iyi yer oluyor, " +
  "içerisi ise her mevsim serin kalıyor. Müzik konuşmayı bastırmayacak kadar kısık, " +
  "priz yok — laptopla gelenler bir saat sonra pes edip kitabını çıkarıyor. " +
  "Kalabalık ağırlıklı mahalleli: aynı üç masa, aynı saatlerde, aynı insanlar. " +
  "İlk gelişinde tezgahın arkasındaki tahtaya bak, günün demlemesi orada yazıyor ve " +
  "menüde görünmüyor.";

export default function MekanEksikleriSayfasi() {
  /* D5 canlı: durum SAYFANIN state'i. Bileşenin kendi hafızası yok ve
     olmamalı — veri modeli kararı verilene kadar durumu hep dışarısı tutar. */
  const [durum, setDurum] = useState<GidisDurumu>("yok");

  /* Ağ gecikmeli ikinci kopya: `yukleniyor` yuvası gerçek hayatta böyle
     görünüyor — dokunuş anında dönen halka, cevap gelince oturan durum. */
  const [agDurum, setAgDurum] = useState<GidisDurumu>("gidecegim");
  const [bekleyen, setBekleyen] = useState<"gidecegim" | "gittim" | null>(null);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (zaman.current) clearTimeout(zaman.current); }, []);

  const agDegis = (yeni: GidisDurumu) => {
    const hedef = yeni === "yok" ? (agDurum === "yok" ? null : (agDurum as "gidecegim" | "gittim")) : yeni;
    setBekleyen(hedef);
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => {
      setAgDurum(yeni);
      setBekleyen(null);
    }, 900);
  };

  const [notAcik, setNotAcik] = useState(false);

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 2
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Mekan eksikleri
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Mekan detayında karşılığı olmayan üç bileşen:{" "}
          <code className="font-sayi text-sm">D2 · D5 · D10</code>. Üçü de mevcut
          primitiflerin üstüne kuruldu (Rozet, Pill, Kart) ve hiçbiri kendi verisini
          çekmiyor. Sürüm B temel alındı; bu üçü referansın iki sürümünde de aynı.
        </p>

        {/* ============ 1 · D2 ============ */}
        <Baslik
          no="01"
          ad="Kayıt rozeti"
          kod="D2 · KayitRozeti"
          not="Referansta 946 SAVES. Pembe zemin, küçük punto, kalın BÜYÜK harf — Kademe C. Sayı font-sayi ile konuşuyor, binlik ayracı elde (ICU'ya güvenmek hidrasyon uyuşmazlığı riski). Sıfır varsayılan olarak HİÇ çizilmiyor: “0 KAYIT” bilgi değil suçlama."
        />

        <Kutu baslik="normal — sayı aralıkları">
          <div className="flex flex-wrap items-center gap-2">
            <KayitRozeti sayi={7} />
            <KayitRozeti sayi={94} />
            <KayitRozeti sayi={946} />
            <KayitRozeti sayi={12480} />
            <KayitRozeti sayi={1240567} />
          </div>
          <Alt>dört basamaktan sonra nokta giriyor · 1.240.567 hâlâ tek satır</Alt>
        </Kutu>

        <Kutu baslik="boy, ikon ve ton">
          <div className="flex flex-wrap items-center gap-2">
            <KayitRozeti sayi={946} boy="kucuk" />
            <KayitRozeti sayi={946} boy="orta" />
            <KayitRozeti sayi={946} ikon="🔖" />
            <KayitRozeti sayi={48} etiket="pin" ton="lila" />
            <KayitRozeti sayi={12} etiket="liste" ton="nane" />
            <KayitRozeti sayi={3} etiket="fotoğraf" ton="kahve" />
          </div>
          <Alt>ton rozet paletinden geliyor · “pin” Türkçe büyütülüyor (PİN, PIN değil)</Alt>
        </Kutu>

        <Kutu baslik="boş ve yükleniyor">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-gri-50 px-2 py-1">
              <KayitRozeti sayi={0} />
              <span className="text-2xs lowercase text-gri-500">← burada hiçbir şey yok (doğru)</span>
            </span>
            <KayitRozeti sayi={0} sifirEtiketi="ilk kayıt sende" />
            <KayitRozeti sayi={946} yukleniyor />
            <KayitRozeti sayi={946} boy="orta" yukleniyor />
          </div>
          <Alt>sıfır bej, pembe değil: davet övünmeyle aynı sesle konuşmaz</Alt>
        </Kutu>

        {/* ============ 2 · D5 ============ */}
        <Baslik
          no="02"
          ad="Gideceğim / gittim"
          kod="D5 · GidecegimGittim"
          not="İki daire, üstlerinde küçük harf etiket, üç durum. Dokun: ikon zıplıyor (skill §13 kalıp 4, yalnızca ikon — kap zıplarsa komşusu da oynuyormuş gibi olur), destekleyen cihazda haptik eşlik ediyor. Aktif daireye tekrar dokunmak durumu siliyor. Dolu “gideceğim” referansta mavi, bizde NANE: mavi bu üründe çalışıyor/burada ara için ayrıldı."
        />

        <Kutu baslik="canlı — dokun, zıplamayı ve haptiği dene">
          <div className="flex flex-wrap items-center gap-6">
            <GidecegimGittim durum={durum} onDegis={setDurum} />
            <div className="text-2xs lowercase tracking-ui text-gri-600">
              durum: <code className="font-sayi text-xs text-gri-900">{durum}</code>
            </div>
          </div>
          <Alt>bileşenin kendi hafızası yok · durum bu sayfanın state&apos;i</Alt>
        </Kutu>

        <Kutu baslik="üç durum yan yana (statik)">
          <div className="flex flex-wrap items-start gap-6">
            {(["yok", "gidecegim", "gittim"] as const).map((d) => (
              <div key={d}>
                <GidecegimGittim durum={d} onDegis={() => {}} />
                <div className="mt-1.5 text-center font-sayi text-2xs text-gri-500">{d}</div>
              </div>
            ))}
          </div>
        </Kutu>

        <Kutu baslik="pasif (giriş yok / demo hesap) ve yükleniyor">
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <GidecegimGittim durum="yok" onDegis={() => {}} pasif />
              <div className="mt-1.5 text-center text-2xs lowercase text-gri-500">pasif</div>
            </div>
            <div>
              <GidecegimGittim durum="gidecegim" onDegis={() => {}} pasif />
              <div className="mt-1.5 text-center text-2xs lowercase text-gri-500">pasif · dolu</div>
            </div>
            <div>
              <GidecegimGittim durum="yok" onDegis={() => {}} yukleniyor="gidecegim" />
              <div className="mt-1.5 text-center text-2xs lowercase text-gri-500">yükleniyor</div>
            </div>
            <div>
              <GidecegimGittim durum={agDurum} onDegis={agDegis} yukleniyor={bekleyen} />
              <div className="mt-1.5 text-center text-2xs lowercase text-gri-500">ağ gecikmeli · dokun</div>
            </div>
          </div>
          <Alt>bir daire çalışırken diğeri de kilitleniyor: iki isteği aynı anda başlatmak durumu çakıştırır</Alt>
        </Kutu>

        {/* ============ 3 · D10 ============ */}
        <Baslik
          no="03"
          ad="Mekan notu"
          kod="D10 · MekanNotu"
          not="Referansta VIBE / WHAT TO GET, envanterin “mekan detayının kalbi”. Başlık Kademe C (BÜYÜK, küçük punto, ferah aralık), gövde Karla — çünkü bunu bir insan yazdı. Türkçe başlıklar: havası · ne söylesen · ne kaçırma · ne zaman git."
        />

        <Kutu baslik="normal — iki blok alt alta, ayraç yok">
          <div className="flex max-w-[420px] flex-col gap-2.5">
            <MekanNotu baslik={NOT_BASLIKLARI.havasi} ikon="🌤️" metin={KISA} />
            <MekanNotu
              baslik={NOT_BASLIKLARI.neSoylesen}
              ikon="☕"
              metin="Filtre kahve. Süt eklettirme, zaten ekşi değil. Yanına tereyağlı simit isteyebilirsin, menüde yazmıyor."
              imza="— deniz · mart"
            />
          </div>
          <Alt>iki blok aralıkla ayrılıyor, çizgiyle değil (skill §14)</Alt>
        </Kutu>

        <Kutu baslik="uzun metin — kısaltmalı ve kısaltmasız">
          <div className="flex flex-wrap items-start gap-2.5">
            <div className="w-full max-w-[420px]">
              <MekanNotu baslik={NOT_BASLIKLARI.havasi} ikon="🌤️" metin={UZUN} satirSiniri={3} imza="— sinem · şubat" />
              <Alt>satirSiniri=3 · “devamını oku” kartın içinde çıplak metin, ikinci bir hap değil</Alt>
            </div>
            <div className="w-full max-w-[420px]">
              <MekanNotu baslik={NOT_BASLIKLARI.neKacirma} ikon="🎭" metin={UZUN} />
              <Alt>satirSiniri=0 · kısaltma yok, kart metin kadar uzuyor</Alt>
            </div>
          </div>
        </Kutu>

        <Kutu baslik="boş ve yükleniyor">
          <div className="flex flex-wrap items-start gap-2.5">
            <div className="w-full max-w-[420px]">
              <MekanNotu
                baslik={NOT_BASLIKLARI.neSoylesen}
                ikon="🍽️"
                onYaz={() => setNotAcik(true)}
              />
              <Alt>boş durum beyaz alan değil, davet · düğme cümlenin devamı</Alt>
            </div>
            <div className="w-full max-w-[420px]">
              <MekanNotu baslik={NOT_BASLIKLARI.neZamanGit} ikon="🕐" bosMetin="buranın kalabalık saatlerini kimse yazmamış." />
              <Alt>onYaz verilmezse yalnız davet cümlesi kalıyor (okuyucu giriş yapmamış)</Alt>
            </div>
            <div className="w-full max-w-[420px]">
              <MekanNotu baslik={NOT_BASLIKLARI.havasi} ikon="🌤️" yukleniyor />
              <Alt>yer tutucu üç satır · metin gelince alttaki bloklar zıplamıyor</Alt>
            </div>
          </div>
          {notAcik && (
            <p className="mt-3 rounded-md bg-yuzey p-3 font-metin text-sm text-gri-700 shadow-kat-1">
              “ilk sen yaz.” geri çağrısı çalıştı — gerçek uygulamada burada yazma
              formu açılır. Bu sayfada yalnızca kanıt satırı.{" "}
              <button
                type="button"
                onClick={() => setNotAcik(false)}
                className="bas border-none bg-transparent p-0 text-xs font-semibold lowercase tracking-ui text-gri-900 underline"
              >
                tamamdır, kapat
              </button>
            </p>
          )}
        </Kutu>

        {/* ============ 4 · dar çerçeve ============ */}
        <Baslik
          no="04"
          ad="Dar çerçeve"
          kod="390 px · asıl kullanım"
          not="Uygulama telefonda yaşıyor; üçü de 390 pikselde sınanmadan bitmiş sayılmaz. Aşağıdaki sütun tam olarak o genişlikte ve mekan detayındaki komşularını (başlık, sıralama satırı) taklit ediyor — düzen yalnızca oturuşu görmek için, montaj değil."
        />

        <Kutu baslik="390 px sütun" yalin>
          <TelefonCercevesi>
            <div className="flex items-start gap-2">
              <h3 className="m-0 min-w-0 flex-1 text-2xl font-extrabold leading-none tracking-isim text-gri-900">
                Fazıl Bey
              </h3>
              <GidecegimGittim durum={durum} onDegis={setDurum} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <KayitRozeti sayi={946} />
              <KayitRozeti sayi={48} etiket="pin" ton="lila" />
              <span className="text-2xs lowercase text-gri-600">moda · 240 m</span>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              <MekanNotu baslik={NOT_BASLIKLARI.havasi} ikon="🌤️" metin={UZUN} satirSiniri={3} imza="— sinem · şubat" />
              <MekanNotu baslik={NOT_BASLIKLARI.neSoylesen} ikon="☕" onYaz={() => setNotAcik(true)} />
            </div>
          </TelefonCercevesi>
          <Alt>ikili sağ üstte başlıkla aynı hizada · rozetler sarıyor, taşmıyor</Alt>
        </Kutu>

        <p className="mt-12 max-w-[62ch] font-metin text-2xs text-gri-600">
          Üçü de hiçbir ekrana bağlı değil. D5&apos;in arkasında veri modeli YOK:{" "}
          <code className="font-sayi">saves</code> tek bayrak tutuyor, “gittim”in
          bugünkü tek kanıtı o mekana pin atmış olmak. Bu bileşen o kararı beklerken
          durumu dışarıdan alıyor — şema önerisi raporda, kararı ürünün.
        </p>
      </div>
    </main>
  );
}
