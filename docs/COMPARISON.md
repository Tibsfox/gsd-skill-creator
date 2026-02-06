# Skills vs Agents vs Teams

Choosing the right abstraction for your Claude Code automation.

**Navigation:** [Getting Started](GETTING-STARTED.md) | [CLI Reference](CLI.md) | [API Reference](API.md) | [GSD Teams Guide](GSD-TEAMS.md)

---

## At a Glance

| Abstraction | What It Is | Storage | Scope |
|-------------|-----------|---------|-------|
| **Skill** | A reusable knowledge file with triggers and content | `.claude/skills/<name>/SKILL.md` | Single concern (one pattern, one domain) |
| **Agent** | A composite persona bundling skills with tools and model | `.claude/agents/<name>.md` | Single workflow (related skills working together) |
| **Team** | Multiple coordinated agents with a topology and lead | `.claude/teams/<name>.json` + member agents | Multi-agent coordination (parallel or pipelined work) |

Each builds on the previous: skills are composed into agents, agents are coordinated into teams.

---

## When to Use Each

### Use a Skill when...

- You have a **single pattern** that repeats (coding convention, workflow step, domain knowledge)
- The knowledge fits in **one Markdown file** (typically under 2000 tokens)
- It should **auto-activate** based on context (file types, intent keywords)
- You want to **share knowledge** across projects (user-level scope)

**Examples:** Git commit conventions, TypeScript strict patterns, code review checklist, API error handling

### Use an Agent when...

- You need **multiple skills working together** for a common workflow
- The work requires a **specific model** (opus for deep analysis, haiku for speed)
- You want to **restrict tools** available during the workflow
- Skills frequently **co-activate** (5+ times over 7+ days)

**Examples:** Full-stack React agent (hooks + components + API patterns), code review agent (style + security + performance skills)

### Use a Team when...

- Work can be split into **truly independent parallel streams**
- Each worker benefits from a **separate context window** (prevents context degradation)
- You need **adversarial perspectives** (multiple investigators avoiding confirmation bias)
- A single agent would **fill its context** before completing all dimensions of work

**Examples:** Parallel research across 4+ dimensions, adversarial debugging with competing hypotheses

### Decision Tree

```
Is it a single piece of reusable knowledge?
  YES --> Create a Skill
  NO  --> Does it combine multiple skills into one workflow?
    YES --> Create an Agent
    NO  --> Does it require multiple agents working in parallel?
      YES --> Does each agent need its own context window?
        YES --> Create a Team
        NO  --> Use sequential Task() subagents instead
      NO  --> Create an Agent (single agent, multiple concerns)
```

---

## Feature Comparison

| Feature | Skill | Agent | Team |
|---------|-------|-------|------|
| Auto-activation by context | Yes | No (explicit invocation) | No (explicit invocation) |
| Token budget management | Yes (2-5% of context) | No (full agent context) | No (each member has full context) |
| Model selection | No (uses session model) | Yes (per agent) | Yes (per member) |
| Tool restrictions | No | Yes (allowed-tools) | Yes (per member) |
| Parallel execution | No | No | Yes (topology-dependent) |
| Inter-agent communication | N/A | N/A | Yes (inbox messages) |
| Version tracking | Yes (git history) | Yes (git history) | Yes (git history) |
| Conflict detection | Yes (semantic similarity) | No | Yes (cross-member tool + skill overlap) |
| Inheritance/extension | Yes (extends field) | No | No |
| Feedback learning | Yes (refinement loop) | No | No |
| Validation | Yes (format + activation scoring) | Yes (format check) | Yes (schema + topology + role coherence) |
| CLI management | create, list, search, test | agents suggest, agents list | team create, list, validate, spawn, status |
| Typical count per project | 10-50 | 2-5 | 0-2 |

---

## Evolution Path

Abstractions naturally evolve as complexity grows:

### Stage 1: Skills

Start with individual skills. As you work, the system observes patterns and suggests new skills.

```
Pattern detected (3+ times) --> Skill created --> Auto-activates in context
```

### Stage 2: Agents

When skills frequently co-activate, compose them into agents for common workflows.

```
Skills co-activate (5+ times) --> Agent suggested --> Bundles skills + tools + model
```

### Stage 3: Teams

When a single agent can't handle the breadth of work without context degradation, coordinate multiple agents.

```
Work requires parallel investigation --> Team created --> Members work independently, lead synthesizes
```

### When NOT to Escalate

- **Don't create an agent** for a single skill. The overhead of agent invocation exceeds the benefit.
- **Don't create a team** for sequential work. Teams add coordination overhead that only pays off with true parallelism.
- **Don't create a team** for work a single agent handles well. If the agent completes the task without context degradation, a team is unnecessary.

---

## Choosing for GSD Workflows

Most GSD workflows use Task() subagents (sequential, focused work). Only two patterns benefit from teams:

| GSD Workflow | Recommended Abstraction | Why |
|-------------|------------------------|-----|
| Planning | Agent (subagent) | Sequential: gather context, break down work, write plans |
| Execution | Agent (subagent) | Each plan is one atomic unit of work |
| Verification | Agent (subagent) | Single verifier checks against must_haves |
| Quick tasks | Agent (subagent) | Small and focused by definition |
| Standard debugging | Agent (subagent) | Hypothesis-test cycle needs context continuity |
| **Parallel research** | **Team** | 4+ independent dimensions benefit from separate context windows |
| **Adversarial debugging** | **Team** | Competing hypotheses reduce confirmation bias |

For detailed analysis of each workflow, see [GSD Teams Guide](GSD-TEAMS.md).

---

## See Also

- [CLI Reference](CLI.md) -- All commands for skills, agents, and teams
- [API Reference](API.md) -- Programmatic access to all modules
- [GSD Teams Guide](GSD-TEAMS.md) -- Detailed teams vs subagents analysis
- [Team Creation Tutorial](tutorials/team-creation.md) -- Step-by-step team creation
- [Official Format](OFFICIAL-FORMAT.md) -- Claude Code skill and agent specifications
- [Architecture](architecture/) -- System design and module dependencies
