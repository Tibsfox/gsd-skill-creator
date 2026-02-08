# Release Management Team

Release readiness assessment with specialized workers that analyze releases from four distinct angles: risk scoring, deployment validation, changelog generation, and test coverage verification. A coordinator synthesizes all findings into a go/no-go recommendation backed by evidence.

## When to Use This Team

- Release readiness review before deploying to production
- Pre-deployment validation of configs and rollback plans
- Release planning to assess risk and scope of upcoming changes
- Changelog generation and release note preparation

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| release-coordinator | Leader | Synthesizes risk analysis, produces go/no-go recommendation | Read, Glob, Grep, Bash | sonnet |
| release-risk-scorer | Worker | Change risk scoring, blast radius, dependency impact | Read, Glob, Grep | opus |
| deployment-validator | Worker | Deployment config validation, environment parity, rollback plans | Read, Glob, Grep, Bash | sonnet |
| changelog-generator | Worker | Release notes, changelog from commits, breaking change detection | Read, Glob, Grep, Bash | sonnet |
| test-orchestrator | Worker | Test coverage verification, gap identification in changed code | Read, Glob, Grep, Bash | sonnet |

## Safety Properties

This team is read-heavy and advisory only, with no deployment execution capability:

- **Read-heavy analysis.** The team examines code, configs, and commit history without modifying them.
- **risk-scorer uses opus** for nuanced risk assessment that requires weighing multiple factors and understanding complex dependency relationships.
- **No deployment execution.** The team produces go/no-go recommendations but cannot trigger deployments, rollbacks, or environment changes.
- **Advisory output only.** All findings and recommendations are produced as text reports for human decision-makers.
- **Parallel-safe.** All workers analyze different aspects of the release simultaneously without conflict.

## How It Works

1. The **release-coordinator** receives the release request (version, branch, target environment, release scope).
2. The coordinator delegates assessment tasks to each worker based on the release scope.
3. **release-risk-scorer** analyzes the change set, scoring risk by volume of changes, blast radius, dependency impact, and comparison to historical release failures.
4. **deployment-validator** validates deployment configurations, checks for environment variable drift between staging and production, and verifies rollback procedures are documented and tested.
5. **changelog-generator** generates release notes from commit history and PR descriptions, categorizing changes and flagging breaking changes.
6. **test-orchestrator** verifies test coverage for all changed code, identifies gaps in critical paths, and checks for skipped tests.
7. The coordinator synthesizes all findings into a go/no-go recommendation with evidence, risk score, and any blocking issues that must be resolved before release.

## Example Usage Scenario

**Input:** "Prepare release v2.5.0 for production"

**Flow:**
- release-risk-scorer analyzes the change set: 47 files changed across 3 services, identifies a high-risk database migration and a moderate-risk API contract change, scores overall risk as Medium-High
- deployment-validator verifies deployment configs, finds staging and production Kubernetes manifests have divergent resource limits, confirms rollback plan exists but is untested for the new migration
- changelog-generator creates release notes from 23 merged PRs, categorizes 2 breaking changes, 8 features, 7 bug fixes, and 6 maintenance items
- test-orchestrator verifies 89% coverage on changed code but identifies a critical path in the payment service with 0% coverage on the new validation logic
- release-coordinator produces recommendation: NO-GO with 2 blockers (untested rollback for migration, zero coverage on payment validation), 3 warnings (environment drift, high risk score, breaking API changes need client notification)

## Integration Notes

- This team pairs well with CI/CD pipelines that gate deployments on release readiness checks
- The advisory-only constraint means it can safely analyze release artifacts without risk of accidental deployment
- For teams that need automated changelog publishing, pair this team's output with a release automation agent
- risk-scorer uses opus for nuanced multi-factor risk assessment; other workers use sonnet for cost efficiency
