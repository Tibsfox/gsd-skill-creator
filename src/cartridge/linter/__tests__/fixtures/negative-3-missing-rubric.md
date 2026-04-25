---
name: example-negative-3
description: A skill that talks about quality without saying what good looks like.
---

# Skill — Negative Fixture 3

## Algorithmic guarantees
The core algorithm runs in O(log n) and is decidable; tractable for any
input size we expect.

## Logic
If input is non-empty then output is established by induction; invariant
maintained across all loop iterations.

## Uncertainty
We compute a Bayesian posterior and emit a 95% confidence interval over
the likelihood; prior is uniform.

## Data
Input data is classified as **public** or **restricted**; redaction is
applied to restricted records. Compliant with GDPR.

## Quality
We aim for excellent results. The output is good when it is correct, and
better than the previous version. We evaluate success by inspecting
outputs manually; failures are addressed when noticed.
