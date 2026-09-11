# Kadıköy Harita — pin oluşturma

Uygulama: https://kadikoy-harita.vercel.app · Pin atmadan önce **her seferinde ayrı izin al**.

Giriş durumunu PROFİL sekmesinden `get_page_text` ile doğrula — hangi hesapla girilmiş olduğu
önemli. `localStorage` kontrolü hidrasyondan önce çalışırsa yanlış sonuç verir.

## Form alanları

| Alan | Tip / seçici |
| --- | --- |
| MEKAN* | `input[placeholder*="Mekan ara"]` — OSM araması |
| FOTOĞRAF YA DA VİDEO* | gizli `input[type=file]`, `multiple` |
| — her fotoğrafın notu | satırdaki **DIV**'e tıkla → modal açılır |
| — modal alanı | `textarea[placeholder="İsteğe bağlı"]`, **120 karakter** |
| — modal onayı | metni `TAMAM` olan button |
| ÜÇ KELİMEYLE ANLAT* | `input[placeholder="1."/"2."/"3."]` |
| GELİŞ SENARYOSU* | metni eşleşen button: tek başına / çalışmak için / ilk buluşma / kalabalık grup / hızlı uğrak / uzun oturma |
| BANA HİTAP PUANI* | `input[type=range]` min 1 max 10 step 0.5 |
| GİTMEDEN BİLİNMESİ GEREKEN | `textarea[placeholder^="Hangi masaya"]`, 1000 |
| BİR ŞEY DEĞİŞSE | `input[placeholder="Ne olsa daha iyi olurdu?"]` |
| KİŞİ BAŞI ÖDEDİĞİN | `input[placeholder="örn. 250"]` |
| Yayınla | metni `PAYLAŞ` olan button |

Not satırındaki DIV'i bulmak:

```js
[...document.querySelectorAll('*')]
  .filter(e => e.children.length===0 && (e.textContent||'').includes('görselin notu'))[0].click();
```

Notu dolu bir satırı yeniden açmak için `'görselin notu'` yerine o notun bir parçasını ara.

## Hazır yardımcılar (sayfa yüklendikten sonra bir kez enjekte et)

```js
window.__setV=function(el,val){var P=el.tagName==='TEXTAREA'?HTMLTextAreaElement:HTMLInputElement;
  Object.getOwnPropertyDescriptor(P.prototype,'value').set.call(el,val);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));};
window.__setNote=function(t){var ta=[...document.querySelectorAll('textarea')]
  .find(x=>(x.placeholder||'')==='İsteğe bağlı'); if(!ta)return 'yok'; window.__setV(ta,t); return ta.value.length;};
window.__tamam=function(){var b=[...document.querySelectorAll('button')]
  .find(x=>(x.innerText||'').trim()==='TAMAM'); if(b){b.click();return 'ok';} return 'yok';};
window.__notAc=function(){var n=[...document.querySelectorAll('*')]
  .filter(e=>e.children.length===0&&(e.textContent||'').indexOf('görselin notu')>-1);
  if(n.length){n[0].click(); return n.length;} return 0;};
```

## Fotoğraf yükleme

Görselleri uygulama origin'inden `fetch` et (lh3.googleusercontent.com CORS'a izin veriyor),
`File`'a çevir, `DataTransfer` ile gizli input'a bırak:

```js
window.__files=[];
for (const [i,u] of urls.entries()){
  const r=await fetch(u); const b=await r.blob();
  window.__files.push(new File([b], 'mekan-'+(i+1)+'.jpg', {type:'image/jpeg'}));
}
var inp=document.querySelector('input[type=file]');
var dt=new DataTransfer(); window.__files.forEach(f=>dt.items.add(f));
inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true}));
```

**Bir kez gönder ve say.** `change` olayını tekrar tetiklemek dosyaları **ekliyor**, değiştirmiyor:
üç deneme 15 dosya yaptı. Gönderdikten sonra `innerText` içinde "N dosya" kontrol et; yanlışsa
formu kapatıp baştan başla.

URL'leri sayfalar arası taşımak için `window.name` kullan (cross-origin gezinmede hayatta kalıyor).

## Mekan haritada yoksa (yeni mekan)

Uygulamanın yer veritabanı OSM tabanlı; Google Haritalar'daki her mekan orada yok
(Basta! Street Food Bar, Semolina, Brekkie Breakfast Club yoktu). Doğru yol:

1. Formu **taze aç** — mini harita varsayılan geniş görünümde olur (Kadıköy geneli).
2. Mekanın tam adını arama kutusuna yaz.
3. **Mini haritada hedef pikseline tıkla** → "YENİ MEKAN" paneli adı doldurulmuş olarak açılır.
4. Kategori çipini seç (Kahve / Yemek / Bar / Tatlı / Kültür / Park / Otel / Mağaza / Diğer).

**"<AD> ADIYLA EKLE" butonunu kullanma.** Mini haritayı sabit bir varsayılan merkeze
(Bahariye) zoomluyor, ana haritanın konumunu dinlemiyor, ve iğneyi oradan hedefe sürüklemek
mümkün olmuyor. Mini haritada zoom kontrolü yok, scroll-zoom kapalı.

### Piksel hesabı

Pencereyi bilinen bir genişliğe sabitle (`resize_window`, ör. 1512), sonra ekran görüntüsünden
**Altıyol metro ikonunu** çapa al: `40.98998, 29.02853`.

Varsayılan zoom'da, 1512 piksel genişlikte ekran görüntüsü için:

```
Δx =  (hedef_lng - 29.02853) / 3.226e-5      (doğu +)
Δy = -(hedef_lat - 40.98998) / 2.438e-5      (güney +)
tıklama = (altıyol_x + Δx, altıyol_y + Δy)
```

Doğrulama: BAHARİYE etiketi Altıyol'un ~154 piksel altında çıkmalı. Hedef haritanın altına
taşarsa formu bir tık kaydır (harita yukarı gelir) ve yeniden ölç. ±15 piksel ≈ ±35 m, kabul
edilebilir; iğne sonradan sürüklenerek düzeltilebilir.

## Tuzaklar

- **✕ butonlarını topluca tıklama.** Fotoğraf satırlarının kaldır butonu ile modalın kapatma
  butonu aynı `✕` metnini taşıyor; en alttakini tıklayan döngü modalı kapatıp formu siliyor.
  Bir satırı kaldıracaksan o satırın kutusundan git.
- Form açıkken **ana haritaya** tıklama; mekan seçimi sıfırlanıyor.
- Pencere boyutu değişirse tüm piksel hesapları bozulur — `resize_window` ile sabitle.
- React inputları `.value=` ile güncellenmiyor; `__setV` kullan.
