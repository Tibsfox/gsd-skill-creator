# Research Reference -- Fleet Feature Refinement

> Ten convergent proofs. One architecture. The same road found twice from different directions.

## Convergent Discovery Methodology

Each module in this mission was specified using the following protocol:

1. **Problem statement written independently** -- no reference to thepopebot or any existing fleet system
2. **GSD-native design produced** -- architecture that fits naturally into the GSD skill/agent/chipset model
3. **thepopebot audit conducted after specification** -- searching for structural parallels
4. **Convergence documented** -- where parallel structures appear, the proof is noted

Convergence is evidence that the architecture is correct. Two independent engineers finding the same solution to the same problem is not coincidence -- it is signal. The clean-room discipline protects the proof: if the solutions were copied, the convergence would be meaningless.

---

## M8 -- Safety Warden

### Requirement
Every fleet output must pass a non-optional, non-bypassable block-level gate before delivery.

### thepopebot Proof
thepopebot implements a `safety_check()` function that is called at every output boundary. It cannot be disabled via configuration. It cannot be skipped by callers. The implementation is structurally identical to what the safety warden specification requires -- a gate, not a filter; a block, not a warning.

### GSD-Native Design
- **Chip type:** `safety-warden` (extends base chipset schema)
- **Contract:** Takes `OutputCandidate` type, returns `SafetyResult { pass: boolean, reason: string, checks: CheckRecord[] }`
- **Gate behavior:** `pass: false` halts the pipeline. There is no "warn and continue" mode.
- **Check registry:** Individual checks are registered via `registerCheck(id, fn)`. The gate runs all registered checks. All must pass.
- **Integration point:** Wraps the output boundary of every other module. Modules do not call the warden directly -- the warden is injected at the boundary by the pipeline coordinator.

### Chipset YAML Extension
```yaml
chip_type: safety-warden
version: "1.0"
contract:
  input: OutputCandidate
  output: SafetyResult
  blocking: true
  bypassable: false
```

### DACP Operation Types
- `SAFETY_CHECK_REQUEST` -- submit output candidate for review
- `SAFETY_CHECK_RESULT` -- receive pass/fail with reason and check records
- `SAFETY_REGISTER_CHECK` -- register a new check function (admin operation, credentialed)
- `SAFETY_AUDIT_QUERY` -- retrieve historical safety check records

---

## M3 -- Credential Tiering

### Requirement
Operations are authorized by tier, not identity. Tiers encode role, scope, and clearance level.

### thepopebot Proof
thepopebot separates `agent_identity` from `agent_role` in its permission model. Identity is how the system knows who is acting. Role is how the system knows what they are allowed to do. The separation is structural: changing an agent's role does not change its identity. This maps exactly to the credential tiering specification -- tiers are role+scope bundles, not identity attributes.

### GSD-Native Design
- **Tier structure:** `{ tier_id, role_class, scope_boundary, clearance_level, operation_classes: string[] }`
- **Role classes:** `OBSERVER`, `OPERATOR`, `COORDINATOR`, `ARCHITECT`, `WARDEN`
- **Scope boundaries:** `MODULE`, `TEAM`, `FLEET`, `SYSTEM`
- **Clearance levels:** `0` (read-only) through `4` (full write + gate override)
- **Operation authorization:** Every DACP operation declares `required_tier`. The credential layer checks tier before forwarding the operation.
- **Identity-to-tier mapping:** Managed separately from tier definitions. Changing a mapping does not modify the tier.

### Chipset YAML Extension
```yaml
chip_type: credential-tier
version: "1.0"
contract:
  tiers:
    - id: OBSERVER
      clearance: 0
      operations: [READ, QUERY, AUDIT_QUERY]
    - id: OPERATOR
      clearance: 1
      operations: [READ, WRITE, INVOKE, QUERY]
    - id: COORDINATOR
      clearance: 2
      operations: [READ, WRITE, INVOKE, ROUTE, QUERY, REGISTER]
    - id: ARCHITECT
      clearance: 3
      operations: [ALL_EXCEPT_GATE_OVERRIDE]
    - id: WARDEN
      clearance: 4
      operations: [ALL]
```

