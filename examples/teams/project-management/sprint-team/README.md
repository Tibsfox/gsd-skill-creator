---
name: sprint-team
type: team
category: project-management
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/project-management/sprint-team/README.md
description: Agile execution team for sprint-level project management. Lei facilitates ceremonies and coaches agile practices, Gantt produces schedules and tracks progress, Goldratt identifies bottlenecks and manages buffers, and Sinek synthesizes findings for stakeholders and provides level-appropriate coaching. Use for sprint planning, backlog grooming, velocity analysis, Kanban optimization, and daily standup facilitation. Not for multi-domain project assessment, risk-heavy analysis, or comprehensive retrospectives.
superseded_by: null
---
# Sprint Team

Agile execution team for sprint-level project management. Combines Lei's agile coaching, Gantt's scheduling rigor, Goldratt's constraint focus, and Sinek's communication clarity into a lightweight team purpose-built for iterative delivery work. This is the team you reach for when the work is sprint-scoped and the goal is flow.

## When to use this team

- **Sprint planning** -- when the team needs to select work from the backlog, estimate capacity, identify dependencies, and commit to a sprint goal with constraint awareness.
- **Backlog grooming** -- when the backlog needs refinement, prioritization, and decomposition into sprint-ready work items with clear acceptance criteria.
- **Velocity analysis** -- when the team wants to understand their delivery patterns, calibrate estimation, and identify systemic factors affecting throughput.
- **Kanban optimization** -- when a team using Kanban or Scrumban needs flow analysis, WIP limit tuning, and cycle time improvement.
- **Daily standup facilitation** -- when standups have become status reports and need to be restored to their purpose: coordination and blocker removal.
- **Sprint retrospective (lightweight)** -- when the team needs a focused retro on sprint-level issues without the full quality audit of `program-review-team`.
- **Framework selection** -- when a team is choosing between Scrum, Kanban, Scrumban, or XP and needs structured guidance based on their actual context.
- **WIP management** -- when work-in-progress is accumulating, lead times are growing, and the team needs intervention to restore flow.

## When NOT to use this team

- **Multi-domain project assessment** -- use `project-assessment-team` for problems spanning risk, quality, scheduling, and team dynamics.
- **Risk-heavy analysis** -- the sprint team does not include Hamilton. If the sprint involves significant integration risk or failure mode analysis, route through Brooks to get Hamilton involved.
- **Comprehensive retrospectives** -- use `program-review-team` for milestone-level retrospectives, quality audits, and process improvement with statistical rigor.
- **New project kickoff** -- the sprint team operates within an existing project. For initial assessment and planning, use `project-assessment-team`.
- **Strategic portfolio decisions** -- sprint-level thinking does not scale to portfolio-level resource allocation. Use the full assessment team.

## Composition

The sprint team runs four Project Management Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Scrum Master** | `lei` | Agile coaching, flow metrics, waste identification, ceremony facilitation | Sonnet |
| **Planning** | `gantt` | WBS, estimation, schedule, progress tracking | Sonnet |
| **Constraints** | `goldratt` | Bottleneck identification, buffer management, WIP analysis | Sonnet |
| **Facilitation / Pedagogy** | `sinek` | Stakeholder communication, purpose alignment, level-appropriate synthesis | Sonnet |

All four agents run on Sonnet. The sprint team is designed for speed and cost efficiency -- sprint-level work is well-defined and computationally bounded, making Opus unnecessary. This makes the sprint team roughly 3x cheaper per invocation than the full assessment team.

## Orchestration flow

```
Input: user query + team context + optional sprint data
        |
        v
+---------------------------+
| Lei (Sonnet)              |  Phase 1: Facilitate and frame
| Lead / Scrum Master       |          - identify the sprint question
+---------------------------+          - determine ceremony type
        |                              - assess team's agile maturity
        |                              - frame the work for specialists
        |
        +--------+--------+
        |        |        |
        v        v        v
      Gantt   Goldratt  (Sinek
      (plan)  (constr)   waits)
        |        |
    Phase 2: Gantt and Goldratt work in parallel.
             Gantt produces the schedule structure.
             Goldratt identifies constraints and
             challenges the schedule's assumptions.
        |        |
        +--------+
                 |
                 v
      +---------------------------+
      | Lei (Sonnet)              |  Phase 3: Integrate
      | Merge schedule + constr.  |          - reconcile Gantt schedule
      +---------------------------+            with Goldratt constraints
                 |                           - apply agile framing
                 v                           - identify waste and flow issues
      +---------------------------+
      | Sinek (Sonnet)            |  Phase 4: Synthesize
      | Stakeholder-ready output  |          - adapt to audience
      +---------------------------+          - frame purpose
                 |                           - add coaching where needed
                 v
          Final response to user
          + ProjectSession Grove record
```

## Synthesis rules

Lei integrates the specialist outputs using these rules:

### Rule 1 -- Flow over milestones

