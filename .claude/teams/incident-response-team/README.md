# Incident Response Team

Coordinated incident response with specialized workers that analyze incidents from four distinct angles: log/metric correlation, SLO impact assessment, runbook execution, and codebase navigation. An incident commander orchestrates the response and produces root cause analysis and blameless postmortem reports.

## When to Use This Team

- Active incident response requiring coordinated evidence gathering
- Post-incident analysis and root cause determination
- Blameless postmortem generation with timeline reconstruction
- Reliability review and SLO impact assessment

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| incident-commander | Leader | Coordinates response, synthesizes RCA, produces postmortem | Read, Glob, Grep, Bash | opus |
| incident-analyzer | Worker | Log/metric correlation, timeline reconstruction, root cause | Read, Glob, Grep, Bash | opus |
| slo-monitor | Worker | SLO impact assessment, error budget consumption | Read, Glob, Grep | sonnet |
| runbook-executor | Worker | Remediation runbook execution with approval gates | Read, Glob, Grep, Bash | sonnet |
| codebase-navigator | Worker | Code path tracing, failure point identification | Read, Glob, Grep | sonnet |

## Safety Properties

This team is designed with strict safety constraints appropriate for incident response:

- **incident-commander uses opus** for the complex reasoning required to coordinate incident response and synthesize root cause analysis across multiple evidence sources.
- **incident-analyzer uses opus** for nuanced log correlation and root cause reasoning that requires deep contextual understanding.
- **runbook-executor requires approval gates** for any remediation actions that modify state. No autonomous remediation without explicit approval.
- **All evidence gathering is read-only.** Workers collect logs, metrics, and code references without modifying any systems.
- **slo-monitor and codebase-navigator are read-only.** These workers have no Bash access, ensuring they cannot accidentally affect running systems.

## How It Works

1. The **incident-commander** receives the incident report (symptoms, affected services, timeline).
2. The commander delegates investigation tasks to each worker based on the incident scope.
3. **incident-analyzer** correlates logs and metrics, reconstructing the timeline of events leading to the failure.
4. **slo-monitor** calculates the SLO impact, error budget consumption, and customer-facing availability during the incident window.
5. **codebase-navigator** traces the code paths involved in the failure, identifying the exact functions and conditions that triggered the error.
6. **runbook-executor** identifies applicable runbooks and suggests remediation steps, presenting each action for approval before execution.
7. The incident commander synthesizes all findings into a root cause analysis, incident timeline, and blameless postmortem with action items.

## Example Usage Scenario

**Input:** "Production API returning 500s for 10% of requests"

**Flow:**
- incident-analyzer correlates application logs with infrastructure metrics, reconstructs the error timeline, and identifies a database connection pool exhaustion as the proximate cause
- slo-monitor calculates that the incident has consumed 40% of the monthly error budget and breached the 99.9% availability SLA for the past 2 hours
- codebase-navigator traces the failing code path from the HTTP handler through the service layer to the database connection pool, identifying a missing connection timeout
- runbook-executor suggests the connection pool restart runbook and presents each step for approval
- incident-commander produces postmortem: root cause was unbounded connection acquisition under load spike, contributing factors included missing connection timeout and no circuit breaker

## Integration Notes

- This team is most effective when given access to log files, metrics data, and the relevant codebase
- The opus model is used for the commander and analyzer roles where complex multi-source reasoning is critical
- For cost optimization, slo-monitor and codebase-navigator use sonnet since their tasks are more structured
- Pair this team's postmortem output with a planning agent to create follow-up action items
