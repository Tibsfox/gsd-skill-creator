# Agnus, the DMA Controller

> **Domain:** SDK Architecture & Multi-Provider AI Systems
> **Module:** 5 -- Pi SDK Integration and Multi-Provider Architecture
> **Through-line:** *GSD-2 is Agnus -- the DMA controller.* It moves context from disk to agent to disk to agent, never letting the CPU accumulate what it doesn't need. The Pi SDK is the custom silicon that makes this possible.

---

## Table of Contents

1. [The Pi SDK Architecture](#1-the-pi-sdk-architecture)
2. [The Seven Pi SDK Packages](#2-the-seven-pi-sdk-packages)
3. [The Two-File Loader Pattern](#3-the-two-file-loader-pattern)
4. [InteractiveMode and Session Lifecycle](#4-interactivemode-and-session-lifecycle)
5. [Multi-Provider Support](#5-multi-provider-support)
6. [Per-Phase Model Allocation](#6-per-phase-model-allocation)
7. [Cost Tracking and Token Ledger](#7-cost-tracking-and-token-ledger)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Pi SDK Architecture

The Pi SDK (`badlogic/pi-mono`) is the agent harness that GSD-2 builds on. It provides:

1. **Unified multi-provider LLM API** -- a single interface that abstracts 20+ providers (OpenAI, Anthropic, Google, OpenRouter, Groq, Mistral, and more)
2. **Agent runtime with tool calling** -- manages the tool call loop: prompt → tool calls → results → next prompt
3. **TUI library** -- the terminal UI that renders GSD-2's interface
4. **Interactive coding agent CLI** -- the core agent that GSD-2's Worker subagent is built on

GSD-2 embeds the Pi SDK as its execution substrate. Every agent session -- Scout, Researcher, Worker -- is a Pi SDK InteractiveMode session configured with GSD-2's dispatch prompt and constraints.

**Why the Pi SDK matters:**

Before the Pi SDK, GSD-2's predecessor (the original GSD) used slash commands in Claude Code -- asking the LLM to dispatch itself. This worked for simple cases but had a fundamental limitation: the orchestration overhead was paid in LLM tokens. Asking the LLM to coordinate its own sessions means using context to think about coordination rather than to do work.

The Pi SDK provides a real runtime: a Node.js application that creates sessions, manages tool calls, reads disk state, and dispatches next sessions. The LLM is the worker. The Pi SDK is the foreman.

---

## 2. The Seven Pi SDK Packages

The Pi SDK monorepo contains seven packages, each with a distinct role:

| Package | Role |
|---------|------|
| `@pi/core` | Core abstractions: provider interface, message types, tool definitions |
| `@pi/anthropic` | Anthropic Claude provider implementation |
| `@pi/openai` | OpenAI (and OpenAI-compatible) provider implementation |
| `@pi/google` | Google Gemini provider implementation |
| `@pi/agent` | Agent runtime: tool calling loop, InteractiveMode, session management |
| `@pi/tui` | Terminal UI library: panels, input handling, output rendering |
| `@pi/cli` | Interactive coding agent CLI (the foundation of GSD-2's Worker) |

**The package that matters most for GSD-2 integration:** `@pi/agent` -- specifically its `InteractiveMode` class, which manages the session lifecycle events that skill-creator needs to observe.

---

## 3. The Two-File Loader Pattern

The two-file loader pattern is one of GSD-2's most important architectural decisions. Instead of a single entry point that initializes everything at once, GSD-2 uses two files:

**loader.ts** runs first:
```typescript
// loader.ts -- must run before any Pi SDK imports
process.env.PI_PACKAGE_DIR = path.join(__dirname, '../pkg');
// ... other critical env vars that Pi SDK reads at module load time
require('./cli');
```

**cli.ts** runs second:
```typescript
// cli.ts -- Pi SDK imports are safe here because loader.ts ran first
import { InteractiveMode } from '@pi/agent';
import { AnthropicProvider } from '@pi/anthropic';
// ... rest of GSD-2 initialization
```

**Why this matters:** The Pi SDK reads environment variables at module load time -- before any `await` or async initialization code can run. If you import Pi SDK before setting `PI_PACKAGE_DIR`, the SDK initializes with wrong or missing configuration and the errors are cryptic.

The two-file pattern ensures that loader.ts runs synchronously to set all required environment variables before any Pi SDK code runs. This is a pattern worth preserving exactly in any integration that uses the Pi SDK.

---

## 4. InteractiveMode and Session Lifecycle

`InteractiveMode` is the Pi SDK's core session abstraction. A GSD-2 agent session is an InteractiveMode instance configured with:

- A provider (Anthropic, OpenAI, etc.)
- A system prompt (the dispatch prompt GSD-2 constructs)
- Tool definitions (file I/O, shell execution, git operations)
- A stop condition (the expected artifact has been written)

**Session lifecycle events:**

```
Pi SDK InteractiveMode lifecycle:
1. session_start          -- new 200k context window created
2. tool_call              -- LLM requests a tool (file read, shell exec, etc.)
3. tool_result            -- tool execution result returned to LLM
4. (tool_call/result loop repeats until stop condition)
5. session_end            -- stop condition met OR timeout
```

These lifecycle events are what skill-creator's event bridge needs to observe. The bridge hooks into these events to build a SessionObservation record without modifying GSD-2's core behavior.

**Stop condition design:** GSD-2's stop condition checks for artifact existence. For a Research phase session, the stop condition is satisfied when `M001-RESEARCH.md` appears in `.gsd/`. For an Execute task, it is satisfied when `T0N-SUMMARY.md` appears. The LLM does not need to signal completion -- it signals completion by writing the artifact.

---

## 5. Multi-Provider Support

The Pi SDK's unified provider interface means GSD-2 can direct any task to any supported AI provider. The 20+ providers supported (as of March 2026):

**Tier 1 (directly supported):**
- Anthropic (Claude Sonnet, Opus, Haiku)
- OpenAI (GPT-4o, GPT-4o-mini, o1, o3)
- Google (Gemini 1.5 Pro, Gemini 2.0 Flash)

**Tier 2 (via OpenRouter):**
- Meta Llama 3.1/3.2/3.3
- Mistral Large/Medium/Small
- Cohere Command R+
- DeepSeek V3

**Tier 3 (via local inference):**
- Ollama-hosted models (llama, qwen, phi)
- LM Studio models (any GGUF)

**Why this matters:** Multi-provider support enables cost-conscious model allocation. Using Claude Opus for synthesis tasks and Claude Haiku for templating tasks can reduce costs by 10-20x while maintaining output quality where it matters. Provider flexibility also provides resilience -- if one provider has an outage or rate limits, GSD-2 can switch providers without changing the task specification.

---

## 6. Per-Phase Model Allocation

GSD-2's configuration supports per-phase model assignment -- different models for different execution phases. The rationale:

| Phase | Cognitive Demand | Recommended Model | Cost Consideration |
|-------|-----------------|-------------------|-------------------|
| Research | Broad synthesis, web search | Sonnet or Opus | Medium -- synthesis quality matters |
| Plan | Decomposition, judgment | Sonnet | Medium -- planning errors compound |
| Execute | Precise implementation | Sonnet | High volume -- most tokens spent here |
| Complete | UAT generation, documentation | Haiku or Sonnet | Low-medium -- structured output |
| Reassess | Roadmap judgment | Sonnet | Low volume -- few calls |

**Model allocation as risk management:**

The most expensive place to use a cheap model is Execute -- where implementation errors require expensive debugging and reverting. The most acceptable place to use a cheap model is Complete -- where the output is structured documentation that follows predictable templates.

GSD-2's default configuration allocates 60% of compute budget to Execute (Sonnet), 25% to Research and Plan (Sonnet), and 15% to Complete and Reassess (Haiku). Projects can override these defaults in their configuration file.

---

## 7. Cost Tracking and Token Ledger

GSD-2 maintains a per-unit token ledger in `.gsd/`. Every dispatch records:

```yaml
# In T01-SUMMARY.md frontmatter
tokens:
  input: 45230
  output: 8920
  cache_read: 12400
  cache_write: 4200
  total_cost_usd: 0.247
  provider: anthropic
  model: claude-sonnet-4-6
```

The token ledger accumulates across the milestone, enabling:

1. **Budget tracking:** Total cost for a milestone versus its budget allocation
2. **Efficiency analysis:** Which slices consumed disproportionate tokens? Why?
3. **Model optimization:** If a Sonnet task produced 8,920 output tokens, would Haiku have achieved the same output? Compare quality.
4. **Cache effectiveness:** What fraction of input tokens were cache hits? Is the pre-loading strategy working?

**The GEODUCK chip's role:**

In the CEDAR chipset, GEODUCK is the "cost-model analyst" -- the chip that reads the token ledger, identifies waste patterns, and proposes reallocation. In the virtual BRC context, GEODUCK is the resource that runs so deep it doesn't move. In the GSD-2 context, GEODUCK's depth is the historical cost data -- the ledger entries that tell you, over time, what the actual cost of different kinds of work is.

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | System architecture; multi-provider as multi-server pattern |
| [CMH](../CMH/index.html) | Distributed compute; provider allocation as node allocation |
| [MPC](../MPC/index.html) | Mathematical precision in computation; cost optimization |
| [VAV](../VAV/index.html) | Storage architecture; token ledger as data storage |
| [GRD](../GRD/index.html) | Gradient optimization; per-phase model optimization |
| [BRC](../BRC/index.html) | CEDAR chipset; chip-to-provider mapping |

---

## 9. Sources

1. [Pi SDK (pi-mono)](https://github.com/badlogic/pi-mono) -- Package documentation and README
2. [GSD-2 README](https://github.com/gsd-build/GSD-2) -- Loader pattern and provider configuration
3. [NPM: gsd-pi](https://npmjs.com/package/gsd-pi) -- Published package metadata
4. [OpenRouter](https://openrouter.ai/) -- Multi-provider routing documentation
5. [Anthropic API](https://docs.anthropic.com) -- Prompt caching, token pricing
