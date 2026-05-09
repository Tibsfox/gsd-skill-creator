# webgpu-compute — GPU-side ForceAtlas2 layout

WGSL compute kernels for running ForceAtlas2 graph layout on the GPU
(>1M element band per `lod-thresholds.md`; doc 03 of the track).

## Files

- **`force-atlas-2.wgsl`** — three kernels (repulsion, attraction, integration)
  implementing FA2 per Jacomy et al. 2014 (PLOS ONE) on the GPU per Brendel et
  al. 2024 (IEEE VIS).

## Why WGSL not GLSL

The same WGSL source compiles for:

1. **Browser WebGPU** — via `device.createShaderModule({ code })`.
2. **Browser WebGL fallback** — via Naga's WGSL→GLSL ES translation (lossy
   for compute; render path only).
3. **Native Vulkan / Metal / DX12** — via wgpu+Naga, identical source. This is
   the substrate for the Tauri+wgpu native rung (doc 04).

A single shader codebase across browser-and-native is the load-bearing
architectural payoff.

## Browser support (2026)

| Browser | Status |
|---|---|
| Chrome/Edge | Stable (since v113, 2023) |
| Safari | Stable (since v18, 2024) |
| Firefox | Stable in Nightly; Stable enablement targeted 2026 |

Source: [caniuse.com/webgpu](https://caniuse.com/webgpu). The dashboard
feature-detects and falls back to WebGL with a capped element count.

## Workgroup size

64. The WebGPU sweet spot — matches Apple Metal best-practice and Khronos
Vulkan compute-shader guidance.

## Atomic floats

WebGPU 1.0 does not yet have `atomic<f32>`. The kernels use fixed-point i32
(multiply by 1024.0) for force accumulation; convert back to f32 in the
integration kernel. Replace with `atomic<f32>` when WebGPU 1.1 lands.

## Cross-references

- `dashboard-lod-rendering` doc 03 — full WebGPU rung specification.
- `dashboard-lod-rendering` doc 07 — ForceAtlas2 algorithm reference.
- `dashboard-lod-rendering` doc 04 — Tauri+wgpu native rung that loads this
  same WGSL unchanged.

## References

- Jacomy et al. 2014, ForceAtlas2, PLOS ONE, doi:10.1371/journal.pone.0098679
- Brendel et al. 2024, "WebGPU for Graphs", IEEE VIS 2024
- W3C WebGPU spec, https://www.w3.org/TR/webgpu/
- WGSL spec, https://www.w3.org/TR/WGSL/
- wgpu (Rust impl), https://wgpu.rs/
