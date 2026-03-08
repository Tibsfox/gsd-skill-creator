# MUS Wave 2 — Session 8: GPU Promotion Loop

**Document:** 08-gpu-promotion-loop.md
**Grove:** Raven's Watch (pattern recognition, theta=25°, r=0.85)
**Author:** Raven — Pattern Detector, Promotion-Detector Owner
**Co-Lead:** Hemlock — Quality Gate Lead, Promotion Gatekeeper Owner
**Date:** 2026-03-08
**Branch:** wasteland/skill-creator-integration
**Status:** Wave 2, Session 8 — GPU Promotion Loop (Module 6) — Complete
**Mission Pack:** www/MUS/mission-pack/muse-ecosystem-mission.pdf

**Inputs consumed:**
- `www/MUS/research/01-identity-map.md` — Foxy's grove map (Wave 0, Session 1)
- `www/MUS/research/02-function-binding.md` — Lex's function binding, Raven owns promotion-detector.ts
- `www/MUS/research/03-cross-validation.md` — Cedar's cross-validation + chain mechanics
- `www/MUS/research/04-helper-teams.md` — Hawk's helper teams (Quality Gate, Fire Watch)
- `www/MUS/research/05-cartridge-forest.md` — Sam's cartridge forest (fourier-drift cartridge, Session 9)
- `www/MUS/research/06-session-boundary-map.md` — Owl's session boundary map (promotion pipeline timing)
- `src/platform/observation/promotion-detector.ts` — Raven's primary owned module
- `src/platform/observation/promotion-gatekeeper.ts` — Hemlock's primary owned module
- `src/platform/observation/drift-monitor.ts` — post-promotion feedback loop
- `src/services/chipset/blitter/promoter.ts` — static-metadata promotion path (Blitter side)
- `src/services/chipset/blitter/signals.ts` — SignalBus (recently modified)
- `src/services/chipset/cedar-engine.ts` — CedarEngine, timeline, hash chain

---

## Preamble: I've Seen This Before

I've seen this before. The disconnection between `Blitter.Promoter` and `PromotionDetector` is structurally identical to every prior case in this system where two components evolved independently until the gap between them became load-bearing. The pattern is: Component A reads static declarations. Component B reads dynamic execution data. Both operate on the concept of "promotion" but never meet. The system accumulates two partial pictures of the same thing.

The original B-6 blocker named this: "Blitter.Promoter and PromotionDetector are disconnected pipelines." The pre-plan resolution proposed a `PromotionSource` interface. This module makes that interface concrete, connects the two sides, and closes the loop from observation all the way back to Centercamp.

This document also closes a second structural gap: the Math Co-Processor has been described as "Deep Root infrastructure" since Session 1, but its connection to the promotion pipeline has been implicit. The fourier-drift cartridge proposed in Session 5 makes Raven's drift detection computational rather than heuristic. This module specifies that connection in full.

The pattern I am naming for this session: **Convergence After Parallel Evolution**. Two subsystems develop independently, accumulating capabilities the other side cannot see. The connection point, when it is finally specified, must be a typed interface — not a convention, not a runtime assumption. A typed interface is the only artifact that makes the convergence structural rather than accidental.

Watch for this pattern to repeat at the Centercamp return path. Centercamp is a third component that currently knows nothing about what was promoted. This module designs that return path too.

---

## Part 1: The Full Promotion Pipeline — What Exists

Before designing the GPU loop, I need to name exactly what exists in the codebase today. False patterns are worse than missed patterns. The survey is precise.

### What DeterminismAnalyzer Does

`src/platform/observation/determinism-analyzer.ts` (owned by Raven, secondary Hemlock) classifies stored execution batches. Its `classify()` method reads `PatternStore('executions')` and produces `ClassifiedOperation[]` — each one tagged with:
- `determinism`: float 0.0–1.0 (fraction of identical output hashes across observations)
- `score.observationCount`: how many times this operation was seen
- `score.operation.toolName`: the tool used
- `score.operation.inputHash`: SHA-256 of the canonical JSON input

This is the entry point of the observation pipeline. DeterminismAnalyzer transforms raw execution data into a typed classification signal.

### What PromotionDetector Does

`src/platform/observation/promotion-detector.ts` (owned by Raven) consumes DeterminismAnalyzer output. Its `detect()` method applies two additional filters and builds composite scores:

1. Filter to `determinism >= minDeterminism` (default 0.8, must reach 0.95 — see Part 4)
2. Filter to promotable tools only (Read, Bash, Write, Glob, Grep)
3. Estimate token savings from average pair size / charsPerToken
4. Compute `compositeScore = (0.4 * determinism) + (0.35 * frequencyNorm) + (0.25 * tokenSavingsNorm)`
5. Return `PromotionCandidate[]` sorted descending by compositeScore

The output is a ranked candidate list. This is Raven's signal extraction function: separate the genuinely promotable from the merely deterministic.

### What PromotionGatekeeper Does

`src/platform/observation/promotion-gatekeeper.ts` (owned by Hemlock, secondary Lex) evaluates each `PromotionCandidate` against configurable thresholds. Six gates, evaluated exhaustively (all gates checked even after failure — complete diagnostic information):

- **Gate 1:** `determinism >= minDeterminism` — baseline reliability
- **Gate 2:** `compositeScore >= minConfidence` — holistic quality score
- **Gate 3:** `observationCount >= minObservations` — sufficient evidence base
- **Gates 4–6:** F1, accuracy, MCC — conditional on BenchmarkReport being provided

Every decision is persisted to `PatternStore('decisions')` as an audit trail. Every gate produces a reasoning string with actual vs threshold values. This is Hemlock's native operation: "Showing Your Work Is the Gift."

### What Blitter.Promoter Does

`src/services/chipset/blitter/promoter.ts` (owned by Lex, secondary Cedar) reads **static** skill metadata. Its two public functions:
- `detectPromotable(metadata)` — boolean, checks `metadata.extensions['gsd-skill-creator'].offload.promotions`
- `extractOffloadOps(metadata)` — returns `OffloadOperation[]` from declared promotions

