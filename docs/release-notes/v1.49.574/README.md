# v1.49.574 — Megakernel: One Launch, One Chipset

**Closed:** 2026-04-25 (on `dev`; human merge to `main` remains gated per 2026-04-22 directive)
**Phases:** Half A 10 (779 → 788) + Half B 6 substrate modules + closing wave
**Waves:** 4 (W0 Foundation → W1 Tracks A+B parallel → W2 Synthesis → W3 Publication+Verify) + Half B
**Tests:** 27,552 passing (vs v1.49.573 published baseline 27,411 → **+141 tests**, 1.41× over the ≥100 floor; 1.76× over the ≥80 T1-only floor)
**Regressions:** 0 net new attributable to v1.49.574
**Pre-existing failures:** 2 (in `src/mathematical-foundations/__tests__/integration.test.ts` — v1.49.572 baseline, NOT v1.49.574)
**CAPCOM gates:** G0–G4 all PASS (Half A) + Half B substrate landed default-off with HB-04 carrying CAPCOM hard preservation
**Half A PDF:** `.planning/missions/megakernel-one-launch-one-chipset/work/publication/megakernel-reference.pdf` — 60 pages, 3-pass XeLaTeX clean

## Summary

> The lesson of the Amiga was never that custom chips were better silicon. The lesson was that exposing the architecture — making the registers, the DMA, the timing visible to anyone who wanted to look — generated more value than hiding it. The megakernel literature is making the SM scheduler visible. The JEPA literature is making the dynamics of search visible. The Silicon Layer's job is to make both of them programmable from the same place that adapter selection already lives. One launch. One chipset. The spaces between were always where the work was hiding.

Where v1.49.573 asked "what does the literature say about the architecture we built?", v1.49.574 asks the next question: **what does the kernel-design literature say about the chipset metaphor when you take it down to the SM scheduler?** The answer reaches across two convergent traditions, and the milestone delivers both a deep-research package (Half A) and a tier-gated typed substrate (Half B) that lets the project plan against the next engineering mission without reopening the research question.

**The Amiga Principle compounds twice.** Megakernel architecture exposes the SM scheduler; JEPA-based latent planning exposes the dynamics of search. Both are the same architectural discipline applied at two different layers — the same way the Amiga's custom chips and DMA were the same discipline applied at two different layers of the 1985 graphics pipeline.

**Megakernel architecture is the Amiga Principle at the GPU scheduler layer.** Hazy Research / Mirage MPK / Event Tensor Compiler collapse ~100 CUDA kernel launches into one persistent kernel with counter-based SM coordination. Half A M2 documents seven mechanisms each cited with primary source plus implementation reference.

**JEPA-based latent planning is the Amiga Principle at the planner layer.** LeWorldModel (arXiv:2603.19312), V-JEPA 2, EB-JEPA, and Causal-JEPA replace brute-force kernel autotune with a learned latent dynamics model that ranks candidates without executing them. Half A M3 produced the bridge thesis mapping table (8 rows) as its keystone.

**The 2013 → 2025 reversal is workload-character, not refutation.** Laine et al. 2013's "Megakernels Considered Harmful" and Hazy Research May 2025's "Look Ma, No Bubbles" reach opposite optimal answers from the same architectural insight: when SIMT divergence is structurally absent and the workload is memory-bound at low batch, the megakernel wins. Both sides of the synchronized debate are simultaneously correct about their own workload character.

**SIGReg and counter-based sync are architecturally rhyming.** Both are minimum-viable coordination primitives that prevent a system from degenerating to a trivial state — one in latent embedding space, the other in global-memory dependency. They share a design discipline (replace many approximate coordination mechanisms with one carefully-chosen one) without sharing a mathematical identity.

**Half B holds the substrate boundary.** All seven Half B candidates that surfaced from M5 §6 passed the substrate test (typed interface / schema / telemetry hook / doctrine — not engine work); zero out-of-scope engineering attempts; both halves complete in parallel without merge conflict.

## Half A — Deep research deliverable

| Module | Words | Citation count | Keystone |
|---|---|---|---|
| M1 Historical Lineage | 2,470 | 12 | the 2013 → 2025 reversal narrative |
| M2 Megakernel Architecture | 3,166 | 9 | 7 mechanisms each cited with primary source + impl ref |
| M3 JEPA for Kernel Synthesis | 3,597 | 14 | **the bridge thesis mapping table** (8 rows) |
| M4 Implementation Survey | 3,549 | 18 | 12+ named systems; performance reference table; Sakana incident at lesson level |
| M5 Silicon Layer Integration | 5,278 | 11 | Amiga ↔ megakernel mapping; RTX 4060 Ti envelope; 4-stage pathway; **Half B substrate enumeration** |
| S2 cross-module synthesis | 2,366 | — | 8 IN tests rendered as PASS checklist with evidence |

