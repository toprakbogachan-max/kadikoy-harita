"use client";

import { useState } from "react";
import { fotoZemin, simgeSvg, zeminSimgeRengi, zaman, egim } from "@/lib/gorsel";
import { emoji } from "@/lib/paleti";
import { useVeri } from "@/lib/kanca";
import {
  akisGetir, davetGorseli, kucukUrl, medyaUrl,
  begeniDegistir, begendiklerimden, kayitDegistir, kaydettiklerim,
  type AkisSekmesi,
} from "@/lib/veri";
import KartGorsel from "./KartGorsel";
import { useKisiler } from "@/lib/kisiler-baglam";
import { useOturum } from "@/lib/oturum";
import type { Pin } from "@/lib/model";
import Avatar from "./Avatar";
import BosDurum from "./BosDurum";
import KayanGecis from "./KayanGecis";
import KayanSecim from "./KayanSecim";
import DereceGostergesi from "./corner/DereceGostergesi";

/**
 * Akış — tanıdıklarının nereye gittiği.
 *
 * İki sekme: keşfet ve takip ettiklerim. "Popüler" kaldırıldı — keşfet
 * zaten bir sıralama yapıyordu ve üçüncü sekme ikisinin arasında kalan,
 * kimsenin niye açtığını bilmediği bir yüzeydi. İki seçenek bir SORU
 * soruyor ("herkes mi, benimkiler mi"); üçü liste oluyor.
 */
const SEKMELER = [
  { id: "kesfet", ad: "keşfet" },
  { id: "takip", ad: "takip ettiklerim" },
] as const;

/* Geçiş yönü için sekme sırası. Şeritteki baloncuk hangi yöne akıyorsa
   liste de o yönden geliyor — üstteki hareketle aynı. */
const SEKME_SIRASI = SEKMELER.map((s) => s.id);

/**
 * Kaçıncı kartlar BÜYÜK (tam genişlikte fotoğraflı) olsun.
 *
 * Akış tek boyda kartlardan oluşunca ritim düzleşiyor: yirmi kart aynı
 * yüksekliktedir ve göz hiçbirine takılmaz. Arada gelen büyük kart bir
 * nefes veriyor ve kaydırma "sıradaki ne" hissini koruyor.
 *
 * Dörtte bir: üç küçük, bir büyük. Daha sık olursa akış bir fotoğraf
 * duvarına dönüyor ve bu uygulamanın konusu fotoğraf değil, NOT.
 */
const BUYUK_RITIM = 4;
const BUYUK_SIRA = 2;

