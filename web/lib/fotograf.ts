/**
 * Yüklemeden önce fotoğrafı küçültme.
 *
 * Telefondan seçilen fotoğraf olduğu gibi yükleniyordu: 4000 piksel genişlik,
 * birkaç megabayt. Uygulama onu en büyük yerde bile 1080 piksel gösteriyor,
 * yani fazlası mobil veriyi ve bekleme süresini boşa harcıyor.
 *
 * Yeniden kodlamanın ikinci faydası biçim: iPhone varsayılan olarak HEIC
 * çekiyor, onu Safari dışındaki tarayıcılar gösteremiyor. Tuvalden geçen her
 * fotoğraf JPEG çıkıyor.
 */

/* Uzun kenar üst sınırı. Kırpılmış kadraj 1350 piksel; bunun altına inmek
   kırpmayı bozardı, çok üstü de görünmeyen ayrıntı demek. */
const EN_UZUN_KENAR = 1600;
const KALITE = 0.85;

/** Küçültülemeyen dosya — çağıran kullanıcıya bunu gösteriyor. */
export class FotografHatasi extends Error {}

interface Cozum {
  kaynak: CanvasImageSource;
  en: number;
  boy: number;
  kapat: () => void;
}

/**
 * Dosyayı tuvale çizilebilir hâle getiriyor.
 *
 * Önce createImageBitmap: hızlı ve EXIF dönüşünü kendisi uyguluyor
 * (telefon fotoğrafları çoğu zaman "yan" kaydedilip EXIF ile döndürülüyor;
 * bu olmadan yüklenen fotoğraf yan çıkardı). Desteklemeyen tarayıcı için
 * <img> yedeği var — o da EXIF'e uyuyor.
 */
async function cozumle(dosya: File): Promise<Cozum> {
  try {
    const bit = await createImageBitmap(dosya, { imageOrientation: "from-image" });
    return { kaynak: bit, en: bit.width, boy: bit.height, kapat: () => bit.close() };
  } catch {
    /* yedeğe düşülüyor */
  }
  const url = URL.createObjectURL(dosya);
  try {
    const im = new Image();
    im.src = url;
    await im.decode();
    return {
      kaynak: im, en: im.naturalWidth, boy: im.naturalHeight,
      kapat: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new FotografHatasi(
      `"${dosya.name}" açılamadı. iPhone'dan geliyorsa HEIC olabilir: Ayarlar › Kamera › Biçimler › "En Uyumlu" seçilirse JPEG çekiyor.`,
    );
  }
}

/**
 * Gerekiyorsa küçültüp JPEG'e çeviriyor; gerekmiyorsa dosyayı olduğu gibi
 * geri veriyor.
 *
 * Video ve GIF'e dokunulmuyor: tuval tek kare çiziyor, ikisi de hareketini
 * kaybederdi.
 */
export async function fotografiKucult(dosya: File): Promise<File> {
  if (!dosya.type.startsWith("image/") || dosya.type === "image/gif") return dosya;

  const c = await cozumle(dosya);
  try {
    const olcek = Math.min(1, EN_UZUN_KENAR / Math.max(c.en, c.boy));
    /* Zaten sınırın altında ve zaten JPEG ise yeniden kodlamıyoruz: kazancı
       yok, her kodlama biraz kalite yiyor. Kırpma ekranından çıkan 1080x1350
       dosya da bu daldan geçiyor. */
    if (olcek === 1 && dosya.type === "image/jpeg") return dosya;

    const tuval = document.createElement("canvas");
    tuval.width = Math.round(c.en * olcek);
    tuval.height = Math.round(c.boy * olcek);
    const ct = tuval.getContext("2d");
    if (!ct) return dosya;
    /* JPEG saydamlık tutmuyor; PNG'den gelen boşluk siyah yerine beyaz. */
    ct.fillStyle = "#fff";
    ct.fillRect(0, 0, tuval.width, tuval.height);
    ct.drawImage(c.kaynak, 0, 0, tuval.width, tuval.height);

    const parca: Blob | null = await new Promise((ver) =>
      tuval.toBlob((b) => ver(b), "image/jpeg", KALITE),
    );
    if (!parca) return dosya;
    /* Küçük ve iyi sıkıştırılmış bir JPEG yeniden kodlanınca büyüyebiliyor.
       Öyleyse orijinali tutuyoruz — ama yalnızca zaten JPEG'se, çünkü asıl
       amaçlardan biri biçimi JPEG'e çevirmek. */
    if (dosya.type === "image/jpeg" && parca.size >= dosya.size) return dosya;

    const ad = dosya.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([parca], ad, { type: "image/jpeg" });
  } finally {
    c.kapat();
  }
}

/** Seçilen dosyaları sırayla geçiriyor; ilk hata olduğu gibi yukarı çıkıyor. */
export async function fotograflariHazirla(dosyalar: File[]): Promise<File[]> {
  const cikti: File[] = [];
  for (const d of dosyalar) cikti.push(await fotografiKucult(d));
  return cikti;
}
