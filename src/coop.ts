/**
 * Free WebRTC co-op over the public PeerJS broker (0.peerjs.com).
 * No paid server. Host-authoritative; 2–4 players; room code.
 */
import Peer, { type DataConnection, type PeerJSOption } from "peerjs";

export const COOP_MAX = 4;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PID_KEY = "doe-coop-pid";
const PREFIX = "doe7-";

export function makeRoomCode(): string {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[a[i] % CODE_CHARS.length];
  return s;
}
export function normCode(s: string): string {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
export function roomPeerId(code: string): string {
  return PREFIX + normCode(code).toLowerCase();
}
export function devicePid(): string {
  try {
    let id = localStorage.getItem(PID_KEY);
    if (id && id.length >= 8) return id;
    id = "p-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(PID_KEY, id);
    return id;
  } catch {
    return "p-" + Math.random().toString(36).slice(2, 12);
  }
}
export function hpMult(n: number): number { return n <= 1 ? 1 : 1 + 0.35 * (n - 1); }
export function atkMult(n: number): number { return n <= 1 ? 1 : 1 + 0.2 * (n - 1); }

/** Extra ICE from a free Metered/Cloudflare account, if the player set one. No paid keys are shipped. */
function extraIce(): RTCIceServer[] {
  const out: RTCIceServer[] = [];
  const read = (raw: unknown): void => {
    if (!raw) return;
    try {
      const v = typeof raw === "string" ? JSON.parse(raw) : raw;
      const list = Array.isArray(v) ? v : [v];
      for (const s of list) if (s && typeof s === "object" && (s as RTCIceServer).urls) out.push(s as RTCIceServer);
    } catch { /* ignore */ }
  };
  try {
    const w = window as unknown as { __DOE_ICE?: unknown };
    read(w.__DOE_ICE);
  } catch { /* ignore */ }
  try { read(localStorage.getItem("doe-ice")); } catch { /* ignore */ }
  return out;
}

/** Free public STUN + PeerJS cloud TURN (username/password published by PeerJS). Open Relay's old shared static login is retired. */
export const PUBLIC_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:openrelay.metered.ca:80" },
  { urls: ["turn:eu-0.turn.peerjs.com:3478", "turn:us-0.turn.peerjs.com:3478"], username: "peerjs", credential: "peerjsp" },
  { urls: "turn:eu-0.turn.peerjs.com:3478?transport=tcp", username: "peerjs", credential: "peerjsp" },
  { urls: "turn:us-0.turn.peerjs.com:3478?transport=tcp", username: "peerjs", credential: "peerjsp" },
];

export function iceServers(): RTCIceServer[] { return [...PUBLIC_ICE, ...extraIce()]; }

export function peerOpts(): PeerJSOption {
  // Public PeerJS cloud defaults: broker at 0.peerjs.com plus that cloud's
  // published STUN/TURN (still free, no server of our own).
  return {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    key: "peerjs",
    secure: true,
    debug: 0,
    config: { iceServers: iceServers() },
  };
}

export interface CoopPlayer {
  pid: string;
  name: string;
  cls: string;
  lvl: number;
  isHost: boolean;
  held?: boolean;
  rtt?: number;
}
export const COOP_PROTO = 3;
export const POS_HZ = 18;
export const INTERP_MS = 100;
export const INTERP_MIN = 80;
export const INTERP_MAX = 220;
export const TELEPORT_TILES = 2.5; // kept as a soft-correction threshold; hard snaps are floor/stairs only
export const EXTRAP_MS = 40;
export const STOP_SPEED = 0.2;
export const HOLD_MS = 15000;
export const PING_MS = 500;

export function interpDelay(rtt = 0, jitter = 0): number {
  const packet = 1000 / POS_HZ;
  return Math.max(INTERP_MIN, Math.min(INTERP_MAX, packet * 1.5 + Math.max(0, jitter) * 2 + 16));
}

export interface CoopInput {
  mx: number; my: number; atk: boolean; dodge: boolean; drink: boolean; abil: number; seq: number;
}
export interface CoopPawn {
  pid: string; name: string; cls: string; lvl: number; wx: number; wy: number;
  hp: number; maxHp: number; mp: number; maxMp: number; host?: boolean;
}
export type CoopEventKind = "join" | "leave" | "loot" | "sys";
export type CoopAnim = "idle" | "walk" | "atk" | "dodge";
export interface CoopPos {
  typ: "pos"; v: number; t: number; pid: string;
  x: number; y: number; vx: number; vy: number;
  face: number; mv: boolean; an: CoopAnim; fl?: number; wk?: string; warp?: boolean;
}
export interface CoopPosUnit {
  k: "p" | "e" | "m"; pid?: string; id?: number;
  x: number; y: number; vx: number; vy: number;
  face?: number; mv?: boolean; an?: CoopAnim; fl?: number; wk?: string; warp?: boolean;
}
export interface CoopPosBatch { typ: "posb"; v: number; t: number; p: CoopPosUnit[] }
export type CoopActKind = "atk" | "dodge" | "abil" | "hit" | "die" | "burst";
export interface CoopAct {
  typ: "act"; v: number; t: number; pid: string; k: CoopActKind;
  dir?: number; tid?: number; ab?: string; face?: number; wk?: string;
  txt?: string; col?: string; x?: number; y?: number; dmg?: number;
}
export type CoopMsg =
  | { typ: "hello"; pid: string; name: string; cls: string; lvl: number; hero?: unknown; rejoin?: boolean; proto?: number }
  | { typ: "welcome"; pid: string; code: string; hostPid: string; players: CoopPlayer[]; playing: boolean; proto?: number }
  | { typ: "full" }
  | { typ: "reject"; reason: string }
  | { typ: "players"; players: CoopPlayer[] }
  | { typ: "event"; text: string; kind: CoopEventKind }
  | { typ: "input"; inp: CoopInput }
  | { typ: "state"; st: unknown }
  | CoopPos
  | CoopPosBatch
  | CoopAct
  | { typ: "enter" }
  | { typ: "leave"; pid: string; name: string }
  | { typ: "migrate"; newHostPid: string }
  | { typ: "ended"; reason: string }
  | { typ: "loot-you"; drops: unknown; pots: number; gold: number; xp: number; text: string }
  | { typ: "ping"; n: number; t: number }
  | { typ: "pong"; n: number; t: number; t2: number };


