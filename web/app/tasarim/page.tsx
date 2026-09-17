"use client";

/**
 * /tasarim — token denetim sayfası.
 *
 * Ürün değil, ALET. globals.css'teki tokenları gözle doğrulamak için var:
 * bir gri kademesini değiştirdiğinde kontrastın nereye düştüğünü, bir
 * gölgeyi kısarsan kartın zeminden kopup kopmadığını burada görürsün.
 *
 * İki kural:
 *   1) Buradaki hiçbir şey bir "bileşen" değil. Primitif yazma yeri
 *      components/corner/ olacak; burası yalnızca vitrin. Bu dosyadan
 *      bir parçayı ürüne kopyalamak istiyorsan önce primitifi yaz.
 *   2) Sayfa kendi denetlediği dile UYMAK zorunda — iridesan zemin,
 *      beyaz kart, ayraç çizgisi yok, iki kademeli tipografi. Denetim
 *      sayfası kuralı çiğniyorsa kuralın ne olduğu belli olmaz.
 *
 * Kontrast oranları göz kararı değil, WCAG 2.1 bağıl parlaklık formülüyle
 * ölçüldü; rakamlar #FAFAF8 kâğıt zemine göre.
 */

import { useState } from "react";
import { Baslik, Etiket } from "@/app/tasarim/_vitrin/Iskelet";

/* Kategoriler lib/paleti.ts'teki sırayla; o dosyayı İÇE AKTARMIYORUZ.
   Denetim sayfası ürün koduna bağlanırsa paleti.ts değiştiğinde sayfa
   sessizce onunla birlikte kayar ve "token doğru mu" sorusu cevapsız
   kalır. Buranın işi tokenı olduğu gibi göstermek. */
const KATEGORILER = [
  ["yemek", "🍽️", "Yemek", "7.13"],
  ["kahve", "☕", "Kahve", "4.93"],
  ["bar", "🍸", "Bar", "8.08"],
  ["tatli", "🍰", "Tatlı", "6.07"],
  ["kultur", "🎭", "Kültür", "6.53"],
  ["park", "🌳", "Park", "5.73"],
  ["otel", "🛎️", "Otel", "8.83"],
  ["magaza", "🛍️", "Mağaza", "7.09"],
  ["diger", "📍", "Diğer", "8.69"],
] as const;

const RAMPA = [
  ["50", "#F4F4F3", "1.05", "dekor"],
  ["100", "#EAEAE9", "1.15", "dekor"],
  ["200", "#DCDCDB", "1.31", "dekor"],
  ["300", "#C3C3C4", "1.69", "dekor"],
  ["400", "#A8A8AB", "2.27", "dekor"],
  ["500", "#86868A", "3.47", "ikon · 18px+ kalın"],
  ["600", "#6B6B70", "5.07", "her boyutta metin"],
  ["700", "#4E4E53", "7.92", "her boyutta metin"],
  ["800", "#3A3A3D", "10.85", "gövde metni"],
  ["900", "#0B0B0C", "18.83", "başlık · siyah çapa"],
] as const;

const GOLGELER = [
  ["kat-1", "duran içerik: kart, liste satırı"],
  ["kat-2", "yüzen chrome: harita üstü buton, çip"],
  ["kat-3", "en üst: alt nav kapsülü, FAB, modal"],
  ["kat-4", "çekilebilir alt panel, açılır menü"],
  ["kat-5", "tam ekran katman"],
] as const;

const YARICAPLAR = [
  ["xs", "8px", "rozet, sayaç"],
  ["sm", "12px", "küçük fotoğraf"],
  ["md", "16px", "ikon butonu (squircle)"],
  ["lg", "20px", "kart, panel"],
  ["xl", "22px", "profil avatarı (squircle)"],
  ["2xl", "28px", "alt panel üst köşesi"],
] as const;

