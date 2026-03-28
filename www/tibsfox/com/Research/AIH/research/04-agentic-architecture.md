# Agentic Architecture and Protocols

## Overview

The agentic era represents a shift from models as oracles (ask a question, get an answer) to models as actors (assign a task, get it done). This module documents the protocol stack, orchestration patterns, and the GSD ecosystem's position in the agentic landscape.

## The Protocol Stack

### Model Context Protocol (MCP)

Anthropic's Model Context Protocol, announced November 2024 and rapidly adopted, provides a standardized way for AI models to access external tools and data sources:

- **Architecture**: Client-server model where MCP servers expose tools, resources, and prompts
- **Transport**: JSON-RPC 2.0 over stdio or HTTP/SSE
- **Tool format**: JSON Schema definitions for tool inputs and outputs
- **Discovery**: Servers advertise their capabilities; clients discover available tools at connection time
- **Security**: Per-tool authorization; servers can restrict which tools are available to which clients

MCP is to agents what HTTP was to web browsers -- a standard protocol that enables interoperability between any model and any tool.

### Agent-to-Agent Protocol (A2A)

Google's A2A protocol, announced April 2025, enables direct communication between AI agents:

- **Agent Cards**: JSON documents describing an agent's capabilities, endpoint, and authentication
- **Task lifecycle**: Create -> Execute -> Monitor -> Complete/Fail
- **Streaming**: Server-Sent Events for real-time progress
- **Push notifications**: Webhook-based alerts for task state changes
- **Multi-party**: Agents can delegate subtasks to other agents

### DACP (Deterministic Agent Communication Protocol)

The GSD ecosystem's native protocol, predating both MCP and A2A:

- **Three-part bundle**: Human intent + structured payload + executable trigger
- **Deterministic execution**: Same bundle always produces the same outcome
- **Wave-based parallelism**: Bundles execute in coordinated waves with CAPCOM gates
- **Learning integration**: Outcomes feed back into the skill-creator registry

### Protocol Comparison

| Feature | MCP | A2A | DACP |
|---------|-----|-----|------|
| Primary purpose | Model-to-tool | Agent-to-agent | Agent-to-agent (GSD) |
| Transport | JSON-RPC/stdio | HTTP/SSE | File-based/HTTP |
| Discovery | Server capabilities | Agent Cards | Skill registry |
| State management | Stateless (per-call) | Task lifecycle | Wave/phase state |
| Learning loop | None | None | Integrated |
| Maturity | Production (2025) | Early adoption (2025) | GSD-internal (2024) |

## Agentic Developer Tools

### Claude Code

Anthropic's CLI for Claude, operating as an autonomous coding agent:

- **Capabilities**: Read/write files, execute commands, search codebases, manage git
- **Context**: 200K token window; fresh-context subagents for parallel execution
- **Session length**: Sustained multi-hour sessions (up to 7 hours documented)
- **Tool use**: MCP integration for external tools; built-in file, search, and terminal tools
- **Autonomy level**: Human-in-the-loop by default; can operate autonomously with explicit permission

### Devin (Cognition)

The first "AI software engineer" (March 2024):

- **Architecture**: Full development environment (terminal, browser, code editor) operated by an AI agent
- **Capabilities**: End-to-end task completion from issue to pull request
- **Autonomy**: Fully autonomous execution with human review at PR submission
- **Limitations**: Best suited for well-specified tasks; struggles with ambiguous requirements

### Cursor, Windsurf, and IDE Agents

IDE-integrated agents that operate within code editors:

- **Cursor**: VS Code fork with AI-native features; inline code generation, multi-file editing
- **Windsurf**: Codeium's agentic IDE; "Cascade" mode for autonomous task execution
- **GitHub Copilot**: Microsoft's code completion and chat assistant

## Multi-Agent Orchestration Patterns

### Swarm Pattern

Multiple identical agents work on independent tasks in parallel:

```
Orchestrator
  |-- Agent 1 --> Task A
  |-- Agent 2 --> Task B
  |-- Agent 3 --> Task C
  |-- Agent 4 --> Task D
  |
  v
Aggregate results
```