function relayUrl(): string | null {
  try {
    const w = window as unknown as { __DOE_COOP_RELAY?: string };
    if (typeof w.__DOE_COOP_RELAY === "string" && w.__DOE_COOP_RELAY) return w.__DOE_COOP_RELAY;
    const q = new URLSearchParams(location.search).get("coopRelay");
    if (q) return q;
  } catch { /* ignore */ }
  return null;
}

interface RelaySock { send(msg: unknown): void; close(): void; open: boolean; peer: string; }

export type CoopPhase = "idle" | "connecting" | "lobby" | "play" | "migrate" | "ended";

export interface CoopHandlers {
  onChange?: () => void;
  onEvent?: (text: string, kind: CoopEventKind) => void;
  onState?: (st: unknown) => void;
  onInput?: (pid: string, inp: CoopInput) => void;
  onHello?: (pid: string, msg: Extract<CoopMsg, { typ: "hello" }>) => string | null;
  onLeave?: (pid: string, name: string) => void;
  onEnded?: (reason: string) => void;
  onBecomeHost?: () => void;
  onLoot?: (payload: Extract<CoopMsg, { typ: "loot-you" }>) => void;
  onPos?: (msg: CoopPos | CoopPosBatch) => void;
  onAct?: (msg: CoopAct) => void;
  hello?: () => Extract<CoopMsg, { typ: "hello" }>;
}

export interface PosSnap {
  t: number; recv: number; local?: number;
  x: number; y: number; vx: number; vy: number;
  face: number; mv: boolean; an: CoopAnim; fl?: number; wk?: string;
  warp?: boolean;
}
export interface SampledPos {
  x: number; y: number; face: number; mv: boolean; an: CoopAnim; fl?: number; wk?: string;
  snapped: boolean; stopped: boolean; underrun?: boolean;
}
export type SnapWhy = "floor" | "stairs" | "unexpected";
export interface SnapEvent { t: number; why: SnapWhy; key: string; dist: number; x: number; y: number; note?: string }
export const SNAP_LOG: SnapEvent[] = [];
export function clearSnapLog(): void { SNAP_LOG.length = 0; }
export function logSnap(e: Omit<SnapEvent, "t"> & { t?: number }): void {
  SNAP_LOG.push({ t: e.t ?? (typeof performance !== "undefined" ? performance.now() : 0), ...e });
}

export function stampOf(s: PosSnap): number { return s.local ?? s.recv; }

/** Accept a snapshot. Drops stale/out-of-order sender timestamps. Hard-warps only on floor change or an explicit stairs warp. */
export function pushSnap(buf: PosSnap[], s: PosSnap, cap = 16): boolean {
  const prev = buf[buf.length - 1];
  const floorCh = !!(prev && s.fl != null && prev.fl != null && s.fl !== prev.fl);
  const warp = !!(s.warp || floorCh);
  if (prev && !warp && s.t <= prev.t) return false;
  if (warp) {
    const dist = prev ? Math.hypot(s.x - prev.x, s.y - prev.y) : 0;
    buf.length = 0;
    s = { ...s, warp: true };
    logSnap({ why: floorCh ? "floor" : "stairs", key: "track", dist, x: s.x, y: s.y });
  }
  buf.push(s);
  if (buf.length > cap) buf.splice(0, buf.length - cap);
  return true;
}

export function sampleTrack(buf: PosSnap[], now: number, delay = INTERP_MS): SampledPos | null {
  if (!buf.length) return null;
  const rt = now - delay;
  let i = 0;
  while (i < buf.length && stampOf(buf[i]) < rt) i++;
  const right = buf[i];
  const left = buf[i - 1];
  const pack = (s: PosSnap, extra: Partial<SampledPos>): SampledPos => ({
    x: s.x, y: s.y, face: s.face, mv: s.mv, an: s.an, fl: s.fl, wk: s.wk, snapped: !!s.warp, stopped: !s.mv, ...extra,
  });
  if (!left && right) return pack(right, { stopped: !right.mv });
  if (left && !right) {
    const spd = Math.hypot(left.vx, left.vy);
    if (!left.mv || spd < STOP_SPEED) return pack(left, { mv: false, an: left.an === "atk" || left.an === "dodge" ? left.an : "idle", stopped: true, underrun: true });
    const ahead = Math.min(EXTRAP_MS, Math.max(0, rt - stampOf(left))) / 1000;
    return { x: left.x + left.vx * ahead, y: left.y + left.vy * ahead, face: left.face, mv: true, an: left.an === "idle" ? "walk" : left.an, fl: left.fl, wk: left.wk, snapped: false, stopped: false, underrun: true };
  }
  const floorCh = !!(right.fl != null && left.fl != null && right.fl !== left.fl);
  if (floorCh || right.warp) return pack(right, { snapped: true, stopped: !right.mv });
  const span = Math.max(1, stampOf(right) - stampOf(left));
  const u = Math.max(0, Math.min(1, (rt - stampOf(left)) / span));
  const x = left.x + (right.x - left.x) * u;
  const y = left.y + (right.y - left.y) * u;
  const arrived = u >= 1 - 1e-6;
  const stopped = !right.mv && arrived;
  const moving = stopped ? false : !!(left.mv || right.mv) && !( !right.mv && u > 0.92 );
  let an: CoopAnim = u < 0.5 ? left.an : right.an;
  if (stopped) an = right.an === "atk" || right.an === "dodge" ? right.an : "idle";
  else if (moving && an === "idle") an = "walk";
  const face = right.face || left.face || 1;
  return { x, y, face, mv: moving, an, fl: right.fl ?? left.fl, wk: right.wk || left.wk, snapped: false, stopped };
}

export const REFRESH_MSG = "Your friend needs to refresh the page to get the movement update — both of you should reload.";

