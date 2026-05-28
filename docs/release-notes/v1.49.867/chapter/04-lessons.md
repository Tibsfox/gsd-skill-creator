# v1.49.867 — Lessons

## Tentative observations (below promotion threshold)

### Tools-detecting-silent-failures must themselves fail loudly

**Instances: 1 (v867)**

**Observation:** The v857 cross-audit tool was designed to catch silent stale-entry failures (Shape A wired-but-still-in-allowlist + Shape B import-without-use). The v867 ship surfaced a third silent-failure mode IN THE TOOL ITSELF: the non-greedy regex `[\s\S]*?\]\s*\)` could terminate at `[])` substrings inside comments, causing the tool to return empty entry lists and report "clean" by vacuous truth.

The meta-pattern: any tool built to fight silent-failure asymmetry must itself be checked for silent failures in its detection path. The v857 tool's "0 entries means 0 stale" branch was the silent-failure-by-vacuous-truth mode.

**Why below threshold:** First instance. The bug surfaced + got fixed in the same ship.

**Promotion gate:** 2nd instance from a future tool of similar shape (an inverse-audit detector with parser-or-extraction logic that could fail silently). Likely classification: sibling rule under #10443 in `docs/known-unwired-ledger-discipline.md`. The discipline doc's "Inverse-audit continuous-verification mode" section (codification-ready at 10 instances from v858-v867) could include this rule.

## Reinforced (campaign close)

### Cross-audit tool continuous-verification (10 instances, v858-v867) — PROMOTION-ELIGIBLE

10 consecutive applications across the chip-execution cluster. Bug surfaced + fixed at instance 10. Continuous-verification mode established. Codify at next codify ship (~v874-877 per #10428 cadence) as a refinement of #10443 — possibly in a new `## Inverse-audit continuous-verification mode` section of `docs/known-unwired-ledger-discipline.md`.

### Chip-pick by size correlates with wire-shape diversity (Track 2 + Track 3 evidence)

2 instances (Track 2 + Track 3). 10 chips ascending by size produced 10 distinct wire shapes across two chokepoint surfaces (Process + Egress). Promotion-eligible. Refinement of #10416 (lightest wire) — the size-ascending heuristic surfaces the lightest viable wire first AND incidentally covers the variant catalog.

### DI-fetch-wrapper as Egress analog of #10441

1 instance (v866). Below 2-instance threshold.

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** APPLIED. Both fetch sites' EgressContextDenied propagates through the async-function throw machinery.

### #10416 — Lightest wire

**Status:** APPLIED. Two hoisted checks at the two fetch sites; minimal LOC.

### #10443 — Inverse-audit stale-entry detection

**Status:** APPLIED (10th consecutive chip ship) + EVOLVED. The tool itself surfaced a silent-failure mode (parser failure → vacuous-truth clean report). v867 fix hardens the parser; codify as continuous-verification refinement at next codify ship.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Egress KNOWN_UNWIRED 7 → 6.

## No promotions this ship

Eligible backlog: 0. (Cross-audit continuous-verification + the new tools-detecting-silent-failures sibling are queued for next codify ship.)

## Campaign closure summary

**11/11 ships shipped.** Track 1 (codify) + Track 2 (Process × 5) + Track 3 (Egress × 5).

Net new candidates queued for next codify ship:
1. **Cross-audit tool continuous-verification** — 10 instances; promotion-eligible.
2. **Chip-pick by size correlates with wire-shape diversity** — 2 instances; promotion-eligible.
3. **Tools-detecting-silent-failures must themselves fail loudly** — 1 instance; wait for 2nd.
4. **DI-fetch-wrapper as Egress analog of #10441** — 1 instance; wait for 2nd.
5. **Codify + tool same-ship pattern** (v857 carry-forward) — 1 instance; wait for 2nd.
6. **Pre-allocated-resource cleanup on security denial** (v859 carry-forward) — 1 instance; wait for 2nd.
7. **Pre-test FK-pragma pattern** (v860 carry-forward) — 1 instance; wait for 2nd.
