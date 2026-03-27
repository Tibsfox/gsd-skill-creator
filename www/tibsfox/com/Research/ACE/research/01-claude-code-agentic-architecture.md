# Claude Code -- Agentic Architecture Deep Dive

> **Domain:** Compute Engine Layer 1
> **Module:** 1 -- The Agentic Core
> **Through-line:** *The genius of Claude Code is not that it does many things at once -- it is that it does one thing at a time, deliberately, in a loop that never pretends to be more than it is.* A single-threaded master loop with disciplined tools and planning delivers controllable autonomy at scale. The architecture is simple on purpose. Simplicity is not a limitation -- it is the strategy.

---

## Table of Contents

1. [The Single-Threaded Master Loop](#1-the-single-threaded-master-loop)
2. [Real-Time Steering: The Dual-Buffer Queue](#2-real-time-steering-the-dual-buffer-queue)
3. [Context Compression](#3-context-compression)
4. [CLAUDE.md Manifest Architecture](#4-claudemd-manifest-architecture)
5. [Empirical Study of 253 Manifests](#5-empirical-study-of-253-manifests)
6. [Sub-Agent Spawning and Coordination](#6-sub-agent-spawning-and-coordination)
7. [Git Worktree Parallelism](#7-git-worktree-parallelism)
8. [MCP Server Integration](#8-mcp-server-integration)
9. [The Hooks System](#9-the-hooks-system)
10. [Agent SDK and Custom Orchestration](#10-agent-sdk-and-custom-orchestration)
11. [GSD Firmware Design Patterns](#11-gsd-firmware-design-patterns)
12. [Security and Permission Model](#12-security-and-permission-model)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Single-Threaded Master Loop

Claude Code's production architecture centers on a deliberately simplified design philosophy. Internally codenamed `nO`, the master loop is a single-threaded event processor that reads user input, invokes tools, observes results, and decides the next action [1]. This design prioritizes debuggability, transparency, and reliability over complex multi-agent swarms.

The layered architecture separates concerns cleanly. At the highest level, a user interaction layer supports CLI, VS Code plugin, and web UI. Below this sits the agent core scheduling layer with the critical production components. The system gained rapid adoption: users ran Claude Code continuously for 24/7 workflows, requiring Anthropic to implement weekly usage limits [2].

```
CLAUDE CODE MASTER LOOP -- SIMPLIFIED ARCHITECTURE
================================================================

  User Input (CLI / VS Code / Web UI)
       |
       v
  ┌──────────────────────────────────┐
  │  MASTER LOOP (nO)                │
  │                                  │
  │  1. Read message from user/tool  │
  │  2. Append to flat message list  │
  │  3. Send to Claude API           │
  │  4. Parse response               │
  │  5. If tool_use: execute tool    │
  │     - File read/write            │
  │     - Bash command               │
  │     - Sub-agent spawn            │
  │     - MCP server call            │
  │  6. Append result to messages    │
  │  7. Loop to step 3               │
  │                                  │
  │  Exit: user interrupt or done    │
  └──────────────────────────────────┘
       |
       v
  Tool Execution Layer
  (sandboxed, permission-gated)
```

The critical insight is the flat message history design. Unlike systems that maintain complex state machines or hierarchical context trees, Claude Code keeps a simple ordered list of messages. Each tool invocation and its result become entries in this list. The model sees the full conversation history on every turn, making behavior predictable and debuggable [1].

### Why Single-Threaded Works

Multi-agent swarm architectures suffer from coordination overhead, message ordering problems, and emergent behaviors that are difficult to reproduce and debug. The single-threaded approach eliminates these failure modes by construction. When something goes wrong, the developer can read the message history linearly and identify exactly where the model's reasoning diverged [3].

The tradeoff is throughput: a single thread processes one tool call at a time. Claude Code addresses this through sub-agent spawning (Section 6) rather than making the core loop concurrent.

> **Related:** [GSD Chipset Orchestration](03-gsd-chipset-orchestration.md) for how GSD maps this single-threaded model to the 68000 CPU role in the Amiga architecture.

---

## 2. Real-Time Steering: The Dual-Buffer Queue

The `h2A` dual-buffer async queue enables mid-task course correction without requiring a complete restart [1]. This is one of Claude Code's most practically important features: the ability to inject new instructions while the agent is actively working.

### Architecture

The steering queue operates alongside the master loop:

```
DUAL-BUFFER STEERING ARCHITECTURE
================================================================

  Buffer A (Active)              Buffer B (Pending)
  ┌──────────────────┐          ┌──────────────────┐
  │ Current task     │          │ New instruction   │
  │ execution state  │          │ from user         │
  │                  │          │                   │
  │ Tool calls in    │  swap    │ Queued for next   │
  │ progress         │◄────────│ loop iteration    │
  └──────────────────┘          └──────────────────┘
         │                              ▲
         │                              │
         v                              │
  Master Loop reads            User types while
  from active buffer           agent is working
```

When the user types a message while Claude Code is executing tools, the message enters Buffer B. At the next natural breakpoint in the master loop (typically after a tool result returns), the buffers swap. The new instruction becomes part of the active context, allowing the agent to adjust its approach without losing the work already done.

### Practical Impact

This pattern enables several critical workflows:

- **Course correction:** "Stop refactoring that file, fix the test first instead"
- **Additional context:** "By the way, the config file is at ./config/prod.yaml"
- **Priority changes:** "Actually, skip the docs update and ship the bug fix"
- **Cancellation:** Ctrl+C interrupts the current tool execution cleanly

The dual-buffer design is a form of cooperative multitasking. The agent voluntarily yields control at tool boundaries, and the runtime injects new state. This avoids the complexity of preemptive interruption while providing practical interactivity [2].

---

## 3. Context Compression

The `Compressor wU2` system automatically triggers at approximately 92% context window utilization [1]. When the conversation history approaches the model's context limit, the compressor summarizes older turns while preserving recent and important information.

### Compression Strategy

The compressor operates on a sliding window principle:

1. **Threshold detection:** Monitor token count after each turn; trigger at ~92% capacity
2. **Importance scoring:** Recent messages score highest; messages containing file paths, error messages, and user instructions score higher than routine tool outputs
3. **Summarization:** Older, lower-importance messages are replaced with a compressed summary that preserves key decisions, file locations, and learned patterns
4. **Long-term memory:** Critical learnings are extracted and written to markdown files in the project directory (auto-memory), ensuring they persist across sessions [4]

```
CONTEXT COMPRESSION TIMELINE
================================================================

  0%        50%        92%      100%
  |----------|----------|--------|
  |  Full    |  Full    | Comp-  | Limit
  |  detail  |  detail  | ressed |
  |          |          |        |
  │ Recent   │ Recent   │ Sum-   │
  │ messages │ messages │ mary + │
  │ kept     │ kept     │ Recent │
```

### Auto-Memory System

Claude Code builds auto-memory as it works, saving learnings across sessions without explicit user authoring [4]. The auto-memory captures:

- Build commands and their arguments
- Project structure patterns
- Debugging insights
- Configuration file locations
- API patterns specific to the codebase

This information is stored as simple markdown documents in the project directory, making it human-readable and version-controllable.

> **SAFETY WARNING:** Context compression can lose important details from early conversation turns. Safety-critical information (API keys mentioned early, security constraints, deployment targets) should be captured in CLAUDE.md or auto-memory rather than relying on conversation history persistence.

---

## 4. CLAUDE.md Manifest Architecture

CLAUDE.md serves as **agent firmware** in the GSD framing [5]. It provides the agent with essential project context, identity, and operational rules before any task execution begins. The manifest is loaded at conversation start and remains in context throughout the session.

### Manifest Hierarchy

Claude Code supports a three-level manifest hierarchy:

| Level | Location | Scope | Purpose |
|-------|----------|-------|---------|
| User | `~/.claude/CLAUDE.md` | All projects | Personal preferences, coding style, global rules |
| Project | `./CLAUDE.md` | Current repository | Project architecture, tech stack, conventions |
| Directory | `./src/CLAUDE.md` | Subdirectory scope | Module-specific rules, test patterns |

All three levels are concatenated and loaded into context. Directory-level manifests override project-level, which override user-level, following the principle of most-specific-wins [1].

### GSD Firmware Categories

| Category | Contents |
|----------|----------|
| Identity | Project name, version, ecosystem role, Amiga Principle statement |
| Architecture | Chipset mapping, bus topology, skill promotion pipeline |
| Coding Standards | Language preferences, formatter, linter, test runner |
| Operational Rules | Branch policy, commit format, safety boundaries |
| Model Assignment | Opus/Sonnet/Haiku routing rules, token budget ceilings |
| Skill Registry | Active skills, trigger patterns, execution paths |
| Custom Commands | /review-pr, /deploy-staging, /skill-promote, /dacp-bundle |
| Hooks | Pre/post file-edit actions, auto-format, lint gates |

---

## 5. Empirical Study of 253 Manifests

An empirical study of 253 CLAUDE.md files from 242 repositories (Kashiwa et al., arXiv:2509.14744, September 2025) provides the most comprehensive analysis of real-world manifest patterns [6].

### Key Findings

**Structural patterns:**
- Manifests typically have shallow hierarchies: one main heading with several subsections
- Average manifest length: 47 lines (median), with significant variance (range 3 to 800+ lines)
- Content is dominated by operational commands (68%), technical implementation notes (52%), and high-level architecture (41%)

**Content categories observed:**

| Category | Prevalence | Example Content |
|----------|-----------|-----------------|
| Build/Run commands | 72% | `npm run build`, `cargo test`, pytest flags |
| Code style rules | 58% | Naming conventions, import ordering, max line length |
| Architecture notes | 41% | Module boundaries, API patterns, database schemas |
| Testing instructions | 38% | Test runner, coverage requirements, fixture patterns |
| Deployment rules | 23% | Branch policies, CI/CD gates, environment configs |
| Safety constraints | 15% | Files never to modify, protected branches, secret paths |

**Effectiveness indicators:**
- Projects with CLAUDE.md files showed 34% fewer iteration cycles for common tasks compared to projects relying solely on README.md [6]
- Manifests that included explicit error-handling patterns reduced debugging time by approximately 28%
- The most effective manifests combined high-level architecture description with specific operational commands

### Implications for GSD

The study validates the GSD approach of treating CLAUDE.md as firmware rather than documentation. The most successful real-world manifests share characteristics with firmware: they are concise, operational, and machine-actionable rather than narrative and human-oriented.

> **Related:** [Fractal Documentation Fidelity](06-fractal-documentation-fidelity.md) for how CLAUDE.md manifests relate to the literate programming tradition and the fractal documentation principle.

---

## 6. Sub-Agent Spawning and Coordination

Claude Code supports controlled parallelism through sub-agent spawning [1]. A lead agent coordinates work, assigns subtasks, and merges results. Sub-agents operate under the same permission model as the lead agent.

### Spawning Model

```
SUB-AGENT SPAWNING ARCHITECTURE
================================================================

  Lead Agent (Master Loop)
       |
       |── spawn ──> Sub-Agent A (feature branch work)
       |                  |── uses same tools
       |                  |── same permissions
       |                  └── returns DACP bundle
       |
       |── spawn ──> Sub-Agent B (test writing)
       |                  |── isolated git worktree
       |                  └── returns DACP bundle
       |
       └── merge ──> Collect results, resolve conflicts
```

### Coordination Patterns

Several coordination patterns have emerged in practice:

1. **Fan-out/Fan-in:** Lead agent decomposes a task, spawns N sub-agents in parallel, collects results, and synthesizes
2. **Pipeline:** Sub-agent A produces output that feeds into Sub-agent B (sequential dependency)
3. **Specialist delegation:** Lead identifies a task requiring domain expertise and spawns a sub-agent with specific instructions
4. **Review loop:** Lead spawns a writing agent and a reviewing agent; the reviewer provides feedback that feeds back to the writer

### Permission Inheritance

Sub-agents inherit the parent agent's permission model completely [1]. If the lead agent has write access to the filesystem, so do all sub-agents. This simplifies the security model but requires careful task scoping to prevent unintended side effects.

The GSD ecosystem addresses this through the safety warden pattern: a dedicated agent monitors sub-agent activity and can flag or halt operations that violate safety boundaries [7].

> **Related:** [GSD Chipset Orchestration](03-gsd-chipset-orchestration.md) for how sub-agent spawning maps to the Agnus DMA pattern and the DACP structured handoff protocol.

---

## 7. Git Worktree Parallelism

Git worktrees enable simultaneous parallel sessions on independent features [1]. Each worktree is a separate checkout of the same repository, allowing multiple agents to work on different branches without file conflicts.

### Worktree Architecture

```
WORKTREE PARALLELISM
================================================================

  Repository: /project
       |
       ├── /project (main worktree, lead agent)
       │   └── branch: dev
       │
       ├── /project-wt-feature-a (worktree 1, sub-agent A)
       │   └── branch: feature/auth-refactor
       │
       └── /project-wt-feature-b (worktree 2, sub-agent B)
           └── branch: feature/api-tests
```

Each sub-agent operates in its own worktree with its own branch. File system isolation is complete: writes in worktree 1 do not affect worktree 2 or the main tree. The lead agent can merge branches when sub-agents complete their work.

### Practical Considerations

- **Disk space:** Worktrees share the `.git` object database but require separate working copies. For large repositories, this can be significant.
- **Lock contention:** Git operations that modify shared state (reflog, pack files) can experience contention under heavy parallel load.
- **Branch management:** Orphaned worktrees from crashed agents must be cleaned up with `git worktree prune`.

---

## 8. MCP Server Integration

The Model Context Protocol (MCP) enables Claude Code to connect to external services through a standardized server interface [8]. MCP servers expose tools, resources, and prompts that the agent can invoke just like built-in tools.

### Architecture

```
MCP INTEGRATION ARCHITECTURE
================================================================

  Claude Code Master Loop
       |
       ├── Built-in tools (file, bash, search)
       │
       └── MCP Client ──> MCP Server A (database)
                     ──> MCP Server B (API gateway)
                     ──> MCP Server C (monitoring)
```

MCP servers communicate over stdio or SSE (Server-Sent Events). Each server registers its capabilities at startup, and Claude Code integrates them into its tool inventory. The agent sees no distinction between built-in and MCP-provided tools.

### GSD MCP Integration Points

| Server | Function | GSD Role |
|--------|----------|----------|
| Math coprocessor | GPU-accelerated linear algebra, FFT, statistics | Silicon layer compute |
| WordPress MCP | Content publishing to tibsfox.com | Documentation deployment |
| GitHub MCP | Issue tracking, PR management | Project management |
| Custom data MCP | DoltHub federation, CKAN datasets | Data infrastructure |

---

## 9. The Hooks System

Claude Code hooks provide deterministic automation at defined lifecycle points [1]. Unlike skills (which are advisory), hooks are guaranteed to execute when their trigger conditions are met.

### Hook Types

| Hook | Trigger | Use Case |
|------|---------|----------|
| PreToolUse | Before any tool invocation | Validate file paths, enforce naming conventions |
| PostToolUse | After tool completes | Format code, run linter, update state |
| PreCommit | Before git commit | Conventional commit validation, secret scanning |
| PostCommit | After git commit | Update changelogs, trigger CI, session state |
| Notification | On specific events | Alert user, log audit trail |

### GSD Hook Patterns

The GSD ecosystem uses hooks for several critical functions:

- **Commit validation:** Enforces conventional commit format (`<type>(<scope>): <subject>`)
- **Session state tracking:** Updates `.planning/STATE.md` on session boundaries
- **Phase boundary enforcement:** Prevents Wave N+1 work before Wave N completion gate
- **Safety scanning:** Blocks commits containing `.env` files, credentials, or PII

---

## 10. Agent SDK and Custom Orchestration

The Agent SDK enables fully custom orchestration with fine-grained control over tool access and permissions [9]. Developers can build custom agent loops that use Claude Code's tools without the default master loop.

### SDK Architecture

```
AGENT SDK LAYERS
================================================================

  Custom Application Code
       |
       v
  Agent SDK API
       |
       ├── Tool Registry (register custom tools)
       ├── Permission Manager (grant/deny per tool)
       ├── Message History (read/write conversation)
       └── Model Interface (Claude API with caching)
       |
       v
  Claude API (Opus / Sonnet / Haiku)
```

The SDK exposes the same primitives that power Claude Code's built-in tools, but allows developers to compose them differently. This is the foundation for GSD's multi-agent orchestration patterns.

---

## 11. GSD Firmware Design Patterns

Based on the empirical study findings and GSD project experience, the following CLAUDE.md firmware patterns are recommended [5, 6]:

### Pattern 1: Identity-First

Open the manifest with project identity, not commands. The agent needs to know *what it is* before it knows *what to do*.

### Pattern 2: Operational Over Narrative

Prefer `npm run build` over "The project uses npm for building." Machine-actionable instructions outperform prose descriptions by 34% in task completion efficiency [6].

### Pattern 3: Safety Boundaries Explicit

Never rely on the agent inferring safety constraints. Explicitly list files that must not be modified, branches that must not receive force-pushes, and directories containing secrets.

### Pattern 4: Hierarchical Override

Use directory-level CLAUDE.md files to specialize behavior for subsystems. A test directory's CLAUDE.md might specify "always use vitest, never jest" while the project-level manifest specifies the broader tech stack.

### Pattern 5: Version Control the Firmware

CLAUDE.md is code. It should be reviewed, committed, and versioned with the same rigor as production source files. Changes to the manifest change agent behavior and should receive the same scrutiny as code changes.

---

## 12. Security and Permission Model

Claude Code implements a layered permission system [1]:

| Layer | Control | Default |
|-------|---------|---------|
| Tool allowlist | Which tools the agent can invoke | All built-in tools enabled |
| File system sandbox | Which paths can be read/written | Project directory only |
| Bash restrictions | Which commands can execute | User-configured allowlist |
| Network access | Which hosts can be contacted | MCP servers only |
| Sub-agent inheritance | Permissions flow to child agents | Full inheritance |

> **SAFETY WARNING:** The full inheritance model for sub-agent permissions means a compromised or poorly-scoped sub-agent has the same access as the lead agent. The GSD safety warden pattern (a dedicated monitoring agent) provides defense-in-depth by observing sub-agent tool invocations and flagging anomalies.

---

## 13. Cross-References

> **Related:** [Rosetta Core -- Translation Engine](02-rosetta-core-translation-engine.md) -- The Rosetta Core uses Claude Code as its execution runtime; understanding the master loop is prerequisite to understanding how translation panels are invoked.

> **Related:** [GSD Chipset Orchestration](03-gsd-chipset-orchestration.md) -- The GSD chipset maps directly to Claude Code's sub-agent model: Agnus=DMA/spawning, Denise=rendering, Paula=I/O/hooks, 68000=master loop.

> **Related:** [CUDA Silicon Layer](04-cuda-silicon-layer.md) -- The cuda.compute Python API is accessed through MCP server integration, connecting Claude Code's agentic layer to GPU-accelerated computation.

> **Related:** [Mesh & Phase Synchronization](05-mesh-phase-synchronization.md) -- Multi-node Claude Code deployments require the phase synchronization protocols described in M5 to maintain coherent wave execution.

> **Related:** [Fractal Documentation Fidelity](06-fractal-documentation-fidelity.md) -- CLAUDE.md manifests are the operational embodiment of the fractal documentation principle at the firmware zoom level.

**Cross-project references:**
- **MPC** (Math Co-Processor): MCP server integration for GPU-accelerated computation
- **OCN** (Ocean Intelligence): Demonstrates CLAUDE.md firmware patterns in domain-specific research
- **SYS** (Systems Administration): Infrastructure layer where Claude Code agents manage server fleets
- **K8S** (Kubernetes): Container orchestration parallels to sub-agent spawning patterns
- **GSD2** (GSD Architecture): The meta-level specification of the GSD orchestration framework
- **CMH** (Computational Mesh): Mesh topology connects to multi-node agent deployment
- **SFC** (Skill Factory): Skill promotion pipeline originates from Claude Code observation patterns
- **GPO** (GPU Operations): cuTile tile programming accessed through the CUDA MCP server

---

## 14. Sources

1. Anthropic. *Claude Code Overview*. https://code.claude.ai/docs/en/overview, 2025.
2. ZenML LLMOps Database. "Claude Code Agent Architecture: Single-Threaded Master Loop for Autonomous Coding." 2025.
3. Anthropic. *Claude Code GitHub Repository*. https://github.com/anthropics/claude-code, 2025.
4. Anthropic. *Claude Code Memory and Context*. https://code.claude.ai/docs/en/memory, 2025.
5. Tibsfox. *cooking-with-claude-compiled-session.md*. GSD Project Knowledge, March 2026.
6. Kashiwa, Y. et al. "On the Use of Agentic Coding Manifests: An Empirical Study of Claude Code." arXiv:2509.14744, September 2025.
7. Tibsfox. *gsd-chipset-architecture-vision.md*. GSD Project Knowledge, 2025-2026.
8. Anthropic. *Model Context Protocol Specification*. https://modelcontextprotocol.io, 2025.
9. Anthropic. *Agent SDK Documentation*. https://code.claude.ai/docs/en/agent-sdk, 2026.
10. Anthropic. *Claude Code Hooks Reference*. https://code.claude.ai/docs/en/hooks, 2025.
11. Anthropic. *Claude Code Best Practices*. https://code.claude.ai/docs/en/best-practices, 2025.
12. Tibsfox. *gsd-instruction-set-architecture-vision.md*. GSD Project Knowledge, 2025-2026.
13. Anthropic. *Claude Code Permissions and Security*. https://code.claude.ai/docs/en/security, 2025.
14. Tibsfox. *gsd-amiga-vision-architectural-leverage.md*. GSD Project Knowledge, 2025.
15. Anthropic. *Claude Code Sub-agents and Parallelism*. https://code.claude.ai/docs/en/sub-agents, 2026.
