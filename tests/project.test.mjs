import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");

const [html, css, sw, appSource, compiledApp, toolHtml, toolSource, compiledTool, manifestText, locationsText] = await Promise.all([
  read("index.html"),
  read("css/app.css"),
  read("sw.js"),
  read("src/app.ts"),
  read("js/app.js"),
  read("koordinaten-werkzeug.html"),
  read("src/coordinate-tool.ts"),
  read("js/coordinate-tool.js"),
  read("manifest.webmanifest"),
  read("standorte.json"),
]);
const manifest = JSON.parse(manifestText);
const locations = JSON.parse(locationsText);

test("Standorte liegen in einer gemeinsamen, vollständigen Datenquelle", () => {
  assert.equal(Array.isArray(locations), true);
  assert.equal(locations.length, 43);
  assert.equal(new Set(locations.map((item) => item.id)).size, locations.length);
  for (const item of locations) {
    for (const field of ["company", "name", "address", "phone", "email", "hours", "lat", "lng"]) {
      assert.ok(Object.hasOwn(item, field), `${item.id} needs ${field}`);
    }
    assert.ok(item.lat >= -90 && item.lat <= 90, `${item.id} latitude`);
    assert.ok(item.lng >= -180 && item.lng <= 180, `${item.id} longitude`);
  }
});

test("App und Koordinaten-Werkzeug verwenden dieselbe Standortdatei", () => {
  assert.ok(appSource.includes('fetch("./standorte.json"'));
  assert.ok(toolSource.includes('fetch("./standorte.json"'));
  assert.ok(toolHtml.includes('type="module" src="./js/coordinate-tool.js"'));
  assert.doesNotMatch(appSource, /const D\s*=\s*\[/);
  assert.doesNotMatch(toolSource, /const S\s*=\s*\[/);
});

test("PWA ermöglicht Hoch- und Querformat", () => {
  assert.equal(manifest.orientation, undefined);
});

test("Desktop erhält eine breite Karten-und-Liste-Ansicht", () => {
  assert.match(css, /@media\s*\(min-width:\s*800px\)/);
  assert.match(css, /grid-template-columns\s*:\s*minmax\(/);
  assert.match(css, /#map\.hidden[^{]*\{[^}]*display:\s*block\s*!important/s);
  assert.match(css, /#list\.hidden[^{]*\{[^}]*display:\s*block\s*!important/s);
});

test("Handy-Viewport bleibt responsiv und nutzt Safe Areas", () => {
  assert.match(html, /name="viewport"[^>]*width=device-width/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\s*\(max-width:/);
});

test("Standortdialog ist bei geschlossenem Zustand inert und modal gekennzeichnet", () => {
  assert.match(html, /id="sheet"[^>]*aria-modal="true"[^>]*inert/);
  assert.match(html, /id="sheet"[^>]*aria-hidden="true"/);
});

test("Dialog blockiert Hintergrund, schließt per Escape und gibt Fokus zurück", () => {
  assert.ok(html.includes('role="dialog" aria-modal="true"'));
  assert.ok(html.includes('aria-hidden="true" inert'));
  assert.ok(appSource.includes("sheet.inert = true"));
  assert.ok(appSource.includes('event.key === "Escape"'));
  assert.ok(appSource.includes("focusTarget.focus({ preventScroll: true })"));
  assert.ok(appSource.includes("focusables[0]"));
});

test("Offline-Kernressourcen werden lokal vorab gecacht", async () => {
  const coreBlock = sw.match(/const CORE\s*=\s*\[([^\]]*)\]/)?.[1] ?? "";
  for (const path of ["index.html", "css/app.css", "js/app.js", "js/domain.js", "standorte.json", "vendor/leaflet.js", "vendor/leaflet.css", "vendor/leaflet.markercluster.js", "vendor/MarkerCluster.css", "vendor/MarkerCluster.Default.css", "vendor/images/layers.png", "vendor/images/layers-2x.png", "vendor/images/marker-icon.png", "vendor/images/marker-icon-2x.png", "vendor/images/marker-shadow.png"]) {
    assert.ok(coreBlock.includes(path), `CORE missing ${path}`);
    await access(new URL(path, root));
  }
  assert.ok(sw.includes("cache.addAll(CORE)"));
  assert.ok(sw.includes("const TILE_LIMIT = 500"));
  assert.doesNotMatch(html + toolHtml, /https:\/\/(?:unpkg\.com|fonts\.googleapis\.com)/);
});

test("OpenStreetMap-Attribution ist vollständig und verlinkt", () => {
  assert.ok(appSource.includes("https://www.openstreetmap.org/copyright"));
  assert.ok(appSource.includes("contributors"));
});

test("Die gebauten Module verwenden nur relative JavaScript-Imports", () => {
  assert.ok(compiledApp.includes('from "./domain.js"'));
  assert.doesNotMatch(compiledApp + compiledTool, /from ["'](?:leaflet|leaflet\\.markercluster)["']/);
});

test("Die App lädt TypeScript-kompilierten JavaScript-Code als ES-Modul", () => {
  assert.match(html, /<script\s+type="module"\s+src="\.\/js\/app\.js"/);
});
