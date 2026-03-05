# Survey: Agent Orchestration Frameworks

**Wanted:** w-gc-004 — Survey existing agent orchestration frameworks
**Author:** MapleFoxyBells
**Date:** 2026-03-04
**Status:** Complete

---

## Executive Summary

Four major multi-agent orchestration frameworks were surveyed and compared
against Gas City's declarative role format architecture. The frameworks span
a spectrum from minimal (OpenAI Swarm) to heavyweight (LangGraph), with
CrewAI and AutoGen occupying the middle ground.

**Key finding:** No surveyed framework uses a declarative configuration format
for agent roles. All define agents in code (Python classes or graph nodes).
Gas City's YAML-based declarative role format is architecturally distinct and
addresses a gap in the current landscape.

**Recommended borrowable patterns:**
1. CrewAI's `role/goal/backstory` triple — maps cleanly to Gas City's YAML role definitions
2. LangGraph's shared-state-with-reducers — applicable to Gas City's MessagePort system
3. Swarm's handoff transparency — every delegation visible as an explicit action
4. CrewAI's 4-tier memory hierarchy — Gas City's WorkState could evolve similarly

---

## Framework Comparison Matrix

| Dimension | AutoGen | CrewAI | LangGraph | Swarm | Gas City |
|-----------|---------|--------|-----------|-------|----------|
| **Role definition** | Python classes | Declarative strings | Graph nodes (code) | Python classes | YAML frontmatter + Markdown |
| **Task model** | Implicit (conversation) | Explicit (Task objects) | Graph routing | Conversation-driven | WorkState + QueueManager |
| **Orchestration** | RoundRobin / Selector / Swarm | Sequential / Hierarchical / Flows | Arbitrary graphs (DAG/cyclic) | Linear handoff chain | 5 team topologies + 3-layer pipeline |
| **Communication** | Async broadcast | Task output chaining | Shared state + reducers | Context variables | MessagePort (FIFO + priority) |
| **Memory** | Via extensions (Mem0) | Built-in 4-tier | Short + long term | None (stateless) | WorkState + Cedar append-only log |
| **Persistence** | In-memory | Task outputs | Built-in checkpointing | None | YAML state files + Dolt SQL |
| **Human-in-loop** | UserProxyAgent | Limited | First-class | None | HumanReadableDashboard + approval gates |
| **Declarative config** | No | Partial (strings) | No | No | Yes (YAML/Markdown) |
| **Federation** | No | No | No | No | Yes (Wasteland/MVR protocol) |
| **Provider lock-in** | Any | Any | Any (via LangChain) | OpenAI only | Any (Claude-native) |
| **Production status** | Maintenance mode | Active (12M exec/day) | GA (v1.0) | Superseded | Active development |
| **Backing** | Microsoft (winding down) | CrewAI Inc. (VC) | LangChain Inc. (VC) | OpenAI (deprecated) | Independent |

---

## 1. Microsoft AutoGen

**Architecture:** Three-layer (Core → AgentChat → Extensions). Event-driven
async messaging foundation with pre-built agent types and team patterns.

**Agent model:** Programmatic. Agents are Python classes inheriting from
`ConversableAgent`. Types include `AssistantAgent` (AI-powered),
`UserProxyAgent` (human proxy), and custom subclasses.

**Orchestration patterns:**
- **RoundRobinGroupChat** — fixed turn order, mechanical rotation
- **SelectorGroupChat** — LLM selects next speaker based on context
- **Swarm** — dynamic handoffs via `HandoffMessage`, no central coordinator
- **Nested chats / SocietyOfMind** — recursive agent composition

**Communication:** Async message broadcast within GroupChat. All agents see
all messages during their turn. `HandoffMessage` for explicit delegation.

**Strengths:**
- Conversation programming paradigm — natural expression of multi-agent work
- Nested chat enables recursive decomposition (SocietyOfMind)
- Built-in OpenTelemetry observability
- Pluggable runtimes and model clients
- 50.4k GitHub stars, mature codebase

