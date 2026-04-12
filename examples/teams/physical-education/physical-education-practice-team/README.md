---
name: physical-education-practice-team
type: team
category: physical-education
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/physical-education/physical-education-practice-team/README.md
description: Operational practice team for ongoing coaching, conditioning, and practice delivery. Pairs the coaching specialist (Wooden), the cardiovascular specialist (Kenneth Cooper), and the lifetime fitness specialist (Sørensen) under the chair (Naismith) to produce integrated practice plans, conditioning schedules, and session-by-session coaching feedback. Use for in-season coaching support, periodized training delivery, and the practice-level questions that come up week by week during a season.
superseded_by: null
---
# Physical Education Practice Team

Pipeline-oriented practice delivery team for ongoing coaching, conditioning, and session-level PE work. Complementary to the workshop team (which designs) and the analysis team (which analyzes). This team runs the engine.

## When to use this team

- **In-season coaching support** — week-by-week practice design with progression, feedback refinement, and periodization adjustment.
- **Integrated conditioning** — cardiovascular work combined with sport-specific practice, where Cooper and Wooden need to collaborate.
- **Group fitness class sequences** — a semester's worth of aerobic dance or group fitness classes with progression and variety, where Sørensen and Cooper align.
- **Periodized training delivery** — the ongoing execution of a multi-week plan, with adjustments based on observed progress and fatigue.
- **Coach mentoring during a season** — not just design advice but feedback on delivery as it happens.
- **Practice efficiency and pace improvement** — diagnosing and fixing dead-time problems in actual practice.

## When NOT to use this team

- **Unit design from scratch** — use the workshop team.
- **Program-wide transformation** — use the analysis team.
- **Philosophical or curriculum questions** — use `jesse-feiring-williams` directly or the workshop team.
- **Assessment rubric design** — use `siedentop` directly.
- **Equity audits or inclusion-focused design** — use `berenson` directly or the analysis team.
- **Adapted PE for a specific learner** — use `berenson` directly.

## Composition

Four agents form the practice team:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Coordinator** | `naismith` | Classification, integration, coaching context | Opus |
| **Cardiovascular specialist** | `kenneth-cooper` | Aerobic physiology, FITT, progression audit | Opus |
| **Coaching specialist** | `wooden` | Practice design, strength and conditioning, coach mentoring | Sonnet |
| **Lifetime fitness specialist** | `sorensen` | Aerobic dance, group fitness class design | Sonnet |

Two Opus agents (Naismith, Cooper) for synthesis and physiological judgment; two Sonnet agents (Wooden, Sørensen) for framework-driven production. The practice team is lean by design — it runs repeatedly through a season, so token cost matters.

## Orchestration flow

```
Input: ongoing practice or coaching context + specific ask
        |
        v
+---------------------------+
| Naismith (Opus)           |  Phase 1: Context integration
| Load prior sessions       |          - what's the season context
+---------------------------+          - what's the ask right now
        |                              - which specialists are needed
        |
        +------------+------------+
        |            |            |
        v            v            v
    Cooper       Wooden       Sorensen
    (cardio      (practice    (group
     targets)     + strength)  fitness)
        |            |            |
    Phase 2: Relevant specialists produce
             their slice of the practice plan,
             programming, or feedback. Not all
             three are invoked on every request.
        |            |            |
        +------------+------------+
                     |
                     v
          +---------------------------+
          | Naismith (Opus)           |  Phase 3: Integrate
          | Merge + safety framing    |          - resolve conflicts
          +---------------------------+          - add safety context
                     |                           - deliver unified plan
                     v
              Final practice artifact
              + PhysicalEducationSession Grove record
```

## Synthesis rules

### Rule 1 — Physiology drives intensity targets

Kenneth Cooper owns the intensity targets (HR zones, energy system emphasis, progression pacing). Wooden and Sørensen work within those targets rather than overriding them. If Wooden's preferred practice structure would push HR outside the target zone, Cooper and Wooden resolve the tension before delivery.

### Rule 2 — Practice design owns the delivery vehicle

Wooden owns how the target is delivered — drill structure, pace, feedback discipline, periodization within the week. Cooper does not specify drills; Wooden does not override physiology.

### Rule 3 — Group fitness classes honor instructor discipline

When Sørensen designs a group fitness component, the same physiology rules apply (Cooper-checked intensity profile), but the delivery vehicle follows group fitness class anatomy (four phases, modification built in, music programming).

### Rule 4 — Practice-level safety is automatic

Every practice plan carries age-appropriate safety framing. Warm-up, progression, contraindications if relevant. This is not optional.

### Rule 5 — Coach mentoring is informational

