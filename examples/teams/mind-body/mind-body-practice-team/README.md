---
name: mind-body-practice-team
type: team
category: mind-body
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/mind-body/mind-body-practice-team/README.md
description: Body-centered practice team for queries about yoga, Pilates, somatic retraining, tai chi, qigong, and martial arts where several body-method voices contribute to the answer. Runs Iyengar (chair, yoga alignment), Feldenkrais (somatic learning), Pilates (classical Contrology), and Yang (internal arts, tai chi, qigong, martial arts) in a pipeline optimized for program design, form diagnosis, rehab-adjacent questions, and cross-method body training. The complement to the workshop team — the workshop team covers contemplative-side questions; the practice team covers body-side questions. Not for single-method questions with a clean specialist match.
superseded_by: null
---
# Mind-Body Practice Team

Four-agent body-centered team for practical mind-body program design, form diagnosis, and cross-method body-training questions. The complement to the workshop team: where the workshop team handles contemplative depth questions, the practice team handles body-method questions that benefit from several voices — yoga alignment, somatic learning, Contrology, and the internal arts — under Iyengar's chair.

## When to use this team

- **Program design for physical practice** where the user wants an integrated plan drawing on more than one body method. Example: "Build me a daily practice that combines yoga, Pilates, and some tai chi."
- **Rehab-adjacent questions past the acute phase** where the user is cleared for exercise but needs a careful, somatics-aware plan that does not re-injure.
- **Form diagnosis across methods** — a user whose yoga is stuck, whose Pilates Roll Up is failing, and whose tai chi stance feels off may benefit from several method voices in the same response, because the underlying postural pattern is shared.
- **Cross-training questions** from athletes, dancers, or martial artists who want to bring somatic, Pilates, or internal-arts work into their primary practice.
- **Injury-prevention program design** for users with a history of specific injury patterns (low back, knees, shoulders, neck) that benefit from a multi-method approach.
- **Aging-practitioner questions** — a long-time practitioner of one body method who is finding that method less accessible with age and needs to bring in adjacent methods.

## When NOT to use this team

- **Single-method questions** with clean specialist fit — use direct routing.
- **Contemplative / meditation questions** — use the workshop team or direct routing to dogen, kabat-zinn, or thich-nhat-hanh.
- **Acute injury situations** — halt and refer to medical care.
- **Psychiatric crisis** — clinical referral is the right response.
- **Full-department comparative analysis** — use the analysis team.
- **Pure scholarly or comparative questions** — use the analysis team or workshop team depending on the subject.

## Composition

Four agents — one Opus chair, two Opus specialists, one Sonnet specialist. The body-method voices of the department.

| Role | Agent | Specialty | Model |
|------|-------|-----------|-------|
| **Chair / Router / CAPCOM** | `iyengar` | Classification, orchestration, synthesis, Iyengar yoga voice | Opus |
| **Somatic learning specialist** | `feldenkrais` | ATM lessons, nervous-system-first learning, rehab-adjacent somatic retraining | Opus |
| **Classical Pilates specialist** | `pilates` | Mat and apparatus, six principles, core-and-whole-body training | Sonnet |
| **Internal arts specialist** | `yang` | Tai chi, qigong, Chinese martial arts, rooted-stance and internal alignment | Sonnet |

Two Opus and two Sonnet. The chair (Iyengar) and Feldenkrais are the two agents most likely to be in heavy judgment under ambiguity — Iyengar for classification and synthesis, Feldenkrais for somatic diagnosis. Pilates and Yang are more framework-driven once their specific method's rules are in context, so Sonnet is appropriate for them.

## Orchestration flow

```
Input: body-method query + user level + physical context + medical context
        |
        v
+---------------------------+
| Iyengar (Opus)            |  Classify; safety-gate (acute injury / medical halt?)
| Chair                     |
+---------------------------+
        |
        | Halt if acute injury or medical care required.
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    iyengar  feldenkrais  pilates  yang
  (specialist) (somatic)  (contrology) (internal arts)
        |        |        |        |
    Phase 2: Specialists work in parallel or in sequence, depending on query.
             Many practice-team queries are sequential: somatic diagnosis first,
             then the method-specific plans, then the chair's synthesis.
        |        |        |        |
        +--------+--------+--------+
                 |
                 v
     +---------------------------+
     | Iyengar (Opus)            |  Synthesize
     | Chair                     |  Apply safety cross-check
     +---------------------------+  Record session
                 |
                 v
     +---------------------------+
     | User-facing response      |
     +---------------------------+
```

