# `skill-creator drift audit` — CLI Reference

**Script:** `scripts/drift/drift-audit.mjs`
**Added:** v1.49.569 (DRIFT-26)

## Synopsis

```
node scripts/drift/drift-audit.mjs [options]
```

Reads the drift-telemetry JSONL log, scores events by surface and severity, and prints a unified per-surface scorecard. Exits 0 when clean; exits 1 on any critical finding.

## Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--logs <path>` | any file path | `.logs/drift-telemetry.jsonl` | Override the telemetry log file location |
| `--format` | `markdown`, `json` | `markdown` | Output format |
| `--since <ISO-date>` | ISO 8601 timestamp | (none) | Include only events at or after this timestamp |
| `--surface` | `knowledge`, `alignment`, `retrieval`, `all` | `all` | Filter to a single drift surface |
| `--severity` | `info`, `warn`, `critical`, `all` | `all` | Filter to a single severity tier |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Audit clean — no CRITICAL events in the filtered window |
| 1 | CRITICAL findings present — events require investigation |

## Example Invocations

**Default markdown report (all surfaces, all severities):**

```bash
node scripts/drift/drift-audit.mjs
```

**JSON output for machine consumption:**

```bash
node scripts/drift/drift-audit.mjs --format json
```

**Knowledge surface only, last 24 hours:**

```bash
node scripts/drift/drift-audit.mjs \
  --surface knowledge \
  --since 2026-04-22T00:00:00.000Z
```

**Alignment surface, critical only:**

```bash
node scripts/drift/drift-audit.mjs \
  --surface alignment \
  --severity critical
```

**Retrieval surface, custom log path:**

```bash
node scripts/drift/drift-audit.mjs \
  --surface retrieval \
  --logs /var/log/skill-creator/drift-telemetry.jsonl
```

**CI gate (exit-code-driven):**

```bash
node scripts/drift/drift-audit.mjs --format json --since "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
  && echo "Drift audit: clean" \
  || { echo "Drift audit: CRITICAL — see report"; exit 1; }
```

## Surfaces and Event Types

| Surface | Event Types |
|---------|-------------|
| `knowledge` | `drift.knowledge.detected` |
| `alignment` | `drift.alignment.taskDrift.detected` |
| `retrieval` | `drift.retrieval.stale_index_detected`, `drift.retrieval.lazy_grounding_detected`, `drift.retrieval.context_collapse_detected` |

## Severity Classification

Severity is inferred from each event's numeric score field (falling back to static per-type mapping). Polarity differs between score fields:

- `score`, `drift_magnitude`, `similarity` — higher = worse.
- `sgi_score` — higher = **better** (more grounded). Audit uses an inverted rule for `drift.retrieval.lazy_grounding_detected` only.

| Score / Condition | Severity |
|-------------------|----------|
| `score >= 0.8` or `drift_magnitude >= 0.8` | `critical` |
| `score >= 0.5` or `drift_magnitude >= 0.5` | `warn` |
| Below threshold | `info` |
| `sgi_score <= 0.2` (lazy_grounding events only) | `critical` |
| `sgi_score <= 0.5` (lazy_grounding events only) | `warn` |
| `context_collapse_detected` (always) | `critical` |

## JSON Output Schema

```json
{
  "generated": "<ISO-timestamp>",
  "filters": {
    "since": "<ISO-timestamp or null>",
    "surface": "all",
    "severity": "all"
  },
  "total_events": 42,
  "status": "clean | critical",
  "critical_count": 0,
  "surfaces": {
    "knowledge": { "info": 0, "warn": 0, "critical": 0, "total": 0, "by_event_type": {} },
    "alignment": { "info": 0, "warn": 0, "critical": 0, "total": 0, "by_event_type": {} },
    "retrieval": { "info": 0, "warn": 0, "critical": 0, "total": 0, "by_event_type": {} }
  }
}
```

## See Also

- [Telemetry schema reference](../drift/telemetry-schema.md) — per-event field dictionary, event type catalogue, retention notes
- `scripts/drift/bci-validate.mjs` — BCI training-pair governance script (DRIFT-22)
- `src/drift/__tests__/drift-audit.test.ts` — integration tests