class Session {
  role: "host" | "guest" | null = null;
  phase: CoopPhase = "idle";
  code = "";
  pid = devicePid();
  players: CoopPlayer[] = [];
  playing = false;
  err = "";
  ended = "";
  peer: Peer | null = null;
  conns = new Map<string, DataConnection>(); // pid -> conn
  hostConn: DataConnection | null = null;
  pending = new Map<string, DataConnection>();
  lastInput = new Map<string, CoopInput>();
  pawns: CoopPawn[] = [];
  handlers: CoopHandlers = {};
  lastHostAt = 0;
  posConns = new Map<string, DataConnection>();
  posHost: DataConnection | null = null;
  theirProto = 0;
  protoWarn = false;
  bytesPos = 0;
  bytesState = 0;
  statT0 = 0;
  watch: number | null = null;
  relay: WebSocket | null = null;
  relayHostId = "";
  relayFakes = new Map<string, RelaySock>();
  link: "idle" | "connecting" | "retrying" | "relay" | "connected" | "failed" = "idle";
  linkText = "";
  attempt = 0;
  lastJoin: { code: string; hello: Extract<CoopMsg, { typ: "hello" }> } | null = null;
  userLeave = false;
  autoRejoin = false;
  hostPid = "";
  held = new Map<string, number>();
  clocks = new Map<string, { offset: number; rtt: number; jitter: number }>();
  net: { rtt: number; jitter: number; loss: number } | null = null;
  pingN = 0;
  wantPlay = false;

  bump(): void { this.handlers.onChange?.(); }

  setHandlers(h: CoopHandlers): void { this.handlers = h; }

  noteBytes(kind: "pos" | "state", raw: unknown): void {
    if (!this.statT0) this.statT0 = performance.now();
    let n = 0;
    try { n = typeof raw === "string" ? raw.length : JSON.stringify(raw).length; } catch { n = 64; }
    if (kind === "pos") this.bytesPos += n; else this.bytesState += n;
  }
  stats(): { posBps: number; stateBps: number; dt: number; proto: number; theirProto: number; protoWarn: boolean; fast: boolean } {
    const dt = Math.max(0.001, (performance.now() - (this.statT0 || performance.now())) / 1000);
    return {
      posBps: this.bytesPos / dt, stateBps: this.bytesState / dt, dt,
      proto: COOP_PROTO, theirProto: this.theirProto, protoWarn: this.protoWarn,
      fast: !!(this.posHost?.open || [...this.posConns.values()].some((c) => c.open)),
    };
  }
  resetStats(): void { this.bytesPos = 0; this.bytesState = 0; this.statT0 = performance.now(); }

  simulateNet(cfg: { rtt: number; jitter: number; loss: number } | null): void { this.net = cfg; }
  pings(): Array<{ pid: string; rtt: number; jitter: number }> {
    return [...this.clocks.entries()].map(([pid, c]) => ({ pid, rtt: Math.round(c.rtt), jitter: Math.round(c.jitter) }));
  }
  rttOf(pid: string): number { return this.clocks.get(pid)?.rtt ?? 0; }
  jitterOf(pid: string): number { return this.clocks.get(pid)?.jitter ?? 0; }
  offsetFor(pid: string): number { return this.clocks.get(pid)?.offset ?? 0; }
  hasClock(pid: string): boolean { return this.clocks.has(pid); }
  interpMs(pid?: string): number {
    if (pid) return interpDelay(this.rttOf(pid), this.jitterOf(pid));
    let rtt = 0, jit = 0;
    for (const c of this.clocks.values()) { rtt = Math.max(rtt, c.rtt); jit = Math.max(jit, c.jitter); }
    return interpDelay(rtt, jit);
  }
  linkStatus(): { link: Session["link"]; text: string; attempt: number; canRetry: boolean } {
    return { link: this.link, text: this.linkText || this.linkLabel(), attempt: this.attempt, canRetry: this.link === "failed" && !!this.lastJoin };
  }
  linkLabel(): string {
    if (this.link === "relay") return "Trying relay…";
    if (this.link === "retrying") return "Connecting… retrying";
    if (this.link === "connected") return "Connected";
    if (this.link === "failed") return "Failed";
    if (this.link === "connecting") return "Connecting…";
    return "";
  }
  setLink(link: Session["link"], text = ""): void {
    this.link = link; this.linkText = text || this.linkLabel(); this.bump();
  }

  private deferSend(kind: "ctrl" | "data", fn: () => void): void {
    const n = this.net;
    if (!n) { fn(); return; }
    if (kind === "data" && n.loss > 0 && Math.random() < n.loss) return;
    const delay = Math.max(0, n.rtt / 2 + (Math.random() * 2 - 1) * n.jitter);
    if (delay < 1) { fn(); return; }
    window.setTimeout(fn, delay);
  }

  private startWatch(): void {
    if (this.watch) window.clearInterval(this.watch);
    this.watch = window.setInterval(() => this.tickWatch(), PING_MS);
  }
  private tickWatch(): void {
    if (this.peer && this.peer.disconnected) {
      try { this.peer.reconnect(); } catch { /* ignore */ }
    }
    const now = Date.now();
    if (this.isHost()) {
      for (const [pid, until] of [...this.held]) {
        if (now >= until) {
          this.held.delete(pid);
          const pl = this.players.find((p) => p.pid === pid);
          this.players = this.players.filter((p) => p.pid !== pid);
          if (pl) {
            this.event(`${pl.name} left`, "leave");
            this.broadcast({ typ: "players", players: this.players });
            this.handlers.onLeave?.(pid, pl.name);
          }
          this.bump();
        }
      }
      for (const pid of this.conns.keys()) this.sendPingTo(pid);
    } else if (this.isGuest() && (this.hostConn?.open || (this.relay && this.relay.readyState === WebSocket.OPEN))) {
      this.sendPingTo(this.hostPid || "host");
    }
  }
  private sendPingTo(pid: string): void {
    const msg: CoopMsg = { typ: "ping", n: ++this.pingN, t: performance.now() };
    if (this.isGuest()) this.deferSend("ctrl", () => {
      if (this.relay && this.relay.readyState === WebSocket.OPEN) {
        try { this.relay.send(JSON.stringify({ typ: "data", to: this.relayHostId || "host", data: msg })); } catch { /* ignore */ }
      } else if (this.hostConn?.open) {
        try { this.hostConn.send(msg); } catch { /* ignore */ }
      }
    });
    else this.deferSend("ctrl", () => { this.sendToRaw(pid, msg); });
  }
  private sendToRaw(pid: string, msg: CoopMsg): void {
    if (this.relay && this.relay.readyState === WebSocket.OPEN) {
      const dest = (pid === "host" && this.relayHostId) ? this.relayHostId : pid;
      try { this.relay.send(JSON.stringify({ typ: "data", to: dest, data: msg })); } catch { /* ignore */ }
      return;
    }
    const c = this.conns.get(pid);
    try { if (c?.open) c.send(msg); } catch { /* ignore */ }
  }
  private onPing(from: string, msg: Extract<CoopMsg, { typ: "ping" }>): void {
    const pong: CoopMsg = { typ: "pong", n: msg.n, t: msg.t, t2: performance.now() };
    if (this.isGuest()) {
      this.deferSend("ctrl", () => {
        if (this.relay && this.relay.readyState === WebSocket.OPEN) {
          try { this.relay.send(JSON.stringify({ typ: "data", to: this.relayHostId || "host", data: pong })); } catch { /* ignore */ }
        } else if (this.hostConn?.open) {
          try { this.hostConn.send(pong); } catch { /* ignore */ }
        }
      });
    } else this.deferSend("ctrl", () => this.sendToRaw(from, pong));
  }
  private onPong(from: string, msg: Extract<CoopMsg, { typ: "pong" }>): void {
    const now = performance.now();
    const rtt = Math.max(0, now - msg.t);
    const offset = msg.t2 - msg.t - rtt / 2;
    const prev = this.clocks.get(from);
    const jitter = prev ? Math.abs(rtt - prev.rtt) * 0.25 + prev.jitter * 0.75 : 0;
    const ema = prev ? prev.rtt * 0.6 + rtt * 0.4 : rtt;
    const off = prev ? prev.offset * 0.6 + offset * 0.4 : offset;
    this.clocks.set(from, { offset: off, rtt: ema, jitter });
    const pl = this.players.find((p) => p.pid === from);
    if (pl) pl.rtt = Math.round(ema);
  }

