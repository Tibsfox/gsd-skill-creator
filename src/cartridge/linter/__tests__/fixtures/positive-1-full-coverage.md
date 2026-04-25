---
name: example-positive-1
description: Example SKILL.md that satisfies all five structural-completeness principles.
---

# Example Skill — Positive Fixture 1

## Algorithmic guarantees

This skill runs an algorithm with worst-case complexity O(n log n) and is
decidable on all inputs of bounded length. The reduction is polynomial and
remains tractable for n ≤ 10^6.

## Deductive structure

If the input passes the precondition check, then the postcondition is
guaranteed by induction on the recursion depth. We prove this by case
analysis: case 1 (empty), case 2 (singleton), case 3 (general). The
invariant is maintained across each loop iteration.

## Uncertainty handling

When the model returns a confidence interval below 0.85 we treat the result
as uncertain. The Bayesian posterior is updated using a uniform prior; the
likelihood is computed from a 95% confidence interval over Monte Carlo
samples.

## Data handling

This skill reads input data classified as **internal** (never PII, never
restricted, never confidential). Outputs are redacted before they leave the
process boundary. We comply with GDPR data-handling requirements.

## Quality assessment

A run is scored against an explicit rubric: the acceptance criteria are
listed in the checklist below. The skill passes if all four KPIs are met
and the SLO is not breached. The metric threshold is 0.95 out of 1.00.

- [ ] criterion 1
- [ ] criterion 2
- [ ] criterion 3
