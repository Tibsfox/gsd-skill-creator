---
name: literacy-team
type: team
category: reading
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/reading/literacy-team/README.md
description: Focused literacy instruction team for foundational and developmental reading skills. Clay leads with assessment and instructional design, Chomsky-R provides linguistic analysis of decoding and morphology, Rosenblatt connects skill-building to meaningful reading experiences, and Austen synthesizes findings into a coherent instructional plan. Use for early literacy intervention, phonics and decoding instruction, vocabulary development, fluency building, comprehension strategy instruction, and reading assessment. Not for advanced literary analysis, critical theory, or multi-text research synthesis.
superseded_by: null
---
# Literacy Team

A focused four-agent team for foundational and developmental reading instruction. Clay leads with assessment; Chomsky-R provides linguistic expertise; Rosenblatt ensures meaning stays central; Austen synthesizes. This team handles the skills that make reading possible -- decoding, vocabulary, fluency, and comprehension strategy instruction.

## When to use this team

- **Early literacy intervention** -- readers who are struggling with foundational skills.
- **Phonics and decoding instruction** -- letter-sound relationships, syllable types, morphemic analysis.
- **Vocabulary development** -- word learning strategies, morphological awareness, academic vocabulary.
- **Fluency building** -- accuracy, rate, and prosody development.
- **Comprehension strategy instruction** -- teaching the seven comprehension strategies explicitly.
- **Reading assessment** -- Running Records, miscue analysis, comprehension checks.
- **Differentiated instruction** -- designing instruction for readers at different levels working with the same text.

## When NOT to use this team

- **Advanced literary analysis** with critical theory -- use `reading-analysis-team`.
- **Intertextual or postcolonial analysis** -- use `reading-analysis-team`.
- **Source evaluation or research skills** -- use `achebe` via `austen` or `reading-analysis-team`.
- **Readers who are already proficient** and need interpretive depth, not skill development -- route to the appropriate specialist.

## Composition

Four agents, with Clay as the instructional lead:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Assessment & instruction lead** | `clay` | Running Records, miscue analysis, scaffolded instruction | Sonnet |
| **Linguistic analyst** | `chomsky-r` | Phonology, morphology, syntax for reading | Sonnet |
| **Meaning & motivation** | `rosenblatt` | Transactional theory, reader engagement, comprehension | Sonnet |
| **Synthesis & communication** | `austen` | Classification, synthesis, level-appropriate response | Opus |

One Opus agent (Austen) for synthesis. Three Sonnet agents because their tasks are well-defined and instructionally focused.

## Orchestration flow

```
Input: reader data or reading question + reader profile
        |
        v
+---------------------------+
| Austen (Opus)             |  Phase 1: Classify
| Chair / Synthesis         |          - domain (decoding/vocab/comprehension/fluency)
+---------------------------+          - reader level
        |                              - urgency (intervention vs. enrichment)
        v
+---------------------------+
| Clay (Sonnet)             |  Phase 2: Assess
| Assessment lead           |          - analyze Running Record or reader data
+---------------------------+          - identify strengths and needs
        |                              - determine information source use (MSV)
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Chomsky-R        |   | Rosenblatt       |  Phase 3: Analyze
| (Sonnet)         |   | (Sonnet)         |  (parallel)
| Linguistic       |   | Engagement       |
| analysis of      |   | analysis --      |
| errors:          |   | is the reader    |
| - phonological   |   |   motivated?     |
| - morphological  |   | - stance?        |
| - syntactic      |   | - connection?    |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Clay (Sonnet)             |  Phase 4: Design instruction
| Instructional plan        |          - target identified needs
+---------------------------+          - build on identified strengths
                     |                 - specify scaffolding level
                     v
+---------------------------+
| Austen (Opus)             |  Phase 5: Synthesize & record
| Level-appropriate output  |          - unified instructional plan
+---------------------------+          - ReadingSession Grove record
                     |
                     v
              Instructional plan + ReadingSession
```

## Phase details

### Phase 2 -- Assessment (Clay)

Clay analyzes the reader data:

- **Running Record:** Accuracy rate, self-correction ratio, MSV error analysis
- **Behavior description:** Pattern identification, strategy use assessment
- **Text-reader match:** Is the current text at independent, instructional, or frustration level?

