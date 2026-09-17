/**
 * /tasarim — bütün önizlemelerin index'i.
 *
 * Ürün değil ALET. Corner dilindeki kütüphanenin tek kapısı: tokenlar,
 * primitifler ve ekran bileşenleri, her biri önizlemesindeki bölümüne
 * bağlantıyla.
 *
 * Her ekran bileşeninin yanında MONTAJ DURUMU var — bir sonraki fazın
 * (gerçek ekranlara yerleştirme) başlangıç listesi. Kaynak `NOT.md`'deki
 * kararlar ve şema taraması (2026-09-17); veri katmanı değiştikçe buradaki
 * etiket de değişmeli, bileşen kodu değil.
 *
 * Etkileşim yok, o yüzden sunucu bileşeni ("use client" yok).
 */

import Link from "next/link";

import Rozet, { type RozetTon } from "@/components/corner/primitives/Rozet";
import { Baslik } from "@/app/tasarim/_vitrin/Iskelet";

type Durum = "hazir" | "kismen" | "bekliyor";

/* Kasa elde yazılı: Rozet CSS uppercase kullanıyor; Türkçe "İ" davranışı
   lang'a bağlı, iOS Safari doğrulanmadı (DENETIM-faz3 T19). Ton bir övünme değil bir durum: bekleyen bej
   (hata değil), kısmen kahve, hazır nane. */
const DURUM: Record<Durum, { etiket: string; ton: RozetTon }> = {
  hazir: { etiket: "MONTAJA HAZIR", ton: "nane" },
  kismen: { etiket: "KISMEN", ton: "kahve" },
  bekliyor: { etiket: "VERİ BEKLİYOR", ton: "diger" },
};

interface Bilesen {
  kod: string;
  ad: string;
  tanim: string;
  href: string;
  durum: Durum;
  /** durum "hazır" değilse neyin eksik olduğu; hazırsa varsa not. */
  not?: string;
}

