# Pi Agent Analysis — What the Open-Source Coding Agent Teaches Us

**Date:** 2026-03-31

## What Pi Is

Pi is a minimal terminal coding agent created by **Mario Zechner** (creator of the libGDX game framework). It is NOT Anthropic's internal framework — it is an independent open-source project (MIT licensed) that represents a fundamentally different philosophy from Claude Code.

**Repository:** [github.com/badlogic/pi-mono](https://github.com/badlogic/pi-mono)
**Package:** `@mariozechner/pi-coding-agent` on npm

Where Claude Code is an integrated product with built-in features (sub-agents, plan mode, teams, memory), Pi is a minimal core with aggressive extensibility. Pi deliberately omits features and lets users add exactly what they need through TypeScript extensions.

## Core Architecture

Pi operates on four fundamental tools — the same four that Claude Code uses as its foundation:

| Tool | Pi | Claude Code | Our Usage |
|------|-----|------------|-----------|
| `read` | Core | Read | Core |
| `write` | Core | Write | Core |
| `edit` | Core | Edit | Core |
| `bash` | Core | Bash | Core |

Everything else — sub-agents, planning, git checkpointing, MCP servers, permission gates — is added through extensions. The system prompt is under 1,000 tokens. The philosophy: "a coding agent needs only four tools."

### Four Operating Modes

1. **Interactive** — full terminal UI with message queue
2. **Print/JSON** — scripting and automation
3. **RPC** — process integration via stdin/stdout
4. **SDK** — embeddable in Node.js applications

The SDK mode is particularly interesting for GSD integration — Pi could be embedded as a worker inside a GSD convoy.

## The Skill Format Connection

Pi uses the **agentskills.io** SKILL.md format — the same standard we use for our 41 skills. This means:

- Our skills are theoretically portable to Pi with minimal adaptation
- Pi users can use skills written for Claude Code
- The agentskills.io ecosystem is genuinely multi-runtime

```markdown
<!-- Pi skill format — identical to ours -->
# My Skill
Use this skill when the user asks about X.

## Steps
1. Do this
2. Then that
```

Skills are loaded from `~/.pi/agent/skills/` or `.pi/skills/` — the same directory convention as Claude Code's `.claude/skills/`.

## TypeScript Extension System

This is where Pi goes beyond what Claude Code offers to users. Extensions are TypeScript modules that hook into Pi's full lifecycle:

```typescript
export default function (pi: ExtensionAPI) {
  // Add custom tools
  pi.registerTool({ name: "deploy", ... });
  
  // Add slash commands
  pi.registerCommand("stats", { ... });
  
  // Hook into events
  pi.on("tool_call", async (event, ctx) => { ... });
}
```

Extensions can:
- Replace built-in tools entirely
- Add sub-agents and planning modes
- Implement custom compaction strategies
- Create permission gates and path protection
- Add custom UI components, editors, status lines
- Implement git checkpointing and auto-commit
- Add SSH and sandbox execution
- Integrate MCP servers

### What This Means for Us

Pi's extension system proves that the patterns we built as skills and hooks in Claude Code could be implemented as first-class extensions in Pi. Our GUPP propulsion, sling-dispatch, mayor-coordinator — these are behavioral patterns that map to Pi extensions.

## Multi-Provider Support

Pi works with virtually every LLM provider:

**Subscription-based:** Anthropic Claude Pro/Max, OpenAI ChatGPT Plus/Pro, GitHub Copilot, Google Gemini CLI, Google Antigravity

**API-key:** Anthropic, OpenAI, Azure OpenAI, Google Gemini, Google Vertex, Amazon Bedrock, Mistral, Groq, Cerebras, xAI, OpenRouter, Vercel AI Gateway

Custom providers via `models.json` if they support OpenAI/Anthropic/Google APIs.

This aligns with our **runtime-hal** skill — the Runtime Hardware Abstraction Layer that detects which AI assistant is active. Pi's multi-provider approach validates our runtime-agnostic design.

## Session Architecture

Pi stores sessions as JSONL with a tree structure (id/parentId). Key features:

- **In-place branching** without creating new session files
- **Full history preserved** — compaction is lossy in context but the JSONL retains everything
- **Tree navigation** via `/tree` command
- **Message queue** — users can queue messages while the agent works:
  - Enter = steering message (delivered after current tool execution)
  - Alt+Enter = follow-up (delivered after all work completes)
  - Escape = abort

The message queue pattern is something Claude Code also supports but Pi makes it more explicit. Our nudge-sync and mail-async patterns serve a similar purpose for inter-agent communication.

## Comparison: Pi vs Claude Code vs gsd-skill-creator

| Dimension | Pi | Claude Code | gsd-skill-creator |
|-----------|-----|------------|-------------------|
| Philosophy | Minimal core, max extensibility | Integrated product | Extension layer on Claude Code |
| Core tools | 4 | ~10 | Uses Claude Code's tools |
| Skills format | agentskills.io | agentskills.io | agentskills.io + extensions |
| Extension model | TypeScript modules | Hooks + skills | Skills + hooks + agents + chipsets |
| Multi-agent | Via extensions | Built-in (teams, subagents) | Gastown convoy, fleet missions |
| Memory | Session JSONL | MEMORY.md + auto-memory | MEMORY.md + 58 files |
| Provider lock-in | None (multi-provider) | Anthropic only | Anthropic (via Claude Code) |
| License | MIT | Commercial | BSL 1.1 |
| Sub-1000 token prompt | Yes | No (~10K+ system prompt) | No (inherits Claude Code's) |

## What We Can Learn From Pi

### 1. Minimal System Prompts Work

Pi's sub-1000-token system prompt proves that agents can be effective with minimal instructions. Our system prompt (inherited from Claude Code plus skills) is orders of magnitude larger. Question: are we over-prompting? Could we achieve the same results with leaner skill definitions?

### 2. Extensions > Skills for Behavioral Patterns

Our orchestration patterns (GUPP, DACP, convoy model) are implemented as skill documents — markdown read by the LLM. Pi's extension model implements behavioral patterns as TypeScript code executed by the runtime. Code is more reliable than prompt-based behavior. Consider: should our most critical patterns be extensions rather than skills?

### 3. Provider Portability Matters

Pi's multi-provider support means a user can switch from Claude to GPT to Gemini without changing their workflow. Our runtime-hal skill was designed for this, but we haven't tested it beyond Claude Code. Pi proves the market wants provider agnosticism.

### 4. Session Trees Are Better Than Linear History

Pi's JSONL tree structure with branching is more sophisticated than our linear session model. Context compaction is lossy but the full history is preserved and navigable. This addresses the PostCompact problem we identified in OOPS doc 04.

### 5. The Message Queue Pattern

Pi's explicit message queue (steering messages vs follow-ups vs abort) is a cleaner model than our current approach of interleaving user input with agent execution. Consider adopting this for the convoy model.

## Integration Opportunities with GSD2

The [GSD2 framework](https://github.com/gsd-build/gsd-2) already supports 8 runtimes. Pi should be the 9th:

1. **Skill portability** — Our 41 SKILL.md files are already agentskills.io compatible. Test them on Pi.
2. **Extension bridge** — Write a Pi extension that loads GSD workflow patterns as native Pi behaviors
3. **Convoy on Pi** — Pi's SDK mode allows embedding as a worker. A GSD convoy could dispatch Pi instances as lightweight workers alongside Claude Code instances.
4. **Cross-runtime testing** — Run the same task on Claude Code and Pi, compare outputs. This feeds OPEN problem #5 (Non-Deterministic System Testing).

## What We Should Build

### Immediate (This Week)
- Test our top 5 skills on Pi to verify agentskills.io portability
- Document any format differences or activation issues

### Short-Term (30 Days)
- Write a Pi extension that implements our fleet-mission pattern
- Add Pi as a supported runtime in runtime-hal skill
- Test GSD2 workflow execution on Pi

### Medium-Term (90 Days)
- Implement the convoy model with mixed Claude Code + Pi workers
- Build a skill compatibility matrix across runtimes
- Contribute our patterns back to the Pi ecosystem

## The Bigger Picture

Pi and Claude Code represent two valid approaches to the same problem: how do you build an effective coding agent?

- Claude Code says: "integrate everything, optimize the experience"
- Pi says: "provide the minimum, let users build what they need"

gsd-skill-creator sits in between: we build on Claude Code's integrated foundation but extend it with our own patterns (skills, agents, chipsets, orchestration). The existence of Pi proves that our patterns have value beyond a single runtime. If our skills work on Pi, they work anywhere that implements agentskills.io.

That's the real lesson: **build for the standard, not the product.** The standard is agentskills.io. The product is Claude Code today, but the standard persists across products.

---

*Sources:*
- [Pi Coding Agent README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)
- [Pi vs Claude Code comparison](https://github.com/disler/pi-vs-claude-code)
- [Pi Agent Revolution (blog)](https://atalupadhyay.wordpress.com/2026/02/24/pi-agent-revolution-building-customizable-open-source-ai-coding-agents-that-outperform-claude-code/)
- [Why Pi is my new coding agent (blog)](https://www.danielkoller.me/en/blog/why-pi-is-my-new-coding-agent-of-choice)
- [Pi vs Claude Agent SDK comparison](https://agentlas.pro/compare/pi-vs-claude-agent-sdk/)
