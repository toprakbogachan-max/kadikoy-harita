"use client";

import { useVeri } from "@/lib/kanca";
import { hikayeSeridi, type HikayeKisi } from "@/lib/veri";
import Avatar from "./Avatar";

interface Props {
  secili: string | null;
  onSec: (k: string, etiket: string) => void;
  /** false ise şerit tek bir baloncuğa iniyor; haritayı daha az örtmek için */
  acik?: boolean;
  onAc?: () => void;
}

/**
 * Takip ettiklerinin pinleri — dokununca harita o kişiye filtrelenir.
 *
 * Artık mantar panoya iğnelenmiş yuvarlak post-it'ler DEĞİL: şerit haritanın
 * ÜSTÜNDE yüzüyor, altında mantar dokusu olamaz. Her kişi avatar + ad taşıyan
 * beyaz bir hap; yani hemen altındaki filtre çipleriyle aynı dil. Kazanç
 * yalnızca uyum değil: 92px'lik post-it sırası 44px'lik hap sırasına indi.
 *
 * Ad hapın İÇİNDE, altında değil — haritanın üstünde serbest duran yazı
 * denizin ya da koyu bir parkın üstüne gelince okunmuyor.
 */
export default function HikayeSeridi({ secili, onSec, acik = true, onAc }: Props) {
  const { veri: kisiler, yukleniyor } = useVeri<HikayeKisi[]>(hikayeSeridi, [], []);

  if (!kisiler.length) {
    /* Yükleme bittiyse ve kimse yoksa hiç çizmiyoruz. hikayeSeridi giriş
       yapmamış kullanıcıya [] döndürüyor; eskiden bu durumda da yer tutucu
       çiziliyordu, yani uygulamayı ilk açan birinin ekranının tepesinde
       92px'lik boş gri blok duruyordu. */
    if (!yukleniyor) return null;
    /* Yüklenirken yer kaplasın, yoksa altındaki durum kutusu zıplıyor. */
    return <div className={acik ? "h-[44px]" : "h-[38px]"} />;
  }

  /* Şerit kapalıyken de haber vermesi gerekiyor: kullanıcı haritaya dokunup
     şeridi kapattıktan sonra takip ettiği biri pin atmışsa bunu göremezdi.
     Ölçüt açık haldeki halkayla AYNI: son 24 saat. Kendi pinin "yeni" saymaz —
     kendi attığını zaten biliyorsun. */
  const yeniPinliler = kisiler.filter((p) => !p.ben && p.sonPinSaat < 24);

  /* Kapalı hal: sıranın tamamı yerine tek bir hap, içinde üst üste binen
     avatarlar. Haritaya dokununca buraya iniyor; şeridin var olduğunu
     unutturmadan görüşü açıyor. */
  if (!acik) {
    return (
      <div className="flex px-3 pt-2">
        <button
          onClick={onAc}
          aria-label={yeniPinliler.length ? `${yeniPinliler.length} kişi yeni pin attı, göster` : "Takip ettiklerini göster"}
          aria-expanded={false}
          className="pointer-events-auto flex items-center gap-2 rounded-full border-none bg-yuzey py-1 pl-1 pr-3 shadow-kat-2"
        >
          <span className="flex">
            {kisiler.slice(0, 4).map((p, i) => (
              <span
                key={p.id}
                className="rounded-full ring-2 ring-white"
                style={{ marginLeft: i ? -8 : 0, zIndex: 4 - i }}
              >
                <Avatar kisi={p.id} boyut={22} sekil="daire" />
              </span>
            ))}
          </span>
          <span className={`text-2xs font-semibold ${yeniPinliler.length ? "text-jeton" : "text-gri-600"}`}>
            {yeniPinliler.length ? `${yeniPinliler.length} yeni pin` : "takip ettiklerin"}
          </span>
        </button>
      </div>
    );
  }

  /* Maske sağ uçta: kaydırma çubuğu gizli olduğu için şeridin devam ettiğini
     başka bir şey söylemiyor. Perde yerine hapların KENDİSİ siliniyor —
     altında harita var, üstüne krem bir örtü çekmek haritayı lekeler. */
  return (
    <div className="flex gap-2 overflow-x-auto px-3 pb-0.5 pt-2 [mask-image:linear-gradient(to_right,#000_calc(100%-1.75rem),transparent)] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-1.75rem),transparent)] [&::-webkit-scrollbar]:hidden">
      {kisiler.map((p) => {
        const yeni = p.sonPinSaat < 24; /* son 24 saatte yeni pin */
        const aktif = secili === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSec(p.id, p.ben ? "Senin pinlerin" : `${p.ad}’in pinleri`)}
            aria-pressed={aktif}
            className={`pointer-events-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-none py-1 pl-1 pr-3 text-xs font-semibold shadow-kat-2 transition-colors ${
              aktif ? "bg-gri-900 text-white" : "bg-yuzey text-gri-800"
            }`}
          >
            {/* Yeni pin altın halkayla işaretleniyor — eski post-it'teki
                renkli çerçevenin işini görüyor, rengi kategoriden değil
                "yenilik"ten alıyor. */}
            <span
              className="rounded-full"
              style={{ boxShadow: yeni ? "0 0 0 2px var(--color-jeton)" : undefined }}
            >
              <Avatar kisi={p.id} boyut={24} sekil="daire" />
            </span>
            {p.ben ? "Sen" : p.ad}
          </button>
        );
      })}
    </div>
  );
}
