/**
 * Veri katmanı — Supabase ile arayüz arasındaki tek sınır.
 *
 * Buradaki her fonksiyon şemadaki İngilizce satırları lib/model.ts'teki
 * Türkçe alan modeline çevirir. Bileşenler Supabase'i hiç görmez; şema adı
 * değişirse yalnızca bu dosya değişir.
 *
 * Sorgular tarayıcıdan, anon anahtarla ve RLS altında çalışır — yani burada
 * yazılan hiçbir şey yetki sınırını aşamaz. Kimin neyi görebileceği
 * schema.sql'deki 27 policy'de tanımlı.
 */
import { createClient } from "./supabase/client";
import { aramaMetni } from "./metin";
import type { Yer, Pin, Kisi, Yorum, Liste, Medya } from "./model";
import type { PlaceCategory, OpeningPeriod, PlaceSummary, NearbyPlace } from "./types";

const db = createClient();

/* Kimlik gelene kadar "ben" sabit. Auth eklenince auth.getUser() olacak. */
export const BENIM_KULLANICI_ADIM = "bogac";

/* ---------- çeviriciler ---------- */

/** jsonb [{d,open,close}] → arayüzün beklediği [[gun,"HH:MM","HH:MM"]] */
function saatleriCevir(s: OpeningPeriod[] | null): number[][] | null {
  if (!s?.length) return null;
  return s.map((p) => [p.d, p.open, p.close] as unknown as number[]);
}

/** ISO tarih → "kaç saat önce" (arayüz zaman() ile "3 sa" diye yazıyor) */
function saatFarki(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 36e5);
}

interface HamMedya { kind: "photo" | "video"; caption: string | null; storage_path: string; ordering: number }
function medyaCevir(m: HamMedya[] | null): Medya[] {
  const d = (m ?? []).slice().sort((a, b) => a.ordering - b.ordering);
  /* şema en az 1 medya zorunlu kılıyor; yine de boşa karşı tek yer tutucu */
  if (!d.length) return [{ tur: "foto", not: null, yol: "" }];
  return d.map((x) => ({
    tur: x.kind === "video" ? "video" : "foto",
    not: x.caption,
    yol: x.storage_path,
  }));
}

/* ---------- mekanlar ---------- */

export interface YerSorgusu {
  lat: number;
  lng: number;
  yaricapM?: number;
  kategori?: PlaceCategory | null;
  sadeceAcik?: boolean;
  limit?: number;
}

/** Haritadaki mekanlar. PostGIS ile mesafe hesabı ve "açık mı" veritabanında. */
export async function yerleriGetir(s: YerSorgusu): Promise<Yer[]> {
  const { data, error } = await db.rpc("places_nearby", {
    in_lat: s.lat,
    in_lng: s.lng,
    in_radius_m: s.yaricapM ?? 2500,
    in_category: s.kategori ?? null,
    in_open_only: s.sadeceAcik ?? false,
    in_limit: s.limit ?? 300,
  });
  if (error) throw error;
  return ((data ?? []) as NearbyPlace[]).map((p): Yer => ({
    id: p.id,
    slug: p.slug,
    ad: p.name,
    tur: p.category,
    semt: p.neighborhood ?? "Kadıköy",
    lat: p.lat,
    lng: p.lng,
    saatler: null,             // places_nearby saatleri döndürmez, acik yeter
    acik: p.is_open,
    pinSayisi: p.pin_count,
    uzaklik: p.distance_m,
    uyari: p.warning,
    fiyat: p.price_per_person,
  }));
}

/** Mekan künyesi — place_facts satırı, alanların hepsi isteğe bağlı */
export interface Kunye {
  rezervasyon: string | null;
  rezervasyonNotu: string | null;
  enIyiSaat: string | null;
  kisiBasi: number | null;
  sadeceNakit: boolean | null;
  iyiGelir: string[] | null;
  uyari: string | null;
}

export interface YerDetay extends Yer {
  adres: string | null;
  telefon: string | null;
  site: string | null;
  kaydeden: number;
  kunye: Kunye | null;
}

/**
 * Tek mekan — detay sayfası için. place_facts gömülü geliyor (place_id hem
 * birincil anahtar hem places'e bağlı, PostgREST tek istekte getiriyor).
 *
 * lat/lng burada YOK: geo sütunu geography tipinde, PostgREST'ten sayı olarak
 * okunamıyor (bu yüzden places_nearby st_y/st_x döndürüyor). Detay sayfasının
 * koordinata ihtiyacı da yok — haritayı marker'a tıklanan yer zaten odakladı.
 */
