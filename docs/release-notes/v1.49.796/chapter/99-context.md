# v1.49.796 — Context

## What this ship is

v1.49.796 is the second ship in the Tier 1 audit roadmap's T1.1 arc (bounded-learning calibration loop, 4-6 ships). Extends the wired `CalibratableThreshold` whitelist from 1 entry (`suggestions.min_occurrences`) to 2 entries (adds `suggestions.cooldown_days`). Pure extension within v795's threshold-agnostic primitive layer + CLI scaffolding — no new modules, no new CLI commands, no schema changes. Per-ship wall-clock: ~30 min, validating the v795 retrospective's prediction that ships 2-6 land in 30-45 min each.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship. Counter-cadence count stays at 5.
- Not a new module. All 6 file changes are modifications (3 source/docstring + 3 test files); the only new files are the 5 release-notes chapter set.
- Not a refactor. No existing tests were edited; new tests were appended in new describe blocks.

## Predecessors (Audit-2026-05-26+ streak)

- v1.49.795 — T1.1 ship 1: Bounded-learning calibration loop (primitive + CLI + writer).
- v1.49.794 — Deterministic gate for #10424 (adoption-refresh overwrite guard).
- v1.49.793 — Shelfware Verdicts 5 + 6 (Math Foundations Refresh cluster CLOSED, 6/6 modules verdicted).
- v1.49.792 — Shelfware Verdict 4 (WIRED `koopman-memory`).
- v1.49.791 — Shelfware Verdicts 2 + 3 (ALLOWLISTED `tonnetz` + `wasserstein-hebbian`).
- v1.49.790 — Codification of v785-v789 lesson cluster (7 lessons → 2 new disciplines).
- v1.49.789 — Shelfware Verdict 1 (WIRED `semantic-channel`).
- v1.49.785-v1.49.788 — PROJECT.md normalizer + adoption telemetry scanner/dashboard/automation + NASA 1.178 IBEX.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version) + Lesson #10424 (adoption-refresh post-bump-version, gate-enforced). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:

- The v794-installed `checkOverwriteGuard` in `tools/adoption-refresh.mjs` fires again at T14 step 11 of this ship. Third consecutive ship under the active gate.
- Step 2.6 (citation-debt auto-update) is N/A for this ship (no V-flag emit/close/state blocks in retrospective).
- Adoption-baseline diff at step 11 is expected to emit no namespace status changes — `bounded-learning` was already flipped to `living` at v795, and no other namespaces changed status this ship. If the diff produces any line, it's an unexpected side effect worth investigating before continuing T14.

## Forward path

T1.1 ships 3-6 candidates:

- **Ship 3 — Wire a third threshold.** `suggestions.auto_dismiss_after_days` (live default 30) stays inside the suggestions semantic stretch and is the lightest-wire continuation. `token_budget.warn_at_percent` (live default 4) moves into a different observation-source class and may force an architectural choice about whether `entriesToObservations` is the right signal source for token-budget calibration.
- **Ship 3 alt — Audit log.** Append `(timestamp, threshold, observations, decision, applied)` to `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the no-history gap flagged in the v795 + v796 retrospectives.
- **Ship 3 alt — `--watch` mode.** Re-run the loop on `.planning/patterns/suggestions.json` changes (cross-session calibration).
- **Ship 4 — Multi-threshold coordination.** When two thresholds both have rejection evidence, decide which to adjust first (e.g. closer-to-floor first, or larger-evidence-margin first).
- **Ship 5-6 — Real-data backfill from session retros.** Operator-decision data may already exist in `.planning/sessions/*.jsonl`; a backfill tool would seed the loop with historical observations.

Other forward candidates queued:

- **NASA 1.179 forward-cadence.** INTERSTELLAR-BOUNDARY axis obs#3 continuation queued in `www/tibsfox/com/Research/NASA/1.178/to-1.179.md`.
- **Path B — T1.3: College of Knowledge consumer engine** (3-5 ships).
- **Strengthening Levers — S3/S4/S6/S7** remain OPEN.

## Audit-2026-05-26+ streak status

v796 is the 12th ship in the AUDIT-2026-05-26+ series. Through-line:

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
- v795 — T1.1 ship 1: bounded-learning calibration loop (primitive + CLI + writer)
- **v796 — T1.1 ship 2: wire suggestions.cooldown_days (this ship)**

Net delivery: 1 normalizer + 3 adoption-telemetry surfaces + 6 shelfware verdicts + 1 NASA degree advance + 8 ESTABLISHED lessons + 1 deterministic gate + 1 new T1.1 vertical + 1 T1.1 extension. The cadence is clearly bifurcated now between new-vertical ships (~75 min) and extension/verdict ships (~30 min) — useful for forward planning.