GSD's wave execution uses this pattern: multiple CRAFT agents execute independent modules in parallel during Wave 1.

### Hierarchical Pattern

A supervisor agent delegates to specialized subordinate agents:

```
Supervisor (Opus)
  |
  |-- Planner (Sonnet) --> Decompose into subtasks
  |-- Executor A (Sonnet) --> Code generation
  |-- Executor B (Sonnet) --> Documentation
  |-- Verifier (Haiku) --> Test validation
  |
  v
Supervisor synthesizes
```

GSD's chipset architecture follows this pattern: Agnus (synthesis), Denise (production), Paula (scaffolding), M68000 (routing).

### Market-Based Pattern

Agents bid on tasks based on their capabilities and availability:

- Tasks posted to a shared queue
- Agents evaluate and bid based on estimated completion time/quality
- Highest-quality bid wins the assignment
- Failed tasks return to the queue

### Conversation Pattern

Agents engage in structured dialogue to reach a solution:

- **Debate**: Two agents argue opposing positions; a judge evaluates
- **Critique**: One agent generates; another critiques; first agent revises
- **Round-robin**: Multiple agents contribute in turn to a shared document

## The DACP-MCP-A2A Integration

### How GSD Connects

The GSD ecosystem's DACP protocol can bridge to both MCP and A2A:

```
PROTOCOL INTEGRATION
====================

  GSD Skill-Creator
       |
       | DACP Bundle
       v
  DACP-MCP Bridge
       |
       |-- MCP: Connect to external tools (ComfyUI, databases, APIs)
       |-- A2A: Connect to external agents (other AI systems)
       |
       v
  External ecosystem
```

### Architectural Alignment

| GSD Concept | MCP Equivalent | A2A Equivalent |
|-------------|---------------|----------------|
| Skill | MCP Tool | Agent capability |
| DACP Bundle | Tool call + parameters | Task specification |
| Wave execution | Parallel tool calls | Multi-task delegation |
| CAPCOM gate | Human-in-the-loop | Task approval |
| Skill registry | Server capability list | Agent Card |
| Learning loop | None (opportunity) | None (opportunity) |

The learning loop is the GSD differentiator: DACP captures outcomes and feeds them back into the skill-creator's observe-detect-suggest cycle. Neither MCP nor A2A has a built-in learning mechanism.

## Seven-Hour Agent Runs

### What Extended Autonomy Looks Like

Claude Code has demonstrated sustained autonomous operation exceeding 7 hours:

- **Task scope**: Complete feature implementation across multiple files
- **Decision making**: Architecture decisions, error recovery, test writing
- **Tool orchestration**: 100+ tool calls per session (file reads, writes, searches, executions)
- **Quality**: Output quality comparable to human-supervised sessions for well-specified tasks

### The Trust Gradient

Extended autonomy requires a trust gradient:

| Autonomy Level | Human Involvement | Suitable Tasks |
|----------------|-------------------|----------------|
| Interactive | Every decision | Exploratory work, novel problems |
| Supervised | Review at milestones | Feature development, refactoring |
| Semi-autonomous | Review at boundaries | Well-specified modules, documentation |
| Autonomous | Review at completion | Scaffolding, test generation, formatting |

> **Related:** See [05-alignment-safety](05-alignment-safety.md) for the safety implications of autonomous agents, and [06-college-integration](06-college-integration.md) for how agentic composition maps to category theory in the mathematical progression.

## Summary

The agentic era has produced three complementary protocols (MCP, A2A, DACP), multiple developer tools (Claude Code, Devin, Cursor), and established orchestration patterns (swarm, hierarchical, market, conversation). The GSD ecosystem's DACP protocol anticipated the direction with its three-part bundle structure and wave-based execution model. The learning loop -- absent from MCP and A2A -- remains the GSD differentiator. Extended autonomous agent runs of 7+ hours demonstrate that the infrastructure for agentic AI is operational.
