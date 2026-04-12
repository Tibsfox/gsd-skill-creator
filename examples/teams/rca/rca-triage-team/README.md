---
name: rca-triage-team
type: team
category: rca
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/rca/rca-triage-team/README.md
description: Fast triage team for routine incidents. Classifies the incident, runs a single-method shallow analysis, and produces a short postmortem suitable for low-severity events. Optimized for throughput rather than depth — gets the common case off the floor quickly so the deep team can focus on high-impact incidents. Escalates to rca-deep-team if classification reveals the incident is deeper than it looked.
superseded_by: null
---
# RCA Triage Team

A lightweight multi-role team that runs a shallow but disciplined root cause analysis on routine incidents. The goal is to process many incidents cheaply without sacrificing the blameless and actionable-findings properties.

## When to use this team

- **Routine incidents** — SEV3, SEV4, elevated error rates that resolved quickly, minor customer-reported issues.
- **Daily incident review** — bulk-processing the day's minor incidents into short postmortems.
- **First pass** — initial classification of an unfamiliar incident before deciding whether to escalate to `rca-deep-team`.
- **Training mode** — when an operator is learning the workflow and wants structured feedback.

## When NOT to use this team

- SEV1/SEV2 incidents — use `rca-deep-team`.
- Regulated environments where full multi-method analysis is mandatory — use `rca-deep-team`.
- Incidents with significant uncertainty — escalate to `rca-deep-team` after the triage classification flags the uncertainty.

## Composition

Three members, run sequentially:

| Role | Agent | Purpose | Model |
|------|-------|---------|-------|
| **Classifier** | `rca-investigator` | Classify incident, select single method | Sonnet |
| **Investigator** | one of the specialized agents | Run the selected method | Sonnet |
| **Writer** | `postmortem-writer` | Produce the short postmortem | Sonnet (Haiku for tight budgets) |

All Sonnet by default; no Opus. If the classifier finds the incident is more complex than expected, it halts and recommends `rca-deep-team` instead of degrading the output.

## Orchestration flow

```
Input: incident evidence (usually much lighter than deep-team input)
        │
        ▼
┌──────────────────────┐
│ Classifier           │  Phase 1: 2-minute classification
│ rca-investigator     │          Outputs: method selection + confidence
└──────────────────────┘
        │
        ├─────── confidence high ──────────┐
        │                                   ▼
        │                          Phase 2: single-method investigation
        │                          ┌────────────────────────────────┐
        │                          │ One of:                        │
        │                          │ - five-whys-facilitator         │
        │                          │ - causal-graph-builder         │
        │                          │ - rca-investigator (HFACS)     │
        │                          │ - rca-investigator (distrib)   │
        │                          └────────────────────────────────┘
        │                                   │
        │                                   ▼
        │                          ┌────────────────────────────────┐
        │                          │ postmortem-writer               │
        │                          │ (Sonnet, short template)       │
        │                          └────────────────────────────────┘
        │                                   │
        │                                   ▼
        │                          Short postmortem (1-2 pages)
        │
        └─── confidence low ──▶ HALT, recommend rca-deep-team
```

## Short postmortem template

The triage team uses a compressed postmortem format (target: 1–2 pages, not 5–10):

```markdown
# Postmortem: <title>

**Status:** Draft (triage)
**Severity:** SEV3/SEV4
**Duration:** <time>
**Impact:** <quantified>

## Summary (2-3 sentences)

## Timeline (bullet points, not table)
- 14:32 — deploy-4827 begins
- 14:34 — canary fires 3x error alert
- ...

## Cause
**Proximate:** <one paragraph>
**Contributing:** <2-3 bullets>

## Actions
1. <owner>: <action> (due <date>)
2. ...

## Lessons
- <one thing that went well>
- <one thing that went wrong>

## Escalate?
<does this incident need a deep RCA? Yes/no + why>
```

## Classification heuristics

The classifier uses these fast heuristics:

| Signal | Classification | Suggested method |
|---|---|---|
| Single service, linear symptom, recent deploy | Simple software bug | 5 Whys + git blame |
| Clear metric regression with known change | Config / deploy regression | Causal probe + rollback |
| Multi-service cascade | Distributed systems failure | Trace + service graph |
| Operator action near trigger time | Human factors | HFACS quick pass |
| Unknown — can't classify | **ESCALATE** | Recommend `rca-deep-team` |

## Escalation triggers

The triage team halts and escalates to `rca-deep-team` when:

- Classification confidence is low — the classifier can't pick a single method.
- The single-method investigation produces contradictory findings within its own framework.
- The cause appears to be multi-factor but the investigation is limited to one method.
- The incident is the 3rd occurrence of a similar pattern — the recurrence itself signals deeper investigation is needed.
- Initial severity was under-classified — if triage reveals the impact was larger than reported, re-classify and escalate.

## Throughput target

The triage team is optimized to process incidents quickly:

- **Target time:** 3–5 minutes wall-clock per incident
- **Target token cost:** 30–60K tokens per incident
- **Target output:** 1–2 page short postmortem, ready for a 10-minute human review

By running at this budget, a team can process 10–20 routine incidents per day with reasonable quality. Without triage, these incidents accumulate as "we'll write a postmortem later" backlog and eventually never get written.

## Anti-patterns the team refuses

- **Speculation without evidence.** The classifier refuses to pick a method if the evidence is insufficient; it halts and requests more.
- **Depth theater.** The team refuses to pretend it ran a deep analysis when it only ran a shallow one; the output is clearly labeled "triage."
- **Blame substitution.** The compressed format does not make blameless framing optional. The writer enforces the same language standards as for deep postmortems.

## Integration with other teams

```
Incident occurs
  │
  ▼
Severity assessed
  ├── SEV1 / SEV2 → incident-response-team (live) → rca-deep-team → review
  │
  └── SEV3 / SEV4 → incident-response-team (live) → rca-triage-team
                                                    │
                                                    ├── short postmortem → review
                                                    │
                                                    └── classifier escalates → rca-deep-team
```

## Invocation

```
> rca-triage-team, run a quick RCA on incident INC-4830. Evidence in
  /tmp/inc-4830/. Target output: short postmortem at
  /tmp/inc-4830/postmortem.md. Escalate if you can't classify the
  incident with confidence.
```

## Bulk processing

The team supports bulk invocation for end-of-day triage:

```
> rca-triage-team, process all unresolved incidents from today
  (list in /tmp/today-incidents.txt). Skip any already marked
  "escalated." Produce short postmortems for the rest. Emit a
  summary of incidents that need escalation.
```
