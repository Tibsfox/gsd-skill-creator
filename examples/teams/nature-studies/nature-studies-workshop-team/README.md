---
name: nature-studies-workshop-team
type: team
category: nature-studies
status: stable
origin: tibsfox
first_seen: 2026-04-12
description: Four-agent identification-and-teaching workshop team for naturalist problems centered on "what is this and how do I know?" Linnaeus classifies and synthesizes, Peterson applies the field-guide methodology, Audubon handles bird-specific identification and voice, and Louv adapts the output for the learner's level. Use for identification-heavy workshops, field-guide-style artifact building, and beginner-to-intermediate teaching sessions where diagnosis and pedagogy are the focus. Not for behavioral interpretation, longitudinal studies, or research-level biogeography.
---
# Nature Studies Workshop Team

A focused four-agent team for identification-centered teaching. Peterson supplies the methodology, Audubon supplies the ornithological depth when the subject is a bird, Linnaeus classifies and synthesizes, and Louv makes the output accessible. This team mirrors the `proof-workshop-team` pattern: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Identification workshops** -- teaching a group or individual how to identify organisms in the field, with emphasis on the methodology rather than on any single species.
- **Field-guide-style artifact building** -- producing a region-specific or group-specific identification resource.
- **Beginner-to-intermediate teaching sessions** where the core question is "what is this and how do I know?"
- **ID methodology review** -- helping a user evaluate their own identification practice.
- **Single-session identification of one or a few organisms** where the user also wants to understand the reasoning.

## When NOT to use this team

- **Pure behavioral interpretation** -- use `nature-studies-analysis-team` or `goodall-nat` directly.
- **Longitudinal studies** -- use `nature-studies-practice-team`.
- **Research-level biogeography** -- use `von-humboldt-nat` directly or `nature-studies-analysis-team`.
- **Entomology life-cycle work** -- use `merian` directly or `nature-studies-practice-team`.
- **Pure pedagogy without identification content** -- use `louv` directly.

## Composition

Four agents, with Peterson leading the identification methodology:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `linnaeus` | Classification, synthesis, taxonomic anchoring | Opus |
| **Methodology lead** | `peterson` | Diagnostic features, confusion species, confidence rating | Sonnet |
| **Ornithology support** | `audubon` | Bird-specific ID, voice, plumage variation | Sonnet |
| **Pedagogy** | `louv` | Level adaptation, beginner scaffolding, accessibility | Sonnet |

One Opus agent (Linnaeus) for routing and synthesis; three Sonnet agents for identification, ornithology, and teaching. The workshop team leans heavily on Sonnet because identification is throughput-oriented once the methodology is clear.

## Orchestration flow

```
Input: user query + optional target level + organism or photo
        |
        v
+---------------------------+
| Linnaeus (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - is this birding, general ID, or mixed?
+---------------------------+          - target level (beginner/intermediate/advanced)
        |                              - confidence needed
        v
+---------------------------+
| Peterson (Sonnet)         |  Phase 2: Apply identification methodology
| Methodology lead          |          - diagnostic features
+---------------------------+          - confusion species
        |                              - confidence rating
        |
        +------- parallel (bird queries) --------+
        |                                          |
        v                                          v
+---------------------------+              +---------------------------+
| Peterson (Sonnet)         |              | Audubon (Sonnet)          |  Phase 3: Combine
| General methodology       |              | Bird-specific detail      |          (parallel
+---------------------------+              +---------------------------+           for birds)
        |                                          |
        +----------------+-------------------------+
                         |
                         v
              +---------------------------+
              | Louv (Sonnet)             |  Phase 4: Level adaptation
              | Pedagogy wrap             |          - translate to target level
              +---------------------------+          - add beginner scaffolding if needed
                         |                           - produce explanation Grove record
                         v
              +---------------------------+
              | Linnaeus (Opus)           |  Phase 5: Synthesize and record
              | Merge + NatureStudies-    |          - quality check
              | Session                   |          - produce session record
              +---------------------------+
                         |
                         v
                  Final response
                  + NatureStudiesAnalysis + NatureStudiesExplanation
```

## Workshop protocol

### Phase 1 -- Classification (Linnaeus)

Linnaeus classifies the query to determine:

1. **Is the subject a bird?** Birds need Audubon in parallel; other groups do not.
2. **What level is the user?** Determines how much scaffolding Louv will add later.
3. **What kind of artifact is being built?** A one-shot ID is different from a field-guide entry, which is different from a teaching session.

### Phase 2 -- Methodology (Peterson)

