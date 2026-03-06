# Gastown Orchestration Chipset -- User Guide

Step-by-step guide for loading, operating, customizing, and troubleshooting the Gastown orchestration chipset within the GSD ecosystem.

## Prerequisites

- Node.js 18+ with TypeScript
- GSD skill-creator installed (`npm install`)
- The `gastown-orchestration.yaml` chipset definition (ships with this package)

## Loading the Chipset

### Step 1: Import the Module

```typescript
import { gastown } from './chipset/index.js';
```

This barrel export provides:
- All type definitions (`AgentRole`, `WorkItem`, `ChipsetConfig`, etc.)
- `StateManager` class for runtime state persistence
- `validateChipset()` function for YAML validation

### Step 2: Validate the Chipset Definition

Before using the chipset, validate that the YAML definition is well-formed:

```typescript
import * as fs from 'node:fs';

const yamlContent = fs.readFileSync(
  'data/chipset/gastown-orchestration/gastown-orchestration.yaml',
  'utf8'
);

const result = gastown.validateChipset(yamlContent, 'path/to/chipset-schema.json');

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

// Check warnings even if valid
for (const warning of result.warnings) {
  console.warn(`WARN: ${warning}`);
}

// Inspect per-section results
for (const section of result.sections) {
  console.log(`${section.name}: ${section.valid ? 'PASS' : 'FAIL'}`);
}
```

The validator checks four stages:
1. **Schema** -- YAML parses correctly and matches the JSON schema
2. **Token budget** -- Skill weights sum to 1.0 or less
3. **Agent topology** -- Exactly 1 mayor, at least 1 witness, at least 1 polecat; all skill references resolve
4. **Communication** -- All channels have valid types and non-empty paths

### Step 3: Initialize the State Manager

```typescript
const state = new gastown.StateManager({ stateDir: '.chipset/state' });
```

The state directory is created automatically on first write. State files are individual JSON documents using atomic writes (temp file, fsync, rename) for crash safety.

## Operating the Chipset

### Creating Agents

Build the topology by creating agents for each role:

```typescript
// Create the core topology
const mayor = await state.createAgent('mayor', 'my-project');
const witness = await state.createAgent('witness', 'my-project');
const refinery = await state.createAgent('refinery', 'my-project');

// Create a pool of workers
const polecats = [];
for (let i = 0; i < 5; i++) {
  polecats.push(await state.createAgent('polecat', 'my-project'));
}
```

Each agent gets a unique ID (e.g., `polecat-a1b2c3d4e5`), a hook pointer, and starts in `idle` status.

### Dispatching Work

Work flows through the pipeline: create item, hook to agent, agent executes, mark done.

```typescript
// 1. Create work items
const item1 = await state.createWorkItem(
  'Add user authentication',
  'Implement JWT-based auth with refresh token rotation',
  'P1'  // Priority: P1 (highest), P2 (normal), P3 (lowest)
);

const item2 = await state.createWorkItem(
  'Write auth tests',
  'Unit tests for login, logout, token refresh, and expiry',
  'P2'
);

// 2. Hook work to available polecats (GUPP: they must act immediately)
await state.setHook(polecats[0].id, item1.beadId);
await state.setHook(polecats[1].id, item2.beadId);

// 3. Update statuses as work progresses
await state.updateWorkStatus(item1.beadId, 'in_progress');
await state.updateAgentStatus(polecats[0].id, 'active');
```

### Tracking Convoys

Group related work items for batch progress tracking:

```typescript
const convoy = await state.createConvoy('auth-feature', [item1.beadId, item2.beadId]);

// After some work completes
await state.updateWorkStatus(item1.beadId, 'done');

// Recalculate: progress = (done + merged) / total
await state.updateConvoyProgress(convoy.id);
const updated = await state.getConvoy(convoy.id);
console.log(`Progress: ${(updated.progress * 100).toFixed(0)}%`);  // "50%"
```

### Completing Work

When a polecat finishes its assigned work:

```typescript
// Mark work as done
await state.updateWorkStatus(item1.beadId, 'done');

// Clear the polecat's hook so it can receive new work
await state.clearHook(polecats[0].id);

// Return polecat to idle
await state.updateAgentStatus(polecats[0].id, 'idle');
```

