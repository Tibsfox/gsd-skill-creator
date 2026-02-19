# Contract Testing Approach for GSD Ecosystem

**Phase:** 234 -- Integration Test Strategy
**Date:** 2026-02-19
**Status:** Active specification
**Satisfies:** INTTEST-01, INTTEST-02, INTTEST-03
**Depends on:**
- [Phase 231: Ecosystem Dependency Map](../ecosystem-dependency-map/edge-inventory.md) -- 20-node DAG with 48 typed edges defining all cross-component boundaries
- [Phase 232: EventDispatcher Specification](../shared-eventdispatcher-specification/envelope-unification.md) -- EventEnvelope as canonical wire format, 6 subscriber profiles
- [Phase 233: Dependency Philosophy](../dependency-philosophy/dependency-rules.md) -- 4-tier layer model (Core/Middleware/Platform/Educational) for boundary classification

---

## Table of Contents

1. [Contract Testing Approach](#1-contract-testing-approach)
   - 1.1 [Approach Overview](#11-approach-overview)
   - 1.2 [Why Zod + Vitest](#12-why-zod--vitest)
   - 1.3 [Pact Rejection Rationale](#13-pact-rejection-rationale)
   - 1.4 [Other Rejected Alternatives](#14-other-rejected-alternatives)
   - 1.5 [Contract Test File Convention](#15-contract-test-file-convention)
   - 1.6 [Two Contract Types](#16-two-contract-types)
   - 1.7 [Note on expect.schemaMatching](#17-note-on-expectschemamatching)
2. [Priority Integration Flows](#2-priority-integration-flows)
   - 2.1 [Console Message Ingestion](#21-flow-1-console-message-ingestion)
   - 2.2 [Staging Intake Pipeline](#22-flow-2-staging-intake-pipeline)
   - 2.3 [AMIGA EventEnvelope Bus](#23-flow-3-amiga-eventenvelope-bus)
   - 2.4 [Chipset Copper Pipeline](#24-flow-4-chipset-copper-pipeline)
   - 2.5 [Orchestrator State Hydration](#25-flow-5-orchestrator-state-hydration)
   - 2.6 [Skill Validation and Storage](#26-flow-6-skill-validation-and-storage)
3. [Boundary Schema Inventory](#3-boundary-schema-inventory)
   - 3.1 [Implemented/Partial Boundaries](#31-implementedpartial-boundaries)
   - 3.2 [Aspirational Boundaries](#32-aspirational-boundaries)
4. [Appendix: Anti-Patterns](#appendix-anti-patterns)

---

## 1. Contract Testing Approach

### 1.1 Approach Overview

The GSD ecosystem uses **Zod `.toJSONSchema()` + Vitest** for contract testing across all cross-component boundaries.

Contracts are defined as Zod schemas -- the project already has **100+ exported Zod schemas across 40+ modules**, making Zod the single source of truth for data shapes at every boundary. Contract tests use two complementary validation mechanisms:

- **Structural validation** via `.toJSONSchema()` snapshot comparison -- detects when a schema's shape changes unexpectedly (field added, type changed, constraint modified). Generates JSON Schema Draft 2020-12 from any Zod schema.
- **Semantic validation** via `.parse()` / `.safeParse()` -- verifies that schemas correctly accept valid data and reject structurally-valid-but-semantically-invalid data (wrong enum values, regex failures, constraint violations).

The test runner is **Vitest 4.0.18** (already installed as the project's test framework). No new packages are required. The entire contract testing mechanism uses only what is already in the project.

### 1.2 Why Zod + Vitest

Five reasons this approach is the correct fit for the GSD ecosystem:

| # | Reason | Detail |
|---|--------|--------|
| 1 | **100+ Zod schemas already exist** | Schemas define every data boundary in the project. They ARE the contracts. No new schema language or format needed. |
| 2 | **`.toJSONSchema()` is built-in to Zod 4** | Zod 4.3.6 (installed) provides first-party JSON Schema generation. No external package like the deprecated `zod-to-json-schema`. Generates Draft 2020-12 with `additionalProperties: {}` for `.passthrough()` schemas. |
| 3 | **`.passthrough()` already used in 49 files** | Forward compatibility is already built into the schema ecosystem. Contract tests can verify this property is preserved. |
| 4 | **Vitest snapshot testing detects structural drift** | `toMatchSnapshot()` creates reviewable, deterministic JSON Schema snapshots. When a schema changes, the snapshot diff shows exactly what changed. |
| 5 | **Single codebase = no broker infrastructure** | All GSD components live in one repository, same Node.js process. No need for Pact Broker, consumer/provider deployment coordination, or network contract verification. |

### 1.3 Pact Rejection Rationale

**Pact is explicitly rejected** for the GSD ecosystem. Five documented reasons:

1. **HTTP-focused architecture.** Pact's core model is consumer-provider with HTTP request/response pairs. GSD boundaries are in-process TypeScript function calls (e.g., `adaptConsoleEnvelope()` in `src/console/`) and filesystem protocols (e.g., file MOVE for staging state transitions). Pact's mock HTTP server adds infrastructure for zero benefit when the boundary is a function call within the same process.

2. **Broker infrastructure overhead.** Pact requires a Pact Broker server for sharing contracts between consumer and provider services. GSD is a single codebase with all components in the same repository. There is no "consumer service" and "provider service" deploying independently -- the consumer and provider are TypeScript modules imported in the same `package.json`.

3. **Message Pact targets message queues, not filesystem.** Pact's async message support (Message Pact) targets RabbitMQ, Kafka, and SNS. GSD's "messages" are JSON files written to filesystem directories (`.planning/console/inbox/`, `.planning/staging/inbox/`) and detected by inotify via the EventDispatcher (Rust `notify` crate). The protocol is filesystem, not message queue.

4. **Zod schemas already exist as contracts.** The project has 100+ exported Zod schemas with `.passthrough()` for forward compatibility. These schemas already define every data boundary. Pact would require duplicating this schema information in Pact's own format (Pact DSL or JSON), creating a maintenance burden and a synchronization problem.

5. **Single-repo, same-process boundaries.** Pact solves cross-service, cross-deployment contract verification -- ensuring Service A's expectations match Service B's actual API. GSD components are TypeScript modules in the same Node.js process. The contract boundary is a function call (`EventEnvelopeSchema.parse(data)`), not a network call. Pact's value proposition does not apply.

### 1.4 Other Rejected Alternatives

| Alternative | Why Rejected |
|-------------|-------------|
| **ajv + manual JSON Schema files** | Would require maintaining separate `.schema.json` files alongside Zod schemas, creating dual sources of truth. Zod `.toJSONSchema()` derives JSON Schema automatically -- no manual files to keep in sync. |
| **TypeScript types alone** | TypeScript types are erased at runtime. They cannot catch semantic violations (valid shape but invalid values). A `string` type cannot enforce `msg-YYYYMMDD-NNN` format -- only Zod's `.regex()` can. Contract testing requires runtime validation, not compile-time type checking. |

### 1.5 Contract Test File Convention

Contract tests use the **`.contract.test.ts` suffix** within existing `__tests__/` directories, colocated with the module they test. This follows the project's existing convention of colocated test files rather than introducing a new top-level `__contracts__/` directory.

**Convention:**

```
src/
  amiga/
    __tests__/
      message-envelope.test.ts              # existing unit tests
      message-envelope.contract.test.ts     # NEW: structural + semantic contracts
  console/
    __tests__/
      schema.test.ts                        # existing unit tests
      console-to-envelope.contract.test.ts  # NEW: boundary contract
  staging/
    __tests__/
      schema.test.ts                        # existing unit tests
      staging-metadata.contract.test.ts     # NEW: boundary contract
  chipset/
    copper/
      __tests__/
        schema.test.ts                      # existing unit tests
        copper-pipeline.contract.test.ts    # NEW: boundary contract
  orchestrator/
    state/
      __tests__/
        state-reader.test.ts               # existing unit tests
        project-state.contract.test.ts     # NEW: boundary contract
  validation/
    __tests__/
      skill-validation.test.ts             # existing unit tests
      skill-pipeline.contract.test.ts      # NEW: boundary contract
```

**Rationale:** Lower friction (no new directory convention), discoverable (same `__tests__/` directories developers already look in), and filterable (Vitest can run `--testNamePattern "contract"` or match `*.contract.test.ts` glob).

### 1.6 Two Contract Types

Every cross-component boundary needs BOTH contract types:

#### Structural Contracts (JSON Schema Snapshot)

Detect when a schema's shape changes. Use `.toJSONSchema()` to generate a JSON Schema, then snapshot it with `toMatchSnapshot()`.

```typescript
import { EventEnvelopeSchema } from '../../amiga/message-envelope.js';

describe('EventEnvelope structural contract', () => {
  it('JSON Schema matches snapshot', () => {
    const jsonSchema = EventEnvelopeSchema.toJSONSchema();
    expect(jsonSchema).toMatchSnapshot();
  });

  it('accepts forward-compatible extensions via passthrough', () => {
    const extended = {
      id: 'evt-001',
      timestamp: '2026-02-19T14:30:22.000Z',
      source: 'broadcast',
      destination: 'broadcast',
      type: 'TEST_EVENT',
      priority: 'normal',
      payload: {},
      correlation: null,
      requires_ack: false,
      trace_id: 'abc-123',       // unknown field
      _internal_tag: 'debug',    // unknown field
    };
    const result = EventEnvelopeSchema.safeParse(extended);
    expect(result.success).toBe(true);
    // passthrough preserves unknown fields
    if (result.success) {
      expect(result.data.trace_id).toBe('abc-123');
    }
  });
});
```

When a schema changes, the snapshot test fails. The developer reviews the diff and explicitly updates the snapshot -- ensuring intentional changes and catching accidental drift.

#### Semantic Contracts (Intentional Invalid Input)

Verify that schemas reject data that is structurally valid (correct types, all fields present) but semantically invalid (wrong values, pattern mismatches, constraint violations).

```typescript
describe('EventEnvelope semantic contract', () => {
  it('rejects envelope with invalid source pattern', () => {
    const result = EventEnvelopeSchema.safeParse({
      id: 'msg-20260219-001',
      timestamp: '2026-02-19T14:30:22.000Z',
      source: 'invalid-source',        // does not match AGENT_OR_SPECIAL_PATTERN
      destination: 'broadcast',
      type: 'CONSOLE_MESSAGE',
      priority: 'normal',
      payload: {},
      correlation: null,
      requires_ack: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects envelope with non-UTC timestamp', () => {
    const result = EventEnvelopeSchema.safeParse({
      id: 'evt-002',
      timestamp: '2026-02-19T14:30:22+05:00',  // not UTC (no trailing Z)
      source: 'broadcast',
      destination: 'broadcast',
      type: 'TEST_EVENT',
      priority: 'normal',
      payload: {},
      correlation: null,
      requires_ack: false,
    });
    expect(result.success).toBe(false);
  });
});
```

### 1.7 Note on `expect.schemaMatching`

The Vitest 4.0 announcement mentioned `expect.schemaMatching()` as a first-class assertion for schema validation. **This API is NOT present in Vitest 4.0.18** (the installed version). It is available in the 4.1.0-beta channel.

The contract testing strategy uses `.parse()` and `.safeParse()` directly -- functionally equivalent and available today. When Vitest 4.1 ships stable, contract tests can optionally migrate to `expect.schemaMatching` for cleaner syntax, but this is not a blocking dependency.

---

## 2. Priority Integration Flows

Six priority cross-component integration flows, selected based on: implementation status (testable today or near-term), critical path importance (from Phase 231 critical path analysis), and boundary crossing density (number of component boundaries traversed).

### 2.1 Flow 1: Console Message Ingestion

**Description:** Dashboard creates a Console `MessageEnvelope`, writes it as a JSON file to the filesystem inbox. EventDispatcher detects the file. ConsoleWatcher subscriber reads and adapts it to an AMIGA `EventEnvelope` for downstream processing.

**Components:** Console (`src/console/`) -> EventDispatcher (Rust watcher) -> AMIGA (`src/amiga/message-envelope.ts`)

**Boundary crossings:** 2 (Console-to-filesystem, filesystem-to-EventEnvelope)

**Implementation status:** Partial -- Console schemas implemented, adapter function specified in Phase 232 but not yet coded.

**Why priority:** This is the primary user-facing ingestion path. Every dashboard interaction produces a `MessageEnvelope` that must reach the AMIGA bus.

#### Boundary 1: Dashboard creates MessageEnvelope

**Schema:** `MessageEnvelopeSchema` from `src/console/schema.ts`

**Input (dashboard creates):**

```json
{
  "id": "msg-20260219-001",
  "type": "milestone-submit",
  "timestamp": "2026-02-19T14:30:22.000Z",
  "source": "dashboard",
  "payload": {
    "milestone": "v1.25",
    "name": "GSD Ecosystem Integration",
    "phases": 5
  }
}
```

**Output (validated MessageEnvelope):**

```json
{
  "id": "msg-20260219-001",
  "type": "milestone-submit",
  "timestamp": "2026-02-19T14:30:22.000Z",
  "source": "dashboard",
  "payload": {
    "milestone": "v1.25",
    "name": "GSD Ecosystem Integration",
    "phases": 5
  }
}
```

**Semantic constraints:** `id` must match `/^msg-\d{8}-\d{3,}$/`. `type` must be one of `milestone-submit`, `config-update`, `question-response`, `setting-change`. `source` must be `dashboard` or `session`.

#### Boundary 2: Adapter converts to EventEnvelope

**Schema:** `EventEnvelopeSchema` from `src/amiga/message-envelope.ts`

**Input (MessageEnvelope from Boundary 1):**

```json
{
  "id": "msg-20260219-001",
  "type": "milestone-submit",
  "timestamp": "2026-02-19T14:30:22.000Z",
  "source": "dashboard",
  "payload": {
    "milestone": "v1.25",
    "name": "GSD Ecosystem Integration",
    "phases": 5
  }
}
```

**Output (adapted EventEnvelope per Phase 232 adapter spec):**

```json
{
  "id": "msg-20260219-001",
  "timestamp": "2026-02-19T14:30:22.000Z",
  "source": "broadcast",
  "destination": "broadcast",
  "type": "milestone-submit",
  "priority": "normal",
  "payload": {
    "milestone": "v1.25",
    "name": "GSD Ecosystem Integration",
    "phases": 5,
    "_console_source": "dashboard"
  },
  "correlation": null,
  "requires_ack": false
}
```

**Notes:** `source` becomes `broadcast` (interim, until `AGENT_OR_SPECIAL_PATTERN` regex is extended to accept `console:dashboard`). Original Console `source` preserved as `payload._console_source`. The `id` passes through because `EventEnvelopeSchema.id` requires only `min(1)`.

**Edge inventory references:** Edge #7 (staging -> dashboard-console, filesystem message bus), Edge #18 (gsd-os -> dashboard-console)

---

### 2.2 Flow 2: Staging Intake Pipeline

**Description:** A document is submitted to the staging layer. Its metadata is validated against `StagingMetadataSchema` and transitions through the state machine: `inbox` -> `checking` -> `attention` (if needed) -> `ready`. Each transition modifies the metadata's `status` field and physically MOVEs the file between directories.

**Components:** Staging intake (`src/staging/intake.ts`) -> Staging schema (`src/staging/schema.ts`) -> Filesystem state directories

**Boundary crossings:** 1 (intake-to-schema validation), with multiple state transitions within the boundary

**Implementation status:** Implemented -- `StagingMetadataSchema` exists with `.passthrough()`, state machine transitions are functional.

**Why priority:** Staging is the gateway for all new work entering the GSD pipeline. State machine correctness is critical -- an item stuck in `inbox` or incorrectly promoted to `ready` breaks the workflow.

#### Boundary: Staging metadata validation through state machine

**Schema:** `StagingMetadataSchema` from `src/staging/schema.ts`

**Input (initial submission at inbox):**

```json
{
  "submitted_at": "2026-02-19T15:00:00.000Z",
  "source": "dashboard",
  "status": "inbox"
}
```

**Output after transition to checking:**

```json
{
  "submitted_at": "2026-02-19T15:00:00.000Z",
  "source": "dashboard",
  "status": "checking",
  "checked_at": "2026-02-19T15:01:30.000Z"
}
```

**Output after transition to ready:**

```json
{
  "submitted_at": "2026-02-19T15:00:00.000Z",
  "source": "dashboard",
  "status": "ready",
  "checked_at": "2026-02-19T15:01:30.000Z",
  "approved_at": "2026-02-19T15:05:00.000Z"
}
```

**Semantic constraints:** `status` must be one of the `STAGING_STATES` enum values (`inbox`, `checking`, `attention`, `ready`, `aside`). `submitted_at` must parse as a valid ISO 8601 date. `source` must be a non-empty string. The `.passthrough()` modifier allows `checked_at`, `approved_at`, and future metadata fields to survive parsing.

**Contract test focus:**
- Structural: JSON Schema snapshot of `StagingMetadataSchema` detects if state enum changes.
- Semantic: Reject `status: 'complete'` (not a valid state). Reject `submitted_at: 'not-a-date'`. Verify `.passthrough()` preserves `checked_at` and `approved_at` through parsing.

**Edge inventory references:** Edge #5 (staging -> skill-creator), Edge #7 (staging -> dashboard-console)

---

### 2.3 Flow 3: AMIGA EventEnvelope Bus

**Description:** An AMIGA component creates an event using `createEnvelope()`. The resulting `EventEnvelope` is validated against `EventEnvelopeSchema`. The envelope is then routed to the appropriate ICD handler based on its `type` field, where the `payload` is validated against ICD-specific schemas.

**Components:** AMIGA factory (`src/amiga/message-envelope.ts`) -> EventEnvelope validation -> ICD modules (`src/amiga/icd/icd-01.ts` through `icd-04.ts`)

**Boundary crossings:** 2 (factory-to-envelope, envelope-to-ICD-payload)

**Implementation status:** Implemented -- `createEnvelope()`, `EventEnvelopeSchema`, and all 4 ICD payload schemas are functional with tests.

**Why priority:** The AMIGA EventEnvelope is the canonical wire format for the entire ecosystem (per Phase 232). Every subsystem that emits or consumes events crosses this boundary.

#### Boundary 1: createEnvelope() factory output

**Schema:** `EventEnvelopeSchema` from `src/amiga/message-envelope.ts`

**Input (factory call):**

```typescript
createEnvelope({
  source: 'ME-1',
  destination: 'MC-1',
  type: 'TELEMETRY_UPDATE',
  payload: {
    metric_name: 'cpu_usage',
    value: 0.73,
    unit: 'percent',
    timestamp: '2026-02-19T15:10:00.000Z',
  },
})
```

**Output (EventEnvelope):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-19T15:10:05.123Z",
  "source": "ME-1",
  "destination": "MC-1",
  "type": "TELEMETRY_UPDATE",
  "priority": "normal",
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

#### Boundary 2: ICD payload validation (ICD-01 Telemetry)

**Schema:** `TelemetryUpdatePayloadSchema` from `src/amiga/icd/icd-01.ts`

**Input (payload extracted from envelope):**

```json
{
  "metric_name": "cpu_usage",
  "value": 0.73,
  "unit": "percent",
  "timestamp": "2026-02-19T15:10:00.000Z"
}
```

**Semantic constraints for ICD payloads:**

| ICD | Schema | Import Path | Payload Purpose |
|-----|--------|------------|-----------------|
| ICD-01 | `TelemetryUpdatePayloadSchema` | `src/amiga/icd/icd-01.ts` | Telemetry metric updates (value, unit, timestamp) |
| ICD-01 | `AlertSurfacePayloadSchema` | `src/amiga/icd/icd-01.ts` | Alert notifications (severity, message, context) |
| ICD-01 | `GateSignalPayloadSchema` | `src/amiga/icd/icd-01.ts` | Gate check requests and responses |
| ICD-02 | `LedgerEntryPayloadSchema` | `src/amiga/icd/icd-02.ts` | Dependency ledger entries |
| ICD-03 | `GovernanceQueryPayloadSchema` | `src/amiga/icd/icd-03.ts` | Governance queries for rule evaluation |
| ICD-04 | `DisputeRecordPayloadSchema` | `src/amiga/icd/icd-04.ts` | Dispute records with evidence |

**Contract test focus:**
- Structural: Snapshot `EventEnvelopeSchema.toJSONSchema()` and each ICD payload schema's JSON Schema.
- Semantic: Verify `createEnvelope()` output always passes `EventEnvelopeSchema.parse()`. Verify ICD payload schemas reject payloads with missing required fields. Verify source/destination patterns match `AGENT_OR_SPECIAL_PATTERN`.

**Edge inventory references:** Edge #1-2 (chipset -> skill-creator, via EventEnvelope bus routing)

---

### 2.4 Flow 4: Chipset Copper Pipeline

**Description:** A Copper pipeline definition (YAML) is parsed into a `PipelineSchema`-validated object. The pipeline's instructions (WAIT, MOVE, SKIP) are validated by `PipelineInstructionSchema` (discriminated union). The compiler transforms instructions into executable steps with lifecycle synchronization events.

**Components:** Pipeline YAML -> `PipelineSchema` validation (`src/chipset/copper/schema.ts`) -> Compiler transform (`src/chipset/copper/compiler.ts`) -> Lifecycle sync (`src/chipset/integration/session-events.ts`)

**Boundary crossings:** 2 (YAML-to-schema, schema-to-compiler)

**Implementation status:** Implemented -- `PipelineSchema`, `PipelineInstructionSchema`, and compiler are functional with tests.

**Why priority:** Copper pipelines define skill activation sequences. A malformed pipeline that passes validation but fails at execution breaks the skill loading workflow.

#### Boundary 1: YAML parsed to PipelineSchema

**Schema:** `PipelineSchema` from `src/chipset/copper/schema.ts`

**Input (pipeline YAML parsed to object):**

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
      "event": "phase-start",
      "timeout": 5000,
      "description": "Wait for phase to begin"
    },
    {
      "type": "move",
      "target": "skill",
      "name": "beautiful-commits",
      "mode": "lite",
      "description": "Load commit formatting skill"
    },
    {
      "type": "skip",
      "condition": {
        "left": "tests_passing",
        "op": "equals",
        "right": "false"
      },
      "description": "Skip deployment if tests failing"
    }
  ]
}
```

**Output (validated PipelineSchema):** Same structure, with `PipelineMetadataSchema.passthrough()` preserving any unknown metadata fields.

**Semantic constraints:**
- `instructions` must contain at least 1 instruction.
- WAIT `event` must be a valid GSD lifecycle event (e.g., `phase-start`, `phase-planned`, `code-complete`, `tests-passing`, `verify-complete`, `end-of-frame`, `milestone-start`, `milestone-complete`, `session-start`, `session-pause`, `session-resume`, `session-stop`).
- MOVE `target` must be `skill`, `script`, or `team`. MOVE `mode` must be `lite`, `full`, `offload`, or `async`.
- SKIP `condition.op` must be one of `exists`, `not-exists`, `equals`, `not-equals`, `contains`, `gt`, `lt`.

**Contract test focus:**
- Structural: Snapshot `PipelineSchema.toJSONSchema()` and `PipelineInstructionSchema.toJSONSchema()`.
- Semantic: Reject WAIT with invalid event (`"event": "invalid-event"`). Reject MOVE with empty name. Reject SKIP with invalid operator.

**Edge inventory references:** Edge #3 (silicon -> chipset, silicon.yaml extends chipset.yaml)

---

### 2.5 Flow 5: Orchestrator State Hydration

**Description:** The orchestrator reads `.planning/` directory files (ROADMAP.md, STATE.md, PROJECT.md, config.json), parses each into its respective schema, and combines them into a single `ProjectStateSchema`-validated object.

**Components:** `.planning/` files on disk -> State reader (`src/orchestrator/state/state-reader.ts`) -> Schema validation (`src/orchestrator/state/types.ts`)

**Boundary crossings:** 2 (filesystem-to-parsed-data, parsed-data-to-ProjectState)

**Implementation status:** Implemented -- `ProjectStateSchema`, `ParsedRoadmapSchema`, `ParsedStateSchema`, `GsdConfigSchema` all exist with `.passthrough()`.

**Why priority:** The orchestrator is the decision-making hub. State hydration runs at every session start and every GSD command. Incorrect state parsing causes wrong phase routing, incorrect plan suggestions, and stale progress reporting.

#### Boundary 1: config.json parsed to GsdConfigSchema

**Schema:** `GsdConfigSchema` from `src/orchestrator/state/types.ts`

**Input (config.json from disk):**

```json
{
  "mode": "yolo",
  "depth": "comprehensive",
  "parallelization": true,
  "commit_docs": false,
  "model_profile": "quality",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

**Output (validated GsdConfig with defaults applied):**

```json
{
  "mode": "yolo",
  "depth": "comprehensive",
  "parallelization": true,
  "commit_docs": false,
  "model_profile": "quality",
  "verbosity": 3,
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  },
  "gates": {
    "require_plan_approval": false,
    "require_checkpoint_approval": true
  },
  "safety": {
    "max_files_per_commit": 20,
    "require_tests": true
  },
  "git": {
    "auto_commit": true,
    "commit_style": "conventional"
  }
}
```

#### Boundary 2: All parsed data combined into ProjectStateSchema

**Schema:** `ProjectStateSchema` from `src/orchestrator/state/types.ts`

**Input (assembled from parsed sub-schemas):**

```json
{
  "initialized": true,
  "config": { "mode": "yolo", "...": "..." },
  "position": {
    "phase": 234,
    "totalPhases": 5,
    "phaseName": "integration-test-strategy",
    "phaseStatus": "in-progress",
    "plan": 1,
    "totalPlans": 3,
    "status": "executing",
    "progressPercent": 60,
    "lastActivity": "2026-02-19"
  },
  "phases": [
    { "number": "231", "name": "Ecosystem Dependency Map", "complete": true },
    { "number": "232", "name": "EventDispatcher Specification", "complete": true },
    { "number": "233", "name": "Dependency Philosophy", "complete": true },
    { "number": "234", "name": "Integration Test Strategy", "complete": false },
    { "number": "235", "name": "Known-Issues Triage", "complete": false }
  ],
  "plansByPhase": {
    "234": [
      { "id": "234-01-PLAN.md", "complete": false },
      { "id": "234-02-PLAN.md", "complete": false },
      { "id": "234-03-PLAN.md", "complete": false }
    ]
  },
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

**Semantic constraints:** `config.mode` defaults to `interactive`. `position.phase` is nullable (no phase if project just initialized). `phases` array can be empty. All sub-schemas use `.passthrough()` for forward compatibility with new `.planning/` fields.

**Contract test focus:**
- Structural: Snapshot `ProjectStateSchema.toJSONSchema()`, `GsdConfigSchema.toJSONSchema()`, `CurrentPositionSchema.toJSONSchema()`.
- Semantic: Verify `GsdConfigSchema` applies defaults correctly for partial configs. Verify `CurrentPositionSchema` accepts null fields. Verify `.passthrough()` preserves unknown fields at every nesting level.

**Edge inventory references:** Edge #15 (gsd-os -> chipset, chipset-aware workflow reads state), Edge #16 (gsd-os -> skill-creator, orchestrator routes through skill loading)

---

### 2.6 Flow 6: Skill Validation and Storage

**Description:** A skill YAML file is parsed and validated against `SkillInputSchema`. Metadata is extracted and validated against `SkillMetadataSchema`. The validated skill is stored in the skill store for activation by the 6-stage pipeline.

**Components:** Skill YAML input -> `SkillInputSchema` validation (`src/validation/skill-validation.ts`) -> Metadata extraction -> `SkillMetadataSchema` validation (`src/validation/skill-validation.ts`) -> Storage (`src/storage/skill-store.ts`)

**Boundary crossings:** 2 (input-to-SkillInput, SkillInput-to-SkillMetadata)

**Implementation status:** Implemented -- Both schemas exist with `.passthrough()`, validation functions are tested.

**Why priority:** Skills are the atomic unit of the skill-creator ecosystem. Every skill creation, update, and activation crosses this boundary. A validation failure here blocks the entire skill workflow.

#### Boundary 1: Skill YAML validated against SkillInputSchema

**Schema:** `SkillInputSchema` from `src/validation/skill-validation.ts`

**Input (parsed skill YAML):**

```json
{
  "name": "beautiful-commits",
  "description": "Format commit messages following Conventional Commits with imperative mood",
  "allowed-tools": ["Bash", "Read", "Grep"],
  "user-invocable": true,
  "model": "claude-opus-4-6",
  "enabled": true,
  "triggers": {
    "patterns": ["commit", "git commit"],
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

**Output (validated SkillInput):** Same structure with `.passthrough()` preserving any additional fields from future skill format extensions.

#### Boundary 2: Metadata extracted and validated against SkillMetadataSchema

**Schema:** `SkillMetadataSchema` from `src/validation/skill-validation.ts`

**Input (metadata assembled from SkillInput + storage metadata):**

```json
{
  "name": "beautiful-commits",
  "description": "Format commit messages following Conventional Commits with imperative mood",
  "allowed-tools": ["Bash", "Read", "Grep"],
  "user-invocable": true,
  "model": "claude-opus-4-6",
  "enabled": true,
  "triggers": {
    "patterns": ["commit", "git commit"],
    "file_patterns": [".git/COMMIT_EDITMSG"]
  },
  "version": 2,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-02-19T15:20:00.000Z"
}
```

**Semantic constraints:**
- `name` must match the skill naming pattern (lowercase, hyphens allowed, no spaces).
- `description` must be 1-1024 characters.
- `allowed-tools` must be an array of strings (tool names).
- `version` must be a positive number.
- `learning.max_change_percent` caps refinement to 20% content change (bounded learning guardrail).
- `learning.min_corrections_for_refinement` requires 3+ corrections before suggesting refinement.

**Contract test focus:**
- Structural: Snapshot `SkillInputSchema.toJSONSchema()` and `SkillMetadataSchema.toJSONSchema()`.
- Semantic: Reject skill with empty name. Reject description exceeding 1024 chars. Verify `.passthrough()` preserves unknown metadata extensions.

**Edge inventory references:** Edge #1 (chipset -> skill-creator, skills section), Edge #26 (bbs-pack -> skill-creator, educational module format)

---

## 3. Boundary Schema Inventory

### 3.1 Implemented/Partial Boundaries

Complete inventory of cross-component boundaries identified in the priority flows, with Zod schema references, `.passthrough()` status, and forward compatibility notes.

| # | Boundary Name | Source Schema | Source Import Path | Target Schema | Target Import Path | `.passthrough()` | Forward Compat Notes | Edge Refs |
|---|--------------|--------------|-------------------|--------------|-------------------|------------------|---------------------|-----------|
| 1 | Console -> EventEnvelope adapter | `MessageEnvelopeSchema` | `src/console/schema.ts` | `EventEnvelopeSchema` | `src/amiga/message-envelope.ts` | Source: No, Target: Yes | Target accepts `trace_id`, `_console_source`, future metadata. Source is fixed-shape (5 fields, no passthrough). | #7, #18 |
| 2 | Staging metadata state machine | `StagingMetadataSchema` | `src/staging/schema.ts` | (same schema, re-validated per transition) | `src/staging/schema.ts` | Yes | Accepts `checked_at`, `approved_at`, `reviewed_by`, and any future transition metadata without schema changes. | #5, #7 |
| 3 | Chipset Copper pipeline | `PipelineSchema` | `src/chipset/copper/schema.ts` | `PipelineInstructionSchema` | `src/chipset/copper/schema.ts` | Metadata: Yes, Instructions: No | `PipelineMetadataSchema.passthrough()` accepts new metadata fields. Instructions are a closed discriminated union (WAIT/MOVE/SKIP) -- new instruction types require schema update. | #3 |
| 4 | EventEnvelope bus (AMIGA) | `EventEnvelopeSchema` | `src/amiga/message-envelope.ts` | `TelemetryUpdatePayloadSchema` (ICD-01), `LedgerEntryPayloadSchema` (ICD-02), `GovernanceQueryPayloadSchema` (ICD-03), `DisputeRecordPayloadSchema` (ICD-04) | `src/amiga/icd/icd-01.ts` through `icd-04.ts` | Envelope: Yes, ICDs: Varies | Envelope accepts new event types and metadata. ICD payload schemas are per-type contracts -- new payload types do not break existing ones. | #1, #2 |
| 5 | Chipset -> SessionEventBridge | Session state events | `src/chipset/integration/session-events.ts` | Copper lifecycle sync | `src/chipset/copper/lifecycle-sync.ts` | N/A (event-based) | SessionState transitions emit events consumed by lifecycle sync. Forward-compatible via event `type` string extensibility. | #3 |
| 6 | Dashboard collectors | Various collector schemas | `src/dashboard/collectors/*.ts` | Console, Staging, Chipset data shapes | `src/console/`, `src/staging/`, `src/chipset/` | Varies by collector | Collectors read from source schemas. Forward-compatible because collectors use `.safeParse()` and handle unknown fields gracefully. | #18 |
| 7 | Orchestrator state reader | File content (Markdown/JSON/YAML) | `.planning/` files | `ProjectStateSchema`, `GsdConfigSchema`, `ParsedRoadmapSchema`, `ParsedStateSchema` | `src/orchestrator/state/types.ts` | All: Yes | Every orchestrator schema uses `.passthrough()`. New `.planning/` fields survive parsing without breaking state hydration. | #15, #16 |
| 8 | Skill validation pipeline | `SkillInputSchema` | `src/validation/skill-validation.ts` | `SkillMetadataSchema` | `src/validation/skill-validation.ts` | Both: Yes | Both schemas use `.passthrough()`. New Claude Code fields (e.g., `hooks`, `context`) are preserved through the pipeline. | #1, #26 |

### 3.2 Aspirational Boundaries

These boundaries exist in the ecosystem DAG (Phase 231) but are not yet implemented. They are documented here for future milestone planning. **Do not write contract tests for these boundaries yet** -- the components do not exist or are specification-only.

| # | Boundary Name | Source | Target | Current Status | Why Not Testable |
|---|--------------|--------|--------|---------------|-----------------|
| 9 | EventDispatcher -> 6 subscribers | Rust watcher (`src-tauri/src/watcher.rs`) via `tokio::broadcast` | TypeScript subscriber callbacks | Spec only (Phase 232) | The Rust EventDispatcher implementation exists, but the 6 TypeScript subscriber profiles (ConsoleWatcher, StagingWatcher, DashboardNotifier, ChipsetHotReload, DocsRebuilder, SourceWatcher) are specified but not yet implemented as EventDispatcher subscribers. |
| 10 | Silicon -> Chipset config inheritance | `silicon.yaml` configuration | `.chipset/chipset.yaml` extension | Aspirational | Silicon layer is not yet implemented. The `silicon.yaml` format and chipset inheritance mechanism are specified in vision documents but have no code. |
| 11 | GSD-ISA -> Chipset bus architecture | ISA opcodes (LOAD, PUSH, POP, etc.) | Chipset agent topology and bus routing | Aspirational | GSD-ISA is a design metaphor formalizing chipset's inter-agent communication. No ISA interpreter or opcode execution exists. |

---

## Appendix: Anti-Patterns

Contract testing anti-patterns to avoid, derived from the research phase and common industry pitfalls.

| # | Anti-Pattern | What Goes Wrong | Correct Approach |
|---|-------------|-----------------|------------------|
| 1 | Testing only structural shape | Schema-only contracts miss runtime failures. Schemas pass but values are semantically invalid. | Every boundary needs at least one semantic test (`.safeParse()` expecting failure with intentionally invalid input). |
| 2 | Testing internal implementation | Contract tests verify internals (how data is computed) instead of what crosses the boundary. | Test only the boundary: what goes in, what comes out. Internal logic is unit test territory. |
| 3 | Mocking the schema | Tests mock `EventEnvelopeSchema` instead of using the real schema. Defeats the contract's purpose. | Contract tests MUST use real Zod schemas imported from their source modules. Never mock the validator. |
| 4 | Using `toEqual` for snapshots | Exact equality breaks on any new optional field, even with `.passthrough()`. | Use `toMatchSnapshot()` for structural contracts. Snapshot updates are intentional and reviewable. |
| 5 | Testing aspirational boundaries | Writing contract tests for components that do not exist yet (empty or stub modules). | Focus contract tests on implemented/partial boundaries. Document aspirational boundaries for future milestones. |
| 6 | Ignoring filesystem protocol | Contract tests cover TypeScript schemas but miss file naming, directory structure, and state transitions via file MOVE. | Include filesystem protocol in the contract definition. Staging state machine transitions are directory MOVEs, not just field changes. |

---

*Phase: 234 -- Integration Test Strategy*
*Document: Contract Testing Approach*
*Date: 2026-02-19*
