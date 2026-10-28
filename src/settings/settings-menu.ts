import { byId } from "../core/dom.js";
import { onLanguageChange, t } from "../i18n/strings.js";

export type SettingsPanel = "main" | "design" | "theme" | "language";

const viewControls = byId<HTMLElement>("viewControls");
const workspace = byId<HTMLElement>("workspace");
const mobileMenuToggle = byId<HTMLButtonElement>("mobileMenuToggle");
const appearanceToggle = byId<HTMLButtonElement>("appearanceToggle");
const appearanceMenu = byId<HTMLDivElement>("appearanceMenu");
const settingsMain = byId<HTMLDivElement>("settingsMain");
const designMenu = byId<HTMLDivElement>("designMenu");
const designMenuToggle = byId<HTMLButtonElement>("designMenuToggle");
const themeMenu = byId<HTMLDivElement>("themeMenu");
const themeMenuToggle = byId<HTMLButtonElement>("themeMenuToggle");
const languageMenu = byId<HTMLDivElement>("languageMenu");
const languageMenuToggle = byId<HTMLButtonElement>("languageMenuToggle");

export function showSettingsPanel(panel: SettingsPanel): void {
  settingsMain.classList.toggle("hidden", panel !== "main");
  designMenu.classList.toggle("hidden", panel !== "design");
  themeMenu.classList.toggle("hidden", panel !== "theme");
  languageMenu.classList.toggle("hidden", panel !== "language");
  designMenuToggle.setAttribute("aria-expanded", String(panel === "design"));
  themeMenuToggle.setAttribute("aria-expanded", String(panel === "theme"));
  languageMenuToggle.setAttribute("aria-expanded", String(panel === "language"));
}

export function closeAppearanceMenu(): void {
  appearanceMenu.classList.add("hidden");
  appearanceToggle.setAttribute("aria-expanded", "false");
  showSettingsPanel("main");
}

function updateMobileMenuLabel(): void {
  const open = mobileMenuToggle.getAttribute("aria-expanded") === "true";
  const action = t(open ? "settingsClose" : "settingsOpen");
  mobileMenuToggle.setAttribute("aria-label", action);
  mobileMenuToggle.title = action;
}

function setMobileMenu(open: boolean): void {
  if (!open) closeAppearanceMenu();
  viewControls.classList.toggle("menu-open", open);
  mobileMenuToggle.setAttribute("aria-expanded", String(open));
  updateMobileMenuLabel();
}

export function closeMobileMenu(): void {
  setMobileMenu(false);
}

export function closeOpenSettingsMenu(): boolean {
  if (!appearanceMenu.classList.contains("hidden")) {
    closeAppearanceMenu();
    appearanceToggle.focus({ preventScroll: true });
    return true;
  }
  if (viewControls.classList.contains("menu-open")) {
    closeMobileMenu();
    mobileMenuToggle.focus({ preventScroll: true });
    return true;
  }
  return false;
}

export function initSettingsMenu(): void {
  mobileMenuToggle.addEventListener("click", () => {
    setMobileMenu(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
  });
  onLanguageChange(updateMobileMenuLabel);
  appearanceToggle.addEventListener("click", () => {
    const open = appearanceToggle.getAttribute("aria-expanded") !== "true";
    if (open) showSettingsPanel("main");
    appearanceMenu.classList.toggle("hidden", !open);
    appearanceToggle.setAttribute("aria-expanded", String(open));
  });
  workspace.addEventListener("click", closeMobileMenu);
}