### Querying State

```typescript
// List all agents in a rig
const agents = await state.listAgents({ rig: 'my-project' });

// List only active polecats
const activeWorkers = await state.listAgents({ role: 'polecat' });

// Get a specific work item
const item = await state.getWorkItem('bead-a1b2c3d4e5');

// Check an agent's hook
const hook = await state.getHook(polecats[0].id);
if (hook && hook.status === 'active') {
  console.log(`Working on: ${hook.workItem?.title}`);
}
```

## Customization

### Adjusting the Polecat Pool Size

Edit `gastown-orchestration.yaml`:

```yaml
agents:
  agents:
    - name: polecat-pool
      role: polecat
      count: 10  # Was 5, increase for more parallelism
      skills:
        - gupp-propulsion
        - beads-persistence
```

Higher counts increase throughput but also increase coordination overhead and token cost.

### Adding a New Skill to the Manifest

Add to the `skills.recommended` section:

```yaml
skills:
  recommended:
    - name: convoy-batch
      domain: workflow
      description: "Batch work coordination"
      token_budget_weight: 0.09
    - name: my-custom-skill
      domain: workflow
      description: "Custom workflow for my project"
      token_budget_weight: 0.05
```

Then reference the skill from an agent:

```yaml
agents:
  agents:
    - name: mayor
      role: mayor
      skills:
        - agent-topology
        - sling-dispatch
        - convoy-batch
        - my-custom-skill  # New skill reference
```

Ensure total token budget weight stays at or below 1.0 after adding the skill.

### Modifying the Agent Topology

The chipset requires at minimum: 1 mayor, 1 witness, 1 polecat. Beyond that, you can add agents:

```yaml
agents:
  topology: mayor-witness-polecat
  agents:
    - name: mayor
      role: mayor
      skills: [agent-topology, sling-dispatch, convoy-batch]

    - name: witness
      role: witness
      skills: [agent-topology, gupp-propulsion]

    - name: refinery
      role: refinery
      skills: [beads-persistence, sling-dispatch]

    - name: polecat-pool
      role: polecat
      count: 5
      skills: [gupp-propulsion, beads-persistence]

    # Add a second witness for high-availability monitoring
    - name: witness-backup
      role: witness
      skills: [agent-topology]

    # Add crew agents for persistent workspaces
    - name: devops-crew
      role: crew
      skills: [beads-persistence]
```

### Tuning Dispatch Parameters

```yaml
dispatch:
  strategy: sling        # Dispatch strategy name
  max_parallel: 20       # Allow more concurrent work items
  batch_threshold: 5     # Require 5 queued items before auto-batching
  formula_support: true  # Enable formula-driven (microcode) dispatch
```

### Configuring Evaluation Gates

Add or modify pre-deploy checks:

```yaml
evaluation:
  gates:
    pre_deploy:
      - check: agent_identity
        threshold: 100
        action: block     # Cannot proceed without valid agents

      - check: gupp_response_time
        threshold: 15     # Tighten from 30s to 15s
        action: block     # Upgrade from warn to block

      - check: hook_durability
        threshold: 100
        action: block

      # Add a custom gate
      - check: convoy_completion
        threshold: 80     # 80% of convoy items must be done
        action: warn
```

### Runtime HAL Configuration

The chipset supports multiple AI runtimes. Configure capabilities per provider:

```yaml
runtime:
  providers:
    - name: claude_code
      capabilities:
        - subagent_spawn
        - filesystem_access
        - git_operations
        - hook_injection
        - tool_use

    - name: codex
      capabilities:
        - subagent_spawn
        - filesystem_access
        - git_operations
        - sandbox_execution
```

Each capability determines what operations the chipset can use on that runtime. Capabilities missing from a provider cause graceful fallback, not failure.

## Troubleshooting

### Stalled Agents

**Symptom:** An agent's status stays `active` but produces no output.

**Diagnosis:**
```typescript
const hook = await state.getHook(agentId);
const lastActivity = new Date(hook.lastActivity);
const stalledMs = Date.now() - lastActivity.getTime();

if (stalledMs > 30000) {
  console.log(`Agent ${agentId} stalled for ${(stalledMs / 1000).toFixed(0)}s`);
}
```