### DACP Operation Types
- `CREDENTIAL_VERIFY` -- verify that an identity holds a required tier
- `CREDENTIAL_GRANT` -- assign a tier to an identity (ARCHITECT+ only)
- `CREDENTIAL_REVOKE` -- remove a tier from an identity (ARCHITECT+ only)
- `CREDENTIAL_QUERY` -- list tiers for an identity (COORDINATOR+ only)
- `TIER_DEFINE` -- define a new tier (WARDEN only)

---

## M6 -- Chipset Schema

### Requirement
Chipset YAML definitions have a formal schema with versioning. Extensions do not break existing definitions.

### thepopebot Proof
thepopebot uses a `chip_manifest.json` that declares chip types with version fields. New chip types are added to the manifest without modifying existing entries. The parallel is direct: both systems discovered that chip definitions need a versioning contract because fleet systems evolve and backward compatibility is a correctness requirement, not a nice-to-have.

### GSD-Native Design
- **Schema format:** JSON Schema (draft-07) for validation, YAML for authoring
- **Base schema fields:** `chip_type`, `version`, `contract`, `dependencies`, `chipset_compatibility`
- **Extension mechanism:** New chip types extend `base_chip` schema. Extension fields are additive. No existing field is modified.
- **Version contract:** `"1.0"` -> `"1.1"` may add optional fields. `"1.0"` -> `"2.0"` may add required fields (major version bump required). Existing `"1.0"` definitions load under `"1.1"` schema without change.
- **Validation:** `validateChipYaml(yaml, schema)` returns `{ valid: boolean, errors: ValidationError[] }`. Called at load time, not at invocation time.

### Chipset YAML Extension
```yaml
# Base schema (all chips must satisfy this)
chip_type: string        # required, unique identifier
version: string          # required, semver
contract:
  input: TypeName        # required
  output: TypeName       # required
dependencies: string[]   # optional, chip_type references
chipset_compatibility:
  min_version: string    # optional
  max_version: string    # optional
```

### DACP Operation Types
- `SCHEMA_VALIDATE` -- validate a YAML definition against the current schema
- `SCHEMA_REGISTER` -- register a new chip type definition (ARCHITECT+ only)
- `SCHEMA_VERSION_QUERY` -- retrieve the current schema version
- `SCHEMA_DIFF` -- compare two schema versions and list breaking changes

---

## M4 -- DACP Event Bus

### Requirement
Cross-module communication flows through a typed event bus. Type mismatches fail at declaration, not at runtime.

### thepopebot Proof
thepopebot uses a `message_bus.py` with typed message classes. Each message type is a dataclass with declared fields. Producers instantiate typed messages. Consumers declare which message types they handle. The structural parallel is exact: both systems independently arrived at the conclusion that untyped cross-module communication is a correctness hazard, not just a style preference.

### GSD-Native Design
- **Event declaration:** `declareEvent(id, schema)` -- registers an event type with its payload schema
- **Producer contract:** `emit(event_id, payload)` -- payload is validated against declared schema at emit time
- **Consumer contract:** `subscribe(event_id, handler)` -- handler receives typed, validated payloads
- **Isolation guarantee:** Each module has its own queue. Events are routed, not shared. Module A's queue failure does not affect Module B's queue.
- **Dead letter handling:** Events that cannot be delivered after N retries go to a dead letter queue. Dead letter events are audited.

### Chipset YAML Extension
```yaml
chip_type: dacp-event-bus
version: "1.0"
contract:
  operations:
    - EMIT
    - SUBSCRIBE
    - DECLARE_EVENT
    - DEAD_LETTER_QUERY
  isolation_model: per-module-queue
  delivery_guarantee: at-least-once
```

### DACP Operation Types
- `EVENT_EMIT` -- emit a typed event to the bus
- `EVENT_SUBSCRIBE` -- register a handler for an event type
- `EVENT_DECLARE` -- declare a new event type with payload schema (COORDINATOR+ only)
- `DEAD_LETTER_QUERY` -- retrieve undeliverable events for a module
- `BUS_HEALTH_QUERY` -- check bus health and queue depths

