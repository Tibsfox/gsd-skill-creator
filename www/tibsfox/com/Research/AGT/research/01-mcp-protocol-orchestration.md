# MCP Protocol and Orchestration

> **Domain:** Agentic Infrastructure & Systems
> **Module:** AGT-01 -- Protocol Layer
> **Through-line:** *MCP began as a simple request-response protocol for tool calls. Within eighteen months it evolved into a full ecosystem with async tasks, code execution, registries, and cloud hosting -- recapitulating the entire history of web services at compressed timescales.*

---

## Table of Contents

1. [The Next MCP Specification](#1-the-next-mcp-specification)
2. [Async Task Management](#2-async-task-management)
3. [Code Execution as Token Compression](#3-code-execution-as-token-compression)
4. [MCP Registry and Discovery](#4-mcp-registry-and-discovery)
5. [Workflow Orchestration Platforms](#5-workflow-orchestration-platforms)
6. [Framework-Specific MCP Servers](#6-framework-specific-mcp-servers)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The Next MCP Specification

David, one of the founders of MCP at Anthropic, discussed the upcoming specification release in a conversation with Shannon and Darren on The Context (the weekly MCP community show hosted by Obot). The spec adds two major capabilities: asynchronous tasks and code execution.

The async task model addresses a fundamental limitation of the original request-response pattern. Real-world agent workflows frequently involve long-running operations -- database migrations, file processing, API calls to slow external services. The original MCP model required the client to block until the server responded, creating timeout issues and preventing parallel work.

The new model introduces a task lifecycle: the client sends a request, the server spawns a background process (go routine, async thread, or external API call with webhook), returns a task ID immediately, and the client polls for status. The server-side bookkeeping -- storing task IDs, tracking status, answering poll requests -- will eventually be handled automatically by the official MCP SDKs, though the exact implementation is still being designed.

Code execution is the more radical addition. Instead of passing verbose tool-definition JSON to the model's context window (where each MCP server's tools consume significant tokens before any work begins), the new approach has the model write code that calls MCP tools programmatically. This treats MCP servers as SDKs rather than as tool-call targets. The model does a `tools/list` call, then deterministic template code generates typed function stubs, and the model writes imperative code using those stubs. This dramatically reduces context window consumption.

## 2. Async Task Management

The async task architecture follows a pattern familiar from message queue systems:

```
Client                           Server
  |                                |
  |-- tool/call (long_task) ------>|
  |                                |-- spawn background process
  |<-- task_id: "abc123" ---------|
  |                                |
  |-- task/status ("abc123") ----->|
  |<-- status: "running" ---------|
  |                                |
  |-- task/status ("abc123") ----->|
  |<-- status: "complete",        |
  |    result: {...} -------------|
```

Server-side implementation options include in-memory storage for simple cases, Redis clusters for distributed deployments, or Postgres for durable state. The bookkeeping requirements are modest: store task ID, status, optional progress percentage, and final result. Multiple server instances can answer polling requests if they share the task store.

This pattern directly parallels our Gastown event-log architecture, where long-running convoy operations track progress through event entries and support status queries from the harness.

## 3. Code Execution as Token Compression

Adam from Obot (co-maintainer of the MCP registry with GitHub's Toby) presented the token bloat problem and the code execution solution in detail.

The problem is quantifiable: each MCP server exposes tool definitions that include names, descriptions, parameter schemas (JSON Schema with types, descriptions, required fields), and return type descriptions. A server with 10 tools might consume 2,000-4,000 tokens of context before any work begins. Connect 5 servers and you have consumed 10,000-20,000 tokens -- a significant fraction of a working context window -- on overhead alone. Tool results compound the problem further.

The code execution approach inverts the architecture:

1. Call `tools/list` on each MCP server (one-time, cached)
2. Deterministically generate typed function stubs from the tool definitions (template-based, not LLM-generated)
3. Provide the function stubs to the model as an SDK
4. The model writes code that calls these functions
5. Execute the code in a sandboxed environment
6. Return results to the model

This reduces context consumption from O(n * tool_definitions) to O(1) per server (just the SDK import), with tool calls expressed as compact function invocations rather than verbose JSON tool-use blocks.

Adam acknowledged that Claude AI and Claude Code both suffer from the bloat problem today. The code execution approach is an emerging solution, not yet standardized in the spec.

## 4. MCP Registry and Discovery

GitHub has "gone all in" on MCP, with the GitHub MCP server becoming one of the most popular in the ecosystem. Toby, a member of the MCP steering committee, co-maintains the MCP registry -- a central discovery mechanism for MCP servers.

The registry serves a role analogous to npm for Node packages or Docker Hub for container images: a searchable catalog where developers can discover, evaluate, and connect to MCP servers. The governance model is community-driven, with steering committee oversight ensuring quality and security standards.

MCP adoption metrics from the Concierge AI talk: 3,600x increase in open-source MCP repo usage since November 2024, and 250x month-over-month growth in official MCP SDK downloads. These growth rates suggest MCP is approaching infrastructure-level ubiquity in the AI tooling ecosystem.

## 5. Workflow Orchestration Platforms

NimbleBrain (Matt, founder) represents the emerging category of conversational workflow automation -- platforms where agents and workflows are built through natural language description rather than visual flowcharts or code.

The key insight: traditional workflow builders (n8n, Zapier, Make) use visual drag-and-drop interfaces to connect boxes with arrows. Conversational builders let users describe what they want in natural language, and the platform generates the agent/workflow graph. This removes the abstraction barrier between intent and implementation.

NimbleBrain's studio provides a demonstration environment where users can see the orchestration happening in real-time, with tool calls, intermediate results, and agent reasoning visible during execution.

MCP Cloud (Vali and Alex) addresses a different orchestration challenge: deploying MCP servers to production. Local development is straightforward, but customers need internet-reachable endpoints with authentication, TLS, and scaling. MCP Cloud provides a proxy platform that wraps local MCP servers with production infrastructure, approaching 1,000 hosted servers.

## 6. Framework-Specific MCP Servers

Two transcripts demonstrate the pattern of building MCP servers as knowledge bridges for niche technologies:

**Svelte MCP** (Paulo Bruti, Paris): A dedicated MCP server that provides deep Svelte framework knowledge to AI coding tools. LLMs have strong knowledge of mainstream frameworks (React, Vue) but struggle with niche ones. A framework-specific MCP server fills this gap by exposing documentation, component patterns, and API references as structured tools.

**Figma MCP** (Anton Tishinka, XDST): An open-source MCP server wrapping Figma's API for design-to-code workflows. XDST works with niche CMS products (Contentful, Strapi, Optimizely, Sanity, Sitecore) where LLMs are "not quite good." The MCP server bridges the knowledge gap by providing structured access to design tokens, component specifications, and style definitions.

Both represent a pattern: when LLMs lack domain knowledge, build an MCP server that provides it as structured tool access rather than trying to fine-tune or prompt-engineer the knowledge into the model.

## 7. Cross-References

- [Token Bloat and State Management](03-stateful-agents-token-management.md) -- Detailed analysis of context compression
- [Agent Security](02-agent-security-identity.md) -- Security implications of registry trust
- ACE cluster: `01-claude-code-agentic-architecture.md` -- Master loop and tool dispatch
- Gastown chipset: `src/chipset/gastown/transcript-compactor.ts` -- Our context compression implementation

## 8. Sources

- The Context (Obot weekly show): Episodes featuring David (Anthropic), Toby (GitHub), Matt (NimbleBrain), Vali & Alex (MCP Cloud), Paulo Bruti, Anton Tishinka
- Analysis: `artifacts/analysis-agentic-orphan-batch.md`

> **Related:** [Agent Security](02-agent-security-identity.md), [Stateful Agents](03-stateful-agents-token-management.md), [Architecture Patterns](04-architecture-patterns.md)
