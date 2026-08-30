"use client";

import type { PlaceCategory } from "./types";
import { KADIKOY_SINIR } from "./konum";

/**
 * Coğrafi arama — kendi veritabanımızda olmayan yerleri bulmak için.
 *
 * Neden gerekti: altlık haritanın etiketleri OpenMapTiles'tan geliyor, bizim
 * 1064 mekanımızdan değil. Kullanıcı haritada "Migros Jet" okuyup arattığında
 * hiçbir şey bulamıyordu — mekanı elle işaretlemesi gerekiyordu.
 *
 * Sağlayıcı Photon (komoot), OpenStreetMap verisi üstünde çalışıyor. Nominatim
 * DEĞİL: Nominatim'in kullanım şartları yazdıkça arama yapan kutuları açıkça
 * yasaklıyor, Photon ise tam bu iş için yazılmış.
 *
 * GİZLİLİK: kullanıcının yazdığı metin komoot'un sunucusuna gidiyor. Yasal
 * metinde (YasalMetin.tsx → "Dış kaynaklar") bu yazılı.
 */

const UC = "https://photon.komoot.io/api/";

/** Kadıköy merkezine yakınlık ağırlığı — aynı adlı yerlerde yakın olan öne çıkıyor. */
const MERKEZ = { lat: 40.9885, lng: 29.0295 };

/* Photon'un osm_key değeri: neyin "mekan" sayıldığını burası belirliyor.
   highway/place/boundary dışarıda — kullanıcı sokağa pin atmıyor. */
const MEKAN_ANAHTARLARI = new Set(["amenity", "shop", "tourism", "leisure", "historic", "craft"]);

/* osm_value → bizim kategorilerimiz. Eşleşmeyen her şey "diger". */
const TUR_ESLEME: Record<string, PlaceCategory> = {
  cafe: "kahve", coffee: "kahve", coffee_shop: "kahve", tea: "kahve",
  restaurant: "yemek", fast_food: "yemek", food_court: "yemek", deli: "yemek",
  butcher: "yemek", bakery: "yemek", greengrocer: "yemek",
  bar: "bar", pub: "bar", nightclub: "bar", biergarten: "bar", wine: "bar", alcohol: "bar",
  ice_cream: "tatli", confectionery: "tatli", pastry: "tatli", chocolate: "tatli",
  museum: "kultur", gallery: "kultur", artwork: "kultur", theatre: "kultur",
  cinema: "kultur", library: "kultur", arts_centre: "kultur", books: "kultur",
  music: "kultur", attraction: "kultur", monument: "kultur", memorial: "kultur",
  park: "park", garden: "park", playground: "park", pitch: "park", nature_reserve: "park",
  hotel: "otel", hostel: "otel", guest_house: "otel", apartment: "otel", motel: "otel",
};

export interface HaritaSonucu {
  /** React anahtarı — osm_type + osm_id benzersiz */
  anahtar: string;
  ad: string;
  tur: PlaceCategory;
  semt: string | null;
  /** listede ayırt etmek için: "Moda Cd. 14" */
  adres: string | null;
  lat: number;
  lng: number;
}

interface PhotonOzellik {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number; osm_type?: string; osm_key?: string; osm_value?: string;
    name?: string; street?: string; housenumber?: string; district?: string;
  };
}

/* Photon bazen sokağı "Zühtüpaşa, Bağdat Caddesi" diye veriyor; semt zaten
   ayrı gösterildiği için baştaki tekrarı atıyoruz. */
function adresYaz(sokak?: string, no?: string, semt?: string): string | null {
  let s = sokak ?? "";
  if (semt && s.startsWith(`${semt}, `)) s = s.slice(semt.length + 2);
  return [s, no].filter(Boolean).join(" ") || null;
}

function turBelirle(anahtar?: string, deger?: string): PlaceCategory {
  const d = TUR_ESLEME[deger ?? ""];
  if (d) return d;
  /* Eşleşmeyen dükkânlar mağaza; geri kalan her şey "diger". */
  return anahtar === "shop" ? "magaza" : "diger";
}

/**
 * Kadıköy içinde, adı olan mekanları döndürür.
 *
 * Hata fırlatır — çağıran useVeri'nin `hata` alanıyla kullanıcıya "haritadan
 * arama şu an çalışmıyor" diyebilsin. Sessizce boş dönmek, sonuç olmamasıyla
 * servisin çökmesini ayırt edilemez yapardı.
 */
export async function haritadanAra(q: string, limit = 5): Promise<HaritaSonucu[]> {
  const metin = q.trim();
  if (metin.length < 3) return [];

  const { bati, guney, dogu, kuzey } = KADIKOY_SINIR;
  const adres = new URL(UC);
  adres.searchParams.set("q", metin);
  adres.searchParams.set("lang", "default");
  adres.searchParams.set("lat", String(MERKEZ.lat));
  adres.searchParams.set("lon", String(MERKEZ.lng));
  adres.searchParams.set("bbox", `${bati},${guney},${dogu},${kuzey}`);
  /* Elenecekler (sokaklar, adsızlar) çıktıktan sonra limit kadar kalsın diye
     üç katı isteniyor. */
  adres.searchParams.set("limit", String(limit * 3));

  const cevap = await fetch(adres, { headers: { Accept: "application/json" } });
  if (!cevap.ok) throw new Error(`Harita araması yanıt vermedi (${cevap.status}).`);
  const veri: { features?: PhotonOzellik[] } = await cevap.json();

  const cikti: HaritaSonucu[] = [];
  const gorulen = new Set<string>();
  for (const f of veri.features ?? []) {
    const p = f.properties;
    const k = f.geometry?.coordinates;
    if (!p?.name || !k) continue;
    if (!MEKAN_ANAHTARLARI.has(p.osm_key ?? "")) continue;
    const [lng, lat] = k;
    /* bbox Photon'da ağırlık değil kesin sınır ama yine de doğruluyoruz:
       sınırın dışına düşen bir sonuç kullanıcıyı Kadıköy dışına pin attırırdı. */
    if (lat < guney || lat > kuzey || lng < bati || lng > dogu) continue;

    const anahtar = `${p.osm_type ?? "n"}${p.osm_id ?? cikti.length}`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);

    cikti.push({
      anahtar,
      ad: p.name,
      tur: turBelirle(p.osm_key, p.osm_value),
      semt: p.district ?? null,
      adres: adresYaz(p.street, p.housenumber, p.district),
      lat, lng,
    });
    if (cikti.length >= limit) break;
  }
  return cikti;
}
