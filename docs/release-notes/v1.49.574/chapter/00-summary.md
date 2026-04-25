# v1.49.574 — Megakernel: One Launch, One Chipset

**Shipped:** 2026-04-25
**Branch:** dev → main (merged at `d2ea4f0a0`); tagged `v1.49.574`
**Subtitle:** Persistent CUDA Kernels and JEPA-Planned Synthesis for the Silicon Layer
**Mission package:** `.planning/missions/megakernel-one-launch-one-chipset/`
_Parse confidence: 1.00 — source `docs/release-notes/v1.49.574/README.md`_

## Summary

- **Half A (deep research).** Five research modules + S2 cross-module synthesis (~20K words), 60-page PDF, 32-entry bibliography, 40-test verification matrix all PASS. The keystone module M3 articulates the bridge thesis mapping LeWorldModel action/observation/latent contract onto kernel-design state/transformation/predicted behavior.
- **Half B (tier-gated substrate, default-off).** Six TypeScript modules across three tiers + 145 tests, all gated by `gsd-skill-creator.megakernel-substrate.<module>.enabled` flags in `.claude/gsd-skill-creator.json`. Byte-identical to pre-v1.49.574 surface when disabled (verified by snapshot fixture).
- **Convergent-discovery finding.** SIGReg (LeWorldModel anti-collapse) and counter-based megakernel synchronization share a *design discipline* (replace many-term coordination with one carefully-chosen invariant) without being mathematically equivalent. The analogy is productive at the design-discipline level.
- **Reversal narrative.** Laine et al. 2013's "Megakernels Considered Harmful" → Hazy Research May 2025's "Look Ma, No Bubbles" framed as a workload-character dependency, not a refutation. Same architectural insight, opposite optimal answer when SIMT divergence is structurally absent and the workload is memory-bound at low batch.

## Half A modules

| Module | Words | Keystone |
|---|---|---|
| M1 Historical Lineage | 2,470 | Laine 2013 → Hazy Research May 2025 reversal narrative |
| M2 Megakernel Architecture | 3,166 | 7 mechanisms each cited with primary source + impl reference |
| M3 JEPA for Kernel Synthesis | 3,597 | The bridge thesis mapping table (8 rows) |
| M4 Implementation Survey | 3,549 | 12+ named systems; performance reference; Sakana incident at lesson level |
| M5 Silicon Layer Integration | 5,278 | Amiga-to-megakernel mapping; RTX 4060 Ti envelope; 4-stage pathway; Half B substrate enumeration |
| S2 Cross-module synthesis | 2,366 | 8 IN tests rendered as PASS checklist with evidence |

## Half B substrate (T1 must-ship × 3, T2 if-budget × 3, T3 may-defer × 1)

| ID | Tier | Module | Tests | Path |
|---|---|---|---|---|
| HB-01 | T1 | Instruction-tensor schema | 32 | `src/cartridge/megakernel/instruction-tensor-schema.ts` |
| HB-02 | T1 | Execution-trace telemetry hook | 25 | `src/traces/megakernel-trace/` |
| HB-03 | T1 | JEPA-as-planner typed-interface stub | 26 | `src/orchestration/jepa-planner/` |
| HB-04 | T2 | LoRA adapter-selection schema *(CAPCOM HARD GATE)* | 22 | `src/cartridge/megakernel/adapter-selection-schema.ts` |
| HB-05 | T2 | μCUTLASS+SOL budget guidance hook | 21 | `src/orchestration/sol-budget/` |
| HB-06 | T3 | ThunderKittens reference (docs only) | 0 | `docs/cartridge/megakernel/thunderkittens-reference-example.md` |
| HB-07 | T2 | robust-kbench verification doctrine | 15 | `src/cartridge/megakernel/verification-spec.ts` + `docs/cartridge/megakernel/verification-doctrine.md` |

It produced retrospective content (what worked, lessons, feed-forwards); see `03-retrospective.md`.
5 feed-forward lessons + 6 post-review corrections extracted; see `04-lessons.md`.

## By the numbers

- **Tests:** 27,556 passing (+145 over baseline 27,411). Zero regressions.
- **PDF:** 60 pages, 3-pass XeLaTeX clean, 0 errors, 0 undefined references.
- **Test floor:** 1.45× over the ≥100 target floor; 1.81× over the ≥80 T1-only floor.
- **Wall-clock:** 65m 47s end-to-end (observatory log; `started_at` 07:45:59Z → `ended_at` 08:51:46Z).
- **Tokens consumed:** ~430K.
- **CAPCOM gates:** G0–G4 PASS for Half A; HB-04 carries CAPCOM hard-preservation in Half B.

## Out of scope (preserved as milestone scope)

- Production CUDA implementation work
- Training a JEPA planner against real GPU execution traces
- ROCm / MI300 / Apple Metal porting (NVIDIA-specific by SC-VEN)
- LLM training kernels (focus is inference / decode)
- Multi-vendor benchmarking

## Dedications

- Samuli Laine, Tero Karras, Timo Aila (NVIDIA Research, 2013) — the cautionary anchor.
- Hazy Research, Stanford — Spector / Juravsky / Sul / Dugan / Lim / Fu / Arora / Ré — the May 2025 reversal.
- Maes / Le Lidec / Scieur / LeCun / Balestriero — LeWorldModel: the seed reference.
- Zhihao Jia and the CMU Catalyst group — Mirage MPK.
- Sakana AI — for the AI CUDA Engineer incident, the corrected harness, and robust-kbench.

---
**Prev:** [v1.49.573](../v1.49.573/00-summary.md) · _(current tip)_
