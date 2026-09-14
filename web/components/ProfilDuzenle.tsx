"use client";

import { useEffect, useRef, useState } from "react";
import { useOturum } from "@/lib/oturum";
import { profilGuncelle, avatarYukle } from "@/lib/veri";
import { kisiRengi } from "@/lib/gorsel";
import { SOSYAL, SOSYAL_SIRA, type SosyalAd } from "@/lib/paleti";

/** Profil fotoğrafı bu boyuta indiriliyor — avatar en fazla 84px gösteriliyor,
 *  retina için 2x fazlasıyla yeter. Ham telefon fotoğrafı 4 MB olabiliyor. */
const AVATAR_PX = 256;

/**
 * Profil düzenleme.
 *
 * Yerleşim referanstaki "Settings" ekranından: ETİKETLER ALANIN İÇİNDE
 * DEĞİL SOLUNDA, sağa yaslı. Üstte duran etiketler formu iki kat uzatıyordu
 * ve her satır "etiket + kutu" diye iki satırlık bir blok gibi okunuyordu;
 * yana alınınca form tek bir tabloya dönüyor, göz sol sütundan aşağı
 * inerken hangi alanın ne olduğunu tek bakışta tarıyor.
 *
 * Girdilerde saç teli KENARLIK var — uygulamanın geri kalanında derinlik
 * gölgeden gelir ama burası istisna: yan yana yedi boş kutu gölgeyle
 * ayrıldığında form kabaran bir kart yığınına dönüyor. Kenarlık düz, sakin
 * ve "buraya yazılır" diyor.
 *
 * Avatar OVAL (daire değil, squircle değil): referansın imzası bu ve
 * kimliğin tek kişisel yeri burası. Üstünde yarı saydam "düzenle" bandı —
 * ayrı bir düğme koymak avatarın yanında ikinci bir odak yaratıyordu.
 */
