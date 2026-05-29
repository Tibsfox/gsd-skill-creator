# v1.49.912 — Gate-Tightening Micro-Ship: Discipline-Coverage Ceiling Ratchet (41 → 5) + PARTIAL Companion Ceiling

**Released:** 2026-05-29

Counter-cadence gate-tightening micro-ship — the direct realization of the forward candidate v911's own retrospective named ("ratchet the ceiling down… to 5 or 10" + "add the `--max-partial=N` companion the v910 retro proposed"). With v910 (PARTIAL 8 → 0) and v911 (UNCODIFIED 39 → 0) having drained both discipline-coverage buckets to zero, the `--max-uncodified=41` gate was left with 41 entries of slack. This ship restores near-term sensitivity and closes a parsed-but-ungated asymmetry.

- **Ratchet** — `SC_DISCIPLINE_COVERAGE_CEILING` default **41 → 5** in `tools/pre-tag-gate.sh` step 13. Restores sensitivity now that the backlog is drained; the env-var override remains the forward-progress escape valve for when a fast-accumulating NASA degree-advance run resumes.
- **PARTIAL companion ceiling** — NEW `SC_DISCIPLINE_PARTIAL_CEILING` (default **5**), gated independently of UNCODIFIED. The v910 retro flagged that step 13 parsed `PARTIAL_COUNT` but never gated on it — PARTIAL drifted to 8 unchecked across the whole v903–v909 campaign. A metric a gate computes but never enforces is silent-drift surface.
- **`--max-partial=N` flag** — added to `tools/check-discipline-coverage.mjs`, mirroring the existing `--max-uncodified=N` (exit 1 when PARTIAL exceeds N).
- **First test coverage for the tool** — `tools/__tests__/check-discipline-coverage.test.mjs` (NEW, 16 spawn-based tests over a ground-truth fixture), registered in `vitest.tools.config.mjs`. Closes the static-analysis-tool test-discipline gap (#10417 spawnSync, #10450 non-vacuous fixtures) for a tool that had zero tests.

Counter-cadence count: 12 → 13. **UNCODIFIED 0 / PARTIAL 0 UNCHANGED** — but the ceilings tighten 41/∞ → **5/5**. Manifest entries 24 and lessons 147 UNCHANGED (no codification). KNOWN_UNWIRED Process/Egress/Loader unchanged at 0/0/0. NASA degree unchanged at 1.178 (**130 consecutive ships** at the margin record).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons codified
- [99-context.md](chapter/99-context.md) — provenance + forward path

## What this ship is

- A counter-cadence gate-tightening micro-ship (counter-cadence #13), per the #10430 finer-grained ~5-ship maintenance cadence.
- Code + test: it tightens the discipline-coverage gate and adds the tool's first test suite.
- Operator-selected (via AskUserQuestion) over the recommended NASA-1.179 default; ceiling design (tight & symmetric 5/5, both BLOCK) operator-confirmed.

## What this ship is not

- Not a codify ship — no `tools/render-claude-md/disciplines.json` change, no new manifest lessons, CLAUDE.md unchanged.
- Not a chokepoint chip (all three Tier-E ledgers remain at KNOWN_UNWIRED 0).
- Not a NASA degree advance (still 1.178; 130 consecutive ships at the margin record).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **130 consecutive ships**; pressure-margin record extended by 1).
**Counter-cadence count: 12 → 13** (+1).
**Manifest entries: 24** (UNCHANGED); **lessons in manifest: 147** (UNCHANGED — no codification this ship).
**Discipline-coverage: UNCODIFIED 0 / PARTIAL 0** (both UNCHANGED) — ceilings ratcheted: UNCODIFIED **41 → 5**, PARTIAL **(none) → 5** (headroom 5/5; both BLOCK on exceed).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 0.
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
Pre-tag-gate step count: **18** (UNCHANGED — step 13 modified, no step added).
Vitest main suite: **35,562** (UNCHANGED — new tests run in the `vitest.tools.config.mjs` suite, +16).

## Files touched

- `tools/check-discipline-coverage.mjs` (UPDATED — `--max-partial=N` flag + help + header)
- `tools/pre-tag-gate.sh` (UPDATED — step 13: ratchet 41→5, add PARTIAL ceiling, independent gating restructure)
- `tools/__tests__/check-discipline-coverage.test.mjs` (NEW — 16 spawn-based tests)
- `vitest.tools.config.mjs` (UPDATED — register the new test)
- `docs/known-unwired-ledger-discipline.md` (UPDATED — ceiling case-study post-drain-ratchet + symmetric-companion extension, #10434)
- `docs/release-notes/v1.49.912/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v912 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.911 → 1.49.912)
