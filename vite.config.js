import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite project root is the repo root; its entry is the root-level index.html (Vite's default
// convention), which is intentionally distinct from public/index.html — the old, pre-built SPA
// shell that `pnpm run build` overwrites as part of its output. Build output goes straight into
// ./public, which is what wrangler's `assets.directory` serves. The Worker itself (src/worker.js,
// src/adapters, src/domain, src/ports) is completely untouched by this config.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false, // ./public is the build OUTPUT dir here, not a static-copy source
  build: {
    outDir: "public",
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
});
