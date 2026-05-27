# v1.49.826 — Lessons

## New lesson candidates (0)

No new lesson candidates opened this ship. The 1 forensic finding (v823 handoff inaccuracy about Option A being "not yet shipped") is a documented closed case, not a forward observation.

## Forward-test of existing lessons

### #10426 — Cross-class registry extraction at the SECOND class instance

**Status:** REAFFIRMED at promotion-threshold-met. The onPredictions wire pattern is now at 2 instances (v810 copper + v826 selector). #10426 says codify at 2nd instance. This ship MEETS that threshold but does NOT codify (codification happens in a separate codify ship per the chain rhythm). The pattern is carry-forward-eligible for the next codify ship.

The pattern's structural shape:
1. `onPredictions?: (currentSkill, predictions) => void | Promise<void>` field on options/context type
2. Subscriber-gated invocation (no work when hook unset)
3. Fire-and-forget Promise with `.catch(() => {})` swallow
4. Inner call to `predictNextSkills(currentSkill, {})` (default-off flag = empty)
5. Hook receives `(currentSkill, predictions[])`

This shape is the candidate body for a future codify ship's promotion.

### #10433 — Internal-helper pattern for `ctx?` threading

**Status:** Not exercised in this ship (no chokepoint wiring; selector.ts is not a process spawn surface).

### #10434 — Ratchet-ledger pattern

**Status:** Not exercised in this ship.

### #10416 — Lightest wire

**Status:** REAFFIRMED. The lightest wire for "wire another caller of an existing pattern" is: import the substrate function, add the hook field, add the invocation loop, write 3 structural-coverage tests. ~30 LOC. v826 stayed within this minimum.

### #10427 — Failure-mode contracts (load-bearing vs accessory)

**Status:** PATTERN-COMPLIANT. The onPredictions hook is ACCESSORY surface (observability-only). Errors are swallowed at the .catch(() => {}) — the test demonstrates this explicitly. Per #10427, accessory surfaces fail silently; this is intentional and correct.

## Tentative observations carried forward

### Eligible for next codify ship (2 instances or strong single)

| Observation | Instances | Notes |
|---|---|---|
| `onPredictions` substrate-consumer wire pattern | **2** (v810 + v826) | **NEW THIS SHIP** — promotion threshold met per #10426. Candidate name: "Subscriber-gated observation hook pattern." |
| Cross-rootdir wire pattern | 1 strong (v823) | Waits for 2nd instance per #10426. |
| Codification-ship pattern | 5+ instances | Meta-pattern; implicit in #10428 meta-cadence. Defer. |
| Chokepoint pattern | 4+ instances | Already covered by #10414 + #10426 + Security chokepoints discipline. Defer. |

### Below 2-instance threshold (~9-11 individual observations from v824-826 chain)

- v824 retrospective: extension-over-creation manifest growth (1 instance)
- v824 retrospective: codify-ship structure stabilized at 3 ships (3 instances — but observation is about the ship-structure, not the lesson; defer)
- v825 retrospective: 3-file batch wall-clock ≈ 1-file ship (1 instance; defer until 2nd batch)
- v825 retrospective: LOC-band-by-callsite-count refinement for #10433 (1 instance)
- v826 retrospective: PipelineActivationDispatch zero-production-callers (1 instance — interesting but not yet a pattern)
- v826 retrospective: 2nd-instance wire-pattern application is ~33% faster than 1st-instance (1 instance)

## Pattern observations on the chain

This chain demonstrated the **codify → forward-test → re-codify rhythm**:

1. **v824 codifies** #10433 (internal-helper pattern) and #10434 (ratchet-ledger generalization).
2. **v825 forward-tests #10433** at family-batch scale. Prediction band (14-20 LOC per file) holds within ~10%.
3. **v826 brings a NEW pattern (onPredictions) to its 2nd instance**, meeting #10426 codification threshold for the NEXT codify ship.

This is the flywheel: codification produces actionable predictions; forward tests validate or refine them; new patterns reach threshold and become candidates for the next codify ship. The cadence rule (~7-10 ships per codify cadence per #10428) gives the flywheel a natural rhythm.

## Cadence observation

This ship is consume-axis (a new wire application, not a new pattern). Per #10428, the chain's axis distribution was:
- 1 calibrate-axis ship (v824 codify)
- 2 consume-axis ships (v825 chips + v826 wire)

No counter-cadence ticks; no NASA forward-cadence. 44 consecutive ships at NASA degree 1.178 — most visible open item by an even wider margin after this chain.
