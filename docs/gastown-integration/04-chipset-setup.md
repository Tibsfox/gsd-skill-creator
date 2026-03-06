# 04 — Chipset Setup

## Prerequisites

- gsd-skill-creator installed and working
- Node.js 18+ (for TypeScript tooling)
- Git 2.25+ (for worktree operations)
- A project you want to orchestrate with multiple agents

**You do NOT need Gastown (the Go binary) installed.** The chipset is a self-contained pattern implementation. However, if you do have Gastown installed, see [08-upstream-intelligence.md](08-upstream-intelligence.md) for synchronization.

## Step 1: Validate the Chipset

Before using the chipset, validate it against the schema:

```typescript
import { gastown } from './src/chipset/index.js';
import fs from 'fs';

const yamlContent = fs.readFileSync(
  'data/chipset/gastown-orchestration/gastown-orchestration.yaml',
  'utf-8'
);
const schemaPath = 'data/chipset/schema/gastown-chipset-schema.json';

const result = gastown.validateChipset(yamlContent, schemaPath);

if (!result.valid) {
  console.error('Chipset validation failed:');
  result.errors.forEach(e => console.error(`  ERROR: ${e}`));
  result.warnings.forEach(w => console.warn(`  WARN: ${w}`));
  process.exit(1);
}

console.log('Chipset valid. Warnings:', result.warnings.length);
```

### What Validation Checks

The validator runs a 4-stage pipeline:

1. **Schema validation** — YAML structure matches JSON Schema (draft-07)
2. **Token budget** — Sum of skill weights ≤ 1.0 (current: 0.97, 3% buffer)
3. **Agent topology** — Exactly 1 mayor, ≥1 polecat, ≥1 witness per the pattern
4. **Communication channels** — All channels use approved types, paths are non-empty

## Step 2: Initialize State Directory

The StateManager creates the directory structure on first use:

```typescript
const state = new gastown.StateManager({
  stateDir: '.chipset/state'
});

// Creates:
// .chipset/state/
//   agents/       Agent identity files
//   hooks/        GUPP hook state per agent
//   work/         Work item beads
//   convoys/      Batch tracking
//   merge-queue/  Refinery merge requests
//   mail/         Durable async messages
//   nudge/        Ephemeral sync signals
//   dispatch/     Dispatch pipeline records
```

Add `.chipset/state/` to your `.gitignore` — state is local, never committed:

```
# Gastown chipset state (local only)
.chipset/state/
```

## Step 3: Create Agent Topology

Set up the minimum viable agent team:

```typescript
// Create the mayor (exactly one, always)
const mayor = await state.createAgent('mayor', 'main-rig');
// mayor.id = "mayor-a1b2c3" (auto-generated)

// Create a witness (at least one)
const witness = await state.createAgent('witness', 'main-rig');

// Create a refinery (one per target branch)
const refinery = await state.createAgent('refinery', 'main-rig');

// Create polecat pool (1-30 workers)
const polecat1 = await state.createAgent('polecat', 'main-rig');
const polecat2 = await state.createAgent('polecat', 'main-rig');
const polecat3 = await state.createAgent('polecat', 'main-rig');
```

### Topology Constraints

| Role | Min | Max | Notes |
|------|-----|-----|-------|
| Mayor | 1 | 1 | Singleton coordinator. More than 1 = split-brain. |
| Witness | 1 | 5 | One per rig is typical. More for large deployments. |
| Refinery | 1 | 3 | One per target branch. FIFO per queue. |
| Polecat | 1 | 30 | Scale based on work volume. Each consumes a Claude session. |
| Crew | 0 | 10 | Optional. Human-managed workspaces. |

## Step 4: Verify Skill Availability

The 12 Gastown skills must be present in `.claude/skills/`:

```bash
# Check all required skills exist
for skill in mayor-coordinator polecat-worker witness-observer refinery-merge \
             mail-async nudge-sync hook-persistence sling-dispatch \
             done-retirement runtime-hal gupp-propulsion beads-state; do
  if [ -f ".claude/skills/$skill/SKILL.md" ]; then
    echo "OK: $skill"
  else
    echo "MISSING: $skill"
  fi
done
```

Skills are automatically loaded by Claude Code based on context. You do not need to invoke them explicitly — they activate when their patterns are needed.

## Step 5: Configure Dispatch Parameters

The chipset YAML defines dispatch behavior. Key parameters:

```yaml
dispatch:
  strategy: sling
  max_parallel: 10        # Max concurrent polecats
  batch_threshold: 3      # 4+ beads auto-group into convoy
  formula_support: true   # Enable TOML workflow templates
```

Adjust `max_parallel` based on your API limits and project size:

| Scenario | `max_parallel` | Reasoning |
|----------|---------------|-----------|
| Solo developer | 3 | Light load, fast feedback |
| Small team | 5 | Balanced parallelism |
| Large milestone | 10 | Maximum throughput |
| Testing/debug | 1 | Sequential for observability |

## Step 6: Run a Smoke Test

Create a work item and dispatch it to verify the full pipeline:

```typescript
// 1. Create a work item
const workItem = await state.createWorkItem(
  'Smoke test',
  'Verify chipset pipeline works end-to-end',
  'normal'
);

// 2. Find an idle polecat
const agents = await state.listAgents({ role: 'polecat' });
const idle = agents.find(a => a.status === 'idle');

// 3. Dispatch (hook the work)
await state.setHook(idle.id, workItem.beadId);
await state.updateWorkStatus(workItem.beadId, 'hooked');

// 4. Verify hook was set
const hook = await state.getHook(idle.id);
console.log('Hook status:', hook.status); // 'pending'
console.log('Work item:', hook.workItem.beadId);

// 5. Simulate polecat activation
await state.updateAgentStatus(idle.id, 'active');
// In real operation, the polecat skill handles this

// 6. Clean up
await state.clearHook(idle.id);
await state.updateWorkStatus(workItem.beadId, 'open');
await state.updateAgentStatus(idle.id, 'idle');
```

If this runs without errors, the chipset is operational.

## Step 7: Connect to GSD Workflow

See [10-gsd-milestone-workflow.md](10-gsd-milestone-workflow.md) for how to use GSD milestones and phases with Gastown orchestration. The key integration point:

1. **GSD plans** define *what* to build (acceptance criteria, file targets)
2. **Gastown chipset** defines *how* to coordinate the agents building it
3. **Mayor** reads GSD plans and creates beads/convoys from them
4. **Polecats** execute individual plans as atomic work items
5. **Refinery** merges completed work back to the target branch
6. **GSD verification** confirms the phase goal was achieved

## Troubleshooting

### Validation fails with "no construct signatures"

This was a known Ajv CJS/ESM interop issue, fixed in v1.49.19. Update to the latest version.

### State directory permission errors

Ensure `.chipset/state/` is writable by your user. The StateManager uses atomic writes (temp file → fsync → rename) which requires write permission to the parent directory.

### Skills not activating

Claude Code loads skills based on context. If a Gastown skill isn't activating, ensure:
- The SKILL.md file exists in `.claude/skills/{skill-name}/`
- The skill's trigger conditions match the current context
- You're working in the gsd-skill-creator project directory

### Hook state stuck

If a hook gets stuck in `active` state (agent crashed):
```typescript
// Manual recovery
await state.clearHook(agentId);
await state.updateAgentStatus(agentId, 'idle');
await state.updateWorkStatus(beadId, 'open');
```

In production, the witness detects this automatically and escalates to the mayor.