export default function ProfilDuzenle({ onKapat }: { onKapat: () => void }) {
  const { ben, cikisYap, tazele } = useOturum();
  const [ad, setAd] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [sosyal, setSosyal] = useState<Record<SosyalAd, string>>({
    twitter: "", instagram: "", tiktok: "",
  });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const dosyaGirdi = useRef<HTMLInputElement>(null);

  /* Profil yüklenince formu bir kez doldur — sonraki yazışları ezmesin */
  const [dolduruldu, setDolduruldu] = useState(false);
  if (ben && !dolduruldu) {
    setDolduruldu(true);
    setAd(ben.ad); setBio(ben.bio); setFoto(ben.foto);
    setSosyal({
      twitter: ben.twitter ?? "",
      instagram: ben.instagram ?? "",
      tiktok: ben.tiktok ?? "",
    });
  }

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !kaydediliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, kaydediliyor]);

  const fotoSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.files?.[0];
    e.target.value = "";
    if (!d) return;
    setHata(null); setKaydediliyor(true);
    try {
      const kucuk = await kucult(d);
      const url = await avatarYukle(kucuk, "jpg");
      setFoto(url);
      tazele();
      setBilgi("fotoğraf güncellendi.");
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally { setKaydediliyor(false); }
  };

  const kaydet = async () => {
    setKaydediliyor(true); setHata(null); setBilgi(null);
    try {
      /* Sosyal alanlar ham gönderiliyor; "@" ve URL temizliği veri
         katmanında (sosyalTemizle) — şemadaki kısıtla aynı yerde dursun. */
      await profilGuncelle({ ad, bio, ...sosyal });
      tazele();
      onKapat();
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally { setKaydediliyor(false); }
  };

  /* Girdi kutusu: kenarlık var, gölge yok (yukarıdaki not).
     Yarıçap rounded-lg (20px) DEĞİL: 44 piksellik bir kutuda neredeyse hap
     yapıyor ve alanlar düğme gibi okunuyordu. Referanstaki kutular yumuşak
     ama köşeli — 12px o oranı tutturuyor. */
  const girdi =
    "w-full rounded border border-[var(--cizgi)] bg-yuzey px-3 py-2.5 text-base text-gri-900 outline-none placeholder:text-gri-400 focus:border-gri-400 disabled:opacity-60";

  return (
    <div role="dialog" aria-modal="true" aria-label="Profili düzenle"
         className="iridesan absolute inset-0 z-40 flex flex-col">
      {/* Başlık ORTALANMIŞ, kapat sağda — referanstaki gibi. Geri oku
          değil çarpı: burası bir yığının içindeki adım değil, üstüne
          açılan bir katman. */}
      <div className="relative flex shrink-0 items-center justify-center px-4 py-[15px]">
        <h2 className="text-xl font-extrabold uppercase leading-none tracking-siki">AYARLAR</h2>
        <button onClick={onKapat} aria-label="Kapat" disabled={kaydediliyor}
          className="absolute right-4 grid size-8 place-items-center rounded-md border-none bg-transparent text-xl leading-none text-gri-800 disabled:opacity-40">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {/* ---- avatar ---- */}
        <div className="flex justify-center pb-6 pt-2">
          <input ref={dosyaGirdi} type="file" accept="image/*" onChange={fotoSec} className="hidden" />
          <button
            onClick={() => dosyaGirdi.current?.click()}
            disabled={kaydediliyor}
            aria-label="Profil fotoğrafını değiştir"
            /* Oval: tam daire değil, dikeyde uzun. */
            className="relative h-[168px] w-[126px] overflow-hidden rounded-[46%] border-none p-0 shadow-kat-2 disabled:opacity-60"
            style={foto ? undefined : { background: kisiRengi(ben?.k ?? "?") }}
          >
            {foto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={foto} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-5xl font-extrabold text-white">
                {(ben?.ad ?? "?")[0]}
              </span>
            )}
            {/* Yarı saydam bant: fotoğrafın üstünde beyaz yazı, koyu zemin
                olmadan okunmaz (skill §6). */}
            <span className="absolute inset-x-0 bottom-0 bg-[rgba(0,0,0,.42)] py-2 text-sm font-bold lowercase text-white backdrop-blur-[2px]">
              düzenle
            </span>
          </button>
        </div>

        {/* ---- alanlar ---- */}
        <Satir etiket="ad">
          <input value={ad} onChange={(e) => setAd(e.target.value)}
                 maxLength={40} disabled={kaydediliyor} className={girdi} />
        </Satir>

        {/* Kullanıcı adı DEĞİŞTİRİLEMİYOR: paylaşılan profil bağlantıları
            ona bağlı ve şemada benzersiz. Satır yine de duruyor — gizlemek
            "nerede benim kullanıcı adım" sorusunu doğuruyordu. */}
        <Satir etiket="kullanıcı adı">
          <input value={`@${ben?.k ?? ""}`} readOnly disabled
                 className={girdi + " font-sayi"} />
        </Satir>

        <Satir etiket="bio" hizala="üst">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    maxLength={200} rows={4} disabled={kaydediliyor}
                    placeholder="kendini bir iki cümleyle anlat"
                    className={girdi + " resize-none leading-snug"} />
          <span className="mt-1 block text-right font-sayi text-2xs text-gri-500">
            {bio.length}/200
          </span>
        </Satir>

        {/* Sosyal satırlarda etiket yerine MARKA İŞARETİ: "twitter" yazmak
            ikonun zaten söylediğini tekrar etmek olurdu ve üç satır üst
            üste gelince sol sütun gürültüye dönüyordu. */}
        {SOSYAL_SIRA.map((p) => (
          <Satir key={p} simge={SOSYAL[p].yol} etiket={SOSYAL[p].ad}>
            <input
              value={sosyal[p]}
              onChange={(e) => setSosyal((s) => ({ ...s, [p]: e.target.value }))}
              maxLength={80}
              disabled={kaydediliyor}
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label={`${SOSYAL[p].ad} kullanıcı adı`}
              placeholder="@"
              className={girdi}
            />
          </Satir>
        ))}

        <p className="pb-1 pl-[104px] text-2xs lowercase leading-snug text-gri-500">
          bağlantının tamamını yapıştırabilirsin, kullanıcı adını kendi ayıklar.
        </p>

        {hata && (
          <p className="mt-3 rounded-md border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-sm">
            {hata}
          </p>
        )}
        {bilgi && (
          <p className="mt-3 rounded-lg bg-yuzey p-2.5 text-sm lowercase shadow-kat-1">{bilgi}</p>
        )}

        {/* Kaydet ekranın DİBİNDE değil akışın içinde: sabit bir alt çubuk
            son sosyal satırın üstünü örtüyordu ve form zaten kısa. */}
        <button onClick={kaydet} disabled={kaydediliyor || !ad.trim()}
          className="mt-5 w-full rounded-full border-none bg-gri-900 px-4 py-3.5 text-base font-bold lowercase tracking-ui text-white shadow-kat-2 transition-transform duration-[160ms] ease-out active:scale-[.98] disabled:opacity-40">
          {kaydediliyor ? "…" : "kaydet"}
        </button>

        {/* Çıkıştan sonra paneli KAPATMAK şart: oturum kapanıyor ama ekran
            açık kalırsa kullanıcıya "düğme çalışmadı" gibi görünüyor. */}
        <button onClick={async () => { await cikisYap(); onKapat(); }}
          disabled={kaydediliyor}
          className="mt-5 w-full border-none bg-transparent py-2 text-base font-bold lowercase tracking-ui text-gri-900 disabled:opacity-40">
          çıkış yap
        </button>
      </div>
    </div>
  );
}

