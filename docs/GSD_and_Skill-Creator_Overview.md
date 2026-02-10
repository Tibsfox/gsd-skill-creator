# GSD & Skill-Creator
## Framework Overview & Integration Guide

*February 2026 | Prepared by Tibsfox*

---

## Executive Summary

Modern AI-assisted development with tools like Claude Code faces three fundamental challenges: context degradation over long sessions, knowledge loss between agent spawns, and inefficient token utilization that leads to rate limiting and increased costs. Two complementary open-source frameworks address these challenges from different angles.

**get-shit-done (GSD)** by glittercowboy provides the structural and workflow layer: spec-driven development, multi-agent orchestration, and persistent project state through structured markdown documents. **gsd-skill-creator** by Tibsfox provides the knowledge and optimization layer: pattern detection, skill creation, bounded learning, and cache-aware token management.

Together, they form an integrated system where GSD keeps development structured and moving while Skill-Creator keeps agents smart and efficient. This document details the core features of each framework, the problems they solve, and how their integration creates a self-reinforcing optimization loop.

> **The Core Insight:** GSD solves the workflow problem — context rot, spec drift, and agent coordination. Skill-Creator solves the knowledge problem — pattern capture, token efficiency, and adaptive learning. Neither is sufficient alone; together they enable sustained, high-quality AI-assisted development.

### At a Glance

|  | get-shit-done (GSD) | gsd-skill-creator |
|---|---|---|
| Created by | glittercowboy (TÂCHES) | Tibsfox |
| Primary role | Workflow orchestration | Knowledge accumulation |
| Core problem | Context rot & spec drift | Knowledge loss & token waste |
| Key mechanism | Structured docs + multi-agent lifecycle | Pattern detection + bounded learning |
| Shared convention | .planning/ directory, .claude/ paths | .planning/ directory, .claude/ paths |

---

## get-shit-done (GSD)

### Problems Solved

**Context Rot.** As AI coding sessions grow longer, the agent's understanding of the project degrades. Requirements drift, earlier decisions are forgotten, and contradictions emerge. GSD externalizes project state into structured, size-bounded markdown files (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md) that serve as persistent truth, replacing volatile conversation memory.

**Spec Drift.** Without structure, AI sessions wander—features get half-built, requirements mutate mid-implementation, and decision provenance is lost. GSD enforces a spec-driven lifecycle: nothing gets built until planned, nothing gets merged until verified against the original specification.

**Multi-Agent Coordination.** Complex projects need specialized roles—research, planning, execution, validation. GSD orchestrates these as sub-agents with fresh context windows, using the .planning/ directory as the shared contract for clean handoffs without context pollution.

### Core Features

| Feature | Description |
|---|---|
| Structured Document Templates | Size-bounded markdown files (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, CONTEXT.md, RESEARCH.md, PLAN.md, SUMMARY.md) that externalize and preserve project state. |
| Phase-Based Lifecycle | A disciplined cycle of discuss → plan → execute → verify. Each phase has defined inputs, outputs, and completion criteria. |
| Multi-Agent Orchestration | Specialized agents (researcher, planner, executor, checker, verifier) spawned with fresh context and role-specific tool permissions. |
| Model Routing Profiles | Three profiles (quality/balanced/budget) mapping to Opus/Sonnet/Haiku for cost-aware model selection per task. |
| Hooks System | Pre/post execution hooks for automated actions at lifecycle boundaries, enabling extensibility and integration with companion tools. |
| STATE.md Live Record | Session-persistent tracking of progress, decisions, and outstanding issues across agent spawns within a phase. |

### Development Lifecycle

| Phase | Purpose | Key Activities |
|---|---|---|
| Discuss | Scope the work | Review PROJECT.md, clarify requirements, identify constraints. |
| Plan | Break into atomic tasks | Research codebase, generate PLAN.md, validate with plan-checker. |
| Execute | Implement the plan | Executor follows PLAN.md, writes code, runs tests atomically. |
| Verify | Confirm correctness | Verifier checks against requirements, commits to SUMMARY.md. |

---

## gsd-skill-creator

### Problems Solved

**Knowledge Evaporation.** Every new GSD agent spawn starts from zero knowledge about the developer's patterns. If you always structure error handling or project layouts the same way, each agent must rediscover this. Skill-Creator captures recurring patterns as compact 300–500 token skills so agents arrive pre-loaded with institutional knowledge.

