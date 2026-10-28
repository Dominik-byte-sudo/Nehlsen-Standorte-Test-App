import { byId } from "../core/dom.js";
import { currentLanguageSetting, onLanguageChange, setLanguageSetting, t } from "../i18n/strings.js";
import { closeAppearanceMenu, closeMobileMenu, showSettingsPanel } from "./settings-menu.js";
const languageMenuToggle = byId("languageMenuToggle");
const languageBack = byId("languageBack");
const languageValue = byId("languageValue");
const languageOptions = [
    { element: byId("languageAuto"), setting: "auto", label: () => t("languageAuto") },
    { element: byId("languageDe"), setting: "de", label: () => t("languageNameDe") },
    { element: byId("languageEn"), setting: "en", label: () => t("languageNameEn") },
];
function refresh() {
    const current = currentLanguageSetting();
    languageValue.textContent = languageOptions.find((option) => option.setting === current)?.label() ?? "";
    for (const option of languageOptions) {
        option.element.setAttribute("aria-pressed", String(option.setting === current));
    }
}
function chooseLanguage(setting) {
    setLanguageSetting(setting, true);
    closeAppearanceMenu();
    closeMobileMenu();
}
export function initLanguageSettings() {
    refresh();
    onLanguageChange(refresh);
    languageMenuToggle.addEventListener("click", () => showSettingsPanel("language"));
    languageBack.addEventListener("click", () => showSettingsPanel("main"));
    for (const option of languageOptions) {
        option.element.addEventListener("click", () => chooseLanguage(option.setting));
    }
}
