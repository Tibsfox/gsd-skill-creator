# 05 — Carry-forward: v1.49.641 Housekeeping Cluster #8 → Cluster #9

This chapter inventories all carry-forwards from v1.49.641 to v1.49.642 (Cluster #9).

## Summary

**2 carry-forward items** routed from v1.49.641 to Cluster #9 (down from Cluster #8's 3):

| ID | Type | Source | Priority |
|---|---|---|---|
| CF-13 | Forward-cadence engine | Routes forward from CF-10 (v1.49.641 W0 deferred again) | LOW (decision-deferred) |
| CF-14 | Forward-improvement tooling | NEW — per-CF probe spec format mentioned in MISSION-PACKAGE-DISCIPLINE.md §1.7 | LOW (discretionary) |

The CF inventory shrinks: 3 → 2. CF-11 was retired via §1.4 re-framing review and is permanently eliminated from the carry-forward stream.

## CF-13: Forward-cadence engine resumption (continued-deferred)

**Type:** Engine forward-cadence routing decision (LOW priority, decision-deferred)

**Origin:** v1.49.641 W0 CF-10 routing decision was carried forward unchanged. Operator may decide to activate forward-cadence at any future cluster's W0.

**Decision-deferred:** v1.49.642 mission-package authoring time decides:

- **(a) Resume forward-cadence at v1.49.642** — STS-7 Sally Ride / Challenger NASA degree
- **(b) Continue counter-cadence** — Cluster #10 would be the 10th counter-cadence cleanup
- **(c) Hybrid** — small forward content alongside any operational debt cleanup

**Recommendation for Cluster #9:** depends on Cluster #9 carry-forward count. With only 2 CFs (and one being CF-13 itself), bandwidth for forward-cadence work is high. Option (a) becomes attractive if CF-14 closes cleanly.

**Apply-to-self check (Lesson #10199):** at Cluster #9 W0, no probe needed for CF-13 because it's a forward-cadence routing decision, not a failure-state CF. The decision is operator-driven.

**Expected Cluster #9 work:** 5-15 min routing decision; no implementation unless option (a) chosen.

## CF-14: Per-CF probe spec format (forward-improvement)

**Type:** Discretionary forward-improvement (LOW priority; not blocking)

**Origin:** v1.49.641 C2 surfaced this as a forward-improvement direction in `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.7:

> Forward improvement (out of scope; carry forward if useful): a probe-spec format (e.g., YAML at `.planning/cf-probes/<CF-id>.yaml`) so each CF carries its own probe spec rather than relying on the operator to know which probe type matches each CF.

**Implementation candidate** (~30-60min):

- Format: YAML at `.planning/cf-probes/<CF-id>.yaml` with fields:
  ```yaml
  cf_id: CF-N
  probe_type: npm-audit  # one of: npm-audit / file-snapshot / upstream-version / test-marker / hidden-transitive-guard
  probe_args:
    package: '<pkg>'  # for npm-audit; etc.
  routing_rules:
    resolved-upstream: retire
    still-real: proceed
  ```
- Tool extension: `node scripts/closure-verify-cf.mjs auto <CF-id>` reads `.planning/cf-probes/<CF-id>.yaml` and dispatches accordingly
- Existing CFs (CF-13) get probe specs as documentation

**Recommendation for Cluster #9:** discretionary. Scope into Cluster #9 IF other surface is small (Cluster #9 is shaping up to be a 2-CF cluster like #8 was). Could be a focused 1-component cluster targeting just CF-14.

**Apply-to-self check (Lesson #10199):** before authoring a Cluster #9 component spec for CF-14, run a probe: does the per-CF spec format still make sense? Have other tooling decisions evolved? §1.4 may not apply (CF-14 is brand new; not multi-cluster carried) but Lesson #10196 forward-note discipline does.

## Carry-forward priority routing

For Cluster #9 mission-package authoring:

- **PRIORITY 1 (decide):** CF-13 — forward-cadence engine resumption decision
- **PRIORITY 2 (discretionary):** CF-14 — per-CF probe spec format (only if Cluster #9 has bandwidth after CF-13 disposition)

## Closure-verification gate proposal for Cluster #9 W0

Per `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.3, Cluster #9 W0 SHOULD:

| CF | Probe | Pass-through outcome | Fail-through outcome |
|---|---|---|---|
| CF-13 | (no probe; operator AskUserQuestion at W0 close) | option (b) chosen → CF-13 carry continues | option (a) chosen → forward-cadence resume scope |
| CF-14 | manual review — does the per-CF probe spec format still make sense? Run `ls .planning/cf-probes/ 2>/dev/null` | empty/absent → still a forward-improvement candidate | populated → CF-14 partially closed |

**The new shortcut:** Cluster #9 authors can run `node scripts/closure-verify-cf.mjs file-snapshot CF-13-status .planning/cartridge-migration-phase2.md` (or similar) to use the tool that v1.49.641 codified.

## Forward-note RECOMMENDATION (per Lesson #10196)

**RECOMMENDATION:** v1.49.642 mission-package authoring should:

1. Decide CF-13 forward-cadence routing as the W0 entry decision
2. If CF-13 → option (a): mission scope expands to NASA degree authoring (STS-7); CF-14 may defer
3. If CF-13 → option (b): mission scope contracts to CF-14 only OR engine-state-stable cluster work
4. If CF-13 → option (c): hybrid scope per chosen pattern
5. Update `.planning/STATE.md` to reflect v1.49.641 ship + v1.49.642 open

**RE-EVALUATION CRITERION:** if Cluster #9 closes both CF-13 and CF-14, the carry-forward stream may reach zero or near-zero for the first time since v1.49.585. Worth flagging at Cluster #9 retro as a potential "carry-forward bankruptcy" milestone.

**DECISION-TREE CUMULATIVE STATE:** 9 consecutive counter-cadence cleanups in the chain. v1.49.641 demonstrated the §1.4 re-framing review's value (retired CF-11). v1.49.641 demonstrated discipline-as-code (CF-12 → script). The carry-forward stream is in good health — shrinking, validated by automation.
