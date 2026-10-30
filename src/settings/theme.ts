import { byId } from "../core/dom.js";
import { readSetting, saveSetting } from "../core/storage.js";
import { onLanguageChange, t } from "../i18n/strings.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";

type ColorTheme = "light" | "dark";
type ColorThemeSetting = ColorTheme | "system";

const THEME_STORAGE_KEY = "nehlsen-theme";
const THEME_SETTINGS: readonly ColorThemeSetting[] = ["light", "dark", "system"];
const THEME_COLOR = "#6ab023";

const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const colorModeLabel = (setting: ColorThemeSetting): string => t(setting === "system" ? "colorSystem" : setting === "light" ? "colorLight" : "colorDark");

const themeToggle = byId<HTMLButtonElement>("themeToggle");
const themeColor = byId<HTMLMetaElement>("themeColor");
const themeMenuToggle = byId<HTMLButtonElement>("themeMenuToggle");
const themeBack = byId<HTMLButtonElement>("themeBack");
const themeValue = byId<HTMLElement>("themeValue");
const themeSystem = byId<HTMLButtonElement>("themeSystem");
const themeLight = byId<HTMLButtonElement>("themeLight");
const themeDark = byId<HTMLButtonElement>("themeDark");

let themeSetting: ColorThemeSetting = "system";

function resolveTheme(setting: ColorThemeSetting): ColorTheme {
  if (setting === "system") return systemDarkQuery.matches ? "dark" : "light";
  return setting;
}

function applyTheme(theme: ColorTheme): void {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  const action = t(theme === "dark" ? "themeActivateLight" : "themeActivateDark");
  themeToggle.setAttribute("aria-label", action);
  themeToggle.title = action;
  const label = themeToggle.querySelector<HTMLElement>(".theme-label");
  if (label) label.textContent = t(theme === "dark" ? "colorLight" : "themeSwitchDark");
  themeColor.content = THEME_COLOR;
}

function setThemeSetting(setting: ColorThemeSetting, save = false): void {
  themeSetting = setting;
  applyTheme(resolveTheme(setting));
  themeValue.textContent = colorModeLabel(setting);
  themeSystem.setAttribute("aria-pressed", String(setting === "system"));
  themeLight.setAttribute("aria-pressed", String(setting === "light"));
  themeDark.setAttribute("aria-pressed", String(setting === "dark"));
  if (save) saveSetting(THEME_STORAGE_KEY, setting);
}

function chooseTheme(setting: ColorThemeSetting): void {
  setThemeSetting(setting, true);
  closeAppearanceMenu();
  closeMobileMenu();
}

export function initTheme(): void {
  setThemeSetting(readSetting(THEME_STORAGE_KEY, THEME_SETTINGS, "system"));
  onLanguageChange(() => setThemeSetting(themeSetting));
  systemDarkQuery.addEventListener("change", () => {
    if (themeSetting === "system") applyTheme(resolveTheme("system"));
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
