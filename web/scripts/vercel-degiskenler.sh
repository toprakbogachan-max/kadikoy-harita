#!/bin/sh
# .env.local'daki NEXT_PUBLIC_* değişkenlerini Vercel'in üç ortamına aktarır.
#
# ÖNCE `npx vercel link` ile proje bağlanmış olmalı.
# Vercel .env.local'ı kendiliğinden yüklemez.
#
# --visibility config --no-sensitive ŞART: Vercel yeni değişkenleri varsayılan
# olarak "gizli" işaretliyor, ama NEXT_PUBLIC_* zaten tarayıcı paketine giriyor;
# Production/Preview'da gizli olamaz ve istek invalid_visibility ile reddedilir.
# (Anon anahtarın herkese açık olması sorun değil — güvenlik RLS'te.)
#
#   ./scripts/vercel-degiskenler.sh
set -eu
cd "$(dirname "$0")/.."
[ -f .env.local ] || { echo ".env.local yok" >&2; exit 1; }

deger() { grep "^$1=" .env.local | cut -d= -f2-; }

# Boru hattı içinde `while read` kullanılmıyor: `vercel env add` de stdin
# okuduğu için ikisi çakışıp döngü sessizce takılıyor.
for ad in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_MAP_STYLE; do
  v=$(deger "$ad")
  [ -n "$v" ] || { echo "  atlandi (bos): $ad"; continue; }
  for ortam in production preview development; do
    npx --yes vercel env rm "$ad" "$ortam" --yes >/dev/null 2>&1 || true
    if printf '%s' "$v" | npx --yes vercel env add "$ad" "$ortam" \
         --visibility config --no-sensitive >/dev/null 2>&1; then
      echo "  $ortam · $ad"
    else
      echo "  HATA $ortam · $ad" >&2
    fi
  done
done
echo
echo "Bitti. Simdi:  npx vercel --prod"
