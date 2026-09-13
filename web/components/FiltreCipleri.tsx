"use client";

import { useState } from "react";
import { TUR_AD, emoji } from "@/lib/paleti";

/* Kategori artık RENKLE değil EMOJİYLE taşınıyor.
   Sebep (skill §3 + §6): doygun renk arayüz iskeletinde yaşamaz — çipin
   üstündeki 7px'lik nokta bile "doygun renkli UI elemanı" sayılıyor ve
   kontrol listesi bunun sıfır olmasını istiyor. Emoji hem rengi arayüzden
   çıkarıyor hem de düz metin etiketten çok daha hızlı taranıyor. */
const SIMGESI: Record<string, string> = {
  hepsi: "🌐",
  takip: "👥",
  kaydettiklerim: "🔖",
  acik: "🟢",
  tur: "🏷️",
};

/* Üst sıra: uygulamanın ekseni olan filtreler. Kategoriler burada DEĞİL —
   dokuz kategori çipi on dört öğelik bir şerit yapıyordu ve kategoriye göre
   süzmek rehber davranışı; bu uygulamanın ekseni ise insanlar. */
const ANA = [
  { id: "hepsi", ad: "hepsi" },
  { id: "takip", ad: "takip ettiklerim" },
  { id: "kaydettiklerim", ad: "kaydettiklerim" },
  { id: "acik", ad: "şu an açık" },
];

const TURLER = Object.keys(TUR_AD).map((t) => ({ id: t, ad: TUR_AD[t].toLocaleLowerCase("tr") }));

const cipSimgesi = (id: string) => SIMGESI[id] ?? (TUR_AD[id] ? emoji(id) : SIMGESI.hepsi);

/* Modül seviyesinde: render içinde bileşen tanımlamak her render'da yeni bir
   tip üretir, React ağacı söküp yeniden kurar. */
function Cip({ id, ad, aktif, onTikla }: {
  id: string; ad: string; aktif: boolean; onTikla: () => void;
}) {
  return (
    <button
      onClick={onTikla}
      aria-pressed={aktif}
      /* Kademe B: arayüz küçük harf konuşur. Aktif çip ekrandaki
         siyah çapa — haritada bundan başka dolu siyah eleman yok. */
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-none py-2 pl-3 pr-3.5 text-sm font-semibold lowercase tracking-ui shadow-kat-2 transition-colors ${
        aktif ? "bg-gri-900 text-white" : "bg-yuzey text-gri-800"
      }`}
    >
      <span aria-hidden className="text-sm leading-none">{cipSimgesi(id)}</span>
      {ad}
    </button>
  );
}

/** Haritanın üstünde yüzen filtre şeridi. */
export default function FiltreCipleri({
  secili,
  onSec,
}: {
  secili: string;
  onSec: (id: string) => void;
}) {
  /* Seçili bir kategori varsa "Tür" çipi onun adını taşıyor ve aktif görünüyor
     — yoksa kullanıcı hangi süzgecin açık olduğunu göremezdi. */
  const seciliTur = TURLER.find((t) => t.id === secili);
  const [turAcik, setTurAcik] = useState(false);

  /* Şerit artık dolu bir bar değil: çipler doğrudan haritanın üstünde yüzen
     beyaz pill'ler. Arkalarında krem perde YOK — perde haritanın üstünde sert
     bir yatay çizgi bırakıyordu; çiplerin kendi gölgesi ayrımı zaten yapıyor. */
  return (
    <div className="shrink-0 pt-2">
      {/* Şerit "Tür"e kadar kayıyor ama scrollbar'ı gizli (aşağıda), bu yüzden
          sağda kaymanın devam ettiğini gösteren bir uç ipucu şart — yoksa
          "Şu an açık" sonrası her şey keşfedilmeden kesiliyormuş gibi duruyor.

          Eskiden bu ipucu krem bir degrade örtüydü; çipler haritanın üstüne
          çıkınca örtü haritayı lekeliyordu. Artık ÇİPLERİN KENDİSİ maskeyle
          sağa doğru siliniyor — altında ne olursa olsun (harita, kağıt zemin)
          doğru görünüyor. */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [&::-webkit-scrollbar]:hidden">
          {ANA.map((c) => (
            <Cip key={c.id} id={c.id} ad={c.ad}
                 aktif={secili === c.id} onTikla={() => { setTurAcik(false); onSec(c.id); }} />
          ))}
          <Cip
            id={seciliTur?.id ?? "tur"}
            ad={seciliTur ? `${seciliTur.ad} ▾` : "tür ▾"}
            aktif={!!seciliTur}
            onTikla={() => setTurAcik((a) => !a)}
          />
        </div>
      </div>

      {turAcik && (
        <div className="cam flex flex-wrap gap-2 rounded-t-2xl px-4 pb-3.5 pt-3">
          {TURLER.map((t) => (
            <Cip key={t.id} id={t.id} ad={t.ad}
                 aktif={secili === t.id}
                 onTikla={() => { setTurAcik(false); onSec(t.id); }} />
          ))}
        </div>
      )}
    </div>
  );
}
