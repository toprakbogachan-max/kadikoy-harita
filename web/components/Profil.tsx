"use client";

import { fotoZemin, simgeSvg, zeminSimgeRengi } from "@/lib/gorsel";
import { useMemo, useState } from "react";
import { useVeri } from "@/lib/kanca";
import { profilGetir, kisininPinleri, kisininListeleri, kisininYerleri, takipDegistir, takiptemiyim, davetGorseli, kucukUrl, medyaUrl } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import type { Yer, Pin, Kisi, Liste } from "@/lib/model";
import { SOSYAL, SOSYAL_SIRA } from "@/lib/paleti";
import Avatar from "./Avatar";
import BosDurum from "./BosDurum";
import MiniHarita from "./MiniHarita";
import ListeSayfasi from "./ListeSayfasi";
import ListeDuzenle from "./ListeDuzenle";
import ListeKarti, { YeniListeKarosu } from "./ListeKarti";
import KartGorsel from "./KartGorsel";

/**
 * Profil — kişinin Kadıköy'ü.
 *
 * Yerleşim Corner'ın profil ekranından alındı ve sırası bilinçli:
 *   kimlik → sayılar → LİSTELER → kişisel harita → pinler
 * Listeler ortada değil, üstte: bir insanın haritasını okunur yapan şey
 * tek tek pinleri değil, o pinleri nasıl grupladığı. "yağmurlu günler",
 * "annem gelince" — profili kişisel yapan bu, ve ızgarada kendi
 * kapaklarıyla duruyorlar; yatay kaydırılan küçük bir şeritte değil.
 *
 * Kenardan kenara başlık barı YOK (skill §6): geri / paylaş / ayarlar
 * içeriğin üstünde ayrı ayrı yüzen düğmeler. Bu yüzden ekranın başlığını
 * page.tsx değil bu bileşen taşıyor.
 */