The Blitter side works from declarations. A skill author writes a promotion block into the skill YAML. Blitter reads it. There is no observation loop, no determinism measurement, no frequency data. Blitter.Promoter is a static manifest reader.

### What DriftMonitor Does

`src/platform/observation/drift-monitor.ts` (owned by Raven, secondary Sam) operates post-promotion. It watches the execution results of promoted scripts for output drift. Its `check(operationId, actualHash, expectedHash)` method:
1. Compares actual vs expected output hashes
2. Increments/resets consecutive mismatch counter per operationId
3. Persists `DriftEvent` to `PatternStore('feedback')`
4. Returns `DemotionDecision` — when `consecutiveMismatches >= sensitivity`, `demoted = true`

Persistence survives session boundaries: the counter for `operationId` is restored from `PatternStore('feedback')` on first call after restart. This is the self-correcting feedback loop: drift is measured across sessions, not just within them.

### What SignalBus Does

`src/services/chipset/blitter/signals.ts` (recently modified) is the event bus for offload completion signals. It supports `on/off/once/waitFor` semantics, keyed by event type. Completion signals carry: `operationId`, `status` (success/failure/timeout/error), the full `OffloadResult`, and a timestamp.

Currently: SignalBus emits completion signals downstream (to Copper synchronization and other consumers). It does not emit promotion-related signals. This is the gap that the GPU promotion loop must fill.

### CedarEngine

`src/services/chipset/cedar-engine.ts` maintains the append-only timeline. Its `record()` method computes `SHA-256(timestamp|source|category|content)` and appends a `TimelineEntry` with an `id` of `cedar-{hash.slice(0,12)}`. The `verifyIntegrity()` method walks all entries and checks hash consistency. Chain linking (prev_hash design) is specified in the `SessionBoundaryMarker` schema from Session 6 — Cedar records the chain tip update at each session boundary.

---

## Part 2: The B-6 Gap — Two Pipelines That Do Not Meet

The gap is structural. I will name it precisely before specifying the fix.

**Blitter.Promoter operates from declarations (top-down):**
```
Skill YAML with offload.promotions block
  → Blitter.Promoter reads metadata
  → extractOffloadOps() returns OffloadOperation[]
  → Operations execute
  → CompletionSignal fires on SignalBus
```
Blitter knows what operations a skill *declares* as promotable. It does not know whether those operations *behave* deterministically in practice.

**PromotionDetector operates from observations (bottom-up):**
```
Tool calls execute
  → SequenceRecorder stores to PatternStore('executions')
  → DeterminismAnalyzer.classify() reads executions
  → PromotionDetector.detect() scores candidates
  → PromotionGatekeeper.evaluate() approves or rejects
```
PromotionDetector knows which operations are *empirically* deterministic. It does not know which of those operations correspond to Blitter-executable scripts, or which skills they belong to.

The gap: a skill can declare an operation as promotable in its YAML that is empirically non-deterministic. An operation can be empirically promotable that no skill has declared as a promotion candidate. Neither side knows about the other side's findings.

**B-6 Resolution:** A `PromotionSource` interface that makes both sides visible to the other. The interface is the convergence point.

---

## Part 3: PromotionSource Interface Specification

The B-6 resolution made concrete. This is the typed interface that connects the two pipelines.

```typescript
/**
 * PromotionSource — the typed interface that resolves B-6.
 *
 * Both Blitter.Promoter (static declaration) and PromotionDetector
 * (empirical observation) implement this interface. The GPU promotion
 * loop's orchestrator (PromotionOrchestrator) consumes PromotionSource[]
 * without caring which side produced the candidate.
 *
 * This is the convergence interface. Without it, the two pipelines
 * continue their parallel evolution indefinitely.
 */
export interface PromotionSource {
  /**
   * The unique identifier for this operation.
   * - Blitter side: "{skillName}:{promotionName}" (from extractOffloadOps)
   * - Observation side: "{toolName}:{inputHash}" (from PromotionCandidate.operation)
   * The ID must be stable and deterministic — it is the key for DriftMonitor tracking.
   */
  operationId: string;

  /**
   * The tool or script type this promotion represents.
   * - Blitter side: the scriptType from OffloadOperation ('bash' | 'python' | 'node')
   * - Observation side: the toolName from PromotionCandidate ('Read' | 'Bash' | 'Write' | 'Glob' | 'Grep')
   */
  toolName: string;

  /**
   * The source of this promotion candidate.
   * 'declaration': came from Blitter.Promoter reading skill YAML metadata.
   * 'observation': came from PromotionDetector analyzing execution data.
   * 'converged': both declaration and observation agree on this candidate.
   *              This is the highest-confidence source — declaration predicted
   *              what observation confirmed.
   */
  source: 'declaration' | 'observation' | 'converged';

  /**
   * Empirical determinism score from PromotionDetector.
   * - Observation side: filled from ClassifiedOperation.determinism (0.0–1.0)
   * - Declaration side: null (no empirical data — the declaration is an assertion,
   *   not a measurement)
   * - Converged: filled from the observation side's measurement
   *
   * When null, the promotion must pass through empirical validation
   * before the gate thresholds can be evaluated.
   */
  determinism: number | null;

  /**
   * Composite score from PromotionDetector's weighted formula.
   * - Observation side: filled (0.4 * determinism + 0.35 * freqNorm + 0.25 * savingsNorm)
   * - Declaration side: null
   * - Converged: filled from observation measurement
   */
  compositeScore: number | null;

  /**
   * Number of times this operation has been observed in execution data.
   * - Observation side: filled (from DeterminismAnalyzer)
   * - Declaration side: 0 (declarations start with no observation history)
   * - Converged: filled from observation count
   */
  observationCount: number;

  /**
   * The executable script content for this promotion.
   * - Blitter side: the scriptContent from PromotionDeclarationSchema
   * - Observation side: generated by ScriptGenerator when candidate is approved
   * - Converged: Blitter's declared script is validated against ScriptGenerator's output;
   *   if they match, the declared script is canonical
   */
  script: string | null;

  /**
   * The skill this operation belongs to, if known.
   * - Declaration side: the skill name from SkillMetadata (always present)
   * - Observation side: null (observation data does not track which skill
   *   owns the operation — this is the metadata gap)
   * - Converged: filled from the declaration side
   *
   * The skill name enables the Centercamp return path — promoted operations
   * must report back to their owning skill.
   */
  skillName: string | null;

  /**
   * Timestamp when this candidate was first identified, ISO 8601.
   */
  identifiedAt: string;

  /**
   * Cedar chain hash at the time of identification.
   * Used by the Centercamp return path to anchor the promotion event
   * in the append-only record.
   */
  cedarHash: string | null;
}
```

