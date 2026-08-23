/**
 * Demo verisi — prototip.html'den kayıpsız aktarıldı.
 * GEÇİCİ: Supabase bağlanınca yerini gerçek sorgular alacak.
 * Mekanlar ve kullanıcılar uydurma (gerçek işletmeler hakkında yanlış bilgi vermemek için).
 */
import type { PlaceCategory } from './types';

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

/** post-it kağıt renkleri — kategori rengiyle aynı aile, üstüne yazı yazılabilir tonda */
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

/** kategori simgeleri (SVG path içerikleri) */
export const SIMGE: Record<string, string> = {
  "kahve": "<path d=\"M6.5 8.5h9.5v4.8a4.75 4.75 0 0 1-9.5 0z\"/><path d=\"M16 9.8h1.7a2.4 2.4 0 0 1 0 4.8H16\"/><path d=\"M5.5 20.2h11.5\"/>",
  "yemek": "<path d=\"M7.6 3.8v5.1a2.1 2.1 0 0 0 4.2 0V3.8\"/><path d=\"M9.7 11v9.2\"/><path d=\"M16.6 3.8c1.9 1.9 1.9 5.7 0 7.6v8.8\"/>",
  "bar": "<path d=\"M5.2 5.2h13.6l-6.8 7.1z\"/><path d=\"M12 12.3v6.4\"/><path d=\"M8.4 19.4h7.2\"/>",
  "tatli": "<path d=\"M6.4 11.2a5.6 4.6 0 0 1 11.2 0\"/><path d=\"M6.4 11.2h11.2l-1.8 8.4H8.2z\"/><path d=\"M12 11.2v8.4\"/>",
  "kultur": "<path d=\"M3.4 10.9 12 5.2l8.6 5.7\"/><path d=\"M4.6 19.6h14.8\"/><path d=\"M7.4 19.6v-7.3M12 19.6v-7.3M16.6 19.6v-7.3\"/>",
  "park": "<path d=\"M12 20.6v-5.4\"/><path d=\"M12 15.6c-3.9 0-6.3-2.6-6.3-5.4a6.3 6.3 0 0 1 12.6 0c0 2.8-2.4 5.4-6.3 5.4z\"/>"
};

export interface DemoKisi { ad: string; k: string; renk: string; bio: string; takipci: number; takip: number; ben?: boolean; foto?: string | null }
export const KISILER: Record<string, DemoKisi> = {
  "bogac": {
    "ad": "Bogaç",
    "k": "bogac",
    "renk": "#B8801A",
    "bio": "Kadıköy’de büyüdüm. Turist gibi değil, komşu gibi gezdiriyorum.",
    "takipci": 1284,
    "takip": 96,
    "ben": true
  },
  "elif": {
    "ad": "Elif",
    "k": "elifgezer",
    "renk": "#2E8C74",
    "bio": "Sabah kahvesi avcısı.",
    "takipci": 412,
    "takip": 203
  },
  "mert": {
    "ad": "Mert",
    "k": "mertdmr",
    "renk": "#6A57BC",
    "bio": "Akşamcı. Meyhane arşivi tutuyorum.",
    "takipci": 238,
    "takip": 151
  },
  "zeynep": {
    "ad": "Zeynep",
    "k": "zynp",
    "renk": "#C9557C",
    "bio": "Tatlı için yol yürürüm.",
    "takipci": 906,
    "takip": 88
  },
  "can": {
    "ad": "Can",
    "k": "canyz",
    "renk": "#CF3A2C",
    "bio": "Uzaktan çalışıyorum, priz haritası bende.",
    "takipci": 157,
    "takip": 310
  }
};

