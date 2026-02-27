# Assembly Patterns Reference

Worked examples showing the assembly process for different scenarios at each fidelity level.

## Example 1: Simple Status Report (Level 0)

**Scenario:** An executor agent reports task completion to the orchestrator.

**Input:**
```json
{
  "source_agent": "executor-01",
  "target_agent": "orchestrator",
  "opcode": "REPORT",
  "intent": "Phase 3 tasks complete. All 5 tests passing.",
  "handoff_type": "status-report",
  "historical_drift_rate": 0.02,
  "token_budget_remaining": 80000,
  "safety_critical": false
}
```

**Decision reasoning:**
- Data complexity: none (no data payload)
- Rule 2 matches: `data_complexity = 'none'` --> Level 0

**Output bundle:**
```
bundle-exec-report-001/
  manifest.json
  intent.md      <- "Phase 3 tasks complete. All 5 tests passing."
```

No data/ or code/ directories. Minimal token cost (~300 tokens).

## Example 2: Configuration Update (Level 1)

**Scenario:** Admin agent pushes a config update to a service agent.

**Input:**
```json
{
  "source_agent": "admin",
  "target_agent": "service-api",
  "opcode": "CONFIG",
  "intent": "Update rate limiting thresholds for API endpoints.",
  "data": { "rate_limit": 100, "burst": 20, "window_ms": 60000 },
  "handoff_type": "configuration-update",
  "data_types": ["config-data"],
  "historical_drift_rate": 0.05,
  "token_budget_remaining": 50000,
  "safety_critical": false
}
```

**Decision reasoning:**
- Data complexity: simple (3 fields, depth 1)
- Rule 12 matches: `simple data` --> Level 1

**Output bundle:**
```
bundle-config-002/
  manifest.json
  intent.md          <- "Update rate limiting thresholds..."
  data/
    payload.json     <- { "rate_limit": 100, "burst": 20, "window_ms": 60000 }
```

## Example 3: Task Assignment with Schemas (Level 2)

**Scenario:** Orchestrator assigns a structured task to an executor with schema validation.

**Input:**
```json
{
  "source_agent": "orchestrator",
  "target_agent": "executor-02",
  "opcode": "EXEC",
  "intent": "Implement the authentication module per plan 05-03.",
  "data": {
    "task_id": "05-03",
    "files_to_create": ["src/auth/login.ts", "src/auth/login.test.ts"],
    "dependencies": ["bcrypt", "jsonwebtoken"],
    "acceptance_criteria": ["All tests pass", "No type errors"]
  },
  "handoff_type": "task-assignment",
  "data_types": ["task-data"],
  "historical_drift_rate": 0.12,
  "token_budget_remaining": 100000,
  "safety_critical": false
}
```

**Decision reasoning:**
- Data complexity: structured (depth 2, 4 fields + nested arrays)
- 1 matching schema in catalog (task-data schema from planning-skill)
- Rule 11 matches: `structured data AND skills > 0` --> Level 2

**Output bundle:**
```
bundle-exec-auth-003/
  manifest.json
  intent.md                 <- "Implement the authentication module..."
  data/
    payload.json            <- { task_id, files_to_create, dependencies, ... }
    schema-task-data.json   <- { $ref: "/schemas/task-data.json", ... }
```

## Example 4: Complex Data Transformation (Level 3)

**Scenario:** High-drift data transformation with matching parser and validator scripts.

**Input:**
```json
{
  "source_agent": "analyzer",
  "target_agent": "transformer",
  "opcode": "TRANSFORM",
  "intent": "Transform raw telemetry data into dashboard-ready metrics.",
  "data": {
    "source": "telemetry-stream",
    "schema_version": "2.1",
    "records": [
      { "timestamp": "2026-02-27T10:00:00Z", "metric": "cpu", "value": 72.5, "tags": { "host": "srv-01", "region": "us-east" } }
    ],
    "transform_rules": {
      "aggregation": "5min",
      "filters": { "metric": ["cpu", "memory", "disk"] },
      "output_format": "dashboard-v3"
    }
  },
  "handoff_type": "data-transformation",
  "data_types": ["telemetry-data"],
  "historical_drift_rate": 0.45,
  "token_budget_remaining": 80000,
  "safety_critical": false
}
```

**Decision reasoning:**
- Data complexity: complex (depth 4+, many fields)
- Historical drift: 0.45 (high, > 0.3)
- 2 matching scripts in catalog (parser + validator)
- Rule 5 matches: `drift > 0.3 AND complex data AND skills >= 1` --> Level 3

**Output bundle:**
```
bundle-transform-004/
  manifest.json
  intent.md                       <- "Transform raw telemetry data..."
  data/
    payload.json                  <- { source, schema_version, records, ... }
    schema-telemetry-data.json    <- { $ref: "/schemas/telemetry.json", ... }
  code/
    parser-parse-telemetry.sh     <- "# Source: telemetry-skill v1.2.0\n..."
    validator-check-output.sh     <- "# Source: dashboard-skill v3.0.0\n..."
```

Rationale records: "Level 3 selected. Data complexity: complex. High drift rate (0.45). 2 skill(s) available for scaffolding."
