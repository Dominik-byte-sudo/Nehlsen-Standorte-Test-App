import { byId } from "../core/dom.js";
import { currentLanguageSetting, onLanguageChange, setLanguageSetting, t, type LanguageSetting } from "../i18n/strings.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";

const languageMenuToggle = byId<HTMLButtonElement>("languageMenuToggle");
const languageBack = byId<HTMLButtonElement>("languageBack");
const languageValue = byId<HTMLElement>("languageValue");
const languageOptions: ReadonlyArray<{ element: HTMLButtonElement; setting: LanguageSetting; label: () => string }> = [
  { element: byId<HTMLButtonElement>("languageAuto"), setting: "auto", label: () => t("languageAuto") },
  { element: byId<HTMLButtonElement>("languageDe"), setting: "de", label: () => t("languageNameDe") },
  { element: byId<HTMLButtonElement>("languageEn"), setting: "en", label: () => t("languageNameEn") },
];

function refresh(): void {
  const current = currentLanguageSetting();
  languageValue.textContent = languageOptions.find((option) => option.setting === current)?.label() ?? "";
  for (const option of languageOptions) {
    option.element.setAttribute("aria-pressed", String(option.setting === current));
  }
}

function chooseLanguage(setting: LanguageSetting): void {
  setLanguageSetting(setting, true);
  closeAppearanceMenu();
  closeMobileMenu();
}

export function initLanguageSettings(): void {
  refresh();
  onLanguageChange(refresh);
  languageMenuToggle.addEventListener("click", () => showSettingsPanel("language"));
  languageBack.addEventListener("click", () => showSettingsPanel("main"));
  for (const option of languageOptions) {
    option.element.addEventListener("click", () => chooseLanguage(option.setting));
  }
}
