# The 5 Design Principles: From Theory to Code

*Written by Lex and Cedar — for developers who want to understand the philosophy before the mechanics*

---

## About This Guide

This system was not designed top-down. The 5 design principles were discovered bottom-up — by building something, observing what worked, and asking: "Why did that work?" The principles are the honest answer to that question.

This guide presents each principle in four parts:
1. **The principle itself** — what it means in plain language
2. **The code that embodies it** — where to find it and how it works
3. **The test that verifies it** — what would break if the principle were violated
4. **The muse voice** — the perspective that shaped how this principle was understood

The principles are not independent. They form a coherent system. At the end of this guide, you'll see how they fit together.

---

## Principle 1: Separation of Concerns Over Shared Optimization

*From `CENTERCAMP-PERSONAL-JOURNAL`, Part III, Philosophy 1*

### What It Means

Every module answers exactly one question. When two modules could share code or state to reduce duplication, prefer to keep them separate. The coupling cost is higher than the sharing benefit.

This sounds like standard software engineering advice. The specific form it takes here is: *the question a module asks determines what it stores, and two modules asking different questions must store in different places — even if they share the same infrastructure.*

### Where It Lives in Code

The defining case is the **Two Listeners** architecture:

```typescript
// Both listeners subscribe to the same SignalBus.
// But they ask completely different questions.
//
// FeedbackBridge asks: "Did this operation succeed?"
// SequenceRecorder asks: "What kind of operation was this?"
//
// Different questions → different storage categories.
// Same bus, zero shared state, zero interference.

// feedback-bridge.ts
class FeedbackBridge {
  start(): void {
    this.listener = (signal) => this.storeFeedback(signal);
    this.bus.on('completion', this.listener);
  }
}

// sequence-recorder.ts
class SequenceRecorder {
  start(): void {
    this.listener = (signal) => this.recordSignal(signal);
    this.bus.on('completion', this.listener);
  }
}
```

Neither listener needs to know the other exists. They both do their job, simultaneously, without coordination.

A second instance of this principle: `PatternStore` accepts a category key. The isolation boundary is the key. Two modules can share a `PatternStore` instance and write to completely different categories with no risk of interference:

```typescript
// Both write to the same PatternStore instance.
// The category key is the isolation boundary.
await store.append('feedback', feedbackRecord);    // FeedbackBridge
await store.append('workflows', workflowRecord);   // SequenceRecorder
```

### The Test That Verifies It

`src/__tests__/separation-of-concerns.test.ts` — specifically:

```typescript
it('two listeners write to separate categories without interference', async () => {
  bridge.start();
  recorder.start();
  bus.emit(signal);

  // Both listeners processed the same signal.
  // But their data is completely separate.
  // Feedback record has no workflow fields.
  // Workflow record has no feedback fields.
  expect(feedbackData).not.toHaveProperty('operationType');  // workflow field
  expect(workflowData).not.toHaveProperty('stdoutHash');     // feedback field
});
```

If Principle 1 were violated — if one listener started reading the other's storage — this test would break.

### Lex's Clarity Test

*"Can I read this module and understand it without reading another module? If yes: separation is real. If no: coupling exists."*

If you can't answer Lex's question with "yes," the separation isn't complete yet.

### The Alternative and Why We Rejected It

The alternative: one listener that captures both feedback AND workflow data in one write. More efficient (one write instead of two). But it means:
- If the feedback schema changes, workflow analysis breaks
- If the workflow classifier changes, feedback drift detection breaks
- If you want to replay one category, you can't without the other
- Testing one requires instantiating both

Separation of concerns costs one extra write per signal. It buys complete independence between two different analytical purposes.

---

## Principle 2: Honest Uncertainty Over Confident Wrongness

*From `CENTERCAMP-PERSONAL-JOURNAL`, Part III, Philosophy 2*

### What It Means

When the system doesn't know something, it says so. Explicitly. With a number. Low confidence is a signal, not a failure state to hide.