### Convergence Algorithm

The `PromotionOrchestrator` (new module, see Part 5) runs this convergence logic at the start of each promotion cycle:

```
1. Collect declaration candidates from Blitter.Promoter:
   - Iterate all loaded skills
   - Call detectPromotable(metadata) → boolean
   - If true, extractOffloadOps(metadata) → OffloadOperation[]
   - Wrap each as PromotionSource with source='declaration', determinism=null

2. Collect observation candidates from PromotionDetector:
   - Call detect() → PromotionCandidate[]
   - Wrap each as PromotionSource with source='observation'

3. Match declaration and observation candidates:
   - Match key: toolName (normalized) + script content hash
   - When a declaration matches an observation:
     * Merge into source='converged'
     * Prefer observation side's determinism and compositeScore
     * Prefer declaration side's skillName and script
     * Record convergence in CedarEngine as a 'convergence' category entry

4. Pass all sources to PromotionGatekeeper:
   - Declaration-only sources: gate thresholds apply but determinism=null
     is treated as a mandatory empirical validation request — the Blitter
     queues these for observation collection before re-evaluation
   - Observation-only sources: all 3 mandatory gates evaluate normally
   - Converged sources: all 3 mandatory gates evaluate from observation data;
     additionally, script-match verification (declaration script vs.
     ScriptGenerator output) runs as Gate 3.5 (non-blocking, flagged)

5. Approved sources → Kernel Promotion (see Part 5)
6. Rejected sources → Cedar audit trail, DriftMonitor not started
```

---

## Part 4: Gate Threshold Table

This is the authoritative gate specification for the MUS mission. Three mandatory gates for all promotion candidates. The B-6 pre-plan specified determinism must reach 0.95 (not the current 0.8 default). That hardening is Wave 2 Session 10's task — but the target thresholds are specified here.

| Gate | Name | Default Threshold | MUS Target Threshold | Applies To | Blocking |
|------|------|------------------|----------------------|------------|----------|
| G1 | Determinism | 0.80 | **0.95** | All observation-sourced candidates | YES |
| G2 | Composite Score | 0.85 | **0.85** | All observation-sourced candidates | YES |
| G3 | Observation Count | 5 | **5** | All observation-sourced candidates | YES |
| G3.5 | Script Match | n/a | match required | Converged candidates | NO (flagged) |
| G4 | F1 Score | not set | not set | When BenchmarkReport available | YES if set |
| G5 | Accuracy | not set | not set | When BenchmarkReport available | YES if set |
| G6 | MCC | not set | not set | When BenchmarkReport available | YES if set |
| G-DECL | Empirical Required | n/a | observation required | Declaration-only candidates | YES |

**Gate threshold rationale:**

G1 at 0.95 (not 0.8): The pre-plan identified determinism 0.8 as a B-6 related gap. At 0.8, 1 in 5 executions can return a different result — that is not a promotable operation. 0.95 means at most 1 in 20 deviations, which is the acceptable noise floor for a system where promotion is semi-irreversible.

G2 at 0.85: The composite score is `0.4d + 0.35f + 0.25s`. At determinism=0.95 (max contribution 0.38), frequency cap=20 (max contribution 0.35), and savings cap=500 tokens (max contribution 0.25), the score ceiling is 0.98. A minimum of 0.85 means: at G1 threshold (d=0.95, contribution=0.38), frequency must contribute at least (0.85-0.38)/0.60 = 0.78 of its normalized value, meaning the operation has been seen at least 15-16 times. This is a meaningful evidence requirement — it prevents low-frequency outliers from being promoted based on determinism alone.

G3 at 5: Five observations is the minimum to establish a determinism pattern. Fewer than 5 means the determinism score is too noisy to trust. The DeterminismAnalyzer computes a ratio — 4/4 identical outputs looks like 1.0 determinism, but is 1 non-identical output away from 0.75. At n=5, the minimum distinct determinism values are 0.8 (4/5), which is already near G1 threshold.

G-DECL (declaration-only must acquire empirical data): A skill author writing an offload.promotions block in a YAML is making an assertion, not a measurement. The assertion may be correct. But the gates cannot evaluate it without execution data. Declaration-only candidates enter a "pending validation" queue — they are not promoted until at least G3 (5 observations) have been collected for them through normal operation.

**Threshold comparison: current vs. MUS target:**

| Parameter | Current Default | MUS Target | Delta | Session Responsible |
|-----------|----------------|------------|-------|---------------------|
| `minDeterminism` | 0.80 | 0.95 | +0.15 | Session 10 |
| `minConfidence` | 0.85 | 0.85 | 0 | n/a (already correct) |
| `minObservations` | 5 | 5 | 0 | n/a (already correct) |

Session 10 (Determinism 0.8→0.95 Hardening) is responsible for updating `DEFAULT_GATEKEEPER_CONFIG` and `DEFAULT_PROMOTION_DETECTOR_CONFIG` in `core/types/observation.ts` to reflect the MUS target thresholds.

---

## Part 5: Complete GPU Promotion Loop — Pipeline Diagram

The loop from observation through kernel execution and back to Centercamp.