export async function yerGetir(id: string): Promise<YerDetay | null> {
  const { data, error } = await db
    .from("places")
    .select(`id, slug, name, category, neighborhood, address, phone, website,
             opening_hours, pin_count, save_count, cover_url, cover_credit,
             place_facts ( needs_booking, booking_note, best_time, price_per_person,
                           cash_only, good_for, warning )`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  interface HamKunye {
    needs_booking: boolean | null; booking_note: string | null; best_time: string | null;
    price_per_person: number | null; cash_only: boolean | null;
    good_for: string[] | null; warning: string | null;
  }
  const ham = data.place_facts as HamKunye | HamKunye[] | null;
  const f = (Array.isArray(ham) ? ham[0] : ham) ?? null;

  return {
    id: data.id, slug: data.slug, ad: data.name, tur: data.category,
    semt: data.neighborhood ?? "Kadıköy", lat: 0, lng: 0,
    saatler: saatleriCevir(data.opening_hours),
    pinSayisi: data.pin_count,
    kaydeden: data.save_count,
    kapak: data.cover_url, kapakKredi: data.cover_credit,
    adres: data.address, telefon: data.phone, site: data.website,
    kunye: f
      ? {
          rezervasyon: f.needs_booking === null ? null : f.needs_booking ? "gerekiyor" : "gerekmiyor",
          rezervasyonNotu: f.booking_note,
          enIyiSaat: f.best_time,
          kisiBasi: f.price_per_person,
          sadeceNakit: f.cash_only,
          iyiGelir: f.good_for,
          uyari: f.warning,
        }
      : null,
  };
}

export async function mekanOzeti(yerId: string, bakanId?: string): Promise<PlaceSummary> {
  const { data, error } = await db.rpc("place_summary", {
    in_place: yerId,
    in_viewer: bakanId ?? null,
  });
  if (error) throw error;
  return data as PlaceSummary;
}

/* ---------- pinler ---------- */

/* Pin + yazarı + mekanı + medyası tek isteğe sığsın diye gömülü seçim.
   PostgREST yabancı anahtarları takip edip iç içe döndürüyor. */
const PIN_SECIM = `
  id, author_id, place_id, body, words, scenario, rating,
  improve, frequency, would_return, price_paid,
  like_count, comment_count, created_at,
  places!inner ( name, neighborhood, category ),
  pin_media ( kind, caption, storage_path, ordering )
`;

interface HamPin {
  id: string; author_id: string; place_id: string; body: string;
  words: string[]; scenario: string; rating: number;
  improve: string | null; frequency: string | null; would_return: string | null;
  price_paid: number | null; like_count: number; comment_count: number;
  created_at: string;
  places: { name: string; neighborhood: string | null; category: PlaceCategory };
  pin_media: HamMedya[];
}

function pinCevir(p: HamPin): Pin {
  return {
    id: p.id,
    kisi: p.author_id,
    yer: p.place_id,
    yerAdi: p.places.name,
    yerSemt: p.places.neighborhood ?? "Kadıköy",
    yerTuru: p.places.category,
    saat: saatFarki(p.created_at),
    puan: Number(p.rating),
    kelimeler: p.words ?? [],
    senaryo: p.scenario,
    metin: p.body,
    siklik: p.frequency,
    tekrar: p.would_return,
    degisse: p.improve,
    fiyat: p.price_paid,
    begeni: p.like_count,
    yorumSayisi: p.comment_count,
    medyalar: medyaCevir(p.pin_media),
  };
}

export type AkisSekmesi = "kesfet" | "populer" | "takip";

/** Akış. Üç sekmenin sıralaması kasıtlı olarak farklı (BRIEF → Üç yüzey). */
export async function akisGetir(sekme: AkisSekmesi, limit = 40): Promise<Pin[]> {
  let q = db.from("pins").select(PIN_SECIM).eq("status", "published").limit(limit);

  if (sekme === "populer") {
    /* son bir hafta, beğeniye göre */
    const hafta = new Date(Date.now() - 7 * 864e5).toISOString();
    q = q.gte("created_at", hafta).order("like_count", { ascending: false });
  } else if (sekme === "takip") {
    const ben = await benimProfilim();
    const { data: takipler } = await db
      .from("follows").select("following_id").eq("follower_id", ben?.id ?? "");
    const idler = (takipler ?? []).map((t) => t.following_id);
    if (ben) idler.push(ben.id);
    if (!idler.length) return [];
    q = q.in("author_id", idler).order("created_at", { ascending: false });
  } else {
    /* keşfet: etkileşim ağırlıklı — sıralama sunucuda feed_discover'da da var,
       ama gömülü seçim (yazar/mekan/medya) RPC'den gelmiyor, burada sıralıyoruz */
    q = q.order("like_count", { ascending: false });
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as HamPin[]).map(pinCevir);
}

/** Bir mekana atılmış pinler — mekan detayındaki karusel */
export async function yerinPinleri(yerId: string): Promise<Pin[]> {
  const { data, error } = await db
    .from("pins").select(PIN_SECIM)
    .eq("place_id", yerId).eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as HamPin[]).map(pinCevir);
}

