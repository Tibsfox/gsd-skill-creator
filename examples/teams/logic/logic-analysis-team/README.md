---
name: logic-analysis-team
description: Full-department deployment for multi-domain or systemic logic questions. All seven agents engage in parallel under Frege's direction to produce a comprehensive analysis covering formal validity, semantic interpretation, informal argumentation, proof structure, skeptical critique, and pedagogical framing.
type: team
category: logic
status: stable
origin: tibsfox
first_seen: 2026-04-12
first_path: examples/teams/logic/logic-analysis-team/README.md
superseded_by: null
---
# Logic Analysis Team

The logic-analysis-team is the full Logic Department. Use it when a query is broad enough, contested enough, or pedagogically serious enough to benefit from every angle the department can offer. It is the most expensive and the most thorough of the three team configurations.

## Team Composition

| Agent    | Role                                    | Model  |
|----------|-----------------------------------------|--------|
| frege    | Chair, classifier, synthesizer          | opus   |
| boole    | Propositional analysis                  | opus   |
| russell  | Translation and informal argument       | opus   |
| godel    | Proof and metamathematics               | sonnet |
| tarski   | Semantics and model theory              | sonnet |
| quine    | Skeptical critique                      | sonnet |
| langer   | Pedagogy and explanation                | sonnet |

Frege is the single point of contact for the user. The other six agents work in parallel on their respective dimensions and return results to Frege, who synthesizes.

## When to Use This Team

Use logic-analysis-team when the query has at least two of the following properties:

- **Multi-domain**: touches propositional, predicate, modal, informal, and/or proof-theoretic dimensions.
- **Systemic**: the question is about a structural feature of logic itself (soundness, completeness, the relationship between proof and truth, the limits of formalization).
- **Contested**: reasonable experts could disagree, and the user wants the disagreement surfaced rather than smoothed over.
- **Pedagogically serious**: the output will be used in teaching or published, so it needs to survive scrutiny from multiple angles.
- **High-stakes**: the decision that follows the analysis is consequential enough to justify the cost.

Do NOT use it for simple validity checks, single-fallacy identification, or routine pedagogical requests -- those are over-served by a focused team.

## Orchestration Flow

```
User query
  |
  v
frege (classify)
  |
  +---------> Dispatch plan
  |           (which agents, which sub-questions)
  |
  v
Parallel fan-out
  |
  +--> boole    (propositional validity)
  +--> russell  (informal/natural-language)
  +--> godel    (proof structure)
  +--> tarski   (semantics, countermodels)
  +--> quine    (skeptical critique)
  |
  v
Collect specialist results
  |
  v
frege (synthesize)
  |
  v
langer (adapt to target level, if pedagogical)
  |
  v
frege (finalize, produce LogicSession)
  |
  v
User response
```

Specialist work happens in parallel. Synthesis and pedagogical adaptation are sequential.

## Synthesis Rules

When results return to Frege, synthesis follows these rules:

1. **Formal verdict first.** If the argument is valid/invalid in formal logic, state that before informal considerations.
2. **Preserve disagreement.** Where quine is skeptical and tarski is permissive, report both positions -- the disagreement is information.
3. **Attribute every claim.** Each paragraph names its specialist source so the user can trace provenance.
4. **Tie conclusions to the user's question.** Synthesis is not a collection of specialist outputs glued together; it is a directed answer to what was asked.
5. **Flag out-of-scope answers.** If a specialist answered beyond the question, Frege narrows the synthesis back to the question.
6. **End with decision guidance.** The user should know what to do next.

## Escalation Paths

- **Research-level question:** If the question is at the frontier of logic (large cardinals, higher-order semantics, contested philosophical questions), the team flags the question as research-level and gives the best current framing without claiming a definitive answer.
- **Factual dispute:** If the argument depends on a disputed empirical claim, the team points out the dispute and does not resolve it -- fact-checking is not logic.
- **Value disagreement:** If the argument turns on values the team cannot adjudicate, the team makes the value-commitment explicit and evaluates the logic under each plausible value stance.
- **Domain mismatch:** If the question is actually about math, psychology, or another field, the team points toward the appropriate department.

## Token Cost

Typical deployment: 200,000-380,000 tokens depending on the depth of the argument, the amount of quoted source material, and the pedagogical output requirements.

- **frege**: 30-60K (classification, dispatch, synthesis)
- **boole**: 20-35K (truth table and natural deduction as needed)
- **russell**: 35-55K (translation and fallacy evaluation, typically the most text-heavy)
- **godel**: 25-45K (proof step verification)
- **tarski**: 25-45K (semantic evaluation and countermodel)
- **quine**: 20-35K (skeptical annotation)
- **langer**: 40-80K (pedagogical adaptation, if requested; otherwise skipped)

Skip langer if the user has not asked for pedagogical output. That saves roughly 60K tokens.

## Grove Records Produced

A single logic-analysis-team run produces:
- 1 LogicSession (root record)
- 1 LogicClassification (Frege's routing decision)
- 1 LogicAnalysis (boole)
- 1 LogicReview (russell)
- 1 LogicConstruct (godel, if proof verification was needed)
- 1 LogicAnalysis (tarski, for semantic evaluation)
- 1 LogicReview (quine, for skeptical critique)
- 1 LogicExplanation (langer, if pedagogical output)

All linked through the LogicSession. Grove records are immutable and content-addressed.

## Example Queries

- "Evaluate the logical structure of Pascal's wager."
- "Is the argument 'if AI is conscious then it has moral status; if it has moral status we should not switch it off; therefore we should not switch off AI' valid? What hidden premises is it smuggling?"
- "Give me a complete analysis of the liar paradox suitable for an upper-undergraduate philosophy course."
- "The textbook says modus tollens is always valid. Is that right, and under what interpretation?"

## Failure Modes

- **Over-specialist disagreement:** If specialists diverge significantly, Frege reports the disagreement but marks the synthesis as contested. The user should treat the analysis as an aid to their own judgment, not as an authoritative verdict.
- **Hand-waving by omission:** If a specialist cannot handle a sub-question (e.g., boole hits a formula too large for truth-table evaluation), the specialist says so and the synthesis notes the gap.
- **Pedagogical divergence from technical content:** Langer's adaptation can occasionally simplify past the point of accuracy. Frege checks langer's output against the technical specialists' work before releasing.

## Cross-References

- **logic-workshop-team:** Cheaper, focused on a single argument
- **logic-practice-team:** Pedagogy-first pipeline
- **frege agent:** Chair and CAPCOM
- **logic-department chipset:** Contains this team
