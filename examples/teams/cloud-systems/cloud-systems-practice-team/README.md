---
name: cloud-systems-practice-team
type: team
category: cloud-systems
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/cloud-systems/cloud-systems-practice-team/README.md
description: Sequential pipeline team for cloud operations practice — incident response, postmortems, and runbook construction. Runs Lamport, DeCandia, Hamilton-cloud, Vogels, and Gray in a triage/analyze/document pipeline analogous to the RCA postmortem pattern. Use for operational incidents, runbook writing, and post-incident learning. Not for greenfield design or theoretical consensus questions.
superseded_by: null
---
# Cloud Systems Practice Team

Sequential pipeline team for cloud operations practice — the day-to-day operational work of running, debugging, and learning from cloud systems. Runs agents in a triage-analyze-document pipeline analogous to the `postmortem-team` in the RCA suite. The practice team is the operational counterpart to the workshop team: where workshop is about design, practice is about running the systems in production.

## When to use this team

- **Incident response** — triage an ongoing or recent outage, identify the domain, assemble initial hypotheses.
- **Postmortem writing** — produce a blameless, structured postmortem from incident data.
- **Runbook construction** — write runbooks for routine operational tasks, drills, or known failure modes.
- **Procedural discipline review** — audit existing runbooks for verifiable steps, timeouts, and rollback completeness.
- **On-call onboarding** — produce training material and practice scenarios for engineers new to on-call.
- **Operational readiness review** — for go-live reviews or launch readiness checks, pre-production.

## When NOT to use this team

- **Greenfield architecture design** — use the workshop or analysis team.
- **Theoretical consensus questions** — route to Lamport directly.
- **Pure storage design** — use the workshop team or direct Ghemawat.
- **Cost-only analysis** — route to Hamilton-cloud directly (though this team includes Hamilton-cloud for economic aspects of operations).
- **Beginner-level explanation with no operational context** — route to Gray directly.

## Composition

| Role | Agent | Method | Model |
|---|---|---|---|
| **Chair / Router** | `lamport` | Classification, triage, pipeline orchestration | Opus |
| **Quorum/operations** | `decandia` | Ring-based store operations, quorum mechanics | Sonnet |
| **Economics / SRE** | `hamilton-cloud` | Cost of operations, SLO trade-offs, hardware fit | Sonnet |
| **Service architecture** | `vogels` | Service boundary, API behavior, ownership | Sonnet |
| **Runbook / pedagogy** | `gray` | Runbook prose, level-appropriate explanation, postmortem writing | Sonnet |

One Opus (Lamport) for classification and synthesis. Four Sonnet agents because the work is throughput-oriented: extracting facts, writing prose, applying known patterns. The practice team trades depth for responsiveness.

## Orchestration flow

Unlike the analysis team (parallel) and workshop team (semi-parallel), the practice team runs as a sequential pipeline. Each stage consumes the previous stage's output.

```
Input: incident / event / task description + optional context
        |
        v
+---------------------------+
| Lamport (Opus)            |  Stage 1: Triage
| Classify and scope        |          - what domain(s)?
+---------------------------+          - severity?
        |                              - which specialists next?
        v
+---------------------------+
| DeCandia + Hamilton-cloud |  Stage 2: Analyze
|   + Vogels (as needed)    |          - technical analysis
+---------------------------+          - operational analysis
        |                              - service-impact analysis
        v
+---------------------------+
| Gray (Sonnet)             |  Stage 3: Document
| Runbook / postmortem /    |          - structured artifact
| explanation                |          - verifiable procedure
+---------------------------+          - level-appropriate language
        |
        v
+---------------------------+
| Lamport (Opus)            |  Stage 4: Synthesize
| Final response            |          - wrap in context
+---------------------------+          - note follow-up work
        |                              - emit CloudSystemsSession
        v
  Final response
  + CloudSystemsSession Grove record
  + CloudSystemsReview (runbook/postmortem/etc)
```

The sequential structure lets each stage react to the previous. Stage 2 can skip specialists that Stage 1 ruled out. Stage 3 produces artifacts that Stage 4 wraps and records.

## Synthesis rules

### Rule 1 — Triage speed matters

In incident mode, Lamport's classification should be fast — minutes, not tens of minutes. Exhaustive analysis can come after mitigation. The practice team is optimized for "stop the bleeding, then reason about it," not for exhaustive design review.

### Rule 2 — Gray owns structure

Every output artifact — runbook, postmortem, training material — must go through Gray for procedural structure. Unstructured prose is rejected.

### Rule 3 — Blameless language

Postmortems and incident writeups use blameless language by default. Individual names appear only when attribution is informational (who ran which command) and never as cause attribution. "The deploy system failed to catch the regression," not "Alice should have caught this."

