const devtools = "http://127.0.0.1:9223";
const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:4175/";
const targets = await (await fetch(`${devtools}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page" && entry.url.startsWith("http://127.0.0.1:"));
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
  if (!result) throw new Error(`${message} Observed: ${JSON.stringify(await evaluate('({hidden:document.querySelector("#sheet").getAttribute("aria-hidden"),inert:document.querySelector("#sheet").inert,active:document.activeElement.id,activeClass:document.activeElement.className})'))}`);
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

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await setViewport(1440, 900, false);
await send("Page.navigate", { url: baseUrl });
await waitFor('document.readyState === "complete" && document.querySelectorAll("#list .item").length === 43', "Desktop app did not load all records.");
const desktop = await evaluate(`({
  width: document.querySelector("#app").getBoundingClientRect().width,
  map: getComputedStyle(document.querySelector("#map")).display,
  list: getComputedStyle(document.querySelector("#list")).display,
  count: document.querySelectorAll("#list .item").length,
  sw: "serviceWorker" in navigator
})`);
if (desktop.width < 1300 || desktop.map === "none" || desktop.list === "none" || desktop.count !== 43) {
  throw new Error(`Desktop layout check failed: ${JSON.stringify(desktop)}`);
}

await evaluate(`(() => { const input=document.querySelector("#q"); input.value="Dresden"; input.dispatchEvent(new Event("input",{bubbles:true})); })()`);
await assert('document.querySelectorAll("#list .item").length === 1 && document.querySelector("#list .item").textContent.includes("Dresden")', "Search did not filter to Dresden.");
await evaluate('(() => { const button=document.querySelector("#list .item"); button.focus(); button.click(); })()');
await assert('document.querySelector("#sheet").getAttribute("aria-hidden") === "false" && document.querySelector("#sheet").inert === false && document.querySelector("#app > main").inert', "Location dialog did not open accessibly.");
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
await assert('document.querySelector("#sheet").getAttribute("aria-hidden") === "false"', "Mobile location detail did not open.");
await waitFor('document.querySelector("#sheet").getBoundingClientRect().top < innerHeight', "Mobile detail sheet remained below the viewport.");
mobile.detail = await evaluate(`(() => { const h=document.querySelector("#app > header"), t=document.querySelector(".tabs"), app=document.querySelector("#app"), main=document.querySelector("main"), sheet=document.querySelector("#sheet"), close=document.querySelector("#sClose"); const cs=getComputedStyle(h); return {scrollY, visualViewportOffset:visualViewport?.offsetTop, headerTop:h.getBoundingClientRect().top, headerTransform:cs.transform, headerPosition:cs.position, headerMargin:cs.marginTop, tabsTop:t.getBoundingClientRect().top, appTop:app.getBoundingClientRect().top, mainTop:main.getBoundingClientRect().top, sheetRect:sheet.getBoundingClientRect().toJSON(), closeRect:close.getBoundingClientRect().toJSON(), pageHeight:document.documentElement.scrollHeight, bodyHeight:document.body.scrollHeight}; })()`);
if (mobile.detail.sheetRect.top >= 844 || mobile.detail.closeRect.bottom > 844) throw new Error(`Mobile detail sheet is clipped: ${JSON.stringify(mobile.detail)}`);
await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).then(async ({ data }) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile("C:/Users/fkaempfe/AppData/Local/hermes/cache/scratch/nehlsen-mobile-smoke.png", Buffer.from(data, "base64"));
});
await key("Escape");
await setViewport(844, 390, true, 90);
const landscape = await evaluate(`({ width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth, appHeight: document.querySelector("#app").getBoundingClientRect().height })`);
if (landscape.width !== 844 || landscape.height !== 390 || landscape.overflow || landscape.appHeight !== 390) {
  throw new Error(`Mobile landscape check failed: ${JSON.stringify(landscape)}`);
}

await waitFor('navigator.serviceWorker.controller !== null', "Service worker did not take control.");
await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0, connectionType: "none" });
await send("Page.reload", { ignoreCache: true });
await waitFor('document.querySelectorAll("#list .item").length === 43', "Offline reload did not restore app data.");
const offline = await evaluate(`({title:document.title,count:document.querySelectorAll("#list .item").length,app:document.querySelector("#app").getBoundingClientRect().width})`);
await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
if (errors.length) throw new Error(`Browser exceptions: ${errors.join("; ")}`);
console.log(JSON.stringify({ desktop, mobile, landscape, offline, exceptions: errors.length }, null, 2));
socket.close();
