import { byId } from "../core/dom.js";
import { readSetting, saveSetting } from "../core/storage.js";
import { onLanguageChange, t } from "../i18n/strings.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";
const THEME_STORAGE_KEY = "nehlsen-theme";
const THEME_SETTINGS = ["light", "dark", "system"];
const THEME_COLOR = "#6ab023";
const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const colorModeLabel = (setting) => t(setting === "system" ? "colorSystem" : setting === "light" ? "colorLight" : "colorDark");
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
    const action = t(theme === "dark" ? "themeActivateLight" : "themeActivateDark");
    themeToggle.setAttribute("aria-label", action);
    themeToggle.title = action;
    const label = themeToggle.querySelector(".theme-label");
    if (label)
        label.textContent = t(theme === "dark" ? "colorLight" : "themeSwitchDark");
    themeColor.content = THEME_COLOR;
}
function setThemeSetting(setting, save = false) {
    themeSetting = setting;
    applyTheme(resolveTheme(setting));
    themeValue.textContent = colorModeLabel(setting);
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
    onLanguageChange(() => setThemeSetting(themeSetting));
    systemDarkQuery.addEventListener("change", () => {
        if (themeSetting === "system")
            applyTheme(resolveTheme("system"));
    });
    themeToggle.addEventListener("click", () => {
        setThemeSetting(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
        closeMobileMenu();
    });
    themeMenuToggle.addEventListener("click", () => showSettingsPanel("theme", true));
    themeBack.addEventListener("click", () => showSettingsPanel("main", true));
    themeSystem.addEventListener("click", () => chooseTheme("system"));
    themeLight.addEventListener("click", () => chooseTheme("light"));
    themeDark.addEventListener("click", () => chooseTheme("dark"));
}
