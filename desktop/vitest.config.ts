import { defineConfig } from "vitest/config";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl({ minify: true })],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["vitest-webgl-canvas-mock"],
  },
});
