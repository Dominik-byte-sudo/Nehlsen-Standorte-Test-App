const devtools = "http://127.0.0.1:9223";
const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:4175/";
const targets = await (await fetch(`${devtools}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page" && entry.url.startsWith(new URL(baseUrl).origin))
  ?? targets.find((entry) => entry.type === "page" && entry.url.startsWith("http://127.0.0.1:"));
if (!target) throw new Error("No test browser page found; launch Edge with --remote-debugging-port=9223 first.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let commandId = 0;
const pending = new Map();
const errors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});
function send(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression, awaitPromise = false) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function assert(expression, message) {
  const result = await evaluate(expression);
  if (!result) throw new Error(`${message} Observed: ${JSON.stringify(await evaluate('({hidden:document.querySelector("#sheet").getAttribute("aria-hidden"),modal:document.querySelector("#sheet").getAttribute("aria-modal"),inert:document.querySelector("#sheet").inert,mainInert:document.querySelector("#app > main").inert,active:document.activeElement.id,activeClass:document.activeElement.className})'))}`);
}
async function waitFor(expression, message) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(message);
}
async function setViewport(width, height, mobile, angle = 0) {
  await send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: mobile ? 2 : 1, mobile,
    screenWidth: width, screenHeight: height,
    screenOrientation: { type: angle ? "landscapePrimary" : "portraitPrimary", angle },
  });
}
async function key(key) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key });
}
async function pointerClick(selector) {
  const point = await evaluate(`(() => { const rect=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:rect.x+rect.width/2,y:rect.y+rect.height/2}; })()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  await new Promise((resolve) => setTimeout(resolve, 120));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await setViewport(1440, 900, false);
await send("Page.navigate", { url: baseUrl });
await waitFor('document.readyState === "complete" && document.querySelectorAll("#list .item").length === 43', "Desktop app did not load all records.");
await assert('document.querySelector("#sheet").getBoundingClientRect().top >= innerHeight', "Closed desktop detail sheet leaves its grab bar visible at the bottom.");
if (await evaluate('document.documentElement.dataset.theme') !== "light") await evaluate('document.querySelector("#themeToggle").click()');
const desktop = await evaluate(`(() => {
  const list=document.querySelector("#list"), dock=document.querySelector(".theme-dock"), toggle=document.querySelector("#listToggle");
  return {
    width: document.querySelector("#app").getBoundingClientRect().width,
    map: getComputedStyle(document.querySelector("#map")).display,
    list: getComputedStyle(list).display,
    count: document.querySelectorAll("#list .item").length,
    sw: "serviceWorker" in navigator,
    toggleDisplay: getComputedStyle(toggle).display,
    toggleLabel: toggle.getAttribute("aria-label"),
    expanded: toggle.getAttribute("aria-expanded"),
    listWidth: list.getBoundingClientRect().width,
    listLeft: list.getBoundingClientRect().left,
    listRight: list.getBoundingClientRect().right,
    dockWidth: dock.getBoundingClientRect().width,
    dockLeft: dock.getBoundingClientRect().left,
    dockRight: dock.getBoundingClientRect().right,
    theme: document.documentElement.dataset.theme,
    green: getComputedStyle(document.documentElement).getPropertyValue("--green").trim(),
    headerBackground: getComputedStyle(document.querySelector("header")).backgroundColor,
    brandCopyColor: getComputedStyle(document.querySelector(".brand-copy p")).color,
    mapDotColor: getComputedStyle(document.documentElement).getPropertyValue("--header-green").trim(),
    toggleColors: { foreground:getComputedStyle(toggle).color, background:getComputedStyle(toggle).backgroundColor }
  };
})()`);
if (desktop.width < 1300 || desktop.map === "none" || desktop.list === "none" || desktop.count !== 43 || desktop.toggleDisplay === "none" || desktop.expanded !== "true" || desktop.green !== "#6ab023" || desktop.headerBackground !== "rgb(106, 176, 35)" || desktop.brandCopyColor !== "rgb(12, 18, 14)" || desktop.mapDotColor !== "#456f1c" || Math.abs(desktop.listLeft - desktop.dockLeft) > 1 || Math.abs(desktop.listRight - desktop.dockRight) > 1 || desktop.dockRight > desktop.width / 2) {
  throw new Error(`Desktop layout check failed: ${JSON.stringify(desktop)}`);
}
await evaluate('document.querySelector("#listToggle").click()');
await waitFor('document.querySelector("#workspace").classList.contains("list-collapsed") && getComputedStyle(document.querySelector("#list")).display === "none"', "List toggle did not fold the desktop panel.");
await new Promise((resolve) => setTimeout(resolve, 350));
const folded = await evaluate(`(() => {
  const map=document.querySelector("#map").getBoundingClientRect(), list=document.querySelector("#list"), dock=document.querySelector(".theme-dock").getBoundingClientRect(), toggle=document.querySelector("#listToggle");
  return { expanded:toggle.getAttribute("aria-expanded"), label:toggle.getAttribute("aria-label"), viewportWidth:innerWidth, appWidth:document.querySelector("#app").getBoundingClientRect().width, mainWidth:document.querySelector("#workspace").getBoundingClientRect().width, mainClass:document.querySelector("#workspace").className, mainMatches:document.querySelector("#workspace").matches("main.list-collapsed"), desktopMedia:matchMedia("(min-width: 800px)").matches, inlineGrid:document.querySelector("#workspace").style.gridTemplateColumns, collapsedRules:[...document.styleSheets].flatMap(sheet=>[...sheet.cssRules]).filter(rule=>rule.cssText.includes("list-collapsed")).map(rule=>rule.cssText), grid:getComputedStyle(document.querySelector("#workspace")).gridTemplateColumns, mapWidth:map.width, listWidth:list.getBoundingClientRect().width, dockWidth:dock.width, dockRight:dock.right, themeButtonRight:document.querySelector("#themeToggle").getBoundingClientRect().right };
})()`);
if (folded.expanded !== "false" || folded.label !== "Standortliste einblenden" || folded.mapWidth < desktop.width - 5 || folded.listWidth !== 0 || folded.dockWidth >= desktop.dockWidth || folded.themeButtonRight > folded.dockRight + 1 || folded.dockRight > desktop.width / 2) {
  throw new Error(`Desktop folded-list check failed: ${JSON.stringify(folded)}`);
}
await new Promise((resolve) => setTimeout(resolve, 100));
await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).then(async ({ data }) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile("C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/nehlsen-desktop-folded.png", Buffer.from(data, "base64"));
});
await evaluate('document.querySelector("#themeToggle").click()');
await waitFor(`getComputedStyle(document.querySelector("#listToggle")).backgroundColor !== ${JSON.stringify(desktop.toggleColors.background)}`, "List control did not finish adapting to the theme change.");
const darkToggleColors = await evaluate(`({theme:document.documentElement.dataset.theme,foreground:getComputedStyle(document.querySelector("#listToggle")).color,background:getComputedStyle(document.querySelector("#listToggle")).backgroundColor,green:getComputedStyle(document.documentElement).getPropertyValue("--green").trim(),mapDotColor:getComputedStyle(document.documentElement).getPropertyValue("--header-green").trim(),headerBackground:getComputedStyle(document.querySelector("header")).backgroundColor,brandCopyColor:getComputedStyle(document.querySelector(".brand-copy p")).color})`);
if (darkToggleColors.theme === desktop.theme || darkToggleColors.foreground === desktop.toggleColors.foreground || darkToggleColors.background === desktop.toggleColors.background || darkToggleColors.green !== "#6ab023" || darkToggleColors.headerBackground !== "rgb(106, 176, 35)" || darkToggleColors.brandCopyColor !== "rgb(12, 18, 14)" || darkToggleColors.mapDotColor !== "#314b18") {
  throw new Error(`List control did not adapt to the other theme: ${JSON.stringify({ light: desktop.toggleColors, dark: darkToggleColors })}`);
}
await evaluate('document.querySelector("#themeToggle").click(); document.querySelector("#listToggle").click()');
await waitFor('!document.querySelector("#workspace").classList.contains("list-collapsed") && document.querySelector("#listToggle").getAttribute("aria-expanded") === "true"', "List toggle did not restore the desktop panel.");
await waitFor('Math.abs(document.querySelector(".theme-dock").getBoundingClientRect().width - document.querySelector("#list").getBoundingClientRect().width) < 1', "Theme dock did not restore to the sidebar width.");
await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).then(async ({ data }) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile("C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/nehlsen-desktop-layout.png", Buffer.from(data, "base64"));
});

