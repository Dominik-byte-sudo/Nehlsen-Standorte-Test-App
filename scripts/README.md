# Skripte

Hilfsskripte für Entwicklung, Build und Tests. Die wichtigsten Befehle stehen in der [Haupt-README](../README.md).

| Datei | Zweck | Aufruf |
| --- | --- | --- |
| `serve.mjs` | Statischer Webserver für die App | `npm run serve` |
| `copy-vendor.mjs` | Kopiert Leaflet und MarkerCluster aus `node_modules` nach `vendor/` | läuft automatisch bei `npm run build` |
| `browser-smoke.mjs` | Browser-Test der echten Oberfläche | `node scripts/browser-smoke.mjs` (siehe unten) |

## serve.mjs

Startet einen lokalen Server auf `127.0.0.1`. Standardport ist `4173`; mit der Umgebungsvariable `PORT` lässt sich ein anderer Port wählen.

```powershell
$env:PORT = "8080"; npm run serve
```

## copy-vendor.mjs

Kopiert die Leaflet- und MarkerCluster-Dateien aus `node_modules` nach `vendor/`, damit die App ohne CDN auskommt. Der Ordner `vendor/` wird dabei überschrieben. Dateien dort also nicht von Hand ändern, sondern die Version in `package.json` anpassen und `npm ci` ausführen.

## browser-smoke.mjs

Automatisierter Test der echten Oberfläche im Browser, der nicht Teil von `npm test` ist. Er steuert einen laufenden Browser über das Chrome DevTools Protocol und prüft unter anderem:

- Layout auf Desktop, Smartphone (Hoch- und Querformat) und in mehreren Breiten
- Detailfenster, Schließen per Escape und Fokusrückgabe
- Einstellungsrad, Designwechsel auf Liquid Glass und zurück
- Suche (Beispiel: „Dresden“ liefert genau einen Treffer)
- Offline-Neuladen mit allen Standortdaten
- Keine unbehandelten Fehler in der Browser-Konsole

**Voraussetzungen:**

1. Die App läuft (z. B. `npm run serve`).
2. Edge oder Chrome ist mit einem Debugging-Port gestartet, z. B. `msedge.exe --remote-debugging-port=9223`.
3. Die Adresse der App ist über `APP_URL` angegeben. Ohne Angabe wird `http://127.0.0.1:4175/` erwartet, nicht der Port des Servers (4173).

**Aufruf (PowerShell):**

```powershell
$env:APP_URL = "http://127.0.0.1:4173/"; node scripts/browser-smoke.mjs
```

Bei Erfolg gibt das Skript eine JSON-Zusammenfassung der Prüfungen aus (Desktop, Smartphone, Querformat, Breiten, Offline-Neuladen) und endet mit Exit-Code 0. Bei einem Fehler wird die fehlgeschlagene Prüfung mit den beobachteten Werten ausgegeben.

> **Hinweis:** Das Skript schreibt Screenshots in feste Pfade auf dem Entwicklungsrechner (`C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/…`). Auf anderen Rechnern schlägt das Schreiben fehl. Vor dem Einsatz dort die Pfade anpassen oder die `fs.writeFile`-Aufrufe entfernen. Außerdem ist das Skript nicht in `package.json` eingetragen.
