# 03 — Retrospective: v1.49.638 Housekeeping Cluster #5

## What worked

### Partial-merge as a real disposition

When C4-v1 failed CI and was reverted, the natural inclination was
"revert everything in the branch and start over." Instead, the
W1B retrospective surfaced that the **dashboard skip-guard fix
discovered during C4 investigation was independent of the install
issue**. Partial-merge preserved that fix (`06a0da610`) and
reverted only the install step.

This validates a generalizable pattern: **failed-CI iteration
produces substrate enumeration that successful first-tries skip.**
The 2 v1+v2 attempts narrowed the C4 target from "something about
CI install is wrong" to "self-mod-guard.js hook exits status=1 in
CI runner only" — a far more actionable Cluster #6 brief. This is
Lesson #10199.

### Commit-per-deliverable discipline carried through

W3.T1 (meta-test) and W3.T2 (this release-notes) were sequenced as
separate commits with explicit boundaries. The W3 brief mandated
"commit per chapter so partial completion is recoverable" per
v1.49.637 Lesson #10194 closing observation. As of this chapter,
3 of 6 chapter commits have landed; if a token-ceiling hit had
occurred between them, the team-lead could redispatch with a
fresh sub-agent for the remaining chapters without losing prior
work.

### Pre-emptive flake audit caught real regressions

C5 was authored as proactive operational-debt reduction, not as
carry-forward closure. 4 fixes landed (2 `ORDER BY rowid`
tiebreakers + 2 hookTimeout protections) that would have surfaced
as CI flakes during v1.49.639 ship. The audit cost was ~3 hours
of mid-cluster work; the prevented-cost is a probabilistic CI
flake interrupting a NASA degree ship.

### T14 canonical doc settles recurring review cycles

The STORY-gate ordering had been mid-T14 reviewed at the last
2 ships (v1.49.636 and v1.49.637). Each review consumed operator
attention and produced a slightly different mental model of "where
should this step live." `docs/T14-SHIP-SEQUENCE.md` ends that
cycle: future ships reference the doc, not reconstruct the
sequence.

## What could be better

### C4 v1 didn't probe runtime substrate before merge

The original C4-v1 implementation added a CI install step and
landed a meta-test assertion expecting it to make
`self-mod-guard.js` reachable. **Both were correct.** The bug was
in **runtime environment substrate** (whatever causes the hook to
exit status=1 in CI), which neither the install step nor the
meta-test could detect.

The pre-merge probe protocol was: "does the install step write
the files? Does the invariant check pass?" Both passed. **The
missing probe was: "does the hook successfully execute?"**

Lesson #10197 codifies this: substrate-probe discipline extends
to runtime-environment substrate, not just code substrate.

### Stage 2 flake-audit grep had a false-positive shape

The C5 audit Stage 2 used `grep -L hookTimeout` to find files
"missing hookTimeout protection." This catches files where
`hookTimeout` doesn't appear textually at all. But two files had
hookTimeout protection via the **inline second-arg form**:

```ts
beforeEach(async () => { /* ... */ }, 30000);
```

This form sets a 30s timeout for the hook but never writes the
literal token `hookTimeout`. The Stage 2 grep missed it; the
files were flagged as Stage 3 work; on closer inspection they
already had protection. **2 false positives in 6 flagged files**
— 33% false-positive rate.

Lesson #10198 codifies this: audit-method grep must cross-check
syntactic forms. Method correction: pair `grep -L hookTimeout`
with `grep '}, \d{4,6}\);'` adjacency check.

### Mid-flight token-ceiling hit on W1C audit agent

The W1C flake-audit sub-agent terminated near the 60-70 tool-use
ceiling during a mid-Stage-3 self-correction step. Team-lead
picked up the working-tree changes and completed the closure.
**No work was lost** (the partial commits had landed), but the
recovery required team-lead attention that a pre-planned commit
boundary would have absorbed.

Lesson #10200 generalizes this: sub-agent dispatches that include
self-correction stages should pre-plan ≥2 commit boundaries
inside the dispatch, not just at start/end.

### Scope-creep risk on multi-attempt components

C4 v1 → v2 → partial-merge consumed roughly 3x the W0-estimated
component cost. The decision to re-attempt (v2) after v1 failure
was correct in retrospect (it enumerated the runtime-substrate
divergence), but the decision was made under operator
authorization without an explicit "re-attempt budget."

Future component disposition decisions for re-attempts should
include an explicit budget ("v2 attempt has 90 minutes; if no
green CI by end-of-budget, defer with whatever substrate has been
enumerated"). This is captured in Lesson #10199 closing
observation.

## Operator W0 decision trail

For audit purposes, the three operator W0 decisions made via
team-lead AskUserQuestion relay:

### W0-Q1: C1 — atlas LRU isolation API shape

- **Question routed:** 2026-05-11 ~early-session
- **Options presented:** (a) per-project API method; (b) test rewrite
- **Recommendation:** (b)
- **Operator chose:** (a)
- **Routing rationale:** scoped-Tauri-commands roadmap for Cluster #6+

### W0-Q2: C2 — STORY-gate ordering disposition

- **Question routed:** 2026-05-11 ~early-session (immediately after W0-Q1)
- **Options presented:** (i) doc+invariant; (ii) refactor pre-tag-gate; (iii) procedural-only
- **Recommendation:** (i)
- **Operator chose:** (i) — recommendation honored
- **Routing rationale:** wants tracked discipline, not implicit ordering

### W0-Q3: C4 — self-mod-guard CI install gap disposition

- **Question routed:** 2026-05-11 ~W0a after substrate probe
- **Options presented:** (a) CI install step; (b) test exemption
- **Recommendation:** (a) — exemption would mask real defect
- **Operator chose:** (a)
- **Routing rationale:** authorize CI install attempt; if it fails,
  re-route via team-lead relay
- **Outcome:** v1 failed → reverted; v2 partial-merged with skip-guard
  fix retained; component deferred to Cluster #6

### W0 routing observations

- All three decisions routed via team-lead AskUserQuestion (per v1.49.637 lab-director G3 authority-boundary protocol)
- Two operator choices honored team-lead recommendation (C2, C4)
- One operator choice overrode recommendation (C1) for operator-private roadmap context
- No mid-W1 re-routing was needed; W0 decisions held through W3

## Cluster-chain shape going forward

| Cluster | Status | Outcome | CFs to next |
|---|---|---|---|
| #1 (v1.49.585) | closed | Concerns cleanup baseline | 0 |
| #2 (v1.49.634) | closed | Concerns cleanup #2 | 0 |
| #3 (v1.49.635) | closed | Housekeeping | 1 (absorbed by #3-followup) |
| #3-followup (v1.49.636) | closed | Housekeeping absorb | 6 named CFs to #4 |
| #4 (v1.49.637) | closed | Keystore + audit-tool catalog | 1 named CF (atlas LRU) to #5 |
| **#5 (v1.49.638)** | **closing** | **5 components + 1 deferred** | **6 CFs to #6** (see chapter 05) |
| #6 | upcoming | Self-mod-guard CI divergence target | TBD |

The chain has not contracted (still 5 explicit clusters), but the
**character of carry-forwards has changed**. v1.49.634 → v1.49.636
carry-forwards were mostly named work-items (specific test fixes,
specific feature retirements). v1.49.638 → v1.49.639 carry-
forwards include **diagnostic targets** (CF-1 + CF-2), **meta-
lesson candidates** (CF-3), and **method corrections** (CF-4).
This is healthy: the chain is now generating discipline-level
substrate, not just code-level substrate.
