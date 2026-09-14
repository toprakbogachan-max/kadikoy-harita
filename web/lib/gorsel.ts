/**
 * Görsel yardımcılar — prototipteki jeton pin ve post-it dilinin karşılığı.
 * Tasarım kararları BRIEF.md → "Tasarım dili" bölümünden gelir.
 */
import { SIMGE, TUR_AD, EMOJI } from "./paleti";
import type { Yer } from "./model";

/** post-it kağıdı + toplu iğne renkleri, kategoriden türer */
/**
 * Toplu iğne ve post-it kağıdı değişkenleri.
 *
 * Mantar pano metaforu bitti; kategoriye göre renk üretmiyor artık. Hâlâ
 * duruyor çünkü birkaç ekran bu CSS değişkenlerini okuyor — hepsi nötre
 * bağlandı, yani iğne başı ve kağıt her kategoride aynı. Çağıranlar tek
 * tek temizlenince bu fonksiyon da silinecek.
 */
export function igneStil(_tur?: string): React.CSSProperties {
  return {
    ["--pin" as string]: "#A8A8AB",
    ["--pin-isik" as string]: "#DCDCDB",
    ["--pin-koyu" as string]: "#6B6B70",
    ["--kag" as string]: "#FFFFFF",
  };
}

/** post-it'lerin hafif eğikliği — hep aynı sırayla, rastgele değil */
export const egim = (i: number) => [-0.8, 0.6, -0.4, 0.9, -0.6][i % 5];

/**
 * Fotoğrafı olmayan kartların zemini.
 *
 * Eskiden kategori renginin DOLU hâliydi (`ana` → `golge`). Izgarada yan yana
 * dokuz kategori olunca akış doygun renkten bir duvara dönüyordu; kartın
 * kendisi değil rengi bağırıyordu. Artık aynı kategori ipucu pastel bir
 * gradyan olarak duruyor: hangi tür olduğu hâlâ okunuyor ama kart
 * fotoğraflı komşusunun önüne geçmiyor.
 *
 * Bu, "doygunluk alanla ters orantılı" kuralının ızgaraya uygulanması —
 * fotoZeminGenis() aynı şeyi tam ekran için geceye karıştırarak yapıyor.
 */
export const fotoZemin = (_tur?: string) =>
  `linear-gradient(150deg, #F7F7F6 0%, #EAEAE9 100%)`;

/**
 * fotoZemin() üstünde duran simgenin rengi. Kategoriye göre DEĞİŞMİYOR —
 * tek nötr gri. Kategoriyi emoji taşıyor.
 */
export const zeminSimgeRengi = (_tur?: string) => "#A8A8AB";

/**
 * Tam ekran zemin — ızgara kartındakinin kısılmış hâli.
 *
 * Doygunluk alanla ters orantılı çalışır: kart boyutunda canlı duran
 * #E0271C, gönderi detayında bütün ekranı kaplayınca bağırıyor ve kağıt/
 * pano paletinden (krem, kum, mürekkep, pirinç) kopuyordu. Fotoğraf
 * object-contain olduğu için bu zemin aynı zamanda kadraj bandı; her
 * fotoğraf görüntüleyicisi bu bandı nötr tutar, doygun renk fotoğrafın
 * kendi renklerini de bozuyor.
 *
 * Kategori ipucu korunuyor ama mürekkebe karıştırılıyor: kırmızı yerine
 * "kırmızıya çalan gece".
 */
/* Palet nötre döndüğü için gece de nötr: ılık kahve (#1B1510) yeni
   kırık beyaz zeminin yanında sepya bir leke gibi duruyordu. */
const GECE = "#141416";
export const fotoZeminGenis = (_tur?: string) =>
  `linear-gradient(160deg, #1E1E21 0%, ${GECE} 100%)`;

