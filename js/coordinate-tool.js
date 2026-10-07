/// <reference types="leaflet" />
const byId = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing #${id}`);
    return element;
};
const listElement = byId("location-list");
const progressElement = byId("progress");
const runButton = byId("run-geocode");
const downloadButton = byId("download-data");
const map = L.map("tool-map").setView([52.9, 10.5], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
}).addTo(map);
let records = [];
const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
function drawItem(location) {
    const title = document.createElement("strong");
    title.textContent = `${location.company} · ${location.name}`;
    const address = document.createElement("span");
    address.textContent = location.address;
    const state = document.createElement("span");
    state.className = `status ${location.state}`;
    state.textContent = location.stateText;
    location.listItem.replaceChildren(title, address, state);
}
function setState(location, state, message) {
    location.state = state;
    location.stateText = message;
    drawItem(location);
}
async function loadRecords() {
    try {
        const response = await fetch("./standorte.json", { cache: "no-cache" });
        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        records = data.map((record) => {
            const listItem = document.createElement("button");
            listItem.type = "button";
            listItem.className = "location-item";
            listItem.addEventListener("click", () => {
                map.setView([record.lat, record.lng], 17);
                marker.openTooltip();
            });
            const marker = L.marker([record.lat, record.lng], { draggable: true, title: `${record.company} · ${record.name}` })
                .addTo(map)
                .bindTooltip(`${record.company} · ${record.name}`);
            const location = {
                ...record,
                state: "untested",
                stateText: "ungeprüft – gespeicherte Koordinate",
                listItem,
                marker,
            };
            marker.on("dragend", () => {
                const point = marker.getLatLng();
                location.lat = Number(point.lat.toFixed(6));
                location.lng = Number(point.lng.toFixed(6));
                setState(location, "manual", "manuell gesetzt");
            });
            listElement.append(listItem);
            drawItem(location);
            return location;
        });
        progressElement.textContent = `${records.length} Standorte geladen.`;
        runButton.disabled = false;
        downloadButton.disabled = false;
    }
    catch (error) {
        progressElement.textContent = `Standortdaten konnten nicht geladen werden: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`;
    }
}
runButton.addEventListener("click", async () => {
    runButton.disabled = true;
    downloadButton.disabled = true;
    for (let index = 0; index < records.length; index += 1) {
        const location = records[index];
        progressElement.textContent = `Suche ${index + 1} / ${records.length} …`;
        try {
            const url = new URL("https://nominatim.openstreetmap.org/search");
            url.search = new URLSearchParams({
                format: "jsonv2",
                limit: "1",
                countrycodes: "de",
                addressdetails: "1",
                q: location.address,
            }).toString();
            const response = await fetch(url);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const results = await response.json();
            if (!results.length) {
                setState(location, "missing", "nicht gefunden – Pin manuell prüfen");
            }
            else {
                const result = results[0];
                location.lat = Number(Number(result.lat).toFixed(6));
                location.lng = Number(Number(result.lon).toFixed(6));
                location.marker.setLatLng([location.lat, location.lng]);
                const exact = Boolean(result.address?.house_number);
                setState(location, exact ? "found" : "approximate", exact ? "gefunden (Hausnummer)" : "nur Straße/Ort – bitte prüfen");
            }
        }
        catch (error) {
            setState(location, "error", `Fehler bei Abfrage${error instanceof Error ? `: ${error.message}` : ""}`);
        }
        await sleep(1100);
    }
    progressElement.textContent = "Fertig. Orange/rote Einträge und verschobene Pins prüfen.";
    runButton.disabled = false;
    downloadButton.disabled = false;
});
downloadButton.addEventListener("click", () => {
    const exported = records.map(({ listItem: _listItem, marker: _marker, state: _state, stateText: _stateText, ...location }) => location);
    const blob = new Blob([`${JSON.stringify(exported, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "standorte.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
void loadRecords();
export {};
