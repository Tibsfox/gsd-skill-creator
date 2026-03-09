# v1.49.6 -- macOS Compatibility & Dependency Hardening

**Released:** 2026-03-01
**Type:** Patch (bug fix + dependency cleanup)
**Fixes:** [#22](https://github.com/Tibsfox/gsd-skill-creator/issues/22), [#21](https://github.com/Tibsfox/gsd-skill-creator/pull/21)

---

## Summary

Resolves a mutex crash on macOS caused by onnxruntime-node v1.21.x, fixes Bash 3.2 incompatibilities in shell scripts, and eliminates the `natural` package (which pulled ~300MB of unnecessary transitive dependencies including pg, mongoose, and redis) by replacing it with hand-rolled, zero-dependency NLP implementations.

---

## Changes

### Bug Fixes

- **Fix onnxruntime mutex crash on macOS** -- Pin `onnxruntime-node` to v1.20.1 via npm overrides to avoid C++ static destruction order bug (`Ort::Env` destructor fires after mutex is already destroyed). Closes #22.
- **Fix Bash 3.2 incompatibilities** -- Replace `local -n` (namerefs, Bash 4.3+), `grep -oP`/`grep -qP` (GNU PCRE), and `#!/bin/bash` shebangs with POSIX-compatible alternatives across all shell scripts. Fixes fresh macOS clone failures from #21.
- **Fix `process.env.HOME` fallback** -- Replace `process.env.HOME ?? '/tmp'` with `os.homedir()` in `src/dacp/retrospective/persistence.ts` for cross-platform reliability.

### Dependency Changes

- **Remove `natural` package** -- Replaced with `src/nlp/tfidf.ts` (~100 lines) and `src/nlp/naive-bayes.ts` (~150 lines). The `natural` v8.1.0 package pulled pg, mongoose, redis, memjs, and wordnet-db as hard dependencies (~300MB installed size) for functionality we used less than 250 lines of.
- **Remove `@types/natural`** -- No longer needed.
- **Add `fastest-levenshtein`** -- 746-byte pure JS replacement for `natural.LevenshteinDistance`.
- **Move `@huggingface/transformers` to optionalDependencies** -- The embedding model is now a graceful optional. Local type stubs allow compilation without the package installed. Runtime fallback to TF-IDF heuristics is automatic.
- **Override `sharp` with empty package** -- Prevents onnxruntime from pulling in the sharp native module unnecessarily.
- **Add `engines` field** -- `"node": ">=18.0.0"` with `.npmrc` `engine-strict=true`.

### New Files

| File | Description |
|------|-------------|
| `src/nlp/tfidf.ts` | Zero-dependency TF-IDF implementation (drop-in for `natural.TfIdf`) |
| `src/nlp/naive-bayes.ts` | Multinomial Naive Bayes with Laplace smoothing (drop-in for `natural.BayesClassifier`) |
| `src/nlp/index.ts` | Barrel export for NLP modules |
| `.npmrc` | Engine strictness enforcement |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Version bump, engine field, dependency swap, overrides |
| `src/embeddings/heuristic-fallback.ts` | `natural.TfIdf` -> `TfIdf` from `src/nlp/` |
| `src/application/relevance-scorer.ts` | `natural.TfIdf` -> `TfIdf` from `src/nlp/` |
| `src/brainstorm/techniques/visual/affinity-mapping.ts` | `natural.TfIdf` -> `TfIdf` from `src/nlp/` |
| `src/testing/generators/heuristic-generator.ts` | `natural.WordTokenizer` -> inline tokenizer |
| `src/orchestrator/intent/bayes-classifier.ts` | `natural.BayesClassifier` -> `BayesClassifier` from `src/nlp/` |
| `src/validation/agent-validation.ts` | `natural.LevenshteinDistance` -> `fastest-levenshtein` |
| `src/embeddings/embedding-service.ts` | Local type stubs, `@ts-expect-error` on optional import |
| `src/dacp/retrospective/persistence.ts` | `process.env.HOME` -> `os.homedir()` |
| `project-claude/hooks/validate-commit.sh` | POSIX regex, `#!/usr/bin/env bash` |
| `project-claude/hooks/session-state.sh` | `#!/usr/bin/env bash` |
| `project-claude/hooks/phase-boundary-check.sh` | `#!/usr/bin/env bash` |
| `src/git/scripts/git-state-check.sh` | `local -n` -> positional args pattern |

---

## Root Cause Analysis

### onnxruntime Mutex (Issue #22)

The crash occurs during Node.js process exit on macOS. `onnxruntime-node` v1.21.0 uses a C++ static singleton (`Ort::Env`) that is destroyed during static destruction. On macOS, the destruction order between the `Ort::Env` destructor and its associated `std::mutex` is non-deterministic. When the mutex is destroyed first, the `Ort::Env` destructor tries to lock it and hits `EINVAL`, causing `libc++abi` to call `std::terminate()`.

This is a known upstream issue. The fix pins to v1.20.1 which uses a different initialization pattern that avoids the race.

### Bash 3.2 Compatibility (PR #21)

macOS ships Bash 3.2.57 (2014) and will never upgrade past GPLv2. Features introduced in Bash 4.0+ (`declare -A`, `local -n`, `${var^^}`, `${var,,}`) and GNU-only flags (`grep -P`) silently fail or crash. All project scripts now use only POSIX-compatible constructs.

---

## Test Results

- **Total:** 19,204
- **Passed:** 19,201
- **Failed:** 2 (pre-existing, unrelated to this release)
- **Pending:** 1
- **Regressions:** 0

## Retrospective

### What Worked
- **Root cause analysis drove precise fixes.** The onnxruntime mutex crash was traced to C++ static destruction order on macOS -- pinning to v1.20.1 which uses a different initialization pattern is the correct fix, not a workaround. Similarly, Bash 3.2 incompatibilities were traced to specific Bash 4.0+ features (namerefs, `${var^^}`, `grep -P`), not patched blindly.
- **Replacing `natural` with ~250 LOC of hand-rolled NLP saved ~300MB of transitive dependencies.** The `tfidf.ts` (~100 lines) and `naive-bayes.ts` (~150 lines) are zero-dependency drop-in replacements. This is the code absorption pattern that v1.49.14 would later formalize.
- **Moving `@huggingface/transformers` to optionalDependencies with automatic TF-IDF fallback.** Graceful degradation means the system works without a 300MB+ ML package installed -- the heuristic fallback is good enough for most use cases.

### What Could Be Better
- **The `natural` dependency should have been flagged earlier.** A package pulling pg, mongoose, redis, and memjs as hard dependencies for NLP functionality is a supply chain red flag that dependency auditing (shipped later in v1.49.14) would catch automatically.
- **macOS was untested before users filed issues.** Both #22 (onnxruntime mutex) and #21 (Bash 3.2) were discovered by users, not CI. Cross-platform CI or at minimum a macOS smoke test would have caught both.

## Lessons Learned

1. **Small NLP utilities (TF-IDF, Naive Bayes, Levenshtein) are better hand-rolled than imported.** At ~250 LOC total with zero dependencies, the maintenance cost is lower than the supply chain risk of a heavy package like `natural`.
2. **macOS ships Bash 3.2 forever (GPLv2 ceiling).** Every shell script in the project must be POSIX-compatible -- no namerefs, no `grep -P`, no Bash 4.0+ features. This is a permanent constraint.
3. **`os.homedir()` is the cross-platform way to find home directories.** `process.env.HOME` with a `/tmp` fallback is a Unix-only pattern that breaks on Windows and edge cases.
