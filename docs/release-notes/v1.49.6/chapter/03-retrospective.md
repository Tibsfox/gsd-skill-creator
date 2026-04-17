# Retrospective — v1.49.6

## What Worked

- **Root cause analysis drove precise fixes.** The onnxruntime mutex crash was traced to C++ static destruction order on macOS -- pinning to v1.20.1 which uses a different initialization pattern is the correct fix, not a workaround. Similarly, Bash 3.2 incompatibilities were traced to specific Bash 4.0+ features (namerefs, `${var^^}`, `grep -P`), not patched blindly.
- **Replacing `natural` with ~250 LOC of hand-rolled NLP saved ~300MB of transitive dependencies.** The `tfidf.ts` (~100 lines) and `naive-bayes.ts` (~150 lines) are zero-dependency drop-in replacements. This is the code absorption pattern that v1.49.14 would later formalize.
- **Moving `@huggingface/transformers` to optionalDependencies with automatic TF-IDF fallback.** Graceful degradation means the system works without a 300MB+ ML package installed -- the heuristic fallback is good enough for most use cases.

## What Could Be Better

- **The `natural` dependency should have been flagged earlier.** A package pulling pg, mongoose, redis, and memjs as hard dependencies for NLP functionality is a supply chain red flag that dependency auditing (shipped later in v1.49.14) would catch automatically.
- **macOS was untested before users filed issues.** Both #22 (onnxruntime mutex) and #21 (Bash 3.2) were discovered by users, not CI. Cross-platform CI or at minimum a macOS smoke test would have caught both.

## Lessons Learned

1. **Small NLP utilities (TF-IDF, Naive Bayes, Levenshtein) are better hand-rolled than imported.** At ~250 LOC total with zero dependencies, the maintenance cost is lower than the supply chain risk of a heavy package like `natural`.
2. **macOS ships Bash 3.2 forever (GPLv2 ceiling).** Every shell script in the project must be POSIX-compatible -- no namerefs, no `grep -P`, no Bash 4.0+ features. This is a permanent constraint.
3. **`os.homedir()` is the cross-platform way to find home directories.** `process.env.HOME` with a `/tmp` fallback is a Unix-only pattern that breaks on Windows and edge cases.
