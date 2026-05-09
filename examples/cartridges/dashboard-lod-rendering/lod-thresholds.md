# LOD Thresholds — Authoritative Reference

The single load-bearing reference for the dashboard's renderer-router.
Cited by `dashboard-lod-rendering` doc 01 §4 and used by
`dashboard/lib/substrate-router.js` (the dashboard's runtime decision tree).

## Substrate decision table

| Visible-element count `N` | Substrate | Rationale | Hand-off trigger to next rung |
|---|---|---|---|
| `N ≤ 2,000` | **SVG** (DOM) | Authoring + a11y win; DOM picking free | `N > 2,000` for two consecutive frames |
| `2,000 < N ≤ 20,000` | **Canvas 2D** | Removes per-element DOM cost | `N > 20,000` OR `frameMs > 16` for ≥3 consecutive frames |
| `20,000 < N ≤ 1,000,000` | **WebGL 2 instanced** | GPU draw amortisation | `N > 1,000,000` OR layout-step `> 8ms` |
| `1,000,000 < N` | **WebGPU compute + render** | GPU-side layout + render | Browser-mode overhead unacceptable |
| any (native-app mode) | **Tauri + wgpu (Vulkan/Metal/DX12)** | Bypass browser CPU overhead | n/a (terminal rung) |

## Hysteresis

- Upgrade triggers (move to higher rung): require ≥3 consecutive frames over threshold.
- Downgrade triggers (move to lower rung): require ≥30 consecutive frames under threshold (≈0.5s at 60fps).

This stops zoom-jitter from flapping the renderer.

## Layered overlays

Layered SVG-over-WebGL overlays (selection halo, focus tooltip) DO NOT count
against the SVG element budget. Element-counts are computed per substrate.

## Source anchors

- T2 doc 07 §1–§7 — substrate-ladder thresholds (originating reference).
- Sigma.js benchmarks — sigmajs.org, 100K nodes at 60fps WebGL.
- D3.js force-layout demos — observablehq.com/@d3/force-directed-graph-canvas.
- Khronos WebGL conformance perf suite — instanced draw cost numbers.
- Brendel et al. 2024 IEEE VIS — WebGPU graph layout 1M nodes at 30fps.
- Jacomy et al. 2014 PLOS ONE — ForceAtlas2 (the layout running at the WebGPU rung).
- caniuse.com/webgpu — browser support reality.

## Cross-references

- Full LOD strategy: `dashboard-lod-rendering` doc 01.
- WebGL primitives: `webgl-primitives/`.
- WebGPU compute: `webgpu-compute/`.
- Native rung: `dashboard-lod-rendering` doc 04 (Tauri+wgpu).

## Forbidden patterns (anti-patterns)

The strict ladder forbids:
1. CSS `filter:` / `backdrop-filter:` / `box-shadow:` on rendered elements (T2 doc 07 §9 cliff).
2. Layout in JavaScript above 50K nodes (move to Worker; above 250K to WebGPU).
3. Per-element event listeners above the SVG rung.
4. Synchronous hand-off in the middle of an animation (schedule at idle frames).
