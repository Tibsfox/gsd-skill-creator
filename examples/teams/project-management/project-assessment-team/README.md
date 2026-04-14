---
name: project-assessment-team
type: team
category: project-management
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/project-management/project-assessment-team/README.md
description: Full Project Management Department assessment team for comprehensive project evaluation. Brooks classifies the query and activates specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Sinek. Use for new project kickoffs, project health assessments, troubled project diagnosis, and portfolio reviews where multiple PM disciplines must converge on a single recommendation. Not for routine sprint work, single-domain questions, or lightweight status checks.
superseded_by: null
---
# Project Assessment Team

Full-department multi-method assessment team for project management problems that span domains or resist classification. Runs all seven specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` runs multiple mathematical perspectives on a single problem.

## When to use this team

- **New project kickoff** -- when a project needs simultaneous planning (Gantt), risk assessment (Hamilton), constraint identification (Goldratt), process design (Deming), agile framework selection (Lei), and purpose alignment (Sinek) before execution begins.
- **Project health assessment** -- when a project is showing symptoms (missed deadlines, quality decline, team tension) but the root cause is unclear and may span scheduling, risk, quality, and team dynamics simultaneously.
- **Troubled project diagnosis** -- when a project is in distress and the leadership needs a comprehensive understanding of what went wrong, what is still at risk, and what the recovery path looks like across all PM dimensions.
- **Portfolio review** -- when evaluating multiple projects for resource allocation, strategic alignment, and cross-project risk requires the full department's expertise.
- **Milestone retrospective (comprehensive)** -- when a major milestone warrants a full-spectrum review spanning quality (Deming), schedule performance (Gantt), constraint effectiveness (Goldratt), risk outcomes (Hamilton), agile maturity (Lei), and team growth (Sinek).
- **Process overhaul** -- when an organization is redesigning its project management approach and needs coordinated input from scheduling, quality, constraints, risk, agile, and leadership perspectives.

## When NOT to use this team

- **Routine sprint work** -- use `sprint-team` for sprint planning, backlog grooming, and velocity analysis. The assessment team's token cost is substantial.
- **Single-domain questions** -- if the user knows they need risk assessment, route to Hamilton via Brooks directly. If they need a schedule, route to Gantt.
- **Lightweight status checks** -- use Gantt in track mode for earned value metrics, or Lei in flow mode for throughput analysis.
- **Retrospectives without multi-domain scope** -- use `program-review-team` for focused quality and lessons-learned sessions.
- **Pure leadership coaching** -- use Sinek directly for coaching, communication strategy, and learning pathways.

## Composition

The team runs all seven Project Management Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `brooks` | Classification, orchestration, synthesis | Opus |
| **Systems / Risk** | `hamilton` | Risk identification, failure mode analysis, integration review | Opus |
| **Constraints** | `goldratt` | Bottleneck analysis, critical chain, buffer management | Sonnet |
| **Quality** | `deming` | PDCA, statistical process control, continuous improvement | Opus |
| **Agile / Lean** | `lei` | Scrum, Kanban, value stream mapping, flow metrics | Sonnet |
| **Planning** | `gantt` | WBS, PERT estimation, critical path, earned value | Sonnet |
| **Pedagogy** | `sinek` | Purpose alignment, leadership coaching, level-appropriate explanation | Sonnet |

Three agents run on Opus (Brooks, Hamilton, Deming) because their tasks require deep reasoning, multi-step analysis, and the ability to synthesize across ambiguous inputs. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior ProjectSession hash
        |
        v
+---------------------------+
| Brooks (Opus)             |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (single-task/project/program/portfolio)
        |                              - type (plan/assess/report/improve/coach)
        |                              - user level (junior-pm/mid-pm/senior-pm/executive)
        |                              - recommended agents (subset or all)
        |                              - tar pit symptom check
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Hamilton  Goldratt   Deming    Lei     Gantt   (Sinek
    (risk)    (constr)   (qual)   (agile)  (plan)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             project context but producing independent findings
             in their own framework. Each produces a Grove record.
             Brooks activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Brooks (Opus)             |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Sinek (Sonnet)            |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - explain the "why" behind
                         v                             each recommendation
              +---------------------------+
              | Brooks (Opus)             |  Phase 5: Record
              | Produce ProjectSession   |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ProjectSession Grove record
```

## Synthesis rules

Brooks synthesizes the specialist outputs using these rules, directly analogous to the `math-investigation-team` synthesis protocol:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Hamilton identifies a risk on the critical path and Goldratt identifies the same item as the system constraint), mark the finding as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Brooks does not force a reconciliation. Instead:

1. State both findings with attribution ("Hamilton recommends adding buffer; Goldratt recommends removing individual task padding and aggregating into a project buffer").
2. Check for complementarity: often the findings are compatible when viewed from different angles.
3. If the disagreement is genuine, frame it as a tradeoff analysis and present both options with their consequences.
4. Report the disagreement honestly to the user.

### Rule 3 -- Risk overrides optimism

