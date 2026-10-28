import { byId } from "../core/dom.js";
import { readSetting, saveSetting } from "../core/storage.js";
import { onLanguageChange, t } from "../i18n/strings.js";
import { map } from "../map/map-view.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";

type DesignStyle = "normal" | "glass";

const DESIGN_STORAGE_KEY = "nehlsen-design";
const DESIGN_STYLES: readonly DesignStyle[] = ["normal", "glass"];

const designNormal = byId<HTMLButtonElement>("designNormal");
const designGlass = byId<HTMLButtonElement>("designGlass");
const designValue = byId<HTMLElement>("designValue");
const designMenuToggle = byId<HTMLButtonElement>("designMenuToggle");
const designBack = byId<HTMLButtonElement>("designBack");

let currentDesign: DesignStyle = "normal";

function applyDesign(design: DesignStyle, save = false): void {
  currentDesign = design;
  document.documentElement.dataset.design = design;
  designNormal.setAttribute("aria-pressed", String(design === "normal"));
  designGlass.setAttribute("aria-pressed", String(design === "glass"));
  designValue.textContent = t(design === "glass" ? "designGlass" : "designNormal");
  window.requestAnimationFrame(() => map.invalidateSize());
  if (save) saveSetting(DESIGN_STORAGE_KEY, design);
}

function chooseDesign(design: DesignStyle): void {
  applyDesign(design, true);
  closeAppearanceMenu();
  closeMobileMenu();
}

export function initDesign(): void {
  applyDesign(readSetting(DESIGN_STORAGE_KEY, DESIGN_STYLES, "normal"));
  onLanguageChange(() => applyDesign(currentDesign));
  designMenuToggle.addEventListener("click", () => showSettingsPanel("design"));
  designBack.addEventListener("click", () => showSettingsPanel("main"));
  designNormal.addEventListener("click", () => chooseDesign("normal"));
  designGlass.addEventListener("click", () => chooseDesign("glass"));
}
