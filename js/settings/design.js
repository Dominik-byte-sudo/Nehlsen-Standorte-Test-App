import { byId } from "../core/dom.js";
import { readSetting, saveSetting } from "../core/storage.js";
import { map } from "../map/map-view.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";
const DESIGN_STORAGE_KEY = "nehlsen-design";
const DESIGN_STYLES = ["normal", "glass"];
const designNormal = byId("designNormal");
const designGlass = byId("designGlass");
const designValue = byId("designValue");
const designMenuToggle = byId("designMenuToggle");
const designBack = byId("designBack");
function applyDesign(design, save = false) {
    document.documentElement.dataset.design = design;
    designNormal.setAttribute("aria-pressed", String(design === "normal"));
    designGlass.setAttribute("aria-pressed", String(design === "glass"));
    designValue.textContent = design === "glass" ? "Liquid Glass" : "Normal";
    window.requestAnimationFrame(() => map.invalidateSize());
    if (save)
        saveSetting(DESIGN_STORAGE_KEY, design);
}
function chooseDesign(design) {
    applyDesign(design, true);
    closeAppearanceMenu();
    closeMobileMenu();
}
export function initDesign() {
    applyDesign(readSetting(DESIGN_STORAGE_KEY, DESIGN_STYLES, "normal"));
    designMenuToggle.addEventListener("click", () => showSettingsPanel("design"));
    designBack.addEventListener("click", () => showSettingsPanel("main"));
    designNormal.addEventListener("click", () => chooseDesign("normal"));
    designGlass.addEventListener("click", () => chooseDesign("glass"));
}
