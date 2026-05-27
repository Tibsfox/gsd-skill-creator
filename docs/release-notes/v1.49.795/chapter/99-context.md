# v1.49.795 — Context

## What this ship is

v1.49.795 is the first ship in the Tier 1 audit roadmap's T1.1 arc (bounded-learning calibration loop, 4-6 ships). Lands a new peer module in `src/bounded-learning/` carrying the primitive + a `skill-creator bounded-learning` CLI that consumes operator acceptance decisions and emits anytime-valid recommendations to adjust skill-creator configuration thresholds. With `--apply`, recommendations are atomically written back to `.planning/skill-creator.json`. Per-ship wall-clock: ~75 min from recon start to T14 ship sequence.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship. Counter-cadence count stays at 5.
- Not a shelfware verdict ship — `src/bounded-learning/` was already `living` via the `two-gate/` sub-namespace; this ship adds a peer module within the namespace.
- Not a refactor. No existing files were rewritten; all 8 new TypeScript files are additions.

## Predecessors (Audit-2026-05-26 streak)

- v1.49.794 — Deterministic gate for #10424 (adoption-refresh overwrite guard).
- v1.49.793 — Shelfware Verdicts 5 + 6 (Math Foundations Refresh cluster CLOSED, 6/6 modules verdicted).
- v1.49.792 — Shelfware Verdict 4 (WIRED `koopman-memory`).
- v1.49.791 — Shelfware Verdicts 2 + 3 (ALLOWLISTED `tonnetz` + `wasserstein-hebbian`).
- v1.49.790 — Codification of v785-v789 lesson cluster (7 lessons → 2 new disciplines).
- v1.49.789 — Shelfware Verdict 1 (WIRED `semantic-channel`).
- v1.49.785-v1.49.788 — PROJECT.md normalizer + adoption telemetry scanner/dashboard/automation + NASA 1.178 IBEX.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version) + Lesson #10424 (adoption-refresh post-bump-version, now gate-enforced). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:

- The v794-installed `checkOverwriteGuard` in `tools/adoption-refresh.mjs` fires again at T14 step 11 of this ship (file `docs/ADOPTION-BASELINE-v1.49.795.json` is absent at first-run → guard returns early). Second consecutive ship under the active gate; the v791 trip class continues to hold closed.
- Step 2.6 (citation-debt auto-update) is N/A for this ship (no V-flag emit/close/state blocks in retrospective).
- Adoption-baseline diff at step 11 will emit one status change: `↑ bounded-learning: test-only → living` (the new CLI importer flips the namespace's classification). _Note: depending on the prior baseline's bookkeeping for the pre-existing `two-gate/` sub-namespace, the diff may report no change if the namespace was already `living` before this ship via that path._

## Forward path

T1.1 ships 2-6 candidates:

- **Ship 2 — Wire a second threshold.** `suggestions.cooldown_days` or `token_budget.warn_at_percent` is the natural next member of `CalibratableThreshold`.
- **Ship 2 alt — Audit log.** Append `(timestamp, threshold, observations, decision, applied)` to `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the no-history gap flagged in the retrospective.
- **Ship 2 alt — `--watch` mode.** Re-run the loop on `.planning/patterns/suggestions.json` changes (cross-session calibration).
- **Ship 3 — Multi-threshold coordination.** When two thresholds both have rejection evidence, decide which to adjust first (e.g. closer-to-floor first, or larger-evidence-margin first).
- **Ship 4-6 — Real-data backfill from session retros.** Operator-decision data may already exist in `.planning/sessions/*.jsonl`; a backfill tool would seed the loop with historical observations.

Other forward candidates queued:

- **NASA 1.179 forward-cadence.** INTERSTELLAR-BOUNDARY axis obs#3 continuation queued in `www/tibsfox/com/Research/NASA/1.178/to-1.179.md`.
- **Path B — T1.3: College of Knowledge consumer engine** (3-5 ships).
- **Strengthening Levers — S3/S4/S6/S7** remain OPEN.

## Audit-2026-05-26 streak status

v795 is the 11th ship in the AUDIT-2026-05-26 series. Through-line:

- v785 — PROJECT.md normalizer (T1.4 + S5)
- v786 — Adoption telemetry scanner (T1.2 ship 1)
- v787 — Adoption telemetry dashboard + automation + allowlist (T1.2 ship 2)
- v788 — IBEX NASA 1.178 (engine advance interleaved)
- v789 — First shelfware verdict (WIRED semantic-channel)
- v790 — Codification of v785-v789 lesson cluster
- v791 — Shelfware verdicts 2+3 (ALLOWLISTED × 2)
- v792 — Shelfware verdict 4 (WIRED koopman-memory)
- v793 — Shelfware verdicts 5+6 (WIRED × 2; cluster CLOSED)
- v794 — Deterministic gate for #10424
- **v795 — T1.1 ship 1: bounded-learning calibration loop (this ship)**

Net delivery: 1 normalizer + 3 adoption-telemetry surfaces + 6 shelfware verdicts + 1 NASA degree advance + 8 ESTABLISHED lessons + 1 deterministic gate + 1 new T1.1 vertical. ~9 hours wall-clock total across 11 ships.

This is the largest single-day audit-cadence segment in the project's history.
