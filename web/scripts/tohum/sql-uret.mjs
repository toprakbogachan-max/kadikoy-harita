/**
 * mekanlar.json → tohum-mekanlar.sql
 *
 * Neden SQL dosyası? Supabase SQL Editor sorguları `postgres` rolüyle çalıştırır,
 * yani RLS'e takılmaz. İstemciden yazmaya çalışsaydık gizli service_role anahtarına
 * ihtiyaç olurdu; ona hiç dokunmuyoruz.
 *
 *   node scripts/tohum/sql-uret.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const mekanlar = JSON.parse(readFileSync(new URL("./mekanlar.json", import.meta.url)));

/* SQL metin kaçırma: tek tırnak ikilenir (Türkçe kesme işareti bu yüzden şemayı kırmıştı) */
const q = (v) => (v == null || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v == null ? "null" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`);

const satirlar = mekanlar.map((m) =>
  `  (${q(m.slug)}, ${q(m.name)}, ${q(m.category)}::place_category, ${q(m.neighborhood)}, ` +
  `${q(m.address)}, st_point(${m.lng}, ${m.lat})::geography, ${j(m.opening_hours)}, ` +
  `${q(m.phone)}, ${q(m.website)}, ${q(m.cover_url)}, ${q(m.cover_credit)})`,
);

/* SQL Editor'a 200 KB yapıştırmak zahmetli; 4 parçaya bölüyoruz.
   Her parça kendi başına çalıştırılabilir ve tekrar çalıştırmaya dayanıklı. */
const PARCA = 4;
const boy = Math.ceil(satirlar.length / PARCA);

const baslik = (n, adet) => `-- ============================================================
--  TOHUM ${n}/${PARCA}: Kadıköy mekanları — OpenStreetMap
--  Bu parçada ${adet} mekan · toplam ${mekanlar.length}
--  Üretim: scripts/tohum/sql-uret.mjs  (elle düzenleme, yeniden üret)
--
--  Veri: © OpenStreetMap katkıcıları, ODbL lisansı.
--  Arayüzde atıf göstermek ZORUNLU.
--  Kapak görselleri Wikimedia Commons'tan; lisans cover_credit alanında,
--  o da arayüzde görünür yerde gösterilmek zorunda.
--
--  Parçaları sırayla çalıştır. Tekrar çalıştırmak güvenli:
--  slug çakışırsa günceller, kopya oluşmaz.
-- ============================================================

insert into places
  (slug, name, category, neighborhood, address, geo, opening_hours, phone, website, cover_url, cover_credit)
values
`;

const kuyruk = `
on conflict (slug) do update set
  name          = excluded.name,
  category      = excluded.category,
  neighborhood  = excluded.neighborhood,
  address       = coalesce(excluded.address, places.address),
  geo           = excluded.geo,
  opening_hours = coalesce(excluded.opening_hours, places.opening_hours),
  phone         = coalesce(excluded.phone, places.phone),
  website       = coalesce(excluded.website, places.website),
  cover_url     = coalesce(excluded.cover_url, places.cover_url),
  cover_credit  = coalesce(excluded.cover_credit, places.cover_credit);

select count(*) as toplam_mekan,
       count(opening_hours) as saatli,
       count(cover_url) as kapakli
from places where slug not like 'demo-%';
`;

for (let i = 0; i < PARCA; i++) {
  const dilim = satirlar.slice(i * boy, (i + 1) * boy);
  if (!dilim.length) continue;
  const ad = `tohum-mekanlar-${i + 1}.sql`;
  writeFileSync(new URL("./" + ad, import.meta.url),
                baslik(i + 1, dilim.length) + dilim.join(",\n") + kuyruk);
  console.log(`${ad.padEnd(24)} ${dilim.length} mekan`);
}
console.log(`\ntoplam ${mekanlar.length} mekan · ${mekanlar.filter((m) => m.opening_hours).length} saatli · ${mekanlar.filter((m) => m.cover_url).length} kapaklı`);
