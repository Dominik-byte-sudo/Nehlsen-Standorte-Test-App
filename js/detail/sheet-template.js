import { distanceKm, escapeHtml } from "../domain.js";
import { t } from "../i18n/strings.js";
import { isFavorite } from "../data/app-state.js";
const svg = (paths, className) => `<svg${className ? ` class="${className}"` : ""} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const rowIcon = (paths) => `<span aria-hidden="true">${svg(paths, "row-icon")}</span>`;
const PIN_PATHS = '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>';
const COPY_PATHS = '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>';
const PHONE_PATHS = '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L7.5 9.6a16 16 0 0 0 6.9 6.9l1.4-1.4a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 2Z"/>';
const MAIL_PATHS = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>';
const CLOCK_PATHS = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
export function renderSheetContent(location, origin) {
    const destination = encodeURIComponent(location.address);
    const distance = origin ? `<div class="distance-note">${escapeHtml(t("distanceNote", { km: Math.round(distanceKm(origin, location)) }))}</div>` : "";
    const favorite = isFavorite(location.id);
    const favoriteLabel = t(favorite ? "favoriteRemove" : "favoriteAdd");
    return `<div class="co">${escapeHtml(location.company)}</div>
    <div class="sheet-title"><h2 id="sTitle">${escapeHtml(location.name)}</h2><button class="favorite-toggle" type="button" aria-pressed="${favorite}" aria-label="${favoriteLabel}" title="${favoriteLabel}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg></button></div>${distance}
    <div class="row">${rowIcon(PIN_PATHS)}<span class="address-text">${escapeHtml(location.address)}</span><button class="copy-address" type="button" aria-label="${t("copyAddress")}" title="${t("copyAddress")}">${svg(COPY_PATHS)}</button></div>
    <div class="row">${rowIcon(PHONE_PATHS)}<a href="tel:${location.phone.replace(/[^\d+]/g, "")}">${escapeHtml(location.phone)}</a></div>
    <div class="row">${rowIcon(MAIL_PATHS)}<a href="mailto:${escapeHtml(location.email)}">${escapeHtml(location.email)}</a></div>
    <div class="row">${rowIcon(CLOCK_PATHS)}<span class="hours">${escapeHtml(location.hours)}</span></div>
    <div class="actions">
      <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&amp;destination=${destination}">${t("routeGoogle")}</a>
      <a class="btn secondary" target="_blank" rel="noopener" href="https://maps.apple.com/?daddr=${destination}" aria-label="${t("routeAppleAria")}">${t("routeApple")}</a>
    </div>`;
}
