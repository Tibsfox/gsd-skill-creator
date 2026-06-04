---
title: "v1.49.972 — park MA/MB/MD control-theory island + retire intrinsic-telemetry (D3)"
version: v1.49.972
date: 2026-06-04
summary: >
  D3 execution from the 2026-06-03 audit plan: dispose the control-theory learning
  substrate that stopped growing and never gained a runtime consumer. PARK the
  8-module MA/MB/MD island (ace the import sink + 7 modules reachable only within
  the island) via 8 adoption-scan allowlist entries + a parked-substrate doc with a
  generic resume condition and a dated review gate; and separately RETIRE
  intrinsic-telemetry (genuine shelfware, un-registered from heuristics-free-skill-space).
  No runtime behavior change.
tags: [substrate, shelfware, park, retire, control-theory, allowlist, D3]
---

# v1.49.972 — park MA/MB/MD control-theory island + retire intrinsic-telemetry (D3)

**Shipped:** 2026-06-04

The adaptive-learning substrate accumulated a control-theory island that is real, tested capability but unreachable from production; v1.49.972 parks it on a dated review gate and retires the one genuinely-dead module among the watch-listed shelfware.

## Why this ship

D3 of the 2026-06-03 core-functions audit plan (settled 2026-06-03 after an 8-agent verification pass that **refuted the plan's original "wire ace → M5 selector" recommendation**). The MA/MB/MD control-theory modules form a self-contained import island with `ace` (MA-2) as the downstream **sink** — the other island modules import `ace`; `ace` imports none of them. So wiring `ace` would advance only 1 of 8 modules and license a false "island wired" claim. The island ships flag-gated default-OFF and is flag-off byte-identical, so it is latent, tested capability — retiring it would be destructive and irreversible. The right disposition is to **park** it (record it as intentional, exempt it from the shelfware threshold, and set a dated review). Separately, `intrinsic-telemetry` is the one watch-listed module that is genuinely dead — superseded by the static `tools/adoption-scan.mjs` import-surface scanner — so it is **retired**.

## What shipped

- **Parked the 8-module MA/MB/MD control-theory island:** `ace` (MA-2, sink), `eligibility` (MA-1), `lyapunov` (MB-1), `projection` (MB-2), `dead-zone` (MB-5), `langevin` (MD-3), `temperature` (MD-4), `learnable-k_h` (MD-5). Recorded as 8 `tools/adoption-scan.allowlist.json` entries (each `addedBy: v972 D3 control-theory island park`), with a **generic** resume condition (a future learning-loop runtime consumes the substrate — not v1.50-specific) + a **dated** retire-or-resume review gate (2027-06-04) carried in each `reason`. New `docs/learning-substrate-parked.md` documents the topology, the flag-off byte-identical guarantee, and the roster derivation; `docs/SHELFWARE-VERDICTS.md` gets a consolidated ALLOWLISTED row.
- **Roster is principled, not arbitrary:** of the 11 MA/MB/MD-family modules, the 3 that are genuinely production-reachable (`stochastic` ← orchestration/branches, `embeddings` ← 12 callers, `representation-audit` ← CLI dispatch) are **deliberately excluded**. `lyapunov`/`projection` read `living` by the current import scanner only via intra-island imports — exactly the reachability-v2 case (audit Ship 3.1); the allowlist `reason` records that.
- **Retired `intrinsic-telemetry`:** deleted `src/intrinsic-telemetry/` (5 files) and un-registered it from `heuristics-free-skill-space` (the `HeuristicsFreeModule` union, the config interface/DEFAULTS/parse branch in `settings.ts`, the `HEURISTICS_FREE_MODULES` registry in `index.ts`, and the integration-test assertions — keeping the other Half-B modules); cleaned 3 dangling prose references; `docs/SHELFWARE-VERDICTS.md` RETIRED row; regenerated `INVENTORY-MANIFEST.json` (153 subsystems, was 154).
- **Drift-guard:** `tests/integration/learning-substrate-parked.test.ts` pins the 8-module park (allowlisted + provenance + dated gate + doc) and the retirement (dir gone, un-registered) as a Layer-1 vitest test — no new pre-tag-gate shell step.

## Verification

- Drift-guard 5 tests pass; `tsc --noEmit` clean; heuristics-free + adoption + full tools-suite (832 tests) green; `adoption-scan` confirms the 8 modules `allowlisted=true` and persistent-shelfware dropped 44 → 39.
- Pre-tag-gate: all 20 checks PASS. **CI initially failed** on the `INVENTORY-MANIFEST.json` drift control (deleting a subsystem changed the inventory) — caught on origin/dev, fixed by regenerating the manifest and folding it into the commit, re-pushed → CI green.
- Adversarial pre-push review (5 lenses → adversarial verify): **0 confirmed findings.**

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship)
- **Manifest lesson count:** 151 (unchanged — applies existing #10461 gate-enforce/drift-guard pairing + the D3 resolutions; no new promotion)