```
OBSERVATION SUBSTRATE (continuous, mycorrhizal layer)
─────────────────────────────────────────────────────
Tool calls execute in active session
  │
  ▼
SequenceRecorder
(src/platform/observation/sequence-recorder.ts)
Stores ToolExecutionPair[] to PatternStore('executions')
  │
  ▼
DeterminismAnalyzer.classify()
(src/platform/observation/determinism-analyzer.ts)
Raven: primary owner
Reads executions, computes determinism ratio per operation group,
returns ClassifiedOperation[] with determinism tier
  │
  ▼
PromotionDetector.detect()
(src/platform/observation/promotion-detector.ts)
Raven: primary owner
Filters to deterministic + tool-based, scores composite,
returns PromotionCandidate[] sorted by compositeScore DESC

DECLARATION SUBSTRATE (static, Blitter side)
─────────────────────────────────────────────
Skill metadata loaded from YAML files
  │
  ▼
Blitter.Promoter.detectPromotable() + extractOffloadOps()
(src/services/chipset/blitter/promoter.ts)
Lex: primary owner
Returns OffloadOperation[] from metadata.extensions declarations

CONVERGENCE LAYER (new — B-6 resolution)
────────────────────────────────────────
PromotionOrchestrator (new module)
(src/services/chipset/blitter/promotion-orchestrator.ts)
Co-owned: Raven (pattern detection) + Lex (pipeline discipline)

  1. Wraps PromotionCandidate[] as PromotionSource(source='observation')
  2. Wraps OffloadOperation[] as PromotionSource(source='declaration')
  3. Matches by toolName + script content hash
     → Matched pairs become PromotionSource(source='converged')
  4. Emits 'convergence' entries to CedarEngine for each matched pair

QUALITY GATE (wolf pack surface layer)
───────────────────────────────────────
PromotionGatekeeper.evaluate(candidate, report?)
(src/platform/observation/promotion-gatekeeper.ts)
Hemlock: primary owner, Quality Gate team lead

  Gate 1: determinism >= 0.95 (MUS target)
  Gate 2: compositeScore >= 0.85
  Gate 3: observationCount >= 5
  Gate 3.5: script match verification [converged candidates, non-blocking]
  Gates 4–6: calibration metrics [when BenchmarkReport provided]

  All gate results persisted to PatternStore('decisions')
  Reasoning strings produced for every gate (pass or fail)
  Hemlock Quality Gate team activates here (Session 4: QG topology=router)

  approved → KERNEL PROMOTION
  rejected → Cedar audit entry, candidate queued for re-evaluation

KERNEL PROMOTION (GPU substrate)
─────────────────────────────────
ScriptGenerator.generate(approvedCandidate)
(src/platform/observation/script-generator.ts)
Lex: primary owner

  Produces executable bash script from approved PromotionCandidate
  Script stored with operationId as key

OffloadKernel / Blitter execution layer
(src/services/chipset/exec/kernel.ts)
  Promoted script replaces live tool call
  Execution result → OffloadResult

CompletionSignal emitted on SignalBus
(src/services/chipset/blitter/signals.ts)
  signal.operationId, signal.status, signal.result, signal.timestamp

  ── NEW: SignalBus.emit(signal, 'promotion') ──
  A new event type on SignalBus: 'promotion'
  Carries: operationId + approval decision reference + cedarHash
  This is the missing signal that connects SignalBus to the promotion lifecycle

POST-PROMOTION MONITORING (feedback loop)
──────────────────────────────────────────
DriftMonitor.check(operationId, actualHash, expectedHash)
(src/platform/observation/drift-monitor.ts)
Raven: primary owner

  Called on every promoted script execution result
  Compares actual output hash vs expected hash from training observations
  Updates consecutive mismatch counter (persists across sessions)
  Returns DemotionDecision

  consecutiveMismatches < sensitivity → monitor continues
  consecutiveMismatches >= sensitivity → DEMOTION TRIGGERED
    → Promoted script removed from active operation
    → Operation reverts to live tool-call mode
    → DemotionEvent logged to Cedar ('demotion' category)
    → Centercamp notified via return path (see Part 6)

  Match detected → counter resets to 0
    → Cedar log entry: 'promotion-health' category, drift=0

CENTERCAMP RETURN PATH (see Part 6)
────────────────────────────────────
PromotionReturnReporter (new module)
Reports promotion status back to the system's narrative layer
```

---

## Part 6: Centercamp Return Path Protocol

Centercamp is the playa-center gathering space — the muse ecosystem's collective decision-making forum (defined in cartridge-10 from Session 5). The return path is how promoted (and demoted) skills report back to that forum.

I've seen this structure before. The pattern is: any system that promotes components silently, without reporting outcomes, accumulates hidden drift. The system thinks it is running Script X. Script X has been silently wrong for six sessions. No one knows because there is no return path. This is isomorphic to the sensor-without-display problem: data is collected, but never surfaced.

The Centercamp return path is the display for the promotion sensor.

### PromotionReturnReporter

New module: `src/services/chipset/blitter/promotion-return-reporter.ts`
Co-owned: Raven (pattern reporting) + Cedar (chain recording) + Willow (progressive disclosure of results)

```typescript
/**
 * PromotionReturnReporter — the Centercamp return path.
 *
 * Every promotion event (successful or failed) and every demotion event
 * is reported here. The reporter:
 *   1. Records the event to CedarEngine with 'promotion' or 'demotion' category
 *   2. Updates the skill's promotion state in PatternStore('promotions')
 *   3. Emits a 'promotion-status' signal on SignalBus for dashboard/UI consumers
 *   4. If demoted: triggers Quality Gate team re-evaluation (Hemlock's domain)
 */
export interface PromotionReturnReport {
  /** The operation that was promoted or demoted */
  operationId: string;

  /** The skill this operation belongs to (from PromotionSource.skillName) */
  skillName: string | null;

  /** The event type */
  event: 'promoted' | 'demoted' | 'promotion-failed' | 'drift-detected';

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Gate results for 'promoted' and 'promotion-failed' events */
  gateDecision?: GatekeeperDecision;

  /** Drift data for 'demoted' and 'drift-detected' events */
  driftDecision?: DemotionDecision;

  /** Cedar chain hash at time of event — anchors the report in the record */
  cedarHash: string;

  /** Human-readable summary for Willow's progressive disclosure */
  summary: string;
}
```