export interface DemoYer {
  id: string; ad: string; tur: PlaceCategory; semt: string; lat: number; lng: number;
  saatler: number[][] | null | undefined;
  fiyat?: number; kayit?: number; rezervasyon?: string; sadeceNakit?: boolean;
  iyiGelir?: string[]; enIyiSaat?: string; uyari?: string; ekleyen?: string;
}
export const YERLER: DemoYer[] = [
  {
    "id": "poyraz",
    "ad": "Poyraz Kahve",
    "tur": "kahve",
    "semt": "Moda",
    "lat": 40.9788,
    "lng": 29.0246,
    "kayit": 41,
    "saatler": [
      [
        1,
        "08:00",
        "22:00"
      ],
      [
        2,
        "08:00",
        "22:00"
      ],
      [
        3,
        "08:00",
        "22:00"
      ],
      [
        4,
        "08:00",
        "22:00"
      ],
      [
        5,
        "08:00",
        "23:30"
      ],
      [
        6,
        "09:00",
        "23:30"
      ],
      [
        0,
        "09:00",
        "21:00"
      ]
    ],
    "fiyat": 220,
    "iyiGelir": [
      "tek başına",
      "çalışmak"
    ],
    "enIyiSaat": "hafta içi 15:00 sonrası boş"
  },
  {
    "id": "iskele",
    "ad": "İskele Meyhanesi",
    "tur": "yemek",
    "semt": "Rıhtım",
    "lat": 40.9917,
    "lng": 29.0243,
    "kayit": 58,
    "saatler": [
      [
        2,
        "18:00",
        "01:00"
      ],
      [
        3,
        "18:00",
        "01:00"
      ],
      [
        4,
        "18:00",
        "01:00"
      ],
      [
        5,
        "18:00",
        "02:00"
      ],
      [
        6,
        "18:00",
        "02:00"
      ],
      [
        0,
        "18:00",
        "00:00"
      ]
    ],
    "fiyat": 900,
    "rezervasyon": "sadece telefonla, 2 gün önceden",
    "iyiGelir": [
      "kalabalık"
    ],
    "uyari": "Pazartesi kapalı. Rezervasyonsuz gidilmez."
  },
  {
    "id": "firin",
    "ad": "Yeldeğirmeni Fırın",
    "tur": "tatli",
    "semt": "Yeldeğirmeni",
    "lat": 40.9968,
    "lng": 29.0271,
    "kayit": 19,
    "saatler": [
      [
        1,
        "07:30",
        "19:00"
      ],
      [
        2,
        "07:30",
        "19:00"
      ],
      [
        3,
        "07:30",
        "19:00"
      ],
      [
        4,
        "07:30",
        "19:00"
      ],
      [
        5,
        "07:30",
        "19:00"
      ],
      [
        6,
        "08:00",
        "19:00"
      ]
    ],
    "fiyat": 120,
    "sadeceNakit": true,
    "iyiGelir": [
      "tek başına"
    ],
    "uyari": "Kart geçmiyor. Pazar kapalı."
  },
  {
    "id": "ocak",
    "ad": "Kuşdili Ocakbaşı",
    "tur": "yemek",
    "semt": "Kuşdili",
    "lat": 40.9906,
    "lng": 29.0348,
    "kayit": 33,
    "saatler": [
      [
        1,
        "12:00",
        "23:00"
      ],
      [
        2,
        "12:00",
        "23:00"
      ],
      [
        3,
        "12:00",
        "23:00"
      ],
      [
        4,
        "12:00",
        "23:00"
      ],
      [
        5,
        "12:00",
        "00:30"
      ],
      [
        6,
        "12:00",
        "00:30"
      ],
      [
        0,
        "12:00",
        "22:00"
      ]
    ],
    "fiyat": 650,
    "iyiGelir": [
      "kalabalık",
      "ilk buluşma"
    ],
    "enIyiSaat": "öğlen menüsü 15:00'e kadar"
  },
  {
    "id": "kitap",
    "ad": "Bahariye Kitap & Kahve",
    "tur": "kahve",
    "semt": "Bahariye",
    "lat": 40.9879,
    "lng": 29.0292,
    "kayit": 27,
    "saatler": [
      [
        1,
        "10:00",
        "21:00"
      ],
      [
        2,
        "10:00",
        "21:00"
      ],
      [
        3,
        "10:00",
        "21:00"
      ],
      [
        4,
        "10:00",
        "21:00"
      ],
      [
        5,
        "10:00",
        "22:00"
      ],
      [
        6,
        "10:00",
        "22:00"
      ],
      [
        0,
        "11:00",
        "20:00"
      ]
    ],
    "fiyat": 180,
    "iyiGelir": [
      "tek başına",
      "çalışmak",
      "ilk buluşma"
    ]
  },
  {
    "id": "sahil",
    "ad": "Moda Sahil Parkı",
    "tur": "park",
    "semt": "Moda",
    "lat": 40.9772,
    "lng": 29.0301,
    "kayit": 87,
    "saatler": [
      [
        0,
        "00:00",
        "23:59"
      ],
      [
        1,
        "00:00",
        "23:59"
      ],
      [
        2,
        "00:00",
        "23:59"
      ],
      [
        3,
        "00:00",
        "23:59"
      ],
      [
        4,
        "00:00",
        "23:59"
      ],
      [
        5,
        "00:00",
        "23:59"
      ],
      [
        6,
        "00:00",
        "23:59"
      ]
    ],
    "fiyat": 0,
    "iyiGelir": [
      "tek başına",
      "kalabalık"
    ],
    "enIyiSaat": "gün batımı, yaklaşık 19:30"
  },
  {
    "id": "plak",
    "ad": "Akmar Plak",
    "tur": "kultur",
    "semt": "Bahariye",
    "lat": 40.9892,
    "lng": 29.0284,
    "kayit": 22,
    "saatler": [
      [
        1,
        "11:00",
        "20:00"
      ],
      [
        2,
        "11:00",
        "20:00"
      ],
      [
        3,
        "11:00",
        "20:00"
      ],
      [
        4,
        "11:00",
        "20:00"
      ],
      [
        5,
        "11:00",
        "21:00"
      ],
      [
        6,
        "11:00",
        "21:00"
      ]
    ],
    "fiyat": 0,
    "iyiGelir": [
      "tek başına"
    ],
    "uyari": "Pazar kapalı."
  },
  {
    "id": "bar",
    "ad": "Boğa Bar",
    "tur": "bar",
    "semt": "Rıhtım",
    "lat": 40.9903,
    "lng": 29.0269,
    "kayit": 15,
    "saatler": [
      [
        3,
        "19:00",
        "02:00"
      ],
      [
        4,
        "19:00",
        "02:00"
      ],
      [
        5,
        "19:00",
        "03:00"
      ],
      [
        6,
        "19:00",
        "03:00"
      ],
      [
        0,
        "19:00",
        "01:00"
      ]
    ],
    "fiyat": 450,
    "iyiGelir": [
      "kalabalık"
    ],
    "uyari": "Pazartesi ve salı kapalı."
  },
  {
    "id": "balik",
    "ad": "Kalamış Balıkçısı",
    "tur": "yemek",
    "semt": "Kalamış",
    "lat": 40.9805,
    "lng": 29.0402,
    "kayit": 44,
    "saatler": [
      [
        1,
        "12:00",
        "23:30"
      ],
      [
        2,
        "12:00",
        "23:30"
      ],
      [
        3,
        "12:00",
        "23:30"
      ],
      [
        4,
        "12:00",
        "23:30"
      ],
      [
        5,
        "12:00",
        "00:30"
      ],
      [
        6,
        "12:00",
        "00:30"
      ],
      [
        0,
        "12:00",
        "23:00"
      ]
    ],
    "fiyat": 1100,
    "rezervasyon": "hafta sonu için şart",
    "iyiGelir": [
      "ilk buluşma"
    ],
    "uyari": "Hafta sonu rezervasyonsuz masa yok."
  },
  {
    "id": "yogurtcu",
    "ad": "Yoğurtçu Bahçe",
    "tur": "kahve",
    "semt": "Kuşdili",
    "lat": 40.9931,
    "lng": 29.0325,
    "kayit": 12,
    "saatler": [
      [
        1,
        "09:00",
        "20:00"
      ],
      [
        2,
        "09:00",
        "20:00"
      ],
      [
        3,
        "09:00",
        "20:00"
      ],
      [
        4,
        "09:00",
        "20:00"
      ],
      [
        5,
        "09:00",
        "21:00"
      ],
      [
        6,
        "09:00",
        "21:00"
      ],
      [
        0,
        "09:00",
        "20:00"
      ]
    ],
    "fiyat": 150,
    "iyiGelir": [
      "tek başına",
      "çalışmak"
    ]
  },
  {
    "id": "meze",
    "ad": "Serasker Meze",
    "tur": "yemek",
    "semt": "Çarşı",
    "lat": 40.9895,
    "lng": 29.0257,
    "kayit": 20,
    "saatler": [
      [
        1,
        "11:00",
        "21:00"
      ],
      [
        2,
        "11:00",
        "21:00"
      ],
      [
        3,
        "11:00",
        "21:00"
      ],
      [
        4,
        "11:00",
        "21:00"
      ],
      [
        5,
        "11:00",
        "22:00"
      ],
      [
        6,
        "11:00",
        "22:00"
      ]
    ],
    "fiyat": 400,
    "iyiGelir": [
      "tek başına",
      "kalabalık"
    ],
    "uyari": "Pazar kapalı."
  },
  {
    "id": "tatlici",
    "ad": "Fener Tatlıcısı",
    "tur": "tatli",
    "semt": "Fenerbahçe",
    "lat": 40.9714,
    "lng": 29.0431,
    "kayit": 31,
    "saatler": [
      [
        1,
        "10:00",
        "23:00"
      ],
      [
        2,
        "10:00",
        "23:00"
      ],
      [
        3,
        "10:00",
        "23:00"
      ],
      [
        4,
        "10:00",
        "23:00"
      ],
      [
        5,
        "10:00",
        "00:00"
      ],
      [
        6,
        "10:00",
        "00:00"
      ],
      [
        0,
        "10:00",
        "23:00"
      ]
    ],
    "fiyat": 200,
    "iyiGelir": [
      "kalabalık",
      "ilk buluşma"
    ],
    "enIyiSaat": "akşam yemeğinden sonra"
  }
] as DemoYer[];

