import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const [html, css, sw, appSource, compiledApp, toolHtml, toolCss, toolSource, compiledTool, manifestText, locationsText] = await Promise.all([
  read("index.html"), read("css/app.css"), read("sw.js"), read("src/app.ts"), read("js/app.js"),
  read("koordinaten-werkzeug.html"), read("css/tool.css"), read("src/coordinate-tool.ts"), read("js/coordinate-tool.js"),
  read("manifest.webmanifest"), read("standorte.json"),
]);
const manifest = JSON.parse(manifestText);
const locations = JSON.parse(locationsText);

test("Standorte liegen in einer gemeinsamen, vollständigen Datenquelle", () => {
  assert.equal(Array.isArray(locations), true);
  assert.equal(locations.length, 43);
  assert.equal(new Set(locations.map((item) => item.id)).size, locations.length);
  for (const item of locations) {
    for (const field of ["company", "name", "address", "phone", "email", "hours", "lat", "lng"]) assert.ok(Object.hasOwn(item, field), `${item.id} needs ${field}`);
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

test("PWA ermöglicht Hoch- und Querformat", () => assert.equal(manifest.orientation, undefined));

test("Desktop erhält eine breite Karten-und-Liste-Ansicht", () => {
  assert.match(css, /@media\s*\(min-width:\s*800px\)/);
  assert.match(css, /grid-template-columns\s*:\s*(?:var\(--locations-panel-width\)\s+)?minmax\(/);
  assert.match(css, /#map\.hidden[^{]*\{[^}]*display:\s*block\s*!important/s);
  assert.match(css, /#list\.hidden[^{]*\{[^}]*display:\s*block\s*!important/s);
});

test("Handy-Viewport bleibt responsiv und nutzt Safe Areas", () => {
  assert.match(html, /name="viewport"[^>]*width=device-width/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\s*\(max-width:/);
});

test("Standortdetail ist nicht-modal; Hintergrund bleibt interaktiv", () => {
  assert.match(html, /id="sheet"[^>]*aria-modal="false"[^>]*inert/);
  assert.match(html, /id="sheet"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, /aria-modal="true"/);
  assert.doesNotMatch(appSource, /setBackgroundInert/);
  assert.doesNotMatch(appSource, /focusableElements\(/);
  assert.ok(appSource.includes("sheet.inert = false"));
  assert.ok(appSource.includes("sheet.inert = true"));
});

test("Ein Marker-Klick wechselt den Inhalt des bereits offenen Standortdetails", () => {
  assert.ok(appSource.includes('const wasOpen = sheet.classList.contains("open")'));
  assert.ok(appSource.includes("if (!wasOpen)"));
  assert.ok(appSource.includes("bubblingMouseEvents: false"));
  assert.ok(appSource.includes('map.on("click", closeSheet)'));
  assert.ok(compiledApp.includes('const wasOpen = sheet.classList.contains("open")'));
});

test("Dialog schließt per Escape und fängt die Tab-Taste nicht ab", () => {
  assert.match(appSource, /event\.key (?:===|!==) "Escape"/);
  assert.doesNotMatch(appSource, /event\.key !== "Tab"/);
  assert.match(compiledApp, /event\.key (?:===|!==) "Escape"/);
});

test("Offline-Kernressourcen werden lokal vorab gecacht", async () => {
  const coreBlock = sw.match(/const CORE\s*=\s*\[([^\]]*)\]/)?.[1] ?? "";
  for (const path of ["index.html", "css/app.css", "js/app.js", "js/domain.js", "standorte.json", "assets/nehlsen-logo.png", "vendor/leaflet.js", "vendor/leaflet.css", "vendor/leaflet.markercluster.js", "vendor/MarkerCluster.css", "vendor/MarkerCluster.Default.css", "vendor/images/layers.png", "vendor/images/layers-2x.png", "vendor/images/marker-icon.png", "vendor/images/marker-icon-2x.png", "vendor/images/marker-shadow.png"]) {
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

test("Der Markenbereich zeigt das Nehlsen-Logo und bietet einen benannten Theme-Schalter", () => {
  assert.match(html, /<img[^>]+src="\.\/assets\/nehlsen-logo\.png"[^>]+alt="Nehlsen"/);
  assert.match(html, /<button[^>]+id="themeToggle"[^>]+aria-label=/);
  assert.match(appSource, /localStorage\.getItem\("nehlsen-theme"\)/);
  assert.match(appSource, /localStorage\.setItem\("nehlsen-theme"/);
});

test("Hell- und Dunkelmodus definieren gut lesbare Oberflächen und speichern die Auswahl", () => {
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /--surface:/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(appSource, /prefers-color-scheme:\s*dark/);
});

test("Das neue Nehlsen-Grün wird in App und Koordinaten-Werkzeug verwendet", () => {
  assert.match(css, /--green:\s*#6ab023/);
  assert.match(css, /--header-green:\s*#456f1c/);
  assert.match(css, /--accent-green:\s*#4d8018/);
  assert.match(css, /header\s*\{[\s\S]*?background:\s*var\(--green\)/);
  assert.match(css, /\.pin\s*\{[^}]*background:\s*var\(--header-green\)/);
  assert.match(css, /marker-cluster-small div[\s\S]*?background:\s*var\(--header-green\)/);
  assert.match(css, /\.brand-copy p[^}]*color:\s*#0c120e/);
  assert.match(css, /html\[data-theme="dark"\][\s\S]*?--green:\s*#6ab023/);
  assert.match(css, /html\[data-theme="dark"\][\s\S]*?\.marker-cluster-large \{ background: color-mix\(in srgb, var\(--header-green\)/);
  assert.match(toolCss, /background:\s*#6ab023/);
  assert.match(toolCss, /color:\s*#4d8018/);
  assert.match(html, /id="themeColor"[^>]+content="#6ab023"/);
  assert.match(toolHtml, /name="theme-color" content="#6ab023"/);
  assert.match(manifestText, /"theme_color": "#6ab023"/);
});

test("Der Nehlsen-Markenauftritt sitzt rechts in der Kopfzeile und skaliert responsiv", () => {
  assert.ok(html.indexOf('class="brand-copy"') < html.indexOf('class="topbar-actions"'));
  assert.match(html, /class="topbar-actions"[\s\S]*?class="brand-logo" src="\.\/assets\/nehlsen-logo\.png"/);
  assert.match(css, /\.brand-logo\s*\{[^}]*width:\s*clamp\(/s);
  assert.match(css, /width:\s*clamp\(250px,\s*28vw,\s*420px\)/);
});

test("Theme-Schalter liegt in einer eigenen unteren Box und verdeckt keinen Inhalt", () => {
  assert.match(html, /<main[^>]*>[\s\S]*?<\/main>\s*<footer class="theme-dock"[^>]*>[\s\S]*?id="themeToggle"[\s\S]*?<\/footer>/);
  assert.match(css, /\.theme-dock\s*\{[^}]*border-radius:\s*999px/s);
  assert.match(css, /\.theme-dock\s*\{[^}]*flex:\s*0 0 auto/s);
});

test("Desktop-Standortliste lässt sich mit einer zugänglichen Schaltfläche ein- und ausklappen", () => {
  assert.match(html, /<main id="workspace">[\s\S]*?<button[^>]+id="listToggle"[^>]+aria-expanded="true"[^>]+aria-controls="list"/);
  assert.match(appSource, /listToggle\.addEventListener\("click"/);
  assert.match(appSource, /aria-expanded/);
  assert.match(css, /main\.list-collapsed\s*\{[^}]*grid-template-columns:\s*0 minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.list-toggle\s*\{[^}]*display:\s*inline-flex;[^}]*var\(--surface\)/s);
  assert.match(css, /\.list-toggle\s*\{[^}]*display:\s*inline-flex;[^}]*var\(--ink\)/s);
});

test("Theme-Dock reicht am Desktop nur bis zur Standortliste und schrumpft im eingeklappten Zustand", () => {
  assert.match(css, /--locations-panel-width:\s*clamp\(300px,\s*28vw,\s*380px\)/);
  assert.match(css, /\.theme-dock\s*\{[^}]*width:\s*var\(--locations-panel-width\)/s);
  assert.match(css, /#workspace\.list-collapsed\s*\+\s*\.theme-dock\s*\{[^}]*width:\s*max-content/s);
});

test("Designrad bietet Normal und Liquid Glass als unabhängig gespeicherte Darstellung", () => {
  assert.match(html, /id="appearanceToggle"[^>]+aria-controls="appearanceMenu"/);
  const designTrigger = html.match(/<button[^>]*id="appearanceToggle"[^>]*>/)?.[0] ?? "";
  assert.doesNotMatch(designTrigger, /aria-haspopup/, "the disclosed controls are a group, not an ARIA menu popup");
  assert.match(html, /id="appearanceMenu"[^>]*role="group"[\s\S]*?id="designNormal"[\s\S]*?id="designGlass"/);
  assert.match(appSource, /localStorage\.getItem\("nehlsen-design"\)/);
  assert.match(appSource, /localStorage\.setItem\("nehlsen-design"/);
  assert.match(css, /html\[data-design="glass"\]/);
  assert.match(css, /backdrop-filter:\s*blur/);
  assert.match(css, /@supports\s*\(backdrop-filter:\s*blur/);
  assert.match(css, /\.theme-dock\s*\{[^}]*z-index:\s*1100/s, "the control pill must stay above an open mobile detail sheet");
  assert.equal((appSource + compiledApp).includes("liquid-glass"), false);
  assert.equal(sw.includes("js/liquid-glass.js"), false);
});

test("Liquid Glass umfasst Kopfzeile, mobilen Ansichtswechsel und die gesamte Standortliste", () => {
  for (const selector of ['html[data-design="glass"] .app-header', 'html[data-design="glass"] .app-header::before', 'html[data-design="glass"] .search input', 'html[data-design="glass"] .near', 'html[data-design="glass"] .tabs', 'html[data-design="glass"] #list', 'html[data-design="glass"] .item-wrap']) {
    assert.ok(css.includes(selector), `Missing glass treatment for ${selector}`);
  }
  for (const source of [appSource, compiledApp]) {
    for (const marker of ["createLiquidGlass", "syncLiquidGlass", "liquidGlassInstances", "liquid-glass"]) assert.ok(!source.includes(marker), `Expensive runtime integration remains: ${marker}`);
  }
  assert.ok(!css.includes("backdrop-filter: blur(24px)"), "large glass surfaces should not use an expensive 24px blur");
  const listGlassRule = css.slice(css.indexOf('html[data-design="glass"] #list {')).split("}")[0];
  assert.ok(listGlassRule.includes("backdrop-filter: blur(4px)"), "the list pane should use a moderate blur");
  assert.ok(listGlassRule.includes("scrollbar-width: thin"), "the list scrollbar should be deliberately thin");
  assert.ok(listGlassRule.includes("scrollbar-color:"), "the native scrollbar should match the glass palette");
  assert.ok(css.includes('html[data-design="glass"] #list::-webkit-scrollbar-thumb'), "the WebKit scrollbar thumb should have glass-specific styling");
});

test("Inline icons use crisp, consistent SVGs instead of glyph characters", () => {
  assert.match(html, /id="appearanceToggle"[\s\S]*?<svg[^>]+viewBox="0 0 24 24"/);
  assert.match(html, /id="sClose"[^>]*><svg[^>]+viewBox="0 0 24 24"/);
  assert.match(appSource, /class="row-icon"/);
  assert.doesNotMatch(appSource, /⌖|☎|✉|◷/);
  assert.match(css, /\.row-icon\s*\{/);
  assert.match(css, /\.row > span:first-child\s*\{[^}]*width:\s*34px[^}]*height:\s*34px[^}]*border-radius:\s*11px/s);
});

test("Die Schaltfläche In der Nähe hat in beiden Modi dieselbe Farbe wie die Suche", () => {
  for (const selector of [/\.search input\s*\{([^}]*)\}/, /\.near\s*\{([^}]*)\}/]) {
    const rule = css.match(selector)?.[1] ?? "";
    assert.match(rule, /color:\s*var\(--ink\)/);
    assert.match(rule, /background:\s*var\(--surface\)/);
  }
});

test("Der Logo-Asset hat transparenten Hintergrund und enthält nur die weiße Wortmarke", async () => {
  const logo = await readFile(new URL("assets/nehlsen-logo.png", root));
  const width = logo.readUInt32BE(16);
  const height = logo.readUInt32BE(20);
  assert.equal(width, 353);
  assert.equal(height, 86);
  assert.equal(logo[25], 6, "logo must use RGBA pixels");
  let offset = 8;
  const imageData = [];
  while (offset < logo.length) {
    const length = logo.readUInt32BE(offset);
    if (logo.toString("ascii", offset + 4, offset + 8) === "IDAT") imageData.push(logo.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const pixels = inflateSync(Buffer.concat(imageData));
  let transparent = 0;
  let visible = 0;
  const stride = width * 4;
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1);
    assert.equal(pixels[row], 0, "logo rows must use the simple PNG filter");
    for (let x = 0; x < width; x += 1) {
      const pixel = row + 1 + x * 4;
      const alpha = pixels[pixel + 3];
      if (alpha === 0) transparent += 1;
      else {
        visible += 1;
        assert.deepEqual([...pixels.subarray(pixel, pixel + 3)], [255, 255, 255], "visible logo pixels should be white wordmark only");
      }
    }
  }
  assert.ok(transparent > 0, "background must be transparent");
  assert.ok(visible > 0, "wordmark must remain visible");
  assert.match(sw, /const VERSION = "v25"/);
});

test("Karten-Zoomsteuerung ist in App und Werkzeug deutsch beschriftet", () => {
  for (const source of [appSource, toolSource]) {
    assert.match(source, /zoomInTitle:\s*"Vergrößern"/);
    assert.match(source, /zoomOutTitle:\s*"Verkleinern"/);
  }
});
