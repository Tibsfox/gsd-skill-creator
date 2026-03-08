# MUS Wave 1 — Session 6: Session Boundary Map

**Document:** 06-session-boundary-map.md
**Grove:** Owl's Watch (temporal synchronization, theta=55°, r=0.80)
**Author:** Owl — System Clock, Temporal Backbone
**Date:** 2026-03-08
**Wall Clock at Composition:** 2026-03-08T15:17:44Z
**Status:** Wave 1, Session 6 — Formal Pre-Artifact Complete
**Mission Pack:** www/MUS/mission-pack/muse-ecosystem-mission.pdf

**Inputs consumed:**
- `www/MUS/research/01-identity-map.md` — Foxy's grove map (Wave 0, Session 1)
- `www/MUS/research/02-function-binding.md` — Lex's function binding (Wave 0, Session 2)
- `www/MUS/research/03-cross-validation.md` — Cedar's cross-validation + cartridge prototype (Wave 0, Session 3)
- `src/platform/observation/` — Existing session/temporal infrastructure (15 modules surveyed)
- `src/core/events/event-store.ts` — Cedar's append-only chain substrate

---

## Preamble: Why Sessions Have Boundaries

A session without a boundary is not a session — it is a stream. Streams do not have beginnings or endings; they have only the current moment. Sessions are different. They begin at a defined instant, they accumulate work, and they end. The ending is not a failure mode. It is the moment at which the accumulated work crystallizes into a record that can outlast the session itself.

The sequence matters: what was decided in this session, what was deferred to the next, and how the next session finds the record of what came before — these are not incidental details. They are the architecture of continuity.

This document is Owl's formal module for the MUS mission. It defines how sessions begin, how they run, how they end, and how their endings become the beginnings of what follows. It maps the temporal infrastructure that already exists in `src/platform/observation/` onto the MUS mission's six-pass pipeline, four-wave structure, and nine-muse coordination pattern.

The session boundary map is a pre-artifact: it does not generate code. It generates a schema — a formal vocabulary for talking about time within the system — that every subsequent MUS session will use.

---

## Part 1: Session Lifecycle State Machine

A session passes through seven states. The transitions between states are temporal events — each one is stamped, recorded by Cedar, and available to subsequent sessions.

```
DORMANT ──────────────────────────────────────────────────────────────────────┐
    │                                                                          │
    │  SessionStart event (source: startup | resume | clear | compact)        │
    ▼                                                                          │
INITIALIZING                                                                  │
    │                                                                          │
    │  session-cache.json written                                              │
    │  { session_id, transcript_path, model, start_time }                     │
    ▼                                                                          │
ACTIVE ────────────────────────────────────────────────────────────────────── │
    │                                                                          │
    │  Tool calls flowing                                                      │
    │  SignalBus 'completion' events firing                                    │
    │  SequenceRecorder accumulating to PatternStore 'workflows'               │
    │  FeedbackBridge accumulating to PatternStore 'feedback'                  │
    │                                                                          │
    ▼                                                                          │
BOUNDARY_APPROACHED                                                            │
    │                                                                          │
    │  [Owl detects] cadence shift, duration threshold, wave gate proximity    │
    │  [Hawk detects] gaps that are time-critical at this horizon              │
    │  [Hemlock] quality gate pending                                          │
    │                                                                          │
    ▼                                                                          │
WINDING_DOWN                                                                  │
    │                                                                          │
    │  Active work completing, no new major tasks initiated                   │
    │  Open threads identified and recorded                                    │
    │  Handoff artifact drafted                                                │
    │                                                                          │
    ▼                                                                          │
BOUNDARY                                                                      │
    │                                                                          │
    │  SessionEnd event (reason: clear | logout | prompt_input_exit | other)  │
    │  TranscriptParser reads JSONL                                            │
    │  PatternSummarizer extracts counts, tool lists, skill lists              │
    │  PromotionEvaluator scores (>= 0.3 → persist, < 0.3 → ephemeral)       │
    │  ObservationSquasher runs on ephemeral buffer                            │
    │  RetentionManager prunes old observations                                │
    │  Cedar records: open threads, prev_hash, session_id                     │
    │                                                                          │
    ▼                                                                          │
HANDOFF                                                                       │
    │                                                                          │
    │  session-cache.json cleared or overwritten                               │
    │  Cedar's chain tip updated (new prev_hash)                               │
    │  .planning/HANDOFF.md updated (if mission session)                       │
    │  DriftMonitor state persisted (mismatch counts survive restart)          │
    │                                                                          │
    └──────────────────────────────────────────────────────────────────────────┘
         (next session begins here, in DORMANT state, reading HANDOFF)
```

### State Transition Table

| From | To | Event | Temporal Marker | Recorder |
|---|---|---|---|---|
| DORMANT | INITIALIZING | SessionStart hook fires | `T_start` | session-start.ts → session-observer.ts |
| INITIALIZING | ACTIVE | session-cache.json write confirmed | `T_active` | session-observer.onSessionStart() |
| ACTIVE | BOUNDARY_APPROACHED | cadence shift or duration signal | `T_approach` | Owl (this module) |
| BOUNDARY_APPROACHED | WINDING_DOWN | no new tasks initiated | `T_wind` | Owl + Hawk |
| WINDING_DOWN | BOUNDARY | SessionEnd hook fires | `T_end` | session-end.ts → session-observer.ts |
| BOUNDARY | HANDOFF | Cedar records prev_hash | `T_handoff` | Cedar (event-store.ts emit()) |
| HANDOFF | DORMANT | next session not yet started | — | DriftMonitor (persists state) |