/**
 * "3 sa", "2 gün" — geçen süre.
 *
 * Girdi ondalık saat: veritabanındaki created_at'ten hesaplanıyor, tam sayı
 * değil. Yuvarlanmazsa "20.77557472222222 sa" yazıyor. (Demo verisinde saatler
 * elle tam sayı yazıldığı için bu ortaya çıkmamıştı.)
 */
export const zaman = (s: number) =>
  s < 1 ? "az önce"
    : s < 24 ? `${Math.round(s)} sa`
    : `${Math.floor(s / 24)} gün`;

/**
 * "Şu an açık mı" — true / false / null (bilgi yok).
 * NULL kapalı DEĞİL: kullanıcının eklediği mekanlarda saat bilgisi olmayabilir.
 */
export function acikMi(saatler: number[][] | null | undefined, t: Date): boolean | null {
  if (!saatler) return null;
  const gun = t.getDay();
  const dk = t.getHours() * 60 + t.getMinutes();
  const toDk = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  for (const [g, ac, kap] of saatler as unknown as [number, string, string][]) {
    const a = toDk(ac), k = toDk(kap);
    if (k > a) {
      if (g === gun && dk >= a && dk < k) return true;
    } else {
      // gece yarısını aşan saatler (20:00–02:00)
      if (g === gun && dk >= a) return true;
      if (g === (gun + 6) % 7 && dk < k) return true;
    }
  }
  return false;
}

/** Kategori simgesi — jeton içinde ve etiketlerde kullanılır */
export const simgeSvg = (tur: string, boyut: number, renk = "#FFFFFF") =>
  `<svg width="${boyut}" height="${boyut}" viewBox="0 0 24 24" fill="none" stroke="${renk}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${SIMGE[tur] ?? ""}</svg>`;


/**
 * Sessiz nokta — pini olmayan mekanlar için.
 *
 * Neden ayrı bir biçim: pinsiz mekan haritada jeton olmayı hak etmiyor.
 * Altlık harita onu zaten etiketliyor (OpenMapTiles adı yazıyor), üstüne
 * ikinci bir işaret koymak gürültü. Ama dokunulabilir olması gerekiyor —
 * mekan sayfasını açıp oraya ilk pini atabilmek için. Nokta bu ikisini
 * uzlaştırıyor: görünür ama öne çıkmıyor.
 */
