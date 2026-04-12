---
name: physical-education-analysis-team
type: team
category: physical-education
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/physical-education/physical-education-analysis-team/README.md
description: Full Physical Education Department analysis team for multi-domain problems spanning movement, fitness, coaching, pedagogy, inclusion, lifetime activities, and curriculum philosophy. Naismith classifies the query and activates the relevant specialists in parallel, then synthesizes their independent findings into a unified, context-appropriate response. Use for complex PE program questions, multi-stakeholder analyses, program transformations, and any question where the domain is not obvious and different PE perspectives may yield different insights.
superseded_by: null
---
# Physical Education Analysis Team

Full-department multi-method analysis team for physical education problems that span sub-domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to the math-investigation-team model.

## When to use this team

- **Multi-domain PE problems** spanning movement, fitness, coaching, pedagogy, inclusion, and lifetime activities — where no single specialist covers the full scope.
- **Program-level questions** requiring coordinated input from curriculum philosophy, assessment, fitness science, and pedagogy.
- **Transformation projects** — converting a traditional activity-rotation program into a Sport Education program, redesigning assessment, rebuilding curriculum.
- **Equity audits and remediation** — when participation gaps, skill gaps, or inclusion gaps cross multiple sub-domains.
- **New teacher consultations** where the teacher does not know which specialist they need.
- **Cross-domain synthesis** — when understanding a PE question requires seeing it through multiple lenses (fitness, pedagogy, coaching, inclusion simultaneously).

## When NOT to use this team

- **Simple lesson plans** — use `siedentop` directly.
- **Pure cardio assessment or prescription** — use `kenneth-cooper` directly.
- **Pure practice design for a sports team** — use `wooden` directly. The analysis team's token cost is substantial.
- **Pure inclusion adaptation for one specific learner** — use `berenson` directly.
- **Single-domain questions** where the classification is obvious — route to the specialist via `naismith` in single-agent mode.
- **Beginner-level questions** with no program-level component — use the relevant specialist directly.

## Composition

The team runs all seven Physical Education Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `naismith` | Classification, orchestration, synthesis | Opus |
| **Cardiovascular specialist** | `kenneth-cooper` | Aerobic science, FITT, assessment | Opus |
| **Curriculum philosophy** | `jesse-feiring-williams` | Whole-child framing, program purpose | Opus |
| **Inclusion specialist** | `berenson` | Gender equity, adapted PE, UDL | Sonnet |
| **Lifetime fitness specialist** | `sorensen` | Aerobic dance, group fitness, lifetime activities | Sonnet |
| **Coaching specialist** | `wooden` | Practice design, strength and conditioning | Sonnet |
| **Pedagogy specialist** | `siedentop` | Sport Education model, unit design, assessment | Sonnet |

Three agents run on Opus (Naismith, Kenneth Cooper, Jesse Feiring Williams) because their tasks require judgment under ambiguity and synthesis across evidence bases. Four run on Sonnet because their tasks are well-defined and framework-driven.

## Orchestration flow

```
Input: user query + optional learner population + optional setting + optional prior session hash
        |
        v
+---------------------------+
| Naismith (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - learner age / population
        |                              - activity type (assessment/prescription/design/teaching)
        |                              - educational intent
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+--------+
        |        |        |        |        |        |        |
        v        v        v        v        v        v        v
   Cooper   Williams   Berenson  Sorensen  Wooden  Siedentop  (Naismith
   (cardio) (philos)   (include) (lifetime)(coach) (pedagogy)  waits)
        |        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Naismith activates only the relevant subset --
             not all 6 are invoked on every query.
        |        |        |        |        |        |
        +--------+--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Naismith (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by evidence
                         |                           - add safety context
                         |                           - adapt to user level
                         v
              +---------------------------+
              | Naismith (Opus)           |  Phase 4: Record
              | Produce Session record    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + PhysicalEducationSession Grove record
```

## Synthesis rules

Naismith synthesizes specialist outputs using these rules.

### Rule 1 — Converging findings are strengthened

When two or more specialists arrive at the same recommendation independently (e.g., Kenneth Cooper prescribes base-building cardio and Wooden prescribes matching off-season structure), mark the recommendation as high-confidence.

### Rule 2 — Diverging findings are preserved and contextualized

