# v1.4 — Agent Teams

**Shipped:** 2026-02-05
**Phases:** 18-23 (6 phases) | **Plans:** 18 | **Requirements:** 22

Multi-agent team coordination enabling complex workflows across specialized agents.

### Key Features

- Team schema with YAML frontmatter defining topology and member roles
- Three topologies: leader-worker, pipeline, swarm
- Team storage in `.claude/teams/` with validation and CLI management
- Member capability declarations and role assignments
- GSD workflow templates for team-based execution
- `skill-creator team create/list/validate/run` CLI commands

## Retrospective

### What Worked
- **Three topologies (leader-worker, pipeline, swarm) cover the coordination design space.** Leader-worker for directed work, pipeline for sequential stages, swarm for emergent collaboration. Later versions (v1.9) add router and map-reduce, but these three are the foundation.
- **Team schema with YAML frontmatter maintains consistency with the skill format.** Skills, agents, and teams all use the same storage pattern -- markdown with YAML frontmatter in `.claude/` subdirectories.
- **6 phases and 22 requirements reflect the real complexity of multi-agent coordination.** Teams are harder than individual skills because they introduce topology, role assignment, and capability matching.

### What Could Be Better
- **GSD workflow templates for team-based execution are speculative at this point.** Without real team usage data, the templates are designed from first principles rather than observed patterns. The v1.0 loop hasn't had time to generate the evidence that would inform team design.

## Lessons Learned

1. **Member capability declarations are the contract surface for team composition.** Without explicit capabilities, the system can't match members to roles -- it would have to infer capabilities from skill content, which is fragile.
2. **CLI management (create/list/validate/run) establishes teams as first-class entities.** They're not just configuration files -- they have lifecycle operations, which means they can be tested, versioned, and evolved.
3. **Validation at the team level catches composition errors early.** A team with incompatible member capabilities or circular dependencies should fail at creation time, not at runtime.

---
