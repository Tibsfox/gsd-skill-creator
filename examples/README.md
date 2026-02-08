# Example Skills, Agents, and Teams

This directory contains examples demonstrating proper skill, agent, and team authoring patterns. Each example solves a real problem in a distinct domain and can be copied and adapted for your own use.

## Available Examples

### General Skills

| Skill | Domain | Use Case |
|-------|--------|----------|
| [beautiful-commits](beautiful-commits/SKILL.md) | Git | Comprehensive commit message crafting guide |
| [git-commit](git-commit/SKILL.md) | Git | Conventional commit messages |
| [code-review](code-review/SKILL.md) | Code Quality | PR review checklists |
| [test-generator](test-generator/SKILL.md) | Testing | Test case generation |
| [typescript-patterns](typescript-patterns/SKILL.md) | TypeScript | Best practices and patterns |
| [decision-framework](decision-framework/SKILL.md) | Decision-Making | Structured thinking frameworks (first principles, 5 whys, Pareto, etc.) |
| [api-design](api-design/SKILL.md) | REST API Design | Endpoint conventions, status codes, pagination, versioning |
| [docker-patterns](docker-patterns/SKILL.md) | Containerization | Multi-stage builds, security hardening, docker-compose |
| [env-setup](env-setup/SKILL.md) | Environment Config | .env management, secrets hygiene, config validation |
| [context-handoff](context-handoff/SKILL.md) | Session Continuity | Context preservation for session transitions |
| [sql-patterns](sql-patterns/SKILL.md) | Database / SQL | Query optimization, schema design, migration patterns |
| [ci-cd-patterns](ci-cd-patterns/SKILL.md) | CI/CD Pipelines | GitHub Actions templates, deployment patterns |
| [hook-recipes](hook-recipes/SKILL.md) | Claude Code Hooks | Ready-to-use hook configurations for automation |
| [accessibility-patterns](accessibility-patterns/SKILL.md) | Web Accessibility | WCAG guidelines, ARIA patterns, keyboard navigation |
| [dependency-audit](dependency-audit/SKILL.md) | Supply Chain Security | Dependency auditing, license compliance, upgrade strategies |

### General Agents

| Agent | Domain | Use Case |
|-------|--------|----------|
| [codebase-navigator](codebase-navigator/AGENT.md) | Architecture Analysis | Read-only codebase exploration and architecture mapping |
| [security-reviewer](security-reviewer/AGENT.md) | Application Security | OWASP vulnerability scanning and secret detection |
| [performance-profiler](performance-profiler/AGENT.md) | Performance Analysis | Algorithmic complexity and optimization recommendations |
| [changelog-generator](changelog-generator/AGENT.md) | Release Management | Generate changelogs from git history |
| [doc-linter](doc-linter/AGENT.md) | Documentation Quality | Audit docs for broken links, stale content, consistency |

### General Teams

| Team | Domain | Members | Use Case |
|------|--------|---------|----------|
| [code-review-team](code-review-team/) | Multi-Perspective Review | 5 (all read-only) | Parallel review: correctness, security, performance, maintainability |
| [doc-generation-team](doc-generation-team/) | Documentation Generation | 4 (write-scoped) | Parallel doc writing: API docs, architecture, user guides |
| [migration-team](migration-team/) | Framework Migration | 5 (mixed access) | Coordinated migration: analyze, transform, test, configure |

### GSD-Focused Examples

| Skill/Agent | Type | Use Case |
|-------------|------|----------|
| [gsd-explain](gsd-explain/SKILL.md) | Skill | Explains GSD workflows before execution |
| [gsd-preflight](gsd-preflight/SKILL.md) | Skill | Validates GSD artifacts pre-workflow |
| [gsd-health-checker](gsd-health-checker/AGENT.md) | Agent | Pre-flight health checks for GSD |
| [gsd-onboard](gsd-onboard/SKILL.md) | Skill | Interactive tutorial for learning GSD |
| [gsd-migrate](gsd-migrate/SKILL.md) | Skill | Migrate existing projects to GSD |
| [gsd-trace](gsd-trace/SKILL.md) | Skill | Decision archaeology and requirement tracing |
| [gsd-plan-optimizer](gsd-plan-optimizer/AGENT.md) | Agent | Pre-execution plan quality review |
| [gsd-milestone-advisor](gsd-milestone-advisor/AGENT.md) | Agent | Milestone scoping and timeline advice |

