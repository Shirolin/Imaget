/**
 * Read the LIVE Chrome Web Store listing copy for Imaget.
 * Run: node temp/read-live-listing.mjs [hl] [gl]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const HL = process.argv[2] ?? "en";
const GL = process.argv[3] ?? "US";
const EXT_ID = "kjnhapjhnhlilcngmhggiaaljddadjek";
const URL_ = `https://chromewebstore.google.com/detail/${EXT_ID}?hl=${HL}&gl=${GL}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9720 + Math.floor(Math.random() * 40);
const userDataDir = mkdtempSync(join(tmpdir(), "imaget-live-"));

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1400,3000",
  `--lang=${HL}`, `--user-data-dir=${userDataDir}`, URL_,
], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { rmSync(userDataDir, { recursive: true, force: true }); } catch {} };

async function sock() {
  for (let i = 0; i < 100; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl && t.url.startsWith("http"));
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("no page target");
}
const ws = new WebSocket(await sock());
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 1; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { resolve, reject } = pend.get(m.id); pend.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = id++; pend.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return { __err: r.exceptionDetails.text }; return r.result.value; };

await send("Page.enable"); await send("Runtime.enable");
for (let i = 0; i < 25; i++) {
  await sleep(800);
  if (await ev(`(()=>{const b=[...document.querySelectorAll('button,a')].find(x=>/Accept all/i.test(x.textContent||''));if(b){b.click();return true}return false})()`) === true) { console.log("[consent] accepted"); break; }
}
await sleep(7000);

const out = await ev(`(() => {
  const txt = (el) => el ? (el.innerText || el.textContent || '').trim() : null;
  const name = txt(document.querySelector('h1'));
  // The detailed description block is the longest text container on the page.
  const blocks = [...document.querySelectorAll('div,section,article')]
    .map(el => ({ el, t: (el.innerText||'').trim() }))
    .filter(x => x.t.length > 200 && x.t.length < 20000)
    .sort((a,b) => b.t.length - a.t.length);
  const desc = blocks.length ? blocks[0].t : null;
  const body = document.body.innerText || '';
  // Try to capture the summary line that follows the name.
  const idx = name ? body.indexOf(name) : -1;
  const after = idx >= 0 ? body.slice(idx + (name||'').length, idx + (name||'').length + 300) : null;
  return { url: location.href, title: document.title, name, after, descLength: desc ? desc.length : 0, desc };
})()`);

console.log("URL   :", out.url);
console.log("TITLE :", out.title);
console.log("NAME  :", out.name);
console.log("AFTER NAME:", JSON.stringify(out.after));
console.log("DESC LENGTH:", out.descLength);
console.log("---- FULL DESCRIPTION ----");
console.log(out.desc);

ws.close(); cleanup();
