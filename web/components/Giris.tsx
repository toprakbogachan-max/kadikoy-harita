"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOturum } from "@/lib/oturum";
import YasalMetin from "./YasalMetin";

type Mod = "giris" | "kayit";
type AlanId = "ad" | "kullaniciAdi" | "eposta" | "sifre";

/**
 * Giriş / kayıt — EKRAN BAŞINA TEK GİRDİ.
 *
 * Skill §8'in temel UX kararı: kayıt tek bir uzun form değil, her adımda
 * yalnızca bir soru. Bilişsel yükü düşürüyor ve her adımı küçük bir kazanç
 * gibi hissettiriyor. Eskiden dört alan alt alta tek ekrandaydı.
 *
 * Girdi kutu değil, SORU: kenarlık yok, yalnızca alt çizgi, metin ortalı,
 * punto iri. Bu biçim yalnızca bu akışa ait — iç ekranlardaki arama ve
 * yorum girdisi hâlâ yuvarlak dolu hap.
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
export default function Giris({ onKapat }: { onKapat: () => void }) {
  const { girisYap, kayitOl } = useOturum();
  const [mod, setMod] = useState<Mod>("giris");
  const [adim, setAdim] = useState(0);
  const [deger, setDeger] = useState<Record<AlanId, string>>({
    ad: "", kullaniciAdi: "", eposta: "", sifre: "",
  });
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [yasal, setYasal] = useState<"sartlar" | "gizlilik" | null>(null);
  const girdiRef = useRef<HTMLInputElement>(null);

  /* Adım tanımları. Her biri kendi sorusunu, girdi tipini ve CEVABINI
     (buton etiketi) taşıyor — etiket ekrandaki cümlenin devamı. */
  const adimlar = useMemo(() => {
    const sifreAdimi = {
      id: "sifre" as AlanId,
      soru: mod === "giris" ? "şifren?" : "bir şifre seç.",
      ipucu: mod === "giris" ? null : "en az 6 karakter.",
      tip: "password",
      otomatik: mod === "giris" ? "current-password" : "new-password",
      yerTutucu: "••••••••",
      cevap: mod === "giris" ? "içeri gir." : "hesabı aç.",
    };
    const epostaAdimi = {
      id: "eposta" as AlanId, soru: "e-postan ne?", ipucu: null,
      tip: "email", otomatik: "email", yerTutucu: "ornek@eposta.com",
      cevap: "tamamdır.",
    };
    if (mod === "giris") return [epostaAdimi, sifreAdimi];
    return [
      { id: "ad" as AlanId, soru: "sana ne diyelim?", ipucu: "haritanda görünecek ad.",
        tip: "text", otomatik: "name", yerTutucu: "Bogaç", cevap: "bu benim." },
      { id: "kullaniciAdi" as AlanId, soru: "adresin ne olsun?",
        ipucu: "küçük harf, rakam ve alt çizgi. 3–24 karakter.",
        tip: "text", otomatik: "username", yerTutucu: "bogac", cevap: "iyi görünüyor." },
      epostaAdimi,
      sifreAdimi,
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

  const yaz = (v: string) => setDeger((d) => ({ ...d, [su.id]: v }));

  /* Doğrulama adımın KENDİSİNDE: hatayı dört alan sonra değil hemen
     görmek gerekiyor. Şemadaki check ^[a-z0-9_]{3,24}$ sunucuya boşuna
     gitmesin. */
  const adimiDogrula = (): string | null => {
    const v = deger[su.id].trim();
    if (!v) return "burayı boş bırakma.";
    if (su.id === "kullaniciAdi" && !/^[a-z0-9_]{3,24}$/.test(v.toLowerCase()))
      return "kullanıcı adı 3–24 karakter olmalı; sadece küçük harf, rakam ve _";
    if (su.id === "eposta" && !v.includes("@")) return "bu bir e-posta gibi durmuyor.";
    if (su.id === "sifre" && mod === "kayit" && deger.sifre.length < 6)
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

  return (
    <div
      role="dialog" aria-modal="true"
      aria-label={mod === "giris" ? "Giriş yap" : "Kayıt ol"}
      /* .cam: arkadaki harita/akış bulanıklaşıyor. Skill §8 — bağlam
         ücretsiz bir tanıtım fırsatı, düz renkle harcama. */
      className="cam absolute inset-0 z-40 flex flex-col"
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
            azaltıyor. Nokta, çubuk değil — chrome sessiz kalsın. */}
        <span className="flex items-center gap-1.5" aria-label={`Adım ${adim + 1} / ${adimlar.length}`}>
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

      <form onSubmit={ilerle} className="flex min-h-0 flex-1 flex-col justify-center px-6 pb-8">
        {/* Kademe A: soru bağırır. */}
        <h2 className="text-center text-3xl font-extrabold lowercase leading-tight tracking-isim text-gri-900">
          {su.soru}
        </h2>

        {/* Kutu değil soru: kenarlıksız, alt çizgili, ortalanmış. */}
        <input
          ref={girdiRef}
          key={su.id}
          value={deger[su.id]}
          onChange={(e) => yaz(e.target.value)}
          type={su.tip}
          autoComplete={su.otomatik}
          autoCapitalize={su.id === "kullaniciAdi" ? "none" : undefined}
          placeholder={su.yerTutucu}
          aria-label={su.soru}
          className="mt-7 w-full border-none border-b-[1.5px] border-b-[var(--cizgi)] bg-transparent pb-3 pt-2 text-center text-xl font-semibold tracking-siki text-gri-900 outline-none placeholder:font-normal placeholder:text-gri-400 focus:border-b-gri-900"
        />

        {su.ipucu && (
          <p className="mt-2.5 text-center text-xs lowercase text-gri-600">{su.ipucu}</p>
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

        {/* Etiket jenerik değil: ekrandaki cümleye verilen cevap. */}
        <button
          type="submit" disabled={gonderiliyor}
          className="mt-7 w-full rounded-full border-none bg-gri-900 px-4 py-4 text-base font-semibold lowercase tracking-ui text-white shadow-kat-3 disabled:opacity-50"
        >
          {gonderiliyor ? "…" : su.cevap}
        </button>

        <button
          type="button" onClick={modDegistir}
          className="mt-3 w-full border-none bg-transparent py-1 text-sm lowercase text-gri-600 underline"
        >
          {mod === "giris" ? "hesabın yok mu? kayıt ol" : "zaten hesabın var mı? giriş yap"}
        </button>
      </form>
    </div>
  );
}
