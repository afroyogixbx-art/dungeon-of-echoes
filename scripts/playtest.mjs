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
  check(empty.deltas.some((t) => t.includes("+") && t.includes("Defense")), "empty helmet shows +Defense", JSON.stringify(empty.deltas));

  check(cmp.orderOk && cmp.dustAfter, "Dust section sits below the bag item list", JSON.stringify({ orderOk: cmp.orderOk, dustAfter: cmp.dustAfter }));
  check(cmp.hasSac && cmp.tiers === 6 && !cmp.ladder, "condensed Dust row has sacrifice + rarity chips, no ladder text", JSON.stringify(cmp));
  check(cmp.dustCount === "8", "Dust count shows stored dust", cmp.dustCount);

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

  const retired = await page.evaluate(() => {
    const gold0 = window.__G().gold;
    window.__T.run((g) => {
      g.inv.push({ uid: 9199, id: "c_smoke", ident: true, bon: {}, freed: false, ilvl: 1 });
      g.inv.push({ uid: 9200, id: "c_storm", ident: true, bon: {}, freed: false, ilvl: 1 });
      window.__R.migrateRemovedItems(g);
    });
    const g = window.__G();
    const catalog = (window.__R.ITEMS || []).some((i) => i.id === "c_smoke" || i.id === "c_storm");
    return {
      gold0, gold: g.gold,
      leftover: g.inv.some((i) => i.id === "c_smoke" || i.id === "c_storm"),
      catalog,
    };
  });
  check(!retired.catalog, "c_smoke and c_storm are gone from the item catalog", JSON.stringify(retired));
  check(!retired.leftover && retired.gold === retired.gold0 + 12 + 18, "owned Smoke Bomb and Bottled Storm convert to sell gold on load", JSON.stringify(retired));

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


