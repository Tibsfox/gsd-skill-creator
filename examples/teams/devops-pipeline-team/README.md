# DevOps Pipeline Team

Full CI/CD pipeline audit with specialized analyzers that examine pipelines from four distinct angles: bottleneck detection, test optimization, deployment validation, and security review. A coordinator synthesizes all findings into a prioritized pipeline health report with actionable improvements.

## When to Use This Team

- Full CI/CD pipeline audit to identify bottlenecks and inefficiencies
- Pipeline migration planning (e.g., Jenkins to GitHub Actions)
- Deployment strategy optimization and rollback readiness review
- Pre-production readiness review before a major release

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| pipeline-coordinator | Leader | Synthesizes findings, prioritizes improvements, produces health report | Read, Glob, Grep, Bash | sonnet |
| pipeline-analyzer | Worker | CI/CD bottlenecks, parallelization, cache optimization | Read, Glob, Grep, Bash | sonnet |
| test-orchestrator | Worker | Test selection, coverage analysis, flaky test detection | Read, Glob, Grep, Bash | sonnet |
| deployment-validator | Worker | Deployment config validation, readiness checks, rollback plans | Read, Glob, Grep, Bash | sonnet |
| security-reviewer | Worker | Pipeline security, secret handling, permission analysis | Read, Glob, Grep | sonnet |

## Safety Properties

Workers have read and bash access for running analysis commands, but no destructive operations are performed:

- **All findings are advisory.** The team produces recommendations; it does not modify pipelines, configs, or infrastructure.
- **No destructive operations.** Bash access is limited to analysis commands (listing files, checking configs, running dry-run validations).
- **Security-reviewer is read-only.** The security worker has no Bash access to prevent any accidental exposure during secret scanning.
- **Parallel-safe.** All four workers can analyze different pipeline aspects simultaneously without conflict.

## How It Works

1. The **pipeline-coordinator** receives the audit request (pipeline configs, CI/CD platform, scope).
2. The coordinator delegates specific analysis areas to each worker based on the pipeline structure.
3. **pipeline-analyzer** examines workflow files for bottlenecks, missed parallelism, and cache opportunities.
4. **test-orchestrator** analyzes the test strategy, identifying slow tests, flaky tests, and coverage gaps.
5. **deployment-validator** reviews deployment configs for consistency, environment parity, and rollback readiness.
6. **security-reviewer** scans for exposed secrets, overly permissive tokens, and insecure pipeline steps.
7. The coordinator collects all findings, resolves overlapping concerns, and produces a unified health report with prioritized improvements.

## Example Usage Scenario

**Input:** "Audit our CI/CD pipeline before migrating to GitHub Actions"

**Flow:**
- pipeline-analyzer checks workflow structure, identifies sequential steps that could run in parallel, finds missing cache directives
- test-orchestrator analyzes test strategy, finds 12 flaky tests and recommends test splitting for parallelism
- deployment-validator reviews deploy configs, identifies environment variable drift between staging and production
- security-reviewer scans for secret exposure, finds hardcoded API key in workflow file and overly permissive GITHUB_TOKEN permissions
- pipeline-coordinator produces unified report: 2 critical (security), 4 high (bottlenecks), 6 moderate (test optimization), 3 low (config cleanup)

## Integration Notes

- This team pairs well with pipeline migration projects where a comprehensive audit is needed before rebuilding
- The advisory-only constraint means it can safely analyze production pipeline configs without risk
- For teams that need fixes applied, pair this team's output with a separate implementation agent
- All workers use sonnet for cost efficiency; analysis tasks do not require opus-level reasoning