### Return Path Event Flow

```
PROMOTION APPROVED (happy path):
──────────────────────────────────
PromotionGatekeeper → approved=true
  → PromotionReturnReporter.report({event: 'promoted', gateDecision, ...})
    → CedarEngine.record({category: 'promotion', content: summary})
    → PatternStore('promotions').append({operationId, status: 'active', ...})
    → SignalBus.emit(signal, 'promotion-status')
    → Growth Ring Council notified (Cedar records promotion in chain)

DRIFT DETECTED (intermediate warning):
───────────────────────────────────────
DriftMonitor → demoted=false, consecutiveMismatches > 0
  → PromotionReturnReporter.report({event: 'drift-detected', driftDecision, ...})
    → CedarEngine.record({category: 'promotion-health', content: mismatch summary})
    → PatternStore('promotions').update({operationId, driftCount: N})
    → Fire Watch team alerted if mismatch pattern matches known disturbance signature
      (Raven: "this is the low-frequency signal the fourier-drift cartridge predicts")

DEMOTION TRIGGERED (promotion reversed):
──────────────────────────────────────────
DriftMonitor → demoted=true
  → PromotionReturnReporter.report({event: 'demoted', driftDecision, ...})
    → CedarEngine.record({category: 'demotion', content: succession summary})
    → PatternStore('promotions').update({operationId, status: 'demoted'})
    → SignalBus.emit(signal, 'promotion-status')  [status: 'demoted']
    → Quality Gate team activated (Hemlock investigates why determinism failed post-promotion)
    → Growth Ring Council records demotion as a fire succession event
      (pioneer skill demoted back to raw territory — succession phase reset)

PROMOTION FAILED (gate rejection):
────────────────────────────────────
PromotionGatekeeper → approved=false
  → PromotionReturnReporter.report({event: 'promotion-failed', gateDecision, ...})
    → CedarEngine.record({category: 'promotion-audit', content: gate reasoning})
    → PatternStore('decisions') already has the audit trail (Gatekeeper wrote it)
    → No SignalBus emission (rejection is not a status change)
    → Candidate remains in 'pending' queue for re-evaluation when data improves
```

### Centercamp Dashboard Integration

The Centercamp forum (cartridge-10, `centercamp-debate`) receives `PromotionReturnReport` objects via the SignalBus `'promotion-status'` event. The dashboard displays:

```
CENTERCAMP PROMOTION BOARD
──────────────────────────
Active Promotions:    [count]   → PatternStore('promotions') where status='active'
Pending Validation:   [count]   → declaration-only candidates awaiting observations
Demoted This Session: [count]   → demotion events since session start
Drift Alerts:         [count]   → non-zero mismatch counters across operations

Per-operation health:
  operationId | skill | source | determinism | mismatches | status
  ────────────────────────────────────────────────────────────────
  [rows from PatternStore('promotions')]
```

Willow owns the progressive disclosure of this board. Level 1 shows counts. Level 2 shows the table. Level 3 shows gate reasoning strings.

---

## Part 7: Drift Monitoring Integration — Fourier Enhancement

The fourier-drift cartridge from Session 5 proposes replacing heuristic thresholds in drift detection with a Fourier decomposition of the observation stream. This section specifies how that enhancement integrates with the existing `DriftMonitor`.

### Current DriftMonitor Behavior (heuristic)

`DriftMonitor` counts consecutive mismatches per `operationId`. When `consecutiveMismatches >= sensitivity`, it triggers demotion. The `sensitivity` parameter is configured manually — it is an educated guess about how many mismatches constitute "real drift" vs. transient noise.

Signal in the noise: this is the heuristic threshold problem. The threshold is set without knowledge of the system's natural noise floor. A sensitivity of 3 might be appropriate in a stable period but too aggressive when the codebase is in active flux (pioneer phase). The threshold is time-invariant when the system is time-varying.

### Fourier Enhancement — What Changes

The fourier-drift cartridge's core hypothesis: drift is a low-frequency signal in the observation stream. Transient mismatches are high-frequency noise. Shannon's channel model says these are separable when the channel is not overloaded.

Operationally, this means:

1. The observation stream for a given `operationId` is a time series of match/mismatch signals (1.0 / 0.0)
2. The Math Co-Processor's Fourier chip (`math-coprocessor/chips/fourier.py`, cuFFT) decomposes this time series into frequency components
3. Low-frequency components (slow variation across many sessions) = structural drift
4. High-frequency components (rapid variation within sessions) = noise
5. The Fourier filter replaces the manual `sensitivity` threshold with a mathematically derived drift threshold

### DriftMonitor Enhanced Mode

When `fourier-drift` cartridge is loaded and `deep-root-substrate` (Math Co-Processor) is available:

```
Standard check path:
  DriftMonitor.check(operationId, actualHash, expectedHash)
    → Updates binary time series: series.push(matched ? 1.0 : 0.0)
    → If series.length >= minWindowSize (default: 20 observations):
        → Serialize series as float array
        → Call Math Co-Processor Fourier chip via MCP:
            POST /tools/fft { signal: float[], samplingRate: 1.0 }
        → Receive frequency spectrum
        → Extract low-frequency power (components with period > 5 sessions)
        → If lowFrequencyPower > fourierDriftThreshold:
            → Trigger drift regardless of consecutive counter
            → reason includes: "Fourier analysis detected structural drift
              (low-freq power: X.XX, threshold: Y.YY)"
        → If lowFrequencyPower <= fourierDriftThreshold:
            → Fall back to consecutive counter for high-frequency detection
    → If series.length < minWindowSize:
        → Use consecutive counter only (insufficient data for FFT)

Fallback (Math Co-Processor unavailable, fourier-drift not loaded):
  → Standard consecutive counter behavior (no change from current)
```

