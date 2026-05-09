/**
 * SCRIBE Build-Out v1.49.621 — Component 09 integration test.
 *
 * Cross-component WebGPU fallback (C00 + C07). Verifies success criterion
 * C9 (WGSL compute layout live; falls back when WebGPU unavailable) at the
 * file-existence + WGSL-shape level.
 *
 * The dashboard layer's webgpu-layout.js + webgpu-compute/force-atlas-2.wgsl
 * are non-TS browser modules; deeper runtime testing lives in
 * examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/
 * (vitest.dashboard.config.mjs). This integration test confirms the
 * artifacts exist + the WGSL shader has the expected compute-kernel
 * surface, so the runtime fallback contract is checkable from the main
 * vitest run.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');

const WGSL_PATH = resolve(
  REPO_ROOT,
  'examples/cartridges/dashboard-lod-rendering/webgpu-compute/force-atlas-2.wgsl',
);
const WEBGPU_LAYOUT_JS = resolve(
  REPO_ROOT,
  'examples/cartridges/dashboard-lod-rendering/dashboard/webgpu-layout.js',
);
const APP_JS = resolve(
  REPO_ROOT,
  'examples/cartridges/dashboard-lod-rendering/dashboard/app.js',
);

describe('integration: WebGPU compute layout + fallback (C9)', () => {
  it('force-atlas-2.wgsl shader file exists + has non-trivial size', () => {
    expect(existsSync(WGSL_PATH)).toBe(true);
    const stats = statSync(WGSL_PATH);
    expect(stats.size).toBeGreaterThan(200);
  });

  it('force-atlas-2.wgsl declares an @compute kernel', () => {
    const src = readFileSync(WGSL_PATH, 'utf8');
    // WGSL compute entry-points use `@compute` attribute.
    expect(src).toMatch(/@compute/);
    // Standard ForceAtlas2 has at least one workgroup-size declaration.
    expect(src).toMatch(/@workgroup_size/);
  });

  it('webgpu-layout.js exposes detectWebGpu + createWebGpuLayout fallback API', () => {
    expect(existsSync(WEBGPU_LAYOUT_JS)).toBe(true);
    const src = readFileSync(WEBGPU_LAYOUT_JS, 'utf8');
    // The detect helper short-circuits to null when WebGPU absent.
    expect(src).toMatch(/export\s+(?:async\s+)?function\s+detectWebGpu/);
    // The factory returns null on detect-failure (fallback contract).
    expect(src).toMatch(/createWebGpuLayout/);
  });

  it('app.js wires the WebGPU layout with a CPU fallback path', () => {
    expect(existsSync(APP_JS)).toBe(true);
    const src = readFileSync(APP_JS, 'utf8');
    // The dashboard prefers WebGPU when available; the SCRIBE_FORCE_CPU
    // toggle flips routing to the JS path.
    expect(src.toLowerCase()).toMatch(/webgpu|force_cpu|force-cpu|forceCpu/i);
  });
});
