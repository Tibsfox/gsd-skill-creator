# 09 — Multi-Instance Gastown

## One Orchestrator, Many Chipsets

A user may have multiple projects, each with its own Gastown chipset. gsd-skill-creator orchestrates this complexity — it is the orchestrator of orchestrators.

## Directory Layout

Each Gastown instance gets its own isolated state:

```
.chipset/
├── instances/
│   ├── project-alpha/
│   │   ├── config.yaml          # Chipset YAML (may customize agent counts)
│   │   └── state/               # Isolated state directory
│   │       ├── agents/
│   │       ├── hooks/
│   │       ├── work/
│   │       ├── convoys/
│   │       ├── merge-queue/
│   │       ├── mail/
│   │       └── nudge/
│   ├── project-beta/
│   │   ├── config.yaml
│   │   └── state/
│   └── project-gamma/
│       ├── config.yaml
│       └── state/
└── schema/
    └── gastown-chipset-schema.json   # Shared schema
```

## Isolation Rules

1. **State directories are fully isolated.** Instance A cannot read or write Instance B's state.
2. **Cross-instance communication goes through gsd-skill-creator**, never directly between instances.
3. **Each instance has its own mayor, witness, and polecat pool.** No shared agents.
4. **Schema is shared.** All instances validate against the same JSON schema.
5. **Compromise of one instance does not affect others.** Blast radius is contained to the instance directory.

## Per-Instance Configuration

Each instance can customize the base chipset:

```yaml
# .chipset/instances/project-alpha/config.yaml
# Inherits from data/chipset/gastown-orchestration/gastown-orchestration.yaml
# with overrides:
dispatch:
  max_parallel: 3          # Smaller project, fewer agents
agents:
  - role: polecat
    count: 3               # Override default pool size
```

## Creating an Instance

```typescript
import { gastown } from './src/chipset/index.js';

const instance = new gastown.StateManager({
  stateDir: '.chipset/instances/project-alpha/state'
});

// Validate instance config
const yaml = fs.readFileSync('.chipset/instances/project-alpha/config.yaml', 'utf-8');
const result = gastown.validateChipset(yaml, 'data/chipset/schema/gastown-chipset-schema.json');
```

## GSD Coordination Across Instances

GSD milestones can span multiple instances. The pattern:

1. **GSD milestone** defines the overall goal (e.g., "Ship v2.0 across 3 services")
2. **GSD phases** break into per-instance work (Phase 1: service-alpha, Phase 2: service-beta)
3. **Each phase activates its instance's chipset** for agent orchestration
4. **GSD verification** checks cross-instance integration at phase boundaries

gsd-skill-creator sees the whole board. Each Gastown instance sees only its own rig.