When Hamilton identifies a risk that another specialist's recommendation ignores, the risk takes priority in the synthesis. A schedule from Gantt that does not account for Hamilton's identified risks is incomplete. An agile framework from Lei that does not address Hamilton's integration risks needs amendment.

### Rule 4 -- System view over local optimization

When Deming identifies a systemic issue that another specialist is treating as a local problem, the systemic view takes priority. A constraint identified by Goldratt may be a symptom of a systemic quality problem that Deming has measured. The system explanation subsumes the local one.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Sinek adapts the presentation -- simpler language, more scaffolding, worked examples for junior PMs; concise strategic framing for executives. The analytical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language project management question, problem, or request.
2. **User level** (optional). One of: `junior-pm`, `mid-pm`, `senior-pm`, `executive`. If omitted, Brooks infers from the query.
3. **Prior ProjectSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the project management question
- Shows analysis at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or competing recommendations
- Maps to GSD commands where applicable
- Suggests follow-up actions and learning pathways

### Grove record: ProjectSession

```yaml
type: ProjectSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: program
  type: assess
  user_level: senior-pm
agents_invoked:
  - brooks
  - hamilton
  - goldratt
  - deming
  - lei
  - gantt
  - sinek
work_products:
  - <grove hash of ProjectRisk>
  - <grove hash of ProjectPlan>
  - <grove hash of ProjectStatus>
  - <grove hash of ProjectRetrospective>
concept_ids:
  - pm-project-assessment
  - pm-multi-domain-analysis
user_level: senior-pm
```

Each specialist's output is also a standalone Grove record (ProjectRisk, ProjectPlan, ProjectStatus, or ProjectRetrospective) linked from the ProjectSession.

## Escalation paths

### Internal escalations (within the team)

- **Hamilton identifies risk that invalidates Gantt's schedule:** Brooks re-routes the schedule back to Gantt with Hamilton's risk data as a constraint. Gantt rebuilds the critical path incorporating the new risk.
- **Goldratt's constraint contradicts Lei's agile recommendation:** When Goldratt identifies a resource bottleneck that Lei's WIP limits would exacerbate, Brooks frames it as a tradeoff: flow optimization (Lei) vs. constraint exploitation (Goldratt). Both perspectives are presented with their consequences.
- **Deming's process analysis reveals the problem is cultural, not procedural:** Escalate from Deming's process view to Sinek's psychological safety assessment. The quality problem may require leadership coaching, not metrics.
- **All specialists converge on "not enough data":** Brooks reports this honestly. The assessment cannot proceed without better data. Specific data requirements are listed.

### External escalations (from other teams)

- **From sprint-team:** When sprint-level problems reveal systemic issues spanning risk, quality, and scheduling, escalate to the full assessment team.
- **From program-review-team:** When a retrospective surfaces concerns that extend beyond quality and risk into scheduling, constraints, and agile practice, escalate to the full assessment team.

### Escalation to the user

- **Organizational change required:** If the assessment reveals that the project's problems stem from organizational structure, incentive design, or leadership behavior that the team cannot change, Brooks communicates this honestly with Sinek's coaching on how to influence upward.
- **Outside project management:** If the problem requires domain expertise outside project management (technical architecture, market strategy, legal), Brooks acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per assessment:

- **Brooks** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Hamilton, Deming) + 3 Sonnet (Goldratt, Lei, Gantt), ~30-60K tokens each
- **Sinek** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain assessments and critical project decisions. For single-domain or routine questions, use the specialist directly or a focused team.

## Configuration

```yaml
name: project-assessment-team
chair: brooks
specialists:
  - risk: hamilton
  - constraints: goldratt
  - quality: deming
  - agile: lei
  - planning: gantt
pedagogy: sinek

parallel: true
timeout_minutes: 15

# Brooks may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# New project kickoff
> project-assessment-team: We're launching a 12-month platform migration with
  3 teams, a legacy database dependency, and a hard regulatory deadline in Q4.
  Assess readiness and identify what we need before we start. Level: senior-pm.

# Troubled project diagnosis
> project-assessment-team: Our e-commerce redesign is 6 weeks late, the team
  is burning out, quality is declining, and the sponsor is losing confidence.
  What's going wrong and what do we do?

# Portfolio review
> project-assessment-team: We have 5 active projects sharing 3 development
  teams. Two projects are behind schedule and one just had a critical
  production incident. How do we prioritize and recover?

# Follow-up
> project-assessment-team: (session: grove:abc123) Based on the assessment,
  create a 90-day recovery plan with weekly checkpoints.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., procurement management, contract negotiation, regulatory compliance) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external project management tools (Jira, Azure DevOps, MS Project) beyond what each agent's tools provide. Data from those systems must be provided as input.
- Organizational problems that require executive action may be diagnosed accurately but cannot be resolved by the team. The team can only recommend; it cannot enforce organizational change.
- Assessment quality depends on input quality. Vague project descriptions produce vague assessments. The team will request clarification rather than speculate.
