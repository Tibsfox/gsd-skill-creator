# Lessons — v1.49.6

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Small NLP utilities (TF-IDF, Naive Bayes, Levenshtein) are better hand-rolled than imported.**
   At ~250 LOC total with zero dependencies, the maintenance cost is lower than the supply chain risk of a heavy package like `natural`.
   _⚙ Status: `investigate` · lesson #288_

2. **macOS ships Bash 3.2 forever (GPLv2 ceiling).**
   Every shell script in the project must be POSIX-compatible -- no namerefs, no `grep -P`, no Bash 4.0+ features. This is a permanent constraint.
   _⚙ Status: `investigate` · lesson #289_

3. **`os.homedir()` is the cross-platform way to find home directories.**
   `process.env.HOME` with a `/tmp` fallback is a Unix-only pattern that breaks on Windows and edge cases.
   _🤖 Status: `investigate` · lesson #290 · needs review_
   > LLM reasoning: Smart Home Electronics release has no visible relation to os.homedir() portability fix.

4. **The `natural` dependency should have been flagged earlier.**
   A package pulling pg, mongoose, redis, and memjs as hard dependencies for NLP functionality is a supply chain red flag that dependency auditing (shipped later in v1.49.14) would catch automatically.
   _🤖 Status: `applied` (applied in `v1.49.14`) · lesson #291 · needs review_
   > LLM reasoning: Dependency Health Monitor in v1.49.14 is exactly the auditing capability the lesson called for.

5. **macOS was untested before users filed issues.**
   Both #22 (onnxruntime mutex) and #21 (Bash 3.2) were discovered by users, not CI. Cross-platform CI or at minimum a macOS smoke test would have caught both.
   _⚙ Status: `investigate` · lesson #292_
