# v1.49.792 — Shelfware Verdict 4: WIRE `koopman-memory` via `skill-creator koopman-check`

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven Tier 1 ship 6/N (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.791 — Shelfware Verdict 2 + 3: ALLOWLIST `tonnetz` + `wasserstein-hebbian`
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.2 ship 5 — fourth shelfware verdict; second WIRED verdict in the cluster

## Summary

Fourth per-module shelfware verdict in the Math Foundations Refresh (v572) cluster, and the second WIRED verdict after v789's `semantic-channel`. Exposes `src/koopman-memory/`'s three advisory retention invariants through a new top-level `skill-creator koopman-check`/`kc` CLI command. Module flips test-only → living on the next adoption-scan via the standard CLI-importer pattern.

`koopman-memory` is the natural WIRED counterpart to `semantic-channel`: both ship HARD-preservation gates (G7 / G8) protecting an existing subsystem (`src/dacp/` / `src/memory/`) via a `import type`-only adapter, both expose advisory-only computations through CLI, and both flip adoption-scan status without touching multi-consumer surfaces.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `src/cli/commands/koopman-check.ts` | NEW | ~190 lines — top-level `koopman-check`/`kc` command with 3-tier output (text/styled, quiet/CSV, JSON), `--state-dim`, `--steps`, `--quiet`, `--json`, `--help` flags, advisory-only exit-code invariant |
| `src/cli/commands/koopman-check.test.ts` | NEW | 22 tests covering argument handling (8), all-pass path (4), failure path (3), opt-in flag reporting (4), advisory-only invariant (2). Mock-at-module-level pattern from v789 |
| `src/cli/dispatch.ts` | MODIFIED | +5 lines: koopman-check command import + dispatcher entry (aliases `koopman-check`, `kc`) |
| `src/cli/help.ts` | MODIFIED | +1 line: koopman-check entry under the commands list |
| `docs/SHELFWARE-VERDICTS.md` | MODIFIED | +1 verdict row (WIRED); roster trimmed from 3 to 2 |
| `.planning/PROJECT.md` | MODIFIED | Active milestone + Latest shipped release + Last updated advanced |

## What changed

- **`koopman-memory` flips test-only → living** on `node tools/adoption-scan.mjs`. Status: `living`, realCallerCount: 1, cliImporters: `['src/cli/commands/koopman-check.ts']`. Same pattern as v789 `semantic-channel`.
- **`skill-creator koopman-check` available as a CLI surface.** Operators can construct an identity Koopman operator at any positive state dimension, run all three advisory invariants, and inspect the spectral data. `--quiet` emits a CSV row; `--json` emits the full record including per-invariant `RetentionResult`s and operator spectrum.
- **Two operator paths exercised:** the `--state-dim` flag (with `--steps` for zero-input retention horizon) gives operators a no-fixture-required smoke check; the JSON output is machine-readable for downstream tooling.
- **HARD-preservation gate G8 preserved.** The CLI imports nothing from `src/memory/`. It only touches `src/koopman-memory/`'s public surface, which is itself `import type`-only over `src/memory/`. The byte-identical v1.49.571 baseline for the memory subsystem remains intact.

## Verification

- `npx vitest run src/cli/commands/koopman-check.test.ts` → 22/22 PASS
- `node tools/adoption-scan.mjs --json` → `koopman-memory` reports as `living` with 1 CLI importer (`src/cli/commands/koopman-check.ts`)
- `node tools/adoption-scan.mjs --shelfware-threshold 1` → `koopman-memory` no longer flagged as shelfware
- `node tools/project-md-normalizer.mjs --check` → no drift
- `bash tools/pre-tag-gate.sh` → TO-FILL after gate run

## Engine state

NASA degree sustains at **1.178** (UNCHANGED from v789). Counter-cadence count UNCHANGED at 5. v792 is forward-cadence audit-driven.

## Audit roadmap status

This is **Tier 1 ship 6/N** of the AUDIT-2026-05-26 work (cumulative: v785 PROJECT.md normalizer + v786 module-scanner + v787 dashboard/automation/allowlist + v789 first shelfware verdict + v790 codification + v791 verdicts 2+3 + v792 verdict 4).

**Verdict ledger growth:** 3 rows (v791) → 4 rows (v792). Verdict distribution: WIRED × 2 + ALLOWLISTED × 2. Open candidates: 3 (v791) → 2 (v792). Math Foundations Refresh shelfware closure: ~67% (4/6 modules verdicted).

**Remaining Tier 1:** T1.1 (bounded-learning calibration loop, 4-6 ships); T1.3 (College of Knowledge consumer engine, 3-5 ships).

**Remaining Strengthening Levers:** S3 (codify meta-cadence); S4 (public surface separation); S6 (self-evidence loop for security disciplines); S7 (counter-cadence cadence).
