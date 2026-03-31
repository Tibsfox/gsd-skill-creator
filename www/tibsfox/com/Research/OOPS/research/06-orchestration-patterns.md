# Orchestration Patterns — Gastown vs Claude Code's Agent Architecture

**Date:** 2026-03-31
**Context:** Deep comparison of gsd-skill-creator's Gastown chipset orchestration against Claude Code v2.1.88's internal agent architecture, based on binary string analysis and public API surface.

## The Two Systems

gsd-skill-creator developed a complete multi-agent orchestration system -- the Gastown chipset -- through empirical iteration over 50+ milestones. Claude Code developed its own agent orchestration internally, visible through binary string analysis and the evolving subagent API. Both systems solve the same fundamental problem: how do you coordinate multiple AI agents working on a shared codebase without them destroying each other's work?

The systems arrived at strikingly similar answers through independent development, but they diverged in important ways that reveal different design priorities. Gastown optimizes for autonomous batch execution at scale. Claude Code optimizes for interactive single-user orchestration with safety guarantees.

This document maps the two systems against each other, identifies where each has advantages, and charts a path toward convergence.

## Concept Map: Gastown to Claude Code

### Roles and Agent Types

| Gastown Concept | Claude Code Equivalent | Alignment |
|----------------|----------------------|-----------|
| Mayor (coordinator) | Parent agent / orchestrator | Strong parallel -- neither executes work directly |
| Polecat (worker) | `agent:custom` subagent | Direct mapping -- ephemeral execution unit |
| Witness (observer) | No visible equivalent | Gastown extension |
| Refinery (merge) | No visible equivalent | Gastown extension |
| Agent roles (mayor, polecat, witness, refinery, crew) | `agent:builtin` vs `agent:custom` | Gastown is more granular |

Claude Code's agent type system is binary: built-in agents (platform-provided behaviors) and custom agents (user-defined `.claude/agents/*.md` files). Gastown's role system is a five-role taxonomy where each role has strict behavioral boundaries enforced through skill documentation. A polecat never coordinates. A mayor never executes. A witness never modifies. These boundaries are enforced by convention (skill documentation) rather than by the runtime.

Claude Code's `agentPolicy` field suggests the platform is moving toward policy-based behavioral constraints on agents. If agentPolicy evolves to support role-based restrictions (this agent can read but not write, this agent can write but not spawn other agents), it would provide runtime enforcement for what Gastown currently enforces through documentation alone.

### Dispatch and Assignment

| Gastown Concept | Claude Code Equivalent | Alignment |
|----------------|----------------------|-----------|
| Sling (7-stage dispatch pipeline) | `dispatching` (visible in binary) | Parallel concept, different granularity |
| Hook (work assignment file) | Agent tool prompt parameter | Different mechanism, same purpose |
| Convoy (batch of work items) | No visible equivalent | Gastown extension |
| Formula (TOML template expansion) | No visible equivalent | Gastown extension |
| Bead (work item unit) | Task description in agent prompt | Conceptual parallel |

Claude Code dispatches work to subagents through the Agent tool: you provide a prompt, the agent executes it, and returns the result. The dispatch is a single function call. Gastown's sling is a 7-stage pipeline (fetch, allocate, prepare, hook, store, launch, confirm) with crash recovery at every stage and idempotency guarantees. The sling can resume a partial dispatch after a process crash because each stage writes durable state before proceeding.

This difference reflects the design priority split. Claude Code assumes a reliable runtime -- the platform manages process lifecycle, so crash recovery at the dispatch level is unnecessary. Gastown assumes an unreliable runtime -- agents crash, sessions expire, context windows fill -- so every state transition must be durable and recoverable.

The `dispatching` string in Claude Code's binary suggests the platform is developing more sophisticated dispatch mechanisms. Whether this evolves toward Gastown's pipeline model or stays closer to the current single-call model will determine how much of the sling remains necessary.

### Communication Channels

| Gastown Concept | Claude Code Equivalent | Alignment |
|----------------|----------------------|-----------|
| Mail-async (durable filesystem messages) | Agent tool return values | Different paradigm entirely |
| Nudge-sync (ephemeral latest-wins signals) | `nudge` / `nudges` (binary strings) | Strong conceptual parallel |
| Hook-persistence (MMIO-style assignment) | Agent prompt injection | Similar purpose |
| Handoff channel | Context passing between agents | Similar purpose |