Peterson applies the Peterson System. This produces:

- A candidate species with confidence rating
- A list of diagnostic features with confidence for each
- A list of confusion species with the feature that separates each one
- An explicit rationale for the final confidence

The output is structured so a reviewer can reproduce the reasoning from the features alone.

### Phase 3 -- Specialist augmentation (Audubon, for birds)

If the subject is a bird, Audubon augments Peterson's analysis with:

- Ornithology-specific details (plumage variation, voice)
- eBird-compatible documentation
- Bird-specific confusion-species context

For non-bird subjects, Peterson's output is taken as-is into Phase 4.

### Phase 4 -- Pedagogy wrap (Louv)

Louv translates the combined methodology output into the user's target level. For beginners, this means:

- Removing jargon while preserving precision
- Adding context that beginners need but specialists omit
- Highlighting the one or two features most worth remembering
- Suggesting a next observation or follow-up activity

For intermediate users, Louv's touch is lighter -- mostly structural cleanup rather than full rewriting.

### Phase 5 -- Synthesis and recording (Linnaeus)

Linnaeus assembles the final response, verifies internal consistency, and produces:

- The NatureStudiesAnalysis record (the ID itself)
- The NatureStudiesExplanation record (the teaching artifact)
- The NatureStudiesSession record linking everything

## Input contract

The team accepts:

1. **Observation or subject** (required). The organism to be identified, the species to be described, or the user's own tentative ID to be evaluated.
2. **Target level** (required). One of: `beginner`, `intermediate`, `advanced`.
3. **Attached media** (optional). Photos, sketches, recordings.
4. **Context** (optional). Location, date, habitat, any additional observation details.

## Output contract

### Primary output: Identification and explanation

A unified response that:

- States the identification with confidence level
- Lists the diagnostic features that support the ID
- Lists confusion species and how each was ruled out
- Provides a level-appropriate explanation the user can actually use
- Suggests one or two follow-up observations to deepen the user's skill

### Grove records

- **NatureStudiesAnalysis:** The identification with full methodology.
- **NatureStudiesExplanation:** The level-adapted teaching artifact.
- **NatureStudiesSession:** The session log linking both records.

## Escalation paths

- **Identification is behavior-dependent:** Escalate to `nature-studies-analysis-team` so `goodall-nat` can contribute behavioral context.
- **Identification is range-dependent in a subtle way:** Add `von-humboldt-nat` ad hoc or escalate.
- **Identification is of an insect in a specific life stage:** Add `merian` ad hoc or escalate.
- **User wants longitudinal practice rather than a one-shot ID:** Escalate to `nature-studies-practice-team`.

## Token / time cost

- **Linnaeus** -- 2 Opus invocations, ~25K tokens
- **Peterson** -- 1-2 Sonnet invocations, ~20-30K tokens
- **Audubon** -- 0 or 1 Sonnet invocation depending on bird relevance, 0-20K tokens
- **Louv** -- 1 Sonnet invocation, ~15-25K tokens
- **Total** -- 60-100K tokens, 2-5 minutes wall-clock

This cost is much lower than the full analysis team, which is what makes the workshop team practical for beginner sessions and routine identification work.

## Configuration

```yaml
name: nature-studies-workshop-team
chair: linnaeus
methodology_lead: peterson
ornithology_support: audubon
pedagogy: louv

parallel: true
timeout_minutes: 6
max_iterations: 2
```

## Invocation

```
# Identification workshop
> nature-studies-workshop-team: I took a picture of a small brown streaky
  bird at my feeder this morning. Can you identify it and teach me how
  you would know? I'm a beginner.

# Field-guide entry building
> nature-studies-workshop-team: Build a field-guide-style entry for the
  black-capped chickadee that I can give to my kids' nature group. Level:
  beginner.

# Self-review of a previous ID
> nature-studies-workshop-team: I identified a hawk yesterday as a
  Cooper's Hawk, but I'm not sure. Here's what I saw. Evaluate my ID.

# Non-bird identification teaching
> nature-studies-workshop-team: Help me understand how to tell a red
  maple from a sugar maple in winter. Level: intermediate.
```

## Limitations

- The team is optimized for one-at-a-time identification and teaching, not broad investigation or longitudinal work.
- Non-bird subjects have only Peterson as the domain specialist. For entomology or biogeography, escalate to the analysis team or use the specialist directly.
- The team does not handle behavior interpretation. A "why is this bird doing this?" question is out of scope.
- The token budget is tight enough that very long field-guide entries (multiple pages) may need to be split into multiple workshop-team invocations.
