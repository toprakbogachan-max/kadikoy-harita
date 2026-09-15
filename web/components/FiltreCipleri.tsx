"use client";

import { useState } from "react";
import { TUR_AD, emoji } from "@/lib/paleti";
import KayanSecim from "./KayanSecim";

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
function Cip({ id, kayan, ad, aktif, onTikla }: {
  id: string; kayan?: string; ad: string; aktif: boolean; onTikla: () => void;
}) {
  return (
    <button
      /* KayanSecim baloncuğu bu öznitelikle buluyor. "Tür" çipinde seçili
         kategorinin kimliğini taşıması gerektiği için id'den ayrı. */
      data-kayan={kayan ?? id}
      onClick={onTikla}
      aria-pressed={aktif}
      /* Kademe B: arayüz küçük harf konuşur. Aktif çipin siyahı ARTIK
         çipin kendi zemininde değil, altından akan baloncukta — yoksa
         beyaz zemin baloncuğu örter ve hareket görünmezdi. Aynı sebeple
         gölge de aktifken çipten kalkıyor, baloncuk taşıyor. */
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-none py-2 pl-3 pr-3.5 text-sm font-semibold lowercase tracking-ui transition-[color,background-color,transform] duration-[150ms] ease-out active:scale-95 ${
        aktif ? "bg-transparent text-white" : "bg-yuzey text-gri-800 shadow-kat-2"
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
        {/* Baloncuk şeridin İÇİNDE: mutlak konumlu ama kaydırma kutusunun
            çocuğu olduğu için içerikle birlikte kayıyor. Dışarıda dursaydı
            şerit kaydırılınca çiplerden ayrılırdı. */}
        <KayanSecim
          aktif={secili}
          className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [&::-webkit-scrollbar]:hidden"
          baloncuk="baloncuk rounded-full shadow-kat-2"
          /* Çipler ayrı ayrı duruyor: uzayan baloncuk komşularının arkasında
             dilimleniyordu. Kısık gerilmeyle bütün hâlde geçiyor. */
          gerilme={0.16}
        >
          {ANA.map((c) => (
            <Cip key={c.id} id={c.id} ad={c.ad}
                 aktif={secili === c.id} onTikla={() => { setTurAcik(false); onSec(c.id); }} />
          ))}
          <Cip
            id={seciliTur?.id ?? "tur"}
            kayan={seciliTur?.id ?? "tur"}
            ad={seciliTur ? `${seciliTur.ad} ▾` : "tür ▾"}
            aktif={!!seciliTur}
            onTikla={() => setTurAcik((a) => !a)}
          />
        </KayanSecim>
      </div>

      {turAcik && (
        /* ---- kategori şeridi ----
           Üst sıradan BİLEREK farklı biçimde: emoji üstte kendi dairesinde,
           etiket altında. Referansın haritasındaki kategori şeridi böyle ve
           ayrım işlevsel, süs değil — üst sıra "hangi mekanlara bakıyorum"
           (herkes / takip / kayıtlı), bu sıra "ne arıyorum" (kahve / bar).
           İki farklı soru, iki farklı biçim.

           Emoji daire içinde olunca 20 piksele çıkabiliyor ve kategori bir
           bakışta taranıyor; yan yana dizilmiş yazılarda göz her etiketi tek
           tek okumak zorundaydı.

           YATAY KAYDIRMA, flex-wrap DEĞİL: dokuz kategori sarınca iki satır
           oluyor ve şerit haritanın 140 pikselini örtüyordu. Tek satır 68px.

           Baloncuk (KayanSecim) burada yok: akan siyah kapsül iki satırlık
           bir öğenin arkasında koca bir leke oluyor. Seçili durumu bunun
           yerine emoji dairesinin SİYAH HALKASI taşıyor — referanstaki
           "showing places from" sayfasının seçili satırı da tam olarak bu:
           dolu zemin değil, siyah çerçeve. */
        <div className="cam rounded-t-2xl pb-3 pt-3">
          <div className="flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [&::-webkit-scrollbar]:hidden">
            {TURLER.map((t) => {
              const aktif = secili === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTurAcik(false); onSec(t.id); }}
                  aria-pressed={aktif}
                  className="bas flex w-[62px] shrink-0 flex-col items-center gap-1.5 border-none bg-transparent px-0.5"
                >
                  <span
                    aria-hidden
                    className={`grid size-11 place-items-center rounded-full bg-yuzey text-[20px] leading-none transition-shadow duration-[160ms] ${
                      aktif ? "shadow-[0_0_0_2px_var(--color-gri-900),var(--shadow-kat-2)]" : "shadow-kat-2"
                    }`}
                  >
                    {emoji(t.id)}
                  </span>
                  {/* Etiket iki satıra sarmıyor: "kültür sanat" gibi uzun
                      adlarda şerit yüksekliği oynardı. Kesiliyor.

                      leading-none DEĞİL: truncate'in overflow-hidden'ı satır
                      kutusunu kırpıyor ve leading-none'da kutu tam punto
                      yüksekliğinde oluyor — "yemek"in y'si, "park"ın p'si
                      kesiliyordu. */}
                  <span
                    className={`w-full truncate text-center text-2xs lowercase leading-tight tracking-ui ${
                      aktif ? "font-bold text-gri-900" : "font-semibold text-gri-700"
                    }`}
                  >
                    {t.ad}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
