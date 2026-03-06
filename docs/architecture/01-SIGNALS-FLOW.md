# How Signals Flow

**Architecture Guide #1**
*Written by Lex with guidance from Hemlock — for new developers joining the project*

---

## What This Guide Is For

This guide answers the question: "I see a `CompletionSignal` in the code — where does it come from, where does it go, and why does the system care?"

The answer traces through six modules, three storage categories, and two design principles. By the end, you should be able to read any module in `src/platform/observation/` and know exactly where its data comes from and where it goes.

---

## The Central Insight: Everything Starts With a Signal

When an agent completes an operation — writing a file, running a command, finishing a phase — it fires a `CompletionSignal` onto the `SignalBus`. That signal contains:

- `operationId`: a string like `"lex:validate-plan"` encoding who did what
- `exitCode`: 0 for success, non-zero for failure
- `stdout` and `stderr`: operation output
- `durationMs`: how long it took
- `timedOut`: whether it exceeded the time budget

This is the system's heartbeat. Every observation starts here.

```typescript
// From: src/services/chipset/blitter/signals.ts
// A CompletionSignal is the atomic unit of observation
bus.emit(createCompletionSignal({
  operationId: 'lex:validate-plan',
  exitCode: 0,
  stdout: 'Plan is valid',
  stderr: '',
  durationMs: 142,
  timedOut: false,
}));
```

---

## The Two Parallel Listeners

Here is the architectural discovery that defines the entire observation system.

When a `CompletionSignal` fires, **two independent listeners** process it simultaneously:

### Listener 1: FeedbackBridge

**Question asked:** *Did it work?*

`FeedbackBridge` writes to `PatternStore 'feedback'` category:

```typescript
// From: src/platform/observation/feedback-bridge.ts
// FeedbackBridge asks: "Did the operation succeed?"
{
  operationId: 'lex:validate-plan',
  status: 'success',       // success | failure | error | timeout
  exitCode: 0,
  durationMs: 142,
  stdoutHash: '3a7f...',   // SHA-256 of stdout — for drift detection
  timestamp: 1735000000000
}
```

### Listener 2: SequenceRecorder

**Question asked:** *What did it do?*

`SequenceRecorder` writes to `PatternStore 'workflows'` category:

```typescript
// From: src/platform/observation/sequence-recorder.ts
// SequenceRecorder asks: "What kind of operation was this?"
{
  sequenceId: 'arc-lex',     // groups operations into arcs
  step: 3,                   // position within the arc
  operationType: 'VALIDATE', // SCOUT | VALIDATE | BUILD | ANALYZE | ...
  agent: 'lex',
  clusterSource: 'rigor-spine',
  clusterTarget: 'rigor-spine',
  transitionDistance: 0.0,
  failureRisks: [],
  riskConfidence: 0,
  timestamp: 1735000000000,
  feedbackRef: 'lex:validate-plan'
}
```

**Neither listener knows the other exists.** They share a `SignalBus` and a `PatternStore`, but write to different categories. No locks. No coordination. Zero interference.

This is **Separation of Concerns in its purest form**. See `src/__tests__/separation-of-concerns.test.ts` for the test that proves this holds.

---

## How Classification Works

`SequenceRecorder.classify()` maps operation IDs to types using 8 regex patterns in priority order:

```
scout|recon           → SCOUT    (confidence 0.9)
validate|verify|test  → VALIDATE (confidence 0.9)
certify|approve|sign  → CERTIFY  (confidence 0.8)  ← "sign" quirk here
govern|standard       → GOVERN   (confidence 0.8)
analyze|audit|inspect → ANALYZE  (confidence 0.8)
propose|plan          → PROPOSE  (confidence 0.8)
design|architect      → DESIGN   (confidence 0.7)
build|implement|create→ BUILD    (confidence 0.7)
(no match)            → BUILD    (confidence 0.3)  ← Honest uncertainty default
```

The 0.3 default is not a bug — it's an honest admission. When the classifier doesn't recognize an operation, it says so with low confidence. This propagates correctly: low-confidence failures trigger `unclear-requirements` risk.

**Known quirk:** `"design"` contains `"sign"`, which matches `CERTIFY` before `DESIGN` gets a chance. This is documented in `sequence-recorder.ts` and tested in `src/__tests__/honest-uncertainty.test.ts`. Fix: use word boundaries `\bsign\b`. See `BATCH-3-RETROSPECTIVE.md`, Willow's debrief.

---

## The Storage Layer: PatternStore

Both listeners write to the same `PatternStore` instance, different categories:

```
patternsDir/
  feedback.jsonl     ← FeedbackBridge writes here
  workflows.jsonl    ← SequenceRecorder writes here
  sessions.jsonl     ← SessionObserver writes here
```

