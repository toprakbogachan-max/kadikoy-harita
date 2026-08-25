"use client";

import { useEffect, useState } from "react";
import { useOturum } from "@/lib/oturum";
import { useVeri } from "@/lib/kanca";
import { begendiklerim, kaydettigimYerler, kisininListeleri, profilGuncelle } from "@/lib/veri";
import type { Pin, Yer, Liste } from "@/lib/model";
import Arsiv from "./Arsiv";
import ProfilDuzenle from "./ProfilDuzenle";
import YasalMetin from "./YasalMetin";

type ArsivTuru = "kaydettiklerim" | "begendiklerim" | "listelerim";

interface Props {
  onKapat: () => void;
  onYerAc: (yerId: string) => void;
  onGonderiAc: (pinId: string, liste: string[]) => void;
  onListeOlustur: () => void;
}

/**
 * Ayarlar — hesap, arşiv, tercihler.
 *
 * Tercihlerin çoğu yalnızca bu tarayıcıyı ilgilendiriyor (açılış filtresi),
 * onlar localStorage'da. "Profilim herkese açık" ise sunucuyu ilgilendiriyor:
 * profiles.is_public sütunu ve okuma policy'si ona bakıyor, yoksa kapalı
 * profilin verisi yine herkese açık olurdu.
 */
export default function Ayarlar({ onKapat, onYerAc, onGonderiAc, onListeOlustur }: Props) {
  const { ben, cikisYap, tazele } = useOturum();
  const [arsiv, setArsiv] = useState<ArsivTuru | null>(null);
  const [profilAcik, setProfilAcik] = useState(false);
  const [yasal, setYasal] = useState<"sartlar" | "gizlilik" | null>(null);
  /* Tembel başlatıcı: efektte setState basamaklı render üretiyordu. window
     kontrolü SSR için — bu bileşen sunucuda çizilmiyor (yalnızca kullanıcı
     ayarları açınca render ediliyor), ama başlatıcı yine de güvenli olmalı. */
  const [acilistaAcik, setAcilistaAcik] = useState(
    () => (typeof window === "undefined" ? true : localStorage.getItem("acilistaAcik") !== "0"),
  );
  const [herkeseAcik, setHerkeseAcik] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const { veri: begeniler } = useVeri<Pin[]>(begendiklerim, [ben?.id], []);
  const { veri: kayitlar } = useVeri<Yer[]>(kaydettigimYerler, [ben?.id], []);
  const { veri: listeler } = useVeri<Liste[]>(
    () => (ben ? kisininListeleri(ben.id) : Promise.resolve([])), [ben?.id], []);

  /* is_public sunucudan gelir; profil yüklenince eşitlenir */
  const [oncekiBen, setOncekiBen] = useState<string | undefined>(undefined);
  if (ben && oncekiBen !== ben.id) {
    setOncekiBen(ben.id);
    setHerkeseAcik(ben.acikMi ?? true);
  }

  useEffect(() => {
    const el = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [onKapat]);

  const gizlilikDegistir = async (v: boolean) => {
    const eski = herkeseAcik;
    setHerkeseAcik(v);
    try { await profilGuncelle({ acikMi: v }); tazele(); }
    catch (e) { setHerkeseAcik(eski); setHata(e instanceof Error ? e.message : String(e)); }
  };

  if (yasal) {
    return <YasalMetin tur={yasal} onKapat={() => setYasal(null)} />;
  }
  if (profilAcik) {
    return <ProfilDuzenle onKapat={() => setProfilAcik(false)} />;
  }
  if (arsiv) {
    return (
      <Arsiv
        tur={arsiv}
        pinler={begeniler}
        yerler={kayitlar}
        listeler={listeler}
        onKapat={() => setArsiv(null)}
        onYerAc={onYerAc}
        onGonderiAc={onGonderiAc}
        onListeOlustur={onListeOlustur}
      />
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Ayarlar"
         className="absolute inset-0 z-40 flex flex-col bg-kagit">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--cizgi)] px-4 py-[15px]">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">Ayarlar</h2>
          <div className="mt-1.5 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
            Arşiv ve tercihler
          </div>
        </div>
        <button onClick={onKapat} aria-label="Kapat"
          className="size-[30px] shrink-0 rounded-sm border border-[var(--cizgi)] bg-yuzey text-[15px] leading-none">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-5">
        <Baslik>Hesap</Baslik>
        <Satir ad="Profili düzenle" aciklama="Görünen adın, bion ve fotoğrafın"
               onTikla={() => setProfilAcik(true)}
               ikon={<><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M14 6l4 4" /></>} />

        <Baslik>Arşiv</Baslik>
        <Satir ad="Kaydettiklerim" sayi={kayitlar.length}
               onTikla={() => setArsiv("kaydettiklerim")}
               ikon={<path d="M6 3.6h12v17l-6-4.2-6 4.2z" />} />
        <Satir ad="Beğendiklerim" sayi={begeniler.length}
               onTikla={() => setArsiv("begendiklerim")}
               ikon={<path d="M12 20.4 4.2 12.9a4.9 4.9 0 0 1 7-6.9l.8.8.8-.8a4.9 4.9 0 0 1 7 6.9z" />} />
        <Satir ad="Listelerim" sayi={listeler.length}
               onTikla={() => setArsiv("listelerim")}
               ikon={<><rect x="3.5" y="4" width="17" height="7" rx="1.6" /><rect x="3.5" y="14" width="17" height="6" rx="1.6" /></>} />

        <Baslik>Tercihler</Baslik>
        <Anahtar ad="Profilim herkese açık"
                 aciklama="Kapalıyken paylaştığın link kimsede açılmaz."
                 acik={herkeseAcik} onDegis={gizlilikDegistir} />
        <Anahtar ad="Açılışta “Şu an açık” filtresi"
                 aciklama="Kapalıyken harita tüm mekanlarla açılır."
                 acik={acilistaAcik}
                 onDegis={(v) => { setAcilistaAcik(v); localStorage.setItem("acilistaAcik", v ? "1" : "0"); }} />

        {hata && (
          <p className="mx-4 mt-3 rounded-sm border border-[rgba(224,39,28,.3)] bg-[rgba(224,39,28,.07)] p-2.5 text-[13px]">
            {hata}
          </p>
        )}

        <Baslik>Yasal</Baslik>
        <Satir ad="Kullanım şartları" aciklama="Ne yazılır, ne yazılmaz"
               onTikla={() => setYasal("sartlar")}
               ikon={<><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></>} />
        <Satir ad="Gizlilik politikası" aciklama="Hangi veri nerede, kime görünür"
               onTikla={() => setYasal("gizlilik")}
               ikon={<><rect x="5" y="10" width="14" height="10" rx="1.6" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} />
        <div className="border-b border-[var(--cizgi)] px-4 py-3">
          <div className="text-[13.5px]">Veri kaynakları</div>
          <div className="mt-0.5 text-[11.5px] leading-snug text-murekkep2">
            Mekan verisi © OpenStreetMap katkıcıları (ODbL).
            Kapak görselleri Wikimedia Commons’tan, lisansları görsellerin altında.
          </div>
        </div>

        <div className="p-4">
          <button onClick={cikisYap}
            className="w-full rounded-sm border border-[var(--cizgi)] bg-yuzey px-3 py-2.5 font-tabela text-[12.5px] uppercase tracking-[0.11em] text-murekkep">
            Çıkış yap
          </button>
        </div>
      </div>
    </div>
  );
}

const Baslik = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 pb-2 pt-4 font-tabela text-[11px] uppercase tracking-[0.13em] text-murekkep2">
    {children}
  </div>
);