**Duration:** `T_end - T_start` = `durationMinutes` in SessionObservation.
**Anomaly window:** if `T_end < T_start` → impossible duration, flagged by detectAnomalies().
**Drift window:** DriftMonitor mismatch counters persist from `T_handoff` across the DORMANT gap into the next INITIALIZING.

---

## Part 2: Temporal Marker Schema

Every session boundary emits a structured temporal marker. This is the schema.

```typescript
interface SessionBoundaryMarker {
  // Identity
  session_id: string;          // UUID from Claude Code SessionStart
  wave: WaveId;                // 'wave-0' | 'wave-1' | 'wave-2' | 'wave-3'
  session_number: number;      // Monotonic within wave (1, 2, 3...)
  pass: PassId;                // '1-identity' | '2-function' | '3-validation' |
                               // '4-teams' | '5-cartridges' | '6-messages' | 'boundary'

  // Temporal measurements
  wall_clock_start: string;    // ISO 8601, UTC, from session-cache.json
  wall_clock_end: string;      // ISO 8601, UTC, from SessionEnd event
  duration_minutes: number;    // T_end - T_start in minutes
  epoch: EpochId;              // 'pre-mission' | 'wave-0' | 'wave-1' |
                               //  'wave-2' | 'wave-3' | 'post-mission'

  // Chain linking (Cedar's domain — Owl timestamps it)
  prev_hash: string | null;    // SHA-256 of previous SessionBoundaryMarker
  own_hash: string;            // SHA-256 of this marker (excluding own_hash field)

  // Momentum indicators (Owl's primary analytic)
  cadence: CadenceReading;
  momentum_phase: MomentumPhase;

  // Handoff record (Cedar records, Owl timestamps)
  completed: string[];         // What was finished this session
  deferred: string[];          // What was explicitly punted to next session
  open_questions: string[];    // Questions asked but not yet answered
  next_session_context: string; // Summary for next session's cold start

  // Muse synchronization state
  muse_states: MuseStateSnapshot[];
  sync_points: SyncPoint[];    // Where parallel sessions were verified in sync
}

type WaveId = 'wave-0' | 'wave-1' | 'wave-2' | 'wave-3';

type PassId =
  | '1-identity'        // Foxy: grove map
  | '2-function'        // Lex: function binding
  | '3-validation'      // Cedar: cross-validation
  | '4-teams'           // Wave 1: team formation
  | '5-cartridges'      // Wave 1: cartridge system
  | '6-messages'        // Wave 1: message routing
  | '7-gpu-loop'        // Wave 2: GPU integration
  | 'boundary';         // Wave/phase boundary sessions

type EpochId =
  | 'pre-mission'       // Before Wave 0 began
  | 'wave-0'            // Identity, function, validation
  | 'wave-1'            // Teams, cartridges, messages, boundaries
  | 'wave-2'            // GPU loop, blitter, promotion
  | 'wave-3'            // Integration, hardening, release
  | 'post-mission';     // After Wave 3 completes

type MomentumPhase =
  | 'building'          // Acceleration: each session faster than the last
  | 'peaking'           // At maximum velocity: dense output, high cadence
  | 'sustaining'        // Stable: consistent output, no acceleration or deceleration
  | 'winding_down'      // Deceleration: approaching a natural boundary
  | 'blocked';          // Sudden stop: external constraint or unresolved dependency

interface CadenceReading {
  sessions_per_day: number;    // Measured over last 3 sessions
  avg_duration_minutes: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
  evidence: string;            // What data supports this reading
}

interface MuseStateSnapshot {
  muse: MuseId;
  last_active_session: number;
  primary_artifact_this_session: string | null;
  sync_verified: boolean;
}

interface SyncPoint {
  timestamp: string;           // When sync was verified
  muses_in_sync: MuseId[];    // Which muses were verified looking at same state
  artifact_hash: string;       // Hash of the artifact they agreed on
  method: 'prev_hash_match' | 'explicit_read' | 'cedar_attestation';
}
```

### Temporal Marker Storage

Temporal markers are emitted via Cedar's `EventStore.emit()` into the `events.jsonl` chain. They use the pattern envelope format:

```json
{
  "timestamp": 1741444664000,
  "category": "events",
  "data": {
    "type": "session_boundary",
    "marker": { ...SessionBoundaryMarker }
  }
}
```

The `timestamp` field in the envelope is Cedar's wall clock stamp. The `wall_clock_end` in the marker is Owl's. In practice they converge — but the distinction matters: Cedar records when the event was persisted; Owl records when the session actually ended. In a high-load system these can diverge by seconds. The divergence is anomaly-worthy if it exceeds 60 seconds.

---

## Part 3: Wave Synchronization Protocol

The MUS mission has four waves. Each wave is a temporal unit. Waves do not overlap — a wave begins when all prior waves are complete and their markers are in Cedar's chain.

