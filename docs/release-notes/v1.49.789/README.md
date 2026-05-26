# v1.49.789 — Shelfware Verdict 1: WIRE `semantic-channel` via `dacp drift-check`

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven Tier 1 ship 3/3 (NOT a NASA degree advance)
**Predecessor:** v1.49.788 — IBEX NASA 1.178 Interstellar Boundary Explorer
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** AUDIT-2026-05-26 Tier 1 T1.2 ship 3/3 — first shelfware verdict

## Summary

Completes the T1.2 trilogy. v786 + v787 built the adoption telemetry
surface (scanner + dashboard + allowlist); v789 emits the **first
shelfware verdict** from that surface. The Math Foundations Refresh
(v1.49.572) cluster was the highest-density shelfware candidate at v787
baseline (6/6 modules test-only); this ship wires `semantic-channel` —
the GAP-6 closure artifact's runtime — into a real, operator-visible
call site by exposing the read-only adapter, channel-capacity bound, and
advisory drift checker through a new `skill-creator dacp drift-check`
subcommand.

Establishes the verdict pattern + writes `docs/SHELFWARE-VERDICTS.md` so
future per-module decisions inherit a durable format.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `src/cli/commands/dacp-drift-check.ts` | NEW | 240 lines — new `dacp drift-check`/`dc` subcommand with 3-tier output (text/quiet/json), `--bundle`, `--baseline`, `--threshold`, `--max-bits` flags, advisory-only exit-code invariant |
| `src/cli/commands/dacp-drift-check.test.ts` | NEW | 22 tests covering args, capacity-only path, drift-with-baseline, flag-off skip, advisory-only invariant |
| `src/cli/commands/dacp.ts` | MODIFIED | +6 lines: `drift-check`/`dc` subcommand routing + help-text entry |
| `src/cli/help.ts` | MODIFIED | dacp namespace description includes `drift-check` |
| `docs/SHELFWARE-VERDICTS.md` | NEW | Verdict format + first verdict entry + open-candidate roster |
| `.planning/PROJECT.md` | MODIFIED | GAP-6 row notes runtime wire; Active milestone + Latest shipped release + Last updated advanced |

## What changed

- **`semantic-channel` flips test-only → living** on `npm run adoption-report`.
  The adoption-refresh diff vs the v1.49.787 baseline emits exactly
  one status change: `↑ semantic-channel: test-only → living`. This is
  the first non-trivial diff the refresh orchestrator has emitted (per
  Lesson #10421 candidate's "warm-up period" — v786 wrote the baseline;
  v787 wrote the first .json snapshot; v789 produces the first real
  diff).
- **`dacp drift-check` available as a CLI surface.** Operators can run
  it against any DACP bundle directory: capacity-bound output alone
  with `--bundle <path>`; advisory drift finding with the additional
  `--baseline <path>`. Without the
  `mathematical-foundations.semantic-channel.enabled` flag the drift
  comparison is skipped and the CLI reports why; the capacity bound is
  always reported.
- **GAP-6 row in PROJECT.md** now records that the doc (v572) + the
  runtime wire (v789) together fully close the gap. The `src/dacp/`
  module remains byte-identical (HARD-preservation gate G7 from v572
  is unaffected by this ship).

## Verification

- `npx vitest run src/cli/commands/dacp` → 64/64 PASS (existing 42 +
  new 22)
- `node tools/adoption-scan.mjs --format markdown` → `semantic-channel`
  reports as `living` with 1 CLI importer
- `node tools/adoption-scan.mjs --shelfware-threshold 1` → exit 0
  (no new shelfware introduced)
- `node tools/project-md-normalizer.mjs --check` → no drift
- `bash tools/pre-tag-gate.sh` → 17/17 PASS

## Engine state

NASA degree sustains at **1.178** (UNCHANGED from v788; v788 cleared the
11-ship NASA 1.177 plateau by advancing to 1.178). Counter-cadence count
UNCHANGED at 5 (v585, v776, v777, v778, v779; v789 is forward-cadence
audit-driven, not counter-cadence).

## Audit roadmap status

This is **Tier 1 ship 4/N** of the AUDIT-2026-05-26 work (cumulative:
v785 PROJECT.md normalizer + v786 module-scanner + v787
dashboard/automation/allowlist + v789 first shelfware verdict).

**T1.2 trilogy COMPLETE.** The adoption telemetry surface is now
production: scanner identifies candidates; dashboard surfaces them;
allowlist captures intentional-isolation judgment; SHELFWARE-VERDICTS.md
captures per-module wire-or-retire decisions. The shelfware closure loop
is operational.

**Remaining Tier 1:** T1.1 (bounded-learning calibration loop, 4-6
ships); T1.3 (College of Knowledge consumer engine, 3-5 ships).

**Remaining Strengthening Levers:** S3 (codify meta-cadence); S4
(public surface separation); S6 (self-evidence loop for security
disciplines); S7 (counter-cadence cadence).
