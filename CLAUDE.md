# Claude Code + GSD Integration Guide

This project uses **GSD (Get Shit Done)** for all project management. Claude should guide users toward GSD workflows while respecting their autonomy.

## Core Principle

GSD provides structure. Claude provides intelligence. Together they prevent:
- Context rot (quality degradation as context fills)
- Scope creep (work expanding without tracking)
- Lost work (changes without commits)
- Forgotten decisions (context lost between sessions)

## Decision Framework

When a user request comes in, route through this logic:

### Starting Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "Build something new from scratch" | `/gsd:new-project` | Full initialization: questioning → research → requirements → roadmap |
| "Add major features to existing project" | `/gsd:new-milestone` | New milestone within existing project structure |
| "Continue where I left off" | `/gsd:progress` | See current state and route to next action |
| "What should I work on?" | `/gsd:progress` | Shows position in roadmap, suggests next step |

### Planning Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "I want to discuss how phase X should work" | `/gsd:discuss-phase N` | Capture vision before planning |
| "Plan the next phase" | `/gsd:plan-phase N` | Creates detailed, executable plans |
| "I need to research this domain" | `/gsd:research-phase N` | Deep ecosystem investigation |
| "What will Claude do for this phase?" | `/gsd:list-phase-assumptions N` | Preview approach before committing |

### Executing Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "Build phase X" | `/gsd:execute-phase N` | Runs plans with fresh context, atomic commits |
| "Quick fix / small task" | `/gsd:quick` | Lightweight path for ad-hoc work |
| "Something's broken" | `/gsd:debug` | Systematic debugging with persistent state |

### Validating Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "Did phase X actually work?" | `/gsd:verify-work N` | User acceptance testing |
| "Is the milestone complete?" | `/gsd:audit-milestone` | Comprehensive completion check |

### Managing Scope

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "I need to add a phase" | `/gsd:add-phase` | Append to roadmap |
| "Urgent work mid-milestone" | `/gsd:insert-phase` | Insert without renumbering |
| "Remove a planned phase" | `/gsd:remove-phase` | Clean removal with renumbering |
| "Capture this idea for later" | `/gsd:add-todo` | Park ideas without derailing current work |

## Guidance Behavior

### When to Suggest GSD

**Always suggest GSD when:**
- User asks to build, create, or implement something substantial
- User seems unsure where to start
- Work would benefit from planning before coding
- Context is fresh (session just started)

**Suggest with explanation:**
```
This looks like a good candidate for `/gsd:plan-phase N` — it'll break this
down into atomic tasks with verification criteria. Want me to run that,
or would you prefer to dive in directly?
```

### When to Allow Override

**Respect user override when:**
- They explicitly say "just do it" or "skip the ceremony"
- The task is genuinely trivial (< 5 minutes)
- They're exploring/experimenting, not building
- They have domain expertise and know what they want

**Acknowledge gracefully:**
```
Got it — working on this directly. If it grows in scope, we can always
capture it in a plan retroactively with `/gsd:quick`.
```

### When to Insist

**Gently push back when:**
- User is about to make changes without understanding current state
- Work would conflict with existing plans
- The request is ambiguous and needs questioning

**Push back helpfully:**
```
Before I make changes, let me check `/gsd:progress` — there might be
existing plans that touch this area. One moment...
```

## Workflow Patterns

### The Standard Cycle
```
/gsd:plan-phase N → /clear → /gsd:execute-phase N → /gsd:verify-work N
```

### Fresh Session Recovery
```
/gsd:progress  (or)  /gsd:resume-work
```

### Mid-Work Context Reset
```
/gsd:pause-work → /clear → /gsd:resume-work
```

### Debugging Flow
```
/gsd:debug "description" → investigate → /clear → /gsd:debug (resume)
```

## Artifact Awareness

GSD maintains these artifacts in `.planning/`:

| File | Purpose | When to Read |
|------|---------|--------------|
| `PROJECT.md` | Vision, constraints, decisions | Understanding project context |
| `REQUIREMENTS.md` | What we're building (with REQ-IDs) | Scoping work |
| `ROADMAP.md` | Phase structure and status | Finding current position |
| `STATE.md` | Session memory, blockers, decisions | Resuming work |
| `config.json` | Workflow preferences | Checking mode (yolo/interactive) |
| `phases/XX-name/XX-YY-PLAN.md` | Detailed task plans | Executing work |
| `phases/XX-name/XX-YY-SUMMARY.md` | What was built | Reviewing completed work |

**Always check STATE.md** when resuming or when something seems off — it's the project's memory.

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
Heads up — this would modify files that Phase 3 is planning to create.
Options:
1. Execute Phase 3 first (recommended)
2. Update the Phase 3 plan to account for this
3. Proceed anyway and reconcile later

What would you like to do?
```

## Recognizing GSD Instructions

GSD commands output structured results with **next step instructions**. Claude must recognize and act on these.

### Instruction Markers

| Marker | Meaning | Claude Action |
|--------|---------|---------------|
| `## ▶ Next Up` | Next command to run | Read the instruction and execute it |
| `/clear first →` | Context window full, needs reset | Tell user to run `/clear`, then continue |
| `Ready to build ✓` | Planning complete, execution ready | Proceed to `/gsd:plan-phase` or `/gsd:execute-phase` |
| `ROADMAP CREATED` | Roadmap agent finished | Review output, proceed to next phase |
| `PLAN CREATED` | Planning agent finished | Proceed to execution |

### Autonomous Operation (YOLO Mode)

When `config.json` has `"mode": "yolo"`:

1. **Read GSD command output carefully** — it contains your next instruction
2. **Execute the suggested command** — don't wait for user confirmation
3. **Handle `/clear` requirements** — inform user when context reset is needed
4. **Continue the workflow** — GSD is a pipeline, keep it moving

**Example Recognition:**
```
## ▶ Next Up

**Phase 1: Foundation** — Storage infrastructure

/gsd:plan-phase 1 — create detailed execution plan

<sub>/clear first → fresh context window</sub>
```

**Claude should understand:**
- Next action is `/gsd:plan-phase 1`
- User should `/clear` first for fresh context
- Claude should either: (a) tell user to `/clear` and run the command, or (b) run the command if context is acceptable

### Running GSD Commands

To run a GSD command, read the command file from `.claude/commands/gsd/[command].md` and follow its process. The command file contains:
- `<objective>` — What the command achieves
- `<process>` — Step-by-step instructions to follow
- `<success_criteria>` — How to know it's complete

**Critical:** Don't just acknowledge GSD output — act on it.

## Commit Guidelines

**Always use the `beautiful-commits` skill** (which extends `git-commit`) when writing commit messages. This is mandatory for all commits in this project — both direct commits and those made by GSD executor agents.

Key rules:
- Follow Conventional Commits: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Imperative mood: "add" not "added" or "adds"
- Subject <72 chars (preferably <50), lowercase, no period
- Add body for complex changes (explain WHY/WHAT, not HOW)
- Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` on all commits

## Anti-Patterns to Avoid

- **Don't** stop after GSD output without reading "Next Up" instructions
- **Don't** wait for user input when YOLO mode is enabled and next step is clear
- **Don't** start coding without checking if a plan exists
- **Don't** make changes that span multiple phases in one session
- **Don't** skip commits — GSD's atomic commits enable rollback
- **Don't** ignore STATE.md warnings or blockers
- **Don't** create plans manually — use `/gsd:plan-phase`
- **Don't** be rigid — GSD serves the user, not the other way around
