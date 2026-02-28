# Upstream Intelligence Pack

The Upstream Intelligence Pack is a fully injectable, test-driven pipeline
that monitors external channels for changes, classifies their impact,
traces affected components, applies bounded patches, and generates
intelligence briefings. Every module uses dependency injection with no
real I/O, making the entire system deterministically testable.

## Architecture

The pack follows a linear pipeline architecture where each stage
transforms data and passes it to the next:

```
Channel Registry
    │
    ▼
Monitor ──→ Classifier ──→ Tracer ──→ Patcher ──→ Briefer
    │                                    │            │
    ▼                                    ▼            ▼
Channel State                      Persistence   Dashboard Alerts
```

### Module Overview

| Module             | File                 | Purpose                                      |
|--------------------|----------------------|----------------------------------------------|
| Types              | `types.ts`           | Full type system: events, manifests, configs  |
| Registry           | `registry.ts`        | Channel configuration (11 upstream sources)   |
| Monitor            | `monitor.ts`         | Content-hash polling with rate limiting       |
| Classifier         | `classifier.ts`      | Change type detection and severity assignment |
| Tracer             | `tracer.ts`          | Impact tracing through dependency graph       |
| Patcher            | `patcher.ts`         | Bounded auto-patching with safety guards      |
| Briefer            | `briefer.ts`         | Multi-tier intelligence briefings             |
| Dashboard Alerts   | `dashboard-alerts.ts`| Terminal alert formatting and aggregation     |
| Persistence        | `persistence.ts`     | JSONL append-only logs and content cache      |
| Channel State      | `channel-state.ts`   | Per-channel polling state management          |
| Pipeline           | `pipeline.ts`        | Orchestrator wiring all modules together      |
| Barrel             | `index.ts`           | Re-exports for clean external API             |

### Dependency Injection

Every module accepts its dependencies through explicit interface
parameters. No module performs real I/O directly:

- `MonitorDeps`: fetchFn, hashFn, readStateFn, writeStateFn, writeCacheFn
- `TracerDeps`: readDir, readFile
- `PatcherDeps`: readFile, writeFile, copyFile, hashFile, runValidation, getPatchHistory
- `PersistenceDeps`: readFile, writeFile, appendFile, copyFile, mkdir, exists
- `ChannelStateDeps`: readFile, writeFile, exists
- `PipelineDeps`: monitor, tracer, patcher, persistence (composite)

This makes every function deterministically testable with simple stubs.

## Pipeline

The pipeline orchestrator (`pipeline.ts`) wires all modules into a
single `runPipeline()` function that processes channels end-to-end.

### Flow

1. **Monitor** — Poll each channel via `checkChannel()`. Compare
   content hashes to detect changes. First checks seed state and
   return no event. Subsequent checks emit `RawChangeEvent` when
   hashes differ.

2. **Classify** — Transform `RawChangeEvent` into `ClassifiedEvent`
   via `classifyChange()`. Detects change type (breaking, security,
   deprecation, enhancement, optimization, informational) using
   keyword patterns. Assigns severity (P0-P3) and patchability.

3. **Trace** — Build a dependency graph from skills and agents
   directories via `traceImpact()`. Find directly affected components
   (domain keyword matching) and transitively affected components
   (reverse graph walk). Output: `ImpactManifest`.

4. **Patch** — For each patchable component, `applyPatch()` enforces
   safety bounds (max 20% content change, severity gates, 7-day
   cooldown), creates a backup, applies the patch, runs post-validation,
   and auto-rolls back on failure.

5. **Brief** — Generate a `Briefing` via `generateBriefing()` with
   all classified changes, applied patches, and pending decisions.
   Supports four tiers: flash, session, weekly, monthly.

6. **Log** — Append a structured audit entry to the intelligence
   JSONL log for full provenance tracking.

### Entry Points

```typescript
// Run across all channels
const result = await runPipeline(channels, deps);

// Process a single channel
const channelResult = await processSingleChannel(channel, deps);
```

### Pipeline Result

```typescript
interface PipelineResult {
  events_detected: number;
  events_classified: number;
  impacts_traced: number;
  patches_applied: number;
  patches_rejected: number;
  briefings_generated: number;
  errors: string[];
}
```

## Agents

The pipeline modules map to four logical agent roles:

### SENTINEL (Monitor)

The Sentinel agent watches upstream channels for changes. It polls
configured URLs, computes content hashes, compares against stored
state, and emits raw change events when differences are detected.
Supports rate limiting via a sliding-window algorithm.

### ANALYST (Classifier)

The Analyst agent classifies raw change events into typed, severity-rated
events. Uses weighted keyword pattern matching across six change types.
Security and breaking changes always receive P0 severity. Enhancement
and optimization map to P2. Informational defaults to P3.

### TRACER (Impact Tracer)

The Tracer agent builds a dependency graph from skill and agent files,
then traces both direct and transitive impacts. Direct impacts are found
by matching change domains against component content. Transitive impacts
are discovered via breadth-first reverse-graph traversal. Produces an
`ImpactManifest` with blast radius metrics.

### HERALD (Briefer + Dashboard)

The Herald agent generates multi-tier intelligence briefings and
dashboard alerts. Routes changes to appropriate tiers based on severity
(P0 to flash, P1 to flash+session, P2 to session, P3 to weekly).
Formats alerts with ANSI color codes for terminal display. Supports
aggregation and deduplication across tiers.

## Teams

The agents are composed into a single **Upstream Intelligence Team**:

```
SENTINEL → ANALYST → TRACER → HERALD
                       ↓
                    PATCHER
```