This is where the architectures diverge most significantly. Claude Code's inter-agent communication is synchronous and hierarchical: a parent spawns a child, the child runs to completion, the child returns a result, the parent processes it. There is no peer-to-peer communication between sibling agents. There is no persistent mailbox that survives agent termination.

Gastown implements four distinct communication channels with different durability and latency characteristics:

- **Mail** (durable, async, accumulating) -- survives crashes, persists 24 hours, multiple messages queue
- **Nudge** (ephemeral, sync, latest-wins) -- single file overwrite, fastest channel, health checks
- **Hook** (durable, pull-based, single-assignment) -- work binding, crash-recoverable
- **Handoff** (durable, one-shot) -- context transfer between agent generations

Claude Code's binary contains `nudge` and `nudges` strings, indicating the platform has or is developing a nudge-like mechanism. This suggests Anthropic recognized the same need Gastown identified: a lightweight signal channel for health monitoring that doesn't accumulate messages.

The absence of a durable mail equivalent in Claude Code is notable. The platform's parent-child model means communication happens through return values, not mailboxes. If Claude Code evolves toward peer-to-peer agent communication (sibling agents coordinating without routing through the parent), it will need something like mail-async.

### Supervision and Health

| Gastown Concept | Claude Code Equivalent | Alignment |
|----------------|----------------------|-----------|
| Witness-observer (PMU patrol loop) | `agent_busy` status tracking | Gastown is richer |
| Deacon heartbeat (timed health checks) | `agent_pending_messages` | Different mechanism |
| GUPP stall detection (configurable thresholds) | No visible equivalent | Gastown extension |
| Restart limits (3 restarts then human escalation) | No visible equivalent | Gastown extension |

Claude Code tracks agent status (`agent_busy`, `agent_pending_messages`) but does not appear to have an independent observer process that monitors agent health and sends nudges. The platform relies on the parent agent to manage its children -- if a child stalls, the parent detects it through timeout or non-response.

Gastown's witness-observer is a dedicated monitoring agent that runs independently of both the mayor (coordinator) and the polecats (workers). It implements the Deacon heartbeat pattern: periodic health checks with configurable thresholds and escalation ladders. If a polecat stalls, the witness nudges it. If the nudge fails, the witness escalates to the mayor. If the mayor's restart fails three times, the system escalates to a human.

This independent supervision is one of Gastown's genuine innovations. In Claude Code's model, if the parent agent crashes, its children are orphaned with no recovery path. In Gastown, the witness can detect orphaned polecats and alert the mayor (or a replacement mayor) to recover them.

### Teams

| Gastown Concept | Claude Code Equivalent | Alignment |
|----------------|----------------------|-----------|
| sc-dev-team (4-agent team: director, ops, comms, monitor) | `teams`, `team_name` | Strong parallel |
| uc-lab (autonomous mission control) | Team with shared context | Parallel concept |
| Mayor as team coordinator | Team parent/owner | Direct mapping |

Claude Code's binary reveals `teams` as a first-class concept: `team_name is required for TeamCreate` indicates teams are explicit entities with creation semantics, not just groupings. This aligns well with our sc-dev-team and uc-lab patterns, where a team is a named collection of agents with defined roles and shared mission context.

Our teams go further in one respect: role specialization. The sc-dev-team has four roles (lab-director on Opus for authority, flight-ops on Opus for operations, capcom on Sonnet for communications, watchdog on Haiku for monitoring), each using the model tier appropriate to its cognitive demands. Claude Code's team system likely routes all agents through the same model, using `effort` levels rather than model selection for cost optimization.

### State and Persistence

| Gastown Concept | Claude Code Equivalent | Alignment |
|----------------|----------------------|-----------|
| Beads-state (JSON files, atomic writes) | `worktree-state` (binary string) | Both use filesystem |
| StateManager API (typed CRUD) | Internal state management | Similar purpose |
| Merge queue (FIFO, sequential) | No visible equivalent | Gastown extension |
| Convoy tracking (batch progress) | No visible equivalent | Gastown extension |

Both systems use filesystem-based state persistence. Gastown's beads-state stores everything as individual JSON files with atomic write-then-rename operations. Claude Code's `worktree-state` suggests similar filesystem-based state tracking for worktree-isolated agents.

Gastown's merge queue (refinery-merge) has no visible Claude Code equivalent. The platform likely handles merge through the parent agent, which processes child results sequentially. Gastown's refinery is a dedicated merge processor that handles the rebase-test-merge-push pipeline independently, freeing the mayor to continue dispatching new work while merges proceed.