  private markProto(v?: number): void {
    const n = typeof v === "number" ? v : 1;
    this.theirProto = n;
    if (n < COOP_PROTO && !this.protoWarn) {
      this.protoWarn = true;
      this.handlers.onEvent?.(REFRESH_MSG, "sys");
    }
  }

  sendFast(msg: CoopPos | CoopPosBatch): void {
    this.noteBytes("pos", msg);
    this.deferSend("data", () => {
      if (this.relay && this.relay.readyState === WebSocket.OPEN) {
        try { this.relay.send(JSON.stringify({ typ: "data", to: this.isHost() ? "*" : (this.relayHostId || "host"), data: msg })); } catch { /* ignore */ }
        return;
      }
      const trySend = (c: DataConnection | null | undefined, fallback?: DataConnection | null): void => {
        const dest = c?.open ? c : (fallback?.open ? fallback : null);
        if (!dest) return;
        try { dest.send(msg); } catch { /* ignore */ }
      };
      if (this.isGuest()) { trySend(this.posHost, this.hostConn); return; }
      if (this.isHost()) {
        for (const [pid, rel] of this.conns) trySend(this.posConns.get(pid), rel);
      }
    });
  }

  active(): boolean { return this.phase !== "idle" && this.phase !== "ended"; }
  isHost(): boolean { return this.role === "host" && this.active(); }
  isGuest(): boolean { return this.role === "guest" && this.active(); }
  partyN(): number { return this.active() ? Math.max(1, this.players.length) : 1; }

  broadcast(msg: CoopMsg, exceptPid?: string): void {
    const kind = (msg.typ === "state" || msg.typ === "pos" || msg.typ === "posb" || msg.typ === "input") ? "data" : "ctrl";
    this.deferSend(kind, () => {
      if (this.relay && this.relay.readyState === WebSocket.OPEN) {
        try { this.relay.send(JSON.stringify({ typ: "data", to: "*", except: exceptPid || "", data: msg })); } catch { /* ignore */ }
        return;
      }
      for (const [pid, c] of this.conns) {
        if (exceptPid && pid === exceptPid) continue;
        try { if (c.open) c.send(msg); } catch { /* ignore */ }
      }
    });
  }
  sendTo(pid: string, msg: CoopMsg): void {
    const kind = (msg.typ === "state" || msg.typ === "pos" || msg.typ === "posb" || msg.typ === "input") ? "data" : "ctrl";
    this.deferSend(kind, () => this.sendToRaw(pid, msg));
  }
  event(text: string, kind: CoopEventKind): void {
    this.handlers.onEvent?.(text, kind);
    if (this.isHost()) this.broadcast({ typ: "event", text, kind });
  }

  takeInput(pid: string): CoopInput | undefined {
    const v = this.lastInput.get(pid);
    if (v) this.lastInput.set(pid, { ...v, dodge: false, drink: false, abil: -1 });
    return v;
  }

  private wireConn(conn: DataConnection, pidHint?: string): void {
    conn.on("data", (raw: unknown) => this.onData(conn, raw, pidHint));
    conn.on("close", () => this.onConnClose(conn));
    conn.on("error", () => this.onConnClose(conn));
  }

  private pidOf(conn: DataConnection): string | undefined {
    for (const [pid, c] of this.conns) if (c === conn) return pid;
    for (const [pid, c] of this.pending) if (c === conn) return pid;
    return undefined;
  }

  private onConnClose(conn: DataConnection): void {
    const pid = this.pidOf(conn);
    if (pid) {
      this.conns.delete(pid);
      this.pending.delete(pid);
      this.posConns.delete(pid);
      const pl = this.players.find((p) => p.pid === pid);
      if (this.isHost() && pl && !pl.isHost) {
        const intentional = this.lastInput.has("__leave_" + pid) || false;
        if (intentional || this.userLeave) {
          this.players = this.players.filter((p) => p.pid !== pid);
          this.held.delete(pid);
          this.event(`${pl.name} left`, "leave");
          this.broadcast({ typ: "players", players: this.players });
          this.handlers.onLeave?.(pid, pl.name);
        } else {
          pl.held = true;
          this.held.set(pid, Date.now() + HOLD_MS);
          this.lastInput.set(pid, { mx: 0, my: 0, atk: false, dodge: false, drink: false, abil: -1, seq: 0 });
          this.event(`${pl.name} lost connection — holding their slot…`, "sys");
          this.broadcast({ typ: "players", players: this.players });
        }
      }
      this.bump();
    }
    if (this.role === "guest" && conn === this.hostConn) {
      this.hostConn = null;
      if (this.phase === "migrate" || this.userLeave) return;
      void this.tryAutoRejoin();
    }
  }