async function runTransfer(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });
  await page.evaluate(() => window.__T.boot("warrior"));

  const pack = (src, dst, gold) => {
    const g = window.__G();
    for (const k of Object.keys(g.eq || {})) delete g.eq[k];
    g.inv = [src, dst].filter(Boolean);
    g.gold = gold;
    g.usedPhoenix = false;
    g.combat = null;
    g.buffs = g.buffs || {};
    g.buffs.dotT = 0;
    g.buffs.dotD = 0;
  };

  const success = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7001, id: "w_dagger", ident: true, bon: { def: 4 }, freed: false, ilvl: 3 };
    const dst = { uid: 7002, id: "w_club", ident: true, bon: {}, freed: false, ilvl: 1 };
    eval(packSrc)(src, dst, 5000);
    const g = window.__G();
    const beforeDef = R.itemStats(dst).def;
    const r = R.applyTransfer(g, 7001, 7002, { kind: "stat", stat: "def", v: 4 });
    const after = g.inv.find((i) => i.uid === 7002);
    return {
      r, gold: g.gold,
      srcGone: !g.inv.some((i) => i.uid === 7001) && !Object.values(g.eq || {}).some((i) => i && i.uid === 7001),
      destLeft: !!after,
      beforeDef: beforeDef ?? 0, destDef: after ? (R.itemStats(after).def ?? 0) : null,
      destBonDef: after && after.bon.def,
      log: (g.log || []).slice(0, 3).map((l) => l.t),
    };
  }, pack.toString());
  check(success.r === true, "stat transfer success path returns true", JSON.stringify(success));
  check(success.gold === 0, "success path deducts 5,000 gold", JSON.stringify(success));
  check(success.srcGone && success.destLeft, "source deleted and destination kept", JSON.stringify(success));
  check(success.destDef === success.beforeDef + 4 && success.destBonDef === 4, "stat value is preserved on the destination", JSON.stringify(success));

  const poor = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7011, id: "w_dagger", ident: true, bon: { def: 4 }, freed: false, ilvl: 3 };
    const dst = { uid: 7012, id: "w_club", ident: true, bon: {}, freed: false, ilvl: 1 };
    eval(packSrc)(src, dst, 4999);
    const g = window.__G();
    const r = R.applyTransfer(g, 7011, 7012, { kind: "stat", stat: "def", v: 4 });
    return { r, gold: g.gold, src: !!g.inv.find((i) => i.uid === 7011), destDef: R.itemStats(g.inv.find((i) => i.uid === 7012) || dst).def ?? 0 };
  }, pack.toString());
  check(poor.r === "Not enough gold." && poor.gold === 4999 && poor.src && poor.destDef === 0, "insufficient gold is blocked and items are unchanged", JSON.stringify(poor));

  const locked = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7021, id: "w_dagger", ident: true, bon: { def: 4 }, freed: false, ilvl: 3, pin: true };
    const dst = { uid: 7022, id: "w_club", ident: true, bon: {}, freed: false, ilvl: 1 };
    eval(packSrc)(src, dst, 5000);
    const g = window.__G();
    const r = R.applyTransfer(g, 7021, 7022, { kind: "stat", stat: "def", v: 4 });
    return { r, gold: g.gold, src: !!g.inv.find((i) => i.uid === 7021) };
  }, pack.toString());
  check(typeof locked.r === "string" && /unlock/i.test(locked.r) && locked.gold === 5000 && locked.src, "locked (pinned) source is blocked", JSON.stringify(locked));

  const equipped = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7031, id: "w_dagger", ident: true, bon: { def: 4 }, freed: false, ilvl: 3 };
    const dst = { uid: 7032, id: "w_club", ident: true, bon: {}, freed: false, ilvl: 1 };
    eval(packSrc)(src, dst, 5000);
    const g = window.__G();
    g.eq.weapon = src;
    g.inv = [dst];
    const r = R.applyTransfer(g, 7031, 7032, { kind: "stat", stat: "def", v: 4 });
    return { r, gold: g.gold, stillEq: g.eq.weapon && g.eq.weapon.uid === 7031, destDef: R.itemStats(g.inv.find((i) => i.uid === 7032) || dst).def ?? 0 };
  }, pack.toString());
  check(typeof equipped.r === "string" && /unequip/i.test(equipped.r) && equipped.gold === 5000 && equipped.stillEq && equipped.destDef === 0, "equipped source is blocked", JSON.stringify(equipped));

  const modified = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7041, id: "w_dagger", ident: true, bon: { def: 4 }, freed: false, ilvl: 3 };
    const dst = { uid: 7042, id: "w_club", ident: true, bon: { atk: 3 }, freed: false, ilvl: 2, affs: [{ id: "a_atk", pre: false, tier: 1, stat: "atk", v: 3, name: "Keen", lo: 2, hi: 4 }] };
    eval(packSrc)(src, dst, 5000);
    const g = window.__G();
    const atk0 = R.itemStats(dst).atk;
    const r = R.applyTransfer(g, 7041, 7042, { kind: "stat", stat: "def", v: 4 });
    const after = g.inv.find((i) => i.uid === 7042);
    return { r, atk0, atk: after ? R.itemStats(after).atk : null, def: after ? R.itemStats(after).def : null, affAtk: after && after.affs && after.affs.some((a) => a.stat === "atk" && a.v === 3) };
  }, pack.toString());
  check(modified.r === true && modified.atk === modified.atk0 && modified.def === 4 && modified.affAtk, "transfer onto a modified item keeps existing affixes and adds the new stat", JSON.stringify(modified));

  const stacked = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7051, id: "w_dagger", ident: true, bon: { def: 5 }, freed: false, ilvl: 3 };
    const dst = { uid: 7052, id: "a_tunic", ident: true, bon: { def: 4 }, freed: false, ilvl: 2 };
    eval(packSrc)(src, dst, 5000);
    const g = window.__G();
    const before = R.itemStats(dst).def; // tunic base 3 + bon 4 = 7
    const r = R.applyTransfer(g, 7051, 7052, { kind: "stat", stat: "def", v: 5 });
    const after = g.inv.find((i) => i.uid === 7052);
    return { r, before, after: after ? R.itemStats(after).def : null, bon: after && after.bon.def };
  }, pack.toString());
  check(stacked.r === true && stacked.before === 7 && stacked.after === 12 && stacked.bon === 9, "same-stat values add together on the destination", JSON.stringify(stacked));

  const legend = await page.evaluate((packSrc) => {
    const R = window.__R;
    const src = { uid: 7061, id: "m_phoenix", ident: true, bon: {}, freed: false, ilvl: 8 };
    const dst = { uid: 7062, id: "a_dragon", ident: true, bon: {}, freed: false, ilvl: 8 };
    eval(packSrc)(src, dst, 5000);
    const g = window.__G();
    const r = R.applyTransfer(g, 7061, 7062, { kind: "sp", sp: "phoenix" });
    const after = g.inv.find((i) => i.uid === 7062);
    g.inv = [];
    if (after) g.eq.armor = after;
    const sps = after ? R.itemSps(after) : [];
    const f = R.full(g);
    const dotT0 = g.buffs.dotT || 0;
    R.applyDot(g, 10, "poison");
    const shrugged = (g.buffs.dotT || 0) === dotT0 && (g.log || []).some((l) => /shrugs off the poison/i.test(l.t));
    g.hp = 0;
    R.lethal(g);
    return {
      r, sps, fullSp: f.sp.slice(),
      shrugged, hp: g.hp, usedPhoenix: g.usedPhoenix,
      log: (g.log || []).slice(0, 5).map((l) => l.t),
    };
  }, pack.toString());
  check(legend.r === true && legend.sps.includes("dotImmune") && legend.sps.includes("phoenix") && legend.fullSp.includes("dotImmune") && legend.fullSp.includes("phoenix"), "legendary ability transfers onto another legendary and both are on the item", JSON.stringify(legend));
  check(legend.shrugged, "destination's original legendary immunity still works after the transfer", JSON.stringify(legend));
  check(legend.usedPhoenix === true && legend.hp > 0, "transferred phoenix blessing actually revives on the new item", JSON.stringify(legend));

  // UI: service is on the merchant and the four steps can be walked
  const ui = await page.evaluate(() => {
    const R = window.__R;
    const src = { uid: 7071, id: "w_dagger", ident: true, bon: { def: 5 }, freed: false, ilvl: 3 };
    const dst = { uid: 7072, id: "w_club", ident: true, bon: { def: 4 }, freed: false, ilvl: 2 };
    const g = window.__G();
    for (const k of Object.keys(g.eq || {})) delete g.eq[k];
    g.inv = [src, dst];
    g.gold = 5000;
    g.shop = [R.makeInst("c_hp1", 1, false, "shop")];
    g.stock = [3];
    g.combat = null;
    g.screen = "shop";
    window.__T.refresh();
    return { screen: window.__G().screen };
  });
  check(ui.screen === "shop", "shop screen opened for transfer UI", JSON.stringify(ui));
  await new Promise((r) => setTimeout(r, 150));
  const open = await page.$("[data-xfer-open='1']");
  check(!!open, "merchant shows the Stat Transfer service");
  const tapped = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((el) => /Transfer 5,000g/i.test(el.textContent || ""));
    if (!b) return false;
    b.click();
    return true;
  });
  check(tapped, "Transfer 5,000g button is clickable");
  await new Promise((r) => setTimeout(r, 100));
  const step1 = await page.$("[data-xfer='src']");
  check(!!step1, "step 1 source picker is shown");
  await page.evaluate(() => {
    const row = document.querySelector("[data-xfer-item='7071'][data-xfer-kind='src'] button");
    if (row) row.click();
  });
  await new Promise((r) => setTimeout(r, 80));
  check(!!(await page.$("[data-xfer='dst']")), "step 2 destination picker is shown");
  await page.evaluate(() => {
    const row = document.querySelector("[data-xfer-item='7072'][data-xfer-kind='dst'] button");
    if (row) row.click();
  });
  await new Promise((r) => setTimeout(r, 80));
  check(!!(await page.$("[data-xfer='pick']")), "step 3 pick list is shown");
  await page.evaluate(() => {
    const row = document.querySelector("[data-xfer-pick='stat:def'] button");
    if (row) row.click();
  });
  await new Promise((r) => setTimeout(r, 80));
  const confirm = await page.evaluate(() => {
    const root = document.querySelector("[data-xfer='confirm']");
    const stack = document.querySelector("[data-xfer-stack='1']");
    return { ok: !!root, stack: stack ? stack.textContent : "", confirmBtn: !!document.querySelector("[data-xfer-confirm='1']") };
  });
  check(confirm.ok && confirm.confirmBtn, "step 4 confirm screen is shown", JSON.stringify(confirm));
  check(/\+4 Defense\s*→\s*\+9 Defense/.test(confirm.stack || ""), "confirm screen shows same-stat stacking in plain text", JSON.stringify(confirm));

  check(errors.length === 0, "stat transfer had no page errors", errors.join(" | "));
  await page.close();
}

