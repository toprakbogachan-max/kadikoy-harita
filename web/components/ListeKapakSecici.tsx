"use client";

import { useRef, useState } from "react";
import { listeKapakYukle } from "@/lib/veri";
import type { Liste } from "@/lib/model";
import ListeKapagi from "./ListeKapagi";

/**
 * Kapak fotoğrafı seçme ve KADRAJLAMA.
 *
 * Kapağı listenin sahibi seçiyor (mekan kapağının tersi, göç 16). İki karar
 * var ve ikisi de kullanıcının: hangi fotoğraf, ve o fotoğrafın hangi bandı
 * kare kartta görünecek.
 *
 * Kadraj neden var: kapak kartta KARE gösteriliyor, yüklenen fotoğraf kare
 * değil. Merkezden kırpsak dikey bir fotoğrafta yüz ya da tabela sürekli
 * kesilirdi. Kullanıcı önizlemeyi yukarı aşağı sürüklüyor, yüzde
 * lists.cover_pos'a yazılıyor. Yatay kadraj bilerek yok: iki eksen
 * dokunmatikte sayfa kaydırmasıyla kavga ediyor.
 *
 * Bileşen kendi başına KAYDETMİYOR — yalnızca {url, konum} üretip yukarı
 * veriyor. Böylece hem "liste henüz yok" (oluşturma) hem "liste var"
 * (düzenleme) akışında aynı bileşen çalışıyor.
 */

/** Yüklemeden önce inilen genişlik. Kapak en büyük 2 sütunlu ızgarada
 *  ~180px, liste sayfasında ~360px görünüyor; retina için 900 fazlasıyla
 *  yeter ve ham telefon fotoğrafının 4 MB'ını kovaya taşımaz. */
const KAPAK_PX = 900;
/** Çok uzun panorama/ekran görüntüsü kovayı şişirmesin. */
const EN_UZUN = 1600;

