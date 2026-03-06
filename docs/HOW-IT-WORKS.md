# How It Works

gsd-skill-creator operates at two levels: an **adaptive learning layer** that observes your workflow and generates skills, and an **execution engine** that coordinates multi-agent work through structured plans, parallel waves, and deterministic communication protocols. This document describes both.

---

## Part 1: The Skill Lifecycle

The skill creation system operates in a six-step workflow:

### Step 1: Session Observation

When you use Claude Code, the system observes:
- **Commands executed** - Build, test, deploy commands
- **Files touched** - File types, paths, access patterns
- **Decisions made** - Choices, preferences, corrections
- **Skills activated** - Which skills loaded and when

Observations are stored as compact summaries in `.planning/patterns/sessions.jsonl`.

### Step 2: Pattern Detection

The pattern analyzer scans observations for:
- **Command sequences** - Recurring command patterns (e.g., always running tests after changes)
- **File patterns** - Frequently accessed file types or paths (e.g., `*.test.ts` files)
- **Workflow patterns** - Common task structures (e.g., create PR -> review -> merge)

When a pattern appears **3+ times**, it becomes a skill candidate.

### Step 3: Skill Suggestion

Run `skill-creator suggest` to review candidates:
1. See the detected pattern and evidence (occurrences, dates, files)
2. Preview the generated skill content before accepting
3. **Accept** - Create the skill immediately
4. **Defer** - Ask again in 7 days
5. **Dismiss** - Never suggest this pattern again

### Step 4: Skill Application

When you work in Claude Code:
1. The **relevance scorer** matches skills to your current context
2. Skills with matching triggers are ranked by specificity
3. Skills load automatically within the **token budget** (2-5% of context)
4. **Conflicts** are resolved by specificity and recency
5. You can see active skills with `skill-creator status`

### Step 5: Feedback Learning

The system learns from your corrections:
1. **Detects** when you override or correct skill output
2. **Accumulates** feedback over time in `.planning/patterns/feedback.jsonl`
3. After **3+ corrections**, suggests bounded refinements
4. Refinements are **limited to 20%** content change
5. **7-day cooldown** between refinements
6. **User confirmation** always required

### Step 6: Agent Composition

For skills that frequently activate together:
1. **Co-activation tracker** detects stable skill pairs (5+ co-activations)
2. **Cluster detector** groups related skills (2-5 skills per cluster)
3. **Stability check** ensures pattern persists (7+ days)
4. **Agent generator** creates `.claude/agents/` files
5. Generated agents combine expertise from multiple skills

---

## Part 2: The Execution Engine

Skills and agents are the building blocks. What follows is how they get coordinated to build real software — the execution model that has evolved across 50+ milestones and been proven at scale during the Gastown mission pack (v1.49.19: 5 waves, 10 parallel tracks, ~40 minutes wall time).

### GSD Phase Lifecycle

Every piece of work follows the same four-stage lifecycle:

```
Plan --> Execute --> Verify --> Complete
```

**Plan.** A PLAN.md file defines what to build: tasks (numbered, typed), acceptance criteria, file targets, and verification commands. Plans are created by the planner agent during `/gsd:plan-phase`, informed by requirements and discussion artifacts. Each plan is scoped to one logical unit of work — small enough to execute atomically, large enough to be meaningful.

**Execute.** A fresh executor agent reads the plan, implements each task in order, and creates one git commit per task. The executor operates with a clean context window — no accumulated drift from prior work. STATE.md tracks the current position (which phase, which plan, which task) so execution can be resumed if interrupted.

**Verify.** After execution, verification confirms the phase goal was achieved. This can be automated (tests pass, types check, builds succeed) or human-verified (visual inspection, functional review at a URL). Verification is a separate step from execution — the agent that built it is not the agent that judges it.

**Complete.** A SUMMARY.md captures what was built, what deviated from the plan, what decisions were made, and performance metrics. STATE.md advances to the next position. ROADMAP.md updates its progress table.

The key property is **fresh context per phase**. Each executor agent starts with only the plan, the project instructions, and the relevant source files. This prevents context accumulation — the failure mode where agents gradually lose coherence as their context window fills with irrelevant history.

### Wave-Based Parallel Execution

Phases within a milestone are organized into dependency-ordered **waves**. Independent phases execute in parallel; dependent phases wait for their prerequisites.

```
Wave 0 (sequential):   Phase 446 --> Phase 447
Wave 1 (parallel):     Phase 448  |  Phase 449
Wave 2 (parallel):     Phase 450+451  |  Phase 452+453
Wave 3 (parallel):     Phase 454  |  Phase 455
Wave 4 (sequential):   Phase 456
```