---

## M1 -- Cluster Topology

### Requirement
Fleet nodes register with the cluster. Capabilities are declared at registration. Health is monitored. Failover paths are pre-computed.

### thepopebot Proof
thepopebot maintains a `node_registry.json` that is updated at node startup and shutdown. Each node declares its capabilities as an array of operation types it can handle. The registry is queried during routing decisions. The FLT design is structurally identical, with the addition of health monitoring and pre-computed failover paths.

### GSD-Native Design
- **Node registration:** `registerNode(id, capabilities, health_endpoint)` -- idempotent, updates existing registration
- **Capability declaration:** Array of operation types the node can handle. Used by model router for dispatch decisions.
- **Health monitoring:** Background process polls each node's health endpoint at configurable intervals. Health status is one of: `HEALTHY`, `DEGRADED`, `OFFLINE`.
- **Failover pre-computation:** When a node registers, failover candidates are computed: other nodes with overlapping capabilities, ordered by latency. Failover list is updated on topology change.
- **Topology events:** Node registration/deregistration emits topology events to the DACP bus. Subscribers (model router, intake layer) update their routing tables.

### Chipset YAML Extension
```yaml
chip_type: cluster-topology
version: "1.0"
contract:
  node_fields: [id, capabilities, health_endpoint, status, failover_candidates]
  health_poll_interval_seconds: 30
  failover_computation: eager  # computed on registration, not on failure
```

### DACP Operation Types
- `NODE_REGISTER` -- register a new node (or update existing)
- `NODE_DEREGISTER` -- remove a node from the cluster
- `TOPOLOGY_QUERY` -- retrieve current cluster topology
- `NODE_HEALTH_QUERY` -- retrieve health status for a specific node or all nodes
- `FAILOVER_PATH_QUERY` -- retrieve pre-computed failover candidates for a node

---

## M7 -- Model Routing

### Requirement
Workloads are matched to models by declared complexity profile. Cost is tracked. Fallback is explicit.

### thepopebot Proof
thepopebot uses a `model_selector.py` that assigns workloads to models based on a complexity score. The complexity scoring algorithm uses the same dimensions identified in the FLT specification (token budget, reasoning depth, output format constraints, latency requirements). The convergence on complexity dimensions is the proof.

### GSD-Native Design
- **Workload profile:** `{ complexity: 0-10, token_budget: number, reasoning_depth: SHALLOW|MEDIUM|DEEP, latency_class: REALTIME|BATCH }`
- **Model capability table:** Each available model declares its complexity range, cost per token, and latency class.
- **Routing algorithm:** Cheapest model whose capability range covers the workload complexity. Ties broken by latency class match.
- **Fallback:** If selected model is unavailable (from cluster topology), fallback to next cheapest capable model. If no model available, emit `ROUTING_FALLBACK_EXHAUSTED` event and return error.
- **Cost tracking:** Every routing decision records model selected, estimated tokens, actual tokens, cost. Aggregated by workload class.

### Chipset YAML Extension
```yaml
chip_type: model-router
version: "1.0"
contract:
  routing_dimensions: [complexity, token_budget, reasoning_depth, latency_class]
  fallback_strategy: next-cheapest-capable
  cost_tracking: enabled
```

### DACP Operation Types
- `ROUTE_WORKLOAD` -- route a workload to the appropriate model, returns model selection
- `ROUTING_COST_QUERY` -- retrieve cost summary for a workload class or time range
- `MODEL_CAPABILITY_REGISTER` -- register a model's capability declaration (ARCHITECT+ only)
- `ROUTING_FALLBACK_QUERY` -- retrieve history of fallback events

---

## M2 -- Intake Layer

### Requirement
All inputs pass an intake contract before entering the pipeline. Violations are rejected at the boundary with user-facing explanations.

### thepopebot Proof
thepopebot has a `request_validator.py` that checks incoming requests against a declared schema before any processing begins. Invalid requests receive a structured error response with a `field`, `constraint`, and `message` triple. The FLT intake layer follows the same pattern, with the addition of the contract-as-declaration model.