**Resolution:**
1. Check the agent's hook state -- is work actually assigned?
2. Clear the hook and reassign: `await state.clearHook(agentId)`
3. Update agent status to `idle` and dispatch new work
4. If persistent, terminate and recreate the agent

### Failed Merges

**Symptom:** Merge request stuck in `pending` or `conflicted` status.

**Diagnosis:** Check the merge queue state files in `state/merge-queue/`.

**Resolution:**
1. For `conflicted` merges: resolve conflicts manually in the source branch, then retry
2. For stuck `pending` merges: verify the refinery agent is active
3. Clear the merge queue by removing the stuck request file and re-dispatching

### GUPP Not Firing

**Symptom:** Polecat receives a hook but does not begin work.

**Diagnosis:**
```typescript
const hook = await state.getHook(polecatId);
console.log('Hook status:', hook?.status);     // Should be 'active'
console.log('Work item:', hook?.workItem?.title);
```

**Resolution:**
1. Verify the hook was set correctly (status should be `active`, not `pending`)
2. Check that the polecat agent status is not `terminated`
3. Ensure the work item status transitioned from `open` to `hooked`
4. If the agent runtime lacks `hook_injection` capability (see HAL config), nudge via mail channel instead

### Validation Failures

**Symptom:** `validateChipset()` returns errors.

**Common causes and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `YAML parse error` | Malformed YAML syntax | Check indentation, quoting, colons |
| `Schema violation at /skills` | Missing required fields | Ensure every skill has name, domain, description, token_budget_weight |
| `Total token budget weight exceeds 1.0` | Too many skills or weights too high | Reduce weights or move skills to recommended |
| `Agent topology requires exactly 1 mayor` | Missing or duplicate mayor | Ensure exactly one agent with `role: mayor` |
| `Agent references skill not in manifest` | Skill name mismatch | Check spelling of skill names in agent entries |

### Convoy Progress Not Updating

**Symptom:** `convoy.progress` stays at 0 despite completed work.

**Resolution:**
1. Ensure `updateWorkStatus(beadId, 'done')` was called on the work items
2. Call `updateConvoyProgress(convoyId)` -- progress is not auto-calculated
3. Verify the bead IDs in the convoy match the actual work item IDs

## Advanced Usage

### Formula Templates

Formulas define repeatable multi-step workflows (microcode). When `formula_support: true` in the dispatch config, the sling dispatcher can execute TOML-based workflow templates:

```toml
description = "Standard release process"
formula = "release"
version = 1

[vars.version]
description = "The semantic version to release"
required = true

[[steps]]
id = "bump-version"
title = "Bump version"
description = "Update version to {{version}}"

[[steps]]
id = "run-tests"
title = "Run full test suite"
needs = ["bump-version"]
```

Formula dispatch is batch sling with dependency ordering -- steps execute in parallel where the dependency graph allows.

### Convoy Management

Convoys group related work for coordinated tracking:

```typescript
// Create convoy with initial beads
const convoy = await state.createConvoy('release-v2', [bead1, bead2, bead3]);

// Monitor aggregate progress
await state.updateConvoyProgress(convoy.id);
const c = await state.getConvoy(convoy.id);

if (c.progress >= 1.0) {
  console.log('Convoy complete -- all beads done or merged');
}
```

Convoys are read-only after creation (bead list is fixed). Create a new convoy if scope changes.

### Custom State Directory

Point the StateManager at any directory:

```typescript
// Per-project state isolation
const state = new gastown.StateManager({
  stateDir: '/path/to/project/.chipset/state'
});
```

State directories are created on first write. Multiple StateManager instances can target different directories for multi-rig isolation.

### Programmatic Validation Inspection

The validator returns per-section results for granular analysis:

```typescript
const result = gastown.validateChipset(yaml, schemaPath);

for (const section of result.sections) {
  if (!section.valid) {
    console.error(`[${section.name}] FAILED:`);
    section.errors.forEach(e => console.error(`  - ${e}`));
  }
  if (section.warnings.length > 0) {
    console.warn(`[${section.name}] WARNINGS:`);
    section.warnings.forEach(w => console.warn(`  - ${w}`));
  }
}
```

Sections: `schema`, `token_budget`, `agent_topology`, `communication`.