**Weaknesses:**
- **Entering maintenance mode** — Microsoft shifting to Agent Framework
- No native task abstraction — work assigned implicitly through conversation
- GroupChat Manager is a single point of failure
- Heavyweight for simple workflows
- No declarative role format

**Status:** Stable but winding down. February 2026 was last release. Microsoft
recommends migrating to Microsoft Agent Framework (converges AutoGen + Semantic
Kernel).

**Gas City comparison:** AutoGen's Swarm pattern (autonomous handoffs) is
conceptually similar to Gas City's `swarm` team topology. The SocietyOfMind
nested chat maps to Gas City's muse fork/execute/merge pipeline. Key
difference: AutoGen defines everything in code; Gas City uses declarative YAML.

---

## 2. CrewAI

**Architecture:** Dual system — **Crews** (autonomous agent teams) and
**Flows** (deterministic event-driven pipelines). Production pattern: Flow
backbone with Crew steps for complex reasoning.

**Agent model:** Declarative strings. Agents defined by `role` (what they are),
`goal` (what they want), and `backstory` (context and personality). Natural
language, not code structure.

**Orchestration patterns:**
- **Sequential** — tasks execute in order, outputs chain forward
- **Hierarchical** — Manager Agent distributes to Worker Agents
- **Consensus** — collaborative agreement (less documented)
- **Flows** — decorators, state management, conditional branching

**Communication:** Task output chaining (primary), delegation between agents,
shared crew memory. No free-form agent-to-agent messaging.

**Memory:** Most sophisticated built-in system of all surveyed frameworks:
- Short-term (within execution)
- Long-term (across executions)
- Entity (tracks specific concepts)
- Contextual (hierarchical scope tree)
- Auto-injection before tasks, auto-extraction after

**Strengths:**
- Lowest barrier to entry — declarative role definitions are intuitive
- Explicit Task model — first-class work packets with expected outputs
- Flows handle 12M+ executions/day in production
- 4-tier memory system
- MCP tool integration

**Weaknesses:**
- Limited fine-grained control for complex conditional logic
- No native checkpointing or mid-flow resume
- Debugging friction (logging inside Tasks is awkward)
- Context bloat with chatty agents

**Status:** Actively developed. February 2026 release. ~25k GitHub stars.
100k+ certified developers. VC-backed with commercial platform.

**Gas City comparison:** Closest architectural match. CrewAI's
`role/goal/backstory` triple maps directly to Gas City's YAML role definitions
(`role`, `context`, `activationTrigger`). CrewAI's Task model parallels Gas
City's `QueueManager`. Key differences: Gas City adds federation (Wasteland),
content-addressed integrity (Cedar), and 3-layer observe/detect/compose
pipeline. CrewAI lacks federation entirely.

---

## 3. LangGraph (LangChain)

**Architecture:** Graph-based. Core primitive is `StateGraph` — a compiled
directed graph parameterized by a state schema. Nodes perform computation,
edges route execution, conditional edges branch on state values.

**Agent model:** Nodes in a graph. Each node is a function that receives state
and returns updated state. Agents are not first-class — they're graph
positions. Subgraphs enable hierarchical composition.

**Orchestration patterns:**
- **Supervisor** — central agent routes to specialized workers
- **Hierarchical** — multi-level supervisors managing worker teams
- **Network** — peer-to-peer direct agent communication
- **Graph composition** — subgraphs as nodes for recursive nesting

**Communication:** Shared mutable state with reducer functions. All nodes
read/write a single global state object. `Annotated` types pair fields with
merge semantics (e.g., `add_messages` for chat history). Tool-based handoffs
for agent transfers.

**Strengths:**
- Fine-grained control — explicit graph structure, fully deterministic
- Built-in persistence and checkpointing — resume, time-travel, fault recovery
- First-class human-in-the-loop via checkpoint-based pause/approve/resume
- Streaming intermediate results from any node
- GA v1.0 — production-ready, used by Uber, LinkedIn, Klarna
- Both Python and JS/TS implementations