The temptation is to pick a higher default confidence — 0.6 or 0.7 — to make the system "look more certain." This is wrong. False confidence gives downstream systems nothing to act on. True uncertainty gives downstream systems a reason to investigate.

### Where It Lives in Code

The classifier in `SequenceRecorder` is the primary example:

```typescript
// 8 regex patterns match known operation types.
// When nothing matches, we return BUILD at 0.3.
// 0.3 is not a cop-out — it's an honest statement.
// "I don't recognize this operation. Build is my best guess. But I'm not sure."

classify(signal): { type: OperationType; confidence: number } {
  for (const [pattern, opType, confidence] of CLASSIFY_PATTERNS) {
    if (pattern.test(signal.operationId)) {
      return { type: opType, confidence };
    }
  }
  // Honest uncertainty default:
  return { type: 'BUILD', confidence: 0.3 };
}
```

The 0.3 confidence doesn't disappear. It propagates to risk prediction:

```typescript
// In predictRisks():
// Low confidence + failure = unclear requirements.
// The system detects its own uncertainty and uses it diagnostically.
if (signal.status === 'failure' && classify(signal).confidence < 0.5) {
  risks.push('unclear-requirements');
}
```

The `ObservationRateLimiter` is a second example — when it rejects a write, it explains why:

```typescript
// Honest rejection:
return { allowed: false, reason: `Session ${sessionId} exceeded per-session limit` };
// NOT:
return { allowed: false };  // This hides the reason.
```

### The Known Quirk as a Principle Demonstration

The classifier has a documented bug: `"sign"` inside `"design"` matches CERTIFY before DESIGN gets a chance. We document this in three places:
- `sequence-recorder.ts` inline comment
- `e2e-mini-batch.test.ts` (tested as known behavior)
- `src/__tests__/honest-uncertainty.test.ts`

```typescript
it('classifier quirk is documented and testable: "sign" matches before "design"', () => {
  const result = recorder.classify(makeResult({ operationId: 'foxy:design-layout' }));
  expect(result.type).toBe('CERTIFY');  // Known quirk. Not hidden.
  // Fix: use word boundary \bsign\b
});
```

We don't fix the quirk by hiding it behind a workaround. We document it honestly and write a test that confirms the known behavior. The fix — word boundaries — is also documented. Someone can implement it when it matters.

### The Test That Verifies It

`src/__tests__/honest-uncertainty.test.ts` — specifically:

```typescript
it('low-confidence failure propagates to unclear-requirements risk', async () => {
  bus.emit(createCompletionSignal(makeResult({
    operationId: 'lex:xyzzy-unknown-op',  // No pattern match → 0.3 confidence
    exitCode: 1                             // Failure
  })));
  expect(risks).toContain('unclear-requirements');
});

it('high-confidence failure does NOT trigger unclear-requirements', async () => {
  bus.emit(createCompletionSignal(makeResult({
    operationId: 'hemlock:validate-gates',  // 'validate' → 0.9 confidence
    exitCode: 1
  })));
  expect(risks).not.toContain('unclear-requirements');
});
```

### Hemlock's Principle

*"It is better to spend an hour validating the foundation than weeks fixing the collapse. Honest uncertainty is the foundation's health check. If the system lies about its confidence, the collapse is hidden until it's catastrophic."*

### The Alternative and Why We Rejected It

Hiding uncertainty behind false confidence feels safer. A system that always returns 0.8+ confidence looks competent. But:
- When a 0.8-confidence classification is wrong, downstream systems have no signal to reduce trust
- When a 0.3-confidence record fails, we know exactly where to investigate
- Operators can set confidence thresholds and filter out low-confidence operations
- Debugging is easier when uncertainty is explicit

Honest uncertainty costs nothing except a slightly lower-looking confidence score. It buys diagnosability.

---

## Principle 3: Making Patterns Visible Over Inferring Them

*From `CENTERCAMP-PERSONAL-JOURNAL`, Philosophy 3*

### What It Means

We observe and count. We do not hypothesize and predict. Patterns emerge from data, not from assumptions.

