# GSD-2 Agent Application

> **Domain:** Upstream Intelligence -- Agent Application Architecture
> **Module:** 3 -- GSD-2: The State Machine That Runs the Show
> **Through-line:** *GSD-2 is not a prompt framework. It is an application that controls the agent session, reads disk state, and decides what happens next. The extension system is the bus protocol.*

---

## Table of Contents

1. [The Architectural Shift](#1-the-architectural-shift)
2. [Work Hierarchy](#2-work-hierarchy)
3. [The Extension System](#3-the-extension-system)
4. [Auto Mode State Machine](#4-auto-mode-state-machine)
5. [Dispatch Pipeline](#5-dispatch-pipeline)
6. [Existing Skills System](#6-existing-skills-system)
7. [Token Optimization Profiles](#7-token-optimization-profiles)
8. [Bundled Agents](#8-bundled-agents)
9. [The Amiga Principle: GSD-2 as the Application Layer](#9-the-amiga-principle-gsd-2-as-the-application-layer)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Architectural Shift

GSD v1 was a prompt framework. It gave you well-structured markdown files -- PROJECT.md, REQUIREMENTS.md, ROADMAP.md -- and a set of meta-prompting commands that a human or an orchestrator could invoke to guide an LLM through a multi-phase software development workflow. The LLM did the work. The framework provided the structure. The human decided when to start and stop.

GSD-2 is something categorically different. It is a standalone TypeScript CLI application -- published as `gsd-pi` on npm, built on the Pi SDK -- that *controls* the agent session. The LLM does not decide what happens next. GSD-2 decides. The LLM executes a single, focused task within a fresh context window, and when that task completes, GSD-2 reads disk state again, determines the next unit of work, constructs a new dispatch prompt, and spawns a new agent session.

The distinction is not semantic. It is architectural:

| Aspect | GSD v1 (Prompt Framework) | GSD-2 (Agent Application) |
|--------|--------------------------|--------------------------|
| Control flow | LLM navigates phases via instructions | Application reads state, dispatches tasks |
| Context management | Accumulates within long sessions | Fresh 200k-token window per task |
| Session lifecycle | Human starts/stops | Application manages autonomously |
| Error recovery | LLM self-corrects (or doesn't) | Application detects stuck states, retries with diagnostics |
| State persistence | Files on disk (manual) | Files on disk (managed by state machine) |
| Cost tracking | None | Per-unit, per-phase, per-model |
| Verification | Human reviews | Automated verification ladder with auto-fix retries |

> *The most important thing GSD-2 does is something no prompt framework can do: it throws away context. Every task starts with a clean 200k-token window. Context rot -- the gradual degradation of LLM output quality as accumulated state fills the window -- is eliminated structurally, not managed behaviorally.*

This is the shift that matters for skill-creator integration. When skill-creator hooks into GSD-2, it is not injecting prompts into a long-running conversation. It is participating in a dispatch pipeline where each task is a self-contained unit with known inputs, known outputs, and a clean execution environment. The observation surface is well-defined: task summaries on disk, not ephemeral conversation state.

The `.gsd/` directory is the entire state of the system. Everything GSD-2 knows is written there. Everything it decides is based on reading there. The disk is the single source of truth. Sessions are ephemeral. Files are permanent.

---

## 2. Work Hierarchy

GSD-2 structures all work into a strict three-tier hierarchy. The hierarchy is not a suggestion -- it is enforced by the state machine.

```
Milestone (shippable version)
  |
  +-- Slice (demoable vertical capability)
  |     |
  |     +-- Task (one context-window-sized unit)
  |     +-- Task
  |     +-- Task
  |
  +-- Slice
        |
        +-- Task
        +-- Task
```

### Milestone

A milestone is a shippable version of the software. It typically contains 4-10 slices. The milestone is the only level where human approval is required -- the user signs off on the roadmap, and the system executes autonomously from there until the milestone is complete or a blocking issue surfaces.

Each milestone gets its own git worktree. This means milestone work is physically isolated from the main branch. If the milestone goes wrong, the worktree is abandoned. No damage to main.

### Slice

A slice is one demoable vertical capability -- not a horizontal layer, but a working feature that can be shown to a human. A slice contains 1-7 tasks and lives on its own git branch (`gsd/M001/S01`). When a slice is complete, it is squash-merged to main.

The slice is the unit of risk management. If a slice encounters an unrecoverable error, the branch is abandoned and work can restart from the last clean merge point. This is not theoretical -- crash recovery depends on the slice boundary being clean.

### Task

A task is the atomic unit of LLM execution. The iron rule:

> **A task must fit in one 200k-token context window. If it cannot, it is two tasks.**

This is the foundational constraint. Everything else in GSD-2's architecture follows from it. Fresh context windows only eliminate context rot if the unit of work always fits within one. If a task can grow to require two windows, the system's core guarantee breaks.

**Mapping to skill-creator concepts:**

| GSD-2 | Skill-Creator | Notes |
|-------|--------------|-------|
| Milestone | Milestone | Shippable version boundary |
| Slice | Wave | Demoable capability group |
| Task | Component | Single context-window unit |
| `.gsd/` state files | `.planning/` state files | File-based state persistence |

The vocabulary differs but the execution semantics are structurally identical. Both systems independently converged on the same insight: decompose work into units small enough for a single context window, group them into parallelizable batches, and sequence batches by dependency.

---

## 3. The Extension System

GSD-2 ships 19 extensions, all loaded automatically at session start. Extensions are not optional plugins. They are behavioral knowledge injected into every agent session -- instructions, protocols, and conventions that make the LLM effective within the GSD-2 execution model.

The extension system is the bus protocol. It is the mechanism by which GSD-2's accumulated knowledge about how to build software reaches the LLM that does the building. Without extensions, each fresh context window starts from zero. With extensions, it starts from a known-good operational baseline.

### Complete Extension Inventory

| # | Extension | Capability | SC Relevance |
|---|-----------|-----------|--------------|
| 1 | **GSD** | Core workflow engine: auto mode state machine, phase transitions, commands, dashboard, milestone/slice/task management | Critical |
| 2 | **Browser Tools** | Playwright browser automation with form intelligence, visual diffing, screenshot capture, DOM inspection | Low |
| 3 | **Search the Web** | Multi-provider web search via Brave, Tavily, and Jina APIs with result synthesis | Medium |
| 4 | **Google Search** | Gemini-powered search with AI-generated answers and source attribution | Medium |
| 5 | **Context7** | Library and framework documentation lookup -- retrieves current API docs for dependencies | High |
| 6 | **Background Shell** | Long-running process management for dev servers, watchers, and background services during task execution | Low |
| 7 | **Async Jobs** | Background bash job execution with job tracking, status polling, and result collection | Low |
| 8 | **Subagent** | Delegated task execution in isolated context windows -- the mechanism for parallel work within a task | Critical |
| 9 | **GitHub** | GitHub issue and pull request management -- creating, reading, updating PRs and issues | Medium |
| 10 | **Mac Tools** | macOS Accessibility API automation for UI interaction, window management, and system control | Low |
| 11 | **MCP Client** | Native Model Context Protocol server integration -- connects to external MCP servers for tool access | Critical |
| 12 | **Voice** | Speech-to-text transcription for voice-driven interaction | Low |
| 13 | **Slash Commands** | Custom command creation and execution -- user-defined shortcuts and workflows | High |
| 14 | **Ask User Questions** | Structured input collection with select options, confirmations, and multi-choice prompts | Medium |
| 15 | **Secure Env Collect** | Masked secret and credential collection -- ensures sensitive values are never echoed or logged | Low |
| 16 | **Remote Questions** | Slack and Discord decision routing -- forwards questions to external channels for async human input | Medium |
| 17 | **Universal Config** | Import MCP server configurations from Cursor, VS Code, and other tools into GSD-2's environment | Medium |
| 18 | **AWS Auth** | AWS Bedrock credential refresh and authentication management | Low |
| 19 | **TTSR** | Type-safe runtime validation for structured data -- ensures data integrity across session boundaries | Medium |

### SC Relevance Classification

The **SC Relevance** column rates each extension's importance for skill-creator integration:

- **Critical** -- Skill-creator must understand and interact with these extensions. The GSD core defines the execution model. Subagent is the parallelism mechanism. MCP Client is the transport layer for external tool integration.
- **High** -- Skill-creator benefits from awareness of these extensions. Context7's documentation lookup pattern is analogous to skill discovery. Slash Commands represent user-defined behaviors that skill-creator could observe and learn from.
- **Medium** -- Relevant but not blocking. Search, GitHub, and question-routing extensions provide context about how the system gathers information and interacts with humans.
- **Low** -- Platform-specific or peripheral. Browser automation, voice, macOS tools, and credential management are operational details that don't affect skill-creator's integration architecture.

### Extension Loading Architecture

```
User invokes: gsd <command>
     |
     v
CLI startup → sync extensions to ~/.gsd/agent/
     |                (always-overwrite pattern)
     v
Pi SDK session created
     |
     v
Extensions injected into session context
     |
     v
Task dispatch prompt constructed
     |
     v
LLM executes with full extension knowledge
```

The always-overwrite sync is deliberate. Extension files are managed artifacts -- they belong to GSD-2, not the user. This eliminates version skew between the CLI and its behavioral instructions. When GSD-2 updates, extensions update with it. No manual step, no stale files.

> *Extensions are knowledge, not features. They don't add capabilities to the CLI. They add understanding to the LLM. The difference is fundamental: a feature is code that runs; an extension is context that informs.*

---

## 4. Auto Mode State Machine

Auto mode is GSD-2's primary execution path. Once the user approves a milestone roadmap, the system executes autonomously -- researching, planning, executing, verifying, and reassessing without human intervention until the milestone is complete or a blocking issue surfaces.

### The Execution Loop

```
                    +---> Research
                    |         |
                    |         v
User approves  ----+      Plan (decompose into tasks)
milestone           |         |
                    |         v
                    |      Execute (fresh context per task)
                    |         |
                    |         v
                    |      Complete (verify + squash merge)
                    |         |
                    |         v
                    +---- Reassess Roadmap
                              |
                         Next Slice (or milestone complete)
```

The loop is: **Plan -> Execute (per task, fresh context) -> Complete -> Reassess Roadmap -> Next Slice.** Research is integrated into the plan phase -- the system investigates what it needs before decomposing work.

### Ten Key Behaviors

These are the operational behaviors that define auto mode and that any integration (including skill-creator) must understand and respect:

**1. Fresh session per unit.** Every task gets a clean 200k-token context window. No accumulated state from previous tasks. No context rot. This is not an optimization -- it is the core guarantee.

**2. Context pre-loading.** The dispatch prompt includes all relevant context pre-inlined: the task plan, prior task summaries, relevant decisions, project configuration, and activated skills. The LLM never needs to search for context -- it arrives with everything it needs.

**3. Git worktree isolation.** Each milestone runs in its own git worktree. Each slice runs on its own branch within that worktree. Work is physically isolated from the main branch. If something goes wrong, the worktree or branch is abandoned without affecting main.

**4. Crash recovery via lock files and session forensics.** If a task crashes -- LLM timeout, API error, process kill -- GSD-2 detects the incomplete state on the next startup. Lock files indicate which task was in progress. Session forensics reconstruct what was accomplished before the crash. Recovery starts from the last known-good state, not from scratch.

**5. Sliding-window stuck detection with diagnostic retry.** GSD-2 monitors task execution for signs of stuck behavior: repeated tool calls with the same arguments, output that doesn't change between iterations, or excessive time without progress. When stuck detection triggers, the system injects diagnostic context into a retry -- explaining what appears to be stuck and suggesting alternative approaches.

**6. Timeout supervision (soft/idle/hard thresholds).** Three timeout levels protect against runaway execution:
- **Soft timeout:** Warning injected into context, suggesting the task should wrap up
- **Idle timeout:** No tool calls for a threshold period -- likely stuck
- **Hard timeout:** Task killed, crash recovery triggered

**7. Cost tracking per unit, per phase, per model.** Every token consumed is attributed to a specific task, phase, and model. This enables budget enforcement, cost-per-feature analysis, and the token optimization profiles described in Section 7.

**8. Adaptive replanning after each slice.** The Reassess phase reviews whether the original roadmap still makes sense after each completed slice. Research findings might reveal that planned slices can be merged, dependencies don't exist, or the problem is different than originally understood. Reassess prevents the system from mechanically executing a plan that recent work proved was wrong.

**9. Verification enforcement with auto-fix retries.** Each task has must-have criteria defined in the plan. After execution, GSD-2 verifies these criteria automatically. If verification fails, the system attempts auto-fix -- a retry with the verification failure as additional context. Only after retry exhaustion does the task escalate.

**10. Milestone validation gate.** Before a milestone is marked complete, the entire deliverable is validated against the original milestone criteria. This is a human-in-the-loop checkpoint -- the system presents results and the user approves or rejects.

---

## 5. Dispatch Pipeline

The dispatch pipeline is the integration surface for skill-creator. This is where GSD-2 constructs the prompt that will drive a fresh agent session, and it is where skill-creator can inject relevant skills, observe patterns, and influence execution.

### Pipeline Steps

```
Step 1: Read STATE.md
   |  Determine current milestone, slice, task, and phase.
   |  Parse completion markers, blockers, and decisions.
   v
Step 2: Determine Next Unit
   |  If current task is complete, advance to next task.
   |  If current slice is complete, trigger Reassess and advance to next slice.
   |  If current milestone is complete, surface validation gate.
   v
Step 3: Pre-Inline Relevant Files
   |  Build the dispatch prompt by inlining:
   |    - Task plan (T0N-PLAN.md)
   |    - Prior task summaries (T01-SUMMARY.md through T0N-1-SUMMARY.md)
   |    - Slice context (S0N-CONTEXT.md)
   |    - Research findings (M001-RESEARCH.md)
   |    - Project configuration (PROJECT.md)
   |    - Active extension content
   |    - [SKILL-CREATOR HOOK: inject relevant skills here]
   v
Step 4: Create Fresh Agent Session
   |  Instantiate a new Pi SDK session.
   |  Set model based on token optimization profile.
   |  Load tool definitions from active extensions.
   |  Inject constructed dispatch prompt.
   v
Step 5: Execute
   |  LLM processes the dispatch prompt and executes the task.
   |  Tool calls are routed through Pi SDK's tool-calling infrastructure.
   |  [SKILL-CREATOR HOOK: observe execution patterns]
   v
Step 6: Write Results to .gsd/
   |  Task summary written to T0N-SUMMARY.md.
   |  State updated. Lock file released.
   |  [SKILL-CREATOR HOOK: read summary, extract patterns]
```

### The Integration Surface

Skill-creator hooks into three points in this pipeline:

**Step 3 (injection):** Before the dispatch prompt is finalized, skill-creator evaluates the task plan's domain, file types, and historical patterns to select relevant skills for injection. Under the budget token optimization profile, injection is minimal (zero or one skill). Under quality, full skill context is provided.

**Step 5 (observation):** During execution, skill-creator can observe tool call sequences, file access patterns, and error-recovery strategies. This observation is passive -- it does not modify the agent's behavior during execution.

**Step 6 (extraction):** After task completion, skill-creator reads the task summary and extracts patterns for the PatternAggregator. Tool sequences, verification outcomes, and error patterns feed the learning pipeline.

> *The dispatch pipeline is not just how GSD-2 runs tasks. It is the bus protocol -- the shared communication channel where each component (state machine, extensions, skills, and eventually skill-creator) contributes its piece without stepping on the others.*

---

## 6. Existing Skills System

GSD-2 already has a skills system. It is not sophisticated -- it is a static configuration system, not a learning system -- but it provides the infrastructure that skill-creator would enhance.

### Configuration Parameters

| Parameter | Values | Purpose |
|-----------|--------|---------|
| `skill_discovery` | `auto` / `suggest` / `off` | How skills are found and activated |
| `always_use_skills` | Array of skill names | Skills loaded into every dispatch, regardless of task domain |
| `skill_rules` | Pattern-to-skill mappings | Situational routing: "when the task involves X, activate skill Y" |
| `skill_staleness_days` | Integer (default: 30) | Skills not activated within this window are deprioritized |

### Discovery Modes

**Auto:** GSD-2 automatically discovers and activates relevant skills based on project context, file types, and task descriptions. No user intervention needed. This is the default mode.

**Suggest:** GSD-2 identifies potentially relevant skills and presents them to the user for approval before activation. The user retains control over which skills are loaded.

**Off:** No skill discovery. Only `always_use_skills` are loaded.

### What Skill-Creator Would Change

The current skills system is static. Skills are defined in configuration files, discovered by pattern matching against file paths and task descriptions, and activated or deactivated by rules that don't change over time.

Skill-creator would transform this into a dynamic, observation-driven system:

| Current (Static) | With Skill-Creator (Dynamic) |
|------------------|------------------------------|
| Skills defined in config files | Skills generated from observed patterns |
| Pattern matching against file paths | Behavioral matching against tool sequences and outcomes |
| Fixed `skill_rules` | Rules that evolve based on activation effectiveness |
| `skill_staleness_days` as crude aging | Effectiveness scoring with feedback loops |
| Manual skill authoring | Automated skill generation from repeated patterns |
| No learning | Pattern aggregation, skill extraction, bounded refinement |

The existing infrastructure -- discovery modes, routing rules, staleness tracking -- provides the scaffolding. Skill-creator adds the intelligence.

---

## 7. Token Optimization Profiles

GSD-2 recognizes that not every task requires the most expensive model, and not every project has an unlimited token budget. The token optimization system provides three profiles that balance cost against quality.

### Profile Definitions

| Profile | Savings | Research Phase | Model Selection | Skill Injection |
|---------|---------|---------------|----------------|-----------------|
| **Budget** | 40-60% | Skipped | Cheapest capable model | Minimal (0-1 skills) |
| **Balanced** | 10-20% | Abbreviated | Default model mix | Standard (1-2 skills) |
| **Quality** | 0% | Full | Best available models | Full (up to 3 skills) |

### Complexity-Based Model Routing

Tasks are classified by complexity and routed to appropriate models:

| Complexity | Characteristics | Budget Model | Balanced Model | Quality Model |
|------------|----------------|-------------|----------------|---------------|
| **Simple** | Scaffolding, boilerplate, config changes | Haiku-class | Haiku-class | Sonnet-class |
| **Standard** | Feature implementation, test writing, refactoring | Haiku-class | Sonnet-class | Sonnet-class |
| **Complex** | Architecture decisions, cross-cutting concerns, synthesis | Sonnet-class | Sonnet-class | Opus-class |

### Budget Pressure Thresholds

As token consumption approaches the budget ceiling, GSD-2 applies progressive cost reduction:

| Threshold | Action |
|-----------|--------|
| **50% consumed** | Research phases shortened; non-critical verification deferred |
| **75% consumed** | Model downgrading for simple tasks; skill injection reduced |
| **90% consumed** | All tasks routed to cheapest model; research skipped entirely; verification minimal |

### Implications for Skill-Creator

Skill-creator's observation overhead must respect the active profile. Under budget mode, observation is minimal -- read task summaries after completion, but do not inject skills or run pattern analysis during dispatch. Under quality mode, full observation is permitted: skill injection at dispatch, real-time pattern extraction during execution, and comprehensive post-task analysis.

The hard constraint: **skill-creator's overhead must never exceed 2% of the task's token budget.** This is a resource cap enforced at the extension level. Under budget mode at 90% threshold, 2% of a reduced budget is a very small number. Skill-creator must degrade gracefully.

> *Token optimization is not just about saving money. It is about resource-aware execution. A system that consumes more tokens than the task warrants is a system that has lost track of the relationship between cost and value. Skill-creator must internalize this relationship.*

---

## 8. Bundled Agents

GSD-2 ships three specialized subagents, each designed for a specific class of work. Subagents run in isolated context windows -- they do not share context with the dispatching task. This isolation is the mechanism that enables parallel work within a single task.

### The Three Subagents

| Agent | Purpose | Context | Typical Use |
|-------|---------|---------|-------------|
| **Scout** | Fast codebase reconnaissance | Isolated, read-only | Survey file structure, find patterns, identify dependencies before planning |
| **Researcher** | Web research and synthesis | Isolated, with search tools | Investigate libraries, check documentation, gather external information |
| **Worker** | General-purpose execution | Isolated, full tools | Execute subtasks that can be parallelized within a larger task |

**Scout** is the fastest subagent. It performs read-only operations: scanning directory structures, reading file headers, counting patterns, and producing structured summaries. Scout is used during the research phase and at the beginning of complex tasks to build a map of the relevant codebase.

**Researcher** has access to web search tools (Brave, Tavily, Jina, Google). It investigates external resources: library documentation, API references, Stack Overflow patterns, and competitive analysis. Researcher produces synthesis documents that are inlined into subsequent dispatch prompts.

**Worker** is the general-purpose execution subagent. It has access to all tools (file operations, shell commands, git) and is used for parallelizable subtasks within a larger task. When a task can be decomposed into independent units -- such as writing tests for multiple modules simultaneously -- Worker subagents execute in parallel.

### The Fourth Subagent: Observer

Skill-creator introduces a fourth subagent concept: **Observer**. Observer does not execute tasks. It reads completed task summaries, extracts patterns (tool sequences, file access patterns, error-recovery strategies, verification outcomes), and feeds the PatternAggregator.

Observer differs from the existing subagents in a fundamental way: it runs *after* task completion, not during execution. It is a post-processing agent, not an execution agent. This timing is important because it means Observer never competes with the task for context window space or token budget.

| Agent | When | Access | Output |
|-------|------|--------|--------|
| Scout | Before task | Read-only codebase | Structured survey |
| Researcher | Before/during task | Web search | Synthesis document |
| Worker | During task | Full tools | Task deliverable |
| **Observer** | After task | Read-only summaries | Pattern extraction |

> *Scout maps the terrain. Researcher gathers intelligence. Worker builds the thing. Observer watches and learns. Four roles, four timing slots, zero contention.*

---

## 9. The Amiga Principle: GSD-2 as the Application Layer

The Amiga's power came from three custom chips working together through a shared bus:

- **Agnus** -- the coordinator, managing DMA and resource allocation
- **Paula** -- the I/O controller, handling audio, serial, and interrupt management
- **Denise** -- the creative engine, generating graphics and display output

The Pi/GSD/skill-creator stack maps to this architecture:

| Amiga Chip | Role | Ecosystem Component | Function |
|-----------|------|---------------------|----------|
| **Agnus** | Coordinator | Pi SDK | Unified LLM API, session management, resource allocation across 20+ providers |
| **Paula** | I/O Controller | GSD-2 | Execution phases, verification, human interaction, disk state management |
| **Denise** | Creative Engine | Skill-Creator | Pattern observation, skill generation, adaptive learning, intelligence creation |

GSD-2 is the application layer -- the system that brings Pi (Agnus) and skill-creator (Denise) together. Its extension system is the bus protocol. Its dispatch pipeline is the DMA controller. Its state machine is the clock that synchronizes everything.

The Amiga's bus protocol had specific properties that made the chip cooperation work:

1. **Shared memory** -- all chips could read/write the same address space (for GSD-2: `.gsd/` files on disk)
2. **Time-sliced access** -- each chip got its cycles without contention (for GSD-2: sequential phases with fresh context windows)
3. **Well-defined interfaces** -- each chip exposed specific registers (for GSD-2: extension hooks, dispatch pipeline steps, tool definitions)
4. **Independent operation** -- each chip ran its own logic between bus cycles (for GSD-2: each component does its work in its own context)

The extension system is the bus. Skill-creator as extension #20 participates in the same protocol as the 19 built-in extensions: it registers hooks, provides tools, and injects knowledge into dispatch prompts. It does not need a special integration path. The bus is already there.

> *The Amiga didn't win by having the fastest processor. It won because three specialized chips communicated through a shared bus with zero wasted cycles. The Pi/GSD/skill-creator stack follows the same principle: specialized components, well-defined interfaces, shared state on disk.*

---

## 10. Cross-References

| Module | Relevance to This Module |
|--------|------------------------|
| [Module 01: Pi-Mono SDK Architecture](01-pi-sdk-architecture.md) | GSD-2 is built on the Pi SDK. The agent-core runtime, tool-calling infrastructure, and session management described in Module 01 are the foundation on which GSD-2's state machine operates. |
| [Module 02: GSD v1 Context Engineering](02-gsd-v1-context-engineering.md) | GSD v1 established the context artifacts (PROJECT.md, REQUIREMENTS.md, ROADMAP.md) that GSD-2 inherits and manages through its state machine. The wave execution model, meta-prompting patterns, and model profiles all originated in v1. |
| [Module 05: Bridge Architecture](05-bridge-architecture.md) | The bridge specification defines the concrete TypeScript interfaces for skill-creator as GSD-2 extension #20 -- the extension manifest, dispatch hooks, observation pipeline, and skill injection protocol. |
| [GSD2 Research: Architecture & State Machine](../../GSD2/research/01-architecture-state-machine.md) | Detailed analysis of GSD-2's state machine topology, execution loop, and crash recovery. Complements this module's focus on the extension system and dispatch pipeline. |
| [GSD2 Research: Extensions & Subagents](../../GSD2/research/03-extensions-subagents.md) | Deep dive into the nine bundled extensions and three subagents. This module expands the catalog to all 19 extensions and adds the Observer subagent concept. |

---

## 11. Sources

### Primary Repository

- **gsd-build/gsd-2** -- [github.com/gsd-build/gsd-2](https://github.com/gsd-build/gsd-2)
  - Version: v2.43.0
  - Stars: 2.9k
  - Commits: 1,768
  - License: MIT
  - Language: TypeScript 92.5%
  - npm package: `gsd-pi`

### Related Repositories

- **badlogic/pi-mono** -- [github.com/badlogic/pi-mono](https://github.com/badlogic/pi-mono) (v0.62.0, 27.3k stars) -- the SDK on which GSD-2 is built
- **gsd-build/get-shit-done** -- [github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) (v1.28.0, 39.8k stars) -- the v1 prompt framework that GSD-2 operationalizes
- **gsd-build/docs** -- [github.com/gsd-build/docs](https://github.com/gsd-build/docs) -- Mintlify documentation layer (see Module 04)

### Documentation Sources

- GSD-2 `docs/` directory -- 17 documentation files covering auto mode, configuration, token optimization, cost management, git strategy, parallel orchestration, teams, skills, commands, architecture, troubleshooting, CI/CD, VS Code extension, visualizer, remote questions, and dynamic model routing
- GSD-2 extension files synced to `~/.gsd/agent/` -- behavioral knowledge injected into every session
- Pi SDK AGENTS.md -- project-level agent behavioral guidance (replaces CLAUDE.md convention)

### Tibsfox Ecosystem Analysis

- gsd-skill-creator-analysis.md -- current skill-creator architecture
- gsd-upstream-intelligence-pack-v1_43.md -- Anthropic channel monitoring (predecessor to this ecosystem analysis)
- gsd-amiga-vision-architectural-leverage.md -- the Amiga Principle applied to Pi/GSD/skill-creator
- gsd-chipset-architecture-vision.md -- chipset YAML specifications for agent topologies

---

*Module 3 of the Pi-Mono + GSD Ecosystem Upstream Intelligence Pack. This module documents GSD-2 as the target integration surface for skill-creator -- the application layer where Pi's agent runtime and skill-creator's adaptive learning converge through the extension system bus protocol.*