Each file is **append-only JSONL** with:
- A SHA-256 checksum per entry for tamper detection
- Monotonic timestamps (entries always go at the end)
- Atomic writes (temp file → rename) to prevent corruption

**Principle: Separation of Concerns Over Shared Optimization**
(CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 1)

The category key is the isolation boundary. Two modules can share a `PatternStore` instance and never interfere, as long as they write to different categories.

---

## The Downstream Readers

Once signals are stored, analysis modules read them:

### PatternAnalyzer (reads 'workflows')

```typescript
// From: src/platform/observation/pattern-analyzer.ts
// Finds frequency of operation subsequences
const patterns = await analyzer.detectPatterns(2);
// Returns: [{ operations: ['ANALYZE', 'BUILD'], count: 8, confidence: 0.82 }]
```

This is how **Creator's Arc** became visible in Phase 2b. After 105 signals were recorded, `detectPatterns()` found that `ANALYZE→BUILD` appeared 8 times. The algorithm didn't hypothesize it — the data showed it.

### DriftMonitor (reads 'feedback')

```typescript
// From: src/platform/observation/drift-monitor.ts
// Checks whether promoted scripts produce consistent output
// Compares stdoutHash from current run to stdoutHash from baseline
```

`DriftMonitor` reads 'feedback' records to detect when a promoted script starts producing different output than expected. High drift → the script may need review.

### SessionObserver (reads 'sessions', writes 'sessions')

```typescript
// From: src/platform/observation/session-observer.ts
// Orchestrates 7 components to capture session-level observations
// Applies rate limiting before writing
// Applies promotion evaluation to determine which sessions to promote
```

---

## The Traceability Layer

`LineageTracker` maintains the full provenance chain:

```
ExecutionCapture → DeterminismAnalyzer → PromotionDetector
  → PromotionGatekeeper → ScriptGenerator → DriftMonitor
```

Any artifact can be queried upstream ("what produced this?") or downstream ("what did this produce?"). This is the machine-readable form of "showing your work."

```typescript
// From: src/platform/observation/lineage-tracker.ts
// "When we show our work, others can verify, build on it, or find the error."
// — CENTERCAMP-PERSONAL-JOURNAL, "Showing Your Work Is the Gift"

const upstream = await tracker.getUpstream('script-2026-03-04-lex');
// Returns: the PromotionGatekeeper decision that approved the script
```

---

## Signal Flow Diagram

```
Agent operation completes
        │
        ▼
  [SignalBus 'completion']
        │
        ├──────────────────────┐
        ▼                      ▼
  FeedbackBridge          SequenceRecorder
  "Did it work?"          "What did it do?"
        │                      │
        ▼                      ▼
  PatternStore            PatternStore
  'feedback'              'workflows'
        │                      │
        ▼                      ▼
  DriftMonitor            PatternAnalyzer
  (drift detection)       (pattern mining)
        │                      │
        ▼                      ▼
  Drift alerts            Routing advice
  (DriftEvent)            (ClusterTranslator)
```

---

## The Rate Limiting Safety Layer

Before any session observation is written, `ObservationRateLimiter` checks two limits:

- **maxPerSession (50):** one session can't flood the store
- **maxPerHour (200):** a burst of short sessions can't flood the store

If either limit is exceeded, the write is rejected with an explicit reason string. No silent drops.

This is **Honest Uncertainty** applied to infrastructure: when the system can't accept a write, it says so clearly rather than silently discarding data.

---

## Five-Module Summary

| Module | Reads | Writes | Purpose |
|--------|-------|--------|---------|
| FeedbackBridge | SignalBus | 'feedback' | Capture outcome (did it work?) |
| SequenceRecorder | SignalBus | 'workflows' | Classify operation (what was it?) |
| PatternAnalyzer | 'workflows' | — | Detect patterns (what's repeating?) |
| DriftMonitor | 'feedback' | 'feedback' | Detect drift (is output changing?) |
| SessionObserver | 'sessions' | 'sessions' | Track session health (how's the team?) |

---

## For the Curious: The Full Commitment

The signal flow works at all scales:
- Single agent, single operation: one 'feedback' record, one 'workflows' record
- 6 agents, 50 operations each: 300 records in each category, still no locks
- Multiple processes: JSONL append is atomic at the filesystem level

**The test that proves it:** `src/__tests__/separation-of-concerns.test.ts`
Specifically: `"multiple signals do not produce cross-category record count mismatch"` — 5 signals, 5 feedback records, 5 workflow records, zero interference.

---

## Next Steps

- **How signals become patterns:** read `pattern-analyzer.ts` and `docs/architecture/02-WHY-WE-MEASURE.md`
- **Why the design principles:** read `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md`
- **Where to find things:** read `docs/architecture/layers.md`

*Lex note: "Read first, code second. The signal flow is the grammar. Learn the grammar and the code makes sense."*
