# Kadıköy Harita — web

Next.js (App Router) + TypeScript + Tailwind + Supabase + MapLibre.

## Kurulum

1. Supabase'de proje aç, `../schema.sql`'i SQL Editor'de çalıştır.
2. `.env.local.example`'ı `.env.local` olarak kopyala, Project Settings → API'den
   URL ve anon key'i doldur. **Bu dosya git'e girmez.**
3. `npm run dev`

## Yapı

- `lib/supabase/client.ts` — tarayıcı istemcisi (client component)
- `lib/supabase/server.ts` — sunucu istemcisi (server component / route handler)
- `lib/types.ts` — `schema.sql` ile hizalı tipler. Şema değişirse burası da değişir.
- `app/globals.css` — tasarım dili (`../prototip.html`'den taşındı)

## Tasarım referansı

`../prototip.html` çalışan arayüz prototipi. **Tasarım oradan korunur, yapı burada değişir.**

## Bilinen tuzaklar

- **MapLibre worker**: Karolar bir Web Worker'da çözülüyor; MapLibre worker'ı
  kendi içinde string URL'den kurduğu için Turbopack bundle'a almıyor ve harita
  boş kalıyor. Worker `public/maplibre/` altından servis ediliyor
  (`scripts/maplibre-worker-kopyala.mjs`, predev/prebuild'de çalışır).
- **Harita kapsayıcısı**: `maplibre-gl.css` `.maplibregl-map{position:relative}`
  tanımı Tailwind'in `absolute` sınıfını eziyor. Konumlandırma satır içi stille.
- **Next.js 16**: `middleware.ts` → `proxy.ts` olarak yeniden adlandırıldı
  (fonksiyon adı da `proxy`). Supabase oturum yenilemesi buna göre yazılmalı.
- Kök dizindeki `AGENTS.md`: bu Next.js sürümü eğitim verisinden farklı,
  kod yazmadan önce `node_modules/next/dist/docs/` okunmalı.

## Vercel'e yükleme

Uygulama `web/` alt klasöründe. Vercel CLI o klasörden çalıştırılırsa kök
dizini kendisi doğru alır — GitHub'a itmeye gerek yok.

```
cd web
npx vercel login          # tarayıcı açılır, hesabınla giriş yap
npx vercel link           # yeni proje oluştur ya da mevcuduna bağla
./scripts/vercel-degiskenler.sh   # .env.local'daki NEXT_PUBLIC_* değerlerini aktarır
npx vercel --prod
```

`vercel-degiskenler.sh` şart: Vercel `.env.local` dosyasını kendiliğinden
yüklemez, değişkenler olmadan uygulama açılır ama Supabase'e bağlanamaz.

### Yükledikten sonra

**Supabase → Authentication → URL Configuration** bölümüne Vercel adresini ekle
(`Site URL` ve `Redirect URLs`). Bu olmadan kayıt doğrulama e-postalarındaki
bağlantı localhost'a gider. Var olan hesaplarla şifreyle girişte gerekmiyor.

### Bilinmesi gerekenler

- **Adres herkese açık.** Vercel bağlantısı olan herkes uygulamayı açabilir.
- **Demo hesapların şifresi depoda yazılı** (`demo12345`). Bağlantıyı paylaşırsan
  o hesaplarla giriş yapıp pin atılabilir. Demo için sorun değil, canlıda değil.
- **anon anahtarı istemci paketine girer** — normal. Güvenlik RLS'te, anahtarda
  değil; kimin neyi görüp yazabileceği schema.sql'deki policy'lerde tanımlı.
- Yayına çıkmadan önce `scripts/tohum/tohum-temizle.sql` çalıştırılmalı —
  haritada var olmayan `demo-` mekanlar duruyor.
