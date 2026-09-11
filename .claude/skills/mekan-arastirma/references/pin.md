# Kadıköy Harita — pin oluşturma

Uygulama: https://kadikoy-harita.vercel.app · Pin atmadan önce **her seferinde ayrı izin al**.

Giriş durumunu `get_page_text` ile doğrula — `localStorage` kontrolü hidrasyondan önce
çalışırsa "giriş yapılmamış" gibi görünür ve yanlış rapor verirsin.

## Form alanları

| Alan | Tip | Not |
| --- | --- | --- |
| MEKAN* | arama + seçim | OSM tabanlı; adı yaz, çıkan sonuçtan seç |
| FOTOĞRAF YA DA VİDEO* | çoklu dosya | İlk yüklenen = KAPAK |
| — her fotoğrafın notu | modal, **120 karakter** | Notu yaz → TAMAM |
| ÜÇ KELİMEYLE ANLAT* | 3 input | `input[placeholder="1."]`, `"2."`, `"3."` |
| GELİŞ SENARYOSU* | seçim | tek başına / çalışmak için / ilk buluşma / kalabalık grup / hızlı uğrak / uzun oturma |
| BANA HİTAP PUANI* | `input[type=range]` | min 1, max 10, step 0.5 |
| GİTMEDEN BİLİNMESİ GEREKEN | textarea, 1000 | somut bilgi, genel övgü değil |
| BİR ŞEY DEĞİŞSE | opsiyonel | "İSTERSEN BİRKAÇ ŞEY DAHA" altında |
| HANGİ SIKLIKLA GELİNİR | opsiyonel | |
| TEKRAR GİDER MİSİN | opsiyonel | |
| KİŞİ BAŞI ÖDEDİĞİN (₺) | opsiyonel | Maps fiyat bandından değil, gerçek deneyimden |

Formun kendi uyarısı: *"Fotoğraf, üç kelime, senaryo, puan ve somut bir not zorunlu.
'Çok güzeldi' yazan pin kimseye yaramıyor."* — notları buna göre yaz.

## Doldurma sırası

1. Mekanı ara ve seç (**önce bu** — sonra haritaya dokunma)
2. Fotoğrafları yükle, kapak olacak kareyi ilk sıraya koy
3. Her fotoğrafın notunu modalden gir (120 karakter sınırına dikkat, kırpma değil kısalt)
4. Üç kelime → senaryo → puan
5. Gitmeden bilinmesi gereken
6. Opsiyoneller
7. Kaydet

## Tuzaklar

- **Haritaya tıklama.** Form açıkken haritaya bir tık, mekan seçimini sıfırlayıp "YENİ MEKAN"
  moduna düşürüyor. Fotoğraflar ve diğer alanlar kalıyor ama mekan bağı gidiyor; kurtarmak
  için mekanı yeniden aratmak gerekiyor.
- **React kontrollü inputlar** doğrudan `.value =` ile güncellenmiyor. Native prototype
  setter + `input`/`change` event'i gerekiyor:

```js
function setNative(el, val){
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype,'value').set.call(el, val);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
}
```

- **Dosya yükleme** gizli `input[type=file]`'a DataTransfer ile:

```js
const dt = new DataTransfer();
dt.items.add(new File([blob], 'foto1.jpg', {type:'image/jpeg'}));
input.files = dt.files;
input.dispatchEvent(new Event('change',{bubbles:true}));
```

Blob'ları uygulama origin'inde `fetch` ile al (lh3.googleusercontent.com CORS'a izin veriyor).