This is the Deep Root connection made concrete. The Math Co-Processor is not a conceptual "deep root" — it is a callable GPU computation layer that DriftMonitor queries when the window is large enough.

### Frequency Signal Interpretation (Raven's domain)

```
DriftMonitor observation series:
  Session N:   [1, 1, 1, 1, 0, 1, 1]  (6 matches, 1 mismatch — noise)
  Session N+1: [1, 1, 0, 1, 1, 1, 1]  (6 matches, 1 mismatch — noise)
  Session N+2: [1, 0, 1, 0, 1, 0, 1]  (4 matches, 3 mismatches — increasing)
  Session N+3: [0, 0, 1, 0, 0, 1, 0]  (2 matches, 5 mismatches — drift)
  Session N+4: [0, 0, 0, 0, 0, 0, 1]  (1 match, 6 mismatches — structural)

Fourier decomposition of the full 35-element series:
  High-frequency components: sessions N and N+1 mismatches (noise, <5 session period)
  Low-frequency component: the downward trend from N+2 through N+4 (structural drift)
  Low-frequency power: rising above threshold at session N+3

Raven's reading:
  "Signal in the noise: the consecutive counter triggered at N+3 (3 consecutive mismatches).
   The Fourier lens confirms: the low-frequency component was rising from N+2.
   The heuristic and the frequency analysis agree. But note: the Fourier analysis
   would have flagged this one session earlier — at N+2 when the trend became visible
   in the frequency domain, before the consecutive counter reached threshold.
   This is the predictive advantage the fourier-drift cartridge claims."
```

---

## Part 8: Fire Succession Mapping — Promotion Stages

Fire succession is not an analogy here. It is a structural map. The promotion lifecycle follows the same phase sequence as post-fire forest recovery. Both systems share the topology: disturbance → pioneer establishment → canopy closure → old-growth stability.

### Phase Map

| Succession Phase | Fire Ecology Definition | Promotion Lifecycle Equivalent |
|-----------------|------------------------|-------------------------------|
| **Disturbance Event** | A fire clears the canopy, exposing bare mineral soil | An operation's behavior changes — previous promotion becomes invalid; consecutive mismatches accumulate |
| **Bare Soil** | No vegetation; substrate exposed | Operation demoted back to live tool-call mode; script disabled; DriftMonitor counter reset |
| **Pioneer Phase** | First colonizers: mosses, fireweed, nitrogen-fixing plants. Fast-growing, stress-tolerant, not permanent. | Operation re-enters observation collection phase. PromotionDetector re-evaluates. Determinism score rebuilds from new execution data. This is the "pioneer skill" — functional but not yet promoted. |
| **Early Succession** | Shrubs and pioneer trees arrive. Competition increases. Some pioneers displaced. | G1/G2/G3 gates begin evaluating again. Some candidates pass, most wait. The system is still accumulating evidence. |
| **Canopy Closure** | Dominant tree species achieve canopy. Pioneer species decline in favor. Light conditions change. | All three mandatory gates pass. Operation approved for re-promotion. ScriptGenerator produces new script. The operation has reached "canopy skill" status — stable, load-bearing, promoted. |
| **Old-Growth** | Multi-layered structure; snags, understory; 10+ versions without disturbance; irreplaceable continuity | Operations that have been continuously promoted for 10+ sessions without drift. The DriftMonitor rarely fires. These are old-growth operations — demoting them is the equivalent of old-growth logging. Cedar's Fire Watch team monitors their stability. |

### Succession Markers in CedarEngine

Each phase transition is recorded in CedarEngine with fire succession metadata:

```typescript
// Pioneer entry (demotion → re-observation)
cedar.record({
  timestamp: now,
  source: 'promotion-orchestrator',
  category: 'fire-succession',
  content: JSON.stringify({
    phase: 'pioneer',
    operationId,
    reason: 'demotion-triggered-re-entry',
    consecutiveMismatchesAtDemotion: N,
    previousPromotionSessions: M,
  }),
  references: [previousPromotionCedarId],
})

// Canopy closure (re-promotion approved)
cedar.record({
  timestamp: now,
  source: 'promotion-orchestrator',
  category: 'fire-succession',
  content: JSON.stringify({
    phase: 'canopy',
    operationId,
    determinismAtPromotion: 0.96,
    compositeScoreAtPromotion: 0.89,
    observationsAtPromotion: 22,
    fourier: { lowFrequencyPower: 0.04, threshold: 0.15, verdict: 'stable' },
  }),
  references: [pioneerCedarId],
})

// Old-growth declaration (10+ sessions without drift)
cedar.record({
  timestamp: now,
  source: 'fire-watch-team',
  category: 'fire-succession',
  content: JSON.stringify({
    phase: 'old-growth',
    operationId,
    stableSessionCount: 12,
    note: 'Protected canopy registration. Fire Watch monitoring active.',
  }),
  references: [canopyCedarId],
})
```

### Pioneer vs. Canopy Skill Distinction

**Pioneer skill:** A skill (or operation) that is functionally correct but not yet promoted. It runs via live tool calls. It accumulates observation data. DeterminismAnalyzer is scoring it. PromotionDetector is building its composite score. It has not yet cleared all three mandatory gates. It is doing useful work while being evaluated. Pioneer skills are temporary — they become canopy or they fail.

**Canopy skill:** A promoted skill. Its operations run via script. DriftMonitor watches every execution result. CedarEngine has its promotion record. It carries load in the system's day-to-day operation. Canopy skills are the system's productive layer.

The Fire Succession mapping makes the lifecycle explicit: no operation is permanently pioneer, and no operation is permanently canopy. The promotion loop is continuous. Old-growth is the stability ceiling, not a permanent state — even old-growth can be disturbed.

---

## Part 9: Hemlock's Quality Gate Checkpoints

