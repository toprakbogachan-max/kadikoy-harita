"use client";

import { useEffect } from "react";

type Tur = "sartlar" | "gizlilik";

/**
 * Kullanım şartları ve gizlilik metni.
 *
 * Bunlar avukat metni DEĞİL — uygulama şu an kapalı bir demo ve metin de
 * bunu açıkça söylüyor. Gerçek kullanıcıya açılırken bir hukukçuya
 * bakılması gerekiyor; metnin içinde de bu yazıyor ki unutulmasın.
 */
export default function YasalMetin({ tur, onKapat }: { tur: Tur; onKapat: () => void }) {
  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  const baslik = tur === "sartlar" ? "Kullanım şartları" : "Gizlilik politikası";

  return (
    <div role="dialog" aria-modal="true" aria-label={baslik}
         className="absolute inset-0 z-[45] flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div className="flex items-center gap-2.5">
          <button onClick={onKapat} aria-label="Geri"
            className="shrink-0 border-none bg-transparent p-0 text-[18px] leading-none text-murekkep2">
            ‹
          </button>
          <h2 className="text-[20px] font-semibold leading-tight">{baslik}</h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-[13.5px] leading-relaxed">
        <div className="mb-4 rounded-sm border border-[rgba(184,128,26,.4)] bg-[rgba(184,128,26,.08)] p-3 text-[12.5px] leading-snug">
          <b>Bu bir demo.</b> Kadıköy Harita henüz yayında değil, geliştirme
          aşamasında. Aşağıdaki metin hukukçu tarafından hazırlanmadı; gerçek
          kullanıcıya açılmadan önce bir avukata danışılması gerekiyor.
        </div>

        {tur === "sartlar" ? <Sartlar /> : <Gizlilik />}
      </div>
    </div>
  );
}

const B = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-1.5 mt-4 font-tabela text-[11.5px] uppercase tracking-[0.12em] text-murekkep2">
    {children}
  </h3>
);

function Sartlar() {
  return (
    <>
      <B>Ne yapıyoruz</B>
      <p>
        Kadıköy Harita, insanların gittikleri yerler hakkında somut notlar
        bıraktığı bir haritadır. Amaç puan ortalaması üretmek değil; “hangi
        masaya otur, ne zaman git, neye dikkat et” bilgisini paylaşmaktır.
      </p>

      <B>Paylaştığın içerik</B>
      <p>
        Yazdığın notlar ve yüklediğin fotoğraflar sana aittir. Uygulamada
        gösterilebilmesi için bize yayınlama izni vermiş olursun; istediğin
        zaman silebilirsin, sildiğinde uygulamadan da kalkar.
      </p>
      <p className="mt-2">
        Yalnızca kendi çektiğin fotoğrafları yükle. Başkasının fotoğrafını
        iznini almadan paylaşma.
      </p>

      <B>Ne yazılmaz</B>
      <ul className="ml-4 list-disc space-y-1">
        <li>Bilerek yanlış bilgi</li>
        <li>Hakaret, nefret söylemi, taciz</li>
        <li>Reklam, spam, ücret karşılığı yazılmış övgü</li>
        <li>Bir işletmeyi hedef alan asılsız iddia</li>
      </ul>
      <p className="mt-2">
        Bir işletme hakkında yazarken deneyimini anlat, iddiada bulunma.
        “Kart geçmedi” ile “dolandırıyorlar” arasındaki fark önemlidir.
      </p>

      <B>Mekan bilgileri</B>
      <p>
        Haritadaki mekan kayıtları OpenStreetMap’ten gelir ve hatalı olabilir.
        Çalışma saati görünmüyorsa “kapalı” demek değildir, bilinmiyor demektir.
        Gitmeden önce doğrulaman iyi olur.
      </p>

      <B>Hesabın</B>
      <p>
        Kurallara aykırı içerik paylaşan hesapların erişimini kısıtlayabiliriz.
        Hesabını silmek istersen içeriğin de silinir.
      </p>

      <B>Sorumluluk</B>
      <p>
        İçerikler kullanıcıların kişisel deneyimleridir. Bir mekan hakkındaki
        notun doğruluğunu garanti etmiyoruz. Gittiğin yerdeki deneyiminden
        biz sorumlu değiliz.
      </p>
    </>
  );
}

function Gizlilik() {
  return (
    <>
      <B>Ne topluyoruz</B>
      <ul className="ml-4 list-disc space-y-1">
        <li><b>Hesap:</b> e-posta, kullanıcı adı, görünen ad, bio, profil fotoğrafı</li>
        <li><b>İçerik:</b> pinlerin, fotoğrafların, yorumların, listelerin</li>
        <li><b>Etkileşim:</b> beğendiklerin, kaydettiklerin, takip ettiklerin</li>
      </ul>
      <p className="mt-2">
        Konumunu takip etmiyoruz. Harita senin baktığın yeri sunucuya soruyor
        ama nerede olduğunu kaydetmiyoruz.
      </p>

      <B>Ne göründüğü</B>
      <ul className="ml-4 list-disc space-y-1">
        <li><b>Herkese açık:</b> pinlerin, fotoğrafların, yorumların, listelerin, profilin</li>
        <li><b>Yalnızca sana:</b> kaydettiklerin, e-postan, bildirimlerin</li>
      </ul>
      <p className="mt-2">
        Ayarlardan “Profilim herkese açık”ı kapatırsan profilin başkalarına
        görünmez. Bu ayar sadece arayüzde değil, veritabanı seviyesinde çalışır.
      </p>

      <B>Nerede duruyor</B>
      <p>
        Veriler Supabase üzerinde, Frankfurt’taki sunucularda tutulur.
        Fotoğraflar aynı yerdeki dosya deposunda durur.
      </p>

      <B>Kimlerle paylaşıyoruz</B>
      <p>
        Kimseyle. Reklam vermiyoruz, veri satmıyoruz, üçüncü taraf takip
        aracı kullanmıyoruz.
      </p>

      <B>Silme</B>
      <p>
        Pinini ya da yorumunu sildiğinde veritabanından da silinir. Hesabını
        silmek istersen bize yaz, hesabına bağlı her şey kalkar.
      </p>

      <B>Dış kaynaklar</B>
      <p>
        Mekan verisi OpenStreetMap’ten (ODbL), bazı kapak görselleri Wikimedia
        Commons’tan gelir. Harita karoları OpenFreeMap üzerinden yüklenir —
        bu istekler onların sunucusuna gider.
      </p>
    </>
  );
}