Output: strengths, needs, and priority instructional target.

### Phase 3a -- Linguistic analysis (Chomsky-R)

Chomsky-R examines the reader's errors for linguistic patterns:

- **Phonological errors:** Vowel confusion, consonant cluster reduction, r-controlled difficulties
- **Morphological errors:** Prefix/suffix stripping failures, root confusion, etymological opacity
- **Syntactic errors:** Miscues caused by complex sentence structures, passive voice, embedded clauses

Output: linguistic diagnosis of error patterns with instructional implications.

### Phase 3b -- Engagement analysis (Rosenblatt)

Rosenblatt examines the reader's relationship to reading:

- **Stance:** Is the reader stuck in efferent mode (reading only for information extraction)? Is aesthetic engagement absent?
- **Connection:** Does the reader connect texts to personal experience? To other texts?
- **Motivation:** Is the reader engaged or compliant? Reading by choice or by assignment?

Output: engagement assessment with recommendations for building reader identity.

### Phase 4 -- Instructional design (Clay)

Clay synthesizes the assessment, linguistic analysis, and engagement analysis into a targeted instructional plan:

- **Priority skill target** based on MSV analysis and linguistic diagnosis
- **Instructional activities** matched to the skill target
- **Text selection guidance** for instructional-level practice
- **Engagement strategies** from Rosenblatt's recommendations
- **Scaffolding level** with criteria for reducing support

## Input contract

The team accepts:

1. **Reader data** (required). Running Record, behavior description, or comprehension sample.
2. **Reader profile** (optional but valuable). Age, grade, reading level, language background, prior assessment data.
3. **Specific question** (optional). If the user has a specific concern ("she can decode but doesn't understand"), include it.

## Output contract

### Primary output: Instructional plan

A plan that:

- Identifies the reader's strengths and builds on them
- Targets the highest-priority instructional need
- Specifies activities, texts, and scaffolding
- Includes engagement recommendations
- Defines success criteria and timeline for reassessment

### Grove records

- **ReadingAnalysis** from Clay (assessment findings)
- **ReadingAnalysis** from Chomsky-R (linguistic diagnosis)
- **ReadingAnalysis** from Rosenblatt (engagement assessment)
- **ReadingSession** from Austen (linking all products)

## Escalation paths

- **Reader needs advanced literary content but lacks foundational skills:** Clay designs scaffolding; team does not reduce the intellectual content. If the text is genuinely above the reader's skill level, recommend a bridge text.
- **Reader's difficulty is motivational, not skill-based:** Rosenblatt leads with engagement strategies; Clay reduces instructional pressure.
- **Reader has skill deficits AND motivational deficits:** Both must be addressed simultaneously. Skill-only instruction without engagement fails; engagement without skill-building frustrates.
- **Reading difficulty may have a physiological source** (vision, hearing, processing): The team does not diagnose medical conditions. Recommend appropriate professional evaluation.

## Configuration

```yaml
name: literacy-team
lead: clay
linguistic_analyst: chomsky-r
engagement: rosenblatt
synthesis: austen

parallel_phase: true
timeout_minutes: 10
```

## Invocation

```
# Running Record analysis
> literacy-team: Here is a Running Record for a Grade 2 reader on a Level 16
  text. [record data]. What are the priorities?

# Struggling reader
> literacy-team: My student can sound out words but doesn't understand what
  she reads. She reads word-by-word with no expression. Grade 3.

# Vocabulary development
> literacy-team: How should I teach Tier 2 vocabulary to a class of developing
  readers? What strategies and which words?

# Fluency building
> literacy-team: This reader is accurate but painfully slow. How do I build
  fluency without sacrificing comprehension?
```

## Limitations

- The team focuses on skill development, not literary interpretation. For interpretive analysis, use `reading-analysis-team`.
- Running Record analysis requires the user to provide the record data. The team cannot observe reading directly.
- The team does not replace specialized literacy intervention programs (Reading Recovery, Orton-Gillingham). It provides analytical support and instructional recommendations within the department framework.
- Readers with severe or persistent difficulties may need assessment beyond what this team provides (e.g., psychoeducational evaluation for specific learning disabilities).
