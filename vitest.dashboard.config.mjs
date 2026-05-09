// vitest.dashboard.config.mjs
// ---------------------------------------------------------------------------
// Vitest config for Component 07 (WebGPU layout) dashboard unit tests.
//
// Run with:
//   npx vitest run --config vitest.dashboard.config.mjs
// Or target the __tests__ dir directly:
//   npx vitest run examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/
//
// Uses jsdom environment to provide navigator, window, etc.
// The WEBGPU_TEST=1-gated e2e test (webgpu-layout-e2e.test.js) is excluded
// by default; set WEBGPU_TEST=1 to include it.
// ---------------------------------------------------------------------------
import { defineConfig } from 'vitest/config';

const includeE2E = process.env.WEBGPU_TEST === '1';

export default defineConfig({
  test: {
    name: 'dashboard-webgpu',
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    include: [
      'examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/webgpu-layout-detection.test.js',
      'examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/webgpu-layout-fallback.test.js',
      // CAP-041: viewer-embed module tests (always included — no env gate)
      'examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/viewer-embed.test.js',
      ...(includeE2E
        ? ['examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/webgpu-layout-e2e.test.js']
        : []),
    ],
  },
});
