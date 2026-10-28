import { toast } from "../core/toast.js";
import { isClearingLocalData } from "../settings/clear-data.js";
export function initServiceWorker() {
    if (!("serviceWorker" in navigator))
        return;
    if (navigator.serviceWorker.controller) {
        let reloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (reloading || isClearingLocalData())
                return;
            reloading = true;
            window.location.reload();
        });
    }
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => toast("Offline-Speicherung konnte nicht aktiviert werden."));
    });
}