  private onData(conn: DataConnection, raw: unknown, pidHint?: string): void {
    const msg = raw as CoopMsg;
    if (!msg || typeof msg !== "object" || !("typ" in msg)) return;
    if (this.role === "host") this.hostHandle(conn, msg, pidHint);
    else this.guestHandle(msg);
  }

  private hostHandle(conn: DataConnection, msg: CoopMsg, pidHint?: string): void {
    if (msg.typ === "hello") {
      this.markProto(msg.proto);
      if (this.players.length >= COOP_MAX && !this.players.some((p) => p.pid === msg.pid)) {
        try { conn.send({ typ: "full" }); } catch { /* ignore */ }
        conn.close();
        return;
      }
      const reject = this.handlers.onHello?.(msg.pid, msg);
      if (reject) {
        try { conn.send({ typ: "reject", reason: reject }); } catch { /* ignore */ }
        conn.close();
        return;
      }
      const existing = this.players.find((p) => p.pid === msg.pid);
      this.conns.set(msg.pid, conn);
      this.pending.delete(msg.pid);
      if (!existing) {
        this.players.push({ pid: msg.pid, name: msg.name, cls: msg.cls, lvl: msg.lvl, isHost: false });
        this.event(`${msg.name} joined`, "join");
      } else {
        existing.name = msg.name; existing.cls = msg.cls; existing.lvl = msg.lvl;
        existing.held = false;
        this.held.delete(msg.pid);
        this.event(`${msg.name} rejoined`, "join");
      }
      try {
        conn.send({ typ: "welcome", pid: msg.pid, code: this.code, hostPid: this.pid, players: this.players, playing: this.playing, proto: COOP_PROTO });
      } catch { /* ignore */ }
      this.broadcast({ typ: "players", players: this.players }, msg.pid);
      this.bump();
      return;
    }
    if (msg.typ === "pos" || msg.typ === "posb") {
      this.handlers.onPos?.(msg);
      const except = msg.typ === "pos" ? msg.pid : (this.pidOf(conn) || pidHint);
      this.broadcast(msg, except);
      return;
    }
    if (msg.typ === "act") {
      this.handlers.onAct?.(msg);
      this.broadcast(msg, msg.pid);
      return;
    }
    const pid = this.pidOf(conn) || pidHint;
    if (msg.typ === "ping" && pid) { this.onPing(pid, msg); return; }
    if (msg.typ === "pong" && pid) { this.onPong(pid, msg); return; }
    if (!pid) return;
    if (msg.typ === "input") this.lastInput.set(pid, msg.inp);
    if (msg.typ === "leave") {
      this.lastInput.set("__leave_" + pid, { mx: 0, my: 0, atk: false, dodge: false, drink: false, abil: -1, seq: 0 });
      conn.close();
      this.onConnClose(conn);
    }
    if (msg.typ === "enter") this.playing = true;
  }

  private guestHandle(msg: CoopMsg): void {
    if (msg.typ === "welcome") {
      this.markProto(msg.proto);
      this.hostPid = msg.hostPid || this.hostPid;
      this.phase = msg.playing ? "play" : "lobby";
      this.playing = msg.playing;
      this.players = msg.players;
      this.err = "";
      this.link = "connected";
      this.linkText = "Connected";
      this.lastHostAt = Date.now();
      this.startWatch();
      this.bump();
      return;
    }
    if (msg.typ === "pos" || msg.typ === "posb") {
      this.lastHostAt = Date.now();
      this.handlers.onPos?.(msg);
      return;
    }
    if (msg.typ === "act") { this.handlers.onAct?.(msg); return; }
    if (msg.typ === "ping") { this.onPing(this.hostPid || "host", msg); return; }
    if (msg.typ === "pong") { this.onPong(this.hostPid || "host", msg); return; }
    if (msg.typ === "full") { this.failSafe("The room is full (max 4)."); return; }
    if (msg.typ === "reject") { this.failSafe(msg.reason || "Join rejected."); return; }
    if (msg.typ === "players") { this.players = msg.players; this.bump(); return; }
    if (msg.typ === "event") { this.handlers.onEvent?.(msg.text, msg.kind); return; }
    if (msg.typ === "state") {
      this.lastHostAt = Date.now();
      if (this.phase === "lobby" && this.playing) this.phase = "play";
      if (this.playing) this.phase = "play";
      this.handlers.onState?.(msg.st);
      return;
    }
    if (msg.typ === "loot-you") { this.handlers.onLoot?.(msg); return; }
    if (msg.typ === "ended") { this.failSafe(msg.reason); return; }
    if (msg.typ === "migrate") {
      if (msg.newHostPid === this.pid) void this.claimHost();
      else void this.rejoinAfterMigrate();
      return;
    }
  }