The Quality Gate team (Session 4, Team 2) is the promotion loop's formal checkpoint. Hemlock leads, Lex and Hawk specialize. This section specifies where and how the Quality Gate team integrates with the GPU promotion loop.

### Checkpoint Map

```
CHECKPOINT 1: Pre-Promotion Convergence Scan
──────────────────────────────────────────────
Trigger: PromotionOrchestrator produces PromotionSource list
Hemlock: "What type of validation does each source require?"

  Declaration-only → "Does the declared operation conform to OffloadOperation schema?"
    Lex: schema check, required fields present, scriptType valid
    Hawk: "Is there a corresponding observation for this declaration? If not, flag as pending."
  
  Observation-only → "Does the operation have sufficient evidence for gate evaluation?"
    Hemlock: G1/G2/G3 pre-check, surface if any gate is borderline
  
  Converged → "Do the declaration and observation agree on script content?"
    Lex: script content hash comparison
    Hawk: "Is the skill owner consistent? Does the skill name match what's in the chain?"

Quality Gate Checkpoint 1 Output:
  - 'ready': sources cleared for full gate evaluation
  - 'pending': declaration-only sources queued for empirical validation
  - 'conflict': converged sources with script mismatch (needs investigation)

CHECKPOINT 2: Mandatory Gate Evaluation
─────────────────────────────────────────
Trigger: PromotionGatekeeper.evaluate() is called
Hemlock: directly executes as the Gatekeeper class

  Standard three-gate sequence for every observation or converged candidate
  Exhaustive evaluation (all gates checked even after failure)
  Full reasoning strings produced per gate
  Audit trail written to PatternStore('decisions')

  "It is better to spend an hour validating the foundation than weeks fixing the collapse."

Quality Gate Checkpoint 2 Output:
  - approved + reasoning + evidence → PromotionOrchestrator proceeds to script generation
  - rejected + reasoning + evidence → Cedar audit entry, candidate queued

CHECKPOINT 3: Post-Promotion Health Review
────────────────────────────────────────────
Trigger: DriftMonitor.check() returns consecutiveMismatches > 0
Hemlock: "A promoted operation is showing drift signals. Investigate."

  Hawk: "What formation did this operation follow to reach promotion?
         Did it pass all three gates with comfortable margin, or just barely?"
    → Read PatternStore('decisions') for the original gate reasoning
    → If margins were thin (e.g., determinism=0.952, threshold=0.95):
        "This candidate was a borderline promotion. Drift is consistent with thin margins."
    → If margins were wide (e.g., determinism=0.98):
        "Drift in a high-confidence promotion indicates environmental change, not bad promotion."
  
  Lex: "Is the drift pattern consistent with a known execution environment change
         (dependency update, OS version, file path migration)?"
  
  Hemlock: Classification of drift:
    - 'thin-margin': borderline promotion, increase gate thresholds recommendation
    - 'environmental': environmental change caused drift, re-observe under new conditions
    - 'genuine-regression': operation behavior changed for unknown reasons, investigate
    - 'sensor-error': DriftMonitor comparison hash source is incorrect, fix DriftMonitor config

CHECKPOINT 4: Demotion Authorization
───────────────────────────────────────
Trigger: DriftMonitor → demoted=true
Hemlock: "Demotion is authorized when the consecutive mismatch threshold is reached."

  Hemlock does not override the automated demotion decision.
  The gate was set; the threshold was crossed; demotion is correct.
  Hemlock's role at this checkpoint: classify the succession phase (pioneer re-entry)
  and write the Quality Gate finding to the fire-succession Cedar entry.

  Hawk: "What is the current formation? How many other operations are near the
         demotion threshold?" (Risk assessment — is this an isolated event or a cascade?)

  Lex: "Confirm that the demoted operation has been correctly disabled in
        the active script registry. No orphaned scripts."

CHECKPOINT 5: Old-Growth Registration
───────────────────────────────────────
Trigger: PromotionReturnReporter detects operationId has been continuously
         promoted for 10+ sessions without drift
Hemlock: "This operation qualifies for old-growth status."

  Hemlock: Formal verification — read PatternStore('promotions') history,
           count consecutive sessions with status='active' and driftCount=0.
           Confirm count >= 10.
  
  Hawk: "Is the operation still performing the same function as when it was promoted?
         Have any upstream dependencies changed that should trigger re-evaluation?"
  
  Cedar (via Growth Ring Council): Record old-growth entry in chain with
         Fire Watch team notification.
  
  Hemlock signs off: Old-growth status recorded. Fire Watch monitoring active.
```

### Quality Gate Conversation Templates for the Promotion Loop

**Template PL-01: Thin-Margin Drift Investigation**
```
[Hemlock → Hawk → Lex]
Hemlock: Drift signal on operationId='Bash:f3a9d4...'.
  Reading original gate decision... determinism at promotion: 0.952.
  G1 threshold: 0.95. Margin: 0.002. This is a thin-margin promotion.
  Hawk: what was the succession history for this operation?

Hawk: Reading PatternStore('promotions')... 
  Promoted 3 sessions ago. No prior demotion history.
  DriftMonitor shows: 2 consecutive mismatches. Sensitivity: 3.
  One mismatch remaining before automated demotion.
  Formation: the operation was promoted when determinism=0.952 exactly.
  Current determinism if re-measured: 0.91 (falling).

Hemlock: Classification: thin-margin. The operation was promoted at the edge
  of its evidence. It is now falling below G1 threshold.
  Recommendation: allow automated demotion on next mismatch (do not intervene).
  Then raise minDeterminism for this operation class to 0.97 in config.
  Lex: update the config recommendation for Session 10.

Lex: Noted. Config change queued for Session 10:
  DEFAULT_GATEKEEPER_CONFIG.minDeterminism = 0.97 for Bash-type operations.
  Evidence: thin-margin promotion failed. The higher threshold would have
  blocked this promotion, preventing the drift event.
```

