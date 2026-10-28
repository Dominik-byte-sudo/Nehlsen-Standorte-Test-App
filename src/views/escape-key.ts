import { closeSheet, isSheetOpen } from "../detail/sheet.js";
import { closeOpenScopeMenu } from "../list/scope-filter.js";
import { closeOpenSettingsMenu } from "../settings/settings-menu.js";

export function initEscapeKey(): void {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (closeOpenScopeMenu()) {
      event.preventDefault();
      return;
    }
    if (closeOpenSettingsMenu()) event.preventDefault();
    if (isSheetOpen()) {
      event.preventDefault();
      closeSheet();
    }
  });
}
