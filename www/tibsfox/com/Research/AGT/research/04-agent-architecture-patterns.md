# Agent Architecture Patterns

> **Domain:** Agentic Infrastructure & Systems
> **Module:** AGT-04 -- Architecture Layer
> **Through-line:** *The architecture of an agentic system determines its failure modes. Single-agent systems are simple but brittle. Multi-agent systems are resilient but complex. Swarm topologies are emergent but unpredictable. The choice between them is not a matter of capability but of how much coordination overhead you can afford -- and that overhead has the same shape whether you are synchronizing agents, memory fences, or convoy stages.*

---

## Table of Contents

1. [Skybridge: Dual-Interface Architecture](#1-skybridge-dual-interface-architecture)
2. [AIP: Agent Identity as Architecture](#2-aip-agent-identity-as-architecture)
3. [CIMD: Metadata-Driven Trust](#3-cimd-metadata-driven-trust)
4. [Single-Agent Architecture](#4-single-agent-architecture)
5. [Multi-Agent Coordination](#5-multi-agent-coordination)
6. [Swarm Topologies](#6-swarm-topologies)
7. [Agent Lifecycle Management](#7-agent-lifecycle-management)
8. [Framework Comparison](#8-framework-comparison)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. Skybridge: Dual-Interface Architecture

Fred from Alpek (Paris, second appearance on The Context) presented Skybridge, an open-source fullstack TypeScript framework for building dual-interface chat applications. The architecture addresses a fundamental limitation of text-only agent interfaces: some information is better conveyed visually, and some interactions are more natural as form inputs than as natural language.

Skybridge's dual-interface model:

```
                    User
                   /    \
                  /      \
        Text Channel    Widget Channel
        (conversation)  (React/Svelte components)
                  \      /
                   \    /
               Synchronized State
                     |
               Model Context
          (sees both channels)
```

The synchronization challenge is the core architectural problem. When a user fills out a form widget, the model must be aware of the change without the user explicitly describing it in text. When the model generates a response, some information should appear as text and some should update widget state. The principle Fred articulated: "Don't say textually what you are showing in your widgets." Visual and textual information should complement, not duplicate.

The MCP app support adds another dimension: Skybridge applications can deploy as both ChatGPT-style apps and MCP apps from the same codebase. "Build once, deploy to multiple chat platforms." This cross-platform capability requires abstracting the interface layer from the agent logic layer.

For our Tauri desktop application (xterm.js terminal + Vite webview), the Skybridge pattern is directly applicable. The terminal provides the text channel, the webview provides the widget channel, and the Tauri IPC bridge synchronizes state between them. The architectural lesson: treat the two channels as complementary views of a single agent state, not as independent interfaces.

## 2. AIP: Agent Identity as Architecture

The Agent Identity Protocol, presented by James Gow of Ironwood Cyber, is not merely a security mechanism -- it is an architectural pattern that shapes how multi-agent systems are built.

AIP's two-layer architecture creates a separation of concerns that affects system design:

**Layer 1 (Identity)** determines what questions can be asked about an agent:
- Is this entity an agent or a human?
- Which specific agent is this?
- Who created and deployed this agent?
- What organization does this agent belong to?

**Layer 2 (Policy)** determines what answers lead to what permissions:
- Given this agent's identity, what MCP servers can it access?
- What tools within those servers can it invoke?
- What data scopes are available?
- What rate limits apply?

The architectural implication: any multi-agent system must establish identity before coordination. Two agents cannot meaningfully collaborate if neither can verify the other's identity, capabilities, or authorization level. This is analogous to the TCP handshake -- before any data flows, both parties must establish who they are and what protocol version they speak.

The IETF 125 connection (Shenzhen) elevates AIP from a project-level concern to an internet-infrastructure concern. The standards body that created TCP/IP is now working on agent identity. This signals that agent-to-agent communication will eventually be as standardized as machine-to-machine networking.

## 3. CIMD: Metadata-Driven Trust

Client ID Metadata Documents, presented by Max Gerber from Stitch, provide the metadata layer that makes AIP's identity assertions verifiable. While AIP says "this agent has identity X," CIMD says "here is the structured evidence supporting that claim."

CIMD documents contain:
- **Client identity**: Name, version, organization, deployment identifier
- **Capability declarations**: What the client claims to need (tool access, data scopes)
- **Trust attestations**: Cryptographic proof of who vouches for this client
- **Usage constraints**: Self-declared rate limits, data handling policies

The architectural pattern is metadata-driven trust: rather than relying on out-of-band configuration (admin manually whitelisting client IDs), the client presents its own metadata document, and the server evaluates it against its trust policy. This enables dynamic trust evaluation -- a new agent can connect to a server it has never seen before, present its CIMD, and receive appropriate access without manual intervention.

This is the same pattern used by OAuth 2.0 Dynamic Client Registration (RFC 7591), extended with agent-specific metadata. The connection to our trust-relationship system is direct: our earned trust model evaluates behavior over time, while CIMD provides initial trust signals before any behavior has been observed. They are complementary -- CIMD for initial access, earned trust for ongoing authorization.

## 4. Single-Agent Architecture

The simplest agent topology: one model, one context window, one set of tools.

```
User -> [Agent] -> Tools
              |
         Context Window
         (system prompt + history + tool defs)
```

**Strengths:**
- Minimal coordination overhead (zero agents to synchronize)
- Complete context visibility (one window contains everything)
- Predictable behavior (single decision-maker)
- Simple debugging (one execution trace to examine)

**Weaknesses:**
- Context window is the hard ceiling on working memory
- No parallelism -- one task at a time
- Single point of failure -- if the agent hallucinates, there is no second opinion
- Tool accumulation leads to token bloat (see AGT-03)

**When to use:** Simple tasks, single-domain work, prototyping, user-facing chat interfaces where the user provides correction in real-time.

The MCP Orchestration talk (NimbleBrain) and the Svelte MCP talk both operate in the single-agent paradigm: one model orchestrating tools through MCP. The innovation is in what tools are available, not in the agent topology.

## 5. Multi-Agent Coordination

Multiple agents, each with their own context window, collaborating on shared work.

```
                 Coordinator
                /     |     \
               /      |      \
         Agent A   Agent B   Agent C
            |         |         |
         Tools A   Tools B   Tools C
```

**Coordination patterns:**

**Hierarchical (coordinator/worker):** One agent plans and delegates, workers execute. The coordinator maintains the high-level view, workers maintain domain-specific context. Communication flows through the coordinator.

This is the pattern used by our Gastown convoy model: the convoy coordinator (analogous to the coordinator agent) assigns work to individual agents (workers), monitors progress through the event log, and handles failures by reassigning work.

**Peer-to-peer:** Agents communicate directly with each other, without a central coordinator. Each agent maintains its own state and negotiates with peers. More resilient to coordinator failure but harder to reason about.

**Pipeline:** Agents are arranged in sequence, each processing the output of the previous one. Natural for workflows with clear stage boundaries: research -> analysis -> writing -> review.

**Blackboard:** All agents read from and write to a shared state (the "blackboard"). No direct agent-to-agent communication. The blackboard mediates all coordination. Simpler communication model but creates a bottleneck at the shared state.

**Key challenge: shared context.** In a multi-agent system, no single agent has the complete picture. The coordinator knows the plan but not the details of each worker's execution. Workers know their domain but not the overall strategy. Information loss at agent boundaries is the fundamental cost of multi-agent architecture.

Mitigation strategies:
- **Structured handoff protocols**: Define exactly what information passes between agents at boundaries (our GUPP protocol)
- **Shared state stores**: Agents read from a common database (Postgres, Redis) rather than passing all information through messages
- **Summary compression**: Each agent produces a structured summary of its work that fits within the coordinator's context budget

## 6. Swarm Topologies

Swarm architectures push coordination from explicit protocols to emergent behavior. Many agents, minimal central control, local rules producing global patterns.

**Characteristics:**
- No single agent has a global view
- Agents make local decisions based on local information
- Global behavior emerges from agent interactions
- Robust to individual agent failures (the swarm continues)
- Unpredictable at the macro level

**Examples in the agentic ecosystem:**
- Multiple MCP servers responding to the same registry query, with the client selecting the best response
- A/B testing of agent configurations where multiple variants run simultaneously
- Distributed code review where multiple agents review different aspects of the same PR

**Challenges:**
- Convergence: Will the swarm converge on a correct answer, or oscillate?
- Termination: How do you know when the swarm is done?
- Quality: Without central oversight, how do you ensure output quality?
- Cost: N agents consume N times the compute resources

Swarm topologies are the least mature in the agentic ecosystem. Most production deployments use single-agent or hierarchical multi-agent patterns. Swarm patterns are more common in research settings and in applications where diversity of output is valued over consistency (creative generation, hypothesis exploration).

## 7. Agent Lifecycle Management

Every agent, regardless of topology, follows a lifecycle:

**Spawn**: The agent is created with an identity, a system prompt, tool access, and an initial task. In AIP terms, the agent registers its identity and receives authorization. In CIMD terms, it presents its metadata document.

**Initialize**: The agent loads its context window -- system prompt, conversation history (if resuming), tool definitions, and any pre-loaded data. This is the most expensive phase in token terms; everything that enters the context window at initialization is overhead that reduces working capacity.

**Execute**: The core work loop. The agent receives input, reasons, selects tools, invokes them, processes results, and generates output. This phase consumes the majority of compute and time.

**Coordinate**: In multi-agent systems, the agent communicates with peers or coordinators. This may happen within the execute loop (synchronous coordination) or asynchronously (posting to a shared queue and continuing work).

**Checkpoint**: Periodically, the agent's state is saved to durable storage. This enables crash recovery and session resumption. The checkpoint includes workflow progress, intermediate results, and any state that cannot be reconstructed from the initial inputs.

**Terminate**: The agent completes its task, reports results, and releases resources. In OAuth terms, tokens are revoked. In state management terms, session state is either archived or deleted.

**Failure modes by lifecycle phase:**

| Phase | Failure Mode | Impact | Recovery |
|-------|-------------|--------|----------|
| Spawn | Identity rejection | Agent cannot start | Re-register with valid credentials |
| Initialize | Context overflow | Agent cannot load required context | Reduce tool definitions, compress history |
| Execute | Hallucination | Incorrect output | Verification agent, human review |
| Execute | Tool failure | Workflow blocked | Retry, fallback tool, escalation |
| Coordinate | Message loss | Agents diverge | Idempotent messaging, state reconciliation |
| Checkpoint | Storage failure | Cannot recover from crashes | Redundant storage, WAL |
| Terminate | Incomplete cleanup | Resource leak | Timeout-based garbage collection |

## 8. Framework Comparison

### AutoGen (Microsoft)

Multi-agent conversation framework. Agents are defined as participants in a conversation, with configurable roles (assistant, user proxy, critic). Coordination is conversation-based: agents talk to each other. Strengths: easy to prototype multi-agent systems. Weaknesses: conversation-based coordination is token-expensive, limited support for non-conversational coordination patterns.

### CrewAI

Role-based multi-agent framework. Each agent has a defined role, goal, and backstory. Tasks are assigned to agents based on role fit. Strengths: intuitive role-based abstraction, good for workflows with clear role boundaries. Weaknesses: roles are static (no dynamic role assignment), limited support for swarm topologies.

### LangGraph (LangChain)

Graph-based agent orchestration. Agents and tools are nodes in a directed graph, with edges representing control flow. Supports cycles (loops), conditional edges, and parallel execution. Strengths: explicit control flow, good for complex workflows with branching logic. Weaknesses: graph definition can become complex, tight coupling to LangChain ecosystem.

### Gastown Convoy (GSD)

Event-driven multi-agent coordination. A convoy coordinator assigns work to agents, tracks progress through an event log, and handles failures through reassignment. Agents are isolated (separate context windows) and communicate only through the event log and structured handoff protocols.

**Comparative matrix:**

| Dimension | AutoGen | CrewAI | LangGraph | Gastown |
|-----------|---------|--------|-----------|---------|
| Coordination | Conversation | Role assignment | Graph edges | Event log |
| Topology | Peer-to-peer | Hierarchical | Arbitrary graph | Hierarchical |
| State management | In-memory | In-memory | Checkpointed | Event-sourced |
| Token efficiency | Low (conversation overhead) | Medium | Medium | High (isolated contexts) |
| Failure handling | Retry | Retry | Conditional edges | Reassignment |
| Debugging | Conversation trace | Role trace | Graph traversal | Event log replay |
| Maturity | Production | Production | Production | Internal |

The key differentiator for Gastown is event sourcing: the event log is the single source of truth, and the system state at any point can be reconstructed by replaying events from the beginning. This is the same architectural pattern used by Apache Kafka, EventStoreDB, and (at a different level) the time-travel debugging approach from Undo.io.

## 9. Cross-References

- [MCP Protocol and Orchestration](01-mcp-protocol-orchestration.md) -- Workflow orchestration platforms
- [Agent Security and Identity](02-agent-security-identity.md) -- AIP and CIMD identity architecture
- [Stateful Agents and Token Management](03-stateful-agents-token-management.md) -- State management for multi-agent systems
- [Tool Integration Patterns](05-tool-integration-patterns.md) -- Tool composition across agent boundaries
- MCP Cloud proxy: Production deployment for agent architectures
- Gastown chipset: `src/chipset/gastown/` -- Our convoy implementation
- Trust system: `src/chipset/trust-relationship.ts` -- Earned trust as a complement to CIMD
- Synthesis module: `07-synthesis-ordering-guarantees` -- Ordering guarantees across architectural patterns

## 10. Sources

- The Context (Obot weekly show): Episodes featuring Fred (Alpek/Skybridge), Vali & Alex (MCP Cloud), James Gow (Ironwood Cyber/AIP), Max Gerber (Stitch/CIMD)
- Analysis: `artifacts/analysis-agentic-orphan-batch.md`, Cluster D
- AutoGen documentation (Microsoft Research)
- CrewAI documentation
- LangGraph documentation (LangChain)
- Gastown convoy model: internal architecture documentation

> **Related:** [MCP Protocol](01-mcp-protocol-orchestration.md), [Agent Security](02-agent-security-identity.md), [Stateful Agents](03-stateful-agents-token-management.md), [Tool Integration](05-tool-integration-patterns.md)
