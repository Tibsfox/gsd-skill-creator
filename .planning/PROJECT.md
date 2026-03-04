# gsd-skill-creator

Adaptive learning layer for Claude Code that creates, validates, and manages skills, agents, teams, and chipsets.

## What This Is

A self-improving knowledge system where tested procedural intelligence flows between cloud reasoning (Claude) and local compute (commodity hardware running local LLMs). Skills are the portable unit of knowledge, MCP is the protocol layer, and the eval loop is the engine of continuous improvement.

## Core Value

Skills are discovered from real patterns and proved against mathematical foundations — the unit circle isn't metaphor, it's architecture.

## Requirements

### Validated

- ModelChip abstraction with OpenAI/Anthropic providers and ChipRegistry — v1.49.15
- Multi-model evaluation with per-model benchmarks and model-aware grading — v1.49.15
- MCP infrastructure with LLM wrapper, mesh discovery, DACP transport — v1.49.15
- Mesh orchestration with cost-aware routing, coordinator, wave planner — v1.49.15
- Context integration with transcript summarizer, mesh worktrees, skill packager — v1.49.15
- Skill Creator MCP Server (8 pipeline tools) — v1.49.15
- Dependency health monitoring and progressive internalization — v1.49.14
- Skill usage telemetry and adaptive pipeline — v1.49.13
- Heritage skills educational pack — v1.49.12
- Mind-body department with practice system — v1.49.9
- Rosetta Core, College Structure, Cooking Department — v1.49.8
- Cross-platform hardening, optional tmux — v1.49.6/v1.49.7
- Project filesystem reorganization — v1.49.5

### Active

- [ ] v1.49.16: Maple Foxy Bells — Mesh Architecture Live Integration (wire stubs to real HTTP/MCP/mesh implementations)

### Out of Scope

- Public mesh networking — mesh nodes are user-owned local hardware only
- Real-time streaming across mesh — batch execution sufficient
- v1.50.x integration — separate branch, future release

## Current Milestone: v1.50.33 Unit Circle Re-execution: v1.19 Review

**Goal:** Deep code review of v1.19 (Budget Display Overhaul) — chain position 20/50. Score, track 13 patterns, evaluate 21 feed-forward items, identify Muse vocabulary and APT patterns.

**Target features:**
- LOAD: Parse v1.19 commits (16), extract architecture and module patterns
- REVIEW: Score against 4-dimension quality rubric, track P1-P13, evaluate all FF items
- REFLECT: Write lessons-learned chain link, stage v1.50.34 for v1.20 review

## Context

Shipped v1.49.15 with 23,994 tests across 1229 test files.
Tech stack: Tauri v2, xterm.js, Vite v6, Vitest. TypeScript + Rust + GLSL.
Source: 6 domain groups — core/ packs/ tools/ platform/ services/ integrations/

## Constraints

- src/ never imports desktop/@tauri-apps/api; desktop/ never imports Node.js modules
- No executable code in DACP bundles
- Grader/analyzer always run on Claude
- Context loss at mesh boundaries is a hard failure

---
*Last updated: 2026-03-03 after v1.50.33 milestone start*
