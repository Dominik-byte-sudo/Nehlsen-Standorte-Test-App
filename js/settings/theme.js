import { byId } from "../core/dom.js";
import { readSetting, saveSetting } from "../core/storage.js";
import { uiText } from "../i18n/strings.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";
const THEME_STORAGE_KEY = "nehlsen-theme";
const THEME_SETTINGS = ["light", "dark", "system"];
const THEME_COLOR = "#6ab023";
const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const colorModeLabel = {
    system: uiText.colorSystem,
    light: uiText.colorLight,
    dark: uiText.colorDark,
};
const themeToggle = byId("themeToggle");
const themeColor = byId("themeColor");
const themeMenuToggle = byId("themeMenuToggle");
const themeBack = byId("themeBack");
const themeValue = byId("themeValue");
const themeSystem = byId("themeSystem");
const themeLight = byId("themeLight");
const themeDark = byId("themeDark");
let themeSetting = "system";
function resolveTheme(setting) {
    if (setting === "system")
        return systemDarkQuery.matches ? "dark" : "light";
    return setting;
}
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    const action = theme === "dark" ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren";
    themeToggle.setAttribute("aria-label", action);
    themeToggle.title = action;
    const label = themeToggle.querySelector(".theme-label");
    if (label)
        label.textContent = theme === "dark" ? "Hell" : "Dunkel";
    themeColor.content = THEME_COLOR;
}
function setThemeSetting(setting, save = false) {
    themeSetting = setting;
    applyTheme(resolveTheme(setting));
    themeValue.textContent = colorModeLabel[setting];
    themeSystem.setAttribute("aria-pressed", String(setting === "system"));
    themeLight.setAttribute("aria-pressed", String(setting === "light"));
    themeDark.setAttribute("aria-pressed", String(setting === "dark"));
    if (save)
        saveSetting(THEME_STORAGE_KEY, setting);
}
function chooseTheme(setting) {
    setThemeSetting(setting, true);
    closeAppearanceMenu();
    closeMobileMenu();
}
export function initTheme() {
    setThemeSetting(readSetting(THEME_STORAGE_KEY, THEME_SETTINGS, "system"));
    systemDarkQuery.addEventListener("change", () => {
        if (themeSetting === "system")
            applyTheme(resolveTheme("system"));
    });
    themeToggle.addEventListener("click", () => {
        setThemeSetting(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
        closeMobileMenu();
    });
    themeMenuToggle.addEventListener("click", () => showSettingsPanel("theme"));
    themeBack.addEventListener("click", () => showSettingsPanel("main"));
    themeSystem.addEventListener("click", () => chooseTheme("system"));
    themeLight.addEventListener("click", () => chooseTheme("light"));
    themeDark.addEventListener("click", () => chooseTheme("dark"));
}