## Sequential vs parallel dispatch

Unlike the workshop team, which runs specialists in parallel, the practice team often runs them in sequence because the body-method diagnosis usually has an order:

1. **Feldenkrais first** — somatic learning diagnosis. Where is the user's nervous system stuck? What proprioceptive information is missing? This is the foundation.
2. **Iyengar (yoga specialist voice) second** — alignment and staged progression. Given the somatic diagnosis, what yoga work fits?
3. **Pilates third** — core strength and whole-body training. What Contrology work complements the somatic and yoga work without contradicting either?
4. **Yang fourth (if relevant)** — internal arts for users who want that thread. Tai chi stance work that complements the rest.

Iyengar synthesizes into one plan at the end. Not all queries invoke all four; the chair chooses the subset.

## Why a body-method team exists separately from the analysis team

The analysis team can do everything the practice team does, in principle. In practice, the analysis team is expensive and its synthesis is weighted toward multi-voice comparative work. The practice team is optimized for program delivery: the user ends up with a concrete plan they can execute this week, not a scholarly comparison.

A concrete program needs the body-method voices to work together without the contemplative voices pulling the synthesis toward meditation framing. Keeping the two teams separate lets each produce the kind of output it is best at.

## Worked example

User query: "I'm 52. I've done yoga for 15 years and my back is starting to complain during forward folds. My teacher says it's from hamstring tightness; my physical therapist says it's from lumbar compensation. I want a daily practice that fixes the pattern without waiting for it to become an injury."

Iyengar classifies (multi-wing body question, intermediate-to-advanced user, debug-practice, elevated safety because of reported back issue). Runs the practice team in sequence:

1. **Feldenkrais** diagnoses the lumbar compensation pattern somatically and designs an ATM-style pelvic-clock lesson to restore proprioceptive information to the lumbar region. This is the foundation.
2. **Iyengar (as specialist voice)** reviews the user's forward-fold alignment: folds from the hip joint, not the waist; use of a block under the hands in standing forward folds; preparatory hamstring work with a strap.
3. **Pilates** adds core stabilization from the mat system — Hundred (beginner variation, not loading the lumbar), Spine Stretch Forward (only if cleared, not for osteoporosis), supported bridge work.
4. **Yang** is not invoked — the query does not need tai chi or qigong.

Iyengar synthesizes into a 5-day-per-week plan: 10 minutes of the Feldenkrais lesson every day, modified yoga sequence 3 days, modified Pilates mat 2 days, rest one day. Safety cross-check: the plan respects the back issue, does not include deep forward folds, does not load the lumbar in flexion, and is appropriate for a user with the reported complaint. Medical referral is named as a prudent addition — the user should check with their PT that the plan is compatible with the lumbar compensation diagnosis.

## Output — what the team produces

- **A user-facing response** from Iyengar with a concrete program.
- **MindBodyPractice Grove records** — usually one per specialist who contributed a practice plan.
- **A MindBodyAnalysis Grove record** if the question was diagnostic.
- **A MindBodyReview Grove record** if the team reviewed an existing practice plan.
- **A MindBodySession Grove record** linking everything.

## Example invocations

```
# Program design
> mind-body-practice-team: I want a 45-minute daily practice combining yoga, Pilates, and
                            somatics. I'm 45, reasonably fit, no injuries. Build me a week.

# Rehab-adjacent
> mind-body-practice-team: Cleared by my PT after 8 weeks of rehab for a knee injury.
                            I want to get back to my practice safely.

# Cross-training
> mind-body-practice-team: I'm a competitive BJJ player. I want to bring in yoga and
                            somatic work for longevity. What do I need?

# Aging-practitioner
> mind-body-practice-team: I'm 70. I've done Ashtanga for 25 years. My knees can't take
                            the jumping anymore. I don't want to quit the tradition but
                            I need a sustainable version.
```

## Contrast with the other teams

- **mind-body-analysis-team** is the full seven-agent team for multi-tradition or multi-wing scholarly questions.
- **mind-body-workshop-team** is the contemplative-side four-agent team for depth questions on meditation, presence, and attention.
- **mind-body-practice-team** is the body-side four-agent team for physical program design, form diagnosis, rehab-adjacent work, and cross-method body training.

Iyengar chooses the practice team when the query is body-centered, benefits from several method voices, and needs a concrete executable program at the end.
