import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [glsl({ minify: true })],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    rollupOptions: {
      // Atlas bundle is a re-export library (no HTML page); dashboard's atlas.html
      // dynamically imports `createAtlas`/`attachToHashRouting` from it. Use the
      // .ts entry directly + preserveEntrySignatures so rollup keeps the exports
      // instead of tree-shaking the surface.
      preserveEntrySignatures: "allow-extension",
      input: {
        // Main Tauri webview entry
        main: "index.html",
        // Intelligence Dashboard — planning meeting bundle (C08, <200KB gzipped)
        "intelligence-planning": "intelligence/planning/index.html",
        // Intelligence Dashboard — live work bundle (C09, <60KB gzipped)
        "intelligence-live-work": "intelligence/live-work/index.html",
        // Intelligence Dashboard — atlas browser bundle (W4c, browser-mode atlas)
        "intelligence-atlas": "intelligence/atlas/browser/browser-main.ts",
      },
      output: {
        // Keep intelligence bundles in predictable output paths
        entryFileNames: (chunk) => {
          if (chunk.name === "intelligence-planning") {
            return "dashboard/intelligence/planning.bundle.js";
          }
          if (chunk.name === "intelligence-live-work") {
            return "dashboard/intelligence/live-work.bundle.js";
          }
          if (chunk.name === "intelligence-atlas") {
            return "dashboard/intelligence/atlas.bundle.js";
          }
          return "[name]-[hash].js";
        },
      },
    },
  },
});