### GSD-Native Design
- **Contract declaration:** `declareContract(operation_id, input_schema, output_schema)` -- contracts are declared, not embedded in validation logic
- **Validation:** `validate(operation_id, input)` -- checks input against declared schema, returns `{ valid, violations: Violation[] }`
- **Violation format:** `{ field: string, constraint: string, message: string }` -- user-facing, not internal
- **Rejection behavior:** Invalid inputs return `400 Bad Input` with the violations array. Nothing proceeds.
- **Contract registry:** All declared contracts are queryable. API introspection is a built-in, not an afterthought.

### Chipset YAML Extension
```yaml
chip_type: intake-layer
version: "1.0"
contract:
  validation_mode: strict  # fail on any violation, no partial processing
  violation_format: user-facing  # no internal field names in error messages
  contract_registry: queryable
```

### DACP Operation Types
- `INTAKE_VALIDATE` -- validate an input against a declared contract
- `CONTRACT_DECLARE` -- declare a new operation contract (ARCHITECT+ only)
- `CONTRACT_QUERY` -- retrieve contract definition for an operation
- `INTAKE_REJECTION_AUDIT` -- retrieve history of rejected inputs (COORDINATOR+ only)

---

## M5 -- Skill Audit Trail

### Requirement
Every skill invocation produces an immutable log entry. The log is append-only. No entry is modifiable after writing.

### thepopebot Proof
thepopebot logs all tool calls to an `audit_log.jsonl` file. Each entry includes the tool name, invocation timestamp, and return status. The JSONL append-only format is the same mechanism identified in the FLT specification. Both systems independently arrived at the JSONL append-only log as the correct implementation for audit immutability.

### GSD-Native Design
- **Log entry schema:** `{ entry_id, skill_name, skill_version, input_hash, output_hash, timestamp_iso, invoking_agent, completion_status, duration_ms }`
- **Immutability enforcement:** Entries are written once. The write operation does not include an update path. The storage layer is append-only by configuration.
- **Input/output hashing:** SHA-256 of serialized input/output. Hashes are stored, not the content (privacy-safe). Verification is possible by re-hashing.
- **Query interface:** `queryAuditLog({ skill_name?, agent_id?, time_range?, status? })` -- filtered retrieval, read-only
- **Retention policy:** Entries are never deleted. Archival moves old entries to cold storage but does not delete them.

### Chipset YAML Extension
```yaml
chip_type: skill-audit-trail
version: "1.0"
contract:
  storage: append-only
  hashing: sha256
  retention: permanent
  query_interface: read-only
```

### DACP Operation Types
- `AUDIT_LOG_WRITE` -- write a new audit entry (internal, not externally invokable)
- `AUDIT_LOG_QUERY` -- query audit entries with filters (OBSERVER+ for own entries, COORDINATOR+ for all)
- `AUDIT_INTEGRITY_CHECK` -- verify hash chain integrity for a time range (WARDEN only)
- `AUDIT_ARCHIVE` -- move old entries to cold storage (WARDEN only)

---

## M9 -- Pattern Detection

### Requirement
Pattern detection runs continuously against the audit trail and event bus. Anomalies are classified and surfaced to the retrospective engine.

### thepopebot Proof
thepopebot includes a `pattern_monitor.py` that watches the event log for anomaly signals: elevated error rates, unusual latency distribution, repeated fallback events. The classification taxonomy (performance, correctness, safety, cost) was independently derived in both specifications. The convergence on the same four categories is strong evidence the taxonomy is correct.

### GSD-Native Design
- **Pattern classes:** `PERFORMANCE` (latency, throughput), `CORRECTNESS` (output quality, validation failures), `SAFETY` (safety warden rejections, credential violations), `COST` (routing anomalies, budget overruns)
- **Detection modes:** Threshold-based (value crosses configured limit), trend-based (rate of change exceeds limit), comparison-based (deviation from baseline)
- **Input streams:** Audit trail (via query), DACP event bus (via subscription), cluster health (via topology query)
- **Output:** `PatternSignal { pattern_id, class, severity, evidence: AuditEntry[], recommended_action, timestamp }` -- emitted to the retro loop

