# Crew-Aware Targeting Design

**Version:** 1.0.0
**Date:** 2026-03-27
**Status:** Design
**Wanted:** w-0a0e3a9dc9
**Depends on:** Gas City Role Format (w-gc-001), Formula Engine (w-gc-003), Role Parser (w-gc-002)

---

## Problem

Gas City can target explicit agents (`gc assign --to cedar`) and pools (`gc sling --pool precision`), but crew-based dispatch requires users to know backing agent identities. The targeting surface should let users express intent — "send this to the creative team" or "assign to whoever handles security" — and let the formula engine resolve it.

This design specifies the user-facing targeting surface, precedence rules, ambiguity handling, and integration with the existing Gas City agent identity model.

---

## 1. Targeting Modes

Three modes, in order of specificity:

### 1.1 Explicit Target (existing)

Direct agent name. No resolution needed.

```
gc assign --to cedar "Record this decision"
gc sling --agent hemlock
```

**Semantics:** Bypass scoring. Deliver directly. Fail if agent not found.

### 1.2 Crew Target (new)

Named crew — a pre-composed team with topology and members.

```
gc assign --crew precision "Review these types"
gc assign --crew creative "Design the landing page"
```

**Semantics:** Resolve crew name → crew definition → select best member(s) using formula engine scoring. The crew constrains the candidate pool; the engine picks within it.

### 1.3 Intent Target (new)

Natural language description. No agent or crew named.

```
gc assign "Review this code for security issues"
gc sling "Build the dashboard component"
```

**Semantics:** Run the full formula engine activation pipeline against all registered roles. Form a team from top candidates using composability resolution. This is the most flexible and least predictable mode.

---

## 2. Resolution Pipeline

```
Input: targeting expression + task description
  │
  ├─ explicit?  ──► lookup agent by name ──► deliver or fail
  │
  ├─ crew?      ──► lookup crew definition
  │                  │
  │                  ▼
  │              score crew members against task
  │                  │
  │                  ▼
  │              select by topology:
  │                leader-worker → leader receives, delegates
  │                pipeline → first stage receives
  │                router → router classifies, directs
  │                swarm → highest scorer receives
  │                  │
  │                  ▼
  │              deliver to selected member(s)
  │
  └─ intent?    ──► score all roles via formula engine
                     │
                     ▼
                 compose team from candidates
                     │
                     ▼
                 deliver to team primary
```

---

## 3. Crew Definition Format

Crews are defined as YAML files in `.claude/crews/` following the team topology pattern:

```yaml
# .claude/crews/precision.yaml
name: precision
description: Code quality, testing, and verification
topology: leader-worker
lead: hemlock
members:
  - hemlock    # quality gates, standards
  - lex        # execution discipline, spec compliance
  - cedar      # recording, integrity verification
threshold: 0.2  # lower threshold for intra-crew scoring
max_delegation: 2  # leader delegates to at most 2 workers
```

```yaml
# .claude/crews/creative.yaml
name: creative
description: Design, exploration, and creative direction
topology: swarm
members:
  - foxy       # creative direction
  - sam        # exploration, prototyping
  - willow     # user interface, progressive disclosure
threshold: 0.25
```

```yaml
# .claude/crews/full-council.yaml
name: full-council
description: All muses for high-stakes decisions
topology: leader-worker
lead: cedar
members:
  - cedar
  - hemlock
  - lex
  - foxy
  - sam
  - willow
threshold: 0.15
max_delegation: 5
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Crew identifier. Lowercase, hyphens. Pattern: `/^[a-z0-9-]+$/` |
| `description` | string | Human-readable purpose |
| `topology` | string | One of: `leader-worker`, `pipeline`, `swarm`, `router` |
| `members` | string[] | Agent names (must exist in role registry) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `lead` | string | first member | Leader agent (for leader-worker/router) |
| `threshold` | number | 0.3 | Activation score threshold within crew |
| `max_delegation` | number | members.length - 1 | Max workers activated per task |

---

## 4. Precedence Rules

When multiple targeting modes could apply, precedence is deterministic:

1. **Explicit agent** (`--to`, `--agent`) — highest priority. Overrides everything.
2. **Explicit crew** (`--crew`) — constrains to crew members only.
3. **Intent** (no flag, just task text) — full formula engine resolution.

**Conflict resolution:**

```
gc assign --to cedar --crew precision "task"
```

→ **Error.** Cannot specify both `--to` and `--crew`. Explicit and crew are mutually exclusive.

```
gc assign --crew precision "task"
```

→ Score only precision crew members. If none score above threshold, return an error rather than silently widening the search.

---

## 5. Ambiguity Rules

### 5.1 No Match

When no agent scores above threshold:

- **Crew mode:** Error: `No member of crew 'precision' scored above threshold (0.2) for this task. Specify --to <agent> to target directly.`
- **Intent mode:** Error: `No agent scored above threshold (0.3). Rephrase the task or use --to <agent>.`

Never silently assign to a random agent. The user must know when targeting fails.

### 5.2 Tie Breaking

When multiple agents score identically:

1. **Composability with primary:** Prefer agents mutually composable with the current highest scorer.
2. **Crew order:** If within a crew, prefer members listed earlier in the YAML definition (author intent).
3. **Alphabetical:** Final tiebreaker to ensure determinism.

### 5.3 Crew Member Not Found

If a crew definition references an agent that doesn't exist in the role registry:

- **Warning** at crew load time: `Crew 'precision' references unknown agent 'phantom'. Skipping.`
- The crew operates with remaining valid members.
- If no valid members remain, crew load fails with error.

### 5.4 Empty Task Text

```
gc assign --crew precision
```

→ Error: `Task description required. What should the crew work on?`

Intent-based scoring requires text to score against. Never assign work without a task.

---

## 6. Dispatch Semantics by Topology

### leader-worker
- Lead receives the task.
- Lead decides delegation (may use formula scoring internally).
- Workers execute delegated subtasks.
- Lead consolidates results.

### pipeline
- First member in the `members` array receives the task.
- Output flows to next member in sequence.
- Each stage transforms and passes forward.

### swarm
- All members scored against task.
- Highest scorer becomes primary.
- Other qualifying members become supporting.
- All work in parallel on the same task.

### router
- Lead receives the task.
- Lead classifies and routes to the best-scoring specialist member.
- Specialist executes.
- Lead receives result and may re-route if needed.

---

## 7. CLI Surface

### gc assign (extended)

```
gc assign [--to <agent>] [--crew <crew>] <task-description>

