"use client";

import { useMemo, useState } from "react";
import Harita from "@/components/Harita";
import HikayeSeridi from "@/components/HikayeSeridi";
import FiltreCipleri from "@/components/FiltreCipleri";
import { YERLER, PINLER, type DemoYer } from "@/lib/demo";
import { acikMi, jetonGradyanlari } from "@/lib/gorsel";

const POPULER_ESIK = 2;

export default function Sayfa() {
  const [bolge, setBolge] = useState("KADIKÖY");
  const [filtre, setFiltre] = useState("acik");
  const [kisiFiltre, setKisiFiltre] = useState<string | null>(null);
  const [secili, setSecili] = useState<string | null>(null);

  const gorunenler = useMemo<DemoYer[]>(() => {
    const t = new Date();
    return YERLER.filter((y) => {
      if (kisiFiltre && !PINLER.some((p) => p.yer === y.id && p.kisi === kisiFiltre)) return false;
      if (filtre === "acik") return acikMi(y.saatler, t) === true;
      if (filtre === "hepsi") return true;
      if (filtre === "populer") return PINLER.filter((p) => p.yer === y.id).length >= POPULER_ESIK;
      if (filtre === "kaydettiklerim") return false; // kayıtlar Supabase'e bağlanınca gelecek
      return y.tur === filtre;
    });
  }, [filtre, kisiFiltre]);

  const acikSayisi = useMemo(() => {
    const t = new Date();
    return YERLER.filter((y) => acikMi(y.saatler, t)).length;
  }, []);

  /* hikayeye dokununca kategori filtresi "hepsi"ye geçer, yoksa
     o kişinin pinlediği yerlerin hepsi görünmeyebilir */
  const kisiSec = (k: string) => {
    setKisiFiltre((onceki) => {
      const yeni = onceki === k ? null : k;
      if (yeni) setFiltre("hepsi");
      return yeni;
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#241E14] p-4">
      {/* jeton gradyanları — sayfada bir kez */}
      <svg width="0" height="0" className="absolute">
        <defs dangerouslySetInnerHTML={{ __html: jetonGradyanlari() }} />
      </svg>

      <div className="telefon relative flex w-full max-w-[392px] flex-col overflow-clip rounded-[26px] bg-kagit shadow-[0_30px_80px_rgba(0,0,0,.55)] h-[min(96vh,820px)]">
        <header className="shrink-0 border-b border-[var(--cizgi)] bg-kagit px-4 pb-2 pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-tabela text-[25px] font-semibold leading-none tracking-[0.14em]">
              {bolge}
            </h1>
            <span className="font-sayi text-[13px] text-murekkep2">
              {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12.5px] text-murekkep2">
            <span className="size-[9px] shrink-0 rounded-full bg-jeton shadow-[0_0_0_3px_rgba(184,128,26,.16)]" />
            <span>
              <b className="font-sayi text-[13px] font-bold text-jeton">{acikSayisi}</b> yer şu an açık ·{" "}
              {PINLER.length} pin
            </span>
          </div>
        </header>

        <HikayeSeridi secili={kisiFiltre} onSec={kisiSec} />

        <div className="relative min-h-0 flex-1 overflow-hidden bg-su">
          <Harita
            gorunenler={gorunenler}
            secili={secili}
            onYerSec={setSecili}
            onBolgeDegisti={setBolge}
          />
          {gorunenler.length === 0 && (
            <div className="absolute inset-x-4 top-3.5 z-[2] rounded-sm border border-[var(--cizgi)] bg-yuzey p-3 text-center text-[13px] leading-snug shadow-kagit2">
              {kisiFiltre
                ? "Bu kişinin şu filtrede pinlediği yer yok."
                : filtre === "acik"
                  ? "Şu an açık hiçbir yer yok. “Hepsi”ne bakabilirsin."
                  : "Bu kategoride yer yok."}
            </div>
          )}
        </div>

        <FiltreCipleri secili={filtre} onSec={setFiltre} />
      </div>
    </main>
  );
}
