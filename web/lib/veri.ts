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

/**
 * "Ben kimim" artık sabit değil, oturumdan geliyor (lib/oturum.tsx).
 * Bu yardımcı, oturumu okuyamayan yerler için (veri katmanı React değil).
 */
async function benimKimligim(): Promise<string | null> {
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}

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
    kapak: kapakSec(p.cover_path, p.cover_url).url,
    kapakKredi: null,   /* liste ekranlarında atıf gösterilmiyor, detayda gösteriliyor */
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
  /* İmza. place_facts wiki tarzı: giriş yapan herkes başkasının yazdığının
     üzerine yazabiliyor. Kim yazdığı görünmezse kırmızı uyarı kutusu imzasız
     bir iddia olurdu; okuyanın kime baktığını bilmesi gerekiyor. */
  guncelleyen: string | null;
  /** kaç saat önce güncellendi — Pin.saat ile aynı biçim, zaman() ile yazılıyor */
  guncellenme: number | null;
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
             opening_hours, pin_count, save_count, cover_url, cover_credit, cover_path,
             place_facts ( needs_booking, booking_note, best_time, price_per_person,
                           cash_only, good_for, warning, updated_by, updated_at )`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  interface HamKunye {
    needs_booking: boolean | null; booking_note: string | null; best_time: string | null;
    price_per_person: number | null; cash_only: boolean | null;
    good_for: string[] | null; warning: string | null;
    updated_by: string | null; updated_at: string | null;
  }
  const ham = data.place_facts as HamKunye | HamKunye[] | null;
  const f = (Array.isArray(ham) ? ham[0] : ham) ?? null;

  return {
    id: data.id, slug: data.slug, ad: data.name, tur: data.category,
    semt: data.neighborhood ?? "Kadıköy", lat: 0, lng: 0,
    saatler: saatleriCevir(data.opening_hours),
    pinSayisi: data.pin_count,
    kaydeden: data.save_count,
    /* Pin fotoğrafı varsa kredi göstermiyoruz — kullanıcının kendi fotoğrafı */
    kapak: kapakSec(data.cover_path, data.cover_url).url,
    kapakKredi: kapakSec(data.cover_path, data.cover_url).kredi ? data.cover_credit : null,
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
          guncelleyen: f.updated_by,
          guncellenme: f.updated_at ? saatFarki(f.updated_at) : null,
        }
      : null,
  };
}

/** Künye formundan gelen alanlar. Hepsi isteğe bağlı, boş bırakılan silinir. */
export interface YeniKunye {
  uyari: string | null;
  rezervasyon: boolean | null;
  rezervasyonNotu: string | null;
  enIyiSaat: string | null;
  sadeceNakit: boolean | null;
}

/**
 * Künye yazma — place_facts.
 *
 * upsert: her mekanın tek satırı var (place_id birincil anahtar). Politika
 * updated_by = auth.uid() şart koşuyor, yani başkasının satırını üzerine
 * yazabilirsin ama imza sende kalıyor. Silme politikası bilerek yok.
 */
export async function kunyeYaz(yerId: string, k: YeniKunye): Promise<void> {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  const { error } = await db.from("place_facts").upsert({
    place_id: yerId,
    warning: k.uyari,
    needs_booking: k.rezervasyon,
    booking_note: k.rezervasyonNotu,
    best_time: k.enIyiSaat,
    cash_only: k.sadeceNakit,
    updated_by: id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
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

const PROFIL_SECIM = "id, username, display_name, bio, avatar_url, pin_count, follower_count, following_count, is_public";

interface HamProfil {
  id: string; username: string; display_name: string; bio: string | null;
  avatar_url: string | null; pin_count: number;
  follower_count: number; following_count: number;
  is_public?: boolean;
}

/* `ben` burada işaretlenmiyor: veri katmanı oturumu bilmiyor. Kim olduğunu
   bilen taraf (kisiler-baglam) oturumdaki kimlikle karşılaştırıp işaretliyor. */
const profilCevir = (p: HamProfil): Kisi => ({
  id: p.id, ad: p.display_name, k: p.username, bio: p.bio ?? "",
  foto: p.avatar_url, takipci: p.follower_count, takip: p.following_count,
  pinSayisi: p.pin_count, acikMi: p.is_public ?? true,
});

export async function benimProfilim(): Promise<Kisi | null> {
  const id = await benimKimligim();
  if (!id) return null;
  return profilimiGetirId(id);
}

/** Profil, auth kimliğinden. Trigger daha yazmadıysa null döner. */
export async function profilimiGetirId(id: string): Promise<Kisi | null> {
  const { data } = await db.from("profiles").select(PROFIL_SECIM)
    .eq("id", id).maybeSingle();
  if (!data) return null;
  const k = profilCevir(data as HamProfil);
  return { ...k, ben: true };
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

  /* `ben` bayrağı burada kuruluyor. Önceden kurulmuyordu: profilCevir onu
     yazmıyor, yalnızca profilimiGetir ekliyordu. Sonuç olarak şeritte giriş
     yapmış kullanıcı "Sen" yerine kendi adıyla görünüyordu ve aşağıdaki
     sıralamanın "kendim başta" anahtarı sessizce hiçbir şey yapmıyordu. */
  return ((profiller ?? []) as HamProfil[])
    .map((p) => ({ ...profilCevir(p), ben: p.id === ben.id, sonPinSaat: enSon.get(p.id) ?? Infinity }))
    /* Sıralama SAF tazelik: en son pin atan başta. "Kendim başta" kuralı
       kaldırıldı — şerit "kim ne zaman pin attı" sorusunu yanıtlıyor,
       kendi sıranı öne almak o soruyu bozuyordu. */
    .sort((a, b) => a.sonPinSaat - b.sonPinSaat);
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
    .select("id, slug, name, category, neighborhood, pin_count, cover_url, cover_path")
    .eq("status", "published")
    .ilike("search_text", `%${n}%`)
    .order("pin_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p): Yer => ({
    id: p.id, slug: p.slug, ad: p.name, tur: p.category,
    semt: p.neighborhood ?? "Kadıköy", lat: 0, lng: 0, saatler: null,
    pinSayisi: p.pin_count, kapak: kapakSec(p.cover_path, p.cover_url).url,
  }));
}

/**
 * Tek bir mekanın koordinatı.
 *
 * Neden ayrı sorgu: lat/lng şemadaki hesaplanan alanlar (göç 10). Bunları
 * mekanAra'nın select'ine ekleseydim ve göç uygulanmamış olsaydı PostgREST
 * BÜTÜN sorguyu 400'lerdi — arama tamamen çalışmaz olurdu. Burada hata
 * yutuluyor: göç yoksa harita uçmuyor, geri kalan her şey çalışıyor.
 */
export async function yerKoordinati(id: string): Promise<{ lat: number; lng: number } | null> {
  const { data, error } = await db
    .from("places").select("lat, lng").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const { lat, lng } = data as { lat: number | null; lng: number | null };
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

/**
 * Takip ettiklerimin pinlediği mekanlar — haritadaki "Takip ettiklerim" çipi.
 *
 * Yarıçapa bakmıyor bilerek: takip ettiğin dört kişinin dokuz yeri varsa
 * hepsini görmek istersin, ekranın neresine düştüklerini değil.
 *
 * Koordinat artık doğrudan geliyor (göç 10'un lat/lng alanları); önceden
 * places_nearby'yi geniş yarıçapla çekip süzmek gerekiyordu.
 */
export async function takiptekilerinYerleri(): Promise<Yer[]> {
  const id = await benimKimligim();
  if (!id) return [];

  const { data: takipler, error: th } = await db
    .from("follows").select("following_id").eq("follower_id", id);
  if (th) throw th;
  const kimler = (takipler ?? []).map((t) => t.following_id as string);
  if (!kimler.length) return [];

  const { data, error } = await db
    .from("pins")
    .select("place_id, places!inner(id, slug, name, category, neighborhood, pin_count, cover_url, cover_path, lat, lng)")
    .in("author_id", kimler)
    .eq("status", "published");
  if (error) throw error;

  interface HamYer {
    id: string; slug: string; name: string; category: PlaceCategory;
    neighborhood: string | null; pin_count: number;
    cover_url: string | null; cover_path: string | null;
    lat: number | null; lng: number | null;
  }
  /* Aynı mekana birden fazla kişi pin atmış olabilir; harita tek işaret ister. */
  const tekil = new Map<string, HamYer>();
  for (const satir of (data ?? []) as unknown as { places: HamYer }[]) {
    if (satir.places) tekil.set(satir.places.id, satir.places);
  }

  return [...tekil.values()].map((p): Yer => ({
    id: p.id, slug: p.slug, ad: p.name, tur: p.category,
    semt: p.neighborhood ?? "Kadıköy",
    lat: p.lat ?? 0, lng: p.lng ?? 0,
    saatler: null,
    pinSayisi: p.pin_count,
    kapak: kapakSec(p.cover_path, p.cover_url).url,
  }));
}

/**
 * Kendi pin attığım mekanlar — liste oluştururken kaynak.
 *
 * kisininYerleri'nden farkı: yarıçap sorgusu istemiyor. Koordinat doğrudan
 * geliyor (göç 10), o yüzden 1500 satır çekip kesişim almaya gerek yok.
 */
export async function pinlediklerim(): Promise<Yer[]> {
  const id = await benimKimligim();
  if (!id) return [];

  const { data, error } = await db
    .from("pins")
    .select("created_at, places!inner(id, slug, name, category, neighborhood, pin_count, cover_url, cover_path, lat, lng)")
    .eq("author_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;

  interface HamYer {
    id: string; slug: string; name: string; category: PlaceCategory;
    neighborhood: string | null; pin_count: number;
    cover_url: string | null; cover_path: string | null;
    lat: number | null; lng: number | null;
  }
  /* Aynı mekana birden fazla pin atmış olabilirim; liste tek satır ister. */
  const tekil = new Map<string, HamYer>();
  for (const satir of (data ?? []) as unknown as { places: HamYer }[]) {
    if (satir.places && !tekil.has(satir.places.id)) tekil.set(satir.places.id, satir.places);
  }

  return [...tekil.values()].map((p): Yer => ({
    id: p.id, slug: p.slug, ad: p.name, tur: p.category,
    semt: p.neighborhood ?? "Kadıköy",
    lat: p.lat ?? 0, lng: p.lng ?? 0,
    saatler: null,
    pinSayisi: p.pin_count,
    kapak: kapakSec(p.cover_path, p.cover_url).url,
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
    db.from("places").select("id, slug, name, category, neighborhood, pin_count, cover_url, cover_path")
      .eq("status", "published")
      .order("pin_count", { ascending: false }).limit(9),
  ]);
  return {
    kisiler: ((p ?? []) as HamProfil[]).map(profilCevir),
    yerler: (y ?? []).map((x): Yer => ({
      id: x.id, slug: x.slug, ad: x.name, tur: x.category,
      semt: x.neighborhood ?? "Kadıköy", lat: 0, lng: 0, saatler: null,
      pinSayisi: x.pin_count, kapak: kapakSec(x.cover_path, x.cover_url).url,
    })),
  };
}

/* ---------- yazma işlemleri ----------
   Hepsi RLS altında: policy'ler author_id/user_id = auth.uid() istiyor,
   yani oturum yoksa istek zaten reddedilir. Arayüz de öncesinde soruyor. */

export async function begeniDegistir(pinId: string, begenildi: boolean) {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (begenildi) {
    const { error } = await db.from("pin_likes").delete()
      .eq("pin_id", pinId).eq("user_id", id);
    if (error) throw error;
  } else {
    const { error } = await db.from("pin_likes").insert({ pin_id: pinId, user_id: id });
    if (error) throw error;
  }
}

export async function begendimMi(pinId: string): Promise<boolean> {
  const id = await benimKimligim();
  if (!id) return false;
  const { data } = await db.from("pin_likes").select("pin_id")
    .eq("pin_id", pinId).eq("user_id", id).maybeSingle();
  return !!data;
}

export async function kayitDegistir(yerId: string, kayitli: boolean) {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (kayitli) {
    const { error } = await db.from("saves").delete()
      .eq("place_id", yerId).eq("user_id", id);
    if (error) throw error;
  } else {
    const { error } = await db.from("saves").insert({ place_id: yerId, user_id: id });
    if (error) throw error;
  }
}

export async function kayitliMi(yerId: string): Promise<boolean> {
  const id = await benimKimligim();
  if (!id) return false;
  const { data } = await db.from("saves").select("place_id")
    .eq("place_id", yerId).eq("user_id", id).maybeSingle();
  return !!data;
}

/** Kaydettiklerim — haritadaki "kaydettiklerim" filtresi ve arşiv ekranı */
export async function kaydettiklerim(): Promise<string[]> {
  const id = await benimKimligim();
  if (!id) return [];
  const { data } = await db.from("saves").select("place_id").eq("user_id", id);
  return (data ?? []).map((s) => s.place_id);
}

export async function yorumYaz(pinId: string, metin: string) {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  const g = metin.trim();
  /* Şemadaki check ile aynı sınır — sunucuya boşuna gitmesin */
  if (g.length < 1 || g.length > 500) throw new Error("Yorum 1–500 karakter olmalı.");
  const { error } = await db.from("pin_comments")
    .insert({ pin_id: pinId, author_id: id, body: g });
  if (error) throw error;
}

export async function yorumSil(yorumId: string) {
  const { error } = await db.from("pin_comments").delete().eq("id", yorumId);
  if (error) throw error;
}

export async function takipDegistir(kisiId: string, takipte: boolean) {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (takipte) {
    const { error } = await db.from("follows").delete()
      .eq("follower_id", id).eq("following_id", kisiId);
    if (error) throw error;
  } else {
    const { error } = await db.from("follows")
      .insert({ follower_id: id, following_id: kisiId });
    if (error) throw error;
  }
}

export async function takiptemiyim(kisiId: string): Promise<boolean> {
  const id = await benimKimligim();
  if (!id) return false;
  const { data } = await db.from("follows").select("following_id")
    .eq("follower_id", id).eq("following_id", kisiId).maybeSingle();
  return !!data;
}

/* ---------- pin atma ---------- */

export interface YeniMedya {
  dosya: File;
  not: string;
}

export interface YeniPin {
  yerId: string;
  metin: string;
  kelimeler: [string, string, string];
  senaryo: string;
  puan: number;
  medyalar: YeniMedya[];
  degisse?: string;
  siklik?: string;
  tekrar?: string;
  fiyat?: number;
}

/**
 * Yeni mekan — kullanıcının haritada boş bir noktaya dokunup eklediği yer.
 *
 * opening_hours BİLEREK null: saatini bilmiyoruz. Şema bunu "kapalı" değil
 * "bilinmiyor" sayıyor, arayüz de öyle gösteriyor.
 */
export async function yerOlustur(
  ad: string, tur: PlaceCategory, lat: number, lng: number, semt?: string,
): Promise<string> {
  /* Slug üretimi ve çakışma döngüsü artık SQL tarafında (göç 12).
     Sebebi tek başına derli toplu olmak değil: gizli mekanları burada
     göremiyoruz. Göç 11 sonrası 652 kayıt 'hidden' durumda ve RLS onları
     istemciye vermiyor; Photon ise buluyor. Aynı yeri ikinci kez yaratmamak
     için arama ve geri açma sunucuda, tek çağrıda, yarış olmadan yapılıyor. */
  const { data, error } = await db.rpc("yer_bul_ya_da_olustur", {
    in_ad: ad.trim(),
    in_tur: tur,
    in_lat: lat,
    in_lng: lng,
    in_semt: semt ?? null,
  });
  if (error) throw error;
  if (!data) throw new Error("Mekan eklenemedi.");
  return data as string;
}

/**
 * Pin silme.
 *
 * Sıra önemli: medya YOLLARI önce okunuyor, çünkü pin silinince pin_media
 * satırları art arda (on delete cascade) yok oluyor ve dosyaların nerede
 * olduğunu bir daha öğrenemiyoruz. Depodaki dosyalar cascade'e dahil DEĞİL —
 * temizlenmezse kimsenin göremediği ama yer kaplayan dosyalar kalırdı.
 *
 * Satır önce, dosya sonra: tersi olsaydı satır silinemediğinde görselleri
 * olmayan bir pin kalırdı.
 *
 * Sayaçlar bump_counter trigger'ında düşüyor (places.pin_count,
 * profiles.pin_count), burada elle bir şey yapmıyoruz.
 */
export async function pinSil(pinId: string): Promise<void> {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");

  const { data: medyalar } = await db.from("pin_media")
    .select("storage_path").eq("pin_id", pinId);
  const yollar = (medyalar ?? [])
    .map((m) => m.storage_path as string)
    .filter((y) => y && !y.startsWith("demo://"));

  const { error } = await db.from("pins").delete().eq("id", pinId);
  if (error) throw error;

  if (yollar.length) await db.storage.from("pin-media").remove(yollar);
}

/** Düzenlemede kalan mevcut medya — yol değişmez, yalnızca notu değişebilir. */
export interface KalanMedya {
  yol: string;
  not: string;
}

export interface PinGuncelleme {
  metin: string;
  kelimeler: [string, string, string];
  senaryo: string;
  puan: number;
  degisse?: string;
  siklik?: string;
  tekrar?: string;
  fiyat?: number;
  /** silinmeyenler; sıralama bu dizinin sırası */
  kalanMedyalar: KalanMedya[];
  yeniMedyalar: YeniMedya[];
}

/**
 * Pin düzenleme.
 *
 * Mekan DEĞİŞTİRİLEMİYOR: pin bir mekana bırakılmış not, başka mekana
 * taşımak onu başka bir şey yapardı — ve (author_id, place_id, visit_date)
 * benzersizlik kuralıyla çakışırdı.
 *
 * Sıra pinAt'takinin tersi: önce YENİ medya yükleniyor, sonra satırlar
 * yazılıyor. assert_pin_has_media trigger'ı yayınlanmış pinin en az bir
 * medyası olmasını şart koşuyor, o yüzden silme işlemi ekleme bittikten
 * sonra yapılıyor — arada pin bir an medyasız kalmasın.
 */
export async function pinGuncelle(pinId: string, g: PinGuncelleme): Promise<void> {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (!g.kalanMedyalar.length && !g.yeniMedyalar.length) {
    throw new Error("En az bir fotoğraf ya da video kalmalı.");
  }

  /* 1) Yeni dosyalar yükleniyor. Yol düzeni pinAt ile aynı: <kimlik>/<...> */
  const yuklenen: { yol: string; tur: "photo" | "video"; not: string }[] = [];
  for (let i = 0; i < g.yeniMedyalar.length; i++) {
    const m = g.yeniMedyalar[i];
    const uzanti = (m.dosya.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const yol = `${id}/${Date.now()}-${i}.${uzanti}`;
    const { error } = await db.storage.from("pin-media")
      .upload(yol, m.dosya, {
        contentType: m.dosya.type, upsert: false,
        /* Bir yıl: yollar benzersiz (kimlik/zaman damgası), aynı yola başka
           dosya yazılmıyor. Varsayılan bir saatti, aynı fotoğraf her gün
           yeniden iniyordu. */
        cacheControl: "31536000",
      });
    if (error) throw new Error(`Dosya yüklenemedi: ${error.message}`);
    yuklenen.push({ yol, tur: m.dosya.type.startsWith("video") ? "video" : "photo", not: m.not });
  }

  /* 2) Yeni satırlar. Sıralama kalanların ardından devam ediyor. */
  if (yuklenen.length) {
    const { error } = await db.from("pin_media").insert(
      yuklenen.map((u, i) => ({
        pin_id: pinId, kind: u.tur, storage_path: u.yol,
        caption: u.not.trim() || null, ordering: g.kalanMedyalar.length + i,
      })),
    );
    if (error) {
      await db.storage.from("pin-media").remove(yuklenen.map((u) => u.yol));
      throw error;
    }
  }

  /* 3) Kalanların notu ve sırası güncelleniyor. */
  for (let i = 0; i < g.kalanMedyalar.length; i++) {
    const k = g.kalanMedyalar[i];
    const { error } = await db.from("pin_media")
      .update({ caption: k.not.trim() || null, ordering: i })
      .eq("pin_id", pinId).eq("storage_path", k.yol);
    if (error) throw error;
  }

  /* 4) Silinenler: önce satır, sonra dosya. Ters sırada yapılsaydı satır
        kalıp dosyası olmayan medya olurdu. */
  const kalanYollar = g.kalanMedyalar.map((k) => k.yol);
  const { data: hepsi } = await db.from("pin_media")
    .select("storage_path").eq("pin_id", pinId);
  const silinecek = (hepsi ?? [])
    .map((m) => m.storage_path as string)
    .filter((y) => !kalanYollar.includes(y) && !yuklenen.some((u) => u.yol === y));
  if (silinecek.length) {
    const { error } = await db.from("pin_media")
      .delete().eq("pin_id", pinId).in("storage_path", silinecek);
    if (error) throw error;
    await db.storage.from("pin-media").remove(silinecek);
  }

  /* 5) Pinin kendisi. */
  const { error } = await db.from("pins").update({
    body: g.metin.trim(),
    words: g.kelimeler.map((k) => k.trim()),
    scenario: g.senaryo,
    rating: g.puan,
    improve: g.degisse?.trim() || null,
    frequency: g.siklik || null,
    would_return: g.tekrar || null,
    price_paid: g.fiyat ?? null,
  }).eq("id", pinId);
  if (error) throw error;
}

/**
 * Pin atma. Sıra önemli:
 *   1) medya Storage'a yüklenir  2) pins satırı  3) pin_media satırları
 *
 * assert_pin_has_media trigger'ı pin'in en az bir medyası olmasını şart
 * koşuyor. Trigger pin_media INSERT'inde kontrol ettiği için pins satırı
 * önce açılıyor; medya yazılamazsa pin siliniyor (aşağıdaki catch).
 */
export async function pinAt(y: YeniPin): Promise<string> {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (!y.medyalar.length) throw new Error("En az bir fotoğraf ya da video gerekiyor.");

  /* Yol düzeni <kimlik>/<...> — Storage policy'si ilk klasörün kullanıcının
     kimliği olmasını istiyor, başkasının medyası ezilemesin diye. */
  const yuklenen: { yol: string; tur: "photo" | "video"; not: string; sure: number }[] = [];
  for (let i = 0; i < y.medyalar.length; i++) {
    const m = y.medyalar[i];
    const uzanti = (m.dosya.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const yol = `${id}/${Date.now()}-${i}.${uzanti}`;
    const { error } = await db.storage.from("pin-media")
      .upload(yol, m.dosya, {
        contentType: m.dosya.type, upsert: false,
        /* Bir yıl: yollar benzersiz (kimlik/zaman damgası), aynı yola başka
           dosya yazılmıyor. Varsayılan bir saatti, aynı fotoğraf her gün
           yeniden iniyordu. */
        cacheControl: "31536000",
      });
    if (error) throw new Error(`Dosya yüklenemedi: ${error.message}`);
    yuklenen.push({
      yol, tur: m.dosya.type.startsWith("video") ? "video" : "photo",
      not: m.not, sure: 0,
    });
  }

  const { data: pin, error: pinHata } = await db.from("pins").insert({
    author_id: id,
    place_id: y.yerId,
    body: y.metin.trim(),
    words: y.kelimeler.map((k) => k.trim()),
    scenario: y.senaryo,
    rating: y.puan,
    improve: y.degisse?.trim() || null,
    frequency: y.siklik || null,
    would_return: y.tekrar || null,
    price_paid: y.fiyat ?? null,
    visit_date: new Date().toISOString().slice(0, 10),
  }).select("id").single();

  if (pinHata) {
    /* Yüklenen dosyaları geride bırakma */
    await db.storage.from("pin-media").remove(yuklenen.map((u) => u.yol));
    /* 23505 = (author_id, place_id, visit_date) benzersizlik kuralı */
    if (pinHata.code === "23505") {
      throw new Error("Bugün bu mekana zaten pin atmışsın. Var olanı düzenleyebilirsin.");
    }
    throw pinHata;
  }

  const { error: medyaHata } = await db.from("pin_media").insert(
    yuklenen.map((u, i) => ({
      pin_id: pin.id, kind: u.tur, storage_path: u.yol,
      caption: u.not.trim() || null, ordering: i,
    })),
  );
  if (medyaHata) {
    /* Medyasız pin şemaya göre geçersiz — pin'i de geri al */
    await db.from("pins").delete().eq("id", pin.id);
    await db.storage.from("pin-media").remove(yuklenen.map((u) => u.yol));
    throw medyaHata;
  }
  return pin.id;
}

/**
 * Mekan kapağı — önce en çok beğenilen pinin fotoğrafı, o yoksa Wikimedia
 * referans görseli. İkisi de yoksa null; arayüz degrade + kategori simgesi
 * çiziyor.
 *
 * Sıra önemli: kullanıcı fotoğrafı her zaman öne geçer. Mekanı temsil eden
 * şey oraya gidenlerin çektiği fotoğraf; Wikimedia görseli yalnızca henüz
 * pin gelmemiş yerler için yedek.
 */
export function kapakSec(
  pinYolu: string | null | undefined,
  wikimediaUrl: string | null | undefined,
): { url: string | null; kredi: boolean } {
  const pin = pinYolu ? medyaUrl(pinYolu) : null;
  if (pin) return { url: pin, kredi: false };
  return { url: wikimediaUrl ?? null, kredi: !!wikimediaUrl };
}

/** Storage yolundan görüntülenebilir URL. Kova public, imzalamaya gerek yok. */
export function medyaUrl(yol: string): string | null {
  /* Tohum verisi demo:// ile işaretli — gerçek dosya yok, arayüz degrade çiziyor */
  if (!yol || yol.startsWith("demo://")) return null;
  return db.storage.from("pin-media").getPublicUrl(yol).data.publicUrl;
}

/* ---------- arşiv ---------- */

/** Beğendiğim pinler — arşiv ekranı */
export async function begendiklerim(): Promise<Pin[]> {
  const id = await benimKimligim();
  if (!id) return [];
  const { data: begeniler } = await db.from("pin_likes")
    .select("pin_id").eq("user_id", id).order("created_at", { ascending: false });
  const idler = (begeniler ?? []).map((b) => b.pin_id);
  if (!idler.length) return [];
  const { data, error } = await db.from("pins").select(PIN_SECIM).in("id", idler);
  if (error) throw error;
  return (data as unknown as HamPin[]).map(pinCevir);
}

/** Kaydettiğim mekanlar — koordinatsız, arşiv listesi için yeterli */
export async function kaydettigimYerler(): Promise<Yer[]> {
  const id = await benimKimligim();
  if (!id) return [];
  const { data, error } = await db.from("saves")
    .select("created_at, places ( id, slug, name, category, neighborhood, pin_count, cover_url, cover_path )")
    .eq("user_id", id).order("created_at", { ascending: false });
  if (error) throw error;
  interface Ham { places: { id: string; slug: string; name: string; category: PlaceCategory; neighborhood: string | null; pin_count: number; cover_url: string | null; cover_path: string | null } }
  return (data as unknown as Ham[]).filter((s) => s.places).map((s): Yer => ({
    id: s.places.id, slug: s.places.slug, ad: s.places.name, tur: s.places.category,
    semt: s.places.neighborhood ?? "Kadıköy", lat: 0, lng: 0, saatler: null,
    pinSayisi: s.places.pin_count,
    kapak: kapakSec(s.places.cover_path, s.places.cover_url).url,
  }));
}

/* ---------- listeler ---------- */

export async function listeOlustur(
  baslik: string, not: string, yerIdler: string[],
): Promise<string> {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (baslik.trim().length < 2) throw new Error("Listeye bir başlık yaz.");
  if (!yerIdler.length) throw new Error("En az bir mekan seç.");

  /* slug kişi başına benzersiz — unique (owner_id, slug) */
  const taban = aramaMetni(baslik).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "liste";
  let slug = taban;
  let liste: { id: string } | null = null;
  for (let d = 0; d < 5 && !liste; d++) {
    const { data, error } = await db.from("lists")
      .insert({ owner_id: id, slug, title: baslik.trim(), intro: not.trim() || null })
      .select("id").single();
    if (!error) { liste = data; break; }
    if (error.code !== "23505") throw error;
    slug = `${taban}-${Math.random().toString(36).slice(2, 5)}`;
  }
  if (!liste) throw new Error("Liste oluşturulamadı, başlığı biraz değiştir.");

  const { error } = await db.from("list_items").insert(
    yerIdler.map((y, i) => ({ list_id: liste.id, place_id: y, ordering: i })),
  );
  if (error) {
    await db.from("lists").delete().eq("id", liste.id);   /* boş liste bırakma */
    throw error;
  }
  return liste.id;
}

export async function listeSil(listeId: string) {
  const { error } = await db.from("lists").delete().eq("id", listeId);
  if (error) throw error;
}

/* ---------- profil düzenleme ---------- */

export async function profilGuncelle(alanlar: {
  ad?: string; bio?: string; acikMi?: boolean; avatarUrl?: string | null;
}) {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  const yama: Record<string, unknown> = {};
  if (alanlar.ad !== undefined) {
    if (!alanlar.ad.trim()) throw new Error("Görünen ad boş olamaz.");
    yama.display_name = alanlar.ad.trim();
  }
  /* Şemadaki check: bio en fazla 200 karakter */
  if (alanlar.bio !== undefined) yama.bio = alanlar.bio.trim().slice(0, 200) || null;
  if (alanlar.acikMi !== undefined) yama.is_public = alanlar.acikMi;
  if (alanlar.avatarUrl !== undefined) yama.avatar_url = alanlar.avatarUrl;
  const { error } = await db.from("profiles").update(yama).eq("id", id);
  if (error) throw error;
}

/**
 * Avatar yükler ve profile bağlar.
 *
 * Dosya adına zaman damgası konuyor: aynı ada yazsaydık CDN eski görseli
 * önbellekten servis eder, kullanıcı fotoğrafını değiştirdiğini göremezdi.
 * Eski dosya sonradan siliniyor.
 */
export async function avatarYukle(dosya: Blob, uzanti = "jpg"): Promise<string> {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  const yol = `${id}/${Date.now()}.${uzanti}`;
  const { error } = await db.storage.from("avatars")
    .upload(yol, dosya, { contentType: dosya.type || "image/jpeg", upsert: false });
  if (error) throw new Error(`Fotoğraf yüklenemedi: ${error.message}`);

  const url = db.storage.from("avatars").getPublicUrl(yol).data.publicUrl;
  await profilGuncelle({ avatarUrl: url });

  /* aynı klasördeki eski avatarları temizle */
  const { data: eskiler } = await db.storage.from("avatars").list(id);
  const silinecek = (eskiler ?? [])
    .filter((f) => `${id}/${f.name}` !== yol)
    .map((f) => `${id}/${f.name}`);
  if (silinecek.length) await db.storage.from("avatars").remove(silinecek);

  return url;
}

/* ---------- bildirimler ---------- */

export interface Bildirim {
  id: string;
  tur: "like" | "comment" | "follow";
  kisi: string;              // eylemi yapan profil id
  pinId: string | null;
  pinMetni: string | null;
  yerAdi: string | null;
  yorum: string | null;
  saat: number;
  okundu: boolean;
}

export async function bildirimler(limit = 40): Promise<Bildirim[]> {
  const id = await benimKimligim();
  if (!id) return [];
  const { data, error } = await db
    .from("notifications")
    .select(`id, kind, actor_id, pin_id, read_at, created_at,
             pins ( body, places ( name ) ),
             pin_comments ( body )`)
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  interface Ham {
    id: string; kind: "like" | "comment" | "follow"; actor_id: string;
    pin_id: string | null; read_at: string | null; created_at: string;
    pins: { body: string; places: { name: string } | null } | null;
    pin_comments: { body: string } | null;
  }
  return (data as unknown as Ham[]).map((b) => ({
    id: b.id, tur: b.kind, kisi: b.actor_id, pinId: b.pin_id,
    pinMetni: b.pins?.body ?? null,
    yerAdi: b.pins?.places?.name ?? null,
    yorum: b.pin_comments?.body ?? null,
    saat: saatFarki(b.created_at),
    okundu: !!b.read_at,
  }));
}

export async function okunmamisBildirim(): Promise<number> {
  const id = await benimKimligim();
  if (!id) return 0;
  const { count } = await db.from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id).is("read_at", null);
  return count ?? 0;
}

export async function bildirimleriOkundu() {
  const id = await benimKimligim();
  if (!id) return;
  const { error } = await db.from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", id).is("read_at", null);
  if (error) throw error;
}

/* ---------- şikayet ---------- */

export const SIKAYET_SEBEPLERI = [
  "Yanlış bilgi",
  "Mekanla ilgisi yok",
  "Reklam / spam",
  "Hakaret veya nefret söylemi",
  "Başkasının fotoğrafı",
  "Diğer",
] as const;

export async function sikayetEt(
  hedef: { pinId?: string; yorumId?: string }, sebep: string,
) {
  const id = await benimKimligim();
  if (!id) throw new Error("Giriş gerekiyor.");
  if (!hedef.pinId && !hedef.yorumId) throw new Error("Şikayet edilecek içerik yok.");
  const { error } = await db.from("reports").insert({
    reporter_id: id,
    pin_id: hedef.pinId ?? null,
    comment_id: hedef.yorumId ?? null,
    reason: sebep,
  });
  if (error) throw error;
}

/** Bu içeriği daha önce şikayet ettim mi — düğmeyi tekrarlamamak için */
export async function sikayetEttimMi(pinId: string): Promise<boolean> {
  const id = await benimKimligim();
  if (!id) return false;
  const { data } = await db.from("reports").select("id")
    .eq("reporter_id", id).eq("pin_id", pinId).maybeSingle();
  return !!data;
}