When specialists disagree, Naismith does not force a reconciliation. Both findings are reported with attribution ("Cooper recommends X based on cardiovascular evidence; Wooden recommends Y based on practice-design discipline"). Disagreements often reflect legitimate trade-offs that the user should see.

### Rule 3 — Philosophy grounds practice

When Jesse Feiring Williams identifies a philosophical gap in a proposed program (e.g., the program addresses only organic development and ignores character/social development), the gap is named explicitly and the synthesis addresses it rather than papering over it.

### Rule 4 — Inclusion is not optional

If Berenson identifies an equity or accessibility gap in any specialist's recommendation, the recommendation is revised to close the gap before being delivered to the user. Inclusion is a precondition of acceptable output, not a bonus feature.

### Rule 5 — Safety context is automatic

Every recommendation involving loading, intensity, or youth populations is wrapped in age-appropriate safety framing before delivery. This is Naismith's responsibility regardless of which specialists contributed.

## Input contract

1. **User query** (required). Natural language PE question, problem, or request.
2. **Learner age or population** (optional). If omitted, Naismith asks or infers.
3. **Setting** (optional). PE class, youth coaching, personal fitness, adapted PE.
4. **Prior PhysicalEducationSession hash** (optional). For follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows reasoning at the appropriate level
- Credits the specialists involved by name
- Notes any unresolved trade-offs
- Includes safety and inclusion context
- Suggests follow-up steps

### Grove record: PhysicalEducationSession

```yaml
type: PhysicalEducationSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  learner_age: middle_school
  activity_type: program_design
  educational_intent: health_literacy
agents_invoked:
  - naismith
  - kenneth-cooper
  - jesse-feiring-williams
  - berenson
  - siedentop
work_products:
  - <grove hash of PhysicalEducationAnalysis>
  - <grove hash of PhysicalEducationPractice>
  - <grove hash of PhysicalEducationReview>
  - <grove hash of PhysicalEducationExplanation>
concept_ids:
  - <relevant concept IDs>
```

## Escalation paths

### Internal escalations

- **Cardio prescription and practice schedule conflict:** Kenneth Cooper and Wooden work out the integrated plan. Cooper owns the physiological targets, Wooden owns the practice delivery. Naismith mediates if they cannot align.
- **Inclusion gap in a proposed unit:** Berenson revises the unit with Siedentop. The revised version is delivered to the user as the primary output.
- **Philosophy critique of a proposed program:** Williams raises the critique. The team discusses whether to revise the proposal or present it with the critique attached. Default is to revise.

### External escalations (from other teams)

- **From workshop team:** When a workshop reveals the problem is larger than a single-unit question and requires curriculum-level intervention, escalate to the analysis team.
- **From practice team:** When ongoing practice reveals a systemic issue (equity gap, program coherence, philosophical drift), escalate to the analysis team.

### Escalation to the user

- **Outside PE scope:** Sports medicine, nutrition prescription, psychological treatment — refer out.
- **Fundamental disagreement among specialists:** Report honestly with all rationales and let the user make the call.

## Token / time cost

- **Naismith** — 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** — 2 Opus (Cooper, Williams) + 4 Sonnet (Berenson, Sørensen, Wooden, Siedentop), ~30--60K tokens each
- **Total** — 250--450K tokens, 5--15 minutes wall-clock

Justified for multi-domain, program-level, or transformation-scale problems. For single-domain problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: physical-education-analysis-team
chair: naismith
specialists:
  - cardio: kenneth-cooper
  - philosophy: jesse-feiring-williams
  - inclusion: berenson
  - lifetime_fitness: sorensen
  - coaching: wooden
  - pedagogy: siedentop

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full program analysis
> physical-education-analysis-team: Transform our middle school PE program from activity
  rotation to an educationally coherent program over one academic year.

# Equity audit + remediation
> physical-education-analysis-team: Audit our 9th-grade co-ed PE for gender participation
  gaps and recommend a full remediation plan.

# Multi-domain lesson design
> physical-education-analysis-team: Design a cardiovascular unit that also meets our
  Sport Education adoption target and accommodates two learners with physical disabilities.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Sports medicine, nutrition, and sport psychology beyond practice-design philosophy require external referral.
- Parallel specialists do not communicate during Phase 2; convergence is measured only at synthesis. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond the agents' tools.
- Fundamental disagreements between specialists are reported honestly rather than forced to consensus.
