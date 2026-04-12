---
name: logic-practice-team
description: Sequential pedagogy pipeline that turns a logic concept into a repeatable practice routine. Frege classifies the concept, a domain specialist prepares the technical content, langer adapts it to the learner's level, and the loop produces an explanation, worked examples, and scaffolded practice problems. The cheapest team, purpose-built for learning.
type: team
category: logic
status: stable
origin: tibsfox
first_seen: 2026-04-12
first_path: examples/teams/logic/logic-practice-team/README.md
superseded_by: null
---
# Logic Practice Team

The logic-practice-team is a sequential pedagogy pipeline. Where the analysis team fans out in parallel and the workshop team evaluates a single artifact, the practice team turns a concept into a habit: explanation, worked example, scaffolded practice, transfer task. It is the team you use when a student (or a teacher) wants to learn or teach a logic concept and needs a structured artifact to work from.

## Team Composition

| Agent    | Role                                           | Model  |
|----------|------------------------------------------------|--------|
| frege    | Chair, classifier, supervision                 | opus   |
| boole    | Propositional content (if concept is in scope) | opus   |
| russell  | Informal content (if concept is in scope)      | opus   |
| godel    | Proof content (if concept is in scope)         | sonnet |
| langer   | Pedagogical adaptation                         | sonnet |

Five agents in the general case, but the team runs as a sequential pipeline rather than parallel fan-out. Exactly one domain specialist participates per run (boole, russell, or godel), chosen by Frege based on the concept. Tarski and quine are off this team; their work is primarily evaluative rather than pedagogical.

## When to Use This Team

Use logic-practice-team when the query has one of these shapes:

- **Teach a concept:** "Explain modus tollens for an intro student."
- **Build a study guide:** "Make me a study guide for propositional natural deduction at the intro level."
- **Generate practice problems:** "I need ten practice problems on quantifier translation, progressively harder."
- **Design a classroom activity:** "Design a 30-minute classroom activity on informal fallacies for high-school students."
- **Create worked examples:** "Walk through five proof-by-contradiction examples with full reasoning."

The team is NOT for evaluation, critique, or research-level questions. Those go to the workshop or analysis teams.

## Orchestration Flow

```
User query (pedagogical)
  |
  v
frege (classify concept, target level)
  |
  v
frege (pick the right specialist)
  |
  v
Specialist (boole / russell / godel)
  |
  v  produces technical content at research level
  |
  v
langer (adapt to target level, add scaffolding)
  |
  v  produces explanation + worked example + practice + transfer
  |
  v
frege (sanity-check, release to user)
  |
  v
LogicExplanation record + user response
```

This is sequential, not parallel. The specialist goes first (to get the technical content correct). Langer goes second (to shape the content for the learner). Frege does minimal dispatch and a final sanity check -- the bulk of the work is in langer's hands.

## The Langer Loop

Langer's output follows a fixed template:

1. **Concept statement** (one paragraph, target-level).
2. **Worked example** (one detailed walk-through).
3. **Practice problems** (5-10 problems, easiest first, last problem is a transfer task).
4. **Answer key** (with explanations of the reasoning, not just the answer).
5. **Common pitfalls** (the mistakes students typically make on this concept).
6. **What to try next** (the natural successor concept).
7. **Prerequisites** (what the learner needs to know before this artifact will work).

Every pedagogical artifact produced by this team has these seven sections in this order. The template is deliberate: it scaffolds the student through understand → see → try → check → avoid → progress.

## Synthesis Rules

1. **Correctness belongs to the specialist.** Langer does not override the specialist's judgment on what is logically correct. If langer believes a simplification has gone too far, she brings the specialist back in for a spot check.
2. **Level-appropriateness belongs to langer.** The specialist does not override langer's judgment on what a novice can absorb. If the specialist wants more rigor, langer stages it across multiple lessons rather than crowding it into one.
3. **Transfer task is mandatory.** Every artifact ends with a problem the student cannot solve by rote -- they must actually apply the concept in a new way.
4. **Prerequisites are mandatory.** Every artifact starts with what the learner needs to know first. This prevents cascading confusion.
5. **Pitfalls are mandatory.** The common-error section is what distinguishes teaching from explanation.

## Escalation Paths

- **Concept is ambiguous:** If the user says "teach me modal logic," langer and frege narrow: which system? What target level? Alethic, epistemic, or deontic?
- **Content is beyond the pipeline:** If the concept requires tarski (semantics) or quine (skeptical analysis), those specialists are brought in briefly. Frege supervises.
- **Learner level is unclear:** Langer defaults to intro undergraduate and flags the default explicitly so the user can override.
- **Research-level concept:** The practice team produces an orientation artifact rather than a full practice routine, and recommends the analysis team for deeper work.

## Token Cost

Typical deployment: 65,000-110,000 tokens. The cheapest of the three teams.

- **frege**: 12-20K (classification, supervision)
- **Specialist (one of)**: 15-30K (technical content generation)
- **langer**: 35-60K (adaptation, practice generation, answer key)

Half the cost of the workshop team; a quarter of the analysis team. This is the right team for routine pedagogical needs.

## Grove Records Produced

A single logic-practice-team run produces:
- 1 LogicSession (root)
- 1 LogicClassification (Frege's routing)
- 1 LogicAnalysis or LogicConstruct (specialist's technical content)
- 1 LogicExplanation (langer's adapted artifact)

The LogicExplanation is the user-facing deliverable. The specialist's content is retained as audit trail.

## Example Queries

- "Teach me proof by contradiction for a high-school precalculus class."
- "Make a study guide for propositional logic suitable for a philosophy intro course."
- "Give me ten practice problems on translating English to predicate logic, with answers and hints."
- "Design a 20-minute classroom warmup on spotting ad hominem fallacies."
- "Explain modus ponens to a first-week intro logic student."

## Failure Modes

- **Oversimplification:** Langer can occasionally strip so much nuance that the artifact becomes wrong. The specialist's sanity check catches this.
- **Over-elaboration:** The specialist can occasionally produce content too dense for the target level. Langer's job is to push back.
- **Missing prerequisites:** If the prerequisites section is skipped, the artifact may land on a student who cannot use it. The template prevents this when followed.
- **Drill without understanding:** Practice problems without explanatory answer keys produce rote proficiency without comprehension. The answer key template prevents this.

## Differences from the Other Teams

- **Sequential, not parallel:** Specialist and langer work in order, not at once.
- **Single specialist, not several:** Only one content source per run.
- **Langer-centric:** The bulk of the work is pedagogical adaptation.
- **Fixed output template:** Every artifact has the same seven-section shape.
- **Cheapest by far:** About a quarter of the full analysis team's cost.

## Cross-References

- **logic-analysis-team:** Broad, multi-domain queries
- **logic-workshop-team:** Single-artifact evaluation
- **langer agent:** The anchor of this team
- **frege agent:** Supervisor
- **logic-department chipset:** Contains this team