  async hostRoom(player: { name: string; cls: string; lvl: number }, alreadyPlaying = false): Promise<string> {
    await this.destroyPeer();
    this.pid = devicePid();
    this.role = "host";
    this.phase = "connecting";
    this.err = "";
    this.ended = "";
    this.playing = alreadyPlaying;
    this.players = [{ pid: this.pid, name: player.name, cls: player.cls, lvl: player.lvl, isHost: true }];
    this.conns.clear();
    this.bump();
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = makeRoomCode();
      const ok = await this.listenAsHost(code);
      if (ok) {
        this.code = code;
        this.phase = alreadyPlaying ? "play" : "lobby";
        if (alreadyPlaying) this.playing = true;
        this.link = "connected";
        this.linkText = "Connected";
        this.startWatch();
        this.bump();
        return code;
      }
    }
    this.role = null;
    this.phase = "idle";
    this.err = "Could not open a room. Try again.";
    this.bump();
    throw new Error(this.err);
  }

  private listenAsHost(code: string): Promise<boolean> {
    const url = relayUrl();
    if (url) return this.listenRelay(code, url);
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok: boolean): void => { if (settled) return; settled = true; resolve(ok); };
      const peer = new Peer(roomPeerId(code), peerOpts());
      this.peer = peer;
      const t = window.setTimeout(() => { if (!settled) { try { peer.destroy(); } catch { /* ignore */ } done(false); } }, 8000);
      peer.on("open", () => { window.clearTimeout(t); done(true); });
      peer.on("error", (e: { type?: string }) => {
        if (e?.type === "unavailable-id" || e?.type === "peer-unavailable") { window.clearTimeout(t); try { peer.destroy(); } catch { /* ignore */ } done(false); return; }
        if (!settled) { window.clearTimeout(t); done(false); }
      });
      peer.on("connection", (conn) => {
        const meta = (conn.metadata || {}) as { ch?: string; pid?: string; proto?: number };
        if (meta.ch === "pos") {
          const bind = (): void => { if (meta.pid) this.posConns.set(meta.pid, conn); };
          if (conn.open) bind(); else conn.on("open", bind);
          conn.on("data", (raw: unknown) => this.onData(conn, raw, meta.pid));
          conn.on("close", () => { if (meta.pid) this.posConns.delete(meta.pid); });
          conn.on("error", () => { if (meta.pid) this.posConns.delete(meta.pid); });
          return;
        }
        this.wireConn(conn);
        this.pending.set(conn.peer, conn);
      });
      peer.on("disconnected", () => { try { peer.reconnect(); } catch { /* ignore */ } });
    });
  }

  async joinRoom(code: string, hello: Extract<CoopMsg, { typ: "hello" }>): Promise<void> {
    const c = normCode(code);
    if (c.length < 4) throw new Error("Enter a valid room code.");
    this.lastJoin = { code: c, hello };
    this.userLeave = false;
    this.pid = hello.pid || devicePid();
    this.role = "guest";
    this.code = c;
    this.err = "";
    this.ended = "";
    const keepPlay = this.wantPlay || this.playing;
    let lastErr = "Could not reach the room. Check the code and your connection.";
    for (let attempt = 0; attempt < 4; attempt++) {
      this.attempt = attempt + 1;
      this.phase = keepPlay ? (this.phase === "play" ? "play" : "connecting") : "connecting";
      this.setLink(attempt === 0 ? "connecting" : "relay", attempt === 0 ? "Connecting…" : "Trying relay…");
      if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * (2 ** (attempt - 1))));
      await this.destroyPeer();
      this.role = "guest";
      this.code = c;
      this.pid = hello.pid || devicePid();
      try {
        const relay = relayUrl();
        if (relay) await this.joinRelay(c, hello, relay, 8000);
        else await this.joinPeer(c, hello, 8000);
        this.link = "connected";
        this.linkText = "Connected";
        this.startWatch();
        this.bump();
        return;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : lastErr;
      }
    }
    this.link = "failed";
    this.linkText = "Failed";
    this.err = lastErr;
    this.bump();
    if (!keepPlay) {
      this.phase = "idle";
      this.role = null;
    }
    throw new Error(lastErr);
  }

  private joinPeer(c: string, hello: Extract<CoopMsg, { typ: "hello" }>, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(peerOpts());
      this.peer = peer;
      let settled = false;
      const fail = (m: string): void => {
        if (settled) return; settled = true; reject(new Error(m));
      };
      const t = window.setTimeout(() => fail("Could not reach the room. Check the code and your connection."), timeoutMs);
      peer.on("disconnected", () => { try { peer.reconnect(); } catch { /* ignore */ } });
      peer.on("error", (e: { type?: string; message?: string }) => {
        fail(e?.type === "peer-unavailable" ? "No host found for that code." : (e?.message || "Join failed."));
      });
      peer.on("open", () => {
        const conn = peer.connect(roomPeerId(c), { reliable: true, metadata: { ch: "ctrl", pid: this.pid, proto: COOP_PROTO } });
        this.hostConn = conn;
        this.wireConn(conn, this.pid);
        conn.on("open", () => {
          window.clearTimeout(t);
          if (settled) return;
          settled = true;
          try { conn.send({ ...hello, typ: "hello", pid: this.pid, proto: COOP_PROTO, rejoin: !!hello.rejoin || this.wantPlay }); } catch { /* ignore */ }
          this.openPosChannel(peer, roomPeerId(c));
          if (!this.wantPlay) this.phase = "lobby";
          this.bump();
          resolve();
        });
        conn.on("error", () => fail("Could not connect to the host."));
      });
    });
  }

  async retry(): Promise<void> {
    if (!this.lastJoin) throw new Error("Enter a valid room code.");
    this.wantPlay = this.wantPlay || this.playing;
    await this.joinRoom(this.lastJoin.code, { ...this.lastJoin.hello, rejoin: true });
  }

  private rejoinLock = false;
  private async tryAutoRejoin(): Promise<void> {
    if (this.rejoinLock) return;
    if (this.userLeave || this.phase === "migrate" || !this.lastJoin) {
      if (!this.lastJoin && !this.userLeave) this.failSafe("The host disconnected.");
      return;
    }
    this.rejoinLock = true;
    this.autoRejoin = true;
    this.wantPlay = true;
    this.setLink("retrying", "Reconnecting…");
    try {
      await this.joinRoom(this.lastJoin.code, { ...this.lastJoin.hello, rejoin: true, pid: this.pid });
    } catch {
      this.setLink("failed", "Failed");
    } finally {
      this.rejoinLock = false;
    }
  }

  simDisconnect(): void {
    this.userLeave = false;
    this.wantPlay = this.playing;
    const r = this.relay;
    this.relay = null;
    if (r) { try { r.close(); } catch { /* ignore */ } }
    if (this.hostConn) {
      const c = this.hostConn;
      this.hostConn = null;
      try { c.close(); } catch { /* ignore */ }
    }
    void this.tryAutoRejoin();
  }

  startPlay(): void {
    this.playing = true;
    this.phase = "play";
    this.broadcast({ typ: "welcome", pid: "", code: this.code, hostPid: this.pid, players: this.players, playing: true, proto: COOP_PROTO });
    this.bump();
  }

  sendInput(inp: CoopInput): void {
    if (!this.isGuest()) return;
    const msg: CoopMsg = { typ: "input", inp };
    const send = (): void => {
      if (this.relay && this.relay.readyState === WebSocket.OPEN) {
        try { this.relay.send(JSON.stringify({ typ: "data", to: this.relayHostId || "host", data: msg })); } catch { /* ignore */ }
        return;
      }
      try { if (this.hostConn?.open) this.hostConn.send(msg); } catch { /* ignore */ }
    };
    this.deferSend("data", send);
    if (inp.atk || inp.dodge || inp.drink || inp.abil >= 0) this.deferSend("ctrl", send);
  }
  sendAct(act: CoopAct): void {
    if (!this.active()) return;
    if (this.isHost()) this.broadcast(act);
    else this.deferSend("ctrl", () => {
      if (this.relay && this.relay.readyState === WebSocket.OPEN) {
        try { this.relay.send(JSON.stringify({ typ: "data", to: this.relayHostId || "host", data: act })); } catch { /* ignore */ }
        return;
      }
      try { if (this.hostConn?.open) this.hostConn.send(act); } catch { /* ignore */ }
    });
  }

  sendState(st: unknown): void {
    if (!this.isHost()) return;
    const msg: CoopMsg = { typ: "state", st };
    this.noteBytes("state", msg);
    this.broadcast(msg);
  }
  sendPos(pos: CoopPos): void { if (this.active()) this.sendFast(pos); }
  sendPosBatch(batch: CoopPosBatch): void { if (this.isHost()) this.sendFast(batch); }

  sendLoot(pid: string, payload: Omit<Extract<CoopMsg, { typ: "loot-you" }>, "typ">): void {
    this.sendTo(pid, { typ: "loot-you", ...payload });
  }

  async leave(reason = "You left the party."): Promise<void> {
    this.userLeave = true;
    this.autoRejoin = false;
    this.wantPlay = false;
    this.link = "idle";
    if (this.isHost() && this.players.some((p) => !p.isHost)) {
      const next = this.players.find((p) => p.pid !== this.pid);
      if (next) {
        this.broadcast({ typ: "migrate", newHostPid: next.pid });
        await new Promise((r) => setTimeout(r, 250));
      } else {
        this.broadcast({ typ: "ended", reason: "The host left. Progress saved." });
      }
    } else if (this.isGuest()) {
      const leaveMsg: CoopMsg = { typ: "leave", pid: this.pid, name: this.players.find((p) => p.pid === this.pid)?.name || "Player" };
      try {
        if (this.relay && this.relay.readyState === WebSocket.OPEN) {
          this.relay.send(JSON.stringify({ typ: "data", to: this.relayHostId || "host", data: leaveMsg }));
        } else if (this.hostConn?.open) {
          this.hostConn.send(leaveMsg);
        }
      } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 80));
    }
    await this.destroyPeer();
    this.role = null;
    this.phase = "idle";
    this.playing = false;
    this.ended = reason;
    this.bump();
  }

  private async claimHost(): Promise<void> {
    this.phase = "migrate";
    this.bump();
    const code = this.code;
    const me = this.players.find((p) => p.pid === this.pid);
    const others = this.players.filter((p) => p.pid !== this.pid && !p.isHost);
    await this.destroyPeer();
    this.role = "host";
    for (let i = 0; i < 8; i++) {
      const ok = await this.listenAsHost(code);
      if (ok) {
        this.code = code;
        this.phase = "play";
        this.playing = true;
        this.players = [{ pid: this.pid, name: me?.name || "Host", cls: me?.cls || "warrior", lvl: me?.lvl || 1, isHost: true }, ...others.map((p) => ({ ...p, isHost: false }))];
        this.event("The host passed the room to " + (me?.name || "a player") + ".", "sys");
        this.handlers.onBecomeHost?.();
        this.bump();
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    this.failSafe("Could not take over the room. Progress saved.");
  }

  private async rejoinAfterMigrate(): Promise<void> {
    this.phase = "migrate";
    this.bump();
    const code = this.code;
    const hello = this.handlers.hello?.() ?? { typ: "hello" as const, pid: this.pid, name: "Player", cls: "warrior", lvl: 1, rejoin: true };
    await new Promise((r) => setTimeout(r, 900));
    try {
      await this.joinRoom(code, { ...hello, rejoin: true, pid: this.pid });
      this.playing = true;
      this.phase = "play";
      this.bump();
    } catch {
      this.failSafe("Could not rejoin after the host left. Progress saved.");
    }
  }

  failSafe(reason: string): void {
    const r = reason.includes("Progress saved") ? reason : (reason + " Progress saved.");
    this.ended = r;
    this.phase = "ended";
    this.playing = false;
    this.handlers.onEnded?.(r);
    void this.destroyPeer();
    this.role = null;
    this.bump();
  }

  private fakeRelayConn(pid: string): DataConnection {
    const self = this;
    const fake = {
      open: true,
      peer: pid,
      send(msg: CoopMsg) { self.sendTo(pid, msg); },
      close() { /* relay lifecycle */ },
    } as unknown as DataConnection;
    this.relayFakes.set(pid, fake as unknown as RelaySock);
    return fake;
  }

  private onRelayIncoming(from: string): void {
    const conn = this.fakeRelayConn(from);
    this.pending.set(from, conn);
  }

  private onRelayData(from: string, data: CoopMsg): void {
    if (this.role === "host") {
      let conn = this.conns.get(from) || this.pending.get(from);
      if (!conn) { conn = this.fakeRelayConn(from); this.pending.set(from, conn); }
      this.hostHandle(conn, data);
    } else {
      this.guestHandle(data);
    }
  }

  private listenRelay(code: string, url: string): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok: boolean): void => { if (settled) return; settled = true; resolve(ok); };
      const ws = new WebSocket(url);
      this.relay = ws;
      const t = window.setTimeout(() => { try { ws.close(); } catch { /* ignore */ } done(false); }, 8000);
      ws.onopen = () => { try { ws.send(JSON.stringify({ typ: "listen", id: roomPeerId(code) })); } catch { done(false); } };
      ws.onerror = () => { window.clearTimeout(t); done(false); };
      ws.onmessage = (ev: MessageEvent) => {
        let msg: { typ?: string; from?: string; data?: CoopMsg };
        try { msg = JSON.parse(String(ev.data)); } catch { return; }
        if (msg.typ === "ok") { this.relayHostId = roomPeerId(code); window.clearTimeout(t); done(true); return; }
        if (msg.typ === "busy") { window.clearTimeout(t); try { ws.close(); } catch { /* ignore */ } done(false); return; }
        if (msg.typ === "incoming" && msg.from) this.onRelayIncoming(msg.from);
        if (msg.typ === "data" && msg.from) this.onRelayData(msg.from, msg.data as CoopMsg);
        if (msg.typ === "close" && msg.from) {
          const conn = this.conns.get(msg.from) || this.pending.get(msg.from);
          if (conn) this.onConnClose(conn);
        }
      };
    });
  }

  private joinRelay(code: string, hello: Extract<CoopMsg, { typ: "hello" }>, url: string, timeoutMs = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.relay = ws;
      let settled = false;
      const fail = (m: string): void => {
        if (settled) return; settled = true; reject(new Error(m));
      };
      const t = window.setTimeout(() => fail("Could not reach the room. Check the code and your connection."), timeoutMs);
      ws.onerror = () => fail("Could not connect to the host.");
      ws.onopen = () => {
        try { ws.send(JSON.stringify({ typ: "join", to: roomPeerId(code), from: this.pid })); } catch { fail("Could not connect to the host."); }
      };
      ws.onmessage = (ev: MessageEvent) => {
        let msg: { typ?: string; from?: string; data?: CoopMsg };
        try { msg = JSON.parse(String(ev.data)); } catch { return; }
        if (msg.typ === "ok") {
          window.clearTimeout(t);
          if (settled) return;
          settled = true;
          this.relayHostId = roomPeerId(code);
          const conn = this.fakeRelayConn(this.relayHostId);
          this.hostConn = conn;
          try { conn.send({ ...hello, typ: "hello", pid: this.pid, proto: COOP_PROTO, rejoin: !!hello.rejoin || this.wantPlay }); } catch { /* ignore */ }
          this.phase = "lobby";
          this.bump();
          resolve();
          return;
        }
        if (msg.typ === "nohost") { window.clearTimeout(t); fail("No host found for that code."); return; }
        if (msg.typ === "data" && msg.data) this.guestHandle(msg.data);
        if (msg.typ === "close") {
          if (this.phase === "migrate" || this.userLeave) return;
          if (settled) void this.tryAutoRejoin();
        }
      };
      ws.onclose = () => {
        if (this.userLeave || this.phase === "migrate" || !settled) return;
        if (this.relay === ws) this.relay = null;
        void this.tryAutoRejoin();
      };
    });
  }

  private openPosChannel(peer: Peer, hostId: string): void {
    try {
      const u = peer.connect(hostId, { reliable: false, metadata: { ch: "pos", pid: this.pid, proto: COOP_PROTO } });
      u.on("open", () => { this.posHost = u; });
      u.on("data", (raw: unknown) => this.guestHandle(raw as CoopMsg));
      u.on("close", () => { if (this.posHost === u) this.posHost = null; });
      u.on("error", () => { if (this.posHost === u) this.posHost = null; });
    } catch { this.posHost = null; }
  }

  private async destroyPeer(): Promise<void> {
    const r = this.relay;
    this.relay = null;
    this.relayFakes.clear();
    if (r) { try { r.close(); } catch { /* ignore */ } }
    const p = this.peer;
    this.peer = null;
    this.hostConn = null;
    this.posHost = null;
    this.posConns.clear();
    this.conns.clear();
    this.pending.clear();
    this.theirProto = 0;
    this.protoWarn = false;
    if (this.watch) { window.clearInterval(this.watch); this.watch = null; }
    if (!p) return;
    try { p.destroy(); } catch { /* ignore */ }
  }
}