const EKRANLAR: { ad: string; not: string; bilesenler: Bilesen[] }[] = [
  {
    ad: "Harita",
    not: "Haritanın üstündeki işaretler ve yüzen hap.",
    bilesenler: [
      {
        kod: "B4",
        ad: "YerImiPini",
        tanim: "Başkasının kaydettiği mekan — nane yer imi pini.",
        href: "/tasarim/harita-eksikleri#YerImiPini",
        durum: "bekliyor",
        not: "başkalarının kayıtları RLS gereği okunamıyor; arkadaş modu RPC'si",
      },
      {
        kod: "B5",
        ad: "ArkadasMarkeri",
        tanim: "Arkadaş modunda kişi + “@ad eylem” etiketi.",
        href: "/tasarim/harita-eksikleri#ArkadasMarkeri",
        durum: "bekliyor",
        not: "arkadaş modu RPC'si",
      },
      {
        kod: "B6",
        ad: "SemtCipi",
        tanim: "Semt adı + o semtteki pin sayısı.",
        href: "/tasarim/harita-eksikleri#SemtCipi",
        durum: "kismen",
        not: "places.neighborhood ve pin_count var, semt başına toplam sorgusu yok",
      },
      {
        kod: "B7",
        ad: "BuradaAra",
        tanim: "Harita durunca beliren “burada ara” hapı.",
        href: "/tasarim/harita-eksikleri#BuradaAra",
        durum: "hazir",
      },
    ],
  },
  {
    ad: "Mekan detayı",
    not: "Mekan sayfasının başlık bloğu ve editoryal kısmı.",
    bilesenler: [
      {
        kod: "D2",
        ad: "KayitRozeti",
        tanim: "“946 KAYIT” rozeti; sıfırda çizilmiyor.",
        href: "/tasarim/mekan-eksikleri#KayitRozeti",
        durum: "hazir",
        not: "places.save_count",
      },
      {
        kod: "D5",
        ad: "GidecegimGittim",
        tanim: "Gideceğim / gittim — iki daire, üç durum.",
        href: "/tasarim/mekan-eksikleri#GidecegimGittim",
        durum: "bekliyor",
        not: "saves'te gideceğim / gittim ayrımı yok",
      },
      {
        kod: "D10",
        ad: "MekanNotu",
        tanim: "“havası”, “ne söylesen” gibi editoryal blok.",
        href: "/tasarim/mekan-eksikleri#MekanNotu",
        durum: "kismen",
        not: "“ne zaman git” için place_facts.best_time var; havası / ne söylesen metni için alan yok",
      },
    ],
  },
  {
    ad: "Değerlendirme",
    not: "Pin puanının ve geri dönüş cevabının görünümü.",
    bilesenler: [
      {
        kod: "E1",
        ad: "DereceGostergesi",
        tanim: "1–10 puanın dört kademeli okunuşu.",
        href: "/tasarim/degerlendirme#DereceGostergesi",
        durum: "hazir",
        not: "pins.rating, place_summary rating_avg",
      },
      {
        kod: "E2",
        ad: "YineGiderMisin",
        tanim: "Yine gider miydin? — evet / belki / hayır + favorim rozeti.",
        href: "/tasarim/degerlendirme#YineGiderMisin",
        durum: "hazir",
        not: "pins.would_return; favorim puandan",
      },
    ],
  },
  {
    ad: "Kaydetme",
    not: "Mekanı bir listeye ekleme akışı.",
    bilesenler: [
      {
        kod: "E5",
        ad: "ListeSecimKarti",
        tanim: "Liste seçim kartı ve ListeSecici — satır ya da karo şeridi, not girdisi.",
        href: "/tasarim/kaydetme-eksikleri#ListeSecimKarti",
        durum: "hazir",
        not: "kilit rozeti için lists.is_public modele taşınmalı",
      },
      {
        kod: "E6",
        ad: "ListeAcKarosu",
        tanim: "Seçiciden çıkmadan yeni liste karosu.",
        href: "/tasarim/kaydetme-eksikleri#ListeAcKarosu",
        durum: "hazir",
      },
    ],
  },
  {
    ad: "Profil ve liste",
    not: "Profil başlığı ve liste detayı.",
    bilesenler: [
      {
        kod: "F2",
        ad: "OrtakListeHapi",
        tanim: "Degrade kenarlıklı “birlikte dolduralım” hapı.",
        href: "/tasarim/profil-eksikleri#OrtakListeHapi",
        durum: "bekliyor",
        not: "ortak liste veri modeli (yol haritasında)",
      },
      {
        kod: "H2",
        ad: "SeriRozeti",
        tanim: "Haftalık seri sayacı; çift rozet satırıyla.",
        href: "/tasarim/profil-eksikleri#SeriRozeti",
        durum: "bekliyor",
        not: "seri hesabı (en az bir pin, pazartesi, İstanbul saati)",
      },
    ],
  },
];

const PRIMITIFLER: { ad: string; tanim: string }[] = [
  { ad: "Pill", tanim: "hap ve iki bölmeli hap" },
  { ad: "Cip", tanim: "yatay, dikey ve etiket çipi" },
  { ad: "Kart", tanim: "beyaz, boş, fotoğraflı kabuk" },
  { ad: "Avatar", tanim: "squircle kimlik, daire nokta" },
  { ad: "Rozet", tanim: "etiket, nokta, sayaç, çıkartma" },
  { ad: "Panel", tanim: "duraklı alt panel" },
];

/* Bağlantılı beyaz satır. Basma tepkisi `bas`; gölge kademe 1, çünkü duran
   içerik (skill §5). */
const SATIR = "bas block rounded-lg bg-yuzey no-underline shadow-kat-1";

