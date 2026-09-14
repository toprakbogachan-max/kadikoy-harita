/**
 * Kategori paleti ve ikonları — veri değil, sunum sabiti.
 *
 * demo.ts'ten buraya taşındı: mekan verisi Supabase'den geliyor ama
 * "kahve = kahverengi post-it, fincan ikonu" kararı kodda kalır.
 */

export const RENK: Record<string, { isik: string; ana: string; golge: string }> = {
  "yemek": {
    "isik": "#FF7A6B",
    "ana": "#E0271C",
    "golge": "#921008"
  },
  "kahve": {
    "isik": "#F5C87C",
    "ana": "#DE9B2E",
    "golge": "#8E5C11"
  },
  "bar": {
    "isik": "#B4A8F2",
    "ana": "#7360C4",
    "golge": "#412F86"
  },
  "tatli": {
    "isik": "#F8AEC4",
    "ana": "#DC6389",
    "golge": "#8F3053"
  },
  "kultur": {
    "isik": "#7ECDB8",
    "ana": "#329179",
    "golge": "#12594B"
  },
  "park": {
    "isik": "#A0D394",
    "ana": "#569E4C",
    "golge": "#2D652A"
  },
  /* Şemadaki enum dokuz kategori tanımlıyor; palet yalnızca altısını
     biliyordu. Eksik üçü RENK'te bulunamayınca jetonSVG gri "kapali"
     rengine düşüyor, yani AÇIK bir oteli kapalı gibi çiziyordu — 50 otel
     ve 23 mağaza haritada böyle duruyordu. */
  "otel": {
    "isik": "#86C0DE",
    "ana": "#2A6F97",
    "golge": "#123F58"
  },
  "magaza": {
    "isik": "#F0A878",
    "ana": "#C8631F",
    "golge": "#7A3608"
  },
  "diger": {
    "isik": "#C6B7A2",
    "ana": "#7E6C55",
    "golge": "#453A2C"
  },
  "kapali": {
    "isik": "#DCE3E5",
    "ana": "#A9B6BA",
    "golge": "#6B7C82"
  }
};

export const KAGIT: Record<string, string> = {
  "yemek": "#FBDDD5",
  "kahve": "#FBEECB",
  "bar": "#E3DDF8",
  "tatli": "#FBDCE7",
  "kultur": "#D5EAE2",
  "park": "#E0EDD2",
  "otel": "#D6E7F2",
  "magaza": "#FAE1CE",
  "diger": "#EAE3D6"
};

export const TUR_AD: Record<string, string> = {
  "kahve": "Kahve",
  "yemek": "Yemek",
  "bar": "Bar",
  "tatli": "Tatlı",
  "kultur": "Kültür",
  "park": "Park",
  "otel": "Otel",
  "magaza": "Mağaza",
  "diger": "Diğer"
};

/**
 * Kategori emojisi.
 *
 * Skill §6: emoji süs değil ARAYÜZ ELEMANI. Kategori rengi UI'dan
 * çekildiği için (doygun çip yok) kategoriyi bir bakışta taşıyan şey
 * artık bu. SIMGE'nin (SVG) yerini almıyor, onunla birlikte çalışıyor:
 * emoji metnin yanında, SVG fotoğrafsız zeminin ortasında.
 */
export const EMOJI: Record<string, string> = {
  "kahve":  "☕",
  "yemek":  "🍽️",
  "bar":    "🍸",
  "tatli":  "🍰",
  "kultur": "🎭",
  "park":   "🌳",
  "otel":   "🛎️",
  "magaza": "🛍️",
  "diger":  "📍",
};

/** Kategori emojisi — tanınmayan tür "📍"ye düşer. */
export const emoji = (tur: string) => EMOJI[tur] ?? EMOJI.diger;

