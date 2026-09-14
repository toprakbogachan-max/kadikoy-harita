/**
 * Arayüzün kullandığı alan modeli.
 *
 * Veritabanı İngilizce (SQL geleneği), arayüz Türkçe. Çeviri tek yerde,
 * lib/veri.ts sınırında yapılır — bileşenler `place.opening_hours` değil
 * `yer.saatler` görür. Böylece şema adları değişince tek dosya değişir.
 *
 * Şemadaki ham satır tipleri için lib/types.ts'e bak.
 */
import type { PlaceCategory } from "./types";

export interface Yer {
  id: string;                 // uuid
  slug: string;
  ad: string;
  tur: PlaceCategory;
  semt: string;
  lat: number;
  lng: number;
  /** [[gun, "HH:MM", "HH:MM"]] · null = saat bilgisi YOK (kapalı değil) */
  saatler: number[][] | null;
  /** places_nearby'den gelir; null = saat bilgisi yok */
  acik?: boolean | null;
  pinSayisi?: number;
  uzaklik?: number;
  uyari?: string | null;
  fiyat?: number | null;
  /**
   * Kapak görseli — mekanı temsil eden fotoğraf.
   * Önce en çok beğenilen pinin fotoğrafı, o yoksa Wikimedia referans görseli.
   * `kapakKredi` yalnızca ikincisinde dolu olur (CC-BY atıf zorunluluğu).
   */
  kapak?: string | null;
  /** CC-BY ailesi bunu görünür yerde göstermeyi şart koşar */
  kapakKredi?: string | null;
}

export interface Medya {
  tur: "foto" | "video";
  not: string | null;
  yol: string;
}

export interface Pin {
  id: string;
  kisi: string;               // profil id (uuid)
  yer: string;                // mekan id (uuid)
  yerAdi: string;
  yerSemt: string;
  yerTuru: PlaceCategory;
  /** kaç saat önce atıldı — arayüz "3 sa" diye gösteriyor */
  saat: number;
  puan: number;               // 1–10, yarım adımlı
  kelimeler: string[];
  senaryo: string;
  metin: string;
  siklik?: string | null;
  tekrar?: string | null;
  degisse?: string | null;
  fiyat?: number | null;
  begeni: number;
  yorumSayisi: number;
  medyalar: Medya[];
}

export interface Kisi {
  id: string;                 // uuid
  ad: string;
  k: string;                  // kullanıcı adı
  bio: string;
  foto: string | null;
  takipci: number;
  takip: number;
  pinSayisi: number;
  /** profiles.is_public — kapalıysa profili yalnızca sahibi görür */
  acikMi?: boolean;
  /**
   * Sosyal hesaplar — "@" ve URL olmadan, yalnızca kullanıcı adı.
   * Bağlantıyı arayüz kuruyor (lib/paleti.ts → SOSYAL).
   */
  twitter?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  ben?: boolean;
}

export interface Yorum {
  id: string;
  pin: string;
  kisi: string;
  saat: number;
  metin: string;
}

export interface Liste {
  id: string;
  sahip: string;
  slug: string;
  baslik: string;
  not: string | null;
  /**
   * Kapak — listenin SAHİBİ seçer (şema: lists.cover_url).
   * Mekan kapağının tersi: orada kapak en çok beğenilen pinden kendiliğinden
   * gelir, burada seçki kişisel olduğu için kapak da kişisel bir karardır.
   * null = kapak yok, kart mekanların kategori degradesine düşer.
   */
  kapak: string | null;
  /** Kare kartta fotoğrafın hangi dikey bandı görünecek, 0–100 (varsayılan 50). */
  kapakKonum: number;
  yerler: Yer[];
}
