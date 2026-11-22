/**
 * Capture before/after graphics screenshots (map + combat with hit particles).
 * Usage: node scripts/gfx-shots.mjs before|after
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PLAYTEST_PORT || 4186);
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const tag = process.argv[2] === "before" ? "before" : "after";
const out = path.join(ROOT, "playtest-shots");
fs.mkdirSync(out, { recursive: true });

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

async function setup(page) {
  await page.evaluate(() => {
    window.__T.boot("warrior");
    window.__R.lvlTo(3);
    window.__R.learn("bash");
    if (window.__R.clearFx) window.__R.clearFx();
    const g = window.__G();
    g.log = [];
    g.fx = [];
  });
  await new Promise((r) => setTimeout(r, 280));
}

async function goCombat(page) {
  await page.evaluate(() => { window.__R.poke(); });
  await new Promise((r) => setTimeout(r, 280));
}

async function burst(page) {
  if (tag !== "after") return;
  await page.evaluate(() => {
    if (window.__R.burst) {
      window.__R.burst("crit");
      window.__R.burst("hit");
    }
  });
  await new Promise((r) => setTimeout(r, 90));
}

async function shot(page, name) {
  const dest = path.join(out, `ui-gfx-${tag}-${name}.png`);
  await page.screenshot({ path: dest });
  console.log("wrote", dest);
}

const child = startVite();
let browser;
try {
  await waitPort(PORT, 20000);
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => window.__T && window.__R && window.__G, { timeout: 15000 });
  await setup(page);
  await shot(page, "map-mobile");

  await goCombat(page);
  await burst(page);
  await shot(page, "combat-mobile");

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await new Promise((r) => setTimeout(r, 200));
  await burst(page);
  await shot(page, "combat-landscape");

  await page.evaluate(() => {
    const g = window.__G();
    if (g) g.combat = null;
    if (window.__R.clearFx) window.__R.clearFx();
  });
  await new Promise((r) => setTimeout(r, 250));
  await shot(page, "map-landscape");

  // confirm HUD sizes were not touched
  const sizes = await page.evaluate(() => {
    const atk = document.querySelector('[aria-label="Attack"], button[data-atk], [data-combat-actions] button');
    const buttons = [...document.querySelectorAll("button")];
    const attack = buttons.find((b) => (b.getAttribute("aria-label") || b.textContent || "").trim() === "Attack" || (b.getAttribute("aria-label") || "").includes("Attack"));
    const r = (attack || atk)?.getBoundingClientRect();
    return r ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
  });
  console.log("attack size in landscape (should stay ~92 hit / ~80 vis):", sizes);
} finally {
  if (browser) await browser.close();
  child.kill("SIGTERM");
  setTimeout(() => { try { child.kill("SIGKILL"); } catch {} process.exit(0); }, 1500);
}
