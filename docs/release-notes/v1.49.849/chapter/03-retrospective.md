# v1.49.849 — Retrospective

**Wall-clock:** ~20 min from previous ship close (v848 close) to v849 ship close. Below the typical 30-60 min per-chip estimate — the v839 `stalled.ts` template fit `detectVersion()` exactly; no design exploration needed.

## What went as expected

- **The v839 forensic-surface hoisted-check pattern transferred cleanly.** Both `stalled.ts` and `changelog-watch.ts` are accessory surfaces where the function returns a default value on failure and security denials are the only load-bearing failure mode. The template — hoist ensureProcessAllowed before the try, leave the try/catch otherwise untouched — applied byte-equivalent (modulo source string + command).
- **The existing test file's `vi.hoisted` + `vi.mock('child_process')` infrastructure was reusable.** No new mock setup needed; the 4 new test cases slot into the existing `describe('detectVersion')` block.
- **`CapturingProcessAuditSink` is the right test primitive.** Asserting both `expect(() => ...).toThrow(ProcessContextDenied)` AND `sink.records[0].allowed === false` verifies both the throw path and the audit-emit path in one test case. The pattern is more thorough than just asserting the throw.

## What I noticed

- **`defaultProcessContext`'s signature was a small trip.** First attempt passed `{allowList: ['claude']}` as if it were a `ProcessContext`; the actual signature takes a `ProcessAuditSink` directly. Fixed on the first failing-test surface. The internal `allowList: [/.*/]` makes `defaultProcessContext` audit-only — a permissive context for incremental rollout. The trip cost ~30 seconds. Below-threshold observation (1 instance): `defaultProcessContext(sink)` not `defaultProcessContext({sink, allowList})`.
- **The chip exposes a real test gap before this ship.** The pre-v849 `detectVersion` test suite verified only the parse-output + catch-error paths. The audit-test (`process-context-audit.test.ts`) caught the file as KNOWN_UNWIRED but didn't enforce the wire. Now that the file is removed from KNOWN_UNWIRED, future regressions where ensureProcessAllowed is removed will fail at audit-time + at the 3 new test cases.
- **The pattern continues to scale.** This is the ~Nth file wired through ProcessContext since v806; the wire shape is mechanical. Per-file cost ~10-15 LOC, ~3 new test cases, ~20 min wall-clock. The cost is dominated by review-of-call-site to decide hoisted-check vs internal-helper, not by wire-writing.

## What surprised me

- **The release-notes wall-clock dominated the ship.** Source + test changes: ~5 min. Release-notes (README + 4 chapters): ~10 min. Pre-tag-gate + T14 execution: ~10 min. Per-chip ship has fixed release-notes overhead regardless of source-change size. Below-threshold observation: release-notes-shape-templating could reduce the ~10-min cost for chip ships.

## Risk that didn't materialize

- **No audit-test regression.** Removing `'src/retro/changelog-watch.ts'` from KNOWN_UNWIRED means the audit now requires the wire to be present. Build clean + audit-test 2051 PASS confirms.
- **No backward-compat break.** `ctx?: ProcessContext` is optional; pre-existing callers (`detectVersion()` with no args, `runChangelogWatch()` with no opts) continue to work. The hoisted ensureProcessAllowed returns immediately when `ctx === undefined`.
- **No test count change at the integration level.** 4 new unit test cases land cleanly; total test count moves by +3 (file moved from 6 → 9 detectVersion-block tests, total counts in `process-context-audit.test.ts` redistribute but stay at 2051).

## Carried forward (post-v849)

NEW this ship: 1 below-threshold observation.

- **`defaultProcessContext(sink)` signature gotcha** — 1 instance. First-time test-authoring trip cost ~30 seconds. Wait for 2nd instance.

Below-threshold observations from prior ships UNCHANGED:
- Help-coverage drift as a tracked metric (v848, 1 instance)
- Command docstrings as one-liner source-of-truth (v848, 1 instance)
- Full-backlog-clear codify ship pattern (v847, 1 instance)
- Fire-and-forget over awaited for observability writes (v846, 1 instance)
- Canonical-doc-decision ship pattern (v844, 1 instance)
- Verify-axis self-applicability (v843 mesh family forward-flag) — verify-overdue at ~v853
- Recent-vs-baseline-recent comparison pattern (v841, 1 instance)
- Drift-check noise as scoring-system feedback loop (v841, 1 instance)
- Codify-ship-as-recon-consolidator pattern (v840, 1 instance)
- Deferral-by-classification-ambiguity (v840, 1 instance)
- Auto-run-on-import as bootstrap-time tax (v836, 1 instance)
- Polarity convention for inverted-mechanic thresholds (v837, 1 instance)
- Bidirectional enforcement completeness (v838 + v836, 1-2 instances; DEFERRED)

## Eligible for next codify ship: 0