/* Kart: beyaz yüzey + saç teli + kat-1. Ayraç çizgisi YOK, derinlik
   gölgeden geliyor (skill §5). */
function Kart({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg bg-yuzey p-4 shadow-kat-1 ${className}`}
      style={{ border: "1px solid var(--cizgi)" }}
    >
      {children}
    </div>
  );
}

export default function TasarimSayfasi() {
  /* Hareket tek seferlik animasyonlarla anlatılıyor; tekrar izlemek için
     anahtarı değiştirip elemanları yeniden monte ediyoruz. CSS animasyonu
     yeniden başlatmanın en ucuz yolu bu — class silip eklemek reflow
     zorlamayı gerektiriyor, React'te key zaten onu yapıyor. */
  const [tur, setTur] = useState(0);
  const [kayitli, setKayitli] = useState(false);
  const [camAcik, setCamAcik] = useState(false);

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        {/* ---------- sayfa başlığı: Kademe A ---------- */}
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Token Denetimi
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Bu sayfa ürünün parçası değil; <code className="font-sayi text-sm">globals.css</code>{" "}
          içindeki tokenların gözle doğrulandığı yer. Bir tokenı
          değiştirdiğinde önce burayı aç, sonra uygulamayı.
        </p>

        {/* ============ 1 · ZEMİN VE YÜZEY ============ */}
        <Baslik
          no="01"
          ad="Zemin ve yüzey"
          not="Zemin saf beyaz DEĞİL: kırık beyazın üstüne üç çok geniş, çok soluk radial gradyan biniyor. Bu sayfanın kendi arka planı da o — köşelerde nane, lila ve şeftali belli belirsiz beliriyor. Fark ediliyorsa fazla güçlü demektir. Kart zeminden çizgiyle değil GÖLGEYLE ayrışıyor."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["kagit", "#FAFAF8", "sayfa zemini"],
            ["yuzey", "#FFFFFF", "kart yüzeyi"],
            ["gomuk", "#F4F4F2", "girdi zemini"],
          ].map(([ad, hex, is]) => (
            <Kart key={ad} className="!p-0 overflow-hidden">
              <div className="h-16" style={{ background: `var(--color-${ad})` }} />
              <div className="p-3">
                <div className="text-sm font-bold lowercase tracking-ui text-gri-900">{ad}</div>
                <div className="font-sayi text-2xs text-gri-600">{hex}</div>
                <div className="mt-1 font-metin text-2xs text-gri-600">{is}</div>
              </div>
            </Kart>
          ))}
          <Kart className="!p-0 overflow-hidden">
            <div
              className="h-16"
              style={{
                background:
                  "radial-gradient(90% 90% at 90% 10%, var(--yikama-nane), transparent 70%), radial-gradient(90% 90% at 10% 90%, var(--yikama-lila), transparent 70%), radial-gradient(70% 70% at 95% 85%, var(--yikama-seftali), transparent 70%), var(--color-kagit)",
              }}
            />
            <div className="p-3">
              <div className="text-sm font-bold lowercase tracking-ui text-gri-900">yıkama</div>
              <div className="font-sayi text-2xs text-gri-600">nane · lila · şeftali</div>
              <div className="mt-1 font-metin text-2xs text-gri-600">
                yoğunlaştırılmış; gerçekte çok daha soluk
              </div>
            </div>
          </Kart>
        </div>

        {/* ============ 2 · GRİ RAMPA ============ */}
        <Baslik
          no="02"
          ad="Nötr rampa ve kontrast eşiği"
          not="Oranlar #FAFAF8 kâğıt zemine göre WCAG 2.1 formülüyle ölçüldü, göz kararı değil. Eşik üç kademe: gri-600 ve koyusu her boyutta metin taşır, gri-500 yalnızca ikon ve 18px üstü kalın yazı, gri-400 ve açığı SADECE dekor."
        />
        <Kart>
          <ul className="flex flex-col">
            {/* flex-wrap ŞART: sabit genişlikli dört sütun artı kullanım metni
                telefon genişliğinde satıra sığmıyor ve satır taşınca SAYFANIN
                TAMAMI kayıyordu — mx-auto kapsayıcı en geniş çocuğuna göre
                genişleyip bütün paragrafları ekran dışına itiyor. Sarmalayınca
                kullanım metni alt satıra düşüyor, taşma bitiyor. */}
            {RAMPA.map(([no, hex, oran, kullanim]) => (
              <li key={no} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
                {/* Örnek kare DEĞİL dikdörtgen: 36 pikselde rounded-md (16px)
                    neredeyse daire oluyor ve şekil dili bölümünün "daire =
                    haritadaki nokta" kuralıyla karışıyor. Burada gösterilen
                    şey renk, şekil değil. */}
                <span
                  className="h-9 w-12 shrink-0 rounded-sm"
                  style={{ background: hex, boxShadow: "inset 0 0 0 1px var(--cizgi)" }}
                />
                <span className="w-[62px] shrink-0 text-sm font-bold lowercase tracking-ui text-gri-900">
                  gri-{no}
                </span>
                <span className="w-[66px] shrink-0 font-sayi text-2xs text-gri-600">{hex}</span>
                <span
                  className="w-[46px] shrink-0 text-right font-sayi text-sm font-bold"
                  style={{ color: Number(oran) >= 4.5 ? "var(--color-acik)" : "var(--color-gri-500)" }}
                >
                  {oran}
                </span>
                <span className="ml-auto pl-[60px] text-right font-metin text-2xs text-gri-600">{kullanim}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-metin text-2xs text-gri-600">
            Aynı metin üç kademede:{" "}
            <b className="font-tabela text-gri-900">gri-900 başlık</b> ·{" "}
            <span className="text-gri-800">gri-800 gövde</span> ·{" "}
            <span className="text-gri-600">gri-600 meta</span> ·{" "}
            <span className="text-gri-400">gri-400 (okunmamalı — dekor)</span>
          </p>
        </Kart>

        {/* ============ 3 · SİYAH ÇAPA VE TEK MAVİ ============ */}
        <Baslik
          no="03"
          ad="Siyah çapa ve tek mavi istisna"
          not="Ekranda genelde TEK dolu siyah eleman olur: gözün tutunduğu nokta. Halka istediğin kadar, dolu iki taneden fazla olamaz. Renklendirme yasağının tek istisnası birincil eylem — mavi 'ne yapabilirim'i, siyah 'neredeyim'i taşıyor. Nane bir UI rengi değil: yalnızca haritada başkasının kaydını gösteren yer imi pininin dolgusu."
        />
        <Kart>
          <div className="flex flex-wrap items-center gap-2.5">
            <button className="bas rounded-full bg-gri-900 px-4 py-2 text-base font-semibold lowercase tracking-ui text-white">
              dolu siyah · aktif
            </button>
            <button
              className="bas rounded-full bg-yuzey px-4 py-2 text-base font-semibold lowercase tracking-ui text-gri-800"
              style={{ boxShadow: "inset 0 0 0 1.5px var(--color-gri-900)" }}
            >
              siyah halka · seçili
            </button>
            <button
              className="bas rounded-full bg-yuzey px-4 py-2 text-base font-semibold lowercase tracking-ui text-gri-800 shadow-kat-1"
              style={{ border: "1px solid var(--cizgi)" }}
            >
              pasif pill
            </button>
            <button className="bas grid size-11 place-items-center rounded-full bg-mavi text-white shadow-kat-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 4h12v16l-6-4-6 4z" />
              </svg>
            </button>
            <span className="font-metin text-2xs text-gri-600">
              mavi: <code className="font-sayi">--color-mavi</code> · beyazla 5.14:1
            </span>
            {/* Renk ve etiketi tek parça: ayrı sarılırsa renk bir satırda,
                adı öbüründe kalıyor. */}
            <span className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="block size-6 shrink-0 rounded-full bg-nane"
                style={{ boxShadow: "0 0 0 2.5px #fff, var(--shadow-kat-2)" }}
              />
              <span className="font-metin text-2xs text-gri-600">
                nane: <code className="font-sayi">--color-nane</code> · beyazla 4.96:1 · yalnızca
                yer imi pini
              </span>
            </span>
          </div>
        </Kart>

        {/* ============ 4 · ROZETLER ============ */}
        <Baslik
          no="04"
          ad="Pastel rozetler"
          not="Katman 3: doygunluk ALANLA ters orantılı. Bu renkler yalnızca küçük rozet, etiket ve çıkartmada yaşar — asla buton, kart ya da geniş yüzey. Üç temel ton artı dokuz kategori tonu; her çift AA geçiyor."
        />
        <Kart>
          <Etiket>temel tonlar</Etiket>
          <div className="flex flex-wrap gap-2">
            {[
              ["pembe", "6.64"],
              ["lila", "7.69"],
              ["nane", "5.40"],
            ].map(([ton, oran]) => (
              <span
                key={ton}
                className="rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-etiket"
                style={{
                  background: `var(--color-rozet-${ton})`,
                  color: `var(--color-rozet-${ton}-ink)`,
                }}
              >
                {ton} · {oran}:1
              </span>
            ))}
          </div>

          <div className="mt-5" />
          <Etiket>kategori tonları — kategorinin arayüzdeki tek renkli hâli</Etiket>
          <div className="flex flex-wrap gap-2">
            {KATEGORILER.map(([ad, emoji, tr, oran]) => (
              <span
                key={ad}
                className="rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-etiket"
                style={{
                  background: `var(--color-rozet-${ad})`,
                  color: `var(--color-rozet-${ad}-ink)`,
                }}
              >
                <span aria-hidden>{emoji}</span> {tr} · {oran}:1
              </span>
            ))}
          </div>

          <div className="mt-5" />
          <Etiket>doygun uç — arayüzde KULLANMA</Etiket>
          <div className="flex flex-wrap gap-2">
            {["yemek", "kahve", "bar", "tatli", "kultur", "park"].map((ad) => (
              <span key={ad} className="flex items-center gap-1.5">
                <span
                  className="h-6 w-9 rounded-xs"
                  style={{ background: `var(--color-${ad})` }}
                />
                <span className="font-sayi text-2xs text-gri-600">{ad}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 max-w-[62ch] font-metin text-2xs text-gri-700">
            Tek meşru yeri fotoğrafı olmayan geniş yüzeyler: kayıt akışındaki
            kişiselleştirme ızgarası ve jetonun yedek marker&apos;ı. Çipte,
            kartta, butonda görürsen bu bir hatadır. Arayüzün varsayılanı ikisi de
            değil — kategoriyi <b>emoji</b> taşıyor.
          </p>

          <div className="mt-5" />
          <Etiket>durum — yalnızca METİN rengi, dolu zemin değil</Etiket>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold lowercase tracking-ui">
            <span className="text-acik">şu an açık</span>
            <span className="text-kapali">kapalı</span>
            <span className="text-mercan">uyarı metni</span>
            <span className="text-jeton">jeton / pirinç</span>
          </div>
        </Kart>

        {/* ============ 5 · GÖLGE ============ */}
        <Baslik
          no="05"
          ad="Gölge kademeleri"
          not="Derinliğin TEK kaynağı. Ayraç çizgisi ve kalın kenarlık yok. Skill üç kademe istiyor; kat-1/2/3 onların birebir karşılığı, kat-4/5 mevcut çekmece ve modal için kat-3'ün uzantısı. İki komşu kademe birbirinden ayırt edilemiyorsa fazladan kademe var demektir."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {GOLGELER.map(([ad, is]) => (
            <div
              key={ad}
              className="rounded-lg bg-yuzey p-3"
              style={{ boxShadow: `var(--shadow-${ad})` }}
            >
              <div className="text-sm font-bold lowercase tracking-ui text-gri-900">{ad}</div>
              <div className="mt-1 font-metin text-2xs text-gri-600">{is}</div>
            </div>
          ))}
        </div>

        {/* ============ 6 · ŞEKİL ============ */}
        <Baslik
          no="06"
          ad="Şekil dili"
          not="Üç şekil: pill (yatay, metin içeren her şey), squircle (avatar, küçük resim, ikon butonu, kart), daire (yalnızca harita işareti ve satır içi avatar). Profil avatarı squircle, harita işareti daire — tutarsızlık değil, bilinçli ayrım: squircle kimlik, daire haritadaki nokta."
        />
        <Kart>
          <div className="serit flex gap-3 pb-1" style={{ ["--serit-solma" as string]: "1.5rem" }}>
            {YARICAPLAR.map(([ad, px, is]) => (
              <div key={ad} className="w-[116px] shrink-0">
                <div
                  className="grid h-[72px] place-items-center bg-gri-100"
                  style={{ borderRadius: `var(--radius-${ad})` }}
                >
                  <span className="font-sayi text-2xs text-gri-600">{px}</span>
                </div>
                <div className="mt-1.5 text-2xs font-bold lowercase tracking-ui text-gri-900">
                  rounded-{ad}
                </div>
                <div className="font-metin text-2xs text-gri-600">{is}</div>
              </div>
            ))}
            <div className="w-[116px] shrink-0">
              <div className="grid h-[72px] place-items-center rounded-full bg-gri-100">
                <span className="font-sayi text-2xs text-gri-600">pill</span>
              </div>
              <div className="mt-1.5 text-2xs font-bold lowercase tracking-ui text-gri-900">
                rounded-full
              </div>
              <div className="font-metin text-2xs text-gri-600">geniş kutu → pill</div>
            </div>
            <div className="w-[116px] shrink-0">
              <div className="flex h-[72px] items-center justify-center">
                <span className="grid size-[60px] place-items-center rounded-full bg-gri-100">
                  <span className="font-sayi text-2xs text-gri-600">daire</span>
                </span>
              </div>
              <div className="mt-1.5 text-2xs font-bold lowercase tracking-ui text-gri-900">
                rounded-full
              </div>
              <div className="font-metin text-2xs text-gri-600">kare kutu → daire</div>
            </div>
          </div>
          <p className="mt-3 font-metin text-2xs text-gri-600">
            Yukarıdaki şerit <code className="font-sayi">.serit</code> sınıfını
            kullanıyor: sağ kenardaki solma, kaydırılabildiğine dair tek işaret.
          </p>
        </Kart>

        {/* ============ 7 · TİPOGRAFİ ============ */}
        <Baslik
          no="07"
          ad="İki kademeli tipografi"
          not="Bu dilin en ayırt edici özelliği: iki ayrı ses tonu aynı anda çalışır. İçeriğin sahibi olan isimler BAĞIRIR (Kademe A), arayüzün kendisi fısıldar (Kademe B). Karıştırma — her şey küçük harf olursa otorite gider, her şey düzgün büyük harf olursa samimiyet gider."
        />
        <Kart>
          <Etiket>kademe A · özel isim — büyük, 800, negatif aralık</Etiket>
          <div className="text-2xl font-extrabold uppercase tracking-siki text-gri-900">
            🥐 Fazıl Bey&apos;in Türk Kahvesi
          </div>
          <div className="mt-1 font-metin text-2xs text-gri-600">
            text-2xl · font-extrabold · tracking-siki (−0.03em) · uppercase — vitrine
            konan isim
          </div>

          <div className="mt-4 text-3xl font-extrabold tracking-isim text-gri-900">
            Boğaçhan Toprak
          </div>
          <div className="mt-1 font-metin text-2xs text-gri-600">
            text-3xl · tracking-isim (−0.035em) · uppercase DEĞİL — kişi adı asla
            büyük harf olmaz, insanın adı vitrin değil kimlik
          </div>

          <div className="mt-8" />

          <Etiket>kademe B · arayüz — küçük harf, 600</Etiket>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-base font-semibold lowercase tracking-ui text-gri-800">
            <span>tüm mekanlar</span>
            <span>gitmek istiyorum</span>
            <span>paylaş</span>
            <span>yol tarifi</span>
            <span>kulağa iyi geliyor.</span>
          </div>
          <div className="mt-1 font-metin text-2xs text-gri-600">
            text-base · font-semibold · tracking-ui (−0.01em) · lowercase. Buton
            etiketi jenerik fiil değil, ekrandaki cümleye verilen samimi cevap.
          </div>

          <div className="mt-8" />

          <Etiket>kademe C · bölüm etiketi — büyük ama küçük punto, ferah</Etiket>
          <div className="flex flex-wrap gap-5">
            <span className="text-xs font-bold uppercase tracking-etiket text-gri-900">
              KAYDEDENLER
            </span>
            <span className="text-xs font-bold uppercase tracking-genis text-gri-900">
              SON MEKANLAR
            </span>
          </div>
          <div className="mt-1 font-metin text-2xs text-gri-600">
            tracking-etiket (+0.06em) ve tracking-genis (+0.09em) — Kademe A&apos;nın
            tam tersi ayarı
          </div>

          <div className="mt-8" />

          <Etiket>gövde · meta · sayı — üç yazı tipi ayrı iş yapıyor</Etiket>
          <p className="max-w-[62ch] font-metin text-base text-gri-800">
            Karla İNSANIN yazdığı metinde kalıyor: pin notları, yorumlar, bio.
            Böylece &quot;uygulama mı yazdı, insan mı&quot; ayrımı yalnızca italikle
            değil yazı tipiyle de kuruluyor.
          </p>
          <p className="mt-2 max-w-[62ch] font-tabela text-sm text-gri-600">
            Plus Jakarta Sans arayüzün sesi — Kademe A, B ve C hep bu. Ağır, sıkı,
            geometrik bir grotesk; Inter&apos;den buraya geçildi çünkü nötr bir
            grotesk 800&apos;de bile düz kalıyordu.
          </p>
          <p className="mt-2 font-sayi text-sm text-gri-700">
            JetBrains Mono 0123456789 · 1.052 mekan · 48 pin
          </p>

          <div className="mt-8" />

          <Etiket>punto rampası</Etiket>
          <div className="flex flex-col gap-1">
            {[
              ["2xs", "10px"],
              ["xs", "11.5px"],
              ["sm", "13px"],
              ["base", "15px"],
              ["lg", "17px"],
              ["xl", "20px"],
              ["2xl", "26px"],
              ["3xl", "30px"],
            ].map(([ad, px]) => (
              <div key={ad} className="flex items-baseline gap-3">
                <span className="w-[58px] shrink-0 font-sayi text-2xs text-gri-500">
                  {ad}
                </span>
                <span className="w-[56px] shrink-0 font-sayi text-2xs text-gri-500">
                  {px}
                </span>
                <span
                  className="font-semibold tracking-ui text-gri-900"
                  style={{ fontSize: `var(--text-${ad})` }}
                >
                  Kadıköy
                </span>
              </div>
            ))}
          </div>
        </Kart>

        {/* ============ 8 · FOTOĞRAF ÖRTÜSÜ VE CAM ============ */}
        <Baslik
          no="08"
          ad="Fotoğraf örtüsü ve cam"
          not="Beyaz kart kuralının tek istisnası zemininde fotoğraf olan kartlar. Üzerine beyaz metin binecekse koyu degrade örtü ZORUNLU — okunurluk tercih değil. Cam ise form ve kayıt akışına ait: arkada uygulamanın kendi içeriği bulanık durur, hem derinlik verir hem girdiye odaklar."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className="ortulu relative flex h-[168px] flex-col justify-end overflow-hidden rounded-lg p-4 shadow-kat-1"
            style={{
              background:
                "linear-gradient(150deg, var(--color-kultur), #12594B)",
            }}
          >
            <span className="relative z-[1] text-xl font-extrabold uppercase tracking-siki text-white">
              Moda Sahili
            </span>
            <span className="relative z-[1] mt-0.5 text-2xs font-semibold lowercase tracking-ui text-white/80">
              .ortulu — örtü olmadan bu yazı okunmazdı
            </span>
          </div>

          <div className="relative h-[168px] overflow-hidden rounded-lg shadow-kat-1">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(150deg, var(--color-bar), var(--color-tatli) 50%, var(--color-kahve))",
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-2xl font-extrabold uppercase tracking-siki text-white/90">
                arka plan
              </span>
            </div>
            {camAcik && (
              <div className="cam yuksel absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <div className="text-xl font-extrabold tracking-isim text-gri-900">
                    Haritanı kişiselleştir
                  </div>
                  <div className="mt-1 font-metin text-2xs text-gri-700">
                    .cam · blur 36px · perde %82
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setCamAcik((v) => !v)}
              className="bas absolute bottom-3 right-3 z-[2] rounded-full bg-gri-900 px-3 py-1.5 text-2xs font-semibold lowercase tracking-ui text-white shadow-kat-2"
            >
              {camAcik ? "camı kaldır" : "camı koy"}
            </button>
          </div>
        </div>

        {/* ============ 9 · HAREKET ============ */}
        <Baslik
          no="09"
          ad="Hareket — ekran görüntüsünde görünmeyen yarı"
          not="Tokenları birebir kopyalayıp hareketi atlarsan sonuç doğru GÖRÜNÜR ama ölü HİSSEDER. Üç eğri yeter; satır içi cubic-bezier yazma. Hareket azaltma tercihinde hepsi kapanır — süreyi kısaltmak değil, hiç oynatmamak."
        />
        <Kart>
          <Etiket>eğriler</Etiket>
          <div className="flex flex-col gap-1 font-sayi text-2xs text-gri-700">
            <div><b className="font-tabela text-gri-900">yayli</b> · cubic-bezier(.22, 1.18, .36, 1) — varış, uzun yol</div>
            <div><b className="font-tabela text-gri-900">yumusak</b> · cubic-bezier(.22, .61, .36, 1) — kısa mesafe, aşma yok</div>
            <div><b className="font-tabela text-gri-900">cikis</b> · cubic-bezier(.32, 0, .67, 0) — kapanan katman</div>
          </div>

          <div className="mt-8" />

          <Etiket>dört kalıp</Etiket>
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <button className="bas grid size-[72px] place-items-center rounded-md bg-yuzey shadow-kat-2">
                <span className="text-2xs font-semibold lowercase tracking-ui text-gri-800">
                  bas
                </span>
              </button>
              <div className="mt-1.5 max-w-[104px] font-metin text-2xs text-gri-600">
                basılı tut — scale(.955)
              </div>
            </div>

            <div>
              <div className="relative size-[72px] overflow-hidden rounded-md bg-gri-100">
                <div
                  key={`y${tur}`}
                  className="yuksel absolute inset-x-1 bottom-1 top-4 rounded-sm bg-yuzey shadow-kat-2"
                />
              </div>
              <div className="mt-1.5 max-w-[104px] font-metin text-2xs text-gri-600">
                yuksel — katman yükselişi
              </div>
            </div>

            <div>
              <div className="grid size-[72px] place-items-center">
                <span
                  key={`c${tur}`}
                  className="yapistir grid size-[62px] -rotate-[9deg] place-items-center text-center text-2xs font-extrabold uppercase tracking-etiket"
                  style={{
                    background: "var(--color-rozet-pembe)",
                    color: "var(--color-rozet-pembe-ink)",
                    clipPath:
                      "polygon(50% 0%,58% 12%,69% 5%,72% 18%,85% 16%,82% 29%,95% 32%,87% 42%,98% 50%,87% 58%,95% 68%,82% 71%,85% 84%,72% 82%,69% 95%,58% 88%,50% 100%,42% 88%,31% 95%,28% 82%,15% 84%,18% 71%,5% 68%,13% 58%,2% 50%,13% 42%,5% 32%,18% 29%,15% 16%,28% 18%,31% 5%,42% 12%)",
                    filter: "drop-shadow(0 2px 6px rgba(16,16,20,.22))",
                  }}
                >
                  POPÜLER
                </span>
              </div>
              <div className="mt-1.5 max-w-[104px] font-metin text-2xs text-gri-600">
                yapistir — ekran başına BİR tane
              </div>
            </div>

            <div>
              <button
                onClick={() => setKayitli((v) => !v)}
                className="bas grid size-[72px] place-items-center rounded-full bg-yuzey shadow-kat-2"
                aria-pressed={kayitli}
              >
                <span
                  key={`z${kayitli}`}
                  className={kayitli ? "zipla" : ""}
                  style={{ color: kayitli ? "var(--color-mavi)" : "var(--color-gri-500)" }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill={kayitli ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                    <path d="M6 4h12v16l-6-4-6 4z" />
                  </svg>
                </span>
              </button>
              <div className="mt-1.5 max-w-[104px] font-metin text-2xs text-gri-600">
                zipla — YALNIZCA ikon zıplar, kap değil
              </div>
            </div>
          </div>

          <button
            onClick={() => setTur((t) => t + 1)}
            className="bas mt-5 rounded-full bg-gri-900 px-4 py-2 text-sm font-semibold lowercase tracking-ui text-white"
          >
            tekrar oynat
          </button>
          <p className="mt-3 max-w-[62ch] font-metin text-2xs text-gri-600">
            Hareketi kapalı tutan bir sistemde bu kutuların hepsi hareketsiz
            görünmeli — animasyonun kısalması değil, hiç oynamaması doğru
            davranış. Doğrulamak için işletim sisteminde &quot;hareketi azalt&quot;ı aç.
          </p>
        </Kart>

        {/* ============ 10 · BOŞLUK ============ */}
        <Baslik
          no="10"
          ad="Boşluk"
          not="Burada token yok ve bu bilinçli: Tailwind'in kendi --spacing'i (0.25rem) skill'in istediği 4/8/12/16/24/32/48 merdivenini birebir veriyor. Px'e sabitlemek rem'in kullanıcı yazı boyutuyla ölçeklenme davranışını öldürürdü. Varsayılan kenar boşluğu px-4."
        />
        <Kart>
          <div className="flex flex-wrap items-end gap-3">
            {[
              ["1", 4],
              ["2", 8],
              ["3", 12],
              ["4", 16],
              ["6", 24],
              ["8", 32],
              ["12", 48],
            ].map(([ad, px]) => (
              <div key={ad} className="text-center">
                <div
                  className="bg-gri-200"
                  style={{ width: `${px}px`, height: `${px}px`, borderRadius: 2 }}
                />
                <div className="mt-1 font-sayi text-2xs text-gri-600">{ad}</div>
                <div className="font-sayi text-2xs text-gri-400">{px}</div>
              </div>
            ))}
          </div>
        </Kart>

        <p className="mt-12 max-w-[62ch] font-metin text-2xs text-gri-600">
          Sonraki faz primitifler: kart, pill, çıkartma, istatistik karosu, yüzen
          chrome butonu. Onlar <code className="font-sayi">components/corner/</code>{" "}
          altına yazılacak ve yalnızca buradaki tokenları kullanacak.
        </p>
      </div>
    </main>
  );
}
