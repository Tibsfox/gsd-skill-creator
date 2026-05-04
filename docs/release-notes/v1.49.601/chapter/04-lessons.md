# v1.49.601 — Forward Lessons Emitted

## #10244 candidate — Counter-cadence-on-post-ship-discovery pattern

**Title:** When post-ship operator discovery surfaces a silent-drift class of failure that no existing gate catches, ship a focused counter-cadence milestone rather than fix-and-continue.

**Status:** CANDIDATE; ratification at v602+.

**Pattern:**
1. Operator browses live site post-ship; spots drift no gate caught.
2. Diagnosis surfaces the class of failure (not just the instance).
3. Prevention spec proposed: tool + gate integration + retroactive backfill.
4. Operator authorizes prevention.
5. Counter-cadence milestone opens; tool + gate + retroactive ship in one envelope.
6. Pre-tag-gate gains a step; the next ship validates the gate against a real engine-state milestone.

**Anti-pattern (what NOT to do):**
- Fix the drift inline + continue with next NASA-degree milestone. The gate addition gets stashed; future drift accumulates again.
- Open a "tooling backlog" issue and defer indefinitely. Loses the operator-discovery context that informed the spec.
- Ship the gate without exercising it. v601 exercised the new gate by running it as part of v601's own pre-tag-gate (step 8 PASS at G3) — the gate validates itself in the same ship that creates it.

**Why this is worth a forward-lesson:**
- Operational debt counter-cadence ships are how the gate count grows over time (4 → 5 → 6 → 7 → 8 in 16 milestones since v1.49.585; **the gate count grows at every counter-cadence ship**).
- Without the pattern, prose discipline accumulates silently; counter-cadence ships are the deterministic-gate accumulator.
- v1.49.585 + v1.49.601 are the two instances; ratification at v602+ requires one more counter-cadence to confirm the pattern.

**Forward action:**
- Soak through v602+. Watch for the next post-ship operator discovery → counter-cadence ship sequence.
- ESTABLISHED at 3rd instance.

## Carry-forward unchanged from v600

### #10243 (carryforward) — W2 build-agent prompt-template patch

**Status:** carries forward from v600 close. NOT addressed at v601 (out of scope — v601 was catalog-index work). Apply at v602+ next NASA-degree milestone before W2 dispatch.

### #10238 (carryforward) — depth-audit gold-standard-comparison extension

**Status:** still DEFERRED to v601+. v601 was an operational-debt ship, not a depth-audit refinement. Continue defer to v603+ per v600 G2 decision.

### #10240 (carryforward) — depth-audit gate refinement to honor #10231 ESTABLISHED

**Status:** still DEFERRED to v601+. Re-evaluate at v603 per v600 G2 decision.

### 5 §6.6 watchlist candidates carry forward unchanged

LAUNCH-VEHICLE-FAILURE · NWO · DUST-STORM-WAITING-PROTOCOL · PAIRED-REDUNDANT-PROGRAM-DESIGN · PFFA — none get 2nd-instance substrate at v601 because v601 has no engine-state advance.

## What does NOT change at v601

- §6.6 register stays at 23 LOCKED.
- No new ESTABLISHED promotions.
- No new soak observations recorded (v601 is not an engine-state milestone).
- No new TRS M1 Wave 2 packs bound (next pack binding waits for v602 W0).

The lessons-emitted file at v601 is intentionally short. Counter-cadence milestones produce few new lessons because they don't exercise engine-state substrate; they exercise operational-discipline substrate. The single new candidate #10244 is the pattern-level lesson, not a substrate-level lesson.