export async function kisininPinleri(kisiId: string): Promise<Pin[]> {
  const { data, error } = await db
    .from("pins").select(PIN_SECIM)
    .eq("author_id", kisiId).eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as HamPin[]).map(pinCevir);
}

export async function pinYorumlari(pinId: string): Promise<Yorum[]> {
  const { data, error } = await db
    .from("pin_comments").select("id, pin_id, author_id, body, created_at")
    .eq("pin_id", pinId).eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((y) => ({
    id: y.id, pin: y.pin_id, kisi: y.author_id,
    saat: saatFarki(y.created_at), metin: y.body,
  }));
}

/* ---------- kişiler ---------- */

const PROFIL_SECIM = "id, username, display_name, bio, avatar_url, pin_count, follower_count, following_count";

interface HamProfil {
  id: string; username: string; display_name: string; bio: string | null;
  avatar_url: string | null; pin_count: number;
  follower_count: number; following_count: number;
}

const profilCevir = (p: HamProfil): Kisi => ({
  id: p.id, ad: p.display_name, k: p.username, bio: p.bio ?? "",
  foto: p.avatar_url, takipci: p.follower_count, takip: p.following_count,
  pinSayisi: p.pin_count, ben: p.username === BENIM_KULLANICI_ADIM,
});

export async function benimProfilim(): Promise<Kisi | null> {
  const { data } = await db.from("profiles").select(PROFIL_SECIM)
    .eq("username", BENIM_KULLANICI_ADIM).maybeSingle();
  return data ? profilCevir(data as HamProfil) : null;
}

export async function profilGetir(kullaniciAdi: string): Promise<Kisi | null> {
  const { data } = await db.from("profiles").select(PROFIL_SECIM)
    .eq("username", kullaniciAdi).maybeSingle();
  return data ? profilCevir(data as HamProfil) : null;
}

/** Hikaye şeridi: takip ettiklerin + sen. Avatar için hepsi bir arada lazım. */
export async function kisileriGetir(): Promise<Record<string, Kisi>> {
  const { data, error } = await db.from("profiles").select(PROFIL_SECIM)
    .order("follower_count", { ascending: false });
  if (error) throw error;
  const harita: Record<string, Kisi> = {};
  for (const p of (data ?? []) as HamProfil[]) harita[p.id] = profilCevir(p);
  return harita;
}

/* ---------- listeler ---------- */