export default function ListeKapakSecici({
  liste,
  onDegisti,
  devreDisi = false,
}: {
  /** Önizlemenin çizeceği liste — kapaksızken kolaj zeminine düşüyor. */
  liste: Pick<Liste, "kapak" | "kapakKonum" | "yerler">;
  onDegisti: (kapak: { url: string | null; konum: number }) => void;
  devreDisi?: boolean;
}) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const dosyaGirdi = useRef<HTMLInputElement>(null);
  const kutu = useRef<HTMLDivElement>(null);
  /* Sürükleme başlarkenki değer + kutunun yüksekliği; ikisi de sürükleme
     boyunca sabit kalmalı, her hareket olayında yeniden ölçmek titretiyor. */
  const surukleme = useRef<{ y: number; baslangic: number; yukseklik: number } | null>(null);

  const kilit = devreDisi || yukleniyor;
  const kadrajlanabilir = !!liste.kapak && !kilit;

  const fotoSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.files?.[0];
    e.target.value = "";
    if (!d) return;
    setHata(null);
    setYukleniyor(true);
    try {
      const kucuk = await kucult(d);
      const url = await listeKapakYukle(kucuk, "jpg");
      /* Yeni fotoğrafın kadrajı ortadan başlıyor: önceki fotoğraf için
         seçilmiş bandın yenisinde bir anlamı yok. */
      onDegisti({ url, konum: 50 });
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err));
    } finally {
      setYukleniyor(false);
    }
  };

  const kadrajla = (yeni: number) =>
    onDegisti({ url: liste.kapak, konum: Math.max(0, Math.min(100, Math.round(yeni))) });

  return (
    <div>
      <div className="flex items-start gap-3">
        {/* ---- kare önizleme, sürüklenebilir ---- */}
        <div
          ref={kutu}
          /* role=slider: sürükleme dokunmatiğin yolu, klavye kullanan için
             ok tuşları aynı işi yapıyor. Kapak yokken sürüklenecek bir şey
             de yok, o zaman düz bir önizleme. */
          {...(kadrajlanabilir
            ? {
                role: "slider" as const,
                tabIndex: 0,
                "aria-label": "Kapak kadrajı — yukarı aşağı sürükle",
                "aria-valuemin": 0,
                "aria-valuemax": 100,
                "aria-valuenow": liste.kapakKonum,
                "aria-valuetext": `üstten %${liste.kapakKonum}`,
              }
            : {})}
          onPointerDown={(e) => {
            if (!kadrajlanabilir) return;
            const h = e.currentTarget.getBoundingClientRect().height;
            surukleme.current = { y: e.clientY, baslangic: liste.kapakKonum, yukseklik: h };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const s = surukleme.current;
            if (!s) return;
            /* Aşağı sürüklemek fotoğrafı aşağı kaydırır → ÜST bandı görünür
               → yüzde düşer. Ters işaret olmazsa hareket "yanlış yöne
               gidiyor" gibi hissediliyor. */
            kadrajla(s.baslangic - ((e.clientY - s.y) / s.yukseklik) * 100);
          }}
          onPointerUp={() => { surukleme.current = null; }}
          onPointerCancel={() => { surukleme.current = null; }}
          onKeyDown={(e) => {
            if (!kadrajlanabilir) return;
            if (e.key === "ArrowUp") { e.preventDefault(); kadrajla(liste.kapakKonum - 5); }
            if (e.key === "ArrowDown") { e.preventDefault(); kadrajla(liste.kapakKonum + 5); }
          }}
          className={`relative size-[116px] shrink-0 overflow-hidden rounded-lg bg-gri-100 shadow-kat-1 ${
            kadrajlanabilir ? "cursor-ns-resize touch-none" : ""
          } ${kilit ? "opacity-60" : ""}`}
        >
          <ListeKapagi liste={liste} genislik={320} />
          {kadrajlanabilir && (
            /* Sürüklenebildiğini söyleyen tek işaret. Fotoğrafın üstünde
               beyaz duracağı için koyu örtü zorunlu (skill §6). */
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(0,0,0,.62)] to-transparent px-2 pb-1.5 pt-4 text-center text-2xs lowercase text-white"
            >
              ↕ sürükle
            </span>
          )}
          {yukleniyor && (
            <span className="absolute inset-0 grid place-items-center bg-[rgba(255,255,255,.7)] text-sm lowercase text-gri-700">
              yükleniyor…
            </span>
          )}
        </div>

        {/* ---- düğmeler ---- */}
        <div className="min-w-0 flex-1">
          <input
            ref={dosyaGirdi}
            type="file"
            accept="image/*"
            onChange={fotoSec}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => dosyaGirdi.current?.click()}
            disabled={kilit}
            className="rounded-full bg-yuzey px-3.5 py-2 text-sm font-semibold lowercase tracking-ui text-gri-800 shadow-kat-1 disabled:opacity-40"
          >
            {liste.kapak ? "başka fotoğraf" : "kapak fotoğrafı seç"}
          </button>
          {liste.kapak && (
            <button
              type="button"
              onClick={() => onDegisti({ url: null, konum: 50 })}
              disabled={kilit}
              className="ml-1.5 rounded-full border-none bg-transparent px-2.5 py-2 text-sm lowercase text-gri-600 disabled:opacity-40"
            >
              kaldır
            </button>
          )}
          <p className="mt-2 text-xs lowercase leading-snug text-gri-600">
            {liste.kapak
              ? "kareyi sürükleyerek fotoğrafın hangi kısmı görüneceğini seç."
              : "kapak koymazsan mekanların renkleri kapak olur."}
          </p>
        </div>
      </div>

      {hata && (
        <p className="mt-2.5 rounded-md border border-[rgba(179,38,30,.3)] bg-[rgba(179,38,30,.07)] p-2.5 text-sm">
          {hata}
        </p>
      )}
    </div>
  );
}

/**
 * Fotoğrafı küçültür — tarayıcıda, yüklemeden önce.
 *
 * ProfilDuzenle'deki kucult()'tan farkı: KARE KIRPMIYOR. Kadrajı kullanıcı
 * seçiyor (cover_pos), o yüzden fotoğrafın tamamı kovaya gidiyor; kare
 * kırpsaydık kullanıcının sürükleyebileceği bir şey kalmazdı.
 */
function kucult(dosya: File): Promise<Blob> {
  return new Promise((coz, red) => {
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const olcek = Math.min(1, KAPAK_PX / img.width, EN_UZUN / img.height);
      const g = Math.max(1, Math.round(img.width * olcek));
      const y = Math.max(1, Math.round(img.height * olcek));
      const t = document.createElement("canvas");
      t.width = g;
      t.height = y;
      const c = t.getContext("2d");
      if (!c) return red(new Error("Görsel işlenemedi."));
      c.drawImage(img, 0, 0, g, y);
      t.toBlob((b) => (b ? coz(b) : red(new Error("Görsel dönüştürülemedi."))), "image/jpeg", 0.82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      red(new Error("Görsel okunamadı."));
    };
    img.src = url;
  });
}