await evaluate(`(() => { const input=document.querySelector("#q"); input.value="Dresden"; input.dispatchEvent(new Event("input",{bubbles:true})); })()`);
await assert('document.querySelectorAll("#list .item").length === 1 && document.querySelector("#list .item").textContent.includes("Dresden")', "Search did not filter to Dresden.");
await evaluate('(() => { const button=document.querySelector("#list .item"); button.focus(); button.click(); })()');
await assert('document.querySelector("#sheet").getAttribute("aria-hidden") === "false" && document.querySelector("#sheet").getAttribute("aria-modal") === "false" && document.querySelector("#sheet").inert === false && document.querySelector("#app > main").inert === false', "Location detail did not remain non-modal and accessible.");
await key("Escape");
await assert('document.querySelector("#sheet").getAttribute("aria-hidden") === "true" && document.querySelector("#sheet").inert === true && document.activeElement.classList.contains("item")', "Escape did not close the dialog and restore focus.");

await evaluate(`(() => { const input=document.querySelector("#q"); input.value=""; input.dispatchEvent(new Event("input",{bubbles:true})); })()`);
await setViewport(390, 844, true);
await evaluate('document.querySelector("#tList").click()');
const mobile = await evaluate(`({
  width: document.querySelector("#app").getBoundingClientRect().width,
  map: getComputedStyle(document.querySelector("#map")).display,
  list: getComputedStyle(document.querySelector("#list")).display,
  overflow: document.documentElement.scrollWidth > innerWidth,
  itemCount: document.querySelectorAll("#list .item").length,
  scrollY: scrollY,
  headerRect: document.querySelector("#app > header").getBoundingClientRect().toJSON(),
  tabsRect: document.querySelector(".tabs").getBoundingClientRect().toJSON(),
  appRect: document.querySelector("#app").getBoundingClientRect().toJSON(),
  pageHeight: document.documentElement.scrollHeight
})`);
if (mobile.width !== 390 || mobile.map !== "none" || mobile.list === "none" || mobile.overflow || mobile.itemCount !== 43) {
  throw new Error(`Mobile portrait check failed: ${JSON.stringify(mobile)}`);
}
await evaluate('(() => { const button=document.querySelector("#list .item"); button.focus(); button.click(); })()');
await waitFor('document.querySelector("#sheet").getAttribute("aria-hidden") === "false"', "Mobile location detail did not open.");
await waitFor('document.querySelector("#sheet").getBoundingClientRect().top < innerHeight', "Mobile detail sheet remained below the viewport.");
await waitFor('document.querySelector("#sClose").getBoundingClientRect().bottom <= innerHeight', "Mobile detail close button remained clipped during its entrance animation.");
mobile.detail = await evaluate(`(() => { const h=document.querySelector("#app > header"), t=document.querySelector(".tabs"), app=document.querySelector("#app"), main=document.querySelector("main"), sheet=document.querySelector("#sheet"), close=document.querySelector("#sClose"); const cs=getComputedStyle(h); return {scrollY, visualViewportOffset:visualViewport?.offsetTop, headerTop:h.getBoundingClientRect().top, headerTransform:cs.transform, headerPosition:cs.position, headerMargin:cs.marginTop, tabsTop:t.getBoundingClientRect().top, appTop:app.getBoundingClientRect().top, mainTop:main.getBoundingClientRect().top, sheetRect:sheet.getBoundingClientRect().toJSON(), closeRect:close.getBoundingClientRect().toJSON(), pageHeight:document.documentElement.scrollHeight, bodyHeight:document.body.scrollHeight}; })()`);
if (mobile.detail.sheetRect.top >= 844 || mobile.detail.closeRect.bottom > 844) throw new Error(`Mobile detail sheet is clipped: ${JSON.stringify(mobile.detail)}`);
await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).then(async ({ data }) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile("C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/nehlsen-mobile-smoke.png", Buffer.from(data, "base64"));
});
await pointerClick("#appearanceToggle");
await assert('document.querySelector("#appearanceToggle").getAttribute("aria-expanded") === "true" && !document.querySelector("#appearanceMenu").classList.contains("hidden")', "The design wheel is covered by the open mobile detail sheet.");
await pointerClick("#designGlass");
await assert('document.documentElement.dataset.design === "glass" && localStorage.getItem("nehlsen-design") === "glass"', "Mobile Liquid Glass selection did not apply.");
const opticalGlass = await evaluate('({dockZ:getComputedStyle(document.querySelector("#themeDock")).zIndex,sheetFilter:getComputedStyle(document.querySelector("#sheet")).backdropFilter,menuFilter:getComputedStyle(document.querySelector("#appearanceMenu")).backdropFilter})');
if (Number(opticalGlass.dockZ) <= 1001 || !opticalGlass.sheetFilter.includes("blur(6px)")) throw new Error(`Mobile glass layer/performance check failed: ${JSON.stringify(opticalGlass)}`);
await pointerClick("#appearanceToggle");
await assert('document.querySelector("#appearanceToggle").getAttribute("aria-expanded") === "true" && !document.querySelector("#appearanceMenu").classList.contains("hidden")', "The design wheel did not reopen while Liquid Glass is active.");
await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).then(async ({ data }) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile("C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/nehlsen-mobile-glass-menu.png", Buffer.from(data, "base64"));
});
await pointerClick("#designNormal");
await assert('document.documentElement.dataset.design === "normal" && localStorage.getItem("nehlsen-design") === "normal"', "The design wheel could not switch back to Normal on mobile.");
await key("Escape");
await waitFor('document.querySelector("#sheet").getAttribute("aria-hidden") === "true"', "Escape did not close the mobile details.");
await new Promise((resolve) => setTimeout(resolve, 300));
await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).then(async ({ data }) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile("C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/nehlsen-mobile-layout.png", Buffer.from(data, "base64"));
});
await setViewport(844, 390, true, 90);
const landscape = await evaluate(`({ width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth, appHeight: document.querySelector("#app").getBoundingClientRect().height })`);
if (landscape.width !== 844 || landscape.height !== 390 || landscape.overflow || landscape.appHeight !== 390) {
  throw new Error(`Mobile landscape check failed: ${JSON.stringify(landscape)}`);
}

