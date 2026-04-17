# v1.49.6 — macOS Compatibility & Dependency Hardening

**Released:** 2026-03-01
**Scope:** cross-platform compatibility, native module hardening, supply-chain trim
**Branch:** dev → main
**Tag:** v1.49.6 (2026-03-01)
**Commits:** f584b32e9..af9ad29b7 (6)
**Files changed:** 32 (+680 / -1703 net)
**Predecessor:** v1.49.5 — Project Filesystem Reorganization
**Successor:** v1.49.7
**Classification:** feature — xplat hardening + native-dep elimination
**Fixes:** [#22](https://github.com/Tibsfox/gsd-skill-creator/issues/22), [#21](https://github.com/Tibsfox/gsd-skill-creator/pull/21)
**Verification:** 19,201 / 19,204 tests passing · 0 regressions · fresh macOS clone boots · node ≥ 18 enforced

## Summary

**A single macOS bug report exposed a supply-chain and Bash-era compatibility cluster that v1.49.6 resolved in one landable patch.** Issue #22 came in as a plain crash report — `onnxruntime-node` triggering `libc++abi` termination during Node.js process exit on macOS — but once the traceback was followed through the C++ runtime boundary, it opened a door onto three adjacent problems: a 300MB chain of unused transitive dependencies pulled by the `natural` NLP package, four shell scripts that silently failed on the Bash 3.2.57 that ships with every macOS since Mavericks, and a `process.env.HOME` fallback that was Unix-only in a codebase that now intends to run on Windows. v1.49.6 landed fixes for all four in a single commit (`f584b32e9`) plus three follow-on commits that cherry-picked cross-platform test fixes from PR #21 (community contributor `jacoblewisau`), updated the public-facing documentation surface, and cleaned up a TS2578 that emerged from the transformers type-stub work. The patch removes 1,703 lines and adds 680 — net -1,023 lines, almost all of it from the `package-lock.json` purge when `natural` and its dependency tree (pg, mongoose, redis, memjs, wordnet-db, approximately 50 transitive modules) left the install graph.

**The onnxruntime-node mutex crash was a C++ static-destruction-order bug, not a Node-level issue.** The crash manifested at process exit with no application-level stack trace — just an abort from `libc++abi` calling `std::terminate()`. Tracing through the native boundary revealed that `onnxruntime-node` v1.21.x uses a C++ static singleton (`Ort::Env`) whose destructor acquires a `std::mutex`. On macOS the static destruction order between `Ort::Env` and its associated mutex is non-deterministic; when the mutex is destroyed first, the `Ort::Env` destructor attempts to lock an already-destroyed mutex, `pthread_mutex_lock` returns `EINVAL`, and the C++ runtime terminates the process. This is a known upstream problem in v1.21.x. The fix pinned `onnxruntime-node` to v1.20.1 via `npm` `overrides`, which uses an older initialization pattern that sequences the statics correctly. Pinning via `overrides` (not `dependencies`) was deliberate — it constrains the entire install graph so that any transitive consumer of `onnxruntime-node` (for example, transformers backends) gets the same safe version, rather than leaving the door open for a nested resolution to the crashing release.

**Removing the `natural` NLP package eliminated approximately 300MB of install-time bloat for roughly 250 lines of actually-used functionality.** The `natural` v8.1.0 package is a general-purpose NLP toolkit, and while its API surface is clean, its `package.json` declares `pg`, `mongoose`, `redis`, `memjs`, and `wordnet-db` as hard dependencies — not optional peers, not dev dependencies, but required install-time modules whose presence blocks any install graph that cannot resolve them. The project consumed `natural.TfIdf` in three files (`src/embeddings/heuristic-fallback.ts`, `src/application/relevance-scorer.ts`, `src/brainstorm/techniques/visual/affinity-mapping.ts`), `natural.BayesClassifier` in one (`src/orchestrator/intent/bayes-classifier.ts`), `natural.WordTokenizer` in one (`src/testing/generators/heuristic-generator.ts`), and `natural.LevenshteinDistance` in one (`src/validation/agent-validation.ts`). The replacements are `src/nlp/tfidf.ts` (103 lines, pure TypeScript, zero deps), `src/nlp/naive-bayes.ts` (158 lines, multinomial with Laplace smoothing, zero deps), an inline `split/filter` tokenizer, and `fastest-levenshtein` (746 bytes, single function). The total hand-rolled surface is under 300 lines; it reproduces every API the project actually called, and it removes the obligation to carry four databases' client libraries in the install graph.

**Bash 3.2.57 is a permanent macOS floor, and every shell script in the repo now honors that constraint.** macOS ships Bash 3.2.57 from August 2014 as `/bin/bash` and will never upgrade past it — Apple froze Bash at the last GPLv2 version before the GPLv3 transition and migrated its own default shell to `zsh`. Bash 4.0+ features (`declare -A`, `local -n` namerefs, `${var^^}` / `${var,,}` case conversion, `mapfile` without workarounds) and GNU-only flags (`grep -P` for PCRE, `grep -oP` for PCRE-extract) silently fail or crash on macOS Bash 3.2. v1.49.6 audited the four hook scripts (`project-claude/hooks/validate-commit.sh`, `session-state.sh`, `phase-boundary-check.sh`, and `src/git/scripts/git-state-check.sh`), replaced `local -n` with positional-argument patterns, swapped `grep -oP` for `sed`/`grep -qE`, and standardized all shebangs to `#!/usr/bin/env bash` so the interpreter is resolved via `PATH` rather than hard-wired to a Linux-only `/bin/bash`. The change looks trivial at the diff level but the behavioral guarantee is strong: every hook in the repo now runs identically on Linux, macOS, and any POSIX-compatible CI without Bash version sniffing.

**Moving `@huggingface/transformers` to `optionalDependencies` with automatic TF-IDF fallback turned the embedding model from a hard requirement into a graceful optional.** Prior to v1.49.6 the transformers package was a hard `dependency`, meaning every fresh install pulled 300MB+ of ML tooling whether the user ever planned to compute embeddings or not. The release adds local type stubs inside `src/embeddings/embedding-service.ts` so the TypeScript compiler sees a coherent type surface even when the runtime package is absent, uses a dynamic import guarded by an `@ts-expect-error` / runtime try-catch, and wires `src/embeddings/heuristic-fallback.ts` to the new `src/nlp/tfidf.ts` so that any code path requesting an embedding gets a TF-IDF heuristic vector without ever knowing the ML backend was unavailable. The follow-on commit `af9ad29b7` then removed the `@ts-expect-error` after the explicit type assertion made it unnecessary (TS2578 noisy-directive diagnostic). The practical effect: `npm install` on a constrained environment (CI, low-disk laptop, embedded device) completes without the ML payload, runtime is fully functional on the heuristic path, and a user who wants real embeddings can `npm install @huggingface/transformers` explicitly and get the upgrade without code changes.

**`process.env.HOME` is a Unix-only pattern, and `os.homedir()` is the cross-platform answer.** The `src/dacp/retrospective/persistence.ts` file read `process.env.HOME ?? '/tmp'`, which works on Linux and macOS but fails on Windows (where the variable is `USERPROFILE` or `HOMEPATH`, not `HOME`) and on any edge case where `HOME` is unset (some CI runners, some container base images). Node's `os.homedir()` performs the correct platform-specific resolution and is the canonical answer. The fix is one line, but it's the kind of latent portability issue that only surfaces when someone actually tries to run the tool outside a familiar environment. Catching it alongside the macOS work meant Windows compatibility moved forward a step without a separate release.

**The 32-file diff reveals the cross-cutting nature of supply-chain and compatibility work.** Shipped artifacts include three new `src/nlp/` source files (293 lines total, zero runtime dependencies), three hook-script POSIX rewrites in `project-claude/hooks/`, one shell-helper rewrite in `src/git/scripts/`, six TypeScript consumer-file edits swapping `natural` imports for local `src/nlp/` or `fastest-levenshtein`, a fresh `.npmrc` with `engine-strict=true`, a `package.json` rewrite adding an `engines` field (`"node": ">=18.0.0"`), shifting transformers to `optionalDependencies`, and declaring overrides for `onnxruntime-node` and `sharp`. The `package-lock.json` churn (1,717 line net reduction) is the direct consequence of the dependency graph collapsing, not gratuitous regeneration. Documentation updates land across `CHANGELOG.md`, `CLAUDE.md`, `README.md`, `docs/FEATURES.md`, `docs/FILE-STRUCTURE.md`, `docs/RELEASE-HISTORY.md`, and `docs/TROUBLESHOOTING.md` — the last of which gained a new macOS section covering both onnxruntime and Bash 3.2. The complete-milestone workflow at `.claude/get-shit-done/workflows/complete-milestone.md` grew a `documentation_review` step, so every subsequent version bump is gated on a doc-surface check.

**Community PR #21 from `jacoblewisau` was cherry-picked for the pieces not already superseded.** The contributor had independently hit the fresh-clone failures on macOS and sent a fix set covering `git-state-check.sh`, `package-lock.json`, `desktop/package-lock.json`, `src/vtm/__tests__/template-system.test.ts`, and `test/git/scripts/shell-scripts.test.ts`. Three of those files were already handled by the v1.49.6 main work, but the two test fixes — a missing `vision-template.md` fixture and a shellcheck batching optimization to avoid npx timeout on macOS CI — were genuinely new. Commit `7cf46c559` cherry-picked them with explicit credit to `jacoblewisau` in the commit trailer. Merge commit `02dbd1250` brought the cherry-pick onto the release branch; merge commit `89484e500` assembled the final v1.49.6 state from dev. The release therefore ships with a proper upstream attribution for the community contribution and closes both #21 and #22 at the same tag.

**Test suite integrity held throughout: 19,201 of 19,204 tests passed after the changes, with the three non-passing entries pre-existing and unrelated.** The regression-risk surface for this release was high — six TypeScript files swapped imports, five shell scripts swapped syntax, the `package.json` and lockfile rewrote the dependency graph. Every consumer of `natural.TfIdf`, `natural.BayesClassifier`, `natural.WordTokenizer`, and `natural.LevenshteinDistance` was exercised by existing tests, and all of those tests continued to pass. The shell-script changes were validated by the shellcheck suite at `test/git/scripts/shell-scripts.test.ts`. The Bayes classifier continued to produce the same posterior probabilities on its existing fixture corpus; the TF-IDF scorer produced the same relevance rankings on its existing inputs; the Levenshtein replacement produced the same edit distances. Net-net, the v1.49.6 dependency rewrite is an invisible-from-outside change — the API surface the codebase consumed is preserved exactly, but the supply-chain cost of sustaining it dropped by two orders of magnitude in install size.

## Key Features

| Area | What Shipped |
|------|--------------|
| Native module pinning | `onnxruntime-node` pinned to `1.20.1` via `package.json` `overrides` — avoids C++ static-destruction mutex crash on macOS (#22) |
| Native module elimination | `sharp` overridden to empty package — zero usage in codebase confirmed, removes unused native build step |
| Transformers optional | `@huggingface/transformers` moved to `optionalDependencies` with local type stubs in `src/embeddings/embedding-service.ts` |
| NLP absorption: TF-IDF | New `src/nlp/tfidf.ts` (103 lines, zero deps) — drop-in for `natural.TfIdf` used in 3 call sites |
| NLP absorption: Naive Bayes | New `src/nlp/naive-bayes.ts` (158 lines, Laplace smoothing) — drop-in for `natural.BayesClassifier` in `src/orchestrator/intent/bayes-classifier.ts` |
| NLP absorption: barrel | New `src/nlp/index.ts` — single-source export for `TfIdf`, `BayesClassifier`, tokenizer helpers |
| Levenshtein swap | `fastest-levenshtein` (746 bytes) replaces `natural.LevenshteinDistance` in `src/validation/agent-validation.ts` |
| Tokenizer inline | `natural.WordTokenizer` replaced with inline `split/filter` in `src/testing/generators/heuristic-generator.ts` |
| Bash 3.2 compatibility | 4 shell scripts rewritten (`project-claude/hooks/validate-commit.sh`, `session-state.sh`, `phase-boundary-check.sh`, `src/git/scripts/git-state-check.sh`) |
| Engine enforcement | New `.npmrc` with `engine-strict=true`; `package.json` declares `"engines": { "node": ">=18.0.0" }` |
| Cross-platform HOME | `process.env.HOME ?? '/tmp'` → `os.homedir()` in `src/dacp/retrospective/persistence.ts` |
| Fresh-clone test fixes | Cherry-picked from PR #21 (jacoblewisau): `vision-template.md` fixture + shellcheck batching in `test/git/scripts/shell-scripts.test.ts` |
| Troubleshooting docs | New macOS section in `docs/TROUBLESHOOTING.md` (48 lines) covering onnxruntime + Bash 3.2 |
| Workflow gate | `documentation_review` step added to `.claude/get-shit-done/workflows/complete-milestone.md` |

## Retrospective

### What Worked

- **Root-cause analysis drove precise, minimal fixes.** The onnxruntime mutex crash was traced through the C++ static-destruction boundary to a specific v1.21.x initialization pattern; the fix pinned to v1.20.1 which does not exhibit the bug. The Bash 3.2 audit enumerated exactly which Bash 4.0+ features were in use (`local -n`, `grep -P`, `grep -oP`) and replaced them POSIX-surgically rather than rewriting scripts wholesale. Every fix landed because someone understood why the symptom existed, not because someone found a patch that made the symptom disappear.
- **Hand-rolling ~300 lines of NLP eliminated 300MB of transitive dependencies.** TF-IDF, multinomial Naive Bayes with Laplace smoothing, and a whitespace tokenizer are computer-science primitives; the implementations are short enough that the maintenance cost is obviously lower than the supply-chain cost of a heavy package that pulls four database clients as hard dependencies. Code absorption in the small turns into architectural independence in the large — a principle this release operationalized for the first time and v1.49.14 would later formalize as a dependency-health pattern.
- **Pinning via `overrides`, not `dependencies`, constrains the entire install graph.** The `onnxruntime-node` pin needed to be authoritative over transitive consumers (transformers backends in particular could otherwise pull a nested crashing version). Using `overrides` made the constraint graph-global rather than leaf-local, which is the right posture for any native module whose transitive pathways are not under direct project control.
- **Community contribution was integrated with explicit attribution.** PR #21 from `jacoblewisau` arrived independently; the test-surface fixes it contained (fixture file, shellcheck batching) were cherry-picked with a `Credit: jacoblewisau` and `Co-Authored-By:` trailer. The contributor's work shipped at the same release tag as the core work, with attribution preserved in `git log` — the lowest-friction version of open-source courtesy.
- **Graceful optional-dependency fallback means the heuristic path is always reachable.** Moving transformers to `optionalDependencies` plus wiring `src/embeddings/heuristic-fallback.ts` to the new TF-IDF implementation means the system is never in an "embeddings unavailable, feature dead" state — it degrades to deterministic TF-IDF scoring, which is fine for most relevance tasks and preserves determinism for tests.
- **Ran the entire test suite after the swap and confirmed zero regressions.** 19,201 of 19,204 tests passing post-swap (the three non-passing entries pre-existed and were unrelated) demonstrated that the API-preservation property held — every `natural.X` call site got an equivalent `src/nlp/X` or `fastest-levenshtein` call with the same inputs producing the same outputs.

### What Could Be Better

- **The `natural` dependency's transitive footprint should have been flagged at intake.** A package pulling `pg`, `mongoose`, `redis`, and `memjs` as hard dependencies for NLP primitives is a supply-chain red flag that any automated dependency-audit tool would catch. The fact that it shipped and persisted across many releases suggests intake review focused on direct dependencies only. The dependency-auditing work that ships later in v1.49.14 is the response to exactly this gap.
- **macOS was not in CI; users caught both bugs before we did.** Both #22 (onnxruntime mutex) and #21 (Bash 3.2 cluster) were discovered by fresh-clone users on macOS, not by the test suite or any CI job. A macOS smoke test — even a single "can we `npm install && npm test` on a fresh macOS runner" job — would have caught both. Cross-platform CI is the structural remedy; v1.49.6 fixed the symptoms but did not add the CI gate.
- **The Tauri/onnxruntime native-build surface remains under-understood.** `onnxruntime-node` and `sharp` are both native modules with non-trivial build paths; pinning and overriding addressed the immediate crash but did not result in a project-local runbook for what to do the next time a native module misbehaves. A `docs/NATIVE-MODULES.md` would have made the next round of native-module triage cheaper.
- **No regression test for the specific macOS crash was added.** The fix is pinning a version; if a future upgrade silently restores the crashing initialization pattern, the test suite will not catch it. A smoke test that spawns a short-lived Node process, exercises the embeddings path, and asserts clean exit on macOS would tie the pin to a behavioral assertion rather than a version string.

## Lessons Learned

- **Small NLP primitives are better hand-rolled than imported.** TF-IDF, Naive Bayes with Laplace smoothing, Levenshtein distance, and whitespace tokenization are textbook algorithms. At roughly 300 lines of TypeScript with zero dependencies, the maintenance cost is lower than the supply-chain cost of any package that pulls databases or native modules as hard dependencies. The specific threshold the project now operates under: if the algorithm fits in one file and does not require state the caller cannot provide, absorb it.
- **macOS ships Bash 3.2.57 forever because of the GPLv2 ceiling, and every shell script must honor that.** Apple froze Bash at 3.2 before the GPLv3 transition and will not ship a newer version. Bash 4.0+ features (`declare -A`, `local -n`, `${var^^}`, `${var,,}`, `mapfile`) and GNU-only `grep -P` flags are therefore off-limits in any script that must run on macOS. This is a permanent project constraint, not a temporary workaround.
- **`os.homedir()` is the cross-platform way to find home directories.** `process.env.HOME` with a `/tmp` fallback is a Unix-only pattern that breaks on Windows (`USERPROFILE` / `HOMEPATH`) and on edge cases where `HOME` is unset. The Node `os` module performs the correct platform resolution and should be the default.
- **Pin native modules with `npm` `overrides`, not `dependencies`, when the crash is graph-wide.** A leaf `dependencies` entry only constrains the direct edge; any transitive consumer can still resolve to the crashing version. `overrides` binds the whole graph, which is the correct choice when the bug is version-specific and must not re-enter through a nested path.
- **Move heavy optional runtimes to `optionalDependencies` with a usable heuristic fallback.** Installing a 300MB ML toolkit for a feature a given user may never exercise is a bad default. The pattern of `optionalDependencies` + local type stubs + dynamic import + heuristic fallback turns expensive runtimes into opt-in upgrades without code changes at the call site.
- **Default-deny supply-chain thinking beats default-allow.** The `natural` package was default-allowed at intake because its API was clean; its `package.json` was not read carefully. The inverse posture — every dependency must justify its transitive footprint before it's accepted — is the supply-chain equivalent of Tauri v2's default-deny capability model from v1.49.3. Both catch bugs at intake rather than at exit.
- **Fresh-clone testing on every supported OS is a release gate, not a nice-to-have.** v1.49.5 shipped with all 19,107 tests green and with a broken fresh-clone experience on macOS. Test suites measure what they can reach; a fresh clone on a production-supported OS is the only unambiguous "does this work?" signal.
- **Community contributions should be cherry-picked with explicit attribution even when superseded.** PR #21 overlapped the core work in three of five files, but the two novel test fixes shipped with full `Credit:` and `Co-Authored-By:` trailers in commit `7cf46c559`. The cost is zero; the signal to the contributor (and to the project's future contributors reading git log) is significant.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.5](../v1.49.5/) | Predecessor — Project Filesystem Reorganization whose fresh-clone experience this release actually validated on macOS |
| [v1.49.7](../v1.49.7/) | Successor — post-hardening release on the stable supply-chain baseline |
| [v1.49.3](../v1.49.3/) | Related hardening patch — default-deny capability model for Tauri v2; same intake-discipline pattern |
| [v1.49.2](../v1.49.2/) | Related — test-passing-but-launch-broken pattern that v1.49.3 and v1.49.6 both respond to |
| [v1.49.0](../v1.49.0/) | Parent mega-release where the native-module surface (onnxruntime, transformers, sharp) originally shipped |
| [v1.49.14](../v1.49.14/) | Successor that formalized dependency-audit patterns introduced by this release's supply-chain observations |
| [#22](https://github.com/Tibsfox/gsd-skill-creator/issues/22) | onnxruntime mutex crash bug report (closed by this release) |
| [#21](https://github.com/Tibsfox/gsd-skill-creator/pull/21) | Community PR from `jacoblewisau` — cross-platform fresh-clone fixes (cherry-picked) |
| `src/nlp/tfidf.ts` | New zero-dependency TF-IDF implementation (103 lines) |
| `src/nlp/naive-bayes.ts` | New zero-dependency Naive Bayes implementation (158 lines) |
| `src/nlp/index.ts` | Barrel export for the new NLP module |
| `package.json` | `overrides` block for onnxruntime-node + sharp; `optionalDependencies` for transformers; `engines.node` |
| `.npmrc` | `engine-strict=true` — blocks install on Node < 18 |
| `docs/TROUBLESHOOTING.md` | New macOS section for onnxruntime + Bash 3.2 guidance |
| `.claude/get-shit-done/workflows/complete-milestone.md` | New `documentation_review` step gating future version bumps |

## Engine Position

v1.49.6 is the supply-chain and cross-platform hardening checkpoint of the v1.49 line. v1.49.0 shipped the mega-release surface including native modules; v1.49.1–v1.49.3 polished first-run desktop bugs; v1.49.4–v1.49.5 reorganized the filesystem and documentation. v1.49.6 closes the loop by validating that the resulting tree actually installs and runs on macOS and on constrained Node environments. Every subsequent release inherits the cleaned supply graph (no `natural`, pinned `onnxruntime-node`, optional transformers), the POSIX-safe hook shells, the `os.homedir()` convention, and the `engine-strict` enforcement. The dependency-auditing work in v1.49.14 generalizes the lessons of this release into automated gates; the Memory Arena work on `artemis-ii` depends on the pinned native-module baseline. The patch also sets a precedent for the project's response to community contributions: cherry-pick with attribution, close the upstream PR, credit the contributor in both the tag notes and the commit trailer.

## Files

- `src/nlp/tfidf.ts` — new, 103 lines, zero-dependency TF-IDF (drop-in for `natural.TfIdf`)
- `src/nlp/naive-bayes.ts` — new, 158 lines, zero-dependency multinomial Naive Bayes with Laplace smoothing
- `src/nlp/index.ts` — new, barrel export for the NLP module
- `.npmrc` — new, `engine-strict=true`
- `package.json` — `overrides` (onnxruntime-node 1.20.1, sharp empty), `optionalDependencies` (transformers), `engines.node >= 18`, add `fastest-levenshtein`, remove `natural` + `@types/natural`
- `package-lock.json` — 1,717-line reduction from dependency-tree collapse
- `src/embeddings/embedding-service.ts` — local type stubs + dynamic import + heuristic fallback
- `src/embeddings/heuristic-fallback.ts` — `natural.TfIdf` → `TfIdf` from `src/nlp/`
- `src/application/relevance-scorer.ts` — `natural.TfIdf` → `TfIdf` from `src/nlp/`
- `src/brainstorm/techniques/visual/affinity-mapping.ts` — `natural.TfIdf` → `TfIdf` from `src/nlp/`
- `src/orchestrator/intent/bayes-classifier.ts` — `natural.BayesClassifier` → `BayesClassifier` from `src/nlp/`
- `src/testing/generators/heuristic-generator.ts` — `natural.WordTokenizer` → inline `split/filter`
- `src/validation/agent-validation.ts` — `natural.LevenshteinDistance` → `fastest-levenshtein`
- `src/dacp/retrospective/persistence.ts` — `process.env.HOME ?? '/tmp'` → `os.homedir()`
- `project-claude/hooks/validate-commit.sh` — POSIX `sed`/`grep -qE` replacements for `grep -oP`, `#!/usr/bin/env bash`
- `project-claude/hooks/session-state.sh` — `#!/usr/bin/env bash` shebang normalization
- `project-claude/hooks/phase-boundary-check.sh` — `#!/usr/bin/env bash` shebang normalization
- `src/git/scripts/git-state-check.sh` — `local -n` (Bash 4.3+ namerefs) replaced with positional-argument pattern
- `src/vtm/__tests__/template-system.test.ts` — `vision-template.md` fixture added (cherry-pick from PR #21)
- `test/git/scripts/shell-scripts.test.ts` — shellcheck batched into single invocation, 30s timeout (cherry-pick from PR #21)
- `docs/TROUBLESHOOTING.md` — new macOS section (48 lines) covering onnxruntime + Bash 3.2
- `docs/RELEASE-HISTORY.md`, `docs/FEATURES.md`, `docs/FILE-STRUCTURE.md`, `CHANGELOG.md`, `CLAUDE.md`, `README.md`, `project-claude/CLAUDE.md` — version + documentation surface updates
- `.claude/get-shit-done/workflows/complete-milestone.md` — new `documentation_review` step
- `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — version bump to 1.49.6
