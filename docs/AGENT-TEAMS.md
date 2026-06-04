# Agent Teams

> **Status: dormant on the dev line (paused pending a runtime).** The agent-teams
> primitive validates, inspects, and manages team configs, but there is **no
> execution runtime** — no `team run` verb exists, and `team spawn` is a readiness
> CHECK only (as of v1.49.971 it no longer scaffolds agent files). The 4 demo teams
> are no longer installed to `.claude/teams/`; they remain as reference examples
> under `examples/teams/`. See [`AGENT-TEAMS-DORMANT.md`](AGENT-TEAMS-DORMANT.md)
> for the disposition, what still works, and the resume condition. The CLI verbs
> and validation below remain fully supported.

Agent teams coordinate multiple Claude Code agents working together on complex tasks. Teams support leader-worker, pipeline, swarm, and custom topologies.

## Team Configuration

Teams are stored as JSON files in `.claude/teams/`:

```json
{
  "name": "research-team",
  "description": "Parallel research across multiple dimensions",
  "leadAgentId": "research-synthesizer",
  "members": [
    { "agentId": "research-synthesizer", "name": "Synthesizer", "agentType": "coordinator", "model": "sonnet" },
    { "agentId": "researcher-alpha", "name": "Alpha", "agentType": "specialist", "model": "opus" }
  ],
  "createdAt": "2026-01-15T10:00:00Z"
}
```

Each member references an agent file in `.claude/agents/`. The `leadAgentId` must match one member's `agentId`.

## Team Validation

Team validation checks schema compliance, topology rules, tool overlap, skill conflicts, and role coherence:

```bash
skill-creator team validate my-team   # Validate specific team
skill-creator team validate --all     # Validate all teams
```

Errors are blocking (invalid schema, missing lead, duplicate IDs, topology violations, dependency cycles). Warnings are informational (tool overlap, skill conflicts, role coherence).

## GSD Workflow Templates

Two built-in templates for GSD workflows:

| Template | Members | Pattern | Use Case |
|----------|---------|---------|----------|
| Research Team | 5 (1 synthesizer + 4 researchers) | leader-worker | Parallel ecosystem research |
| Debugging Team | 4 (1 coordinator + 3 investigators) | leader-worker | Adversarial debugging |

```typescript
import { generateGsdResearchTeam, generateGsdDebuggingTeam } from 'gsd-skill-creator';

const research = generateGsdResearchTeam();
const debugging = generateGsdDebuggingTeam();
```

See [GSD-TEAMS.md](GSD-TEAMS.md) for detailed workflow analysis and [COMPARISON.md](COMPARISON.md) for choosing the right abstraction.
