> Following v1.49.798 — _T1.1 Ship 4: Wire `token_budget.warn_at_percent` + Per-Class Observation-Source Registry_, v1.49.799 ships as T1.1 ship 5 — closes the no-history gap with an append-only JSONL audit log. Every CLI invocation now leaves a forensic trail.

# v1.49.799 — T1.1 Ship 5: Bounded-Learning Audit Log

**Shipped:** 2026-05-27

The fifth ship in the T1.1 calibration-loop arc, and the third ship in the chained-session run. Closes a gap flagged in every prior T1.1 retro: the CLI emits a recommendation but leaves no persistent record. v799 introduces `.planning/patterns/bounded-learning-log.jsonl` and appends one JSON line per CLI invocation.

## What shipped

- **NEW `src/bounded-learning/audit-log.ts`** — `appendAuditLogEntry`, `readAuditLog`, `buildAuditLogEntry`, `DEFAULT_AUDIT_LOG_PATH`, `AuditLogEntry` interface. Append-only JSONL; lazy parent-dir creation; tolerant reader.
- **`src/cli/commands/bounded-learning.ts`** — After `applyRecommendation`, the CLI builds and appends an audit-log entry. New flags: `--audit-log <path>` and `--no-audit-log`. Failures are best-effort silent.
- **`src/bounded-learning/index.ts`** — Re-exports the new symbols.
- **+15 tests** across two files (10 dedicated audit-log unit tests + 5 CLI integration tests).
- **CLI test harness update** — `baseArgs` now always passes `--audit-log <tmpRoot>/...` so tests never touch the real `.planning/patterns/`.

Test count: **121/121 PASS** in the bounded-learning + CLI test surface (was 106 at v798 close; +15 this ship).

## Through-line

The architectural payoff of v798's per-class observation-source registry is visible here: the audit log entry includes `observationSource: { sourceId, wired }` automatically via `buildAuditLogEntry` calling `observationSourceFor(rec.threshold)`. The v798 registry is consumed by both the CLI renderers AND the audit log without each surface needing its own classification logic.

The audit log is intentionally minimal:
- Writer = `appendFile` (atomic for small writes).
- Reader = line-by-line `split('\n')` + per-line `JSON.parse` with try/catch.
- No retention. No rotation. No query API. No timestamp index. No schema versioning.

This is lightest-wire discipline at the new-module boundary: the primitives needed to query/report can be built on top later if telemetry demand surfaces. Today the operator can grep, awk, jq, or pipe through `node -e 'JSON.parse(...)'`.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.1 ship 1 | Delivered at v795 |
| T1.1 ship 2 | Delivered at v796 |
| T1.1 ship 3 | Delivered at v797 |
| T1.1 ship 4 | Delivered at v798 |
| **T1.1 ship 5** | **Delivered at v799 (this ship — audit log)** |
| T1.1 ships 6-7 | OPEN (--watch + /sc:status — chained session continues) |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --audit-log /tmp/smoke.jsonl --json
{ ... full JSON ... }

$ cat /tmp/smoke.jsonl
{"timestamp":"2026-05-27T01:59:49.570Z","threshold":"suggestions.min_occurrences","currentValue":3,"proposedValue":null,"direction":"hold","rejected":false,"observations":0,"meanObservation":0,"evidence":1,"alpha":0.05,"applied":"noop","observationSource":{"sourceId":"suggestions.json","wired":true}}
```

One JSON line per invocation, ~340 bytes including the trailing newline. Operator can replay the calibration history without re-running the loop.

## Forward candidates

This is ship 3 of 5 in the chained T1.1 session. Following ships:

- **v800 — `--watch` mode** (~30-45 min). fs.watch on suggestions.json + debounce + re-run loop on change.
- **v801 — `/sc:status` integration** (~30-45 min). Surface calibration state in the existing /sc:status output.

---
**Prev:** [v1.49.798](../v1.49.798/00-summary.md) · _(current tip after ship)_
