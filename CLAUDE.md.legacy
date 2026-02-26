# Claude Code + GSD + skill-creator Integration Guide

This project uses **GSD (Get Shit Done)** for all project management and **gsd-skill-creator** as the adaptive learning layer. Claude should guide users toward GSD workflows, leverage learned skills, and capture patterns for continuous improvement.

## Core Principle

GSD provides structure. skill-creator provides learning. Claude provides intelligence. Together they prevent:
- Context rot (quality degradation as context fills)
- Scope creep (work expanding without tracking)
- Lost work (changes without commits)
- Forgotten decisions (context lost between sessions)
- Repeated mistakes (patterns not captured as reusable skills)
- Wasted effort (solved problems re-solved from scratch)

---

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

### skill-creator Actions

| User Intent | Action | Rationale |
|-------------|--------|-----------|
| "What patterns have you noticed?" | `skill-creator suggest` | Review pending skill suggestions |
| "Create a skill from what we just did" | `skill-creator create` | Capture current workflow as reusable skill |
| "Show me my skills" | `skill-creator status` | Token budget, active skills, pending suggestions |
| "How are my skills performing?" | `skill-creator test` | Run activation simulation against history |
| Natural language workflow request | GSD Orchestrator routing | Classify intent → map to GSD command |

---

## skill-creator Integration

### The GSD Orchestrator

skill-creator includes a GSD Orchestrator that provides natural language routing to GSD commands. When the user provides natural language requests related to project workflow — planning, execution, verification, milestones, project status — route through the orchestrator's 5-stage classification pipeline:

1. **Exact match** — direct command mapping (fastest)
2. **Lifecycle filtering** — narrow candidates by current project phase
3. **Bayesian classification** — probabilistic intent matching
4. **Semantic fallback** — embedding-based similarity for ambiguous requests
5. **Confidence resolution** — threshold check; ask user if uncertain

**When to use the orchestrator:** The user says something like "review the requirements," "what's the project status," "let's verify phase 3," or any natural language that maps to a GSD lifecycle action but doesn't use explicit slash commands.

**When to bypass it:** The user types an explicit GSD slash command. Execute directly.

**When confidence is low:** Ask the user to clarify rather than guessing. A wrong routing is worse than a clarifying question.

### Skill Loading Before GSD Phases

Before executing any GSD phase, load relevant generated skills:

1. Check `.claude/commands/` for project-level skills
2. Check `~/.claude/commands/` for user-level skills
3. Project-level skills take precedence over user-level on conflict
4. Load only skills relevant to the current phase and task
5. Respect the token budget: 2-5% of context window maximum

**Critical:** When forking subagent contexts for GSD phases (`execute-phase`, `verify-work`), include relevant skills in the subagent's context. Clean context means free of stale conversation history — not free of learned knowledge. A subagent that can't access learned skills is throwing away everything skill-creator has captured.

### Session Observation

During all work sessions, maintain awareness of patterns worth capturing:

- Tool sequences that repeat across sessions (e.g., `git log → read file → edit → test → commit`)
- File patterns consistently touched during specific GSD phases
- Commands run after test failures or verification issues
- Corrections the user makes to agent output — these are the highest-signal observations
- Phase outcomes: success, failure, partial, and what was different

If `.planning/patterns/` exists, record observations to `sessions.jsonl` in that directory. This data feeds skill-creator's pattern detection pipeline.

### Phase Transition Hooks

After completing any GSD phase transition, check for skills that should trigger:

| GSD Event | Check For |
|-----------|-----------|
| `plan-phase` completes | Skills triggered by planning completion, docs regeneration |
| `execute-phase` completes | Skills triggered by execution progress, state updates |
| `verify-work` completes | Skills triggered by verification results, test patterns |
| `complete-milestone` completes | Skills triggered by milestone completion, docs finalization |
| Any `.planning/` file write | Dashboard regeneration if gsd-planning-docs skill is installed |

Run matching skills **after** the phase completes, not during — avoid adding overhead to the critical path.

### Skill Suggestions

At the start of each new session, check skill-creator for pending suggestions. If suggestions exist with high confidence (3+ pattern occurrences), briefly notify the user:

> "skill-creator detected a repeating pattern: [brief description]. Run `skill-creator suggest` to review."

Never auto-apply suggestions. Always require explicit user confirmation. This is a core safety principle of the bounded learning system.

### Token Budget Management

