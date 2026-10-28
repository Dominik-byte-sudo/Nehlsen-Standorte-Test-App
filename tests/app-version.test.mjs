import assert from "node:assert/strict";
import test from "node:test";

const store = new Map();
let reloads = 0;
let online = true;
const navigatorMock = { languages: ["en-US"], language: "en-US" };
Object.defineProperty(globalThis, "navigator", { value: navigatorMock, configurable: true });
Object.defineProperty(navigatorMock, "onLine", { get: () => online, configurable: true });
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};
globalThis.window = {
  location: { reload: () => { reloads += 1; } },
  setTimeout,
  clearTimeout,
};

const { APP_VERSION, refreshFilesAfterUpdate } = await import("../js/pwa/app-version.js");
const KEY = "nehlsen-app-version";

function reset(stored) {
  store.clear();
  reloads = 0;
  online = true;
  if (stored !== undefined) store.set(KEY, stored);
}

test("Ohne gespeicherte Version wird nur die aktuelle vermerkt, ohne Neuladen", async () => {
  reset();
  await refreshFilesAfterUpdate();
  assert.equal(store.get(KEY), APP_VERSION);
  assert.equal(reloads, 0);
});

test("Ist die gespeicherte Version älter, werden die Dateien einmal neu geladen", async () => {
  reset("v40");
  await refreshFilesAfterUpdate();
  assert.equal(reloads, 1);
  assert.equal(store.get(KEY), APP_VERSION);
  await refreshFilesAfterUpdate();
  assert.equal(reloads, 1, "the refresh must not repeat once the version is stored");
});

test("Gleiche oder neuere gespeicherte Version löst kein Neuladen aus", async () => {
  reset(APP_VERSION);
  await refreshFilesAfterUpdate();
  assert.equal(reloads, 0);
  reset("v999");
  await refreshFilesAfterUpdate();
  assert.equal(reloads, 0);
  assert.equal(store.get(KEY), "v999");
});

test("Offline bleibt die alte Version gespeichert, damit der nächste Start es erneut versucht", async () => {
  reset("v40");
  online = false;
  await refreshFilesAfterUpdate();
  assert.equal(reloads, 0);
  assert.equal(store.get(KEY), "v40");
});
