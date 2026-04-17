# Retrospective — v1.1

## What Worked

- **Embedding-based conflict detection is the right approach.** Using all-MiniLM-L6-v2 for semantic similarity avoids brittle keyword matching -- two skills can conflict without sharing any words.
- **Resolution recommendations (merge, deprecate, scope restriction) give actionable outcomes.** Detection without remediation would just generate noise.

## What Could Be Better

- **Local embeddings add a heavyweight dependency.** HuggingFace transformers pulls in a significant runtime for what is essentially a quality gate. Cold-start model loading will become a test speed issue (and does -- see v1.8.1).

## Lessons Learned

1. **Conflict detection is a prerequisite for safe learning.** Without it, the v1.0 learning loop could converge on contradictory skills. This is the immune system for the adaptive layer.
2. **Activation likelihood scoring with configurable thresholds gives operators control.** The threshold is the dial between false positives (annoying) and false negatives (dangerous).

---
