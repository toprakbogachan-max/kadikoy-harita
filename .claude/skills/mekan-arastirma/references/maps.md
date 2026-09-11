# Google Haritalar'dan veri çekme

Hepsi Claude in Chrome (`mcp__claude-in-chrome__*`) ile, `browser_batch` içinde
navigate → wait 5s → javascript_tool üçlüsü hâlinde. Batch başına 4 mekan iyi çalışıyor.

## Mekan künyesi

```
https://www.google.com/maps/search/<mekan+adı>+Kadıköy
```

Tek sonuç varsa doğrudan yer paneline düşüyor. Extractor (her navigate'ten sonra tekrar
enjekte et — sayfa değişince JS bağlamı sıfırlanıyor):

```js
(function(){
  var L=document.body.innerText.split('\n').map(s=>s.trim()).filter(Boolean);
  var gi=L.indexOf('Genel Bakış'); if(gi<0) gi=L.indexOf('Yorumlar');
  var seg=L.slice(Math.max(0,gi-7),gi);                       // ad, puan, (yorum), fiyat, kategori
  var addr=L.find(s=>/34\d{3}\s*\S*stanbul/.test(s));
  var op=L.find(s=>/^(Açık|Kapalı|Geçici olarak kapalı|Kalıcı olarak kapalı)/.test(s));
  return JSON.stringify({seg:seg, addr:addr, op:op});
})()
```

`seg` tipik olarak şöyle döner:
`["Fotoğrafları göster","Rafine Moda - Fine Cuisine","4,5","(1.598)","","·₺600–800","Kahvaltı restoranı·"]`

Birden fazla sonuç dönerse panel yerine liste gelir; o zaman `seg` liste metnini taşır ve
`"Ad","4,6(475) · ₺400–600","Restoran · Sokak Adı"` biçiminde satırlar içinde arama yap.

## Yorumlar (son 6 ay)

Yorum sekmesine deep-link:

```
.../data=!4m8!3m7!1s<ftid>!8m2!3d<lat>!4d<lng>!9m1!1b1!16s<...>
```

`!9m1!1b1` yorum panelini açar. "Diğer yorumlar" butonu 3 yorumdan sonra tıklamaya yanıt
vermeyi bırakabiliyor — o zaman Yorumlar sekmesine **koordinatla tıkla**.

Liste sanal (virtualized): `scrollTop` ataması ve sentetik `WheelEvent` **yükleme
tetiklemiyor**. Gerçek `computer scroll` gerekiyor. Bu yüzden biriktirici + gerçek kaydırma:

```js
window.__ACC = new Map();
window.__grab = function(){
  try { document.querySelectorAll('button.w8nwRe').forEach(x=>x.click()); } catch(e){}   // "Devamı"
  document.querySelectorAll('.jftiEf').forEach(el=>{
    const s=(el.querySelector('.kvMYJc')?.getAttribute('aria-label')||'').trim();        // yıldız
    const w=(el.querySelector('.rsqaWe')?.innerText||'').trim();                          // "3 ay önce"
    const t=(el.querySelector('.wiI7pd')?.innerText||'').trim();                          // metin
    if(t.length>40){ const k=t.slice(0,60); if(!window.__ACC.has(k)) window.__ACC.set(k,{s,w,t}); }
  });
};
window.__T = setInterval(window.__grab, 300);

// 6 ay filtresi
window.__read = function(mm){
  mm = mm || 6;
  return [...window.__ACC.values()].filter(r=>{
    const w=(r.w||'').toLowerCase();
    if(/yıl|sene/.test(w)) return false;
    const m=w.match(/(\d+)\s*ay/);
    if(m && parseInt(m[1])>mm) return false;
    return true;
  });
};
```

Kaydırma ile yorum sayısı artmıyorsa dur ve elindekiyle çalış — sonsuz döngüye girme.

Pratikte mekan başına 10–20 güncel yorum çıkıyor; bazı mekanlarda Google 10'dan sonra
yenisini yüklemiyor (panel dibe geliyor, `scrollHeight` sabit kalıyor). 10 uzun yorum tema
çıkarmaya yetiyor ama örneklem küçük — pinin notunda kesinleştirici dil kullanma.

Yorum metinleri "…" ile kesikse `button.w8nwRe` ("Devamı") düğmeleri henüz tıklanmamış
demektir; biriktiriciyi durdurup hepsini tıkla, 1,5 sn bekle, sonra oku.

## Fotoğraf — pratikte çalışan yol

**Fotoğraf galerisi sekmesini kullanma.** Sol paneli boş yükleyip takılıyor, kategori
sekmeleri ("Ortam", "Yeme-içme") güvenilmez. Bunun yerine **yorum akışından topla**: yorum
paneli sağlıklı çalışıyor ve ziyaretçi kareleri zaten ambiyans + yemek karışımı.

