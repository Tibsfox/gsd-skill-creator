---
name: logic-workshop-team
description: Focused five-agent team for evaluating a single argument, proof, or claim in depth. Frege dispatches boole, russell, godel, and quine (or a subset appropriate to the argument type), each working on the same artifact from a different angle. Produces a LogicReview record with a clear verdict and decision guidance.
type: team
category: logic
status: stable
origin: tibsfox
first_seen: 2026-04-12
first_path: examples/teams/logic/logic-workshop-team/README.md
superseded_by: null
---
# Logic Workshop Team

The logic-workshop-team is the focused evaluation team for a single logical artifact -- an argument, a proof, a formalization, or a claim. It is the middle ground between the full logic-analysis-team (broad, expensive) and a single-specialist dispatch (narrow, cheap). The workshop team runs five agents on the same artifact, each from their own angle, and produces a consolidated LogicReview.

## Team Composition

| Agent    | Role                                   | Model  |
|----------|----------------------------------------|--------|
| frege    | Chair, classifier, synthesizer         | opus   |
| russell  | Informal argument and fallacy          | opus   |
| godel    | Proof verification                     | sonnet |
| tarski   | Semantic countermodel                  | sonnet |
| quine    | Skeptical critique                     | sonnet |

Five agents. Frege is CAPCOM. The four evaluators work in parallel on the same artifact.

Boole and langer are NOT on this team by default. Boole is available on demand if the argument is predominantly propositional; langer is available on demand if the user wants the verdict adapted for a student audience. Frege makes the call.

## When to Use This Team

Use logic-workshop-team when the user presents **one specific thing** and wants a thorough evaluation of it:

- "Is this argument valid?"
- "Evaluate this proof."
- "Find the problems with this paper's reasoning."
- "Is this formalization right?"
- "Review this textbook example for errors."

The team is NOT the right choice for broad questions that span multiple arguments or for pedagogical explanation of a concept. Those go to the analysis team or the practice team.

## Orchestration Flow

```
User query (one specific argument/proof/claim)
  |
  v
frege (classify, decide subset of team)
  |
  v
Parallel fan-out (typically 4 evaluators)
  |
  +--> russell  (natural-language evaluation, fallacies)
  +--> godel    (step-level proof verification)
  +--> tarski   (semantic interpretation, countermodel)
  +--> quine    (skeptical annotation)
  |
  v
Collect four reviews
  |
  v
frege (synthesize into single verdict)
  |
  v
LogicReview record + user response
```

The default is four evaluators in parallel. If the argument is purely propositional, Frege may swap russell for boole. If the argument is about proof structure, godel takes the lead and the others verify his work.

## Synthesis Rules

1. **One verdict.** The synthesis produces a single overall verdict -- sound / invalid / gap / fallacious / contested -- with clear reasoning.
2. **Specialist disagreement is preserved** but a single recommendation is given. If quine dissents, the dissent is reported, but Frege still picks a primary verdict based on the weight of evidence.
3. **Steel-manned version is always included.** Even if the argument is flawed, the team reports what the best version of the argument would look like.
4. **Quote the original exactly.** Every fallacy flag is accompanied by the verbatim passage that triggered it.
5. **Decision guidance is mandatory.** The user should know what to do next: accept the argument, reject it, request more information, or revise it.

## Escalation Paths

- **Argument needs formalization first:** If the argument is too vague to evaluate, the team asks Frege to surface a clarification request to the user.
- **Evaluators agree the argument is out of scope:** The team points to the appropriate department (math, psychology, politics, etc.) and reports that logic is not the right tool.
- **Argument involves modality the team cannot resolve:** Tarski and quine jointly report the modal position and let the user decide which modal system to work in.

## Token Cost

Typical deployment: 120,000-170,000 tokens.

- **frege**: 25-45K (classification, synthesis)
- **russell**: 30-50K (text-heavy natural-language work)
- **godel**: 20-35K (proof step verification)
- **tarski**: 20-35K (semantic reasoning)
- **quine**: 15-25K (skeptical annotation)

Roughly half the cost of the full analysis team, with most of the critical bite.

## Grove Records Produced

A single logic-workshop-team run produces:
- 1 LogicSession (root)
- 1 LogicClassification
- 1 LogicReview (russell)
- 1 LogicConstruct or LogicAnalysis (godel, for proof work)
- 1 LogicAnalysis (tarski)
- 1 LogicReview (quine)
- 1 synthesized LogicReview (frege, the consolidated verdict)

All linked through the LogicSession.

## Example Queries

- "Here's a proof from a student homework that √2 is irrational. Is it correct?"
- "Evaluate this paragraph from a political op-ed for logical structure and fallacies."
- "My colleague insists this argument is sound. I'm not convinced. Who's right?"
- "Is this formalization of 'everyone has a unique birth mother' correct in FOL?"

## Failure Modes

- **Synthesis flattens dissent:** If quine raises a philosophical worry that the majority dismisses, Frege must report quine's concern prominently, not bury it.
- **Missed context:** If the argument is from a specific domain (law, medicine, physics) with conventions the team does not know, the evaluation should flag its own limits.
- **Over-confident verdict:** The team should distinguish "this argument is invalid" from "this argument would need additional premises to be valid." Those are different verdicts.

## Differences from logic-analysis-team

- **Narrower:** One artifact, not a broad question.
- **Faster:** 4 evaluators instead of 6.
- **Cheaper:** About half the tokens.
- **No pedagogical adaptation by default:** Langer is off the team unless explicitly requested.
- **Single verdict mandatory:** The analysis team can report "contested, here are two views"; the workshop team picks a primary view.

## Cross-References

- **logic-analysis-team:** Full-department, broader queries
- **logic-practice-team:** Pedagogy-first pipeline
- **frege agent:** Chair
- **critical-argumentation skill:** Canonical evaluation practice