**Token Waste.** Agents load massive RESEARCH.md files (3,000–5,000 tokens) mostly irrelevant to the current task. The compress-research command distills reusable insights into compact skills, and the token budget system (2–5% of context) ensures maximum value per token.

**Skill Drift.** Naive learning degrades quickly through over-fitting. Bounded guardrails (20% max change, 7-day cooldown, 3+ corrections required) prevent runaway drift while allowing organic evolution.

**Composition Complexity.** As skills grow, manual curation becomes impractical. Co-activation tracking detects skills that consistently fire together and auto-generates composite agents, eliminating manual configuration.

### Core Features

| Feature | Description |
|---|---|
| Six-Step Flywheel | Observe → Detect → Suggest → Create → Refine → Compose. A self-reinforcing lifecycle that gets smarter with every session. |
| Dual-Scope Storage | User-level (~/.claude/skills/) for cross-project conventions; project-level (.claude/skills/) for project-specific patterns. Project scope takes precedence. |
| Bounded Learning | 20% max change per refinement, 7-day cooldown, 3+ corrections required. Prevents over-fitting while allowing evolution. |
| Token Budget Management | 2–5% of context allocated to skills with priority scoring. Most relevant skills load first when budgets are tight. |
| Cache-Aware Ordering | cacheTier metadata (0–9) ensures deterministic load order, maximizing prompt cache hits across rapid sequential agent spawns. |
| Research Compression | Auto-encodes reusable RESEARCH.md content as 300–500 token skills, replacing 3,000–5,000 token documents. |
| Parallelization Advisor | Recommends parallel/sequential/staggered execution based on skill coverage, token history, and rate limit proximity. |
| Agent Composition | Co-activation tracking auto-generates purpose-built agents from frequently co-occurring skill sets. |

> **Test Coverage:** 202 tests across the full suite ensure reliability. JSONL append-only observation logging guarantees concurrent safety when multiple agents write simultaneously.

---

## How They Work Together

### Complementary Architecture

The integration between GSD and Skill-Creator is clean by design. They share filesystem conventions (.planning/ directory, .claude/skills/, .claude/agents/) without overlapping in function. Skill metadata uses official Claude Code format with GSD extensions namespaced under metadata.extensions.gsd-skill-creator, ensuring zero collision with upstream changes.

| GSD Component | Skill-Creator Extension | Integration |
|---|---|---|
| PROJECT.md | Domain definition | Defines scope; always loaded by both systems. |
| RESEARCH.md | Research compression | PostToolUse hook auto-compresses on write. |
| STATE.md | Observation context | Informs pattern detection and skill activation. |
| Agent spawns | Skill injection | Cache-aware ordering maximizes prompt cache hits. |
| Model profiles | Budget allocation | Quality/balanced/budget profiles shape token budgets. |
| Hooks system | Automated triggers | Hooks invoke skill-creator at lifecycle boundaries. |

### The Token Optimization Loop

The most significant integration benefit is a self-reinforcing efficiency loop:

- **Spawn:** GSD spawns agents with fresh context following its orchestration lifecycle.
- **Observe:** Skill-Creator captures patterns, tool usage, and outcomes via JSONL logging.
- **Compress:** Reusable research insights become 300–500 token skills, replacing 3,000–5,000 token documents.
- **Cache:** Deterministic skill ordering ensures rapid sequential spawns hit Claude Code's 5-minute prompt cache.
- **Measure:** The token-report command tracks efficiency, feeding data back into the parallelization advisor.
- **Improve:** The system gets cheaper with every milestone as the skill library matures.

### Agent Teams: Next-Level Savings

Agent Teams extends the integration further. Instead of each agent loading all skills independently, a team lead distributes only relevant excerpts to each teammate:

| Approach | Context Per Agent | Total (4 Agents) |
|---|---|---|
| Traditional (independent) | 15K tokens each | 60K tokens |
| Agent Teams (distributed) | 6K + 2K relevant skills | 38K tokens |
| **Savings** | | **37% reduction (~22K per wave)** |

> **Key Takeaway:** GSD keeps things structured and moving. Skill-Creator keeps things smart and efficient. Together they solve the full problem of sustained AI-assisted development without burning through context budgets or losing project coherence.

---

*References: [github.com/glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done) | [github.com/Tibsfox/gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator)*
