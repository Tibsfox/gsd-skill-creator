---
name: translation-team
type: team
category: languages
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/languages/translation-team/README.md
description: Focused translation and cross-linguistic transfer team for translation tasks, interpreting preparation, contrastive analysis, and cross-cultural communication. Lado provides systematic L1-L2 comparison and error prediction, Saussure provides structural equivalence analysis (signifier-signified mapping), Baker provides cultural context and community interpreting expertise, and Bruner-L scaffolds translation skill development and designs practice activities. Use for translation evaluation, interpreter training, contrastive analysis projects, and cross-cultural communication design.
superseded_by: null
---
# Translation Team

Focused translation and cross-linguistic transfer team for tasks involving moving meaning between languages. Combines contrastive analysis, structural equivalence, cultural mediation, and pedagogical scaffolding.

## When to use this team

- **Translation evaluation** -- assessing the quality of a translation, identifying where equivalence breaks down, and suggesting improvements.
- **Contrastive analysis projects** -- systematic comparison of two languages at all levels (phonology, grammar, vocabulary, pragmatics) for pedagogical or research purposes.
- **Interpreter training** -- designing practice materials and assessment criteria for consecutive or simultaneous interpretation.
- **Cross-cultural communication** -- navigating situations where linguistic and cultural differences create misunderstanding.
- **Untranslatability analysis** -- identifying what cannot be directly translated between two languages and designing compensatory strategies.
- **Machine translation evaluation** -- assessing NMT output against human translation quality standards.

## When NOT to use this team

- **Learning plan design** for a single language -- use `immersion-team`.
- **Structural analysis** of a language's internal grammar -- use `chomsky-l` or `language-analysis-team`.
- **Simple "how do you say X in Y" questions** -- route through `saussure` to the appropriate single agent.
- **Research-level linguistic theory** -- use `language-analysis-team`.

## Composition

| Role | Agent | Contribution | Model |
|------|-------|--------------|-------|
| **Contrastive lead** | `lado` | Systematic L1-L2 comparison, difficulty prediction, error diagnosis, assessment design | Sonnet |
| **Structural equivalence** | `saussure` | Signifier-signified mapping, translation strategy selection, equivalence judgment | Opus |
| **Cultural context** | `baker` | Community interpreting context, cultural mediation, language attitudes, pragmatic norms | Opus |
| **Pedagogy** | `bruner-l` | Scaffolded translation exercises, interpreter training sequences, practice activities | Sonnet |

Note: Saussure serves double duty here -- as department chair (CAPCOM for user communication) and as a team member (structural equivalence analysis). Within the team, Lado leads the contrastive analysis that drives the other specialists.

## Orchestration flow

```
Input: translation task or contrastive analysis request
       + source language + target language
       + (optional) source text or learner errors
        |
        v
+---------------------------+
| Lado (Sonnet)             |  Phase 1: Contrastive analysis
| Contrastive lead          |          - compare L1 and L2 at all levels
+---------------------------+          - predict difficulty areas
        |                              - diagnose observed errors
        |
        +--------+--------+
        |        |        |
        v        v        v
   Saussure    Baker   (Bruner-L
   (struct)   (culture)   waits)
        |        |
    Phase 2: Saussure analyzes structural equivalence
             (where do the sign systems map cleanly
              and where do they diverge?).
             Baker analyzes cultural equivalence
             (where do cultural assumptions match
              and where do they collide?).
        |        |
        +--------+
             |
             v
+---------------------------+
| Saussure (Opus)           |  Phase 3: Synthesize findings
| Equivalence judgment      |          - structural mapping
+---------------------------+          - cultural mediation needs
             |                         - recommended strategies
             v
+---------------------------+
| Bruner-L (Sonnet)         |  Phase 4: Practice design
| Translation exercises     |          - scaffolded translation tasks
+---------------------------+          - interpreter drills
             |                         - error correction activities
             v
      Translation analysis + practice materials
      + TranslationRecord + LanguageSession Grove records
```

## Team dynamics

### Lado-Saussure synergy

Lado provides the empirical comparison (these are the specific differences between L1 and L2 at each level). Saussure provides the theoretical framework (the arbitrariness of the sign means that equivalence is always approximate; translation is sign-system mapping, not word replacement).

