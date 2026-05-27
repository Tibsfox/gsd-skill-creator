# v1.49.797 — Context

## What this ship is

v1.49.797 is the third ship in the Tier 1 audit roadmap's T1.1 arc (bounded-learning calibration loop, 4-6 ships), and the first of five chained ships in a single operator-authorized session (v797 → v801). Extends the wired `CalibratableThreshold` whitelist from 2 entries to 3 (adds `suggestions.auto_dismiss_after_days`). Pure extension within v795's threshold-agnostic primitive layer + CLI scaffolding — no new modules, no new CLI commands, no schema changes. Per-ship wall-clock: ~15-20 min, beating the v796 lower bound prediction.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship. Counter-cadence count stays at 5.
- Not a new module. All 6 file changes are modifications (3 source/docstring + 3 test files); the only new files are the 5 release-notes chapter set.
- Not a refactor. No existing tests were edited; new tests appended in new describe blocks.

## Predecessors (Audit-2026-05-26+ streak)

- v1.49.796 — T1.1 ship 2: Wire `suggestions.cooldown_days`.
- v1.49.795 — T1.1 ship 1: Bounded-learning calibration loop (primitive + CLI + writer).
- v1.49.794 — Deterministic gate for #10424 (adoption-refresh overwrite guard).
- v1.49.793 — Shelfware Verdicts 5 + 6 (Math Foundations Refresh cluster CLOSED).
- v1.49.792 — Shelfware Verdict 4 (WIRED `koopman-memory`).
- v1.49.791 — Shelfware Verdicts 2 + 3 (ALLOWLISTED × 2).
- v1.49.790 — Codification of v785-v789 lesson cluster.
- v1.49.789 — Shelfware Verdict 1 (WIRED `semantic-channel`).
- v1.49.785-v1.49.788 — PROJECT.md normalizer + adoption telemetry scanner/dashboard/automation + NASA 1.178 IBEX.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version) + Lesson #10424 (adoption-refresh post-bump-version, gate-enforced). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:

- The v794-installed `checkOverwriteGuard` in `tools/adoption-refresh.mjs` fires again at T14 step 11 of this ship. Fourth consecutive ship under the active gate.
- Step 2.6 (citation-debt auto-update) is N/A for this ship (no V-flag emit/close/state blocks in retrospective).
- Adoption-baseline diff at step 11 is expected to emit no namespace status changes — `bounded-learning` was already flipped to `living` at v795, and no other namespaces changed status this ship.
- **Chained-session note:** v797 is the first of five chained ships (v797 → v801). Each ship's T14 runs in sequence within the same authorized session. Per the "ship-time directives are atomic" memory, each ship's directive state is locked at its own T14 authorization point.

## Forward path

This 5-ship chained session continues with:

- **v798 — Wire `token_budget.warn_at_percent`.** Moves into a different observation-source class. May force an architectural choice about whether `entriesToObservations` is the right signal source for token-budget calibration. First non-trivial wedge in the T1.1 arc.
- **v799 — Audit log.** Append-only `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the no-history gap flagged in v795/v796/v797 retros.
- **v800 — `--watch` mode.** Re-run loop on `.planning/patterns/suggestions.json` changes (cross-session calibration).
- **v801 — `/sc:status` integration.** Operator sees calibration state at session start.

Other forward candidates queued for after the chained session:

- **NASA 1.179 forward-cadence.** INTERSTELLAR-BOUNDARY axis obs#3 continuation.
- **Path B — T1.3: College of Knowledge consumer engine** (3-5 ships).
- **Strengthening Levers — S3/S4/S6/S7** remain OPEN.

## Audit-2026-05-26+ streak status

v797 is the 13th ship in the AUDIT-2026-05-26+ series. The cadence is increasingly bifurcated:

- New-vertical ships (v785, v786, v789, v790, v794, v795): ~60-90 min.
- Extension/verdict ships (v791, v792, v793, v796, **v797**): ~15-45 min.
- NASA degree advances (v788): handled by separate cadence pattern.

Net delivery: 1 normalizer + 3 adoption-telemetry surfaces + 6 shelfware verdicts + 1 NASA degree advance + 8 ESTABLISHED lessons + 1 deterministic gate + 1 new T1.1 vertical + 2 T1.1 extensions. With this chained session, ships 4-7 add 4 more T1.1 surfaces in close sequence.
