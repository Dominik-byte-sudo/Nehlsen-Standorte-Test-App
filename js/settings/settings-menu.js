import { byId } from "../core/dom.js";
import { onLanguageChange, t } from "../i18n/strings.js";
const viewControls = byId("viewControls");
const workspace = byId("workspace");
const mobileMenuToggle = byId("mobileMenuToggle");
const appearanceToggle = byId("appearanceToggle");
const appearanceMenu = byId("appearanceMenu");
const settingsMain = byId("settingsMain");
const designMenu = byId("designMenu");
const designMenuToggle = byId("designMenuToggle");
const themeMenu = byId("themeMenu");
const themeMenuToggle = byId("themeMenuToggle");
const languageMenu = byId("languageMenu");
const languageMenuToggle = byId("languageMenuToggle");
export function showSettingsPanel(panel) {
    settingsMain.classList.toggle("hidden", panel !== "main");
    designMenu.classList.toggle("hidden", panel !== "design");
    themeMenu.classList.toggle("hidden", panel !== "theme");
    languageMenu.classList.toggle("hidden", panel !== "language");
    designMenuToggle.setAttribute("aria-expanded", String(panel === "design"));
    themeMenuToggle.setAttribute("aria-expanded", String(panel === "theme"));
    languageMenuToggle.setAttribute("aria-expanded", String(panel === "language"));
}
export function closeAppearanceMenu() {
    appearanceMenu.classList.add("hidden");
    appearanceToggle.setAttribute("aria-expanded", "false");
    showSettingsPanel("main");
}
function updateMobileMenuLabel() {
    const open = mobileMenuToggle.getAttribute("aria-expanded") === "true";
    const action = t(open ? "settingsClose" : "settingsOpen");
    mobileMenuToggle.setAttribute("aria-label", action);
    mobileMenuToggle.title = action;
}
function setMobileMenu(open) {
    if (!open)
        closeAppearanceMenu();
    viewControls.classList.toggle("menu-open", open);
    mobileMenuToggle.setAttribute("aria-expanded", String(open));
    updateMobileMenuLabel();
}
export function closeMobileMenu() {
    setMobileMenu(false);
}
export function closeOpenSettingsMenu() {
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
export function initSettingsMenu() {
    mobileMenuToggle.addEventListener("click", () => {
        setMobileMenu(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
    });
    onLanguageChange(updateMobileMenuLabel);
    appearanceToggle.addEventListener("click", () => {
        const open = appearanceToggle.getAttribute("aria-expanded") !== "true";
        if (open)
            showSettingsPanel("main");
        appearanceMenu.classList.toggle("hidden", !open);
        appearanceToggle.setAttribute("aria-expanded", String(open));
    });
    workspace.addEventListener("click", closeMobileMenu);
}
