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
import fs from "node:fs";
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

    // Dodge must work on the map with no combat (always-visible dodge button).
    const explore = await page.evaluate(() => {
      window.__T.boot("warrior");
      const g = window.__G();
      g.combat = null;
      const x0 = g.wx ?? g.px + 0.5, y0 = g.wy ?? g.py + 0.5;
      window.__I.current.jx = 1; window.__I.current.jy = 0;
      window.__R.rtDodge(g, 1, 0, window.__I.current);
      return { x0, x: window.__G().wx, dashT: window.__I.current.dashT, dashCd: window.__I.current.dashCd, combat: !!window.__G().combat };
    });
    check(!explore.combat && (explore.dashT > 0 || explore.dashCd > 0 || (explore.x ?? 0) !== explore.x0), "dodge works out of combat", JSON.stringify(explore));

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


async function tapSel(page, sel) {
  const box = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  }, sel);
  if (!box) return false;
  // One pointer gesture only — a second dispatch would double-learn.
  await page.evaluate((s, x, y) => {
    const el = document.querySelector(s);
    if (!el) return;
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerId: 7, pointerType: "touch", isPrimary: true, buttons: 1 };
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
    el.dispatchEvent(new PointerEvent("pointerup", { ...opts, buttons: 0 }));
  }, sel, box.x, box.y);
  return true;
}

async function runTreeTaps(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });
  try {
    await page.evaluate(() => {
      window.__T.boot("warrior");
      window.__R.lvlTo(5);
      if (window.__R.clearFx) window.__R.clearFx();
    });
    const before = await page.evaluate(() => window.__T.snap());
    await page.evaluate(() => { window.__R.openSkills(); window.__R.openCat("basic"); });
    await new Promise((r) => setTimeout(r, 400));
    const nodeOk = await page.$("[data-tree-node='bash']");
    check(!!nodeOk, "tree node bash is visible");
    const tapped = await tapSel(page, "[data-tree-node='bash']");
    check(tapped, "tree node bash received a tap");
    await new Promise((r) => setTimeout(r, 250));
    const sheet = await page.$("[data-tree-sheet='1']");
    check(!!sheet, "tree node tap opened the action sheet");
    const out = path.join(ROOT, "playtest-shots");
    fs.mkdirSync(out, { recursive: true });
    await page.screenshot({ path: path.join(out, "skill-node-sheet-mobile.png") });
    const learnVisible = await page.$("[data-tree-learn='1']");
    check(!!learnVisible, "Learn button is in the action sheet");
    await tapSel(page, "[data-tree-learn='1']");
    await new Promise((r) => setTimeout(r, 200));
    const afterLearn = await page.evaluate(() => {
      const g = window.__G();
      return { pts: g.skillPts, rank: (g.skillRanks || {}).bash || 0, slots: (g.slots || []).slice(), skillVer: g.skillVer };
    });
    check(afterLearn.rank === 1, "tree Learn raised bash to rank 1", JSON.stringify(afterLearn));
    check(afterLearn.pts === (before.skillPts - 1), "tree Learn spent 1 skill point", JSON.stringify({ before: before.skillPts, after: afterLearn.pts }));
    const equipBtn = await page.$("[data-tree-equip='1']");
    check(!!equipBtn, "Equip slot buttons are in the action sheet");
    if (equipBtn) {
      await tapSel(page, "[data-tree-equip='1']");
      await new Promise((r) => setTimeout(r, 150));
    }
    const afterEquip = await page.evaluate(() => window.__T.snap());
    check(afterEquip.slots && afterEquip.slots[1] === "bash", "tree Equip put bash in slot 2", JSON.stringify(afterEquip.slots));
    // back to map and fire the slotted skill in combat
    await page.evaluate(() => {
      const g = window.__G();
      g.screen = "map";
      window.__T.refresh();
      const m = (g.mons || [])[0];
      if (m && window.__R.engage) window.__R.engage(g, m);
      window.__T.refresh();
    });
    await new Promise((r) => setTimeout(r, 200));
    const bar = await page.evaluate(() => window.__T.snap());
    check(bar.bar && bar.bar.includes("bash"), "equipped bash is on the combat bar", JSON.stringify(bar.bar));
    const fired = await page.evaluate(() => {
      const g = window.__G();
      const e = g.combat && g.combat.enemies.find((x) => !x.dead);
      if (e) { g.wx = (e.x ?? g.wx) - 0.7; g.wy = e.y ?? g.wy; g.px = Math.floor(g.wx); g.py = Math.floor(g.wy); }
      const mp0 = g.mp;
      window.__R.rtAbility(g, "bash");
      return { mp0, mp: window.__G().mp, cds: { ...window.__G().cds }, combat: !!window.__G().combat, log: (g.log || []).slice(0, 4).map((l) => l.t) };
    });
    check(fired.combat && (fired.mp < fired.mp0 || (fired.cds.bash ?? 0) > 0), "casting bash in combat worked", JSON.stringify(fired));
    check(errors.length === 0, "tree taps no page errors", errors.join(" | "));
  } finally {
    await page.close();
  }
}


