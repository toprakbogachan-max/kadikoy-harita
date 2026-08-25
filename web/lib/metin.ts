/**
 * Türkçe metin sadeleştirme — arama sorgusunu veritabanındaki search_text
 * sütunuyla aynı biçime indirir.
 *
 * Şemadaki karşılığı:
 *   lower(translate(ad, 'ÇĞİÖŞÜÂÎÛçğıöşüâîû', 'CGIOSUAIUcgiosuaiu'))
 * İkisi ayrı ayrı yazılmış olsa da AYNI sonucu vermek zorunda; biri değişirse
 * diğeri de değişmeli, yoksa arama sessizce eşleşmez.
 *
 * DİKKAT: JavaScript'te "İ".toLowerCase() tek harf vermez, "i" + U+0307
 * (birleşen nokta) verir. O yüzden önce eşleme, sonra küçültme yapılıyor —
 * SQL tarafındaki sıra da bu.
 */
const ESLEME: Record<string, string> = {
  "Ç": "C", "Ğ": "G", "İ": "I", "Ö": "O", "Ş": "S", "Ü": "U",
  "Â": "A", "Î": "I", "Û": "U",
  "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
  "â": "a", "î": "i", "û": "u",
};

export const aramaMetni = (s: string): string =>
  s.replace(/[ÇĞİÖŞÜÂÎÛçğıöşüâîû]/g, (c) => ESLEME[c]).toLowerCase();
