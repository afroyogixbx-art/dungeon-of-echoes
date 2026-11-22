/**
 * Inventory comparison + condensed Dust screenshots (mobile 390×844).
 * Usage: node scripts/inv-shots.mjs
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PLAYTEST_PORT || 4182);
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
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

const AFF = (id, stat, v, name) => ({ id, pre: false, tier: 1, stat, v, name, lo: 1, hi: 6 });

async function setupBag(page, { sel, dust, extra = 0, shop = false } = {}) {
  await page.evaluate(({ sel, dust, extra, shop }) => {
    const AFF = (id, stat, v, name) => ({ id, pre: false, tier: 1, stat, v, name, lo: 1, hi: 6 });
    window.__T.boot("warrior");
    window.__T.run((g) => {
      g.name = "Ava x";
      g.eq.weapon = { uid: 9101, id: "w_sword", ident: true, bon: { fire: 4 }, freed: false, ilvl: 5, affs: [AFF("af", "fire", 4, "Ember")] };
      g.eq.armor = g.eq.armor || { uid: 9100, id: "a_cloth", ident: true, bon: {}, freed: false, ilvl: 1 };
      delete g.eq.helmet;
      const bag = [
        { uid: 9102, id: "w_dagger", ident: true, bon: { ice: 4, atk: 2 }, freed: false, ilvl: 5, affs: [AFF("ai", "ice", 4, "Frost"), AFF("aa", "atk", 2, "Keen")] },
        { uid: 9103, id: "h_cap", ident: true, bon: {}, freed: false, ilvl: 3 },
        { uid: 9104, id: "w_dagger", ident: true, bon: {}, freed: false, ilvl: 1 },
      ];
      for (let i = 0; i < extra; i++) bag.push({ uid: 9200 + i, id: "c_mp1", ident: true, bon: {}, freed: false, ilvl: 1 });
      g.inv = bag;
      g.sel = sel;
      g.dust = dust;
      g.gold = 40;
      if (shop) {
        g.shop = [{ uid: 9301, id: "w_dagger", ident: true, bon: { ice: 4, atk: 2 }, freed: false, ilvl: 5, affs: [AFF("ai", "ice", 4, "Frost"), AFF("aa", "atk", 2, "Keen")] }];
        g.stock = [3];
        g.screen = "shop";
      } else {
        g.screen = "inventory";
      }
    });
    window.__T.refresh();
  }, { sel, dust, extra, shop });
  await new Promise((r) => setTimeout(r, 250));
}

async function main() {
  const vite = startVite();
  let browser;
  try {
    await waitPort(PORT, 20000);
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=390,844"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => typeof window.__T === "object" && window.__T.boot, { timeout: 15000 });

    await setupBag(page, { sel: 9102, dust: 12, extra: 0 });
    await page.evaluate(() => document.querySelector("[data-compare='weapon']")?.scrollIntoView({ block: "center" }));
    await new Promise((r) => setTimeout(r, 200));
    const pathCmp = path.join(out, "ui-compare-mobile.png");
    await page.screenshot({ path: pathCmp, fullPage: false });
    console.log("wrote", pathCmp);

    await setupBag(page, { sel: 9103, dust: 12, extra: 0 });
    await page.evaluate(() => document.querySelector("[data-compare='helmet']")?.scrollIntoView({ block: "center" }));
    await new Promise((r) => setTimeout(r, 200));
    const pathEmpty = path.join(out, "ui-compare-empty-mobile.png");
    await page.screenshot({ path: pathEmpty, fullPage: false });
    console.log("wrote", pathEmpty);

    await setupBag(page, { sel: 9102, dust: 12, extra: 0, shop: true });
    await page.evaluate(() => document.querySelector("[data-compare='weapon']")?.scrollIntoView({ block: "center" }));
    await new Promise((r) => setTimeout(r, 200));
    const pathShop = path.join(out, "ui-compare-shop-mobile.png");
    await page.screenshot({ path: pathShop, fullPage: false });
    console.log("wrote", pathShop);

    // bag top (no selection) with enough items that Dust sits below the fold
    await setupBag(page, { sel: -1, dust: 12, extra: 16 });
    const pathTop = path.join(out, "ui-bag-top-mobile.png");
    await page.screenshot({ path: pathTop, fullPage: false });
    console.log("wrote", pathTop);

    await page.evaluate(() => {
      const el = document.querySelector("[data-dust]");
      const root = document.querySelector("[data-inv]");
      if (el) el.scrollIntoView({ block: "end" });
      if (root) root.scrollTop = root.scrollHeight;
    });
    await new Promise((r) => setTimeout(r, 200));
    const pathDust = path.join(out, "ui-bag-dust-mobile.png");
    await page.screenshot({ path: pathDust, fullPage: false });
    console.log("wrote", pathDust);

    const facts = await page.evaluate(() => {
      const dust = document.querySelector("[data-dust]");
      const r = dust ? dust.getBoundingClientRect() : null;
      return {
        dustVisible: !!(r && r.top < window.innerHeight && r.bottom > 0),
        dustH: r ? Math.round(r.height) : 0,
        count: document.querySelector("[data-dust-count]")?.textContent,
        sac: document.querySelector("[data-sacrifice]")?.textContent,
        chips: [...document.querySelectorAll("[data-dust-tier]")].map((el) => (el.textContent || "").trim()),
        ladder: (dust?.textContent || "").includes("Legendary 6"),
      };
    });
    console.log("dust facts", JSON.stringify(facts));
    if (!facts.dustVisible || facts.ladder) {
      throw new Error("Dust row not visible or still has ladder text: " + JSON.stringify(facts));
    }
  } finally {
    if (browser) await browser.close();
    vite.kill("SIGTERM");
    setTimeout(() => { try { vite.kill("SIGKILL"); } catch {} process.exit(0); }, 1200);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
