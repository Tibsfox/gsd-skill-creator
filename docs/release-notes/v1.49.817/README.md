> Following v1.49.816 — _Counter-cadence Chip: state-md-set-shipped colon-safe milestone_name + --check time-determinism_, v1.49.817 closes the v816-822 chain's second item: the c12-load-kb-context test flake re-flagged at v802 as approaching the deferral-cost threshold per #10415. 5-month flake; isolated runs pass in ~10s but the test times out under vitest parallel-pool fork-spawn contention. Closure: bump `retry: 1 → 3` (4 total attempts) + structural-cause comment documenting the architectural fork-budget issue + deferral note for per-file pool isolation (would require vitest.config.ts project changes).

# v1.49.817 — T2.3 Wedge Close: c12-load-kb-context Flake (retry-bump + structural-cause documentation)

**Shipped:** 2026-05-27

Second ship of the v816-822 chain (item #2 of 7). Closes the second remaining audit-listed T2.3 wedge from the v784 audit: `src/intelligence/__tests__/c12-load-kb-context.test.ts` flakes under full-suite parallel-pool execution while passing reliably in isolation. The wedge was originally flagged at v635 in `.planning/test-discipline/fragile-test-audit-2026-05-11.md` with disposition `document-for-followon`; re-flagged at v802 as approaching the deferral-cost threshold; v817 closes per #10415.

## What shipped

- **MODIFIED** `src/intelligence/__tests__/c12-load-kb-context.test.ts` — bumps the `describe`-block `retry` parameter from `1` to `3` (4 total attempts × 90s timeout = 360s max wall-clock, vs. ~10s isolated runtime). Replaces the 3-line "subprocess-heavy" comment with an 8-line structural-cause comment block documenting (a) the fork-budget math (4× sqlite3 + 1× python3 + 1× bash = ~6 forks per `runScript`; ~42 forks per file; concurrent with sibling subprocess-heavy intelligence test files), (b) the v635/v802/v817 history, (c) the explicit deferral of per-file pool isolation per #10416 (would require global vitest.config.ts changes).

## Why retry-bump rather than deeper restructure

Per #10416 lightest-wire / tolerant-generator + #10415 minimum-credible-threshold:

| Option | Effort | Effect | Trade-off |
|---|---|---|---|
| **Bump retry 1→3 (chosen)** | 1-line | Probability of all-attempts-fail ≈ 0 | Doesn't fix root cause; ~360s worst-case |
| Per-file fork isolation via vitest.config.ts | 10+ LOC project config | Architectural fix | Touches global config; affects sibling test files; risk-bearing |
| Merge 4 sqlite3 calls in bash script | 30+ LOC bash refactor | Reduces fork count by ~75% | Touches production surface; complicates parsing |
| Convert to async spawn (lets worker yield) | refactor all tests in file | Reduces fork-time blocking | Requires async test bodies + may break the integration property |
| Drop integration; mock the bash script | rewrite tests as unit tests | Removes flake entirely | Loses bash-script integration coverage |

Chose retry-bump because (a) the structural cause (parallel pool fork contention) requires project-wide changes that affect siblings (deferred), (b) the practical effect (zero observable failures) is the operator-visible measure, (c) it's reversible if a future ship lands the architectural fix.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| c12-load-kb-context | 7 (unchanged) | Same 7 tests; retry-budget tripled |
| Wall-clock isolated | ~19s (1 attempt × 7 tests) | Unchanged in normal case |
| Wall-clock worst-case | ~360s (4 attempts × 90s) | Was ~180s (2 attempts × 90s) |
| **Total added** | **+0** | Tests unchanged; only retry config |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 35 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — wedge-closure ship).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## Audit-retrospective wedge ledger

| Wedge | Status at v816 | Status at v817 |
|---|---|---|
| HIGH-01 PMTiles refcounted close | CLOSED v815 | unchanged |
| c12-load-kb-context flake | OPEN (~150 ships from v635) | **CLOSED v817** (retry-bump + structural-cause documentation) |
| FlagLookup discriminated union extract | OPEN (30+ ships from v796) | unchanged (v818 target) |
| Math-foundations integration tests | CLOSED (already) | unchanged |
| L-06 Research-CSV schema-stability | DEFERRED (no incident) | unchanged |
| v671 Gate 2 | CLOSED v676 cc1 | unchanged |
| v671 Gate 3 | DEFERRED (needs obs#3+) | unchanged |
| SCRIBE CAP-024/046/047/041 | OPEN as forward-looking deferrals | unchanged |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a behavior change for the test (assertions unchanged).
- Not an architectural fix (per-file pool isolation deferred).
- Not a closure of the entire T2.3 backlog — FlagLookup extract remains for v818.

## Forward path

v818 (next in chain) targets FlagLookup discriminated union extract — second-instance registry extract per #10426 across 4 CLI commands.
