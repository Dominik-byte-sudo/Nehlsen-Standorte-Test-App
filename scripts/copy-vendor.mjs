import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vendor = join(root, "vendor");
const files = [
  ["node_modules/leaflet/dist/leaflet.js", "vendor/leaflet.js"],
  ["node_modules/leaflet/dist/leaflet.css", "vendor/leaflet.css"],
  ["node_modules/leaflet.markercluster/dist/leaflet.markercluster.js", "vendor/leaflet.markercluster.js"],
  ["node_modules/leaflet.markercluster/dist/MarkerCluster.css", "vendor/MarkerCluster.css"],
  ["node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css", "vendor/MarkerCluster.Default.css"],
];
for (const [from, to] of files) {
  const target = join(root, to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(root, from), target);
}

const imageSources = [
  join(root, "node_modules/leaflet/dist/images"),
  join(root, "node_modules/leaflet.markercluster/dist/images"),
];
const imageDir = join(vendor, "images");
await mkdir(imageDir, { recursive: true });
for (const source of imageSources) {
  const files = await readdir(source).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  for (const file of files) {
    await copyFile(join(source, file), join(imageDir, file));
  }
}
console.log("Copied Leaflet and MarkerCluster assets to vendor/.");