## Where Gastown Extends Beyond the Platform

### GUPP: The Anti-Passivity Engine

The Gas Town Universal Propulsion Principle is Gastown's most distinctive innovation. GUPP addresses a problem unique to LLM-based agents: RLHF training produces agents that prefer to wait for confirmation rather than act autonomously. GUPP overrides this trained passivity with an explicit execution mandate.

Claude Code's platform does not appear to have a GUPP equivalent. The platform trusts agents to execute when given a task. But empirical evidence from Gastown's development shows this trust is often misplaced -- agents stall, ask unnecessary clarifying questions, and summarize their plans instead of executing them. GUPP's per-runtime enforcement strategies (hook injection for Claude Code, startup fallback for Codex, polling for Gemini) and configurable thresholds (stall detection at 120-300s, nudge intervals at 30-120s, restart limits at 3 per bead) represent hard-won operational knowledge.

The Runtime HAL layer that adapts GUPP to different runtimes is particularly valuable. As multi-runtime orchestration becomes more common (orchestrating Claude Code agents alongside Codex or Gemini agents), runtime abstraction becomes essential. Claude Code's platform assumes it is the only runtime -- the HAL anticipates a multi-vendor future.

### The Convoy Model

Gastown's convoy pattern -- bundling related work items into a batch with aggregate progress tracking, parallel dispatch, and coordinated completion -- has no visible Claude Code equivalent. The platform's model is one parent spawning one child per task, with the parent manually tracking completion.

Convoys enable patterns like: dispatch 6 research agents in parallel, track aggregate progress as they complete, merge their results sequentially through the refinery, and report overall completion to the operator. This is the pattern behind the 360 engine's autonomous degree execution (57 releases produced this way) and the NASA mission series' parallel track execution.

### The Refinery: Sequential Merge as a First-Class Concept

When multiple agents write code in parallel, merging their results is a correctness-critical operation. Gastown treats merge as a first-class pipeline stage with its own dedicated agent (the refinery), strict FIFO ordering, and explicit conflict escalation. The refinery never auto-resolves conflicts because it cannot reason about code semantics -- it moves data between branches and halts when it encounters something it cannot handle.

Claude Code's platform handles merge implicitly: the parent agent processes child results and manually integrates them. This works for small numbers of agents but does not scale. With 4-6 parallel agents producing branches, the merge sequence matters and conflicts compound. Gastown learned this empirically and built the refinery to enforce deterministic merge ordering.

## Where the Platform Has Features We Could Use Better

### agentPolicy: Runtime-Enforced Boundaries

Gastown enforces agent role boundaries through documentation ("the polecat NEVER coordinates other agents"). Claude Code's `agentPolicy` suggests the platform can enforce boundaries at runtime. If we could express "this agent cannot use the Write tool" or "this agent can only modify files in src/tests/", the witness-observer's monitoring function could be partially replaced by platform enforcement.

**Action:** When agentPolicy becomes available in the public API, express our role boundaries as policies rather than documentation-only constraints. The witness still adds value for health monitoring, but behavioral boundaries would be enforced by the runtime.

### Worktree-State: Richer Isolation Tracking

Our agents use `isolation: worktree` in their frontmatter, and Claude Code creates worktrees for isolated execution. But we don't deeply track worktree lifecycle -- creation, health, cleanup, cross-worktree communication. The `worktree-state` string suggests the platform has more sophisticated worktree management than we're using.

**Action:** Build worktree lifecycle hooks into our dispatch pipeline. Track which worktrees are active, detect abandoned worktrees, and use worktree state as an additional health signal for the witness.

### Teams as First-Class Entities

Our sc-dev-team and uc-lab patterns predate Claude Code's team support. Now that teams are platform-native, we should build our teams using `TeamCreate` rather than manual agent spawning. This gives us whatever shared context, collective permissions, and lifecycle management the platform provides.

**Action:** Refactor sc-dev-team and uc-lab to use TeamCreate when available. Maintain our role specialization (different models per role) as an extension of the platform's team concept.

## Token Efficiency Analysis

Not all orchestration patterns cost the same. Token efficiency matters because every token spent on coordination is a token not spent on work.

### Token-Efficient Patterns

| Pattern | Why Efficient |
|---------|--------------|
| Hook assignment (single JSON file read) | ~50 tokens to check work assignment |
| Nudge (latest-wins, single file) | ~30 tokens per health check |
| Agent role boundaries (documented, not checked) | Zero runtime tokens -- boundaries are in the skill context |
| FIFO merge queue (no scheduling decisions) | No tokens spent deciding merge order |
| Convoy progress (computed from bead statuses) | One pass over member list, no AI reasoning needed |

