# SRE Operations Team

Comprehensive SRE operations review with specialized analysts that evaluate service reliability from four distinct angles: SLO validation, capacity planning, incident patterns, and performance profiling. A coordinator synthesizes all findings into an operational health report with actionable improvement recommendations.

## When to Use This Team

- Quarterly reliability review to assess SLO adherence and error budget health
- Capacity planning cycle to project resource needs and scaling strategy
- SLO definition review to validate or recalibrate service-level objectives
- Operational readiness assessment before a major release or traffic event

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| sre-coordinator | Leader | Synthesizes reliability metrics, coordinates review scope, prioritizes improvements | Read, Glob, Grep, Bash | sonnet |
| slo-monitor | Worker | SLO validation, error budget tracking, breach prediction | Read, Glob, Grep | sonnet |
| capacity-planner | Worker | Resource utilization, growth projections, scaling recommendations | Read, Glob, Grep, Bash | sonnet |
| incident-analyzer | Worker | Incident patterns, MTTR tracking, postmortem review | Read, Glob, Grep, Bash | sonnet |
| performance-profiler | Worker | Latency bottlenecks, query efficiency, memory analysis | Read, Glob, Grep, Bash | sonnet |

## Safety Properties

This team is designed for read-heavy operational analysis:

- **Read-heavy analysis.** All members focus on analyzing existing configurations, metrics definitions, logs, and code rather than making changes.
- **Non-destructive profiling.** performance-profiler uses Bash strictly for read-only operations such as parsing logs and querying metrics, never for load testing or production modifications.
- **No production changes.** No member modifies running services, configuration, or infrastructure. The team produces analysis and recommendations as output text only.
- **Deterministic scope.** Workers analyze only what the coordinator assigns; they cannot expand scope autonomously.

## How It Works

1. The **sre-coordinator** receives the review request (service name, review period, or specific reliability concern).
2. The coordinator delegates specific services, metrics, or time ranges to each worker.
3. Workers analyze their assigned scope and report findings with severity ratings and improvement recommendations.
4. The coordinator collects all findings, cross-references overlapping concerns (e.g., a capacity issue causing SLO breaches), and produces a unified operational health report.
5. The final output is a prioritized improvement plan grouped by reliability impact and implementation effort.

## Example Usage Scenario

**Input:** "Quarterly SRE review for the payment service"

**Flow:**
- slo-monitor validates SLO definitions against actual latency and availability data, calculates error budget burn rate, flags at-risk objectives
- capacity-planner analyzes CPU, memory, and connection pool utilization trends, projects capacity needs for next quarter based on transaction growth
- incident-analyzer reviews incident frequency and severity patterns, tracks MTTR improvements, audits postmortem action item completion
- performance-profiler identifies slow database queries, connection pool saturation points, and memory allocation hotspots in critical payment paths
- sre-coordinator produces a single report: 2 critical (SLO breach risk + capacity ceiling), 4 moderate (incident patterns + query performance), 6 minor (monitoring gaps)

## Integration Notes

- This team pairs well with a monitoring dashboard that provides metrics context for the review period
- slo-monitor intentionally lacks Bash to ensure SLO analysis remains purely analytical against configuration and metric definitions
- For teams that need operational changes applied, consider pairing this team's output with a separate infrastructure or deployment agent
- Workers use sonnet for cost efficiency; the coordinator also uses sonnet since synthesis does not require opus-level reasoning for this domain

---

## Team Configuration

```json
{
  "name": "sre-operations-team",
  "description": "Comprehensive SRE operations review with specialized analysts for SLO validation, capacity planning, incident patterns, and performance profiling. Produces an operational health report with reliability improvement recommendations.",
  "topology": "leader-worker",
  "members": [
    {
      "name": "sre-coordinator",
      "role": "leader",
      "description": "Coordinates SRE operations review across reliability, capacity, incident, and performance dimensions. Synthesizes reliability metrics into an operational health report with prioritized improvement recommendations.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    },
    {
      "name": "slo-monitor",
      "role": "worker",
      "description": "Validates SLO definitions against actual service behavior, tracks error budget consumption rates, predicts budget breaches, and identifies SLIs that need recalibration based on user-facing impact.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    },
    {
      "name": "capacity-planner",
      "role": "worker",
      "description": "Analyzes resource utilization trends, identifies scaling bottlenecks, projects capacity needs based on growth patterns, and recommends horizontal or vertical scaling strategies with cost implications.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    },
    {
      "name": "incident-analyzer",
      "role": "worker",
      "description": "Analyzes incident patterns and frequency, tracks mean time to resolution, reviews postmortem quality and action item completion, identifies recurring failure modes and systemic reliability gaps.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    },
    {
      "name": "performance-profiler",
      "role": "worker",
      "description": "Identifies performance bottlenecks through latency analysis, query efficiency review, memory allocation patterns, connection pool utilization, and hot-path optimization opportunities.",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "model": "sonnet"
    }
  ]
}
```
