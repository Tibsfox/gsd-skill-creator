# v1.49.912 — Gate-Tightening Micro-Ship: Discipline-Coverage Ceiling Ratchet + PARTIAL Companion

**Released:** 2026-05-29

## Why this ship

v910 drained the discipline-coverage PARTIAL bucket (8 → 0) and v911 drained the UNCODIFIED bucket (39 → 0). For the first time in the project's history both buckets are at zero. But the gate that watches them was calibrated for the standing backlog: `SC_DISCIPLINE_COVERAGE_CEILING` defaulted to 41 (current 39 + 2 buffer at v822). With the bucket now at 0, that ceiling has **41 entries of slack** — it would not fire until a large new backlog reaccumulated. The gate's sensitivity decayed the moment the backlog drained.

v911's own retrospective named this exact follow-on: *"ratchet the ceiling down (e.g. to 5 or 10) so new UNCODIFIED drift surfaces as a near-term WARN rather than silently filling toward 41"* and *"add the `--max-partial=N` companion the v910 retro proposed."* The operator selected this gate-tightening micro-ship (over the recommended NASA-1.179 default) and confirmed the tight-and-symmetric 5/5 design.

A second, independent gap closed here: step 13 of `tools/pre-tag-gate.sh` already parsed `PARTIAL_COUNT` out of the coverage tool's output but **never gated on it** — it only evaluated PARTIAL inside the `UNCODIFIED > 0` branch and never compared it to any ceiling. PARTIAL drifted to 8 unchecked across the entire v903–v909 campaign precisely because of this. A metric a gate already computes but never enforces is silent-drift surface.

## What's in this ship

### Tool — `tools/check-discipline-coverage.mjs`

- NEW `--max-partial=N` flag: exit 1 when the PARTIAL bucket count exceeds N. A faithful mirror of the existing `--max-uncodified=N` (strict-greater comparison; equality passes; arg validation rejects negative / non-integer / non-numeric with exit 2; `--json` suppresses the stderr message but still exits 1).
- `--help` and header comment updated to document the new flag and the augmented exit-code semantics.
- Output format unchanged — the new logic is a stderr-only block appended after the report; stdout (which the gate greps for `UNCODIFIED.*: N` / `PARTIAL.*: N`) is untouched.

### Gate — `tools/pre-tag-gate.sh` step 13

- `SC_DISCIPLINE_COVERAGE_CEILING` default **41 → 5**.
- NEW `SC_DISCIPLINE_PARTIAL_CEILING` (default **5**).
- Restructured so UNCODIFIED and PARTIAL are gated **independently**: the outer guard is now `UNCODIFIED > 0 OR PARTIAL > 0`, a `DISCIPLINE_COVERAGE_BLOCK` flag aggregates either ceiling-exceed, and either exceeding its ceiling BLOCKs with exit 15. Previously a PARTIAL-only overflow (UNCODIFIED 0, PARTIAL high) could never block.
- Legacy strict mode (`SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`) preserved and intentionally UNCODIFIED-only — PARTIAL is gated solely by its own ceiling. The header comment now states this asymmetry explicitly so it is not mistaken for a gap.

### Test — `tools/__tests__/check-discipline-coverage.test.mjs` (NEW)

- 16 spawn-based tests (`spawnSync` per #10417) over a temp-repo fixture engineered to produce ground-truth-by-construction counts (COVERED 1 / PARTIAL 2 / UNCODIFIED 2; one single-ref lesson dropped). Per #10450 the fixture is non-vacuous — the counts are known before the tool runs.
- Covers: classification at the known counts, the human-readable count-lines the gate greps, both ceilings (over / under / equal boundaries), check ordering, `--json` stderr suppression, arg validation, `--help`, and a live apply-to-self assertion of the drained 0/0 baseline.
- Registered in `vitest.tools.config.mjs`. This is the tool's **first** test coverage — it was gate-critical infrastructure with zero tests.

### Discipline doc — `docs/known-unwired-ledger-discipline.md`

- The ceiling case-study (#10434, the canonical home for the count-ledger-ceiling pattern) extended with a "Post-drain ratchet + symmetric companion ceiling (v1.49.912)" subsection documenting both moves and the underlying rule.

## Verification

- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/check-discipline-coverage.test.mjs` → 16/16 pass.
- `bash -n tools/pre-tag-gate.sh` → OK. BLOCK-decision logic verified across the boundary state-matrix (PASS at 0/0, WARN within-ceiling including the equal boundary, BLOCK when either exceeds).
- Adversarial verification (3 independent reviewers — tool / gate-shell / test) returned **clean**; the test reviewer confirmed via live mutation testing that deleting the `--max-partial` enforcement fails exactly 2 tests. Three minor/nit findings applied (strict-mode comment clause, `:-0` ceiling fallback, tighter live-baseline assertion).
- `node tools/check-discipline-coverage.mjs` → COVERED 131, PARTIAL 0, UNCODIFIED 0 (engine state unchanged; well within the new 5/5 ceilings).