export default function TasarimIndexSayfasi() {
  const hepsi = EKRANLAR.flatMap((e) => e.bilesenler);
  const say = (d: Durum) => hepsi.filter((b) => b.durum === d).length;

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 3
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">Tasarım</h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Corner dilindeki bileşen kütüphanesinin önizlemeleri. Hiçbiri henüz gerçek ekranlara
          bağlı değil; yanlarındaki durum, montaja geçince neyin hazır olduğunu söylüyor.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-2xs lowercase tracking-ui text-gri-600">
          <span className="font-sayi">{hepsi.length}</span> ekran bileşeni ·
          <Rozet ton={DURUM.hazir.ton} sekil="hap">{`${say("hazir")} ${DURUM.hazir.etiket}`}</Rozet>
          <Rozet ton={DURUM.kismen.ton} sekil="hap">{`${say("kismen")} ${DURUM.kismen.etiket}`}</Rozet>
          <Rozet ton={DURUM.bekliyor.ton} sekil="hap">{`${say("bekliyor")} ${DURUM.bekliyor.etiket}`}</Rozet>
        </p>

        {/* ============ 1 · temel ============ */}
        <Baslik
          no="01"
          ad="Temel"
          kod="faz 1 · faz 1.5"
          not="Her şeyin bağlı olduğu iki katman: globals.css'teki tokenlar ve onların üstüne kurulan altı primitif. Ekran bileşenleri kendi hapını, kartını, çipini yazmaz; buradan alır."
        />
        <div className="grid gap-2.5 md:grid-cols-2">
          <Link href="/tasarim/tokenlar" className={`${SATIR} p-4`}>
            <span className="block text-base font-extrabold tracking-siki text-gri-900">Tokenlar</span>
            <span className="mt-1 block font-metin text-sm text-gri-700">
              Zemin, nötr rampa, pastel rozetler, gölge kademeleri, şekil, tipografi, hareket, boşluk.
            </span>
          </Link>
          <Link href="/tasarim/primitifler" className={`${SATIR} p-4`}>
            <span className="block text-base font-extrabold tracking-siki text-gri-900">Primitifler</span>
            <span className="mt-1 block font-metin text-sm text-gri-700">
              Pill, Cip, Kart, Avatar, Rozet, Panel — varyantlarıyla.
            </span>
          </Link>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRIMITIFLER.map((p) => (
            <Link key={p.ad} href={`/tasarim/primitifler#${p.ad}`} className={`${SATIR} px-3 py-2.5`}>
              <span className="block font-sayi text-xs font-bold text-gri-900">{p.ad}</span>
              <span className="mt-0.5 block text-2xs lowercase tracking-ui text-gri-600">{p.tanim}</span>
            </Link>
          ))}
        </div>

        {/* ============ 2 · ekran bileşenleri ============ */}
        <Baslik
          no="02"
          ad="Ekran bileşenleri"
          kod="faz 2"
          not="Mevcut ekranlarda karşılığı olmayan on üç bileşen, ait oldukları ekrana göre. Envanter kodu Corner envanterindeki yer; dosya adı Türkçe."
        />
        <div className="flex flex-col gap-8">
          {EKRANLAR.map((ekran) => (
            <section key={ekran.ad}>
              <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2">
                <h3 className="m-0 text-base font-extrabold uppercase tracking-siki text-gri-900">{ekran.ad}</h3>
                <span className="text-2xs lowercase tracking-ui text-gri-500">{ekran.not}</span>
              </div>
              {/* Ayraç yok, aralık var (skill §14): her bileşen ayrı bir
                  hedef, tek listenin parçası değil. */}
              <div className="grid gap-2 md:grid-cols-2">
                {ekran.bilesenler.map((b) => (
                  <Link key={b.ad} href={b.href} className={`${SATIR} p-3.5`}>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="font-sayi text-2xs text-gri-500">{b.kod}</span>
                        <span className="truncate font-sayi text-sm font-bold text-gri-900">{b.ad}</span>
                      </span>
                      <Rozet ton={DURUM[b.durum].ton} sekil="hap">
                        {DURUM[b.durum].etiket}
                      </Rozet>
                    </span>
                    <span className="mt-1.5 block font-metin text-sm text-gri-800">{b.tanim}</span>
                    {b.not && (
                      /* Küçük harf sınıfı YOK: notlarda "İstanbul", "RLS", tablo adları
                           var; özel adın ve tanımlayıcının kasası korunmalı. */
                      <span className="mt-1 block text-2xs tracking-ui text-gri-500">{b.not}</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-8 text-2xs tracking-ui text-gri-500">
          Durumların kaynağı NOT.md kararları ve şema taraması · sonraya kalan işler NOT.md’nin sonunda ·
          denetim kaydı DENETIM-faz3.md
        </p>
      </div>
    </main>
  );
}
