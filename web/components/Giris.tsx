"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOturum } from "@/lib/oturum";
import { RENK, emoji } from "@/lib/paleti";
import YasalMetin from "./YasalMetin";

type Mod = "giris" | "kayit";
/* "nereden" ve "turler" metin alanı DEĞİL — `deger` kaydında yerleri yok,
   kendi state'lerinde duruyorlar. Yine de adım kimliği olarak bu birlikte
   listede yaşıyorlar ki adım dizisi tek tip kalsın. */
type AlanId = "ad" | "kullaniciAdi" | "eposta" | "sifre" | "nereden" | "turler";
type MetinAlani = "ad" | "kullaniciAdi" | "eposta" | "sifre";
/* Adımın BİÇİMİ — hepsi girdi değil. Referansın kayıt akışında üç ayrı
   biçim var ve sırayla geliyorlar: tek seçimlik liste, metin girdisi,
   çok seçimli fotoğraf ızgarası. */
type Bicim = "girdi" | "secim" | "izgara";

/* Adımlar TEK tip: alanlar biçime göre değişiyor ama birleşim tipi
   kullanılmıyor. Sebep pratik — `su.bicim === "girdi"` kontrolü bir
   birleşimi daraltmıyor (bicim literal değil Bicim olarak çıkarılıyor)
   ve her erişim tip hatası veriyordu. Biçime ait alanlar isteğe bağlı. */
type Adim = {
  id: AlanId;
  soru: string;
  ipucu?: string | null;
  /** gönder düğmesinin etiketi; "secim" biçiminde düğme yok, boş kalır */
  cevap: string;
  bicim: Bicim;
  /* yalnızca "girdi" */
  tip?: string;
  otomatik?: string;
  yerTutucu?: string;
};

/* "nereden geldin?" — referansın `here from…` adımı.
   Seçenekler DOLU SİYAH hap olarak alt alta. İç ekranlarda "ekranda tek
   siyah eleman" kuralı geçerli ama burada değil: kayıt akışında siyah hap
   seçeneğin KENDİSİNİN biçimi, vurgu değil. Referansta da yedi tane yan yana.

   Son seçeneğin emojisi YOK — referansta da "other" çıplak duruyor.
   Küçük bir detay ama listeyi bitiren şey o: emoji dizisi kesiliyor ve
   "gerisi" demenin görsel karşılığı oluyor. */
const NEREDEN = [
  { id: "instagram", ad: "instagram",        e: "📸" },
  { id: "tiktok",    ad: "tiktok",           e: "🎵" },
  { id: "x",         ad: "twitter/x",        e: "🐦" },
  { id: "arkadas",   ad: "bir arkadaş",      e: "👯" },
  { id: "internet",  ad: "internette gördüm", e: "🌐" },
  { id: "sokak",     ad: "sokakta",          e: "👀" },
  { id: "baska",     ad: "başka",            e: "" },
];

/* "haritanı kişiselleştir" — referansın personalize adımı.
   Etiketler kategori ADI değil, İDDİA: referansta da "actually good food",
   "aesthetic cafes" yazıyor, "restaurants" değil. Kategori adı bir veritabanı
   alanı gibi okunuyor; iddia ise insanın kendi diliyle konuşuyor. */
const SEVGI = [
  { id: "kahve",  ad: "iyi kahve" },
  { id: "yemek",  ad: "doğru düzgün yemek" },
  { id: "bar",    ad: "gece bir yerlerde" },
  { id: "tatli",  ad: "tatlı krizi" },
  { id: "kultur", ad: "kültür sanat" },
  { id: "park",   ad: "yeşillik ve deniz" },
  { id: "magaza", ad: "dükkân gezmesi" },
  { id: "otel",   ad: "kalacak yer" },
];

const EN_AZ_TUR = 3;

