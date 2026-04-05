# Convoy Workflow Orchestration: BPM Patterns in Agent Systems

**Catalog:** OAA-CWO | **Cluster:** Operations & Admin Automation
**Date:** 2026-04-05 | **Source:** GSD Gastown Chipset (mayor-coordinator, sling-dispatch, GUPP)
**College:** Business Administration, Information Systems, Operations Research

## Abstract

Business Process Management (BPM) engines orchestrate multi-step workflows with routing, escalation, and SLA enforcement. The GSD Gastown chipset implements identical patterns under different names: the mayor-coordinator skill orchestrates convoy execution the way Camunda orchestrates BPMN processes, sling-dispatch routes work items the way Airflow schedules tasks onto workers, and GUPP propulsion assigns work to agents the way a BPM engine instantiates process participants. This page maps the GSD orchestration layer to established BPM concepts, compares it to three industry workflow engines, and provides study material for understanding workflow automation from both the office-admin and distributed-systems perspectives.

## BPM Concept Mapping

| BPM Concept | GSD Implementation | How It Works |
|---|---|---|
| Process Definition | Convoy manifest | A convoy declares its work items, dependencies, and agent requirements |
| Process Instance | Active convoy | A running convoy with state tracked in `.chipset/state/` |
| Task Router | Sling-dispatch | Routes work items to available agents based on capability and load |
| Orchestrator | Mayor-coordinator | Coordinates convoy execution: sequencing, parallel fan-out, escalation |
| Process Participant | Polecat worker | An agent assigned to execute a specific work item |
| Work Assignment | GUPP propulsion | Assigns work items to agents, manages the dispatch queue |
| Escalation | Mayor nudge/mail system | When a work item stalls, the coordinator escalates via async messaging |
| SLA Timer | Token-budget thresholds | Budget warning at 80% triggers escalation behavior |
| Audit Trail | Event-log (JSONL) | Every routing, execution, and permission event is append-only logged |
| Process Variable | Beads-state | Persistent key-value state scoped to convoy and agent |

## Industry Comparison

### Camunda (BPMN Engine)

Camunda executes BPMN 2.0 process models with explicit gateway logic (exclusive, parallel, inclusive). The GSD convoy model achieves the same routing through the mayor-coordinator's sequencing logic. Key differences:

- **Camunda** uses visual BPMN diagrams; **GSD** uses declarative convoy manifests
- **Camunda** has explicit gateway nodes; **GSD** infers routing from work item dependencies
- **Camunda** persists to a relational database; **GSD** persists to git-friendly JSON files
- **Camunda** supports human task forms; **GSD** supports agent-to-agent async messaging
- Both support compensation (rollback) and escalation patterns

### Temporal.io (Workflow-as-Code)

Temporal.io models workflows as durable functions with automatic retry and state persistence. The GSD model is closer to Temporal than to BPMN because workflows are defined in code (TypeScript) rather than visual diagrams.

- **Temporal** uses workflow and activity functions; **GSD** uses convoy work items and polecat executors
- **Temporal** has a server-side event history; **GSD** has per-convoy event logs (`.jsonl` files)
- **Temporal** supports saga patterns natively; **GSD** implements convoy-level rollback via state checkpoints
- **Temporal** handles retries automatically; **GSD** implements retry through sling-dispatch re-routing
- Both are fundamentally append-only event-sourced systems

### Apache Airflow (DAG Scheduler)

Airflow schedules directed acyclic graphs (DAGs) of tasks with dependency resolution. This is the closest analogue to the convoy dependency model.

- **Airflow** defines DAGs in Python; **GSD** defines convoy dependency graphs in TypeScript
- **Airflow** has a centralized scheduler; **GSD** distributes scheduling through mayor-coordinator
- **Airflow** has XCom for inter-task data; **GSD** has beads-state for inter-agent state
- **Airflow** has pool-based resource limits; **GSD** has token-budget enforcement
- Both support parallel task execution with dependency gates

## The Convoy Execution Model

A convoy in GSD is a unit of coordinated work -- analogous to a "process instance" in BPM terminology. The lifecycle:

1. **Instantiation** -- GUPP propulsion creates a convoy with a manifest of work items
2. **Routing** -- Sling-dispatch examines the dependency graph and identifies ready items
3. **Assignment** -- Ready items are dispatched to available polecat workers
4. **Execution** -- Each polecat executes its work item, reporting progress via event-log
5. **Coordination** -- Mayor-coordinator monitors progress, handles fan-in synchronization
6. **Escalation** -- If a work item exceeds budget or stalls, the coordinator triggers nudge/mail
7. **Completion** -- When all items complete, the convoy state is finalized

This maps directly to the BPM lifecycle: instantiation, token flow, task execution, gateway evaluation, boundary events, and process completion.

## Workflow DAGs and Dependency Resolution

The convoy model uses a directed acyclic graph (DAG) of work items where edges represent "must complete before" relationships. This is identical to:

- **Airflow's DAG** -- tasks with `>>` dependency operators
- **BPMN's sequence flows** -- arrows between activities
- **Temporal's child workflows** -- parent-child execution ordering
- **Make/Bazel build graphs** -- target dependencies

The sling-dispatch skill performs topological sorting on the DAG to determine which items are "ready" (all predecessors complete). Items at the same depth level can execute in parallel -- the convoy's fan-out pattern.

## Escalation Patterns

The mayor-coordinator implements three escalation tiers matching standard BPM escalation:

| Tier | BPM Pattern | GSD Implementation | Trigger |
|---|---|---|---|
| 1 | Timer boundary event | Budget warning threshold | Token usage exceeds 80% |
| 2 | Escalation boundary event | Nudge async message | Work item stalled beyond expected duration |
| 3 | Error boundary event | Convoy abort + state checkpoint | Critical failure or budget exhaustion |

## College Mappings

### Business Administration
- Workflow automation ROI analysis
- Business process reengineering (BPR) methodology
- Change management for automation adoption
- KPI definition for workflow performance

### Information Systems
- BPMN 2.0 notation and semantics
- Workflow engine architecture (orchestration vs. choreography)
- Event-driven architecture patterns
- Integration middleware (ESB, API gateway, message broker)

### Operations Research
- Queueing theory applied to dispatch systems
- Critical path method for convoy dependency graphs
- Resource allocation under constraints (token budgets)
- Simulation modeling for workflow optimization

## Study Guide Topics (15)

1. BPM fundamentals: process, instance, token, gateway
2. BPMN 2.0 notation: tasks, events, gateways, pools, lanes
3. Orchestration vs. choreography in distributed workflows
4. DAG scheduling: topological sort, critical path, parallel depth
5. Task routing strategies: round-robin, capability-based, load-balanced
6. Escalation patterns: timers, boundary events, compensation
7. Event sourcing and append-only audit logs
8. SLA enforcement: measurement, alerting, breach handling
9. Saga pattern: compensating transactions in long-running workflows
10. Workflow-as-code vs. visual modeling (Temporal vs. Camunda)
11. Resource pools and budget enforcement in workflow systems
12. Inter-process communication: synchronous vs. async messaging
13. State persistence strategies: relational DB vs. file-based vs. event log
14. Retry and idempotency in distributed task execution
15. Monitoring and observability for workflow engines

## DIY Try Sessions (3)

1. **Design a 3-stage approval workflow** -- Model a document approval process (draft -> review -> approve) using convoy patterns. Define 3 work items with sequential dependencies, assign each to a different "agent" role (author, reviewer, approver). Sketch the DAG, identify the critical path, and define escalation rules for each stage. Compare your design to the equivalent BPMN diagram.

2. **Build a dispatch queue simulator** -- Write a simple task dispatcher that accepts work items with priorities and dependencies, routes them to a pool of workers, and tracks completion. Implement topological sort for dependency resolution. Measure throughput under different worker counts and compare to queueing theory predictions (Little's Law: L = lambda * W).

3. **Map an existing office workflow** -- Take a real workflow from your experience (expense approval, onboarding, content review) and decompose it into: (a) the process definition (steps, roles, decision points), (b) the routing rules (who gets what, when), (c) the escalation policy (what happens when things stall), (d) the audit requirements (what must be logged). Identify which parts could be automated and which require human judgment.