export default function Akis({ onGonderiAc }: { onGonderiAc: (id: string, liste: string[]) => void }) {
  const [sekme, setSekme] = useState<AkisSekmesi>("kesfet");
  const kisiler = useKisiler();
  const { ben } = useOturum();

  /* Süzme ve sıralama artık veritabanında — sekme değişince yeni sorgu.
     "Takip" sekmesi follows tablosunu okuyor, sabit liste kalmadı. */
  const { veri: sirali, yukleniyor, hata } = useVeri<Pin[]>(
    () => akisGetir(sekme),
    [sekme],
    [],
  );

  const idler = sirali.map((p) => p.id);

  /* Beğeni ve kayıt durumu kart başına DEĞİL, akış başına tek sorguyla
     geliyor (veri.ts → begendiklerimden). 20 kart için 20 istek atmak
     düğmeleri eklemenin bedeli olamazdı. */
  const anahtar = idler.join(",");
  const { veri: begenilenler } = useVeri<Set<string>>(
    () => (ben ? begendiklerimden(idler) : Promise.resolve(new Set<string>())),
    [anahtar, ben?.id], new Set<string>());
  const { veri: kayitliYerler } = useVeri<string[]>(
    () => (ben ? kaydettiklerim() : Promise.resolve([])), [ben?.id], []);

  /* Sunucu durumunun ÜSTÜNE binen yerel değişiklikler: kullanıcı bir kalbe
     bastığında sorguyu baştan çalıştırmak hem yavaş, hem de listeyi
     yeniden sıralayabilir. Anahtarda yoksa sunucu ne diyorsa o. */
  const [begeniYama, setBegeniYama] = useState<Record<string, boolean>>({});
  const [kayitYama, setKayitYama] = useState<Record<string, boolean>>({});

  /* Boş durum kartının zemini: gerçek bir mekan fotoğrafı. Sorgu YALNIZCA
     liste boşken atılıyor — `bos` false'ken getir hemen null dönüyor, yani
     dolu akışta fazladan istek yok. (veri.ts → davetGorseli) */
  const bos = !yukleniyor && !hata && sirali.length === 0;
  const { veri: davetFoto } = useVeri<string | null>(
    () => (bos ? davetGorseli() : Promise.resolve(null)),
    [bos],
    null,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Sekmeler tek bir BEYAZ RAY içinde, aktif olan rayın içinde akan
          baloncuk. Önceden her sekme ayrı beyaz bir haptı ve baloncuk
          onların arkasında dilimleniyordu; ray olunca segmentler saydam
          kalıyor ve baloncuk serbestçe uzayabiliyor — gerçek bir segmented
          control, videodaki "near you / following" rayının aynısı. */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <KayanSecim
          aktif={sekme}
          className="inline-flex gap-1 rounded-full bg-yuzey p-1 shadow-kat-1"
          baloncuk="baloncuk rounded-full"
        >
          {SEKMELER.map((s) => {
            const aktif = sekme === s.id;
            return (
              <button
                key={s.id}
                data-kayan={s.id}
                onClick={() => setSekme(s.id)}
                aria-selected={aktif}
                role="tab"
                className={`shrink-0 whitespace-nowrap rounded-full border-none bg-transparent px-4 py-2 text-sm font-semibold lowercase tracking-ui transition-[color,transform] duration-[200ms] ease-out active:scale-95 ${
                  aktif ? "text-white" : "text-gri-600"
                }`}
              >
                {s.ad}
              </button>
            );
          })}
        </KayanSecim>
      </div>

      {/* pb: yüzen alt menünün altında kalan kart olmasın.
          Kartlar arası boşluk geniş: eylem düğmeleri kartın alt kenarına
          BİNİYOR ve aşağı taşıyor, dar boşlukta bir sonraki kartın üstüne
          otururlardı. */}
      <KayanGecis anahtar={sekme} sira={SEKME_SIRASI} className="min-h-0 flex-1 overflow-y-auto px-4 pb-[92px] pt-1">
        {sirali.length ? (
          <div className="flex flex-col gap-7">
            {sirali.map((p, i) => {
              const medya = p.medyalar;
              const video = medya[0]?.tur === "video";
              const coklu = medya.length > 1;
              /* ızgarada video oynatmıyoruz; kapak yalnızca fotoğraftan */
              const kapakYolu = video ? null : medyaUrl(medya[0]?.yol ?? "");
              /* Büyük kart tam genişlikte: 104 piksellik küçük kopya orada
                 bulanık kalırdı. Küçükte tersi geçerli — 800 piksellik
                 dosyayı 104'lük kutuya indirmek boşa trafik. */
              const buyuk = !!kapakYolu && i % BUYUK_RITIM === BUYUK_SIRA;
              const kapak = kucukUrl(kapakYolu, buyuk ? 800 : 240);
              const kisiAdi = kisiler[p.kisi]?.ad ?? "";
              /* Uygulamanın kendi cümlesi: kullanıcının yazdığı not değil,
                 yapılandırılmış alanlardan kuruluyor. Aşağıda italik
                 veriliyor — bkz. kart içindeki yorum. */
              const turetilen = [p.senaryo, p.kelimeler.slice(0, 3).join(" · ")]
                .filter(Boolean)
                .join(" — ");

              const sunucudaBegendim = begenilenler.has(p.id);
              const begendim = begeniYama[p.id] ?? sunucudaBegendim;
              const kayitli = kayitYama[p.yer] ?? kayitliYerler.includes(p.yer);
              /* Sayaç sunucudan geldiği gibi duruyor; yerel dokunuş varsa
                 farkı ekliyoruz. Yoksa kalbe basınca ikon doluyor ama sayı
                 aynı kalıyor ve "işlem gitmedi mi" hissi oluşuyor. */
              const begeniSayisi = p.begeni + (begendim === sunucudaBegendim ? 0 : begendim ? 1 : -1);

              /* Kimlik satırı + mekan adı iki kartta da aynı. Avatar SOL
                 KENARDAN DIŞARI taşıyor: kartın içinde hizalı dursaydı
                 metnin bir parçası gibi okunurdu, oysa oraya giden kişi
                 karta sonradan iliştirilmiş bir mühür gibi durmalı. */
              const kimlik = (
                <div className="flex gap-3">
                  {/* -ml: kart dolgusu 14px, avatar 8px dışarı çıkıyor.
                      Kartta overflow-hidden YOK, yoksa kırpılırdı. */}
                  <div className="-ml-[22px] shrink-0">
                    <Avatar kisi={p.kisi} boyut={52} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-gri-600">
                      {/* Kademe A: kişi adı özel isim. */}
                      <span className="truncate font-bold tracking-siki text-gri-900">{kisiAdi}</span>
                      <span className="shrink-0 lowercase">pinledi</span>
                      <span className="shrink-0 text-gri-400">· {zaman(p.saat)}</span>
                    </div>
                    {/* Kademe A: mekan adı BÜYÜK + 800 + sıkı. Kategoriyi
                        emoji taşıyor — çipteki kuralla aynı, renk arayüze
                        girmiyor. Kırpmıyor, iki satıra sarıyor. */}
                    <h3 className="mt-1 line-clamp-2 text-lg font-extrabold uppercase leading-tight tracking-siki">
                      <span aria-hidden className="mr-1.5 font-normal tracking-normal">{emoji(p.yerTuru)}</span>
                      {p.yerAdi}
                    </h3>
                    <div className="mt-0.5 truncate text-xs lowercase text-gri-600">{p.yerSemt}</div>
                  </div>
                </div>
              );

              const yazilar = (
                <>
                  {p.metin && (
                    /* İnsanın yazdığı cümle: DÜZ yazı ve Karla (font-metin).
                       Arayüzün sesi Inter; yazı tipi farkı "bunu bir insan
                       yazdı" ayrımını taşıyor. */
                    <p className="mt-2.5 line-clamp-3 font-metin text-sm leading-snug text-gri-800">{p.metin}</p>
                  )}
                  {/* Uygulamanın kurduğu cümle: İTALİK ve soluk. Corner'ın
                      "from corner — …" satırıyla aynı iş: tek bakışta "bunu
                      bir insan mı yazdı yoksa uygulama mı derledi" sorusunu
                      stil cevaplıyor. */}
                  {turetilen && (
                    <p className="mt-1.5 line-clamp-2 text-xs italic leading-snug text-gri-500">
                      {turetilen}
                    </p>
                  )}
                </>
              );

              const rozetler = (video || coklu) && (
                <span className="absolute right-1.5 top-1.5 flex gap-1">
                  {video && (
                    <span className="grid size-[19px] place-items-center rounded-full bg-[rgba(20,15,8,.62)] text-[8px] text-white">▶</span>
                  )}
                  {coklu && (
                    <span className="grid size-[19px] place-items-center rounded bg-[rgba(20,15,8,.62)] text-2xs text-white">▤</span>
                  )}
                </span>
              );

              return (
                /* Kart artık tek bir <button> DEĞİL: içinde eylem düğmeleri
                   var ve düğme içinde düğme geçersiz HTML. Gövde kendi
                   başına düğme, eylem satırı onun kardeşi — klavyeyle de
                   ikisi ayrı ayrı geziliyor.
                   pb-6: eylem düğmeleri alt kenara binerken metnin üstüne
                   gelmesinler. */
                <article key={p.id} className="relative rounded-lg bg-yuzey pb-6 shadow-kat-1">
                  <button
                    onClick={() => onGonderiAc(p.id, idler)}
                    className="block w-full border-none bg-transparent p-0 text-left"
                  >
                    {buyuk ? (
                      /* ---- BÜYÜK KART ----
                         Fotoğraf tam genişlikte ve üstte; kimlik ve not
                         altında. Eğiklik YOK: eğiklik küçük karttaki
                         fotoğrafı "kartın üstüne konmuş bir baskı" yapıyor,
                         tam genişlikte bir fotoğraf ise kartın kendisi. */
                      <>
                        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-lg">
                          <div className="grid size-full place-items-center" style={{ background: fotoZemin(p.yerTuru) }}>
                            {kapak && <KartGorsel url={kapak} />}
                          </div>
                          {rozetler}
                        </div>
                        <div className="px-3.5 pt-3.5">
                          {kimlik}
                          {yazilar}
                        </div>
                      </>
                    ) : (
                      /* ---- KÜÇÜK KART ----
                         Solda kimlik + not, sağda dikey fotoğraf. Not
                         avatarın ALTINDAN akıp fotoğraftan önce sarıyor. */
                      <div className="flex gap-3 p-3.5">
                        <div className="flex min-w-0 flex-1 flex-col">
                          {kimlik}
                          {yazilar}
                        </div>
                        {/* Hafif eğiklik: fotoğraf kartın bir bölmesi değil,
                            üstüne bırakılmış bir baskı gibi dursun. Açı
                            karttan karta değişiyor (gorsel.ts → egim) —
                            hepsi aynı yöne eğik olsaydı hata gibi görünürdü.
                            Bir dereceden küçük açılar kutuyu ~1px taşırıyor,
                            kartın dolgusu bunu zaten karşılıyor. */}
                        {/* egim() ±0.4–0.9 derece veriyor; o ölçek jeton
                            pinleri için kalibre edilmişti ve kart boyunda
                            neredeyse görünmüyor. İki katı referanstaki
                            eğikliğe denk geliyor, hâlâ "bozuk" demeyecek
                            kadar az. */}
                        <div className="shrink-0" style={{ transform: `rotate(${egim(i) * 2}deg)` }}>
                          <div className="relative h-[132px] w-[104px] overflow-hidden rounded-md shadow-kat-2">
                            <div
                              className="grid size-full place-items-center"
                              style={{ background: fotoZemin(p.yerTuru) }}
                            >
                              {kapak ? (
                                <KartGorsel url={kapak} />
                              ) : (
                                <span
                                  className="opacity-60"
                                  dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 30, zeminSimgeRengi(p.yerTuru)) }}
                                />
                              )}
                            </div>
                            {rozetler}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Alt kenara BİNEN şerit — yarısı kartın içinde, yarısı
                      dışarıda. Kartın içinde sıradan bir satır olsalardı
                      nottan sonra gelen bir bilgi gibi okunurlardı; kenara
                      oturunca karta iliştirilmiş kontroller oluyorlar.
                      Beyaz zemin ve gölge bu yüzden şart: alt yarıları
                      kağıt zeminin üstünde duruyor.

                      Uyum skoru da aynı şeritte ve aynı hapta: kartın
                      içinde ayrı bir satır olarak dururken düğmelerle
                      hizasız kalıyor ve arada boş bir bant bırakıyordu. */}
                  <div className="absolute inset-x-3.5 bottom-0 flex translate-y-1/2 items-center gap-2">
                    {/* Puan artık ham sayı değil derece göstergesi (E1):
                        kademe + sayı. Kendi hapını taşıdığı için eski hap
                        kabuğu kalktı; kat 2, çünkü kartın kenarına oturuyor
                        ve yanındaki eylem düğmeleriyle aynı katmanda. */}
                    {p.puan != null && (
                      <DereceGostergesi puan={p.puan} bicim="tek" puanGoster kat={2} className="shrink-0" />
                    )}
                    <span className="ml-auto flex items-center gap-2">
                    <EylemDugmesi
                      etiket={kayitli ? "Kaydı kaldır" : "Mekanı kaydet"}
                      dolu={kayitli}
                      kapali={!ben}
                      onTikla={async () => {
                        const su = kayitli;
                        setKayitYama((y) => ({ ...y, [p.yer]: !su }));
                        try { await kayitDegistir(p.yer, su); }
                        catch { setKayitYama((y) => ({ ...y, [p.yer]: su })); }
                      }}
                    >
                      <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-4-6 4v-14a1 1 0 0 1 1-1z" />
                    </EylemDugmesi>

                    <EylemDugmesi
                      etiket="Yorumlar"
                      sayi={p.yorumSayisi}
                      onTikla={() => onGonderiAc(p.id, idler)}
                    >
                      <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4.5 20l1.3-4.4A7.5 7.5 0 1 1 20 12z" />
                    </EylemDugmesi>

                    <EylemDugmesi
                      etiket={begendim ? "Beğeniyi geri al" : "Beğen"}
                      dolu={begendim}
                      sayi={begeniSayisi}
                      kapali={!ben}
                      onTikla={async () => {
                        const su = begendim;
                        setBegeniYama((y) => ({ ...y, [p.id]: !su }));
                        try { await begeniDegistir(p.id, su); }
                        catch { setBegeniYama((y) => ({ ...y, [p.id]: su })); }
                      }}
                    >
                      <path d="M12 20s-7.4-4.6-7.4-9.5a4.3 4.3 0 0 1 7.4-3 4.3 4.3 0 0 1 7.4 3c0 4.9-7.4 9.5-7.4 9.5z" />
                    </EylemDugmesi>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : hata || yukleniyor ? (
          <p className="px-1 py-6 text-sm leading-relaxed text-gri-600">
            {hata ? `Akış yüklenemedi: ${hata}` : "Akış yükleniyor…"}
          </p>
        ) : (
          /* Boş durum bir hata değil, uygulamanın en güçlü davet anı
             (skill §6). Boş beyaz alan yerine çağrı kartı. */
          <BosDurum
            foto={kucukUrl(davetFoto, 800)}
            baslik={sekme === "takip" ? "kimse pin atmamış" : "bu hafta sessiz"}
            alt={sekme === "takip"
              ? "keşfet sekmesinden birilerini bul, akışın dolsun."
              : "ilk pini sen at, burası seninle başlasın."}
          />
        )}
      </KayanGecis>
    </div>
  );
}

/**
 * Kartın alt kenarına binen yuvarlak eylem düğmesi.
 *
 * Beyaz ve gölgeli: yarısı kartın dışında, kağıt zeminin üstünde duruyor.
 * Saydam olsaydı o yarısı zemine karışırdı.
 *
 * "Dolu" durumu rengi değil ŞEKLİ değiştiriyor — ikon kendi içini
 * dolduruyor. Kırmızı bir kalp doygun renk olurdu ve renk arayüz
 * iskeletinde yaşamıyor (skill §3); dolu/boş ayrımı renk körlüğünde de
 * çalışıyor.
 */
function EylemDugmesi({
  etiket, children, onTikla, dolu = false, sayi, kapali = false,
}: {
  etiket: string;
  children: React.ReactNode;
  onTikla: () => void;
  dolu?: boolean;
  sayi?: number;
  /** Giriş yapılmamış: düğme duruyor ama çalışmıyor (RLS zaten reddederdi). */
  kapali?: boolean;
}) {
  return (
    <button
      onClick={onTikla}
      disabled={kapali}
      aria-label={sayi ? `${etiket} (${sayi})` : etiket}
      aria-pressed={dolu}
      className={`flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--cizgi)] bg-yuzey px-3 shadow-kat-2 transition-[transform,color] duration-[160ms] ease-out active:scale-90 disabled:opacity-45 ${
        dolu ? "text-gri-900" : "text-gri-500"
      }`}
    >
      <svg
        width="17" height="17" viewBox="0 0 24 24"
        fill={dolu ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      >
        {children}
      </svg>
      {/* Sıfır sayı gösterilmiyor: "0 yorum" bilgi değil, gürültü. */}
      {!!sayi && <span className="font-sayi text-2xs leading-none">{sayi}</span>}
    </button>
  );
}