**Total:** 20,426 words across 5 modules + S2; 60-page PDF; 33 distinct cite keys; bibliography of 32 entries (23 primary + 9 secondary/context); zero unsupported numerical claims.

## By the numbers

| Surface | Count |
|---|---|
| Half A modules (M1–M5 + S2) | 6 |
| Half A words shipped | 20,426 |
| Half A PDF pages (3-pass XeLaTeX clean) | 60 |
| Distinct citation keys | 33 |
| Bibliography entries (23 primary + 9 secondary/context) | 32 |
| Half B substrate modules (T1+T2+T3) | 7 (3 + 3 + 1) |
| Half B new tests added | 141 |
| Total tests passing (was 27,411 at v1.49.573) | 27,552 |
| Net regressions attributable to v1.49.574 | 0 |
| Pre-existing failures inherited (v1.49.572 baseline) | 2 |
| CAPCOM gates (Half A G0–G4) all PASS | 5 |
| Waves executed (W0 + W1 parallel A/B + W2 + W3) | 4 |

## Health metrics

- **Tests:** 27,552 passing (+141 vs the v1.49.573 published baseline of 27,411 — 1.41× the ≥100 floor; 1.76× the ≥80 T1-only floor).
- **Regressions:** 0 net new attributable to v1.49.574.
- **Pre-existing failures:** 2 in `src/mathematical-foundations/__tests__/integration.test.ts` (live-config flag-state checks, v1.49.572 baseline; deferred to a follow-up clean-up pass per v1.49.573 policy).
- **CAPCOM gates:** G0–G4 all PASS for Half A; HB-04 carries CAPCOM hard preservation for Half B.
- **Default-off posture:** every Half B module is gated by `.claude/gsd-skill-creator.json` `megakernel-substrate` block — activating any flag is a deliberate operator decision.
- **Wall-clock:** 65m 47s end-to-end (observatory log) vs the mission package's 7-session / 4–5-day estimate.

## Test posture

- **T1 must-ship (HB-01 + HB-02 + HB-03):** 83 tests, all green — the substrate floor (instruction-tensor schema + telemetry envelope + JEPA-planner stub interface).
- **T2 if-budget (HB-04 + HB-05 + HB-07):** 58 tests, all green — adapter-selection schema (CAPCOM hard-preservation gated), SOL-budget estimator, verification doctrine.
- **T3 may-defer (HB-06):** 0 runtime tests by design — documentation-only ThunderKittens reference example.
- **Byte-identical fixture coverage:** 4 disabled-result snapshot tests across all six runtime Half B surfaces (HB-01/02/03/04/05/07); shape changes become visible automatically.

## Half B — Tier-gated research-informed substrate

All modules default-off via `.claude/gsd-skill-creator.json` `megakernel-substrate` block. Activating any flag in this block is a deliberate operator decision; HB-04 additionally requires CAPCOM hard-preservation sign-off.

### T1 must-ship (3 modules, 83 tests)

| ID | Path | Tests | What it ships |
|---|---|---|---|
| HB-01 | `src/cartridge/megakernel/instruction-tensor-schema.ts` | 32 | Typed Zod schema for the megakernel "copper list" — 18 opcodes, counter-based sync, warp-role hints, tile-shape declarations, structural-consistency validator with cross-references checked. Round-trip serialization. |
| HB-02 | `src/traces/megakernel-trace/` | 25 | Append-only JSONL telemetry envelope for `(compute graph, code transformation, observed performance)` tuples. Wired against the same Decision-Trace Ledger pattern as v1.49.561's M3 ledger. The training-data substrate a future JEPA needs. |
| HB-03 | `src/orchestration/jepa-planner/` | 26 | LeWM-shaped action / observation / latent contract. CEM/MPC envelope. Disabled stub satisfies the interface for downstream code. Compiles cleanly against HB-02's trace event types — telemetry directly feeds planner observation channel. |

### T2 if-budget (3 modules, 58 tests)

| ID | Path | Tests | What it ships |
|---|---|---|---|
| HB-04 | `src/cartridge/megakernel/adapter-selection-schema.ts` | 22 | LoRA adapter-selection schema: pool budget, per-instruction binding, VRAM-budget enforcement, maxResident enforcement, cross-tensor binding-integrity check. **CAPCOM HARD PRESERVATION GATE** because adapter selection constrains skill-space organization. |
| HB-05 | `src/orchestration/sol-budget/` | 21 | μCUTLASS+SOL-style budget guidance hook. Hardware envelope schema with RTX_4060_TI_ENVELOPE pre-baked. Default first-order SOL estimator (min-of-compute-bound or memory-bound). Threshold-band budget output (0 / 0.25 / 0.6 / 1.0) implementing the published SOL-guidance discipline (19–43% token savings retaining ≥95% geomean speedup). |
| HB-07 | `src/cartridge/megakernel/verification-spec.ts` + `docs/cartridge/megakernel/verification-doctrine.md` | 15 | The robust-kbench-style verification doctrine codified into a typed spec + auditor. BLOCKs `unverified`; BLOCKs the Sakana failure shape (fixed-input + 1 replication + unvaried inputs); WARNs on low replication and llm-judge without tolerance. The SC-VER lesson generalized to any LLM-driven generation surface in the project. |

