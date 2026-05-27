# v1.49.798 — Context

## What this ship is

v1.49.798 is the fourth ship in the Tier 1 audit roadmap's T1.1 arc (bounded-learning calibration loop, 4-6+ ships), and the second of five chained ships in this session (v797 → v801). Extends the wired `CalibratableThreshold` whitelist from 3 entries to 4 (adds `token_budget.warn_at_percent`) AND introduces the per-threshold-class observation-source registry needed to honestly represent that different threshold classes draw from different data sources. The first non-trivial wedge in the T1.1 arc — first ship to introduce new architecture rather than pure extension.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship. Counter-cadence count stays at 5.
- Not the real token-budget observation source. v798 ships an unwired stub for `token_budget.*` classes; the real source (hook into skill-load enforcer + log operator-response events) is a separate future ship.
- Not a refactor in the negative sense — the per-class registry extraction is the discipline-correct second-instance abstraction-extraction moment (see lessons chapter #10426 candidate).

## Predecessors (Audit-2026-05-26+ streak + chained session)

- v1.49.797 — T1.1 ship 3: Wire suggestions.auto_dismiss_after_days (chained session).
- v1.49.796 — T1.1 ship 2: Wire suggestions.cooldown_days.
- v1.49.795 — T1.1 ship 1: Bounded-learning calibration loop (primitive + CLI + writer).
- v1.49.794 — Deterministic gate for #10424.
- v1.49.793 — Shelfware Verdicts 5 + 6 (Math Foundations Refresh cluster CLOSED).
- v1.49.792 — Shelfware Verdict 4 (WIRED `koopman-memory`).
- v1.49.791 — Shelfware Verdicts 2 + 3 (ALLOWLISTED × 2).
- v1.49.790 — Codification of v785-v789 lesson cluster.
- v1.49.789 — Shelfware Verdict 1 (WIRED `semantic-channel`).
- v1.49.785-v1.49.788 — PROJECT.md normalizer + adoption telemetry + NASA 1.178 IBEX.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version) + Lesson #10424 (adoption-refresh post-bump-version, gate-enforced). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:

- The v794-installed `checkOverwriteGuard` in `tools/adoption-refresh.mjs` fires again at T14 step 11 of this ship. Fifth consecutive ship under the active gate.
- Step 2.6 (citation-debt auto-update) is N/A for this ship (no V-flag emit/close/state blocks in retrospective).
- Adoption-baseline diff at step 11 may show no-changes OR may surface the new `observation-sources` module if the scanner detects it. Either outcome is acceptable for v798.
- **Chained-session note:** v798 is the second of five chained ships (v797 → v801). Each ship's T14 runs in sequence within the same authorized session.

## Forward path

This 5-ship chained session continues with:

- **v799 — Audit log.** Append-only `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the no-history gap flagged in v795-v798 retros.
- **v800 — `--watch` mode.** Re-run loop on `.planning/patterns/suggestions.json` changes.
- **v801 — `/sc:status` integration.** Operator sees calibration state at session start.

Other forward candidates queued for after the chained session:

- Real token-budget observation source (hook skill-load enforcer; log operator-response events to a new `.planning/patterns/token-budget-events.jsonl`). Separate ~45-60 min ship.
- **NASA 1.179 forward-cadence.** INTERSTELLAR-BOUNDARY axis obs#3 continuation.
- **Path B — T1.3: College of Knowledge consumer engine** (3-5 ships).
- **Strengthening Levers — S3/S4/S6/S7** remain OPEN.

## Audit-2026-05-26+ streak status

v798 is the 14th ship in the AUDIT-2026-05-26+ series. The chained-session pattern is contributing to a sub-bifurcation:

- New-vertical ships (v785, v786, v789, v790, v794, v795): ~60-90 min.
- Same-class extension ships (v796, v797): ~15-30 min (chained-session warmth visible).
- Cross-class extension + new-module ships (v798): ~45-60 min (architectural-choice tax visible).
- NASA degree advances (v788): handled by separate cadence pattern.

Net delivery: 1 normalizer + 3 adoption-telemetry surfaces + 6 shelfware verdicts + 1 NASA degree advance + 8 ESTABLISHED lessons + 2 candidates (#10425 + #10426) + 1 deterministic gate + 1 new T1.1 vertical + 3 T1.1 extensions (2 same-class + 1 cross-class).
