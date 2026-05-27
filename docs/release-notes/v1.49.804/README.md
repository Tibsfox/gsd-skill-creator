> Following v1.49.803 — _Real Token-Budget Observation Source_, v1.49.804 closes the no-readback gap left by the three append-only logs shipped v799–v803: `bounded-learning --query` reads the audit log and the token-budget events log with `--last N`, `--since <ISO>`, `--threshold <key>`, and `--kind <kind>` filters.

# v1.49.804 — Bounded-Learning Log Query Subcommand

**Shipped:** 2026-05-27

Adds a `--query` mode flag to the existing `bounded-learning` CLI (matches
the `--watch` / `--summary` / `--record-event` pattern; fifth mode flag).
Reads either the audit log (`bounded-learning-log.jsonl`) or the
token-budget events log (`token-budget-events.jsonl`) with composable
filters. Three-tier output (text / quiet CSV / JSON).

## What shipped

- **`src/cli/commands/bounded-learning.ts`** — New `--query` mode. Picks log via `--log audit|events` (default `audit`); filters via `--last N`, `--since <ISO>`, `--threshold <key>` (audit only), `--kind <responsive|ignored>` (events only). Two renderers (`renderAuditQueryResult`, `renderEventsQueryResult`) for the two log shapes.
- **`src/cli/commands/bounded-learning.test.ts`** — +16 tests covering log selection, every filter, every error path, and malformed-line tolerance.
- **Help text** — Updated `--help` to document the new flags.
- **Module docstring** — Updated header to describe v804 mode flag.

Test count: **173/173 PASS** in the bounded-learning + CLI scope (was 157 at v803; +16 this ship).

## Through-line

Three append-only JSONL logs now exist: `suggestions.json` (since v795), `bounded-learning-log.jsonl` (since v799), `token-budget-events.jsonl` (since v803). The first is queried implicitly via the calibration loop, but the second and third have been write-only — no read-side consumer surface. v804 closes that gap with the lightest wire that satisfies it: a query flag inside the existing CLI, reusing the existing read primitives (`readAuditLog`, `readTokenBudgetEvents`).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **Strengthening Levers S3 + S4 + S7 codification ship** — next ship in this chain.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).

---
**Prev:** [v1.49.803](../v1.49.803/00-summary.md)
