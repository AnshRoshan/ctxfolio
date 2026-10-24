// Run against a built site and a locally launched Chrome CDP endpoint.
// node tests/browser-check.mjs [site-url] [browser-port]
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const site = process.argv[2] ?? 'http://127.0.0.1:4173';
const port = process.argv[3] ?? '9228';
const out = new URL('../.impeccable/review/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const target = pages.find(p => p.type === 'page');
assert(target, 'Launch Chrome with a remote-debugging port first');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
  if (msg.id) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result); }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); ws.send(JSON.stringify({ id: next, method, params })); });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.text + ' ' + expression.slice(0,100));
  if (expression.includes('.click()')) await send('Runtime.evaluate', { expression: 'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))', awaitPromise: true });
  return r.result.value;
}
async function load(width, js = true, dark = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
  await send('Emulation.setScriptExecutionDisabled', { value: !js });
  await send('Page.navigate', { url: `${site}/?check=${width}-${js}-${dark}` });
  // One bounded document/font readiness wait, not a job poll.
  await new Promise(resolve => setTimeout(resolve, 700));
  if (js) await evaluate('document.fonts.ready.then(() => true)');
}
async function capture(name, clip) {
  const dimensions = await send('Page.getLayoutMetrics');
  const area = clip ?? { x: 0, y: 0, width: dimensions.cssContentSize.width, height: dimensions.cssContentSize.height, scale: 1 };
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: area });
  await fs.writeFile(new URL(name, out), Buffer.from(shot.data, 'base64'));
}
async function inspect(width) {
  const values = await evaluate(`(() => {
    const cta = document.querySelector('.hero-actions .button');
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, ctaBottom: cta.getBoundingClientRect().bottom,
      font: getComputedStyle(document.body).fontFamily, theme: document.documentElement.dataset.theme,
      consoleBg: getComputedStyle(document.querySelector('[data-island="cost"] > div')).backgroundColor,
      headingColor: getComputedStyle(document.querySelector('#thesis h2')).color,
      deadAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash) };
  })()`);
  assert(values.scrollWidth <= width, `Page overflow at ${width}: ${JSON.stringify(values)}`);
  assert(values.ctaBottom < 850, `Hero CTA not immediately visible at ${width}`);
  assert.equal(values.deadAnchors.length, 0, 'Broken fragment navigation');
  assert.match(values.font, /Geist/, 'Own-world font not applied');
  return values;
}
await send('Page.enable');
await send('Runtime.enable');
const checks = {};
await load(1440);
await evaluate('localStorage.removeItem("pcs-theme"); document.querySelectorAll(".theme-control button")[0].click(); window.scrollTo(0,0)');
checks.desktop = await inspect(1440);
await capture('desktop.png');
await capture('desktop-hero.png', { x: 0, y: 0, width: 1440, height: 1000, scale: 1 });
const costY = await evaluate('document.getElementById("cost").offsetTop');
await capture('desktop-cost.png', { x: 0, y: costY, width: 1440, height: 850, scale: 1 });
// Drive actual keyboard controls and state cycles.
await evaluate('document.getElementById("cost-session").focus()');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
assert.equal(await evaluate('document.getElementById("cost-session").value'), '40');
const chart = await evaluate('(() => { const r = document.querySelector("[data-island=cost] svg").getBoundingClientRect(); const px = 56 + (19 / 39) * (720 - 56 - 96); return { x: r.left + (px / 720) * r.width, y: r.top + r.height / 2 }; })()');
await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...chart, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...chart, button: 'left', buttons: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...chart, button: 'left', clickCount: 1 });
assert.equal(await evaluate('document.getElementById("cost-session").value'), '20');
await evaluate('document.querySelectorAll("[data-island=page] .phase-rail button")[1].click()');
assert.equal(await evaluate('document.querySelector("[data-island=page] [aria-current=step]").textContent'), 'commit');
await evaluate('document.querySelectorAll("[data-island=cli] button")[1].click()');
assert.equal(await evaluate('document.querySelectorAll("[data-island=cli] button")[1].getAttribute("aria-pressed")'), 'true');
await evaluate('document.querySelector("[data-island=ledger] button").click()');
assert.match(await evaluate('document.querySelector("[data-island=ledger] [role=status]").textContent'), /2 errors/);
await evaluate('document.querySelectorAll("[data-island=ledger] button")[1].click()');
assert.match(await evaluate('document.querySelector("[data-island=ledger] [role=status]").textContent'), /clean/);
await evaluate('document.querySelectorAll("[data-island=ledger] button")[2].click()');
await evaluate('document.querySelector("[data-island=hook] [tabindex]").focus()');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: '3', code: 'Digit3', windowsVirtualKeyCode: 51 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: '3', code: 'Digit3', windowsVirtualKeyCode: 51 });
await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
assert.match(await evaluate('document.querySelector("[data-island=hook] [role=status]").textContent'), /BLOCK/);
// Clipboard: exercise success through the real user-facing button.
await send('Browser.grantPermissions', { origin: site, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
await evaluate('document.querySelector("[data-island=copybtn] button").click()');
await new Promise(resolve => setTimeout(resolve, 150));
assert.match(await evaluate('document.querySelector("[data-island=copybtn] button").textContent'), /copied/);
assert.equal(await evaluate('navigator.clipboard.readText()'), 'npx ctxfolio@3.8.0 setup');
checks.interactions = ['chart keyboard and direct pointer drag', 'compiled phase rail', 'CLI switch', 'ledger collision/repair/reset', 'Stop keyboard block', 'clipboard copy'];
await evaluate('document.querySelectorAll(".theme-control button")[2].click(); window.scrollTo(0,0)');
await send('Page.reload');
await new Promise(resolve => setTimeout(resolve, 400));
checks.dark = await inspect(1440);
assert.equal(checks.dark.theme, 'dark', 'Theme choice did not survive reload');
assert.notEqual(checks.dark.headingColor, checks.desktop.headingColor, 'Dark-mode utility colors did not update');
await capture('desktop-dark.png', { x: 0, y: 0, width: 1440, height: 1000, scale: 1 });
await evaluate('document.querySelectorAll(".theme-control button")[0].click()');
await load(390);
checks.mobile = await inspect(390);
await capture('mobile.png');
await capture('mobile-hero.png', { x: 0, y: 0, width: 390, height: 1000, scale: 1 });
await evaluate('document.querySelector(".mobile-menu summary").click()');
assert.equal(await evaluate('document.querySelector(".mobile-menu").open'), true);
await evaluate('document.querySelector(".mobile-menu summary").click()');
for (const width of [320, 768, 1024]) { await load(width); checks[width] = await inspect(width); }
await load(390, false);
// CDP Runtime.evaluate is a debugger probe even with page scripts disabled.
checks.noJs = await evaluate(`({jsClass: document.documentElement.classList.contains('js'), heading:document.querySelector('h1').textContent, islands: [...document.querySelectorAll('[data-island]')].filter(el => el.dataset.island !== 'theme').every(el => el.textContent.trim()), scrollWidth: document.documentElement.scrollWidth, width: innerWidth})`);
assert.equal(checks.noJs.jsClass, false, 'Scripts still ran in the no-JS test');
assert(checks.noJs.islands, 'A no-JS island fallback is empty');
assert.equal(checks.noJs.scrollWidth, 390, 'No-JS mobile overflow');
await capture('mobile-nojs.png', { x: 0, y: 0, width: 390, height: 1000, scale: 1 });
await load(1440);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }, { name: 'prefers-color-scheme', value: 'light' }] });
await send('Page.reload');
await new Promise(resolve => setTimeout(resolve, 700));
const bench = await evaluate('(() => { const r = document.querySelector(".workbench").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()');
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...bench });
const depth = await evaluate('getComputedStyle(document.querySelector(".workbench")).getPropertyValue("--depth-ry")');
assert.notEqual(depth, '0deg', 'Pointer depth did not respond');
checks.depth = 'pointer tilt with CSS 3D perspective';
await capture('desktop-motion.png', { x: 0, y: 0, width: 1440, height: 1000, scale: 1 });
await evaluate('window.scrollTo(0,0)');
assert.equal(errors.length, 0, `Uncaught browser errors: ${errors.join('; ')}`);
await fs.writeFile(new URL('checks.json', out), JSON.stringify({ checks, errors }, null, 2));
console.log(JSON.stringify({ ok: true, checks, errors }, null, 2));
ws.close();
