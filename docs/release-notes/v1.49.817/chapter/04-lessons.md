# v1.49.817 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v816).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `c12-load-kb-context.test.ts` (206 lines) + `load-kb-context.sh` (215 lines) + the v635 fragile-test-audit disposition + the v802 handoff re-flag note. Found a clean structural-cause diagnosis already documented at v635 — 5 months of paper trail. Recon time ~10 min vs. ~30+ min for independent diagnosis. |
| #10415 | Deferred-maintenance escalation | THE central application. 150+ ships overdue from v635; re-flagged at v802 with explicit threshold-cross note. The recipe matches v815 HIGH-01 exactly: original author flagged → structural cause known → deferred multiple ships → ship at minimum credible threshold. |
| #10416 | Tolerant-generator / lightest wire | Resisted 4 architectural-clean alternatives (bash refactor, vitest project config, async refactor, mock-based unit-tests). Chose 1-char retry change. The trade-off shape: lightest wire that makes the operator-visible effect (test failure rate) drop to zero, even if the structural root cause persists. Acceptable per #10416 because the wedge's blast radius is bounded (test-time only, no production impact). |
| #10417 | Static-analysis tool authoring | N/A directly. But the fork-budget math captured in the comment (per-`runScript` 6 forks × 7 tests = ~42 forks/file) is a measurable metric. Future tooling could static-analyze test files for `execFileSync` / `spawnSync` call counts × describe-block test count → emit a fork-pressure score per file. Out of scope here; observation flagged. |
| #10422 | Verdict-pattern surface separation | Test config (retry, timeout) lives separately from test bodies (assertions). The retry-bump only changes the failure-tolerance surface; the correctness contract (the assertions) is unchanged. Clean separation between observability surface (decisions about how to respond to failure) and decision surface (what counts as failure). |
| #10427 | Failure-mode contracts | The pre-fix failure mode was: "test sometimes fails on attempt 1; pre-tag-gate retries the file; PASS on second attempt; noise pollutes operator-visible gate output but no real action required." The fix realigns: failure mode is now "test fails iff all 4 attempts fail," which is rare enough to be operator-actionable when it does occur (then it's a real problem, not flake). The contract: when this test fails, it's signal, not noise. |
| #10431 | Two-layer closure for procedure-rooted drift | Partial application. The procedure-rooted aspect: manual pre-tag-gate retry was the operator workaround. The detector layer (pre-tag-gate retry logic) was already there. The source-eliminator layer (retry-bump in the describe-block) is added in this ship. Both layers now present. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v816)

| Source | Observation | Status |
|---|---|---|
| (v810-814) | watch-loop tear-down race | carry forward |
| (v810-814) | chained-session architectural-tax break-even | carry forward |
| (v810-814) | registry-abstraction cross-chain payoff | carry forward |
| (v804) | 6th-mode-flag refactor trigger | carry forward |
| (v805) | codification-ship pattern at 5 instances | **eligible for promotion in next codify ship** |
| (v806) | Chokepoint pattern at 4 instances | **eligible for promotion in next codify ship** |
| (v810) | Recon doc name-drift across ~1 day | carry forward (2 instances) |
| (v810) | Two-layer default-off contract | carry forward |
| (v811) | Post-infrastructure chip cadence ~2× faster | carry forward |
| (v811) | Block-comment consolidation when N-of-N siblings wired | carry forward |
| (v813) | `node_modules` symlink pattern for tmpdir-isolated CLI tests | carry forward |
| (v815) | Audit findings have a half-life; verify-then-act before sizing | carry forward (2 instances if v817 audit-revisit counted) |
| (v815) | Original-author forward-flagging is the highest-signal trigger for #10415 | carry forward (2 instances if v817 v635-disposition counted) |
| (v815) | Refcount belongs at the operation boundary, not the syscall boundary | carry forward |
| (v815) | Lazy-singleton + test-hook pattern for module-level state | carry forward |
| (v816) | Side-bug discovery via test design | carry forward |
| (v816) | `--check` semantics: canonical-shape vs would-regenerate-now | carry forward |

## New observations flagged this ship (not promoted; not in count)

**Fork-budget math as a static-analysis metric.** Per-test subprocess count × tests-per-file = fork pressure per file. When concurrent files share fork budget (vitest pool), the global fork pressure scales linearly with the count of subprocess-heavy files in the suite. A static-analysis tool could compute this and flag files at risk before the flake materializes. Tentative; 1 strong instance (this ship + the bash script's measurable subprocess count). If a 2nd subprocess-heavy file gets similar treatment in a future ship, this codifies.

**Lightest-wire wins when the wedge's blast radius is bounded.** The architectural-clean fix (per-file pool isolation) would touch global vitest config and affect sibling tests. The lightest-wire fix (retry-bump) is contained to one test file. When the wedge's failure mode has a small blast radius (test-time only, no production impact), lightest-wire is often the operator-correct choice even when an architectural fix exists. Tentative; pairs with #10416 application context. Generalization candidate for a future codify ship if a 2-3rd instance accumulates.

**Comment-block expansion as the "non-code" half of #10415 closure.** The retry-bump alone would close the wedge functionally. The 5-line comment expansion captures the structural cause + history + deferral reasoning inline. Future readers (next pre-tag-gate flake triage, next fragile-test sweep) find the context without spelunking. This pattern — "the code change closes the wedge; the comment block closes the documentation debt" — pairs with #10412 recon-first. Tentative; 1 instance.

## Cross-references

- #10412 + #10415 → recon-first surfaces the existing paper trail (v635 audit, v802 re-flag); the closure is then verifying-then-applying the already-diagnosed structural cause.
- #10416 + #10422 → lightest-wire pairs with verdict-pattern surface separation: change the observability/decision surface (retry config), not the correctness contract (test bodies).
- #10427 + #10431 → failure-mode contracts (realign what counts as signal) + two-layer closure (detector was the pre-tag-gate; source-eliminator is the retry-bump).

## What this ship illustrates about T2.3 closure cadence

v815 closed HIGH-01 (185 ships overdue, 75-90 min closure). v817 closes c12-load-kb-context flake (150+ ships overdue, ~30 min closure). Both are #10415 case studies. The pattern: T2.3 wedges close fastest when the original-author paper trail (v629 REVIEW.md note for HIGH-01; v635 fragile-test-audit disposition for c12) has already done the structural diagnosis. The closing ship's job is to recon-verify + apply minimum credible fix + document inline.

After v817, the audit-named T2.3 backlog is functionally exhausted of cleanly-actionable items. FlagLookup extract (v818 target) is recon-surfaced from the v815 handoff, not from the v784 audit. The audit's value as a wedge-list source has been mostly harvested; future T2.3-style closures will use the recon-surfaced backlog + new wedges as they accumulate per #10415.
