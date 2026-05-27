# v1.49.837 — Lessons

## New lesson candidate (1 instance at v837 close)

### Polarity convention for calibratable thresholds in different mechanic classes (1 instance)

**Status:** 1 instance at v837 close. The polarity flip between v803 (`token_budget.warn_at_percent`) and v837 (`predictive.low_confidence_threshold`) is the first concrete example of two sibling thresholds in the bounded-learning framework having **inverted underlying mechanics**, requiring inverted `eventKindToValue` polarity.

**Provisional scope:**

Two calibratable thresholds can share the calibration math but have inverted threshold mechanics. The polarity convention (which event kind maps to `+1` vs `-1`) must align with the threshold's mechanic, not with naming convention or sibling-threshold copy-paste.

**The two cases at v837:**

| Threshold | Raising threshold means | Operator "positive" outcome | Value mapping |
|---|---|---|---|
| `token_budget.warn_at_percent` (v803) | Warn fires LESS often | `responsive` (warn was useful) | `responsive → +1` (favor decrease) |
| `predictive.low_confidence_threshold` (v837) | Fallback fires MORE often | `useful` (fallback was useful) | `useful → -1` (favor increase) |

**The calibration math is symmetric:** positive value → posResult e-process rejects → `direction: 'decrease'`. Negative value → negResult rejects → `direction: 'increase'`. So if you want "useful → favor RAISE", the value must be NEGATIVE.

**Provisional pattern:**

1. For a new calibratable threshold, identify the threshold's mechanic: does raising the threshold make the underlying event fire MORE or LESS often?
2. Identify the "positive" operator outcome (the kind of event that means the threshold is appropriately calibrated or could be MORE aggressive).
3. Map the "positive" outcome to the value that triggers the FAVORED direction:
   - If "positive" should INCREASE the threshold → value = `-1`.
   - If "positive" should DECREASE the threshold → value = `+1`.
4. Document the polarity in the new module's `eventKindToValue` JSDoc + the test names.

**Anti-pattern (the trap):** copy-paste `eventKindToValue` from a sibling threshold and forget to check the polarity. The test will pass (it just checks the value the function returns), but calibration recommendations will go the WRONG direction in production.

**Evidence anchor:** v837 wires `predictive.low_confidence_threshold` with inverted polarity relative to v803's `token_budget.warn_at_percent`. The polarity decision was made consciously and documented; this lesson captures the discipline for future calibrate-axis ships.

**Candidate-for-2nd-instance triggers:** any future calibratable threshold whose mechanic is inverted relative to an existing wired threshold class. Possible candidates: `observation.retention_days` (unwired) — if wired, would need polarity analysis; `token_budget.max_percent` (unwired) — same.

## Forward-test of existing lessons

### #10425 — Bounded-learning calibration discipline

**Status:** RESPECTED + EXTENDED. v837 adds the 5th wired observation source, following the v798-era per-class registry pattern (#10426 second-instance abstraction). The polarity-flip-as-deliberate-design observation is a refinement within this discipline's scope.

### #10426 — Architecture-retrofit patterns (extract at second instance)

**Status:** RESPECTED. The CLI dispatch refactor (`runRecordEvent` → branches on threshold) is the 2nd instance of `--record-event` handling a non-token-budget threshold. The branch-on-threshold pattern was extracted from the previously hard-coded token-budget branch, not added prematurely. v803 had ONE class; v837 has TWO. The dispatch refactor lands at the second instance.

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The new module follows v803's contract exactly: `appendPredictiveLowConfidenceEvent` is best-effort silent at the caller boundary (CLI wraps in try/catch + swallows); `readPredictiveLowConfidenceEvents` is tolerant of malformed lines. Both contracts documented in the module JSDoc.

### #10422 — Ledger-driven work

**Status:** RESPECTED. Per-file recon preceded code:
1. Read v835 scaffold state (`observation-sources.ts` lines 104-113).
2. Read v803 precedent (`token-budget-events.ts` + v803 README + v803 tests).
3. Trace calibration math for polarity decision (`calibration-loop.ts` lines 105-150).
4. Identify production-caller gap (`grep -rn "new ActivationSelector\|new Activation"` returns 0 production callers).
5. Plan minimal changes: 1 new module, 1 dispatch case in observation-sources.ts, 1 SUPPORTED_THRESHOLDS entry, 1 CLI branch.

### #10416 — Lightest wire

**Status:** RESPECTED. CLI extension is dispatch-by-threshold + a new branch function (parallel structure to the existing token-budget branch); no refactor of the existing v803 code path. The dispatch addition is 4 LOC; the new branch function is ~70 LOC; together ~75 LOC of new CLI code (excluding the new module + tests).

### #10434 — Cross-cutting observability+enforcement surface

**Status:** NOT APPLICABLE this ship (no allowlist/ledger surface introduced; the CLI extension is per-call dispatch, not enumerated).

## Status of v836 lesson candidates

- **Two-layer closure generalization (#10431 sub-pattern)** (2 instances at v836 close): STILL 2 instances. v837 didn't add a 3rd instance.
- **Auto-run-on-import as a hidden bootstrap-time tax** (1 instance at v836 close): STILL 1 instance. v837 didn't introduce new modules with auto-run main().

## Status of v834-835 lesson candidates

- **Stale-entry cleanup chip pattern** (1 instance: v834): UNCHANGED at 1 instance.
- **Scaffold ship pattern** (1 instance: v835): UNCHANGED. v837 closes the scaffold; doesn't add a new scaffold.
- **Paired "framework-predicted, recon-caught" ship arc** (1 arc: v834+v835): UNCHANGED at 1 arc. v836 + v837 are both predicted in the v834-835 handoff, but they're sequential not paired-in-a-session.
- **Type-registered vs observation-source-wired vs runtime-wired (3 distinct surfaces)** (1 forward-flag): v837 demonstrates the distinction in practice. SUPPORTED_THRESHOLDS = 5, observation-source-wired = 5, type-registered = 7. The framing is now operationally clear. Worth a 2nd instance trigger if a future ship advances one surface without the others again.

## Codify ship eligibility at v837 close

| Observation | Instances | Codify-eligible? |
|---|---|---|
| Two-layer closure generalization (#10431 sub-pattern) | 2 (v813 + v836) | YES |
| Substrate-consumer hook PAIR pattern | 2 (v830 + v832) | YES |
| `onPredictions` substrate-consumer wire | 2 (v810 + v826) | YES |
| #10433 LOC-band-by-callsite-count refinement | 3 (v825 + v827 + v828) | YES |
| Verification/integration-only ships | 2 (v829 + v832) | YES |

**5 eligible patterns** for the next codify ship (likely v840+). Same as v836 close. Codify cadence: 4 ships past last codify (v833) — within the 7-10 ship floor.
