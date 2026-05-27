# Retrospective — v1.49.799

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 12th consecutive application. Read `.planning/patterns/` directory contents BEFORE choosing the audit-log filename (`bounded-learning-log.jsonl` — matching the JSONL convention used by `budget-history.jsonl`, `sessions.jsonl`, `tool-tracker-*.jsonl`). Recon also confirmed that the v798 `observationSourceFor` lookup is the right place to source per-entry observation-source metadata — no duplication, no per-renderer registry. ~5 min recon → ~25-35 min implementation.
- **Lesson #10422 — Verdict-pattern surface separation.** Re-applied. The audit-log module is a new surface separate from the registry, the calibration loop, the threshold writer, and the CLI command. Each surface has its own test file. The CLI integrates via three import additions + one block of code (build + append + best-effort try/catch).
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Re-applied. Resisted: (a) adding retention/rotation logic (operator manages out-of-band), (b) adding a schema version field (defer until first breaking change), (c) building a query/report subcommand (today's tools are grep/jq/awk; build the report when telemetry demand surfaces), (d) wiring an indexed binary format (JSONL is grep-friendly and human-readable). The audit log is intentionally the minimum that satisfies "every invocation leaves a forensic record."
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Sixth consecutive ship under the active gate.
- **#10426 candidate (v798)** — Applied at the right second-instance moment: the audit-log module consumes the v798 registry rather than re-implementing classification. Cross-class registry extracted at v798 second-instance pays off at v799 consumption.

## What Worked

- **v798's registry pays dividends immediately.** Building the audit log required only one line to populate `observationSource` per entry: `observationSourceFor(rec.threshold)` in `buildAuditLogEntry`. Without the v798 extraction, this would have required either (a) re-implementing classification in audit-log.ts, or (b) threading source metadata through the recommendation object. The second-instance extraction discipline (#10426 candidate) shows its value at the third instance — the v799 consumer.
- **Best-effort write semantics caught the right design space.** Initial draft had the audit-log failure surface in JSON output as a `warning` field. Removed mid-implementation: the audit log is forensic, not load-bearing. If the write fails, the operator still gets the recommendation. Stamping the failure into JSON output would couple write success to CLI semantics in a way that future operators might come to depend on. Best-effort silent is the simpler contract.
- **Tolerant reader saved test time.** The `readAuditLog` function skips malformed lines silently rather than throwing. This means tests for "what happens when the log has bad lines" can use the same fixture-pattern as the "valid lines" tests — append a fixture with one bad line in the middle, assert the reader returns N-1 entries. No special error-path testing needed.
- **CLI test harness baseArgs update prevented test pollution.** Updating `baseArgs` to always pass `--audit-log <tmpRoot>/...` means every existing test gets the audit-log write into tmpdir automatically. Without this, every existing test would have started writing to the real `.planning/patterns/bounded-learning-log.jsonl` as a side effect.

## What Could Be Better

- **No `bounded-learning log` subcommand for querying.** A future operator might want "show me the last N audit entries" or "show me all `applied=applied` entries this week." Today's tools are grep/jq/awk. Lightest-wire deferral, but worth flagging as a candidate next ship.
- **No schema version field on entries.** Future schema changes (add a new field; change a type) would have no way to distinguish v1 entries from v2. Defer until the first breaking change actually surfaces — adding a version field today is YAGNI.
- **No retention/rotation.** The log grows unboundedly. For a developer-tool with ~1 calibration-loop run per day, that's ~340 bytes/day = 124KB/year — not a real concern. If usage grows to per-hour invocations, retention becomes a future ship.
- **Best-effort silent write means failures are invisible to operators.** A disk-full or permission-denied scenario would silently drop audit-log entries. Acceptable contract today, but the operator would never know. If audit-log reliability becomes a load-bearing requirement (e.g. compliance audit), this contract would need to flip.
- **`FlagLookup` discriminated union STILL in 4 CLI commands; not extracted this ship.** Continuing to defer per lightest-wire discipline.

## Surprises

- **v799 wall-clock came in lower than predicted.** v796 handoff predicted ~45-60 min for the audit-log ship. Actual: ~30-40 min. The v798 registry consumption shaved ~10-15 min off the implementation — no separate classification surface needed.
- **The default-on contract was the right call.** Initial design thought defaulted to OFF (require operator to opt in via `--audit-log`). Switched to default-on with `--no-audit-log` opt-out mid-implementation because: (a) audit log is the kind of thing operators forget to turn on, then regret when they need the history; (b) best-effort silent write means default-on has near-zero blast radius; (c) the test harness override pattern (`baseArgs` includes `--audit-log <tmpRoot>/...`) keeps default-on out of test pollution.

## Lessons applied at v1.49.799 (from v1.49.795-798 and earlier)

- **#10412** (recon-first) — applied. 12th consecutive application.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied with deliberate deferrals (no retention, no schema version, no query subcommand).
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.
- **#10425 candidate (v795)** — N/A this ship; audit-log is a writer/reader pair, not a calibration design.
- **#10426 candidate (v798) — APPLIED.** v799 consumed the v798 registry verbatim. This is the first consumer downstream of the v798 extraction — validates that the registry's interface (`sourceId`, `wired`, `description`) is sufficient for the audit log's needs without modification.

## Lesson candidate emitted this ship

None. v799 is a pure new-module ship reusing the v798 registry. No new design choices that surface traps.

Tentative observation (not a candidate): **Best-effort silent contracts for forensic surfaces.** The decision to make audit-log write failures silent rather than surfaced in CLI output is a design pattern worth noticing. The asymmetry: load-bearing operations (calibration loop, threshold write) should fail loudly; forensic operations (audit log, telemetry) should fail quietly. If this pattern recurs in v800/v801 or future ships, it may be worth codifying.

Second-tentative observation (not a candidate yet): **apply-to-self detector regex misclassifies backtick-prefixed code spans in test comments as code path-literals.** During v799 pre-tag-gate, the C7 Sub-1b meta-test failed because my CLI test file contained a comment like `` // ... the real `.planning/patterns/...` (v1.49.799). `` — the backtick + `.planning/` substring matched the `/['"`].*\.planning\//` regex inside KNOWN_PATTERNS[existsSync-no-skip-guard].detect(). The fix was a 1-line comment rewording to remove the planning-path token from inside backticks. This is a forward-shadow of Lesson #10189 (commentary-token false positive) IN the very script that watches for #10189 — a fresh meta-pattern. Promotion path: if a second-instance comment false-positive surfaces in any KNOWN_PATTERNS detector, the discipline is worth codifying as "detect() functions in apply-to-self.mjs MUST distinguish code from comments." Not yet — single instance.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10425 candidate** (two-sided-on-binary insensitivity) — apply at every binary-observation calibration design.
- **#10426 candidate** (cross-class abstraction-extraction timing) — apply at every cross-class abstraction moment. v799 was the first consumer-side validation.
- **FlagLookup extract** — non-lesson refactor opportunity, now 4 copies, still deferred.

## Verdict on T1.1 ship 5 scope

The audit log scope landed in one ship at ~30-40 min wall-clock — under the v796 prediction. The v798 architectural-payoff continues to compound: every subsequent ship in the registry's downstream cone gets cheaper, not more expensive. v800 and v801 should benefit from the same compounding effect.
