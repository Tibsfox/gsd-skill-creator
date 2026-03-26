# GSD v1 Context Engineering

> **Domain:** Upstream Intelligence -- Context Engineering
> **Module:** 2 -- GSD v1: The Context Engineering Revolution
> **Through-line:** *Context rot is real. The fix: atomic plans, fresh windows, file-based state. GSD v1 proved the pattern; GSD-2 operationalized it.*

---

## Table of Contents

1. [The Context Engineering Insight](#1-the-context-engineering-insight)
2. [Context Artifact Inventory](#2-context-artifact-inventory)
3. [Meta-Prompting Architecture](#3-meta-prompting-architecture)
4. [Multi-Agent Orchestration](#4-multi-agent-orchestration)
5. [Wave Execution Model](#5-wave-execution-model)
6. [Model Profiles](#6-model-profiles)
7. [What GSD v1 Got Right](#7-what-gsd-v1-got-right)
8. [The Amiga Principle: GSD as Paula](#8-the-amiga-principle-gsd-as-paula)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. The Context Engineering Insight

Claude Code ships with a 200,000-token context window. That sounds like a lot. It is not.

The fundamental observation behind GSD v1 is that LLM quality degrades as the context window fills. This is not a theoretical concern -- it is a measurable, reproducible phenomenon. After approximately 60-80% of the context window is occupied, the model begins to lose track of earlier instructions, hallucinate file contents it read 50,000 tokens ago, and make decisions that contradict constraints established at the start of the session. This is **context rot**.

> *"Context rot is real. The fix: atomic plans, fresh windows, file-based state."*

Context rot has specific symptoms: instruction amnesia (the model forgets CLAUDE.md directives loaded at session start), file content hallucination (inventing details from files read 50k tokens ago), decision contradiction (reversing choices made earlier in the same session), scope creep (wandering into adjacent work without clear task boundaries), and error cascade (compounding early mistakes as the model builds on incorrect assumptions).

The GSD v1 solution is structural, not prompting. You don't fix context rot by telling the model to "pay attention." You fix it by never letting the context window fill up in the first place.

**The atomic plan principle:** Every unit of work must be small enough to execute in a fresh context window. The plan file contains everything the agent needs -- task description, relevant file references, verification criteria. The agent loads the plan, executes it, writes results to disk, and the session ends. The next task starts a new session with a new plan.

**The file-based state principle:** Everything the agent learns during execution goes to disk. Decisions go in STATE.md. Results go in SUMMARY.md. Requirements stay in REQUIREMENTS.md. When the next session starts, it loads only the files relevant to its task -- not the entire history of every previous session. The file system is the long-term memory; the context window is the working memory.

This is the insight that made GSD viral. Not a new model. Not a new API. A structural pattern for managing the working memory of an AI agent.

---

## 2. Context Artifact Inventory

GSD v1 established a file-based context engineering system where each file type has a specific purpose, size constraint, and lifecycle. Together, these files form the external memory that makes atomic plans possible.

| Artifact | Purpose | Size Target | Lifecycle | GSD-2 Equivalent |
|----------|---------|-------------|-----------|-------------------|
| **PROJECT.md** | Project vision, tech stack, conventions. Always loaded as system context. | 200-500 lines | Created once, rarely modified | PROJECT.md |
| **REQUIREMENTS.md** | Scoped v1/v2 requirements with phase traceability and checkbox completion tracking. | 100-300 lines | Created at project start, updated per phase | Integrated into CONTEXT.md |
| **ROADMAP.md** | Phase progression with completion markers, plan counts, and dependency annotations. | 50-150 lines | Updated after each plan completes | M001-ROADMAP.md |
| **STATE.md** | Live session state: current position, decisions, blockers, performance metrics, session history. | 100-200 lines | Updated continuously during execution | STATE.md (auto-derived) |
| **CONTEXT.md** | Phase-specific implementation decisions and context that augments PROJECT.md for the current work. | 50-200 lines | Created per phase, archived when phase completes | M001-CONTEXT.md |
| **RESEARCH.md** | Domain investigation findings from the research phase. Technical analysis, options evaluated, recommendations. | 200-600 lines | Created during research, read-only during execution | M001-RESEARCH.md |
| **PLAN.md** | Atomic task definition with XML structure: tasks, verification criteria, done markers, dependencies. | 50-150 lines | Created by planner, consumed by executor | S01-PLAN.md, T01-PLAN.md |
| **SUMMARY.md** | Execution results: what changed, what was committed, deviations from plan, metrics. | 100-300 lines | Created by executor after plan completion | T01-SUMMARY.md |
| **todos/** | Captured ideas and deferred work items. Inbox for things noticed during execution that belong to future phases. | Variable | Append-only during execution, triaged between phases | Seeds system |
| **threads/** | Cross-session context threads for decisions that span multiple sessions or require human input. | Variable | Created as needed, resolved and archived | KNOWLEDGE.md |

### Artifact Relationships

The artifacts form a directed graph of dependencies:

```
PROJECT.md ──────────────────────────────────────────────┐
     │                                                    │
     ▼                                                    │
REQUIREMENTS.md ──→ ROADMAP.md                           │
     │                   │                                │
     ▼                   ▼                                │
CONTEXT.md ──────→ PLAN.md ←─── RESEARCH.md              │
                      │                                   │
                      ▼                                   │
                  SUMMARY.md ──→ STATE.md ←───────────────┘
                      │              │
                      ▼              ▼
                   todos/       threads/
```

**The key insight:** At plan execution time, the agent loads PROJECT.md + STATE.md + PLAN.md + (optionally) RESEARCH.md + CONTEXT.md. That is 500-1,200 lines of focused context -- well under 10% of the context window. The remaining 90%+ is available for the actual work: reading code, writing code, running tests, debugging.

### Size Discipline

GSD v1 enforces size constraints on each artifact. This is not documentation hygiene -- it is a resource allocation strategy. Every line in a context artifact consumes tokens that could be used for code. The size targets are calibrated so that the full context load (all relevant artifacts) stays under 15,000 tokens, leaving 185,000 tokens for productive work in a 200k window.

When an artifact exceeds its target size, it is a signal that the project needs restructuring -- either the phase is too large, the requirements are too broad, or state has accumulated that should be archived.

---

## 3. Meta-Prompting Architecture

GSD v1's core technical innovation is its meta-prompting system: a structured vocabulary of commands that orchestrate agent behavior through XML-formatted prompts optimized for Claude's attention mechanism.

### 3.1 XML Prompt Formatting

GSD v1 formats all plans and instructions in XML. This is not aesthetic preference -- it is an engineering decision based on Claude's training data and attention patterns. XML tags provide unambiguous structural boundaries that the model reliably respects:

```xml
<task id="3" type="auto">
  <title>Implement JWT refresh token rotation</title>
  <files>
    <file>src/auth/jwt.ts</file>
    <file>src/auth/refresh.ts</file>
  </files>
  <verification>
    <check>npm test -- --grep "refresh"</check>
    <expect>All refresh token tests pass</expect>
  </verification>
  <done>Refresh token rotation implemented with 15-minute access / 7-day refresh TTL</done>
</task>
```

The XML structure serves four purposes: parsing reliability (unambiguous task boundaries), attention anchoring (XML tags prevent instruction bleeding between tasks), machine readability (orchestrator can parse dependencies and track completion), and human readability (XML plans remain comprehensible during review).

### 3.2 Command Vocabulary

The GSD v1 command set covers the full lifecycle of a software project:

| Command | Phase | Purpose |
|---------|-------|---------|
| `new-project` | Setup | Initialize project structure, create PROJECT.md, REQUIREMENTS.md, ROADMAP.md |
| `discuss-phase` | Planning | Open-ended discussion about the next phase before committing to plans |
| `plan-phase` | Planning | Generate atomic plans for all work in the current phase |
| `execute-phase` | Execution | Execute plans sequentially (or in parallel waves) |
| `verify-work` | Verification | Run verification checks against success criteria |
| `ship` | Delivery | Final checks, version bump, changelog, release |
| `complete-milestone` | Transition | Archive current milestone, set up next |
| `new-milestone` | Transition | Create a new milestone from scratch |
| `quick` | Utility | Fast single-task execution (skip full planning) |
| `fast` | Utility | Abbreviated planning for small changes |

**Plus utility commands:** debug (diagnosis), backlog (manage deferred items), code-review (structured review), ui-design (design system patterns).

### 3.3 Prompt Construction Pipeline

When a command is invoked, GSD v1 constructs the prompt through a pipeline:

1. **Load PROJECT.md** -- always included as system context
2. **Load STATE.md** -- current position, decisions, blockers
3. **Load phase artifacts** -- CONTEXT.md, RESEARCH.md for the current phase
4. **Load plan** -- the specific PLAN.md being executed
5. **Inject command-specific instructions** -- the meta-prompt for the current command type
6. **Format as XML** -- wrap everything in structured tags for attention anchoring

The total context load is predictable and bounded. Step 5 is where the meta-prompting happens -- the command-specific instructions tell the agent how to behave for this type of work (planning vs. execution vs. verification).

---

## 4. Multi-Agent Orchestration

GSD v1 uses a **thin orchestrator** pattern for multi-agent work. The orchestrator is minimal -- it spawns agents, collects results, and routes to the next step. It never does heavy lifting. All intelligence lives in the specialized agents.

### 4.1 Agent Roles

| Agent | Count | Purpose | Model |
|-------|-------|---------|-------|
| **Researcher (Stack)** | 1 | Analyze technology stack, dependencies, versions | Sonnet |
| **Researcher (Features)** | 1 | Survey feature landscape, prior art, alternatives | Sonnet |
| **Researcher (Architecture)** | 1 | Evaluate architectural patterns, trade-offs, risks | Sonnet |
| **Researcher (Pitfalls)** | 1 | Identify known failure modes, common mistakes, gotchas | Sonnet |
| **Planner** | 1 | Synthesize research into atomic plans with dependencies | Opus |
| **Plan Checker** | 1 | Validate plans for completeness, correctness, feasibility | Opus |
| **Executor** | 1-4 | Execute plans (one per parallel track in a wave) | Sonnet |
| **Verifier** | 1 | Run verification checks, confirm success criteria | Sonnet |

### 4.2 The Thin Orchestrator

The orchestrator's responsibilities are limited by design:

- **Spawn:** Create an agent with a specific role, plan, and context payload
- **Collect:** Wait for the agent to complete and read its output from disk
- **Route:** Based on the output, determine the next agent to spawn
- **Track:** Update STATE.md with progress, decisions, and metrics

The orchestrator does **not** make implementation decisions, resolve conflicts between agent outputs, edit agent results, or retry failed agents without human input (though GSD-2 changes this last point). This constraint is intentional. A thin orchestrator is debuggable -- when something goes wrong, you look at the agent that failed, not the orchestrator.

### 4.3 Research Phase Parallelism

The four researchers run in parallel, each in their own context window, each focused on a single dimension of the problem. This is the first application of the wave execution model: wave 0 is research, with four parallel tracks.

The parallel research pattern produces better results than a single agent doing all research. Each researcher fills its context window with domain-specific material without competing for space. The planner synthesizes four focused reports into a unified plan. **Proven from skill-creator experience:** 4 parallel agents is optimal for synthesis docs, 3 for pure doc runs, and more than 4 introduces coordination overhead that exceeds the parallelism benefit.

### 4.4 Executor Isolation

Each executor runs in its own context window with only its assigned plan and the necessary context artifacts. Executors do not see each other's work in progress. This prevents cross-contamination -- one executor's partial state cannot confuse another executor.

Post-execution, the verifier loads all executor outputs and checks for integration issues. This is the verification ladder: individual task verification by the executor, then cross-task verification by the verifier.

---

## 5. Wave Execution Model

Plans are grouped into **waves** based on their dependency relationships. Within each wave, plans run in parallel. Waves run sequentially. A wave cannot start until all plans in the previous wave have completed and been verified.

### 5.1 Wave Structure

```
Wave 0: Foundation
  ├── Plan 0A: Schema definitions
  └── Plan 0B: Source index
        ↓ (barrier)
Wave 1: Survey (parallel)
  ├── Plan 1A: Pi SDK survey
  ├── Plan 1B: GSD v1 survey
  ├── Plan 1C: GSD-2 survey
  └── Plan 1D: Docs survey
        ↓ (barrier)
Wave 2: Synthesis
  └── Plan 2A: Bridge architecture
        ↓ (barrier)
Wave 3: Publication
  ├── Plan 3A: Verification
  └── Plan 3B: Release
```

### 5.2 Dependency Rules

1. **No forward references:** A plan can depend on plans in earlier waves only
2. **Parallel within waves:** Plans in the same wave must not depend on each other
3. **Barrier synchronization:** All plans in wave N must complete before any plan in wave N+1 starts
4. **Failure propagation:** If a plan in wave N fails, wave N+1 is blocked until the failure is resolved

### 5.3 Structural Identity with Skill-Creator

This is the same execution model skill-creator uses internally. The vocabulary differs:

| GSD v1 Term | Skill-Creator Term | Meaning |
|-------------|-------------------|---------|
| Phase | Milestone | A major unit of work with a shippable outcome |
| Plan | Component | An atomic unit executable in one context window |
| Wave | Wave | A group of plans/components that can run in parallel |
| Barrier | Wave boundary | Synchronization point between sequential groups |
| Executor | Agent | The entity that executes a single plan/component |
| Orchestrator | Coordinator | The entity that manages wave dispatch |

The alignment is not coincidental. Both systems independently converged on the same execution semantics because the underlying problem is identical: how do you parallelize work that has dependency constraints while maintaining correctness? The answer -- DAG-based wave scheduling with barrier synchronization -- is a well-known pattern from parallel computing.

### 5.4 Wave Sizing

GSD v1 recommends 3-6 plans per wave as the sweet spot. Fewer than 3 means insufficient parallelism. More than 6 means the plans are probably too fine-grained, and the barrier synchronization overhead dominates.

Skill-creator's experience confirms this: 5-6 tasks per teammate is optimal. Single-agent-per-file avoids file conflicts. Sort the queue by complexity (simple first) to minimize wave duration variance.

---

## 6. Model Profiles

GSD v1 introduced the **quality/balanced/budget** model profile concept, mapping model capability to task type. This is a cost-quality tradeoff framework that allocates expensive models where they matter and cheap models where they don't.

### 6.1 Profile Definitions

| Profile | Planning Model | Execution Model | Scaffolding Model | Cost Multiplier |
|---------|---------------|-----------------|-------------------|-----------------|
| **Quality** | Opus | Opus | Sonnet | 3-5x baseline |
| **Balanced** | Opus | Sonnet | Haiku | 1x (baseline) |
| **Budget** | Sonnet | Haiku | Haiku | 0.15-0.3x baseline |

### 6.2 Task-to-Model Mapping

The insight is that not all tasks require the same intelligence. **Planning** requires synthesis and judgment -- Opus territory. **Execution** requires careful instruction-following and code generation -- Sonnet handles this reliably. **Scaffolding** requires template expansion and boilerplate -- Haiku is sufficient, and speed matters more than depth.

### 6.3 Independent Convergence

Skill-creator's 30/60/10 allocation (30% Opus, 60% Sonnet, 10% Haiku) maps directly to GSD v1's model profiles:

| Allocation | GSD v1 | Skill-Creator | Rationale |
|-----------|--------|---------------|-----------|
| 30% Opus | Planning + verification | Planning + synthesis | High-leverage decisions need the best model |
| 60% Sonnet | Execution | Execution | The bulk of work is structured implementation |
| 10% Haiku | Scaffolding | Scaffolding | Boilerplate and formatting need speed, not depth |

Both systems arrived at this split independently. The convergence validates the insight: cost-quality tradeoffs in AI-assisted development follow a power law where planning drives most of the value and execution needs reliability more than brilliance.

### 6.4 Budget Pressure Mechanics

GSD-2 extended model profiles with budget pressure -- dynamically downgrading model selection as spend approaches a ceiling. At 50% of ceiling, simple tasks downgrade. At 75%, all except planning downgrade. At 90%, everything runs budget. Skill-creator must respect these profiles -- its observation overhead must scale with the active profile.

---

## 7. What GSD v1 Got Right

GSD v1 is not a perfect system. It has rough edges, manual steps, and scaling limits. But it established patterns that survived into GSD-2 and that skill-creator now depends on. These are the durable contributions.

### 7.1 The File-Based State Model

State lives on disk as structured markdown files. Not in a database. Not in a cloud service. Not in memory. On disk, in the project repository (though typically gitignored).

This decision has cascading benefits: inspectable (open a markdown file and read the state), debuggable (`cat STATE.md` tells you what the system thinks), portable (copy `.planning/` and you have full project state), crash-safe (disk reflects last completed unit), version-controllable (can be versioned for audit trails), and tool-agnostic (any agent that reads files can participate).

### 7.2 The Atomic Plan Concept

One plan. One context window. One task. One commit.

This is the most important constraint GSD v1 introduced. It forces decomposition: if a plan doesn't fit in one context window, it must be split. The splitting is the planning -- getting the granularity right is where Opus earns its cost. Once the plans are right, execution is mechanical.

> *"Planning is the hard part. Once the plans are done, the code is easy."*

### 7.3 The Thin Orchestrator

The orchestrator spawns, collects, routes. It doesn't think. This makes the system debuggable (which agent failed?), parallelizable (agents don't share state during execution), and composable (swap the orchestrator without changing agents).

### 7.4 The Verification Ladder

GSD v1 enforces verification at four levels: task verification (each plan's own criteria), plan verification (cross-task integration after a wave), phase verification (human review at phase boundaries), and milestone verification (full regression before shipping). Each level catches different error classes -- implementation bugs, integration issues, requirement misunderstandings, and everything else, respectively.

### 7.5 What Survived into GSD-2

| GSD v1 Pattern | GSD-2 Evolution | Status |
|----------------|-----------------|--------|
| File-based state (`.planning/`) | File-based state (`.gsd/`) | Renamed, enhanced |
| Atomic plans (PLAN.md) | Task plans (T01-PLAN.md) | Refined hierarchy (Milestone > Slice > Task) |
| XML prompt formatting | Structured dispatch prompts | XML retained for task definitions |
| Wave execution | Slice-based parallel execution | Same semantics, different vocabulary |
| Model profiles (quality/balanced/budget) | Token optimization with budget pressure | Extended with dynamic downgrading |
| Thin orchestrator | Auto mode state machine | Orchestrator gained crash recovery |
| Verification ladder | Verification enforcement with auto-fix | Added automatic retry loops |
| Manual agent spawning | Programmatic agent creation via Pi SDK | The fundamental upgrade |

### 7.6 What GSD v1 Got Wrong

For completeness -- the patterns that did *not* survive: manual session management (users restarted Claude Code for fresh context; GSD-2 automates this), no crash recovery (GSD-2 added lock files and session forensics), no cost tracking (GSD-2 tracks per unit/phase/model), and prompt-only architecture (GSD v1 is markdown and slash commands; GSD-2 is a real TypeScript application).

---

## 8. The Amiga Principle: GSD as Paula

> *"Pi is Agnus. GSD is Paula. Skill-creator is Denise. None of them alone achieves what the three together can."*

In the original Amiga, **Paula** was the I/O controller. She handled audio output (4 channels, 8-bit DMA-driven), disk I/O (floppy controller with DMA), serial and parallel ports, and interrupt management. Paula was the chip that made the Amiga interact with the outside world -- she turned internal computation into external results.

GSD is Paula.

GSD handles the I/O of software development: the planning that turns intent into structure, the execution that turns structure into code, the verification that turns code into confidence, and the human interaction that keeps the process grounded. GSD is how the system talks to the outside world -- the developer, the codebase, the test suite, the git repository.

**The Paula parallel runs deep:**

| Amiga Paula | GSD |
|-------------|-----|
| Audio output (4 DMA channels) | 4 parallel execution tracks (wave model) |
| Disk I/O (read/write sectors) | File-based state (read STATE.md, write SUMMARY.md) |
| Serial/parallel ports | Human interaction (checkpoints, verification, decisions) |
| Interrupt controller | Event handling (task complete, verification failed, checkpoint hit) |
| DMA-driven (Agnus provides addresses) | Pi-driven (Pi provides agent sessions) |

Paula didn't generate the audio waveforms -- the CPU or Agnus's copper coprocessor programmed the sample data. Paula played them back. Similarly, GSD doesn't generate the code -- the LLM (via Pi's agent runtime) does. GSD orchestrates the execution: which task runs when, what context it gets, how results are verified. The interrupt controller parallel is particularly apt -- Paula managed the Amiga's interrupt priorities, GSD manages execution priorities. Both are priority-based event dispatchers.

**The bus connection:** Paula received DMA addresses from Agnus to know where to read audio samples and write disk data. GSD receives agent sessions from Pi to know where to dispatch tasks and collect results. The bus protocol -- structured TypeScript interfaces, file-based state, extension hooks -- connects Paula (GSD) to Agnus (Pi) without either needing to understand the other's internals.

---

## 9. Cross-References

| Reference | Connection |
|-----------|------------|
| [Module 01: Pi-Mono SDK Architecture](01-pi-mono-sdk-architecture.md) | Pi provides the agent runtime that GSD orchestrates against |
| [Module 03: GSD-2 Agent Application](03-gsd-2-agent-application.md) | GSD-2 operationalized GSD v1's patterns into a real application |
| [Module 04: Documentation and Mintlify](04-documentation-mintlify.md) | GSD's documentation migration from markdown to Mintlify |
| [Module 05: Bridge Architecture](05-bridge-architecture.md) | The integration spec that connects skill-creator to GSD-2's extension system |
| [GSD-2 Research Project](../../GSD2/index.html) | Standalone deep-dive into GSD-2's architecture and state machine |
| [STA Research Project](../../STA/index.html) | State machine patterns that apply to GSD's file-based state model |
| Skill-creator `.planning/` | GSD v1's context artifacts as implemented in this project's own workflow |

---

## 10. Sources

### Primary Repository

1. **gsd-build/get-shit-done** -- https://github.com/gsd-build/get-shit-done
   - Version: v1.28.0 (accessed March 26, 2026)
   - Stars: 39,800+
   - Commits: 1,359
   - Releases: 39
   - License: MIT
   - Language: JavaScript

### GSD-2 (Successor)

2. **gsd-build/gsd-2** -- https://github.com/gsd-build/gsd-2
   - Version: v2.43.0 (accessed March 26, 2026)
   - Stars: 2,900+
   - Commits: 1,768
   - Releases: 73
   - License: MIT
   - Language: TypeScript 92.5%

### Documentation

3. **gsd-build/docs** -- https://github.com/gsd-build/docs
   - Mintlify starter kit with MDX content
   - Sections: Getting Started, Customization, Writing Content, AI Tools
   - License: MIT

### Related Analysis Documents

4. **gsd-skill-creator-analysis.md** -- Current skill-creator architecture analysis
5. **skill-creator-wasteland-integration-analysis.md** -- Wasteland federation integration track
6. **gsd-chipset-architecture-vision.md** -- Chipset YAML definitions expressing agent topologies
7. **gsd-upstream-intelligence-pack-v1_43.md** -- Anthropic channel monitoring (predecessor intelligence pack)
8. **gsd-amiga-vision-architectural-leverage.md** -- The Amiga Principle applied to Pi/GSD/skill-creator

### Ecosystem Context

9. **badlogic/pi-mono** -- https://github.com/badlogic/pi-mono (v0.62.0, MIT) -- The Pi SDK that GSD-2 builds on
10. **Mintlify** -- https://starter.mintlify.com/quickstart -- Documentation platform for GSD docs migration
