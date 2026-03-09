# v1.1 — Semantic Conflict Detection

**Shipped:** 2026-02-04
**Phases:** 6-9 (4 phases) | **Plans:** 12 | **Requirements:** 10

Quality assurance layer preventing contradictory skills from coexisting.

### Key Features

- Semantic conflict detection between skills using embedding similarity
- Activation likelihood scoring with configurable thresholds
- Local embeddings via HuggingFace transformers (all-MiniLM-L6-v2)
- Conflict resolution recommendations (merge, deprecate, scope restriction)

## Retrospective

### What Worked
- **Embedding-based conflict detection is the right approach.** Using all-MiniLM-L6-v2 for semantic similarity avoids brittle keyword matching -- two skills can conflict without sharing any words.
- **Resolution recommendations (merge, deprecate, scope restriction) give actionable outcomes.** Detection without remediation would just generate noise.

### What Could Be Better
- **Local embeddings add a heavyweight dependency.** HuggingFace transformers pulls in a significant runtime for what is essentially a quality gate. Cold-start model loading will become a test speed issue (and does -- see v1.8.1).

## Lessons Learned

1. **Conflict detection is a prerequisite for safe learning.** Without it, the v1.0 learning loop could converge on contradictory skills. This is the immune system for the adaptive layer.
2. **Activation likelihood scoring with configurable thresholds gives operators control.** The threshold is the dial between false positives (annoying) and false negatives (dangerous).

---