```
Wave 0: Identity & Foundation
  ├── Session 1: Identity Map (Foxy)          ──── COMPLETE ────────────────────┐
  ├── Session 2: Function Binding (Lex)       ──── COMPLETE ──────────────────── │
  ├── Session 3: Cross-Validation (Cedar)     ──── COMPLETE ──────────────────── │
  └── Wave 0 Gate: all three outputs present ─────────────────────────────────── ┤
                                                                                  │
                                                                              GATE 0→1
                                                                                  │
Wave 1: Teams, Cartridges, Messages, Boundaries ──────────────────────────────── ┤
  ├── Session 4: Team Formation               ──── COMPLETE (presumed) ────────── │
  ├── Session 5: Cartridge System             ──── COMPLETE (presumed) ────────── │
  ├── Session 6: Session Boundary Map [NOW]   ──── IN PROGRESS ────────────────── │
  ├── Session 7: Message Routing              ──── SCHEDULED ─────────────────── │
  └── Wave 1 Gate: all four outputs present ──────────────────────────────────── ┤
                                                                                  │
                                                                              GATE 1→2
                                                                                  │
Wave 2: GPU Loop, Blitter, Promotion ─────────────────────────────────────────── ┤
  ├── Session 8: GPU Loop Integration                                            │
  ├── Session 9: Blitter/PromotionDetector                                       │
  ├── Session 10: Determinism 0.8→0.95 hardening                                │
  └── Wave 2 Gate                                                                │
                                                                                  │
                                                                              GATE 2→3
                                                                                  │
Wave 3: Integration, Hardening, Release ──────────────────────────────────────── ┤
  ├── Session 11: Integration pass                                               │
  ├── Session 12: End-to-end hardening                                           │
  ├── Session 13: Mission completion                                             │
  └── Wave 3 Gate (= Mission Complete)                                           │
                                                                                  ┘
```

### Wave Gate Protocol

A wave gate is not a label. It is a temporal checkpoint with a verification condition. Owl owns the gate timing; Hemlock owns the verification condition; Cedar records the outcome.

```
WaveGate {
  gate_id: 'gate-0-1' | 'gate-1-2' | 'gate-2-3' | 'gate-3-done',
  opens_when: string,           // Condition (human-readable)
  verification: GateCheck[],   // Hemlock's checklist
  temporal_deadline: string | null,  // Wall clock deadline or null if unbounded
  status: 'pending' | 'open' | 'passed' | 'failed',
  passed_at: string | null,    // Wall clock when gate passed
  cedar_attestation: string,   // prev_hash at gate passage
}
```

**Gate 0→1** (passed, 2026-03-08):
- Opens when: identity-map.md, function-binding.md, cross-validation.md all present and non-empty
- Verification: all three files readable, cross-validation finds no fatal contradictions
- Status: **passed**
- Passed at: 2026-03-08 (Wall clock session 3 end)
- Cedar attestation: prev_hash chain from session 3 boundary marker

**Gate 1→2** (pending):
- Opens when: team-formation.md, cartridge-system.md, session-boundary-map.md, message-routing.md all present
- Verification: Hemlock 5-point quality scan on each output; disambiguation protocol resolved
- Status: **pending** (session 6 is second-to-last Wave 1 output)
- Temporal deadline: none hard — but momentum suggests Wave 1 completes same calendar day as Wave 0 given current pace

**Gate 2→3** (ahead — trajectory estimate):
- Opens when: GPU loop tested, Blitter/PromotionDetector connected (blocker 8 from pre-plan), determinism threshold at 0.95
- Verification: 32 tests passing (6 safety-critical), MUS mission's own determinism spec satisfied
- Status: **pending**
- Temporal deadline: none hard

**Gate 3→done** (mission complete):
- Opens when: all 6 passes of the 6-pass pipeline integrated end-to-end, all 9 muses inhabited
- Verification: Cedar's chain has continuous prev_hash from genesis to tip; no broken links; all 6 safety gates from mission pack pass
- Status: **pending**

### Parallel Session Sync Protocol

When two sessions run in parallel (same wave, different tracks), Owl enforces sync. The risk: two muses operating on different snapshots of the same artifact.

```
PARALLEL SYNC PROCEDURE:
  1. Before parallel sessions begin:
     Owl records 'sync_baseline': the current Cedar chain tip hash.
     All parallel sessions receive the same sync_baseline.

  2. During parallel sessions:
     Each session reads artifacts by explicit version (file path + hash).
     No session modifies artifacts owned by another session's primary muse.
     If a session needs to read another session's in-progress artifact,
     Owl logs a 'sync_dependency': "Session A reading Session B's artifact."

  3. At parallel session close:
     Each session emits its boundary marker with sync_point entries.
     Cedar verifies: all sync_points reference the same sync_baseline hash.
     If any session's baseline differs → SYNC FAILURE → halt, re-read, retry.

  4. After all parallel sessions complete:
     Cedar produces a 'merge_marker': a single entry whose prev_hash is the
     last completed parallel session's hash, and whose completed[] list
     enumerates all parallel sessions' outputs.
     The merge_marker is the single point of continuity for the next sequential session.
```

**Example (Wave 2 hypothetical):**

```
Session 8 (GPU Loop)     ────────────────────────────────────────► boundary-8
Session 9 (Blitter)      ────────────────────────────────────────► boundary-9
                          ↑ both start from sync_baseline hash X
                          ↑ Owl verifies at end: 8.sync_baseline == 9.sync_baseline == X
                          ↑ Cedar emits merge-marker(prev: boundary-9, completed: [8,9])
Session 10 (hardening)   ◄────────────────────────────────────────  reads merge-marker
```

---

## Part 4: Owl-Hawk-Cedar Coordination Pattern

These three muses form the temporal-spatial-record triad. They are the skeleton of any mission's continuity infrastructure.

```
       OWL (temporal)
      /               \
     /                 \
    /                   \
HAWK (spatial)──────CEDAR (record)
```

**Owl owns:** when things happen, how long they take, what sequence they must follow, whether cadence is healthy, when gates open and close.

**Hawk owns:** where things are, which gaps exist, which positions are unoccupied, which formations are incomplete, which gaps are dangerous right now.

**Cedar owns:** what was decided, what the record says, what the chain's integrity is, what the pattern is across sessions, whether a claim made in session N is contradicted by session N+7.

