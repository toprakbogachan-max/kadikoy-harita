# Keşif kaynakları

Öncelik sırası bağlayıcı: TikTok → Instagram → Oggusto → Gurman Atlas → influencer Maps listeleri.
TripAdvisor kullanılmıyor.

## TikTok

```
https://www.tiktok.com/tag/kadikoymekanonerileri
https://www.tiktok.com/tag/kadikoyyemek
https://www.tiktok.com/tag/modakafe
```

Video başlıkları ve açıklamaları mekan adını doğrudan veriyor. Fotoğraf gönderisi de var
(video-only değil) ama kareler genelde üstüne yazı basılmış oluyor — mekan **keşfi** için
iyi, mekan **fotoğrafı** için kötü.

## Instagram

```
https://www.instagram.com/explore/search/keyword/?q=%23kadikoyyemek
```

`/explore/tags/<etiket>/` bu adrese yönleniyor. Grid `<img>` elementlerinin `alt` özniteliği
gönderinin tam caption'ını taşıyor — asıl bilgi orada.

Kaydırırken biriktir (grid sanal, geri kaydırınca içerik kayboluyor):

```js
window.__CAP = new Set();
window.__g = function(){
  [...document.querySelectorAll('img')].forEach(i=>{
    const a=(i.alt||'').trim();
    if(a.length>25 && !a.includes('profile picture')) window.__CAP.add(a);
  });
};
window.__t = setInterval(window.__g, 400);
```

Sonra `computer scroll` ile birkaç tur kaydır, ardından:

```js
// @etiketler = mekan hesapları
const men=new Set();
[...window.__CAP].forEach(c=>(c.match(/@[A-Za-z0-9_.]{3,30}/g)||[]).forEach(m=>men.add(m)));
JSON.stringify([...men])
```

Numaralı liste gönderileri ("kadıköy favori mekânlarım 1.) ... 2.) ...") en verimli olanlar.

Uyarı: `#kadikoymekanonerileri` Instagram'da alakasız içerik (seramik atölyesi, tırnak, haber)
döndürüyor. Instagram tarafında `#kadikoyyemek` kullan.

Uyarı: Chrome eklentisi, query string içeren URL'leri döndüren JS çıktısını
`[BLOCKED: Cookie/query string data]` ile engelliyor. URL döndürme — sayfada bir değişkende
tut, sadece sayı/ad döndür.

## Oggusto

```
https://www.oggusto.com/gastronomi/istanbul/modada-gidebileceginiz-en-iyi-mekanlar
https://www.oggusto.com/gastronomi/istanbul/anadolu-yakasinin-en-iyi-mekanlari
https://www.oggusto.com/gastronomi/istanbul/istanbulun-en-yeni-mekanlari
```

`get_page_text` sadece özeti veriyor; mekan adları `h2`/`h3` başlıklarında:

```js
JSON.stringify([...document.querySelectorAll('h2,h3')].map(h=>h.innerText.trim()).filter(t=>t&&t.length<70))
```

Kategori başlıkları ("Moda'da Pizza, İtalyan Mutfağı ve Gün Boyu Restoranlar") mekan
adlarının arasına serpiştirilmiş — onlar mekan değil, kategori etiketi olarak kullan.

## Gurman Atlas (Vedat Milor)

```
https://www.gurmanatlas.com/region/kadikoy/
```

```js
const s=new Set();
[...document.querySelectorAll('a')].forEach(a=>{
  if(a.pathname.startsWith('/isletme/')){
    const t=a.innerText.split('\n')[0].trim(); if(t) s.add(t);
  }
});
JSON.stringify([...s])
```

Kart üstündeki kırmızı rozet kategori veriyor (Fırın/Kahvaltı/Tatlı, İskender ve Döner,
Esnaf Lokantası vb.) ama kategoriyi yine de Maps'ten doğrula.

## Zaten pinli mekanlar

Havuza girmeden önce uygulamadan mevcut pin listesini çek ve çıkar. 2026-09 itibarıyla pinli:
Çiya Sofrası, Aida Vino e Cucina, Yanyalı Fehmi Lokantası, Balıkçı Lokantası,
Meşhur Dondurmacı Ali Usta, Moda Da Nata, Il Sorrisino, fein.
