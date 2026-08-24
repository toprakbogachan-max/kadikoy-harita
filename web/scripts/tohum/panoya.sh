#!/bin/sh
# Dosyayı panoya UTF-8 olarak koyar.
#
# NEDEN AYRI SCRIPT: pbcopy girdiyi locale'e göre yorumlar. LC_CTYPE ayarlı
# değilse (LC_CTYPE="C") UTF-8 baytlarını MacRoman sanır ve panoya bozuk metin
# koyar: "Çiya" → "√áiya". pbpaste aynı yanlışı tersine çevirdiği için
# terminalde yaptığın kontrol SORUNU GÖSTERMEZ — ama tarayıcıya yapıştırınca
# bozuk hâli gider. Bu şekilde veritabanına 1052 bozuk mekan adı yazıldı.
#
#   ./panoya.sh ../../schema.sql
set -eu
[ $# -eq 1 ] || { echo "kullanım: $0 <dosya>" >&2; exit 1; }
LC_CTYPE=UTF-8 pbcopy < "$1"
printf 'panoda: %s (%s satır, %s bayt)\n' "$(basename "$1")" \
  "$(wc -l < "$1" | tr -d ' ')" "$(wc -c < "$1" | tr -d ' ')"
# Doğrulama panodan DEĞİL, AppleScript ile okunur — pbpaste kendi hatasını gizler.
osascript -e 'the clipboard as text' | head -c 400 | grep -q '√\|ƒ\|≈' \
  && { echo "UYARI: panoda hâlâ bozuk karakter var" >&2; exit 1; } || true
echo "kodlama doğrulandı"
