# v1.4 — Agent Teams

**Shipped:** 2026-02-05
**Phases:** 18-23 (6 phases) | **Plans:** 18 | **Requirements:** 22

Multi-agent team coordination enabling complex workflows across specialized agents.

### Key Features

- Team schema as JSON (`config.json`) validated by Zod schemas (`src/core/validation/team-validation.ts`)
- Six topologies: leader-worker, pipeline, swarm, router, map-reduce, custom
- Team storage in `.claude/teams/` with validation and CLI management
- Member capability declarations and role assignments
- GSD workflow templates for team-based execution
- `skill-creator team create/list/validate/estimate/spawn/status` CLI commands

---