export interface DemoMedya { tur: 'foto' | 'video'; not: string | null }
export interface DemoPin {
  id: number; kisi: string; yer: string; saat: number; puan: number;
  kelimeler: string[]; senaryo: string; siklik?: string; tekrar?: string;
  metin: string; degisse?: string | null; fiyat?: number | null; begeni: number;
  medyalar?: DemoMedya[];
}
export const PINLER: DemoPin[] = [
  {
    "id": 1,
    "kisi": "bogac",
    "yer": "iskele",
    "saat": 2,
    "puan": 8.5,
    "medyalar": [
      {
        "tur": "foto",
        "not": "Cam kenarındaki masa — ısrar etmeye değer."
      },
      {
        "tur": "video",
        "not": "Vapur geçerken düdük sesi böyle duyuluyor."
      },
      {
        "tur": "foto",
        "not": "Arka salon: aynı mutfak, bambaşka his."
      }
    ],
    "kelimeler": [
      "eski",
      "gürültülü",
      "sahici"
    ],
    "senaryo": "kalabalık grup",
    "siklik": "yılda birkaç",
    "metin": "Vapur düdüğü duyulan tek masa camın önündeki. Rezervasyon alırken \"cam kenarı\" diye ısrar et, yoksa arka salona atıyorlar.",
    "degisse": "Salı akşamları da müzik olsa",
    "tekrar": "evet",
    "fiyat": 880,
    "begeni": 214
  },
  {
    "id": 2,
    "kisi": "elif",
    "yer": "poyraz",
    "saat": 5,
    "puan": 9,
    "kelimeler": [
      "sakin",
      "ferah",
      "prizli"
    ],
    "senaryo": "çalışmak için",
    "siklik": "haftalık uğrak",
    "metin": "Üst katta priz bol, laptopla saatlerce oturulur. Alt kat gürültülü, kapının yanına oturma.",
    "degisse": "Alt kata da priz koysalar",
    "tekrar": "evet",
    "fiyat": 210,
    "begeni": 96
  },
  {
    "id": 3,
    "kisi": "bogac",
    "yer": "sahil",
    "saat": 8,
    "puan": 9.5,
    "medyalar": [
      {
        "tur": "video",
        "not": "Gün batımı, güney ucu. Kalabalık burada bitiyor."
      },
      {
        "tur": "foto",
        "not": "Bank sayısı az, erken gelmek gerekiyor."
      }
    ],
    "kelimeler": [
      "açık",
      "rüzgarlı",
      "bedava"
    ],
    "senaryo": "tek başına",
    "siklik": "haftalık uğrak",
    "metin": "Çay ocağının olduğu taraf değil, güneye doğru yürü. Kalabalık orada kesiliyor, 10 dakika yürüyünce sahil senin oluyor.",
    "degisse": "Bank sayısı artsa",
    "tekrar": "evet",
    "begeni": 341
  },
  {
    "id": 4,
    "kisi": "zeynep",
    "yer": "firin",
    "saat": 11,
    "puan": 8,
    "kelimeler": [
      "sıcak",
      "küçük",
      "nakit"
    ],
    "senaryo": "hızlı uğrak",
    "siklik": "haftalık uğrak",
    "metin": "Öğleden sonra 16:00 civarı ikinci fırın çıkıyor, sıcak yakalarsın. Kart geçmiyor, nakit al yanına.",
    "degisse": "Kart geçse",
    "tekrar": "evet",
    "fiyat": 110,
    "begeni": 158
  },
  {
    "id": 5,
    "kisi": "can",
    "yer": "kitap",
    "saat": 14,
    "puan": 7.5,
    "kelimeler": [
      "sessiz",
      "kitaplı",
      "yavaş"
    ],
    "senaryo": "çalışmak için",
    "siklik": "ayda bir",
    "metin": "Arka bahçe kışın da açık, soba yakıyorlar. Wi-Fi şifresi kasada, sorman lazım. Toplantı yapılacak yer değil, sessiz.",
    "degisse": "Wi-Fi şifresi masada yazsa",
    "tekrar": "evet",
    "fiyat": 175,
    "begeni": 73
  },
  {
    "id": 6,
    "kisi": "mert",
    "yer": "bar",
    "saat": 20,
    "puan": 8,
    "medya": "video",
    "kelimeler": [
      "canlı",
      "dar",
      "samimi"
    ],
    "senaryo": "kalabalık grup",
    "siklik": "ayda bir",
    "metin": "Canlı müzik cuma-cumartesi 22:00’de başlıyor. Sohbet edecekseniz 21:00’den önce gidin, sonrası bağırışma.",
    "degisse": "Ses biraz kısılsa",
    "tekrar": "evet",
    "fiyat": 430,
    "begeni": 112
  },
  {
    "id": 7,
    "kisi": "bogac",
    "yer": "balik",
    "saat": 26,
    "puan": 7,
    "kelimeler": [
      "manzaralı",
      "pahalı",
      "klasik"
    ],
    "senaryo": "ilk buluşma",
    "siklik": "yılda birkaç",
    "metin": "Fiyatı sorup öyle sipariş ver, günlük balık tahtada yazmıyor. Hesap sürprizi burada klasik.",
    "degisse": "Fiyatlar tahtada yazsa",
    "tekrar": "belki",
    "fiyat": 1050,
    "begeni": 287
  },
  {
    "id": 8,
    "kisi": "mert",
    "yer": "ocak",
    "saat": 31,
    "puan": 8.5,
    "kelimeler": [
      "dumanlı",
      "doyurucu",
      "hızlı"
    ],
    "senaryo": "kalabalık grup",
    "siklik": "ayda bir",
    "metin": "Ocak başı oturmak için erken git, 20:00’den sonra sadece salon kalıyor. Salon bambaşka bir mekan gibi, tadı gitmiyor ama keyfi gidiyor.",
    "degisse": "Salonda da ocak olsa",
    "tekrar": "evet",
    "fiyat": 620,
    "begeni": 64
  },
  {
    "id": 9,
    "kisi": "elif",
    "yer": "yogurtcu",
    "saat": 38,
    "puan": 7.5,
    "kelimeler": [
      "yeşil",
      "sakin",
      "ucuz"
    ],
    "senaryo": "tek başına",
    "siklik": "haftalık uğrak",
    "metin": "Park kenarında ama gürültü almıyor. Yazın gölge sabah tarafında, öğleden sonra güneş tepende.",
    "degisse": "Şemsiye konsa",
    "tekrar": "evet",
    "fiyat": 140,
    "begeni": 41
  },
  {
    "id": 10,
    "kisi": "zeynep",
    "yer": "tatlici",
    "saat": 44,
    "puan": 8,
    "medya": "video",
    "kelimeler": [
      "deniz",
      "kalabalık",
      "tatlı"
    ],
    "senaryo": "uzun oturma",
    "siklik": "ayda bir",
    "metin": "Deniz tarafındaki masalar için beklemeye değer, sıra 15 dakika sürüyor. İç salon fena, orada oturacaksan gitme.",
    "degisse": "İç salon yenilense",
    "tekrar": "evet",
    "fiyat": 190,
    "begeni": 129
  },
  {
    "id": 11,
    "kisi": "can",
    "yer": "plak",
    "saat": 52,
    "puan": 9,
    "kelimeler": [
      "tozlu",
      "nostaljik",
      "ucuz"
    ],
    "senaryo": "tek başına",
    "siklik": "yılda birkaç",
    "metin": "Alt kattaki ikinci el kutuları en iyisi. Üst kat turistik fiyat. Pazar kapalı, boşuna gitme.",
    "degisse": "Pazar da açılsa",
    "tekrar": "evet",
    "begeni": 88
  },
  {
    "id": 12,
    "kisi": "bogac",
    "yer": "meze",
    "saat": 60,
    "puan": 8,
    "kelimeler": [
      "ayaküstü",
      "taze",
      "dar"
    ],
    "senaryo": "hızlı uğrak",
    "siklik": "haftalık uğrak",
    "metin": "Ayaküstü meze alıp sahilde yenir. İçeride oturacak yer neredeyse yok, oturmayı planlıyorsan burası değil.",
    "degisse": "Dışarı iki masa koysalar",
    "tekrar": "evet",
    "fiyat": 380,
    "begeni": 203
  },
  {
    "id": 13,
    "kisi": "elif",
    "yer": "poyraz",
    "saat": 70,
    "puan": 7,
    "kelimeler": [
      "sıralı",
      "popüler",
      "iyi"
    ],
    "senaryo": "hızlı uğrak",
    "siklik": "haftalık uğrak",
    "metin": "Hafta içi 15:00 sonrası tamamen boşalıyor. Cumartesi sabahı 40 dakika sıra vardı, uyarayım.",
    "degisse": "Sıra sistemi olsa",
    "tekrar": "evet",
    "fiyat": 230,
    "begeni": 57
  },
  {
    "id": 14,
    "kisi": "mert",
    "yer": "iskele",
    "saat": 78,
    "puan": 6.5,
    "kelimeler": [
      "kapalı",
      "sakin",
      "eski"
    ],
    "senaryo": "ilk buluşma",
    "siklik": "yılda birkaç",
    "metin": "Pazartesi kapalı olduğunu bilmeden gittim, kapıdan döndüm. Salı akşamı da yarı boş, sakin isteyene iyi.",
    "degisse": "Kapalı günü kapıda yazsa",
    "tekrar": "belki",
    "begeni": 44
  },
  {
    "id": 15,
    "kisi": "bogac",
    "yer": "balik",
    "saat": 1,
    "puan": 8.5,
    "medyalar": [
      {
        "tur": "foto",
        "not": "Girişteki tezgah — günlük ne geldiyse burada duruyor."
      },
      {
        "tur": "video",
        "not": "Balık seçerken: fiyatı sorup öyle seç, tahtada yazmıyor."
      },
      {
        "tur": "foto",
        "not": "Deniz tarafındaki masalar. Rezervasyon buraya yapılıyor."
      },
      {
        "tur": "video",
        "not": "Gün batımında manzara, saat 19:30 civarı."
      },
      {
        "tur": "foto",
        "not": "Hesap: kişi başı 1050₺ çıktı, iki kişi bir şişe şarapla."
      }
    ],
    "kelimeler": [
      "manzaralı",
      "taze",
      "pahalı"
    ],
    "senaryo": "ilk buluşma",
    "siklik": "yılda birkaç",
    "metin": "Tezgahtan kendin seç, fiyatını sorarak. Deniz tarafı için hafta sonu mutlaka rezervasyon yaptır, yoksa iç salona düşüyorsun.",
    "degisse": "Fiyatlar tahtada yazsa",
    "tekrar": "evet",
    "fiyat": 1050,
    "begeni": 312
  }
] as DemoPin[];

