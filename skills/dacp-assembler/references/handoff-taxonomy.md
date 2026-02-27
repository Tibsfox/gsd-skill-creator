# Handoff Taxonomy Reference

Standard handoff types recognized by the DACP assembler. Each type has a typical fidelity range, source-target pattern, and data complexity profile.

## Handoff Types

| Type | Source | Target | Typical Fidelity | Description |
|------|--------|--------|-----------------|-------------|
| task-assignment | orchestrator | executor | 1-3 | Assign a task with context, data, and optional scripts |
| verification-request | executor | verifier | 2-3 | Request verification of completed work with artifacts |
| data-transformation | analyzer | transformer | 2-3 | Transform structured data between formats |
| configuration-update | admin | agent | 1-2 | Update agent or system configuration |
| research-handoff | researcher | analyst | 1-2 | Hand off research findings for analysis |
| status-report | agent | orchestrator | 0-1 | Report current status, progress, or blockers |
| question-escalation | agent | human/lead | 0 | Escalate a question that requires human input |
| patch-delivery | agent | agent | 3 | Deliver a code or config patch (always safety-critical) |

## Type Details

### task-assignment

Assigns work to an executor agent. Includes task description, acceptance criteria, and optionally structured data and scripts. Fidelity depends on task complexity and historical drift.

**Data complexity:** simple (basic tasks) to complex (multi-step tasks with dependencies)
**Safety critical:** rarely, unless operating on production systems

### verification-request

Requests that a verifier agent validate completed work. Typically includes the artifacts to verify and the success criteria. Higher fidelity needed when verification involves complex data or scripts.

**Data complexity:** structured (criteria + artifact refs) to complex (full test suites)
**Safety critical:** depends on what's being verified

### data-transformation

Transforms data from one format or structure to another. Usually involves schema-validated inputs and outputs with transformation scripts.

**Data complexity:** structured to complex
**Safety critical:** when transforming financial, medical, or security data

### configuration-update

Updates configuration values for an agent or system component. Usually simple key-value changes with optional validation.

**Data complexity:** simple (single values) to structured (nested config objects)
**Safety critical:** when updating security or access control settings

### research-handoff

Hands off research findings (analysis results, summaries, recommendations) from a researcher to an analyst or decision-maker.

**Data complexity:** simple (summaries) to structured (tabular data, references)
**Safety critical:** rarely

### status-report

Reports current status, progress metrics, or blockers. Usually prose-only with no structured data.

**Data complexity:** none to simple
**Safety critical:** never

### question-escalation

Escalates a question to a human or team lead when the agent cannot resolve it autonomously. Always prose-only.

**Data complexity:** none
**Safety critical:** never

### patch-delivery

Delivers a code or configuration patch. Always treated as safety-critical because patches modify running systems. Always Level 3.

**Data complexity:** structured (patch metadata) to complex (multi-file patches)
**Safety critical:** always