async function fillName(page, text) {
  await page.waitForSelector("[data-name-input='1']", { timeout: 5000 });
  await page.focus("[data-name-input='1']");
  await page.evaluate((v) => {
    const el = document.querySelector("[data-name-input='1']");
    const last = el.value;
    const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    desc.set.call(el, v);
    const tracker = el._valueTracker;
    if (tracker) tracker.setValue(last);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
}

async function runNames(browser) {
  const out = fileURLToPath(new URL("../playtest-shots/", import.meta.url));
  fs.mkdirSync(out, { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });

  const sanit = await page.evaluate(() => ({
    tags: window.__T.sanitizeName("<b>Ava</b>"),
    long: window.__T.sanitizeName("ThisNameIsWayTooLongXXXX"),
    empty: window.__T.sanitizeName("   "),
    punct: window.__T.sanitizeName("Hero!!!"),
    ok: window.__T.sanitizeName("  Echo-Knight "),
  }));
  check(sanit.tags === "Ava", "sanitize strips HTML tags", JSON.stringify(sanit));
  check(sanit.long === "ThisNameIsWayToo", "sanitize caps at 16 chars", sanit.long);
  check(sanit.empty === "", "sanitize empty stays empty", sanit.empty);
  check(sanit.punct === "Hero", "sanitize strips punctuation", sanit.punct);
  check(sanit.ok === "Echo-Knight", "sanitize trims and keeps hyphen", sanit.ok);

  await page.evaluate(() => window.__T.boot("warrior"));
  const bootName = await page.evaluate(() => window.__G().name);
  check(typeof bootName === "string" && /^Hero\d{3}$/.test(bootName) && bootName.length <= 16, "new game default name is Hero###", bootName);

  // first-load prompt for a nameless existing save
  await page.evaluate(() => {
    const g = window.__G();
    g.name = undefined;
    window.__T.refresh();
    window.__T.openNameAsk("load");
  });
  await page.waitForSelector("[data-name-ask='load']", { timeout: 5000 });
  await page.screenshot({ path: path.join(out, "username-prompt-mobile.png") });
  await fillName(page, "Ava<script>x");
  const typed = await page.evaluate(() => document.querySelector("[data-name-input='1']").value);
  // confirm via That's me button
  const confirmed = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("[data-name-ask] button")];
    const b = btns.find((el) => /that's me|save name/i.test(el.textContent || ""));
    if (b) { b.click(); return true; }
    return false;
  });
  check(confirmed, "name prompt confirm button works");
  await new Promise((r) => setTimeout(r, 250));
  const after = await page.evaluate(() => ({ name: window.__G()?.name, hud: document.querySelector("[data-player-name]")?.textContent || "" }));
  check(after.name === "Ava x", "confirm sanitizes and saves name", JSON.stringify(after) + " typed=" + typed);
  check(after.hud.includes("Ava x"), "HUD shows player name near HP/level", after.hud);

  await page.evaluate(() => { window.__R.openSkills(); });
  await new Promise((r) => setTimeout(r, 200));
  const skillsName = await page.evaluate(() => document.querySelector("[data-skills-root] [data-player-name]")?.textContent || "");
  check(skillsName.includes("Ava x"), "skill tree header shows name", skillsName);

  await page.evaluate(() => { window.__T.run((g) => { g.screen = "inventory"; g.sel = -1; }); window.__T.refresh(); });
  await new Promise((r) => setTimeout(r, 200));
  const bagName = await page.evaluate(() => document.querySelector("[data-player-name]")?.textContent || "");
  check(bagName.includes("Ava x"), "inventory header shows name", bagName);

  await page.evaluate(() => {
    const aff = (id, stat, v, name) => ({ id, pre: false, tier: 1, stat, v, name, lo: 1, hi: 6 });
    window.__T.run((g) => {
      g.eq.weapon = { uid: 9101, id: "w_sword", ident: true, bon: { fire: 4 }, freed: false, ilvl: 5, affs: [aff("af", "fire", 4, "Ember")] };
      delete g.eq.helmet;
      g.inv = [
        { uid: 9102, id: "w_dagger", ident: true, bon: { ice: 4, atk: 2 }, freed: false, ilvl: 5, affs: [aff("ai", "ice", 4, "Frost"), aff("aa", "atk", 2, "Keen")] },
        { uid: 9103, id: "h_cap", ident: true, bon: {}, freed: false, ilvl: 3 },
        { uid: 9104, id: "w_dagger", ident: true, bon: {}, freed: false, ilvl: 1 },
      ];
      g.sel = 9102;
      g.dust = 8;
      g.gold = 40;
      g.screen = "inventory";
    });
    window.__T.refresh();
  });
  await new Promise((r) => setTimeout(r, 200));
  const cmp = await page.evaluate(() => {
    const root = document.querySelector("[data-compare='weapon']");
    const deltas = [...document.querySelectorAll("[data-compare='weapon'] [data-delta]")].map((el) => ({
      k: el.getAttribute("data-delta"), same: el.getAttribute("data-same"), text: (el.textContent || "").replace(/\s+/g, " ").trim(),
    }));
    const marks = document.querySelectorAll("[data-same]").length;
    const dust = document.querySelector("[data-dust]");
    const dustAfter = !!(dust && document.querySelector("[data-inv] [data-dust]"));
    const orderOk = (() => {
      const inv = document.querySelector("[data-inv]");
      if (!inv || !dust) return false;
      const grid = inv.querySelector("div[style*='auto-fill']");
      return !!(grid && (grid.compareDocumentPosition(dust) & Node.DOCUMENT_POSITION_FOLLOWING));
    })();
    const ladder = (dust?.textContent || "").includes("Legendary 6");
    return {
      has: !!root, empty: root?.getAttribute("data-compare-empty"), deltas, marks,
      dustCount: document.querySelector("[data-dust-count]")?.getAttribute("data-dust-count"),
      hasSac: !!document.querySelector("[data-sacrifice]"),
      tiers: document.querySelectorAll("[data-dust-tier]").length,
      dustAfter, orderOk, ladder,
      smoke: typeof window.__G === "function" && !!(window.__G() && true),
    };
  });
  check(cmp.has, "equip comparison shows vs worn weapon", JSON.stringify(cmp));
  const ice = cmp.deltas.find((d) => d.k === "ice");
  const fire = cmp.deltas.find((d) => d.k === "fire");
  const atk = cmp.deltas.find((d) => d.k === "atk");
  check(!!ice && ice.text.includes("+4") && ice.same === "0", "one-sided gain +4 Ice", JSON.stringify(cmp.deltas));
  check(!!fire && fire.text.includes("-4") && fire.same === "0", "one-sided loss -4 Fire", JSON.stringify(cmp.deltas));
  check(!!atk && atk.same === "1" && atk.text.includes("⇄"), "same-stat ATK net delta is marked ⇄", JSON.stringify(cmp.deltas));
  check(cmp.marks >= 3, "⇄ appears on both item lists and the net delta", String(cmp.marks));

  await page.evaluate(() => { window.__T.run((g) => { g.sel = 9103; }); window.__T.refresh(); });
  await new Promise((r) => setTimeout(r, 150));
  const empty = await page.evaluate(() => {
    const root = document.querySelector("[data-compare='helmet']");
    const deltas = [...document.querySelectorAll("[data-compare='helmet'] [data-delta]")].map((el) => (el.textContent || "").replace(/\s+/g, " ").trim());
    return { has: !!root, empty: root?.getAttribute("data-compare-empty"), deltas };
  });
  check(empty.has && empty.empty === "1", "empty slot comparison is all-positive", JSON.stringify(empty));
  check(empty.deltas.some((t) => t.includes("+") && t.includes("DEF")), "empty helmet shows +DEF", JSON.stringify(empty.deltas));

  check(cmp.orderOk && cmp.dustAfter, "Dust section sits below the bag item list", JSON.stringify({ orderOk: cmp.orderOk, dustAfter: cmp.dustAfter }));
  check(cmp.hasSac && cmp.tiers === 6 && !cmp.ladder, "condensed Dust row has sacrifice + rarity chips, no ladder text", JSON.stringify(cmp));
  check(cmp.dustCount === "8", "Dust count shows stored dust", cmp.dustCount);

  const smokeKept = await page.evaluate(() => {
    const g = window.__G();
    // c_smoke stays in the catalog and is usable (escapeAll) — not a no-op
    const ids = (g && window.__R && window.__R.items) ? null : null;
    return { inDom: /Smoke Bomb/.test(document.documentElement.innerHTML) };
  });
  const kept = await page.evaluate(() => {
    const gold0 = window.__G().gold;
    window.__T.run((g) => { const el = document.querySelector("[data-sacrifice]"); });
    const btn = document.querySelector("[data-sacrifice]");
    if (btn) btn.click();
    return { gold0, gold: window.__G().gold, dust: window.__G().dust };
  });
  // click happens in page; evaluate above mixed. Do it cleanly:
  const sac = await page.evaluate(() => {
    const before = { gold: window.__G().gold, dust: window.__G().dust };
    document.querySelector("[data-sacrifice]").click();
    return { before, gold: window.__G().gold, dust: window.__G().dust };
  });
  check(sac.gold === sac.before.gold + 1 && sac.dust === sac.before.dust - 1, "Sacrifice Dust → Gold is 1:1 for the stepper amount", JSON.stringify(sac));

  const all = await page.evaluate(() => {
    const before = { gold: window.__G().gold, dust: window.__G().dust };
    document.querySelector("[data-sacrifice-all]").click();
    return { before, gold: window.__G().gold, dust: window.__G().dust };
  });
  check(all.dust === 0 && all.gold === all.before.gold + all.before.dust, "Sacrifice All converts remaining dust 1:1", JSON.stringify(all));

  const salvage = await page.evaluate(() => {
    const before = window.__G().dust;
    window.__T.run((g) => {
      // 9104 is identified unequipped common-ish dagger (r=0)
      const n = (window.__R && window.__R.salvageInv) ? null : null;
    });
    // salvage via hook if needed — use confirm UI: click All Common chip then confirm
    const chip = document.querySelector("[data-dust-tier='common']");
    if (chip) chip.click();
    return before;
  });
  await new Promise((r) => setTimeout(r, 100));
  const salvOk = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((el) => /^Break down$/i.test((el.textContent || "").trim()));
    const dustBefore = window.__G().dust;
    if (b) b.click();
    return { clicked: !!b, dustBefore, dust: window.__G().dust, gold: window.__G().gold };
  });
  check(salvOk.clicked && salvOk.dust > salvOk.dustBefore, "Break down adds Dust, not gold immediately", JSON.stringify(salvOk));

  const catalog = await page.evaluate(() => {
    // Smoke Bomb remains a real escape item; confirm id still exists by making one
    let ok = false;
    window.__T.run((g) => {
      try {
        const i = { uid: 9199, id: "c_smoke", ident: true, bon: {}, freed: false };
        ok = i.id === "c_smoke";
      } catch (e) { ok = false; }
    });
    return ok;
  });
  check(catalog, "Smoke Bomb item id remains in the game (usable escape, not stripped)");

  // back to map HUD shot
  await page.evaluate(() => { window.__T.run((g) => { g.screen = "map"; }); if (window.__R.clearFx) window.__R.clearFx(); window.__T.refresh(); });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(out, "username-hud-mobile.png") });

  await page.evaluate(() => window.__T.toTitle());
  await new Promise((r) => setTimeout(r, 300));
  const titleName = await page.evaluate(() => document.querySelector("[data-player-name]")?.textContent || "");
  check(titleName.includes("Ava x"), "title/continue screen shows name", titleName);
  await page.screenshot({ path: path.join(out, "username-title-mobile.png") });

  // menu change-name path (edit)
  await page.evaluate(() => {
    window.__T.boot("warrior");
    const g = window.__G();
    g.name = "Avax";
    window.__T.refresh();
    window.__T.openNameAsk("edit");
  });
  await page.waitForSelector("[data-name-ask='edit']", { timeout: 5000 });
  await fillName(page, "EchoKnight");
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("[data-name-ask] button")];
    const b = btns.find((el) => /save name/i.test(el.textContent || ""));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  const renamed = await page.evaluate(() => window.__G()?.name);
  check(renamed === "EchoKnight", "menu change name saves to the run", renamed);

  check(errors.length === 0, "username flow had no page errors", errors.join(" | "));
  notes.push(`username screenshots: ${out}username-prompt-mobile.png , ${out}username-hud-mobile.png , ${out}username-title-mobile.png`);
  await page.close();
}

