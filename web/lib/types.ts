/**
 * schema.sql ile birebir hizalı tipler.
 * Şema değişirse burası da değişmeli — tek doğruluk kaynağı schema.sql.
 */

export type PlaceCategory =
  | "kahve" | "yemek" | "bar" | "tatli" | "kultur" | "park"
  | "otel" | "magaza" | "diger";

export type ContentStatus = "draft" | "published" | "hidden" | "removed";
export type MediaKind = "photo" | "video";
export type WouldReturn = "evet" | "belki" | "hayır";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  pin_count: number;
  follower_count: number;
  following_count: number;
}

/** opening_hours: [{d:0-6, open:"HH:MM", close:"HH:MM"}] — null ise saat bilgisi YOK (kapalı değil) */
export interface OpeningPeriod { d: number; open: string; close: string }

export interface Place {
  id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  neighborhood: string | null;
  address: string | null;
  opening_hours: OpeningPeriod[] | null;
  pin_count: number;
  save_count: number;
  created_by: string | null;
}

/** places_nearby() dönüşü */
export interface NearbyPlace extends Pick<Place, "id" | "slug" | "name" | "category" | "neighborhood" | "pin_count"> {
  lat: number;
  lng: number;
  distance_m: number;
  is_open: boolean | null;      // null = saat bilgisi yok
  warning: string | null;
  price_per_person: number | null;
  /** en çok beğenilen pinin fotoğraf yolu (Storage) — yoksa null */
  cover_path: string | null;
  /** Wikimedia referans görseli — yalnızca pin fotoğrafı yokken kullanılır */
  cover_url: string | null;
}

export interface PinMedia {
  id: string;
  pin_id: string;
  kind: MediaKind;
  storage_path: string;
  caption: string | null;       // her medyanın kendi notu (karuselde altında görünür)
  ordering: number;
}

export interface Pin {
  id: string;
  author_id: string;
  place_id: string;
  /* kalite kapısı — hepsi zorunlu */
  body: string;                 // somut not, >= 15 karakter
  words: [string, string, string];
  scenario: string;             // geliş senaryosu
  rating: number;               // 1–10 "bana hitap puanı"
  /* isteğe bağlı */
  improve: string | null;       // "bir şey değişse"
  frequency: string | null;
  would_return: WouldReturn | null;
  price_paid: number | null;
  visit_date: string | null;
  status: ContentStatus;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface PinComment {
  id: string;
  pin_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface PlaceList {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  intro: string | null;
  is_public: boolean;
}

/** place_summary(place, viewer) dönüşü */
export interface PlaceSummary {
  pin_count: number;
  rating_avg: number | null;
  rating_buckets: number[];          // 1..10
  following_avg: number | null;      // takip ettiklerinin ayrı ortalaması
  following_ids: string[];
  words: [string, number][];         // kelime bulutu
  top_scenario: string | null;
  would_return: number;
  improvements: { author: string; text: string }[];
  save_count: number;
}
