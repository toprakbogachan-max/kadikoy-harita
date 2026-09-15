"use client";

import { useEffect } from "react";
import { useVeri } from "@/lib/kanca";
import { bildirimler, bildirimleriOkundu, type Bildirim } from "@/lib/veri";
import { useKisiler } from "@/lib/kisiler-baglam";
import { zaman } from "@/lib/gorsel";
import Avatar from "./Avatar";

/**
 * Bildirimler — beğeni, yorum, takip.
 *
 * Açılınca hepsi okundu işaretleniyor: rozet kırmızı kalmasın diye kullanıcıyı
 * tek tek dokunmaya zorlamak gereksiz. Satırlar yine de okunmamışları vurguluyor
 * ki neyin yeni olduğu görülsün.
 */
export default function Bildirimler({
  onKapat, onGonderiAc, onKisiAc,
}: {
  onKapat: () => void;
  onGonderiAc: (pinId: string) => void;
  onKisiAc: (kullaniciAdi: string) => void;
}) {
  const { veri: liste, yukleniyor } = useVeri<Bildirim[]>(bildirimler, [], []);
  const kisiler = useKisiler();

  useEffect(() => {
    /* Liste geldiyse okundu yaz — boşken yazmak gereksiz istek */
    if (liste.length) bildirimleriOkundu().catch((e) => console.error("okundu yazılamadı:", e));
  }, [liste]);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  const metin = (b: Bildirim) => {
    const yer = b.yerAdi ? ` — ${b.yerAdi}` : "";
    if (b.tur === "like") return `pinini beğendi${yer}`;
    if (b.tur === "comment") return `pinine yorum yaptı${yer}`;
    return "seni takip etmeye başladı";
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Bildirimler"
         className="yuksel iridesan absolute inset-0 z-40 flex flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-[15px]">
        <div>
          <h2 className="text-2xl font-extrabold uppercase leading-none tracking-siki">Bildirimler</h2>
          <div className="mt-1.5 text-xs lowercase text-gri-600">
            {yukleniyor ? "yükleniyor…" : `${liste.length} bildirim`}
          </div>
        </div>
        <button onClick={onKapat} aria-label="Kapat"
          className="grid size-8 shrink-0 place-items-center rounded-md border-none bg-yuzey text-base leading-none text-gri-800 shadow-kat-2">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {liste.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0 px-4 pt-1">
            {liste.map((b) => {
              const k = kisiler[b.kisi];
              return (
                <li key={b.id}>
                  {/* Gradyan kart = SİSTEM/AKTİVİTE mesajı (skill §6).
                      Kullanıcının kendi içeriği beyaz kartta durur; burada
                      gradyan bir anlam taşıyor: "bu bir kişinin notu değil,
                      bir olay". Okunmamışlar gradyanlı, okunmuşlar beyaz —
                      böylece "okunmadı" bilgisini altın bir nokta değil
                      kartın KENDİSİ veriyor. */}
                  <button
                    onClick={() => (b.pinId ? onGonderiAc(b.pinId) : k && onKisiAc(k.k))}
                    className={`flex w-full items-start gap-2.5 rounded-lg border-none p-3 text-left shadow-kat-1 ${
                      b.okundu
                        ? "bg-yuzey"
                        : "bg-[linear-gradient(135deg,var(--color-rozet-lila),var(--color-rozet-pembe))]"
                    }`}
                  >
                    <Avatar kisi={b.kisi} boyut={34} />
                    <span className="min-w-0 flex-1">
                      <span className="text-sm leading-snug text-gri-900">
                        <b className="font-bold tracking-siki">{k?.ad ?? "…"}</b> {metin(b)}
                      </span>
                      {/* İnsanın yazdığı alıntı → Karla. */}
                      {b.yorum && (
                        <span className="mt-1 block truncate font-metin text-xs text-gri-700">
                          “{b.yorum}”
                        </span>
                      )}
                      {!b.yorum && b.pinMetni && (
                        <span className="mt-1 block truncate font-metin text-xs text-gri-700">
                          {b.pinMetni}
                        </span>
                      )}
                      <span className="mt-1 block font-sayi text-2xs text-gri-600">
                        {zaman(b.saat)}
                      </span>
                    </span>
                    {!b.okundu && <span className="sr-only">okunmadı</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm lowercase leading-relaxed text-gri-600">
            {yukleniyor
              ? "Yükleniyor…"
              : "Henüz bildirim yok. Biri pinini beğendiğinde ya da yorum yaptığında burada görürsün."}
          </p>
        )}
      </div>
    </div>
  );
}
