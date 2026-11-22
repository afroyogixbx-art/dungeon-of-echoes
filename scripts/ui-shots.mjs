/**
 * Capture map + combat HUD screenshots and button metrics.
 * Usage: node scripts/ui-shots.mjs before|after
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PLAYTEST_PORT || 4181);
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const tag = process.argv[2] === "after" ? "after" : "before";
const out = path.join(ROOT, "playtest-shots");

function waitPort(port, timeoutMs) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const once = () => {
      const sock = createConnection({ port, host: "127.0.0.1" }, () => { sock.end(); resolve(); });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - t0 > timeoutMs) reject(new Error(`timeout waiting for :${port}`));
        else setTimeout(once, 150);
      });
    };
    once();
  });
}

function startVite() {
  const child = spawn("npx", ["vite", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, BROWSER: "none" },
  });
  child.stdout.on("data", (b) => process.stdout.write(`[vite] ${b}`));
  child.stderr.on("data", (b) => process.stderr.write(`[vite] ${b}`));
  return child;
}

async function measure(page) {
  return page.evaluate(() => {
    const rows = [];
    const els = document.querySelectorAll("button, [data-combat-actions], [data-hud], [data-locked]");
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.right < 0) continue;
      if (r.top > window.innerHeight || r.left > window.innerWidth) continue;
      const label = (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.tagName).replace(/\s+/g, " ").trim().slice(0, 80);
      // only on-screen chrome, skip title/menu dialogs
      const inHud = !!el.closest("[data-hud], [data-combat-actions], [data-locked], [data-play-actions], [data-util-cluster]");
      const isPlayBtn = el.tagName === "BUTTON" && r.bottom > window.innerHeight * 0.35;
      if (!inHud && !isPlayBtn && !el.closest("[data-hud]")) continue;
      rows.push({
        label, w: Math.round(r.width), h: Math.round(r.height),
        x: Math.round(r.x), y: Math.round(r.y),
        aria: el.getAttribute("aria-label") || "",
      });
    }
    return { vw: window.innerWidth, vh: window.innerHeight, rows };
  });
}

async function setup(page) {
  await page.evaluate(() => {
    window.__T.boot("warrior");
    window.__R.lvlTo(3);
    const g = window.__G();
    window.__R.learn("bash");
    if (window.__R.clearFx) window.__R.clearFx();
    g.log = [];
    g.fx = [];
  });
  await new Promise((r) => setTimeout(r, 250));
}

async function goCombat(page) {
  await page.evaluate(() => {
    const g = window.__G();
    const m = (g.mons || [])[0];
    if (!m) throw new Error("no monster");
    // place hero next to it then engage
    if (window.__R.engage) window.__R.engage(g, m);
    if (window.__R.clearFx) window.__R.clearFx();
    if (g.fx) g.fx = [];
    window.__T.refresh();
  });
  await new Promise((r) => setTimeout(r, 300));
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const vite = startVite();
  try {
    await waitPort(PORT, 20000);
    const browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });

    await setup(page);
    const mapM = await measure(page);
    await page.screenshot({ path: path.join(out, `ui-${tag}-map-mobile.png`) });

    await goCombat(page);
    const combatM = await measure(page);
    await page.screenshot({ path: path.join(out, `ui-${tag}-combat-mobile.png`) });

    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await page.evaluate(() => { window.dispatchEvent(new Event("resize")); if (window.__T) window.__T.refresh(); });
    await new Promise((r) => setTimeout(r, 300));
    const landM = await measure(page);
    await page.screenshot({ path: path.join(out, `ui-${tag}-combat-landscape.png`) });

    const metrics = { tag, map: mapM, combat: combatM, landscape: landM };
    fs.writeFileSync(path.join(out, `ui-${tag}-sizes.json`), JSON.stringify(metrics, null, 2));
    console.log(JSON.stringify(metrics, null, 2));
    console.log("wrote", out, "tag=", tag);
    await browser.close();
  } finally {
    vite.kill("SIGTERM");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
