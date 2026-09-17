"use client";

/**
 * /tasarim/degerlendirme — değerlendirmenin iki bileşeni (Faz 2, Paket 4).
 *
 *   E1 DereceGostergesi (Pill üstüne) — 1–10 puanın dört kademeli okunuşu
 *   E2 YineGiderMisin   (Kart + Pill + Rozet) — `pins.would_return` + favorim
 *
 * Kurallar önceki vitrinlerle aynı:
 *   1) Ürün değil ALET. Buradaki hiçbir düzen gerçek bir ekran değil.
 *   2) ÖRNEK VERİ BURADA DURUR. Puan, cevap, kalp — hepsi bu sayfanın state'i.
 *   3) Sayfa denetlediği dile uyuyor: iridesan zemin, beyaz kart, ayraç
 *      çizgisi yok, iki kademeli tipografi.
 *
 * Veri modeli değişmiyor (karar 2026-09-15): E1 yalnızca gösterim.
 * Eşik, favori ve üç seçenek 2026-09-17'de kararlaştırıldı (NOT.md).
 * Montaj yok: ikisi de hiçbir ekrana bağlı değil, o iş sonraki fazın.
 */

import { useState } from "react";
import DereceGostergesi, {
  DERECE_KADEMELERI,
  puanKademesi,
} from "@/components/corner/DereceGostergesi";
import YineGiderMisin, { type YineGiderDegeri } from "@/components/corner/YineGiderMisin";
import { Alt, Baslik, Kutu, TelefonCercevesi } from "@/app/tasarim/_vitrin/Iskelet";

