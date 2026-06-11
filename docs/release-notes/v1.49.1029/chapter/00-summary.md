# v1.49.1029 — Summary

## The ship

AUDIT-2026-06-09 §10 ship 3, the promotion ship. Closes lead G (adversarial review advisory with K
never defined) and the §9 N-B lever (staged mechanisms shipped without promotion criteria). Gate
steps 20 (adoption-freshness) and 21 (trip-vocab) flip WARN-only → default-BLOCK; T14 step P flips
ADVISORY → REQUIRED, enforced by new gate step 22 validating a per-ship attestation artifact (gate
grows 21 → 22 steps). Every promotion carries its auditable K=30 record via the new
warn-promotion readiness reporter. The committed ship-review workflow absorbs the NASA 4-auditor
judge IP (§4b). Design pass at `.planning/SHIP-v1.49.1029-DESIGN.md`.

## What shipped

- **`tools/gate/warn-promotion-readiness.mjs`** — three deterministic evidence models (baseline
  tail 64/30; NASA-page clean tail 30/30 bounded sweep; all-time reviewed-release count 55/30 with
  in-range sub-count 20 and the NASA-band under-count disclosed), K=30, lifecycle-aware
  `PROMOTION-MARKER` detection with post-flip revert guidance, fixture-injectable; 61 tests.
- **Steps 20/21 default-BLOCK** — verdict exits (1) BLOCK at exits 23/25; tool-malfunction exits
  (2) stay WARN on both steps; REQUIRE escalation branches removed as meaningless; markers record
  K + evidence + reporter command.
- **Step 22 `ship-review-attestation` (exit 26)** — `write-attestation.mjs` writes/validates
  `.planning/ship-review/last-attestation.json` (`--check`: fields + HEAD-ancestry + newer-than-tag
  freshness); STATE.md-discriminated CI SKIP; denominator renorm 21→22 (~113 lines);
  self-consistency + bypass-vocab + env-vars + T14 + canonical doc all updated; 13 node:test tests.
- **Ship-review v2** — cross-lens synthesis Judge phase (independent re-read, cross-lens dedupe,
  `STANDING_EXCEPTIONS` + `args.exceptions` allow-lists, 3-way verdict enum); no-resurrection rule;
  dead-judge fail-safe; enum severity/confidence on findings; discipline drift-guard 5→9 workflow
  pins + doc pins.
- **Live-caught reporter bug fixed in-ship** — `/step P/i` without a word boundary matched
  "step passes" (~39 NASA dirs), inflating the first live count to 59; fixed with `\b`, negative
  regression pins, the honest all-time model (55/20), and space-form CLI flag support.

## Verification

Full vitest suite green; reporter 61/61; write-attestation 13/13; self-consistency + parity +
discipline 31/31; gate bash test 19/19; tools-test-coverage exit 0. First v2 review dogfooded on
this ship's own diff; first attestation written; gate 22/22 PASS with step 22 born-BLOCK live.

## Engine state

NASA degree 1.217, counter-cadence 29, manifest 152, calibratable thresholds 8 — all unchanged
(code ship). cadence_advances: [consume, verify].
