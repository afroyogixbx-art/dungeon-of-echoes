/**
 * Sample screen luminance across combat hits, crits, and kills.
 * Fails if a frame-to-frame spike suggests a full-screen flash.
 * Usage: node scripts/lum-test.mjs
 */
import { spawn, execFileSync } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PLAYTEST_PORT || 4188);
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const out = path.join(ROOT, "playtest-shots", "lum-frames");
fs.rmSync(out, { recursive: true, force: true });
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

function analyze(paths) {
  const r = execFileSync("python3", [path.join(ROOT, "scripts/lum-analyze.py"), ...paths], { encoding: "utf8" }).trim();
  return JSON.parse(r);
}

async function setup(page) {
  await page.evaluate(() => {
    window.__T.boot("warrior");
    window.__R.lvlTo(8);
    window.__R.learn("bash");
    if (window.__R.clearFx) window.__R.clearFx();
    const g = window.__G();
    g.log = [];
    g.fx = [];
  });
  await new Promise((r) => setTimeout(r, 250));
}

async function sample(page, tag, n, everyMs, during) {
  const paths = [];
  for (let i = 0; i < n; i++) {
    if (during) await during(i);
    const dest = path.join(out, `${tag}-${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: dest, type: "png" });
    paths.push(dest);
    if (i + 1 < n) await new Promise((r) => setTimeout(r, everyMs));
  }
  return analyze(paths);
}

const child = spawn("npx", ["vite", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], {
  cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, BROWSER: "none" },
});
child.stdout.on("data", (b) => process.stdout.write(`[vite] ${b}`));
child.stderr.on("data", (b) => process.stderr.write(`[vite] ${b}`));

const SPIKE = 25; // a 62% off-white full-screen flash is ~80–130; local sparks stay well under this
let failed = false;
let browser;
try {
  await waitPort(PORT, 20000);
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => window.__T && window.__R && window.__G, { timeout: 15000 });

  // default should be reduce-fx ON (safe)
  const defOn = await page.evaluate(() => window.__R.reduceFx());
  if (!defOn) { console.log("FAIL default reduceFx is off"); failed = true; }
  else console.log("PASS default reduceFx is on");

  await setup(page);
  await page.evaluate(() => window.__R.poke());
  await new Promise((r) => setTimeout(r, 300));

  const noFlashEl = await page.evaluate(() => !document.querySelector("[data-flash]"));
  if (!noFlashEl) { console.log("FAIL data-flash element present before bursts"); failed = true; }
  else console.log("PASS no data-flash element");

  const runCase = async (name, setOff) => {
    await page.evaluate((off) => {
      window.__R.setReduceFx(!off ? true : false);
      window.__R.clearFx();
    }, setOff);
    await page.evaluate(() => { if (!window.__G().combat) window.__R.poke(); });
    await new Promise((r) => setTimeout(r, 200));
    const res = await sample(page, name, 16, 50, async (i) => {
      if (i === 2) await page.evaluate(() => window.__R.burst("hit"));
      if (i === 4) await page.evaluate(() => window.__R.burst("crit"));
      if (i === 6) await page.evaluate(() => window.__R.burst("death"));
      if (i === 8) await page.evaluate(() => {
        const g = window.__G();
        if (g.combat && g.combat.enemies[0]) {
          g.combat.enemies[0].hp = 0;
          window.__R.resolveDeaths(g);
          window.__R.burst("crit");
        }
      });
      if (i === 11) await page.evaluate(() => window.__R.burst("hit"));
    });
    const flashDuring = await page.evaluate(() => !!document.querySelector("[data-flash]"));
    console.log(`${name}: mean=${res.mean.toFixed(2)} maxΔ=${res.maxD.toFixed(2)} at frame ${res.at} (n=${res.values.length})`);
    if (flashDuring) { console.log(`FAIL ${name}: data-flash appeared`); failed = true; }
    if (res.maxD > SPIKE) { console.log(`FAIL ${name}: luminance spike ${res.maxD.toFixed(2)} > ${SPIKE}`); failed = true; }
    else console.log(`PASS ${name}: no frame-to-frame luminance spike`);
    return res;
  };

  await runCase("reduce-on", false);
  await runCase("reduce-off", true);

  // leave combat to open menu and confirm toggle default label after reset to on
  await page.evaluate(() => {
    window.__R.setReduceFx(true);
    const g = window.__G();
    if (g) g.combat = null;
  });
  await new Promise((r) => setTimeout(r, 200));
  const menuBtn = await page.$('button[aria-label="Menu"]');
  if (menuBtn) {
    await menuBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    const toggle = await page.$("[data-reduce-fx]");
    const state = toggle ? await page.evaluate((el) => el.getAttribute("data-reduce-fx"), toggle) : null;
    if (state === "1") console.log("PASS menu toggle shows On (data-reduce-fx=1)");
    else { console.log(`FAIL menu toggle state=${state}`); failed = true; }
  } else {
    console.log("FAIL could not find Menu button");
    failed = true;
  }
} finally {
  if (browser) await browser.close();
  child.kill("SIGTERM");
  setTimeout(() => { try { child.kill("SIGKILL"); } catch {} process.exit(failed ? 1 : 0); }, 1200);
}