/**
 * Giriş / kayıt — EKRAN BAŞINA TEK GİRDİ.
 *
 * Skill §8'in temel UX kararı: kayıt tek bir uzun form değil, her adımda
 * yalnızca bir soru. Bilişsel yükü düşürüyor ve her adımı küçük bir kazanç
 * gibi hissettiriyor. Eskiden dört alan alt alta tek ekrandaydı.
 *
 * Girdi kenarlıksız beyaz bir HAP: metin ortalı, punto iri, gölgeli.
 * (Referansın "create your profile" adımı böyle — daha önce alt çizgili
 * yazılmıştı, ekran arşivi aksini gösterdi.)
 *
 * Akış referanstaki sırayı izliyor: karşılama (krom marka adı, gökyüzü,
 * süzülen objeler) → hesap adımları. Karşılama cihaz başına bir kez.
 *
 * Arkada uygulamanın kendi içeriği bulanık duruyor (.cam): hem derinlik
 * veriyor hem girdiye odaklıyor, hem de daha kayıt olmadan "bu uygulama ne
 * hakkında" sorusunu görsel olarak cevaplıyor. Düz renk zemin bu bağlamı
 * harcardı.
 *
 * Buton etiketleri jenerik değil (skill §7): "İleri"/"Devam" yerine
 * ekrandaki cümleye verilen samimi cevap.
 *
 * Profil satırını auth.users trigger'ı açıyor (schema.sql → handle_new_user),
 * burada ayrıca profil oluşturmuyoruz. Kullanıcı adı kayıt sırasında
 * user_metadata'ya yazılıyor, trigger oradan okuyor.
 */
/* Karşılama ekranındaki süzülen objeler. Referansta sushi, kahve, pasta ve
   disko topu ekranın kenarlarından girip çıkıyor; buradakiler uygulamanın
   kendi kategori emojileri — aynı iş, bize ait malzeme.

   Konumların bir kısmı KASITLI olarak kenardan taşıyor (sol: -6, sağ: -4):
   referansta da objeler çerçeveye sığmıyor, yarısı dışarıda. Tam sığan
   objeler "yerleştirilmiş" durur, taşanlar "geçip gidiyor". */
const OBJELER = [
  { e: "☕", ust: "15%", sol: "-6%", boy: 60, gec: "0s",   sure: "7s" },
  { e: "🍸", ust: "26%", sag: "-4%", boy: 52, gec: "1.4s", sure: "8.2s" },
  { e: "🌳", ust: "45%", sag: "-7%", boy: 64, gec: "3.4s", sure: "7.6s" },
  { e: "🥐", ust: "62%", sol: "-3%", boy: 50, gec: "2.6s", sure: "6.4s" },
];