The wave plan is the execution schedule for a milestone. The `/gsd:execute-phase` orchestrator reads the wave plan and spawns executor agents — one per plan, running in parallel within each wave. When all agents in a wave complete, the next wave begins.

This pattern was introduced around v1.30 and has been used in every milestone since. It exploits the natural parallelism in software projects: types and schemas can be built alongside test infrastructure; API endpoints can be built alongside UI components; documentation can be written alongside verification tests.

**Wave construction rules:**
- Wave 0 contains foundation work (types, schemas, scaffolds) that everything else depends on
- Subsequent waves contain phases whose `depends_on` fields are satisfied by prior waves
- The final wave typically contains integration testing and documentation
- A wave's wall-clock time equals its slowest member (tail latency matters)

**Practical results:** The DACP milestone (v1.49, 11 phases, 24 plans) executed across 5 waves. The Gastown mission pack (v1.49.19, 12 skills, 108 tests) executed across 5 waves with 10 parallel tracks in approximately 40 minutes wall time. Without wave parallelism, sequential execution would have taken 3-4x longer.

### Payload-Agnostic Execution

The wave execution pipeline makes no assumptions about what it's building. The same parallel agents, dependency-ordered waves, and atomic commits that produce code also produce documentation, educational content, and operational procedures.

**Proof case — v1.49.20 (Documentation Consolidation):**

| Metric | Value |
|--------|-------|
| Waves | 2 (audit + 4 parallel doc updates) |
| Agents | 6 (2 in Wave 0, 4 in Wave 1) |
| Wall time | ~8 minutes |
| Files touched | 5 substantive doc rewrites |
| Commits | 5 atomic, conventional format |
| Pipeline | sc-dev-team (same as code milestones) |

The system dogfooded its own infrastructure: the DACP communication protocol coordinated agent handoffs, the wave planner ordered dependencies, and atomic commits preserved rollback safety — all for a release that changed zero lines of code.

This means the GSD infrastructure scales to any structured deliverable: documentation, educational packs, configuration, operational runbooks, or research compilations. The pipeline is the constant; the payload varies.

### Chipset Validation Pipeline

A **chipset** is a declarative YAML configuration that teaches gsd-skill-creator how to orchestrate agents using a specific coordination pattern. The Gastown chipset, for example, encodes the Mayor/Polecat/Witness/Refinery agent topology along with communication channels, dispatch parameters, and skill bindings.

Before a chipset is activated, it passes through a 4-stage validation pipeline:

1. **Schema validation** — The YAML structure is checked against a JSON Schema (draft-07). Fields, types, required properties, and allowed values are all enforced. A chipset with a missing `topology` section or an invalid `dispatch.strategy` value fails here.

2. **Token budget** — The sum of all skill weights declared in the chipset must be <= 1.0. Each skill consumes a fraction of the available context window. The Gastown chipset uses 0.97 (97% utilization, 3% buffer). A chipset that exceeds 1.0 would starve the agent of working memory.

3. **Agent topology** — The declared agent roles must satisfy the pattern's constraints. For the Gastown pattern: exactly 1 mayor (more = split-brain), at least 1 polecat (the workers), at least 1 witness (the observer). Role counts outside these bounds fail validation.

4. **Communication channels** — All declared channels must use approved types (mail, nudge, hook), and their paths must be non-empty. This prevents agents from being configured with channels they can't actually use.

The validator runs all four stages and returns a structured result with errors (fatal) and warnings (informational). A chipset must pass with zero errors to be activated.

```typescript
const result = gastown.validateChipset(yamlContent, schemaPath);
// result.valid: boolean
// result.errors: string[]   — must be empty
// result.warnings: string[] — informational only
```

### Mission Pack Lifecycle

A **mission pack** is a complete feature delivery — from vision through shipped code. The lifecycle follows a structured pipeline that has been refined across dozens of milestones:

```
Vision --> Requirements --> Wave Plan --> Parallel Execution --> Atomic Commits
```

Or in more detail, the **absorption pipeline**:

```
Study --> Map --> Define --> Build --> Test --> Document --> Ship
```

**Study.** Read the source material — upstream project docs, API references, design documents, or user research. Understand what exists and what the integration surface looks like.

**Map.** Create a concept mapping: source terms to GSD terms. This is the Rosetta Stone for the integration. The Gastown mapping translated Mayor to coordinator, Polecat to executor, Witness to observer, Rig to workspace.

**Define.** Write REQUIREMENTS.md with numbered requirements, acceptance criteria, and traceability. Requirements are the contract — everything built must trace back to a requirement, and every requirement must be satisfied or explicitly deferred as tech debt.