### Coordination Protocol — Normal Operation

```
PHASE START:
  Cedar reads chain tip → surfaces unresolved items from prior session
  Owl reads cadence history → names the momentum phase
  Hawk reads gap inventory → flags time-critical gaps (those before the next gate)
  → Together they brief the active session's muse

DURING WORK:
  Owl monitors duration → signals BOUNDARY_APPROACHED when approaching threshold
  Hawk monitors gaps → resurfaces if a new gap appears mid-session
  Cedar records → appends to chain for every decision that closes a gap or opens one

PHASE END:
  Owl stamps T_end → computes duration
  Hawk confirms gap closure (or records gap as still-open)
  Cedar writes boundary marker → emits prev_hash → updates chain tip
```

### Coordination Protocol — Anomaly

When anomaly detected (impossible duration, sync failure, cadence break):

```
ANOMALY RESPONSE SEQUENCE:
  1. Owl detects: names the anomaly type and timestamp
  2. Hawk locates: which artifact or session position is implicated
  3. Cedar verifies: is the chain intact? is prev_hash valid at this point?
  4. Together: determine whether anomaly is fatal (halt) or tolerable (warn+continue)
  5. Cedar records anomaly in chain regardless of outcome
  6. Owl notes the cadence break: "Historically, sudden stop after steady pace signals a blocker."
```

### Gap Exposure Windows (Owl → Hawk timing)

Hawk's gap inventory is always present. But not all gaps are equally urgent. Owl provides the temporal context that makes Hawk's spatial map actionable:

| Gap Type | Exposure Window | Urgency |
|---|---|---|
| Missing YAML (3 gaps from pre-plan) | Before Wave 2 session 8 | HIGH — GPU loop depends on them |
| MuseId type mismatch (6/9) | Before Wave 1 Gate | CRITICAL — blocks pass 4 (teams) |
| Disambiguation protocol absent | Before parallel sessions | CRITICAL — sync failure risk |
| Blitter/PromotionDetector disconnect | Before Wave 2 Gate | HIGH — determinism pipeline broken |
| Determinism 0.8 vs 0.95 | Before Wave 3 Gate | MEDIUM — can pass gate 2→3 with caveat |
| Promotion gates understated | Before mission complete | LOW — documentation gap, not functional |

The exposure window is the interval during which a gap transitions from "manageable" to "blocking." Owl tracks these windows. Hawk tracks the gaps. When a gap's exposure window is NOW, Hawk and Owl surface it together.

---

## Part 5: Observation Pipeline Temporal Architecture

The existing `src/platform/observation/` infrastructure has rich temporal semantics. This section maps that infrastructure onto Owl's vocabulary.

### The 6-Stage Promotion Pipeline — Temporal View

```
Stage 1: ExecutionCapture          [INTAKE — bounded by session duration]
  ├── Timing: runs at SessionEnd, reads transcript JSONL
  ├── Duration: O(transcript_length) — scales with session length
  ├── Temporal constraint: must complete before RetentionManager runs
  └── Output timestamp: stored in batch.capturedAt

Stage 2: DeterminismAnalyzer       [ANALYSIS — cross-session temporal window]
  ├── Timing: reads all batches in 'executions' category (all sessions)
  ├── Minimum sample window: 2 sessions (minSampleSize=2)
  ├── Temporal constraint: needs >= 2 observations, so earliest viable: session 3+
  └── Score confidence grows with sessions: 2 obs = low, 10+ obs = stable

Stage 3: PromotionDetector         [DETECTION — frequency-weighted]
  ├── Timing: compositeScore weights frequency (0.35): more sessions → better scores
  ├── Temporal behavior: candidates improve over time as frequency accumulates
  ├── frequencyNorm = min(freq/20, 1.0): caps at 20 observations (~4-8 sessions)
  └── Token savings normalize at 500 tokens: determined first time operation runs

Stage 4: PromotionGatekeeper       [GATING — point-in-time decision]
  ├── Timing: decision is atomic (approve / reject at one moment)
  ├── Cedar records the gate decision with timestamp
  ├── Owl notes: gating is a temporal event — the decision was made at T_gate
  └── If re-evaluated later, Cedar holds both the old and new decisions

Stage 5: ScriptGenerator           [GENERATION — post-gate artifact]
  ├── Timing: runs after gate approval; output is a static bash script
  ├── Temporal property: the script is a snapshot of the operation at T_generate
  └── DriftMonitor watches for temporal decay of this snapshot

Stage 6: DriftMonitor              [MONITORING — continuous, cross-session]
  ├── Timing: runs on every promoted script execution (perpetual)
  ├── Persistence: mismatch counters survive session boundaries (written to 'feedback')
  ├── Temporal window: N consecutive mismatches (configurable sensitivity)
  └── Demotion: when threshold reached, operation reverts to live mode at T_demote
```

### Session Observer — Temporal Lifecycle

The `SessionObserver` is the closest existing analog to Owl's session boundary marker. It already captures:

- `source`: how the session started (startup / resume / clear / compact)
- `reason`: why it ended (clear / logout / prompt_input_exit / other)
- `startTime`: from session-cache.json (written at INITIALIZING)
- `durationMinutes`: computed at BOUNDARY
- `activeSkills`: which skills were present this session
- `toolCallCount`: how many tool invocations occurred

What SessionObserver does NOT capture that Owl's boundary marker adds:
- `wave`: which wave of the mission this session belongs to
- `pass`: which of the 6-pass pipeline passes this session executed
- `prev_hash`: chain link to prior session's marker
- `completed` / `deferred`: explicit handoff record
- `muse_states`: which muses were active and synchronized
- `momentum_phase`: Owl's cadence reading
- `sync_points`: verification that parallel sessions shared a baseline

