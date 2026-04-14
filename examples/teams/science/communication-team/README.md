---
name: communication-team
type: team
category: science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/science/communication-team/README.md
description: Science communication and public understanding team combining Sagan (science communication), Goodall (field narrative), Feynman-S (methodological accuracy), and Pestalozzi (pedagogical design). Use for communicating scientific findings to non-specialist audiences, defending science against misinformation, creating educational narratives, or producing level-appropriate explanations that combine accuracy with accessibility. Not for experimental design, measurement, or full multi-domain investigation.
superseded_by: null
---
# Communication Team

Focused science communication team for translating scientific knowledge into accessible, accurate, and engaging content for diverse audiences. Combines Sagan's narrative gift, Goodall's field storytelling, Feynman-S's methodological rigor, and Pestalozzi's pedagogical design.

## When to use this team

- **Communicating scientific findings** to non-specialist audiences (public, students, policymakers, journalists) where both accuracy and accessibility matter.
- **Defending science against misinformation** -- evaluating pseudoscientific claims and producing accessible, evidence-based responses.
- **Creating educational narratives** that combine the story of science (who discovered what and why it matters) with hands-on learning activities.
- **Producing level-appropriate explanations** that need both methodological vetting (is the science right?) and pedagogical design (will the audience understand it?).
- **Science outreach** -- museum exhibits, public talks, classroom presentations, science journalism support.

## When NOT to use this team

- **Experimental design** -- use `lab-design-team`.
- **Measurement and error analysis** -- use `wu` directly.
- **Full multi-domain research investigations** -- use `science-investigation-team`.
- **Expert-to-expert communication** -- specialists communicate directly in technical contexts; this team is for bridging to non-specialist audiences.

## Composition

| Role | Agent | Contribution | Model |
|------|-------|-------------|-------|
| **Communication lead** | `sagan` | Narrative structure, wonder, audience adaptation, baloney detection | Sonnet |
| **Field narrative** | `goodall` | First-person observation stories, ecological context, patience narratives | Opus |
| **Methodological check** | `feynman-s` | Accuracy verification, cargo cult detection, honest uncertainty | Sonnet |
| **Pedagogy design** | `pestalozzi` | Hands-on activities, head-heart-hand framework, learning pathway | Sonnet |

One Opus agent (Goodall) handles the deep reasoning task of constructing field narratives from complex observational data. Three Sonnet agents handle the well-defined communication, verification, and design tasks.

## Orchestration flow

```
Input: communication request + topic + audience
        |
        v
+---------------------------+
| Sagan (Sonnet)            |  Phase 1: Frame
| Audience analysis          |          - who is the audience?
| Narrative structure        |          - what is the hook?
+---------------------------+          - what is the core message?
        |
        +--------+--------+
        |        |        |
        v        v        v
    Goodall  Feynman-S  (Pestalozzi
    (field   (accuracy   waits for
    story)    check)     pedagogy
        |        |       phase)
    Phase 2: Parallel content creation
             Goodall: field narrative elements
             Feynman-S: accuracy audit of claims
        |        |
        +--------+
             |
             v
  +---------------------------+
  | Sagan (Sonnet)            |  Phase 3: Integrate
  | Merge narrative + audit   |          - weave field stories in
  +---------------------------+          - correct any inaccuracies
             |                           - maintain wonder and accessibility
             v
  +---------------------------+
  | Pestalozzi (Sonnet)       |  Phase 4: Activity layer
  | Design learning activity  |          - create hands-on follow-up
  +---------------------------+          - connect narrative to experience
             |
             v
      Final communication product
      + ScienceExplanation Grove record
      + ScienceReport Grove record (if evaluation)
```

## Collaboration protocol

### Sagan-Feynman-S accuracy loop

This is the team's critical quality control. Sagan drafts the communication; Feynman-S audits it for scientific accuracy. Specific checks:

- **Claim accuracy:** Does each factual claim match the scientific evidence?
- **Simplification audit:** Where has Sagan simplified? Is the simplification misleading or just less detailed?
- **Uncertainty representation:** Are uncertainties communicated honestly, or has the narrative implied more certainty than the evidence supports?
- **Analogy audit:** Do Sagan's analogies hold up, or do they create false impressions?

If Feynman-S flags an issue, Sagan revises. The final product is both accessible AND accurate.

### Goodall's narrative contribution

Goodall provides first-person field observation narratives that make abstract science concrete. When Sagan is communicating about ecology, biodiversity, or animal behavior, Goodall's stories about specific individuals and specific observations bring the science to life. Goodall's contribution is always grounded in real observation, never invented.

### Pestalozzi's pedagogical extension

After Sagan produces the communication and Feynman-S verifies it, Pestalozzi designs a hands-on activity that lets the audience experience the science rather than just hear about it. For a public talk about water quality, Pestalozzi might design a simple water testing activity for attendees. For a classroom explanation of natural selection, Pestalozzi designs a simulation game.

## Input contract

1. **Communication request** (required). What needs to be communicated, to whom, and in what context.
2. **Audience** (required). One of: `general-public`, `student-beginner`, `student-intermediate`, `student-advanced`, `policymaker`, `journalist`.
3. **Format** (optional). Article, presentation, exhibit, lesson plan, social media, policy brief.
4. **Topic-specific content** (optional). Specialist Grove records from other teams that need to be communicated.

## Output contract

### Primary output: Communication product

A ScienceExplanation or ScienceReport Grove record containing:

- Audience-appropriate narrative with accuracy verification
- Field narrative elements where relevant
- Explicit notes on simplifications made
- Hands-on activity or follow-up suggestion
- Source references

### Secondary output: Accuracy audit

Feynman-S's audit is preserved as a separate ScienceReport, documenting what was checked and what was flagged. This provides an accountability trail for the communication's scientific claims.

## Invocation

```
# Public communication
> communication-team: Explain how vaccines work for a general public audience
  that includes vaccine-hesitant parents. Be accurate, empathetic, and non-condescending.

# Misinformation response
> communication-team: A viral social media post claims that 5G towers cause COVID-19.
  Produce an accessible, evidence-based response for a general audience.

# Educational narrative
> communication-team: Create a lesson for 6th graders about how plate tectonics was
  discovered, combining the history with a hands-on activity.

# Policymaker briefing
> communication-team: Summarize the current state of evidence on microplastics in
  drinking water for a city council audience. Separate what is known from what is uncertain.
```

## Limitations

- The team does not design experiments or specify measurements (use lab-design-team).
- The team does not conduct original research or analyze raw data (use science-investigation-team).
- For expert-to-expert communication (scientific papers, conference presentations to specialists), the communication team's audience-adaptation is unnecessary -- use the specialist directly.
- The team communicates about science but does not make policy recommendations. When policy implications are requested, Feynman-S enforces the science-policy boundary.