async function runShopSell(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__R !== "undefined", { timeout: 15000 });
  await page.evaluate(() => window.__T.boot("warrior"));
  const setup = await page.evaluate(() => {
    const g = window.__G();
    for (const k of Object.keys(g.eq || {})) delete g.eq[k];
    g.eq.weapon = { uid: 8101, id: "w_club", ident: true, bon: {}, freed: false, ilvl: 1 };
    g.inv = [
      { uid: 8102, id: "w_echo", ident: true, bon: { atk: 3 }, freed: false, ilvl: 5 },
      { uid: 8103, id: "w_dagger", ident: true, bon: { crit: 4 }, freed: false, ilvl: 2 },
    ];
    g.gold = 250;
    g.shop = [];
    g.stock = [];
    g.sel = -1;
    g.screen = "shop";
    window.__T.refresh();
    return { gold: g.gold, invN: g.inv.length };
  });
  check(setup.invN === 2, "shop sell fixture loaded", JSON.stringify(setup));
  await new Promise((r) => setTimeout(r, 80));
  const row = await page.$("[data-shop-sell='8102']");
  check(!!row, "sell-side bag row is shown");
  check(!(await page.$("[data-shop-sell-detail='8102']")), "sell details start closed");
  const quick = await page.$("[data-shop-sell-quick='8102']");
  check(!!quick, "quick Sell button is kept on the row");

  await page.$eval("[data-shop-sell-item='8102']", (el) => {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
  });
  await new Promise((r) => setTimeout(r, 120));
  const afterTap = await page.evaluate(() => {
    const g = window.__G();
    const det = document.querySelector("[data-shop-sell-detail='8102']");
    return {
      gold: g.gold,
      still: g.inv.some((i) => i.uid === 8102),
      open: det && det.getAttribute("data-shop-sell-open") !== "closed",
      openAttr: document.querySelector("[data-shop-sell='8102']")?.getAttribute("data-shop-sell-open"),
      stats: [...(det?.querySelectorAll("[data-stat]") || [])].map((n) => n.getAttribute("data-stat")),
      badge: !!det?.querySelector("[data-slot-badge]"),
      rarity: (det?.textContent || "").includes("Legendary"),
      slot: (det?.textContent || "").includes("Weapon"),
      sp: !!det?.querySelector("[data-sp='doubleStrike']"),
      spText: (det?.textContent || "").includes("20% chance to strike twice"),
      compare: !!det?.querySelector("[data-compare]"),
      price: det?.querySelector("[data-shop-sell-price]")?.getAttribute("data-shop-sell-price") || "",
      priceText: (det?.querySelector("[data-shop-sell-price]")?.textContent || ""),
      detailSell: !!(det && [...det.querySelectorAll("button")].some((b) => /Sell \d+g/.test(b.textContent || ""))),
      invN: g.inv.length,
    };
  });
  check(afterTap.still && afterTap.gold === 250 && afterTap.invN === 2, "tapping a sell-side item does not instantly sell", JSON.stringify(afterTap));
  check(afterTap.openAttr === "1" && !!afterTap.price, "tapping opens sell item details", JSON.stringify(afterTap));
  check(afterTap.stats.length > 0 && afterTap.badge && afterTap.rarity && afterTap.slot, "sell details show plain stats, slot badge, and rarity", JSON.stringify(afterTap));
  check(afterTap.sp && afterTap.spText, "sell details show legendary ability text", JSON.stringify(afterTap));
  check(afterTap.compare, "sell details compare against equipped item", JSON.stringify(afterTap));
  check(afterTap.detailSell && /Sell price:/.test(afterTap.priceText), "sell details show sell price and a Sell button", JSON.stringify(afterTap));

  const out = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "playtest-shots");
  fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: path.join(out, "shop-sell-detail-mobile.png") });
  check(true, "shop sell details mobile screenshot");

  await page.evaluate(() => {
    const det = document.querySelector("[data-shop-sell-detail='8102']");
    const b = det && [...det.querySelectorAll("button")].find((el) => /Sell \d+g/.test(el.textContent || ""));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 120));
  const sold = await page.evaluate(() => {
    const g = window.__G();
    return { gold: g.gold, gone: !g.inv.some((i) => i.uid === 8102), left: g.inv.map((i) => i.uid), detail: !!document.querySelector("[data-shop-sell-detail='8102']") };
  });
  check(sold.gone && sold.gold > 250 && sold.left.includes(8103), "Sell inside details sells the item", JSON.stringify(sold));

  const goldMid = sold.gold;
  await page.evaluate(() => {
    const b = document.querySelector("[data-shop-sell-quick='8103'] button") || document.querySelector("[data-shop-sell-quick='8103']");
    const btn = b && (b.tagName === "BUTTON" ? b : b.querySelector("button"));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 120));
  const quickSold = await page.evaluate((g0) => {
    const g = window.__G();
    return { gold: g.gold, gone: !g.inv.some((i) => i.uid === 8103), more: g.gold > g0 };
  }, goldMid);
  check(quickSold.gone && quickSold.more, "quick Sell on the row still works", JSON.stringify(quickSold));

  check(errors.length === 0, "shop sell details had no page errors", errors.join(" | "));
  await page.close();
}


