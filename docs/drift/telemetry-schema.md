# Drift Telemetry Schema

**Added:** v1.49.569 (DRIFT-27)
**Log file:** `.logs/drift-telemetry.jsonl`
**Format:** Newline-delimited JSON (NDJSON / JSONL)

## Overview

All seven drift defense modules append events to a shared telemetry log. The log is append-only; rotation and retention are operator responsibilities (see [Retention](#retention)).

Each event is a flat JSON object on a single line. All events share a common envelope; event-specific fields are listed per event type below.

## Common Envelope

Every event includes these top-level fields:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Event type identifier (see [Event Types](#event-types)) |
| `timestamp` | `string` | ISO 8601 UTC timestamp when the event was emitted |

Additional fields are event-type specific (see below). There is no explicit `surface` or `severity` field in the emitted JSON — the audit script (`scripts/drift/drift-audit.mjs`) derives both from `type` and numeric score fields at read time.

## Event Types

Five event types are currently defined across seven defense modules.

### `drift.knowledge.detected`

**Module:** `src/drift/semantic-drift.ts` (M0 — Semantic Drift Detector)
**Surface:** `knowledge`
**Trigger:** SD score exceeds configured threshold (default 0.6); emitted by `detectSemanticDrift`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.knowledge.detected"` | Event type |
| `score` | `number` | SD score in [0, 1]; 1 = maximal drift |
| `drift_point` | `number \| null` | 0-based claim index at which drift was first detected; null if below threshold |
| `confidence` | `number` | Detection confidence in [0, 1]; derived from slope magnitude |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** `score >= 0.8` → `critical`; `score >= 0.5` → `warn`; else `info`.

**Example:**

```json
{
  "type": "drift.knowledge.detected",
  "score": 0.81,
  "drift_point": 4,
  "confidence": 0.73,
  "timestamp": "2026-04-23T10:14:22.001Z"
}
```

---

### `drift.alignment.taskDrift.detected`

**Module:** `src/drift/task-drift-monitor.ts` (M0 — Task-Drift Activation Monitor)
**Surface:** `alignment`
**Trigger:** Activation delta magnitude at a CAPCOM-gate boundary meets or exceeds threshold; emitted by `monitorTaskDrift`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.alignment.taskDrift.detected"` | Event type |
| `drift_magnitude` | `number` | L2 magnitude of the activation delta; range [0, ∞) |
| `classification` | `"clean" \| "suspicious" \| "drift"` | Drift classification |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** `drift_magnitude >= 0.8` → `critical`; `drift_magnitude >= 0.5` → `warn`; else `info`.

**Example:**

```json
{
  "type": "drift.alignment.taskDrift.detected",
  "drift_magnitude": 0.93,
  "classification": "drift",
  "timestamp": "2026-04-23T10:15:00.500Z"
}
```

---

### `drift.retrieval.stale_index_detected`

**Module:** `src/drift/temporal-retrieval.ts` (M0 — Temporal Retrieval Check)
**Surface:** `retrieval`
**Trigger:** Grove RAG index timestamp lags SSoT timestamp by more than the configured Δt; emitted by `checkTemporalFreshness`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.retrieval.stale_index_detected"` | Event type |
| `lag_ms` | `number` | Lag between SSoT and index timestamps in milliseconds |
| `classification` | `"fresh" \| "stale" \| "critical"` | Freshness classification |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** Falls back to static `warn` when `lag_ms` is the only numeric field present. A `classification: "critical"` in the payload does not automatically escalate audit severity; the audit script uses the `lag_ms` heuristic.

**Example:**

```json
{
  "type": "drift.retrieval.stale_index_detected",
  "lag_ms": 864000000,
  "classification": "stale",
  "timestamp": "2026-04-23T10:16:00.000Z"
}
```

---

### `drift.retrieval.lazy_grounding_detected`

**Module:** `src/drift/grounding-faithfulness.ts` (M0 — Grounding-Faithfulness Assertion)
**Surface:** `retrieval`
**Trigger:** Semantic Grounding Index (SGI) score falls below the configured threshold; emitted by `assertGroundingFaithfulness`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.retrieval.lazy_grounding_detected"` | Event type |
| `sgi_score` | `number` | Semantic Grounding Index in [0, 1]; lower = more semantic laziness |
| `angular_response_to_context` | `number` | Angular similarity between response and retrieved context in [0, 1] |
| `angular_response_to_query` | `number` | Angular similarity between response and query in [0, 1] |
| `classification` | `"faithful" \| "lazy" \| "hallucinating"` | Grounding classification |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** `sgi_score >= 0.8` → `critical`; `sgi_score >= 0.5` → `warn`; else `info`. Note: `sgi_score` is a _laziness_ score; higher = worse.

**Example:**

```json
{
  "type": "drift.retrieval.lazy_grounding_detected",
  "sgi_score": 0.82,
  "angular_response_to_context": 0.23,
  "angular_response_to_query": 0.89,
  "classification": "lazy",
  "timestamp": "2026-04-23T10:17:00.000Z"
}
```

---

### `drift.retrieval.context_collapse_detected`

**Module:** `src/drift/context-entropy.ts` (M0 — BEE-RAG Context-Entropy Guard)
**Surface:** `retrieval`
**Trigger:** Shannon entropy of the retrieval context drops below the configured threshold; emitted by `checkContextEntropy`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.retrieval.context_collapse_detected"` | Event type |
| `entropy` | `number` | Shannon entropy of the context token distribution in bits; range [0, ∞) |
| `threshold` | `number` | Configured entropy floor; collapse when `entropy < threshold` |
| `classification` | `"healthy" \| "low" \| "collapse"` | Entropy classification |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** Always `critical` regardless of numeric scores — context collapse is a hard signal.

**Example:**

```json
{
  "type": "drift.retrieval.context_collapse_detected",
  "entropy": 0.09,
  "threshold": 1.5,
  "classification": "collapse",
  "timestamp": "2026-04-23T10:18:00.000Z"
}
```

---

## Retention

- The log file is append-only; no event is ever deleted by the defense modules.
- Rotation is the operator's responsibility (e.g., `logrotate`, cron + `mv`, or a separate archiver).
- Events older than 30 days are not automatically purged; plan storage accordingly.
- The `drift-audit.mjs --since` flag can scope queries to a rolling window without requiring log rotation.

## M6/M7 Integration (Sensoria / Umwelt)

### M6 — Sensoria (`src/sensoria/`)

M6 does not currently emit drift-telemetry events. Integration is opt-in and documented as a TODO for a future phase:

- Add `driftTelemetry: boolean` (default `false`) to the `SensoriaHookOptions` interface in `src/sensoria/applicator-hook.ts`.
- When `driftTelemetry: true` and a skill fails the net-shift gate, emit a `drift.knowledge.detected` event with `score` derived from the net-shift delta.
- Byte-identical behaviour when `driftTelemetry: false` (current default) is maintained by the existing SC-FLAG-OFF guarantee.

### M7 — Umwelt (`src/umwelt/`)

M7 does not currently emit drift-telemetry events. Integration is opt-in and documented as a TODO:

- Add `driftTelemetry: boolean` (default `false`) to the free-energy minimiser options in `src/umwelt/freeEnergy.ts`.
- When `driftTelemetry: true` and variational free energy exceeds a configurable bound, emit a `drift.alignment.taskDrift.detected` event with `drift_magnitude` derived from the ΔF signal.
- Default-off guarantee: no M7 code path emits to the telemetry log unless the operator has explicitly set `driftTelemetry: true`.

## See Also

- [`docs/cli/drift-audit.md`](../cli/drift-audit.md) — CLI reference for reading and reporting on this log
- `src/drift/__tests__/default-off-invariance.test.ts` — golden-output tests confirming default-off byte identity
- `src/drift/__tests__/drift-audit.test.ts` — integration tests for the audit CLI