### Token-Expensive Patterns

| Pattern | Why Expensive | Mitigation |
|---------|--------------|------------|
| Witness patrol loop (reads all agent states) | O(n) state reads per patrol cycle | Increase patrol interval for stable convoys |
| Mail polling (reads all unread messages) | Grows with message volume | 24-hour archival keeps mailbox small |
| GUPP preamble injection (full rules in context) | ~500 tokens per agent session | Cache preamble; only inject once per session |
| Mayor coordination (reads convoy, decides dispatch) | Complex reasoning per dispatch cycle | Batch decisions: dispatch entire convoy at once rather than one bead at a time |
| Sling 7-stage pipeline (7 state transitions per dispatch) | State writes at every stage | Acceptable cost for crash recoverability; skip Store stage for non-critical beads |

### Comparison with Claude Code's Token Profile

Claude Code's parent-child model is inherently token-efficient for small agent counts: the parent spawns a child, the child runs, the child returns. No polling, no mailboxes, no patrol loops. For 1-3 agents, this is cheaper than Gastown's full orchestration.

At 4+ agents, Gastown's patterns become more efficient because the coordination overhead is amortized. A single convoy dispatch replaces 4+ individual parent-child spawn-wait-process cycles. A single witness patrol monitors all agents rather than the parent maintaining individual tracking state for each child. The refinery processes merges without consuming the mayor's context window.

The crossover point -- where Gastown's overhead pays for itself -- is approximately 4 parallel agents. Below 4, use Claude Code's native agent spawning. At 4+, the convoy model reduces total token consumption by avoiding O(n) coordination context in the parent.

## The Path Forward

### Phase 1: Align with Platform Primitives (Now)

Use Claude Code's native features as the foundation:
- Teams via TeamCreate for agent grouping
- Worktree isolation via `isolation: worktree` in agent frontmatter
- Effort levels aligned with our GSD profiles
- agentPolicy for behavioral boundaries when available

### Phase 2: Layer Gastown's Extensions (Next Quarter)

Build our orchestration patterns as extensions of platform primitives, not replacements:
- Convoy wraps around TeamCreate, adding batch progress and parallel dispatch
- GUPP injects via hooks on top of the platform's agent spawning
- Witness monitors through worktree-state signals, not just filesystem polling
- Mail-async persists between team sessions, surviving context compaction

### Phase 3: Propose Upstream (v1.50+)

Patterns that prove their value should be proposed to the platform:
- GUPP's anti-passivity enforcement (most impactful -- benefits all users)
- Convoy batching for parallel agent work
- Refinery-style sequential merge for multi-agent branches
- Witness health monitoring as an independent supervision process

### Phase 4: Runtime Convergence (Long-Term)

As the platform evolves toward richer multi-agent orchestration, Gastown should converge:
- Replace filesystem state with platform state management when available
- Replace mail polling with platform event subscription when available
- Replace the sling pipeline with platform dispatch when it supports crash recovery
- Keep GUPP, the witness, and the refinery as differentiators until the platform absorbs them

## The Honest Assessment

Gastown and Claude Code's agent architecture solved the same problems independently and arrived at remarkably similar structural answers: named agents with defined roles, filesystem-based state, worktree isolation, dispatch mechanisms, health monitoring signals. The convergence validates both approaches.

Where Gastown went further -- GUPP propulsion, convoy batching, the refinery merge queue, independent witness supervision, multi-runtime HAL, four-channel communication -- these represent genuine innovations born from running large-scale autonomous agent workloads (57 autonomous releases, 190+ research projects, 720 NASA missions). These patterns were not designed in advance; they were extracted from operational failures and hardened through repetition.

Where Claude Code went further -- runtime-level enforcement via agentPolicy, first-class teams, worktree state management, effort-based cost optimization -- these represent platform advantages that we should adopt rather than replicate.

The strategic position is strong: we are one of the most deeply integrated projects on the platform, and our orchestration patterns fill gaps the platform has not yet addressed. The path forward is not replacement but layering -- use the platform's primitives as the foundation, layer our extensions on top, and contribute the patterns that prove their value back to the ecosystem.

The fundamental insight from this comparison: the platform is building toward what we have already built. Our job is not to build faster -- it is to build in a way that composes with whatever the platform ships next.
