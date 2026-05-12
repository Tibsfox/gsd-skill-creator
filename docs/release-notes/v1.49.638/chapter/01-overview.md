# 01 — Overview: v1.49.638 Housekeeping Cluster #5

## Why this milestone exists

v1.49.638 was authored as the fifth in the explicit cluster chain
to absorb v1.49.637's close handoff. The v1.49.637 close
identified **one named architectural carry-forward** (CL5-CF-1:
atlas LRU promote-vs-batch-load semantics) plus two pieces of
operational debt that had surfaced across recent clusters:

1. **STORY-gate ordering ambiguity** — the v1.49.637 C5 STORY
   sustained-update gate landed as `scripts/pre-tag-gate.sh` step
   10/10, but mid-T14 review surfaced that the append should
   occur **after** tag push (the STORY entry references the tag),
   not as part of pre-tag composite. No canonical T14 sequence
   document existed to settle the ordering.

2. **Substrate-probe discipline as informal practice** — v1.49.637
   Lesson #10192 codified the substrate-probe pattern but it
   lived in `.planning/test-discipline/` (gitignored). A
   tracked-codification rebase was warranted to make the
   discipline normative.

These three items (atlas-LRU + STORY-gate + substrate-probe)
formed the C1/C2/C3 spine of v1.49.638. C4 (self-mod-guard CI
install gap) was added during W0 after operator probe surfaced
that the v1.49.634 hooks-CI gap had recurred under a different
shape. C5 (pre-emptive flake audit) was a non-deferral component
authored in W1C to clear flake risk ahead of the upcoming v1.49.639
NASA degree shipping window.

## Scope change disclosure

**The original mission package framed v1.49.638 as the close of
the 4-cluster carry-forward chain.** The intent was: ship C1-C5,
authorize T14, and exit the cluster chain with a clean engine
ready for the next degree-advancing milestone.

**The actual outcome extends the carry-forward chain from
4-cluster to 5-cluster.** C4 attempt v1 introduced a CI install
step that failed in the GitHub Actions runner with a shape that
did not reproduce locally. The PR was reverted. C4 attempt v2
re-attempted with a verbose-logged install step and an explicit
invariant check; both succeeded — but CI still failed with 2/30,275
test failures, both on the `self-mod-guard.js` hook fire path.

**The diagnostic substrate enumerated by v1+v2** is itself the
load-bearing C4 outcome:

- install.cjs verbose runs PASS in CI
- invariant check (`test -f .claude/hooks/self-mod-guard.js`) PASSES
- meta-test assertions are CORRECT
- **self-mod-guard.js hook execution itself exits status=1 in CI runner**

This is a narrower, more actionable target than the original C4
scope. It is also a **new kind** of substrate divergence: not
code substrate (the hook file is byte-identical local-vs-CI), not
test substrate (the test asserts the right thing), but **runtime-
environment substrate** — env vars, $PATH, file permissions, working
directory at hook fire time. This is the genesis of Lesson #10197.

The dashboard skip-guard fix discovered during C4-v2 investigation
was independent of the CI install issue and was cherry-picked
forward as a standalone bug fix (commit `06a0da610`).

## Operator W0 decision routing

Three operator decisions were routed via team-lead AskUserQuestion
relay during W0:

### C1 — Atlas LRU isolation API shape

**Option space:**
- (a) New `get_or_open_for_project` API method (per-project
  isolation)
- (b) Test rewrite to use existing API differently (deeper
  diagnostic)

**Recommendation:** (b) test rewrite — cleaner architectural
solution, no new public API surface.

**Operator chose:** (a) per-project API.

**Rationale (operator-private context):** Cluster #6+ has scoped-
Tauri-command plans on the roadmap. Per-project API surface is
load-bearing for that work; landing it here means the LRU isolation
invariant gets test coverage **before** the Tauri commands ship,
not after.

### C2 — STORY-gate ordering disposition

**Option space (new 3-option space surfaced when no scripts/ship.sh
found in repo):**
- (i) Doc + invariant test (canonical T14 sequence document +
  ordering assertion)
- (ii) Refactor pre-tag-gate to remove step 10 (mechanical
  removal; leaves ordering implicit)
- (iii) Move append into post-tag-push manual step (procedural
  fix; no automation)

**Recommendation:** (i) doc + invariant.

**Operator chose:** (i) doc + invariant. Recommendation honored.

### C4 — Self-mod-guard CI install gap

**Option space:**
- (a) CI install step that copies project-claude/hooks/* into
  `.claude/hooks/` before test run
- (b) Test exemption (mark self-mod-guard-related assertions as
  CI-skip)

**Recommendation:** (a) CI install — the gap is a real defect; an
exemption would mask it.

**Operator chose:** (a) CI install. **Re-attempted as partial-merge
after v1 failure**, which preserved the dashboard skip-guard fix
as an independent commit while reverting the broken install step.

## Why scope change is OK

A counter-cadence housekeeping cluster's job is to **reduce
operational-debt surface**. v1.49.638 reduced surface in 4
dimensions even with C4 deferred:

1. New canonical T14 sequence document (C2) — eliminates an
   ordering ambiguity that had cost mid-T14 review cycles for the
   last 2 ships
2. New canonical substrate-probe discipline doc (C3) — moves
   v1.49.637 Lesson #10192 from informal gitignored practice to
   tracked normative reference
3. New per-project atlas API + LRU isolation invariant (C1) —
   removes a "would-be-discovered-at-Tauri-commands-ship" failure
   mode
4. 4 flake fixes (C5) — preempts CI flake risk ahead of v1.49.639

The diagnostic substrate produced by C4 v1+v2 is itself a 5th
operational-debt reduction: Cluster #6 inherits a **narrow target**
(why does self-mod-guard.js exit status=1 in CI) instead of a
**broad target** (something about CI install is wrong).

## Engine state

UNCHANGED. v1.49.638 is a counter-cadence milestone; no NASA / MUS
/ ELC / SPS / TRS forward-cadence content shipped. The next
degree-advancing milestone is v1.49.639 (candidate: STS-7 Sally
Ride / Challenger, carried forward from v1.49.637 forward-note).
