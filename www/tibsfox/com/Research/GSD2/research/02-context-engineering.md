# The Art of the Dispatch Prompt

> **Domain:** Context Engineering & AI Session Design
> **Module:** 2 -- Context Engineering and the Dispatch System
> **Through-line:** *The LLM never wastes tool calls on orientation.* Every dispatch arrives already knowing what it needs to know. Context engineering is not prompt writing. It is architecture.

---

## Table of Contents

1. [The Dispatch System Philosophy](#1-the-dispatch-system-philosophy)
2. [The 10 Managed Artifacts](#2-the-10-managed-artifacts)
3. [Context Pre-Loading Strategy](#3-the-pre-loading-strategy)
4. [Dispatch Construction Algorithm](#4-dispatch-construction-algorithm)
5. [Cache Optimization and TTL](#5-cache-optimization-and-ttl)
6. [The Must-Haves System](#6-the-must-haves-system)
7. [Phase-Specific Context Budgets](#7-phase-specific-context-budgets)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Dispatch System Philosophy

The most expensive thing an LLM can do with its context window is orient itself. Reading the project structure, discovering the architecture, figuring out what was done last session, understanding what the current task actually requires -- this orientation cost is paid on every session boundary if context is not pre-loaded.

GSD-2's dispatch system is built on the principle that this cost should be paid once -- by the state machine, before the LLM ever reads the first token -- and never again within a session.

**What orientation costs look like:**
- 3-5 tool calls to read project structure
- 2-4 tool calls to understand what was done previously
- 1-2 tool calls to read the current task specification
- Total: 6-11 tool calls before meaningful work begins

At Claude Sonnet pricing, 11 orientation tool calls on a 10-task slice = 110 wasted tool calls. At a generous 2,000 tokens per call, that is 220,000 tokens of orientation overhead -- the equivalent of an entire context window spent on overhead rather than output.

GSD-2 eliminates this overhead by pre-inlining every relevant artifact directly into the dispatch prompt. The LLM starts the session already oriented.

---

## 2. The 10 Managed Artifacts

GSD-2 manages 10 artifact types in `.gsd/`. Each has a specific role in context engineering:

| Artifact | Purpose | Included In Dispatch? |
|----------|---------|----------------------|
| `PROJECT.md` | Living project description; what the project is right now | Always |
| `DECISIONS.md` | Append-only architectural decision register | Always (recent N entries) |
| `STATE.md` | Quick-glance dashboard | Always (read first) |
| `M001-ROADMAP.md` | Milestone plan with slice checkboxes, risk levels | Always |
| `M001-CONTEXT.md` | User decisions from the discuss phase | Always |
| `M001-RESEARCH.md` | Codebase and ecosystem research | Research phase only |
| `S01-PLAN.md` | Slice task decomposition with must-haves | Execute phase and later |
| `T01-PLAN.md` | Individual task plan with verification criteria | Execute phase, current task only |
| `T01-SUMMARY.md` | What happened: YAML frontmatter + narrative | Execute phase (prior summaries) |
| `S01-UAT.md` | Human test script derived from slice outcomes | Complete phase only |

The inclusion rules are not arbitrary. Each artifact is included in exactly the phases where it is needed and excluded in phases where it would waste context budget. Research phase sessions do not receive task-level plans (they don't exist yet). Execute phase sessions do not receive the full research document (too large, mostly not relevant to the specific task).

---

## 3. The Pre-Loading Strategy

Pre-loading is the act of inlining artifact contents directly into the dispatch prompt -- not as file references that the LLM must resolve with tool calls, but as actual text content within the prompt body.

**The key insight:** File references require tool calls. Tool calls consume context. Pre-inlined content is just more prompt text -- it is paid once by the dispatch constructor, not repeatedly by the LLM.

**What gets pre-inlined:**

```
[DISPATCH PROMPT STRUCTURE]

## Project Context
{PROJECT.md content inlined here}

## Architecture Decisions
{DECISIONS.md recent N entries inlined here}

## Current State
{STATE.md content inlined here}

## Roadmap
{M001-ROADMAP.md content inlined here}

## Prior Task Summaries (most recent first)
{T0(N-1)-SUMMARY.md content inlined here}
{T0(N-2)-SUMMARY.md content inlined here}  [if budget allows]

## Current Task
{T0N-PLAN.md content inlined here}

## Dependency Summaries
{summaries of dependency slices inlined here}

## Your Task
[specific execution instructions]
```

The dispatch constructor builds this prompt programmatically, respecting a token budget for each section. If the full content of a section would exceed its budget, the constructor truncates intelligently (most recent first for summaries, key sections first for documentation).

---

## 4. Dispatch Construction Algorithm

The dispatch construction algorithm runs before every session:

```
function buildDispatch(currentUnit, phase):
  budget = 200,000 - estimated_task_output_budget  # ~150,000 tokens for input

  # Always-include artifacts (high priority)
  prompt += render(STATE.md)                        # ~2,000 tokens
  prompt += render(PROJECT.md)                      # ~3,000 tokens
  prompt += renderRecent(DECISIONS.md, n=20)        # ~4,000 tokens
  prompt += renderRelevant(ROADMAP.md, currentUnit) # ~5,000 tokens

  # Phase-specific artifacts
  if phase == Research:
    prompt += render(M001-CONTEXT.md)               # ~2,000 tokens

  if phase == Plan:
    prompt += render(M001-RESEARCH.md, truncated)   # ~20,000 tokens
    prompt += render(M001-CONTEXT.md)               # ~2,000 tokens

  if phase == Execute:
    prompt += render(S0N-PLAN.md)                   # ~3,000 tokens
    prompt += render(T0N-PLAN.md)                   # ~2,000 tokens
    prompt += renderRecent(summaries, n=3)          # ~9,000 tokens
    prompt += renderDependencies(currentTask)       # ~5,000 tokens

  if phase == Complete:
    prompt += render(all_task_summaries)            # ~15,000 tokens
    prompt += render(S0N-PLAN.md)                   # ~3,000 tokens

  # Task instructions
  prompt += buildTaskInstructions(currentUnit, phase)

  return prompt
```

**Intelligent truncation:** When artifact content exceeds its budget, the constructor applies rules:
- DECISIONS.md: most recent first (oldest decisions are least relevant)
- Task summaries: most recent first (earlier summaries are context, not instructions)
- Research findings: key sections first (abstract, findings, implications before methodology)

---

## 5. Cache Optimization and TTL

GSD-2's dispatch system includes a 5-minute cache TTL for unchanged artifacts. The cache serves two purposes:

1. **Cost reduction:** Identical content blocks at the start of every prompt hit the LLM's prompt cache. With a 5-minute TTL, the cache is fresh enough to be accurate but stable enough to produce cache hits across consecutive task dispatches.

2. **Session warmup:** The first dispatch in a session populates the cache. Subsequent dispatches in the same hour hit the cache for stable content (PROJECT.md, ROADMAP.md, old DECISIONS entries), paying full cost only for fresh content (new summaries, the current task plan).

**Cache-safe content (stable across sessions):**
- PROJECT.md (changes rarely)
- ROADMAP.md sections for completed milestones
- DECISIONS.md entries older than 7 days
- Research documents (written once, not updated)

**Cache-unsafe content (changes frequently):**
- STATE.md (changes every dispatch)
- New DECISIONS.md entries
- Recent SUMMARY.md files
- The current task plan

The dispatch constructor marks cache-safe sections with consistent formatting so the LLM's caching layer can recognize them.

---

## 6. The Must-Haves System

Every task plan in GSD-2 contains a `must_haves` section -- a list of mechanically verifiable completion criteria:

```yaml
# T01-PLAN.md
task:
  unit: "T01"
  description: "Implement JWT token validation middleware"
  must_haves:
    truths:
      - "JWT_SECRET is read from environment, not hardcoded"
      - "Expired tokens return 401 with descriptive error"
      - "Invalid signatures return 401 with descriptive error"
    artifacts:
      - "src/middleware/auth.ts exists and exports validateToken"
      - "tests/middleware/auth.test.ts exists with 3+ test cases"
    key_links:
      - "Token validation logic calls jsonwebtoken.verify()"
      - "Middleware is registered in src/app.ts"
```

Must-haves come in three categories:

**Truths:** Statements that must be true about the system state. These are verifiable by code inspection or automated test.

**Artifacts:** Files that must exist with the specified exports or content. These are mechanically checkable (file exists, function exported).

**Key Links:** Specific code-level connections that must exist. These are the integration points -- the wiring that makes the artifact functional rather than just present.

The verification ladder runs after each task:
1. Static analysis (type checking, linting)
2. Artifact verification (do the required files exist with required exports?)
3. Behavioral testing (do the tests pass?)
4. Human review (does the UAT pass?)

Must-haves define what the LLM must produce. The verification ladder checks that it was produced correctly.

---

## 7. Phase-Specific Context Budgets

Different phases have different context needs. GSD-2 allocates context budget by phase to avoid wasteful pre-loading:

| Phase | Primary Context Need | Token Budget (input) | Key Artifacts |
|-------|---------------------|---------------------|---------------|
| Research | Project understanding | ~50,000 | PROJECT.md, CONTEXT.md, public docs |
| Plan | Research findings + slice definition | ~80,000 | RESEARCH.md (full), prior plans |
| Execute | Task precision + recent history | ~120,000 | Task plan, 3 prior summaries, slice plan |
| Complete | Full slice story | ~140,000 | All task summaries, slice plan |
| Reassess | Roadmap + completed slice | ~60,000 | ROADMAP.md, S0N-UAT.md |

**Why Execute phase gets the most budget:** This is where the LLM is actually building things. It needs the most context to be accurate -- the task plan, the slice plan, the prior summaries that tell it what architecture decisions were made in earlier tasks, and any dependency summaries that tell it how other systems work.

**Why Research phase gets the least:** Research is open-ended investigation. The LLM should be discovering, not reciting. Too much pre-loaded context biases the research toward confirming existing assumptions rather than finding genuine surprises.

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Systems context management; configuration as code |
| [MPC](../MPC/index.html) | Mathematical precision in computation; context optimization |
| [GRD](../GRD/index.html) | Gradient optimization analogues in prompt engineering |
| [WAL](../WAL/index.html) | Structured methodology; dispatch as systematic transformation |
| [VAV](../VAV/index.html) | Data fidelity; artifact storage and retrieval |
| [BRC](../BRC/index.html) | CEDAR chipset context loading patterns |

---

## 9. Sources

1. [GSD-2 README](https://github.com/gsd-build/GSD-2) -- Dispatch construction documentation
2. [Pi SDK (pi-mono)](https://github.com/badlogic/pi-mono) -- Session lifecycle and prompt injection
3. [Anthropic Claude API](https://docs.anthropic.com) -- Prompt caching documentation
4. [DeepWiki / GSD docs](https://deepwiki.com/gsd-build) -- Community analysis of context engineering
