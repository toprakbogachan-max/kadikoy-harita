# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dil

Veritabanı İngilizce (SQL geleneği), uygulama Türkçe: dosya adları, bileşenler,
değişkenler, yorumlar, arayüz metni ve commit mesajları Türkçe yazılır.
Kök `README.md` İngilizce (GitHub vitrini), geri kalan belgeler Türkçe.

## Komutlar

Hepsi `web/` dizininden:

```bash
npm run dev            # predev MapLibre worker'ını public/'e kopyalar
npm run build          # prebuild aynı kopyalamayı yapar
npm run lint
npx tsc --noEmit       # tip denetimi (build'den ayrı çalıştırmak gerekebilir)

node scripts/kontrol/kara-testi.mjs   # depodaki tek test: Kadıköy kara sınırı
npx vercel --prod                     # yayın
```

`kara-testi.mjs` ürün kodunu (`lib/kadikoy-icinde.ts`) doğrudan import eder —
`kadikoy-sekli.ts` veya `karadaMi()` değişirse bu test koşulmalı.

Veritabanı elle yönetiliyor, migration aracı yok. Supabase SQL Editor'de:
`schema.sql` (yeniden çalıştırmaya dayanıklı) → `web/scripts/goc/*.sql` numara
sırasıyla. Tohumlama ve panoya alma için `web/scripts/tohum/README.md`.

## Mimari

**Tek sayfalık istemci uygulaması.** `web/app/page.tsx` uygulamanın tamamıdır;
harita, akış, profil, mekan sayfası, arama "ekran" state'idir, route değildir.
Gerçek route yalnızca `app/auth/onay/route.ts`, `manifest.ts`, `robots.ts`.
Yani sunucu bileşeni üzerinden veri çekimi yok — her sorgu tarayıcıdan, anon
anahtarla, RLS altında koşar.

**`lib/veri.ts` Supabase ile arayüz arasındaki tek sınır** (~1260 satır).
Şemanın İngilizce satırlarını `lib/model.ts`'teki Türkçe alan modeline çevirir;
bileşenler Supabase'i hiç görmez. `lib/types.ts` şemadaki ham satır tiplerini
yansıtır. **Şema değişirse bu üç dosya birlikte değişir.**

**Ağır iş Postgres'te.** Yakınlık/kategori/"şu an açık" süzmesi, mekan özeti ve
akış sıralaması RPC'lerde: `places_nearby`, `place_summary`, `feed_discover`,
`feed_following`, `yer_bul_ya_da_olustur`, `is_open_now` (hepsi `schema.sql`).
1052 mekanı tarayıcıya indirip elemek yerine sorgu parametresi geçilir.

**Güvenlik anahtarda değil veritabanında.** `anon` anahtarı istemci paketine
girer, bu bilinçli; kimin neyi okuyup yazabileceği `schema.sql`'deki RLS
policy'lerinde tanımlı. `service_role` hiçbir yerde kullanılmaz — bu yüzden
tohum verisi SQL Editor'den yüklenir. Demo hesaplar RLS düzeyinde salt-okunur
(`public.demo_hesap()`, `goc/15-demo-salt-okunur.sql`); şifreleri depoda açık
yazılı olduğu için kısıt arayüzde değil veritabanında olmalı.

**Veri çekme kalıbı:** `lib/kanca.ts` → `useVeri(getir, bagimliliklar, baslangic)`.
`yukleniyor` ayrı state değil, "sonuç güncel anahtara mı ait" sorusundan türer;
efekt yarış durumunu `iptal` bayrağıyla keser. Yeni bir veri çekimi yazarken
bunu kullan, elle `useEffect`+`useState` kurma.

**Kimlik:** `lib/oturum.tsx` (`OturumSaglayici`) tek kimlik kaynağı; profil
satırını `handle_new_user` trigger'ı açar, kayıttan sonra elle profil
oluşturulmaz. `web/proxy.ts` oturum jetonunu tazeler.

**Tasarım:** `prototip.html` çalışan arayüz prototipi ve tasarım referansıdır —
tasarım oradan korunur, yapı `web/` içinde değişir. Tokenlar
`app/globals.css` `@theme` bloğunda, kategori renkleri/ikonları `lib/paleti.ts`,
jeton pin ve post-it üretimi `lib/gorsel.ts`.

Ürün kararlarının gerekçesi `BRIEF.md`'de, veri modeli anlatımı
`kadikoy-harita-mimari.md`'de.

## Tuzaklar

- **Next.js 16**: `middleware.ts` yok, `proxy.ts` ve `proxy` fonksiyonu var.
  `web/AGENTS.md` (bunu `next dev` yazar, silme) bu sürümün eğitim verisinden
  farklı olduğunu söylüyor — kod yazmadan önce `node_modules/next/dist/docs/`
  altındaki ilgili rehberi oku. `web/CLAUDE.md` sadece o dosyaya işaret eder.
- **MapLibre worker**: MapLibre worker'ı string URL'den kurduğu için Turbopack
  bundle'a almaz, harita boş kalır. Worker `public/maplibre/` altından servis
  ediliyor (`scripts/maplibre-worker-kopyala.mjs`, predev/prebuild).
- **Harita kapsayıcısı**: `maplibre-gl.css`'in `.maplibregl-map{position:relative}`
  tanımı Tailwind'in `absolute` sınıfını ezer; konumlandırma satır içi stille.
- **Türkçe İ**: `"İ".toLowerCase()` → `i` + U+0307. Slug üretiminde mutlaka
  `scripts/tohum/ortak.mjs` kullanılır, naif regex temizliği "İsmail"i
  "i-smail" yapar.
- **`pbcopy` kullanma**: locale'e göre UTF-8'i bozar ve `pbpaste` aynı hatayı
  tersine çevirdiği için terminalde fark edilmez. `scripts/tohum/panoya.sh`.
- `scripts/tohum/tohum-*.sql` üretilmiş dosyalardır — kaynağı (`mekanlar.json`,
  üreteç scriptleri) düzeltip yeniden üret.
- **Atıf zorunlulukları**: mekan verisi OSM/ODbL, kapak görselleri Wikimedia
  CC-BY (`places.cover_credit`). İkisi de arayüzde görünür olmak zorunda.
- **Depo public**: kişisel belge ve mekan araştırma verisi (havuz tabloları,
  aday listeleri) repoya girmez. `.env.local` asla commit edilmez.

## Mekan araştırma hattı

Yeni mekan bulup pinlemek `.claude/skills/mekan-arastirma` skill'inin işi
(`/mekan` komutuyla koşar). Hattın iki onay kapısı var ve pin atma izni her
turda ayrıca alınır — skill'i okumadan bu işe girişme.
