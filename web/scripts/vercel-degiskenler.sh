#!/bin/sh
# .env.local'daki NEXT_PUBLIC_* değişkenlerini Vercel'e aktarır.
#
# ÖNCE `npx vercel link` ile proje bağlanmış olmalı.
# Vercel .env.local'ı kendiliğinden yüklemez — bu yüzden elle aktarılıyor.
#
#   ./scripts/vercel-degiskenler.sh
set -eu
cd "$(dirname "$0")/.."
[ -f .env.local ] || { echo ".env.local yok" >&2; exit 1; }

for ortam in production preview development; do
  echo "--- $ortam"
  grep -E '^NEXT_PUBLIC_[A-Z_]+=.+' .env.local | while IFS='=' read -r ad deger; do
    # Aynı ad zaten varsa Vercel hata verir; önce kaldırıp yeniden ekliyoruz.
    npx --yes vercel env rm "$ad" "$ortam" --yes >/dev/null 2>&1 || true
    printf '%s' "$deger" | npx --yes vercel env add "$ad" "$ortam" >/dev/null
    echo "    $ad"
  done
done
echo
echo "Bitti. Şimdi:  npx vercel --prod"
