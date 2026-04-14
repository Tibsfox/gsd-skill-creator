---
name: program-review-team
type: team
category: project-management
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/project-management/program-review-team/README.md
description: Quality and retrospective team for milestone reviews, quality audits, process improvement, and lessons learned sessions. Deming drives PDCA analysis with statistical rigor, Hamilton reviews risk outcomes and integration failures, Brooks provides strategic big-picture perspective, and Sinek documents lessons and coaches teams on improvement adoption. Use for milestone retrospectives, quality audits, postmortem reviews, and process improvement initiatives. Not for sprint-level work, new project planning, or real-time constraint analysis.
superseded_by: null
---
# Program Review Team

Quality-focused review team for milestone retrospectives, quality audits, process improvement, and lessons learned sessions. Combines Deming's statistical rigor, Hamilton's risk discipline, Brooks's panoramic project view, and Sinek's pedagogical skill into a team purpose-built for learning from what happened and improving what happens next.

## When to use this team

- **Milestone retrospectives** -- when a major milestone has been reached (or missed) and the team needs a structured review covering quality outcomes, risk materialization, process effectiveness, and strategic lessons.
- **Quality audits** -- when process quality needs assessment: defect escape rates, rework ratios, estimation accuracy, and whether the development process is in statistical control.
- **Process improvement** -- when the team has identified a systemic problem (rising defect rates, growing lead times, declining morale) and needs a PDCA-driven improvement plan with risk assessment.
- **Lessons learned sessions** -- when a project or phase has completed and the organization wants to capture and transfer knowledge for future work.
- **Postmortem reviews** -- when an incident, failure, or missed delivery requires a blameless investigation of what happened, why it happened, and how to prevent recurrence.
- **Carry-forward audits** -- when action items from prior retrospectives have accumulated without completion, and the team needs to understand why and design a system that prevents this pattern.
- **Quality gate reviews** -- when a deliverable is approaching a quality gate (release, deployment, handoff) and needs a structured assessment of readiness.

## When NOT to use this team

- **Sprint-level work** -- use `sprint-team` for sprint planning, backlog grooming, and lightweight sprint retros. The program review team operates at milestone scope.
- **New project kickoff** -- use `project-assessment-team` for initial project assessment and planning.
- **Real-time constraint analysis** -- the program review team does not include Goldratt. For bottleneck identification and buffer management during execution, route through the sprint team or the full assessment team.
- **Schedule creation** -- the program review team does not include Gantt. For WBS, estimation, and schedule building, use the sprint team or the full assessment team.
- **Agile framework selection** -- the program review team does not include Lei. For framework selection and flow optimization, use the sprint team.

## Composition

The program review team runs four Project Management Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Quality** | `deming` | PDCA, statistical process control, variation analysis, metrics design | Opus |
| **Risk Review** | `hamilton` | Risk outcome analysis, failure mode review, integration audit | Opus |
| **Big Picture** | `brooks` | Strategic perspective, cross-domain synthesis, tar pit detection | Opus |
| **Lessons / Pedagogy** | `sinek` | Knowledge transfer, coaching, purpose alignment, level-appropriate documentation | Sonnet |

Three agents run on Opus (Deming, Hamilton, Brooks) because retrospective analysis requires deep reasoning over ambiguous, multi-factor outcomes. Sinek runs on Sonnet because the pedagogical synthesis task is well-defined once the analytical work is complete.

## Orchestration flow

```
Input: user query + project/milestone data + historical metrics
        |
        v
+---------------------------+
| Deming (Opus)             |  Phase 1: Drive the review
| Lead / Quality            |          - frame the review scope
+---------------------------+          - identify data requirements
        |                              - assess process control status
        |                              - initiate PDCA analysis
        |
        +--------+--------+
        |        |        |
        v        v        v
    Hamilton  Brooks    (Sinek
    (risk)    (strat)    waits)
        |        |
    Phase 2: Hamilton and Brooks work in parallel.
             Hamilton reviews risk outcomes: which risks
             materialized, which mitigations worked, which
             new risks were discovered.
             Brooks provides the strategic view: how does
             this milestone's outcome affect the project's
             overall trajectory, and are there tar pit symptoms?
        |        |
        +--------+
                 |
                 v
      +---------------------------+
      | Deming (Opus)             |  Phase 3: Integrate
      | PDCA synthesis            |          - merge risk and strategy
      +---------------------------+            findings with quality data
                 |                           - distinguish common-cause
                 v                             from special-cause variation
      +---------------------------+          - design improvement plan
      | Sinek (Sonnet)            |  Phase 4: Document and teach
      | Lessons learned output    |          - capture transferable lessons
      +---------------------------+          - adapt to audience level
                 |                           - design learning pathways
                 v                           - frame purpose for
      +---------------------------+            improvement actions
      | Deming (Opus)             |  Phase 5: Record
      | Produce Grove records     |          - ProjectRetrospective
      +---------------------------+          - link all work products
                 |
                 v
          Final response to user
          + ProjectRetrospective Grove record
```

