# v1.9 — Ecosystem Alignment & Advanced Orchestration

**Shipped:** 2026-02-12
**Phases:** 62-70 (9 phases) | **Plans:** 37 | **Requirements:** 49

Spec alignment, progressive disclosure, cross-platform portability, evaluator-optimizer, MCP distribution, enhanced topologies, session continuity, and agentic RAG.

### Key Features

**Spec Alignment (Phase 62):**
- `$ARGUMENTS` parameterization with argument-hint descriptions
- `!command` preprocessing syntax for live data injection
- `context: fork` auto-detection for research/analysis workflows
- Dual-format `allowed-tools` parsing (array and space-delimited string)
- Shell injection prevention for `$ARGUMENTS` in `!command` context
- License and compatibility fields in YAML frontmatter

**Progressive Disclosure (Phase 63):**
- Auto-decomposition of skills exceeding 2000 words into SKILL.md + references/ + scripts/
- Deterministic operation extraction into executable scripts
- Circular reference detection with visited-set DFS cycle detection
- Disclosure-aware token budget calculation

**Cross-Platform Portability (Phase 64):**
- `skill-creator export --portable` strips extension fields for agentskills.io compliance
- `skill-creator export --platform <target>` generates platform-specific variants
- Supported targets: Claude Code, Cursor, Codex CLI, GitHub Copilot, Gemini CLI

**Evaluator-Optimizer (Phase 65):**
- `skill-creator test` with precision/recall/F1 metrics from activation simulation
- A/B evaluation with t-test statistical significance testing
- Post-activation success tracking (user corrections, overrides, feedback)
- `skill-creator quality` health dashboard with per-skill metrics

**MCP Distribution (Phase 66):**
- `skill-creator mcp-server` exposes skills via MCP stdio transport
- 4 tools: list_skills, search_skills, read_skill, install_skill
- `skill-creator publish` packages skills into .tar.gz with format version envelope
- `skill-creator install` unpacks from local files or remote URLs

**Enhanced Topologies (Phase 67):**
- Router topology: classifies work via routing rules, directs to specialists
- Map-Reduce topology: splits work, fans out to parallel workers, consolidates
- Inter-team communication with deadlock detection (circular wait prevention)
- `skill-creator team estimate <team>` for projected token usage and cost

**Session Continuity (Phase 68):**
- `skill-creator session save/restore/handoff` for cross-session context
- Warm-start context generation from snapshot + STATE.md
- Ephemeral observation promotion: seen 2+ times across sessions becomes persistent

**Agentic RAG (Phase 69):**
- Adaptive routing: simple queries to TF-IDF, complex queries to embeddings
- Corrective RAG with max 3 iterations and diminishing returns check
- `skill-creator search --all` discovers across user, project, and plugin directories

**Quality of Life (Phase 70):**
- Description quality validator enforcing "capability + Use when..." pattern
- Enhanced status with token budget breakdown and trend over time
- `skill-creator graph` outputs Mermaid diagrams of skill relationships
- GSD command reference injection in generated skills

---