### T3 may-defer (1 doc-only, 0 runtime tests)

| ID | Path | What it ships |
|---|---|---|
| HB-06 | `docs/cartridge/megakernel/thunderkittens-reference-example.md` + `examples/cartridge/megakernel-tk-prototype/` | Stage 1 prototype scope as a ThunderKittens-pattern reference. Documentation only — actual CUDA prototype is a future engineering mission. |

## Out-of-scope discipline (preserved as milestone scope per the package itself)

- Production CUDA implementation work
- Training a JEPA planner against real GPU execution traces
- ROCm / MI300 / Apple Metal porting (SC-VEN out-of-scope)
- LLM training kernels
- Multi-vendor benchmarking

Half B stays at the architectural-substrate layer: typed interfaces, schemas, telemetry hooks, doctrine. Engineering work belongs to a future mission.

## Convergent-discovery validation (Half A finding)

The mission's M2 + M3 reading surfaced one structural insight that warrants explicit naming: the **SIGReg anti-collapse regularizer** in **LeWorldModel** and the **counter-based fine-grained synchronization** in **Hazy Research megakernels** are doing **architecturally rhyming work**. Both are minimum-viable coordination primitives that prevent a system from degenerating to a trivial state:

- **SIGReg (latent-space invariant).** Keeps the latent space from collapsing to a constant by enforcing a single statistical invariant — **Gaussianity along random projections** via the **Cramér–Wold theorem**.
- **Counter-based sync (dependency invariant).** Keeps SMs from racing or deadlocking by enforcing a single dependency invariant — **counter ≥ target before proceeding**, against the Hazy Research **persistent-kernel** scheduler.
- **Prior art replaced.** **PLDM's seven-term loss** (latent side) and **CUDA's coarse kernel barriers + PDL's coarse synchronization** (scheduler side) were each clusters of approximate coordination mechanisms; the breakthrough on each side was finding the single primitive that did the work of many.
- **Shared design discipline, not mathematical identity.** **The two primitives are not formally equivalent** — SIGReg lives in latent embedding space; counter-based sync lives in global-memory dependency. The shared discipline carries forward into **Half B substrate**; the analogy is productive without claiming more than it can defend.

## Dedications

- **Samuli Laine, Tero Karras, Timo Aila** (NVIDIA Research, 2013) — for the cautionary anchor that gave the term its first meaning.
- **Benjamin Spector, Jordan Juravsky, Sasha Sul, Owen Dugan, Daniel Lim, Daniel Fu, Simran Arora, Christopher Ré** (Hazy Research, Stanford) — for the May 2025 reversal that reopened the question.
- **Lucas Maes, Quentin Le Lidec, Damien Scieur, Yann LeCun, Randall Balestriero** — for LeWorldModel: the seed reference whose 48× planning speedup made the bridge thesis tractable.
- **Zhihao Jia and the CMU Catalyst group** — for Mirage MPK: the first compiler that auto-generates megakernels from tensor programs.
- **Robert Tjarko Lange and the Sakana AI team** — for the AI CUDA Engineer incident, the corrected harness, and the resulting robust-kbench corrective; the canonical illustration of why verification rigor must scale with optimization pressure.

## Branch state

- `dev` working branch: tip after milestone-close commit
- `main`: at v1.49.571 merge tip; v1.49.572 + v1.49.573 + v1.49.574 queue together for human-authorized merge
- `v1.50` branch: deferred per 2026-04-13 directive

## Next milestone hooks

The mission's M5 §5 staged-implementation pathway names two future engineering missions:

1. **Stage 1 prototype** — ThunderKittens interpreter template adapted for one operation (e.g., MLP block of Qwen3-8B), validated against `llama.cpp` baseline on RTX 4060 Ti. Within "a quarter's effort" per M5.
2. **Stage 2 Mirage integration** — Mirage MPK compiler used to generate megakernels from chipset's currently-resident model. Adapter selection wired through the HB-04 schema. Telemetry capture extended to record real execution traces.

Stages 3-4 (JEPA bootstrap + closed loop autotune) are multi-quarter engineering work; the substrate v1.49.574 ships positions the project for a future mission to plan against without reopening the research question.
