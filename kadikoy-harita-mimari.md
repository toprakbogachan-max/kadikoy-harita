# Kadıköy Harita — V1 Teknik Mimari

**Kapsam:** Kadıköy, ~200 mekan, mobil-web (PWA), tek link ile paylaşılabilir.
**Amaç:** "Nereye gidilir?" değil, "gitmeden ne bilmem lazım" ve "bana uygun mu" sorularına cevap vermek.
**V1'de olan:** kullanıcı hesapları, herkese açık pin atma, takip, akış, profil. Bunlar artık **sonradan eklenecek bir V2 değil, ürünün kendisi.**

> Bu doküman önceki bir sürümde "tek kişilik editörlü rehber" kurgusunu anlatıyordu (kullanıcı hesabı yok, içeriği tek kişi giriyor, sosyal katman V2'ye erteleniyor). O karar değişti — bkz. `BRIEF.md` → **Sosyal katman kararı**. Bu sürüm güncel kurguyu anlatıyor: mekanlar hâlâ toplu/scrape ile önceden dolduruluyor, ama değeri veren şey artık tek bir editörün notu değil, kullanıcıların bıraktığı **pin**ler.

---

## 1. Sistem Genel Görünümü

```
[Toplama Katmanı - Python]              [Uygulama - Next.js]

 TikTok/IG kaynak listesi                    Mobil Web (PWA)
        │                                          │
        ▼                                          ▼
 Caption + transkript                       MapLibre harita + Akış + Profil
        │                                          │
        ▼                                          │
 Claude API → JSON (mekan adı)                      │
        │                                          │
        ▼                                          ▼
 Google Places enrichment  ────────►  Supabase (Postgres + PostGIS + Auth)
        │                                          ▲
        ▼                                          │
 places + place_facts (iskelet veri) ───────────────┘
                                                     ▲
                                                     │
                                    Kullanıcı pinleri (fotoğraf + üç kelime +
                                    senaryo + puan + not) — asıl değer burada
```

Scraper artık "editörün girdiği içerik" değil, **iskeleti** dolduruyor: mekanın adı, konumu, kategorisi, Google'dan gelen çalışma saatleri. Bir mekan bu haliyle haritada görünebilir ama boş görünür — ona hayat veren, kullanıcıların bıraktığı pinler. Toplama tarafı hâlâ uygulamadan bağımsız offline bir script seti; bu ayrım korunuyor, scraper bozulduğunda site ayakta kalır.

---

## 2. Veri Modeli

Postgres + PostGIS + Supabase Auth. Güncel şema `schema_1.sql` içinde ("sosyal sürüm" başlığıyla işaretli) — **`schema.sql` (soneksiz olan) eski tek-editörlü sürüm, artık referans alınmamalı.** Aynı isim karışıklığı `prototip.html` / `prototip_1.html` arasında da var; ikisinde de güncel olan `_1` soneki taşıyan dosya. Devralan kişi önce bu iki dosya çiftini tek bir kanonik isme indirmeli.

Merkez nesne artık `places` değil, **`pins`** — bir kullanıcının bir mekana bıraktığı gönderi.

### `profiles`
Supabase Auth'a 1-1 bağlı. `username` (`/@kullanici` linki bu), `display_name`, `bio`, `avatar_url`. Sayaçlar (`pin_count`, `follower_count`, `following_count`) trigger'la güncelleniyor — her istekte `count(*)` atmamak için.

### `places` — kanonik mekan kaydı
Artık "editörün yayınladığı kayıt" değil, sadece **aynı mekana atılan pinlerin toplandığı iskelet**: ad, kategori, konum (PostGIS `geography(Point)`), Google'dan gelen `opening_hours`/`google_place_id`. `pin_count` ve `save_count` alanları var — **popülerlik doğrudan bu: kaç kişinin pinlediği, uydurma bir puan değil.**

### `place_facts` — eski `place_notes`'un yerini alan tablo
Tek fark: `editor_note` artık yok, `updated_by` var. Rezervasyon gerekir mi, kapalı gün, en iyi saat, kişi başı fiyat, sadece nakit mı, "kime uygun" etiketleri — bunlar artık tek editörün değil, **topluluğun güncelleyebildiği** pratik bilgiler (`confirm_count`: "hâlâ geçerli" diyen kullanıcı sayısı).

### `pins` — projenin asıl değeri artık burada
| alan | not |
|---|---|
| `author_id`, `place_id` | kim, nerede |
| `body` | somut not, 10-1000 karakter (form tarafında ≥15 karakter zorlanıyor) |
| `tags` | "üç kelime" |
| `visit_date`, `price_paid` | isteğe bağlı alanlar |
| `like_count`, `comment_count` | trigger'la güncellenir |

`unique (author_id, place_id, visit_date)` — aynı kişi aynı mekana günde birden fazla pin atamaz, spam'e karşı ucuz bir kilit.

**Kalite kapısı moderasyon değil, formun kendisi:** fotoğraf zorunlu (`assert_pin_has_media()` trigger'ı, medyasız pin yayına giremiyor), üç kelime, geliş senaryosu, 1-10 "bana hitap puanı", ≥15 karakter somut not. Bu alanlar gevşetilmemeli — "çok güzeldi" yazan üşengeç pin bu kapıda kendiliğinden düşüyor.

### `pin_media`, `pin_likes`, `pin_comments`
Standart. Fotoğraflar Supabase Storage'da (`storage_path`) — Google foto URL'leri kalıcı saklanmıyor.

### `follows`, `saves`
Sosyal grafın kendisi. `saves`: bir mekanı kaydetme (profildeki "Kaydettiklerim" ve harita filtresindeki karşılığı burası).

### `lists`
Kişinin kendi küratörlüğü ("Kadıköy'de yağmurlu gün") — artık tek bir editörün değil, herhangi bir kullanıcının sahip olabildiği bir yapı (`owner_id`).

### `place_sources`
Scraper'ın hangi TikTok/IG postundan hangi mekanı çıkardığı — kullanıcıya hiç açılmıyor (RLS: `using (false)`), sadece toplama/dedup için.

> ⚠️ **Google Places ToS:** `google_place_id` süresiz saklanabilir, diğer alanların çoğu için ~30 günlük cache sınırı var. `google_synced_at` bu takip için. Canlıya çıkmadan önce güncel şartları oku.

---

## 3. Toplama Pipeline — artık "içerik girme" değil, "iskelet doldurma"

Adımlar aynı iskelet (kaynak listesi → caption/transkript çekme → Claude API ile isim çıkarma → Google Places enrichment → dedup), tek fark **son adımda**:

**Eski Adım 6 (silindi):** "Senin katmanın — admin ekranından geçirip editör notu yaz, published yap."
**Yeni durum:** Scrape edilen ~200 mekan `status: published` olarak, sadece iskelet bilgiyle (ad/konum/kategori/saat) doğrudan haritaya girer. Editoryal katman yok — **kalite kapısı artık pin formunun kendisi.** Cold-start için 200 mekanın elle doldurulması hâlâ gerekiyor (bkz. BRIEF → "Alınan kararlar"), ama bu "editör notu yazmak" değil, "ilk pinleri sen atmak" anlamına geliyor: boş bir haritadan ziyade dolu bir profil ilk kullanıcıyı karşılamalı.

Hedef ritim değişmedi: 200 mekan için günde 20-30 kayıt, ~1 hafta.

---

## 4. Teknoloji Seçimleri

| Katman | Seçim | Neden |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | PWA kolay, SEO bedava, Vercel'e tek tıkla |
| Stil | Tailwind | |
| Harita | **MapLibre GL JS** | açık kaynak, vektör tile, Google'a bağımlı değil |
| Tile sağlayıcı | MapTiler / Protomaps | ücretsiz katman yeterli |
| Veritabanı | **Supabase** (Postgres + PostGIS + Auth + Storage) | auth artık V1'de gerekli — sosyal katman bunun üzerine kurulu |
| Toplama | Python | |
| LLM | Claude API | isim çıkarma + normalizasyon |
| Deploy | Vercel | |

**PWA notu değişmedi:** `manifest.json` + service worker, iOS'ta "Ana Ekrana Ekle" ile mağaza onayı olmadan tam ekran.

---

## 5. Sayfa Yapısı — üç yüzey

Prototipteki (`prototip_1.html`) üç sekmeye karşılık gelir:

```
/                        → Harita (açılış ekranı — keşif yüzeyi burası)
/akis                    → Akış: Keşfet / Popüler / Takip sekmeleri
/@[username]             → Profil — büyüme motoru burası, Instagram story'ye atılan link
/mekan/[slug]            → mekan detayı (bottom sheet + kendi URL'i)
/liste/[slug]            → kişisel küratörlü listeler
/paylas/[slug].png       → OG görsel, Instagram story için
```

**Harita davranışı:** filtre çipleri (Şu an açık / Hepsi / Popüler / Kaydettiklerim / kategoriler), üstte takip ettiklerinin son pinlerini gösteren story tarzı şerit, "Şu an açık" varsayılan filtre.

**Mekan detayı hiyerarşisi değişmedi ve kasıtlı:** kırmızı uyarı kutusu (rezervasyon/kapalı gün/nakit) en üstte, sonra özetler (üç kelime bulutu, puan dağılımı + **takip ettiklerinin ayrı ortalaması**), en altta künye. Google Maps'in tam tersi.

**Pin ekleme akışı:** herkese açık, `/mekan/[slug]` veya haritadan tetiklenir; zorunlu alanlar `pins` tablosunun `check` kısıtlarıyla ve `assert_pin_has_media()` trigger'ıyla veritabanı seviyesinde de zorlanıyor — form validasyonu tek katman değil.

---

## 6. Dağıtım Mekaniği (Instagram taktiği) — artık profil merkezli

Eskiden: her mekan/liste için otomatik OG görseli, paylaşım mekan bazlı.
**Şimdi asıl büyüme motoru profil:** `/@kullanici` linki Instagram story'sine atılıyor, tıklayan uygulamaya geliyor. Instagram'ın erken döneminde Facebook'un ağı üzerinden büyümesinin karşılığı — **uygulama içi takipten değil, dışarıdan büyüyeceğiz.** Mekan/liste OG görselleri hâlâ üretiliyor (`@vercel/og`) ama bunlar ikincil; asıl viral yüzey kişinin kendi haritası.

---

## 7. Bilinen açık noktalar / sıradaki katman

Eski dokümanın "V2 — Sosyal Katman" bölümü tamamen gerçekleşti, o yüzden kaldırıldı. Gerçekten ileride olanlar:

- **Üç kelime alanı serbest metin, zamanla dağılıyor** ("sakin"/"sessiz"/"sakın"). İlk 200 pinden sonra otomatik tamamlama önerisi gerekecek — engelleyerek değil, önererek.
- **`place_summary()` gibi bir SQL fonksiyonu henüz yok.** Mekan sayfasındaki kelime bulutu ve puan dağılımı şu an prototipte istemci tarafında (`ozet()` fonksiyonu, `prototip_1.html`) hesaplanıyor; gerçek yükte bunun bir SQL fonksiyonuna/materialized view'e taşınması gerekecek.
- **Moderasyon yok, ama raporlama var** (`reports` tablosu) — kullanıcı içeriği barındırdığımız için kullanım şartları, gizlilik politikası ve içerik kaldırma prosedürü gerekiyor, avukat kontrolünden geçmeli.
- **Yeni şehir** — Barcelona doğal ikinci adım, ama ancak Kadıköy dolduktan sonra.

---

## 8. Yol Haritası

| Hafta | İş |
|---|---|
| 1 | `schema_1.sql`'i Supabase'de çalıştır, Next.js projesini kur |
| 2 | `prototip_1.html`'deki tasarımı bileşenlere böl (tasarımı koru, yapıyı değiştir), elle çizilmiş SVG haritayı MapLibre ile değiştir |
| 3 | 20 hesaplık kaynak YAML'ı yaz, scraper + Claude çıkarma ile iskelet mekanları doldur |
| 4 | Auth + pin ekleme akışı, 200 mekanı ilk pinlerle doldur, arkadaşlara link |

---

## 9. Riskler

**Scraping kırılganlığı.** Platformlar yapı değiştirir. Toplama kodu ürünün canlı yolunda değil, veri kendi DB'de tutuluyor.

**Google Places maliyeti.** Enrichment'ı idempotent yaz, aynı mekanı iki kez sorgulama.

**Veri bayatlaması.** Mekan kapanır, saat değişir. Aylık cron ile `google_business_status` kontrolü + kullanıcı "burası kapanmış" bildirim akışı (`reports` tablosu bunun için de kullanılabilir).

**Sosyal katmanın kendine özgü riski:** herkese açık pin atma moderasyon olmadan kaliteyi formun kendisine emanet ediyor. Form kısıtları gevşetilirse (fotoğraf zorunluluğu, karakter sınırı vb.) kalite kapısı çöker — bu satırlar `BRIEF.md`'de de altı çizilerek uyarılmış, değiştirilmemeli.

**En büyük risk hâlâ bu değil.** 200 mekanı ve ilk pinleri toplamadan arayüze başlamak. Harita güzel görünür ama içi boş olur. Önce veri.

---

## İlk Somut Adım

`schema_1.sql`'i Supabase'de çalıştır (soneksiz `schema.sql`'i değil), sonra 20 hesaplık kaynak YAML'ını yaz. Scraper'a ondan sonra başla.
