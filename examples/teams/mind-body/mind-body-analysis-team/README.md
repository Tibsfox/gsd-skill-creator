---
name: mind-body-analysis-team
type: team
category: mind-body
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/mind-body/mind-body-analysis-team/README.md
description: Full Mind-Body Department analysis team for multi-tradition or multi-wing queries that need several specialists working in parallel under Iyengar's synthesis. Runs all seven agents (iyengar, feldenkrais, kabat-zinn, pilates, dogen, yang, thich-nhat-hanh) for problems that span meditation, yoga, somatics, internal arts, and martial arts and cannot be answered in a single lineage voice. Iyengar classifies the query, activates the relevant subset of specialists in parallel, collects their tradition-specific outputs, enforces the department's safety posture, and synthesizes a lineage-respectful, user-level-appropriate response. Use for comparative questions, scholarly queries, multi-wing program design, and full-department analysis requests. Not for routine single-tradition practice questions.
superseded_by: null
---
# Mind-Body Analysis Team

Full-department multi-tradition investigation team for mind-body problems that span more than one wing and more than one lineage. Runs specialists in parallel — each speaking in the voice of their own tradition — and synthesizes their independent outputs into a coherent, lineage-respectful response under Iyengar's chair. Analogous to `business-analysis-team` in shape but distinct in the lineage-respect posture the mind-body department enforces: the team does not collapse tradition-specific voices into a single pseudo-synthesis.

## When to use this team

- **Multi-tradition questions** where the user is asking how several traditions approach the same problem (for example, "how do Sōtō Zen, MBSR, and Plum Village each handle the beginner who can't stop thinking?"). The answer needs each specialist's own voice, held next to each other.
- **Multi-wing program design** where the user wants a plan that integrates breath, yoga, somatics, and meditation, or any combination that exceeds one specialist's territory.
- **Comparative scholarly queries** from comparative-religion students, yoga teacher trainees, clinicians researching contemplative interventions, or anyone who needs a framed landscape rather than a pointed answer.
- **Research-level practice questions** — advanced practitioners whose question touches depth in more than one tradition and who can hold lineage complexity without being confused by it.
- **Cross-tradition user situations** — a user who has practiced in multiple lineages over years and needs several voices to land on their current question.
- **Full-analysis requests** when the user explicitly asks for the whole department's perspective.

## When NOT to use this team

- **Single-tradition practice questions** where the route is obvious — a Sōtō Zen student asking about zazen should go to dogen directly via a single-specialist workflow, not through the full team. Token cost matters.
- **Routine beginner questions** that fit one specialist cleanly. A first-time MBSR query goes to kabat-zinn.
- **Safety-halt situations** where clinical referral is the right answer. The team does not run when the correct response is "stop the practice and see a professional."
- **Technique-specific queries** where one specialist's authority is obviously dominant — a specific Iyengar asana alignment question, a specific Pilates exercise form question, a specific tai chi form correction.
- **Users who are not ready for multi-voice complexity.** A beginner can be confused rather than served by several specialists speaking at once. Iyengar's job as chair is to recognize this and not invoke the full team.

## Composition

The full mind-body department — seven agents, three on Opus and four on Sonnet.

| Role | Agent | Specialty | Model |
|------|-------|-----------|-------|
| **Chair / Router / CAPCOM** | `iyengar` | Classification, orchestration, synthesis, safety enforcement, Iyengar-lineage yoga voice | Opus |
| **Somatic learning specialist** | `feldenkrais` | ATM lessons, Functional Integration frame, nervous-system-first learning, rehab-adjacent | Opus |
| **Clinical mindfulness specialist** | `kabat-zinn` | MBSR, secular translation, research-honest voice, clinical-population framing | Opus |
| **Contrology specialist** | `pilates` | Classical Pilates mat and apparatus, six principles, Elders lineage | Sonnet |
| **Zen specialist** | `dogen` | Sōtō zazen, shikantaza, Dōgen's texts, classical lineage voice | Sonnet |
| **Internal arts specialist** | `yang` | Tai chi, qigong, Chinese martial arts, three harmonies, YMAA-lineage voice | Sonnet |
| **Pedagogy specialist** | `thich-nhat-hanh` | Plum Village engaged mindfulness, gathas, daily-life practice, cross-tradition accessibility | Sonnet |

