"use client";

import { useEffect, useMemo, useRef } from "react";
import { medyaUrl } from "@/lib/veri";

/**
 * Büyütülmüş görsel + notu.
 *
 * 52px'lik küçük kutuda ne fotoğrafı görebiliyor ne de uzun bir notu rahat
 * yazabiliyordun. Burada görsel ekranın çoğunu kaplıyor ve not çok satırlı.
 * Not aynı state'i düzenliyor — kapatınca listede de güncel.
 */
export default function BuyukGorsel({
  kaynak, not, onNot, onKapat, notaOdaklan,
}: {
  kaynak: { tip: "yol"; yol: string } | { tip: "dosya"; dosya: File };
  not: string;
  onNot: (v: string) => void;
  onKapat: () => void;
  /* Nota dokunularak açıldıysa imleç doğrudan not alanına gitsin. Görsele
     dokunularak açıldığında ODAKLANMIYOR: telefonda klavye açılıp görseli
     örterdi, oysa oraya bakmak için açtın. */
  notaOdaklan?: boolean;
}) {
  const notAlani = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!notaOdaklan) return;
    const el = notAlani.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [notaOdaklan]);
  const video = kaynak.tip === "dosya" && kaynak.dosya.type.startsWith("video");
  /* Dosya için nesne URL'i burada üretiliyor ve sökülürken geri veriliyor —
     yoksa her açılışta bellekte bir blob birikirdi. */
  const url = useMemo(() => {
    if (kaynak.tip === "yol") return medyaUrl(kaynak.yol);
    return video ? null : URL.createObjectURL(kaynak.dosya);
  }, [kaynak, video]);
  useEffect(() => {
    if (kaynak.tip === "dosya" && url) return () => URL.revokeObjectURL(url);
  }, [kaynak.tip, url]);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Görseli büyüt"
         /* Tamamen opak: %96'da bile altındaki krem form okunuyordu ve
            görselden dikkat çalıyordu. */
         className="absolute inset-0 z-[48] flex flex-col bg-[#0C0905]">
      <div className="flex shrink-0 justify-end p-3">
        <button onClick={onKapat} aria-label="Kapat"
          className="size-[34px] rounded-sm border-none bg-white/15 text-[17px] leading-none text-white">
          ✕
        </button>
      </div>

      <div className="grid min-h-0 flex-1 place-items-center px-4">
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt="" className="max-h-full max-w-full rounded-sm object-contain" />
        ) : (
          <span className="font-tabela text-[12px] uppercase tracking-[0.12em] text-white/50">
            {video ? "video — önizleme yok" : "görsel yok"}
          </span>
        )}
      </div>

      <div className="shrink-0 p-4">
        <label className="mb-1.5 block font-tabela text-[11px] uppercase tracking-[0.12em] text-white/60">
          Bu görselin notu
        </label>
        <textarea
          ref={notAlani}
          value={not}
          onChange={(e) => onNot(e.target.value)}
          maxLength={120}
          rows={3}
          placeholder="İsteğe bağlı"
          className="w-full resize-none rounded-sm border border-white/20 bg-white/10 px-3 py-2.5 text-[14px] leading-snug text-white outline-none placeholder:text-white/40 focus:border-[#F2C879]"
        />
        <div className="mt-1 text-right font-sayi text-[10.5px] text-white/45">{not.length}/120</div>

        {/* "Tamam", "Kaydet" DEĞİL: bu ekran sunucuya hiçbir şey yazmıyor,
            yalnızca formdaki state'i düzenliyor. Asıl kayıt formun altındaki
            Paylaş/Kaydet ile oluyor — burada "Kaydet" yazsaydı kullanıcı pini
            kaydettiğini sanırdı. Sağ üstteki çarpı da aynı işi yapıyor ama
            "vazgeç" gibi okunuyordu; bitirdiğini söyleyen bir düğme gerekti. */}
        <button
          onClick={onKapat}
          className="mt-3 w-full rounded-sm border-none bg-jeton px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-white"
        >
          Tamam
        </button>
      </div>
    </div>
  );
}
