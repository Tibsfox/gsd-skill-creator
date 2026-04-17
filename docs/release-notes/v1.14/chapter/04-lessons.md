# Lessons — v1.14

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Three-tier determinism classification (deterministic, semi-deterministic, non-deterministic) is the right granularity.**
   Binary would miss semi-deterministic operations (e.g., commands that produce different output but same side effects). More tiers would be noise.
   _🤖 Status: `investigate` · lesson #76 · needs review_
   > LLM reasoning: v1.49 DACP is about agent communication determinism, not a direct continuation of the three-tier classification.

2. **Dry-run validation before script creation prevents generating broken scripts.**
   The cost of a failed dry run is negligible; the cost of promoting a broken script is a regression that erodes trust in the automation.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #77_

3. **Dashboard collectors for pipeline status bring promotion visibility into the existing dashboard.**
   Rather than building a new UI, the promotion pipeline feeds into the v1.12/v1.12.1 dashboard infrastructure. This is integration over invention.
---
   _🤖 Status: `applied` (applied in `v1.15`) · lesson #78 · needs review_
   > LLM reasoning: v1.15 Live Dashboard Terminal extends existing dashboard infrastructure rather than building a new UI.

4. **The promotion pipeline has 8 phases for what is fundamentally a linear flow.**
   Capture -> Analyze -> Score -> Generate -> Gate -> Monitor -> Track -> Display. Each step is simple; the complexity is in wiring them together correctly.
   _🤖 Status: `investigate` · lesson #79 · needs review_
   > LLM reasoning: v1.30 Vision-to-Mission Pipeline is a different pipeline; snippet doesn't show the 8-phase flow being collapsed.

5. **F1/accuracy/MCC calibration metrics as gate criteria overlap with v1.2's test infrastructure metrics.**
   The evaluator-optimizer from v1.9 also uses these metrics. Three systems now compute overlapping quality metrics for different purposes.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #80_
