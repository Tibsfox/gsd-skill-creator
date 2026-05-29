# v1.49.888 — Bounded-Learning Read-Side Wire: `token_budget.max_percent`

**Released:** 2026-05-28

## Why this ship

Third instance of the #10451 calibrate-axis read-side wire recipe codified at v886. v837 wired `predictive.low_confidence_threshold`; v884 wired `observation.retention_days`. Both shipped clean, codified the 7-step pattern as 2-instance ESTABLISHED. v888 applies the same recipe a third time to `token_budget.max_percent` — the last UNWIRED entry in the v882 verify-overdue scan. Promotes #10451 from 2-instance ESTABLISHED to 3-instance STABLE.

## What's in this ship (applies #10451's 7 steps verbatim)

1. **New events module mirror.** `src/bounded-learning/token-budget-max-events.ts` (~190 LOC) mirrors `predictive-low-confidence-events.ts` + `observation-retention-events.ts`. Event kinds `under_budget` (+1, favor lower) / `blocked` (-1, favor raise). Polarity matches the warn-events sibling and observation-retention; distinct from predictive's inverted shape.
2. **Dispatcher branch + wired-flag flip.** `src/bounded-learning/observation-sources.ts`:
   - New `tokenBudgetMaxEventsPath?: string` option.
   - `observationSourceFor('token_budget.max_percent')` now returns `wired: true` with `sourceId: 'token-budget-max-events'`.
   - `loadObservationsForThreshold` dispatches to `readTokenBudgetMaxEvents` + `tokenBudgetMaxEventsToObservations`.
3. **Public API exports with alias.** `src/bounded-learning/index.ts` re-exports the new module's surface using `as` aliases (e.g. `tokenBudgetMaxEventKindToValue`) to avoid collision with sibling modules' identically-named exports.
4. **CLI manual recorder.** `src/cli/commands/bounded-learning.ts`:
   - `token_budget.max_percent` added to `SUPPORTED_THRESHOLDS`.
   - `runRecordEvent` dispatches on `--threshold token_budget.max_percent` → new `runRecordTokenBudgetMaxEvent` function.
   - Flags: `--kind under_budget|blocked`, `--usage-percent`, `--max-percent`, `--reason`, `--token-budget-max-events <path>`.
   - `ctx` threads `tokenBudgetMaxEventsPath` through `loadObservationsForThreshold`.
   - Help text updated.
5. **Read-side tests.** `src/bounded-learning/__tests__/token-budget-max-events.test.ts` (~150 LOC, 13 tests): polarity, observation lift, append/read round-trip, malformed-line tolerance, unknown-kind skip, incomplete-line skip.
6. **Dispatcher tests with wired-flag flip + round-trip.** `src/bounded-learning/__tests__/observation-sources.test.ts`:
   - Flips "max_percent unwired" → "max_percent WIRED" (matches v884's flip for observation-retention).
   - Adds round-trip test exercising the new dispatch path with `tokenBudgetMaxEventsPath` injection.
   - Adds honest-baseline test for missing JSONL.
7. **CLI `--summary` count bump.** `bounded-learning.test.ts` `--summary` test asserts 7 thresholds (was 6).
8. **`tools/calibratable/verify-overdue-scan.mjs`** notes field updated for `token_budget.max_percent` to reflect v888 wire + deferred substrate per #10439.
9. **`src/bounded-learning/__tests__/audit-log.test.ts`** assertion flipped to expect `wired: true` + `sourceId: 'token-budget-max-events'` (matching the dispatcher's new behavior).

## What this ship is

- A forward-cadence calibrate-axis chip ship per v883 forward-path option 3.
- Third instance application of #10451's 7-step recipe.
- Promotes #10451 evidence from 2-instance ESTABLISHED → 3-instance STABLE.

## What this ship is not

- Not a substrate auto-emit (deferred per #10439 staging — same path as v837 → v846 and v884 → v891 substrate ships).
- Not a NASA degree advance (still 1.178; 106 consecutive ships at margin record).
- Not a chokepoint chip (Loader KNOWN_UNWIRED unchanged at 14 after v887).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **106 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — application of existing #10451 recipe; promotes to 3-instance STABLE which is a within-lesson refinement, not a new lesson).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
KNOWN_UNWIRED Loader UNCHANGED at 14.
**Wired calibratable thresholds: 5 of 7 → 6 of 7** (`token_budget.max_percent` flips wired; only `observation.retention_days` substrate auto-emit remains).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/bounded-learning/token-budget-max-events.ts` (NEW — 190 LOC)
- `src/bounded-learning/observation-sources.ts` (UPDATED — dispatcher branch + wired flip + new option)
- `src/bounded-learning/index.ts` (UPDATED — exports with `as` aliases)
- `src/cli/commands/bounded-learning.ts` (UPDATED — SUPPORTED_THRESHOLDS + runRecordTokenBudgetMaxEvent + ctx threading + help text)
- `src/bounded-learning/__tests__/token-budget-max-events.test.ts` (NEW — 13 tests)
- `src/bounded-learning/__tests__/observation-sources.test.ts` (UPDATED — flip + round-trip)
- `src/bounded-learning/__tests__/audit-log.test.ts` (UPDATED — wired-flag flip)
- `src/cli/commands/bounded-learning.test.ts` (UPDATED — `--summary` 6 → 7)
- `tools/calibratable/verify-overdue-scan.mjs` (UPDATED — notes for max_percent)
- `docs/release-notes/v1.49.888/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v888 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.887 → 1.49.888)
