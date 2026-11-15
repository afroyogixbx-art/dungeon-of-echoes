import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DungeonOfEchoes from "./DungeonOfEchoes";

const el = document.getElementById("root");
if (el) createRoot(el).render(<StrictMode><DungeonOfEchoes /></StrictMode>);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js").catch(() => undefined); });
}
