# 03 — Retrospective: v1.49.642 Housekeeping Cluster #9

## What worked

### 1. Apply-to-self caught a real bug

The CF-14 self-referential probe spec (`.planning/cf-probes/cf-14.yaml`) was authored as documentation. Testing it surfaced a bug: probeAuto mapped exit codes 1:1 to outcomes, but file-snapshot has 3 statuses and always exits 0 in success paths. Caught and fixed in the same commit.

This is the closure-verification gate validating its own implementation. The §1.5 apply-to-self template (per `MISSION-PACKAGE-DISCIPLINE.md`) has produced a concrete cost-savings example.

### 2. Routing-rules-via-record-STATUS is more accurate than exit-code mapping

The fix: probeAuto reads the actual `**STATUS:** \`<status>\`` line from the record file the probe just wrote. This makes routing_rules dispatch accurate for any probe regardless of exit-code semantics.

The pattern generalizes: when a tool dispatches to a sub-tool and needs to interpret the outcome, read the sub-tool's structured output, not just its exit code. Exit codes are 1-bit; structured output is N-bit.

### 3. Cluster scope shrinkage

v1.49.642 is the smallest cluster: 1 CF closed, 1 deferred, 3 commits, ~1h wall-clock. The chain's CF inventory is shrinking:

| Cluster | Routed CFs |
|---|---|
| #6 (v1.49.639) | 6 |
| #7 (v1.49.640) | 3 |
| #8 (v1.49.641) | 3 |
| #9 (v1.49.642) | 2 |
| #10 (v1.49.643) | 1 (forecast) |

The carry-forward channel is approaching saturation. Future clusters may hit zero — "carry-forward bankruptcy" — which would be the first time since v1.49.585 (10 clusters back).

### 4. Routing-semantics inversion pattern documented

CF-13's spec demonstrates routing-rules inversion: file ABSENT = "resolved-upstream" in probe semantics but = "CF still pending" in CF semantics. CF-14's spec demonstrates another inversion: file PRESENT = "inconclusive" in probe semantics but = "feature exists, CF closed" in CF semantics.

Both inversions documented in the spec's `notes` field, in `MISSION-PACKAGE-DISCIPLINE.md` §1.7, and in the templates doc. Future operators authoring probe specs have prior art.

### 5. Lesson #10199 reached automation completion

5 abstraction transitions across 4 clusters:

1. Source incident (v1.49.634-638 framing-error chain)
2. Lesson at retro (v1.49.639)
3. Discipline doc (v1.49.640 C2)
4. Executable tool (v1.49.641 C2)
5. Per-CF spec auto-dispatch (v1.49.642 C1)

The discipline is now load-bearing automation. Future cluster authors don't think about "should I run the closure-verification gate?" — the gate runs by default per CF.

### 6. STORY-gate auto-fire continues working (5th consecutive ship pending)

If v1.49.642 ships cleanly: 5-ship consecutive validation of v1.49.638 C5 ordering fix. The discipline is robust.

## What burned cycles

### 1. The exit-code-to-outcome bug

Caught by self-test, fixed in-cluster (~5min). Not free, but the apply-to-self mechanism caught it BEFORE shipping to operators. Zero cost-of-shipping-bug.

### 2. Nothing significant else

The cluster was tight. No vitest cache invalidation surprises (no package-lock churn). No CI step 4 issues (we'll pre-push as a workflow default now). No phantom-dep surprises. No git-add-blocker compound-command false-positives.

## What forward improvements are surfaced

Discretionary, not blocking:

1. **Probe-spec validation tool** — `node scripts/closure-verify-cf.mjs validate .planning/cf-probes/<CF-id>.yaml` to lint a spec without running the probe. Useful for authoring without side effects.

2. **`auto --all` to dispatch all CF probes at once** — `node scripts/closure-verify-cf.mjs auto --all` could iterate over all specs in `.planning/cf-probes/` and run each. Useful for cluster W0 bulk verification.

3. **Probe-spec schema in JSON Schema or Zod** — formal validation instead of ad-hoc field checks. Forward-improvement candidate.

None of these block. Route them to Cluster #10+ if user wants them.

## Cumulative process-discipline status

Through 10 counter-cadence clusters (v1.49.585, .634, .635, .636, .637, .638, .639, .640, .641, **.642**):

- **All prior disciplines** applied consistently
- **Lesson #10199** — reached automation completion (5-transition lifecycle)
- **Lesson #10205** (discipline-as-code 3-cluster lifecycle) — Lesson #10199 extended it to 4-cluster automation arc
- **Apply-to-self** — caught a real bug in this cluster (the exit-code-to-outcome mismatch)
- **STORY-gate ordering** (Lesson #10197) — pending 5th consecutive ship validation
- **Counter-cadence pattern** — 10 cluster precedent; still producing clean ships

No discipline regressed this milestone. The cluster validates the closure-verification arc's maturity.

## Cluster #9 self-summary

Tightest cluster in the chain. Closes 1 CF with ~90 LOC + 5 tests + small doc edits. Demonstrates the apply-to-self mechanism catching real bugs. Extends Lesson #10199 automation arc to 5 transitions. CF inventory shrinks toward potential bankruptcy.

The cluster's most important contribution: validation that the discipline-as-code lifecycle has reached automation completion for Lesson #10199. Future lessons can use this as a 4-cluster automation-arc template.