function Satir({ ad, aciklama, sayi, ikon, onTikla }: {
  ad: string; aciklama?: string; sayi?: number; ikon: React.ReactNode; onTikla: () => void;
}) {
  return (
    <button onClick={onTikla}
      className="flex w-full items-center gap-2.5 border-none border-b border-[var(--cizgi)] bg-transparent px-4 py-3 text-left">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
           className="shrink-0 text-murekkep2">{ikon}</svg>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px]">{ad}</span>
        {aciklama && <span className="mt-0.5 block text-[11.5px] text-murekkep2">{aciklama}</span>}
      </span>
      {sayi !== undefined && (
        <span className="shrink-0 font-sayi text-[13px] text-murekkep2">{sayi}</span>
      )}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" className="shrink-0 text-murekkep2">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function Anahtar({ ad, aciklama, acik, onDegis }: {
  ad: string; aciklama: string; acik: boolean; onDegis: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--cizgi)] px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px]">{ad}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-murekkep2">{aciklama}</span>
      </span>
      <button role="switch" aria-checked={acik} aria-label={ad}
        onClick={() => onDegis(!acik)}
        className={`relative h-[22px] w-[38px] shrink-0 rounded-full border-none transition-colors ${
          acik ? "bg-jeton" : "bg-[rgba(35,52,60,.22)]"
        }`}>
        <span className={`absolute top-[3px] size-4 rounded-full bg-white transition-[left] ${
          acik ? "left-[19px]" : "left-[3px]"
        }`} />
      </button>
    </div>
  );
}
