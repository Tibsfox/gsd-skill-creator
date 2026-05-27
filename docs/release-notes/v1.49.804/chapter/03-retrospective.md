# Retrospective — v1.49.804

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 17th consecutive application. Read `audit-log.ts` + `token-budget-events.ts` + the v803 `runRecordEvent` handler shape + the existing `runSummary` / `runInWatchMode` patterns BEFORE writing any v804 code. Recon surfaced four things: (a) all the argument-parsing primitives (`getFlagValue`, `parsePositiveFloat`, `parseThresholdKey`) reused as-is; (b) the renderer pattern is per-format, not per-log — two renderers handle both shapes cleanly; (c) `readAuditLog` / `readTokenBudgetEvents` already tolerate malformed lines; (d) the mode-flag dispatch pattern from v801 / v803 places `if (args.includes('--query'))` adjacent to the other mode dispatches. ~5 min recon → ~25-30 min build.
- **Lesson #10422 — Verdict-pattern surface separation.** 14th forward application. Two separate renderers for the two log shapes — kept separate because the entry types are genuinely different (AuditLogEntry has threshold + direction + observations; TokenBudgetEvent has kind + optional usagePercent/warnAtPercent/reason). A unified renderer would require lossy type erasure.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** 14th forward application. Resisted: top-level `skill-creator log` subcommand; unified `LogQueryEntry` interface boxing both shapes; pagination primitive; "tail-follow" mode that watches the log live. Each was the next-bigger wire; none was needed for the verdict ("operator can read what's been written").
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied at T14 step 11. Eleventh consecutive ship.
- **Lesson #10426 (ESTABLISHED v802) — APPLIED on a new axis.** The per-class registry now has a 5th consumer (v804 `runQuery`), but the dispatch in `runQuery` is on `log` not `threshold` — a different axis than the registry's threshold-class axis. This is what makes the compose clean: v804 doesn't extend the registry, it composes alongside it.
- **Lesson #10427 (ESTABLISHED v802) — APPLIED.** The query surface is accessory / forensic. The CLI exits 0 on missing log file rather than erroring — the operator's next decision does NOT depend on this surface's output (per the failure-mode contract test). Documented in the help text: missing log returns empty count.

## What Worked

- **The mode-flag pattern is now structurally stable across 5 mode flags.** `--summary` (v801), `--record-event` (v803), `--query` (v804) all use the same shape: `if (args.includes('--mode-flag')) return runMode(args, { json, quiet });` at the top of the command entry, with a handler function below. The pattern has held across 3 ships without modification.
- **Reused argument-parsing primitives needed zero new code.** `getFlagValue`, `parsePositiveFloat`, `parseThresholdKey` were all imported from the existing CLI surface. `Date.parse` for `--since` is a one-liner with `Number.isNaN` check. The only new primitive is the `'audit' | 'events'` log parser, which is inline.
- **Two-renderer split kept the logic linear.** No conditional inside a single renderer; no shared base class; no "if log === 'audit' then ..." inside `runQuery`. Each renderer is independently readable.
- **Test scaffolding from v803 transferred verbatim.** The `--record-event` describe block's pattern (write JSONL to `tmpRoot`, call CLI, parse JSON output) is exactly what `--query` tests needed. New helpers `writeAuditEntries` + `writeEventEntries` are 3 lines each.
- **CSV reason-comma sanitization caught at the test layer.** The events-log CSV format has 5 columns; reason text is the last column and must not contain commas. The `.replace(/,/g, ';')` is one line and the test asserts both presence of the sanitized form and absence of the original form.

## What Could Be Better

- **`--since` requires exact ISO 8601 format.** No "relative time" support (`--since 1h`, `--since yesterday`). `Date.parse` handles ISO 8601 but a user-friendly relative-time would need a dependency or a small custom parser. Defer — the operator's invocation is typically via `/sc:status` or similar harness, which can format the ISO themselves.
- **No `--before` (upper-bound) filter.** Only `--since` (lower bound) and `--last N` (count). A `--before` would compose with `--since` for window queries. Not requested; defer.
- **No aggregation primitives.** `--group-by threshold`, `--count`, `--rate-per-day` are all reasonable next asks. Defer; the JSON output is consumable by `jq` for now.
- **Text-mode output uses `console.log` directly.** Same as the other modes, but the line-per-entry format is dense and unspaced. A future ship could add ASCII-table rendering for terminal use. Defer; the JSON mode is the structured surface.
- **No automated check that the help text documents every flag.** A future audit could grep the source for `getFlagValue` calls and cross-reference against the help string. Not done; recurring pattern across all modes.

## Surprises

- **Wall-clock landed at ~25-30 min build + 5 min recon.** Lower than the predicted ~30-45 min from the v803 handoff. The shape was so well-determined by recon that the build was nearly a transcription of the existing patterns.
- **Zero edits to `bounded-learning/` source files.** All read primitives (`readAuditLog`, `readTokenBudgetEvents`) existed; the query mode only consumes them. The CLI is the only file touched in `src/`.
- **The default-log choice (`audit` vs `events`) was a clear toss-up.** Picked `audit` because the audit log is the more frequently-queried surface (every calibration tick writes one entry; the events log is event-driven and sparser). Documented in help text; the test explicitly covers the default behaviour.

## Lesson candidates emitted this ship

None. v804 is structurally well-grooved like v803 — every design choice came from a recently-ESTABLISHED discipline. No surprise surfaced a new candidate.

## Tentative observation: mode-flag pattern is at 5 instances

`--watch` (v800), `--summary` (v801), `--record-event` (v803), `--query` (v804). Plus the default calibration tick. That's 5 modes inside `bounded-learning`. The v803 retrospective noted "if a 6th mode arrives, consider lifting all of them into subcommands." v804 is the 5th mode flag (4 named + 1 default). The 6th-mode threshold is now imminent.

A future ship that adds a 6th mode SHOULD evaluate: (a) keep all flags inline and accept the larger help text; (b) lift to `bounded-learning <subcommand>` form. The recon for that ship would survey similar-sized CLIs in the codebase and pick the convention that matches the operator's mental model.

Carry forward as a tentative observation; do not promote to a candidate yet. The 6-mode threshold is not a discipline rule — it's a one-time refactor trigger.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active.
- **#10425** — apply at every new bounded-learning math choice.
- **#10426** — apply at every SECOND class instance + every wired-vs-unwired split.
- **#10427** — apply at every accessory-vs-load-bearing surface choice.
- **(tentative) watch-loop tear-down race** — carry forward.
- **(tentative) chained-session architectural-tax break-even** — carry forward.
- **(tentative) registry-abstraction cross-chain payoff** — carry forward (supporting #10426).
- **(tentative NEW v804) 6th-mode-flag refactor trigger** — carry forward.

## Verdict on v804 scope

The consumer-surface scope landed in ~25-30 min wall-clock — at the bottom of the "consumer surface integrations (no new module)" cadence band. The architectural payoff from earlier ships continues to validate: the registry extraction (v798), the audit log primitive (v799), the token-budget-events primitive (v803) all composed under the new query mode without modification.

The lightest-wire choice for the query surface — flag + two renderers + reused read primitives — is the right scope for v804. Future ships can extend it (pagination, aggregation, follow-mode) when the operator surface signals demand.
