# Retrospective — v1.49.801 (T1.1 ARC CLOSED)

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 14th consecutive application. Read `.claude/commands/sc/status.md` + `project-claude/commands/sc/status.md` to understand the existing /sc:status structure BEFORE designing the new Step 5.5. Recon confirmed that the source file is in `project-claude/` and that `node project-claude/install.cjs` syncs to `.claude/`. Avoided the self-mod hook trip by editing the source not the installed copy.
- **Lesson #10422 — Verdict-pattern surface separation.** Re-applied. The CLI side (`--summary` flag + `runSummary` helper) is a new function in the existing command file; the operator-facing surface (Step 5.5 in /sc:status) is in a separate file in `project-claude/`. Each surface has its own evolution path.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Re-applied with deliberate scope choices: (a) `--summary` is a flag, not a subcommand — avoids subcommand-routing rework, (b) /sc:status integration is a single Bash invocation, not a custom HTTP API, (c) renderer is a markdown table in the existing /sc:status output, not a separate dashboard.
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Eighth consecutive ship under the active gate.
- **#10426 candidate (v798) — APPLIED at third consumer.** v801's `runSummary` consumes the v798 observation-source registry verbatim (`observationSourceFor(threshold)` for each summary entry). Third consumer-side validation within this chained session.

## What Worked

- **--summary flag was the right shape for the consumer.** /sc:status's Step 5.5 needs ONE subprocess call to get all the data. Alternative shapes (per-threshold CLI invocation; HTTP API; direct file reads) would have been more code + more failure modes. The `--summary` flag is the operator-side API.
- **Best-effort silent contract continues to compound.** Step 5.5 in /sc:status silently skips if `--summary` fails — same pattern as the v799 audit-log writes and the v800 watch-loop callback. The pattern is now embedded in 3 places without explicit codification. Worth watching for second-instance forward-shadow for the "best-effort silent for forensic/dashboard surfaces" pattern.
- **project-claude/ source pattern avoided self-mod-guard.** Editing `project-claude/commands/sc/status.md` rather than `.claude/commands/sc/status.md` directly meant no SC_SELF_MOD=1 override needed — the install.cjs has the right env vars built in. Discipline from the security-hygiene skill working as intended.
- **lastTick rendering uses audit-log data verbatim.** No new data structure; just a filter + last-element pick from the existing AuditLogEntry array. Audit log paid off for the third time (writer at v799; watch-loop consumer at v800; summary consumer at v801).

## What Could Be Better

- **No relative-time rendering in the JSON output.** Step 5.5's pseudocode says "render `(2 min ago)` from timestamp vs now," but this is rendering-side concern done in the markdown prompt at /sc:status invocation time. If a future consumer (dashboard, /sc:start, etc.) wanted similar relative-time UX, they'd reimplement it. Defer until a second consumer needs it.
- **No /sc:status integration test for the new section.** The CLI side has 4 new tests; the markdown skill (Step 5.5) is operator-facing and tested by operator running /sc:status. No automated test verifies the integration. Acceptable for prompts but worth flagging.
- **`FlagLookup` discriminated union STILL in 5+ CLI commands.** v793-v800 retros all flagged this. Now closer to bundled-extract worth it (5 callers > 2 callers original threshold). Defer one more session; consider extracting in next CLI-touching ship.

## Surprises

- **Wall-clock landed at the low end of the prediction.** v798/v800 retros predicted ~30-45 min for /sc:status integration. Actual: ~30-40 min. The architectural-payoff compounding shaved ~5 min off the upper bound thanks to the audit-log + registry consumption being trivial.
- **No tear-down race for --summary.** Unlike --watch, --summary is a single-shot operation that exits cleanly. The v800 tentative observation about watch-loop tear-down race didn't surface here. (Expected — different problem shape — but worth noting for future codification.)
- **The chained-session "all" pivot was the largest single execution-batch since the NASA v700-v705 autonomous run.** 5 ships, 2 new TypeScript modules, 1 CLI refactor, 1 cross-class abstraction extraction, 1 project-claude/ surface edit, 2 candidates carried, 1 tentative observation. Total wall-clock ~3-3.5h. Within the original 3-4.5h estimate quoted at the start of the session.