When the ask is mentoring a coach (not designing a practice), the output is informational feedback on what to change, grounded in Wooden's documented practice methods (planning discipline, demonstration over description, M+M pattern, 4:1 feedback, pace maintenance).

## Input contract

1. **Context** (required). Sport, level, calendar position, team or class, ongoing plan.
2. **Specific ask** (required). Practice plan for a date, conditioning schedule, class plan, feedback on a specific practice, progression audit.
3. **Prior session references** (optional). Grove hashes for prior practice sessions to maintain continuity.
4. **Constraints** (optional). Facility, equipment, recent injuries, calendar pressure.

## Output contract

### Primary output

A practice artifact — single practice plan, multi-week schedule, group fitness class, or coach mentoring feedback — that:

- Is time-allocated with specific block purposes
- Integrates cardiovascular targets with practice delivery
- Includes age-appropriate safety framing
- References prior sessions when maintaining continuity
- Specifies what to measure and what to adjust for next session

### Grove record: PhysicalEducationSession

```yaml
type: PhysicalEducationSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user request>
classification:
  domain: coaching
  learner_age: high_school
  activity_type: practice_delivery
  educational_intent: sport_participation
agents_invoked:
  - naismith
  - kenneth-cooper
  - wooden
work_products:
  - <grove hash of PhysicalEducationPractice>
prior_sessions:
  - <grove hash>
concept_ids:
  - pe-practice-design
  - pe-periodization
```

## Escalation paths

### Internal

- **Intensity conflict:** Cooper and Wooden disagree on whether a proposed practice is in the target zone. They resolve by checking the schedule against Cooper's target zone math, then either adjust the drill structure or adjust the target.
- **Adherence concern:** If a group fitness class is too technically perfect but adherence is failing, Sørensen and Cooper revise together — Cooper confirms the physiology target, Sørensen redesigns the delivery.
- **Coach not responding to mentoring:** After two cycles of mentoring feedback without observable change, the agent reports honestly and recommends escalating to the workshop team (curriculum may need rethinking) or the analysis team (program-level issues may be at play).

### External

- **To workshop team:** When a practice-level question reveals a curriculum-level problem — e.g., the unit structure is incoherent, the assessment is misaligned — escalate.
- **To analysis team:** When the practice team encounters a systemic issue (equity, program drift, philosophical gap) that is beyond practice-level fix, escalate.
- **Out of PE scope:** Sports medicine (injury, rehabilitation, medical clearance), nutrition prescription, mental health — refer to qualified professionals.

### To the user

- **Honest limits:** If the user is asking for performance outcomes that require more time than the calendar allows, or more talent than the population has, the team reports this honestly rather than promising what cannot be delivered.

## Token / time cost

- **Naismith** — 1 Opus invocation (integrate), ~20K tokens
- **Cooper** — 1 Opus invocation (physiology), ~25K tokens when invoked
- **Wooden** — 1 Sonnet invocation (practice), ~30K tokens
- **Sørensen** — 1 Sonnet invocation (group fitness), ~25K tokens when invoked
- **Total** — 75--150K tokens, 3--6 minutes wall-clock

Lean enough to be invoked multiple times per week during a season.

## Configuration

```yaml
name: physical-education-practice-team
chair: naismith
specialists:
  - cardio: kenneth-cooper
  - coaching: wooden
  - lifetime_fitness: sorensen

parallel: true
timeout_minutes: 8
auto_skip: true
```

## Invocation

```
# Single practice plan mid-season
> physical-education-practice-team: 90-minute Wednesday practice for my high school
  girls basketball team. Last game revealed weakness in defensive transition.
  Continuing plan from session grove:abc123.

# Integrated conditioning
> physical-education-practice-team: Design a week of training for my cross-country team,
  week 6 of an 18-week season. Sunday long run, Monday easy, Tuesday intervals,
  Wednesday tempo, Thursday easy, Friday race prep, Saturday race.

# Group fitness class
> physical-education-practice-team: Design a 50-minute aerobic dance class for a
  high school PE period. Target zone 70-80% HRmax, mixed fitness, adherence focus.

# Coach mentoring
> physical-education-practice-team: My first-year volleyball coach has solid knowledge
  but practices are chaotic. Observed one practice; here are the notes. What should
  the coach work on first?
```

## Limitations

- The team runs practice-level work, not curriculum-level or program-level work. Questions that turn out to be larger are escalated.
- The lean team structure means fewer perspectives per session than the analysis team. This is deliberate — most practice-level work does not need every specialist.
- The team assumes that unit design is already done (by the workshop team or by prior work). It does not re-litigate unit structure in every session.
- Sports medicine issues (injury, rehabilitation) are always referred out, regardless of urgency.
