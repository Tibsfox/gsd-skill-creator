# 04 — Lessons: v1.49.643 Housekeeping Cluster #10

## Summary

**1 forward lesson emitted** (#10207) + **1 discipline promotion** (§1.4 → load-bearing).

## Lesson #10207 — §1.4 re-framing review consistency at 4+ cluster threshold

### Statement

When Lesson #10199 §1.4 re-framing review is applied to a CF that has carried through 4 or more predecessor clusters without closure, the review surfaces a framing-error verdict with high reliability. Two consecutive applications (CF-11 at v1.49.641; CF-15 at v1.49.643) both produced retire verdicts via framing-error findings.

The pattern: multi-cluster CF carries persist BECAUSE the original framing was wrong. The framing error compounds over clusters — each cluster inherits the predecessor's assumptions. §1.4 surfaces the error by asking "could the framing be wrong?" with structured alternatives (precondition vs behavior, environmental vs code-substrate, shape vs root mechanism, etc.).

### Source incident

v1.49.641 + v1.49.643 §1.4 applications:

**CF-11 (v1.49.641):**
- Original framing: "7 unfit chipsets need migration to cartridge.yaml format"
- §1.4 finding: shape-category framing wrong; root mechanism was "no enforcement requires migration"
- Verdict: RETIRE

**CF-15 (v1.49.643):**
- Original framing: "Forward-cadence engine resumption — operational debt"
- §1.4 finding: shape-vs-mechanism framing wrong; actual mechanism was "operator-driven standing option; engine stable"
- Verdict: RETIRE

Both cases hit the same pattern: a CF that LOOKS like operational debt at the shape level is actually NOT debt at the root-mechanism level. The carry-forward stream had been tracking "options" or "documentation" as "debt".

### Mitigation

The discipline is already codified at `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.4. The forward improvement is **promotion from "trigger at 4+ clusters" to "load-bearing"**:

- Before: §1.4 was a recommended W0 step at the threshold
- After: §1.4 is a MANDATORY W0 step at the threshold; failing to apply it is a discipline violation

The Track Record note added at v1.49.643 ships this promotion.

### Forward applicability

Future CFs reaching 4+ cluster carries:
- §1.4 review is now MANDATORY (per Track Record note)
- Strong prior on retire verdict (2/2 historical applications)
- If §1.4 produces a non-retire verdict (continue, re-scope), it's evidence the framing IS actually right and the CF is legitimately persistent — that's signal worth documenting

The 2/2 retire rate may or may not continue. Future §1.4 applications will refine the prior.

### Apply-to-self check

This lesson's emission IS validated by the cluster that emitted it: v1.49.643 applied §1.4 to CF-15, got the predicted retire verdict, produced the Track Record promotion. The lesson cycle is self-consistent.

## Lesson #10199 — Final maturation note

Lesson #10199 has now completed its 5-transition automation arc AND demonstrated the §1.4 retire pattern across 2 applications. The full state:

| Transition | Status |
|---|---|
| 1. Source incident (v1.49.634-638 chain) | LOGGED |
| 2. Lesson at retro (v1.49.639) | EMITTED |
| 3. Discipline doc (v1.49.640 C2) | CODIFIED |
| 4. Executable tool (v1.49.641 C2) | CODIFIED |
| 5. Per-CF spec auto-dispatch (v1.49.642 C1) | CODIFIED |
| 6. §1.4 retire pattern validated (v1.49.643 C1) | LOAD-BEARING |

The 6th transition (load-bearing promotion via track record) wasn't planned at Lesson emission time — it emerged from the discipline's actual application. This generalizes the discipline-as-code lifecycle template (per Lesson #10205): some disciplines benefit from a post-codification "validation" stage where empirical track-record promotes them from optional to load-bearing.

## Carry-forward bankruptcy: a meta-lesson candidate?

Not promoted to a numbered lesson, but worth noting as an observation:

**The carry-forward channel can be DRAINED to zero.** The chain doesn't have to grow indefinitely. Operational debt that surfaces gets either closed via active work OR retired via framing review. Either path is valid. The bankruptcy milestone demonstrates that channel drainage is achievable; future clusters' debt can be managed with the expectation that it eventually closes.

This isn't a new discipline — it's a confidence anchor. Future clusters that worry "are we just accumulating CFs forever?" can cite v1.49.643 bankruptcy as evidence the answer is no.

## Cumulative lesson count

| Range | Description | Count |
|---|---|---|
| #10180 | Meta-Lesson — fragile-test discipline | 1 |
| #10181-10186 | v1.49.636 cluster | 6 |
| #10187-10192 | v1.49.637 cluster | 6 |
| #10193-10198 | v1.49.638 cluster | 6 |
| #10199-10202 | v1.49.639 cluster | 4 |
| #10203-10204 | v1.49.640 cluster | 2 |
| #10205 | v1.49.641 cluster | 1 |
| #10206 | v1.49.642 cluster | 1 |
| #10207 | **v1.49.643 cluster (this milestone)** | 1 |
| Total | | 28 |

## See also

- `01-overview.md` §§1.4 review outcome — full review structure
- `02-walkthrough.md` §C0/C1 — composition of §1.3 mechanical probe + §1.4 framing review
- `03-retrospective.md` §What worked — 2/2 §1.4 success rate
- `05-carry-forward.md` — empty (bankruptcy)
- `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.4 (Track Record note)
- `.planning/c0-cf11-reframing-review.md` — first §1.4 application
- `.planning/c0-cf15-reframing-review.md` — second §1.4 application