const S = new Session();

export const coop = {
  get: (): Session => S,
  active: (): boolean => S.active(),
  isHost: (): boolean => S.isHost(),
  isGuest: (): boolean => S.isGuest(),
  phase: (): CoopPhase => S.phase,
  code: (): string => S.code,
  pid: (): string => S.pid,
  players: (): CoopPlayer[] => S.players,
  partyN: (): number => S.partyN(),
  playing: (): boolean => S.playing,
  err: (): string => S.err,
  ended: (): string => S.ended,
  pawns: (): CoopPawn[] => S.pawns,
  setPawns: (p: CoopPawn[]): void => { S.pawns = p; },
  setHandlers: (h: CoopHandlers): void => S.setHandlers(h),
  hostRoom: (p: { name: string; cls: string; lvl: number }, alreadyPlaying = false): Promise<string> => S.hostRoom(p, alreadyPlaying),
  joinRoom: (code: string, hello: Extract<CoopMsg, { typ: "hello" }>): Promise<void> => S.joinRoom(code, hello),
  startPlay: (): void => S.startPlay(),
  sendInput: (inp: CoopInput): void => S.sendInput(inp),
  sendState: (st: unknown): void => S.sendState(st),
  sendPos: (pos: CoopPos): void => S.sendPos(pos),
  sendPosBatch: (batch: CoopPosBatch): void => S.sendPosBatch(batch),
  sendAct: (act: CoopAct): void => S.sendAct(act),
  stats: (): ReturnType<Session["stats"]> => S.stats(),
  resetStats: (): void => S.resetStats(),
  proto: (): number => COOP_PROTO,
  theirProto: (): number => S.theirProto,
  simulateNet: (cfg: { rtt: number; jitter: number; loss: number } | null): void => S.simulateNet(cfg),
  simDisconnect: (): void => S.simDisconnect(),
  retry: (): Promise<void> => S.retry(),
  linkStatus: (): ReturnType<Session["linkStatus"]> => S.linkStatus(),
  pings: (): ReturnType<Session["pings"]> => S.pings(),
  rttOf: (pid: string): number => S.rttOf(pid),
  interpMs: (pid?: string): number => S.interpMs(pid),
  offsetFor: (pid: string): number => S.offsetFor(pid),
  hasClock: (pid: string): boolean => S.hasClock(pid),
  sendLoot: (pid: string, payload: Omit<Extract<CoopMsg, { typ: "loot-you" }>, "typ">): void => S.sendLoot(pid, payload),
  event: (text: string, kind: CoopEventKind): void => S.event(text, kind),
  takeInput: (pid: string): CoopInput | undefined => S.takeInput(pid),
  leave: (reason?: string): Promise<void> => S.leave(reason),
  broadcast: (msg: CoopMsg): void => S.broadcast(msg),
};