export interface DemoYorum { id: number; pin: number; kisi: string; saat: number; metin: string }
export const YORUMLAR: DemoYorum[] = [
  {
    "id": 1,
    "pin": 1,
    "kisi": "elif",
    "saat": 1,
    "metin": "Cam kenarı için hafta içi gitmek lazım, hafta sonu imkansız."
  },
  {
    "id": 2,
    "pin": 1,
    "kisi": "mert",
    "saat": 6,
    "metin": "Rezervasyonu 3 gün önceden aldım, yine de arka salona verdiler."
  },
  {
    "id": 3,
    "pin": 3,
    "kisi": "zeynep",
    "saat": 2,
    "metin": "Güneye yürüme tüyosu çok işe yaradı, teşekkürler."
  },
  {
    "id": 4,
    "pin": 15,
    "kisi": "can",
    "saat": 0,
    "metin": "Fiyat sorma uyarısı sayesinde hesap sürprizi yaşamadım."
  },
  {
    "id": 5,
    "pin": 2,
    "kisi": "bogac",
    "saat": 14,
    "metin": "Alt kat gerçekten gürültülü, üst kat şart."
  }
];

export interface DemoListe { id: number; sahip: string; baslik: string; not: string | null; yerler: string[] }
export const LISTELER: DemoListe[] = [
  {
    "id": 1,
    "sahip": "bogac",
    "baslik": "Yağmurlu günde Kadıköy",
    "not": "Kapalı mekanlar, sıcacık köşeler.",
    "yerler": [
      "kitap",
      "yogurtcu",
      "plak"
    ]
  },
  {
    "id": 2,
    "sahip": "elif",
    "baslik": "Tek başına oturulacak yerler",
    "not": "Kitap, kahve, sessizlik.",
    "yerler": [
      "poyraz",
      "kitap"
    ]
  },
  {
    "id": 3,
    "sahip": "mert",
    "baslik": "Geç saate kadar açık",
    "not": "Gece kuşları için.",
    "yerler": [
      "bar",
      "iskele",
      "ocak"
    ]
  }
];

/** Bir pinin medyaları — eski tek-medyalı kayıtlar tek elemanlı listeye çevrilir. */
export const medyalari = (p: DemoPin): DemoMedya[] =>
  p.medyalar && p.medyalar.length ? p.medyalar : [{ tur: 'foto', not: null }];

export const yerBul = (id: string) => YERLER.find(y => y.id === id);
export const pinSayisi = (yerId: string) => PINLER.filter(p => p.yer === yerId).length;
