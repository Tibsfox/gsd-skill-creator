# v1.49.804 — Bounded-Learning Log Query Subcommand

**Released:** 2026-05-27
**Type:** consumer surface ship (no new module; reuses existing primitives)
**Predecessor:** v1.49.803 — Real Token-Budget Observation Source
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** add a `--query` mode to `bounded-learning` so the three append-only JSONL logs become readable on the operator surface.

## Summary

Three append-only JSONL logs now exist:

- `suggestions.json` (v795) — queried implicitly by the calibration loop.
- `bounded-learning-log.jsonl` (v799) — write-only until now.
- `token-budget-events.jsonl` (v803) — write-only until now.

v804 adds a read-side surface for the latter two: `bounded-learning --query --log audit|events` with `--last N`, `--since <ISO>`, `--threshold <key>`, and `--kind <responsive|ignored>` filters. Three-tier output (text / quiet CSV / JSON). Tolerant of malformed lines per the existing read primitives.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/cli/commands/bounded-learning.ts` | MODIFIED | `--query` mode dispatch added before the standard calibration path. New `runQuery` handler + `renderAuditQueryResult` + `renderEventsQueryResult`. New `--log`, `--last`, `--since` flag parsing. Module docstring + help text updated. |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +16 tests in a new `--query mode (v1.49.804)` describe block covering: log selection (audit/events/invalid), every filter (`--last`, `--since`, `--threshold`, `--kind`), error paths (each invalid flag exits 1 with JSON error), CSV reason-comma sanitization, malformed-line tolerance, default-to-audit behaviour. |
| `docs/release-notes/v1.49.804/` | NEW | 5-file chapter set. |

Note: `readTokenBudgetEvents` was added to the imports from `../../bounded-learning/index.js` (already exported from v803).

## What changed (behaviorally)

- `skill-creator bounded-learning --query` reads from the JSONL logs. Default log is `audit`; pass `--log events` for the token-budget events file.
- `--last N` returns the last N entries (chronological order, end-trimmed).
- `--since <ISO>` filters entries with `timestamp >= ISO 8601`.
- `--threshold <key>` filters by `entry.threshold` (audit only; reuses the SUPPORTED_THRESHOLDS list).
- `--kind <responsive|ignored>` filters by `event.kind` (events only).
- Three output formats: default text (one-line-per-entry, human readable), `--quiet` CSV, `--json` JSON object with `{ log, path, count, entries }`.
- Missing log file is honest empty result, not an error.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship.
- Not a new top-level CLI subcommand — `--query` is the fifth mode flag inside `bounded-learning` (alongside `--summary`, `--watch`, `--record-event`, default calibration tick).
- Not a query for `suggestions.json` — that file is already consumed implicitly by the calibration loop and the `/sc:suggest` skill.
- Not a write surface — read-only consumer.
- Not a paginated query — `--last N` is the only size-limit primitive; "page through history" is a deferred ask.

## Verification

- `npx vitest run src/cli/commands/bounded-learning.test.ts src/bounded-learning/` → **173/173 PASS** (was 157 at v803 close; +16 added).
- `npm run build` → PASS.
- Smoke: `node dist/cli.js bounded-learning --query --log events --token-budget-events /tmp/no-such.jsonl --json` → emits `{"log":"events","path":"/tmp/no-such.jsonl","count":0,"entries":[]}`.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Calibratable threshold wire status (post-v804)

UNCHANGED from v803 — 5 of 6 wired. v804 is a read-side surface that does not change the wire status.

## Lessons applied

- **#10412 (Recon-first as default)** — 17th consecutive forward application. Read `audit-log.ts` + `token-budget-events.ts` + the v803 mode-flag handler (`runRecordEvent`) before writing any v804 code. Recon surfaced: (a) the `getFlagValue` + `parsePositiveFloat` + `parseThresholdKey` primitives all reused as-is; (b) the renderer pattern (text/quiet/json) is per-format, not per-log — two renderers fits cleanly; (c) `readAuditLog` / `readTokenBudgetEvents` are already tolerant readers — no new tolerance code needed.
- **#10422 (Verdict-pattern surface separation)** — 14th forward application. Two separate renderers for the two log shapes — they share format conventions but not content. The dispatch is per-log on the read side and per-format on the render side.
- **#10423 (Lightest wire that satisfies the verdict)** — 14th forward application. Rejected: (a) a new `skill-creator log` top-level subcommand; (b) a unified `LogQueryEntry` interface that boxed both shapes into one type; (c) a pagination primitive (`--page`, `--page-size`). Chose: one mode flag in the existing CLI, two renderers, three primitive filters, no new module.
- **#10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Eleventh consecutive ship under the active gate.
- **#10426 (ESTABLISHED v802)** — APPLIED to the per-log dispatch. The per-class registry abstraction now has a fifth consumer (v799 audit, v800 watch, v801 summary, v803 events wire, **v804 query**). The dispatch in `runQuery` is on `log`, not on `threshold` — a different axis than the registry's threshold axis, which is what makes this a clean compose rather than a registry extension.
- **#10427 (ESTABLISHED v802) — APPLIED.** The query surface is forensic / accessory by nature (operator can re-run; result is informational; nothing depends on it being correct in a load-bearing sense). The CLI exits 0 on missing log file rather than erroring — the lightest-touch failure-mode contract for a forensic read surface.

## Forward path (post-v804)

- **Strengthening Levers S3 + S4 + S7 codification ship** — next ship in this chain.
- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).
- Possible follow-on: pagination primitive for `--query` if log volumes grow.
