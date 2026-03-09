# v1.6 — Cross-Domain Examples

**Shipped:** 2026-02-07
**Phases:** 30-34 (5 phases)

34 cross-domain examples demonstrating real-world skill, agent, and team patterns.

### Contents

- 20 skills covering TypeScript, API design, testing, git workflows, code review, and more
- 8 agents composing related skills into purpose-built development assistants
- 3 teams demonstrating leader-worker, pipeline, and swarm topologies
- Local installation via `install.cjs` script
- `beautiful-commits` skill for Conventional Commits formatting

## Retrospective

### What Worked
- **34 examples across 3 entity types (20 skills, 8 agents, 3 teams) demonstrate the full design space.** Not just toy examples -- TypeScript, API design, testing, git workflows, and code review cover real development scenarios.
- **The `beautiful-commits` skill proves the skill format works for practical use.** It's a concrete, immediately useful skill that validates the YAML frontmatter + markdown body format from v1.0/v1.3.

### What Could Be Better
- **Local installation via `install.cjs` is a manual step.** Users have to know to run the script. Later versions should consider making examples discoverable from the CLI.

## Lessons Learned

1. **Examples are the best documentation.** 34 working examples teach more about the skill format than the v1.3 specification does. People learn by reading real files, not abstract schemas.
2. **Three team topology examples (leader-worker, pipeline, swarm) validate the v1.4 topology design.** If the topologies couldn't support real examples, the design would need revision.

---