Options:
  --to <agent>     Explicit agent target (bypass scoring)
  --crew <crew>    Crew target (constrain to crew members)
  --dry-run        Show targeting resolution without dispatching
  --verbose        Show scoring breakdown for all candidates
```

### gc crew (new)

```
gc crew list                    List defined crews
gc crew show <name>             Show crew definition and member scores
gc crew create <name>           Interactive crew creation
gc crew validate                Validate all crew definitions
```

### gc sling (extended)

```
gc sling [--crew <crew>] [--agent <agent>] <task-description>

# Crew-aware sling dispatches through the crew's topology
# rather than the default sling pipeline
```

### Dry Run Example

```
$ gc assign --crew precision --dry-run "Review type safety in the parser module"

Targeting: crew 'precision' (leader-worker, lead: hemlock)
Threshold: 0.2

  hemlock    0.72  ★ lead + highest score
    pattern: 0.8  vocab: 0.6  plane: 0.9  invoke: 0.0
  lex        0.58  → delegated
    pattern: 0.5  vocab: 0.4  plane: 0.8  invoke: 0.0
  cedar      0.31  → delegated
    pattern: 0.2  vocab: 0.3  plane: 0.5  invoke: 0.0

Dispatch: hemlock receives, may delegate to lex, cedar
```

---

## 8. Integration Points

### Formula Engine

The crew targeting layer sits **above** the formula engine, not beside it. It constrains the candidate pool, then calls the same `activate()` and `compose()` primitives.

```typescript
interface CrewTargeting {
  resolve(target: TargetExpression, task: string): DispatchPlan;
}

interface TargetExpression {
  mode: 'explicit' | 'crew' | 'intent';
  agentName?: string;   // explicit mode
  crewName?: string;    // crew mode
  taskText: string;     // always present
}

interface DispatchPlan {
  primary: string;           // agent receiving the task
  supporting: string[];      // additional agents (if team)
  topology: TeamTopology;    // how they coordinate
  scores: Map<string, number>;  // scoring breakdown
  reason: string;            // human-readable explanation
}
```

### Role Registry

Crew validation cross-references the role registry. A crew member must exist as a parsed role. This creates a dependency:

```
discover roles → load crews → validate crew members against registry
```

### Existing Team Types

The `TeamConfig` type from `src/types/team.ts` already supports `leadAgentId`, `members[]`, and topologies. Crew definitions are a lightweight subset — they reference roles by name rather than embedding full `TeamMember` objects. At runtime, crew members are resolved to `TeamMember` instances from the role registry.

---

## 9. What's NOT in v1

These are explicitly deferred:

- **Dynamic crew formation.** v1 crews are static YAML. The formula engine's `compose()` can form ad-hoc teams, but named crews are author-defined.
- **Cross-crew dispatch.** A task goes to one crew. Multi-crew orchestration is future work.
- **Crew-scoped memory.** Each agent retains its own context. Crew-level shared memory is a separate design.
- **Create-and-route.** Creating a wanted item and auto-routing it to the best crew is deferred — v1 requires explicit `gc assign`.
- **Crew permissions.** All crew members inherit the crew lead's permission mode. Per-member overrides are future.

---

## 10. Design Rationale

**Why crews over ad-hoc teams?** Ad-hoc composition (formula engine `compose()`) is powerful but unpredictable. Crews give authors explicit control over who works together, while still using the formula engine for member selection within the crew. The two layers complement each other: crews for known workflows, ad-hoc for novel tasks.

**Why YAML files, not database entries?** Crews are configuration, not runtime state. They version with the repo, diff in PRs, and work offline. Same reasoning as role files.

**Why fail-closed on no match?** Silent fallback to random agents violates the trust model. If the engine can't confidently assign work, the human should know. Wasteland's trust system is built on explicit consent — targeting should follow the same principle.

**Why topology in the crew definition?** Different crews work differently. A review crew needs a leader to coordinate. An exploration crew works as a swarm. Embedding topology in the crew definition lets the dispatch system adapt without per-task configuration.
