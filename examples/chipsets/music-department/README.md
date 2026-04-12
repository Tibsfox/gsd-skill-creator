---
name: music-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/music-department/README.md
description: >
  Coordinated music department — seven named agents, six knowledge
  skills, three teams. Second instantiation of the department template pattern.
superseded_by: null
---

# Music Department

## 1. What is the Music Department?

The Music Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured music support
across harmony analysis, counterpoint, rhythm and meter, form analysis,
orchestration, and ear training. It is the second instantiation of the
"department template pattern" in gsd-skill-creator, validating that the
architecture designed for the Math Department generalizes cleanly to a domain
with fundamentally different reasoning requirements. Incoming requests are
classified by a router agent (Bach), dispatched to the appropriate specialist,
and all work products are persisted as Grove records linked to the college
concept graph.

Where the Math Department routes between proof, algebra, and analysis, the
Music Department routes between harmonic grammar, contrapuntal structure,
rhythmic systems, formal design, timbral color, and aural perception. The
template pattern handles both without modification.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/music-department .claude/chipsets/music-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Bach (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/music-department/chipset.yaml', 'utf8')).name)"
# Expected output: music-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
structural reasoning), four on Sonnet (for throughput-oriented performance and
pedagogy work).

| Name            | Historical Figure          | Role                                                     | Model  | Tools                        |
|-----------------|----------------------------|----------------------------------------------------------|--------|------------------------------|
| bach            | Johann Sebastian Bach      | Department chair — classification, routing, synthesis    | opus   | Read, Glob, Grep, Bash, Write |
| rameau          | Jean-Philippe Rameau       | Harmony specialist — chord grammar, voice leading, tonal analysis | opus   | Read, Grep, Bash             |
| clara-schumann  | Clara Schumann             | Performance specialist — interpretation, expression, repertoire guidance | sonnet | Read, Bash                   |
| messiaen        | Olivier Messiaen           | Composition specialist — orchestration, color, modes of limited transposition | opus   | Read, Grep, Bash             |
| coltrane        | John Coltrane              | Improvisation specialist — jazz harmony, modal interchange, spontaneous composition | sonnet | Read, Bash                   |
| bartok          | Bela Bartok                | Ethnomusicology and form — folk traditions, formal structures, rhythmic systems | sonnet | Read, Grep                   |
| kodaly          | Zoltan Kodaly              | Pedagogy guide — ear training, sequential learning, musicianship development | sonnet | Read, Write                  |

Bach is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Bach.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill             | Domain | Trigger Patterns                                                            | Agent Affinity      |
|-------------------|--------|-----------------------------------------------------------------------------|---------------------|
| harmony-analysis  | music  | chord progression, harmonic analysis, voice leading, modulation, Roman numeral, cadence, figured bass | rameau              |
| counterpoint      | music  | counterpoint, fugue, canon, species counterpoint, invertible, stretto, subject and answer | bach, rameau        |
| rhythm-meter      | music  | rhythm, time signature, meter, polyrhythm, syncopation, metric modulation, tempo | bartok, coltrane    |
| form-analysis     | music  | sonata form, rondo, theme and variations, musical form, exposition, development, recapitulation, ABA | bartok, bach        |
| orchestration     | music  | orchestration, instrumentation, score, arrange, transposition, register, timbre, doubling | messiaen            |
| ear-training      | music  | ear training, interval, sight-singing, dictation, aural skills, solfege, relative pitch | kodaly              |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                       | Agents                                                  | Use When                                          |
|----------------------------|---------------------------------------------------------|---------------------------------------------------|
| music-analysis-team        | bach, rameau, clara-schumann, messiaen, coltrane, bartok, kodaly | Multi-domain, research-level, or full-analysis requests |
| composition-workshop-team  | bach, rameau, messiaen, bartok                          | Composition, arranging, or orchestration requests |
| performance-prep-team      | clara-schumann, kodaly, coltrane, rameau                | Performance preparation, audition prep, or aural skills development |

