"use client";

import { useState } from "react";
import { fotoZemin, simgeSvg, zeminSimgeRengi, zaman } from "@/lib/gorsel";
import { emoji } from "@/lib/paleti";
import { useVeri } from "@/lib/kanca";
import { akisGetir, davetGorseli, kucukUrl, medyaUrl, type AkisSekmesi } from "@/lib/veri";
import KartGorsel from "./KartGorsel";
import { useKisiler } from "@/lib/kisiler-baglam";
import type { Pin } from "@/lib/model";
import Avatar from "./Avatar";
import BosDurum from "./BosDurum";

/* Üç sekmenin sıralaması kasıtlı olarak farklı — aynı olursa biri
   diğerinin kopyası olur (BRIEF → Üç yüzey). */
const SEKMELER = [
  { id: "kesfet", ad: "keşfet" },
  { id: "populer", ad: "popüler" },
  { id: "takip", ad: "takip" },
] as const;

export default function Akis({ onGonderiAc }: { onGonderiAc: (id: string, liste: string[]) => void }) {
  const [sekme, setSekme] = useState<AkisSekmesi>("kesfet");
  const kisiler = useKisiler();

  /* Süzme ve sıralama artık veritabanında — sekme değişince yeni sorgu.
     "Takip" sekmesi follows tablosunu okuyor, sabit liste kalmadı. */
  const { veri: sirali, yukleniyor, hata } = useVeri<Pin[]>(
    () => akisGetir(sekme),
    [sekme],
    [],
  );

  const idler = sirali.map((p) => p.id);

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
      {/* Sekmeler: aktif olan koyu dolu hap, pasifler düz. Post-it kağıdı ve
          eğiklik kalktı — akışın rengi artık fotoğraflardan gelsin. */}
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SEKMELER.map((s) => {
          const aktif = sekme === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSekme(s.id)}
              aria-selected={aktif}
              role="tab"
              className={`shrink-0 whitespace-nowrap rounded-full border-none px-4 py-2 text-sm font-semibold lowercase tracking-ui transition-colors ${
                aktif ? "bg-gri-900 text-white shadow-kat-2" : "bg-yuzey text-gri-700 shadow-kat-1"
              }`}
            >
              {s.ad}
            </button>
          );
        })}
      </div>

      {/* pb: yüzen alt menünün altında kalan kart olmasın */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[92px] pt-1">
        {sirali.length ? (
          <div className="flex flex-col gap-3">
            {sirali.map((p) => {
              const medya = p.medyalar;
              const video = medya[0]?.tur === "video";
              const coklu = medya.length > 1;
              /* ızgarada video oynatmıyoruz; kapak yalnızca fotoğraftan */
              /* 104 pikselik kutuya 1600 pikselik dosya inmesin: küçük kopya
                 (veri.ts → kucukUrl) 2x için 224 piksel istiyor. */
              const kapak = video ? null : kucukUrl(medyaUrl(medya[0]?.yol ?? ""), 224);
              const kisiAdi = kisiler[p.kisi]?.ad ?? "";
              /* Uygulamanın kendi cümlesi: kullanıcının yazdığı not değil,
                 yapılandırılmış alanlardan kuruluyor. Aşağıda italik
                 veriliyor — bkz. kart içindeki yorum. */
              const turetilen = [p.senaryo, p.kelimeler.slice(0, 3).join(" · ")]
                .filter(Boolean)
                .join(" — ");

              return (
                <button
                  key={p.id}
                  onClick={() => onGonderiAc(p.id, idler)}
                  className="w-full rounded-lg border-none bg-yuzey p-3 text-left shadow-kat-1"
                >
                  <div className="flex gap-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-1.5 text-xs text-gri-600">
                        <Avatar kisi={p.kisi} boyut={22} sekil="daire" />
                        {/* Kademe A: kişi adı özel isim. */}
                        <span className="truncate font-bold tracking-siki text-gri-900">{kisiAdi}</span>
                        <span className="shrink-0 lowercase">pinledi</span>
                        <span className="shrink-0 text-gri-400">· {zaman(p.saat)}</span>
                      </div>

                      {/* Kademe A: mekan adı BÜYÜK + 800 + sıkı. Kategoriyi
                          emoji taşıyor — çipteki kuralla aynı, renk arayüze
                          girmiyor. */}
                      <h3 className="mt-1.5 truncate text-lg font-extrabold uppercase leading-tight tracking-siki">
                        <span aria-hidden className="mr-1.5 font-normal tracking-normal">{emoji(p.yerTuru)}</span>
                        {p.yerAdi}
                      </h3>
                      <div className="mt-0.5 truncate text-xs lowercase text-gri-600">{p.yerSemt}</div>

                      {/* İnsanın yazdığı cümle: DÜZ yazı ve Karla (font-metin).
                          Arayüzün sesi Inter; yazı tipi farkı "bunu bir insan
                          yazdı" ayrımını italik/düze ek olarak taşıyor. */}
                      {p.metin && (
                        <p className="mt-2 line-clamp-3 font-metin text-sm leading-snug text-gri-800">{p.metin}</p>
                      )}

                      {/* Uygulamanın kurduğu cümle: İTALİK ve soluk.
                          Corner'ın "from corner — …" satırıyla aynı iş: tek
                          bakışta "bunu bir insan mı yazdı yoksa uygulama mı
                          derledi" sorusunu yazı stili cevaplıyor. Aynı ayrım
                          MekanSayfasi'ndaki özet cümlelerinde de geçerli. */}
                      {turetilen && (
                        <p className="mt-1.5 line-clamp-2 text-xs italic leading-snug text-gri-500">
                          {turetilen}
                        </p>
                      )}
                    </div>

                    <div className="relative size-[104px] shrink-0 overflow-hidden rounded-md">
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
                      {(video || coklu) && (
                        <span className="absolute right-1.5 top-1.5 flex gap-1">
                          {video && (
                            <span className="grid size-[19px] place-items-center rounded-full bg-[rgba(20,15,8,.62)] text-[8px] text-white">▶</span>
                          )}
                          {coklu && (
                            <span className="grid size-[19px] place-items-center rounded bg-[rgba(20,15,8,.62)] text-2xs text-white">▤</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alt satır: uyum skoru solda (uygulamanın ayırt edici
                      ölçüsü), etkileşim sayıları sağda. */}
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-gri-500">
                    {p.puan != null && (
                      <span className="font-sayi text-sm font-bold text-gri-900">{p.puan}<span className="text-xs font-normal text-gri-500">/10</span></span>
                    )}
                    <span className="ml-auto flex items-center gap-1">♥ {p.begeni}</span>
                    <span className="flex items-center gap-1">💬 {p.yorumSayisi}</span>
                  </div>
                </button>
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
      </div>
    </div>
  );
}
