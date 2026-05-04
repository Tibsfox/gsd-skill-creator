# v1.49.601 — Summary

## Structural firsts

1. **Second counter-cadence operational-debt milestone** (after v1.49.585 Concerns Cleanup). Same pattern: convert prose discipline into deterministic gate. v1.49.585 closed 5 categories at once; v1.49.601 closes 1 category surgically.
2. **First ship triggered by post-ship operator drift discovery on the live site.** The drift was invisible to all gates — `pre-tag-gate` 7 steps + `check-completeness` + CI all PASSED at v598/v599/v600 despite the catalog-index files being stale. The signal came from human eyes on the live URL, not from local tooling. v1.49.601 closes that loop: future drift cannot reach the live site because ftp-sync now refuses to upload stale catalogs.
3. **Pre-tag-gate grows to 8 steps.** This is the first new step since v1.49.596 added step 7 (CLAUDE.md drift). The composite gate evolution: v1.49.585 introduced the gate (4 steps); v1.49.587 added CI-on-dev (step 4) + www-bundles (step 5); v1.49.591 added depth-audit (step 6, BLOCKER); v1.49.596 added CLAUDE.md drift (step 7); **v1.49.601 adds catalog-index drift (step 8, BLOCKER).** Each addition closes a class of silent-drift failure surfaced by post-ship discovery.
4. **First milestone to ship the day after its predecessor.** v1.49.600 shipped 2026-05-04; v1.49.601 ships 2026-05-04. Both atomic ships. Counter-cadence milestones can ship faster than NASA-degree milestones because they have no W1 research wave + no W2 4-track build wave.
5. **First milestone where the operator's discovery → spec → ship cycle was entirely under one session's context.** The drift was caught, the prevention was specced (B + C options proposed), the operator authorized "B & C," v601 was opened, the tool was built, and the milestone shipped — all without context handoff. Demonstrates the operator-in-the-loop pattern at its tightest.

## Engine state at close

- **NASA degree:** 1.80 (Mariner 9; carries forward from v600)
- **MUS degree:** 1.80 (*Nilsson Schmilsson*; carries forward)
- **ELC degree:** 1.80 (Stockholm Conference + UNEP; carries forward)
- **SPS species:** #77 (Gray Whale; carries forward)
- **§6.6 register:** 23 LOCKED (5 watchlist active: LAUNCH-VEHICLE-FAILURE / NWO / DUST-STORM-WAITING-PROTOCOL / PAIRED-REDUNDANT-PROGRAM-DESIGN / PFFA — all carry forward unchanged)
- **TRS substrate:** M1 Wave 2 generation; pack-11 binding pass complete (carries forward)
- **vitest:** 29,494 tests (29,479 baseline from v600 + 15 new catalog-index tests)
- **Pre-tag-gate:** 8 steps (was 7); all PASS

## Phase summary

4 phases (W0 tool authoring · W1 gate integration · W2 verification · W3 ship), 19 deliverable items, all PASS at G3. Total wall-time ~1.5h end-to-end (substantially smaller than NASA-degree milestones because no engine-state work).

## Files changed

| Path | Change | Lines |
|---|---|---|
| `tools/update-catalog-indexes.mjs` | NEW | 461 |
| `tools/__tests__/update-catalog-indexes.test.mjs` | NEW (15 tests) | 367 |
| `tools/pre-tag-gate.sh` | step 8 added; success message updated | ~20 line delta |
| `tools/ftp-sync.mjs` | precondition added when `--include-catalog-index` | ~30 line delta |
| `tools/render-claude-md/env-vars.json` | add `SC_SKIP_CATALOG_INDEX_GATE` | 1 entry |
| `vitest.tools.config.mjs` | add new test file | 1 line |
| `CLAUDE.md` | gates table + env vars + composite gate paragraph + step 8 subsection + exit codes | ~40 line delta |
| `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` | atomic version bump 1.49.600 → 1.49.601 | 5 version slots |

Catalog index files (`www/tibsfox/com/Research/{NASA,MUS,ELC}/index.html`) are NOT modified at v601 — their hand-fix at v600+1 is already ground truth, confirmed by the retroactive --check. They will be re-touched at v602 when the next engine-state milestone advances NASA 1.80 → 1.81.
