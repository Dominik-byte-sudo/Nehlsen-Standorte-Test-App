import { byId } from "../core/dom.js";
import { isDesktop } from "../core/viewport.js";
import { map, mapElement } from "./map-view.js";
const sheet = byId("sheet");
// Sorgt dafür, dass der gewählte Pin nicht vom Detailfenster verdeckt wird.
export function keepMarkerVisible(location) {
    window.requestAnimationFrame(() => {
        const sheetRect = sheet.getBoundingClientRect();
        const mapRect = mapElement.getBoundingClientRect();
        const padding = 24;
        if (isDesktop()) {
            const coveredRight = Math.max(0, mapRect.right - sheetRect.left);
            map.panInside([location.lat, location.lng], {
                paddingTopLeft: [padding, padding],
                paddingBottomRight: [coveredRight + padding, padding],
            });
        }
        else {
            const coveredBottom = Math.max(0, mapRect.bottom - sheetRect.top);
            map.panInside([location.lat, location.lng], {
                paddingTopLeft: [padding, padding + 30],
                paddingBottomRight: [padding, coveredBottom + padding],
            });
        }
    });
}