## Example Counts

| Type | Count | Domains Covered |
|------|-------|-----------------|
| Skills | 23 | Git, Code Quality, Testing, TypeScript, Decision-Making, API Design, Docker, Environment Config, Session Continuity, SQL, CI/CD, Hooks, Accessibility, Supply Chain, GSD (5) |
| Agents | 8 | Architecture, Security, Performance, Release Management, Documentation, GSD (3) |
| Teams | 3 | Code Review, Documentation, Migration |
| **Total** | **34** | **26 distinct domains** |

## Key Patterns Demonstrated

### 1. Effective Descriptions

All examples use the "Use when..." pattern with specific trigger keywords:

```yaml
# GOOD - activates reliably
description: Generates conventional commit messages. Use when committing changes,
  writing commit messages, or when user mentions 'commit', 'conventional commits'.

# BAD - unreliable activation
description: Helps with git commits
```

The description field is how Claude Code determines when to apply a skill. Vague descriptions lead to unreliable activation (testing shows proper descriptions can improve activation from 20% to 90%).

### 2. Domain Separation

Examples are chosen to avoid semantic overlap. Each addresses a distinct concern, preventing conflicts where multiple skills try to activate for the same user request.

### 3. Security-First Design

All examples follow security-conscious patterns:
- **Read-only by default** - Agents use minimal tool access (Read, Glob, Grep)
- **No destructive operations** - No rm -rf, force push, DROP TABLE, or similar
- **Secrets protection** - Never display secret values, recommend .gitignore patterns
- **Scoped write access** - Agents that write are restricted to specific files/directories
- **Safe team topologies** - Read-only review teams, write-scoped generation teams

### 4. Actionable Content

Each skill provides concrete, actionable guidance:
- Tables for quick reference
- Code examples for patterns
- Checklists for processes
- Anti-patterns to avoid

### 5. Taches-CC-Resources Integration

Several examples incorporate and improve patterns from [glittercowboy/taches-cc-resources](https://github.com/glittercowboy/taches-cc-resources):

| Our Example | Taches Source | Improvement |
|-------------|---------------|-------------|
| decision-framework | `commands/consider/*` (12 files) | Consolidated into single skill with framework selector |
| context-handoff | `commands/whats-next.md` | Task-type-aware capture, structured recovery instructions |
| hook-recipes | `skills/create-hooks` | Recipe-focused (copy-paste) vs. tutorial-focused |
| security-reviewer | `agents/skill-auditor.md` | Auditor pattern applied to app security, not skill structure |
| doc-linter | `agents/*-auditor.md` | Auditor pattern applied to documentation quality |

## Using These Examples

### Copy to Your Project

```bash
# Copy a skill to your project
cp -r examples/api-design ~/.claude/skills/

# Copy an agent
cp examples/security-reviewer/AGENT.md ~/.claude/agents/

# Copy a team
cp -r examples/code-review-team ~/.claude/teams/

# Or for project-level
cp -r examples/api-design .claude/skills/
```

### Validate After Copying

```bash
skill-creator validate api-design
```

### Customize

Edit the skill to match your team's conventions. The format allows customization while maintaining activation reliability.

## Verifying No Conflicts

These examples were designed to avoid conflicts. Verify with:

```bash
# From project root
skill-creator detect-conflicts --project examples/
```

Expected: No high-severity conflicts between examples.

## Creating Your Own

Use these examples as templates:

1. **Copy** an example that's similar to what you want to build
2. **Rename** the directory to match your skill/agent/team name
3. **Update** the `name` field in frontmatter to match the directory name
4. **Revise** the `description` field with your specific "Use when..." triggers
5. **Replace** the content with your own guidance
6. **Validate** with `skill-creator validate your-skill-name`
7. **Test** activation with `skill-creator test generate your-skill-name`

## See Also

- [CLI Reference](../docs/CLI.md) - Full command documentation
- [OFFICIAL-FORMAT.md](../docs/OFFICIAL-FORMAT.md) - Skill format specification
- [Tutorials](../docs/tutorials/) - Step-by-step guides
- [taches-cc-resources](https://github.com/glittercowboy/taches-cc-resources) - Inspiration for several examples
