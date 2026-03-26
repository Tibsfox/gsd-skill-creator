# The Nine Extensions and Three Subagents

> **Domain:** Extension Architecture & Subagent Design
> **Module:** 3 -- Extension System and Subagent Dispatch
> **Through-line:** *GSD-2 ships intelligence pre-installed.* The nine bundled extensions and three specialized subagents represent accumulated knowledge about how to build things well -- available to every session before work begins.

---

## Table of Contents

1. [The Extension System Design](#1-the-extension-system-design)
2. [Extension Sync Protocol](#2-extension-sync-protocol)
3. [The Nine Bundled Extensions](#3-the-nine-bundled-extensions)
4. [The Three Subagents](#4-the-three-subagents)
5. [Skill Discovery: auto / suggest / off](#5-skill-discovery-auto--suggest--off)
6. [AGENTS.md Routing Architecture](#6-agentsmd-routing-architecture)
7. [Extension vs Skill: Key Distinctions](#7-extension-vs-skill-key-distinctions)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Extension System Design

GSD-2 ships nine bundled extensions. Extensions are not plugins in the conventional sense -- they do not extend the CLI's features. They extend the agent's behavioral context: they are knowledge documents, instruction sets, and protocol definitions that are injected into the agent's environment at session start.

The extension system solves a specific problem: the LLM starts each fresh session without access to the accumulated wisdom of the build system. It knows TypeScript generally but not GSD-2's specific conventions, git protocols, verification patterns, or escalation procedures. Extensions fill this gap without requiring the user to re-explain conventions in every dispatch prompt.

**Extension architecture:**

```
User Terminal
     |
     v
gsd CLI → loader.ts → extensions synced to ~/.gsd/agent/
                              |
                              v
                     Pi SDK Session Context
                     (extensions pre-loaded)
```

Extensions sync at every launch, using an always-overwrite pattern. This ensures that updated extensions from the GSD-2 package are immediately available without manual update steps.

---

## 2. Extension Sync Protocol

The always-overwrite sync protocol has specific implications:

1. Extensions stored in `~/.gsd/agent/` are treated as managed files -- they belong to GSD-2, not the user
2. User customizations to extension files will be overwritten on the next launch
3. Custom extensions should be placed in the project-level `.agents/skills/` directory, not in `~/.gsd/agent/`
4. The sync happens synchronously at startup -- sessions never start with stale extensions

**Why always-overwrite:** Extension files contain behavioral instructions that must match the GSD-2 version being run. A version mismatch between the CLI and its extension files is a potential source of subtle errors -- the LLM following instructions from a different version than the state machine expects. Always-overwrite eliminates version skew.

---

## 3. The Nine Bundled Extensions

Based on GSD-2's documented architecture and the dispatch system requirements, the nine bundled extensions cover the full lifecycle of autonomous coding work:

| Extension | Function | Phase Relevance |
|-----------|----------|----------------|
| GSD Core | The fundamental execution protocol; state machine awareness | All phases |
| Background Shell | Process management for running services during development | Execute phase |
| Git Conventions | Branch naming, commit format, squash merge protocol | Execute + Complete |
| Verification Ladder | How to verify that must-haves are met at each level | Execute + Complete |
| DECISIONS Protocol | How to record and format architectural decisions | All phases |
| UAT Generation | How to derive a UAT script from slice outcomes | Complete phase |
| Stuck Detection | How to recognize and report a stuck state | Execute phase |
| Crash Recovery | How to produce a recovery-friendly summary | All phases |
| Skill Discovery | How to find and activate relevant skills | Research + Execute |

**Extension loading rules:**
- All 9 extensions are always available in the dispatch context
- Extension content counts against the dispatch's input token budget
- Extensions are written to be concise -- instructions, not tutorials
- Each extension is versioned (frontmatter includes version number)

---

## 4. The Three Subagents

GSD-2 dispatches three specialized subagents for different phases of work:

### Scout
**Purpose:** Reconnaissance and codebase understanding

The Scout subagent is deployed during the Research phase. It does not write code or make changes -- it reads. Its purpose is to map the current state of the codebase: what exists, how it is structured, what conventions are in use, where the relevant interfaces are, and what the codebase will resist.

```
Scout focus:
  - Read file structure, not file contents
  - Identify the 20% of files that contain 80% of the relevant logic
  - Map the dependency graph of the target feature area
  - Document conventions (naming, testing patterns, import style)
  - Flag unexpected complexities or missing infrastructure
  Output: M001-RESEARCH.md section on codebase state
```

### Researcher
**Purpose:** External knowledge gathering

The Researcher subagent conducts web research. It is not deployed against the codebase -- it is deployed against the external world: documentation, library READMEs, community resources, and technical specifications.

```
Researcher focus:
  - Library APIs and behavioral documentation
  - Known issues, gotchas, or deprecation warnings
  - Community-documented patterns for the specific problem domain
  - Comparison of approaches with tradeoff analysis
  Output: M001-RESEARCH.md section on ecosystem knowledge
```

### Worker
**Purpose:** Implementation

The Worker subagent executes tasks. It writes code, runs tests, commits changes, and produces the T0N-SUMMARY.md that documents what it built. The Worker has the most context of any subagent -- it receives the full pre-inlined dispatch with all relevant history.

```
Worker focus:
  - Implement exactly what T0N-PLAN.md specifies
  - Follow conventions documented by Scout
  - Use patterns found by Researcher
  - Produce all must-haves (truths, artifacts, key links)
  - Commit atomically with conventional commit messages
  Output: Implementation artifacts + T0N-SUMMARY.md
```

**Subagent routing:** The state machine knows which subagent to dispatch based on the current phase:
- Research phase (early) → Scout (codebase) or Researcher (ecosystem)
- Research phase (late) → both, with results merged
- Plan phase → Worker (with Scout/Researcher findings available)
- Execute phase → Worker (task-specific)
- Complete phase → Worker (UAT + documentation)

---

## 5. Skill Discovery: auto / suggest / off

GSD-2 supports three skill discovery modes:

**`auto` mode:**
GSD-2 automatically discovers and loads skills from `.agents/skills/` and `.claude/skills/` without asking. The relevance filter uses keyword matching against the task description and phase. Skills meeting the relevance threshold are loaded into the dispatch prompt.

**`suggest` mode:**
GSD-2 discovers skills and presents them to the user for approval before loading. This is the cautious mode for situations where the user wants to control what context the LLM receives.

**`off` mode:**
Skill discovery is disabled. No skills are loaded from the skill directories. Only the nine bundled extensions are available.

**The discovery gap:**
GSD-2's skill discovery finds files that exist. It evaluates their relevance based on description keywords matching the current context. What it cannot do:

1. Determine whether a skill is still accurate for the current codebase state
2. Weight skills by their historical success rate in similar contexts
3. Compose multiple partial skills into a more relevant combined skill
4. Learn that a skill should be activated in Research phase but not Execute phase for a specific project

These gaps are exactly where skill-creator's adaptive learning layer provides value.

---

## 6. AGENTS.md Routing Architecture

GSD-2 uses an `AGENTS.md` file at the project root as a routing document for the subagent system. This file tells the subagents where to look, what conventions to follow, and what the architecture decisions are.

`AGENTS.md` is not a typical README. It is written for machine consumption first and human readability second. Key sections:

```markdown
# AGENTS.md

## Architecture Overview
[What this project is and how it is structured]

## Key File Map
[The 10-20 most important files and what they do]

## Conventions
[Naming, testing, import, and commit conventions]

## Off-Limits Areas
[Files the agent should not modify without explicit instruction]

## Dependency Summary
[Summary of key external dependencies and their usage patterns]

## Active Decisions
[Current architectural decisions that affect implementation]
```

The Scout subagent reads `AGENTS.md` before exploring the codebase. The Worker subagent re-reads it before implementing. The document is the contract between the human and the agent: "here is what you need to know before touching anything."

---

## 7. Extension vs Skill: Key Distinctions

| Dimension | Extension | Skill |
|-----------|-----------|-------|
| Lifecycle | Ships with GSD-2 package | Created by skill-creator from observations |
| Update mechanism | Always-overwrite on launch | Promoted through skill-creator pipeline |
| Scope | Universal to all GSD-2 projects | Project or pattern-specific |
| Content | Protocol instructions, conventions | Domain knowledge, pattern libraries |
| Trust | Managed by GSD-2 | Managed by skill-creator (version + corrections) |
| Location | `~/.gsd/agent/` | `.agents/skills/` or `.claude/skills/` |
| Phase awareness | Phase-agnostic (always available) | Phase-aware (loaded based on current phase) |

The distinction matters for integration design: extensions and skills are complementary, not competing. Extensions provide the behavioral framework (how to work in GSD-2). Skills provide domain knowledge (what to know for this specific kind of work). A session optimally loaded with both has the procedural knowledge of the extension system and the domain expertise of the skill library.

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | System administration; extension as managed configuration |
| [CMH](../CMH/index.html) | Distributed orchestration; subagent-to-node mapping |
| [MPC](../MPC/index.html) | Specialized chip functions; subagent specialization parallel |
| [WAL](../WAL/index.html) | Systematic methodology; extension as pre-loaded method |
| [BRC](../BRC/index.html) | CEDAR chipset chip roles mapping to GSD-2 subagents |
| [GRD](../GRD/index.html) | Gradient computation; relevance scoring optimization |

---

## 9. Sources

1. [GSD-2 README](https://github.com/gsd-build/GSD-2) -- Extension and subagent documentation
2. [Pi SDK (pi-mono)](https://github.com/badlogic/pi-mono) -- Extension sync and InteractiveMode
3. [lobehub.com: tibsfox-gsd-skill-creator](https://lobehub.com/skills/tibsfox-gsd-skill-creator-gsd-workflow) -- Published skill evidence
4. [DeepWiki / GSD docs](https://deepwiki.com/gsd-build) -- Subagent routing analysis
