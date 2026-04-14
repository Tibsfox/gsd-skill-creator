# GSD Phase Behavior Reference

Phase transition protocol, instruction markers, response patterns, and workflow patterns for GSD lifecycle management.

## Instruction Markers

GSD commands output structured results with next step instructions. Claude must recognize and act on these.

| Marker | Meaning | Claude Action |
|--------|---------|---------------|
| `## > Next Up` | Next command to run | Read the instruction and execute it |
| `/clear first ->` | Context window full, needs reset | Tell user to run `/clear`, then continue |
| `Ready to build` | Planning complete, execution ready | Proceed to `/gsd:plan-phase` or `/gsd:execute-phase` |
| `ROADMAP CREATED` | Roadmap agent finished | Review output, proceed to next phase |
| `PLAN CREATED` | Planning agent finished | Proceed to execution |

## Phase Transition Hooks

After completing any GSD phase transition, check for skills that should trigger:

| GSD Event | Check For |
|-----------|-----------|
| `plan-phase` completes | Skills triggered by planning completion, docs regeneration |
| `execute-phase` completes | Skills triggered by execution progress, state updates |
| `verify-work` completes | Skills triggered by verification results, test patterns |
| `complete-milestone` completes | Skills triggered by milestone completion, docs finalization |
| Any `.planning/` file write | Dashboard regeneration if gsd-planning-docs skill is installed |

Run matching skills **after** the phase completes, not during -- avoid adding overhead to the critical path.

## Response Patterns

### Before Substantial Work

```
Let me check the current project state...
[Read ROADMAP.md, STATE.md]

This falls under Phase X. There's already a plan at `.planning/phases/...`.
Should I execute that plan, or are you looking to do something different?
```

### When No GSD Structure Exists

```
This project doesn't have GSD initialized yet. Want me to run
`/gsd:new-project` to set up the planning structure? It takes about
5 minutes and will make everything after that smoother.
```

### When Work Conflicts with Plans

```
Heads up -- this would modify files that Phase 3 is planning to create.
Options:
1. Execute Phase 3 first (recommended)
2. Update the Phase 3 plan to account for this
3. Proceed anyway and reconcile later

What would you like to do?
```

## Workflow Patterns

**Standard Cycle:**
```
/gsd:plan-phase N -> /clear -> /gsd:execute-phase N -> /gsd:verify-work N
```

**Fresh Session Recovery:**
```
/gsd:progress  (or)  /gsd:resume-work
```

**Mid-Work Context Reset:**
```
/gsd:pause-work -> /clear -> /gsd:resume-work
```

**Debugging Flow:**
```
/gsd:debug "description" -> investigate -> /clear -> /gsd:debug (resume)
```

## Context Window Management

Suggest `/clear` in these situations:

- **After phase completion:** Context is stale; new phase needs fresh window
- **When context is filling:** Large outputs or many file reads accumulate
- **Between plan/execute transitions:** Planning context pollutes execution focus
- **After debugging sessions:** Debug traces fill context with noise
- **Before milestone completion:** Clean state for final verification
