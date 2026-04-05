# Multi-Agent Task Coordination: Project Management at Machine Scale

**Catalog:** OAA-MTC | **Cluster:** Operations & Admin Automation
**Date:** 2026-04-05 | **Source:** GSD Gastown Chipset (beads-state, token-budget, event-log)
**College:** Project Management, Operations Management, Organizational Behavior

## Abstract

Project management tools like Jira, Asana, and Monday.com coordinate human teams by tracking task state, allocating resources, and maintaining audit trails. The GSD Gastown chipset implements the same coordination primitives for agent teams: beads-state is a project ledger that tracks work-item progress, token-budget enforces resource constraints the way a project budget caps spending, and event-log provides the audit trail that compliance requires. This page maps agent coordination to project management theory, compares GSD's approach to three industry platforms, and provides study material for understanding how the same coordination problems appear whether your team members are humans in an office or agents in a convoy.

## Project Management Concept Mapping

| PM Concept | GSD Implementation | How It Works |
|---|---|---|
| Project board | Beads-state persistence | Key-value state scoped to convoy; tracks each work item's status |
| Task assignment | GUPP propulsion + sling-dispatch | Work items routed to agents based on capability and availability |
| Progress tracking | Event-log category: `execution` | Start, progress, complete, and fail events logged per work item |
| Resource allocation | Token-budget per-agent limits | Each agent has a hard cap; convoy has an aggregate cap |
| Budget tracking | `BudgetReport` with usage percentages | Real-time view of consumed vs. remaining tokens per agent |
| Sprint/iteration | Convoy lifecycle | A convoy represents a bounded unit of work with a defined scope |
| Retrospective | Event-log statistics + compaction digest | Post-convoy analysis: what happened, what failed, compression ratios |
| Risk register | Budget warning thresholds | 80% warning = yellow risk; 100% = red, work stops |
| Stakeholder communication | Mayor-coordinator nudge/mail | Async messaging for status updates and escalation |
| Change request | Convoy manifest amendment | Adding or modifying work items mid-execution |

## Industry Comparison

### Jira (Atlassian)

Jira is the dominant project management tool in software teams. The GSD coordination layer mirrors Jira's core concepts:

- **Jira issues** map to **convoy work items** -- both have status, assignee, and priority
- **Jira boards** (Kanban/Scrum) map to **beads-state** -- both track items through stages
- **Jira workflows** map to **convoy execution model** -- defined transitions between states
- **Jira dashboards** map to **event-log statistics** -- aggregated views of project health
- **Jira automation rules** map to **mayor-coordinator** -- trigger actions on state changes
- Key difference: Jira assumes human velocity (hours/days); GSD assumes agent velocity (seconds/minutes)

### Asana

Asana focuses on task management with timeline views and workload balancing. The token-budget system is closest to Asana's workload feature:

- **Asana workload** shows capacity per team member; **token-budget** shows capacity per agent
- **Asana timeline** shows task dependencies; **convoy DAG** shows work item dependencies
- **Asana status updates** are periodic; **event-log** is continuous and append-only
- **Asana rules** trigger on field changes; **mayor-coordinator** triggers on event patterns
- Both support portfolio-level views (multiple projects/convoys)

### Monday.com

Monday.com emphasizes customizable workflows and resource management. The GSD model maps well:

- **Monday.com boards** with status columns map to **beads-state** key-value pairs
- **Monday.com workload widget** maps to **token-budget BudgetReport**
- **Monday.com automations** ("when status changes, notify") map to **event-log triggers**
- **Monday.com dashboards** map to **getEventStats()** aggregations
- Both support custom fields/metadata on work items

## The Beads-State Model: A Project Ledger

Beads-state is the GSD system's persistent state store, scoped per convoy and per agent. In project management terms, it is a **project ledger** -- a single source of truth for what has been done, what is in progress, and what remains.

### State Persistence as Project Memory

The beads-state pattern solves the same problem as a Jira board: when work is distributed across multiple actors (human or agent), there must be a shared, persistent record of state. Without it:

- Two agents might work on the same item (double-assignment)
- Completed work might be re-assigned (lack of status tracking)
- Progress might be lost across session boundaries (volatility)
- Nobody knows the overall project status (no aggregation)

Beads-state persists to `.chipset/state/` as git-friendly JSON files. This means project state is version-controlled, diffable, and recoverable -- advantages that most PM tools deliver through their database, but that GSD delivers through the file system.

## Token-Budget: Resource Leveling and Earned Value

The token-budget system (`src/chipset/gastown/token-budget.ts`) implements hard resource constraints. This maps to two established PM disciplines:

### Resource Leveling

Resource leveling adjusts the project schedule to avoid over-allocating resources. Token-budget does this automatically:

- Each agent has a `maxTokensPerAgent` limit (default: 100,000)
- The convoy has a `maxTokensPerConvoy` limit (default: 500,000)
- Budget checks happen **before** each API call, not after
- When an agent approaches its limit, the system can reassign remaining work

This is analogous to a project manager noticing that one team member has 60 hours of work assigned in a 40-hour week and redistributing tasks.

### Earned Value Management (EVM)

EVM measures project performance by comparing planned value, earned value, and actual cost. The token-budget provides the inputs:

| EVM Metric | Token-Budget Equivalent |
|---|---|
| Budget at Completion (BAC) | `maxTokensPerConvoy` |
| Planned Value (PV) | Expected tokens for completed percentage |
| Earned Value (EV) | Tokens that produced completed work items |
| Actual Cost (AC) | `convoyTotal.input + convoyTotal.output` |
| Cost Performance Index (CPI) | EV / AC -- are we spending tokens efficiently? |
| Schedule Performance Index (SPI) | EV / PV -- are we completing work on schedule? |