The team operates as a sequential pipeline with the PATCHER as a
conditional branch. When the TRACER identifies patchable components,
the PATCHER is invoked. All results flow to the HERALD for final
briefing generation.

Team coordination is handled by the pipeline orchestrator which
manages error isolation (one channel failure does not affect others),
result aggregation, and audit logging.

## Persistence

### Append-Only JSONL Logs

The intelligence log (`.planning/upstream/intelligence.jsonl`) captures
every pipeline execution as a structured JSON line. Each entry includes
timestamp, channel, event ID, change type, severity, components affected,
patches applied/rejected, and briefing tier. The log is append-only
per SC-08 safety constraint.

### Content Cache

Channel content is cached in a directory structure
(`{cacheDir}/{channel}/{slot}`) for diff comparison and audit purposes.

### Channel State

Per-channel polling state (last hash, last checked, last changed, etag)
is persisted as a JSON array. State updates are atomic (read-modify-write).

### Rollback Backups

Before every patch, a backup copy of the target file is created in the
rollback directory. Backups enable byte-identical restoration on
post-validation failure.

## Safety Constraints

The Upstream Intelligence Pack enforces strict safety invariants:

| ID    | Constraint                                          | Enforcement                          |
|-------|-----------------------------------------------------|--------------------------------------|
| SC-01 | Patch size must not exceed 20% of content           | `validatePatchBounds()` size check   |
| SC-02 | P0 changes never auto-patched                       | `validatePatchBounds()` severity gate|
| SC-03 | P1 changes never auto-patched                       | `validatePatchBounds()` severity gate|
| SC-05 | Rollback restores byte-identical content             | `rollback()` via backup read/write   |
| SC-08 | Intelligence log is append-only                      | `appendLog()` uses appendFile only   |
| SC-10 | Backup created before every patch write              | `createBackup()` before `writeFile()`|
| SC-11 | Failed post-validation triggers automatic rollback   | `applyPatch()` rollback branch       |
| SC-14 | 7-day cooldown between re-patching same skill        | `checkCooldown()` history check      |

### Error Isolation

Errors in one channel do not propagate to others. The pipeline
catches exceptions per-channel and records them in the result's
`errors` array. Logging failures are silently suppressed to prevent
cascading failures.

### Validation Gates

Every patch runs through two validation phases:
1. **Pre-validation** — Checks project state before applying the patch.
   Failure prevents the patch entirely.
2. **Post-validation** — Checks project state after applying the patch.
   Failure triggers automatic rollback to the backup.

## Configuration

### Channel Registry

The registry (`registry.ts`) defines 11 upstream channels covering:

- Anthropic documentation, blog, changelog, and status
- Claude Code releases and issues
- Anthropic SDK releases (Python and TypeScript)
- MCP specification and servers
- Anthropic cookbook patterns

Each channel specifies a name, URL, type, priority, check interval,
and domain tags. Channels can be queried by name, priority, or domain.

### Priority Levels

| Priority | Check Interval | Briefing Tier    | Auto-Patchable |
|----------|----------------|------------------|----------------|
| P0       | 1-6 hours      | Flash            | Never          |
| P1       | 12 hours       | Flash + Session  | Never          |
| P2       | 24 hours       | Session          | Yes (< 20%)    |
| P3       | 24+ hours      | Weekly           | Yes (< 20%)    |

## Usage

### Basic Pipeline Run

```typescript
import { getChannels } from './upstream';
import { runPipeline } from './upstream/pipeline';
import type { PipelineDeps } from './upstream/pipeline';

const channels = getChannels();
const deps: PipelineDeps = {
  monitor: { /* inject real I/O functions */ },
  tracer: { /* inject real I/O functions */ },
  patcher: { /* inject real I/O functions */ },
  persistence: { /* inject real I/O functions */ },
};

const result = await runPipeline(channels, deps);
console.log(`Detected: ${result.events_detected}, Patched: ${result.patches_applied}`);
```

### Single Channel Check

```typescript
import { getChannel } from './upstream';
import { processSingleChannel } from './upstream/pipeline';

const channel = getChannel('anthropic-docs')!;
const result = await processSingleChannel(channel, deps);
```

### Generating Briefings

```typescript
import { generateSessionBriefing, formatBriefingText } from './upstream';

const briefing = generateSessionBriefing(classifiedEvents, patchManifests);
const text = formatBriefingText(briefing);
console.log(text);
```

### Dashboard Alerts

```typescript
import {
  validateAlert,
  formatAlertForTerminal,
  aggregateAlerts,
  deduplicateAlerts,
} from './upstream';

const valid = validateAlert(alert);
if (valid.valid) {
  console.log(formatAlertForTerminal(alert));
}

const grouped = aggregateAlerts(alerts);
const unique = deduplicateAlerts(alerts);
```

## Test Coverage

The Upstream Intelligence Pack includes comprehensive test coverage
across 19 test files with 200+ tests:

- **Unit tests** for each module (types, registry, monitor, classifier,
  tracer, patcher, briefer, dashboard-alerts, persistence, channel-state)
- **Agent-level tests** for SENTINEL+ANALYST and TRACER+PATCHER+HERALD
- **Team-level tests** for the full pipeline composition
- **Corpus tests** for real-world content classification accuracy
- **Safety-critical tests** for all SC-* invariants
- **Edge-case tests** for boundary conditions and error handling
- **Integration tests** for end-to-end pipeline flow
- **Safety integration tests** for patch-backup-rollback lifecycle
- **Documentation tests** verifying README completeness and barrel exports

All tests use injectable dependencies with no real I/O, enabling
deterministic execution in any environment.
