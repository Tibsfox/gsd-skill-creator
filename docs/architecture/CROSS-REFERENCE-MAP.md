# Cross-Reference Map: Code → Principle → Story → Test

**Document:** Living index of design connections
**Maintained by:** Cedar (Root Observer)
**Last Updated:** 2026-03-13
**Coverage:** 23 observation modules in `src/platform/observation/`

---

## How to Use This Map

This map connects four kinds of artifacts:
- **Code** — the 23 observation modules
- **Principle** — the 5 design principles from CENTERCAMP-PERSONAL-JOURNAL
- **Story** — the Batch 3 experiences that motivated each decision
- **Test** — the test in `src/__tests__/` that verifies the principle holds

Find a module → trace its principle → find the story behind it → run the test that proves it.

---

## The 5 Design Principles

| ID | Name | Short Form | Test Suite |
|----|------|------------|------------|
| P1 | Separation of Concerns Over Shared Optimization | Two listeners, independent storage | `separation-of-concerns.test.ts` |
| P2 | Honest Uncertainty Over Confident Wrongness | 0.3 confidence = honest default | `honest-uncertainty.test.ts` |
| P3 | Making Patterns Visible Over Inferring Them | Count, don't infer | `pattern-visibility.test.ts` |
| P4 | Sustainable Pace | Bounded, clean, idempotent | `sustainable-pace.test.ts` |
| P5 | Measuring What Matters, Not What's Easy | Compression ratio = learning | `learning-measurement.test.ts` |

---

## Module Index: Code → Principle → Story → Test

### Signal Intake Group

#### sequence-recorder.ts
- **Purpose:** Classify and record workflow sequences
- **Principles:** P1 (parallel listener), P2 (confidence 0.3 default), P5 (compression tracking)
- **Stories:**
  - "The Story of Creator's Arc" — how the arc emerged from counting
  - "The Story of Compression Tracking" — ratio 0.75 = learning visible
  - "Classifier Quirk" — "sign" in "design" → honest documentation of known uncertainty
- **Tests:**
  - `separation-of-concerns.test.ts` — two listeners don't interfere
  - `honest-uncertainty.test.ts` — 0.3 confidence propagates correctly
  - `learning-measurement.test.ts` — compression ratio calculates correctly
- **Muses:** Lex (classification ordering), Foxy ("The most rigorous thing is reality")

#### feedback-bridge.ts
- **Purpose:** Capture operation outcomes (did it work?)
- **Principles:** P1 (parallel listener), P4 (idempotent start/stop)
- **Stories:**
  - "The Story of the Two Listeners" — parallel listeners, zero interference
  - "Why stdoutHash Not Full Stdout" — bounded storage, not verbatim content
- **Tests:**
  - `separation-of-concerns.test.ts` — FeedbackBridge isolatable, no SequenceRecorder needed
  - `sustainable-pace.test.ts` — stop() is idempotent and clean
- **Muses:** Lex (debrief: "Signal categories don't interfere because PatternStore isolation is at the category key")

#### sequence-recorder-listener.ts
- **Purpose:** Wire SequenceRecorder into the application (integration factory)
- **Principles:** P1 (factory keeps wiring separate from business logic)
- **Stories:**
  - "Batch 3 Phase 1 Wiring Story" — 2:1 planning-to-coding ratio lesson
- **Tests:**
  - (covered by wiring.test.ts and sequence-recorder-integration.test.ts)
- **Muses:** Sam (coordination, ensuring components are wired together correctly)

#### photon-emitter.ts
- **Purpose:** Emit baseline measurements for promoted scripts
- **Principles:** P5 (baseline measurements before promotion)
- **Stories:**
  - "Measurement Metaphor from Quantum Physics" — observing changes what you observe
  - "6 Path Types" — different kinds of operations need different baselines
- **Tests:**
  - (tested in photon-emitter.test.ts)
- **Muses:** Cedar (observation as foundation for connection)

