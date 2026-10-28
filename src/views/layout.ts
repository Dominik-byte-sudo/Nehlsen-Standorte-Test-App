import { byId } from "../core/dom.js";
import { map } from "../map/map-view.js";

const workspace = byId<HTMLElement>("workspace");
const viewControls = byId<HTMLElement>("viewControls");
const listToggle = byId<HTMLButtonElement>("listToggle");

export function initLayout(): void {
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
  workspace.addEventListener("transitionend", (event: TransitionEvent) => {
    if (event.propertyName !== "grid-template-columns") return;
    window.requestAnimationFrame(() => map.invalidateSize());
  });
}