When Gantt's milestone-based view and Lei's flow-based view produce different pictures of project health, the flow view takes priority for sprint-level decisions. Milestones matter for stakeholder communication; flow metrics matter for execution decisions.

### Rule 2 -- Constraints before optimization

When Goldratt identifies a bottleneck, all other recommendations are evaluated against it. A flow improvement from Lei that does not address the constraint produces zero throughput gain. A schedule from Gantt that ignores the constraint is fiction. The constraint shapes the sprint plan.

### Rule 3 -- Challenge padded estimates

Goldratt challenges every estimate Gantt produces. Individual task padding is stripped and aggregated into sprint-level buffers. This is not adversarial -- it is the CCPM methodology applied at the sprint scale. Gantt provides the structure; Goldratt provides the discipline.

### Rule 4 -- WIP limits are non-negotiable

When the team's WIP exceeds 2x team size, Lei's first recommendation is always to reduce WIP before any other intervention. Goldratt's constraint analysis will almost certainly confirm that WIP overload is the bottleneck. The sprint plan must respect WIP limits.

### Rule 5 -- Sinek synthesizes for the audience

Sinek adapts the final output to the audience. For the development team, the output is actionable: what to work on, in what order, with what constraints. For stakeholders, the output is strategic: what will be delivered, when, and what risks exist. The analytical content is the same; the framing differs.

## Input contract

The sprint team accepts:

1. **User query** (required). Natural language question about sprint-level work.
2. **Team context** (required for first invocation, optional for follow-ups). Team size, current practices, delivery cadence, work item types, and observed problems.
3. **Sprint data** (optional but recommended). Backlog items, velocity history, cycle time data, current WIP count, and board state.
4. **User level** (optional). One of: `junior-pm`, `mid-pm`, `senior-pm`, `executive`. If omitted, inferred from the query.
5. **Prior ProjectSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Sprint-actionable response

A response that:

- Directly addresses the sprint-level question
- Provides a concrete plan, schedule, or recommendation
- Identifies the current constraint and how the plan accounts for it
- Includes flow metrics and their interpretation
- Suggests specific ceremony improvements when relevant
- Maps to GSD commands where applicable

### Grove records

The sprint team produces the following Grove record types:

**ProjectPlan** -- when sprint planning produces a schedule:

```yaml
type: ProjectPlan
project_name: "Sprint 14 Plan"
objectives:
  - "Complete auth service integration (3 stories)"
  - "Reduce QA backlog by 50%"
wbs:
  - "Auth endpoint migration (3 stories, 13 points)"
  - "QA backlog clearance (5 stories, 8 points)"
milestones:
  - name: "Sprint goal: Auth integration complete"
    date: "Sprint Day 10"
    criteria: "Auth endpoints live in staging with integration tests passing"
critical_path:
  - "Auth-001 -> Auth-002 -> Auth-003 -> Integration test"
dependencies:
  - from: "Auth-002"
    to: "Auth-003"
    type: finish_to_start
risks:
  - "QA capacity is the constraint -- if auth stories require more QA than planned, backlog clearance goal is at risk"
concept_ids:
  - pm-sprint-planning
  - pm-critical-chain
agent: lei
```

**ProjectStatus** -- when tracking sprint progress:

```yaml
type: ProjectStatus
reporting_period: "Sprint 14, Days 1-5"
accomplishments:
  - "Auth-001 complete (2 days actual vs 3 estimated)"
  - "QA backlog reduced by 3 items"
upcoming:
  - "Auth-002 in progress, expected Day 7"
  - "Auth-003 ready to start Day 8"
risks_issues:
  - "QA queue growing -- Auth-001 consumed 1.5 days QA vs 0.5 planned"
metrics:
  flow:
    wip: 4
    wip_limit: 6
    cycle_time_median: "2.1 days"
    throughput: "3 items in 5 days"
  buffer:
    sprint_buffer_total: "2 days"
    sprint_buffer_consumed: "0.5 days"
    status: green
concept_ids:
  - pm-sprint-tracking
  - pm-flow-metrics
agent: lei
```

## Ceremony-specific protocols

### Sprint planning protocol

1. **Lei** reviews the backlog and assesses team capacity using flow metrics (throughput-based, not velocity-based).
2. **Gantt** decomposes selected work items into tasks, estimates with PERT three-point, and identifies the critical path within the sprint.
3. **Goldratt** identifies the sprint's constraint resource, challenges padded estimates, and proposes a sprint-level buffer.
4. **Lei** finalizes the sprint plan with WIP limits, pull policies, and acceptance criteria.
5. **Sinek** frames the sprint goal as a purpose statement and prepares stakeholder communication.

### Backlog grooming protocol

1. **Lei** assesses backlog health: age distribution, refinement coverage, and prioritization clarity.
2. **Gantt** decomposes large items into sprint-ready work packages (no item larger than 3 developer-days).
3. **Goldratt** challenges priority ordering: is the highest-priority item actually on the constraint? Are we refining items that will never be pulled?
4. **Sinek** ensures each item has a clear "why" -- acceptance criteria tell you what; purpose tells you why it matters.

