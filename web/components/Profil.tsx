"use client";

import { igneStil, egim, fotoZemin, simgeSvg } from "@/lib/gorsel";
import { useState } from "react";
import { useVeri } from "@/lib/kanca";
import { profilGetir, kisininPinleri, kisininListeleri, kisininYerleri, takipDegistir, takiptemiyim, medyaUrl } from "@/lib/veri";
import { useOturum } from "@/lib/oturum";
import type { Yer, Pin, Kisi, Liste } from "@/lib/model";
import Avatar from "./Avatar";
import MiniHarita from "./MiniHarita";
import ListeSayfasi from "./ListeSayfasi";
import KartGorsel from "./KartGorsel";

export default function Profil({
  kullaniciAdi,
  onYerAc,
  onGirisIste,
  onPaylas,
  onAyarlar,
  onListeOlustur,
}: {
  /** boşsa oturumdaki kişi gösterilir */
  kullaniciAdi?: string;
  onYerAc: (id: string, oncelikliKisi?: string) => void;
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
  const { veri: pinleri } = useVeri<Pin[]>(
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

  if (!hedef) {
    return (
      <div className="min-h-0 flex-1 bg-kagit p-4">
        <p className="mb-3 text-[13.5px] leading-relaxed text-murekkep2">
          Kendi haritanı görmek için giriş yap.
        </p>
        <button onClick={onGirisIste}
          className="rounded-sm border-none bg-jeton px-3.5 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white">
          Giriş yap
        </button>
      </div>
    );
  }
  if (!kisi) {
    return (
      <div className="min-h-0 flex-1 bg-kagit p-4 text-[13px] text-murekkep2">
        Profil yükleniyor…
      </div>
    );
  }
  const benim = oturumKisi?.id === kisi.id;
  const takipDurumu = takipYerel ?? takipte;

  const baslik = "px-4 pb-2.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2";

  if (acikListe) {
    return (
      <ListeSayfasi
        liste={acikListe}
        sahibi={benim ? undefined : kisi.ad}
        onKapat={() => setAcikListe(null)}
        onYerAc={onYerAc}
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-kagit">
      <div className="flex items-center gap-3.5 p-4">
        <Avatar kisi={kisi.id} boyut={62} />
        <div className="flex-1">
          <div className="text-[19px] font-semibold leading-tight">{kisi.ad}</div>
          <div className="mt-0.5 font-sayi text-[12px] text-murekkep2">@{kisi.k}</div>
        </div>
      </div>

      <p className="px-4 pb-3 text-[13.5px] leading-relaxed">{kisi.bio}</p>

      <div className="flex px-4 pb-3.5">
        {[
          [kisi.pinSayisi, "pin"],
          [yerleri.length, "mekan"],
          [kisi.takipci, "takipçi"],
          [kisi.takip, "takip"],
        ].map(([n, ad], i) => (
          <div key={ad as string} className={`flex-1 text-center ${i ? "border-l border-[var(--cizgi)]" : ""}`}>
            <b className="block font-sayi text-[16px]">{n as number}</b>
            <span className="font-tabela text-[9.5px] uppercase tracking-[0.12em] text-murekkep2">{ad as string}</span>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex gap-2 px-4">
        {benim ? (
          <>
            <button
              onClick={onPaylas}
              className="flex-1 rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white"
            >
              Haritamı paylaş
            </button>
            <button
              onClick={onAyarlar}
              className="flex-1 rounded-sm border border-[var(--cizgi)] bg-yuzey px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em]"
            >
              Ayarlar
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
            className={`flex-1 rounded-sm px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] ${
              takipDurumu
                ? "border border-[var(--cizgi)] bg-yuzey text-murekkep"
                : "border-none bg-jeton text-white"
            } disabled:opacity-50`}
          >
            {takipDurumu ? "Takiptesin" : "Takip et"}
          </button>
        )}
      </div>

      <div className={baslik}>{benim ? "Senin" : kisi.ad + "’in"} Kadıköy haritası</div>
      <div className="mx-4 mb-3.5 overflow-hidden rounded-sm bg-su shadow-kagit">
        <MiniHarita yerler={yerleri} />
      </div>

      {/* Liste oluşturma yalnızca Ayarlar → Arşiv → Listelerim'in içinde
          duruyordu. Profilde "Listelerin" bölümü ve "Henüz listen yok." boş
          durumu vardı ama oradan liste açmanın yolu yoktu — özelliği görüp
          nasıl kullanacağını bulamıyordun. */}
      <div className={`${baslik} flex items-center justify-between`}>
        <span>{benim ? "Listelerin" : kisi.ad + "’in listeleri"}</span>
        {benim && (
          <button onClick={onListeOlustur}
            className="border-none bg-transparent p-0 font-tabela text-[11px] uppercase tracking-[0.11em] text-jeton">
            + Yeni liste
          </button>
        )}
      </div>
      {listeleri.length ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {listeleri.map((l, i) => {
            const ilk = l.yerler.slice(0, 3);
            return (
              <button
                key={l.id}
                onClick={() => setAcikListe(l)}
                style={{
                  ["--pin" as string]: "#B8801A",
                  ["--pin-isik" as string]: "#E0A33E",
                  ["--pin-koyu" as string]: "#8A5E0E",
                  transform: `rotate(${egim(i)}deg)`,
                }}
                className="relative w-[158px] shrink-0 rounded-sm border-none bg-[#EFE6CC] px-[3px] pt-[3px] shadow-kagit"
              >
                <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                <div className="flex h-[60px] overflow-hidden rounded-sm">
                  {ilk.map((y) => (
                    <div key={y.id} className="flex-1" style={{ background: fotoZemin(y.tur) }} />
                  ))}
                </div>
                <div className="px-2 pb-3 pt-2.5 text-left">
                  <div className="mb-1 text-[13px] font-semibold leading-tight">{l.baslik}</div>
                  <div className="font-sayi text-[10.5px] text-murekkep2">{l.yerler.length} mekan</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-4 pb-5 text-[13px] text-murekkep2">
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
          {pinleri.map((p, i) => {
            /* Akıştaki kapakla aynı kural: ızgarada video oynatmıyoruz,
               kapak yalnızca fotoğraftan geliyor. Demo pinlerin demo://
               yolunda medyaUrl null dönüyor, o zaman simgeye düşüyor. */
            const ilk = p.medyalar[0];
            const kapak = ilk && ilk.tur !== "video" ? medyaUrl(ilk.yol) : null;
            return (
              <button
                key={p.id}
                /* Profilden bir pine dokunuyorsan o kişinin yazdığını
                   görmek istiyorsun, en çok beğenilen yabancı pini değil. */
                onClick={() => onYerAc(p.yer, kisi.id)}
                style={{ ...igneStil(p.yerTuru), transform: `rotate(${egim(i)}deg)` }}
                className="relative aspect-[0.86] rounded-sm border-none bg-[var(--kag)] p-[3px] shadow-kagit"
              >
                <span className="absolute -top-1 left-1/2 z-[2] size-2 -translate-x-1/2 rounded-full shadow-[0_1.5px_2px_rgba(74,58,30,.4)] [background:radial-gradient(circle_at_34%_30%,#fff_0%,var(--pin-isik)_16%,var(--pin)_55%,var(--pin-koyu)_100%)]" />
                <div
                  className="relative grid size-full place-items-center overflow-hidden rounded-sm"
                  style={{ background: fotoZemin(p.yerTuru) }}
                >
                  {kapak ? (
                    <KartGorsel url={kapak} />
                  ) : (
                    <div className="opacity-30" dangerouslySetInnerHTML={{ __html: simgeSvg(p.yerTuru, 26) }} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(0,0,0,.6)] to-transparent px-1.5 pb-1.5 pt-3.5 text-left text-[10px] font-semibold leading-tight text-white">
                    {p.yerAdi}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-4 pb-6 text-[13px] text-murekkep2">Henüz pin atmadın.</p>
      )}
    </div>
  );
}
