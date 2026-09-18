"use client";

import { useEffect, useRef, useState } from "react";
import { listeGuncelle, listeSil, listeKapagiSil } from "@/lib/veri";
import type { Liste } from "@/lib/model";
import ListeKapakSecici from "./ListeKapakSecici";
import Pill from "./corner/primitives/Pill";

/**
 * Listenin adını, notunu ve kapağını değiştirme.
 *
 * Neden var: liste oluşturulabiliyor ve silinebiliyordu, arası yoktu. Bir
 * listeyi adlandırmak tek seferlik bir karar değil — "kahve" diye başlayan
 * liste üç ay sonra "sabah kahvesi" oluyor. Kapak için bu daha da doğru:
 * kullanıcı doğru fotoğrafı ancak listeyi bir süre kullandıktan sonra
 * buluyor.
 *
 * Kaydet DEĞİŞENİ yolluyor: dokunulmamış alanı da göndersek, o sırada
 * başka bir yerden (ör. başka sekme) değişmiş bir değeri eski hâline
 * döndürürdük.
 */
export default function ListeDuzenle({
  liste,
  onKapat,
  onKaydedildi,
  onSilindi,
}: {
  liste: Liste;
  onKapat: () => void;
  /** Güncel liste — çağıran ekran kendi kopyasını tazelesin. */
  onKaydedildi: (yeni: Liste) => void;
  onSilindi: () => void;
}) {
  const [baslik, setBaslik] = useState(liste.baslik);
  const [not, setNot] = useState(liste.not ?? "");
  const [kapak, setKapak] = useState<{ url: string | null; konum: number }>({
    url: liste.kapak,
    konum: liste.kapakKonum,
  });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  /* Oluşturma ekranındakiyle aynı sızıntı: burada yeni bir kapak yükleyip
     vazgeçilirse dosya kovada sahipsiz kalır. Kaydedilen kapağı
     listeGuncelle zaten devralıyor (eskisini o siliyor); burada yalnızca
     KAYDEDİLMEYENLER temizleniyor. Listenin mevcut kapağı bu listeye hiç
     girmiyor, yanlışlıkla silinemez. */
  const yuklenenler = useRef<string[]>([]);
  const kaydedildi = useRef(false);
  const sonKapak = useRef<string | null>(liste.kapak);

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape" && !kaydediliyor) onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat, kaydediliyor]);

  useEffect(() => () => {
    for (const u of yuklenenler.current) {
      if (kaydedildi.current && u === sonKapak.current) continue;
      void listeKapagiSil(u);
    }
  }, []);

  const degisti =
    baslik.trim() !== liste.baslik ||
    not.trim() !== (liste.not ?? "") ||
    kapak.url !== liste.kapak ||
    kapak.konum !== liste.kapakKonum;

  const kaydet = async () => {
    setKaydediliyor(true);
    setHata(null);
    try {
      await listeGuncelle(liste.id, {
        ...(baslik.trim() !== liste.baslik ? { baslik } : {}),
        ...(not.trim() !== (liste.not ?? "") ? { not } : {}),
        ...(kapak.url !== liste.kapak ? { kapakUrl: kapak.url } : {}),
        ...(kapak.konum !== liste.kapakKonum ? { kapakKonum: kapak.konum } : {}),
      });
      kaydedildi.current = true;
      onKaydedildi({
        ...liste,
        baslik: baslik.trim(),
        not: not.trim() || null,
        kapak: kapak.url,
        kapakKonum: kapak.konum,
      });
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setKaydediliyor(false);
    }
  };

  const girdi =
    "w-full rounded-lg bg-yuzey shadow-kat-1 px-2.5 py-2 text-base outline-none placeholder:text-gri-600";
  const etiket = "mb-1.5 block text-2xs font-bold uppercase tracking-etiket text-gri-700";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Listeyi düzenle"
      className="iridesan absolute inset-0 z-[44] flex flex-col"
    >
      <div className="flex shrink-0 items-center gap-2.5 px-4 py-[15px]">
        <button
          onClick={onKapat}
          disabled={kaydediliyor}
          aria-label="Geri"
          className="grid size-8 shrink-0 place-items-center rounded-md border-none bg-yuzey text-lg leading-none text-gri-800 shadow-kat-2 disabled:opacity-40"
        >
          ‹
        </button>
        <h2 className="text-xl font-extrabold uppercase leading-tight tracking-siki">
          LİSTEYİ DÜZENLE
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Kapak en üstte: bu ekranın asıl sebebi o, başlık zaten oluşturma
            sırasında bir kez yazılmış oluyor. */}
        <div className={etiket}>Kapak</div>
        <div className="mb-5">
          <ListeKapakSecici
            liste={{ kapak: kapak.url, kapakKonum: kapak.konum, yerler: liste.yerler }}
            onDegisti={(k) => {
              if (k.url && k.url !== liste.kapak) yuklenenler.current.push(k.url);
              sonKapak.current = k.url;
              setKapak({ url: k.url, konum: k.konum });
            }}
            devreDisi={kaydediliyor}
          />
        </div>

        <label className="mb-3 block">
          <span className={etiket}>Liste adı</span>
          <input
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            maxLength={60}
            className={girdi}
          />
        </label>

        <label className="mb-4 block">
          <span className={etiket}>Kısa not</span>
          <input
            value={not}
            onChange={(e) => setNot(e.target.value)}
            maxLength={120}
            placeholder="Bu liste ne işe yarıyor?"
            className={girdi}
          />
        </label>

        {hata && (
          <p className="mb-3 rounded-md border border-[rgba(179,38,30,.3)] bg-[rgba(179,38,30,.07)] p-2.5 text-sm">
            {hata}
          </p>
        )}

        {/* Silme ekranın DİBİNDE ve sessiz: kaydetme düğmesinin yanında
            dursaydı yanlışlıkla basılırdı. Kırmızı dolu düğme de yok —
            renk arayüz iskeletinde yaşamıyor, uyarı metinde. */}
        <button
          onClick={async () => {
            if (!confirm(`“${liste.baslik}” listesi silinsin mi? Bu geri alınamaz.`)) return;
            setKaydediliyor(true);
            try {
              await listeSil(liste.id);
              onSilindi();
            } catch (e) {
              setHata(e instanceof Error ? e.message : String(e));
              setKaydediliyor(false);
            }
          }}
          disabled={kaydediliyor}
          className="mt-4 border-none bg-transparent p-0 text-sm lowercase text-mercan disabled:opacity-40"
        >
          bu listeyi sil
        </button>
      </div>

      <div className="shrink-0 p-3">
        <Pill
          dolgu="siyah" boy="buyuk" tamGenislik
          onTikla={kaydet}
          pasif={kaydediliyor || !degisti || baslik.trim().length < 2}
          yukleniyor={kaydediliyor}
        >
          böyle iyi.
        </Pill>
      </div>
    </div>
  );
}
