# v1.1 — Semantic Conflict Detection

**Shipped:** 2026-02-04
**Phases:** 6-9 (4 phases) | **Plans:** 12 | **Requirements:** 10

Quality assurance layer preventing contradictory skills from coexisting.

### Key Features

- Semantic conflict detection between skills using embedding similarity
- Activation likelihood scoring with configurable thresholds
- Local embeddings via HuggingFace transformers (all-MiniLM-L6-v2)
- Conflict resolution recommendations (merge, deprecate, scope restriction)

---
