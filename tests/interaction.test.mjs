import assert from "node:assert/strict";
import test from "node:test";

class Classes {
  values = new Set();
  contains(value) { return this.values.has(value); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  toggle(value, force) {
    const add = force ?? !this.values.has(value);
    if (add) this.values.add(value); else this.values.delete(value);
    return add;
  }
}
class ElementMock {
  constructor(id) { this.id = id; this.classList = new Classes(); this.attrs = new Map(); this.listeners = {}; this.inert = false; this.scrollTop = 0; this.innerHTML = ""; this.dataset = {}; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  setAttribute(name, value) { this.attrs.set(name, value); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  contains(other) { return other === this || (this.id === "sheet" && [els.sBody, els.sClose].includes(other)); }
  focus() { globalThis.document.activeElement = this; }
  closest(selector) { return selector === ".hidden" && this.classList.contains("hidden") ? this : null; }
  get isConnected() { return true; }
  getBoundingClientRect() { return { top: 100, left: 100, right: 900, bottom: 700 }; }
}
const ids = ["map", "list", "count", "q", "nearBtn", "sheet", "sClose", "sBody", "tMap", "tList", "toast", "themeToggle", "themeDock", "themeColor", "workspace", "listToggle", "appearanceToggle", "appearanceMenu", "designNormal", "designGlass"];
const els = Object.fromEntries(ids.map((id) => [id, new ElementMock(id)]));
els.workspace.classList = new Classes();
els.listToggle.setAttribute("aria-expanded", "true");
els.listToggle.setAttribute("aria-label", "Standortliste ausblenden");
els.sheet.inert = true;
els.sheet.setAttribute("aria-hidden", "true");
els.list.classList.add("hidden");
const tabs = new ElementMock("tabs");
const docListeners = {};
globalThis.HTMLElement = ElementMock;
globalThis.KeyboardEvent = class KeyboardEvent extends Event { constructor(type, init = {}) { super(type, init); this.key = init.key ?? ""; this.shiftKey = init.shiftKey ?? false; } };
globalThis.document = {
  activeElement: els.map,
  documentElement: { dataset: {} },
  getElementById(id) { return els[id] ?? null; },
  querySelector(selector) { return selector === ".tabs" ? tabs : null; },
  addEventListener(type, fn) { (docListeners[type] ??= []).push(fn); },
};
const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) { storage.set(key, String(value)); },
};
const mapEvents = {};
const mapMock = {
  panCalls: 0, invalidations: 0, views: [],
  setView(point, zoom) { this.views.push({ point, zoom }); return this; },
  addLayer() { return this; },
  on(type, fn) { mapEvents[type] = fn; return this; },
  fitBounds() {}, invalidateSize() { this.invalidations += 1; }, getZoom() { return 6; },
  panInside() { this.panCalls += 1; },
};
class MarkerMock {
  constructor(coords, options) { this.coords = coords; this.options = options; this.events = {}; }
  on(type, fn) { this.events[type] = fn; return this; }
  setIcon() { return this; } setZIndexOffset() { return this; }
  addTo() { return this; } remove() { return this; }
  click() { this.events.click({ originalEvent: new Event("click") }); }
}
const cluster = {
  layers: [], clearLayers() { this.layers = []; }, addLayers(items) { this.layers = items; },
  hasLayer(marker) { return this.layers.includes(marker); }, zoomToShowLayer(_marker, callback) { callback(); },
};
globalThis.L = {
  map() { return mapMock; },
  control: { zoom() { return { addTo() {} }; } },
  tileLayer() { return { addTo() {} }; },
  divIcon(options) { return options; },
  marker(coords, options) { return new MarkerMock(coords, options); },
  markerClusterGroup() { return cluster; },
  latLngBounds(points) { return points; },
};
globalThis.window = {
  matchMedia() { return { matches: true }; },
  requestAnimationFrame(fn) { fn(); },
  setTimeout, clearTimeout,
  addEventListener() {},
};
const locations = [
  { id: "one", company: "Nehlsen", name: "Standort Eins", address: "Straße 1, Bremen", phone: "1", email: "one@example.com", hours: "Mo-Fr", lat: 53.1, lng: 8.7 },
  { id: "two", company: "Nehlsen", name: "Standort Zwei", address: "Straße 2, Bremen", phone: "2", email: "two@example.com", hours: "Mo-Fr", lat: 53.2, lng: 8.8 },
];
globalThis.fetch = async () => ({ ok: true, json: async () => locations });

await import("../js/app.js?interaction-test");
await new Promise((resolve) => setTimeout(resolve, 0));

test("Standortliste lässt sich schließen und über die gleiche Schaltfläche wieder öffnen", () => {
  assert.equal(els.listToggle.getAttribute("aria-expanded"), "true");
  els.listToggle.listeners.click[0]();
  assert.equal(els.workspace.classList.contains("list-collapsed"), true);
  assert.equal(els.listToggle.getAttribute("aria-expanded"), "false");
  assert.equal(els.listToggle.getAttribute("aria-label"), "Standortliste einblenden");
  els.listToggle.listeners.click[0]();
  assert.equal(els.workspace.classList.contains("list-collapsed"), false);
  assert.equal(els.listToggle.getAttribute("aria-expanded"), "true");
  assert.equal(els.listToggle.getAttribute("aria-label"), "Standortliste ausblenden");
});

test("Die Karte wird nach Ende der Seitenleisten-Animation erneut gerendert", () => {
  const onTransitionEnd = els.workspace.listeners.transitionend?.[0];
  assert.equal(typeof onTransitionEnd, "function", "a grid transition listener should resize the map");
  const initialInvalidations = mapMock.invalidations;
  onTransitionEnd({ propertyName: "opacity" });
  assert.equal(mapMock.invalidations, initialInvalidations, "unrelated transitions must not resize the map");
  els.listToggle.listeners.click[0]();
  const afterImmediateResize = mapMock.invalidations;
  onTransitionEnd({ propertyName: "grid-template-columns" });
  assert.equal(mapMock.invalidations, afterImmediateResize + 1, "the map should resize after the sidebar finishes moving");
  els.listToggle.listeners.click[0]();
});

test("Standortfenster bleibt nicht-modal und sperrt die Karte nicht", () => {
  assert.equal(els.sheet.attrs.get("aria-hidden"), "true");
  assert.equal(els.map.inert, false);
});

test("Anderer Marker ersetzt den Detailinhalt, ohne das Fenster zu schließen", () => {
  assert.equal(cluster.layers.length, 2);
  cluster.layers[0].click();
  assert.equal(els.sheet.classList.contains("open"), true);
  assert.match(els.sBody.innerHTML, /Standort Eins/);
  assert.equal(els.sheet.inert, false);
  cluster.layers[1].click();
  assert.equal(els.sheet.classList.contains("open"), true);
  assert.match(els.sBody.innerHTML, /Standort Zwei/);
  assert.doesNotMatch(els.sBody.innerHTML, /Standort Eins/);
  assert.equal(mapMock.panCalls, 2);
  assert.equal(cluster.layers[0].options.bubblingMouseEvents, false);
});

test("Tab-Taste wird nicht in einem modalen Fenster gefangen; Escape schließt", () => {
  const tab = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
  docListeners.keydown[0](tab);
  assert.equal(tab.defaultPrevented, false);
  assert.equal(els.sheet.classList.contains("open"), true);
  const escape = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  docListeners.keydown[0](escape);
  assert.equal(escape.defaultPrevented, true);
  assert.equal(els.sheet.classList.contains("open"), false);
});

test("Ein Listenklick öffnet Standortdetails auch wenn der Cluster-Zoom noch aussteht", () => {
  const zoomToShowLayer = cluster.zoomToShowLayer;
  cluster.zoomToShowLayer = () => {};
  const item = { dataset: { id: "one" } };
  els.list.listeners.click[0]({ target: { closest: () => item }, detail: 1 });
  cluster.zoomToShowLayer = zoomToShowLayer;
  assert.equal(els.sheet.classList.contains("open"), true);
  assert.equal(els.sheet.attrs.get("aria-hidden"), "false");
  assert.match(els.sBody.innerHTML, /Standort Eins/);
  els.sheet.classList.remove("open");
  els.sheet.inert = true;
  els.sheet.setAttribute("aria-hidden", "true");
});

test("Klick auf freie Karte schließt das Detail, Marker-Klicks propagieren nicht", () => {
  cluster.layers[0].click();
  assert.equal(els.sheet.classList.contains("open"), true);
  mapEvents.click();
  assert.equal(els.sheet.classList.contains("open"), false);
});

test("Designrad öffnet Auswahl und speichert zwischen normalem und Liquid-Glass-Design", () => {
  const onToggle = els.appearanceToggle.listeners.click?.[0];
  assert.equal(typeof onToggle, "function", "the settings wheel should open the design choices");
  onToggle();
  assert.equal(els.appearanceToggle.getAttribute("aria-expanded"), "true");
  assert.equal(els.appearanceMenu.classList.contains("hidden"), false);
  els.designGlass.listeners.click?.[0]?.();
  assert.equal(document.documentElement.dataset.design, "glass");
  assert.equal(els.designGlass.getAttribute("aria-pressed"), "true");
  assert.equal(els.designNormal.getAttribute("aria-pressed"), "false");
  assert.equal(localStorage.getItem("nehlsen-design"), "glass");
  assert.equal(els.appearanceMenu.classList.contains("hidden"), true);
  onToggle();
  assert.equal(els.appearanceToggle.getAttribute("aria-expanded"), "true");
  assert.equal(els.appearanceMenu.classList.contains("hidden"), false, "the wheel must reopen while Glass is selected");
  els.designNormal.listeners.click?.[0]?.();
  assert.equal(document.documentElement.dataset.design, "normal");
  assert.equal(localStorage.getItem("nehlsen-design"), "normal");
  assert.equal(els.appearanceMenu.classList.contains("hidden"), true);
});