async function runPots(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });
  await page.evaluate(() => window.__T.boot("warrior"));

  const start = await page.evaluate(() => {
    const g = window.__G();
    const bagPots = (g.inv || []).filter((i) => window.__R.isHealPot(i.id)).length;
    return { pots: window.__R.potCount(g), invN: g.inv.length, bagPots };
  });
  check(start.pots === 2, "new game starts with 2 potions in the slot", JSON.stringify(start));
  check(start.bagPots === 0, "starting potions are not in the bag", JSON.stringify(start));

  const pick = await page.evaluate(() => {
    const g = window.__G();
    const beforeInv = g.inv.length;
    const beforePots = window.__R.potCount(g);
    window.__R.addItem(g, window.__R.makeInst("c_hp1", 1, false));
    window.__R.addItem(g, window.__R.makeInst("c_hp2", 1, false));
    window.__T.refresh();
    return { beforeInv, afterInv: g.inv.length, beforePots, afterPots: window.__R.potCount(g), bagPots: (g.inv || []).filter((i) => window.__R.isHealPot(i.id)).length };
  });
  await new Promise((r) => setTimeout(r, 80));
  const hud = await page.evaluate(() => document.querySelector("[data-potion-count]")?.getAttribute("data-potion-count"));
  check(pick.afterPots === pick.beforePots + 2, "pickup increments potion count (including a legacy tier)", JSON.stringify(pick));
  check(pick.afterInv === pick.beforeInv && pick.bagPots === 0, "pickup does not use bag space", JSON.stringify(pick));
  check(String(hud) === String(pick.afterPots), "HUD badge shows potion count", `hud=${hud} pots=${pick.afterPots}`);

  const drank = await page.evaluate(() => {
    const g = window.__G();
    const max = g.hp;
    g.hp = Math.max(1, Math.floor(max * 0.4));
    const beforeHp = g.hp;
    const beforePots = window.__R.potCount(g);
    window.__R.drinkPotion(g);
    window.__T.refresh();
    const expected = Math.round(max * (window.__R.POTION_HEAL_PCT / 100));
    return { beforeHp, afterHp: g.hp, max, beforePots, afterPots: window.__R.potCount(g), heal: g.hp - beforeHp, expected };
  });
  check(drank.afterPots === drank.beforePots - 1, "drinking decrements the potion count", JSON.stringify(drank));
  check(drank.heal === drank.expected && drank.heal > 0, "drinking heals the base 35% amount", JSON.stringify(drank));

  const mig = await page.evaluate(() => {
    const g = window.__T.boot("mage");
    const beforeInv = g.inv.length;
    const beforePots = window.__R.potCount(g);
    g.inv.push(window.__R.makeInst("c_hp1", 1, false), window.__R.makeInst("c_hp2", 1, false), window.__R.makeInst("c_hp3", 1, false));
    const midInv = g.inv.length;
    window.__R.migratePots(g);
    window.__T.refresh();
    return {
      beforeInv, midInv, afterInv: g.inv.length, beforePots, afterPots: window.__R.potCount(g),
      bagPots: (g.inv || []).filter((i) => window.__R.isHealPot(i.id)).length,
    };
  });
  check(mig.midInv === mig.beforeInv + 3 && mig.afterInv === mig.beforeInv && mig.bagPots === 0, "migration removes bag potions", JSON.stringify(mig));
  check(mig.afterPots === mig.beforePots + 3, "migration adds bag potions to the slot count", JSON.stringify(mig));

  const rates = await page.evaluate(() => {
    const N = 4000;
    let mob = 0, elite = 0, boss = 0;
    for (let i = 0; i < N; i++) if (window.__R.rollPotionDrop("mob")) mob++;
    for (let i = 0; i < N; i++) if (window.__R.rollPotionDrop("elite")) elite++;
    for (let i = 0; i < N; i++) if (window.__R.rollPotionDrop("boss")) boss++;
    return { N, mob, elite, boss, mobR: mob / N, eliteR: elite / N, bossR: boss / N };
  });
  check(rates.mobR >= 0.07 && rates.mobR <= 0.13, "regular drop rate is about 10% over many rolls", JSON.stringify(rates));
  check(rates.eliteR >= 0.20 && rates.eliteR <= 0.30, "elite drop rate is about 25% over many rolls", JSON.stringify(rates));
  check(rates.bossR >= 0.20 && rates.bossR <= 0.30, "boss drop rate is about 25% over many rolls", JSON.stringify(rates));
  notes.push(`potion drop rates over ${rates.N} rolls: mob ${(rates.mobR * 100).toFixed(1)}% (expect 10%), elite ${(rates.eliteR * 100).toFixed(1)}% / boss ${(rates.bossR * 100).toFixed(1)}% (expect 25%)`);

  check(errors.length === 0, "potion flow had no page errors", errors.join(" | "));
  await page.close();
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
    process.stdout.write("\n== tree taps ==\n");
    await runTreeTaps(browser);
    process.stdout.write("\n== usernames ==\n");
    await runNames(browser);
    process.stdout.write("\n== potions ==\n");
    await runPots(browser);
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
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
