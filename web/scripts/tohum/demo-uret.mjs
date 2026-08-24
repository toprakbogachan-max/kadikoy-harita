/**
 * demo.ts'teki 12 mekan / 5 kişi / 15 pin / 5 yorum / 3 listeyi SQL'e çevirir.
 *
 * NEDEN HAYALİ MEKANLAR DA TOHUMLANIYOR?
 * Pin metinleri prototipte hayali mekanlar için yazıldı ("kart geçmiyor,
 * nakit al yanına"). Bunları OSM'den gelen gerçek işletmelere bağlamak,
 * gerçek işletmeler hakkında uydurma iddia yayınlamak olurdu — üstelik
 * eşleşme de tutmuyordu (balıkçı pini pizzacıya düşüyordu). Bu yüzden
 * prototipin 12 hayali mekanı ayrıca, "demo-" ön ekli slug ile tohumlanıyor.
 * Kimse zarar görmüyor, ekran da dolu kalıyor.
 *
 * ⚠️  YİNE DE YAYINA ÇIKMAMALI — haritada var olmayan yerler görünür.
 * Gerçek kullanıcı gelmeden önce tohum-temizle.sql çalıştırılmalı.
 * Bulunabilir olsun diye:  slug "demo-" · e-posta @demo.invalid · medya demo://
 *
 *   node scripts/tohum/demo-uret.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { sade } from "./ortak.mjs";

const kaynak = readFileSync(new URL("../../lib/demo.ts", import.meta.url), "utf8");

/* demo.ts'ten dizi/nesne kes — tip ekindeki köşeli parantez yanıltmasın */
function kes(ad) {
  const i = kaynak.indexOf("export const " + ad);
  const e = kaynak.indexOf("=", i);
  const b = kaynak.slice(e).search(/[[{]/) + e;
  const ac = kaynak[b], kap = ac === "[" ? "]" : "}";
  let d = 0, j = b, tirnak = null;
  for (; j < kaynak.length; j++) {
    const c = kaynak[j];
    if (tirnak) { if (c === "\\") j++; else if (c === tirnak) tirnak = null; continue; }
    if (c === '"') tirnak = c;
    else if (c === ac) d++;
    else if (c === kap) { d--; if (!d) break; }
  }
  return JSON.parse(kaynak.slice(b, j + 1));
}

const KISILER  = kes("KISILER");
const PINLER   = kes("PINLER");
const YORUMLAR = kes("YORUMLAR");
const LISTELER = kes("LISTELER");
const YERLER   = kes("YERLER");

/* ---- prototipin hayali mekanları: "demo-" ön ekiyle ayrı tohumlanır ---- */
const demoSlug = (id) => "demo-" + id;

/* demo.ts saatleri [[gun,"08:00","22:00"], ...] biçiminde; şema jsonb istiyor */
const saatCevir = (a) =>
  Array.isArray(a) && a.length
    ? a.map(([d, open, close]) => ({ d, open, close }))
    : null;

const q  = (v) => (v == null || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const jsonb = (v) => (v == null ? "null" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`);
const dizi = (a) => (a?.length ? `array[${a.map(q).join(",")}]::text[]` : "null");

/* ---- kullanıcılar ---- */
const kisiler = Object.entries(KISILER).map(([id, k]) => ({
  id, eposta: `${sade(k.k).replace(/\s/g, "")}@demo.invalid`,
  kullanici: sade(k.k).replace(/\s/g, "").slice(0, 24),
  ad: k.ad, bio: k.bio, takipci: k.takipci, takip: k.takip,
}));

/* prototipin hayali mekanları — gerçeklerle karışmasın diye slug'ları "demo-" */
const demoMekanSql =
  "insert into places (slug, name, category, neighborhood, geo, opening_hours, status)\nvalues\n" +
  YERLER.map((y) =>
    `  (${q(demoSlug(y.id))}, ${q(y.ad)}, ${q(y.tur)}::place_category, ${q(y.semt)},\n` +
    `   st_point(${y.lng}, ${y.lat})::geography, ${jsonb(saatCevir(y.saatler))}, 'published')`,
  ).join(",\n") +
  "\non conflict (slug) do update set\n" +
  "  name = excluded.name, category = excluded.category,\n" +
  "  neighborhood = excluded.neighborhood, geo = excluded.geo,\n" +
  "  opening_hours = excluded.opening_hours;";

let sql = `-- ============================================================
--  TOHUM: demo kullanıcılar ve pinler  ⚠️  SADECE GELİŞTİRME
--  Üretim: scripts/tohum/demo-uret.mjs
--
--  Prototipin 12 HAYALİ mekanını da ekler (slug "demo-..."). Gerçek
--  işletmelere uydurma yorum yazmamak için böyle: pin metinleri bu
--  hayali yerler için yazılmıştı, orada kalıyorlar.
--  GERÇEK KULLANICI GELMEDEN ÖNCE tohum-temizle.sql ÇALIŞTIRILMALI.
--
--  Demo hesap şifresi: demo12345   (e-postalar @demo.invalid — teslim edilemez)
-- ============================================================

-- ---------- prototipin hayali mekanları ----------
${demoMekanSql}

-- Supabase'de pgcrypto "extensions" şemasında durur.
-- auth.users'a doğrudan yazıyoruz: Auth API'den kayıt olmak e-posta
-- doğrulaması ister, gizli service_role anahtarı ise hiç kullanılmıyor.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
`;

/* auth.users satırları — id'yi slug'dan türetiyoruz ki tekrar çalıştırınca aynı olsun */
const uuid = (s) => {
  /* sabit ve okunabilir: 'demo' + kişi adı, uuid biçimine doldurulmuş */
  const h = [...sade(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const x = h.toString(16).padStart(8, "0");
  return `${x}-0000-4000-8000-${x}00000000`.slice(0, 36);
};

sql += kisiler.map((k) =>
  `  ('00000000-0000-0000-0000-000000000000', '${uuid(k.id)}', 'authenticated', 'authenticated',\n` +
  `   ${q(k.eposta)}, extensions.crypt('demo12345', extensions.gen_salt('bf')),\n` +
  `   now(), now(), now(),\n` +
  `   '{"provider":"email","providers":["email"]}'::jsonb,\n` +
  `   jsonb_build_object('username', ${q(k.kullanici)}, 'display_name', ${q(k.ad)}),\n` +
  `   '', '', '', '')`,
).join(",\n");

sql += `\non conflict (id) do nothing;

-- profiles satırlarını trg_auth_user_created açtı; bio ve sayaçları tamamla
`;
sql += kisiler.map((k) =>
  `update profiles set display_name = ${q(k.ad)}, bio = ${q(k.bio)},\n` +
  `  follower_count = ${k.takipci ?? 0}, following_count = ${k.takip ?? 0}\n` +
  `  where id = '${uuid(k.id)}';`,
).join("\n");

/* ---- pinler ---- */
sql += `\n\n-- ---------- pinler ----------\n`;
const pinSatir = [];
for (const p of PINLER) {
  const yerSlug = demoSlug(p.yer);
  const gun = `(now() - interval '${p.saat} hours')`;
  pinSatir.push(
    `insert into pins (id, author_id, place_id, body, words, scenario, rating,\n` +
    `                  improve, frequency, would_return, price_paid, visit_date, created_at, like_count)\n` +
    `select '${uuid("pin" + p.id)}', '${uuid(p.kisi)}', pl.id, ${q(p.metin)},\n` +
    `       ${dizi(p.kelimeler)}, ${q(p.senaryo)}, ${p.puan},\n` +
    `       ${q(p.degisse)}, ${q(p.siklik)}, ${q(p.tekrar)}, ${p.fiyat ?? "null"},\n` +
    `       ${gun}::date, ${gun}, ${p.begeni ?? 0}\n` +
    `from places pl where pl.slug = ${q(yerSlug)}\n` +
    `on conflict (id) do nothing;`,
  );
  /* medya: gerçek dosya yok, demo:// işaretli yer tutucu (arayüz degrade çiziyor) */
  const medya = p.medyalar?.length ? p.medyalar : [{ tur: "foto", not: null }];
  medya.forEach((md, i) => {
    pinSatir.push(
      `insert into pin_media (pin_id, kind, storage_path, caption, ordering)\n` +
      `values ('${uuid("pin" + p.id)}', ${q(md.tur === "video" ? "video" : "photo")}::media_kind,\n` +
      `        ${q(`demo://pin-${p.id}-${i + 1}`)}, ${q(md.not)}, ${i})\n` +
      `on conflict do nothing;`,
    );
  });
}
sql += pinSatir.join("\n\n");

/* ---- yorumlar, takipler, listeler ---- */
sql += `\n\n-- ---------- yorumlar ----------\n`;
sql += YORUMLAR.map((y) =>
  `insert into pin_comments (pin_id, author_id, body, created_at)\n` +
  `values ('${uuid("pin" + y.pin)}', '${uuid(y.kisi)}', ${q(y.metin)},\n` +
  `        now() - interval '${y.saat ?? 1} hours')\n` +
  `on conflict do nothing;`,
).join("\n\n");

sql += `\n\n-- ---------- takipler (ben → diğerleri) ----------\n`;
sql += Object.keys(KISILER).filter((k) => !KISILER[k].ben).map((k) =>
  `insert into follows (follower_id, following_id) values ('${uuid("bogac")}', '${uuid(k)}')\n` +
  `on conflict do nothing;`,
).join("\n");

sql += `\n\n-- ---------- listeler ----------\n`;
for (const l of LISTELER) {
  sql += `insert into lists (id, owner_id, slug, title, intro)\n` +
         `values ('${uuid("liste" + l.id)}', '${uuid(l.sahip)}', ${q(sade(l.baslik).replace(/\s+/g, "-"))},\n` +
         `        ${q(l.baslik)}, ${q(l.giris)})\n` +
         `on conflict (id) do nothing;\n`;
  l.yerler.forEach((yid, i) => {
    const yerSlug = demoSlug(yid);
    sql += `insert into list_items (list_id, place_id, ordering)\n` +
           `select '${uuid("liste" + l.id)}', id, ${i} from places where slug = ${q(yerSlug)}\n` +
           `on conflict do nothing;\n`;
  });
  sql += "\n";
}

sql += `-- doğrulama
select 'profil' as ne, count(*) from profiles
union all select 'pin', count(*) from pins
union all select 'medya', count(*) from pin_media
union all select 'yorum', count(*) from pin_comments
union all select 'liste', count(*) from lists;
`;

writeFileSync(new URL("./tohum-demo.sql", import.meta.url), sql);

console.error("=== tohumlanan hayali demo mekanları");
for (const y of YERLER) {
  console.error(`  ${demoSlug(y.id).padEnd(20)} ${y.ad.padEnd(24)} ${y.tur.padEnd(7)} ${y.semt}`);
}
console.error(`\ntohum-demo.sql yazıldı — ${YERLER.length} hayali mekan, ${kisiler.length} kişi, ${PINLER.length} pin, ${(sql.length/1024).toFixed(0)} KB`);