The `warningThresholdPercent` (default: 80%) is a budget variance trigger -- the same concept as an EVM "red flag" when CPI drops below 0.9.

## Event-Log: The Audit Trail

The event-log (`src/chipset/gastown/event-log.ts`) is an append-only, per-convoy log of all system events. In project management and compliance terms, this is the **audit trail** -- the irrefutable record of what happened, when, and by whom.

### Event Categories as PM Activities

| Event Category | PM Activity | Example |
|---|---|---|
| `registry` | Team changes | Agent joined/left the convoy |
| `routing` | Task assignment | Work item dispatched to agent |
| `permission` | Access control | Agent requested elevated permission |
| `execution` | Task work | Work item started, progressed, completed, failed |
| `communication` | Team communication | Inter-agent message, status update |
| `budget` | Financial tracking | Budget check, warning, exhaustion |
| `compaction` | Archival | Transcript checkpoint created |
| `system` | Infrastructure | Daemon started, config changed, error |

### Query and Statistics

The event-log supports filtering by category, severity, agent, and time range. This enables the same reporting that PM tools provide:

- **Velocity reports** -- How many work items completed per time period?
- **Agent utilization** -- Which agents are active vs. idle?
- **Failure analysis** -- What categories of errors are most common?
- **Audit compliance** -- Can we prove who did what and when?

## Work Breakdown Structure (WBS) and Convoy Decomposition

A WBS decomposes project scope into manageable work packages. The convoy model does the same:

```
Convoy (Project)
  +-- Work Item 1 (Work Package)
  |     +-- Sub-task 1a
  |     +-- Sub-task 1b
  +-- Work Item 2 (Work Package)
  |     +-- Sub-task 2a
  +-- Work Item 3 (Work Package)
        +-- Sub-task 3a
        +-- Sub-task 3b
        +-- Sub-task 3c
```

Each work item is assigned to a polecat agent (the "resource" in PM terms), has dependencies on other items (the "predecessors"), and consumes tokens from the convoy budget (the "cost").

## Critical Path Analysis

The convoy DAG implicitly defines a critical path -- the longest sequence of dependent work items that determines the minimum convoy duration. The sling-dispatch skill performs topological sort to find this path and prioritize items on it.

In a 5-agent convoy with the following dependency graph:

```
A (10 min) --> B (5 min) --> D (8 min)
A (10 min) --> C (3 min) --> D (8 min)
                             D (8 min) --> E (4 min)
```

The critical path is A -> B -> D -> E (27 min). Item C (3 min) has 2 minutes of float. A project manager would assign the strongest agent to the critical path and use the weaker agent for C, since it has slack.

## College Mappings

### Project Management
- PMBOK Guide knowledge areas (scope, schedule, cost, quality, resource, communication, risk, procurement, stakeholder)
- Agile vs. waterfall methodology trade-offs
- Earned value management (EVM) calculations
- Work breakdown structure (WBS) decomposition

### Operations Management
- Resource leveling and smoothing algorithms
- Queueing theory for task dispatch
- Bottleneck identification (Theory of Constraints)
- Capacity planning for multi-agent systems

### Organizational Behavior
- Team coordination mechanisms (mutual adjustment, direct supervision, standardization)
- Communication patterns in distributed teams
- Role clarity and responsibility assignment (RACI matrix)
- Conflict resolution in resource-constrained environments

## Study Guide Topics (14)

1. Project management fundamentals: scope, schedule, cost triangle
2. Work breakdown structure (WBS): decomposition and numbering
3. Critical path method (CPM): forward pass, backward pass, float
4. Resource leveling: over-allocation detection and redistribution
5. Earned value management (EVM): PV, EV, AC, CPI, SPI
6. Agile task boards: Kanban, Scrum, work-in-progress limits
7. Audit trail requirements: append-only logging, tamper evidence
8. Event-driven project tracking: real-time vs. periodic status
9. Budget management: variance analysis, forecasting, contingency
10. Multi-agent coordination: mutual exclusion, consensus, leader election
11. Queueing theory: arrival rate, service rate, utilization, Little's Law
12. RACI matrix: Responsible, Accountable, Consulted, Informed
13. Theory of Constraints: identify, exploit, subordinate, elevate, repeat
14. Distributed state management: consistency, availability, partition tolerance

## DIY Try Sessions (3)

1. **Model a 5-agent project with token budget constraints** -- Design a convoy with 8 work items distributed across 5 agents. Assign each agent a token budget of 100,000 and the convoy a budget of 400,000 (so agents compete for a shared pool). Create dependency edges between work items. Calculate the critical path, identify which agents will hit their budgets first, and design a reallocation strategy. Compute EVM metrics assuming each work item earns value proportional to its token cost.

2. **Build a project status dashboard from event logs** -- Take the event-log format (category, severity, agentId, convoyId, timestamp, message) and build a dashboard that shows: (a) work items by status (pending/active/complete/failed), (b) agent utilization (% of budget consumed), (c) event timeline (last N events), (d) error rate by category. Use the `computeStats` function signature as your data model. Compare your dashboard to a Jira sprint board.

3. **Design a RACI matrix for a convoy** -- Take a real or hypothetical multi-agent workflow and assign RACI roles: which agent is Responsible (does the work), Accountable (owns the outcome), Consulted (provides input), and Informed (receives updates). Map the RACI assignments to GSD primitives: R = polecat worker, A = mayor-coordinator, C = beads-state reads, I = event-log subscribers. Identify cases where RACI violations would cause coordination failures.
