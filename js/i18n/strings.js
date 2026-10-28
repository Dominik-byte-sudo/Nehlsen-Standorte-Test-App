const uiStrings = {
    de: {
        settingsTitle: "Einstellungen",
        designStyle: "Designstil",
        clearStorage: "Lokalen Speicher leeren",
        clearStorageTitle: "Gespeicherte Einstellungen und Zwischenspeicher löschen und neu laden",
        back: "Zurück",
        colorMode: "Farbmodus",
        colorSystem: "System",
        colorLight: "Hell",
        colorDark: "Dunkel",
    },
    en: {
        settingsTitle: "Settings",
        designStyle: "Design style",
        clearStorage: "Clear Local Storage",
        clearStorageTitle: "Clear saved settings and cache, then reload",
        back: "Back",
        colorMode: "Color mode",
        colorSystem: "System",
        colorLight: "Light",
        colorDark: "Dark",
    },
};
function detectUiLanguage() {
    const systemLanguage = navigator.languages?.[0] ?? navigator.language ?? "";
    return systemLanguage.toLowerCase().startsWith("de") ? "de" : "en";
}
export const uiText = uiStrings[detectUiLanguage()];
export function applyStaticTranslations() {
    for (const element of document.querySelectorAll("[data-i18n], [data-i18n-title], [data-i18n-aria-label]")) {
        const { i18n, i18nTitle, i18nAriaLabel } = element.dataset;
        if (i18n)
            element.textContent = uiText[i18n];
        if (i18nTitle)
            element.title = uiText[i18nTitle];
        if (i18nAriaLabel)
            element.setAttribute("aria-label", uiText[i18nAriaLabel]);
    }
}
