import { byId } from "../core/dom.js";
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
export function showSettingsPanel(panel) {
    settingsMain.classList.toggle("hidden", panel !== "main");
    designMenu.classList.toggle("hidden", panel !== "design");
    themeMenu.classList.toggle("hidden", panel !== "theme");
    designMenuToggle.setAttribute("aria-expanded", String(panel === "design"));
    themeMenuToggle.setAttribute("aria-expanded", String(panel === "theme"));
}
export function closeAppearanceMenu() {
    appearanceMenu.classList.add("hidden");
    appearanceToggle.setAttribute("aria-expanded", "false");
    showSettingsPanel("main");
}
function setMobileMenu(open) {
    if (!open)
        closeAppearanceMenu();
    viewControls.classList.toggle("menu-open", open);
    mobileMenuToggle.setAttribute("aria-expanded", String(open));
    const action = open ? "Einstellungen schließen" : "Einstellungen öffnen";
    mobileMenuToggle.setAttribute("aria-label", action);
    mobileMenuToggle.title = action;
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
    appearanceToggle.addEventListener("click", () => {
        const open = appearanceToggle.getAttribute("aria-expanded") !== "true";
        if (open)
            showSettingsPanel("main");
        appearanceMenu.classList.toggle("hidden", !open);
        appearanceToggle.setAttribute("aria-expanded", String(open));
    });
    workspace.addEventListener("click", closeMobileMenu);
}