export function noktaSVG(_y: Pick<Yer, "tur">, acik: boolean | null): string {
  /* Kategori rengi YOK. Dokuz kategori dokuz renk demekti ve yakınlaşınca
     harita bir renk tablosuna dönüyordu. Pinsiz mekan zaten sessiz bir iz;
     tek bilgisi "burada bir yer var". Açık/kapalı ayrımı tonla veriliyor. */
  const S = 13, m = S / 2;
  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" style="display:block">
    <circle cx="${m}" cy="${m}" r="${m - 2.2}" fill="${acik === false ? "#C3C3C4" : "#86868A"}"
            fill-opacity="0.85"
            stroke="#fff" stroke-width="1.6" stroke-opacity=".9"/>
  </svg>`;
}

/**
 * Fotoğrafı OLMAYAN pinli mekanın işareti — emoji marker.
 *
 * Eski jetonSVG'nin yerini alıyor. O, kategoriyi dokuz doygun renkle
 * anlatıyordu; altlık sessizleştirilse bile harita bir renk tablosu gibi
 * okunuyordu ve fotoğraflı marker'larla aynı dili konuşmuyordu. Artık
 * fotoğraflı marker'la BİREBİR aynı kabuk (.foto-marker) kullanılıyor,
 * içindeki tek fark: fotoğraf yerine kategori emojisi.
 *
 * Böylece haritada tek bir işaret dili kalıyor — dolu daire — ve içindeki
 * şey ya mekanın fotoğrafı ya da emojisi oluyor.
 */
export function emojiMarkerHTML(
  y: Pick<Yer, "tur" | "ad">,
  acik: boolean | null,
  populer: boolean,
  secili = false,
): string {
  return `<span class="foto-marker${populer ? " populer" : ""}${acik === false ? " kapali" : ""}">
    <span class="foto-marker-kutu foto-marker-emoji">${EMOJI[y.tur] ?? EMOJI.diger}</span>
    ${secili ? `<span class="foto-marker-etiket">
      <b>${kacir(y.ad)}</b>
      <i>${populer ? "popüler · " : ""}${kacir(TUR_AD[y.tur] ?? y.tur).toLocaleLowerCase("tr")}</i>
    </span>` : ""}
  </span>`;
}

/** Metni HTML özniteliğine güvenle koymak için. */
const kacir = (m: string) =>
  m.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Fotoğraflı marker — mekanın kendi görüntüsü haritanın üstünde küçük kart.
 *
 * Neden jetonun yerine: dokuz kategori dokuz doygun renk demekti ve altlık
 * sessizleştirilse bile harita bir renk tablosu gibi okunuyordu. Fotoğraf
 * hem daha çok bilgi taşıyor (buranın nasıl bir yer olduğunu söylüyor) hem
 * de altlıkla yarışmıyor. Kategori bilgisi kaybolmuyor: sağ alttaki nokta
 * onu taşıyor — çiplerdeki noktayla aynı dil.
 *
 * URL'i ÇAĞIRAN küçültüyor (veri.ts'teki kucukUrl); burada boyut seçimi yok,
 * yoksa her marker 280 KB'lık dosyayı indirirdi.
 *
 * Yüklenemezse (ağ, silinmiş dosya) onerror EMOJİ marker'ına düşürüyor: boş beyaz
 * kare bırakmak mekanı haritadan silmek olurdu. loading="lazy" YOK — marker
 * haritanın içinde dönüştürülmüş bir katmanda durduğu için tarayıcı onu
 * görünürde saymıyordu ve ekrandaki işaretler boş beyaz kare kalıyordu;
 * dosyalar zaten ~3 KB. Yükleme bitene kadar kategori degradesi duruyor.
 */
export function fotoMarkerHTML(
  url: string,
  y: Pick<Yer, "tur" | "ad">,
  acik: boolean | null,
  populer: boolean,
  /* Seçili marker adını YANINDA taşıyor: yarım açılımda çekmece ekranın
     yarısını kaplıyor ve hangi pine dokunduğun yalnızca konumdan
     anlaşılmıyordu. Referansta da seçili işaretin yanında ad + eğik bir
     alt satır duruyor. */
  secili = false,
): string {
  const yedek = emojiMarkerHTML(y, acik, populer, false).replace(/\s+/g, " ");
  return `<span class="foto-marker${populer ? " populer" : ""}${acik === false ? " kapali" : ""}">
    <span class="foto-marker-kutu" style="background:${fotoZemin()}"><img src="${kacir(url)}" alt="" decoding="async"
      onerror="this.closest('.foto-marker').outerHTML=this.dataset.yedek"
      data-yedek="${kacir(yedek)}"></span>
    ${secili ? `<span class="foto-marker-etiket">
      <b>${kacir(y.ad)}</b>
      <i>${populer ? "popüler · " : ""}${kacir(TUR_AD[y.tur] ?? y.tur).toLocaleLowerCase("tr")}</i>
    </span>` : ""}
  </span>`;
}


/**
 * Kişi rengi — kullanıcı adından türer.
 *
 * profiles tablosunda renk sütunu yok ve olmasına gerek de yok: renk veri
 * değil sunum. Deterministik olması önemli — aynı kişi her yerde, her açılışta
 * aynı rengi alsın diye kullanıcı adının karması kullanılıyor.
 * Doygunluk/parlaklık sabit tutuluyor ki beyaz baş harf her tonda okunsun.
 */
export function kisiRengi(kullaniciAdi: string): string {
  let h = 0;
  for (const c of kullaniciAdi) h = (h * 31 + c.codePointAt(0)!) >>> 0;
  return `hsl(${h % 360} 46% 42%)`;
}
