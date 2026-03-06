# Design Principles in Practice

**Architecture Guide #3**
*Written by Lex and Hemlock — for developers who want to understand the "why" before the "what"*

---

## About This Guide

This guide connects the 5 core design principles from `CENTERCAMP-PERSONAL-JOURNAL` to the actual code where you can see them operating. Each principle is:

1. **Stated** — what it is
2. **Illustrated** — where to find it in the code
3. **Tested** — which test verifies it holds
4. **Explained** — why this principle over the alternatives

---

## Principle 1: Separation of Concerns Over Shared Optimization

*CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 1*

**What it means:** Each module answers exactly one question. When two modules could share code or state to reduce duplication, we prefer to keep them separate — because the coupling cost is higher than the sharing benefit.

**Where it lives in code:**

The defining case is the Two Listeners architecture:

```typescript
// Both on the same bus — but they never interact.
// FeedbackBridge asks: "Did it work?"
// SequenceRecorder asks: "What did it do?"
// Different questions. Different storage. Both correct simultaneously.
//
// From: src/platform/observation/feedback-bridge.ts
// @see CENTERCAMP-PERSONAL-JOURNAL.md — "The Story of the Two Listeners"

class FeedbackBridge {
  start(): void {
    this.listener = (signal) => {
      this.storeFeedback(signal).catch(/* ... */);
    };
    this.bus.on('completion', this.listener); // Only cares about bus
  }
}

// From: src/platform/observation/sequence-recorder.ts
class SequenceRecorder {
  start(): void {
    this.listener = (signal) => {
      this.recordSignal(signal).catch(/* ... */);
    };
    this.bus.on('completion', this.listener); // Shares bus, not state
  }
}
```

**The test that verifies it:**

```typescript
// From: src/__tests__/separation-of-concerns.test.ts
it('two listeners on same bus write to separate categories without interference', async () => {
  bridge.start();
  recorder.start();
  bus.emit(signal);
  // feedback.length === 1 AND workflows.length === 1
  // No cross-contamination
  expect(feedbackData).not.toHaveProperty('operationType');  // workflow field
  expect(workflowData).not.toHaveProperty('stdoutHash');     // feedback field
});
```

**Why this principle over the alternative:**

The alternative would have been: one listener that captures both feedback AND workflow data in one write. This would be more efficient (one write instead of two). It would also mean:

- If the feedback schema changes, workflow analysis breaks
- If the workflow classifier changes, feedback drift detection breaks
- If you want to replay one category, you can't without the other
- Testing one requires instantiating both

Separation of concerns costs one extra write per signal. It buys complete independence between two different analytical purposes.

**Lex's clarity test:** "Can I read this module and understand it without reading another module?" If yes: separation is real. If no: coupling exists.

---

## Principle 2: Honest Uncertainty Over Confident Wrongness

*CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 2*

**What it means:** When the system doesn't know something, it says so. Explicitly. With a number. Low confidence is a signal, not a failure state to hide.

**Where it lives in code:**

```typescript
// From: src/platform/observation/sequence-recorder.ts
// The classify() honesty default:
// "This default is not a failure — it's an admission of ignorance."
const CLASSIFY_PATTERNS: [RegExp, OperationType, number][] = [
  [/scout|recon/i, 'SCOUT', 0.9],
  [/validate|verify|test/i, 'VALIDATE', 0.9],
  // ... 6 more patterns ...
];

classify(signal): { type: OperationType; confidence: number } {
  for (const [pattern, opType, confidence] of CLASSIFY_PATTERNS) {
    if (pattern.test(id)) return { type: opType, confidence };
  }
  // No match: honest default. "BUILD at 0.3" = "I don't know."
  return { type: 'BUILD', confidence: 0.3 };
}
```

The 0.3 confidence propagates:

```typescript
// From: src/platform/observation/sequence-recorder.ts
// predictRisks() uses classification confidence to identify unclear failures
predictRisks(source, target, signal): FailureRisk[] {
  const risks: FailureRisk[] = [];
  // ... distance-based risks ...
  if (signal.status === 'failure' && this.classify(signal).confidence < 0.5) {
    risks.push('unclear-requirements');  // Low confidence + failure = unclear
  }
  return risks;
}
```

**The test that verifies it:**