/**
 * Etiket solda (sağa yaslı) + alan sağda.
 *
 * Etiket sütunu SABİT genişlikte: içeriğe göre daralıp genişleseydi her
 * satırın girdisi farklı yerden başlar ve form merdivene dönerdi.
 */
function Satir({
  etiket, simge, hizala = "orta", children,
}: {
  etiket: string;
  /** verilirse etiket yerine bu marka işareti çizilir */
  simge?: string;
  hizala?: "orta" | "üst";
  children: React.ReactNode;
}) {
  return (
    <label className={`mb-3 flex gap-3 ${hizala === "üst" ? "items-start" : "items-center"}`}>
      <span
        className={`w-[92px] shrink-0 text-right ${hizala === "üst" ? "pt-2.5" : ""}`}
        /* Marka işaretini sağa yaslamak için: ikon da etiket gibi
           sütunun sağ kenarına hizalanıyor. */
      >
        {simge ? (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"
               aria-hidden className="ml-auto block text-gri-900">
            <path d={simge} />
          </svg>
        ) : (
          <span className="text-sm lowercase text-gri-600">{etiket}</span>
        )}
        {simge && <span className="sr-only">{etiket}</span>}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

/**
 * Fotoğrafı kare kırpıp küçültür — tarayıcıda, yüklemeden önce.
 *
 * Ham telefon fotoğrafı 4–8 MB olabiliyor; avatar en fazla 168px
 * gösteriliyor. Küçültmeden yüklemek hem kotayı hem kullanıcının
 * internetini boşa harcar. Merkezden kare kırpılıyor ki oran bozulmasın —
 * oval çerçeve kareyi kendi kırpıyor.
 */
function kucult(dosya: File): Promise<Blob> {
  return new Promise((coz, red) => {
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const kenar = Math.min(img.width, img.height);
      const sx = (img.width - kenar) / 2;
      const sy = (img.height - kenar) / 2;
      const t = document.createElement("canvas");
      t.width = t.height = AVATAR_PX;
      const c = t.getContext("2d");
      if (!c) return red(new Error("Görsel işlenemedi."));
      c.drawImage(img, sx, sy, kenar, kenar, 0, 0, AVATAR_PX, AVATAR_PX);
      t.toBlob((b) => (b ? coz(b) : red(new Error("Görsel dönüştürülemedi."))), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); red(new Error("Görsel okunamadı.")); };
    img.src = url;
  });
}