async function runBosses(browser) {
  await withPage(browser, async (page, errors) => {
    const order = await page.evaluate(() => {
      window.__T.boot("warrior", "endless");
      const floors = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 90];
      const g = window.__G();
      const rows = floors.map((f) => {
        const p = window.__R.bossPlan(g, f);
        const B = window.__R.BOSSES[p.id];
        const e = window.__R.makeBoss({ ...g, floor: f, mode: "endless" }, f);
        return { f, id: p.id, encore: p.encore, name: window.__R.bossName(g, f), biome: window.__R.biomeOf(f, g), spr: e.spr, hp: e.hp, atk: e.atk, phases: B.phases, haz: B.hazTile };
      });
      const story = [5, 10].map((f) => window.__R.bossPlan({ mode: "story", floor: f }, f).id);
      const storyDeep = window.__R.bossPlan({ mode: "story", floor: 15 }, 15).id;
      const noLeak = Array.from({ length: 80 }, (_, i) => window.__R.rollItem(i % 20 + 1, i % 5, "warrior", "any")).every((id) => !window.__R.ITEMS.find((it) => it.id === id && it.dropBoss));
      return { rows, story, storyDeep, noLeak, newIds: [...window.__R.BOSS_NEW], allIds: [...window.__R.BOSS_ALL] };
    });
    const expect = ["brood", "lord", "rotking", "choir", "behemoth", "fisher", "witch", "colossus", "hunger", "brood", "lord", "rotking", "hunger"];
    const got = order.rows.map((r) => r.id);
    check(JSON.stringify(got) === JSON.stringify(expect), "endless boss order is brood, lord, then 7 new, then full cycle", JSON.stringify(got));
    check(order.rows[0].encore === false && order.rows[2].encore === false && order.rows[9].encore === true && order.rows[10].encore === true, "encore only after the new roster has all appeared", JSON.stringify(order.rows.map((r) => [r.f, r.encore])));
    check(got[2] !== "brood" && got[2] === "rotking", "floor 15 is Rotking, not a Broodmother repeat", got[2]);
    check(order.story[0] === "brood" && order.story[1] === "lord", "story floors 5 and 10 stay Broodmother and Echo Lord", JSON.stringify(order.story));
    check(order.rows[0].name === "The Broodmother" && order.rows[1].name === "The Echo Lord", "floors 5 and 10 use the original titles", `${order.rows[0].name} / ${order.rows[1].name}`);
    check(/Returning/.test(order.rows[9].name), "depth 50 returning Broodmother is tagged", order.rows[9].name);
    check(order.noLeak === true, "regular rollItem never returns boss-only drops");
    const scaled = order.rows[9].hp > order.rows[0].hp && order.rows[10].hp > order.rows[1].hp;
    check(scaled, "cycled bosses scale with depth", JSON.stringify({ f5: order.rows[0].hp, f50: order.rows[9].hp, f10: order.rows[1].hp, f55: order.rows[10].hp }));

    const fights = await page.evaluate(() => {
      const out = [];
      const floors = [
        [5, "brood"], [10, "lord"], [15, "rotking"], [20, "choir"], [25, "behemoth"],
        [30, "fisher"], [35, "witch"], [40, "colossus"], [45, "hunger"], [50, "brood"],
      ];
      for (const [f, id] of floors) {
        window.__T.boot("warrior", "endless");
        window.__R.jumpFloor(f);
        const g = window.__G();
        const mon = (g.mons || []).find((m) => m.boss);
        if (!mon) { out.push({ f, id, ok: false, reason: "no boss mon" }); continue; }
        window.__R.engage(g, mon);
        const c = g.combat;
        const e = c && (c.enemies || []).find((x) => x.boss);
        if (!e) { out.push({ f, id, ok: false, reason: "no engage", t: mon.t, biome: g.biome }); continue; }
        const hp0 = e.hp;
        window.__R.hitEnemy(g, e, 1, false, "test");
        const hurt = e.hp < hp0;
        const beforeInv = (g.inv || []).length;
        e.hp = 0;
        window.__R.resolveDeaths(g);
        const after = window.__G();
        const gained = (after.inv || []).length - beforeInv;
        const drops = (after.inv || []).slice(beforeInv);
        const ident = drops.some((i) => i.id === "c_ident");
        const themeOk = drops.every((i) => {
          const it = window.__R.ITEMS.find((x) => x.id === i.id);
          return !it || !it.dropBoss || it.dropBoss === id;
        });
        const log = (after.log || []).some((l) => new RegExp(window.__R.BOSSES[id].short, "i").test(l.t) || new RegExp(window.__R.BOSSES[id].name, "i").test(l.t));
        out.push({
          f, id, ok: mon.t === id && e.bk === id && e.spr === id && hurt && gained >= 3 && ident && themeOk,
          t: mon.t, bk: e.bk, spr: e.spr, name: e.name, biome: g.biome, haz: (g.map || []).flat().includes(window.__R.BOSSES[id].hazTile),
          hurt, gained, ident, themeOk, log, hp0,
        });
      }
      return out;
    });
    for (const r of fights) {
      check(r.ok === true, `${r.id} on depth ${r.f} spawns, fights, dies, and drops loot`, JSON.stringify(r));
    }

    const saveOk = await page.evaluate(() => {
      window.__T.boot("warrior", "endless");
      window.__R.jumpFloor(15);
      const raw = window.__R.saveRun(window.__G());
      const g2 = window.__R.parseRun(typeof raw === "string" ? raw : (window.localStorage.getItem("dungeon-of-echoes-run-v1")));
      // saveRun may return boolean (LAST_SAVE). Fall back to storage via parse of current:
      const stored = window.localStorage.getItem("dungeon-of-echoes-run-v1");
      const loaded = window.__R.parseRun(stored);
      return {
        biome: loaded && loaded.biome,
        boss: loaded && (loaded.mons || []).find((m) => m.boss) && (loaded.mons || []).find((m) => m.boss).t,
        floor: loaded && loaded.floor,
      };
    });
    check(saveOk.biome === "mire" && saveOk.boss === "rotking" && saveOk.floor === 15, "saves keep new biome and Rotking spawn", JSON.stringify(saveOk));

    const pageErrs = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
    check(pageErrs.length === 0, "boss roster page errors", pageErrs.slice(0, 5).join(" | "));
  });
}


