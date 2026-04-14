---
name: immersion-team
type: team
category: languages
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/languages/immersion-team/README.md
description: Focused immersion and acquisition team for designing optimal language learning environments, input programs, and scaffolded practice sequences. Krashen provides acquisition theory and input recommendations, Baker provides sociolinguistic and multilingual context, Crystal provides target language phonetic and structural description, and Bruner-L designs scaffolded learning activities and pathways. Use for learning plan design, immersion program creation, extensive reading/listening program setup, heritage language maintenance, or diagnosing why a learner has plateaued.
superseded_by: null
---
# Immersion Team

Focused acquisition and immersion team for designing language learning environments and programs. Combines acquisition science, sociolinguistic context, language description, and pedagogical scaffolding.

## When to use this team

- **Learning plan design** -- when a learner needs a structured plan for acquiring a specific language, including input sources, practice activities, and milestones.
- **Immersion program creation** -- designing simulated or real immersion environments for learners who cannot relocate.
- **Extensive reading/listening programs** -- selecting and sequencing graded materials at the right level.
- **Heritage language maintenance** -- supporting learners reconnecting with a family or community language.
- **Plateau diagnosis** -- when a learner has stopped progressing and needs a fresh approach.
- **Affective filter issues** -- when anxiety, motivation, or identity concerns are blocking acquisition.

## When NOT to use this team

- **Structural analysis** of a language's grammar -- use `chomsky-l` directly or `language-analysis-team`.
- **Contrastive analysis** between L1 and L2 -- use `lado` directly.
- **Translation tasks** -- use `translation-team`.
- **Research-level linguistic questions** -- use `language-analysis-team`.

## Composition

| Role | Agent | Contribution | Model |
|------|-------|--------------|-------|
| **Acquisition lead** | `krashen` | Input hypothesis, i+1 calibration, affective filter assessment, method evaluation | Sonnet |
| **Sociolinguistic context** | `baker` | Community language dynamics, multilingual identity, heritage speaker support, bilingual education models | Opus |
| **Language description** | `crystal` | Target language phonetic inventory, writing system, language family context, typological features | Sonnet |
| **Pedagogy** | `bruner-l` | Scaffolded activity sequences, Try Sessions, learning pathways, narrative-based teaching | Sonnet |

Note: Saussure (department chair) is not on this team. The immersion team is invoked by Saussure when the query fits, but Saussure handles routing and user communication separately. Within this team, Krashen serves as the acquisition lead because the team's focus is on learning conditions, not structural analysis.

## Orchestration flow

```
Input: learner profile (level, L1, target language, goals, context)
        |
        v
+---------------------------+
| Krashen (Sonnet)          |  Phase 1: Assess acquisition state
| Acquisition lead          |          - current proficiency level
+---------------------------+          - affective filter status
        |                              - input adequacy
        |
        +--------+--------+
        |        |        |
        v        v        v
     Baker    Crystal   (Bruner-L
     (context) (L2 desc)  waits)
        |        |
    Phase 2: Baker assesses community context and motivation.
             Crystal describes the target language's features.
        |        |
        +--------+
             |
             v
+---------------------------+
| Krashen (Sonnet)          |  Phase 3: Design acquisition plan
| i+1 input selection       |          - reading materials
+---------------------------+          - listening sources
             |                         - interaction opportunities
             v
+---------------------------+
| Bruner-L (Sonnet)         |  Phase 4: Create scaffolded activities
| Learning pathway          |          - Try Sessions
+---------------------------+          - progress milestones
             |                         - concept graph mapping
             v
      Acquisition plan + activity sequence
      + LanguageProfile + LanguageSession Grove records
```

## Team dynamics

### Krashen-Baker synergy

Krashen provides the acquisition science (what conditions produce acquisition). Baker provides the social reality (what conditions actually exist for this learner). Together they produce realistic plans:

- Krashen says: "You need 30 minutes of comprehensible input daily."
- Baker says: "As a heritage speaker, your family conversations already provide input -- we need to make that input more conscious and structured."

### Crystal-Bruner-L synergy

Crystal describes what the target language is like (its sounds, patterns, quirks). Bruner-L uses that description to design activities:

- Crystal says: "Mandarin has four tones and your L1 (English) is non-tonal."
- Bruner-L says: "Here is a scaffolded sequence: first, listen and discriminate tone pairs; second, produce tones on single syllables; third, produce tones in two-syllable words; fourth, produce tones in sentences."

### Affective filter monitoring

The team treats the affective filter as a continuous variable, not a gate:

- Krashen assesses the filter level from the learner's self-report and behavior patterns.
- Baker contextualizes it: language anxiety may stem from social stigma, identity conflict, or past negative experiences.
- Bruner-L designs activities that lower the filter: low-stakes practice, supportive scaffolding, intrinsic motivation connections.

## Input contract

1. **Learner profile** (required). Current level, L1, target language, and learning context.
2. **Goals** (optional). What the learner wants to achieve (travel, career, heritage connection, academic, general fluency).
3. **Time available** (optional). Hours per week available for study.
4. **Prior LanguageProfile hash** (optional). For follow-up sessions.

## Output contract

### Primary output: Acquisition plan

A structured learning plan that includes:

- Assessment of current level and acquisition state
- Input recommendations (reading, listening, interaction) calibrated to i+1
- Scaffolded activity sequences with milestones
- Affective filter management strategies
- Community and social strategies from Baker
- Target language features from Crystal that inform the plan

### Grove records

- **LanguageProfile** (Krashen): Learner assessment, acquisition stage, input recommendations
- **LanguageExplanation** (Bruner-L): Pedagogical content, Try Sessions
- **LanguageSession** (Saussure, post-team): Session log linking all work products

## Configuration

```yaml
name: immersion-team
lead: krashen
specialists:
  - sociolinguistics: baker
  - language_description: crystal
pedagogy: bruner-l

parallel: false  # Sequential because each phase depends on the previous
timeout_minutes: 10
```

## Invocation

```
# Learning plan
> immersion-team: I'm an English speaker starting Japanese from zero. I have
  10 hours per week. Design a 6-month plan.

# Heritage language
> immersion-team: I'm a third-generation Chinese American. I understand
  Cantonese but can't speak it. How do I activate my passive knowledge?

# Plateau diagnosis
> immersion-team: I've been studying German for 2 years and I'm stuck at B1.
  I can read okay but freeze when speaking. What's wrong?

# Immersion design
> immersion-team: I can't travel to France. How do I create a French immersion
  environment at home?
```
