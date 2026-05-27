# v1.49.820 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v819).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read branch-manager (357 LOC) + sibling-file headers + chokepoint definition. ~5 min recon. Surfaced internal-helper pattern (single execGit used by all 4 public functions). |
| #10414 | Optional `ctx?` parameter | 4 public functions + 1 helper threaded. Zero call-site churn. |
| #10416 | Tolerant-generator / lightest wire | Resisted batching the git/core family; stayed within operator's chain plan ("first chip" scope). |
| #10422 | Verdict-pattern surface separation | Wired call site + chokepoint definition are separate decision surfaces. |
| #10427 | Failure-mode contracts | ensureProcessAllowed in the helper; denial propagates via Promise rejection to public-function callers. Load-bearing-propagation shape. |
| #10432 | KNOWN_UNWIRED ledger discipline | Allowlist 32 → 31. Inline comment names v820 first-chip + future-batch trajectory. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v819)

All v810-v819 tentative observations remain as carried-forward in v819's lessons file.

## New observations flagged this ship (not promoted; not in count)

**Internal-helper pattern is ideal for chokepoint wiring.** When a file routes ALL spawn calls through a single internal helper, wiring touches only: 1 helper signature + 1 ensure call + N public-function signatures + M callsite ctx-passes. The factor that varies is N (public functions), not M (spawn count). Files with this shape have constant per-spawn-site cost; files without it have linear per-spawn-site cost. Tentative; 2 instances (branch-manager + intelligence/analyzer/git from v809). Generalization candidate.

**First-chip vs batch alternation is a deliberate cost-shape choice.** v819 batched 5 siblings; v820 first-chip a single file. The operator-chosen alternation matches: batch when the family is well-understood + co-located; first-chip when establishing the shape for a new family. The per-ship cost is approximately equal; the per-ship scope differs. Pattern lets the operator size based on what they want to learn vs. what they want to close. Tentative; 2 instances + meta-observation about cost-shape choice. Worth a future codify-ship consideration.

**Future-batch trajectory in the allowlist comment is a self-documenting roadmap.** v820's allowlist comment names the 3 remaining git/core sibs as future-batch targets. Future operators reading the allowlist can size the next batch directly from the comment. Pairs with #10432 ledger discipline. Tentative; pattern is observability + decision-surface separation applied to in-source comments.

## Cross-references

- #10414 + #10432 → optional ctx + KNOWN_UNWIRED ledger together form the closure pattern.
- #10416 + #10432 → lightest-wire bounds per-ship scope; ledger tracks accumulated work.
- v819 + v820 → batch-vs-first-chip alternation pattern; both valid scopes.

## What this ship illustrates about chip cadence

v819 (5-file batch) + v820 (1-file first-chip) shows the chip cadence flexibility per #10432. The ledger shrinks at variable rates:

| Ship | Cadence | KNOWN_UNWIRED Process |
|---|---|---|
| v806 (intro) | — | 38 (initial allowlist) |
| v809 (intel/analyzer/git) | first-chip | 37 |
| v811 (sibling batch) | batch (3) | 34 |
| v812 (depen-auditor) | first-chip | 33 |
| v819 (aminet batch) | batch (5) | 28 ... actually 32 (chain reset count) |
| v820 (branch-manager) | first-chip | 31 |

The ledger reduction rate is operator-driven, not scheduled. Each ship picks the next target based on what's actionable + what fits the ship's scope (first-chip for shape-establishing, batch for known-shape consumption).

After v820, 31 entries remain. The chain continues to v821-822 (gate flip) and v823 (ObservationBridge wire), neither of which touch the process allowlist. The next process-allowlist chip is a future ship beyond this chain.
