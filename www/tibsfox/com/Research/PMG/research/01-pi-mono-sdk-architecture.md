# Pi-Mono SDK Architecture

> **Domain:** Upstream Intelligence -- SDK Architecture
> **Module:** 1 -- Pi-Mono SDK: The Unified Agent Runtime
> **Through-line:** *Pi is Agnus -- the coordinator, managing DMA and resource allocation across providers. The unified API means skills target one interface, not twenty.*

---

## Table of Contents

1. [The Unified Provider Abstraction](#1-the-unified-provider-abstraction)
2. [Package Inventory](#2-package-inventory)
3. [Agent Runtime (pi-agent-core)](#3-agent-runtime-pi-agent-core)
4. [The Coding Agent (pi-coding-agent)](#4-the-coding-agent-pi-coding-agent)
5. [Build System and Development](#5-build-system-and-development)
6. [AGENTS.md Convention](#6-agentsmd-convention)
7. [Integration Points for Skill-Creator](#7-integration-points-for-skill-creator)
8. [The Amiga Principle: Pi as Agnus](#8-the-amiga-principle-pi-as-agnus)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. The Unified Provider Abstraction

The AI coding agent landscape in early 2026 runs on twenty-plus LLM providers, each with their own API format, authentication scheme, rate limiting model, and streaming protocol. OpenAI uses bearer tokens and a `/v1/chat/completions` endpoint. Anthropic uses `x-api-key` headers and a messages API with a different content block structure. Google's Gemini API uses yet another format. Amazon Bedrock wraps everything in AWS Signature V4 authentication. Azure OpenAI puts the deployment name in the URL path. And that is just the first five.

Pi-ai solves this by presenting a single TypeScript interface that normalizes all of them. The caller specifies a provider and model string, passes messages in a unified format, and gets back a unified response. Streaming, tool calling, vision inputs, and structured output all flow through the same abstraction. The provider differences -- authentication, content formatting, error shapes, rate limit headers -- are handled inside the package.

> *"The unified API means skills target one interface, not twenty."*

For skill-creator, this is the foundation. A generated skill does not need to know whether it will run against Claude, GPT-4, Gemini, or a local model behind OpenRouter. It targets the pi-ai interface, and the provider routing happens at runtime based on the user's configuration and the active model profile.

**Providers covered by pi-ai (as of v0.62.0):**

| Provider | Auth Model | Notable Characteristics |
|----------|-----------|------------------------|
| **OpenAI** | Bearer token | The reference API format; most third-party providers emulate it |
| **Anthropic** | x-api-key header | Messages API with content blocks, system prompt as top-level field |
| **Google (Gemini)** | API key or OAuth | generateContent endpoint, different tool call format |
| **OpenRouter** | Bearer token | Aggregator routing across 200+ models, OpenAI-compatible |
| **Amazon Bedrock** | AWS SigV4 | InvokeModel API, requires region + credential chain |
| **Azure OpenAI** | API key or Entra ID | Deployment-scoped URLs, version-dated API |
| **Groq** | Bearer token | Ultra-low latency inference, OpenAI-compatible |
| **Cerebras** | Bearer token | Wafer-scale inference, OpenAI-compatible |
| **Mistral** | Bearer token | European provider, own chat format |
| **xAI (Grok)** | Bearer token | OpenAI-compatible with extended context |
| **HuggingFace** | Bearer token | Inference Endpoints, variable model support |
| **Google Vertex AI** | OAuth / service account | Enterprise Gemini access with VPC controls |
| **GitHub Copilot** | GitHub token | Copilot-flavored API, model selection via headers |

The abstraction is not a least-common-denominator wrapper. Pi-ai maps each provider's full capability surface -- including provider-specific features like Anthropic's cache control, OpenAI's structured outputs, and Bedrock's guardrails -- while presenting a consistent interface. Features unsupported by a given provider degrade gracefully rather than throwing.

This matters because the AI agent ecosystem is fragmenting, not consolidating. New providers appear monthly. Models move between providers (Llama on Bedrock, on Azure, on Groq, on Together). Without a unified abstraction, every skill and every tool definition must be rewritten per provider. With pi-ai, the rewriting happens once, inside the SDK.

---

## 2. Package Inventory

The Pi monorepo contains seven packages, all TypeScript (95.7% of codebase), managed as an npm workspace with a shared `tsconfig.base.json`. Each package has a clear responsibility boundary and a defined relationship to the others.

| Package | Purpose | Dependencies | Relevance |
|---------|---------|-------------|-----------|
| **pi-ai** | Unified multi-provider LLM API covering 20+ providers. Handles auth, streaming, tool calls, vision, structured output. | None (leaf package) | **Critical** |
| **pi-agent-core** | Agent runtime: tool calling infrastructure, state management, session lifecycle, message history, context management. | pi-ai | **Critical** |
| **pi-coding-agent** | The `pi` CLI command -- an interactive coding agent that reads/writes files, runs commands, and manages code. | pi-agent-core, pi-ai, pi-tui | **High** |
| **pi-mom** | Slack bot that delegates coding tasks to the coding agent. Bridges Slack messages to agent sessions. | pi-coding-agent | **Low** |
| **pi-tui** | Terminal UI library with differential rendering, input handling, and layout management. | None (leaf package) | **Medium** |
| **pi-web-ui** | Web components for AI chat interfaces. Provides a browser-based UI alternative to the TUI. | pi-ai | **Medium** |
| **pi-pods** | vLLM GPU pod management CLI for self-hosted inference. Deploy, monitor, scale GPU pods. | None (leaf package) | **Out of scope** |

**Dependency graph:**

```
pi-coding-agent
├── pi-agent-core
│   └── pi-ai
├── pi-ai (direct)
└── pi-tui

pi-mom
└── pi-coding-agent
    └── (as above)

pi-web-ui
└── pi-ai

pi-pods (standalone)
pi-tui (standalone)
pi-ai (standalone)
```

The graph reveals the architecture: pi-ai is the foundation that everything depends on. pi-agent-core adds the runtime layer. pi-coding-agent adds the interactive coding experience. The other packages are specialized interfaces (TUI, web, Slack) or infrastructure (pods). For skill-creator, the critical path runs through pi-ai and pi-agent-core only.

**Relevance classification rationale:**

- **Critical (pi-ai, pi-agent-core):** These define the interfaces that generated skills must conform to. A skill that calls LLMs must use pi-ai's provider abstraction. A skill that uses tools must conform to pi-agent-core's tool registration protocol.
- **High (pi-coding-agent):** The `pi` command is the primary user-facing agent. Understanding its architecture shows how the runtime packages compose into a working agent. Skill-creator doesn't integrate directly, but the patterns are instructive.
- **Medium (pi-tui, pi-web-ui):** UI packages that skill-creator could leverage for presentation but that are not on the critical integration path.
- **Low (pi-mom):** A Slack bridge with no relevance to skill generation.
- **Out of scope (pi-pods):** GPU infrastructure management is outside skill-creator's domain entirely.

---

## 3. Agent Runtime (pi-agent-core)

pi-agent-core is where the agent comes alive. It takes the raw LLM access from pi-ai and adds everything needed to turn a stateless API call into a stateful, tool-using, context-managing agent session.

### 3.1 Tool Calling Infrastructure

The tool system follows a registration-invocation-result cycle:

1. **Registration:** Tools are defined as typed objects with name, description, input schema (JSON Schema), and an async handler function. The schema is included in the LLM prompt so the model knows what tools are available.
2. **Invocation:** When the LLM responds with a tool call, pi-agent-core matches the tool name, validates the input against the schema, and calls the handler.
3. **Result:** The handler returns a result (or error), which is appended to the message history and sent back to the LLM for the next turn.

This is the integration surface that matters most. When skill-creator generates a skill for the Pi runtime, that skill must register tools using pi-agent-core's tool definition format. The tool schema must be valid JSON Schema. The handler must return results in the expected format. Getting this wrong means the tool silently fails or the LLM hallucinates tool usage that never executes.

### 3.2 State Management

Agent state in pi-agent-core is file-based and serializable. The state includes:

- **Message history:** The full conversation log, including tool calls and results
- **Session metadata:** Model, provider, token counts, cost tracking
- **Tool registry:** Currently active tools and their schemas
- **Context window management:** Tracking of token usage and truncation strategy

State persistence means an agent session can survive crashes, be serialized to disk, and be resumed in a new process. This is what makes GSD-2's "fresh context per task" model possible -- each task starts a new session, and completed task state is written to disk as SUMMARY.md files.

### 3.3 Session Lifecycle

A session in pi-agent-core follows this lifecycle:

```
create() → configure(model, tools) → run(messages) → [tool calls ↔ results]* → complete()
                                                              ↑
                                                    state persisted per turn
```

The lifecycle supports both single-shot (ask a question, get an answer) and multi-turn (interactive coding session) patterns. GSD-2 uses the single-shot pattern for automated task execution and the multi-turn pattern for its interactive mode.

### 3.4 Context Window Management

pi-agent-core tracks token usage per message and implements truncation strategies when the context window fills. This is distinct from GSD's "fresh context per task" approach -- pi-agent-core manages within-session context, while GSD manages across-session context. Both are necessary: GSD ensures each task starts clean, and pi-agent-core ensures the task doesn't overflow its allocated window during execution.

---

## 4. The Coding Agent (pi-coding-agent)

The `pi` CLI command is the user-facing product built on top of agent-core and pi-ai. It is an interactive coding agent -- the same category of tool as Claude Code, Cursor Agent, or GitHub Copilot Workspace -- but built as an open-source composition of the Pi SDK packages.

### 4.1 Architecture

pi-coding-agent composes the lower packages into a complete agent:

- **pi-ai** provides the LLM connection
- **pi-agent-core** provides the runtime (tools, state, sessions)
- **pi-tui** provides the terminal interface
- The coding agent itself adds domain-specific tools: file read/write, shell command execution, git operations, search, and project understanding

The tool set registered by pi-coding-agent is the reference implementation of what a coding agent looks like on top of pi-agent-core. Skill-creator can study these tool definitions as examples of well-structured tool schemas.

### 4.2 Interactive Mode vs. Headless Mode

pi-coding-agent supports both interactive (human at a terminal) and headless (programmatic, no TTY) execution. GSD-2 uses headless mode exclusively when dispatching tasks in auto mode. This distinction matters for skill-creator because generated skills may need to work in both contexts -- interactive when a developer invokes them manually, headless when GSD-2 dispatches them automatically.

### 4.3 Extension Loading

The coding agent supports loading extensions that add new tools, commands, and hooks to the agent session. This is the mechanism GSD-2 uses to add its 19 extensions, and it is the mechanism skill-creator would use to register as the 20th extension. The extension interface defines:

- **Tools:** New capabilities the LLM can invoke
- **Commands:** Slash commands the user can type
- **Hooks:** Callbacks at lifecycle points (session start, tool call, task completion)

Understanding this interface is a prerequisite for the bridge architecture (Module 05).

---

## 5. Build System and Development

### 5.1 Monorepo Structure

Pi-mono uses npm workspaces to manage its seven packages in a single repository. The root `package.json` defines the workspace paths, and each package has its own `package.json` with scoped dependencies.

```
pi-mono/
├── packages/
│   ├── pi-ai/
│   ├── pi-agent-core/
│   ├── pi-coding-agent/
│   ├── pi-mom/
│   ├── pi-tui/
│   ├── pi-web-ui/
│   └── pi-pods/
├── package.json          (workspace root)
├── tsconfig.base.json    (shared TypeScript config)
└── biome.json            (shared lint/format config)
```

### 5.2 Build Chain

The build process follows a standard sequence:

1. `npm install` -- resolves workspace dependencies and hoists shared packages
2. `npm run build` -- compiles TypeScript to JavaScript with declaration files
3. `npm run check` -- runs Biome for linting, formatting, and type checking

**Build order matters.** pi-web-ui depends on compiled `.d.ts` files from pi-ai, so `build` must complete before `check` succeeds on all packages. The monorepo handles this through workspace dependency resolution.

### 5.3 Biome for Lint/Format/Typecheck

Pi-mono uses Biome (the Rust-based successor to Rome) instead of ESLint + Prettier. A single `biome.json` at the repo root configures:

- **Linting:** TypeScript-aware rules, no-unused-variables, consistent-type-imports
- **Formatting:** Indentation, line width, quote style (consistent across all packages)
- **Type checking:** Delegates to `tsc` via tsconfig but Biome enforces additional structural checks

For skill-creator, this means generated skills targeting the Pi runtime should conform to Biome conventions, not ESLint conventions. The difference is subtle but real -- Biome's formatting rules differ from Prettier's in edge cases.

### 5.4 Testing

The monorepo uses a `test.sh` script pattern that handles a key practical concern: many tests require live LLM API keys. Tests that call LLM providers are skipped when the corresponding environment variable is unset, allowing the full test suite to run in CI without provider credentials. Only integration tests in local development (with keys configured) exercise the provider paths.

---

## 6. AGENTS.md Convention

Pi established `AGENTS.md` as the standard for project-level agent behavioral guidance, replacing the earlier `CLAUDE.md` convention. The difference is philosophical: `CLAUDE.md` is Claude-specific, while `AGENTS.md` is agent-agnostic -- any coding agent (Pi, Claude Code, Cursor, Windsurf) that follows the convention can load the same file.

### 6.1 Loading Mechanism

AGENTS.md files are loaded at two levels:

- **User level:** `~/.pi/AGENTS.md` -- global preferences that apply to all projects
- **Project level:** `AGENTS.md` at the repository root -- project-specific conventions, tech stack, patterns

The agent merges both, with project-level taking precedence on conflicts. This two-level model mirrors skill-creator's own global/project skill hierarchy.

### 6.2 Content Patterns

A typical AGENTS.md includes:

- **Tech stack declaration:** Languages, frameworks, versions in use
- **Coding conventions:** Formatting preferences, naming patterns, import ordering
- **Forbidden patterns:** Things the agent must never do (specific to the project)
- **Testing expectations:** How tests should be structured, what coverage is expected
- **Commit conventions:** Message format, scope rules, co-authorship requirements

### 6.3 Implications for Skill-Creator

When skill-creator generates skills for the Pi runtime, those skills inherit the AGENTS.md conventions of the project they run in. This means skill-creator must be aware of the AGENTS.md format so it can:

1. **Read** existing AGENTS.md to avoid generating skills that violate project conventions
2. **Generate** skill definitions that reference AGENTS.md patterns rather than hardcoding conventions
3. **Potentially contribute** new patterns to AGENTS.md when skills establish conventions that should be project-wide

The `.pi/` directory at the repo root contains additional Pi-specific configuration beyond what AGENTS.md covers -- session defaults, model preferences, extension toggles.

---

## 7. Integration Points for Skill-Creator

The critical integration surface between skill-creator and the Pi SDK spans two packages and one mechanism.

### 7.1 pi-ai: Provider and Model Targeting

Generated skills need to specify model requirements without hardcoding provider details. The integration:

- **Model capability declarations:** A skill can declare "requires vision" or "requires tool calling" and pi-ai routes to an appropriate model
- **Provider-agnostic tool schemas:** Tool definitions use JSON Schema, which is provider-independent
- **Cost awareness:** pi-ai tracks token usage per call, enabling skill-creator to measure activation cost

### 7.2 pi-agent-core: Tool-Calling and State Management

This is the deepest integration point. Skill-creator must generate artifacts that:

- **Register tools** using pi-agent-core's tool definition format (name, description, JSON Schema input, async handler)
- **Read agent state** to understand what the agent has done (message history, tool call results)
- **Write state** to persist skill observations and learned patterns
- **Conform to session lifecycle** -- skills activate at session start and deactivate at session end

### 7.3 Extension Loading Mechanism

The extension loader is the delivery mechanism. A skill-creator extension would be a TypeScript module that:

```typescript
// Extension interface (conceptual)
export interface SkillCreatorExtension {
  name: "skill-creator";
  version: string;

  // Tools registered with the agent
  tools: ToolDefinition[];

  // Hooks into the session lifecycle
  hooks: {
    onSessionStart?: (context: SessionContext) => Promise<void>;
    onToolCall?: (call: ToolCall) => Promise<void>;
    onTaskComplete?: (summary: TaskSummary) => Promise<void>;
  };

  // Commands available to the user
  commands: CommandDefinition[];
}
```

The extension must respect the token budget -- observation overhead capped at 2% of the task's token allocation.

### 7.4 Compatibility Matrix

| Integration Point | Pi SDK Version | Stability | Risk |
|-------------------|---------------|-----------|------|
| Provider abstraction (pi-ai) | v0.62.0+ | Stable (core API settled) | Low |
| Tool definition format (agent-core) | v0.62.0+ | Stable (JSON Schema based) | Low |
| Session lifecycle hooks (agent-core) | v0.62.0+ | Evolving (hook points added per release) | Medium |
| Extension loader interface | v0.62.0+ | Evolving (GSD-2 drives changes) | Medium |
| State file format | v0.62.0+ | Unstable (changes with features) | High |

---

## 8. The Amiga Principle: Pi as Agnus

> *"The Amiga didn't win by having the fastest processor. It won because three custom chips -- Agnus, Paula, and Denise -- each did their job brilliantly and communicated through a shared bus with zero wasted cycles."*

In the original Amiga, **Agnus** was the address generator and DMA controller. It managed the bus -- deciding which chip got access to memory at which cycle, routing data between the CPU, the graphics engine, and the I/O controller. Agnus didn't draw pixels or play audio. It made sure the right data got to the right chip at the right time.

Pi is Agnus.

Pi-ai manages the "bus" of LLM provider access -- routing requests to the right provider, handling authentication, normalizing response formats, tracking resource usage. Pi-agent-core manages the "DMA" of tool calling -- shuttling data between the LLM (which decides what to do) and the tools (which do it). The coding agent is the "CPU" -- the application logic that uses the bus and DMA to accomplish actual work.

**The Agnus parallel runs deep:**

| Amiga Agnus | Pi SDK |
|-------------|--------|
| DMA controller -- manages memory bus access | pi-ai -- manages LLM provider access |
| Address generator -- routes data to chips | pi-agent-core -- routes tool calls to handlers |
| Copper coprocessor -- timed display list | Extension loader -- timed hook execution |
| Blitter -- bulk data movement | Streaming API -- bulk token transfer |
| Shared bus protocol | Unified TypeScript interfaces |

The Amiga's power came from the spaces between the chips -- the bus protocol that let them cooperate without stepping on each other. Pi provides the same: a well-defined interface layer that lets GSD (Paula) and skill-creator (Denise) cooperate through shared protocols rather than direct coupling. Each system does its work in its own context and communicates through structured interfaces.

This is not metaphor for decoration. The Amiga's three-chip architecture is a proven pattern for system design: one chip coordinates resources (Agnus/Pi), one handles I/O and execution (Paula/GSD), one generates creative output (Denise/skill-creator). The bus protocol is the key -- it must be fast, well-defined, and stable. Pi's TypeScript interfaces are that bus.

---

## 9. Cross-References

| Reference | Connection |
|-----------|------------|
| [Module 02: GSD v1 Context Engineering](02-gsd-v1-context-engineering.md) | GSD v1 established the context artifacts that Pi-based agents execute against |
| [Module 03: GSD-2 Agent Application](03-gsd-2-agent-application.md) | GSD-2 is built on Pi SDK; the extension system is where skill-creator integrates |
| [Module 05: Bridge Architecture](05-bridge-architecture.md) | The TypeScript interfaces for skill-creator as GSD-2 extension #20 |
| [GSD-2 Research Project](../../GSD2/index.html) | Standalone analysis of the GSD-2 ecosystem and its state machine architecture |
| [HGE Research Project](../../HGE/index.html) | Upstream intelligence methodology applied to a different domain |
| [ACC Research Project](../../ACC/index.html) | Acceleration patterns that apply to Pi's multi-provider routing |

---

## 10. Sources

### Primary Repository

1. **badlogic/pi-mono** -- https://github.com/badlogic/pi-mono
   - Version: v0.62.0 (accessed March 26, 2026)
   - Stars: 27,300+
   - Commits: 3,354
   - License: MIT
   - Language: TypeScript 95.7%
   - Releases: 179

### Package Registry

2. **@mariozechner/pi-ai** -- npm package, unified multi-provider LLM API
3. **@mariozechner/pi-agent-core** -- npm package, agent runtime with tool calling
4. **@mariozechner/pi-coding-agent** -- npm package, interactive coding agent CLI
5. **@mariozechner/pi-mom** -- npm package, Slack bot bridge
6. **@mariozechner/pi-tui** -- npm package, terminal UI library
7. **@mariozechner/pi-web-ui** -- npm package, web components for AI chat
8. **@mariozechner/pi-pods** -- npm package, vLLM GPU pod management

### Build Tooling

9. **Biome** -- https://biomejs.dev/ -- Rust-based linter/formatter replacing ESLint + Prettier
10. **npm workspaces** -- https://docs.npmjs.com/cli/using-npm/workspaces -- Monorepo package management

### Related Documentation

11. **AGENTS.md Convention** -- Pi's project-level behavioral guidance standard (successor to CLAUDE.md)
12. **Pi SDK test.sh** -- Test runner pattern that skips LLM-dependent tests without API keys