**Weaknesses:**
- High complexity and learning curve
- Performance degrades as graphs grow
- Agents can't self-organize or dynamically create tasks
- Tight LangChain ecosystem coupling
- Significant glue code for real integrations
- Risk of infinite loops with cyclic subgraphs

**Status:** GA v1.0. Very active development. LangGraph Platform for managed
deployment. Well-funded by LangChain Inc.

**Gas City comparison:** LangGraph's shared-state-with-reducers is more
sophisticated than Gas City's MessagePort for state management, but Gas City's
`PortMessage` priority system and ownership semantics prevent deadlocks —
something LangGraph doesn't address. LangGraph's checkpointing is stronger
than Gas City's YAML state persistence. Gas City's advantage: declarative
configuration, federation, and the 3-layer pipeline (observe/detect/compose)
that learns from execution patterns.

---

## 4. OpenAI Swarm (Experimental)

**Architecture:** Minimal. Two primitives: Agents (system prompt + tools) and
Handoffs (tool calls that return another Agent). ~100 lines of core code.
Stateless — each `run()` is equivalent to a Chat Completions API call.

**Agent model:** Python classes with `instructions` (system prompt), `functions`
(tools), and optional routines (natural-language scripts). Single active agent
at any time.

**Communication:** Context variables (key-value dict) passed to all agents.
Full conversation history preserved across handoffs. Every handoff is a visible
tool call.

**Strengths:**
- Extreme simplicity — three concepts total
- Full transparency — every handoff is explicit and observable
- Zero infrastructure requirements
- Excellent educational reference design

