# v1.49.819 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v818).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read 5 aminet files (876 lines total) + chokepoint definition + pattern reference (`src/intelligence/analyzer/git.ts`) + allowlist. Surfaced the 5th file's different wiring shape (never-throws contract) on read 5 — not predicted in advance. |
| #10414 | Optional `ctx?` parameter | THE central application. 5 functions threaded; zero call-site churn. |
| #10416 | Tolerant-generator / lightest wire | Resisted default-context factory + typed command union. Wired exactly what's needed per file. |
| #10422 | Verdict-pattern surface separation | The wired call sites are independent observability surfaces; chokepoint definition is shared decision surface. |
| #10427 | Failure-mode contracts | 4 files use hoist-outside-try/catch (propagation); 1 file (emulated-scanner) uses wrap-and-convert (preserves never-throws contract). Both patterns documented. |
| #10432 | KNOWN_UNWIRED ledger discipline | Allowlist 37 → 32 (largest single-ship reduction since v806). Inline closure comment marks v819 batch. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v818)

| Source | Observation | Status |
|---|---|---|
| (v810-814) | watch-loop tear-down race | carry forward |
| (v810-814) | chained-session architectural-tax break-even | carry forward |
| (v810-814) | registry-abstraction cross-chain payoff | carry forward |
| (v804) | 6th-mode-flag refactor trigger | carry forward |
| (v805) | codification-ship pattern at 5 instances | **eligible** |
| (v806) | Chokepoint pattern at 4 instances | **eligible** |
| (v810) | Recon doc name-drift across ~1 day | carry forward |
| (v810) | Two-layer default-off contract | carry forward |
| (v811) | Post-infrastructure chip cadence ~2× faster | carry forward (+ v819 reaffirms — 30 min for 5-file batch) |
| (v811) | Block-comment consolidation when N-of-N siblings wired | carry forward (+ v819 reaffirms — 5-of-5 aminet siblings wired) |
| (v813) | `node_modules` symlink pattern for tmpdir-isolated CLI tests | carry forward |
| (v815) | Audit findings have a half-life | carry forward |
| (v815) | Original-author forward-flagging | carry forward |
| (v815) | Refcount at operation boundary | carry forward |
| (v815) | Lazy-singleton + test-hook | carry forward |
| (v816) | Side-bug discovery via test design | carry forward |
| (v816) | `--check` semantics: canonical vs would-regenerate-now | carry forward |
| (v817) | Fork-budget math as static-analysis metric | carry forward |
| (v817) | Lightest-wire wins when blast radius is bounded | carry forward |
| (v817) | Comment-block expansion as non-code half of #10415 | carry forward |
| (v818) | Deferred wedges close at 4th instance, not 2nd-3rd threshold | carry forward |
| (v818) | Mechanical migrations should add a unit test with the extract | carry forward |
| (v818) | Attribution comment as registry-extract closure doc | carry forward |

## New observations flagged this ship (not promoted; not in count)

**Family-batch chips close N entries at the same wall-clock cost as single chips.** v819 closed 5 entries in ~30 min. v811's first batch closed 3 entries (block-comment consolidation when N-of-N). The pattern: when a family is structurally homogeneous, batch is the right scope and wall-clock cost is approximately family-size-independent. Tentative; 2 instances (v811 + v819). Generalization candidate if a 3rd instance lands.

**Never-throws contracts require wrap-and-convert for chokepoint denial.** The standard "hoist outside try/catch" works when the function's contract allows throwing. When the function's contract is "returns result, never throws" (pre-flight failures become result-shape entries), denial must be wrapped and converted to the result-shape. v819's emulated-scanner is one instance; future similar contracts will hit the same pattern. Tentative; 1 instance; flag for #10427 codify-ship if a 2nd instance lands.

**Visual prominence in the audit allowlist doesn't drive migration cadence.** The 5 aminet entries appear as the FIRST 5 entries (alphabetical), but weren't prioritized for migration until v819. Ship-by-ship discipline + explicit recon are what drives the cadence, not list position. Tentative; observation overlaps with #10432 (ledger-as-debt-not-priority). 1 instance.

## Cross-references

- #10414 + #10432 → optional ctx parameter is the wiring tool; the KNOWN_UNWIRED ledger is the migration tracker. Together they form the closure pattern.
- #10416 + #10432 → lightest-wire bounds the scope per ship; KNOWN_UNWIRED tracks accumulated work. Each ship should chip the allowlist by the smallest viable family-or-single batch.
- #10427 → applies in two failure-mode shapes here (4 files load-bearing, 1 file forensic-via-conversion). Single ship documents both.

## What this ship illustrates about KNOWN_UNWIRED ledger cadence

v806 introduced the chokepoint + allowlist at 54 entries (38 process + 16 egress). 13 ships later (v819), the process allowlist is at 32 (-6 net from v806 + initial small chips). The trajectory:

| Ship range | Process allowlist | Egress allowlist |
|---|---|---|
| v806 (intro) | 38 | 16 |
| v809-v812 (initial chips) | 37 | 11 |
| v815-v818 (T2.3 wedges; unrelated) | 37 | 11 |
| v819 (this ship) | 32 | 11 |

Pattern: chips can be opportunistic when other work (T2.3 wedges, etc.) is in flight. The ledger is a backlog, not a priority queue; chips happen when convenient and when the family structure supports a batch.

After v819, the next obvious targets: git/core family (4 entries, v820), then individual chip-down ships for the remaining 28 entries as they cluster into families or singletons.