async function runCurses(browser) {
  await withPage(browser, async (page, errors) => {
    const r = await page.evaluate(() => {
      const R = window.__R;
      const mk = (uid, id, freed) => ({ uid, id, ident: true, bon: {}, freed: !!freed, ilvl: 4 });
      const bootBare = () => {
        window.__T.boot("warrior");
        const g = window.__G();
        for (const k of Object.keys(g.eq || {})) delete g.eq[k];
        g.inv = [];
        g.combat = null;
        g.buffs = g.buffs || {};
        g.buffs.dotT = 0;
        g.buffs.dotD = 0;
        return g;
      };

      // Merchant / liftCurses path: Blade of Agony (c_frail, -30% max HP, +20 ATK, +25 crit)
      let g = bootBare();
      const bare = R.full(g);
      g.eq.weapon = mk(8001, "x_agony", false);
      const cursed = R.full(g);
      const cursedLocked = R.locked(g.eq.weapon);
      const cursedFlag = R.isCursed(g.eq.weapon);
      const n = R.liftCurses(g);
      const lifted = R.full(g);
      const item = g.eq.weapon;
      const afterLift = {
        n,
        stillCursed: R.isCursed(item),
        locked: R.locked(item),
        curseOf: R.curseOf(item),
        curses: lifted.curses.slice(),
        maxHp: lifted.maxHp,
        atk: lifted.atk,
        crit: lifted.crit,
        def: lifted.def,
        bareHp: bare.maxHp,
        bareAtk: bare.atk,
        bareCrit: bare.crit,
        bareDef: bare.def,
        cursedHp: cursed.maxHp,
        cursedCurses: cursed.curses.slice(),
        cursedLocked,
        cursedFlag,
        hpRecovered: lifted.maxHp === bare.maxHp && lifted.maxHp > cursed.maxHp,
        atkKept: lifted.atk === bare.atk + 20,
        critKept: lifted.crit === bare.crit + 25,
        defUnchanged: lifted.def === bare.def,
        transferOk: R.srcBlockReason(g, item) === "Unequip the source item first.",
      };

      // Unequip, then transfer / salvage / sell should no longer treat it as cursed
      R.unequip(g, "weapon");
      const bag = g.inv.find((i) => i.uid === 8001);
      afterLift.inBag = !!bag;
      afterLift.bagCursed = bag ? R.isCursed(bag) : true;
      afterLift.salvageOk = bag ? R.canSalvage(g, bag) : false;
      afterLift.sellOk = bag ? R.canSellItem(g, bag) : false;
      afterLift.srcOk = bag ? R.srcBlockReason(g, bag) : "missing";

      // Scroll of Remove Curse path: Glassfang (c_brittle, DEF halved)
      g = bootBare();
      g.eq.weapon = mk(8002, "x_glass", false);
      const frailDef = R.full(g).def;
      const glassBare = (() => { const eq = g.eq.weapon; delete g.eq.weapon; const f = R.full(g); g.eq.weapon = eq; return f.def; })();
      g.inv.push({ uid: 8090, id: "c_uncurse", ident: true, bon: {}, freed: false, ilvl: 1 });
      const scrollRes = R.useConsumable(g, g.inv[0]);
      const afterScroll = R.full(g);
      const scroll = {
        res: scrollRes,
        used: !g.inv.some((i) => i.id === "c_uncurse"),
        cursed: R.isCursed(g.eq.weapon),
        locked: R.locked(g.eq.weapon),
        curses: afterScroll.curses.slice(),
        def: afterScroll.def,
        glassBare,
        frailDef,
        defRestored: afterScroll.def === glassBare && afterScroll.def > frailDef,
      };

      // Combat: Bloodthirster bleed stops after lift
      g = bootBare();
      g.hp = 200;
      g.eq.weapon = mk(8003, "x_blood", false);
      R.clamp(g);
      R.poke();
      const hp0 = g.hp;
      const fBleed = R.full(g);
      R.endRound(g);
      const hpAfterBleed = window.__G().hp;
      const bled = hpAfterBleed < hp0 && fBleed.curses.includes("c_bleed");
      const g2 = window.__G();
      const n2 = R.liftCurses(g2);
      const hpMid = g2.hp;
      R.endRound(g2);
      const hpAfterLift = window.__G().hp;
      const logs = (window.__G().log || []).map((l) => l.t);
      const bleedLogs = logs.filter((t) => /Bloodthirster drinks/i.test(t));
      const combat = {
        bled,
        n2,
        cursesAfter: R.full(window.__G()).curses.slice(),
        stillCursed: R.isCursed(window.__G().eq.weapon),
        hp0, hpAfterBleed, hpMid, hpAfterLift,
        noBleedAfterLift: hpAfterLift === hpMid,
        bleedLogCount: bleedLogs.length,
      };

      // Save / reload stays clean
      g = bootBare();
      g.eq.weapon = mk(8004, "x_agony", false);
      R.liftCurses(g);
      R.saveRun(g);
      const loaded = R.parseRun(window.localStorage.getItem("dungeon-of-echoes-run-v1"));
      const loadW = loaded && loaded.eq && loaded.eq.weapon;
      const saveReload = {
        ok: !!loaded,
        freed: loadW && loadW.freed === true,
        cursed: loadW ? R.isCursed(loadW) : true,
        locked: loadW ? R.locked(loadW) : true,
        curses: loaded ? R.full(loaded).curses.slice() : ["missing"],
      };

      // normInv migration: already-lifted keeps clean; genuine curse is untouched
      const migrated = R.normInv({ uid: 8010, id: "x_agony", ident: true, bon: {}, freed: true, ilvl: 4 });
      const genuine = R.normInv({ uid: 8011, id: "x_agony", ident: true, bon: {}, freed: false, ilvl: 4 });
      const missing = R.normInv({ uid: 8012, id: "x_agony", ident: true, bon: {}, ilvl: 4 });
      const migrate = {
        liftedFreed: migrated.freed === true && !R.isCursed(migrated) && !R.locked(migrated) && !R.curseOf(migrated),
        genuineCursed: genuine.freed === false && R.isCursed(genuine) && R.locked(genuine) && R.curseOf(genuine) === "c_frail",
        missingStillCursed: !missing.freed && R.isCursed(missing) && R.curseOf(missing) === "c_frail",
      };

      return { afterLift, scroll, combat, saveReload, migrate, bare, cursed, lifted };
    });

    check(r.afterLift.cursedFlag && r.afterLift.cursedLocked && r.afterLift.cursedCurses.includes("c_frail"), "curse is active before it is lifted", JSON.stringify({ flag: r.afterLift.cursedFlag, curses: r.afterLift.cursedCurses }));
    check(r.afterLift.n === 1 && r.afterLift.stillCursed === false && r.afterLift.locked === false && r.afterLift.curseOf === undefined && r.afterLift.curses.length === 0, "merchant lift fully strips the curse flag and lock", JSON.stringify(r.afterLift));
    check(r.afterLift.hpRecovered && r.afterLift.atkKept && r.afterLift.critKept && r.afterLift.defUnchanged, "lifted item stats match an equivalent uncursed item (bonuses kept, malus gone)", JSON.stringify({ maxHp: r.afterLift.maxHp, atk: r.afterLift.atk, crit: r.afterLift.crit, cursedHp: r.afterLift.cursedHp, bareHp: r.afterLift.bareHp }));
    check(r.afterLift.inBag && r.afterLift.bagCursed === false && r.afterLift.salvageOk && r.afterLift.sellOk && r.afterLift.srcOk === null, "lifted item can be salvaged, sold, and used as a Stat Transfer source", JSON.stringify({ salvage: r.afterLift.salvageOk, sell: r.afterLift.sellOk, src: r.afterLift.srcOk }));
    check(r.scroll.used && r.scroll.cursed === false && r.scroll.locked === false && r.scroll.curses.length === 0 && r.scroll.defRestored, "Scroll of Remove Curse fully strips the curse and restores DEF", JSON.stringify(r.scroll));
    check(r.combat.bled && r.combat.n2 === 1 && r.combat.noBleedAfterLift && r.combat.cursesAfter.length === 0 && r.combat.stillCursed === false && r.combat.bleedLogCount === 1, "curse combat ticks stop after a lift", JSON.stringify(r.combat));
    check(r.saveReload.ok && r.saveReload.freed && r.saveReload.cursed === false && r.saveReload.locked === false && r.saveReload.curses.length === 0, "save and reload keeps a lifted curse clean", JSON.stringify(r.saveReload));
    check(r.migrate.liftedFreed && r.migrate.genuineCursed && r.migrate.missingStillCursed, "normInv cleans already-lifted curses and leaves genuine curses alone", JSON.stringify(r.migrate));

    const pageErrs = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
    check(pageErrs.length === 0, "curse lift page errors", pageErrs.slice(0, 5).join(" | "));
  });
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
    process.stdout.write("\n== stat transfer ==\n");
    await runTransfer(browser);
    process.stdout.write("\n== shop sell details ==\n");
    await runShopSell(browser);
    process.stdout.write("\n== bosses ==\n");
    await runBosses(browser);
    process.stdout.write("\n== curse lift ==\n");
    await runCurses(browser);
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