export async function kisininListeleri(kisiId: string): Promise<Liste[]> {
  const { data, error } = await db
    .from("lists")
    .select(`id, owner_id, slug, title, intro,
             list_items ( ordering, places ( id, slug, name, category, neighborhood ) )`)
    .eq("owner_id", kisiId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  interface HamListe {
    id: string; owner_id: string; slug: string; title: string; intro: string | null;
    list_items: { ordering: number; places: { id: string; slug: string; name: string; category: PlaceCategory; neighborhood: string | null } }[];
  }
  return (data as unknown as HamListe[]).map((l) => ({
    id: l.id, sahip: l.owner_id, slug: l.slug, baslik: l.title, not: l.intro,
    yerler: l.list_items
      .slice().sort((a, b) => a.ordering - b.ordering)
      .map((li): Yer => ({
        id: li.places.id, slug: li.places.slug, ad: li.places.name,
        tur: li.places.category, semt: li.places.neighborhood ?? "Kadıköy",
        lat: 0, lng: 0, saatler: null,
      })),
  }));
}

/** Bir kişinin pinlediği mekanlar — hikaye şeridi filtresi bunu kullanır. */
export async function kisininYerleri(kisiId: string, s: YerSorgusu): Promise<Yer[]> {
  const { data: pinler, error } = await db
    .from("pins").select("place_id").eq("author_id", kisiId).eq("status", "published");
  if (error) throw error;
  const idler = new Set((pinler ?? []).map((p) => p.place_id));
  if (!idler.size) return [];
  /* Koordinatlar yalnızca places_nearby'den geliyor (geo geography sütunu
     PostgREST'ten lat/lng olarak okunamıyor), o yüzden geniş yarıçapla
     çekip kesişim alıyoruz. Kadıköy küçük, tek istek yetiyor. */
  const hepsi = await yerleriGetir({ ...s, yaricapM: 4000, limit: 1500, kategori: null, sadeceAcik: false });
  return hepsi.filter((y) => idler.has(y.id));
}

/** Başlıktaki "N yer şu an açık · M pin" sayıları. Satırları çekmeden sayar. */
export async function ozetSayilar(lat: number, lng: number, yaricapM = 2500) {
  const [acik, pin] = await Promise.all([
    /* head:true olunca supabase-js RPC'yi GET olarak gönderiyor ve parametreler
       sorgu dizesine yazılıyor: `in_category=null` orada SQL NULL değil "null"
       METNİ oluyor, enum bunu ayrıştıramayıp 400 veriyor (22P02). Alanı hiç
       göndermiyoruz, fonksiyon imzasındaki `default null` devreye giriyor. */
    db.rpc("places_nearby",
      { in_lat: lat, in_lng: lng, in_radius_m: yaricapM,
        in_open_only: true, in_limit: 5000 },
      { count: "exact", head: true }),
    db.from("pins").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  return { acikYer: acik.count ?? 0, pinSayisi: pin.count ?? 0 };
}

/* ---------- hikaye şeridi ---------- */

export interface HikayeKisi extends Kisi {
  /** en son pinin kaç saat önce atıldığı; pin yoksa Infinity */
  sonPinSaat: number;
}

/**
 * Takip ettiklerin + sen, en yeni pin atan önde.
 * Takip listesi artık sabit değil, follows tablosundan geliyor.
 */
export async function hikayeSeridi(): Promise<HikayeKisi[]> {
  const ben = await benimProfilim();
  if (!ben) return [];

  const { data: takipler } = await db
    .from("follows").select("following_id").eq("follower_id", ben.id);
  const idler = [ben.id, ...(takipler ?? []).map((t) => t.following_id)];

  const [{ data: profiller }, { data: pinler }] = await Promise.all([
    db.from("profiles").select(PROFIL_SECIM).in("id", idler),
    /* Her kişinin en son pini lazım; kişi başı ayrı sorgu yerine hepsini
       tarihe göre çekip ilk görüleni alıyoruz. */
    db.from("pins").select("author_id, created_at")
      .in("author_id", idler).eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const enSon = new Map<string, number>();
  for (const p of pinler ?? []) {
    if (!enSon.has(p.author_id)) enSon.set(p.author_id, saatFarki(p.created_at));
  }

  return ((profiller ?? []) as HamProfil[])
    .map((p) => ({ ...profilCevir(p), sonPinSaat: enSon.get(p.id) ?? Infinity }))
    .sort((a, b) => (b.ben ? 1 : 0) - (a.ben ? 1 : 0) || a.sonPinSaat - b.sonPinSaat);
}

/** Tek pin — Reels ekranı ve ileride /pin/[id] rotası için. */
export async function pinGetir(id: string): Promise<Pin | null> {
  const { data, error } = await db
    .from("pins").select(PIN_SECIM).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? pinCevir(data as unknown as HamPin) : null;
}

/* ---------- arama ---------- */

/**
 * Mekan araması. Sorgu, şemadaki search_text sütunuyla AYNI biçime indiriliyor
 * (aramaMetni ↔ SQL translate+lower) — yoksa "ciya" yazan kullanıcı
 * "Çiya Sofrası"nı bulamaz. pg_trgm GIN indeksi ilike'ı hızlandırıyor.
 */
export async function mekanAra(q: string, limit = 24): Promise<Yer[]> {
  const n = aramaMetni(q.trim());
  if (n.length < 2) return [];
  const { data, error } = await db
    .from("places")
    .select("id, slug, name, category, neighborhood, pin_count, cover_url")
    .eq("status", "published")
    .ilike("search_text", `%${n}%`)
    .order("pin_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p): Yer => ({
    id: p.id, slug: p.slug, ad: p.name, tur: p.category,
    semt: p.neighborhood ?? "Kadıköy", lat: 0, lng: 0, saatler: null,
    pinSayisi: p.pin_count, kapak: p.cover_url,
  }));
}

export async function kisiAra(q: string, limit = 12): Promise<Kisi[]> {
  const n = aramaMetni(q.trim());
  if (n.length < 2) return [];
  const { data, error } = await db
    .from("profiles").select(PROFIL_SECIM)
    .ilike("search_text", `%${n}%`)
    .order("follower_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as HamProfil[]).map(profilCevir);
}

/** Arama kutusu boşken gösterilenler */
export async function populerler(): Promise<{ kisiler: Kisi[]; yerler: Yer[] }> {
  const [{ data: p }, { data: y }] = await Promise.all([
    db.from("profiles").select(PROFIL_SECIM)
      .order("follower_count", { ascending: false }).limit(8),
    db.from("places").select("id, slug, name, category, neighborhood, pin_count, cover_url")
      .eq("status", "published")
      .order("pin_count", { ascending: false }).limit(9),
  ]);
  return {
    kisiler: ((p ?? []) as HamProfil[]).map(profilCevir),
    yerler: (y ?? []).map((x): Yer => ({
      id: x.id, slug: x.slug, ad: x.name, tur: x.category,
      semt: x.neighborhood ?? "Kadıköy", lat: 0, lng: 0, saatler: null,
      pinSayisi: x.pin_count, kapak: x.cover_url,
    })),
  };
}