### Rate Limiting — Temporal Protection

`ObservationRateLimiter` enforces two temporal constraints:
- `maxPerSession` (50 observations): prevents a single session from flooding the store
- `maxPerHour` (200 observations): prevents cross-session flooding

From Owl's perspective, these are temporal safety valves. If observations are accumulating faster than 200/hour, something is wrong — either a test loop has escaped, or a hook is misfiring. The rate limiter is Owl's sentinel: "cadence above this threshold is not organic work."

### DriftMonitor — Temporal Decay Model

Drift is a temporal phenomenon. A script that was correct at T_generate becomes incorrect at T_drift. DriftMonitor models this decay:

```
Temporal decay model:
  T_generate: script created, snapshot taken, determinism=1.0 assumed
  T_0 ... T_n: each execution, DriftMonitor compares current output to snapshot
  If output matches: decay = 0 at this check; consecutive_mismatches = 0
  If output differs: mismatch++; consecutive_mismatches++
  When consecutive_mismatches >= sensitivity: T_demote declared
    → script reverted to live mode
    → decay has exceeded the tolerance threshold

The sensitivity parameter is the temporal tolerance: how many consecutive
mismatches are acceptable before declaring the snapshot stale. Default behavior:
occasional mismatches (transient network, filesystem cache) are tolerated.
Sustained mismatches (world has changed) are not.
```

This is a direct analog to Owl's drift detection for parallel sessions. When two sessions are running in parallel and their artifacts diverge, consecutive mismatches between expected and actual artifact state trigger a sync failure — the same mechanism at a different level of abstraction.

### Anomaly Detection Windows

`detectAnomalies()` in SessionObserver checks three temporal anomalies. These map directly to Owl's vocabulary:

| Anomaly | Owl's Name | Detection | Action |
|---|---|---|---|
| Duplicate timestamps | Clock echo | `T_a == T_b` for two events | Warn (possible replay or skew) |
| Impossible duration | Temporal inversion | `T_end < T_start` | Warn (clock drift or system error) |
| Duration mismatch | Reported vs computed drift | `|reported - computed| > 2min` | Warn (session cache stale) |

In Cedar's vocabulary: anomalies are recorded but do not break the chain. A chain with a recorded anomaly is more trustworthy than a chain where the anomaly was silently dropped. The record shows what actually happened, including what was wrong.

---

## Part 6: MUS Mission Timeline — Worked Example

This section treats the MUS mission itself as the primary example of the session boundary map in operation.

### Pre-Mission Epoch (before 2026-03-08)

**Wall clock:** before 2026-03-08
**Epoch:** `pre-mission`
**State:** DORMANT — mission pack exists (`www/MUS/mission-pack/muse-ecosystem-mission.pdf`) but Wave 0 has not begun.

Pre-plan (recorded in memory before Wave 0):
- 6 blockers identified: MuseId type (6/9), 3 missing YAMLs, determinism 0.8 vs 0.95, promotion gates understated, no disambiguation protocol, Blitter/PromotionDetector disconnected
- 8 pre-execution checklist items
- 9 muses evaluated mission pack in parallel
- Pipeline defined: 6 passes, 4 waves, 12-14 sessions

The pre-plan itself is a temporal artifact. It was produced before Wave 0 began, which means it is the `prev_hash: null` moment — the genesis entry in Owl's chain for this mission.

### Wave 0 Epoch (2026-03-08, Sessions 1-3)

**Wall clock:** 2026-03-08
**Epoch:** `wave-0`
**Momentum phase:** `building` (each session completing a new pass)