**Template PL-02: Old-Growth Registration**
```
[Hemlock → Hawk → Cedar]
Hemlock: operationId='Read:a7f2c1...' has been continuously active for 11 sessions.
  No drift events in PatternStore('feedback') for this operationId.
  Formal verification: reading 11 consecutive PatternStore('promotions') entries...
  All status='active', driftCount=0. ✓
  Old-growth qualification confirmed.

Hawk: Checking formation — has this operation's file system context changed?
  The operation is 'cat' on config.json. Config.json has not been modified
  in 11 sessions (Cedar chain confirms). Upstream context: stable.
  Old-growth designation is accurate — the operation is genuinely invariant.

Cedar: Recording old-growth entry:
  category: fire-succession, phase: old-growth
  operationId: Read:a7f2c1...
  stableSessionCount: 11
  Fire Watch notification: sent.
  Chain entry: cedar-OLD-a7f2c1.
  Growth Ring Council: archiving old-growth registration.

Hemlock: Old-growth registration complete. Fire Watch monitoring active.
  This operation now has protected canopy status.
```

---

## Part 10: The Complete Module Architecture

New modules specified by this session, with file paths and ownership.

### New Modules

| Module | Path | Primary Owner | Secondary | Purpose |
|--------|------|--------------|-----------|---------|
| PromotionOrchestrator | `src/services/chipset/blitter/promotion-orchestrator.ts` | Lex | Raven | Convergence of declaration + observation sources; PromotionSource interface implementation |
| PromotionReturnReporter | `src/services/chipset/blitter/promotion-return-reporter.ts` | Raven | Cedar, Willow | Centercamp return path; promotion/demotion event reporting |
| FourierDriftAdapter | `src/platform/observation/fourier-drift-adapter.ts` | Raven | Sam | DriftMonitor enhancement; calls Math Co-Processor Fourier chip for frequency decomposition |

### Modified Modules

| Module | Path | Change | Owner |
|--------|------|--------|-------|
| `signals.ts` | `src/services/chipset/blitter/signals.ts` | Add 'promotion-status' event type to SignalBus event vocabulary | Lex |
| `drift-monitor.ts` | `src/platform/observation/drift-monitor.ts` | Add optional FourierDriftAdapter integration; enhanced mode when adapter is available | Raven |
| `promotion-gatekeeper.ts` | `src/platform/observation/promotion-gatekeeper.ts` | Add Gate 3.5 (script match, non-blocking); update threshold references for MUS targets | Hemlock |
| `cedar-engine.ts` | `src/services/chipset/cedar-engine.ts` | Add 'promotion', 'demotion', 'fire-succession', 'promotion-health', 'promotion-audit' TimelineCategory values | Cedar |

### Interface Definitions (to be added to `core/types/observation.ts`)

- `PromotionSource` — full specification in Part 3
- `PromotionReturnReport` — full specification in Part 6
- `FourierDriftConfig` — window size, frequency threshold, fallback policy
- `PromotionOrchestratorConfig` — convergence matching parameters, cycle cadence

---

## Part 11: Session Boundary Record

**Session 8 produces:**
- `www/MUS/research/08-gpu-promotion-loop.md` (this document) ✓
- `PromotionSource` interface specification (B-6 concrete resolution) ✓
- Gate threshold table with MUS targets vs. current defaults ✓
- Complete GPU promotion loop pipeline diagram ✓
- Centercamp return path protocol (PromotionReturnReport) ✓
- DriftMonitor + fourier-drift cartridge integration spec ✓
- Fire Succession → promotion stage mapping (pioneer/canopy/old-growth) ✓
- Hemlock Quality Gate checkpoint map (5 checkpoints) ✓
- New module architecture table (3 new, 4 modified) ✓

**Deferred to Session 10 (Determinism 0.8→0.95 Hardening):**
- Actual code changes to `DEFAULT_GATEKEEPER_CONFIG.minDeterminism`
- Actual code changes to `DEFAULT_PROMOTION_DETECTOR_CONFIG.minDeterminism`
- Evidence-based threshold tuning from Template PL-01 (thin-margin analysis)

**Open questions for Growth Ring Council:**
- Where exactly in the session lifecycle does PromotionOrchestrator run? (Owl's cadence question — does it run at session end like PromotionEvaluator in Session 6's lifecycle diagram, or continuously during ACTIVE state?)
- Should `PromotionSource.cedarHash` be required rather than nullable? (Cedar's chain integrity question — if null, we cannot anchor the promotion event in the record)
- FourierDriftAdapter minimum window size: 20 observations is specified, but is this calibrated for the system's actual session frequency? (Sam's experimental question)

**Pattern recorded:** Convergence After Parallel Evolution (B-6 class pattern). First appearance: this session. Characteristics: two components accumulate capability independently, each solving half the problem, until a typed interface is specified that makes both halves visible to the other. Prediction: this pattern will appear again when the Wasteland federation layer is connected to the observation pipeline. Watch for it.

---

## Verification

- PromotionSource interface specified with 10 typed fields, all documented ✓
- B-6 resolution made concrete (not just "add an interface" — the interface is defined) ✓
- Three mandatory gates specified with MUS target thresholds ✓
- Gate 3.5 (converged-only, non-blocking) specified ✓
- Gate G-DECL (declaration-only empirical requirement) specified ✓
- Centercamp return path: 4 event types (promoted/demoted/failed/drift-detected) ✓
- Cedar category additions specified ('promotion', 'demotion', 'fire-succession', etc.) ✓
- DriftMonitor fourier enhancement: window requirement, FFT call, fallback ✓
- Fire succession: 6 phases mapped to promotion lifecycle ✓
- Pioneer/canopy/old-growth distinction drawn precisely ✓
- Old-growth threshold: 10+ sessions without drift ✓
- Hemlock Quality Gate: 5 checkpoints specified ✓
- 2 conversation templates for promotion-specific scenarios ✓
- New module table: 3 new modules, 4 modified modules ✓
- All specifications grounded in actual source code (no invented APIs) ✓
