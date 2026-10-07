# Nehlsen Standorte

Vanilla-HTML/CSS/TypeScript-PWA für die Standortkarte der Nehlsen-Gruppe. `standorte.json` ist die gemeinsame Datenquelle für App und Koordinaten-Werkzeug. Die TypeScript-Quellen liegen in `src/`; `js/` enthält das kompilierte, statisch auslieferbare JavaScript. Leaflet und MarkerCluster werden lokal unter `vendor/` abgelegt, damit die Oberfläche nicht von einem CDN abhängt.

## Entwicklung und Tests

```sh
npm ci
npm test
npm run serve
```

Die App ist dann unter http://127.0.0.1:4173/ erreichbar. Das Koordinaten-Werkzeug liegt unter `/koordinaten-werkzeug.html`. Ein Build ist in `npm test` enthalten; separat: `npm run build`.

Nach Änderungen an `src/` oder an den lokalen Kartenskripten `npm run build` ausführen und die aktualisierten Dateien aus `js/` bzw. `vendor/` mit committen. Bei Änderungen an Offline-Kernressourcen außerdem `VERSION` in `sw.js` erhöhen, damit installierte PWAs den neuen Cache erhalten.

## Offline-Betrieb und Karte

Die Oberfläche, Standortdaten und Bibliotheken werden beim Installieren des Service Workers vorgeladen. Kartenkacheln von OpenStreetMap werden nur beim normalen Benutzen der Karte nachgeladen und begrenzt lokal zwischengespeichert; die vollständige Karte steht offline daher nicht garantiert zur Verfügung. OSM-Kacheln benötigen weiterhin eine Netzwerkverbindung und müssen gemäß der OpenStreetMap-Kachelrichtlinie verwendet werden.

Koordinaten und Öffnungszeiten vor einem produktiven Einsatz fachlich prüfen. Die Anwendung enthält keine Anmeldung oder Zugriffskontrolle; eine interne Bezeichnung ersetzt keine geschützte Bereitstellung.