The Creator's Arc — the ANALYZE→BUILD sequence that became the system's canonical example — was not specified. Nobody said "Lex will do ANALYZE before BUILD." It emerged from counting bigrams in 105 recorded operations. The pattern was always in the data. `PatternAnalyzer` just made it visible.

### Where It Lives in Code

`PatternAnalyzer.detectPatterns()` is the purest expression of this principle:

```typescript
// detectPatterns() doesn't hypothesize.
// It groups records by sequenceId, sorts by step,
// extracts bigrams (A→B) and trigrams (A→B→C),
// counts how often each n-gram appears,
// and returns those that appear at least minCount times.
//
// No inference. No prediction. Just counting.
async detectPatterns(minCount = 2): Promise<DetectedPattern[]> {
  const records = await this.getRecords();
  // Group → sort → extract → count → filter → sort
}
```

The `ClusterTranslator` is a visibility layer — it makes the same data visible at three levels:

```typescript
// The data doesn't change. Only the presentation does.
// L0 for learners, L1 for intermediates, L2 for maintainers.

formatAdvice(advice, 'L0');  // "This is a big shift in work style."
formatAdvice(advice, 'L1');  // "Creative Nexus → Rigor Spine. Action: mediate."
formatAdvice(advice, 'L2');  // "CRITICAL: d=0.972 | risk=communication-failure"
```

### The Test That Verifies It

`src/__tests__/pattern-visibility.test.ts` — specifically:

```typescript
it("Creator's Arc (ANALYZE→BUILD) becomes visible after two arcs complete", async () => {
  // Two arcs complete. The data shows ANALYZE→BUILD twice.
  // detectPatterns(2) must find it.
  expect(analyzeToBuilds[0].count).toBeGreaterThanOrEqual(2);
});

it('patterns below minCount threshold are NOT visible', async () => {
  // One arc cannot produce a pattern.
  // Visibility is bounded by evidence, not wishful seeing.
  expect(designToBuilds.length).toBe(0);
});
```

### Willow's Bridge

*"Don't ask permission to build bridges. Just build them. Visibility is that bridge — between raw data and understanding, without the gatekeeping of inference. You don't need a model to tell you what the data means. Look at the data."*

### The Alternative and Why We Rejected It

Inference (ML models, predictive analytics) is powerful but opaque. A model might tell you "this agent has a 73% probability of success on this task type" — but it can't explain how it knows that. When it's wrong, you can't trace why.

Pattern visibility gives you: "ANALYZE→BUILD appeared 8 times in 105 recorded operations, mostly by lex-cluster agents, with mean transition distance 0.0." That's checkable. That's auditable. That's what makes the feedback loop trustworthy.

---

## Principle 4: Sustainable Pace

*Sam's role: "The team moved together throughout. No burnout at 97.3% pace."*

### What It Means

Systems don't collapse suddenly. They degrade gradually. Sustainable pace means: no infinite loops, no unbounded growth, no missing cleanup. The system stays healthy under repeated use.

This principle applies to code the same way it applies to teams. A module that writes without limit, or a listener that never cleans up, is a module that will eventually degrade under load.

### Where It Lives in Code

`RetentionManager` is the clearest expression:

```typescript
// Two pruning criteria, applied in order:
//   1. Age: remove entries older than maxAgeDays (default 90)
//   2. Count: keep only newest maxEntries (default 1000)
//
// This ensures files don't grow without bound over years of use.
// "Good storage design is boring. Boring is reliable."
// — CENTERCAMP-PERSONAL-JOURNAL, "Technical Wisdom Gained"

async prune(filePath: string): Promise<number> {
  // Age filter first, then count filter on survivors.
  // Atomic write (temp file → rename) prevents corruption during pruning.
}
```

`ObservationRateLimiter` protects the storage from write floods:

```typescript
// Per-session cap: one session can't flood the store.
// Per-hour cap: a burst of short sessions can't flood the store.
// Rejected writes include explicit reason strings — no silent drops.

checkLimit(sessionId: string): RateLimitResult {
  if (this.sessionCounts.get(sessionId) >= this.config.maxPerSession) {
    return { allowed: false, reason: `Session ${sessionId} exceeded per-session limit` };
  }
}
```

