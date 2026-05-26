> Following v1.49.791 — _Shelfware Verdict 2 + 3: ALLOWLIST `tonnetz` + `wasserstein-hebbian`_, v1.49.792 ships as Shelfware Verdict 4: WIRE `koopman-memory` via `skill-creator koopman-check` CLI.

# v1.49.792 — Shelfware Verdict 4: WIRE `koopman-memory` via `skill-creator koopman-check`

**Shipped:** 2026-05-26

Fourth shelfware verdict, second WIRED. Mirrors the v789 `semantic-channel` WIRE pattern almost exactly: HARD-preservation gate (G8) on an existing subsystem (`src/memory/`), `import type`-only adapter, advisory-only computations exposed through a new CLI surface, no multi-consumer surfaces touched. The `lightest wire that satisfies` discipline (#10423, codified v790) explicitly anticipated this pattern.

## What shipped

- **`src/cli/commands/koopman-check.ts`** (~190 lines) — new top-level `koopman-check`/`kc` command. Three-tier output (text/quiet/JSON). `--state-dim N` (default 8) constructs an identity Koopman operator; `--steps N` (default 8) sets the zero-input retention horizon. Runs all three advisory invariants (`checkIdentityRetention`, `checkZeroInputRetention`, `checkLipschitzBound`) plus `spectralData`, reports PASS/FAIL per invariant, exits 0 regardless of results. CAPCOM retains enforcement authority (G8 HARD preservation invariant).
- **`src/cli/commands/koopman-check.test.ts`** — 22 tests, mock-at-module-level pattern from v789 (avoids fixture-bundle setup). Coverage: argument handling (8), all-pass path (4), failure path (3), opt-in flag reporting (4), advisory-only invariant (2).
- **`src/cli/dispatch.ts` + `src/cli/help.ts`** — dispatcher entry + help-text row for the new top-level command.
- **`docs/SHELFWARE-VERDICTS.md`** — +1 verdict row (WIRED). Roster trimmed from 3 to 2 (`coherent-functors`, `hourglass-persistence` remain; both naturally defer to T1.3 / skill-DAG instrumentation).
- **`.planning/PROJECT.md`** — Active milestone + Latest shipped release + Last updated frontmatter advanced.

## Through-line

v789 established the WIRED-via-CLI pattern. v790 codified the disciplines (#10422 surface separation + #10423 lightest wire) that govern verdict authoring. v791 emitted 2 ALLOWLISTED verdicts (the lightest possible verdict shape). v792 is the second WIRED verdict, exercising the codified discipline in its native shape — a CLI subcommand that imports the module's public surface, no in-loop wire into multi-consumer code.

The structural similarity between `semantic-channel` and `koopman-memory` made the WIRE almost mechanical: read the existing dacp-drift-check files as templates, identify the equivalent advisory entry-points in koopman-memory (`identity`, `spectralData`, the 3 invariants), wire them through the same 3-tier output shape, and ship. Total wall-clock ~25 min — faster than v789's 23 min only because the dispatcher namespace decision was simpler (top-level command vs subcommand of `dacp`).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED from v789). Counter-cadence count UNCHANGED at 5. v792 is forward-cadence audit-driven.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1 — Module-usage scanner | Delivered at v786 |
| T1.2 ship 2 — Dashboard + automation + allowlist | Delivered at v787 |
| T1.2 ship 3 — First shelfware verdict (WIRED `semantic-channel`) | Delivered at v789 |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| T1.2 ship 4 — Second + third shelfware verdicts (ALLOWLISTED × 2) | Delivered at v791 |
| **T1.2 ship 5 — Fourth shelfware verdict (WIRED `koopman-memory`)** | **Delivered at v792 (this ship)** |
| T1.1 — Bounded-learning calibration loop | OPEN — 4-6 ships |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Verdict ledger growth

| At | Verdicts emitted | Open candidates | Cluster closure |
|---|---|---|---|
| pre-v789 | 0 | 6 | 0% |
| v789 close | 1 (WIRED) | 5 | 17% |
| v791 close | 3 (1 WIRED + 2 ALLOWLISTED) | 3 | 50% |
| **v792 close** | **4 (2 WIRED + 2 ALLOWLISTED)** | **2** | **67%** |

## Next forward candidates

- **T1.2 ship 6 — Fifth / sixth verdicts.** Two open candidates remain: `coherent-functors` (defers naturally until T1.3 College of Knowledge consumer engine ships) + `hourglass-persistence` (defers naturally until skill-DAG instrumentation ships). Both have planned WIRE sites tied to T1.1 / T1.3 work, so closing the cluster fully may wait for those substrate surfaces. Alternative: ALLOWLIST both as reference impls if T1.1/T1.3 are months out.
- **NASA 1.179** — INTERSTELLAR-BOUNDARY axis obs#3 continuation candidates queued in `www/tibsfox/com/Research/NASA/1.178/to-1.179.md`.
- **T1.1** — bounded-learning calibration loop (most ambitious Tier 1 remaining).
- **T1.3** — College of Knowledge consumer engine.

---
**Prev:** [v1.49.791](../v1.49.791/00-summary.md) · _(current tip)_