**Build.** Execute the wave plan. Agents implement each plan in parallel, creating atomic commits per task. The GSD executor handles deviation automatically: bugs get fixed inline (Rule 1), missing critical functionality gets added (Rule 2), blocking issues get resolved (Rule 3). Only architectural changes (Rule 4) pause for human decision.

**Test.** Verification tests confirm the implementation satisfies the requirements. The Gastown mission pack shipped with 108 tests across multiple test files, covering the validator, state manager, and integration paths.

**Document.** READMEs, user guides, glossaries, and Architecture Decision Records (ADRs) are written as part of the mission pack — not as an afterthought. Documentation is a first-class deliverable.

**Ship.** Tag the release, update release notes, mark requirements complete. The mission pack is now part of the project's shipped history.

### DACP Bundle Flow

The **Deterministic Agent Communication Protocol** (DACP, v1.49) replaces markdown-only agent handoffs with structured three-part bundles. The problem it solves: when one agent hands off work to another, plain prose is ambiguous. The receiving agent may interpret instructions differently, causing drift between intent and execution.

DACP bundles contain three parts:

1. **Intent** (markdown) — Human-readable description of what needs to happen. This is the `.msg` that any agent can read, even without DACP support.
2. **Data** (JSON) — Structured payload with schemas, parameters, and configuration. Machine-parseable, schema-validated.
3. **Code** (scripts) — Executable operations: parsers, validators, transformers. Never auto-executed (SAFE-01) — scripts are reference material, not runtime code.

The flow through the system:

**Assembler.** The DACP Assembler composes bundles at the appropriate fidelity level. Fidelity ranges from Level 0 (prose only — a plain `.msg` file) through Level 3 (full bundle with intent, data, and code). The fidelity decision model considers data complexity, historical drift, available skills, token budget, and safety criticality. A simple "run the tests" handoff might be Level 0. A "deploy this schema migration with rollback" handoff would be Level 3.

**Transport.** Bundles move through the Den filesystem bus — a directory-based message transport. The `.msg` file and `.bundle` directory travel as companions. The scanner pairs them on receipt.

**Interpreter.** The receiving agent's interpreter validates the bundle through an 8-stage pipeline: `.complete` marker check, manifest schema validation, fidelity level match, file existence, size limits (50KB data, 10KB per script, 100KB total), schema coverage, data-schema validation, and provenance chain verification. Bundles without valid provenance (source skill + version) are rejected.

**Retrospective.** After execution, the retrospective analyzer measures drift — how much the actual outcome diverged from the stated intent. Drift scores are weighted composites: intent alignment (35-40%), rework rate (25-30%), verification pass rate (20-25%), and modification count (15-10%). When drift is high (>0.3), the analyzer recommends promoting the fidelity level for that handoff type. When drift is consistently low (<0.05), it recommends demotion. Cooldowns prevent oscillation: 7 days between promotions, 14 days between demotions.

The net effect: agent handoffs self-calibrate over time. Handoffs that cause problems get more structure. Handoffs that work reliably get less overhead.

### Agent Team Patterns

gsd-skill-creator supports multiple agent team topologies, each optimized for a different coordination problem.

**The uc-lab pattern** (Unit Circle Laboratory):
- **Lab Director** — Authority. Owns the milestone plan, makes architectural decisions, resolves conflicts between agents.
- **Flight Ops** — Operations. Manages execution: spawns agents, monitors progress, handles failures and retries.
- **Capcom** — Communications. Formats output, manages human-facing messages, translates between agent state and user-readable status.
- **Watchdog** — Health. Monitors agent health, detects stuck processes, enforces timeouts, escalates anomalies.

This pattern works well for milestones where a single coordinator (Lab Director) can see the full picture and delegate execution to Flight Ops. Used extensively during the Unit Circle chain (50 milestones).

**The Gastown pattern** (Multi-agent workspace orchestration):

Each Gastown "rig" is a complete autonomous coordination instance. A user's project can run multiple rigs in parallel — different teams working on different subsystems, each with their own mayor coordinating independently. Skill Creator's agent chipset wires multiple rigs into a unified mission control dashboard for simplified management of the wiring harness connecting the control surface to distributed rig features.

- **Mayor** — Per-rig coordinator. Singleton within one rig. Reads GSD plans, creates work items (beads), groups them into convoys (batches), and dispatches them to workers within that rig. One mayor per rig prevents split-brain within a rig. Multiple rigs each have their own mayor without conflict.
- **Polecat** — Executor. 1-30 workers per rig. Each polecat receives a single work item via the hook mechanism, executes it in an isolated workspace, and returns the result. Polecats are ephemeral — they spin up, do work, and retire within their assigned rig.
- **Witness** — Observer. Monitors agent health within a rig, detects stuck hooks, validates work output. At least one witness per rig.
- **Refinery** — Merge queue. Receives completed work from polecats and merges it to the target branch in FIFO order. One refinery per rig/target branch combination. Deterministic ordering prevents merge conflicts.