export default function Profil({
  kullaniciAdi,
  onYerAc,
  onHaritada,
  onListeHaritada,
  onGirisIste,
  onPaylas,
  onAyarlar,
  onListeOlustur,
  onGeri,
  tazele = 0,
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
  /** Başkasının profilindeyken kendi profiline dönüş. */
  onGeri?: () => void;
  /**
   * Dışarıda bir liste/pin oluşunca artıyor, sorguları yeniliyor.
   * Bu olmadan profilden "yeni liste" yapıp dönünce ızgara eski hâlinde
   * kalıyordu — liste kaydedilmiş ama görünmüyordu.
   */
  tazele?: number;
}) {
  const { ben: oturumKisi } = useOturum();
  const hedef = kullaniciAdi ?? oturumKisi?.k ?? "";
  const benimMi = (id: string) => oturumKisi?.id === id;

  const { veri: kisi } = useVeri<Kisi | null>(
    () => (hedef ? profilGetir(hedef) : Promise.resolve(null)), [hedef, tazele], null);

  /* Profil gelmeden pin/liste sorgusu atılamaz (id lazım); kisi null iken
     boş dizi dönen sorgular çalışıp anında bitiyor. */
  const kimlik = kisi?.id ?? "";
  const { veri: pinleri, yukleniyor: pinYukleniyor } = useVeri<Pin[]>(
    () => (kimlik ? kisininPinleri(kimlik) : Promise.resolve([])), [kimlik, tazele], []);
  /* Açık liste id ile değil NESNE ile tutuluyor: Liste.yerler zaten elimizde,
     tekrar sorgu atmaya gerek yok. */
  const [acikListe, setAcikListe] = useState<Liste | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<Liste | null>(null);
  const { veri: listeleri } = useVeri<Liste[]>(
    () => (kimlik ? kisininListeleri(kimlik) : Promise.resolve([])), [kimlik, tazele], []);

  /* Düzenleme ve silme sonucunu sunucudan yeniden çekmiyoruz: sorgunun
     anahtarı değişmiyor ve `tazele` dışarıdan geliyor. Yerel yama,
     kullanıcının az önce yaptığı değişikliği anında göstermek için —
     null = silindi. */
  const [yama, setYama] = useState<Record<string, Liste | null>>({});
  const gorunenListeler = useMemo(
    () => listeleri.map((l) => (l.id in yama ? yama[l.id] : l)).filter((l): l is Liste => !!l),
    [listeleri, yama],
  );

  const { veri: takipte, yukleniyor: takipYukleniyor } = useVeri<boolean>(
    () => (kimlik && !benimMi(kimlik) ? takiptemiyim(kimlik) : Promise.resolve(false)),
    [kimlik, oturumKisi?.id], false);
  const [takipYerel, setTakipYerel] = useState<boolean | null>(null);

  const { veri: yerleri } = useVeri<Yer[]>(
    () => (kimlik
      ? kisininYerleri(kimlik, { lat: 40.9885, lng: 29.0295 })
      : Promise.resolve([])), [kimlik, tazele], []);

  /* Corner'daki "130 cities · SF New York Brooklyn" karosunun karşılığı.
     Kadıköy tek ilçe ama semt bu şehirde gerçek bir kimlik: Moda'da
     takılanla Yeldeğirmeni'nde takılan farklı insanlar. Çok pinlenenden
     aza sıralanıyor, ilk üçü karoda görünüyor. */
  const semtler = useMemo(() => {
    const say = new Map<string, number>();
    for (const y of yerleri) say.set(y.semt, (say.get(y.semt) ?? 0) + 1);
    return [...say.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [yerleri]);

  /* Boş durum kartının zemini: gerçek bir mekan fotoğrafı. Sorgu YALNIZCA
     pin ızgarası gerçekten boşken atılıyor; yüklenirken de atılmıyor, yoksa
     her profil açılışında bir istek fazladan giderdi. (veri.ts → davetGorseli) */
  const bosHarita = !!kimlik && !pinYukleniyor && pinleri.length === 0;
  const { veri: davetFoto } = useVeri<string | null>(
    () => (bosHarita ? davetGorseli() : Promise.resolve(null)), [bosHarita], null);

  if (!hedef) {
    return (
      <div className="min-h-0 flex-1 p-4">
        <p className="mb-3 text-sm leading-relaxed text-gri-600">
          Kendi haritanı görmek için giriş yap.
        </p>
        <button onClick={onGirisIste}
          className="rounded-full border-none bg-gri-900 px-4 py-3 text-sm font-semibold lowercase tracking-ui text-white shadow-kat-2">
          giriş yap
        </button>
      </div>
    );
  }
  if (!kisi) {
    return (
      <div className="min-h-0 flex-1 p-4 text-sm lowercase text-gri-600">
        profil yükleniyor…
      </div>
    );
  }
  const benim = oturumKisi?.id === kisi.id;
  const takipDurumu = takipYerel ?? takipte;

  /* Kademe C — BÜYÜK harf ama küçük punto, ferah aralık. */
  const bolum = "px-4 pb-2.5 text-2xs font-bold uppercase tracking-etiket text-gri-700";

  if (duzenlenen) {
    return (
      <ListeDuzenle
        liste={duzenlenen}
        onKapat={() => setDuzenlenen(null)}
        onKaydedildi={(yeni) => {
          setYama((y) => ({ ...y, [yeni.id]: yeni }));
          /* Açık liste sayfası da güncel kalsın: düzenlemeden ona
             dönülüyor, eski başlıkla karşılamamalı. */
          setAcikListe((a) => (a && a.id === yeni.id ? yeni : a));
          setDuzenlenen(null);
        }}
        onSilindi={() => {
          setYama((y) => ({ ...y, [duzenlenen.id]: null }));
          setAcikListe(null);
          setDuzenlenen(null);
        }}
      />
    );
  }

  if (acikListe) {
    return (
      /* sahibi ve düzenleme yetkisi artık ListeSayfasi'nin kendi işi:
         öneri şeridinden BAŞKASININ listesi açılabiliyor ve buradan
         geçirilen değerler o an yanlış olurdu. */
      <ListeSayfasi
        liste={acikListe}
        onKapat={() => setAcikListe(null)}
        onYerAc={onYerAc}
        onHaritada={onListeHaritada}
        onListeAc={setAcikListe}
        onDuzenle={() => setDuzenlenen(acikListe)}
      />
    );
  }

  return (
    /* Dış kutu kaydırmıyor: yüzen düğmeler onun içinde sabit duruyor,
       içerik altından akıyor. Düğmeler kaydıran kutunun içinde olsaydı
       yukarı çıkıp kaybolurlardı. */
    <div className="relative min-h-0 flex-1">
      {/* ---- yüzen chrome ---- */}
      {onGeri && (
        <button
          onClick={onGeri}
          aria-label="Kendi profiline dön"
          className="cam absolute left-3 top-3 z-[5] grid size-9 place-items-center rounded-md border-none text-lg leading-none text-gri-900 shadow-kat-3"
        >
          ‹
        </button>
      )}
      <div className="absolute right-3 top-3 z-[5] flex gap-2">
        <button
          onClick={onPaylas}
          aria-label={benim ? "Haritamı paylaş" : "Bu profili paylaş"}
          className="cam grid size-9 place-items-center rounded-md border-none text-base leading-none text-gri-900 shadow-kat-3"
        >
          ↑
        </button>
        {benim && (
          <button
            onClick={onAyarlar}
            aria-label="Ayarlar"
            className="cam grid size-9 place-items-center rounded-md border-none pb-1.5 text-lg leading-none text-gri-900 shadow-kat-3"
          >
            ···
          </button>
        )}
      </div>

      <div className="size-full overflow-y-auto pb-[92px]">
        {/* ---- kimlik ----
            Avatar ve ad YAN YANA (Corner). Ad uzayınca sarıyor, kırpmıyor —
            min-w-0 olmadan flex satırı taşırıyordu. Üst boşluk yüzen
            düğmelerin altından başlasın diye geniş. */}
        <div className="flex items-center gap-3.5 px-4 pt-14">
          <Avatar kisi={kisi.id} boyut={76} />
          <div className="min-w-0 flex-1">
            {/* Kademe A: kişi adı — 800 ve sıkı, kullanıcının yazdığı kasada. */}
            <h2 className="text-2xl font-extrabold leading-none tracking-isim">{kisi.ad}</h2>
            <div className="mt-1.5 font-sayi text-sm text-gri-600">@{kisi.k}</div>
          </div>
        </div>

        {/* Takip sayıları Corner'da karo değil, adın altında tek satır:
            rakam siyah ve kalın, etiket küçük harf gri. Karo olsalardı
            pin/mekan sayılarıyla aynı ağırlıkta görünürlerdi — oysa bunlar
            haritanın değil hesabın sayıları. */}
        <div className="flex gap-4 px-4 pt-3 text-sm">
          <span>
            <b className="font-sayi font-bold">{kisi.takip}</b>{" "}
            <span className="lowercase text-gri-600">takip</span>
          </span>
          <span>
            <b className="font-sayi font-bold">{kisi.takipci}</b>{" "}
            <span className="lowercase text-gri-600">takipçi</span>
          </span>
        </div>

        {/* Bio insanın yazdığı metin → Karla. */}
        {kisi.bio && <p className="px-4 pt-2.5 font-metin text-sm leading-relaxed text-gri-800">{kisi.bio}</p>}

        {/* Sosyal hesaplar bio'nun hemen altında, referanstaki gibi soluk
            küçük işaretler. Kime güveneceğini seçmek o kişinin başka nerede
            ne paylaştığını görmekle başlıyor; ama bu profilin konusu değil,
            o yüzden gri ve küçük. Girilmeyen platform hiç çizilmiyor —
            boş bir ikon "burada bir şey yok" demenin en gürültülü yolu. */}
        {SOSYAL_SIRA.some((x) => kisi[x]) && (
          <div className="flex gap-3.5 px-4 pt-2.5">
            {SOSYAL_SIRA.map((x) => {
              const k = kisi[x];
              if (!k) return null;
              return (
                <a
                  key={x}
                  href={SOSYAL[x].url(k)}
                  target="_blank"
                  /* noreferrer şart: açılan sayfa window.opener üzerinden
                     bu sekmeyi yönlendirebilir. */
                  rel="noopener noreferrer"
                  aria-label={`${SOSYAL[x].ad}: @${k}`}
                  className="text-gri-500 transition-transform duration-[160ms] ease-out active:scale-90"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={SOSYAL[x].yol} />
                  </svg>
                </a>
              );
            })}
          </div>
        )}

        {/* ---- istatistik karoları ----
            Beyaz squircle, iri rakam üstte, küçük harf soluk etiket altta.
            Ayraç çizgisi yok — karonun zemini ve gölgesi ayrımı zaten
            yapıyor. */}
        <div className="flex gap-2 px-4 pb-4 pt-3.5">
          <div className="flex min-w-0 flex-[1.6] items-start gap-2.5 rounded-lg bg-yuzey px-3 py-2.5 shadow-kat-1">
            <div className="shrink-0">
              <b className="block text-2xl font-extrabold leading-none tracking-isim">{semtler.length}</b>
              <span className="mt-1.5 block text-xs font-bold lowercase tracking-ui text-gri-800">semt</span>
            </div>
            {/* Semt ADLARI etiketten daha hafif: sayı ve etiket karonun ne
                olduğunu söylüyor, adlar örnek. Referansta da şehir adları
                "cities"ten ince. */}
            <div className="min-w-0 flex-1 text-xs leading-snug text-gri-600">
              {semtler.slice(0, 3).map((s) => (
                <span key={s} className="block truncate">{s}</span>
              ))}
            </div>
          </div>
          {([
            [yerleri.length, "mekan"],
            [kisi.pinSayisi, "pin"],
          ] as [number, string][]).map(([n, ad]) => (
            <div key={ad} className="min-w-[68px] flex-1 rounded-lg bg-yuzey px-3 py-2.5 shadow-kat-1">
              {/* Rakam MONO DEĞİL: font-sayi hizalama gereken yerler için
                  (skor, sayaç). Burada rakam bir veri değil bir başlık —
                  referansta da altındaki etiketle aynı geometrik ailede,
                  daktilo gibi değil. */}
              <b className="block text-2xl font-extrabold leading-none tracking-isim">{n}</b>
              {/* Etiket kalın: ince griyken karonun altında asılı kalıyordu,
                  rakamla bir bütün okunmuyordu. */}
              <span className="mt-1.5 block text-xs font-bold lowercase tracking-ui text-gri-800">{ad}</span>
            </div>
          ))}
        </div>

        {/* Kendi profilinde siyah dolu düğme YOK: paylaş ve ayarlar yukarıda
            yüzüyor. Ekranın tek siyah çapası başkasının profilindeki takip
            düğmesi (skill §3). */}
        {!benim && (
          <div className="mb-4 px-4">
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
              className={`w-full rounded-full border-none px-3 py-3 text-sm font-semibold lowercase tracking-ui shadow-kat-1 ${
                takipDurumu ? "bg-yuzey text-gri-800" : "bg-gri-900 text-white"
              } disabled:opacity-50`}
            >
              {takipDurumu ? "takiptesin ✓" : "takip et"}
            </button>
          </div>
        )}

        {/* ---- listeler ----
            Profilin ASIL içeriği, bu yüzden pinlerden önce. İki sütunlu
            ızgara, kare kapaklar, ad kapağın altında (ListeKarti). Yatay
            şeritten ızgaraya geçiş bilinçli: şeritte ikinci listeden
            sonrası ekran dışında kalıyordu, oysa insanın seçkisi profilin
            en kişisel kısmı. */}
        <div className={bolum}>{benim ? "Listelerin" : kisi.ad + "’in listeleri"}</div>
        {gorunenListeler.length || benim ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 pb-6">
            {gorunenListeler.map((l, i) => (
              <div
                key={l.id}
                className="belir"
                /* Kademeli beliriş — ızgara tek blok hâlinde zıplamasın.
                   Sekizinciden sonra gecikme artmıyor, yoksa alttaki
                   kartlar fark edilir biçimde geç geliyor. */
                style={{ animationDelay: `${Math.min(i, 7) * 45}ms` }}
              >
                <ListeKarti liste={l} onAc={() => setAcikListe(l)} />
              </div>
            ))}
            {benim && <YeniListeKarosu onTikla={onListeOlustur} />}
          </div>
        ) : (
          <p className="px-4 pb-6 text-sm lowercase text-gri-600">
            {kisi.ad} henüz liste oluşturmamış.
          </p>
        )}

        {/* ---- kişisel harita ---- */}
        <div className={bolum}>{benim ? "Senin" : kisi.ad + "’in"} Kadıköy haritası</div>
        {/* Mini harita ÖLÜ bir resimdi: pinlerin nerede olduğunu gösteriyordu
            ama üstüne dokununca hiçbir şey olmuyordu. Artık ana haritayı bu
            kişinin pinlerine filtreleyip açıyor — şeritten birini seçmekle
            aynı sonuç, yalnızca giriş noktası farklı. */}
        <button
          onClick={() => onHaritada(kisi.id, benim ? "Senin pinlerin" : `${kisi.ad}’in pinleri`)}
          aria-label={`${benim ? "Senin" : kisi.ad + "’in"} pinlerini haritada göster`}
          className="relative mx-4 mb-5 block w-[calc(100%-2rem)] overflow-hidden rounded-lg border-none bg-su p-0 shadow-kat-1"
        >
          <MiniHarita yerler={yerleri} />
          <span className="absolute bottom-2 right-2 rounded-full bg-yuzey px-2.5 py-1 text-2xs font-semibold lowercase text-gri-800 shadow-kat-2">
            haritada gör
          </span>
        </button>

        {/* ---- pinler ---- */}
        <div className={bolum}>Pinler</div>
        {/* İki sütun: üç sütunda kart 108px'e iniyordu ve fotoğrafta ne
            olduğu seçilmiyordu — ızgara bir küçük resim duvarı gibi
            okunuyordu. İkiye inince kart ~172px, fotoğraf asıl işini
            görüyor.

            Ad fotoğrafın ÜSTÜNDE değil ALTINDA: karartma örtüsüne yazılan
            isim hem fotoğrafın bir kısmını yiyor hem küçük kalmak zorunda
            kalıyordu. Altına inince Kademe A tam ağırlığıyla yazılabiliyor.
            Ölçüler ListeKarti ile birebir aynı — iki ızgara alt alta
            duruyor, farklı olsalar profil iki ayrı uygulamadan derlenmiş
            gibi görünürdü. */}
        {pinleri.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 pb-6">
            {pinleri.map((p) => {
              /* Akıştaki kapakla aynı kural: ızgarada video oynatmıyoruz,
                 kapak yalnızca fotoğraftan geliyor. Demo pinlerin demo://
                 yolunda medyaUrl null dönüyor, o zaman simgeye düşüyor. */
              const ilk = p.medyalar[0];
              /* Kart 108px'ten ~172px'e çıktı; 2x retina karşılığı 400. */
              const kapak = ilk && ilk.tur !== "video" ? kucukUrl(medyaUrl(ilk.yol), 400) : null;
              return (
                <button
                  key={p.id}
                  /* Profilden bir pine dokunuyorsan o kişinin yazdığını
                     görmek istiyorsun, en çok beğenilen yabancı pini değil. */
                  onClick={() => onYerAc(p.yer, kisi.id)}
                  className="block w-full border-none bg-transparent p-0 text-left"
                >
                  <div
                    className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-lg shadow-kat-1"
                    style={{ background: fotoZemin(p.yerTuru) }}
                  >
                    {kapak ? (
                      <KartGorsel url={kapak} />
                    ) : (
                      <div className="opacity-60" dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 44, zeminSimgeRengi(p.yerTuru)) }} />
                    )}
                    {/* Cam rozet: ListeKarti'ndeki sayı rozetiyle aynı dil.
                        Puan fotoğrafın üstünde duruyor ama yazıyı ezmiyor —
                        ad artık aşağıda. */}
                    <span className="cam absolute bottom-2 left-2 rounded-full px-2 py-0.5 font-sayi text-2xs font-semibold text-gri-800">
                      {p.puan}
                    </span>
                  </div>
                  {/* Kademe A: mekan adı, fotoğrafın altında ortalı. */}
                  <div className="px-0.5 pt-2 text-center">
                    <div className="line-clamp-2 text-base font-extrabold leading-tight tracking-isim">
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
    </div>
  );
}