export const SIMGE: Record<string, string> = {
  "kahve": "<path d=\"M6.5 8.5h9.5v4.8a4.75 4.75 0 0 1-9.5 0z\"/><path d=\"M16 9.8h1.7a2.4 2.4 0 0 1 0 4.8H16\"/><path d=\"M5.5 20.2h11.5\"/>",
  "yemek": "<path d=\"M7.6 3.8v5.1a2.1 2.1 0 0 0 4.2 0V3.8\"/><path d=\"M9.7 11v9.2\"/><path d=\"M16.6 3.8c1.9 1.9 1.9 5.7 0 7.6v8.8\"/>",
  "bar": "<path d=\"M5.2 5.2h13.6l-6.8 7.1z\"/><path d=\"M12 12.3v6.4\"/><path d=\"M8.4 19.4h7.2\"/>",
  "tatli": "<path d=\"M6.4 11.2a5.6 4.6 0 0 1 11.2 0\"/><path d=\"M6.4 11.2h11.2l-1.8 8.4H8.2z\"/><path d=\"M12 11.2v8.4\"/>",
  "kultur": "<path d=\"M3.4 10.9 12 5.2l8.6 5.7\"/><path d=\"M4.6 19.6h14.8\"/><path d=\"M7.4 19.6v-7.3M12 19.6v-7.3M16.6 19.6v-7.3\"/>",
  "park": "<path d=\"M12 20.6v-5.4\"/><path d=\"M12 15.6c-3.9 0-6.3-2.6-6.3-5.4a6.3 6.3 0 0 1 12.6 0c0 2.8-2.4 5.4-6.3 5.4z\"/>",
  "otel": "<path d=\"M3.9 19.4v-9.6\"/><path d=\"M3.9 13.4h16.2v6\"/><path d=\"M20.1 19.4v-2.6\"/><circle cx=\"8.1\" cy=\"10.3\" r=\"2.1\"/>",
  "magaza": "<path d=\"M5.4 8.5h13.2l-1.1 11.1H6.5z\"/><path d=\"M8.9 10.6V7.5a3.1 3.1 0 0 1 6.2 0v3.1\"/>",
  "diger": "<circle cx=\"12\" cy=\"12\" r=\"7.3\"/><circle cx=\"12\" cy=\"12\" r=\"2.2\"/>"
};

/**
 * Sosyal hesaplar — profilde bio'nun altında duran üç ikon.
 *
 * Saklanan şey yalnızca kullanıcı adı (göç 17); bağlantıyı buradaki `url`
 * kuruyor. Tek yerde durması, ileride bir platform adres değiştirdiğinde
 * (twitter.com → x.com gibi) tek satır düzeltmek için.
 *
 * `yol` fill ile çizilen marka işareti — kategori ikonlarının aksine çizgi
 * değil dolu, çünkü marka işaretleri öyle tanınıyor.
 */
export const SOSYAL = {
  twitter: {
    ad: "X",
    url: (k: string) => `https://x.com/${k}`,
    yol: "M17.6 3h3.3l-7.2 8.2L22 21h-6.6l-5.2-6.7L4.3 21H1l7.7-8.8L1.3 3H8l4.7 6.2zm-1.2 16h1.8L7.7 4.8H5.8z",
  },
  instagram: {
    ad: "Instagram",
    url: (k: string) => `https://instagram.com/${k}`,
    yol: "M12 2.2c3.2 0 3.6 0 4.9.07 3.3.15 4.8 1.7 4.95 4.95.06 1.3.07 1.7.07 4.88s-.01 3.6-.07 4.88c-.15 3.25-1.65 4.8-4.95 4.95-1.3.06-1.7.07-4.9.07s-3.6-.01-4.88-.07c-3.3-.15-4.8-1.7-4.95-4.95C2.11 15.6 2.1 15.2 2.1 12s.01-3.6.07-4.88C2.32 3.87 3.82 2.32 7.12 2.17 8.4 2.11 8.8 2.1 12 2.1zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zm5.3-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  },
  tiktok: {
    ad: "TikTok",
    url: (k: string) => `https://tiktok.com/@${k}`,
    yol: "M16.6 2h-3.1v13.1a2.6 2.6 0 1 1-2.2-2.57V9.4a5.7 5.7 0 1 0 5.3 5.68V8.6a7 7 0 0 0 4.1 1.32V6.8a4 4 0 0 1-4.1-3.9z",
  },
} as const;

export type SosyalAd = keyof typeof SOSYAL;
export const SOSYAL_SIRA: SosyalAd[] = ["twitter", "instagram", "tiktok"];
