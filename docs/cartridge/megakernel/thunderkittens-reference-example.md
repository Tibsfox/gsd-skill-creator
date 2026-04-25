# ThunderKittens Reference Example (HB-06, v1.49.574)

**Status:** Documentation only. No CUDA in `src/`. No build step. No actual
ThunderKittens linkage. Tier T3 (may-defer).

## Purpose

A worked reference example pointing engineers at the M5 §5 Stage 1 prototype
scope: a ThunderKittens interpreter template adapted for one operation
(specifically: the MLP block of a transformer like Qwen3-8B), validated
against ground truth, and benchmarked against `llama.cpp` on the RTX 4060 Ti
reference platform.

This document scopes that work; it does not implement it. Implementation
belongs to a future engineering mission outside the substrate slice of
v1.49.574.

## What ThunderKittens provides

ThunderKittens (TK) is a CUDA template library from Hazy Research that
exposes warp-level and thread-block-level abstractions for tile-based
computation. Their published megakernels (ThunderMLA, the Llama-1B
megakernel, TP-Llama-70B) are all built on TK templates.

The TK API surface most relevant to a Stage 1 prototype:

1. **Tile types** — `tile<T, R, C>` with compile-time row/column dimensions.
   Specialized for `bf16`, `fp16`, `fp32`, and the standard quantized formats.
2. **Tile operations** — `mul`, `add`, `sum`, `max`, `softmax`, `attention`,
   etc. Dispatch over warp (32 threads) and warp-group (4 warps).
3. **Async memory** — `load_async` / `store_async` with hierarchy hints
   (global ↔ shared ↔ register tiles).
4. **Warp specialization** — `register_template<warp_role>` lets the same
   kernel body branch on producer / consumer / scheduler role at compile time.

## Stage 1 prototype scope (from M5 §5)

A single TK-based megakernel that fuses the MLP block (`gate_proj`,
`up_proj`, `down_proj` plus the SiLU activation) of a Qwen3-8B layer.
Constraints:

- Q4_K_M quantization (matches the 4060 Ti VRAM envelope from M5 §4)
- Single-batch decode workload (matches the published Hazy Research
  reversal scope)
- Counter-based synchronization between `up_proj` and `down_proj`
  (M2 §3) — the published 4-chunk pipelining pattern
- Validated against the equivalent `llama.cpp` MLP-block output to FP16
  numerical tolerance (`1e-3` absolute)
- Benchmarked at single-prompt batch-1 latency

This is *not* a full transformer megakernel. It's a single-block proof of
concept whose purpose is to confirm the TK interpreter pattern works on
4060 Ti hardware before scaling.

## Open questions deferred to engineering mission

1. Q4_K_M dequant inside the TK template — the published Hazy Research
   megakernels run BF16 weights; quantized formats may need template
   specialization.
2. KV cache integration — out of scope for the MLP-block prototype, but
   is the blocking question for any whole-layer follow-up.
3. Adapter selection (LoRA) — the schema is in `HB-04`; the runtime
   instantiation is engineering work.

## Why this is shipped as documentation only

Per M5 §6 substrate-boundary discipline: "production CUDA implementation
work" is **explicitly out of scope** for the v1.49.574 milestone. A
worked TK prototype requires CUDA in `src/`, a build step, NVIDIA toolkit
linkage, and a benchmark harness — all of which belong to a future
engineering mission.

This document satisfies HB-06 as substrate-level orientation: a clear
target a future engineering mission can plan against, with the
prerequisite schemas (HB-01 instruction-tensor; HB-04 adapter-selection)
already shipped.

## Pointers to upstream

- `mk_thunderkittens` — ThunderKittens repository at Hazy Research.
- `mk_hazy_nobubbles_2025` — "Look Ma, No Bubbles" Llama-1B megakernel
  blog post; the canonical Stage 1 reference.
- `mk_hazy_thundermla_2025` — ThunderMLA; first Hazy megakernel; smaller
  scope than full Llama-1B and a useful lower-bound reference.
- M5 §5 staged-implementation pathway (in
  `.planning/missions/megakernel-one-launch-one-chipset/work/modules/M5-silicon-layer.md`).
