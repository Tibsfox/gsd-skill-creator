# Semantic Test Cases and Contract Freshness Policy

**Phase:** 234 -- Integration Test Strategy
**Date:** 2026-02-19
**Status:** Active specification
**Satisfies:** INTTEST-04, INTTEST-05
**Depends on:**
- [Contract Testing Approach](contract-testing-approach.md) -- 6 priority flows, 8 boundary schemas, Zod + Vitest approach
- [Phase 232: EventDispatcher Specification](../shared-eventdispatcher-specification/envelope-unification.md) -- 6 subscriber profiles for ownership assignment
- [Phase 233: Dependency Philosophy](../dependency-philosophy/dependency-rules.md) -- 4-tier layer model (Core/Middleware/Platform/Educational) for owner classification

---

## Table of Contents

1. [Semantic Test Cases](#1-semantic-test-cases)
   - 1.1 [What Semantic Testing Is](#11-what-semantic-testing-is)
   - 1.2 [Console -> EventEnvelope Adapter](#12-boundary-1-console---eventenvelope-adapter)
   - 1.3 [Staging Metadata Validation](#13-boundary-2-staging-metadata-validation)
   - 1.4 [AMIGA EventEnvelope Bus](#14-boundary-3-amiga-eventenvelope-bus)
   - 1.5 [Chipset Copper Pipeline](#15-boundary-4-chipset-copper-pipeline)
   - 1.6 [Orchestrator State Hydration](#16-boundary-5-orchestrator-state-hydration)
   - 1.7 [Skill Validation Pipeline](#17-boundary-6-skill-validation-pipeline)
   - 1.8 [Chipset -> SessionEventBridge](#18-boundary-7-chipset---sessioneventbridge)
   - 1.9 [Dashboard Collectors](#19-boundary-8-dashboard-collectors)
   - 1.10 [Anti-Patterns](#110-anti-patterns)
2. [Contract Freshness Policy](#2-contract-freshness-policy)
   - 2.1 [Owner Assignment Rules](#21-owner-assignment-rules)
   - 2.2 [Freshness Table](#22-freshness-table)
   - 2.3 [Re-verification Trigger Categories](#23-re-verification-trigger-categories)
   - 2.4 [Staleness Threshold Rules](#24-staleness-threshold-rules)
   - 2.5 [Staleness Detection Algorithm](#25-staleness-detection-algorithm)

---

## 1. Semantic Test Cases

### 1.1 What Semantic Testing Is

Semantic contract tests verify that a Zod schema correctly **rejects** data that is structurally valid (all required fields present, correct types) but **semantically invalid** (values violate business rules, state machine constraints, or domain invariants). These tests complement the structural contracts defined in [contract-testing-approach.md](contract-testing-approach.md) Section 1.6.

Every cross-component boundary from the [boundary schema inventory](contract-testing-approach.md#3-boundary-schema-inventory) requires at least one semantic test case. Each case below provides:

| Field | Purpose |
|-------|---------|
| **Boundary** | Which cross-component boundary from Plan 01 |
| **Valid structure** | Full JSON input that parses structurally (correct types, all required fields) |
| **Semantic violation** | What makes the input semantically invalid despite passing structural checks |
| **Expected behavior** | What `.safeParse()` should return |
| **Why this matters** | What runtime failure this prevents |

---

### 1.2 Boundary 1: Console -> EventEnvelope Adapter

**Boundary:** Console `MessageEnvelopeSchema` adapted to AMIGA `EventEnvelopeSchema` (Boundary #1 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** [Flow 1: Console Message Ingestion](contract-testing-approach.md#21-flow-1-console-message-ingestion)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "id": "msg-20260219-001",
  "timestamp": "2026-02-19T14:30:22.000Z",
  "source": "not a valid/source!",
  "destination": "broadcast",
  "type": "CONSOLE_MESSAGE",
  "priority": "normal",
  "payload": {
    "text": "Hello from console",
    "_console_source": "dashboard"
  },
  "correlation": null,
  "requires_ack": false
}
```

**Semantic violation:** The `source` field is a valid string (passes type check) but does not match `AGENT_OR_SPECIAL_PATTERN` regex. The pattern requires sources like `ME-1`, `MC-1`, `broadcast`, `CE-1`, or the future `console:dashboard` format. The value `"not a valid/source!"` is a non-empty string (structurally valid) but semantically rejected because it does not identify a recognized agent or special source.

**Expected behavior:**

```typescript
const result = EventEnvelopeSchema.safeParse(input);
expect(result.success).toBe(false);
// Error path: "source"
// Error: string does not match AGENT_OR_SPECIAL_PATTERN
```

**Why this matters:** If the adapter accepted arbitrary source strings, downstream routing (ICD dispatch, correlation tracking) would fail silently. Events with unrecognized sources cannot be traced back to their origin, making debugging impossible.

**Additional semantic test case -- non-UTC timestamp:**

```json
{
  "id": "msg-20260219-002",
  "timestamp": "2026-02-19T14:30:22+05:30",
  "source": "broadcast",
  "destination": "broadcast",
  "type": "CONSOLE_MESSAGE",
  "priority": "normal",
  "payload": {},
  "correlation": null,
  "requires_ack": false
}
```

**Semantic violation:** The `timestamp` is a valid ISO 8601 string but not UTC (has `+05:30` offset instead of trailing `Z`). The EventEnvelope protocol requires UTC timestamps for consistent ordering and correlation across subsystems.

**Expected behavior:** `.safeParse()` returns `{ success: false }` with error on `"timestamp"` path.

---

### 1.3 Boundary 2: Staging Metadata Validation

**Boundary:** `StagingMetadataSchema` state machine transitions (Boundary #2 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** [Flow 2: Staging Intake Pipeline](contract-testing-approach.md#22-flow-2-staging-intake-pipeline)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "submitted_at": "2026-02-19T15:00:00.000Z",
  "source": "dashboard",
  "status": "inbox",
  "checked_at": "2026-02-19T15:01:30.000Z"
}
```

**Semantic violation:** The metadata has `status: "inbox"` but includes a `checked_at` timestamp. This is a semantic contradiction -- items in `inbox` status have not been checked yet. The `checked_at` field should only be present when `status` is `checking`, `attention`, `ready`, or `aside`. An inbox item with a `checked_at` timestamp indicates a state machine violation: the status was set backward without clearing transition metadata.

**Expected behavior:** Since `StagingMetadataSchema` uses `.passthrough()`, this particular violation passes Zod parsing (the schema accepts extra fields). The semantic contract test here verifies that the **application layer** detects and rejects this inconsistency:

```typescript
// The schema itself passes (passthrough accepts checked_at)
const parseResult = StagingMetadataSchema.safeParse(input);
expect(parseResult.success).toBe(true);

// But the state transition validator must reject it
const transitionResult = validateStagingTransition(parseResult.data);
expect(transitionResult.valid).toBe(false);
expect(transitionResult.error).toContain('inbox items must not have checked_at');
```

**Why this matters:** If inbox items carry `checked_at` timestamps, the staging pipeline may skip re-checking on status transitions, promoting unchecked documents to `ready` status.

**Additional semantic test case -- invalid status value:**

```json
{
  "submitted_at": "2026-02-19T15:00:00.000Z",
  "source": "dashboard",
  "status": "complete"
}
```

**Semantic violation:** `status: "complete"` is a valid string but not a member of `STAGING_STATES` enum (`inbox`, `checking`, `attention`, `ready`, `aside`). The value is semantically invalid because no staging state machine transition leads to `complete`.

**Expected behavior:** `.safeParse()` returns `{ success: false }` with error on `"status"` path (enum validation failure).

---

### 1.4 Boundary 3: AMIGA EventEnvelope Bus

**Boundary:** `EventEnvelopeSchema` with ICD payload routing (Boundary #4 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** [Flow 3: AMIGA EventEnvelope Bus](contract-testing-approach.md#23-flow-3-amiga-eventenvelope-bus)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-19T15:10:05.123Z",
  "source": "ME-1",
  "destination": "MC-1",
  "type": "TELEMETRY_UPDATE",
  "priority": "urgent",
  "payload": {
    "metric_name": "cpu_usage",
    "value": 0.73,
    "unit": "percent",
    "timestamp": "2026-02-19T15:10:00.000Z"
  },
  "correlation": null,
  "requires_ack": false
}
```

**Semantic violation:** The envelope has `priority: "urgent"` but `requires_ack: false`. This is a semantic contradiction in the AMIGA protocol: urgent-priority messages must require acknowledgment to ensure they are not silently dropped by subscribers. A message marked urgent without ack requirement could be lost in the event bus without any consumer confirming receipt.

**Expected behavior:** The schema-level check may pass (if `priority` and `requires_ack` are independently validated), so the semantic contract must verify the business rule:

```typescript
// Schema parses successfully (no cross-field validation in Zod)
const parseResult = EventEnvelopeSchema.safeParse(input);
expect(parseResult.success).toBe(true);

// Protocol-level semantic rule: urgent requires ack
if (parseResult.success) {
  const envelope = parseResult.data;
  expect(
    envelope.priority === 'urgent' && !envelope.requires_ack
  ).toBe(false); // This SHOULD fail if the rule is not enforced
}
```

**Why this matters:** If urgent messages do not require acknowledgment, the AMIGA bus cannot guarantee delivery of critical events. Telemetry alerts, gate signals, and dispute records marked urgent would be fire-and-forget, defeating the purpose of the priority system.

**Additional semantic test case -- empty payload for typed event:**

```json
{
  "id": "evt-003",
  "timestamp": "2026-02-19T15:10:05.123Z",
  "source": "ME-1",
  "destination": "MC-1",
  "type": "TELEMETRY_UPDATE",
  "priority": "normal",
  "payload": {},
  "correlation": null,
  "requires_ack": false
}
```

**Semantic violation:** The `type` is `TELEMETRY_UPDATE` but the `payload` is an empty object `{}`. The envelope schema accepts any object as payload, but ICD-01 `TelemetryUpdatePayloadSchema` requires `metric_name`, `value`, `unit`, and `timestamp`. A semantically valid telemetry update cannot have an empty payload.

**Expected behavior:** The envelope parses successfully, but the ICD-01 payload validation rejects:

```typescript
const envelopeResult = EventEnvelopeSchema.safeParse(input);
expect(envelopeResult.success).toBe(true);

const payloadResult = TelemetryUpdatePayloadSchema.safeParse(input.payload);
expect(payloadResult.success).toBe(false);
```

---

### 1.5 Boundary 4: Chipset Copper Pipeline

**Boundary:** `PipelineSchema` and `PipelineInstructionSchema` (Boundary #3 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** [Flow 4: Chipset Copper Pipeline](contract-testing-approach.md#24-flow-4-chipset-copper-pipeline)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "metadata": {
    "name": "phase-execution",
    "description": "Activate skills for GSD phase execution",
    "priority": 80,
    "confidence": 0.95,
    "tags": ["gsd", "execution"],
    "version": 1
  },
  "instructions": [
    {
      "type": "wait",
      "event": "nonexistent-lifecycle-event",
      "timeout": 5000,
      "description": "Wait for a fabricated event"
    },
    {
      "type": "move",
      "target": "skill",
      "name": "beautiful-commits",
      "mode": "lite",
      "description": "Load commit formatting skill"
    }
  ]
}
```

**Semantic violation:** The WAIT instruction references `event: "nonexistent-lifecycle-event"` -- a string that is not in the valid GSD lifecycle event set (`phase-start`, `phase-planned`, `code-complete`, `tests-passing`, `verify-complete`, `end-of-frame`, `milestone-start`, `milestone-complete`, `session-start`, `session-pause`, `session-resume`, `session-stop`). The value is a valid string type but does not correspond to any event the Copper runtime will ever emit.

**Expected behavior:**

```typescript
const result = PipelineSchema.safeParse(input);
// If the schema validates event names via enum/regex:
expect(result.success).toBe(false);
// Error path: "instructions[0].event"

// If schema allows any string for event:
// Then the compiler must catch this:
expect(() => compilePipeline(input)).toThrow(/unknown lifecycle event/);
```

**Why this matters:** A pipeline waiting for an event that never fires will hang indefinitely at the WAIT instruction, blocking all subsequent instructions. No skill loads, no automation runs. The pipeline becomes a silent deadlock.

**Additional semantic test case -- MOVE with empty name:**

```json
{
  "metadata": {
    "name": "broken-pipeline",
    "description": "Pipeline with empty MOVE name",
    "priority": 50,
    "confidence": 0.5,
    "tags": [],
    "version": 1
  },
  "instructions": [
    {
      "type": "move",
      "target": "skill",
      "name": "",
      "mode": "full",
      "description": "Load... nothing"
    }
  ]
}
```

**Semantic violation:** The MOVE instruction has `name: ""` -- an empty string. It is structurally a string but semantically invalid because a MOVE instruction must reference a real skill, script, or team by name. An empty name cannot resolve to any artifact in the skill store.

**Expected behavior:** `.safeParse()` returns `{ success: false }` with error on `"instructions[0].name"` (min length 1 or regex pattern failure).

---

### 1.6 Boundary 5: Orchestrator State Hydration

**Boundary:** `ProjectStateSchema`, `GsdConfigSchema`, `CurrentPositionSchema` (Boundary #7 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** [Flow 5: Orchestrator State Hydration](contract-testing-approach.md#25-flow-5-orchestrator-state-hydration)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "initialized": true,
  "config": {
    "mode": "yolo",
    "depth": "comprehensive",
    "parallelization": true,
    "commit_docs": false,
    "model_profile": "quality"
  },
  "position": {
    "phase": 5,
    "totalPhases": 5,
    "phaseName": "integration-test-strategy",
    "phaseStatus": "in-progress",
    "plan": 0,
    "totalPlans": 3,
    "status": "executing",
    "progressPercent": 60,
    "lastActivity": "2026-02-19"
  },
  "phases": [],
  "plansByPhase": {},
  "project": {
    "name": "gsd-skill-creator",
    "coreValue": "Skills, agents, and teams must match official Claude Code patterns",
    "currentMilestone": "v1.25",
    "description": null
  },
  "state": null,
  "hasRoadmap": true,
  "hasState": true,
  "hasProject": true,
  "hasConfig": true
}
```

**Semantic violation:** The `position` has `phase: 5` (a non-zero phase) but `plan: 0`. This is a semantic contradiction -- if a phase is in progress (`phaseStatus: "in-progress"`, `status: "executing"`), it must have at least plan 1. A plan count of 0 means the phase has no plans at all, yet the status claims execution is underway. This violates the GSD lifecycle invariant: every executing phase has at least one plan.

**Expected behavior:**

```typescript
const result = ProjectStateSchema.safeParse(input);
// Schema may accept it structurally (plan is a valid number)
expect(result.success).toBe(true);

// Business logic validation must catch the contradiction:
if (result.success) {
  const state = result.data;
  const isInvalid = state.position.phase > 0
    && state.position.plan === 0
    && state.position.status === 'executing';
  expect(isInvalid).toBe(true); // Flag for caller to reject
}
```

**Why this matters:** The orchestrator uses `position.plan` to route to the current plan file (e.g., `234-02-PLAN.md`). Plan 0 does not exist as a file. The state reader would attempt to read a non-existent file, crash, and block every GSD command.

**Additional semantic test case -- invalid mode value:**

```json
{
  "mode": "turbo",
  "depth": "comprehensive",
  "parallelization": true,
  "commit_docs": false,
  "model_profile": "quality"
}
```

**Semantic violation:** `mode: "turbo"` is a valid string but not a recognized GSD mode. Valid modes are `yolo` (autonomous) and `interactive` (with confirmations). A config with an unrecognized mode would cause the orchestrator to fall through all mode-specific branches.

**Expected behavior:** `GsdConfigSchema.safeParse()` returns `{ success: false }` with error on `"mode"` (enum validation failure, expected `"yolo"` or `"interactive"`).

---

### 1.7 Boundary 6: Skill Validation Pipeline

**Boundary:** `SkillInputSchema` and `SkillMetadataSchema` (Boundary #8 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** [Flow 6: Skill Validation and Storage](contract-testing-approach.md#26-flow-6-skill-validation-and-storage)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "name": "beautiful-commits",
  "description": "Format commit messages following Conventional Commits with imperative mood",
  "allowed-tools": ["Bash", "Read", "Grep"],
  "user-invocable": true,
  "model": "claude-opus-4-6",
  "enabled": true,
  "triggers": {
    "patterns": [],
    "file_patterns": [".git/COMMIT_EDITMSG"]
  },
  "learning": {
    "corrections": [],
    "min_corrections_for_refinement": 3,
    "cooldown_days": 7,
    "max_change_percent": 20
  },
  "version": 2
}
```

**Semantic violation:** `triggers.patterns` is an empty array `[]`. Structurally, an array of strings with zero elements is valid. Semantically, a skill must have at least one trigger pattern -- without a trigger, the 6-stage activation pipeline has no way to activate the skill. It would never fire, making the skill inert. The `file_patterns` alone are insufficient because file pattern matching is a secondary activation mechanism that supplements (not replaces) text trigger patterns.

**Expected behavior:**

```typescript
const result = SkillInputSchema.safeParse(input);
// If schema enforces min(1) on triggers.patterns:
expect(result.success).toBe(false);
// Error path: "triggers.patterns"
// Error: array must have at least 1 element

// If schema allows empty array:
// Then the validation pipeline must catch this:
const validationResult = validateSkillInput(input);
expect(validationResult.valid).toBe(false);
expect(validationResult.errors).toContain('skill must have at least one trigger pattern');
```

**Why this matters:** A skill with no trigger patterns will never appear in activation scoring results. It will exist in the skill store but never be surfaced to users, wasting storage and causing confusion when the skill "does not work."

**Additional semantic test case -- description exceeding limit:**

```json
{
  "name": "verbose-skill",
  "description": "A".repeat(1025),
  "allowed-tools": ["Bash"],
  "user-invocable": true,
  "model": "claude-opus-4-6",
  "enabled": true,
  "triggers": {
    "patterns": ["test"],
    "file_patterns": []
  },
  "version": 1
}
```

Note: The above uses pseudocode `"A".repeat(1025)` to represent a 1025-character string. In the actual test, this would be a literal 1025-character string.

**Semantic violation:** `description` is 1025 characters, exceeding the 1024-character maximum. The string is structurally valid (it is a string) but semantically invalid because skill descriptions are bounded to prevent context window bloat during the 6-stage loading pipeline.

**Expected behavior:** `.safeParse()` returns `{ success: false }` with error on `"description"` path (max length constraint).

---

### 1.8 Boundary 7: Chipset -> SessionEventBridge

**Boundary:** Session state transitions between Chipset and Copper lifecycle sync (Boundary #5 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** Chipset session events (`src/chipset/integration/session-events.ts`) -> Copper lifecycle sync (`src/chipset/copper/lifecycle-sync.ts`)

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "session_id": "sess-20260219-001",
  "timestamp": "2026-02-19T16:00:00.000Z",
  "from": "complete",
  "to": "active",
  "reason": "user-requested",
  "metadata": {
    "phase": 234,
    "plan": 2
  }
}
```

**Semantic violation:** The transition is from `"complete"` to `"active"` -- a reverse transition that violates the session lifecycle ordering. Valid session state transitions follow a forward-only flow: `idle` -> `active` -> `paused` -> `active` (resume) -> `complete`. A completed session cannot transition back to active. The string values are valid session state names, but the transition direction is semantically invalid.

**Expected behavior:**

```typescript
// If the schema encodes valid transitions:
const result = SessionTransitionSchema.safeParse(input);
expect(result.success).toBe(false);

// If the schema validates states independently:
const result = SessionTransitionSchema.safeParse(input);
expect(result.success).toBe(true);

// Then the transition validator must catch it:
const transitionResult = validateSessionTransition(result.data);
expect(transitionResult.valid).toBe(false);
expect(transitionResult.error).toContain('invalid transition: complete -> active');
```

**Why this matters:** If a completed session could transition to active, the Copper lifecycle sync would re-emit `session-start` events, causing pipelines to re-execute instructions that already ran. Skills would be loaded twice, state would be corrupted, and the session history would show impossible state sequences.

---

### 1.9 Boundary 8: Dashboard Collectors

**Boundary:** Collector output schemas consumed by Console, Staging, and Chipset consumers (Boundary #6 in [inventory](contract-testing-approach.md#31-implementedpartial-boundaries))

**Flow reference:** Dashboard collectors (`src/dashboard/collectors/*.ts`) provide data to Console, Staging, and Chipset subsystems

**Valid structure (structurally correct, semantically invalid):**

```json
{
  "collector": "staging-status",
  "timestamp": "2027-06-15T12:00:00.000Z",
  "data": {
    "inbox_count": 3,
    "checking_count": 1,
    "ready_count": 5,
    "total_items": 9
  },
  "duration_ms": 42,
  "success": true
}
```

**Semantic violation:** The `timestamp` is `"2027-06-15T12:00:00.000Z"` -- a valid ISO 8601 UTC string that parses correctly but is in the future (over a year from the current date 2026-02-19). A collector output timestamp represents when the collection actually occurred. A future timestamp is semantically impossible for a past-tense collection event. It indicates either a system clock error or data corruption.

**Expected behavior:**

```typescript
// Schema parses structurally (valid ISO 8601 string):
const result = CollectorOutputSchema.safeParse(input);
expect(result.success).toBe(true);

// Semantic validation must reject future timestamps:
if (result.success) {
  const collectedAt = new Date(result.data.timestamp);
  const now = new Date();
  expect(collectedAt.getTime()).toBeLessThanOrEqual(now.getTime());
}
```

**Why this matters:** Dashboard metrics with future timestamps corrupt time-series displays, break "last collected" ordering, and make freshness calculations negative (showing items as "collected -365 days ago"). Consumers trusting the timestamp for cache invalidation would treat future-timestamped data as perpetually fresh.

**Additional semantic test case -- negative count values:**

```json
{
  "collector": "staging-status",
  "timestamp": "2026-02-19T16:30:00.000Z",
  "data": {
    "inbox_count": -2,
    "checking_count": 1,
    "ready_count": 5,
    "total_items": 4
  },
  "duration_ms": 38,
  "success": true
}
```

**Semantic violation:** `inbox_count: -2` is a valid number but semantically impossible -- you cannot have a negative count of items in a staging queue. Additionally, the `total_items` (4) does not equal the sum of individual counts (-2 + 1 + 5 = 4), which happens to be numerically consistent only by coincidence of the negative value.

**Expected behavior:** If the schema uses `z.number().nonnegative()`, `.safeParse()` rejects directly. If it allows any number, the semantic contract test must verify non-negative counts at the application layer.

---

### 1.10 Anti-Patterns

What NOT to do when writing semantic contract tests. These anti-patterns are derived from the general [contract testing anti-patterns](contract-testing-approach.md#appendix-anti-patterns) and refined for semantic-specific pitfalls.

**Anti-Pattern 1: Testing with obviously invalid data**

Do NOT test with `null`, `undefined`, `42` (for a string field), or missing required fields. That is structural testing. Structural contracts already cover this via `.toJSONSchema()` snapshots and Zod's type system.

```typescript
// WRONG: This is structural, not semantic
EventEnvelopeSchema.safeParse({ id: null }); // Missing fields, wrong types
EventEnvelopeSchema.safeParse(undefined);     // Not even an object
```

Semantic tests must always provide ALL required fields with CORRECT types. The violation is in the **value**, not the **shape**.

**Anti-Pattern 2: Testing internal logic through the boundary**

Do NOT test how a module computes a value. Test only what crosses the boundary interface.

```typescript
// WRONG: Testing internal Copper compiler logic
expect(compiler.optimizeInstructions(pipeline)).toHaveLength(2);

// RIGHT: Testing that semantically invalid input is rejected at the boundary
expect(PipelineSchema.safeParse(pipelineWithInvalidEvent).success).toBe(false);
```

**Anti-Pattern 3: Mocking the Zod schema**

Do NOT mock `EventEnvelopeSchema`, `PipelineSchema`, or any other Zod schema in contract tests. The entire purpose of contract testing is to validate against the REAL schema. Mocking it defeats the contract.

```typescript
// WRONG: Mocked schema always returns what you want
const mockSchema = { safeParse: () => ({ success: true, data: {} }) };

// RIGHT: Import and use the real schema
import { EventEnvelopeSchema } from '../../amiga/message-envelope.js';
const result = EventEnvelopeSchema.safeParse(input);
```

**Anti-Pattern 4: Testing only the happy path**

Do NOT write semantic tests that only verify valid data passes. The purpose of semantic tests is to verify that **invalid** data is **rejected**. Every semantic test case must have `expect(result.success).toBe(false)` or an equivalent rejection assertion.

**Anti-Pattern 5: Ignoring cross-field constraints**

Do NOT test fields in isolation when the semantic violation spans multiple fields. The urgent-without-ack case (Boundary 3) and inbox-with-checked_at case (Boundary 2) both require checking field combinations, not individual field values.

---

## 2. Contract Freshness Policy

### 2.1 Owner Assignment Rules

Contract ownership determines who is responsible for maintaining, re-verifying, and updating a contract when schemas change.

**Rule 1: Producer-side ownership (default)**

The module that **exports** the schema owns the contract. Rationale: the producer defines the data shape and is the authority on what valid data looks like.

- `EventEnvelopeSchema` is exported from `src/amiga/message-envelope.ts` -> AMIGA module owns the EventEnvelope contract.
- `PipelineSchema` is exported from `src/chipset/copper/schema.ts` -> Chipset module owns the Pipeline contract.

**Rule 2: Consumer-side adapter ownership (dual-export exception)**

When BOTH sides export schemas (e.g., Console exports `MessageEnvelopeSchema`, AMIGA exports `EventEnvelopeSchema`), the **consumer-side adapter** owns the contract because the adapter is where schema mismatch surfaces.

- Console -> EventEnvelope adapter: the adapter function (in `src/console/` or a shared adapter module) owns this contract, not Console or AMIGA alone.

**Rule 3: Layer model classification (from Phase 233 4-tier model)**

Owner assignment cross-references the dependency philosophy's 4-tier layer model:

| Layer | Schema Ownership Pattern | Examples |
|-------|------------------------|----------|
| **Core** | Core-layer modules own foundational schemas | `src/amiga/` owns `EventEnvelopeSchema`, ICD schemas |
| **Middleware** | Middleware-layer modules own their subsystem schemas | `src/staging/` owns `StagingMetadataSchema`, `src/validation/` owns `SkillInputSchema` |
| **Platform** | Platform-layer modules own integration schemas | `src/orchestrator/` owns `ProjectStateSchema`, `GsdConfigSchema` |
| **Educational** | Educational-layer modules do not own cross-component contracts | AGC modules are self-contained; no cross-boundary contracts |

**Rule 4: Subscriber profile cross-reference**

The 6 subscriber profiles from Phase 232 (ConsoleWatcher, StagingWatcher, DashboardNotifier, ChipsetHotReload, DocsRebuilder, SourceWatcher) inform ownership of event-consuming contracts. Each subscriber that consumes EventEnvelope data shares co-ownership of the envelope contract with the AMIGA core owner.

---

### 2.2 Freshness Table

Every contract boundary from [Plan 01's inventory](contract-testing-approach.md#3-boundary-schema-inventory) with ownership, schema file paths, freshness metadata, and re-verification triggers.

| # | Boundary | Owner Module | Schema File(s) | Last Verified | Staleness Threshold | Re-verification Triggers |
|---|----------|-------------|-----------------|---------------|---------------------|-------------------------|
| 1 | Console -> EventEnvelope adapter | `src/console/` (adapter) | `src/console/schema.ts`, `src/amiga/message-envelope.ts` | 2026-02-19 | 60 days | Schema file change, Zod major bump, New subscriber registration |
| 2 | Staging metadata state machine | `src/staging/` | `src/staging/schema.ts` | 2026-02-19 | 60 days | Schema file change, Zod major bump, Milestone completion |
| 3 | Chipset Copper pipeline | `src/chipset/copper/` | `src/chipset/copper/schema.ts` | 2026-02-19 | 90 days | Schema file change, Zod major bump, Milestone completion |
| 4 | EventEnvelope bus (AMIGA) | `src/amiga/` | `src/amiga/message-envelope.ts`, `src/amiga/icd/icd-01.ts` through `icd-04.ts` | 2026-02-19 | 60 days | Schema file change, Zod major bump, New subscriber registration, Milestone completion |
| 5 | Chipset -> SessionEventBridge | `src/chipset/integration/` | `src/chipset/integration/session-events.ts`, `src/chipset/copper/lifecycle-sync.ts` | 2026-02-19 | 90 days | Schema file change, Zod major bump, Milestone completion |
| 6 | Dashboard collectors | `src/dashboard/collectors/` | `src/dashboard/collectors/*.ts` | 2026-02-19 | 90 days | Schema file change, Zod major bump, Milestone completion |
| 7 | Orchestrator state reader | `src/orchestrator/state/` | `src/orchestrator/state/types.ts` | 2026-02-19 | 60 days | Schema file change, Zod major bump, Milestone completion |
| 8 | Skill validation pipeline | `src/validation/` | `src/validation/skill-validation.ts` | 2026-02-19 | 90 days | Schema file change, Zod major bump, New subscriber registration |
| 9 | EventDispatcher -> 6 subscribers | `src-tauri/src/` (Rust) | `src-tauri/src/watcher.rs` | Not yet verified | Aspirational | Milestone planning review only |
| 10 | Silicon -> Chipset config | Not assigned | Not yet created | Not yet verified | Aspirational | Milestone planning review only |
| 11 | GSD-ISA -> Chipset bus | Not assigned | Not yet created | Not yet verified | Aspirational | Milestone planning review only |

---

### 2.3 Re-verification Trigger Categories

Four categories of events that trigger contract re-verification. Each trigger type has a specific detection mechanism.

**Category 1: Schema file modification**

**Trigger:** `git diff` detects any change to a schema source file listed in the freshness table's "Schema File(s)" column.

**Detection:** A pre-commit hook or CI step runs `git diff --name-only HEAD~1` and checks if any modified file matches a schema path from the freshness table. If a schema file changed, all contracts listing that file must be re-verified.

**Scope:** Only the contracts that reference the changed schema file. A change to `src/staging/schema.ts` triggers re-verification of Boundary #2 only, not all 8 boundaries.

**Category 2: Zod major version bump**

**Trigger:** `package.json` `zod` dependency changes its major version (e.g., `4.x.y` to `5.0.0`).

**Detection:** Compare the zod version in `package.json` before and after a dependency update. If the major version increments, ALL contracts must be re-verified because Zod's `.toJSONSchema()` output format, `.passthrough()` behavior, or `.safeParse()` error shapes may have changed.

**Scope:** All implemented contracts (Boundaries #1-#8). A Zod major bump is a global trigger because every contract depends on Zod's runtime behavior.

**Category 3: Milestone completion**

**Trigger:** A GSD milestone is completed (e.g., `v1.25` ships).

**Detection:** The `gsd-tools milestone complete` command emits a completion event. At this point, all contracts in subsystems affected by the milestone's phases should be reviewed.

**Scope:** Contracts in subsystems that had phases in the completed milestone. For v1.25 (phases 231-235), all 8 implemented boundaries would be reviewed because v1.25 touches the integration test strategy directly. For a future milestone that only affects `src/chipset/`, only Boundaries #3, #5 would need re-verification.

**Category 4: New subscriber registration**

**Trigger:** The EventDispatcher (from Phase 232's specification) gains a new consumer -- a 7th subscriber profile is added, or an existing subscriber changes its event filter.

**Detection:** New subscriber registration requires modifying the subscriber configuration in `src-tauri/src/watcher.rs` or the TypeScript subscriber registry. A code review or CI check detects new subscriber registrations.

**Scope:** All envelope-consuming contracts (Boundaries #1, #4, #8). A new subscriber means a new consumer of EventEnvelope data, and all envelope contracts must verify that the new subscriber's expectations are compatible.

---

### 2.4 Staleness Threshold Rules

Three tiers of staleness thresholds based on boundary criticality.

**Critical-path boundaries: 60 days**

Applies to boundaries on the GSD critical path (from Phase 231's critical path analysis: skill-creator -> chipset -> gsd-os -> bbs-pack -> creative-suite).

| Boundary | Why Critical |
|----------|-------------|
| #1 Console -> EventEnvelope adapter | Primary user-facing ingestion path; every dashboard interaction crosses this |
| #2 Staging metadata state machine | Gateway for all new work entering GSD; state machine correctness is essential |
| #4 EventEnvelope bus (AMIGA) | Canonical wire format for the entire ecosystem; all subsystems depend on it |
| #7 Orchestrator state reader | Decision-making hub; runs at every session start and every GSD command |

**Standard boundaries: 90 days**

Applies to boundaries that are important but not on the critical execution path.

| Boundary | Why Standard |
|----------|-------------|
| #3 Chipset Copper pipeline | Skill activation pipelines; important but failure is recoverable (skip pipeline, load skills directly) |
| #5 Chipset -> SessionEventBridge | Session lifecycle events; failure causes incorrect lifecycle sync but does not block work |
| #6 Dashboard collectors | Data collection for display; failure causes stale dashboard data but does not block execution |
| #8 Skill validation pipeline | Skill storage; failure blocks new skill creation but does not affect already-loaded skills |

**Aspirational boundaries: No automatic threshold**

Applies to boundaries that exist in the ecosystem DAG but have no implemented code.

| Boundary | Review Cadence |
|----------|---------------|
| #9 EventDispatcher -> 6 subscribers | Reviewed at milestone planning only |
| #10 Silicon -> Chipset config | Reviewed at milestone planning only |
| #11 GSD-ISA -> Chipset bus | Reviewed at milestone planning only |

Aspirational boundaries are checked during milestone planning to determine if they have become implementable. They do not have automatic staleness thresholds because there is no schema to verify.

---

### 2.5 Staleness Detection Algorithm

Pseudocode for a CI step or pre-milestone script that checks contract freshness and produces warnings.

```
FUNCTION check_contract_freshness():
    # Load freshness table from this specification
    freshness_table = parse_freshness_table("semantic-tests-and-freshness.md")
    today = current_date_utc()
    warnings = []
    errors = []

    FOR each boundary IN freshness_table:
        # Skip aspirational boundaries (no automatic threshold)
        IF boundary.staleness_threshold == "Aspirational":
            CONTINUE

        # Calculate days since last verification
        IF boundary.last_verified == "Not yet verified":
            warnings.APPEND({
                boundary: boundary.name,
                severity: "WARN",
                message: "Never verified -- schedule initial verification"
            })
            CONTINUE

        days_since = days_between(boundary.last_verified, today)
        threshold_days = parse_days(boundary.staleness_threshold)

        # Check staleness
        IF days_since > threshold_days:
            severity = "ERROR" IF boundary.staleness_threshold == "60 days"
                       ELSE "WARN"
            errors.APPEND({
                boundary: boundary.name,
                severity: severity,
                message: "Contract stale: last verified {boundary.last_verified} "
                         "({days_since} days ago, threshold: {threshold_days} days)",
                owner: boundary.owner_module,
                action: "Run contract tests for {boundary.schema_files}"
            })

        # Check for triggered re-verification (schema file changes)
        FOR each schema_file IN boundary.schema_files:
            last_modified = git_log_last_modified(schema_file)
            IF last_modified > boundary.last_verified:
                warnings.APPEND({
                    boundary: boundary.name,
                    severity: "WARN",
                    message: "Schema file {schema_file} modified on {last_modified} "
                             "but contract last verified on {boundary.last_verified}",
                    action: "Re-run contract tests and update last_verified date"
                })

    # Check Zod version trigger
    current_zod_major = parse_major_version(package_json.dependencies.zod)
    last_known_zod_major = read_state("last_verified_zod_major")
    IF current_zod_major != last_known_zod_major:
        errors.APPEND({
            boundary: "ALL",
            severity: "ERROR",
            message: "Zod major version changed from {last_known_zod_major} "
                     "to {current_zod_major} -- all contracts require re-verification",
            action: "Run all contract tests, update all last_verified dates"
        })

    # Output results
    IF errors.length > 0:
        PRINT "CONTRACT FRESHNESS: {errors.length} ERROR(s), {warnings.length} WARNING(s)"
        FOR each item IN errors + warnings:
            PRINT "[{item.severity}] {item.boundary}: {item.message}"
        RETURN exit_code = 1  # Fail CI if errors exist

    ELSE IF warnings.length > 0:
        PRINT "CONTRACT FRESHNESS: {warnings.length} WARNING(s)"
        FOR each item IN warnings:
            PRINT "[{item.severity}] {item.boundary}: {item.message}"
        RETURN exit_code = 0  # Warnings don't fail CI

    ELSE:
        PRINT "CONTRACT FRESHNESS: All contracts verified within threshold"
        RETURN exit_code = 0
```

**Integration points:**

- **CI pipeline:** Run `check_contract_freshness()` as a non-blocking check in CI. Errors produce visible warnings; threshold violations become blocking only after a configurable grace period.
- **Milestone planning:** Run before `/gsd:new-milestone` to identify stale contracts that need attention in the upcoming milestone.
- **Post-milestone:** Run after `gsd-tools milestone complete` to update `last_verified` dates for all contracts in affected subsystems.

---

*Phase: 234 -- Integration Test Strategy*
*Document: Semantic Test Cases and Contract Freshness Policy*
*Date: 2026-02-19*
