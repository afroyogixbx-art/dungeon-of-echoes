import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { coopRelayPlugin } from "./scripts/coopRelayPlugin.mjs";
export default defineConfig({ base: "./", plugins: [react(), coopRelayPlugin()], build: { outDir: "dist", sourcemap: false } });
