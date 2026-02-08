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
| [agent-orchestration](agent-orchestration/SKILL.md) | AI/Multi-Agent | MCP servers, A2A protocol, multi-agent coordination, swarm architectures |
| [chaos-engineering](chaos-engineering/SKILL.md) | Resilience Testing | Fault injection, game day planning, resilience experiments |
| [compliance-governance](compliance-governance/SKILL.md) | Compliance | OPA/Kyverno policies, SBOM, SLSA, SOC2/HIPAA/PCI-DSS mapping |
| [file-operation-patterns](file-operation-patterns/SKILL.md) | Shell/DevOps | Safe file system operations for scripts and deployments |
| [finops-patterns](finops-patterns/SKILL.md) | Cloud Finance | Cost optimization, rightsizing, reserved/spot instances, chargeback models |
| [gitops-patterns](gitops-patterns/SKILL.md) | Continuous Delivery | ArgoCD, Flux, progressive delivery, sealed secrets |
| [incident-response](incident-response/SKILL.md) | Operations | Severity classification, war rooms, runbooks, blameless postmortems |
| [infrastructure-as-code](infrastructure-as-code/SKILL.md) | Infrastructure | Terraform, Pulumi, CloudFormation, module composition, state management |
| [kubernetes-patterns](kubernetes-patterns/SKILL.md) | Container Orchestration | Helm, service mesh, HPA/VPA/KEDA, security contexts, namespaces |
| [monitoring-observability](monitoring-observability/SKILL.md) | Observability | Logs/metrics/traces, OpenTelemetry, Prometheus/Grafana, SLO alerting |
| [platform-engineering](platform-engineering/SKILL.md) | Developer Experience | IDPs, golden paths, Backstage catalogs, self-service workflows |
| [release-management](release-management/SKILL.md) | Release Engineering | Blue-green, canary, rolling deploys, feature flags, rollback |
| [sre-patterns](sre-patterns/SKILL.md) | Site Reliability | SLOs/SLIs/SLAs, error budgets, toil reduction, reliability reviews |

### General Agents

| Agent | Domain | Use Case |
|-------|--------|----------|
| [codebase-navigator](codebase-navigator/AGENT.md) | Architecture Analysis | Read-only codebase exploration and architecture mapping |
| [security-reviewer](security-reviewer/AGENT.md) | Application Security | OWASP vulnerability scanning and secret detection |
| [performance-profiler](performance-profiler/AGENT.md) | Performance Analysis | Algorithmic complexity and optimization recommendations |
| [changelog-generator](changelog-generator/AGENT.md) | Release Management | Generate changelogs from git history |
| [doc-linter](doc-linter/AGENT.md) | Documentation Quality | Audit docs for broken links, stale content, consistency |
| [capacity-planner](capacity-planner/AGENT.md) | Infrastructure | Resource usage analysis, scaling bottlenecks, growth projections |
| [compliance-auditor](compliance-auditor/AGENT.md) | Compliance | SOC2/HIPAA/PCI-DSS/GDPR control mapping and gap analysis |
| [cost-optimizer](cost-optimizer/AGENT.md) | FinOps | Cloud cost waste detection, rightsizing, savings recommendations |
| [dependency-health-checker](dependency-health-checker/AGENT.md) | Supply Chain | Package freshness, EOL detection, license compliance |
| [deployment-validator](deployment-validator/AGENT.md) | Release Engineering | Deployment readiness checks, rollback plans, environment parity |
| [drift-detector](drift-detector/AGENT.md) | Infrastructure | IaC vs actual state drift, cross-environment inconsistencies |
| [incident-analyzer](incident-analyzer/AGENT.md) | Operations | Log/metric/trace correlation, root cause analysis, postmortem generation |
| [infrastructure-auditor](infrastructure-auditor/AGENT.md) | Infrastructure | IaC security misconfigs, cost optimization, compliance violations |
| [pipeline-analyzer](pipeline-analyzer/AGENT.md) | CI/CD | Pipeline bottlenecks, parallelization, cache optimization |
| [release-risk-scorer](release-risk-scorer/AGENT.md) | Release Engineering | Risk scoring by blast radius, dependency impact, failure patterns |
| [runbook-executor](runbook-executor/AGENT.md) | Operations | Step-by-step runbook execution with approval gates and rollback |
| [slo-monitor](slo-monitor/AGENT.md) | SRE | SLO validation, error budget consumption, burn rate analysis |
| [test-orchestrator](test-orchestrator/AGENT.md) | Testing | Intelligent test selection, coverage analysis, flaky test detection |
| [vulnerability-triager](vulnerability-triager/AGENT.md) | Security | Exploitability/reachability triage, remediation prioritization |

### General Teams

| Team | Domain | Members | Use Case |
|------|--------|---------|----------|
| [code-review-team](code-review-team/) | Multi-Perspective Review | 5 (all read-only) | Parallel review: correctness, security, performance, maintainability |
| [doc-generation-team](doc-generation-team/) | Documentation Generation | 4 (write-scoped) | Parallel doc writing: API docs, architecture, user guides |
| [migration-team](migration-team/) | Framework Migration | 5 (mixed access) | Coordinated migration: analyze, transform, test, configure |
| [devops-pipeline-team](devops-pipeline-team/) | CI/CD | leader-worker | Pipeline audit: bottleneck detection, test optimization, deployment validation |
| [incident-response-team](incident-response-team/) | Operations | leader-worker | Coordinated incident response: log correlation, SLO impact, runbook execution |
| [infrastructure-review-team](infrastructure-review-team/) | Infrastructure | leader-worker | Multi-dimensional IaC audit: best practices, drift, cost, compliance |
| [platform-onboarding-team](platform-onboarding-team/) | Developer Experience | leader-worker | Onboarding evaluation: architecture, CI/CD, infrastructure, test strategy |
| [release-management-team](release-management-team/) | Release Engineering | leader-worker | Release readiness: risk scoring, deployment validation, go/no-go decisions |
| [security-audit-team](security-audit-team/) | Security | leader-worker | Comprehensive audit: OWASP, vulnerability triage, compliance, dependencies |
| [sre-operations-team](sre-operations-team/) | SRE | leader-worker | Operational health: SLO validation, capacity planning, incident patterns |

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
| Skills | 33 | Git, Code Quality, Testing, TypeScript, Decision-Making, API Design, Docker, Environment Config, Session Continuity, SQL, CI/CD, Hooks, Accessibility, Supply Chain, AI/Multi-Agent, Resilience, Compliance, Shell/DevOps, FinOps, GitOps, Operations, Infrastructure, Kubernetes, Observability, Platform Engineering, Release Engineering, SRE, GSD (5) |
| Agents | 22 | Architecture, Security, Performance, Release Management, Documentation, Infrastructure, Compliance, FinOps, Supply Chain, Operations, CI/CD, SRE, Testing, GSD (3) |
| Teams | 10 | Code Review, Documentation, Migration, CI/CD, Operations, Infrastructure, Developer Experience, Release Engineering, Security, SRE |
| **Total** | **65** | **35+ distinct domains** |

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
