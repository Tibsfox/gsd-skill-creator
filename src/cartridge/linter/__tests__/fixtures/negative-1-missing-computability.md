---
name: example-negative-1
description: A skill that runs an algorithm without grounding the cost story.
---

# Skill — Negative Fixture 1

This skill runs an algorithm to process incoming requests. It loops over
a list of items and produces a result for each one.

## Logic
If the input is non-empty then we proceed; otherwise we exit. The
postcondition follows by induction on the list length, with the
invariant that the counter strictly decreases until exhaustion.

## Uncertainty
We report a Bayesian posterior with a 95% credible interval over Monte
Carlo samples drawn from a uniform prior; the likelihood is updated as
new evidence arrives.

## Data
Input files are classified as **public** or **internal**; PII is
redacted before storage. GDPR compliant; sensitivity level is recorded
in the metadata.

## Quality
Quality is assessed by a rubric checklist; acceptance criteria require
the metric threshold to be met. Definition of done documented in the
KPI table; SLA documented.
