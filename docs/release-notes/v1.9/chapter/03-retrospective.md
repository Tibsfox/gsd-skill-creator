# Retrospective — v1.9

## What Worked

- **Cross-platform portability (Claude Code, Cursor, Codex CLI, GitHub Copilot, Gemini CLI) proves skills are not vendor-locked.** The `--portable` export flag strips extension fields for agentskills.io compliance, making the skill format a genuine interchange standard rather than a proprietary one.
- **Progressive disclosure with auto-decomposition at 2000 words solves the large-skill problem.** Skills that exceed the token budget are automatically split into SKILL.md + references/ + scripts/, keeping the loading cost bounded while preserving the full content.
- **MCP distribution via `skill-creator mcp-server` bridges the gap between local skills and network-accessible tools.** Four MCP tools (list, search, read, install) make skills discoverable and installable without filesystem access.
- **Router and Map-Reduce topologies extend the v1.4 team model meaningfully.** Router handles classification-then-dispatch; Map-Reduce handles fan-out-then-consolidate. These are the two patterns that leader-worker/pipeline/swarm didn't cover.

## What Could Be Better

- **9 phases, 37 plans, and 49 requirements make v1.9 the densest release yet.** Spec alignment, progressive disclosure, portability, evaluator-optimizer, MCP, enhanced topologies, session continuity, agentic RAG, and quality-of-life are arguably 3-4 separate releases compressed into one.
- **Agentic RAG with corrective iterations (max 3) and diminishing returns check adds complexity to the search path.** Simple searches now have a multi-iteration fallback path that's harder to debug when results are unexpected.
- **Deadlock detection for inter-team communication suggests the team model is approaching distributed systems complexity.** Circular wait prevention is a real concern, but it signals that team coordination may be getting harder to reason about.

## Lessons Learned

1. **Shell injection prevention for `$ARGUMENTS` in `!command` context is a security requirement, not a feature.** The v1.10 security hardening release follows immediately, but this specific fix couldn't wait.
2. **Ephemeral observation promotion (2+ sessions becomes persistent) is the right learning threshold.** One occurrence is noise; two occurrences across sessions is signal. This is the minimum viable evidence bar.
3. **Mermaid diagrams of skill relationships (`skill-creator graph`) make the system legible.** As the skill graph grows, visualization becomes essential for understanding what connects to what.
4. **A/B evaluation with t-test statistical significance prevents premature optimization.** Without statistical rigor, small differences in activation performance would drive changes that are actually noise.

---