**Weaknesses:**
- Not production-ready (OpenAI's own label)
- Stateless — no memory, no checkpointing, no recovery
- OpenAI-only — locked to Chat Completions API
- **Superseded** by OpenAI Agents SDK (March 2025)

**Status:** Archived reference design. OpenAI Agents SDK is the production
successor (adds Guardrails, Sessions, Tracing). Not recommended for new work.

**Gas City comparison:** Swarm's handoff pattern is conceptually clean but
too primitive for Gas City's needs. Gas City already has richer handoff
semantics via MessagePort ownership tracking. Swarm's transparency principle
(every delegation visible) is worth preserving — Gas City's Cedar engine
serves this role by recording all actions in an append-only hash chain.

---

## Gap Analysis: What Gas City Has That Others Don't

### 1. Declarative Role Format (YAML + Markdown)
No surveyed framework uses file-based declarative configuration. All require
Python code to define agents. Gas City's `.claude/agents/*.md` format with
YAML frontmatter enables:
- Non-programmer role definition
- Version-controlled role evolution
- Runtime discovery via `GsdDiscoveryService`
- Sub-50ms cached lookups

### 2. Federation (Wasteland/MVR Protocol)
No surveyed framework supports federated multi-agent work across organizational
boundaries. Gas City's Wasteland integration provides:
- Cross-org task posting and claiming (wanted board)
- Portable reputation (stamps follow the handle)
- Versioned SQL state (Dolt) with git-style branching
- Trust tiers with decay mechanics

### 3. Content-Addressed Integrity (Cedar Engine)
No surveyed framework has a built-in integrity verification system for agent
outputs. Cedar provides:
- Append-only timeline with SHA-256 hash chain
- Voice consistency checking against muse vocabulary
- Tamper detection via `verifyIntegrity()`

### 4. 3-Layer Observe/Detect/Compose Pipeline
No surveyed framework learns from its own execution patterns to improve future
runs. Gas City's wasteland integration pipeline provides:
- Layer 1 (Observe): DoltScanner, AgentProfiler, TaskSequenceAnalyzer,
  TownTopologyMapper, FailureModeClassifier
- Layer 2 (Detect): AgentClustering, TaskDecomposition, RouteOptimizer,
  TeamCompositionEvaluator, SafetyGateSuggester
- Layer 3 (Compose): SkillMaterializer, PolicyGenerator, Dashboard,
  FeedbackIntegrator, ConfidenceDecaySimulator, MetaLearningInsights

### 5. Multi-Topology Team Templates
While other frameworks offer 1-3 orchestration patterns, Gas City supports
five team topologies: leader-worker, pipeline, swarm, router, map-reduce.
These are configurable via YAML, not hardcoded.

### 6. Complex Plane Positioning (Muse System)
No surveyed framework positions agents on a mathematical manifold for
activation scoring. Gas City's muses use complex plane coordinates
(theta, magnitude) to compute relevance and compose multi-muse consultations.

---

## Gap Analysis: What Gas City Could Borrow

### From CrewAI
1. **4-tier memory hierarchy** — Gas City's WorkState handles short-term; adding
   long-term, entity, and contextual memory would strengthen cross-session learning
2. **Expected output on tasks** — CrewAI's Task objects include `expected_output`,
   which enables automatic completion verification. Gas City's QueueManager could
   add this field.
3. **Flows for deterministic backbone** — CrewAI's decorator-based Flow system
   provides production reliability. Gas City's lifecycle coordinator serves a
   similar role but could formalize the pattern.

### From LangGraph
1. **Shared state with reducers** — Gas City's MessagePort could adopt reducer
   semantics for state merge conflicts rather than relying solely on priority
   ordering
2. **Checkpointing/time-travel** — LangGraph's persistence model enables mid-run
   resume and debugging. Gas City's YAML state could evolve toward this.
3. **Streaming intermediate results** — Gas City doesn't currently stream agent
   outputs; LangGraph's approach would improve observability.

### From Swarm
1. **Radical simplicity for onboarding** — A "Swarm mode" with minimal concepts
   (agent + handoff + context) could lower the barrier for new Gas City users
2. **Transparency principle** — Every delegation should be an observable event.
   Cedar already does this, but formalizing it as a protocol guarantee would
   strengthen trust.

### From AutoGen
1. **SocietyOfMind composition** — Nested agent teams that appear as a single
   agent to the outer context. Gas City's muse fork/execute/merge pipeline is
   similar but could be generalized.

---

## Landscape Summary

```
                    CONTROL
                      ▲
                      │
          LangGraph   │
          (graphs,    │
           reducers,  │
           checkpts)  │
                      │
                      │        Gas City
    AutoGen           │        (declarative roles,
    (conversation     │         federation,
     programming,     │         3-layer pipeline,
     nested chats)    │         muse system)
                      │
──────────────────────┼──────────────────────► AUTONOMY
                      │
          CrewAI      │
          (roles,     │
           tasks,     │
           memory,    │
           flows)     │
                      │
          Swarm       │
          (handoffs,  │
           minimal)   │
                      │
                      ▼
                  SIMPLICITY
```

Gas City occupies a unique position: high control (declarative config,
integrity verification, safety gates) combined with high autonomy (federation,
self-improving pipeline, muse activation scoring). No surveyed framework
attempts this combination.

---

## Recommendations

1. **Do not adopt any framework as a dependency.** Gas City's architecture is
   sufficiently differentiated that wrapping an existing framework would add
   coupling without proportional benefit.

2. **Borrow patterns, not code.** CrewAI's memory tiers, LangGraph's reducers,
   and Swarm's transparency principle are portable ideas that can be implemented
   within Gas City's existing architecture.

3. **Formalize the declarative role format as a specification.** Gas City's YAML
   agent format is its strongest differentiator. Publishing a spec would enable
   interop with other systems and establish Gas City's approach as a standard.

4. **Add expected_output to QueueManager tasks.** This simple addition from
   CrewAI's model enables automatic completion verification — a quick win.

5. **Consider a "simple mode" for onboarding.** Swarm proves that agent +
   handoff + context is enough for many use cases. A stripped-down Gas City
   mode could lower the barrier to entry.

---

*Survey conducted by MapleFoxyBells with research assistance from Cedar,
Sam, and Lex muse agents. Frameworks evaluated as of March 2026.*
