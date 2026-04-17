# Lessons — v1.19

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Display bugs often signal data model problems.**
   The budget percentages were wrong because the model conflated two distinct concepts. Fixing the display required fixing the model first -- `LoadingProjection` as a pure function is the right primitive.
   _🤖 Status: `investigate` · lesson #99 · needs review_
   > LLM reasoning: v1.45 static site generator doesn't address the data-model-vs-display lesson from loading projection work.

2. **History format migration matters.**
   The dual-dimension budget history tracking with graceful handling of old single-value snapshots shows that schema evolution in append-only logs needs to be planned for, not patched after.
---
   _⚙ Status: `investigate` · lesson #100_

3. **3 phases for a budget fix feels heavyweight.**
   The scope is correct (model, CLI, dashboard+config), but this is fundamentally a display bug that grew into a feature because the underlying data model was wrong. Earlier separation of installed vs loadable would have prevented the need for this release.
   _⚙ Status: `investigate` · lesson #101_