This pattern excels at high-parallelism workloads where many independent tasks can run simultaneously, and particularly at managing multiple parallel rigs through a unified control surface. The Gastown mission pack used 10 parallel polecats across 5 waves in a single rig; scaling to multiple rigs multiplies this capacity.

**Communication channels** connect agents within a team:

| Channel | Type | Durability | Use Case |
|---------|------|------------|----------|
| **Mail** | Async | Durable | Messages that must survive agent restarts. Stored as files in `mail/` directory. Used for work assignments, completion reports, error escalations. |
| **Nudge** | Sync | Ephemeral | Immediate signals between running agents. Stored temporarily in `nudge/` directory. Used for "work available" notifications, heartbeats. |
| **Hook** | Pull | Persistent | Work assignment mechanism. A hook binds a work item to an agent. The agent polls its hook on startup. Used by the GUPP (Get Up and Pull Protocol) propulsion system. |

### The Learning Loop

The system's meta-pattern — how it improves across milestones:

```
Observe --> Record --> Pattern --> Predict --> Improve --> Observe
```

**Observe.** During execution, the system captures what happens: which commands run, which files change, how long tasks take, where deviations occur, what decisions get made. This is passive — observation doesn't change behavior.

**Record.** Observations are persisted as structured data: session logs in JSONL, commit history in git, metrics in STATE.md, decisions in SUMMARY.md files. The recording format is append-only — nothing is deleted, so the full history is always available.

**Pattern.** The pattern analyzer identifies recurring structures: command sequences that always appear together, file types that always change in groups, error patterns that always require the same fix. Patterns require 3+ occurrences to be considered stable.

**Predict.** Stable patterns enable prediction: if you're about to run tests, the system knows you'll likely want the test runner skill loaded. If you're modifying a schema, it predicts you'll need the migration generator next. Predictions are probabilistic, not deterministic — they preload context, not force actions.

**Improve.** When predictions are correct, confidence increases. When they're wrong, the system records the miss and adjusts. Skills that generate too many false activations get their trigger conditions refined. Skills that consistently help get their priority increased.

**Observe.** The improved system generates new observations, and the loop continues. Each cycle tightens the fit between the system's model and the user's actual workflow.

This loop operates at multiple timescales: within a session (skill activation), across sessions (pattern detection), across milestones (workflow optimization), and across project versions (architectural learning).

### Context Management

Claude Code agents operate within finite context windows. Context management determines how effectively that window is used.

**Pressure zones:**

| Zone | Context Usage | Behavior |
|------|---------------|----------|
| **Green** | < 60% | Normal operation. All skills loaded, full project context available. No compression needed. |
| **Yellow** | 60-80% | Selective loading. Lower-priority skills deferred, file reads become targeted (specific line ranges instead of full files), summaries replace full documents. |
| **Red** | > 80% | Conservation mode. Only essential skills loaded, aggressive summarization, handoff preparation begins. The agent should be wrapping up its current task, not starting new ones. |

**Handoff protocols.** When an agent's context is exhausted (or when a task naturally completes), the handoff protocol creates a continuation point:

1. The completing agent writes a SUMMARY.md capturing what was done, what remains, and what state the codebase is in
2. STATE.md is updated with the exact position (phase, plan, task number)
3. Commits are pushed so the next agent starts from committed state
4. The orchestrator spawns a fresh agent with only the plan, the summary, and the relevant source files

**Warm starts.** When resuming work, the session-awareness skill reads STATE.md, recent SUMMARY.md files, and git log to reconstruct enough context to continue without re-reading the entire project. This is cheaper than a cold start (reading everything) and more reliable than hoping the agent "remembers" from a prior session (it doesn't — each agent starts fresh).

The combination of pressure-zone awareness, structured handoffs, and warm starts means the system can execute arbitrarily large milestones without degrading. The constraint is wall-clock time, not context window size.

---

## How the Parts Connect

The skill lifecycle (Part 1) feeds the execution engine (Part 2). Skills detected through observation become the building blocks that agents use during execution. Agent composition groups related skills into specialized agents. Those agents execute plans within the wave-based parallel system. DACP bundles ensure agents communicate without drift. The learning loop tightens everything across milestones.

```
Observation --> Skills --> Agents --> Teams --> Execution
     ^                                            |
     |                                            |
     +-------- Learning Loop <--------------------+
```

The system is self-improving: each milestone's execution generates observations that refine the skills used in the next milestone's execution. The path from v1.0's basic 6-step loop to v1.49's multi-agent wave execution with DACP bundles and chipset validation was itself built using this loop — each version's execution taught the system how to execute the next version better.