### Standup restoration protocol

1. **Lei** diagnoses standup dysfunction (status reporting, manager-facing, no coordination, over-time).
2. **Sinek** coaches the team lead on the purpose of the standup and how to redirect it.
3. **Goldratt** provides the constraint-focused standup question: "What is blocking the constraint resource today?"
4. **Lei** proposes a revised standup format appropriate to the team's maturity.

### Velocity analysis protocol

1. **Gantt** computes velocity statistics (mean, standard deviation, trend) and earned value metrics.
2. **Goldratt** challenges the interpretation: is velocity a meaningful measure for this team, or is throughput more appropriate?
3. **Lei** provides the flow perspective: cycle time distribution, lead time trends, and WIP correlation.
4. **Sinek** explains findings at the appropriate level and warns against using velocity as a performance metric.

## Escalation paths

### Internal escalations (within the team)

- **Goldratt identifies a constraint the sprint cannot resolve:** When the bottleneck is organizational (e.g., a shared resource across teams), the sprint team can only accommodate the constraint, not eliminate it. Lei documents the constraint for escalation to the full assessment team.
- **Gantt's schedule exceeds sprint capacity:** When the committed work exceeds what the team can deliver (adjusted for Goldratt's constraint analysis), Lei facilitates scope reduction. The sprint goal is renegotiated, not the team's capacity.
- **Standup dysfunction resists protocol fixes:** When standup problems stem from psychological safety issues rather than format issues, escalate to `program-review-team` where Sinek and Deming can address the systemic root.

### Escalation to project-assessment-team

- When sprint-level analysis reveals problems that span risk, quality, and organizational dynamics, the sprint team recommends escalation to the full assessment team. Sprint-level tools cannot diagnose program-level problems.

### Escalation to the user

- **Team capacity mismatch:** When the backlog consistently exceeds capacity, the sprint team reports this as a systemic issue requiring either scope reduction or team growth -- a decision that belongs to the user, not the team.
- **Framework mismatch:** When the team's current agile framework is clearly inappropriate for their context, Lei recommends a framework transition with a concrete proposal.

## Token / time cost

Approximate cost per sprint team invocation:

- **Lei** -- 2 Sonnet invocations (facilitate + integrate), ~20K tokens total
- **Gantt** -- 1 Sonnet invocation, ~15K tokens
- **Goldratt** -- 1 Sonnet invocation, ~15K tokens
- **Sinek** -- 1 Sonnet invocation, ~15K tokens
- **Total** -- 60-100K tokens, 2-5 minutes wall-clock

This cost is roughly one-third of the full assessment team, making it appropriate for regular sprint-cadence use.

## Configuration

```yaml
name: sprint-team
lead: lei
specialists:
  - planning: gantt
  - constraints: goldratt
facilitation: sinek

parallel: true
timeout_minutes: 10

# Lei may skip Goldratt for pure coaching queries
auto_skip: true

# Minimum specialists invoked
min_specialists: 2
```

## Invocation

```
# Sprint planning
> sprint-team: Plan Sprint 14. Team: 4 developers, 1 QA. Backlog: 12 refined
  stories totaling 34 points. Velocity average: 28 points. Constraint: QA
  capacity.

# Backlog grooming
> sprint-team: Our backlog has 47 items, the oldest is 6 months old, and only
  12 are refined. Help us get this under control.

# Velocity analysis
> sprint-team: Here are our last 10 sprints of velocity data: [28, 34, 22, 31,
  38, 26, 33, 29, 35, 27]. Are we improving? What should we track instead?

# Standup repair
> sprint-team: Our standup takes 25 minutes, feels like a status report, and
  nobody mentions blockers until they've been stuck for days. Fix this.

# Kanban optimization
> sprint-team: We switched to Kanban 2 months ago. Cycle time is 6 days median
  but 18 days p95. Something is wrong. WIP is currently 14 for a team of 5.

# Follow-up
> sprint-team: (session: grove:abc123) Sprint 14 is at day 7. Auth-002 took
  longer than expected. Do we need to adjust the sprint goal?
```

## Limitations

- The sprint team does not include Hamilton (risk) or Deming (quality). Sprint-level work that involves significant integration risk or quality audit should escalate to the full assessment team or the program review team.
- The team operates within the assumption that the project structure is sound. It optimizes sprint execution, not project strategy.
- Flow metrics require historical data. On a team's first sprint with the sprint team, recommendations are less precise and carry explicit uncertainty flags.
- The team cannot resolve organizational bottlenecks. When the constraint is outside the team's control (shared resources, external dependencies, organizational policy), the sprint team can only accommodate it and recommend escalation.
- All four agents run on Sonnet, optimizing for speed and cost. Problems requiring deep reasoning about ambiguous organizational dynamics should be routed to teams with Opus agents.
