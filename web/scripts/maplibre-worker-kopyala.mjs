/**
 * MapLibre'nin worker dosyalarını public/ altına kopyalar.
 *
 * Neden: MapLibre karoları bir Web Worker'da çözüyor ve worker'ı kendi içinde
 * string bir URL'den kuruyor. Turbopack bunu statik olarak göremediği için
 * bundle'a dahil etmiyor; worker isteği HTML 404 dönüyor ve karolar hiç
 * yüklenmiyor (harita boş kalır). Dosyayı public/ üzerinden servis edip
 * setWorkerUrl ile adresini veriyoruz.
 *
 * predev/prebuild'de çalışır, böylece paket sürümü değişince kopya tazelenir.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const kaynak = join(kok, "node_modules", "maplibre-gl", "dist");
const hedef = join(kok, "public", "maplibre");

/* worker, kardeş dosyası maplibre-gl-shared.mjs'i import ediyor — o da lazım */
const dosyalar = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

await mkdir(hedef, { recursive: true });
for (const d of dosyalar) {
  await copyFile(join(kaynak, d), join(hedef, d));
}
console.log(`maplibre worker kopyalandı → public/maplibre/ (${dosyalar.length} dosya)`);