Idempotent lifecycle in both `FeedbackBridge` and `SequenceRecorder`:

```typescript
// start() and stop() are safe to call multiple times.
// No dangling listeners. No double-registration. No resource leaks.

start(): void {
  if (this.listener) return;  // Already started — no-op.
  this.listener = (signal) => { /* ... */ };
  this.bus.on('completion', this.listener);
}

stop(): void {
  if (!this.listener) return;  // Already stopped — no-op.
  this.bus.off('completion', this.listener);
  this.listener = null;
}
```

### The Test That Verifies It

`src/__tests__/sustainable-pace.test.ts` — specifically:

```typescript
it('stop() prevents further records after shutdown', async () => {
  recorder.start();
  bus.emit(signal);
  await wait(50);
  recorder.stop();
  bus.emit(anotherSignal);  // After stop — should be ignored.
  await wait(50);
  expect(records.length).toBe(1);  // Only the pre-stop signal.
});

it('high signal volume processes all records without dropping', async () => {
  // 50 signals → 50 records. No drops under load.
  // Sustainable doesn't mean slow. It means bounded.
  for (let i = 0; i < 50; i++) bus.emit(signal);
  await wait(200);
  expect(records.length).toBe(50);
});
```

### Sam's Note on Pace

*"The team stayed together at 97.3% pace throughout Batch 3. Not everyone ran ahead. Not everyone fell behind. The system reflects this: no component floods another, no component blocks another. Pace is a coordination property, not just an individual one."*

### The Alternative and Why We Rejected It

Optimize for throughput without worrying about cleanup. This leads to:
- Memory that grows until the process restarts
- Files that grow until disk is full
- Listeners that accumulate until event emission is slow

Sustainable pace is not about being slow. It's about being bounded. Those are not opposites.

---

## Principle 5: Measuring What Matters, Not What's Easy

*From `CENTERCAMP-PERSONAL-JOURNAL`, Philosophy 5*

### What It Means

The system measures learning, not just activity. Compression ratios, not just step counts. Pattern confidence, not just pattern existence.

The easy measurement is: "how many operations succeeded?" The hard measurement is: "is the agent completing the same kind of arc in fewer steps over time?" The first is a lagging indicator. The second is a leading indicator of actual improvement.

### Where It Lives in Code

`computeCompression()` in `SequenceRecorder` is the core learning measurement:

```typescript
// compression ratio = current_step_count / baseline_step_count
//
// First run: no ratio (no baseline yet)
// Second run: "step 6/8 (ratio: 0.75)" — the agent learned something
// Third run: "step 5/8 (ratio: 0.625)" — learning continues
// Fourth run: "step 9/8 (ratio: 1.125)" — regression detected
//
// "Ratio < 1.0 = the agent is learning. This is the signature of skill acquisition."
// — CENTERCAMP-PERSONAL-JOURNAL, "The Story of Compression Tracking"

private computeCompression(sequenceId: string, agent: string, currentStep: number): string | undefined {
  const history = this.arcHistory.get(agent);
  if (!history || history.length === 0) return undefined;  // No baseline yet.
  const baseline = history[0];
  const ratio = currentStep / baseline;
  return `step ${currentStep}/${baseline} (ratio: ${ratio.toFixed(2)})`;
}
```

`PromotionEvaluator` scores sessions on 5 dimensions with specific weights:

```typescript
// These weights reflect what actually predicts session value,
// not what's easiest to measure.
//
// tool calls    0.30  — high tool use = productive session
// duration      0.20  — time investment
// file activity 0.20  — meaningful file changes
// engagement    0.15  — mixed activity types
// rich metadata 0.15  — complete and well-formed records
```

### The Test That Verifies It

`src/__tests__/learning-measurement.test.ts` — specifically:

