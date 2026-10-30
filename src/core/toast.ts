import { byId } from "./dom.js";

const toastElement = byId<HTMLDivElement>("toast");
let toastTimer: number | undefined;

export function toast(message: string): void {
  toastElement.textContent = message;
  toastElement.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.add("hidden"), 3500);
}