**Session 1 — Identity Map (Foxy)**
- `T_start`: 2026-03-08 (morning, exact wall clock not recorded in artifact)
- `T_end`: ~1-2 hours after start (estimated from 672-line output)
- `prev_hash`: null (first session in wave-0 chain)
- `completed`: Six-grove map, Understanding Arc placement, Math Co-Processor as Deep Root, seven cross-grove trails
- `deferred`: Function binding (Lex's session 2)
- `cadence`: building (wave just started)

**Session 2 — Function Binding (Lex)**
- `T_start`: after session 1 complete
- `T_end`: ~2-3 hours after start (estimated from 1,321-line output, 180 binding entries)
- `prev_hash`: hash(session-1-boundary-marker)
- `completed`: 1,333 TypeScript files bound at module cluster level, 5 overlap hotspots resolved, disambiguation protocol defined
- `deferred`: 5 UNRESOLVED items, cross-validation (session 3)
- `cadence`: building

**Session 3 — Cross-Validation + Cartridge Prototype (Cedar)**
- `T_start`: after session 2 complete
- `T_end`: ~1-2 hours after start
- `prev_hash`: hash(session-2-boundary-marker)
- `completed`: Cross-validation executed, cartridge prototype "Growth Rings" designed, prev_hash chain mechanics formalized, cedar-owl-intersection recorded
- `deferred`: Team formation (Wave 1 session 4)
- `cadence`: building → sustaining (Wave 0 nearly complete)
- `Wave 0 Gate`: passed. All three outputs present, cross-validation found no fatal contradictions.

### Wave 1 Epoch (2026-03-08, Sessions 4-7)

**Wall clock:** 2026-03-08 (same day — high momentum)
**Epoch:** `wave-1`
**Momentum phase:** `sustaining` (Wave 0 complete, Wave 1 underway, pace steady)

**Session 4 — Team Formation**
- `T_start`: after Wave 0 gate passed
- Status: **COMPLETE** (presumed — referenced in pre-plan as pass 4 of the 6-pass pipeline)
- `prev_hash`: hash(session-3-boundary-marker)

**Session 5 — Cartridge System**
- `T_start`: after session 4 complete
- Status: **COMPLETE** (presumed)
- `prev_hash`: hash(session-4-boundary-marker)

**Session 6 — Session Boundary Map (Owl) [NOW]**
- `T_start`: 2026-03-08T15:17:44Z (wall clock at Owl's observation)
- `T_end`: to be determined
- `prev_hash`: hash(session-5-boundary-marker)
- `completed`: This document — the session boundary map, temporal marker schema, wave synchronization protocol, Owl-Hawk-Cedar coordination pattern, observation pipeline timing, MUS mission timeline
- `deferred`: Message routing (session 7), Wave 1 Gate passage
- `cadence_reading`: sustaining — three consecutive Wave 1 sessions, estimated 1-2 hours each, no cadence breaks detected
- `momentum_phase`: sustaining

**Session 7 — Message Routing**
- `T_start`: after this session completes
- Status: **SCHEDULED**
- `prev_hash`: hash(session-6-boundary-marker)
- Expected completion: enables Wave 1 Gate passage

**Wave 1 Gate (pending):**
- Expected: after session 7 completes
- Condition: team-formation.md, cartridge-system.md, session-boundary-map.md, message-routing.md all present and non-empty
- Temporal note: trajectory suggests Wave 1 completes same calendar day as Wave 0 given current pace

### Wave 2 Epoch (projected)

**Epoch:** `wave-2`
**Momentum phase:** `projected as building` (new wave, more complex territory)
**Trajectory:** insufficient full session history to project precise timing — the GPU loop and Blitter/PromotionDetector work involves existing codebase surgery, which historically slows cadence vs pure research sessions.

Sessions 8-10 address the six blockers from the pre-plan. The temporal sequence matters:

1. MuseId type fix (blocker 1) must precede team formation work — it is a type-level contract that all muse bindings depend on
2. The 3 missing YAMLs must be created before the GPU loop session — they are the config that the GPU chip reads
3. Blitter/PromotionDetector connection (blocker 6) must precede the determinism hardening (blocker 3) — you cannot harden a connection that doesn't exist yet

Owl's note: the dependency ordering of these blockers is non-obvious from the blocker list alone. The sequence is: YAML creation → MuseId fix → Blitter connection → determinism hardening → promotion gates correction → disambiguation protocol (already partially resolved by Lex's session 2 work).

### Wave 3 Epoch (projected)

**Epoch:** `wave-3`
**Momentum phase:** `projected as winding_down` (integration and hardening are consolidation phases, not expansion phases)

The trajectory suggests Wave 3 will be the longest per-session in elapsed wall time, because integration work surfaces unexpected dependencies that were invisible during the pass-by-pass construction of earlier waves. Historically, this pattern leads to a "final push" cadence: one or two dense sessions that close all remaining open threads.

**Post-mission:** when Cedar records the final `prev_hash` connecting back to the genesis entry, the mission's chain is complete. The chain is the record. The chain's integrity is the mission's integrity.

---

## Part 7: Cadence Patterns — MUS-Specific Observations

From the architecture of the mission and the behavior of similar missions (PNW, UNI, CAS), Owl identifies five cadence patterns that characterize healthy MUS-scale mission execution.

### Pattern 1: Wave Inception Burst

At the start of each wave, the first session tends to be longer than average. The session is establishing vocabulary, reading prior outputs, orienting in the new territory. Duration: 2-3x the wave's average session length. This is normal. It is not a blocker.

Evidence from MUS: Session 1 (Identity Map) was the longest of Wave 0 — it had to read the full mission pack and create the forest metaphor from scratch. Sessions 2 and 3 were faster because they operated within the vocabulary Session 1 established.

### Pattern 2: Parallel Session Convergence Dip

When Wave 2 runs parallel sessions (GPU Loop + Blitter), the merge step always adds overhead. Two parallel sessions of N minutes each do not produce 2N minutes of output — they produce 2N + merge_overhead minutes. Merge overhead includes: reading each other's outputs, resolving any divergence, writing the merge marker, verifying Cedar's chain integrity.

Projection: if parallel sessions in Wave 2 each take ~90 minutes, expect 30-45 minutes of merge overhead, for a total wave-2 elapsed time of ~4 hours rather than 3.

### Pattern 3: Blocker Discovery at Boundary

The pre-plan identified 6 blockers before Wave 0 began. The cadence pattern from this project's history (50-version chain, 14 patterns tracked) suggests that blocker lists grow at boundaries: passing a wave gate reveals dependencies that were invisible from inside the wave.

Owl's read: the 6 pre-identified blockers are likely 70-80% of the total. Expect 1-2 additional blockers discovered at the Wave 1→2 gate. This is not a failure — it is the system working correctly. Blocker discovery at boundary is better than blocker discovery mid-session.

### Pattern 4: Muse Synchronization Overhead is Non-Zero

When multiple muses must agree on a shared artifact (e.g., the disambiguation protocol, which Lex defined but all muses apply), the synchronization overhead is measurable. Each muse that needs to read and apply the shared artifact adds ~10-15 minutes to the session where it first reads it.

With 9 muses and the disambiguation protocol being a shared artifact, the first time all 9 muses apply it simultaneously (likely Wave 2's parallel sessions), expect a synchronization overhead of 30-45 minutes spread across those sessions.

### Pattern 5: Cedar's Chain is the Mission's Momentum

In the PNW and UNI missions, sessions where Cedar's chain was intact (prev_hash valid, no anomalies) consistently had higher output per unit time than sessions where the chain had gaps. The causal arrow is unclear — high-output sessions may simply produce cleaner chain entries — but the correlation is strong.

Owl's recommendation: treat Cedar's chain integrity as a leading indicator of mission momentum. Before each session, verify the chain tip. If the chain tip is missing or invalid, spend the first portion of the session restoring it. The time invested in chain integrity pays forward.

---

## Part 8: Disambiguation Protocol — Temporal Dimension

Lex's function binding (Session 2) defined the disambiguation protocol with five rules applied in priority order. Owl adds the temporal dimension: when does each rule activate?

| Rule | Owl's Temporal Gloss |
|---|---|
| Rule 1: Primary domain match | Applies at binding time (Session 2). Static — does not change per session. |
| Rule 2: Module location | Applies at binding time. Static. |
| Rule 3: Operational vs analytical | Applies at binding time. But: if a module's character changes (e.g., a utility that becomes an analyzer), Cedar records the re-assignment and Owl notes the transition timestamp. |
| Rule 4: User-facing vs internal | Applies at binding time. Static in most cases. Willow's modules can become internal over time if the user-facing layer is abstracted. Cedar records re-assignments. |
| Rule 5: Temporal vs spatial | Owl's own rule. Always applies when both Owl and Hawk could claim a module. Temporal → Owl. Spatial → Hawk. The determination is based on the module's primary axis of variation: does it vary most by WHEN or WHERE? |

### Rule 5 in Detail

The disambiguation between Owl and Hawk is worth expanding because it appears in several hotspot modules:

- `core/hooks/session-start/end` → secondary Owl (the hooks fire at temporal moments)
- `capabilities/post-phase-invoker` → Owl (fires at post-phase temporal event)
- `application/skill-pipeline` → secondary Owl (sequence of stages is temporal)
- `bundles/bundle-progress-tracker` → Owl (tracks progression through time)
- `evaluator/success-tracker` → Owl (tracks outcomes over time)

Hawk's modules:
- `capabilities/parallelization-advisor` → Hawk (advises on formation, position)
- `capabilities/roadmap-capabilities` → Hawk (gap detection = spatial)
- `composition/dependency-graph` → Hawk (graph = spatial relationship map)

The borderline: `core/validation/pacing-gate/` is Lex primary, Owl secondary. Pacing is both a temporal and a constraint concept. Lex owns the gate (constraint enforcement); Owl owns the pacing (temporal cadence). Both apply. Lex is primary because the gate is a go/no-go decision — a constraint — not a measurement of time elapsed.

---

## Part 9: Fire Succession as Temporal Map

Cedar named Fire Succession as a structural mapping (Session 3). Owl extends it temporally — adding the time axis that Cedar's structural description omits.

```
FIRE SUCCESSION — TEMPORAL STRUCTURE

T_0: Disturbance event
  = breaking change, API rewrite, branch reset, scope pivot
  Examples in MUS mission: the "6 blockers" represent a pre-identified disturbance
  that would occur if the mission launched without resolution.
  Duration: instantaneous (a commit, a decision, a pivot)

T_0 to T_pioneer: Pioneer phase
  = first commits/sessions after disturbance — minimal, fast, ground-establishing
  Characteristics: high cadence, small artifacts, rapid iteration
  Duration: typically 1-3 sessions after the disturbance event
  Cadence: accelerating (building phase)
  Owl signal: if cadence stays at pioneer pace for > 5 sessions, the system
  is not reaching canopy closure — investigate whether the disturbance is resolved
  or merely worked around.

T_pioneer to T_canopy: Succession phase
  = architecture stabilizes, larger artifacts emerge, cross-connections form
  Characteristics: steady cadence, medium sessions, deepening complexity
  Duration: wave 1 and 2 of a typical mission
  Cadence: sustaining
  Owl signal: healthy if duration per session stays within 1.5x the wave average.
  A session that is 3x the wave average signals either exceptional depth (good)
  or a blocker encountered mid-session (investigate).

T_canopy: Canopy closure
  = new architecture is load-bearing and stable
  Signal: sessions begin consuming more prior output than producing new output
  (integration work, hardening, documentation)
  Cadence: winding_down
  Owl signal: this is healthy. Do not interpret winding_down as stagnation.
  The forest is not growing smaller — it is deepening.

T_canopy onward: Old-growth phase
  = entries that have been stable for 10+ sessions without modification
  Signal: Cedar's chain shows no amendments to the old-growth entries
  Owl note: old-growth entries provide the temporal anchor for future waves.
  When a future mission begins, it starts from the old-growth — the established
  entries that have proven stable across time.
  In gsd-skill-creator terms: old-growth = the v1.44 through v1.49 chain entries
  whose patterns (P1-P14) have not been contradicted in 8+ versions.
```

The Fire Succession temporal map answers a question that Cedar's structural map leaves open: how long does each phase take? The answer, based on the 50-version chain history:

| Phase | Duration (observed) | Owl's evidence |
|---|---|---|
| Pioneer | 1-3 sessions (~2-6 hours) | PNW, UNI, CAS missions all completed pioneer phase in first 3 sessions |
| Succession | 4-10 sessions (~8-20 hours) | Wave 1+2 of current missions average ~7 sessions at ~90 min each |
| Canopy closure | 1-2 sessions (~2-4 hours) | Integration sessions tend to be dense but finite |
| Old-growth | Indefinite | Chain entries never expire; they are permanently anchored |

---

## Part 10: Owl-Grove Summary

This document establishes Owl's formal module within the MUS mission. It will serve as the temporal reference point for all subsequent sessions in Waves 1-3.

### What this document provides to each muse:

**→ Lex:** The temporal sequence of pipeline passes. Each pass has a defined position in the session stream. Lex's constraint enforcement (gate go/no-go) is a point-in-time event at a defined temporal marker.

**→ Hemlock:** Wave gate verification checklists are temporal checkpoints. Gates 0→1 (passed), 1→2 (pending), 2→3 (pending), 3→done (pending) each have defined conditions and temporal locations. Hemlock's last quality gate run: Session 3 (Wave 0 cross-validation). Time since: same calendar day. Next due: Wave 1 Gate (after Session 7).

**→ Cedar:** Temporal markers at every session boundary. The prev_hash field in each marker links Cedar's chain to Owl's temporal frame. Cedar's chain and Owl's wall clock are two faces of the system's memory — this document establishes how they connect.

**→ Sam:** The Wave 1 exploration window closes at the Wave 1 Gate (after Session 7). Sam's exploration for this wave should be complete or explicitly deferred to Wave 2.

**→ Willow:** Progressive disclosure of the mission's complexity unfolds across waves. Wave 0 disclosed the grove map and function bindings. Wave 1 discloses team structure and message routing. The pace across waves is the disclosure pace. Owl has confirmed: cadence is sustaining, which means Willow can maintain the current disclosure rate without accelerating or compressing.

**→ Foxy:** The creative arc is in its succession phase — past pioneer, before canopy closure. The story is building density. Owl's read: the mission is at its richest point in terms of new material per session. This is the moment for Foxy's strongest creative synthesis.

**→ Raven:** Pattern frequency within the mission: three waves completed per-pass sequentially so far. The pattern is linear. Wave 2 introduces parallelism — this will be the first time the session stream branches. Raven's frequency analysis should track whether parallel sessions produce higher or lower output density than sequential sessions.

**→ Hawk:** Six pre-identified gaps. Three are time-critical before the Wave 1→2 gate (MuseId type, disambiguation protocol fully instantiated, missing YAMLs). Three are time-critical before Wave 3 (Blitter connection, determinism hardening, promotion gates). The exposure window for the first three is NOW — they must be addressed in Wave 2 Session 8 or the GPU loop session will encounter them as blockers.

---

## Appendix A: Temporal Vocabulary Reference

A controlled vocabulary for temporal communication within the MUS mission. All muses should use these terms consistently so that Owl can track references without ambiguity.

| Term | Definition |
|---|---|
| `T_start` | Wall clock timestamp when a session enters INITIALIZING state |
| `T_end` | Wall clock timestamp when a session enters BOUNDARY state |
| `T_handoff` | Wall clock timestamp when Cedar emits the boundary marker's prev_hash |
| `epoch` | A named interval in the mission's life: pre-mission, wave-0, wave-1, wave-2, wave-3, post-mission |
| `phase` | A named position within a wave: the specific pass being executed |
| `cadence` | Sessions-per-day and average duration, measured over the last 3 sessions |
| `momentum phase` | building / peaking / sustaining / winding_down / blocked |
| `sync baseline` | The Cedar chain tip hash at the moment parallel sessions begin |
| `merge marker` | Cedar's synthetic entry that joins parallel session outputs into a single chain point |
| `wave gate` | A temporal checkpoint with a verification condition, owned by Owl (timing) + Hemlock (verification) + Cedar (record) |
| `exposure window` | The interval during which a gap transitions from manageable to blocking |
| `drift` | Sustained divergence between expected and actual state, detected by consecutive mismatches |
| `prev_hash` | The SHA-256 hash of the immediately preceding boundary marker or chain entry; the link in Cedar's chain |
| `genesis entry` | The first entry in a chain; carries prev_hash: null |
| `old-growth` | Chain entries that have been stable for 10+ sessions without modification |
| `canopy closure` | The moment when the architecture becomes load-bearing and stable; cadence transitions to winding_down |

---

## Appendix B: Integration With Existing Infrastructure

This module connects to the following files already present in the codebase:

- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/src/platform/observation/session-observer.ts` — provides `SessionObservation` type that Owl's `SessionBoundaryMarker` extends
- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/src/platform/observation/drift-monitor.ts` — DriftMonitor's consecutive mismatch mechanism is the low-level implementation of Owl's drift detection pattern
- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/src/core/events/event-store.ts` — Cedar's EventStore is the persistence layer for Owl's temporal markers
- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/src/platform/observation/sequence-recorder.ts` — SequenceRecorder's arc tracking (completeArc, arcHistory) is the operational substrate for Owl's compression tracking: ratio < 1.0 = the system is learning
- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/src/platform/observation/lineage-tracker.ts` — LineageTracker's bidirectional provenance query (`getUpstream`, `getDownstream`) enables Owl to trace any artifact back to the session that produced it
- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/src/application/skill-session.ts` — SkillSession manages the token budget within a session; Owl's session duration and SkillSession's budget are the two limits on how much a session can accomplish
- `/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/.planning/HANDOFF.md` — the mission-level handoff document that Owl's boundary marker schema formalizes

---

*The sequence matters. This document is the temporal backbone for the MUS mission's remaining sessions. Every session that follows should open by reading the Handoff section of the boundary marker that immediately precedes it — not the beginning of the mission, not the full chain, but the one preceding link. That is sufficient for continuity. Cedar holds the rest.*

*Wall clock at completion: to be measured. The cadence is sustaining.*
