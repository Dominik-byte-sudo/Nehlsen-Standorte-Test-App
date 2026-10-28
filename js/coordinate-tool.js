/// <reference types="leaflet" />
import { initLanguage, onLanguageChange, t } from "./i18n/strings.js";
initLanguage();
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
const map = L.map("tool-map", { zoomControl: false }).setView([52.9, 10.5], 6);
L.control.zoom({ zoomInTitle: t("mapZoomIn"), zoomOutTitle: t("mapZoomOut") }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    referrerPolicy: "strict-origin-when-cross-origin",
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
    state.textContent = t(location.stateMessage.key, location.stateMessage.params);
    location.listItem.replaceChildren(title, address, state);
}
function setState(location, state, message) {
    location.state = state;
    location.stateMessage = message;
    drawItem(location);
}
let progressMessage = { key: "toolProgressLoading" };
function setProgress(message) {
    progressMessage = message;
    progressElement.textContent = t(message.key, message.params);
}
onLanguageChange(() => {
    document.querySelector(".leaflet-control-zoom-in")?.setAttribute("title", t("mapZoomIn"));
    document.querySelector(".leaflet-control-zoom-out")?.setAttribute("title", t("mapZoomOut"));
    for (const location of records)
        drawItem(location);
    setProgress(progressMessage);
});
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
                stateMessage: { key: "toolStateUntested" },
                listItem,
                marker,
            };
            marker.on("dragend", () => {
                const point = marker.getLatLng();
                location.lat = Number(point.lat.toFixed(6));
                location.lng = Number(point.lng.toFixed(6));
                setState(location, "manual", { key: "toolStateManual" });
            });
            listElement.append(listItem);
            drawItem(location);
            return location;
        });
        setProgress({ key: "toolLoaded", params: { count: records.length } });
        runButton.disabled = false;
        downloadButton.disabled = false;
    }
    catch (error) {
        setProgress({ key: "toolLoadError", params: { message: error instanceof Error ? error.message : t("toolUnknownError") } });
    }
}
runButton.addEventListener("click", async () => {
    runButton.disabled = true;
    downloadButton.disabled = true;
    for (let index = 0; index < records.length; index += 1) {
        const location = records[index];
        setProgress({ key: "toolSearching", params: { index: index + 1, total: records.length } });
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
                setState(location, "missing", { key: "toolStateMissing" });
            }
            else {
                const result = results[0];
                location.lat = Number(Number(result.lat).toFixed(6));
                location.lng = Number(Number(result.lon).toFixed(6));
                location.marker.setLatLng([location.lat, location.lng]);
                const exact = Boolean(result.address?.house_number);
                setState(location, exact ? "found" : "approximate", { key: exact ? "toolStateFound" : "toolStateApprox" });
            }
        }
        catch (error) {
            setState(location, "error", error instanceof Error ? { key: "toolStateErrorDetail", params: { message: error.message } } : { key: "toolStateError" });
        }
        await sleep(1100);
    }
    setProgress({ key: "toolDone" });
    runButton.disabled = false;
    downloadButton.disabled = false;
});
downloadButton.addEventListener("click", () => {
    const exported = records.map(({ listItem: _listItem, marker: _marker, state: _state, stateMessage: _stateMessage, ...location }) => location);
    const blob = new Blob([`${JSON.stringify(exported, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "standorte.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
void loadRecords();
