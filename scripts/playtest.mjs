/**
 * Dev-only floors 1–3 playtest for all five classes.
 * Uses Vite dev hooks (window.__G/__I/__T/__R) which are stripped from production builds.
 *
 *   npm run playtest
 *
 * Requires /usr/bin/google-chrome (or CHROME) and a free port (PLAYTEST_PORT, default 4179).
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PLAYTEST_PORT || 4179);
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const CLASSES = ["warrior", "mage", "rogue", "ranger", "cleric"];

function waitPort(port, timeoutMs) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const once = () => {
      const sock = createConnection({ port, host: "127.0.0.1" }, () => {
        sock.end();
        resolve();
      });
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
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  child.stdout.on("data", (b) => process.stdout.write(`[vite] ${b}`));
  child.stderr.on("data", (b) => process.stderr.write(`[vite] ${b}`));
  return child;
}

const fail = [];
const pass = [];
const notes = [];

function check(ok, name, extra) {
  if (ok) pass.push(name);
  else fail.push(extra ? `${name}: ${extra}` : name);
  return ok;
}

async function withPage(browser, fn) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });
  try {
    return await fn(page, errors);
  } finally {
    await page.close();
  }
}

async function runClass(browser, cls) {
  await withPage(browser, async (page, errors) => {
    const prefix = cls;
    const s1 = await page.evaluate((c) => {
      const g = window.__T.boot(c);
      return window.__T.snap();
    }, cls);
    check(s1.cls === cls && s1.floor === 1 && s1.lvl === 1 && s1.screen === "map", `${prefix} boot floor 1`, JSON.stringify(s1));
    check(s1.skillPts === 0, `${prefix} L1 has 0 skill points`, s1.skillPts);
    check(Array.isArray(s1.slots) && s1.slots.every((x) => x == null), `${prefix} L1 empty slots`, JSON.stringify(s1.slots));
    check(Array.isArray(s1.bar) && s1.bar.every((x) => x == null), `${prefix} L1 empty bar`, JSON.stringify(s1.bar));
    check(!s1.bar.some((x) => ["march", "haste", "sprint", "wstr", "swift"].includes(x)), `${prefix} no speed boost on bar`);

    const moved = await page.evaluate(async () => {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7]];
      const a0 = window.__T.snap();
      let best = { ax: a0.wx, ay: a0.wy, bx: a0.wx, by: a0.wy, dist: 0 };
      for (const [dx, dy] of dirs) {
        const a = window.__T.snap();
        window.__R.hold(dx, dy);
        await new Promise((r) => setTimeout(r, 220));
        const b = window.__T.snap();
        window.__R.stop();
        const dist = Math.hypot(b.wx - a.wx, b.wy - a.wy);
        if (dist > best.dist) best = { ax: a.wx, ay: a.wy, bx: b.wx, by: b.wy, dist };
        if (dist > 0.15) break;
      }
      return best;
    });
    check(moved.dist > 0.15, `${prefix} can move`, JSON.stringify(moved));

    const mid = await page.evaluate(() => {
      window.__R.lvlTo(3);
      return window.__T.snap();
    });
    check(mid.lvl >= 3 && mid.skillPts >= 2, `${prefix} level 3 grants points`, JSON.stringify({ lvl: mid.lvl, pts: mid.skillPts }));
    check(mid.skills.length === 0 && mid.slots.every((x) => x == null), `${prefix} no auto-unlock at L3`, JSON.stringify({ skills: mid.skills, slots: mid.slots }));

    const learned = await page.evaluate(() => {
      const g = window.__G();
      const nodes = window.__R.skillNodes(g.cls);
      const root = nodes.find((n) => n.kind === "skill" && window.__R.canLearnTree(g, n.id));
      if (!root) return { ok: false, reason: "no open root", pts: g.skillPts, lvl: g.lvl };
      const ok = window.__R.learn(root.id);
      const s = window.__T.snap();
      return { ok, node: root.id, ab: root.id, ...s };
    });
    check(learned.ok && learned.slots && learned.slots[0] === learned.ab, `${prefix} learn root`, JSON.stringify({ ok: learned.ok, node: learned.node, slots: learned.slots, pts: learned.skillPts }));
    check(learned.slots && learned.slots[0] === learned.ab, `${prefix} auto-slot learned ability`, JSON.stringify(learned.slots));
    check(learned.bar && learned.bar[0] === learned.ab, `${prefix} bar shows slotted ability`, JSON.stringify(learned.bar));

    const slotted = await page.evaluate(() => {
      const s0 = window.__T.snap();
      const id = s0.slots[0];
      window.__R.slot(1, id);
      window.__R.slot(0, null);
      const s1 = window.__T.snap();
      window.__R.slot(0, id);
      window.__R.slot(1, null);
      const s2 = window.__T.snap();
      return { afterMove: s1.slots, restored: s2.slots, id };
    });
    check(slotted.afterMove[0] == null && slotted.afterMove[1] === slotted.id && slotted.restored[0] === slotted.id, `${prefix} loadout swap`, JSON.stringify(slotted));

    const cast = await page.evaluate(async () => {
      window.__R.poke();
      window.__R.hold(0.7, 0.2);
      await new Promise((r) => setTimeout(r, 120));
      const before = window.__T.snap();
      window.__R.cast(0);
      await new Promise((r) => setTimeout(r, 180));
      const after = window.__T.snap();
      window.__R.stop();
      const moved = Math.hypot(after.wx - before.wx, after.wy - before.wy);
      const cd = Object.values(after.cds).some((v) => v > 0);
      const mpSpent = after.mp < before.mp;
      const logHit = (after.log || []).some((t) => /cooldown|no MP|out of range|no target|skill tree|empty slot/i.test(t) === false && t.length > 0);
      return { moved, cd, mpSpent, combat: after.combat, hp: after.hp, log: after.log, wx0: before.wx, wx1: after.wx };
    });
    check(cast.moved > 0.02, `${prefix} move-cast still moving`, JSON.stringify(cast));
    check(cast.cd || cast.mpSpent || (cast.log && cast.log.length), `${prefix} move-cast fired`, JSON.stringify(cast));

    const floors = await page.evaluate(() => {
      const out = [];
      for (const f of [2, 3]) {
        window.__R.clearFloor();
        window.__R.nextFloor();
        out.push(window.__T.snap());
      }
      return out;
    });
    check(floors[0] && floors[0].floor === 2 && floors[0].screen === "map", `${prefix} descend floor 2`, JSON.stringify(floors[0] && { floor: floors[0].floor, screen: floors[0].screen }));
    check(floors[1] && floors[1].floor === 3 && floors[1].screen === "map", `${prefix} descend floor 3`, JSON.stringify(floors[1] && { floor: floors[1].floor, screen: floors[1].screen }));
    check(floors[1] && floors[1].slots[0] === learned.ab, `${prefix} slots persist on floor 3`, JSON.stringify(floors[1] && floors[1].slots));

    const pageErrs = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
    check(pageErrs.length === 0, `${prefix} no page errors`, pageErrs.join(" | "));
  });
}

async function runMigrate(browser) {
  await withPage(browser, async (page, errors) => {
    const r = await page.evaluate(() => window.__R.migrateSample());
    notes.push(`migrate: ${JSON.stringify(r)}`);
    const must = ["bash", "cleave", "cry", "smash", "lslam", "reflect"];
    check(must.every((id) => (r.learned || []).includes(id)), "migrate keeps old level+tree abilities", JSON.stringify(r.learned));
    check(!(r.learned || []).some((id) => ["march", "haste", "sprint", "wstr", "swift"].includes(id)), "migrate drops speed boosts", JSON.stringify(r.learned));
    check(!(r.skills || []).includes("march") && !(r.slots || []).includes("march") && !(r.slots || []).includes("haste"), "migrate strips speed from skills/slots", JSON.stringify({ skills: r.skills, slots: r.slots }));
    check(r.skillVer === 3, "migrate sets skillVer 3", r.skillVer);
    check(r.haste === 0, "migrate clears Swift buff", r.haste);
    // L18 earned 17 points; 6 learned (5 core + reflect) => 11 unspent. Auto-slot first 5 learned.
    check(r.skillPts === 11, "migrate fair unspent points (17-6)", r.skillPts);
    check(Array.isArray(r.slots) && r.slots.filter(Boolean).length === 5, "migrate auto-slots first 5", JSON.stringify(r.slots));
    const pageErrs = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
    check(pageErrs.length === 0, "migrate no page errors", pageErrs.join(" | "));
  });
}


async function runDodge(browser) {
  await withPage(browser, async (page, errors) => {
    const r = await page.evaluate(async () => {
      const firePtr = (el, type, id, x, y, buttons) => {
        el.dispatchEvent(new PointerEvent(type, {
          bubbles: true, cancelable: true, composed: true,
          pointerId: id, pointerType: "touch", isPrimary: id === 11,
          clientX: x, clientY: y, buttons, button: 0, width: 24, height: 24,
        }));
      };
      window.__T.boot("warrior");
      window.__R.poke();
      await new Promise((res) => setTimeout(res, 80));
      const dodge = document.querySelector('button[aria-label="Dodge roll"]');
      const layer = document.querySelector("[data-joy-layer]");
      if (!dodge || !layer) return { ok: false, reason: "missing ui", dodge: !!dodge, layer: !!layer };
      const x0 = 120, y0 = 400;
      firePtr(layer, "pointerdown", 11, x0, y0, 1);
      firePtr(layer, "pointermove", 11, x0 + 90, y0, 1);
      await new Promise((res) => setTimeout(res, 80));
      const jxHeld = window.__I.current.jx;
      const I0 = window.__I.current;
      let vx = I0.jx + I0.kx + I0.gx, vy = I0.jy + I0.ky + I0.gy;
      const m0 = Math.hypot(vx, vy); if (m0 > 1) { vx /= m0; vy /= m0; }
      const vecBefore = { x: vx, y: vy, jx: I0.jx, jy: I0.jy };
      const box = dodge.getBoundingClientRect();
      firePtr(dodge, "pointerdown", 22, box.left + box.width / 2, box.top + box.height / 2, 1);
      const c = window.__G() && window.__G().combat;
      const after = { dvx: c ? c.dvx : null, dvy: c ? c.dvy : null, dashT: c ? c.dashT : null, jx: window.__I.current.jx, jy: window.__I.current.jy };
      firePtr(dodge, "pointerup", 22, box.left + box.width / 2, box.top + box.height / 2, 0);
      await new Promise((res) => setTimeout(res, 40));
      const jxAfterUp = window.__I.current.jx;
      return { ok: true, vecBefore, after, jxHeld, jxAfterUp };
    });
    check(r.ok, "dodge ui present", JSON.stringify(r));
    check(r.ok && r.jxHeld > 0.3, "joystick still held before dodge tap", JSON.stringify(r));
    check(r.ok && r.after && r.after.dashT > 0, "dodge started on pointerdown", JSON.stringify(r.after));
    check(r.ok && r.after && r.after.dvx > 0.5, "dodge dashes in joystick direction", JSON.stringify({ vec: r.vecBefore, after: r.after }));
    check(r.ok && r.after && r.after.jx > 0.3 && r.jxAfterUp > 0.3, "dodge tap did not cancel joystick", JSON.stringify({ jx: r.after && r.after.jx, jxAfterUp: r.jxAfterUp }));

    const key = await page.evaluate(async () => {
      window.__R.stop();
      const g0 = window.__G();
      if (g0 && g0.combat) { g0.combat.dashCd = 0; g0.combat.dashT = 0; }
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", code: "KeyD", bubbles: true, cancelable: true }));
      await new Promise((res) => setTimeout(res, 40));
      const kx = window.__I.current.kx;
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", code: "ShiftLeft", bubbles: true, cancelable: true, shiftKey: true }));
      const c = window.__G() && window.__G().combat;
      const out = { kx, dvx: c ? c.dvx : null, dashT: c ? c.dashT : null, kxAfter: window.__I.current.kx };
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", code: "ShiftLeft", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "d", code: "KeyD", bubbles: true }));
      return out;
    });
    check(key.kx > 0 && key.kxAfter > 0, "WASD still held when Shift dodge fires", JSON.stringify(key));
    check(key.dashT > 0 && key.dvx > 0.5, "Shift dodge uses move-key direction", JSON.stringify(key));

    const pageErrs = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
    check(pageErrs.length === 0, "dodge no page errors", pageErrs.join(" | "));
  });
}


async function runShots(browser) {
  const dir = new URL("../playtest-shots/", import.meta.url);
  const { mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const out = fileURLToPath(dir);
  await mkdir(out, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });
  await page.evaluate(() => {
    window.__T.boot("warrior");
    window.__R.lvlTo(12);
    const g = window.__G();
    const basics = window.__R.skillNodes(g.cls).filter((n) => n.kind === "skill");
    for (const n of basics.slice(0, 2)) window.__R.learn(n.id);
    window.__R.openSkills();
    if (window.__R.clearFx) window.__R.clearFx();
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(out, "skill-overview-mobile.png"), fullPage: false });
  await page.evaluate(() => {
    window.__R.openCat("core");
    if (window.__R.clearFx) window.__R.clearFx();
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(out, "skill-core-mobile.png"), fullPage: false });
  await page.close();
  notes.push(`screenshots: ${out}skill-overview-mobile.png , ${out}skill-core-mobile.png`);
}

async function main() {


  const vite = startVite();
  let browser;
  const kill = () => {
    try { if (browser) browser.close(); } catch {}
    try { vite.kill("SIGTERM"); } catch {}
  };
  process.on("exit", kill);
  try {
    await waitPort(PORT, 20000);
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1280,800"],
    });
    for (const cls of CLASSES) {
      process.stdout.write(`\n== ${cls} ==\n`);
      await runClass(browser, cls);
    }
    process.stdout.write("\n== migrate ==\n");
    await runMigrate(browser);
    process.stdout.write("\n== dodge ==\n");
    await runDodge(browser);
    process.stdout.write("\n== shots ==\n");
    await runShots(browser);
  } finally {
    if (browser) await browser.close();
    vite.kill("SIGTERM");
  }
  console.log("\n---- results ----");
  console.log(`PASS ${pass.length}`);
  for (const n of pass) console.log("  ✓", n);
  console.log(`FAIL ${fail.length}`);
  for (const n of fail) console.log("  ✗", n);
  for (const n of notes) console.log("  ·", n);
  if (fail.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
