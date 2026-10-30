import { byId } from "../core/dom.js";
import { isDesktop } from "../core/viewport.js";
import { closeSheet } from "../detail/sheet.js";
import { map } from "../map/map-view.js";
import { closeMobileMenu } from "../settings/settings-menu.js";

const mapElement = byId<HTMLDivElement>("map");
const listElement = byId<HTMLDivElement>("list");
const mapTab = byId<HTMLButtonElement>("tMap");
const listTab = byId<HTMLButtonElement>("tList");
const tabs = document.querySelector<HTMLElement>(".tabs");

export function showTab(tab: "map" | "list"): void {
  const showMap = tab === "map";
  closeMobileMenu();
  mapTab.setAttribute("aria-selected", String(showMap));
  listTab.setAttribute("aria-selected", String(!showMap));
  mapTab.tabIndex = showMap ? 0 : -1;
  listTab.tabIndex = showMap ? -1 : 0;
  if (!isDesktop()) {
    mapElement.classList.toggle("hidden", !showMap);
    listElement.classList.toggle("hidden", showMap);
  } else {
    mapElement.classList.remove("hidden");
    listElement.classList.remove("hidden");
  }
  if (showMap) {
    window.requestAnimationFrame(() => map.invalidateSize());
  } else if (!isDesktop()) {
    closeSheet();
  }
}

export function initTabs(): void {
  mapTab.addEventListener("click", () => showTab("map"));
  listTab.addEventListener("click", () => showTab("list"));
  tabs?.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const order = [mapTab, listTab];
    const currentIndex = order.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex < 0) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % order.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex + order.length - 1) % order.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = order.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    order[nextIndex].focus();
    showTab(nextIndex === 0 ? "map" : "list");
  });
  window.addEventListener("resize", () => showTab(mapTab.getAttribute("aria-selected") === "true" ? "map" : "list"));
}
