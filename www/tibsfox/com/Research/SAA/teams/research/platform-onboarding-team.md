# Platform Onboarding Team

Comprehensive platform onboarding with specialized analysts that evaluate a project from four distinct angles: codebase architecture, CI/CD pipelines, infrastructure setup, and test strategy. A coordinator synthesizes all findings into a unified onboarding guide that accelerates new team ramp-up.

## When to Use This Team

- New team onboarding to an existing project or service
- New service adoption when inheriting an unfamiliar codebase
- Developer platform orientation for engineers joining the organization
- Codebase handoff when the original team is transitioning out

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| onboarding-coordinator | Leader | Synthesizes findings, produces onboarding guide, prioritizes learning paths | Read, Glob, Grep, Bash | sonnet |
| codebase-navigator | Worker | Architecture mapping, component relationships, data flow tracing | Read, Glob, Grep | sonnet |
| pipeline-analyzer | Worker | CI/CD review, build stages, deployment flow, pipeline improvements | Read, Glob, Grep, Bash | sonnet |
| infrastructure-auditor | Worker | IaC review, environment configuration, infrastructure topology | Read, Glob, Grep, Bash | sonnet |
| test-orchestrator | Worker | Test strategy, coverage gaps, test quality, testing recommendations | Read, Glob, Grep, Bash | sonnet |

## Safety Properties

This team is designed for entirely read-only analysis:

- **Entirely read-only.** The team produces documentation and recommendations only. No member modifies code, configuration, or infrastructure.
- **No side effects.** Bash is used for running analysis commands (dependency trees, test suite discovery, build inspection) rather than modifications.
- **Parallel-safe.** All four workers can analyze the same codebase simultaneously without conflict.
- **Deterministic scope.** Workers analyze only what the coordinator assigns; they cannot expand scope autonomously.

## How It Works

1. The **onboarding-coordinator** receives the onboarding request (project repository, service name, or platform scope).
2. The coordinator delegates specific codebases, pipelines, infrastructure modules, or test suites to each worker.
3. Workers analyze their assigned scope and report findings with clarity ratings, complexity assessments, and improvement recommendations.
4. The coordinator collects all findings, identifies the critical learning path for new team members, and produces a unified onboarding guide.
5. The final output is a comprehensive onboarding document with architecture diagrams, key file maps, pipeline walkthroughs, and recommended first tasks.

## Example Usage Scenario

**Input:** "Onboard the new payments team to the platform"

**Flow:**
- codebase-navigator maps the service architecture, identifies domain boundaries, traces the payment processing flow, and documents key abstractions and entry points
- pipeline-analyzer reviews CI/CD configuration, maps build and deployment stages, identifies slow steps, and documents the release process
- infrastructure-auditor checks Terraform modules for IaC compliance, documents the infrastructure topology, and flags any best practice gaps
- test-orchestrator assesses test coverage across unit, integration, and e2e layers, evaluates test reliability, and recommends a testing strategy for the new team
- onboarding-coordinator produces a single onboarding guide: architecture overview, critical path documentation, pipeline walkthrough, infrastructure map, and recommended first-week tasks

## Integration Notes

- This team pairs well with an initial kickoff meeting where the onboarding guide is reviewed with the new team
- codebase-navigator intentionally lacks Bash to ensure architecture analysis remains purely code-focused without execution side effects
- The onboarding guide output can serve as living documentation that evolves with the project
- For teams that need the recommendations applied (pipeline improvements, test additions), consider pairing this team's output with a separate implementation agent

---

## Team Configuration

```json
{
  "name": "platform-onboarding-team",
  "description": "Comprehensive platform onboarding with specialized analysts for codebase architecture, CI/CD pipelines, infrastructure setup, and test strategy. Produces a unified onboarding guide with architecture overview, pipeline recommendations, and testing strategy.",
  "topology": "leader-worker",
  "members": [
    {
      "name": "onboarding-coordinator",
      "role": "leader",
      "description": "Coordinates new service or team onboarding across architecture, pipeline, infrastructure, and testing dimensions. Produces a comprehensive onboarding guide with architecture overview, pipeline setup recommendations, and testing strategy.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    },
    {
      "name": "codebase-navigator",
      "role": "worker",
      "description": "Analyzes codebase architecture, maps component relationships, traces data flow through the system, identifies entry points, key abstractions, and domain boundaries that a new team needs to understand.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    },
    {
      "name": "pipeline-analyzer",
      "role": "worker",
      "description": "Reviews existing CI/CD configuration, maps build and deployment stages, identifies pipeline bottlenecks, evaluates artifact management, and recommends improvements for reliability and speed.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    },
    {
      "name": "infrastructure-auditor",
      "role": "worker",
      "description": "Reviews infrastructure setup for best practice adherence, identifies gaps in IaC coverage, evaluates environment configuration, and documents the infrastructure topology for onboarding context.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    },
    {
      "name": "test-orchestrator",
      "role": "worker",
      "description": "Analyzes existing test strategy across unit, integration, and end-to-end layers, identifies coverage gaps, evaluates test quality and reliability, and recommends a testing approach for the onboarding team.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    }
  ]
}
```
