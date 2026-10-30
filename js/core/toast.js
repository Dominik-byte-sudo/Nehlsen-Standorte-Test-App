import { byId } from "./dom.js";
const toastElement = byId("toast");
let toastTimer;
export function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastElement.classList.add("hidden"), 3500);
}
