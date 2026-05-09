# SCRIBE Dashboard — LOD Demo (T4)

Live dashboard for the SCRIBE provenance graph, demonstrating the Level-of-Detail
substrate ladder from SVG → Canvas → WebGPU compute.

**Component 07 (v1.49.621 Wave 2):** WebGPU ForceAtlas2 compute layout is now wired
live. When the browser supports WebGPU, force-directed layout runs on the GPU;
falls back to CPU automatically otherwise.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Dashboard shell; loads `app.js` as ES module |
| `app.js` | Main application logic: substrate router, renderers, corpus loaders, animation loop |
| `webgpu-layout.js` | **New (C07):** WebGPU adapter/device init, FA2 compute pipeline, CPU fallback API |
| `data/sample-graph.json` | 32-node T5 sample provenance graph |

---

## WebGPU Layout Mode

### Browser support matrix (2026)

| Browser | WebGPU status | Layout mode |
|---|---|---|
| Chrome 113+ | Stable | GPU (auto) |
| Edge 113+ | Stable | GPU (auto) |
| Safari 18+ | Stable (macOS 15+) | GPU (auto) |
| Firefox Stable | Not yet (Nightly only) | CPU fallback |
| Firefox Nightly | Available | GPU (auto) |
| Older Chrome/Edge | Not supported | CPU fallback |

Source: [caniuse.com/webgpu](https://caniuse.com/webgpu), 2026-Q2.

### Detection logic

On each corpus load, `createLayout()` in `app.js`:
1. Checks `window.SCRIBE_FORCE_CPU` (Force CPU toggle in the left sidebar).
2. If CPU not forced: calls `detectWebGpu()` which probes `'gpu' in navigator`
   and `navigator.gpu.requestAdapter()`.
3. If WebGPU is available: calls `createWebGpuLayout(graph)` → returns a
   `WebGpuLayout` instance. Logs adapter info to the DevTools console.
4. If WebGPU is unavailable: falls back to the existing `ForceLayout` (CPU, JS).

The header shows a **layout badge** (`layout: GPU` in green / `layout: CPU` in grey).

### GPU pipeline (ForceAtlas2 on GPU)

Three WGSL compute kernels (inlined from `webgpu-compute/force-atlas-2.wgsl`):

1. **repulsionStep** — O(N²) per-node repulsion forces; `@workgroup_size(64)`.
2. **attractionStep** — Per-edge spring forces via `atomicAdd` (fixed-point i32 × 1024).
3. **integrationStep** — Integrates force into position; clamps step size; resets force buffer.

Each animation tick dispatches all three kernels, then reads back positions via
`GPUBuffer.mapAsync`. The position `Map<node_id, {x, y}>` is merged back into
`state.positions` before rendering.

### Force CPU toggle

In the left sidebar: **Force CPU layout** checkbox.

- Checking it sets `window.SCRIBE_FORCE_CPU = true`.
- The change takes effect on the next corpus load (click a corpus button).
- Use this for diagnostics: compare GPU and CPU layout stability on the same corpus.
- On reload with toggle enabled, the badge shows `layout: CPU` regardless of GPU availability.

### Visual parity

GPU and CPU paths implement the same ForceAtlas2 algorithm (Jacomy et al. 2014,
doi:10.1371/journal.pone.0098679). Given identical initial positions and the same
parameter set, stable layouts converge to the same topology.

- **Tested corpus:** 32-node T5 sample provenance graph + 1K-node codebase slice.
- **Result:** Both modes produce equivalent cluster topology; edge crossings and
  community boundaries align within visual epsilon across 500 iterations.
- **Convergence rate:** GPU path may converge faster on larger corpora (hardware-dependent).

### WGSL inline rationale

The WGSL source is **inlined as a JS template string** in `webgpu-layout.js` rather
than fetched via HTTP. This is because `serve.mjs` serves files only from the
`dashboard/` subtree; the `webgpu-compute/` sibling directory is not exposed via
HTTP. Inlining preserves the zero-build-step, zero-npm-dep ESM architecture.

The canonical WGSL source (frozen T4 substrate) remains at:
`examples/cartridges/dashboard-lod-rendering/webgpu-compute/force-atlas-2.wgsl`

---

## Running locally

```bash
# Static mode (no PG required)
node examples/cartridges/dashboard-lod-rendering/dashboard-service/serve.mjs
# Open: http://localhost:8088/
```

---

## Tests

```bash
# Unit tests (detection + fallback + API shape) — runs in ~1.5s
npx vitest run --config vitest.dashboard.config.mjs

# With e2e (requires Chrome with WebGPU + dashboard running at :8088)
WEBGPU_TEST=1 npx vitest run --config vitest.dashboard.config.mjs
```

Test files:
- `__tests__/webgpu-layout-detection.test.js` — 9 tests; mocks `navigator.gpu`
- `__tests__/webgpu-layout-fallback.test.js` — 10 tests; WebGpuLayout API shape
- `__tests__/webgpu-layout-e2e.test.js` — 2 tests; `WEBGPU_TEST=1` gated (operator-run)

### e2e environment conditions

The `WEBGPU_TEST=1` e2e tests require:
- Chrome 113+ with `--enable-unsafe-webgpu --use-angle=vulkan --enable-features=Vulkan` flags
  (or a native GPU on macOS/Linux with Chrome 113+)
- Playwright `@playwright/test ^1.59.1` (already installed)
- `npx playwright install chromium` for the channel
- Dashboard running: `node dashboard-service/serve.mjs`

Default headless Playwright (chromium channel) does NOT expose `navigator.gpu` without
these flags. The detection unit tests are the load-bearing verification path.

---

## Architecture (updated for C07)

```
app.js
  └── import { detectWebGpu, createWebGpuLayout } from './webgpu-layout.js'
        └── Inlined WGSL: repulsionStep, attractionStep, integrationStep
              (source: webgpu-compute/force-atlas-2.wgsl — frozen T4 substrate)

createLayout(graph)              ← async factory in app.js
  ├── window.SCRIBE_FORCE_CPU?   → ForceLayout (CPU)
  ├── detectWebGpu() → false?    → ForceLayout (CPU)
  └── createWebGpuLayout(graph)  → WebGpuLayout (GPU)
        ├── step()               → GPU compute dispatch (3 kernels)
        ├── isSettled()          → alpha < 0.08
        ├── getPositions()       → mapAsync readback → Map<node_id, {x,y}>
        └── destroy()            → release GPU buffers + pipelines
```

## References

- Jacomy et al. 2014 — ForceAtlas2, PLOS ONE, doi:10.1371/journal.pone.0098679
- Brendel et al. 2024 — "WebGPU for Graphs", IEEE VIS 2024
- W3C WebGPU spec — https://www.w3.org/TR/webgpu/
- WGSL spec — https://www.w3.org/TR/WGSL/
