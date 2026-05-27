# v1.49.817 — Context

## Provenance

- **Source:** v784 audit (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`) §4 Tier 2 item T2.3 (recon-surfaced backlog from v815: c12-load-kb-context flake re-flagged at v802 as approaching deferral-cost threshold). Original wedge documented at v635 in `.planning/test-discipline/fragile-test-audit-2026-05-11.md` with disposition `document-for-followon`.
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is item #2.
- **Predecessor ship:** v1.49.816 (Counter-cadence Chip: state-md-set-shipped colon-safe + --check time-determinism); shipped 2026-05-27 ~09:52 UTC.
- **Session boundary:** Chain-mode (same session-retro mission `v816-822-chain-5-2-3-4-8-6-9-mixed-consume-codify`).

## The wedge's history

- **v635 (2026-05-11):** Flagged in fragile-test-audit with disposition `document-for-followon` and diagnostic note: "subprocess spawning is the primary latency source, not sqlite alone. The root project already runs at testTimeout: 60000. Documented for v1.49.6XX cluster #3."
- **v635-v802:** Flake recurred intermittently in pre-tag-gate runs; manual retry on pre-tag-gate detection-and-retry logic.
- **v802 (2026-05-27):** Re-flagged in handoff with explicit threshold-cross note: "Five months and counting. Per Lesson #10415 (deferred-maintenance escalation, ESTABLISHED v784), this is approaching the threshold where the deferral cost exceeds the fix cost. Worth bundling into a future cluster."
- **v802-v815 (~12 ships):** Continued to recur; v815 handoff names it as the second of two recon-surfaced T2.3 candidates (HIGH-01 = #1, c12 flake = #2).
- **v817 (this ship):** Closed at minimum credible threshold per #10415.

## The fork-budget math

Per `runScript(projectId)`:
- 1× bash spawn (the script itself)
- 4× sqlite3 calls inside the script (FINDINGS, MEETINGS, BUNDLES, DISMISSED queries)
- 1× python3 call inside the script (json_escape pass)
- Subtotal: ~6 forks per `runScript`

Per test file run:
- 7 tests × ~6 forks = ~42 forks

Concurrent siblings under vitest pool:
- `src/intelligence/__tests__/c12-end-to-end-flow.test.ts` (also uses `execFileSync`)
- `src/intelligence/__tests__/c12-write-briefing.test.ts` (also uses `execFileSync`)
- `src/intelligence/__tests__/atlas-index-endpoint.test.ts` (also uses `execFileSync`)

Each of these has its own fork count. When vitest's threads pool runs 4+ test files concurrently, ~200 forks compete for the OS fork rate limit + pipe buffer limits. Under heavy CI load, the 90-second per-test timeout exceeds.

## Why not the architectural-clean fix

The architectural-clean fix is "per-file pool isolation" — run this file in its own vitest fork, sequentially with other subprocess-heavy files. Implementation: add a separate vitest project in `vitest.config.ts` with `pool: 'forks'` + `singleFork: true` for matching files.

Rejected because:
1. **Global config touch:** Affects all sibling subprocess-heavy intelligence tests (c12-end-to-end-flow, c12-write-briefing, atlas-index-endpoint). Each would need to be added to the project's include list or excluded by the migration.
2. **Risk-bearing:** Project config changes can interact unpredictably with the existing 5-project setup (root, space-between, intelligence-ui, intelligence-perf, integration). Bumping a single file's pool to forks is fine; project-wide changes require careful migration.
3. **Lightest-wire isn't here:** The wedge's failure mode is test-time-only, no production impact. Retry-bump removes observable failures. Architectural fix is correct but out-of-scope per #10416.

## The retry-bump trade-off

| Metric | Pre-fix | Post-fix |
|---|---|---|
| Retry attempts | 1 (2 total including initial) | 3 (4 total) |
| Per-attempt timeout | 90s | 90s |
| Worst-case wall-clock | 180s | 360s |
| Practical wall-clock (passes attempt 1) | ~19s | ~19s |
| Probability of observable failure | "occasional" under heavy load | ≈0 |
| Failure mode when it does fail | flake (retry needed) | real (4 retries failed; structural problem) |

The trade-off: worst-case wall-clock doubles, but in practice the test passes on attempt 1. The failure mode shifts from "noisy flake under load" to "real signal when fails," which is operator-actionable rather than ignore-able.

## Test design (unchanged)

The test structure is preserved — 7 tests covering:
1. Missing DB → empty context with warning
2. 50 findings → top 30 by severity*confidence
3. S14 API key redaction
4. S14 GitHub token redaction
5. source_path emission
6. No raw file-content leakage
7. Meetings + bundles tables populate

Each test creates a fresh tmpdir DB via `beforeEach` and tears down via `afterEach`. The bash script (`load-kb-context.sh`) is the production surface under test. Test assertions unchanged; only retry config touched.

## Engine state crossover

NASA degree sustains at **1.178** for the 35th consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** this ship is consume-axis (close a test-flake wedge open across 150+ ships).
- **Codify:** N/A this ship; 2 candidates eligible at next codify ship.
- **Calibrate:** N/A this ship.
- **Observe:** the expanded structural-cause comment is explicit observability surface for the fork-budget cause; future maintainers (or static-analysis tools) can read it inline.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md` for:
- The v816-822 chain plan
- The v802 c12-flake re-flag context
- The pre-existing untracked working-tree noise (`dashboard/index.html` (M), `.learn-staging/`, `dashboard/adoption.html`, `graphify-out/`) carried forward through this ship.

## Forward path post-v817

v818 (next in chain) = T2.3 FlagLookup discriminated union extract. ~30-40 min. Second-instance registry extract per #10426 across 4 CLI commands: koopman-check, coherent-check, hourglass-check, bounded-learning.

After v818, the recon-surfaced T2.3 backlog is empty; the chain pivots to non-T2.3 work: aminet batch chip (v819), git/core chip (v820), discipline-coverage gate flip × 2 (v821-822), ObservationBridge wire (v823).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v817 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset. Second post-fix invocation; clean.