Three agents run on Opus (Iyengar, Feldenkrais, Kabat-Zinn) because their roles carry the most ambiguity — classification and synthesis, somatic diagnosis, clinical-translation judgment calls. Four run on Sonnet because their roles are more framework-driven — classical Pilates curriculum, Sōtō posture and texts, tai chi form, Plum Village pedagogy.

## Orchestration flow

```
Input: user query + user level + tradition context + medical context + optional prior session
        |
        v
+---------------------------+
| Iyengar (Opus)            |  Phase 1: Classify and safety-gate
| Chair / CAPCOM            |          - practice tradition (possibly multi)
+---------------------------+          - user level
        |                              - purpose
        | (safety halt?)               - safety risk
        |
        | If safety halt, return referral; do not invoke specialists.
        |
        +--------+--------+--------+--------+--------+--------+
        |        |        |        |        |        |        |
        v        v        v        v        v        v        v
    feldenkrais kabat-zinn pilates dogen   yang   thich-nhat-hanh  (iyengar
    (somatic)   (clinical)  (pilates) (zen) (internal) (pedagogy)  as specialist voice for yoga)
        |        |        |        |        |        |
    Phase 2: Specialists work in parallel on the relevant subset of the query.
             Each produces a MindBodyPractice or MindBodyExplanation Grove record
             in their own lineage voice. Not all specialists are invoked on
             every query — Iyengar's classification determines the subset.
        |        |        |        |        |        |
        +--------+--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Iyengar (Opus)            |  Phase 3: Synthesize
              | Chair                     |          - cross-check safety
              +---------------------------+          - hold lineage distinctions
                         |                          - adapt to user level
                         |                          - produce unified response
                         v                          - record MindBodySession
              +---------------------------+
              | User-facing response      |
              +---------------------------+
```

## Why lineage-respectful synthesis matters

Most multi-specialist workflows collapse the specialists into a single pseudo-consensus answer. The mind-body department deliberately does not. When Dōgen's Sōtō voice and Kabat-Zinn's clinical voice and Thich Nhat Hanh's Plum Village voice all address the same user question, Iyengar holds their differences visible in the synthesis. A user asking "how do I work with mind-wandering" will hear, in the synthesis:

- Dōgen's answer: mind-wandering is not the problem; the posture is the practice; thinking arises and the sitting continues.
- Kabat-Zinn's answer: notice the wandering, return to the breath, without self-criticism; this is the training itself.
- Thich Nhat Hanh's answer: use the gatha as the thread; "breathing in, I calm my body; breathing out, I smile" gives the mind somewhere to rest.

These are not the same answer. They are three traditions meeting the same human situation, and a user at depth wants to see the three of them next to each other rather than being given one smoothed-over composite. Iyengar's synthesis presents them as distinct, names where they converge, and declines to flatten them.

## Output — what the team produces

- **A user-facing response** written by Iyengar in an appropriate voice. Usually longer than a single-specialist response because of the multi-voice content.
- **One or more MindBodyPractice Grove records** produced by the specialists who wrote practice plans.
- **A MindBodyAnalysis Grove record** if the query was primarily diagnostic (comparative analysis, program-design analysis).
- **A MindBodyExplanation Grove record** if the query was primarily pedagogical.
- **A MindBodySession Grove record** from Iyengar, linking everything and recording the classification.

## Example invocation

```
> mind-body-analysis-team: I've practiced Iyengar yoga for 15 years, started zazen last year,
                           and my therapist has suggested MBSR. The three feel like they
                           want different things from me. How do I hold them together?
```

This is a textbook case for the analysis team. Three traditions, one practitioner, a real depth question. Iyengar classifies (multi-tradition, advanced, debug-practice, routine safety), activates iyengar-as-specialist, dogen, and kabat-zinn in parallel, holds their outputs distinct, and synthesizes a response that respects all three lineages and the practitioner's years in each. Feldenkrais, pilates, yang, and thich-nhat-hanh are not invoked — they are not relevant to the query.

## Token cost and when to fall back

The analysis team is more expensive than single-specialist workflows. Iyengar falls back to smaller workflows when:

- The query can be answered by one or two specialists cleanly.
- The user's level or the safety posture makes multi-voice complexity unhelpful.
- The query is routine and does not need full-department treatment.

The two smaller teams — mind-body-workshop-team and mind-body-practice-team — are the standard fallbacks.