/* Sayfadaki sayı yazımı bileşeninkiyle aynı: Türkçe virgül. */
const yaz = (p: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(p);

/* Eşiğin iki yanı — sınır değerleri yan yana görmeden eşik denetlenmez. */
const SINIRLAR = [3.5, 4, 6.5, 7, 8.5, 9];

const bosDegis = () => {};

export default function DegerlendirmeSayfasi() {
  /* E1 canlı: PinFormu'ndaki kaydırıcının aynısı — 1–10, yarım adım. */
  const [puan, setPuan] = useState(7);

  /* E2 canlı: cevap nullable. Kalbin ayrı state'i YOK — aynı `puan`dan
     okunuyor, çünkü favorim puanın ≥ 9 kademesi. */
  const [tekrar, setTekrar] = useState<YineGiderDegeri | null>(null);

  /* Aynı kaydırıcı iki yerde: E1'in canlı kutusunda ve E2'nin yanında. */
  const kaydirici = (
    <label className="flex items-center gap-3 text-2xs lowercase tracking-ui text-gri-600">
      puan
      <input
        type="range"
        min={1}
        max={10}
        step={0.5}
        value={puan}
        onChange={(e) => setPuan(Number(e.target.value))}
        aria-label="puan"
        className="w-56 max-w-full accent-gri-900"
      />
      <code className="w-8 font-sayi text-xs text-gri-900">{yaz(puan)}</code>
    </label>
  );

  return (
    <main className="iridesan min-h-dvh">
      <div className="mx-auto max-w-[900px] px-4 pb-24 pt-10">
        <p className="text-2xs font-bold uppercase tracking-etiket text-gri-500">
          kadıköy harita · corner dili · faz 2
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-siki text-gri-900">
          Değerlendirme
        </h1>
        <p className="mt-2 max-w-[62ch] font-metin text-base text-gri-800">
          Değerlendirmenin iki bileşeni: <code className="font-sayi text-sm">E1 · E2</code>.
          Veri modeli değişmiyor — uygulamadaki 1–10 puan kalıyor, E1 onu yalnızca
          Corner&apos;ın dört kademeli çipleriyle <strong>gösteriyor</strong>. E2 ise zaten
          şemada olan <code className="font-sayi text-sm">pins.would_return</code> alanının
          görünümü. İkisi de Pill/Kart primitiflerinin üstüne kuruldu, hiçbiri veri çekmiyor.
        </p>

        {/* ============ 1 · E1 ============ */}
        <Baslik
          no="01"
          id="DereceGostergesi"
          ad="Derece göstergesi"
          kod="E1 · DereceGostergesi"
          not="Referansta disliked / okay / liked / favorite. Bizde sayı kalıyor, kademe onun okunuşu. Dört çip yan yana ama yalnızca seçili olan yazısını taşıyor: dördünün tam etiketi 390 pikselde sığmıyor, iki satıra kırılan bir ölçek de sıralı okunmuyor. Seçili hâl siyah halka; diğerleri soluk ve gri tonlu."
        />

        <Kutu baslik="canlı — PinFormu’ndaki kaydırıcı: 1–10, yarım adım">
          <div className="flex flex-col gap-4">
            {kaydirici}
            <DereceGostergesi puan={puan} puanGoster />
            <DereceGostergesi puan={puan} bicim="tek" />
          </div>
          <Alt>
            üstte ölçek + sayı · altta tek biçim · kademe:{" "}
            <code className="font-sayi">{puanKademesi(puan)}</code> · ekran okuyucu tek cümle duyuyor,
            dört düğme değil
          </Alt>
        </Kutu>

        <Kutu baslik="dört kademe (donmuş)">
          <div className="flex flex-col gap-3">
            {[2, 5.5, 8, 9.5].map((p) => (
              <div key={p} className="flex flex-wrap items-center gap-3">
                <code className="w-8 font-sayi text-2xs text-gri-500">{yaz(p)}</code>
                <DereceGostergesi puan={p} />
              </div>
            ))}
          </div>
          <Alt>emoji tonun yedeği değil ölçeğin kendisi — gri tonlu olanlar da sırayı söylüyor</Alt>
        </Kutu>

        <Kutu baslik="eşik sınırları — karar 2026-09-17">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            {SINIRLAR.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <code className="w-7 font-sayi text-2xs text-gri-500">{yaz(p)}</code>
                <DereceGostergesi puan={p} bicim="tek" />
              </div>
            ))}
          </div>
          <Alt>
            {DERECE_KADEMELERI.map((k, i) => {
              const sonraki = DERECE_KADEMELERI[i + 1];
              return (
                <span key={k.id}>
                  {i > 0 && " · "}
                  {k.ad} {sonraki ? `< ${sonraki.alt}` : `≥ ${k.alt}`}
                </span>
              );
            })}
          </Alt>
        </Kutu>

        <Kutu baslik="ortalama · boş · yükleniyor">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <DereceGostergesi puan={8.26} puanGoster />
              <span className="text-2xs lowercase tracking-ui text-gri-500">mekan ortalaması 8,26</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DereceGostergesi puan={null} />
              <DereceGostergesi puan={null} bicim="tek" />
              <span className="text-2xs lowercase tracking-ui text-gri-500">henüz pin yok</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DereceGostergesi puan={7} yukleniyor />
              <DereceGostergesi puan={7} bicim="tek" yukleniyor />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DereceGostergesi puan={4.5} boy="kucuk" puanGoster />
              <DereceGostergesi puan={4.5} boy="kucuk" yukleniyor />
              <span className="text-2xs lowercase tracking-ui text-gri-500">küçük boy + yer tutucusu</span>
            </div>
            <div className="w-[250px] rounded-md p-2" style={{ border: "1px dashed var(--cizgi)" }}>
              <DereceGostergesi puan={2} puanGoster />
            </div>
          </div>
          <Alt>
            ortalama ondalık da olsa tek kademeye düşüyor, sayı bir haneye yuvarlanıyor · boş ölçekte
            hiçbiri seçili değil · yer tutucu gerçek çiplerle aynı yeri kaplıyor · 250 piksellik kesik
            çerçeve: sayı alta iniyor, seçili yazı kırpılıyor, emoji çipler küçülmüyor
          </Alt>
        </Kutu>

        {/* ============ 2 · E2 ============ */}
        <Baslik
          no="02"
          id="YineGiderMisin"
          ad="Yine gider miydin"
          kod="E2 · YineGiderMisin"
          not="Referansta would you go back? — 👎 / 👍 ikilisi ve ayrı bir ♥ fav’d kutusu. Bizde iki değil ÜÇ seçenek var, çünkü şema öyle: pins.would_return in ('evet','belki','hayır'). Seçili hâl dolu siyah değil siyah halka. Favorim kalbi düğme değil rozet: ayrı bir favori alanı açılmadı, kalp puanın ≥ 9 okunuşu ve sorunun yanında ancak o zaman beliriyor."
        />

        <Kutu baslik="canlı — tıkla, seçiliyi tekrar tıkla boşalt · puanı 9’a çek, kalp belirsin">
          <div className="flex max-w-[420px] flex-col gap-3">
            {kaydirici}
            <YineGiderMisin deger={tekrar} onDegis={setTekrar} ipucu="isteğe bağlı" puan={puan} />
          </div>
          <Alt>
            değer: <code className="font-sayi">{tekrar === null ? "null" : `"${tekrar}"`}</code> · kademe:{" "}
            <code className="font-sayi">{puanKademesi(puan)}</code> · değer aynen `pins.would_return`e
            yazılabilir, kalp hiçbir yere yazılmıyor
          </Alt>
        </Kutu>

        <Kutu baslik="üç durum (donmuş)">
          <div className="grid gap-3 md:grid-cols-3">
            {(["evet", "belki", "hayır"] as const).map((d) => (
              <YineGiderMisin key={d} deger={d} onDegis={bosDegis} />
            ))}
          </div>
          <Alt>halka tek işaret; yazı ağırlığı değişmiyor, gölge bir kademe düşüyor</Alt>
        </Kutu>

        <Kutu baslik="favorim · bekleyen istek · pasif · uzun soru">
          <div className="grid gap-3 md:grid-cols-2">
            <YineGiderMisin deger="evet" onDegis={bosDegis} puan={9.5} />
            <YineGiderMisin deger="evet" onDegis={bosDegis} puan={8.5} />
            <YineGiderMisin deger={null} onDegis={bosDegis} yukleniyor="belki" />
            <YineGiderMisin deger="hayır" onDegis={bosDegis} pasif puan={9} />
            <YineGiderMisin
              deger="belki"
              onDegis={bosDegis}
              baslik="bu mekana bir daha yolun düşse içeri girer miydin?"
              ipucu="isteğe bağlı"
              puan={10}
            />
          </div>
          <Alt>
            soldan sağa, yukarıdan aşağı: puan 9,5 → favorim · puan 8,5 → kalp yok · bekleyen istek ·
            pasif (giriş yok / demo hesap), rozet pasiften etkilenmiyor çünkü basılmıyor · uzun soru +
            rozet + ipucu aynı satırda sarıyor
          </Alt>
        </Kutu>

        {/* ============ 3 · dar çerçeve ============ */}
        <Baslik
          no="03"
          ad="Dar çerçeve"
          kod="390 px · asıl kullanım"
          not="Uygulama telefonda yaşıyor. Aşağıdaki sütun tam 390 piksel ve bir pin detayının değerlendirme bloğunu taklit ediyor — düzen yalnızca oturuşu görmek için, montaj değil."
        />

        <Kutu baslik="390 px · pin detayı" yalin>
          <TelefonCercevesi className="flex flex-col gap-3 overflow-hidden">
            <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
              <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">bana hitap puanı</div>
              <div className="mt-2.5">
                <DereceGostergesi puan={puan} puanGoster />
              </div>
            </div>
            <YineGiderMisin deger={tekrar} onDegis={setTekrar} ipucu="isteğe bağlı" puan={puan} />
            {/* Akış kartındaki dar yer: yalnızca tek çip, küçük boy. */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-yuzey p-3 shadow-kat-1">
              <span className="min-w-0 truncate text-sm font-extrabold uppercase tracking-siki text-gri-900">
                ☕ Yeldeğirmeni Kahvecisi
              </span>
              <DereceGostergesi puan={9.5} bicim="tek" boy="kucuk" />
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-yuzey p-3 shadow-kat-1">
              <span className="text-sm font-bold text-gri-900">Deniz Arslan</span>
              <DereceGostergesi puan={3} boy="kucuk" puanGoster />
            </div>
          </TelefonCercevesi>
          <Alt>
            yatay taşma var mı · en geniş kademe (beğenmedim) de tek satır mı · puan 9 ve üstünde
            kalp rozeti başlık satırını itmiyor mu · dar kapta önce sayı alta iniyor, sonra seçili
            yazı kırpılıyor
          </Alt>
        </Kutu>

        {/* ============ kapanış ============ */}
        <Baslik
          no="04"
          ad="Verilen kararlar"
          kod="2026-09-17 · NOT.md"
          not="Önizlemenin ilk hâlinde soru olarak duranlar; hepsi kararlaştırıldı."
        />

        <div className="flex flex-col gap-2.5">
          <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
            <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">E1 · eşik</div>
            <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-800">
              4 altı beğenmedim, 4–6,5 idare eder, 7–8,5 beğendim, 9 ve üstü favorim. Demo
              pinlerin puanları 6,5–9,5 arasında toplanıyor; “belki” diyen iki pin 6,5 ve 7’de.
              Kaydırıcının varsayılanı 7 kalıyor — dokunulmamış puan “beğendim” okunuyor, kabul.
              Gerçek pin birikince <code className="font-sayi">rating_buckets</code> ile yeniden bakılacak.
            </p>
          </div>
          <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
            <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">E2 · favorim kalbi</div>
            <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-800">
              Puanın ≥ 9 okunuşu. Yeni sütun açılmadı; kalp E1’in favorim bandından türüyor, bu
              yüzden düğme değil rozet.
            </p>
          </div>
          <div className="rounded-lg bg-yuzey p-4 shadow-kat-1">
            <div className="text-2xs font-bold uppercase tracking-etiket text-gri-500">E2 · üç seçenek</div>
            <p className="mt-1.5 max-w-[62ch] font-metin text-sm text-gri-800">
              Kalıyor. Spec 👎/👍 ikilisi diyordu; şema ve PinFormu üç değer tutuyor, “belki”
              bu üründe bilgi taşıyor.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
