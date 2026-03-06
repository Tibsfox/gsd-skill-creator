# Gastown Orchestration Chipset

Multi-agent orchestration chipset for the GSD ecosystem, absorbing production-tested patterns from [steveyegge/gastown](https://github.com/steveyegge/gastown) into a declarative chipset definition that skill-creator can load, customize, and evolve.

## What It Does

Coordinates 1-30 parallel AI agents through a hardware-inspired topology: a Mayor (coordinator), Witness (observer), Refinery (merge processor), and a pool of Polecats (workers). Agents communicate through filesystem-based channels, execute work items dispatched via hooks, and merge results through a sequential queue. All state is crash-recoverable JSON persisted with atomic writes.

## Quick Start

### 1. Load the Chipset

```typescript
import { gastown } from './chipset/index.js';

// Validate the chipset YAML against its schema
const yaml = fs.readFileSync('data/chipset/gastown-orchestration/gastown-orchestration.yaml', 'utf8');
const result = gastown.validateChipset(yaml, 'path/to/schema.json');

if (!result.valid) {
  console.error('Chipset validation failed:', result.errors);
}
```

### 2. Initialize State

```typescript
const state = new gastown.StateManager({ stateDir: '.chipset/state' });

// Create the agent topology
const mayor = await state.createAgent('mayor', 'my-project');
const witness = await state.createAgent('witness', 'my-project');
const refinery = await state.createAgent('refinery', 'my-project');
const polecat1 = await state.createAgent('polecat', 'my-project');
```

### 3. Dispatch Work

```typescript
// Create a work item
const item = await state.createWorkItem('Implement auth module', 'Add JWT auth with refresh rotation', 'P1');

// Hook the work to a polecat (GUPP: agent must act immediately)
await state.setHook(polecat1.id, item.beadId);

// Track as a convoy for batch progress
const convoy = await state.createConvoy('auth-feature', [item.beadId]);
```

### 4. Complete Work

```typescript
// Polecat finishes, update status
await state.updateWorkStatus(item.beadId, 'done');
await state.clearHook(polecat1.id);

// Recalculate convoy progress
await state.updateConvoyProgress(convoy.id);
```

## Architecture

```
                    +------------------+
                    |     Mayor        |  Coordinator (Northbridge)
                    | sling-dispatch   |  Owns convoys, dispatches work
                    | convoy-batch     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------+------+ +----+-------+ +----+--------+
     |   Witness      | |  Polecat   | |  Refinery   |
     | (PMU Observer) | |  Pool      | | (DMA Merge) |
     | monitors health| | (ALU x5)  | | sequential   |
     | detects stalls | | executes   | | merge queue  |
     +--------+------+ | work items | +----+--------+
              |         +----+-------+      |
              |              |              |
     +--------+--------------+--------------+--------+
     |             Filesystem Bus                     |
     |  mail/  nudge/  hooks/  merge-queue/           |
     +------------------------------------------------+
```

### Agent Topology

| Agent | Role | Chipset Equivalent | Function |
|-------|------|--------------------|----------|
| Mayor | Coordinator | Northbridge | Routes work, owns convoys, supervises agents |
| Witness | Observer | PMU | Monitors polecat health, detects stalls, reports metrics |
| Refinery | Merge Processor | DMA Controller | Sequential merge queue, deterministic rebase-merge |
| Polecat Pool | Workers (x5 default) | ALU | Ephemeral task execution, parallelizable |

### Communication Channels

| Channel | Type | Bus Equivalent | Behavior |
|---------|------|----------------|----------|
| Mail | Async durable | PCIe | Persistent messages in `state/mail/{recipient}/` |
| Nudge | Sync immediate | SMI | Lightweight pings for GUPP enforcement |
| Hook | Pull-based | MMIO | Work assignment registers in `state/hooks/` |
| Handoff | Cycling transfer | Bus Reset | Ownership transfer for merge queue |

### Dispatch Pipeline

Work items flow through a fetch-decode-execute pipeline:

1. **Fetch** - Mayor resolves bead from work queue
2. **Allocate** - Sling assigns an available polecat
3. **Hook** - Work item attached to polecat's hook register
4. **Execute** - GUPP fires: polecat acts immediately on hooked work
5. **Retire** - Done pipeline: push results, create merge request, free polecat

## Skill Inventory

The chipset declares these skills in its YAML manifest:

### Required Skills (0.79 token budget weight)

| Skill | Domain | Weight | Description |
|-------|--------|--------|-------------|
| `agent-topology` | orchestration | 0.25 | Hierarchical agent supervision and coordination (Mayor/Witness/Polecat/Refinery roles) |
| `gupp-propulsion` | orchestration | 0.18 | Interrupt-driven work execution -- agents act on hooked work immediately |
| `beads-persistence` | infrastructure | 0.18 | Git-backed durable state for agents and work items with crash recovery |
| `sling-dispatch` | workflow | 0.18 | Work dispatch pipeline with batch and formula modes |

### Recommended Skills (0.18 token budget weight)

| Skill | Domain | Weight | Description |
|-------|--------|--------|-------------|
| `convoy-batch` | workflow | 0.09 | Groups related beads into convoys for aggregate progress tracking |
| `formula-microcode` | workflow | 0.09 | TOML-based workflow templates for repeatable multi-step operations |

### Additional Operational Skills

These skills are referenced in the architecture but loaded separately:

| Skill | Domain | Description |
|-------|--------|-------------|
| `mayor-coordinator` | orchestration | Mayor role implementation: convoy creation, cross-rig routing |
| `polecat-worker` | orchestration | Polecat lifecycle: spawn, execute, retire |
| `witness-observer` | orchestration | Health monitoring, stall detection, metrics reporting |
| `refinery-merge` | workflow | Sequential merge queue processing |
| `mail-async` | communication | Async durable messaging between agents |
| `nudge-sync` | communication | Lightweight sync pings for heartbeat and GUPP |
| `hook-persistence` | infrastructure | Hook state management and GUPP enforcement |
| `done-retirement` | workflow | Work completion pipeline: push, merge-request, cleanup |
| `runtime-hal` | infrastructure | Hardware abstraction layer for Claude Code, Codex, Gemini |

## Configuration

Key sections of `gastown-orchestration.yaml` that you can customize:

### Agent Pool Size

```yaml
agents:
  agents:
    - name: polecat-pool
      role: polecat
      count: 5        # Increase for more parallel workers (max 30)
```

### Dispatch Strategy

```yaml
dispatch:
  strategy: sling       # Dispatch strategy
  max_parallel: 10      # Max concurrent work items
  batch_threshold: 3    # Auto-batch when this many beads queue up
  formula_support: true # Enable TOML formula-driven dispatch
```

### Token Budget

```yaml
skills:
  required:
    - name: agent-topology
      token_budget_weight: 0.25  # Fraction of 10k token budget
```

Total weight (required + recommended) must stay at or below 1.0.

### Evaluation Gates

```yaml
evaluation:
  gates:
    pre_deploy:
      - check: agent_identity
        threshold: 100   # 100% of agents must have valid identity
        action: block    # Fail if not met
      - check: gupp_response_time
        threshold: 30    # Agents must respond to hooks within 30s
        action: warn     # Warn but don't block
```

## Safety Boundaries

- **Token budget ceiling**: All skill weights must sum to 1.0 or less (10k tokens of 200k context)
- **Agent topology constraints**: Exactly 1 mayor, at least 1 witness, at least 1 polecat
- **Skill reference integrity**: Every skill referenced by an agent must exist in the skills manifest
- **Communication channels**: All channels must have valid types and non-empty filesystem paths
- **Sequential merge**: Refinery processes one merge at a time to prevent conflicts
- **Hook enforcement**: An agent cannot receive new work while an active hook exists

## State Directory Layout

```
.chipset/state/
  agents/        Agent identity JSON files
  hooks/         GUPP hook state per agent
  work/          Work item beads
  convoys/       Batch tracking
  merge-queue/   Refinery merge requests
  mail/          Async durable messages
  nudge/         Sync immediate pings
```

All JSON files use sorted keys for deterministic, git-diff-friendly output. Writes use atomic temp-file-then-rename to guarantee crash consistency.

## Credits

- **Gastown patterns**: [steveyegge/gastown](https://github.com/steveyegge/gastown) (MIT License) -- Steve Yegge's multi-agent orchestration system for Claude Code
- **Chipset architecture**: GSD skill-creator framework -- Amiga-inspired custom chipset metaphor
- **Integration**: Patterns absorbed as a chipset definition, not ported as code. Gastown's production-tested coordination mapped to GSD's principled architecture.