**Example:** Translating Japanese keigo (honorific language) into English.
- Lado: "Japanese has four grammaticalized politeness levels. English has no grammaticalized honorifics. Predicted difficulty: very high."
- Saussure: "The signified (social deference) exists in both cultures, but the signifiers differ fundamentally. Japanese encodes deference in verb morphology; English encodes it in lexical choice and syntactic indirectness ('Could you possibly...'). Translation strategy: modulation -- change the linguistic mechanism while preserving the pragmatic function."

### Baker-Bruner-L synergy

Baker provides the cultural knowledge that translation requires. Bruner-L converts that knowledge into teachable practice.

**Example:** Community interpreting in a medical setting.
- Baker: "In many cultures, discussing symptoms with a stranger (the doctor) through a third party (the interpreter) violates privacy norms. The interpreter must navigate not just linguistic but cultural mediation."
- Bruner-L: "Scaffolded practice: first, role-play simple medical vocabulary. Second, role-play with cultural complications (patient hesitates, interpreter must decide how to mediate). Third, debrief on the cultural dimension."

### Translation quality assessment

The team evaluates translation quality along four dimensions:

| Dimension | Led by | Criteria |
|---|---|---|
| **Accuracy** | Lado | Does the translation preserve the source meaning? Are there omissions, additions, or distortions? |
| **Fluency** | Saussure | Does the translation read naturally in the target language? Is it idiomatic? |
| **Cultural adequacy** | Baker | Are cultural references appropriately adapted? Are pragmatic norms respected? |
| **Pedagogical utility** | Bruner-L | Can the translation process be taught? What scaffolding would a learner need to produce this? |

## Input contract

1. **Task** (required). Translation evaluation, contrastive analysis, interpreter training, or cross-cultural communication.
2. **Source language** (required). The language being translated from.
3. **Target language** (required). The language being translated into.
4. **Source text** (optional). Text to translate or evaluate.
5. **Learner errors** (optional). Specific translation errors to diagnose.
6. **User level** (optional). Determines scaffolding depth.

## Output contract

### Primary output: Translation analysis

A structured analysis that includes:

- Contrastive analysis of the language pair at relevant levels
- Structural equivalence mapping (where sign systems align and diverge)
- Cultural mediation requirements
- Recommended translation strategies (from Vinay & Darbelnet's taxonomy)
- Scaffolded practice activities when the goal is skill development

### Grove records

- **TranslationRecord** (Saussure/Lado): Source-target mapping, strategy used, quality assessment
- **LinguisticAnalysis** (Lado): Contrastive analysis of the language pair
- **LanguageExplanation** (Bruner-L): Pedagogical content for translation skill development
- **LanguageSession** (Saussure): Session log linking all work products

## Configuration

```yaml
name: translation-team
lead: lado
specialists:
  - structural_equivalence: saussure
  - cultural_context: baker
pedagogy: bruner-l

parallel: false  # Sequential phases
timeout_minutes: 10
```

## Invocation

```
# Translation evaluation
> translation-team: Evaluate this French-to-English translation of Camus's
  opening paragraph of L'Etranger. Source: "Aujourd'hui, maman est morte."
  Translation: "Mother died today."

# Contrastive analysis
> translation-team: Produce a full contrastive analysis of Arabic and English
  for translator training purposes.

# Interpreter training
> translation-team: Design a training sequence for consecutive interpretation
  between Mandarin and English in a legal context.

# Cross-cultural communication
> translation-team: I'm writing an English email to a Japanese business partner.
  How do I convey urgency without being rude by Japanese standards?

# Untranslatability
> translation-team: What gets lost when translating Brazilian Portuguese
  "saudade" into English? What compensatory strategies exist?
```

## Limitations

- The team does not perform actual translation -- it analyzes, evaluates, and teaches translation as a skill. For a specific translation task, the team provides strategy guidance and quality assessment, not a finished translated text.
- Machine translation evaluation is based on linguistic principles, not on access to MT system internals.
- The team's cultural expertise is broad but may lack depth for highly specialized cultural domains (legal traditions, religious texts, literary movements).
