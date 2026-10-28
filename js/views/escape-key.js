import { closeSheet, isSheetOpen } from "../detail/sheet.js";
import { closeOpenSettingsMenu } from "../settings/settings-menu.js";
export function initEscapeKey() {
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape")
            return;
        if (closeOpenSettingsMenu())
            event.preventDefault();
        if (isSheetOpen()) {
            event.preventDefault();
            closeSheet();
        }
    });
}