const responsiveWidths = [320, 360, 390, 520, 521, 768, 800, 1024, 1440];
const responsive = [];
for (const width of responsiveWidths) {
  const height = width <= 520 ? 844 : 900;
  await setViewport(width, height, width <= 520);
  const layout = await evaluate(`(() => {
    const box=(selector)=>document.querySelector(selector).getBoundingClientRect();
    const logo=box(".brand-logo"), brand=box(".brand-copy"), dock=box(".theme-dock"), main=box("main");
    const input=getComputedStyle(document.querySelector("#q"));
    const near=getComputedStyle(document.querySelector("#nearBtn"));
    return {
      width:innerWidth, overflow:document.documentElement.scrollWidth>innerWidth,
      logoWidth:logo.width, logoRight:logo.right, brandRight:brand.right,
      dockTop:dock.top, dockBottom:dock.bottom, dockLeft:dock.left, mainBottom:main.bottom,
      dockPosition:getComputedStyle(document.querySelector(".theme-dock")).position,
      colorsMatch:input.color===near.color && input.backgroundColor===near.backgroundColor,
      theme:document.documentElement.dataset.theme
    };
  })()`);
  if (layout.overflow || layout.logoWidth < 130 || layout.logoRight > width + 1 || layout.brandRight > layout.logoRight - layout.logoWidth + 1 || layout.dockBottom > height + 1 || layout.dockPosition !== "relative" || layout.dockTop < layout.mainBottom - 1 || !layout.colorsMatch) {
    throw new Error(`Responsive layout failed at ${width}px: ${JSON.stringify(layout)}`);
  }
  await evaluate('document.querySelector("#themeToggle").click()');
  const toggled = await evaluate(`(() => { const input=getComputedStyle(document.querySelector("#q")), near=getComputedStyle(document.querySelector("#nearBtn")); return {theme:document.documentElement.dataset.theme,match:input.color===near.color && input.backgroundColor===near.backgroundColor}; })()`);
  if (!toggled.match) throw new Error(`Search/near colors differ in ${toggled.theme} mode at ${width}px.`);
  await evaluate('document.querySelector("#themeToggle").click()');
  responsive.push({ width, logoWidth: layout.logoWidth, dockTop: layout.dockTop, colorsMatchBothModes: true });
}

await waitFor('navigator.serviceWorker.controller !== null', "Service worker did not take control.");
await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0, connectionType: "none" });
await send("Page.reload", { ignoreCache: true });
await waitFor('document.querySelectorAll("#list .item").length === 43', "Offline reload did not restore app data.");
const offline = await evaluate(`({title:document.title,count:document.querySelectorAll("#list .item").length,app:document.querySelector("#app").getBoundingClientRect().width})`);
await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
if (errors.length) throw new Error(`Browser exceptions: ${errors.join("; ")}`);
console.log(JSON.stringify({ desktop, mobile, landscape, responsive, offline, exceptions: errors.length }, null, 2));
socket.close();
