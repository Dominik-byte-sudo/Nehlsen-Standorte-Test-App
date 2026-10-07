import assert from "node:assert/strict";
import test from "node:test";
import { distanceKm, escapeHtml, filterLocations, validateLocations } from "../js/domain.js";

const sample = [
  { id: "near", company: "Nehlsen", name: "Bremen", address: "28237 Bremen", phone: "1", email: "a@x.de", hours: "Mo-Fr", lat: 53.1, lng: 8.7 },
  { id: "far", company: "Nehlsen Sachsen", name: "Dresden", address: "01189 Dresden", phone: "2", email: "b@x.de", hours: "Mo-Fr", lat: 51.0, lng: 13.7 },
];

test("distanceKm returns the great-circle distance in kilometers", () => {
  assert.ok(Math.abs(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111.195) < 0.1);
});

test("filterLocations searches company, name, and address case-insensitively", () => {
  assert.deepEqual(filterLocations(sample, " DRESDEN ").map((item) => item.id), ["far"]);
  assert.deepEqual(filterLocations(sample, "nehlsen").map((item) => item.id), ["near", "far"]);
  assert.deepEqual(filterLocations(sample, "").map((item) => item.id), ["near", "far"]);
});

test("filterLocations orders matches by distance when an origin is provided", () => {
  const result = filterLocations(sample, "", { lat: 53.1, lng: 8.7 });
  assert.deepEqual(result.map((item) => item.id), ["near", "far"]);
});

test("escapeHtml encodes markup and quotes before inserting location data", () => {
  assert.equal(escapeHtml(`<img src=x onerror='alert(1)'>&`), "&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;");
});

test("validateLocations rejects duplicate IDs and invalid coordinates", () => {
  assert.throws(() => validateLocations([{ ...sample[0] }, { ...sample[0] }]), /duplicate/i);
  assert.throws(() => validateLocations([{ ...sample[0], lat: 91 }]), /coordinate/i);
  assert.doesNotThrow(() => validateLocations(sample));
});
