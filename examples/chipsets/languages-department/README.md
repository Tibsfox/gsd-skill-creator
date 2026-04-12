---
name: languages-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/languages-department/README.md
description: >
  Coordinated languages department -- seven named agents, six knowledge
  skills, three teams. 20th instantiation of the department template pattern.
  Treats language learning as a meta-skill applicable to any target language.
superseded_by: null
---

# Languages Department

## 1. What is the Languages Department?

The Languages Department chipset is a coordinated set of specialist agents, domain
skills, and pre-composed teams that together provide structured support for language
learning, linguistic analysis, translation, and cross-cultural communication. Unlike
a department that teaches a single language, this department treats language learning
as a **meta-skill** -- the principles, strategies, and analytical frameworks that
apply to learning ANY language. Incoming requests are classified by a router agent
(Saussure), dispatched to the appropriate specialist, and all work products are
persisted as Grove records linked to the college concept graph.

This is the 20th instantiation of the department template pattern in gsd-skill-creator.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/languages-department .claude/chipsets/languages-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Saussure (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/languages-department/chipset.yaml', 'utf8')).name)"
# Expected output: languages-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented computation and pedagogy).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| saussure   | Ferdinand de Saussure      | Department chair -- classification, routing, synthesis, structural equivalence | opus   | Read, Glob, Grep, Bash, Write |
| chomsky-l  | Noam Chomsky               | Syntax specialist -- universal grammar, generative syntax, typological comparison | opus   | Read, Grep, Bash             |
| krashen    | Stephen Krashen            | Acquisition specialist -- input hypothesis, comprehensible input, affective filter | sonnet | Read, Write                  |
| baker      | Colin Baker                | Sociolinguist -- bilingualism, code-switching, language policy, identity | opus   | Read, Grep, Bash, Write      |
| crystal    | David Crystal              | Phonetician & encyclopedist -- sound systems, language families, diversity, change | sonnet | Read, Bash                   |
| lado       | Robert Lado                | Contrastive analyst -- L1-L2 comparison, error diagnosis, language testing | sonnet | Read, Bash                   |
| bruner-l   | Jerome Bruner              | Pedagogy guide -- scaffolding, narrative teaching, learning pathways | sonnet | Read, Write                  |

Saussure is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Saussure.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                      | Domain    | Trigger Patterns                                                      | Agent Affinity      |
|----------------------------|-----------|-----------------------------------------------------------------------|---------------------|
| phonetics-phonology        | languages | pronunciation, phoneme, IPA, accent, sound system, tone, intonation, ear training | crystal, chomsky-l  |
| grammar-syntax             | languages | word order, grammar, syntax, tense, case, agreement, conjugation, declension | chomsky-l, krashen  |
| vocabulary-acquisition     | languages | vocabulary, flashcard, spaced repetition, word list, cognate, reading, frequency | krashen, bruner-l   |
| pragmatics-communication   | languages | polite, formal, informal, conversation, register, speech act, communication | baker, bruner-l     |
| translation-interpretation | languages | translate, interpret, translation, equivalent, how do you say, back-translation | saussure, lado      |
| language-learning-strategies | languages | how to learn, study plan, motivation, plateau, strategy, immersion, stuck | krashen, bruner-l   |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                              | Use When                                        |
|---------------------------|-----------------------------------------------------|-------------------------------------------------|
| language-analysis-team    | saussure, chomsky-l, krashen, baker, crystal, lado, bruner-l | Multi-domain, research-level, or full-analysis requests |
| immersion-team            | krashen, baker, crystal, bruner-l                   | Learning plan design, immersion programs, heritage language, plateau diagnosis |
| translation-team          | lado, saussure, baker, bruner-l                     | Translation tasks, interpreter training, cross-linguistic transfer |

**language-analysis-team** is the full department. Use it for problems that
span multiple linguistic domains or require the broadest possible expertise.

**immersion-team** pairs the acquisition specialist (Krashen) with the
sociolinguist (Baker), the language encyclopedist (Crystal), and the pedagogy
guide (Bruner-L). Use it when the primary goal is designing a learning plan
or diagnosing acquisition problems.

**translation-team** is the cross-linguistic pipeline. Lado provides
contrastive analysis, Saussure provides structural equivalence, Baker provides
cultural context, and Bruner-L scaffolds translation skill development.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`languages-department` namespace. Five record types are defined:

| Record Type          | Produced By                 | Key Fields                                           |
|----------------------|-----------------------------|------------------------------------------------------|
| LinguisticAnalysis   | chomsky-l, lado, baker, crystal | target languages, analysis type, framework, findings, concept IDs |
| LanguageProfile      | krashen, lado               | learner level, L1, target language, acquisition stage, input recommendations |
| TranslationRecord    | saussure, lado              | source language, target language, strategy, equivalence judgment, quality |
| LanguageExplanation  | bruner-l, krashen, crystal  | topic, level, explanation body, analogies, scaffolding notes, prerequisites |
| LanguageSession      | saussure                    | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. LanguageSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college languages department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a LanguageExplanation is produced, the chipset can
  automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, explanations, and practice sessions
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college languages department structure:
  1. Sound Systems
  2. Grammar Patterns
  3. Vocabulary & Reading
  4. Speaking & Listening
  5. Language & Culture

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Concept Graph

The languages department has 20 concepts across 5 wings:

### Sound Systems (4 concepts)
- `lang-phoneme-inventory` -- The distinct sounds of a language and how they contrast
- `lang-ipa-notation` -- International Phonetic Alphabet for universal transcription
- `lang-ear-training` -- Perceiving non-native phonemes through discrimination practice
- `lang-suprasegmentals` -- Tone, stress, and intonation patterns

### Grammar Patterns (4 concepts)
- `lang-word-order-typology` -- SOV, SVO, VSO orders and cross-linguistic variation
- `lang-morphology` -- How words are built from roots and affixes
- `lang-agreement-systems` -- Gender, number, case agreement across word classes
- `lang-syntactic-structures` -- Phrase structure, embedding, and recursion

### Vocabulary & Reading (4 concepts)
- `lang-high-frequency-words` -- The 1,000-2,000 most common words (85-95% coverage)
- `lang-spaced-repetition` -- Forgetting curve and optimal review intervals
- `lang-cognates-word-families` -- Cross-linguistic word relationships
- `lang-reading-progression` -- Controlled readers to authentic texts

### Speaking & Listening (4 concepts)
- `lang-listening-comprehension` -- Parsing natural speech rate and connected speech
- `lang-conversation-strategies` -- Turn-taking, clarification, topic management
- `lang-intelligible-speech` -- Pronunciation accuracy vs. fluency
- `lang-formality-register` -- Formal vs. informal, written vs. spoken register

### Language & Culture (4 concepts)
- `lang-language-culture-link` -- How language encodes cultural values
- `lang-linguistic-relativity` -- How language shapes thought
- `lang-multilingual-identity` -- Code-switching, heritage languages, identity
- `lang-language-diversity` -- 7,000 living languages, endangerment, rights

## 9. Architecture Notes

### Why router topology

The router topology places Saussure as the entry point for all queries. This provides:

1. **Classification**: Saussure determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Saussure collects results from multiple
   specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This ensures
   consistent communication style and level-appropriate language.

### Why 3 Opus / 4 Sonnet

Model assignment follows reasoning depth:

- **Opus agents** (saussure, chomsky-l, baker): Routing and synthesis (Saussure) must
  understand all six domains well enough to classify correctly. Syntactic analysis
  (Chomsky-L) requires deep multi-step reasoning about grammatical structure.
  Sociolinguistic analysis (Baker) requires nuanced understanding of social context,
  identity, and power dynamics.
- **Sonnet agents** (krashen, crystal, lado, bruner-l): Acquisition theory application,
  language description, contrastive comparison, and pedagogical scaffolding benefit
  from fast turnaround. Their tasks are well-defined and bounded.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full investigation**: needs every perspective (all 7 agents)
- **Immersion/acquisition**: needs the learning-conditions pipeline (4 agents, no
  structural syntax or contrastive analysis focus)
- **Translation/transfer**: needs the cross-linguistic pipeline (4 agents, focused
  on moving meaning between languages)

Teams are not exclusive. Saussure can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Saussure speaks to the
user. Other agents communicate through Saussure via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

### Meta-skill philosophy

This department does not teach French, or Japanese, or Swahili. It teaches
how to learn ANY language. The agents embody different perspectives on language
as a human phenomenon:

- **Saussure** sees language as a system of signs (structural)
- **Chomsky-L** sees language as an innate cognitive faculty (generative)
- **Krashen** sees language as naturally acquired through input (acquisitional)
- **Baker** sees language as social practice (sociolinguistic)
- **Crystal** sees language as evolved, diverse, and often endangered (descriptive)
- **Lado** sees languages as comparable systems with predictable differences (contrastive)
- **Bruner-L** sees language learning as scaffolded social activity (pedagogical)

Each perspective illuminates a different facet. Together they provide comprehensive
support for any language learning or linguistic analysis task.

## 10. Relationship to Other Departments

The Languages Department connects to other departments in the college:

- **Communication Department**: Focuses on rhetoric, public speaking, and media -- the
  pragmatics-communication skill overlaps with communication's domain. Languages
  focuses on cross-linguistic pragmatics; Communication focuses on L1 communication skills.
- **Reading Department**: Focuses on reading comprehension as a cognitive skill.
  Languages' vocabulary-acquisition skill and reading-progression concept overlap.
  Languages focuses on L2 reading; Reading focuses on L1 literacy development.
- **History Department**: Historical linguistics (Crystal's expertise) connects to
  history of civilizations. Language change reflects cultural change.
- **Philosophy Department**: Philosophy of language (meaning, reference, truth) is
  adjacent to Saussure's structural linguistics and Chomsky-L's generative grammar.
