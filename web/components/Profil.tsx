"use client";

import { fotoZemin, simgeSvg, zeminSimgeRengi } from "@/lib/gorsel";
import { useState } from "react";
import { useVeri } from "@/lib/kanca";
import { profilGetir, kisininPinleri, kisininListeleri, kisininYerleri, takipDegistir, takiptemiyim, davetGorseli, kucukUrl, medyaUrl } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import type { Yer, Pin, Kisi, Liste } from "@/lib/model";
import Avatar from "./Avatar";
import BosDurum from "./BosDurum";
import MiniHarita from "./MiniHarita";
import ListeSayfasi from "./ListeSayfasi";
import KartGorsel from "./KartGorsel";

export default function Profil({
  kullaniciAdi,
  onYerAc,
  onHaritada,
  onListeHaritada,
  onGirisIste,
  onPaylas,
  onAyarlar,
  onListeOlustur,
}: {
  /** boşsa oturumdaki kişi gösterilir */
  kullaniciAdi?: string;
  onYerAc: (id: string, oncelikliKisi?: string) => void;
  /** Kişisel haritaya dokununca: bu kişinin pinleri ana haritada. */
  onHaritada: (kisiId: string, etiket: string) => void;
  /** Listenin tamamını ana haritada göster. */
  onListeHaritada: (liste: Liste) => void;
  onGirisIste: () => void;
  onPaylas: () => void;
  onAyarlar: () => void;
  onListeOlustur: () => void;
}) {
  const { ben: oturumKisi } = useOturum();
  const hedef = kullaniciAdi ?? oturumKisi?.k ?? "";
  const benimMi = (id: string) => oturumKisi?.id === id;

  const { veri: kisi } = useVeri<Kisi | null>(
    () => (hedef ? profilGetir(hedef) : Promise.resolve(null)), [hedef], null);

  /* Profil gelmeden pin/liste sorgusu atılamaz (id lazım); kisi null iken
     boş dizi dönen sorgular çalışıp anında bitiyor. */
  const kimlik = kisi?.id ?? "";
  const { veri: pinleri, yukleniyor: pinYukleniyor } = useVeri<Pin[]>(
    () => (kimlik ? kisininPinleri(kimlik) : Promise.resolve([])), [kimlik], []);
  /* Açık liste id ile değil NESNE ile tutuluyor: Liste.yerler zaten elimizde,
     tekrar sorgu atmaya gerek yok. */
  const [acikListe, setAcikListe] = useState<Liste | null>(null);
  const { veri: listeleri } = useVeri<Liste[]>(
    () => (kimlik ? kisininListeleri(kimlik) : Promise.resolve([])), [kimlik], []);
  const { veri: takipte, yukleniyor: takipYukleniyor } = useVeri<boolean>(
    () => (kimlik && !benimMi(kimlik) ? takiptemiyim(kimlik) : Promise.resolve(false)),
    [kimlik, oturumKisi?.id], false);
  const [takipYerel, setTakipYerel] = useState<boolean | null>(null);

  const { veri: yerleri } = useVeri<Yer[]>(
    () => (kimlik
      ? kisininYerleri(kimlik, { lat: 40.9885, lng: 29.0295 })
      : Promise.resolve([])), [kimlik], []);

  /* Boş durum kartının zemini: gerçek bir mekan fotoğrafı. Sorgu YALNIZCA
     pin ızgarası gerçekten boşken atılıyor; yüklenirken de atılmıyor, yoksa
     her profil açılışında bir istek fazladan giderdi. (veri.ts → davetGorseli) */
  const bosHarita = !!kimlik && !pinYukleniyor && pinleri.length === 0;
  const { veri: davetFoto } = useVeri<string | null>(
    () => (bosHarita ? davetGorseli() : Promise.resolve(null)), [bosHarita], null);

  if (!hedef) {
    return (
      <div className="min-h-0 flex-1 bg-kagit p-4">
        <p className="mb-3 text-sm leading-relaxed text-gri-600">
          Kendi haritanı görmek için giriş yap.
        </p>
        <button onClick={onGirisIste}
          className="rounded-full border-none bg-gri-900 px-4 py-3 text-sm font-semibold lowercase tracking-ui text-white shadow-kat-2">
          Giriş yap
        </button>
      </div>
    );
  }
  if (!kisi) {
    return (
      <div className="min-h-0 flex-1 p-4 text-sm text-gri-600">
        Profil yükleniyor…
      </div>
    );
  }
  const benim = oturumKisi?.id === kisi.id;
  const takipDurumu = takipYerel ?? takipte;

  const baslik = "px-4 pb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-700";

  if (acikListe) {
    return (
      <ListeSayfasi
        liste={acikListe}
        sahibi={benim ? undefined : kisi.ad}
        onKapat={() => setAcikListe(null)}
        onYerAc={onYerAc}
        onHaritada={onListeHaritada}
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-[92px]">
      {/* Avatar ile ad yan yana değil alt alta: ad büyüyünce yan yana
          dizilim dar ekranda kırılıyordu. Hiyerarşi boyut ve kalınlıkla
          kuruluyor, kutuyla değil. */}
      <div className="px-4 pt-4">
        <Avatar kisi={kisi.id} boyut={84} />
        {/* Kademe A: kişi adı — 800 ve sıkı. Kişi adı UPPERCASE değil
            (skill: --c-name-size "uppercase değil"), ama ağırlık ve
            negatif aralık aynı. */}
        <h2 className="mt-3 text-3xl font-extrabold leading-none tracking-isim">{kisi.ad}</h2>
        <div className="mt-1.5 font-sayi text-sm text-gri-600">@{kisi.k}</div>
      </div>

      {/* Bio insanın yazdığı metin → Karla. */}
      {kisi.bio && <p className="px-4 pb-1 pt-2.5 font-metin text-sm leading-relaxed text-gri-800">{kisi.bio}</p>}

      {/* Eşit genişlikte istatistik karoları: iri rakam üstte, küçük harf
          soluk etiket altta. Ayraç çizgisi yok — karonun kendi zemini ve
          gölgesi ayrımı zaten yapıyor. */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {([
          ["📍", kisi.pinSayisi, "pin"],
          ["🗺️", yerleri.length, "mekan"],
          ["👥", kisi.takipci, "takipçi"],
          ["➕", kisi.takip, "takip"],
        ] as [string, number, string][]).map(([e, n, ad]) => (
          <div key={ad} className="min-w-[76px] flex-1 rounded-md bg-yuzey px-3 py-2.5 text-center shadow-kat-1">
            {/* İkon + çok kalın rakam üstte, küçük harf gri etiket altta. */}
            <span aria-hidden className="block text-sm leading-none">{e}</span>
            <b className="mt-1 block font-sayi text-xl font-bold leading-none">{n}</b>
            <span className="mt-1.5 block text-2xs lowercase text-gri-600">{ad}</span>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex gap-2 px-4">
        {benim ? (
          <>
            <button
              onClick={onPaylas}
              className="flex-1 rounded-full border-none bg-gri-900 px-3 py-3 text-sm font-semibold lowercase tracking-ui text-white shadow-kat-1"
            >
              haritamı paylaş
            </button>
            <button
              onClick={onAyarlar}
              className="flex-1 rounded-full border-none bg-yuzey px-3 py-3 text-sm font-semibold lowercase tracking-ui text-gri-800 shadow-kat-1"
            >
              ayarlar
            </button>
          </>
        ) : (
          <button
            disabled={takipYukleniyor}
            onClick={async () => {
              if (!oturumKisi) return onGirisIste();
              /* İyimser güncelleme: sunucu yanıtını beklemeden düğme değişiyor,
                 hata olursa geri alınıyor. */
              const su = takipDurumu;
              setTakipYerel(!su);
              try { await takipDegistir(kisi.id, su); }
              catch (e) { setTakipYerel(su); alert(e instanceof Error ? e.message : String(e)); }
            }}
            className={`flex-1 rounded-full border-none px-3 py-3 text-sm font-semibold lowercase tracking-ui shadow-kat-1 ${
              takipDurumu ? "bg-yuzey text-gri-800" : "bg-gri-900 text-white"
            } disabled:opacity-50`}
          >
            {takipDurumu ? "takiptesin ✓" : "takip et"}
          </button>
        )}
      </div>

      <div className={baslik}>{benim ? "Senin" : kisi.ad + "’in"} Kadıköy haritası</div>
      {/* Mini harita ÖLÜ bir resimdi: pinlerin nerede olduğunu gösteriyordu
          ama üstüne dokununca hiçbir şey olmuyordu. Artık ana haritayı bu
          kişinin pinlerine filtreleyip açıyor — şeritten birini seçmekle
          aynı sonuç, yalnızca giriş noktası farklı. */}
      <button
        onClick={() => onHaritada(kisi.id, benim ? "Senin pinlerin" : `${kisi.ad}’in pinleri`)}
        aria-label={`${benim ? "Senin" : kisi.ad + "’in"} pinlerini haritada göster`}
        className="relative mx-4 mb-3.5 block w-[calc(100%-2rem)] overflow-hidden rounded-lg border-none bg-su p-0 shadow-kat-1"
      >
        <MiniHarita yerler={yerleri} />
        <span className="absolute bottom-2 right-2 rounded-full bg-yuzey px-2.5 py-1 text-2xs font-semibold text-gri-800 shadow-kat-2">
          haritada gör
        </span>
      </button>

      {/* Liste oluşturma yalnızca Ayarlar → Arşiv → Listelerim'in içinde
          duruyordu. Profilde "Listelerin" bölümü ve "Henüz listen yok." boş
          durumu vardı ama oradan liste açmanın yolu yoktu — özelliği görüp
          nasıl kullanacağını bulamıyordun. */}
      <div className={`${baslik} flex items-center justify-between`}>
        <span>{benim ? "Listelerin" : kisi.ad + "’in listeleri"}</span>
        {benim && (
          <button onClick={onListeOlustur}
            className="border-none bg-transparent p-0 text-xs font-semibold text-gri-800">
            + Yeni liste
          </button>
        )}
      </div>
      {listeleri.length ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {listeleri.map((l) => {
            const ilk = l.yerler.slice(0, 3);
            return (
              <button
                key={l.id}
                onClick={() => setAcikListe(l)}
                className="relative w-[158px] shrink-0 overflow-hidden rounded-md border-none bg-yuzey p-0 shadow-kat-1"
              >
                <div className="flex h-[68px] overflow-hidden">
                  {ilk.map((y) => (
                    <div key={y.id} className="flex-1" style={{ background: fotoZemin(y.tur) }} />
                  ))}
                </div>
                <div className="px-2.5 pb-3 pt-2.5 text-left">
                  <div className="mb-0.5 truncate text-sm font-semibold leading-tight">{l.baslik}</div>
                  <div className="font-sayi text-xs text-gri-600">{l.yerler.length} mekan</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-4 pb-5 text-sm lowercase text-gri-600">
          {benim
            ? "Henüz listen yok. Kaydettiğin mekanlardan bir liste yapabilirsin."
            : `${kisi.ad} henüz liste oluşturmamış.`}
        </p>
      )}

      <div className={baslik}>Pinler</div>
      {/* İki sütun yerine üç: kartlar küçülüyor ve ekranda daha çok pin
          görünüyor. İçerideki her şey (iğne başı, simge, ad) aynı oranda
          küçültüldü, yoksa dar kartta yazı taşıyordu. */}
      {pinleri.length ? (
        <div className="grid grid-cols-3 gap-2.5 px-4 pb-5">
          {pinleri.map((p) => {
            /* Akıştaki kapakla aynı kural: ızgarada video oynatmıyoruz,
               kapak yalnızca fotoğraftan geliyor. Demo pinlerin demo://
               yolunda medyaUrl null dönüyor, o zaman simgeye düşüyor. */
            const ilk = p.medyalar[0];
            const kapak = ilk && ilk.tur !== "video" ? kucukUrl(medyaUrl(ilk.yol), 256) : null;
            return (
              <button
                key={p.id}
                /* Profilden bir pine dokunuyorsan o kişinin yazdığını
                   görmek istiyorsun, en çok beğenilen yabancı pini değil. */
                onClick={() => onYerAc(p.yer, kisi.id)}
                className="relative aspect-[0.86] overflow-hidden rounded-md border-none bg-yuzey p-0 shadow-kat-1"
              >
                <div
                  className="relative grid size-full place-items-center overflow-hidden"
                  style={{ background: fotoZemin(p.yerTuru) }}
                >
                  {kapak ? (
                    <KartGorsel url={kapak} />
                  ) : (
                    <div className="opacity-60" dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 26, zeminSimgeRengi(p.yerTuru)) }} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(0,0,0,.6)] to-transparent px-1.5 pb-1.5 pt-3.5 text-left text-2xs font-semibold leading-tight text-white">
                    {p.yerAdi}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-4 pb-6">
          {/* Boş durum davet anı: boş satır yerine çağrı kartı (skill §6). */}
          <BosDurum
            foto={kucukUrl(davetFoto, 800)}
            baslik={benim ? "haritan boş" : "henüz pin yok"}
            alt={benim
              ? "sevdiğin bir yere ilk pinini at, haritan buradan büyür."
              : "bu kişi henüz hiçbir yere pin atmamış."}
            {...(benim ? { eylem: onListeOlustur, eylemEtiketi: "listeyle başlayayım." } : {})}
          />
        </div>
      )}
    </div>
  );
}