### Chipset YAML Extension
```yaml
chip_type: pattern-detector
version: "1.0"
contract:
  input_streams: [audit-trail, dacp-bus, cluster-health]
  pattern_classes: [PERFORMANCE, CORRECTNESS, SAFETY, COST]
  detection_modes: [threshold, trend, comparison]
  output: PatternSignal
```

### DACP Operation Types
- `PATTERN_REGISTER` -- register a new pattern definition (ARCHITECT+ only)
- `PATTERN_SIGNAL_EMIT` -- emit a detected pattern signal (internal, routed to retro loop)
- `PATTERN_QUERY` -- retrieve recent pattern signals with filters
- `PATTERN_BASELINE_UPDATE` -- update baseline statistics for comparison detection (COORDINATOR+ only)

---

## M10 -- Retro Loop

### Requirement
Retrospective engine produces structured carry-forward packages. Knowledge compounds across missions.

### thepopebot Proof
thepopebot generates a `session_summary.json` at the end of each session. The summary includes error counts by category, pattern signals, and a `carry_forward` array of recommended changes. The FLT retro loop is a generalization of this pattern: the same session-level mechanism applied at the mission level, with structured lesson records instead of free-text summaries.

### GSD-Native Design
- **Lesson record:** `{ lesson_id, module, pattern_class, description, evidence_pattern_ids: string[], recommended_adjustment, status: OPEN|APPLIED|DEFERRED }`
- **Carry-forward package:** `{ mission_id, date, lessons: LessonRecord[], module_health_summary, recommended_rollout_adjustments }`
- **Integration:** Consumes pattern signals from M9. Consumes safety results from M8 (rejected outputs). Consumes routing fallback events from M7.
- **NASA SE framing:** Every lesson record maps to a NASA SE lessons-learned category (Technical, Process, Management, Safety).
- **Carry-forward delivery:** Packaged as a `.carry-forward.json` file in the mission directory. Read by the next mission's Wave 0 scaffolding.

### Chipset YAML Extension
```yaml
chip_type: retro-loop
version: "1.0"
contract:
  input_signals: [PatternSignal, SafetyResult, RoutingFallback]
  lesson_record_schema: LessonRecord
  carry_forward_format: json
  nasa_se_categories: [Technical, Process, Management, Safety]
```

### DACP Operation Types
- `RETRO_LESSON_RECORD` -- record a lesson (triggered by pattern signals, internal)
- `RETRO_PACKAGE_GENERATE` -- generate the carry-forward package for a mission
- `RETRO_PACKAGE_QUERY` -- retrieve carry-forward package for a completed mission
- `RETRO_LESSON_STATUS_UPDATE` -- mark a lesson as APPLIED or DEFERRED (COORDINATOR+ only)

---

## Cross-Module Integration Summary

| Module | Depends On | Provides To |
|--------|-----------|------------|
| M8 Safety Warden | (foundation) | All modules (output gate) |
| M3 Credential Tiering | M8 | All modules (authorization) |
| M6 Chipset Schema | M8, M3 | All modules (type definitions) |
| M4 DACP Event Bus | M8, M3, M6 | M1, M7, M2, M5, M9, M10 |
| M1 Cluster Topology | M4 | M7 (routing candidates) |
| M7 Model Routing | M1, M4 | All modules (dispatch) |
| M2 Intake Layer | M3, M4, M6 | All modules (input boundary) |
| M5 Skill Audit Trail | M4, M6 | M9 (input stream) |
| M9 Pattern Detection | M4, M5, M1 | M10 (pattern signals) |
| M10 Retro Loop | M8, M7, M9 | Next mission (carry-forward) |

> **Related:** [01-vision-guide.md](01-vision-guide.md), [03-milestone-spec.md](03-milestone-spec.md), ABL (chipset model), AAR (architecture audit reference), WAL (Lex's theorem on convergent systems)