**music-analysis-team** is the full department. Use it for problems that span
multiple musical domains or require the broadest possible expertise — analyzing
a complete symphony, studying a composer's harmonic language across works, or
preparing a comprehensive pedagogical sequence.

**composition-workshop-team** pairs the department chair (Bach) with the
harmony specialist (Rameau), the orchestration specialist (Messiaen), and the
form specialist (Bartok). Use it when the primary goal is writing, arranging,
or analyzing the construction of music. This team covers harmonic grammar,
contrapuntal technique, timbral color, and structural design — the four pillars
of composition.

**performance-prep-team** is the interpretation pipeline. Clara Schumann brings
performance insight and expression, Kodaly provides ear training and
musicianship development, Coltrane adds improvisatory and spontaneous
perspective, and Rameau grounds everything in harmonic understanding. Use it for
audition preparation, recital planning, interpretation questions, or building
aural skills.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`music-department` namespace. Five record types are defined:

| Record Type        | Produced By                    | Key Fields                                              |
|--------------------|--------------------------------|---------------------------------------------------------|
| MusicAnalysis      | rameau, bartok, bach           | work reference, analysis type, structural map, harmonic reduction, annotations |
| MusicComposition   | messiaen, bach, rameau         | title, instrumentation, notation, voicing, form diagram, style notes |
| MusicPerformance   | clara-schumann, coltrane       | work reference, interpretation markings, expression guidance, practice strategy, tempo map |
| MusicTranscription | kodaly, coltrane               | source reference, transcribed notation, accuracy notes, difficulty rating |
| MusicSession       | bach                           | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. MusicSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college music department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a MusicPerformance or MusicTranscription is
  produced, the chipset can automatically generate a Try Session (interactive
  practice) based on the content and the learner's current position in the
  concept graph.
- **Learning pathway updates**: Completed analyses, compositions, and
  transcriptions update the learner's progress along college-defined pathways.
- **Five wings** map to the college music department structure:
  1. **Rhythm & Movement** — pulse, meter, polyrhythm, conducting patterns,
     dance forms, metric modulation
  2. **Melody & Voice** — intervals, scales, modes, sight-singing, melodic
     dictation, vocal technique
  3. **Harmony & Structure** — chords, progressions, voice leading, form,
     counterpoint, modulation
  4. **Instruments & Ensemble** — orchestration, ranges, transposition,
     doublings, chamber and orchestral writing
  5. **Music History & Culture** — periods, styles, ethnomusicology, composers,
     performance practice, cultural context

Each wing maps to specific skills and Grove record types:

| Wing                     | Primary Skills                    | Primary Record Types                  |
|--------------------------|-----------------------------------|---------------------------------------|
| Rhythm & Movement        | rhythm-meter                      | MusicAnalysis, MusicPerformance       |
| Melody & Voice           | ear-training                      | MusicTranscription, MusicPerformance  |
| Harmony & Structure      | harmony-analysis, counterpoint, form-analysis | MusicAnalysis, MusicComposition |
| Instruments & Ensemble   | orchestration                     | MusicComposition, MusicAnalysis       |
| Music History & Culture  | form-analysis, rhythm-meter       | MusicAnalysis, MusicSession           |

## 8. Customization Guide

The music department is the second instantiation of the department template
pattern, confirming that the template generalizes. To create a department for
another domain, follow these steps (documented in full in
`DEPARTMENT-PATTERN.md`):

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/music-department examples/chipsets/linguistics-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a linguistics department you might use: saussure (router/chair),
chomsky (syntax), sapir (morphology), labov (sociolinguistics), jakobson
(phonology), greenberg (typology), montague (semantics). Also rename any
corresponding agent directories if your project uses per-agent config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six music skills for linguistics equivalents. Each skill needs:
- A `domain` value (e.g., `linguistics`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `MusicX` record types with domain-appropriate types. A
linguistics department might use: LinguisticAnalysis, LinguisticGloss,
LinguisticTreeDiagram, LinguisticExplanation, LinguisticSession. Each type
should describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `linguistics`)
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks
(e.g., "all transcription record types must declare a source reference field").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Bach) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Bach determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Bach collects results from multiple
   specialists and synthesizes a unified response. A question about the
   orchestration of a fugue subject, for example, involves counterpoint
   (Bach/Rameau), orchestration (Messiaen), and possibly form (Bartok).
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

