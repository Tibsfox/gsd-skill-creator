---
name: trades-practice-team
type: team
category: trades
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/trades/trades-practice-team/README.md
description: Pedagogy and practice pipeline team for trades learning, apprenticeship, and skill development. Runs Vitruvius as router, Rose for cognitive-content and apprenticeship ethnography, Crawford for philosophical framing and educational defense, and Nasmyth for the technical grounding of the skill being taught. Use for designing apprenticeship programs, diagnosing stuck learners, defending trades education in institutional contexts, and producing teaching artifacts that respect the cognitive content of craft. Not for shop layout, machine selection, or pure technical reference.
superseded_by: null
---
# Trades Practice Team

Pedagogy and learning pipeline team for trades education. Pairs Rose's ethnographic cognitive lens with Crawford's philosophical defense and Nasmyth's technical grounding, coordinated by Vitruvius. Designed for questions where the learning — not the production — is the point.

## When to use this team

- **Designing an apprenticeship program** for a specific trade, shop, or institution
- **Designing a trade-school curriculum** that takes the cognitive content of the craft seriously and does not reduce it to job training
- **Diagnosing a stuck learner** whose difficulty with a specific skill has not yielded to standard instruction
- **Defending a trades program** to a school board, a university, or a policy audience that may not recognize craft as serious education
- **Producing teaching artifacts** for apprentices, trade-school students, or adult learners — artifacts that respect the apprentice's intelligence and the craft's cognitive demands
- **Evaluating an existing trades program** against the pedagogy principles of observation, practice, correction, and supervised real-world work

## When NOT to use this team

- **Pure shop layout** — use `trades-workshop-team`
- **Pure machine tool selection** — use `nasmyth` directly
- **Pure materials-and-fit** — use the relevant specialist via `vitruvius`
- **Production problems** where the question is throughput rather than learning — use `trades-workshop-team` or `trades-analysis-team`
- **Time-study questions** — use `taylor` directly, with framing

## Composition

Four agents form the practice pipeline:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| Chair / Router | `vitruvius` | Classification, triad framing, synthesis | opus |
| Cognition and ethnography | `rose` | Cognitive-content descriptions, apprenticeship ethnography | sonnet |
| Philosophy and defense | `crawford` | Philosophical argument, educational defense, soulcraft framing | sonnet |
| Technical grounding | `nasmyth` | Technical content that anchors pedagogy in real craft | opus |

Rose and Crawford are the pedagogical core; Nasmyth provides the technical grounding that ensures the pedagogy is connected to real craft and not floating in philosophical abstraction. Vitruvius coordinates and applies the triad.

## Orchestration flow

1. **Vitruvius classifies** the pedagogy question and tags whether the dominant issue is cognitive-content description (Rose), philosophical framing (Crawford), technical grounding (Nasmyth), or some combination
2. **Rose produces** the cognitive-content description or the ethnographic account of how the skill is actually learned in practice
3. **Crawford produces** the philosophical framing or defense when the stakes of the question are institutional or cultural
4. **Nasmyth provides** the technical grounding — what the skill actually involves, to what tolerance, with what tools — so that the pedagogy is not decoupled from the craft
5. **Vitruvius synthesizes** the outputs into a pedagogy proposal, a diagnosis, or a defense, applying the triad so that firmness (the craft's technical content), commodity (the learner's needs), and delight (the dignity and meaning of the work) are all represented

## Why this composition

Trades pedagogy has historically been mishandled by educational institutions in two opposite ways. The first mishandling is pure vocational training that teaches the technical content without the cognitive framing, producing technicians who can execute but cannot judge. The second mishandling is pure philosophy that defends craft in principle but fails to transmit the actual skills, producing students who can argue for craft but cannot practice it.

The practice team combines the three ingredients that prevent both failures:

- **Rose's ethnography** ensures the cognitive content is visible and is taken seriously
- **Crawford's philosophy** ensures the programs can be defended against institutional skeptics
- **Nasmyth's technical grounding** ensures the pedagogy is anchored in real craft with real tolerances

Vitruvius integrates these through the firmitas/utilitas/venustas triad, which maps cleanly onto the three ingredients: firmitas is the technical content, utilitas is the learner's development, venustas is the meaning and dignity of the work.

