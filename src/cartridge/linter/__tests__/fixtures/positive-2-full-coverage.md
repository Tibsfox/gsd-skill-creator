---
name: example-positive-2
description: Second positive fixture — covers all five principles with different vocabulary.
---

# Skill — Cryptographic Verifier

## Computability

The verification algorithm is undecidable in general but tractable under
our restricted grammar. Complexity is bounded above by NP-complete on the
unrestricted problem; we reduce to a polynomial-time decidable subset.

## Logical structure

The proof obligations decompose into a set of theorems. Each theorem has a
clear premise → conclusion structure, and the lemma we depend on is proven
by contradiction. If the verifier accepts, then the input satisfies the
specification, by induction on the parse tree.

## Probabilistic reasoning

Outputs are likely correct with posterior probability above 0.99 given a
uniform prior over input distributions. We sample using Monte Carlo, then
report a 99% credible interval. The likelihood update follows Bayes'
theorem.

## Data classification

Input files are classified as **public** or **restricted** based on the
sensitivity level metadata. Restricted records are pseudonymized before
processing. We follow HIPAA classification rules.

## Quality criteria

A scoring rubric defines pass/fail thresholds. The acceptance criteria
include: (a) every test case passes, (b) the metric threshold of 0.98 is
met, (c) no SLA violation. Definition of done is encoded in this rubric.
