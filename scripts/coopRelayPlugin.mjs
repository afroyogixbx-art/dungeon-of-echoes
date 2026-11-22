/**
 * Dev-only same-origin WebSocket room relay.
 * Used by the two-client playtest in environments where Chrome policy
 * blocks WebRTC ICE (no host/STUN/TURN candidates). Production GitHub
 * Pages still uses the public PeerJS broker only.
 */
import { WebSocketServer } from "ws";

export function coopRelayPlugin() {
  return {
    name: "doe-coop-relay",
    configureServer(server) {
      const rooms = new Map(); // id -> host socket
      const peers = new Map(); // socket -> { id, room }
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on("upgrade", (req, socket, head) => {
        const url = req.url || "";
        if (!url.startsWith("/coop-relay")) return;
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      });

      const send = (ws, obj) => {
        if (ws && ws.readyState === 1) {
          try { ws.send(JSON.stringify(obj)); } catch { /* ignore */ }
        }
      };

      wss.on("connection", (ws) => {
        peers.set(ws, { id: "", room: "" });
        ws.on("message", (raw) => {
          let msg;
          try { msg = JSON.parse(String(raw)); } catch { return; }
          const meta = peers.get(ws);
          if (!meta) return;
          if (msg.typ === "listen") {
            const id = String(msg.id || "");
            if (!id) { send(ws, { typ: "busy" }); return; }
            if (rooms.has(id) && rooms.get(id) !== ws) { send(ws, { typ: "busy" }); return; }
            rooms.set(id, ws);
            meta.id = id;
            meta.room = id;
            send(ws, { typ: "ok" });
            return;
          }
          if (msg.typ === "join") {
            const to = String(msg.to || "");
            const from = String(msg.from || "");
            const host = rooms.get(to);
            if (!host || host.readyState !== 1) { send(ws, { typ: "nohost" }); return; }
            meta.id = from;
            meta.room = to;
            send(ws, { typ: "ok" });
            send(host, { typ: "incoming", from });
            return;
          }
          if (msg.typ === "data") {
            const to = msg.to;
            const payload = { typ: "data", from: meta.id, data: msg.data };
            if (to === "*") {
              for (const [sock, m] of peers) {
                if (sock !== ws && m.room === meta.room && m.id !== (msg.except || "")) send(sock, payload);
              }
              return;
            }
            for (const [sock, m] of peers) {
              if (m.id === to && m.room === meta.room) { send(sock, payload); return; }
            }
          }
        });
        ws.on("close", () => {
          const meta = peers.get(ws);
          peers.delete(ws);
          if (!meta) return;
          if (rooms.get(meta.room) === ws) rooms.delete(meta.room);
          for (const [sock, m] of peers) {
            if (m.room === meta.room) send(sock, { typ: "close", from: meta.id });
          }
        });
      });
    },
  };
}
