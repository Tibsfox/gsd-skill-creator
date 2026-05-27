# v1.49.799 — T1.1 Ship 5: Bounded-Learning Audit Log

**Released:** 2026-05-27
**Type:** forward-cadence Tier 1 audit ship 5/4-6+ (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.798 — T1.1 Ship 4 (Wire `token_budget.warn_at_percent` + per-class registry)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 5 — close the no-history gap via append-only JSONL audit log

## Summary

Closes the no-history gap flagged in all four prior T1.1 retros (v795-v798). Every `skill-creator bounded-learning` CLI invocation now appends one JSON line to `.planning/patterns/bounded-learning-log.jsonl` capturing the threshold, decision, observation count, applied outcome, and observation-source metadata. Operator can replay the calibration history without re-running the loop.

Wall-clock: ~30-40 min — under the v796 prediction's upper bound thanks to the v798 registry already exposing the observationSource metadata needed for forensic entries.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/bounded-learning/audit-log.ts` | NEW | `appendAuditLogEntry`, `readAuditLog`, `buildAuditLogEntry`, `DEFAULT_AUDIT_LOG_PATH`, `AuditLogEntry` type. Append-only JSONL; tolerant reader (skips malformed lines, returns empty for missing file). |
| `src/bounded-learning/index.ts` | MODIFIED | Re-export new audit-log symbols. |
| `src/cli/commands/bounded-learning.ts` | MODIFIED | After applyRecommendation, build + append audit-log entry. New flags: `--audit-log <path>` (override default path), `--no-audit-log` (disable). Append failures are silent (audit log is best-effort, never blocks CLI). Module docstring updated. |
| `src/bounded-learning/__tests__/audit-log.test.ts` | NEW | 10 dedicated tests: 3 for `buildAuditLogEntry`, 2 for `appendAuditLogEntry`, 5 for `readAuditLog` tolerance + edge cases. |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | `baseArgs` now passes `--audit-log <tmpRoot>/...` so tests never write to the real `.planning/patterns/`. +5 v799 integration tests (default-on write / append-without-truncate / applied-applied capture / --no-audit-log disable / token_budget source metadata captured). |
| `docs/release-notes/v1.49.799/` | NEW | 5-file chapter set. |

## What changed (behaviorally)

- Default-on audit log: every CLI invocation appends one JSON line to `.planning/patterns/bounded-learning-log.jsonl`.
- `--audit-log <path>` overrides the default path.
- `--no-audit-log` disables the append for an invocation.
- Audit log writes are best-effort: failure (e.g. disk full, permission denied) does NOT propagate. CLI exit code reflects calibration-loop outcome only.
- The reader (`readAuditLog`) is tolerant: skips malformed lines, returns empty for missing file, handles trailing whitespace and blank lines.

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a retention/rotation surface. Operator manages log size out-of-band. Future ship may add `--audit-log-max-bytes` rotation if needed.
- Not a query/report tool. v799 ships the writer + reader primitives; a future ship can build a query-by-threshold / replay / summary report on top.

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **121/121 PASS** (106 from v798 + 15 new: 10 audit-log unit + 5 CLI integration).
- `npm run build` → PASS (TypeScript strict).
- Smoke test: `node dist/cli.js bounded-learning --audit-log /tmp/smoke.jsonl --json` writes one JSON line to /tmp/smoke.jsonl with the expected shape (timestamp, threshold, applied, observationSource, etc.).
- Pre-existing 116 bounded-learning + CLI tests still pass after `baseArgs` update.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer | Delivered at v795 |
| T1.1 ship 2 — Wire suggestions.cooldown_days | Delivered at v796 |
| T1.1 ship 3 — Wire suggestions.auto_dismiss_after_days | Delivered at v797 |
| T1.1 ship 4 — Wire token_budget.warn_at_percent + per-class registry | Delivered at v798 |
| **T1.1 ship 5 — Audit log** | **Delivered at v799 (this ship)** |
| T1.1 ships 6-7 — --watch + /sc:status | OPEN (chained session continues) |
| T1.3 — College of Knowledge consumer engine | OPEN |
| S3/S4/S6/S7 — Strengthening Levers | OPEN |

## Forward path: T1.1 ships 6-7 (chained session continues)

- **v800 — `--watch` mode** (~30-45 min). fs.watch on suggestions.json + debounce + re-run loop on change.
- **v801 — `/sc:status` integration** (~30-45 min). Surface calibration state in the existing /sc:status output.

Other forward candidates queued for after the chained session:

- Audit-log query/report tool (`bounded-learning log` subcommand?) — separate ship.
- Real token-budget observation source wiring — separate ship.

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v797 close | 1 (#10425) |
| v798 close | 2 (#10425 + #10426 NEW) |
| **v799 close** | **2** (#10425 + #10426 — both unchanged; v799 reused the v798 observationSource registry verbatim, no new design choices surfaced) |
