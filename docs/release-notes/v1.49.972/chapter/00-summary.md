# v1.49.972 — Summary

## The ship

D3 of the 2026-06-03 audit plan disposes the control-theory learning substrate, which stopped growing and never gained a runtime consumer. It **parks** the 8-module MA/MB/MD island (`ace` the import sink + 7 modules reachable only within the island — flag-gated default-OFF, flag-off byte-identical, latent tested capability) rather than wiring it (`ace` is the sink → wiring advances 1/8) or retiring it (destructive). It separately **retires** `intrinsic-telemetry`, the one genuinely-dead watch-listed module (superseded by the static adoption scanner). No runtime behavior change.

## What shipped

- **Park (8 modules):** `ace` (MA-2), `eligibility` (MA-1), `lyapunov` (MB-1), `projection` (MB-2), `dead-zone` (MB-5), `langevin` (MD-3), `temperature` (MD-4), `learnable-k_h` (MD-5). 8 `tools/adoption-scan.allowlist.json` entries with a generic resume condition + dated review gate (2027-06-04) in each `reason`; new `docs/learning-substrate-parked.md`; consolidated SHELFWARE-VERDICTS ALLOWLISTED row. The 3 production-reachable family modules (`stochastic`, `embeddings`, `representation-audit`) are deliberately excluded.
- **Retire:** deleted `src/intrinsic-telemetry/` + un-registered it from `heuristics-free-skill-space` (settings union/interface/DEFAULTS/parse + `HEURISTICS_FREE_MODULES` registry + integration test) + cleaned 3 dangling prose refs + SHELFWARE-VERDICTS RETIRED row + regenerated `INVENTORY-MANIFEST.json` (153 subsystems).
- **Drift-guard:** `tests/integration/learning-substrate-parked.test.ts` pins park + retirement (Layer-1 vitest, no new gate step).

## Verification

- Drift-guard 5/5; `tsc` clean; heuristics-free + adoption + tools-suite (832) green; `adoption-scan` shows the 8 `allowlisted=true`, persistent-shelfware 44 → 39.
- Pre-tag-gate all 20 PASS. CI initially failed on `INVENTORY-MANIFEST.json` drift (subsystem deleted) → regenerated manifest, amended, re-pushed, CI green.
- Adversarial pre-push review: **0 confirmed findings.**

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **151** (unchanged).