The 6-stage skill loading pipeline (Score → Resolve → ModelFilter → CacheOrder → Budget → Load) manages what gets loaded. When multiple skills compete for budget:

1. Phase-relevant skills get priority (e.g., testing skills during `verify-work`)
2. Recently activated skills rank higher than dormant ones
3. Project-level skills override user-level duplicates
4. If budget is exceeded, queue overflow skills and note what was deferred

### Bounded Learning Guardrails

These constraints are non-negotiable:

- Maximum 20% content change per skill refinement
- Minimum 3 corrections before a refinement is proposed
- 7-day cooldown between refinements of the same skill
- All refinements require user confirmation
- Skill generation never skips permission checks
- Agent composition requires 5+ co-activations over 7+ days

---

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

### When to Suggest skill-creator

**Suggest skill-creator when:**
- You notice the same sequence of steps has occurred 3+ times
- The user corrects the same kind of output repeatedly
- A workflow is complex enough to benefit from codification
- The user asks "why do I keep having to tell you this?"

**Suggest naturally:**
```
I've noticed we run the same lint → test → fix cycle after every code change.
Want me to capture this as a skill so it happens automatically?
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

---

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

### skill-creator Review (periodic)
```
skill-creator status → skill-creator suggest → review/apply → skill-creator test
```

---

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

skill-creator maintains these artifacts:

| File | Purpose | When to Read |
|------|---------|--------------|
| `.planning/patterns/sessions.jsonl` | Session observations | Pattern detection input |
| `.claude/commands/*.md` | Generated project-level skills | Before GSD phase execution |
| `.claude/agents/*.md` | Composed agents from co-activation | Agent selection |
| `~/.claude/commands/*.md` | User-level skills | Fallback when no project skill matches |

**Always check STATE.md** when resuming or when something seems off — it's the project's memory.

---

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

---

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
5. **Load relevant skills** — even in YOLO mode, check for applicable skills before phases
6. **Record observations** — YOLO sessions generate high-value pattern data

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
- Before executing, check for skills relevant to "planning" and "storage infrastructure"

### Running GSD Commands

To run a GSD command, read the command file from `.claude/commands/gsd/[command].md` and follow its process. The command file contains:
- `<objective>` — What the command achieves
- `<process>` — Step-by-step instructions to follow
- `<success_criteria>` — How to know it's complete

**Critical:** Don't just acknowledge GSD output — act on it.

---

## Commit Guidelines

**Always use the `beautiful-commits` skill** when writing commit messages. This is mandatory for all commits in this project — both direct commits and those made by GSD executor agents.

Key rules:
- Follow Conventional Commits: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Imperative mood: "add" not "added" or "adds"
- Subject <72 chars (preferably <50), lowercase, no period
- Add body for complex changes (explain WHY/WHAT, not HOW)
- Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` on all commits

---

## Project Setup

This project extends GSD with a master orchestrator and base skills.
Project-specific `.claude/` files are stored in `project-claude/` and
installed via:

    node project-claude/install.cjs

Run this after GSD updates or when setting up a fresh clone.

If `gsd-orchestrator.md` or other project files are missing, Claude
should suggest running the install script before proceeding.

---

## Security Considerations

This is a self-modifying system. Be vigilant about:

- **Path traversal**: Skill names must be sanitized before use in file paths
- **YAML deserialization**: Use safe parsing only, never load arbitrary YAML
- **Data poisoning**: Append-only JSONL files could be manipulated — validate entries on read
- **Permission skipping**: Never bypass user confirmation for skill application, even in automated or YOLO workflows
- **Cross-project leakage**: User-level skills must not expose project-specific patterns to other projects
- **Observation privacy**: `.planning/patterns/` should be in `.gitignore` for shared repos

---

## Anti-Patterns to Avoid

- **Don't** stop after GSD output without reading "Next Up" instructions
- **Don't** wait for user input when YOLO mode is enabled and next step is clear
- **Don't** start coding without checking if a plan exists
- **Don't** make changes that span multiple phases in one session
- **Don't** skip commits — GSD's atomic commits enable rollback
- **Don't** ignore STATE.md warnings or blockers
- **Don't** create plans manually — use `/gsd:plan-phase`
- **Don't** be rigid — GSD serves the user, not the other way around
- **Don't** execute GSD phases without checking for relevant learned skills first
- **Don't** auto-apply skill suggestions — always require user confirmation
- **Don't** load skills that exceed the token budget — defer and note what was skipped
- **Don't** ignore user corrections — they are the primary signal for skill refinement
