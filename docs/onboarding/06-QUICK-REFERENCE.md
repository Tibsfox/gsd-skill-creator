# Quick Reference: Navigation Tips & Glossary

*For everyone — a compact reference for common terms, navigation patterns, and frequently asked questions*

---

## Navigation Tips

### Finding Things Fast

| Task | Where to go |
|------|------------|
| Understand the overall system | `docs/onboarding/01-FIRST-STEPS.md` |
| Choose a learning path | `docs/onboarding/02-LEARNING-PATHS.md` |
| Find a file | `docs/onboarding/03-CARTOGRAPHY.md` |
| Understand a design decision | `docs/onboarding/04-DESIGN-PRINCIPLES.md` |
| Meet the muses | `docs/onboarding/05-MUSE-VOICES.md` |
| Look up a specific module | `docs/architecture/CROSS-REFERENCE-MAP.md` |
| Understand signal flow | `docs/architecture/01-SIGNALS-FLOW.md` |
| Understand why we measure | `docs/architecture/02-WHY-WE-MEASURE.md` |
| See principles with code examples | `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md` |
| Read the project story | `docs/learning-journey/CENTERCAMP-PERSONAL-JOURNAL.md` |

### Common Commands

```bash
# Run all tests
npm test

# Run a specific test suite
npm test -- src/__tests__/separation-of-concerns.test.ts

# Run a module's unit tests
npm test -- src/platform/observation/__tests__/sequence-recorder.test.ts

# Run lint
npm run lint

# Build
npm run build
```

### Key File Shortcuts

The observation system lives entirely in `src/platform/observation/`. If you're working on the learning loop, you're in that directory.

The 5 principle test suites are in `src/__tests__/`. Read them before reading the implementation code they test.

---

## Glossary

### A

**Arc** — A sequence of operations performed by an agent, grouped by `sequenceId`. Example: an agent that does ANALYZE→DESIGN→BUILD completes one arc. Tracked in `sequence-recorder.ts`.

**Arc History** — The record of an agent's previous arc lengths. Used to compute compression ratio.

**ANALYZE** — An operation type. Assigned when `operationId` matches `/analyze|audit|inspect/i`.

### B

**Bigram** — Two consecutive operation types in a sequence. Example: `ANALYZE→BUILD`. `PatternAnalyzer` mines bigrams (and trigrams) to find Creator's Arc patterns.

**BUILD** — An operation type. Assigned when `operationId` matches `/build|implement|create/i`, or as the honest-uncertainty default at confidence 0.3.

**Bounded learning** — The principle that the system learns from patterns but applies guardrails: 20% max content change per refinement, 3-correction minimum before proposing refinement, 7-day cooldown.

### C

**Category key** — The string key used to isolate storage within a `PatternStore`. Example: `'feedback'`, `'workflows'`, `'sessions'`. The isolation boundary for Principle 1.

**CERTIFY** — An operation type. Assigned when `operationId` matches `/certify|approve|sign/i`. Note: "sign" in "design" causes a known classifier quirk.

**ClusterTranslator** — A module that converts cluster transition data to human-readable advice at three disclosure levels (L0, L1, L2). Embodies Principle 3.

**Compression ratio** — `current_step_count / baseline_step_count`. Ratio < 1.0 means the agent completed the same arc in fewer steps — a learning signal. Computed in `sequence-recorder.ts`.

**CompletionSignal** — The atomic event fired when an agent completes an operation. Contains: `operationId`, `exitCode`, `stdout`, `stderr`, `durationMs`, `timedOut`. The system's heartbeat.

**Creator's Arc** — The ANALYZE→BUILD bigram pattern. Discovered (not predicted) in Batch 3 Phase 2b. The canonical example of pattern visibility (Principle 3).

### D

**DESIGN** — An operation type. Assigned when `operationId` matches `/design|architect/i` (confidence 0.7). Note: comes after CERTIFY in priority order, causing the classifier quirk.