Yorum biriktiricisinin içine fotoğraf toplayıcısını da koy (yukarıdaki `__grab` `__ph`
çağırıyor), yorumları kaydırırken fotoğraflar da birikir. Bir mekan için tipik olarak
25–60 kare çıkıyor.

```js
window.__P=new Map();
window.__ph=function(){
  document.querySelectorAll('*').forEach(function(el){
    var st=el.style&&el.style.backgroundImage;
    if(st&&st.indexOf('googleusercontent')>-1&&st.indexOf('-k-no')>-1){
      var m=st.match(/url\(["']?(.*?)["']?\)/);
      if(m){var k=m[1].split('=')[0]; if(!window.__P.has(k)) window.__P.set(k,k+'=w800-h600-k-no');}
    }});
  document.querySelectorAll('img').forEach(function(i){
    if(i.src&&i.src.indexOf('googleusercontent')>-1&&i.src.indexOf('-k-no')>-1&&i.width>40){
      var k=i.src.split('=')[0]; if(!window.__P.has(k)) window.__P.set(k,k+'=w800-h600-k-no');}});
};
```

Seçim: sayfaya numaralı kontakt sayfası bas, ekran görüntüsü al, numarayla seç. Sayfayı
silmeden önce URL listesini `window.name`'e yaz — `document.body.innerHTML=''` DOM'u siliyor
ama window değişkenleri kalıyor.

Elemeler: menü panosu, fiş, QR kod, şarap etiketi, selfie. Mekan tabelası sahnenin parçası
olduğu için sorun değil, ama okunabilir yazının hâkim olduğu kareyi alma.

## Eski yöntem (kategori butonları — genelde bozuk)

Fotoğraf sekmesindeki kategori butonları (`aria-label` = "Ortam", "Yeme-içme", "Hepsi")
tıklanıp panel birkaç kez sonuna kaydırılarak toplanır:

```js
window.__collect = async function(label){
  const btn=[...document.querySelectorAll('button')]
    .find(x=>((x.getAttribute('aria-label')||'').trim()===label));
  if(!btn) return [];
  btn.click(); await new Promise(r=>setTimeout(r,4000));
  const pane=document.querySelector('.m6QErb.DxyBCb');
  for(let i=0;i<4;i++){ if(pane) pane.scrollTop=pane.scrollHeight; await new Promise(r=>setTimeout(r,1200)); }
  const urls=[];
  document.querySelectorAll('*').forEach(el=>{
    const st=el.style&&el.style.backgroundImage;
    if(st&&st.includes('googleusercontent')){ const m=st.match(/url\(["']?(.*?)["']?\)/); if(m) urls.push(m[1]); }
  });
  document.querySelectorAll('img').forEach(i=>{
    if(i.src&&i.src.includes('googleusercontent')&&i.src.includes('-k-no')) urls.push(i.src);
  });
  const m=new Map();
  urls.forEach(u=>{ const k=u.split('=')[0]; if(!m.has(k)) m.set(k, k+'=w600-h450-k-no'); });
  return [...m.values()];
};
```

Seçim için sayfaya numaralı kontakt sayfası bas, ekran görüntüsü al, gözle seç:

```js
window.__sheet = function(list,p){
  document.body.innerHTML='';
  document.body.style.cssText='margin:0;background:#111;display:grid;grid-template-columns:repeat(6,1fr);gap:2px';
  list.forEach((u,i)=>{
    const d=document.createElement('div');
    d.style.cssText='position:relative;aspect-ratio:4/3;overflow:hidden;background:#000';
    d.innerHTML='<img src="'+u+'" style="width:100%;height:100%;object-fit:cover">'
      +'<span style="position:absolute;left:0;top:0;background:#ff0;color:#000;font:bold 20px monospace;padding:1px 5px">'+p+i+'</span>';
    document.body.appendChild(d);
  });
  window.scrollTo(0,0); return list.length;
};
```

### Bilinen sorunlar

- **Kategori filtreleri bozulabiliyor**: "Ortam" ve "Yeme-içme" aynı seti ya da başka mekanın
  karelerini döndürebiliyor. Böyle bir durumda kötü fotoğrafla devam etme — durumu bildir.
- **Doğrudan `curl` engelli**: agent proxy `lh3.googleusercontent.com`'a CONNECT'i 403 ile
  kesiyor. Görselleri sayfa origin'inden `fetch` et (CORS izinli) ya da tarayıcı içinde
  DataTransfer ile forma bırak.
- **Sekme MCP yeniden bağlanınca yok oluyor**, sayfa-içi state gidiyor. Uzun işlerde ara
  sonucu `window.name` (cross-origin gezinmede hayatta kalıyor) ya da uygulama origin'inde
  `localStorage` ile taşı.