```typescript
// From: src/__tests__/honest-uncertainty.test.ts
it('low-confidence failure propagates to unclear-requirements risk', async () => {
  bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:xyzzy-unknown-op' })));
  // 'xyzzy-unknown-op' → confidence 0.3 → failure → unclear-requirements
  expect(risks).toContain('unclear-requirements');
});

it('high-confidence failure does NOT trigger unclear-requirements', async () => {
  bus.emit(createCompletionSignal(makeResult({ operationId: 'hemlock:validate-gates' })));
  // 'validate' → confidence 0.9 → failure → NOT unclear-requirements
  expect(risks).not.toContain('unclear-requirements');
});
```

**The known quirk as an illustration:**

The classifier has a documented bug: `"sign"` inside `"design"` matches CERTIFY before DESIGN. We don't hide this. We document it in three places:
- `sequence-recorder.ts` inline comment
- `e2e-mini-batch.test.ts` (tested as known behavior)
- `src/__tests__/honest-uncertainty.test.ts` (documented and tested)

```typescript
it('classifier quirk is documented and testable: "sign" matches before "design"', () => {
  // This test exists to document a known uncertainty.
  const result = recorder.classify(makeResult({ operationId: 'foxy:design-layout' }));
  expect(result.type).toBe('CERTIFY');  // Known quirk — "sign" in "design"
  // The fix is word boundary: \bsign\b
});
```

**Why this principle over the alternative:**

Hiding uncertainty behind false confidence feels safer in the short term. A system that always returns 0.8+ confidence looks competent. But:

- When a 0.8-confidence classification is wrong, downstream systems have no signal to reduce trust
- When a 0.3-confidence record fails, we know exactly where to investigate
- Operators can set confidence thresholds and filter out low-confidence operations
- Debugging is easier when uncertainty is explicit

Hemlock's principle: "It is better to spend an hour validating the foundation than weeks fixing the collapse." Honest uncertainty surfaces problems before they become collapses.

---

## Principle 3: Making Patterns Visible Over Inferring Them

*CENTERCAMP-PERSONAL-JOURNAL, Philosophy 3: Making Patterns Visible*

**What it means:** We observe and count. We do not hypothesize and predict. The Creator's Arc (`ANALYZE→BUILD`) was not pre-specified — it emerged from counting bigrams in recorded operation sequences.

**Where it lives in code:**

```typescript
// From: src/platform/observation/pattern-analyzer.ts
// "The pattern was already in the data. PatternAnalyzer just made it visible."
// — CENTERCAMP-PERSONAL-JOURNAL, "The Story of Creator's Arc"

async detectPatterns(minCount = 2): Promise<DetectedPattern[]> {
  const records = await this.getRecords();
  // Group by sequenceId, sort by step, extract bigrams and trigrams
  // Count occurrences of each n-gram key (e.g., "ANALYZE->BUILD")
  // Filter: must appear at least minCount times to be reported
  // Sort: most frequent patterns first
}
```

The visibility extends to export:

```typescript
// From: src/platform/observation/sequence-recorder.ts
// CSV export was the "most revealing moment" of Batch 3:
// "The Creator's Arc pattern appeared directly in the exported data without
//  any inference — just making the data visible." (Willow's debrief)

static async exportCsv(store: PatternStore): Promise<string> {
  const records = await store.read('workflows');
  const header = 'sequenceId,step,operationType,agent,...\n';
  // Every field in every record, human-readable, importable
}
```

**The test that verifies it:**

```typescript
// From: src/__tests__/pattern-visibility.test.ts
it("Creator's Arc (ANALYZE→BUILD) becomes visible after two arcs complete", async () => {
  // Write two arcs: lex does ANALYZE→BUILD, hemlock does ANALYZE→BUILD
  // detectPatterns(2) should find ANALYZE→BUILD with count >= 2
  // No inference. The data shows it.
  expect(analyzeToBuilds[0].count).toBeGreaterThanOrEqual(2);
});

it('patterns below minCount threshold are NOT visible (no false patterns)', async () => {
  // A single arc cannot produce a pattern.
  // The visibility is bounded by evidence — not wishful seeing.
  expect(designToBuilds.length).toBe(0);
});
```

**The ClusterTranslator as a visibility layer:**

```typescript
// From: src/platform/observation/cluster-translator.ts
// Three disclosure levels make the same information visible to different audiences.
// The data doesn't change — only the presentation does.

const advice = translateTransition(record);
formatAdvice(advice[0], 'L0');  // "This is a big shift in work style."
formatAdvice(advice[0], 'L1');  // "Creative Nexus → Rigor Spine (precise work). Action: mediate."
formatAdvice(advice[0], 'L2');  // "CRITICAL: Creative Nexus -> Rigor Spine | d=0.972 | risk=communication-failure"
```

**Why this principle over the alternative:**