**DriftMonitor** — A module that detects when promoted scripts start producing output inconsistent with their baseline. Reads from `'feedback'` category. Embodies Principle 5.

**DSP (Digital Signal Processing)** — The metaphor used for the error-correction system. LLM hallucinations = noise in a stochastic channel. Three-layer correction: deterministic hooks, checkpoint assertions, quick-scan.

### E

**Ephemeral store** — Short-lived session data that exists before promotion evaluation. Contrast with persistent (promoted) storage.

### F

**FeedbackBridge** — One of the two parallel listeners. Asks "did the operation succeed?" Writes to `'feedback'` category. Embodies Principle 1.

**FailureRisk** — A string label assigned by `predictRisks()` when pattern analysis detects a known risk type. Example: `'unclear-requirements'` (low confidence + failure).

### G

**GOVERN** — An operation type. Assigned when `operationId` matches `/govern|standard/i` (confidence 0.8).

**GSD** — "Get Shit Done." The project management layer. Provides phases, plans, and the `/gsd:` command system. gsd-skill-creator is the adaptive learning layer built on top of GSD.

### H

**Honest uncertainty** — Principle 2. When the system doesn't know the type of an operation, it returns a low confidence score (0.3) instead of a high-confidence wrong answer.

### J

**JSONL** — JSON Lines format. Each line is a valid JSON object. Used for all storage in the observation system. Append-only, with SHA-256 checksums per entry.

**JsonlCompactor** — A module that removes expired, malformed, and tampered JSONL entries. Distinct from `RetentionManager` (which handles age and count limits). Embodies Principle 4.

### L

**Lineage** — The full provenance chain of an artifact through the 6-stage promotion pipeline. Tracked by `LineageTracker`.

**L0 / L1 / L2** — The three disclosure levels in `ClusterTranslator`. L0: plain English for learners. L1: structured summary for intermediates. L2: full technical detail for maintainers.

### M

**Muse** — One of the six perspectives (Lex, Sam, Willow, Hemlock, Cedar, Foxy) that shaped the system's design. Not characters or agents — lenses for thinking about problems.

### O

**ObservationRateLimiter** — A module that caps writes per session and per hour. Returns explicit rejection reasons. Embodies Principles 2 and 4.

**operationId** — The string identifier for an operation. Format: `agent:operation-description`. Example: `lex:validate-plan`. Used by `SequenceRecorder` to classify operation type.

**OperationType** — One of: SCOUT, VALIDATE, CERTIFY, GOVERN, ANALYZE, PROPOSE, DESIGN, BUILD. Assigned by the classifier in `SequenceRecorder`.

### P

**PatternAnalyzer** — A module that detects frequent operation subsequences. Mines bigrams and trigrams. Embodies Principle 3.

**PatternStore** — The shared storage abstraction. Each module writes to its own category key. Persists data as JSONL.

**Promotion** — The process of elevating an operation from "observed" to "promoted" status, where it can be executed as an automation script. Requires passing 6 quality gates.

**PromotionEvaluator** — Scores sessions on 5 dimensions (tool calls, duration, file activity, engagement, metadata) to determine promotion eligibility. Embodies Principle 5.

**PROPOSE** — An operation type. Assigned when `operationId` matches `/propose|plan/i` (confidence 0.8).

### R

**RetentionManager** — A module that prunes JSONL files by age (90 days default) and count (1000 entries default). Embodies Principle 4.

**RoutingAdvisor** — A module that recommends agent-to-task routing using 6D capability vectors. Embodies Principle 3.

### S

**SCOUT** — An operation type. Assigned when `operationId` matches `/scout|recon/i` (confidence 0.9).

**SequenceRecorder** — One of the two parallel listeners. Asks "what kind of operation was this?" Writes to `'workflows'` category. Classifies operations, tracks sequences, computes compression. Embodies Principles 1, 2, and 5.

**sequenceId** — Groups operations into arcs. Example: `arc-lex`. All operations in a given arc share the same `sequenceId`.

