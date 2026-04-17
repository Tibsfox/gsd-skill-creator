# Lessons — v1.1

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Conflict detection is a prerequisite for safe learning.**
   Without it, the v1.0 learning loop could converge on contradictory skills. This is the immune system for the adaptive layer.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #6_

2. **Activation likelihood scoring with configurable thresholds gives operators control.**
   The threshold is the dial between false positives (annoying) and false negatives (dangerous).
---
   _⚙ Status: `investigate` · lesson #7_

3. **Local embeddings add a heavyweight dependency.**
   HuggingFace transformers pulls in a significant runtime for what is essentially a quality gate. Cold-start model loading will become a test speed issue (and does -- see v1.8.1).
   _🤖 Status: `investigate` · lesson #8 · needs review_
   > LLM reasoning: v1.44 PyDMD dogfood is about concept extraction, not replacing the HuggingFace transformers dependency.
