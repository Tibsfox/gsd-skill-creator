# v1.49.813 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + 8 tentative observations (UNCHANGED from v812).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `tools/state-md-normalizer.mjs` + `docs/STATE-MD-SCHEMA.md` + prior hand-authored STATE.md files + `docs/T14-SHIP-SEQUENCE.md` BEFORE writing the tool. Recon caught: (a) normalizer is single-pass-idempotent post-v783 (no workaround needed); (b) schema has `predecessor.counter_cadence` separately from top-level `counter_cadence`; (c) `last_updated` field needs `.000Z` suffix for validator. |
| #10414 | Gate-not-vigilance | THE central application. The hand-edit-and-normalize rule was process discipline; the atomic-writer is the deterministic gate. Converts an operator-discretion procedure into a single CLI invocation with documented exit codes. |
| #10416 | Tolerant-generator / lightest wire | Resisted: schema-driven template generator (premature at N=1 template); interactive prompter (mission creep); update-vs-write tool (more complex than write-from-scratch); pre-tag-gate integration (separate concern). Chose: 1 CLI tool + 7 tests + 1 T14 doc step. |
| #10427 | Failure-mode contracts | Tool's atomic-write is followed by spawn-and-check that EXITS NON-ZERO if post-condition fails. Exit codes documented in docstring; tested in arg-validation tests. Load-bearing surface fails loudly. |
| #10428 | Meta-cadence — codify axis | This ship is on the CONSUME axis (consumes v807 detector + extends with source closure). The codify axis is overdue per #10428's ~7-10-ship spacing; queued for v814 (codification audit). |
| #10430 | 5-1-1 alternation | This is the alternation in action: 3 forward-cadence ships (v810 + v811 + v812) + 1 counter-cadence (this ship) + planned 1 codification (v814). Matches the discipline's intent. |

## Tentative observations carried forward (8 — UNCHANGED from v812)

No changes this ship. The 8 tentative observations remain for v814 codification audit to review.

## New observations flagged this ship (not promoted; not in count)

**`node_modules` symlink pattern for tmpdir-isolated CLI tests.** The end-to-end test needed `node_modules` reachable from the tmpdir cwd so the normalizer's `require('js-yaml')` could resolve. Used `ln -s <repo-node_modules> <tmpdir>/node_modules`. This is a generally-useful pattern for any tmpdir-isolated CLI test in this codebase that spawns a script depending on node_modules. Other tmpdir tests in this codebase that don't currently do this could be re-checked — they may be silently relying on inherited NODE_PATH or running tools that don't have npm-dep requires. Tentative observation; not a candidate (~1 explicit instance noticed).

**Two-layer closure pattern (source + detector) for procedure-rooted drift classes.** When a drift class originates from operator-discretion procedure (here: hand-edit STATE.md), the complete closure has two layers: (1) source eliminator that removes the discretion window, (2) detector gate that catches if the eliminator is bypassed. Either alone is insufficient (eliminator without detector means a future operator can re-introduce the procedure; detector without eliminator means the drift origin remains). The pattern applies generally to any process-discipline → gate conversion. Worth naming if a 2nd instance lands. Tentative observation; not a candidate (~1 explicit instance).

## Cross-references

- #10414 + counter-cadence-discipline doc → gate-not-vigilance rule applied at structural layer
- #10416 + #10428 → resisted multi-step refactor (#10416) while opening capacity for the planned codify ship (#10428)
- #10427 + atomic-writer design → exit-code semantics document the failure-mode contract explicitly
- #10430 + chain shape → v810-814 chain is the prescribed 3-forward + 1-counter + 1-codify micro-cadence

## What this ship illustrates about counter-cadence sizing

| Ship type | This chain | Wall-clock |
|---|---|---|
| Substrate-consumer wire (v810) | T1.3 GAP-2 closure | ~35 min |
| Batch chip 4 adapters (v811) | Mechanical post-infrastructure | ~25 min |
| First chip in new family (v812) | Cross-chokepoint pattern transfer | ~30 min |
| **Counter-cadence tool (this ship)** | **Source-closure for known drift class** | **~35-45 min** |

Counter-cadence ships fall in the same wall-clock band as substrate-consumer / first-chip ships when the wedge is small and well-framed. When the wedge requires new abstractions or affects many call sites, counter-cadence can be a multi-ship effort (see v585 concerns-cleanup mission). v813's wedge was bounded (one drift class, one procedure, one tool) → one ship sufficed.

The implication: future drift classes flagged in retrospectives should first be sized against this band. A bounded-procedure wedge fits a single counter-cadence ship; an unbounded-class wedge needs the concerns-cleanup mission shape (multi-phase, multi-ship).