## Lessons applied at v1.49.801 (from v1.49.795-800 and earlier)

- **#10412** (recon-first) — applied. 14th consecutive application.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied.
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.
- **#10425 candidate** — N/A.
- **#10426 candidate — APPLIED at third consumer (audit-log v799, runCalibrationTick v800, summary v801).** Three consumer-side validations in one session. This is meaningful evidence that the cross-class registry extraction at v798 was the right call.

## Lesson candidate emitted this ship

None. v801 is a pure consumer surface; no new design choices surfaced.

Final tentative-observation update: **Best-effort silent contracts for forensic / dashboard surfaces.** Now observed at three sites:
1. v799 audit-log write (forensic surface).
2. v800 watch-loop callback (long-running orchestration).
3. v801 /sc:status Step 5.5 (dashboard surface).

The pattern is the same: a non-load-bearing surface that should NEVER block the load-bearing operation. Three instances in one session might be enough to promote this to a candidate. Decision: include as a candidate in this retro pending codification-ship review.

## #10427 candidate (NEW, MEDIUM)

**Statement:** Forensic / dashboard / observability surfaces SHOULD fail silently. Load-bearing operations SHOULD fail loudly. The asymmetry: load-bearing failures mean the user is acting on wrong data and must be told; non-load-bearing failures mean a non-essential surface degraded and the user shouldn't be blocked.

**Why:** Across v799-v801, three surfaces independently implemented best-effort silent failure (audit-log write; watch-loop callback error; /sc:status section subprocess). Each instance was a deliberate design choice — surfacing the failure to the operator would have either gated the load-bearing operation or polluted the dashboard. Three instances in one session validates the pattern as discipline-worthy.

**How to apply:** When designing a new surface, ask: "is this load-bearing or accessory?" Load-bearing surfaces (operations the user is asking for; data that decisions depend on) fail loudly with clear messages. Accessory surfaces (logging, telemetry, dashboard sections, optional decorations) fail silently. The contract should be explicit in the function docstring + tested with at least one "what happens when this fails" assertion.

**Promotion path:** Codification at next discipline-coverage codification ship. Three instances within v799-v801 is sufficient first-instance evidence; second-instance forward-shadow could be any future surface that adopts the same contract explicitly (with a "// best-effort silent" comment or equivalent).

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10425 candidate** (two-sided-on-binary insensitivity) — N/A unless e-process redesign.
- **#10426 candidate** (cross-class abstraction-extraction timing) — apply at every cross-class moment. Validated thrice this session.
- **#10427 candidate (NEW)** — apply at every forensic/dashboard/observability surface design.
- **(tentative) watch-loop tear-down race** — apply at every long-running async primitive.
- **FlagLookup extract** — non-lesson refactor opportunity, now 5 CLI files, deferred 9 times, due in next CLI-touching ship.

## Verdict on T1.1 ship 7 scope AND T1.1 arc as a whole

The /sc:status integration scope landed in one ship at ~30-40 min wall-clock — at the low end of prediction. Architectural payoff continues to validate.

**T1.1 arc as a whole:** 7 ships (v795-v801). Two cold-start sessions (v795 + v796) and one 5-ship chained session (v797-v801). Total wall-clock estimate: ~4.5-5h aggregated across all 7 ships. Original scope was 4-6 ships; final count 7 due to the v798 cross-class registry extraction.

The chained-session "all" pivot was the right operator decision. Compared to 5 separate cold-start sessions over multiple days, the chained session compressed total wall-clock by ~30-40% AND produced a single coherent narrative with shared lesson candidates accumulating in real-time.

This is now the empirical case-study for "when to take a chained-session 'all' pivot vs sequential cold-start sessions." If the menu items share substantial architectural scaffolding (as T1.1 ships 3-7 did), chained is strictly better. If they're independent (different verticals), cold-start sessions preserve more flexibility.