### Rule 4 — Runbook steps are contracts

Every runbook step has: action, expected outcome, verification, timeout, failure action, rollback. Steps missing any of these are rejected by Gray and sent back for revision.

### Rule 5 — Economics inform but do not drive

Hamilton-cloud provides the cost view of operational decisions (cost per on-call page, cost per runbook execution) but these are inputs to decisions, not vetoes. Operational correctness wins over cost in incident mode; cost wins over aesthetics in steady-state optimization.

## Input contract

The team accepts:

1. **Incident / event / task description** (required). What happened, or what needs to be documented.
2. **Severity** (optional for incidents). One of: `sev1` (customer-visible outage), `sev2` (degraded), `sev3` (internal only), `sev4` (minor). Drives triage urgency.
3. **Mode** (required). One of:
   - `incident` — active or recent incident, produce triage and hypothesis
   - `postmortem` — produce a structured postmortem from gathered data
   - `runbook` — write a runbook for a specific operational task
   - `review` — audit existing operational artifacts
   - `onboard` — produce on-call training material
4. **Artifacts** (recommended). Timelines, logs, metrics, existing runbooks, code references.

## Output contract

### Primary output: Structured artifact

Depending on mode:

- **incident**: A triage report with classification, initial hypothesis, recommended next actions, and a suggested IC role.
- **postmortem**: A blameless postmortem with timeline, impact, root cause (proximate and contributing), what went well, what went poorly, where we got lucky, and numbered action items with owners and dates.
- **runbook**: A versioned runbook with prerequisites, steps, rollback, escalation, and a last-reviewed date.
- **review**: A review report identifying gaps and required fixes.
- **onboard**: Training material at the specified level.

### Grove record: CloudSystemsSession

```yaml
type: CloudSystemsSession
mode: incident | postmortem | runbook | review | onboard
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original task description>
classification:
  domain: <domain>
  complexity: <complexity>
  severity: <severity, if incident>
  type: operate
agents_invoked:
  - lamport
  - decandia
  - hamilton-cloud
  - vogels
  - gray
work_products:
  - <grove hash of runbook / postmortem / review / etc>
concept_ids:
  - <relevant college concept IDs>
```

## Escalation paths

### Internal escalations

- **Technical cause unclear after Stage 2:** Escalate to the analysis team for deeper investigation.
- **Design-level bug discovered:** Escalate to the workshop team for architectural review and redesign.
- **Pure consensus / theory question:** Route to Lamport directly as a specialist.

### External escalations

- **Incident exceeds practice team scope:** Declare the incident, bring in the analysis team for parallel investigation.
- **Postmortem reveals need for training:** Spawn a separate `onboard`-mode session.

## Token / time cost

- **Lamport** — 2 Opus invocations (triage + synthesis), ~30K tokens
- **DeCandia / Hamilton-cloud / Vogels** — 1 Sonnet invocation each (as triggered), ~20K tokens per
- **Gray** — 1-2 Sonnet invocations for documentation, ~30K tokens
- **Total** — 100-150K tokens, 3-6 minutes wall-clock for standard postmortem; faster for incident triage

Cheaper than both the analysis and workshop teams, and optimized for the different shape of operational work.

## Configuration

```yaml
name: cloud-systems-practice-team
chair: lamport
specialists:
  - operations: decandia
  - economics: hamilton-cloud
  - service-impact: vogels
pedagogy: gray

pipeline: true  # sequential, not parallel
timeout_minutes: 10
```

## Invocation

```
# Incident triage
> cloud-systems-practice-team: Sev1 incident. API error rate at 40%. Started 10 minutes ago.
  Here's what we know. Mode: incident.

# Postmortem
> cloud-systems-practice-team: Write a blameless postmortem for the 4-hour outage on Monday.
  Here's the timeline, logs, and what we did to mitigate. Mode: postmortem.

# Runbook
> cloud-systems-practice-team: Write a runbook for failing over the primary Cassandra
  datacenter to the standby. Include rollback. Mode: runbook.

# Review
> cloud-systems-practice-team: Audit our existing runbooks for missing rollback sequences
  and unverifiable steps. Mode: review.

# Onboarding
> cloud-systems-practice-team: Produce a one-week on-call onboarding for a new engineer.
  They know distributed systems theory but have no production experience. Mode: onboard.
```

## Limitations

- Not for greenfield design — use the workshop or analysis team.
- Not for formal consensus-theory questions — use Lamport directly.
- Cannot replace a human incident commander in a live incident — the team produces advice, not command-and-control presence.
- Operational runbooks produced must be tested before they are trusted. "The team wrote it" is not sufficient for ops readiness — a drill is.
