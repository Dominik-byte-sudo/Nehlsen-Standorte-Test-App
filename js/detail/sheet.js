import { byId } from "../core/dom.js";
import { toast } from "../core/toast.js";
import { isDesktop } from "../core/viewport.js";
import { appState } from "../data/app-state.js";
import { keepMarkerVisible } from "../map/keep-marker-visible.js";
import { map } from "../map/map-view.js";
import { renderSheetContent } from "./sheet-template.js";
const sheet = byId("sheet");
const closeButton = byId("sClose");
const detailBody = byId("sBody");
const queryInput = byId("q");
const mapTab = byId("tMap");
let lastFocusedElement = null;
export const isSheetOpen = () => sheet.classList.contains("open");
async function copyAddress(address) {
    try {
        await navigator.clipboard.writeText(address);
        toast("Adresse kopiert.");
    }
    catch {
        toast("Adresse konnte nicht kopiert werden.");
    }
}
// Nicht-modales Detailfenster: Karte, Suche und andere Pins bleiben bedienbar.
// Ein Klick auf einen anderen Pin tauscht nur den Inhalt aus.
export function openSheet(location, options = {}) {
    detailBody.innerHTML = renderSheetContent(location, appState.origin);
    detailBody.querySelector(".copy-address")?.addEventListener("click", () => {
        void copyAddress(location.address);
    });
    if (!location.phone) {
        detailBody.querySelector('a[href^="tel:"]')?.closest(".row")?.remove();
    }
    if (!location.hours) {
        detailBody.querySelector(".hours")?.closest(".row")?.remove();
    }
    sheet.scrollTop = 0;
    const wasOpen = sheet.classList.contains("open");
    if (!wasOpen) {
        const active = document.activeElement;
        lastFocusedElement = active instanceof HTMLElement && !sheet.contains(active) ? active : null;
        sheet.inert = false;
        sheet.setAttribute("aria-hidden", "false");
        sheet.classList.add("open");
    }
    if (options.moveFocus)
        closeButton.focus({ preventScroll: true });
    if (options.panToMarker)
        keepMarkerVisible(location);
}
export function closeSheet() {
    if (!isSheetOpen())
        return;
    const focusWasInside = sheet.contains(document.activeElement);
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    sheet.inert = true;
    // Fokus nur zurückgeben, wenn er im Fenster lag – sonst nicht "wegreißen".
    if (focusWasInside) {
        const fallback = isDesktop() ? queryInput : mapTab;
        const focusTarget = lastFocusedElement?.isConnected && !lastFocusedElement.closest(".hidden")
            ? lastFocusedElement
            : fallback;
        focusTarget.focus({ preventScroll: true });
    }
    lastFocusedElement = null;
}
export function initSheet() {
    closeButton.addEventListener("click", closeSheet);
    // Klick auf eine freie Stelle der Karte schließt das Fenster; Ziehen/Zoomen nicht.
    map.on("click", closeSheet);
}