Inference (ML models, predictive analytics) is powerful but opaque. A model might tell you "this agent has a 73% probability of success on this task type" — but it can't explain how it knows that. When it's wrong, you can't trace why.

Pattern visibility gives you: "ANALYZE→BUILD appeared 8 times in 105 recorded operations, mostly by lex-cluster agents, with mean transition distance 0.0." That's checkable. That's auditable. That's what makes the feedback loop trustworthy.

Willow: "Don't ask permission to build bridges. Just build them." Visibility is that bridge — between raw data and understanding, without the gatekeeping of inference.

---

## Principle 4: Sustainable Pace

*Sam's role: "The team moved together throughout. No burnout at 97.3% pace."*

**What it means:** Systems don't collapse; they degrade gradually. Sustainable pace means: no infinite loops, no unbounded growth, no missing cleanup. The system stays healthy under repeated use.

**Where it lives in code:**

```typescript
// From: src/platform/observation/retention-manager.ts
// "Good storage design is boring. Boring is reliable."
// (CENTERCAMP-PERSONAL-JOURNAL, "Technical Wisdom Gained")
//
// Two pruning criteria, applied in order:
//   1. Age: remove entries older than maxAgeDays (default 90)
//   2. Count: keep only newest maxEntries (default 1000)
//
// This ensures files don't grow without bound over years of use.

async prune(filePath: string): Promise<number> {
  // Age filter first, then count filter on survivors
  // Atomic write (temp file → rename) to prevent corruption during pruning
}
```

```typescript
// From: src/platform/observation/rate-limiter.ts
// Per-session cap prevents one session from flooding storage
// Per-hour cap prevents a burst of short sessions from flooding storage
// Rejected writes include explicit reason strings — not silent drops

class ObservationRateLimiter {
  checkLimit(sessionId: string): RateLimitResult {
    if (this.sessionCounts.get(sessionId) >= this.config.maxPerSession) {
      return { allowed: false, reason: `Session ${sessionId} exceeded per-session limit` };
    }
    // ...
  }
}
```

**Idempotent lifecycle:**

```typescript
// From: src/platform/observation/feedback-bridge.ts, sequence-recorder.ts
// start() and stop() are idempotent — safe to call multiple times
// No dangling listeners, no double-registration, no resource leaks

start(): void {
  if (this.listener) return;  // Already started — no-op
  this.listener = (signal) => { /* ... */ };
  this.bus.on('completion', this.listener);
}

stop(): void {
  if (!this.listener) return;  // Already stopped — no-op
  this.bus.off('completion', this.listener);
  this.listener = null;
}
```

**The test that verifies it:**

```typescript
// From: src/__tests__/sustainable-pace.test.ts
it('stop() prevents further records after shutdown', async () => {
  recorder.start();
  bus.emit(signal);
  await wait(50);
  recorder.stop();
  bus.emit(anotherSignal);  // After stop
  await wait(50);
  expect(records.length).toBe(1);  // Only the pre-stop signal
});

it('high signal volume processes all records without dropping', async () => {
  // 50 signals → 50 records. No drops under load.
  const count = 50;
  for (let i = 0; i < count; i++) bus.emit(signal);
  await wait(200);
  expect(records.length).toBe(count);
});
```

**Why this principle over the alternative:**

The alternative is: optimize for throughput without worrying about cleanup. This leads to memory that grows until the process restarts, files that grow until disk is full, listeners that accumulate until event emission is slow.

Sustainable pace is not about being slow — the test shows 50 signals processed without drops. It's about being bounded. Sam's 97.3% pace benchmark from Batch 3 means: the system can work hard AND stay healthy. Those are not opposites.

---

## Principle 5: Measuring What Matters, Not What's Easy

*CENTERCAMP-PERSONAL-JOURNAL, "Philosophy 5: Measuring What Matters"*

**What it means:** The system measures learning, not just activity. Compression ratios, not just step counts. Pattern confidence, not just pattern existence.

**Where it lives in code:**

```typescript
// From: src/platform/observation/sequence-recorder.ts
// Compression tracking: the core learning measurement.
//
// computeCompression() compares current arc step count to baseline.
// First run: no note (no baseline yet — Honest Uncertainty meets Learning Measurement)
// Second run: "step 6/8 (ratio: 0.75)" — learning is visible
// Third run: "step 5/8 (ratio: 0.625)" — continued learning is visible
//
// "Ratio < 1.0 = the agent is learning. This is the signature of skill acquisition."
// — CENTERCAMP-PERSONAL-JOURNAL, "The Story of Compression Tracking"

private computeCompression(sequenceId: string, agent: string, currentStep: number): string | undefined {
  const history = this.arcHistory.get(agent);
  if (!history || history.length === 0) return undefined;  // No baseline yet
  const baseline = history[0];
  const ratio = currentStep / baseline;
  return `step ${currentStep}/${baseline} (ratio: ${ratio.toFixed(2)})`;
}
```

