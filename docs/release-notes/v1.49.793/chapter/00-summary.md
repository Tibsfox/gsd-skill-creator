> Following v1.49.792 — _Shelfware Verdict 4: WIRE `koopman-memory`_, v1.49.793 ships as Shelfware Verdicts 5 + 6: Math Foundations Refresh cluster CLOSED — WIRE `coherent-functors` + `hourglass-persistence` via parallel CLIs.

# v1.49.793 — Shelfware Verdicts 5 + 6: Math Foundations Refresh Cluster CLOSED

**Shipped:** 2026-05-26

Closes the Math Foundations Refresh (v1.49.572) shelfware cluster at 100% by WIRING the final two open candidates in a single ship. Both follow the v789/v792 lightweight-CLI-wrap pattern: identity-fixture default + 3-tier output + advisory-only exit code + HARD-preservation invariants intact.

## What shipped

- **`src/cli/commands/coherent-check.ts`** (~190 lines) — new top-level `coherent-check`/`cc` command. Constructs an identity functor over a simple integer-object category (`{name, identity, compose, equalObjects}` per the test-fixture pattern), runs all 4 coherence predicates + the aggregate `checkCoherence`. `--object N` (default 0) sets the probe object; `--require-composition` enforces the composition witness.
- **`src/cli/commands/hourglass-check.ts`** (~210 lines) — new top-level `hourglass-check`/`hc` command. Three canonical DAG fixtures: `hourglass` (7-vertex with a bottleneck vertex `m`), `chain` (4-vertex linear), `empty` (degenerate). Runs `detectHoles` + `computeContractionIndices` + `detectWaists` + `aggregateContractionIndex` + `emitFinding`, reports the structured finding type (waist | hole | healthy).
- **`src/cli/commands/{coherent,hourglass}-check.test.ts`** — 17 + 20 tests respectively (37 total); mock-at-module-level pattern.
- **`src/cli/dispatch.ts` + `src/cli/help.ts`** — dispatcher entries + help rows.
- **`docs/SHELFWARE-VERDICTS.md`** — +2 verdict rows (WIRED × 2). Open-candidate roster section rewritten — cluster CLOSED.
- **`.planning/PROJECT.md`** — Active milestone + Latest shipped release + Last updated frontmatter advanced.

## Through-line

Three substrate modules with the SAME architectural shape (`semantic-channel`, `koopman-memory`, `coherent-functors`, `hourglass-persistence` — all HARD-preservation gates + `import type`-only adapters + advisory-only invariants) get WIRED via the SAME lightweight CLI pattern. The Shelfware verdict patterns discipline (#10422 surface separation + #10423 lightest wire) codified at v790 has now been applied 4 times — twice in v791 (ALLOWLIST shape), twice in v792/v793 (WIRE shape). The pattern is fully validated.

Operator decision-making accelerated each ship: v789 took ~23 min (first WIRE), v791 took ~20 min (first ALLOWLIST), v792 took ~25 min (second WIRE), v793 took ~30 min (two WIREs in parallel). Pattern reuse cuts per-verdict cost ~30-40% vs the first-of-shape.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v793 is forward-cadence audit-driven.

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
| T1.2 ship 5 — Fourth shelfware verdict (WIRED `koopman-memory`) | Delivered at v792 |
| **T1.2 ship 6 — Fifth + sixth shelfware verdicts (WIRED × 2; cluster CLOSED)** | **Delivered at v793 (this ship)** |
| T1.1 — Bounded-learning calibration loop | OPEN — 4-6 ships |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Verdict ledger growth (lifecycle close)

| At | Verdicts emitted | Open candidates | Cluster closure |
|---|---|---|---|
| pre-v789 | 0 | 6 | 0% |
| v789 close | 1 (WIRED) | 5 | 17% |
| v791 close | 3 (1 WIRED + 2 ALLOWLISTED) | 3 | 50% |
| v792 close | 4 (2 WIRED + 2 ALLOWLISTED) | 2 | 67% |
| **v793 close** | **6 (4 WIRED + 2 ALLOWLISTED)** | **0** | **100%** |

Final distribution: 4 WIRED + 2 ALLOWLISTED + 0 RETIRED. The 0-RETIRED count is itself a signal — every "shelfware candidate" turned out to be intentional substrate, just at different surface positions. The cluster's authors built substrate code without knowing where the live wires would land; the verdict campaign retroactively wired ~67% (4/6) of them via lightweight CLI wraps and preserved the rest as allowlisted substrate.

## Next forward candidates

- **T1.1 — Bounded-learning calibration loop.** Most ambitious Tier 1 remaining (4-6 ships).
- **T1.3 — College of Knowledge consumer engine** (3-5 ships). One of the natural WIRE-promotion sites flagged for `coherent-functors` in the original roster — promotion from CLI-wire to in-loop-wire becomes possible once T1.3 ships.
- **NASA 1.179** — INTERSTELLAR-BOUNDARY axis obs#3 continuation.
- **Strengthening Levers S3/S4/S6/S7** — codify meta-cadence, public surface separation, self-evidence loop, counter-cadence cadence.

---
**Prev:** [v1.49.792](../v1.49.792/00-summary.md) · _(current tip)_
