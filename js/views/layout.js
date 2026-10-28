import { byId } from "../core/dom.js";
import { map } from "../map/map-view.js";
const workspace = byId("workspace");
const viewControls = byId("viewControls");
const listToggle = byId("listToggle");
export function initLayout() {
    listToggle.addEventListener("click", () => {
        const expanded = listToggle.getAttribute("aria-expanded") !== "false";
        const nextExpanded = !expanded;
        workspace.classList.toggle("list-collapsed", !nextExpanded);
        viewControls.classList.toggle("list-collapsed", !nextExpanded);
        listToggle.setAttribute("aria-expanded", String(nextExpanded));
        const action = nextExpanded ? "Standortliste ausblenden" : "Standortliste einblenden";
        listToggle.setAttribute("aria-label", action);
        listToggle.title = action;
        window.requestAnimationFrame(() => map.invalidateSize());
    });
    workspace.addEventListener("transitionend", (event) => {
        if (event.propertyName !== "grid-template-columns")
            return;
        window.requestAnimationFrame(() => map.invalidateSize());
    });
}
