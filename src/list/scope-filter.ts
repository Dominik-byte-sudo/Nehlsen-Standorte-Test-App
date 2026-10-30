import { byId } from "../core/dom.js";
import { appState } from "../data/app-state.js";
import { onLanguageChange, t, type MessageKey } from "../i18n/strings.js";
import { renderLocations } from "./location-list.js";

interface ScopeOption {
  element: HTMLLIElement;
  favoritesOnly: boolean;
  valueKey: MessageKey;
}

const container = byId<HTMLDivElement>("scopeFilter");
const toggle = byId<HTMLButtonElement>("scopeToggle");
const valueElement = byId<HTMLSpanElement>("scopeValue");
const menu = byId<HTMLUListElement>("scopeMenu");

const options: ScopeOption[] = [
  { element: byId<HTMLLIElement>("scopeAll"), favoritesOnly: false, valueKey: "scopeAllShort" },
  { element: byId<HTMLLIElement>("scopeFavorites"), favoritesOnly: true, valueKey: "scopeFavorites" },
];

const isOpen = (): boolean => !menu.classList.contains("hidden");

function setOpen(open: boolean): void {
  menu.classList.toggle("hidden", !open);
  toggle.setAttribute("aria-expanded", String(open));
}

function closeMenu(returnFocus: boolean): void {
  setOpen(false);
  if (returnFocus) toggle.focus({ preventScroll: true });
}

function selectedOption(): ScopeOption {
  return options.find((option) => option.favoritesOnly === appState.favoritesOnly) ?? options[0];
}

function focusOption(index: number): void {
  const count = options.length;
  options[(index + count) % count].element.focus({ preventScroll: true });
}

function updateTrigger(): void {
  const option = selectedOption();
  const label = t(option.valueKey);
  valueElement.textContent = label;
  toggle.dataset.active = String(option.favoritesOnly);
  toggle.setAttribute("aria-label", t("scopeFilterValue", { value: label }));
}

function applyFilter(option: ScopeOption): void {
  appState.favoritesOnly = option.favoritesOnly;
  updateTrigger();
  for (const candidate of options) {
    candidate.element.setAttribute("aria-selected", String(candidate === option));
  }
  renderLocations();
}

export function closeOpenScopeMenu(): boolean {
  if (!isOpen()) return false;
  closeMenu(true);
  return true;
}

export function initScopeFilter(): void {
  updateTrigger();
  onLanguageChange(updateTrigger);

  toggle.addEventListener("click", (event) => {
    if (isOpen()) {
      closeMenu(false);
      return;
    }
    setOpen(true);
    // Ein Klick ohne Mauszeiger (detail 0) stammt von der Tastatur: Fokus in die Auswahl setzen.
    if (event.detail === 0) selectedOption().element.focus({ preventScroll: true });
  });

  toggle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setOpen(true);
    selectedOption().element.focus({ preventScroll: true });
  });

  for (const option of options) {
    option.element.addEventListener("click", () => {
      applyFilter(option);
      closeMenu(true);
    });
  }

  menu.addEventListener("keydown", (event) => {
    const index = options.findIndex((option) => option.element === document.activeElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusOption(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusOption(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusOption(0);
        break;
      case "End":
        event.preventDefault();
        focusOption(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (index >= 0) options[index].element.click();
        break;
      case "Tab":
        closeMenu(false);
        break;
    }
  });

  container.addEventListener("focusout", (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !container.contains(next)) closeMenu(false);
  });

  document.addEventListener("click", (event) => {
    if (isOpen() && !container.contains(event.target as Node)) closeMenu(false);
  });
}
