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
  },
});