**The PromotionEvaluator's 5-factor scoring:**

```typescript
// From: src/platform/observation/promotion-evaluator.ts
// Session quality is scored on 5 dimensions with specific weights:
//
//   tool calls    0.30  — high tool use = productive session
//   duration      0.20  — time investment
//   file activity 0.20  — meaningful file changes
//   engagement    0.15  — mixed activity types
//   rich metadata 0.15  — complete and well-formed records
//
// These weights reflect what actually predicts session value,
// not what's easiest to measure.
// See: BATCH-3-RETROSPECTIVE.md, Phase 3a validation results
```

**The test that verifies it:**

```typescript
// From: src/__tests__/learning-measurement.test.ts
it('ratio correctly reflects fewer steps (learning signal)', async () => {
  // Arc 1: 6 steps → baseline = 6
  // Arc 2: 3 steps → ratio = 3/6 = 0.50
  expect(compressionNote).toMatch(/step 3\/6/);
  expect(compressionNote).toMatch(/ratio: 0\.50/);
});

it('ratio > 1.0 when more steps than baseline (possible regression)', async () => {
  // Arc 1: 2 steps → baseline = 2
  // Arc 2: 4 steps → ratio = 4/2 = 2.0 — regression detected
  expect(ratio).toBeGreaterThan(1.0);
});
```

**The measurement requires the data:**

```typescript
// From: src/__tests__/learning-measurement.test.ts
it('getRecords() count reflects total signals observed (measurement auditable)', async () => {
  // Measurement inputs must be complete and readable.
  // If records are lost, ratios are wrong.
  expect(allRecords.length).toBe(signalCount);  // Every signal → one record
});
```

**Why this principle over the alternative:**

The easy measurement is: "how many operations succeeded?" The hard measurement is: "is the agent completing the same kind of arc in fewer steps over time?"

The easy measurement is a lagging indicator — it tells you after the fact whether things worked. The hard measurement is a leading indicator — it tells you whether the system is improving before the results change.

Foxy: "The most rigorous thing is reality. If it works, it works." We measure what actually reflects reality — learning rate — not just what's easy to count.

---

## The Principles Together: A Coherent System

These 5 principles are not independent. They form a coherent philosophy:

1. **Separation of Concerns** ensures each module can be measured independently
2. **Honest Uncertainty** ensures measurements reflect reality, not wishful confidence
3. **Pattern Visibility** ensures measurements become actionable intelligence
4. **Sustainable Pace** ensures measurement doesn't degrade the system it's measuring
5. **Learning Measurement** ensures the measurements we take are the ones that matter

Together: a system that observes accurately (2), stores cleanly (4), analyzes visibly (3), operates independently (1), and measures what matters (5).

---

## How to Honor These Principles in New Code

When you add a new observation feature, ask:

1. **Separation:** "Does this module answer exactly one question? Does it write to exactly one storage category?"
2. **Honesty:** "When this module is uncertain, does it say so? Is uncertainty propagated correctly?"
3. **Visibility:** "Can the output of this module be read by a human without a special tool? Is it sorted by relevance?"
4. **Pace:** "Does this module clean up after itself? Is there a limit on how much it writes?"
5. **Measurement:** "Does this module measure what actually matters, or just what's easy?"

If you can answer all 5 questions positively, the new code honors the principles.

---

## The Tests as Specification

The 5 test suites in `src/__tests__/` are not just tests. They are executable specifications:

- `separation-of-concerns.test.ts` — defines what "separated" means
- `honest-uncertainty.test.ts` — defines what "honest" means
- `pattern-visibility.test.ts` — defines what "visible" means
- `sustainable-pace.test.ts` — defines what "sustainable" means
- `learning-measurement.test.ts` — defines what "learning" looks like

When a test in these suites fails, it means a principle has been violated. Fix the code, not the test.

---

*Lex note: "These principles were not invented before the code was written. They were discovered by building and reflecting on what worked. That's the honest version of how architectural wisdom accumulates."*

*Hemlock note: "Verified means tested. If a principle is not in a test, it's aspiration, not architecture."*

*Cedar note: "All connections documented. The principles connect to the code, the tests connect to the principles, and the guides connect to all of them. The mycelium is visible."*