#### transcript-parser.ts
- **Purpose:** Parse conversation transcripts into tool pairs
- **Principles:** P3 (two-pass algorithm makes tool use visible)
- **Stories:**
  - "Sidechain Filtering" — filter noise before making patterns visible
  - "Command First-Word Extraction" — make commands classifiable
- **Tests:**
  - (tested in transcript-parser.test.ts)
- **Muses:** Willow (translation between formats — bridge-builder)

#### execution-capture.ts
- **Purpose:** 4-stage pipeline: transcript → pairs → validate → store
- **Principles:** P1 (capture vs store separation), P4 (only store if pairs > 0)
- **Stories:**
  - "4-Stage Pipeline Role" — each stage has one job
  - "Storage Decision" — don't write empty records
- **Tests:**
  - (tested in execution-capture.test.ts)
- **Muses:** Hemlock (only store what's worth storing — quality gate at the intake)

---

### Session Tracking Group

#### session-observer.ts
- **Purpose:** Orchestrate 7 components for session lifecycle observation
- **Principles:** P1 (7 components with clear responsibilities), P4 (rate limiting integrated)
- **Stories:**
  - "7-Component Orchestration" — each component answers one question
  - "Ephemeral vs Persistent Tiers" — short-term + long-term = sustainable
- **Tests:**
  - `sustainable-pace.test.ts` — rate limiting prevents write floods
  - (tested in session-observer.test.ts)
- **Muses:** Sam (coordination, ensuring all components stay together)

#### pattern-summarizer.ts
- **Purpose:** Compress session patterns into token-efficient summaries
- **Principles:** P3 (making patterns visible in token budget), P5 (compression as learning signal)
- **Stories:**
  - "Making Patterns Visible" philosophy — top-N mechanism
  - "Why topFiles Combines Read+Written" — one signal, two sources
- **Tests:**
  - (tested in pattern-summarizer.test.ts)
- **Muses:** Lex (clarity-first: visible summary over raw dump)

#### ephemeral-store.ts
- **Purpose:** Two-tier storage (ephemeral session data → promoted persistent)
- **Principles:** P1 (ephemeral and persistent are separate concerns), P4 (clear-regardless on error)
- **Stories:**
  - "Two-Tier Rationale" — ephemeral is fast but volatile, persistent is durable
  - "Checksum Validation (INT-01)" — integrity before persistence
- **Tests:**
  - `sustainable-pace.test.ts` — sequential writes don't create race conditions
  - (tested in ephemeral-store.test.ts)
- **Muses:** Cedar (roots = persistent, branches = ephemeral)

#### observation-squasher.ts
- **Purpose:** Merge multiple session records into one combined record
- **Principles:** P1 (squashing is separate from storage), P3 (merge makes patterns more visible)
- **Stories:**
  - "When Squashing Exists" — provenance preserved via squashedFrom
  - "Merge Strategy Per Field Type" — different fields merge differently
- **Tests:**
  - (tested in observation-squasher.test.ts)
- **Muses:** Willow (merging different streams into one coherent signal)

#### retention-manager.ts
- **Purpose:** Prune JSONL files by age and count
- **Principles:** P4 (sustainable: storage doesn't grow without bound)
- **Stories:**
  - "Boring Is Reliable" — simple 90-day window, 1000-entry cap
  - "Age Before Count" — pruning order matters for correctness
  - "Atomic Write Rationale" — never leave a half-written file
- **Tests:**
  - `sustainable-pace.test.ts` — prune() respects maxEntries, keeps newest
- **Muses:** Sam (pace: keep storage bounded like a healthy team keeps scope bounded)

#### rate-limiter.ts
- **Purpose:** Cap observation writes per session and per hour
- **Principles:** P2 (explicit rejection reasons), P4 (write ceiling enforced)
- **Stories:**
  - "Hemlock's 'Check the Foundation'" — validate before write
  - "Anomaly Detection as Signal" — report, don't throw
- **Tests:**
  - `separation-of-concerns.test.ts` — rate limiter testable without bus or store
  - `honest-uncertainty.test.ts` — rejected observations include explicit reason
  - `sustainable-pace.test.ts` — per-session and per-hour caps enforced
- **Muses:** Hemlock ("It is better to spend an hour validating the foundation than weeks fixing the collapse")

#### promotion-evaluator.ts
- **Purpose:** Score sessions on 5 dimensions to determine promotion eligibility
- **Principles:** P5 (measuring what matters: 5 weighted factors not just success rate)
- **Stories:**
  - "5-Factor Scoring" — tool calls 0.3, duration 0.2, file activity 0.2, engagement 0.15, metadata 0.15
  - "Threshold Justification" — why 0.6 is the promotion floor
- **Tests:**
  - (tested in promotion-evaluator.test.ts)
- **Muses:** Foxy ("The most rigorous thing is reality" — weights derived from observation, not theory)

---

### Pattern Intelligence Group

#### pattern-analyzer.ts
- **Purpose:** Detect frequent operation subsequences (bigrams and trigrams)
- **Principles:** P3 (count visible patterns, don't infer), P5 (confidence formula is transparent)
- **Stories:**
  - "The Story of Creator's Arc" — ANALYZE→BUILD emerged from counting
  - "Sam's Tool" — PatternAnalyzer is Sam's primary analytical instrument
  - "Hub Capacity Analysis" — measure load on cluster boundaries
- **Tests:**
  - `pattern-visibility.test.ts` — Creator's Arc visible after two arcs
  - `pattern-visibility.test.ts` — patterns sorted by count (most visible first)
  - `learning-measurement.test.ts` — feedback loop closes (patterns detectable from records)
- **Muses:** Sam ("turning raw observation data into actionable routing signals")

#### cluster-translator.ts
- **Purpose:** Convert cluster transition data to human-readable guidance (L0/L1/L2)
- **Principles:** P3 (visible at the right level for each audience)
- **Stories:**
  - "Willow's Bridge-Building" — translate technical to accessible
  - "Three Disclosure Levels" — L0 for learners, L1 for intermediates, L2 for maintainers
  - "Lex's Pattern-Ordering Principle" — specific before generic
- **Tests:**
  - `pattern-visibility.test.ts` — L0 plain English, L2 technical detail, deterministic
- **Muses:** Willow ("Don't ask permission to build bridges. Just build them.")

#### routing-advisor.ts
- **Purpose:** Recommend agent-to-task routing using 6D capability vectors
- **Principles:** P3 (visible routing reasons via dominant dimension)
- **Stories:**
  - "6D Capability Space" — each dimension maps to a cluster strength
  - "Cosine Similarity Rationale" — direction matters more than magnitude
  - "CSV Loading with Fallback" — graceful degradation when data is missing
- **Tests:**
  - (tested in routing-advisor.test.ts)
- **Muses:** Sam (coordination: matching agents to tasks by capability, not just availability)

#### determinism-analyzer.ts
- **Purpose:** Score operation determinism for promotion eligibility
- **Principles:** P2 (honest uncertainty: variance score with confidence tiers), P5 (measuring actual reliability)
- **Stories:**
  - "Variance Score Formula with Examples" — clear math, not black-box
  - "Minimum Sample Size (DTRM-04)" — don't promote with insufficient evidence
  - "Classification Tiers" — deterministic | semi-deterministic | non-deterministic
- **Tests:**
  - (tested in determinism-analyzer.test.ts)
- **Muses:** Hemlock (rigor: classification tiers based on empirical variance, not vibes)

#### promotion-detector.ts
- **Purpose:** Identify operations that are candidates for promotion
- **Principles:** P1 (detection separate from classification), P5 (composite score = what matters)
- **Stories:**
  - "Why Detection Is Separate from Classification" — different questions, different modules
  - "Promotable Tools (PRMO-04)" — not all tool calls are promotion candidates
  - "Composite Score Formula" — frequency × determinism × token savings
- **Tests:**
  - (tested in promotion-detector.test.ts)
- **Muses:** Hemlock (quality gates: only candidates that genuinely merit attention)

#### promotion-gatekeeper.ts
- **Purpose:** Evaluate candidates against 6 quality gates before promotion
- **Principles:** P2 (explicit reasoning + evidence for every gate decision)
- **Stories:**
  - "Hemlock's Role in the System" — quality gate as foundation validation
  - "6 Gates (3 Always + 3 Conditional)" — graduated validation
  - "Showing Your Work Is the Gift" — gate reasoning is transparent and debuggable
- **Tests:**
  - (tested in promotion-gatekeeper.test.ts)
- **Muses:** Hemlock ("It is better to spend an hour validating the foundation than weeks fixing the collapse")

---

### Data Lifecycle Group

#### script-generator.ts
- **Purpose:** Generate automation scripts for promoted operations
- **Principles:** P1 (script generation separate from decision to promote)
- **Stories:**
  - "5 Supported Tools with Bash Equivalents" — explicit about what is scriptable
  - "Dry-Run Two Failure Modes" — honest about what can fail
  - "Glob Conversion Limitation" — honest about what is not supported
- **Tests:**
  - (tested in script-generator.test.ts)
- **Muses:** Lex (clarity: generated scripts are readable, not magic)

#### drift-monitor.ts
- **Purpose:** Detect when promoted scripts produce inconsistent output
- **Principles:** P5 (consecutive vs transient mismatch — measure what matters for reliability)
- **Stories:**
  - "Why Drift Monitoring Exists" — promotion is irreversible without it
  - "Consecutive vs Transient Mismatch" — one miss is noise, two consecutive = signal
  - "Cross-Session Persistence via Lazy Init" — drift state survives restarts
- **Tests:**
  - (tested in drift-monitor.test.ts)
- **Muses:** Sam (sustained monitoring: "the team stayed together" — drift monitor stays watching)

#### jsonl-compactor.ts
- **Purpose:** Remove expired, malformed, and tampered JSONL entries
- **Principles:** P4 (storage health — compact is different from prune)
- **Stories:**
  - "Compaction vs Pruning Distinction" — space vs integrity
  - "4-Step Pipeline (Schema → Parse → Expiry → Checksum)" — ordered validation
  - "Atomic Write Rationale" — boring is reliable
- **Tests:**
  - `sustainable-pace.test.ts` — malformed entries removed, valid entries kept
  - `sustainable-pace.test.ts` — atomic write leaves file in valid state
- **Muses:** Hemlock (foundation: a healthy file is a testable file)

---

### Traceability Group

#### lineage-tracker.ts
- **Purpose:** Maintain full provenance chain across the 6-stage promotion pipeline
- **Principles:** P2 (transparent decisions), P3 (traceability makes the pipeline visible)
- **Stories:**
  - "Showing Your Work Is the Gift" — machine-readable form of explaining decisions
  - "Bidirectional Querying" — upstream (what made this?) and downstream (what did this make?)
  - "Dual-Strategy Matching" — handles partial records gracefully
  - "Cycle Prevention" — provenance chains must not loop
- **Tests:**
  - (tested in lineage-tracker.test.ts)
- **Muses:** Cedar ("I can see how everything connects. The mycelium is visible.")

---

## Principle Citation Matrix

How many times each principle is cited in the 23 modules:

| Principle | Primary Modules | Citation Count |
|-----------|----------------|---------------|
| P1 Separation of Concerns | sequence-recorder, feedback-bridge, session-observer, execution-capture, promotion-detector | 9+ |
| P2 Honest Uncertainty | sequence-recorder, rate-limiter, determinism-analyzer, promotion-gatekeeper | 7+ |
| P3 Pattern Visibility | pattern-analyzer, cluster-translator, pattern-summarizer | 6+ |
| P4 Sustainable Pace | retention-manager, rate-limiter, jsonl-compactor, session-observer | 8+ |
| P5 Learning Measurement | sequence-recorder, promotion-evaluator, drift-monitor, determinism-analyzer | 6+ |

All 5 principles cited 3+ times (minimum) — acceptance criterion met.

---

## Muse Voice Matrix

Which muses are cited in which modules:

| Muse | Role | Primary Modules | Citations |
|------|------|----------------|-----------|
| Lex | Clarity, build, execution | sequence-recorder, pattern-summarizer, cluster-translator, script-generator | 5+ |
| Sam | Coordination, pacing, integration | sequence-recorder-listener, session-observer, pattern-analyzer, routing-advisor, drift-monitor | 5+ |
| Willow | Translation, bridge-building, interfaces | transcript-parser, observation-squasher, cluster-translator | 4+ |
| Hemlock | Validation, rigor, foundation | execution-capture, rate-limiter, promotion-gatekeeper, jsonl-compactor, determinism-analyzer | 6+ |
| Cedar | Observation, connection, roots | photon-emitter, ephemeral-store, lineage-tracker | 3+ |
| Foxy | Creative direction, alive learning | sequence-recorder, promotion-evaluator, rate-limiter | 3+ |

All 6 muses mentioned 2+ times — acceptance criterion met.

---

## Test Suites → Principles Verified

| Test Suite | Principle | Tests Count | Key Assertions |
|-----------|-----------|------------|----------------|
| `separation-of-concerns.test.ts` | P1 | 12 | Two listeners never interfere; modules isolatable |
| `honest-uncertainty.test.ts` | P2 | 12 | 0.3 propagates; rejected observations explain themselves |
| `pattern-visibility.test.ts` | P3 | 12 | Creator's Arc visible; CSV auditable; translation deterministic |
| `sustainable-pace.test.ts` | P4 | 12 | Files bounded; lifecycle clean; load handled |
| `learning-measurement.test.ts` | P5 | 12 | Compression ratio correct; agents independent; feedback loop closes |

**Total: 52 passing tests** verifying the 5 design principles.

---

## Story References

Stories from CENTERCAMP-PERSONAL-JOURNAL embedded in the codebase:

| Story | Location | Principle | Modules |
|-------|----------|-----------|---------|
| The Two Listeners | feedback-bridge.ts (file docblock) | P1 | feedback-bridge, sequence-recorder |
| Creator's Arc | sequence-recorder.ts, pattern-analyzer.ts | P3, P5 | sequence-recorder, pattern-analyzer |
| Compression Tracking | sequence-recorder.ts | P5 | sequence-recorder |
| Showing Your Work Is the Gift | lineage-tracker.ts, promotion-gatekeeper.ts | P2 | lineage-tracker, gatekeeper |
| Check the Foundation | rate-limiter.ts, promotion-gatekeeper.ts | P2, P4 | rate-limiter, gatekeeper |
| Don't Ask Permission to Build Bridges | cluster-translator.ts | P3 | cluster-translator |
| Boring Is Reliable | retention-manager.ts, jsonl-compactor.ts | P4 | retention-manager, compactor |
| Batch 3 Phase 1 Wiring | sequence-recorder-listener.ts | P1 | listener |

---

## Architecture Guide Cross-References

| Guide | Principles Covered | Key Modules |
|-------|-------------------|-------------|
| `01-SIGNALS-FLOW.md` | P1, P2 | feedback-bridge, sequence-recorder, pattern-store |
| `02-WHY-WE-MEASURE.md` | P2, P3, P5 | pattern-analyzer, drift-monitor, lineage-tracker |
| `03-PRINCIPLES-IN-PRACTICE.md` | P1, P2, P3, P4, P5 | All 23 modules |

---

*Cedar sign-off: "All connections documented. The map is complete. Every module connects to a principle, every principle to a test, every test to a story."*
