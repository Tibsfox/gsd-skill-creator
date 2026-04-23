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
**Trigger:** Grove RAG index timestamp lags SSoT timestamp by more than the configured Δt; emitted by `checkTemporalRetrieval`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.retrieval.stale_index_detected"` | Event type |
| `lag_ms` | `number` | Signed lag (retrieval − ssot) in milliseconds. Positive = retrieval is ahead of SSoT update (normal); negative = unusual. |
| `classification` | `"fresh" \| "stale" \| "critically-stale"` | Freshness band: `fresh` when `abs(lag_ms) ≤ maxLagMs`; `stale` when `maxLagMs < abs(lag_ms) ≤ 3 × maxLagMs`; `critically-stale` when `abs(lag_ms) > 3 × maxLagMs`. |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** Falls back to the static per-type default (`warn`) because the audit-script severity rule is score-based and `lag_ms` is not in the score chain. A `classification: "critically-stale"` in the payload does not automatically escalate audit severity; operators who need to gate on critically-stale events should filter by `classification` field in their downstream consumer.

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
**Trigger:** Semantic Grounding Index (SGI) score falls below the configured `groundingThreshold` AND the response-to-query similarity exceeds `lazyThreshold` (indicating the response parrots the query while ignoring retrieved context); emitted by `checkGroundingFaithfulness`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.retrieval.lazy_grounding_detected"` | Event type |
| `sgi_score` | `number` | Semantic Grounding Index in `[-1, 1]` (typically clamped to `[0, 1]` for normalised embeddings). **Higher = more faithfully grounded.** Equal to `angular_response_to_context`. |
| `angular_response_to_context` | `number` | Angular (cosine) similarity between response and retrieved context; higher = more faithfully grounded |
| `angular_response_to_query` | `number` | Angular (cosine) similarity between response and query; higher + low sgi_score = laziness |
| `classification` | `"grounded" \| "lazy" \| "drifted"` | Grounding classification: `grounded` when `sgi_score >= groundingThreshold`; `lazy` when `sgi_score < groundingThreshold` AND `angular_response_to_query >= lazyThreshold`; `drifted` otherwise. |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** The audit script null-coalesces `sgi_score` into its score chain. Because `sgi_score` polarity is inverted from generic `drift_magnitude` (higher = better for SGI), the audit script uses an inverted rule for this event type: `sgi_score <= 0.2` → `critical`; `sgi_score <= 0.5` → `warn`; else `info`. Only lazy-classified events are emitted, so this severity mapping applies only to them.

**Example:**

```json
{
  "type": "drift.retrieval.lazy_grounding_detected",
  "sgi_score": 0.18,
  "angular_response_to_context": 0.18,
  "angular_response_to_query": 0.91,
  "classification": "lazy",
  "timestamp": "2026-04-23T10:17:00.000Z"
}
```

---

### `drift.retrieval.context_collapse_detected`

**Module:** `src/drift/context-entropy.ts` (M0 — BEE-RAG Context-Entropy Guard)
**Surface:** `retrieval`
**Trigger:** Normalised Shannon entropy of the context-attention distribution drops below the configured `entropyThreshold`; emitted by `checkContextEntropy`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"drift.retrieval.context_collapse_detected"` | Event type |
| `entropy` | `number` | Normalised Shannon entropy `H_norm = H / log2(N)`, range `[0, 1]`. `0` = completely collapsed (all weight on one segment); `1` = uniform distribution (maximum diversity). |
| `threshold` | `number` | Configured entropy floor in `(0, 1]`; module default is `0.5`. Collapse when `entropy < threshold`. |
| `classification` | `"healthy" \| "collapsing" \| "collapsed"` | `healthy` when `entropy >= threshold`; `collapsing` when `threshold/2 <= entropy < threshold`; `collapsed` when `entropy < threshold/2`. |
| `timestamp` | `string` | ISO 8601 UTC |

**Severity classification (audit script):** Always `critical` regardless of numeric scores — context collapse is a hard signal.

**Example:**

```json
{
  "type": "drift.retrieval.context_collapse_detected",
  "entropy": 0.18,
  "threshold": 0.5,
  "classification": "collapsed",
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