Alternative topologies (mesh, pipeline, broadcast) are possible but the router
pattern best fits the department metaphor: students talk to the department
office, which routes them to the right professor.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (bach, rameau, messiaen): These roles require the deepest
  reasoning. Routing and synthesis (Bach) must understand all six domains well
  enough to classify correctly. Harmonic analysis (Rameau) requires tracking
  multiple simultaneous voice-leading strands and long-range tonal plans where
  errors compound across measures. Composition and orchestration (Messiaen)
  demand simultaneous consideration of timbre, register, doubling, and formal
  placement.
- **Sonnet agents** (clara-schumann, coltrane, bartok, kodaly): These roles are
  throughput-oriented. Performance interpretation, improvisation guidance,
  ethnomusicological comparison, and pedagogical explanation benefit from fast
  turnaround. Sonnet's speed matters more than its depth ceiling for these
  tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Composition-focused**: needs the structural core (4 agents, no performance
  or pedagogy overhead)
- **Performance-focused**: needs the interpretive-pedagogical pipeline (4
  agents, no heavy composition or orchestration)

Teams are not exclusive. Bach can assemble ad-hoc groups for queries that do
not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Bach speaks to the user.
Other agents communicate through Bach via internal dispatch. This is enforced
by the `is_capcom: true` flag — only one agent in the chipset may carry this
flag.

The choice of Bach as CAPCOM is deliberate: Bach's music integrates harmony,
counterpoint, form, orchestration, and pedagogy (he wrote the Inventions and
Well-Tempered Clavier explicitly as teaching works). No other figure in music
history bridges as many sub-domains, making Bach the natural classifier and
synthesizer.

## 10. Relationship to Math Department

The Music Department and the Math Department (`examples/chipsets/math-department/`)
are sister instantiations of the same department template pattern:

- **Same architecture**: Both use router topology with 7 agents (3 Opus / 4
  Sonnet), 6 skills, 3 teams, 5 Grove record types, 5 college wings, and 5
  evaluation gates. The structural skeleton is identical.
- **Different domain**: Math routes between proof, algebra, geometry, analysis,
  patterns, and modeling. Music routes between harmony, counterpoint, rhythm,
  form, orchestration, and ear training. The template handles both without
  modification.
- **Template validation**: The existence of two working departments in different
  domains confirms that the department template pattern is genuinely reusable.
  Any field where you can identify 6 skill areas, 7 historical experts, and 3
  natural team groupings can instantiate the pattern.

The two departments also share structural parallels that run deeper than the
template:

| Math Department    | Music Department      | Shared Pattern                        |
|--------------------|-----------------------|---------------------------------------|
| Hypatia (router)   | Bach (router)         | Polymathic figure as classifier       |
| Euclid (proof)     | Rameau (harmony)      | Foundational formalist                |
| Noether (algebra)  | Messiaen (composition)| Deep structural thinker               |
| Polya (pedagogy)   | Kodaly (pedagogy)     | Dedicated teaching specialist         |
| Ramanujan (pattern)| Coltrane (improvisation)| Intuitive, pattern-driven creator   |
| Gauss (computation)| Clara Schumann (performance)| Practitioner with broad repertoire |
| Euler (analysis)   | Bartok (ethno/form)   | Cross-domain synthesizer              |

These parallels are not forced — they emerge naturally from the departmental
roles that any academic domain requires: a generalist chair, a formalist, a
structuralist, a pedagogue, an intuitive, a practitioner, and a cross-domain
bridge. Future departments (physics, linguistics, culinary arts) will exhibit
the same role archetypes with domain-specific names.

This is the core claim of the department template pattern: the topology is
domain-invariant. Only the content changes.
