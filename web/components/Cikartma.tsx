"use client";

/**
 * Çıkartma / starburst rozeti — scrapbook hissini tek başına taşıyan eleman.
 *
 * Skill §6: fotoğrafın üzerine hafif DÖNDÜRÜLMÜŞ, kesilmiş çıkartma gibi
 * duran patlama şekli. Kritik kural: EKRAN BAŞINA BİR TANE. İkiye çıktığı
 * anda ucuzluyor — bu yüzden bileşen bilerek "her yere serpilebilir" bir
 * rozet gibi değil, tek kullanımlık bir vurgu gibi tasarlandı.
 *
 * Renk pastel rozet paletinden; doygun renk arayüzde yaşamıyor ama rozet
 * ölçeğinde canlı olabiliyor (doygunluk alanla ters orantılı, skill §3).
 */
const NOKTA = 16;              /* patlamanın uç sayısı */
const DIS = 50, IC = 41;       /* dış ve iç yarıçap (yüzde) */

const patlama = () => {
  const p: string[] = [];
  for (let i = 0; i < NOKTA * 2; i++) {
    const r = i % 2 === 0 ? DIS : IC;
    const a = (Math.PI * i) / NOKTA - Math.PI / 2;
    p.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
  }
  return `polygon(${p.join(",")})`;
};

export default function Cikartma({
  ust,
  alt,
  ton = "pembe",
  className = "",
}: {
  /** üst satır — kısa ve BÜYÜK, örn. "POPÜLER" */
  ust: string;
  /** alt satır — küçük harf, örn. kategori adı */
  alt?: string;
  ton?: "pembe" | "lila" | "nane";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      /* -rotate-[9deg] animasyonla ÇAKIŞMIYOR, onun yedeği: hareket azaltma
         tercihinde animation:none oluyor ve eğik açıyı bu sınıf taşıyor.
         Animasyon koşarken fill:both son kareyi (aynı -9deg) tutuyor. */
      className={`yapistir grid size-[82px] shrink-0 -rotate-[9deg] place-items-center text-center ${className}`}
      style={{
        clipPath: patlama(),
        background: `var(--color-rozet-${ton})`,
        color: `var(--color-rozet-${ton}-ink)`,
        filter: "drop-shadow(0 2px 6px rgba(16,16,20,.22))",
      }}
    >
      <span className="px-1">
        <span className="block text-2xs font-extrabold uppercase leading-none tracking-etiket">
          {ust}
        </span>
        {alt && (
          <span className="mt-0.5 block text-2xs lowercase leading-tight opacity-85">{alt}</span>
        )}
      </span>
    </span>
  );
}
