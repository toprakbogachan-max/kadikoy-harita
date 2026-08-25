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
  "park": "#E0EDD2"
};

export const TUR_AD: Record<string, string> = {
  "kahve": "Kahve",
  "yemek": "Yemek",
  "bar": "Bar",
  "tatli": "Tatlı",
  "kultur": "Kültür",
  "park": "Park"
};

export const SIMGE: Record<string, string> = {
  "kahve": "<path d=\"M6.5 8.5h9.5v4.8a4.75 4.75 0 0 1-9.5 0z\"/><path d=\"M16 9.8h1.7a2.4 2.4 0 0 1 0 4.8H16\"/><path d=\"M5.5 20.2h11.5\"/>",
  "yemek": "<path d=\"M7.6 3.8v5.1a2.1 2.1 0 0 0 4.2 0V3.8\"/><path d=\"M9.7 11v9.2\"/><path d=\"M16.6 3.8c1.9 1.9 1.9 5.7 0 7.6v8.8\"/>",
  "bar": "<path d=\"M5.2 5.2h13.6l-6.8 7.1z\"/><path d=\"M12 12.3v6.4\"/><path d=\"M8.4 19.4h7.2\"/>",
  "tatli": "<path d=\"M6.4 11.2a5.6 4.6 0 0 1 11.2 0\"/><path d=\"M6.4 11.2h11.2l-1.8 8.4H8.2z\"/><path d=\"M12 11.2v8.4\"/>",
  "kultur": "<path d=\"M3.4 10.9 12 5.2l8.6 5.7\"/><path d=\"M4.6 19.6h14.8\"/><path d=\"M7.4 19.6v-7.3M12 19.6v-7.3M16.6 19.6v-7.3\"/>",
  "park": "<path d=\"M12 20.6v-5.4\"/><path d=\"M12 15.6c-3.9 0-6.3-2.6-6.3-5.4a6.3 6.3 0 0 1 12.6 0c0 2.8-2.4 5.4-6.3 5.4z\"/>"
};
