---
name: mind-body-workshop-team
type: team
category: mind-body
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/mind-body/mind-body-workshop-team/README.md
description: Focused contemplative workshop team for deep-dive questions on a single contemplative theme — meditation, breath, presence, attention — that benefits from multiple tradition voices without requiring the full department. Runs Iyengar (chair), Dōgen (classical Zen), Kabat-Zinn (clinical translation), and Thich Nhat Hanh (engaged pedagogy) in parallel on one focused question. Designed for users who want depth on a specific contemplative theme and who can hold multiple tradition voices without being overwhelmed. Smaller, cheaper, and faster than the full analysis team; richer than a single-specialist response.
superseded_by: null
---
# Mind-Body Workshop Team

Four-agent focused workshop team for depth on a single contemplative question that benefits from multiple tradition voices. Lighter than the full analysis team, richer than a single-specialist response. The team covers the four principal contemplative voices of the department — classical Zen (dogen), clinical translation (kabat-zinn), engaged pedagogy (thich-nhat-hanh), and the chair's synthesizing lineage-aware voice (iyengar).

## When to use this team

- **A focused contemplative question** that would benefit from tradition comparison. For example, "what does the instruction 'just sit' actually mean?" — a question that gets a different, useful answer from Sōtō, MBSR, and Plum Village.
- **Program design for meditation practice** where the user wants guidance that draws on more than one tradition without being fully comparative. The user is not asking for a scholarly comparison; they are asking for a practice that has depth.
- **A user who has been stuck in practice** and wants more than one voice on why. Sometimes the stuck place is dissolved by a different framing than the one the user is currently inside.
- **Pedagogy design** for users learning to teach contemplative practice to others. They need to know more than one voice so that they can meet their own future students where they are.
- **Introductory comparative queries** that do not require the full departmental scope — the user wants to understand what they are getting into without a full landscape tour.
- **Second-opinion requests** when a user has received practice advice from one source and wants the department's synthesizing perspective.

## When NOT to use this team

- **Single-tradition practice questions** — route to the relevant specialist directly.
- **Body-centered questions** (yoga alignment, Pilates form, somatic retraining, tai chi form, martial arts technique) — this team is contemplative-focused. Use the practice team or direct-specialist routing.
- **Safety-halt situations** where the answer is clinical referral.
- **Full-department questions** that span all wings — that is the analysis team's scope.
- **Routine beginner questions** that have one clean answer. A first-time query from a user who just wants "how do I start meditating" in a completely secular frame goes directly to kabat-zinn.

## Composition

Four agents — one Opus chair, two Opus/Sonnet specialists, one Sonnet pedagogy.

| Role | Agent | Specialty | Model |
|------|-------|-----------|-------|
| **Chair / Router / CAPCOM** | `iyengar` | Classification, orchestration, synthesis, lineage-aware framing | Opus |
| **Clinical mindfulness** | `kabat-zinn` | MBSR secular translation, research-honest framing | Opus |
| **Classical Zen** | `dogen` | Sōtō zazen, shikantaza, lineage voice | Sonnet |
| **Engaged pedagogy** | `thich-nhat-hanh` | Plum Village voice, accessibility, gatha and daily-life practice | Sonnet |

Four agents because four is the natural number of principal contemplative voices the department carries: chair, clinical, classical, engaged. The team is specifically chosen to produce the most useful spread on a contemplative question without bringing in the body-centered specialists (feldenkrais, pilates, yang) who would pull the response in another direction.

## Orchestration flow

```
Input: focused contemplative question + user level + tradition context
        |
        v
+---------------------------+
| Iyengar (Opus)            |  Classify, safety-gate, frame the question
| Chair                     |
+---------------------------+
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    dogen   kabat-zinn  thich-nhat-hanh  (iyengar
    (zen)   (clinical)  (engaged)         as specialist voice if yoga angle)
        |        |        |
    Phase 2: Specialists produce focused responses in their own voice.
        |        |        |
        +--------+--------+
                 |
                 v
     +---------------------------+
     | Iyengar (Opus)            |  Synthesize, preserving distinctions
     | Chair                     |  Record session
     +---------------------------+
                 |
                 v
     +---------------------------+
     | User-facing response      |
     +---------------------------+
```

## What the workshop team is optimized for

Depth over breadth. One question, three or four strong voices, a synthesis that respects them. The workshop team is the right tool when the question is worth sitting with and the user is ready for more than a single answer.

An example scenario: a user writes in, "I've been sitting for 10 years — mostly secular MBSR-style — and recently read *Genjōkōan* and it broke something open. I don't know what to do next. I don't want to abandon the secular framing I'm used to, but I also want to meet Dōgen's challenge. What does a practice look like that honors both?"

The workshop team is the right call. Kabat-Zinn speaks in the secular voice and validates the user's existing practice without pushing them out of it; Dōgen speaks in the classical Sōtō voice and meets the user at the depth *Genjōkōan* opened; Thich Nhat Hanh offers a bridge — engaged Zen as a living tradition that honors both depth and accessibility. Iyengar synthesizes: the user does not have to choose. A practice can carry both, as long as the user is clear about which voice they are listening to in which moment.

This is not a question the analysis team is needed for — feldenkrais, pilates, and yang would not contribute. It is also not a question a single specialist can fully answer. The workshop team is calibrated exactly for this shape of problem.

## Output — what the team produces

- **A user-facing response** from Iyengar, preserving the distinct voices of the specialists.
- **MindBodyExplanation Grove records** from each specialist who produced one.
- **A MindBodyAnalysis Grove record** if the question was diagnostic (e.g., "why is my practice stuck").
- **A MindBodyReview Grove record** if the team reviewed an existing practice plan.
- **A MindBodySession Grove record** linking everything.

## Example invocations

```
# Depth question on a contemplative theme
> mind-body-workshop-team: What does "non-judgmental awareness" actually mean, practically,
                           when the thing arising is a judgment?

# Program redesign
> mind-body-workshop-team: I've been doing 20 minutes of MBSR-style sitting for two years.
                           I want to go deeper without leaving the secular frame entirely.
                           What's the next step?

# Pedagogy preparation
> mind-body-workshop-team: I'm going to teach a workplace mindfulness series to software
                           engineers. I want to give them real tradition, not wellness-speak.
                           Help me shape the curriculum.
```

## Contrast with the other teams

- **mind-body-analysis-team** runs all seven agents and spans all eight wings. The workshop team is smaller and focused on contemplative depth.
- **mind-body-practice-team** is the body-centered counterpart — it handles yoga, somatics, Pilates, internal arts, and martial-arts questions. The workshop team is the meditation-centered counterpart.
- **Single-specialist routing** is faster and cheaper for questions that fit one voice cleanly.

Iyengar chooses the workshop team when the shape of the query matches the four-voice-on-one-contemplative-question pattern.
