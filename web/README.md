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