## Input contract

The team accepts:

1. **Subject** (required) — the craft, skill, program, or institution under discussion
2. **Purpose** (required) — design, diagnose, defend, or evaluate
3. **Audience** (optional) — who the output is for (apprentice, school board, academic, etc.)
4. **Constraints** (optional) — institutional, regulatory, financial
5. **Prior context** (optional) — existing program, prior sessions, relevant history

## Output contract

### Primary output

A pedagogy proposal, diagnosis, or defense that:

- States the classification and the triad emphasis
- Presents Rose's cognitive-content description
- Presents Crawford's philosophical framing
- Presents Nasmyth's technical grounding
- Synthesizes the three into a unified recommendation
- Notes any conflicts or unresolved tensions

### Grove record

A TradesSession record linking:

- A TradesExplanation from Rose (cognitive-content description)
- A TradesExplanation from Crawford (philosophical framing)
- A TradesAnalysis from Nasmyth (technical content grounding)
- A TradesConstruct from Vitruvius (the synthesized program or artifact)

## Example outputs

```yaml
# Design of a first-year carpentry apprenticeship
rose_contribution:
  cognitive_description: |
    First-year carpentry requires developing five cognitive capacities:
    spatial visualization, grain reading, tool-and-material fit judgment,
    sequencing of operations to prevent late error, and the disciplined
    habit of measuring twice and cutting once. Each of these is tacit
    knowledge acquired by repetition under supervision.

crawford_contribution:
  philosophical_framing: |
    The apprenticeship is not vocational training in the narrow sense.
    It is formation of a practitioner capable of phronesis — practical
    wisdom developed through concrete judgments tested by physical
    reality. The program should be defended as education, not as job
    preparation.

nasmyth_contribution:
  technical_grounding: |
    First-year skills in order of teaching sequence:
    1. Hand tool sharpening and care
    2. Layout on stock (story pole, square, marking gauge)
    3. Basic cuts and joints (rabbet, dado, simple dovetail)
    4. Measurement discipline and reference surfaces
    5. Material selection and moisture content awareness

vitruvius_synthesis:
  program_structure: |
    Year one: 80% supervised shop time, 20% classroom. Shop time begins
    with observation (weeks 1-4), proceeds through simple operations
    under direct supervision (weeks 5-20), and ends with simple real
    jobs under periodic supervision (weeks 21-48). Classroom time
    supports shop time with reference material and reflection, not as
    a substitute.
```

## Invocation patterns

```
# Curriculum design
> trades-practice-team: Design a first-year carpentry curriculum for a
  community college that treats the craft as cognitively serious and
  defends it in institutional terms.

# Stuck learner
> trades-practice-team: My apprentice has been trying to cut dovetails for
  six weeks and is not improving. Diagnose and advise.

# Institutional defense
> trades-practice-team: Our school board is proposing to cut shop class.
  Produce a defense I can use at the board meeting.

# Program evaluation
> trades-practice-team: Evaluate our existing welding apprenticeship against
  the observation/practice/correction principles.
```

## Token and time cost

- **Vitruvius:** 2 Opus invocations (~30K tokens)
- **Rose:** 1 Sonnet invocation (~30K tokens)
- **Crawford:** 1 Sonnet invocation (~30K tokens)
- **Nasmyth:** 1 Opus invocation, scoped tight (~30K tokens)
- **Total:** 90–150K tokens, 3–6 minutes wall-clock

Smaller and more focused than the full analysis team. The right size for pedagogy questions where the three perspectives are needed but the full department is overkill.

## Limitations

- The team's grounding is primarily in Western craft traditions. Non-Western apprenticeship traditions are treated respectfully but at less depth.
- The team does not address regulatory or certification questions (OSHA, licensing, insurance); these should be handled by the relevant authorities and referenced rather than adjudicated by this team.
- The team cannot replace the master-apprentice relationship itself — it can only design around it. A program that cannot find masters will not be rescued by good pedagogy design.
- Crawford's philosophical framing is most useful in Anglophone institutional contexts (school boards, universities, policy debates in English-speaking countries); in other contexts the framing may need translation or adaptation.
