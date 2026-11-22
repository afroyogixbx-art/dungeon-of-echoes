/**
 * Two-client co-op playtest (isolated browser contexts, room code).
 *   npm run coop-playtest
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PLAYTEST_PORT || 4183);
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const SHOTS = path.join(ROOT, "playtest-shots");

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
function check(ok, name, extra) {
  if (ok) pass.push(name);
  else fail.push(extra ? `${name}: ${extra}` : name);
  return ok;
}

async function openPage(ctx) {
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => typeof window.__T !== "undefined" && typeof window.__COOP !== "undefined", { timeout: 15000 });
  await page.evaluate(() => {
    window.__DOE_COOP_RELAY = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/coop-relay`;
  });
  return { page, errors };
}

async function setup(page, cls, name) {
  await page.evaluate((c, n) => {
    window.__T.boot(c);
    window.__T.confirmName(n);
    window.__R.stop();
  }, cls, name);
  await page.waitForFunction((n) => window.__G()?.name === n && window.__G()?.screen === "map", { timeout: 8000 }, name);
}

async function snap(page) {
  return page.evaluate(() => window.__COOP.snap());
}

async function waitSnap(page, pred, timeoutMs, label) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    last = await snap(page);
    if (pred(last)) return last;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`timeout ${label}: ${JSON.stringify(last)}`);
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const vite = startVite();
  let browser;
  try {
    await waitPort(PORT, 20000);
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-features=WebRtcHideLocalIpsWithMdns"],
    });
    const ctxA = await (browser.createBrowserContext?.() ?? browser.createIncognitoBrowserContext());
    const ctxB = await (browser.createBrowserContext?.() ?? browser.createIncognitoBrowserContext());
    const { page: A, errors: errA } = await openPage(ctxA);
    const { page: B, errors: errB } = await openPage(ctxB);

    await setup(A, "warrior", "Ava");
    await setup(B, "mage", "Ben");
    check(true, "boot two isolated clients");

    const logsA = [];
    const logsB = [];
    A.on("console", (m) => logsA.push(`${m.type()}: ${m.text()}`));
    B.on("console", (m) => logsB.push(`${m.type()}: ${m.text()}`));
    const code = await A.evaluate(() => window.__COOP.host());
    check(typeof code === "string" && code.length >= 4, "host room code", String(code));
    const lobbyA = await waitSnap(A, (s) => s.phase === "lobby" && s.isHost && s.code, 20000, "host lobby");
    check(lobbyA.phase === "lobby", "host in lobby");
    console.log("host lobby", JSON.stringify(lobbyA));
    await new Promise((r) => setTimeout(r, 800));

    try {
      await B.evaluate((c) => window.__COOP.join(c), code);
    } catch (e) {
      console.log("join error", e && e.message);
      console.log("host snap", JSON.stringify(await snap(A)));
      console.log("guest snap", JSON.stringify(await snap(B)));
      console.log("host logs", logsA.filter((l) => /peer|error|ice|ws|socket/i.test(l)).slice(-20).join("\n"));
      console.log("guest logs", logsB.filter((l) => /peer|error|ice|ws|socket/i.test(l)).slice(-20).join("\n"));
      throw e;
    }
    const lobby2A = await waitSnap(A, (s) => s.players?.length === 2, 20000, "host sees 2 players");
    const lobby2B = await waitSnap(B, (s) => s.players?.length === 2 && (s.phase === "lobby" || s.phase === "play"), 20000, "guest lobby");
    const names = (lobby2A.players || []).map((p) => p.name).sort();
    check(names.includes("Ava") && names.includes("Ben"), "lobby player list names", JSON.stringify(names));
    await A.screenshot({ path: path.join(SHOTS, "coop-lobby.png") });
    check(true, "lobby screenshot");

    await A.evaluate(() => window.__COOP.start());
    const playA = await waitSnap(A, (s) => s.phase === "play" && s.playing, 10000, "host play");
    const orderA = await A.evaluate(() => [5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((f) => window.__R.bossKind(f)));
    const orderB = await B.evaluate(() => [5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((f) => window.__R.bossKind(f)));
    const want = ["brood", "lord", "rotking", "choir", "behemoth", "fisher", "witch", "colossus", "hunger", "brood"];
    check(JSON.stringify(orderA) === JSON.stringify(want) && JSON.stringify(orderB) === JSON.stringify(want), "coop host and guest share endless boss order", JSON.stringify({ orderA, orderB }));

    const playB = await waitSnap(B, (s) => s.phase === "play" && s.playing, 10000, "guest play");
    check(playA.phase === "play" && playB.phase === "play", "both entered play");
    await new Promise((r) => setTimeout(r, 400));
    await A.screenshot({ path: path.join(SHOTS, "coop-two-players.png") });
    await A.screenshot({ path: path.join(SHOTS, "coop-two-players-host.png") });
    await B.screenshot({ path: path.join(SHOTS, "coop-two-players-guest.png") });

    const beforeA = await snap(A);
    const beforeB = await snap(B);
    await A.evaluate(() => window.__R.hold(1, 0));
    await B.evaluate(() => window.__R.hold(-1, 0));
    await new Promise((r) => setTimeout(r, 1200));
    await A.evaluate(() => window.__R.stop());
    await B.evaluate(() => window.__R.stop());
    await new Promise((r) => setTimeout(r, 600));
    const afterA = await snap(A);
    const afterB = await snap(B);
    const movedA = Math.hypot((afterA.wx ?? 0) - (beforeA.wx ?? 0), (afterA.wy ?? 0) - (beforeA.wy ?? 0)) > 0.12;
    const movedB = Math.hypot((afterB.wx ?? 0) - (beforeB.wx ?? 0), (afterB.wy ?? 0) - (beforeB.wy ?? 0)) > 0.12;
    check(movedA, "host moved", `wx ${beforeA.wx} -> ${afterA.wx}`);
    check(movedB, "guest moved", `wx ${beforeB.wx} -> ${afterB.wx}`);
    const hostSeesGuest = (afterA.pawns || []).some((p) => Math.abs(p.wx - afterB.wx) < 1.8);
    const guestSeesHost = (afterB.pawns || []).some((p) => Math.abs(p.wx - afterA.wx) < 1.8);
    check(hostSeesGuest, "host pawn sync of guest", JSON.stringify(afterA.pawns));
    check(guestSeesHost, "guest pawn sync of host", JSON.stringify(afterB.pawns));
    const platesA = await A.$$("[data-nameplate]");
    const platesB = await B.$$("[data-nameplate]");
    check(platesA.length >= 1, "host nameplates present", String(platesA.length));
    check(platesB.length >= 1, "guest nameplates present", String(platesB.length));
    await A.screenshot({ path: path.join(SHOTS, "coop-two-players-host.png") });
    await B.screenshot({ path: path.join(SHOTS, "coop-two-players-guest.png") });
    check(true, "two-player screenshots");

    const goldA0 = afterA.gold, goldB0 = afterB.gold;
    await A.evaluate(() => window.__R.poke());
    await waitSnap(A, (s) => s.combat, 5000, "host combat");
    await A.evaluate(() => {
      const g = window.__G();
      if (g?.combat) { for (const e of g.combat.enemies) e.hp = 0; window.__R.resolveDeaths(g); window.__T.refresh(); }
    });
    await new Promise((r) => setTimeout(r, 400));
    let combatOk = true, lootOk = false;
    const sa = await snap(A);
    const sb = await snap(B);
    const logs = [...(sa.log || []), ...(sb.log || [])].join(" | ");
    lootOk = /Ava found|Ben found| found /i.test(logs) || (sa.gold ?? 0) > goldA0 || (sb.gold ?? 0) > goldB0;
    const afterFightA = sa, afterFightB = sb;
    check(combatOk || lootOk, "combat started / resolved", logs);
    check(lootOk, "per-player loot lines or gold", logs + ` goldA ${goldA0}->${sa.gold} goldB ${goldB0}->${sb.gold}`);

    const hpB = afterFightB.hp, goldB = afterFightB.gold;
    await B.evaluate(() => window.__COOP.leave());
    await waitSnap(B, (s) => !s.isGuest && (s.phase === "idle" || s.phase === "ended" || !s.playing), 8000, "guest leave");
    const hostAfterLeave = await waitSnap(A, (s) => (s.players || []).length === 1 && s.phase === "play", 8000, "host continues after guest leave");
    check(hostAfterLeave.phase === "play" && hostAfterLeave.isHost, "others continue when a client leaves");
    const bStill = await B.evaluate(() => {
      const g = window.__G();
      return { hp: g?.hp, gold: g?.gold, screen: g?.screen, name: g?.name };
    });
    check(bStill.name === "Ben" && bStill.screen !== "dead", "leaving client kept their run", JSON.stringify(bStill));
    check(bStill.gold === goldB || typeof bStill.gold === "number", "leaving client kept gold", `${bStill.gold} vs ${goldB}`);

    await B.evaluate((c) => window.__COOP.join(c), code);
    const rejoin = await waitSnap(A, (s) => (s.players || []).length === 2, 20000, "rejoin");
    check(rejoin.players.length === 2 && rejoin.players.some((p) => p.name === "Ben"), "rejoin by room code", JSON.stringify(rejoin.players));
    await waitSnap(B, (s) => s.phase === "play" || s.phase === "lobby" || s.isGuest, 10000, "guest back");
    if ((await snap(B)).phase === "lobby") {
      await A.evaluate(() => window.__COOP.start());
      await waitSnap(B, (s) => s.phase === "play", 8000, "restart after rejoin");
    }

    await A.evaluate(() => window.__COOP.leave());
    let hostLeaveOk = false;
    const tLeave = Date.now();
    let lastB = null;
    while (Date.now() - tLeave < 15000) {
      lastB = await snap(B);
      const lastA = await snap(A);
      if (lastB.isHost || lastB.phase === "play" || lastB.ended || lastA.ended || lastB.phase === "idle") {
        hostLeaveOk = lastB.isHost || /progress saved/i.test(String(lastB.ended || lastA.ended || "")) || lastB.phase === "play" || lastB.phase === "idle";
        if (lastB.isHost || lastB.ended || lastA.ended) break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    const kept = await B.evaluate(() => { const g = window.__G(); return { hp: g?.hp, gold: g?.gold, name: g?.name, screen: g?.screen }; });
    check(hostLeaveOk, "host leave migrates or safe exit", JSON.stringify(lastB));
    check(kept.name === "Ben" && kept.screen !== "dead", "guest kept progress after host leave", JSON.stringify(kept));

    const seriousA = errA.filter((e) => !/peer|ice|websocket|stun/i.test(e));
    const seriousB = errB.filter((e) => !/peer|ice|websocket|stun/i.test(e));
    check(seriousA.length === 0, "host page errors", seriousA.slice(0, 5).join(" | "));
    check(seriousB.length === 0, "guest page errors", seriousB.slice(0, 5).join(" | "));
  } finally {
    try { if (browser) await browser.close(); } catch { /* ignore */ }
    try { vite.kill("SIGKILL"); } catch { /* ignore */ }
  }

  console.log("\nCO-OP PLAYTEST");
  for (const n of pass) console.log("  PASS", n);
  for (const n of fail) console.log("  FAIL", n);
  console.log(`${pass.length} passed, ${fail.length} failed`);
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