export default function Giris({ onKapat }: { onKapat: () => void }) {
  const { girisYap, kayitOl } = useOturum();
  const [mod, setMod] = useState<Mod>("giris");
  /* Karşılama CİHAZ BAŞINA BİR KEZ. Referansta bu ekran uygulamanın ilk
     açılışıdır; bizde giriş bir katman olduğu için her açılışta gösterilse
     sadece şifresini girmek isteyen birine her seferinde engel olurdu.

     DİKKAT — bu okuma render sırasında oluyor (useState başlatıcısı) ve
     localStorage sunucuda yok. Şu an güvenli, çünkü Giris yalnızca bir
     tıklamadan SONRA mount ediliyor (page.tsx: `girisAcik && <Giris/>`),
     yani sunucuda hiç render edilmiyor. Bu bileşeni koşulsuz render eder
     hâle getirirsen burası hidrasyon uyuşmazlığı üretir — o zaman okumayı
     useEffect'e taşı. */
  const [karsilama, setKarsilama] = useState(() => {
    try { return localStorage.getItem("karsilama-gorundu") !== "1"; }
    catch { return true; }
  });
  const karsilamayiGec = (yeniMod: Mod) => {
    try { localStorage.setItem("karsilama-gorundu", "1"); } catch { /* özel sekme */ }
    setMod(yeniMod);
    setKarsilama(false);
  };
  const [adim, setAdim] = useState(0);
  const [deger, setDeger] = useState<Record<MetinAlani, string>>({
    ad: "", kullaniciAdi: "", eposta: "", sifre: "",
  });
  /* Metin olmayan iki adım kendi state'inde: `deger` Record<AlanId,string>
     ve çok seçimli ızgara oraya sığmıyor. Genelleştirmek yerine ayrı
     tutmak hem tip güvenli hem okunur. */
  const [nereden, setNereden] = useState<string | null>(null);
  const [turler, setTurler] = useState<string[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [yasal, setYasal] = useState<"sartlar" | "gizlilik" | null>(null);
  const girdiRef = useRef<HTMLInputElement>(null);

  /* Adım tanımları. Her biri kendi sorusunu, girdi tipini ve CEVABINI
     (buton etiketi) taşıyor — etiket ekrandaki cümlenin devamı. */
  const adimlar = useMemo<Adim[]>(() => {
    const sifreAdimi = {
      id: "sifre" as AlanId,
      soru: mod === "giris" ? "şifren?" : "bir şifre seç.",
      ipucu: mod === "giris" ? null : "en az 6 karakter.",
      tip: "password",
      otomatik: mod === "giris" ? "current-password" : "new-password",
      yerTutucu: "••••••••",
      cevap: mod === "giris" ? "içeri gir." : "son bir adım.",
      bicim: "girdi" as Bicim,
    };
    const epostaAdimi = {
      id: "eposta" as AlanId, soru: "e-postan ne?", ipucu: null,
      tip: "email", otomatik: "email", yerTutucu: "ornek@eposta.com",
      cevap: "tamamdır.", bicim: "girdi" as Bicim,
    };
    if (mod === "giris") return [epostaAdimi, sifreAdimi];
    /* Sıra referanstan: önce "nereden geldin", sonra profil, en sonda
       kişiselleştirme. Kimlik bilgileri (e-posta/şifre) referansta yok —
       orada telefonla giriliyor — bu yüzden profil ile kişiselleştirmenin
       ARASINA giriyorlar, akışın ritmini bozmayan tek yer orası.

       Kişiselleştirme SONDA olduğu için hesap da orada açılıyor: kullanıcı
       yarıda bırakırsa ortada yarım bir hesap kalmıyor. */
    return [
      { id: "nereden" as AlanId, soru: "buraya nereden geldin?", ipucu: null,
        cevap: "", bicim: "secim" as Bicim },
      { id: "ad" as AlanId, soru: "sana ne diyelim?", ipucu: "haritanda görünecek ad.",
        tip: "text", otomatik: "name", yerTutucu: "Bogaç", cevap: "bu benim.",
        bicim: "girdi" as Bicim },
      { id: "kullaniciAdi" as AlanId, soru: "adresin ne olsun?",
        ipucu: "küçük harf, rakam ve alt çizgi. 3–24 karakter.",
        tip: "text", otomatik: "username", yerTutucu: "bogac", cevap: "iyi görünüyor.",
        bicim: "girdi" as Bicim },
      epostaAdimi,
      sifreAdimi,
      { id: "turler" as AlanId, soru: "haritanı kişiselleştir",
        ipucu: `en az ${EN_AZ_TUR} tane seç.`,
        cevap: "haritamı kur.", bicim: "izgara" as Bicim },
    ];
  }, [mod]);

  const su = adimlar[Math.min(adim, adimlar.length - 1)];
  const sonAdim = adim === adimlar.length - 1;

  /* Her adımda odak girdide: klavye açık gelsin, kullanıcı dokunmak
     zorunda kalmasın. */
  useEffect(() => { girdiRef.current?.focus(); }, [adim, mod]);

  useEffect(() => {
    if (yasal) return;
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, yasal]);

  /* Yalnızca "girdi" biçimli adımlardan çağrılıyor, cast orada güvenli. */
  const yaz = (v: string) => setDeger((d) => ({ ...d, [su.id as MetinAlani]: v }));

  const turDegistir = (id: string) =>
    setTurler((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  /* Doğrulama adımın KENDİSİNDE: hatayı dört alan sonra değil hemen
     görmek gerekiyor. Şemadaki check ^[a-z0-9_]{3,24}$ sunucuya boşuna
     gitmesin. */
  const adimiDogrula = (): string | null => {
    if (su.bicim === "secim") return nereden ? null : "birini seç.";
    if (su.bicim === "izgara")
      return turler.length >= EN_AZ_TUR ? null : `en az ${EN_AZ_TUR} tane seç.`;
    const alan = su.id as MetinAlani;
    const v = deger[alan].trim();
    if (!v) return "burayı boş bırakma.";
    if (alan === "kullaniciAdi" && !/^[a-z0-9_]{3,24}$/.test(v.toLowerCase()))
      return "kullanıcı adı 3–24 karakter olmalı; sadece küçük harf, rakam ve _";
    if (alan === "eposta" && !v.includes("@")) return "bu bir e-posta gibi durmuyor.";
    if (alan === "sifre" && mod === "kayit" && deger.sifre.length < 6)
      return "şifre en az 6 karakter olmalı.";
    return null;
  };

  const ilerle = async (e: React.FormEvent) => {
    e.preventDefault();
    const sorun = adimiDogrula();
    if (sorun) { setHata(sorun); return; }
    setHata(null); setBilgi(null);
    if (!sonAdim) { setAdim((a) => a + 1); return; }

    setGonderiliyor(true);
    try {
      if (mod === "giris") {
        await girisYap(deger.eposta.trim(), deger.sifre);
        onKapat();
      } else {
        const mesaj = await kayitOl(
          deger.eposta.trim(), deger.sifre,
          deger.kullaniciAdi.trim().toLowerCase(), deger.ad.trim(),
          { geldigi_yer: nereden, sevdigi_turler: turler },
        );
        if (mesaj) setBilgi(mesaj);
        else onKapat();
      }
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally {
      setGonderiliyor(false);
    }
  };

  const modDegistir = () => {
    setMod(mod === "giris" ? "kayit" : "giris");
    setAdim(0); setHata(null); setBilgi(null);
  };

  /* Form state'i burada duruyor, DOM'u değiştirmek onu sıfırlamıyor —
     metinden dönünce girilen alanlar yerinde kalıyor. */
  if (yasal) return <YasalMetin tur={yasal} onKapat={() => setYasal(null)} />;

  /* ---- karşılama ----
     Referansın açılış ekranı ve iç ekranlarla aynı kurallarda DEĞİL:
     içeride arayüz sessiz, burada performans yapıyor. Zemin bu yüzden
     kağıt değil GÖKYÜZÜ, marka adı düz yazı değil süzülen krom bir obje.

     Arkada bulanık uygulama yok (.cam kullanılmıyor): burası "bu uygulama
     ne hakkında" sorusunun cevabı değil, "bu uygulama ne hissettiriyor"
     sorusunun cevabı. Bağlam bir sonraki adımda geliyor. */
  if (karsilama) {
    return (
      <div
        role="dialog" aria-modal="true" aria-label="Kadıköy Harita’ya hoş geldin"
        className="yuksel absolute inset-0 z-40 flex flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(178deg,#6FA8DC 0%,#9AC5E8 34%,#C5DCF0 62%,#E8F1F8 84%,#F6FAFD 100%)",
        }}
      >
        {/* Süzülen objeler — dekor değil, referanstaki kolaj katmanının
            karşılığı. aria-hidden: ekran okuyucuya "☕🍸🥐" dizisi okumanın
            hiçbir faydası yok. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {OBJELER.map((o) => (
            <span
              key={o.e}
              className="suzul-obje absolute block leading-none"
              style={{
                top: o.ust, left: o.sol, right: o.sag,
                fontSize: o.boy,
                animationDelay: o.gec,
                animationDuration: o.sure,
                filter: "drop-shadow(0 8px 16px rgba(20,45,75,.3))",
              }}
            >
              {o.e}
            </span>
          ))}
        </div>

        <button
          onClick={onKapat} aria-label="Kapat"
          className="bas absolute right-4 top-4 z-[2] grid size-9 place-items-center rounded-md border-none bg-white/75 text-base leading-none text-gri-800 shadow-kat-2 backdrop-blur-sm"
        >
          ✕
        </button>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center px-6">
          {/* Marka adı: BÜYÜK, çok kalın, sıkı — ve krom.
              leading/padding .krom sınıfında, orada sebebiyle birlikte:
              degrade metnin arka plan kutusuna çiziliyor, kutu dar kalırsa
              Ö'nün noktaları boyasız kalıp kayboluyor. */}
          <h1
            className="krom suzul m-0 text-center text-[clamp(52px,17vw,74px)] font-extrabold uppercase tracking-[-.05em]"
          >
            Kadıköy
          </h1>
        </div>

        {/* Micro-copy ritmi: kısa soru → hemen altında marka sesiyle cevap.
            Buton etiketi jenerik bir fiil değil, sorunun cevabı. */}
        <div className="relative z-[1] shrink-0 px-6 pb-8">
          <p className="mb-3.5 text-center text-base lowercase text-[rgba(20,45,75,.62)]">
            kulağa iyi geliyor mu?
          </p>
          <button
            onClick={() => karsilamayiGec("kayit")}
            className="bas w-full rounded-full border-none bg-gri-900 px-4 py-4 text-base font-semibold lowercase tracking-ui text-white shadow-kat-3"
          >
            kulağa iyi geliyor.
          </button>
          <button
            onClick={() => karsilamayiGec("giris")}
            className="mt-3 w-full border-none bg-transparent py-1 text-sm lowercase text-[rgba(20,45,75,.66)] underline"
          >
            zaten hesabım var
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog" aria-modal="true"
      aria-label={mod === "giris" ? "Giriş yap" : "Kayıt ol"}
      /* .cam: arkadaki harita/akış bulanıklaşıyor. Skill §8 — bağlam
         ücretsiz bir tanıtım fırsatı, düz renkle harcama. */
      className="yuksel cam absolute inset-0 z-40 flex flex-col"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-4">
        {adim > 0 ? (
          <button
            onClick={() => { setAdim((a) => a - 1); setHata(null); }}
            aria-label="Önceki adım"
            className="grid size-9 place-items-center rounded-md border-none bg-yuzey text-lg leading-none text-gri-800 shadow-kat-2"
          >
            ‹
          </button>
        ) : (
          <span className="size-9" />
        )}

        {/* Adım göstergesi: kaç soru kaldığını bilmek kayıttan vazgeçmeyi
            azaltıyor. Nokta, çubuk değil — chrome sessiz kalsın.

            KENDİ BEYAZ HAPININ İÇİNDE: arkada bulanık da olsa uygulamanın
            kendi arayüzü duruyor ve çıplak noktalar oradaki arama çubuğunun
            üstüne denk gelince kayboluyordu. Referansta da ilerleme
            göstergesi yüzen beyaz bir kartın içinde duruyor. */}
        <span
          className="flex items-center gap-1.5 rounded-full bg-yuzey px-2.5 py-2 shadow-kat-2"
          aria-label={`Adım ${adim + 1} / ${adimlar.length}`}
        >
          {adimlar.map((a, i) => (
            <span
              key={a.id}
              className={`h-1.5 rounded-full transition-all ${
                i === adim ? "w-5 bg-gri-900" : i < adim ? "w-1.5 bg-gri-500" : "w-1.5 bg-gri-300"
              }`}
            />
          ))}
        </span>

        <button
          onClick={onKapat} aria-label="Kapat"
          className="grid size-9 place-items-center rounded-md border-none bg-yuzey text-base leading-none text-gri-800 shadow-kat-2"
        >
          ✕
        </button>
      </div>

      {/* Izgara adımı KAYDIRILIYOR, ortalanmıyor: sekiz kart telefon
          yüksekliğine sığmıyor ve justify-center kaydırma kutusunda
          içeriği yukarıdan kırpıyor. Diğer iki biçim tek soruluk, onlar
          dikey ortada duruyor. */}
      <form
        onSubmit={ilerle}
        className={`flex min-h-0 flex-1 flex-col px-6 pb-8 ${
          su.bicim === "izgara" ? "pt-2" : "justify-center"
        }`}
      >
        {/* Kademe A: soru bağırır. */}
        <h2 className="text-center text-3xl font-extrabold lowercase leading-tight tracking-isim text-gri-900">
          {su.soru}
        </h2>

        {/* Izgara ve seçimde ipucu BAŞLIĞIN ALTINDA: "en az 3 tane seç"
            bir kısıt, kartları görmeden önce okunmalı. Girdide ise ipucu
            alanın altında kalıyor (aşağıda) — orada yazdıktan sonra
            bakılan bir açıklama. */}
        {su.ipucu && su.bicim !== "girdi" && (
          <p className="mt-2 text-center text-sm lowercase text-gri-600">{su.ipucu}</p>
        )}

        {/* Girdi: KENARLIKSIZ BEYAZ HAP, ortalanmış iri metin.
            Önce alt çizgiliydi; referansın "create your profile" adımında
            girdi aslında gölgeli beyaz bir hap ve metin ortalı. Fark önemli:
            alt çizgi girdiyi zemine ait bir satır gibi gösteriyor, hap ise
            bulanık haritanın üstünde DURAN bir nesne yapıyor — akışın geri
            kalanındaki kartlarla aynı malzeme.

            Odak halkayla veriliyor (kenarlıkla değil): kenarlık eklemek
            hapın yüksekliğini oynatıyor ve alan bir piksel zıplıyor. */}
        {su.bicim === "girdi" && (
          <>
            <input
              ref={girdiRef}
              key={su.id}
              value={deger[su.id as MetinAlani]}
              onChange={(e) => yaz(e.target.value)}
              type={su.tip}
              autoComplete={su.otomatik}
              autoCapitalize={su.id === "kullaniciAdi" ? "none" : undefined}
              placeholder={su.yerTutucu}
              aria-label={su.soru}
              className="mt-7 w-full rounded-full border-none bg-yuzey px-5 py-4 text-center text-xl font-semibold tracking-siki text-gri-900 shadow-kat-2 outline-none placeholder:font-normal placeholder:text-gri-400 focus:shadow-[0_0_0_2px_var(--color-gri-900),var(--shadow-kat-2)]"
            />
            {su.ipucu && (
              <p className="mt-2.5 text-center text-xs lowercase text-gri-600">{su.ipucu}</p>
            )}
          </>
        )}

        {/* ---- seçim: "nereden geldin?" ----
            Ayrı bir ileri düğmesi YOK. Referansta da yok: seçenek listesi
            tek seçimlik olduğu için dokunmak zaten cevabın kendisi, üstüne
            bir de onay istemek adımı iki dokunuşa çıkarırdı. */}
        {su.bicim === "secim" && (
          <div className="mt-6 flex flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NEREDEN.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setNereden(o.id);
                  setHata(null);
                  setAdim((a) => a + 1);
                }}
                className="bas flex w-full items-center justify-center gap-2 rounded-full border-none bg-gri-900 px-4 py-3.5 text-base font-semibold lowercase tracking-ui text-white shadow-kat-2"
              >
                {o.e && <span aria-hidden>{o.e}</span>}
                {o.ad}
              </button>
            ))}
          </div>
        )}

        {/* ---- ızgara: "haritanı kişiselleştir" ----
            İki sütun, fotoğraf zeminli kart mantığı. Gerçek fotoğraf yok,
            o yüzden kategori renginden degrade — referansta da fotoğrafı
            olmayan kapaklar canlı degrade oluyor (liste kapakları).
            Doygunluk alanla ters orantılı kuralı burada bozulmuyor: kartın
            üstünde KOYU ÖRTÜ var (.ortulu), beyaz yazı onun sayesinde
            okunuyor ve degradenin canlılığı kırılıyor.

            Seçili durum: beyaz onay dairesi + siyah halka. Referansın
            personalize ızgarasındaki işaretin aynısı — kenarlık rengiyle
            değil, EKLENEN BİR NESNEYLE anlatılıyor. */}
        {su.bicim === "izgara" && (
          /* auto-rows-max ŞART. Olmadan: ızgara dikeyde kalan boşluğa
             sığdırılıyor ve satırlar 82 piksele sıkışıyor, ama kartların
             yüksekliğini aspect-[4/3] belirlediği için kart 125 piksel
             kalıyor — her kart kendi satırını taşıp ALTTAKİ KARTIN üstüne
             biniyordu (etiketler bir alt sıraya düşmüş görünüyordu).
             max-content satırı içeriğe göre ölçüyor, fazlası kaydırılıyor. */
          <div className="mt-5 grid auto-rows-max grid-cols-2 gap-2.5 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SEVGI.map((s) => {
              const secili = turler.includes(s.id);
              const r = RENK[s.id] ?? RENK.diger;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { turDegistir(s.id); setHata(null); }}
                  aria-pressed={secili}
                  className={`ortulu bas relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-lg border-none p-3 text-left transition-shadow duration-[160ms] ${
                    secili
                      ? "shadow-[0_0_0_2.5px_var(--color-gri-900),var(--shadow-kat-2)]"
                      : "shadow-kat-1"
                  }`}
                  /* Degrade AÇIK uçtan değil KOYU uçtan: referansta bu kartların
                     zemini fotoğraf ve fotoğraflar doğal olarak koyu, beyaz
                     etiket onların üstünde rahat okunuyor. isik→ana denendi,
                     amber ve pembe kartlarda beyaz yazı okunmuyordu; ana→golge
                     hem kontrastı veriyor hem doygunluğu düşürüyor — kart
                     uygulamadaki en geniş renkli yüzey, skill §3'ün
                     "doygunluk alanla ters orantılı" kuralı tam burada. */
                  style={{ background: `linear-gradient(150deg, ${r?.ana}, ${r?.golge})` }}
                >
                  <span aria-hidden className="absolute left-3 top-2.5 z-[1] text-[26px] leading-none">
                    {emoji(s.id)}
                  </span>
                  {secili && (
                    <span
                      aria-hidden
                      className="absolute right-2.5 top-2.5 z-[1] grid size-6 place-items-center rounded-full bg-white text-sm font-bold leading-none text-gri-900 shadow-kat-2"
                    >
                      ✓
                    </span>
                  )}
                  <span className="relative z-[1] text-sm font-extrabold lowercase leading-tight tracking-siki text-white">
                    {s.ad}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {hata && (
          <p className="mt-4 rounded-lg bg-[rgba(179,38,30,.09)] p-2.5 text-center text-sm leading-snug text-kapali">
            {hata}
          </p>
        )}
        {bilgi && (
          <p className="mt-4 rounded-lg bg-yuzey p-2.5 text-center text-sm leading-snug text-gri-800 shadow-kat-1">
            {bilgi}
          </p>
        )}

        {/* Şartlara yalnızca Ayarlar'dan ulaşılabiliyordu; kabul artık
            gönderme eyleminin kendisi ve son adımda görünüyor. */}
        {mod === "kayit" && sonAdim && (
          <p className="mt-5 text-center text-xs leading-snug lowercase text-gri-600">
            hesap oluşturarak{" "}
            <button type="button" onClick={() => setYasal("sartlar")}
              className="border-none bg-transparent p-0 text-xs lowercase text-gri-900 underline">
              kullanım şartlarını
            </button>{" "}
            ve{" "}
            <button type="button" onClick={() => setYasal("gizlilik")}
              className="border-none bg-transparent p-0 text-xs lowercase text-gri-900 underline">
              gizlilik politikasını
            </button>{" "}
            kabul etmiş olursun.
          </p>
        )}

        {/* Seçim adımında gönder düğmesi YOK: seçeneğe dokunmak zaten
            hem cevap hem ilerleme.

            Etiket jenerik değil, ekrandaki cümleye verilen cevap.

            Izgara adımında düğme SİYAH DEĞİL GRADYAN. Referansta gradyan
            düğme, altında renkli içerik olan ekranlarda çıkıyor — sebebi
            görünür: sekiz canlı kartın üstünde siyah bir hap kartlardan
            biri gibi okunuyor, gradyan ise onlara ait olmayan tek yüzey
            olduğu için düğme gibi okunuyor. Akışın son eylemi de bu. */}
        {su.bicim !== "secim" && (
          <button
            type="submit" disabled={gonderiliyor}
            className={`bas mt-6 w-full shrink-0 rounded-full border-none px-4 py-4 text-base font-semibold lowercase tracking-ui text-white shadow-kat-3 disabled:opacity-50 ${
              su.bicim === "izgara" ? "" : "bg-gri-900"
            }`}
            style={
              su.bicim === "izgara"
                ? { backgroundImage: "linear-gradient(96deg,#2F6BFF 0%,#7C5CFF 100%)" }
                : undefined
            }
          >
            {gonderiliyor ? "…" : su.cevap}
          </button>
        )}

        {/* Mod değiştirme YALNIZCA ilk adımda. Altı adım ilerlemiş birine
            "zaten hesabın var mı?" diye sormak hem anlamsız hem de bastığında
            girdiği her şeyi siliyor. Referansın kayıt akışında da bu bağlantı
            yalnızca başlangıçta var. Son adımda yer de kazandırıyor: ızgara,
            şartlar metni ve düğme zaten sığmakta zorlanıyordu. */}
        {adim === 0 && (
          <button
            type="button" onClick={modDegistir}
            className="mt-3 w-full shrink-0 border-none bg-transparent py-1 text-sm lowercase text-gri-600 underline"
          >
            {mod === "giris" ? "hesabın yok mu? kayıt ol" : "zaten hesabın var mı? giriş yap"}
          </button>
        )}
      </form>
    </div>
  );
}