## Synthesis rules

Deming integrates the specialist outputs using these rules:

### Rule 1 -- Data before narrative

When Hamilton's risk review and Brooks's strategic perspective offer interpretations of what happened, Deming grounds both in data. A narrative without data is speculation. A pattern without measurement is anecdote. Every finding in the synthesis is backed by observable evidence or explicitly flagged as hypothesis.

### Rule 2 -- System over individual

When the review reveals failures, Deming attributes them to the system, not to individuals. "The developer introduced a bug" is not a root cause. "The system allowed the bug to reach production because code review was optional and the test suite did not cover the failure path" is a root cause. This is not charity -- it is accuracy. Fixing the system prevents recurrence; blaming the individual does not.

### Rule 3 -- Risk outcomes calibrate future risk assessment

Hamilton's risk review produces a calibration record: which risks materialized vs. which were predicted, how accurate the probability and impact estimates were, and whether the mitigations worked. This calibration feeds back into Hamilton's future risk assessments. Over time, the department's risk identification improves because it measures its own accuracy.

### Rule 4 -- Tar pit detection overrides incremental thinking

When Brooks detects tar pit symptoms (second-system effect, Brooks's Law violation, conceptual integrity erosion, optimism bias, communication overhead), the finding takes priority over incremental improvement recommendations. A project in the tar pit needs strategic intervention, not process tweaks. Deming's PDCA cannot fix a project that is fundamentally overscoped or architecturally compromised.

### Rule 5 -- Carry-forward items are systemic signals

When the review reveals that action items from prior retrospectives were not completed, Deming treats this as a systemic finding, not a discipline failure. The system for prioritizing retrospective actions against feature work is broken. The improvement plan must address the carry-forward mechanism itself, not just the individual items.

## Input contract

The program review team accepts:

1. **User query** (required). Natural language request for a review, audit, retrospective, or postmortem.
2. **Project/milestone data** (required for meaningful analysis). Metrics, sprint data, incident reports, risk register, prior retrospective records. GSD planning artifacts (STATE.md, session handoffs) are the preferred format.
3. **Historical comparison data** (optional but recommended). Data from prior milestones or sprints for trend analysis and statistical control assessment.
4. **User level** (optional). One of: `junior-pm`, `mid-pm`, `senior-pm`, `executive`. If omitted, inferred from the query.
5. **Prior ProjectSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Review synthesis

A unified review that:

- Summarizes what happened with data-backed findings
- Distinguishes common-cause from special-cause variation
- Reports risk outcomes with calibration data
- Identifies systemic patterns (not individual blame)
- Provides a PDCA improvement plan for the highest-impact findings
- Includes strategic perspective on the project's trajectory
- Captures transferable lessons with learning pathways
- Maps to GSD commands where applicable

### Grove record: ProjectRetrospective

```yaml
type: ProjectRetrospective
period: "Milestone 3 (Sprints 9-12)"
went_well:
  - "Code review gate reduced defect escapes from 8% to 2.5% (exceeded target)"
  - "Integration testing cadence caught 3 interface issues before staging"
  - "Sprint commitment accuracy improved from 62% to 78%"
to_improve:
  - "Estimation calibration still shows 30% optimism bias on novel tasks"
  - "Documentation debt growing -- 4 subsystems have no runbook"
  - "Carry-forward items from Milestone 2 retro: 2 of 5 completed"
action_items:
  - action: "Implement estimation calibration workshop"
    owner: "<TBD>"
    deadline: "Sprint 13"
    pdca_target: "Reduce optimism bias to <15% by Milestone 4"
    verification: "Compare estimated vs actual for novel tasks across Sprints 13-16"
  - action: "Allocate 10% sprint capacity to documentation"
    owner: "<TBD>"
    deadline: "Sprint 13 onward"
    pdca_target: "All critical subsystems have runbooks by Milestone 4"
    verification: "Runbook coverage audit at Milestone 4 retro"
  - action: "Redesign carry-forward mechanism"
    owner: "<TBD>"
    deadline: "Sprint 13"
    pdca_target: "80% carry-forward completion by Milestone 4"
    verification: "Track carry-forward completion rate per sprint"
risk_outcomes:
  materialized:
    - risk_id: RISK-003
      predicted_impact: moderate
      actual_impact: critical
      mitigation_effectiveness: "Mitigation was in place but triggered too late"
      calibration_note: "Impact was underestimated. Adjust similar risks upward."
  avoided:
    - risk_id: RISK-001
      mitigation_that_worked: "Cross-training completed on schedule"
  new_risks_discovered:
    - "Performance under load not in risk register -- add to standard checklist"
patterns_identified:
  - "Quality improvements that reduce rework are self-funding (code review gate cost 5% capacity, saved 12% rework)"
  - "Carry-forward accumulation is a systemic prioritization failure, not a discipline failure"
  - "Estimation bias correlates with task novelty (r=0.68) -- familiar tasks are estimated accurately"
strategic_assessment:
  trajectory: "Project is recovering. Quality metrics trending positive. Schedule is stabilizing. No tar pit symptoms detected."
  concerns: "Documentation debt is a slow-burning risk. If not addressed, it will become a knowledge crisis when team composition changes."
  brooks_observation: "The team has maintained conceptual integrity despite adding 2 members in Sprint 10. This is unusual and worth preserving intentionally."
concept_ids:
  - pm-continuous-improvement
  - pm-quality-management
  - pm-retrospective-practice
  - pm-risk-calibration
agents_invoked:
  - deming
  - hamilton
  - brooks
  - sinek
```

### Additional Grove records

**ProjectRisk** -- Hamilton produces risk outcome records for each materialized risk:

```yaml
type: ProjectRisk
risk_id: RISK-003
description: "Third-party API deprecation during integration phase"
status: materialized
predicted_probability: moderate
predicted_impact: moderate
actual_impact: critical
response_effectiveness: "Mitigation existed but detection was too slow. 2-week delay before response activated."
lesson: "High-probability risks on the critical path need weekly monitoring, not monthly."
calibration_adjustment: "Upgrade similar dependency risks by one impact level in future assessments."
agent: hamilton
```

**ProjectStatus** -- Deming produces a process control snapshot:

```yaml
type: ProjectStatus
reporting_period: "Milestone 3 retrospective"
accomplishments:
  - "Process improvement: code review gate delivered measurable quality gain"
  - "Risk mitigation: 4 of 6 identified risks were successfully mitigated"
  - "Team growth: 2 new members integrated without velocity disruption"
metrics:
  process_control:
    velocity_mean: 31.2
    velocity_std_dev: 4.8
    in_control: true
    interpretation: "Delivery process is in statistical control. Sprint-to-sprint variation is common-cause."
  quality:
    defect_escape_rate: "2.5% (improved from 8%)"
    rework_ratio: "9% (improved from 15%)"
    estimation_accuracy: "70% of tasks within +/- 20% of estimate"
  flow:
    cycle_time_median: "3.8 days"
    lead_time_median: "12 days"
    flow_efficiency: "31.7%"
concept_ids:
  - pm-statistical-process-control
  - pm-earned-value
agent: deming
```

## Review-specific protocols

### Milestone retrospective protocol

1. **Deming** assesses process control: are quality metrics stable, improving, or degrading? Is the process producing expected outcomes? Distinguishes common-cause from special-cause variation.
2. **Hamilton** reviews risk outcomes: which risks materialized, which were avoided, which mitigations worked, and what new risks were discovered. Produces calibration data for future risk assessment.
3. **Brooks** provides the strategic view: is the project on a healthy trajectory? Are there tar pit symptoms? How does this milestone's outcome affect the remaining project?
4. **Deming** integrates all findings into a PDCA improvement plan targeting the highest-impact systemic issues.
5. **Sinek** documents transferable lessons, designs learning pathways for the team, and frames improvement actions with purpose.

### Quality audit protocol

1. **Deming** collects and analyzes quality data: defect rates, rework ratios, estimation accuracy, process control charts.
2. **Hamilton** reviews quality-related risks: are there failure modes in the quality process itself?
3. **Brooks** assesses whether quality problems are symptoms of larger structural issues (second-system effect, conceptual integrity erosion).
4. **Deming** produces a PDCA plan for the highest-priority quality improvement.
5. **Sinek** coaches the team on adopting quality improvements without resistance.

### Postmortem protocol

1. **Deming** leads the blameless investigation: what happened, when, and what was the sequence of events? Data first, narrative second.
2. **Hamilton** performs failure mode analysis: what failed, how did the failure propagate, and where were the detection points that should have caught it?
3. **Brooks** provides organizational context: was this failure predictable from the project structure? Is it a symptom of a larger pattern?
4. **Deming** produces a PDCA plan targeting the root cause (systemic, not individual).
5. **Sinek** documents the postmortem in a way that teaches without blaming, and coaches the team on implementing the corrective actions.

### Process improvement protocol

1. **Deming** measures the current process state and identifies the highest-impact improvement target.
2. **Hamilton** assesses the risk of the proposed change: what could go wrong during the transition?
3. **Deming** designs the PDCA cycle: hypothesis, baseline, measurement plan, success criteria.
4. **Brooks** evaluates whether the improvement aligns with the project's strategic direction.
5. **Sinek** coaches the team on the purpose of the change and how to adopt it.

## Escalation paths

### Internal escalations (within the team)

- **Deming identifies a quality problem rooted in constraints:** When the quality issue is actually a throughput bottleneck (e.g., QA capacity limiting test coverage), escalate to the full assessment team where Goldratt can perform constraint analysis.
- **Hamilton identifies risks that require schedule changes:** When risk outcomes demand schedule replanning, escalate to the full assessment team where Gantt can rebuild the schedule.
- **Brooks detects tar pit symptoms:** When the review reveals that the project is in the tar pit (overscoped, overcommitted, losing conceptual integrity), Brooks escalates to the full assessment team for comprehensive intervention.

### Escalation to project-assessment-team

- When the review reveals multi-domain problems spanning constraints, scheduling, agile practice, and quality, the program review team recommends escalation to the full assessment team. The review team diagnoses; the assessment team prescribes.

### Escalation to the user

- **Organizational change required:** When the root cause is organizational (incentive structures, reporting relationships, resource allocation policies), the team reports this honestly with Sinek's coaching on how to advocate for change.
- **Data insufficient:** When the review cannot reach conclusions because historical data was not collected, the team produces a measurement plan for future reviews rather than speculating.

## Token / time cost

Approximate cost per program review:

- **Deming** -- 2 Opus invocations (lead + integrate), ~40K tokens total
- **Hamilton** -- 1 Opus invocation, ~30K tokens
- **Brooks** -- 1 Opus invocation, ~30K tokens
- **Sinek** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 120-200K tokens, 4-10 minutes wall-clock

This cost falls between the sprint team (~80K) and the full assessment team (~300K), appropriate for milestone-cadence reviews.

## Configuration

```yaml
name: program-review-team
lead: deming
specialists:
  - risk-review: hamilton
  - strategic: brooks
pedagogy: sinek

parallel: true
timeout_minutes: 12

# Deming may skip Hamilton for pure process improvement queries
auto_skip: true

# Minimum specialists invoked
min_specialists: 2
```

## Invocation

```
# Milestone retrospective
> program-review-team: Run a retrospective on Milestone 3 (Sprints 9-12).
  Velocity data: [28, 34, 31, 33]. Defect escapes: [3, 1, 2, 1]. Committed
  stories: [8, 10, 9, 10]. Completed: [6, 8, 7, 9]. Level: senior-pm.

# Quality audit
> program-review-team: Our defect escape rate has doubled over the last 3
  milestones. Run a quality audit. Here are the metrics: [data].

# Postmortem
> program-review-team: We had a production outage last Thursday caused by a
  database migration that wasn't tested in staging. Run a blameless postmortem.

# Process improvement
> program-review-team: Our carry-forward items from retrospectives never get
  done. We've had the same action items on the list for 3 milestones. Help us
  fix the system.

# Lessons learned
> program-review-team: Our 18-month platform migration just completed. Capture
  the lessons learned so the next program team can avoid our mistakes.

# Follow-up
> program-review-team: (session: grove:abc123) Implement the PDCA plan from
  the Milestone 3 retro. Design the measurement framework for Sprint 13-16.
```

## Limitations

- The program review team does not include Goldratt (constraints), Lei (agile), or Gantt (planning). Reviews that need to produce new schedules, analyze flow metrics, or identify bottlenecks should escalate to the appropriate team.
- Statistical analysis requires historical data. Reviews with fewer than 6 data points produce wide confidence intervals. The team will flag this rather than overstate confidence.
- The team cannot enforce improvement actions. It can diagnose, design PDCA plans, and coach on adoption, but implementation depends on the team and organization committing to the changes.
- Blameless postmortems require organizational buy-in. If the culture demands blame, the team's blameless framing may conflict with organizational expectations. Sinek coaches on navigating this tension but cannot resolve it unilaterally.
- Three Opus agents make this the most expensive per-agent-invocation team in the department. The cost is justified by the depth of analysis required for milestone-level reviews, but routine sprint retros should use the sprint team instead.
