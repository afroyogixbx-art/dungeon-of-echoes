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
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
        { urls: ["turn:eu-0.turn.peerjs.com:3478", "turn:us-0.turn.peerjs.com:3478"], username: "peerjs", credential: "peerjsp" },
      ],
    },
  };
}

export interface CoopPlayer {
  pid: string;
  name: string;
  cls: string;
  lvl: number;
  isHost: boolean;
}
export interface CoopInput {
  mx: number; my: number; atk: boolean; dodge: boolean; drink: boolean; abil: number; seq: number;
}
export interface CoopPawn {
  pid: string; name: string; cls: string; lvl: number; wx: number; wy: number;
  hp: number; maxHp: number; mp: number; maxMp: number; host?: boolean;
}
export type CoopEventKind = "join" | "leave" | "loot" | "sys";
export type CoopMsg =
  | { typ: "hello"; pid: string; name: string; cls: string; lvl: number; hero?: unknown; rejoin?: boolean }
  | { typ: "welcome"; pid: string; code: string; hostPid: string; players: CoopPlayer[]; playing: boolean }
  | { typ: "full" }
  | { typ: "reject"; reason: string }
  | { typ: "players"; players: CoopPlayer[] }
  | { typ: "event"; text: string; kind: CoopEventKind }
  | { typ: "input"; inp: CoopInput }
  | { typ: "state"; st: unknown }
  | { typ: "enter" }
  | { typ: "leave"; pid: string; name: string }
  | { typ: "migrate"; newHostPid: string }
  | { typ: "ended"; reason: string }
  | { typ: "loot-you"; drops: unknown; pots: number; gold: number; xp: number; text: string };


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
  hello?: () => Extract<CoopMsg, { typ: "hello" }>;
}

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
  watch: number | null = null;
  relay: WebSocket | null = null;
  relayHostId = "";
  relayFakes = new Map<string, RelaySock>();

  bump(): void { this.handlers.onChange?.(); }

  setHandlers(h: CoopHandlers): void { this.handlers = h; }

  active(): boolean { return this.phase !== "idle" && this.phase !== "ended"; }
  isHost(): boolean { return this.role === "host" && this.active(); }
  isGuest(): boolean { return this.role === "guest" && this.active(); }
  partyN(): number { return this.active() ? Math.max(1, this.players.length) : 1; }

  broadcast(msg: CoopMsg, exceptPid?: string): void {
    if (this.relay && this.relay.readyState === WebSocket.OPEN) {
      try { this.relay.send(JSON.stringify({ typ: "data", to: "*", except: exceptPid || "", data: msg })); } catch { /* ignore */ }
      return;
    }
    for (const [pid, c] of this.conns) {
      if (exceptPid && pid === exceptPid) continue;
      try { if (c.open) c.send(msg); } catch { /* ignore */ }
    }
  }
  sendTo(pid: string, msg: CoopMsg): void {
    if (this.relay && this.relay.readyState === WebSocket.OPEN) {
      const dest = (pid === "host" && this.relayHostId) ? this.relayHostId : pid;
      try { this.relay.send(JSON.stringify({ typ: "data", to: dest, data: msg })); } catch { /* ignore */ }
      return;
    }
    const c = this.conns.get(pid);
    try { if (c?.open) c.send(msg); } catch { /* ignore */ }
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
      const pl = this.players.find((p) => p.pid === pid);
      const name = pl?.name || "A player";
      this.players = this.players.filter((p) => p.pid !== pid);
      if (this.isHost() && pl) {
        this.event(`${name} left`, "leave");
        this.broadcast({ typ: "players", players: this.players });
        this.handlers.onLeave?.(pid, name);
      }
      this.bump();
    }
    if (this.role === "guest" && conn === this.hostConn) {
      this.hostConn = null;
      if (this.phase === "migrate") return;
      this.failSafe("The host disconnected.");
    }
  }

  private onData(conn: DataConnection, raw: unknown, pidHint?: string): void {
    const msg = raw as CoopMsg;
    if (!msg || typeof msg !== "object" || !("typ" in msg)) return;
    if (this.role === "host") this.hostHandle(conn, msg);
    else this.guestHandle(msg);
    void pidHint;
  }

  private hostHandle(conn: DataConnection, msg: CoopMsg): void {
    if (msg.typ === "hello") {
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
        this.event(`${msg.name} rejoined`, "join");
      }
      try {
        conn.send({ typ: "welcome", pid: msg.pid, code: this.code, hostPid: this.pid, players: this.players, playing: this.playing });
      } catch { /* ignore */ }
      this.broadcast({ typ: "players", players: this.players }, msg.pid);
      this.bump();
      return;
    }
    const pid = this.pidOf(conn);
    if (!pid) return;
    if (msg.typ === "input") this.lastInput.set(pid, msg.inp);
    if (msg.typ === "leave") {
      conn.close();
      this.onConnClose(conn);
    }
    if (msg.typ === "enter") this.playing = true;
  }

  private guestHandle(msg: CoopMsg): void {
    if (msg.typ === "welcome") {
      this.phase = msg.playing ? "play" : "lobby";
      this.playing = msg.playing;
      this.players = msg.players;
      this.err = "";
      this.lastHostAt = Date.now();
      this.bump();
      return;
    }
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
        this.phase = "lobby";
        if (alreadyPlaying) this.playing = true;
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
        this.wireConn(conn);
        this.pending.set(conn.peer, conn);
      });
      peer.on("disconnected", () => { try { peer.reconnect(); } catch { /* ignore */ } });
    });
  }

  async joinRoom(code: string, hello: Extract<CoopMsg, { typ: "hello" }>): Promise<void> {
    const c = normCode(code);
    if (c.length < 4) throw new Error("Enter a valid room code.");
    await this.destroyPeer();
    this.pid = hello.pid || devicePid();
    this.role = "guest";
    this.phase = "connecting";
    this.code = c;
    this.err = "";
    this.ended = "";
    this.playing = false;
    this.bump();
    const relay = relayUrl();
    if (relay) {
      await this.joinRelay(c, hello, relay);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const peer = new Peer(peerOpts());
      this.peer = peer;
      let settled = false;
      const fail = (m: string): void => {
        if (settled) return; settled = true; this.failSafe(m); reject(new Error(m));
      };
      const t = window.setTimeout(() => fail("Could not reach the room. Check the code and your connection."), 25000);
      peer.on("error", (e: { type?: string; message?: string }) => {
        fail(e?.type === "peer-unavailable" ? "No host found for that code." : (e?.message || "Join failed."));
      });
      peer.on("open", () => {
        const conn = peer.connect(roomPeerId(c), { reliable: true });
        this.hostConn = conn;
        this.wireConn(conn, this.pid);
        conn.on("open", () => {
          window.clearTimeout(t);
          if (settled) return;
          settled = true;
          try { conn.send({ ...hello, typ: "hello", pid: this.pid }); } catch { /* ignore */ }
          this.phase = "lobby";
          this.bump();
          resolve();
        });
        conn.on("error", () => fail("Could not connect to the host."));
      });
    });
  }

  startPlay(): void {
    this.playing = true;
    this.phase = "play";
    this.broadcast({ typ: "welcome", pid: "", code: this.code, hostPid: this.pid, players: this.players, playing: true });
    this.bump();
  }

  sendInput(inp: CoopInput): void {
    if (!this.isGuest() || !this.hostConn?.open) return;
    try { this.hostConn.send({ typ: "input", inp }); } catch { /* ignore */ }
  }

  sendState(st: unknown): void {
    if (!this.isHost()) return;
    this.broadcast({ typ: "state", st });
  }

  sendLoot(pid: string, payload: Omit<Extract<CoopMsg, { typ: "loot-you" }>, "typ">): void {
    this.sendTo(pid, { typ: "loot-you", ...payload });
  }

  async leave(reason = "You left the party."): Promise<void> {
    if (this.isHost() && this.players.some((p) => !p.isHost)) {
      const next = this.players.find((p) => p.pid !== this.pid);
      if (next) {
        this.broadcast({ typ: "migrate", newHostPid: next.pid });
        await new Promise((r) => setTimeout(r, 250));
      } else {
        this.broadcast({ typ: "ended", reason: "The host left. Progress saved." });
      }
    } else if (this.isGuest() && this.hostConn?.open) {
      try { this.hostConn.send({ typ: "leave", pid: this.pid, name: this.players.find((p) => p.pid === this.pid)?.name || "Player" }); } catch { /* ignore */ }
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

  private joinRelay(code: string, hello: Extract<CoopMsg, { typ: "hello" }>, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.relay = ws;
      let settled = false;
      const fail = (m: string): void => {
        if (settled) return; settled = true; this.failSafe(m); reject(new Error(m));
      };
      const t = window.setTimeout(() => fail("Could not reach the room. Check the code and your connection."), 15000);
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
          try { conn.send({ ...hello, typ: "hello", pid: this.pid }); } catch { /* ignore */ }
          this.phase = "lobby";
          this.bump();
          resolve();
          return;
        }
        if (msg.typ === "nohost") { window.clearTimeout(t); fail("No host found for that code."); return; }
        if (msg.typ === "data" && msg.data) this.guestHandle(msg.data);
        if (msg.typ === "close") {
          if (this.phase === "migrate") return;
          this.failSafe("The host disconnected.");
        }
      };
    });
  }

  private async destroyPeer(): Promise<void> {
    const r = this.relay;
    this.relay = null;
    this.relayFakes.clear();
    if (r) { try { r.close(); } catch { /* ignore */ } }
    const p = this.peer;
    this.peer = null;
    this.hostConn = null;
    this.conns.clear();
    this.pending.clear();
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
  sendLoot: (pid: string, payload: Omit<Extract<CoopMsg, { typ: "loot-you" }>, "typ">): void => S.sendLoot(pid, payload),
  event: (text: string, kind: CoopEventKind): void => S.event(text, kind),
  takeInput: (pid: string): CoopInput | undefined => S.takeInput(pid),
  leave: (reason?: string): Promise<void> => S.leave(reason),
  broadcast: (msg: CoopMsg): void => S.broadcast(msg),
};