```typescript
it('ratio correctly reflects fewer steps (learning signal)', async () => {
  // Arc 1: 6 steps → baseline = 6
  // Arc 2: 3 steps → ratio = 3/6 = 0.50
  expect(compressionNote).toMatch(/step 3\/6/);
  expect(compressionNote).toMatch(/ratio: 0\.50/);
});

it('ratio > 1.0 when more steps than baseline (regression detected)', async () => {
  // Arc 1: 2 steps → baseline = 2
  // Arc 2: 4 steps → ratio = 4/2 = 2.0 — regression
  expect(ratio).toBeGreaterThan(1.0);
});
```

### Foxy's Reality Test

*"The most rigorous thing is reality. If it works, it works. But 'it works' means: the agent is getting better at the arc over time, not just that it produced output. We measure what reflects reality — learning rate — not just what's easy to count."*

### The Alternative and Why We Rejected It

The easy measurement: count operations, count successes, report success rate. This is necessary but not sufficient. A system with 100% success rate on trivial operations is not improving. A system where the compression ratio trends toward 0.5 across repeated arcs is genuinely getting better.

Measuring what matters requires more work. It requires knowing what "better" looks like before you measure. The 5-factor scoring, the compression ratio, the determinism tiers — these are all answers to the question "what does improvement actually look like in this system?"

---

## The 5 Principles Together: A Coherent System

These principles are not independent. They form a philosophy:

1. **Separation of Concerns** ensures each module can be measured independently
2. **Honest Uncertainty** ensures measurements reflect reality, not wishful confidence
3. **Pattern Visibility** ensures measurements become actionable intelligence
4. **Sustainable Pace** ensures measurement doesn't degrade the system it's measuring
5. **Learning Measurement** ensures the measurements we take are the ones that matter

Together: a system that observes accurately (P2), stores cleanly (P4), analyzes visibly (P3), operates independently (P1), and measures what matters (P5).

### The Coherence Test

If any principle were removed:
- Remove P1: modules couple, schemas tangle, tests become integration-dependent
- Remove P2: false confidence hides real failures, debugging becomes guesswork
- Remove P3: invisible patterns, decisions based on assumption rather than data
- Remove P4: storage grows without bound, listeners accumulate, the system degrades
- Remove P5: activity is measured instead of learning, the feedback loop provides no signal

The system needs all five to work correctly.

---

## How to Honor These Principles in New Code

When you add a new observation feature, ask yourself these five questions:

1. **Separation:** "Does this module answer exactly one question? Does it write to exactly one storage category?"
2. **Honesty:** "When this module is uncertain, does it say so? Is uncertainty propagated correctly?"
3. **Visibility:** "Can the output of this module be read by a human without a special tool? Is it sorted by relevance?"
4. **Pace:** "Does this module clean up after itself? Is there a limit on how much it writes?"
5. **Measurement:** "Does this module measure what actually matters, or just what's easy?"

If you can answer all 5 questions positively, the new code honors the principles.

---

## The Tests as Specifications

The 5 test suites in `src/__tests__/` are not just tests. They are executable specifications:

- `separation-of-concerns.test.ts` — defines what "separated" means
- `honest-uncertainty.test.ts` — defines what "honest" means
- `pattern-visibility.test.ts` — defines what "visible" means
- `sustainable-pace.test.ts` — defines what "sustainable" means
- `learning-measurement.test.ts` — defines what "learning" looks like

When a test in these suites fails, it means a principle has been violated. Fix the code, not the test.

---

## Cedar's Closing Note

*"These 5 principles are the mycelium of this system — the invisible network that connects everything. Once you can see them in the code, you can trace any module back to its root. And once you can trace, you can contribute without breaking the web. The cross-reference map makes the connections explicit. Use it."*

---

## Related Resources

- `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md` — detailed code examples per principle
- `docs/architecture/CROSS-REFERENCE-MAP.md` — all modules mapped to principles
- `src/__tests__/` — all 5 principle test suites
- `.claude/skills/design-principles/SKILL.md` — interactive principle lookup skill
- `.claude/skills/code-archaeology/SKILL.md` — trace code back to principle and story
