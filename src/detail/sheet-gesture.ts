import { byId } from "../core/dom.js";
import { closeSheet } from "./sheet.js";

const sheet = byId<HTMLElement>("sheet");

let dragStartY: number | null = null;
let dragStartTime = 0;
let didMoveGrab = false;
let suppressPointerClickUntil = 0;

function resetSheetDrag(): void {
  dragStartY = null;
  sheet.classList.remove("is-dragging");
  sheet.style.removeProperty("--sheet-drag-offset");
}

export function initSheetGesture(): void {
  const sheetGrab = sheet.querySelector<HTMLButtonElement>(".grab");
  if (!sheetGrab) throw new Error("Missing required element .grab");

  sheetGrab.addEventListener("pointerdown", (event: PointerEvent) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    dragStartY = event.clientY;
    dragStartTime = performance.now();
    didMoveGrab = false;
    sheetGrab.setPointerCapture(event.pointerId);
  });

  sheetGrab.addEventListener("pointermove", (event: PointerEvent) => {
    if (dragStartY === null) return;

    const distance = event.clientY - dragStartY;
    if (Math.abs(distance) > 8) didMoveGrab = true;

    sheet.classList.add("is-dragging");
    sheet.style.setProperty("--sheet-drag-offset", `${Math.max(0, distance)}px`);
  });

  sheetGrab.addEventListener("pointerup", (event: PointerEvent) => {
    if (dragStartY === null) return;

    const distance = event.clientY - dragStartY;
    const elapsed = Math.max(1, performance.now() - dragStartTime);
    const speed = distance / elapsed;
    const shouldClose = distance >= 80 || (distance >= 28 && speed >= 0.55);

    const moved = didMoveGrab;

    if (sheetGrab.hasPointerCapture(event.pointerId)) {
      sheetGrab.releasePointerCapture(event.pointerId);
    }

    resetSheetDrag();

    if (moved) suppressPointerClickUntil = performance.now() + 400;
    if (shouldClose) closeSheet();
  });

  sheetGrab.addEventListener("pointercancel", () => {
    resetSheetDrag();
    didMoveGrab = false;
  });

  sheetGrab.addEventListener("click", (event: MouseEvent) => {
    if (event.detail > 0 && performance.now() < suppressPointerClickUntil) {
      event.preventDefault();
      suppressPointerClickUntil = 0;
      return;
    }

    closeSheet();
  });
}
