# Stateful Agents and Token Management

> **Domain:** Agentic Infrastructure & Systems
> **Module:** AGT-03 -- State & Token Layer
> **Through-line:** *The original MCP protocol was stateless by design. Real agent workflows demand transactions, rollback, and persistent state -- but the context window that enables these capabilities is itself a finite, consumable resource. State management and token management are two sides of the same coin: how agents maintain coherence while operating within strict resource constraints.*

---

## Table of Contents

1. [Transactional State for Agents](#1-transactional-state-for-agents)
2. [Postgres-Backed MCP State](#2-postgres-backed-mcp-state)
3. [Global vs Stage-Local State](#3-global-vs-stage-local-state)
4. [Token Bloat: The Scaling Wall](#4-token-bloat-the-scaling-wall)
5. [Code Execution as Compression](#5-code-execution-as-compression)
6. [Time-Travel Debugging for Agent State](#6-time-travel-debugging-for-agent-state)
7. [Crash Recovery and Checkpoint/Resume](#7-crash-recovery-and-checkpointresume)
8. [Architectural Patterns and Trade-offs](#8-architectural-patterns-and-trade-offs)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. Transactional State for Agents

Arnav, founder of Concierge AI in Bangalore, presented a fully transactional state model for MCP servers. The core insight: agent workflows that perform permanent automations -- database modifications, API calls with side effects, financial transactions -- need the same safety guarantees that database systems provide.

The transactional model works as follows:

1. **Begin transaction**: The agent starts a workflow stage. All state modifications from this point forward are provisional.
2. **Tool calls modify state**: Each MCP tool invocation within the transaction updates state, but these updates are not committed.
3. **Commit or rollback**: If the workflow stage completes successfully, state is committed atomically. If the agent gets stuck, the user changes direction, or an error occurs, all state edits are rolled back completely.

This eliminates the problem of half-complete state. Without transactions, an agent that executes three of five steps in a workflow and then fails leaves the system in an inconsistent state that requires manual intervention. With transactional semantics, the failure leaves the system exactly as it was before the workflow began.

The significance for high-stakes workflows is substantial. Consider an agent automating financial operations: transferring funds between accounts, updating ledger entries, and sending confirmation notifications. If the transfer succeeds but the ledger update fails, the system is in an inconsistent state. Transactional wrapping ensures either all operations complete or none do.

## 2. Postgres-Backed MCP State

Concierge AI chose Postgres as the backing store for transactional state, leveraging its mature ACID guarantee infrastructure. The architecture:

```
Agent Session
    |
    |-- BEGIN TRANSACTION
    |
    |-- Tool Call: update_user_preferences(...)
    |   |-- State change recorded in Postgres (uncommitted)
    |
    |-- Tool Call: submit_order(...)
    |   |-- State change recorded in Postgres (uncommitted)
    |
    |-- Tool Call: send_confirmation(...)
    |   |-- State change recorded in Postgres (uncommitted)
    |
    |-- COMMIT (all changes atomicaly visible)
    |   or
    |-- ROLLBACK (all changes discarded)
```

Postgres provides several properties that make it well-suited for agent state:

- **MVCC (Multi-Version Concurrency Control)**: Multiple agent sessions can operate concurrently without blocking each other. Each session sees a consistent snapshot of state.
- **WAL (Write-Ahead Log)**: All state changes are logged before being applied, enabling recovery after crashes.
- **Savepoints**: Nested transactions allow partial rollback within a larger transaction, useful for multi-stage workflows where individual stages can fail independently.
- **JSON/JSONB columns**: Agent state is often semi-structured (preferences, workflow progress, intermediate results). Postgres's native JSON support stores this without schema migration overhead.

The adoption metrics Arnav cited are striking: 3,600x increase in open-source MCP repository usage since November 2024, and 250x month-over-month growth in MCP SDK downloads. These numbers suggest that the stateless-to-stateful transition is not an edge case but a fundamental evolution of the protocol.

## 3. Global vs Stage-Local State

The Concierge AI architecture distinguishes two state scopes:

**Global state** persists across all workflow stages within a session. This includes:
- User credentials and authentication tokens
- User preferences and configuration
- Session-level context (conversation history, user identity)
- Shared resources (database connections, API clients)

**Stage-local state** is scoped to individual workflow steps and discarded when the step completes:
- Intermediate computation results
- Temporary file references
- Step-specific variables
- Validation buffers

The distinction matters for resource management. Global state consumes persistent storage and must be managed carefully (cleaned up when sessions end, protected from corruption). Stage-local state can be stored in ephemeral structures (in-memory maps, temporary tables) and garbage-collected aggressively.

For our Gastown chipset, this maps directly: the event log maintains global convoy state (which agents are active, what work has been assigned, completion status), while individual agent executions maintain local state (current file being processed, intermediate analysis results, tool call history).

## 4. Token Bloat: The Scaling Wall

Adam from Obot (co-maintainer of the MCP registry alongside GitHub's Toby) presented the token bloat problem as the primary scaling constraint for multi-server MCP deployments.

The problem is quantifiable. Each MCP server exposes tool definitions containing:
- Tool names and descriptions
- Parameter schemas (JSON Schema with types, descriptions, required fields, enums)
- Return type descriptions
- Error descriptions

A server with 10 tools might consume 2,000-4,000 tokens of context just for definitions. The relationship is approximately linear: connect N servers with M average tools each, and definition overhead is O(N * M * avg_tool_tokens).

Real-world measurements:
- Google Docs MCP: ~15 tools (get, create, update, delete, share, etc.) = ~3,500 tokens
- GitHub MCP: ~25 tools = ~6,000 tokens
- Database MCP: ~12 tools = ~2,800 tokens
- File system MCP: ~8 tools = ~1,600 tokens

Connecting all four consumes ~14,000 tokens before any work begins. This is context space that could hold ~10,000 words of actual content, analysis, or code. With larger MCP deployments (10+ servers), the overhead can consume 30-50% of available context.

Tool results compound the problem. A database query returning 500 rows, a file listing with dozens of entries, or a GitHub issues search with 20 results -- each response consumes additional context. The agent's working memory shrinks with every tool interaction.

Adam acknowledged that Claude AI and Claude Code both suffer from this problem today. The context window is simultaneously the agent's working memory, its instruction set, and its communication channel. Tool definitions compete directly with user instructions and conversation history for the same finite resource.

## 5. Code Execution as Compression

The emerging solution inverts the architecture from "give the model all the tools" to "give the model an SDK":

**Traditional approach (high token cost):**
```
Context window contains:
  - System prompt (~1,000 tokens)
  - Tool definitions for Server A (~3,000 tokens)
  - Tool definitions for Server B (~2,500 tokens)
  - Tool definitions for Server C (~4,000 tokens)
  - Conversation history (~5,000 tokens)
  - Available for work: ~remaining tokens
```

**Code execution approach (low token cost):**
```
Context window contains:
  - System prompt (~1,000 tokens)
  - SDK import statements (~100 tokens)
  - Function stub summaries (~500 tokens)
  - Conversation history (~5,000 tokens)
  - Available for work: ~much more remaining
```

The code execution pipeline:

1. **Discovery**: Call `tools/list` on each MCP server (one-time, cached)
2. **Code generation**: Deterministically generate typed function stubs from tool definitions (template-based, not LLM-generated)
3. **SDK presentation**: Provide the function stubs to the model as an importable SDK
4. **Model writes code**: The model writes imperative code using the stubs
5. **Execution**: Run the code in a sandboxed environment
6. **Result return**: Pass execution results back to the model

The key distinction: the code generation is deterministic and template-based. It does not use the LLM to generate the stubs. Given a tool definition with name, parameters, and return type, a simple template produces a typed function signature. This is compilation, not generation.

The analogy Adam used: "Why don't we get models to write code to call these MCP tools in the same way that if I was writing a script and I might use an SDK?" When a human developer wants to interact with the GitHub API, they import the Octokit library and call functions. They do not read the full OpenAPI specification into their working memory before writing each call.

## 6. Time-Travel Debugging for Agent State

Mark Williamson, CTO of Undo.io, presented time-travel debugging as applied to agentic systems. Undo's core technology captures every action a program takes at the system-call level, enabling deterministic rewind and replay.

The traditional debugging challenge for agents: when an agent makes a wrong decision at step 47 of a 100-step workflow, understanding why requires reconstructing the exact state at step 47 -- what was in the context window, what tool results had been received, what the model's reasoning was, and what alternative paths were available.

Time-travel debugging provides this by recording the complete execution trace:

- **Every tool call** and its parameters
- **Every tool response** and its content
- **Every model inference** and its reasoning
- **Every state transition** in the agent's workflow
- **Every context window snapshot** at each decision point

With this recording, a developer can navigate to any point in the execution, inspect the full state, modify inputs, and replay from that point to test alternative paths. This is deterministic debugging -- given the same inputs, the same execution occurs -- as opposed to probabilistic debugging where model outputs vary between runs.

For agentic systems specifically, time-travel debugging enables:

1. **Root cause analysis**: When an agent produces a wrong output, navigate to the exact decision point where it diverged from the correct path
2. **Regression testing**: Record successful executions and replay them against updated agent configurations to detect regressions
3. **Training data curation**: Identify decision points where the agent performed well or poorly, and use these as training examples
4. **Compliance auditing**: Provide a complete, reviewable audit trail of every agent decision and its basis

Mark's background in systems programming (virtualization, kernel development, embedded systems) informs the approach: the recording happens at a level below the application, capturing system calls and memory state, making it language-agnostic and framework-independent.

## 7. Crash Recovery and Checkpoint/Resume

Synthesizing across the three source transcripts, a robust agent state management system requires crash recovery at multiple levels:

**Transaction-level recovery** (from Concierge AI's model):
- Uncommitted transactions are automatically rolled back on crash
- WAL replay restores committed state to the last consistent point
- No manual intervention required for state consistency

**Task-level recovery** (from the async tasks model in the next MCP spec):
- Task IDs persist in durable storage (Redis, Postgres)
- Server restart rediscovers in-progress tasks from the store
- Clients resume polling with existing task IDs
- Idempotent task completion prevents duplicate execution

**Session-level recovery** (synthesized pattern):
- Agent session state checkpointed periodically to durable storage
- On crash, a new agent instance loads the checkpoint and resumes
- Conversation history, tool call history, and workflow progress are all restorable
- The context window itself cannot be checkpointed directly (it exists only within the model inference), but its inputs (system prompt, conversation history, tool definitions) can be reconstructed

**Workflow-level recovery** (from time-travel debugging):
- Complete execution traces enable replay from any checkpoint
- Failed workflows can be resumed from the last successful step
- Partial results are preserved and reusable

The checkpoint/resume pattern is particularly important for long-running agent workflows that span hours or days. A research agent processing 100 documents cannot afford to restart from document 1 when it crashes at document 73. Checkpointing after each document (or after each batch of documents) ensures that crashes cost minutes, not hours.

## 8. Architectural Patterns and Trade-offs

### Stateless vs Stateful MCP

| Dimension | Stateless MCP | Stateful MCP |
|-----------|--------------|-------------|
| Complexity | Low | High |
| Scalability | Horizontal (any server handles any request) | Requires session affinity or shared state store |
| Recovery | Trivial (no state to lose) | Requires WAL, checkpoints, transaction management |
| Use cases | Simple queries, stateless tools | Multi-step workflows, high-stakes operations |
| Token cost | Lower (no state management overhead) | Higher (state tracking consumes context) |

### Token Management Strategies

| Strategy | Token Savings | Implementation Complexity | Maturity |
|----------|--------------|--------------------------|----------|
| Tool definition pruning | 20-40% | Low (remove unused tools) | Production |
| Result truncation | 10-30% | Low (limit response size) | Production |
| Code execution / SDK | 60-80% | High (sandbox, code gen) | Emerging |
| Dynamic tool loading | 40-60% | Medium (load on demand) | Experimental |
| Hierarchical summarization | 30-50% | Medium (recursive compression) | Research |

### State Scope Selection

Choose global state for data that:
- Persists across workflow stages
- Is expensive to recompute
- Is shared between multiple tools
- Requires ACID guarantees

Choose stage-local state for data that:
- Is only relevant to the current step
- Is cheap to recompute
- Is not shared
- Can tolerate loss on failure

## 9. Cross-References

- [MCP Protocol and Orchestration](01-mcp-protocol-orchestration.md) -- Async task lifecycle and code execution spec
- [Agent Security and Identity](02-agent-security-identity.md) -- Token management intersects with security (overprivileged tool exposure)
- [Agent Architecture Patterns](04-agent-architecture-patterns.md) -- Multi-agent coordination requires shared state
- [Tool Integration Patterns](05-tool-integration-patterns.md) -- Tool composition amplifies token bloat
- Gastown chipset: `src/chipset/gastown/transcript-compactor.ts` -- Our context compression implementation
- Gastown chipset: `src/chipset/gastown/event-log.ts` -- Our event-driven state tracking
- Harness integrity: `src/chipset/harness-integrity.ts` -- Rollback capabilities

## 10. Sources

- The Context (Obot weekly show): Episodes featuring Arnav (Concierge AI), Adam (Obot), Mark Williamson (Undo.io)
- Analysis: `artifacts/analysis-agentic-orphan-batch.md`, Cluster C
- MCP specification drafts: async tasks and code execution extensions
- Postgres documentation: MVCC, WAL, savepoints, JSONB

> **Related:** [MCP Protocol](01-mcp-protocol-orchestration.md), [Agent Security](02-agent-security-identity.md), [Architecture Patterns](04-agent-architecture-patterns.md), [Tool Integration](05-tool-integration-patterns.md)