**SessionObserver** — Orchestrates 7 components for session lifecycle observation. Embodies Principles 1 and 4.

**SignalBus** — The event bus. Both `FeedbackBridge` and `SequenceRecorder` subscribe to its `'completion'` event.

**stdoutHash** — SHA-256 of `stdout`. Stored in feedback records instead of full stdout text, to keep storage bounded. Used by `DriftMonitor` for drift detection.

### T

**Trigram** — Three consecutive operation types in a sequence. Example: `ANALYZE→BUILD→VALIDATE`. Mined by `PatternAnalyzer` alongside bigrams.

### V

**VALIDATE** — An operation type. Assigned when `operationId` matches `/validate|verify|test/i` (confidence 0.9).

---

## Frequently Asked Questions

**Q: Why does the test call `checkLimit()` but the interface says `check()`?**
A: The API was corrected during Wave 2 test development. The actual method is `checkLimit()`. This is documented in the Wave 2 summary.

**Q: Why does `"design"` classify as CERTIFY instead of DESIGN?**
A: `"sign"` in `"design"` matches the `/certify|approve|sign/i` pattern before the `/design|architect/i` pattern gets a chance. This is a known classifier quirk. The fix (word boundaries: `\bsign\b`) is documented in `sequence-recorder.ts` and tested in `honest-uncertainty.test.ts`.

**Q: Why are there two listeners instead of one that does both jobs?**
A: Separation of Concerns (Principle 1). Two listeners asking different questions write to different storage categories, have independent schemas, and can be tested independently. One listener doing both jobs would couple their schemas together.

**Q: What's the difference between pruning and compacting?**
A: `RetentionManager.prune()` removes entries by age and count — it manages how much data we keep. `JsonlCompactor.compact()` removes malformed, expired, and tampered entries — it manages data integrity. Different jobs, different modules.

**Q: Why is confidence 0.3 the "honest uncertainty" default instead of 0.0?**
A: 0.3 means "BUILD is my best guess, but I'm uncertain." 0.0 would mean "I have no idea what operation type this is." The classifier has a prior belief — most unrecognized operations are BUILD-like — even when it can't confirm.

**Q: Where do I put new tests?**
A: Unit tests for a specific module go in `src/platform/observation/__tests__/[module-name].test.ts`. Tests that verify a design principle go in `src/__tests__/[principle-name].test.ts`.

**Q: Can I commit `.planning/` files?**
A: No. `.planning/` is gitignored. A PreToolUse hook blocks any attempt. Don't try.

**Q: What is the difference between a skill and an agent?**
A: Skills are context-loading instructions that auto-activate based on what you're doing. Agents are autonomous subagent definitions with specific capabilities. Skills are passive (they provide context). Agents are active (they execute tasks).

**Q: Why is `ClusterTranslator` a set of functions instead of a class?**
A: This was discovered during Wave 2. `translateTransition(record)` and `formatAdvice(advice, level)` are pure functions with no shared state — there's no reason to instantiate an object. Separation of concerns in module design.

**Q: How do I know which principle applies to the code I'm writing?**
A: Use the `.claude/skills/design-principles/` skill, or ask yourself the 5 questions in `docs/onboarding/04-DESIGN-PRINCIPLES.md` ("How to Honor These Principles in New Code").

**Q: What is the `feedbackRef` field in workflow records?**
A: A reference linking the workflow record to its corresponding feedback record. The feedback record has the outcome (`exitCode`); the workflow record has the operation type. `feedbackRef` allows them to be joined if needed.

**Q: Why does `PatternAnalyzer` require `minCount = 2` to report a pattern?**
A: One occurrence is not a pattern. Two occurrences is the minimum threshold for claiming a recurring behavior. See `src/__tests__/pattern-visibility.test.ts`: "patterns below minCount threshold are NOT visible."

---

*For deeper reference, see `docs/architecture/CROSS-REFERENCE-MAP.md` (all 23 modules) and `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md` (detailed principle explanations).*
