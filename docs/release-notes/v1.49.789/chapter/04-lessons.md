# Lessons — v1.49.789

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Verdict-pattern surface separation is load-bearing**
   Splitting the observability surface (scanner + dashboard + allowlist) from the decision surface (per-module wire-or-retire verdicts) lets each layer evolve independently. Operators can change verdict policy without touching the scanner; scanner changes don't invalidate prior verdicts. Surface separation is the design pattern that converts a static-analysis tool from data-source into a closed feedback loop.
   _⚙ Status: `investigate` · candidate #10422_

2. **Warm-up-period prediction was correct and self-verifying**
   The Lesson #10421 candidate (v787) predicted that the adoption-refresh tool would produce its first useful diff at v788+ because v787 was the first ship to write a `.json` snapshot. v789 (the next ship using the refresh tool after v787) produced exactly the predicted diff — `↑ semantic-channel: test-only → living`. The lesson is now field-validated and ripe for codification.
   _⚙ Status: `investigate` · candidate #10421 (validated; promote to ESTABLISHED at next codification ship)_

3. **The lightest wire that satisfies the verdict is preferable to the most natural wire**
   A more "natural" wire of `semantic-channel` would have modified `src/dacp/` or `src/interpreter/` to call the drift checker internally — but those surfaces touch HARD-preservation invariants and multi-consumer modules. The CLI-subcommand wire achieves the verdict outcome (test-only → living) with blast-radius limited to two new files + a single dispatcher edit. Default to the cheapest wire that matches the verdict's intent; defer richer wires to follow-on ships if they prove necessary.
   _⚙ Status: `investigate` · candidate #10423_
