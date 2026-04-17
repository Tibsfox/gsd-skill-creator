# Lessons — v1.49.11

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Init flows need hardening passes separate from feature work.**
   First-time setup and recovery scenarios are different failure modes than normal operation -- they deserve dedicated attention.
   _🤖 Status: `applied` (applied in `v1.49.29`) · lesson #310 · needs review_
   > LLM reasoning: Retrospective-driven process hardening directly targets dedicated hardening passes.

2. **Release notes should document specific changes even for small patches.**
   Without concrete details (which edge cases, which error handlers, which recovery scenarios), the historical record is incomplete.
   _🤖 Status: `investigate` · lesson #311 · needs review_
   > LLM reasoning: Documentation Reflections snippet is too vague to confirm concrete per-patch change logging.

3. **Release notes lack specifics.**
   This is the shortest release note in the v1.49.x series -- no file counts, no test counts, no specific error cases fixed. Future readers cannot reconstruct what actually changed.
   _🤖 Status: `investigate` · lesson #312 · needs review_
   > LLM reasoning: v1.49.32 title mentions release integrity but snippet gives no evidence of richer release-note specifics.
