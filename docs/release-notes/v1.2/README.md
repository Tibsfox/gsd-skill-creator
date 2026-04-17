# v1.2 — Test Infrastructure

**Released:** 2026-02-05
**Scope:** automated skill-activation testing — test CRUD, activation simulation, batch runner, test generation, and threshold calibration as the skill-quality assurance layer for the v1.0 loop
**Branch:** dev → main
**Tag:** v1.2 (2026-02-05T08:18:48-08:00) — "Skill Quality Assurance"
**Predecessor:** v1.1 — Semantic Conflict Detection
**Successor:** v1.3 — Documentation Overhaul
**Classification:** milestone — testing and calibration foundation
**Phases:** 5 (14, 15, 16, 17, 18) · **Plans:** 19 · **Requirements:** 18
**Commits:** `700ce9d8a..82fc12f11` (53 commits)
**Files changed:** 53 files · **Insertions:** 12,185 · **Deletions:** 2
**Verification:** per-component unit tests (TestStore, ActivationSimulator, BatchSimulator, TestRunner, ResultFormatter, HeuristicTestGenerator, LLMTestGenerator, ThresholdOptimizer, ThresholdHistory, BenchmarkReporter, MccCalculator, ChallengerDetector) · atomic JSONL persistence with cross-device-link fallback · CI integration via `--json` output paths

## Summary

**v1.2 is the quality assurance layer for the v1.0 loop.** The foundation (v1.0) defined the 6-step Observe → Detect → Suggest → Apply → Learn → Compose cycle. The validation layer (v1.1) added semantic conflict detection and activation likelihood scoring as the first extension of the Apply step. Neither release could answer the operational question that matters in production: _does this skill actually activate correctly when real users write real prompts?_ v1.2 closes that gap. Five phases (14, 15, 16, 17, 18) built the full test infrastructure: a test case CRUD layer with JSON persistence and Zod validation, an ActivationSimulator that embeds prompts and predicts activations, a TestRunner that executes test suites with accuracy and false-positive-rate metrics, automatic test generators (heuristic NLP, cross-skill negatives, optional LLM), and a calibration subsystem that optimizes activation thresholds via F1 grid search and verifies simulator fidelity through Matthews Correlation Coefficient. The tag message names it "Skill Quality Assurance" and that is exactly what shipped.

**Test case CRUD with Zod validation makes the suite a first-class artifact, not an afterthought.** Phase 14 built the TestStore class with full create/read/update/delete semantics, atomic writes, and per-skill indexing. Every test case carries a prompt, an expected skill, an expected-activate boolean, and optional metadata — validated by Zod schemas at the entry point so malformed tests cannot reach disk. Persistence is JSONL with an atomic rename fallback that handles the EXDEV cross-device-link error explicitly (fix shipped in `5154ad9ff`): when the store directory and the OS temp directory sit on different mount points, the naive `os.tmpdir()` → `rename` path fails, so the writer retries by copying into the target directory first. The entire test command (`test add`, `test list`, `test show`, `test remove`) was integrated into the CLI router in a single commit (`89476659c`) once the store layer was green.

**ActivationSimulator predicts activations using the same embeddings the runtime uses, so simulation fidelity stays honest.** Phase 15 built ActivationSimulator on top of the v1.1 EmbeddingService. The simulator takes a prompt, embeds it once, scores every skill's trigger description against the prompt embedding via cosine similarity, and returns a ranked activation list with confidence categorization (strong / marginal / skip). BatchSimulator parallelizes this across entire test suites with a `@clack/prompts` progress bar and configurable concurrency. Phase 15 also shipped the ChallengerDetector — a component that flags cases where the top-ranked skill barely edges out a second skill, surfacing differentiation weakness before it becomes a false-positive incident. Every sub-component (ActivationSimulator, BatchSimulator, ChallengerDetector, ConfidenceCategorizer, ExplanationGenerator, HintGenerator) shipped with its own `.test.ts` sibling, continuing the per-component testing discipline v1.1 established.

**TestRunner turns the test suite into a measurable, CI-integratable quality gate.** Phase 16 layered execution on top of the simulator: TestRunner orchestrates a suite, feeds each test case through ActivationSimulator, compares predicted vs expected, and produces a RunResult with accuracy, false-positive rate, precision, recall, F1, and per-test pass/fail records. ResultStore persists runs as JSONL so regression over time is queryable. ResultFormatter renders a terminal summary and a JSON output path. `test run` accepts `--json <path>` for CI ingestion and `--filter <tag>` for running subsets. The runner is deterministic when seeded — same test suite, same skill catalog, same threshold produces the same pass/fail set — so CI signal is trustworthy. Four commits landed the full runner (`6daee2d7c`, `428839060`, `96018b226`, `1d7c1227b`) and two more landed exhaustive tests for the runner and formatter (`b958e0fc9`, `998743db1`).

**Automated test generation closes the flywheel between observations and validation.** Phase 17 built three generators behind a shared TestGenerator orchestrator. HeuristicTestGenerator (`45ff978ab`) extracts positive test cases from real session observations using regex-and-NLP rules: it looks at prompts that co-occurred with a skill activation in pattern storage and promotes the representative ones to test cases. CrossSkillGenerator (`3d7304037`) produces negative test cases by taking a prompt that activated skill A and asserting that skill B _should not_ activate on it — the differentiation guard that catches overlap bugs before they ship. LLMTestGenerator (`de68f0fce`) uses Claude Haiku (opt-in, graceful no-op without an API key, same dynamic-import pattern v1.1 introduced) to produce adversarial variants — typos, paraphrases, different registers. ReviewWorkflow (`a92304bd7`) wires these into an interactive `@clack/prompts` session where the operator accepts, edits, or rejects each generated test before it lands in the store. `test generate` (`a067acc0d`) is the CLI entry point.

**Threshold calibration turns activation from a hardcoded number into a measured result.** Phase 18 built the calibration stack that tunes the activation threshold against ground-truth data. CalibrationStore (`459a7301c`) ingests observation events — prompt, activated skill, user confirmation or correction — as JSONL. ThresholdOptimizer (`beaff6b52`) runs F1-optimized grid search across candidate thresholds and returns the operating point that maximizes F1 for the observed distribution. ThresholdHistory (`0f9316067`) persists versioned snapshots to `~/.gsd-skill/calibration/thresholds.json` with rollback support — every calibration is a committed snapshot, not a mutation, so reverting is `history.rollback()` rather than a file edit. MccCalculator (`249a22246`) computes Matthews Correlation Coefficient for simulator-versus-reality correlation; the CLI exits with code 1 if MCC falls below the 85% target, making benchmark regression visible to CI. BenchmarkReporter (`80048a2bf`) renders the full metric bundle with actionable recommendations based on threshold crossings and supports both terminal and JSON output modes.

**Calibration is gated by a minimum-sample guard, not trust.** Phase 18's `calibrate` CLI command (`52f9c06cb`) enforces a minimum of 75 events before it will run optimization. Below 75 events the tool refuses with a clear message rather than producing a noisy threshold based on insufficient data. The `--preview` flag dry-runs the optimization without writing, `--force` skips the interactive confirmation prompt for CI, `calibrate rollback` reverts to the previous snapshot, and `calibrate history` shows every version with timestamps and F1 at the time of commit. Per-skill threshold overrides coexist alongside the global threshold (default 0.75), with `getThresholdForSkill` falling back to the global when no override is present. Setting calibration up as a preview-then-commit workflow mirrors the v1.0 philosophy of bounded, auditable learning — no threshold changes silently.

**53 commits across five phases is the load-bearing evidence.** The tag message cites "5 phases, 19 plans, 42 commits, 12,025 lines added." The commit range `700ce9d8a..82fc12f11` contains 53 commits and `git diff --shortstat v1.1..v1.2` shows 53 files changed, 12,185 insertions, 2 deletions; the small delta between tag counts and range counts reflects a handful of hook and chore commits the tag did not headline but which ship alongside (including the initial Claude Code SessionEnd hooks at `700ce9d8a` and a snake_case field fix at `c3c386171`). Every numeric claim in this README can be checked against the commit log in the `v1.1..v1.2` range. Every file path named here exists on disk under `src/testing/`, `src/simulation/`, `src/calibration/`, `src/testing/generators/`, `src/cli/commands/`, or was imported at the CLI router level in `src/cli.ts`. v1.2 is the release that turns skill quality from a claim into a measurement — and the measurement is auditable from the same directory tree the runtime reads.

## Key Features

| Component | What Shipped |
|-----------|--------------|
| Test types | `src/testing/` shared types, Zod schemas, and atomic persistence primitives (Phase 14.1) |
| TestStore | JSONL-backed CRUD with per-skill indexing and atomic writes handling cross-device rename (Phase 14.2, fix at `5154ad9ff`) |
| `test` CLI (CRUD) | `test add`, `test list`, `test show`, `test remove` with Zod-validated input (Phase 14.3) |
| ActivationSimulator | Embedding-driven activation prediction on top of v1.1's EmbeddingService with confidence categorization (Phase 15.1) |
| ChallengerDetector | Flags test cases where the top skill barely edges out a runner-up — surfaces differentiation weakness (Phase 15.2) |
| BatchSimulator | Parallel suite execution with `@clack/prompts` progress bar and configurable concurrency (Phase 15.3) |
| `simulate` CLI | Single-prompt activation simulation with explanation and hint output (Phase 15.4) |
| TestRunner | Orchestrates suite execution, computes accuracy / FPR / precision / recall / F1, emits JSONL run results (Phase 16.1-16.2) |
| ResultFormatter | Terminal and JSON renderers with CI-friendly exit codes (Phase 16.3) |
| `test run` CLI | Suite execution with `--json <path>` CI integration and filter support (Phase 16.4) |
| HeuristicTestGenerator | Extracts positive test cases from observation patterns using regex + NLP rules (Phase 17.1) |
| CrossSkillGenerator | Generates negative test cases asserting non-activation across skill boundaries (Phase 17.2) |
| LLMTestGenerator | Optional Claude Haiku adversarial variant generator using the v1.1 dynamic-import pattern (Phase 17.3) |
| TestGenerator orchestrator | Single entry point composing heuristic + cross-skill + optional LLM generators (Phase 17.3) |
| ReviewWorkflow + `test generate` | Interactive `@clack/prompts` accept/edit/reject flow wired into CLI (Phase 17.4) |
| CalibrationStore | Observation-event JSONL ingestion with Zod schemas (Phase 18.1) |
| ThresholdOptimizer | F1-optimized grid search across candidate thresholds (Phase 18.2) |
| ThresholdHistory | Versioned snapshots at `~/.gsd-skill/calibration/thresholds.json` with `rollback` support and per-skill overrides (Phase 18.2) |
| MccCalculator | Matthews Correlation Coefficient for simulator-vs-reality fidelity, CI exit-1 below 85% (Phase 18.3) |
| BenchmarkReporter | Metric bundle (MCC, accuracy, precision, recall, F1, FPR) with actionable recommendations, terminal + JSON (Phase 18.3) |
| `calibrate` / `benchmark` CLI | Preview/confirm workflow, 75-event minimum, `rollback`, `history`, `--json`, `--verbose` (Phase 18.4) |

## Retrospective

### What Worked

- **Activation simulation with synthetic sessions closes the testing gap.** You cannot wait for real sessions to validate skill triggers — synthetic sessions let you test the observe-detect loop without human interaction. Phase 15's ActivationSimulator reuses the v1.1 EmbeddingService so simulation fidelity tracks runtime behavior instead of diverging.
- **F1/MCC optimization for threshold calibration is statistically rigorous.** Matthews Correlation Coefficient in particular handles class imbalance well, which matters when most sessions should _not_ activate most skills. F1 chooses the operating point; MCC verifies the simulator against reality; the CI exit-code guard at MCC < 85% makes fidelity regression visible.
- **Per-component `.test.ts` discipline carried over from v1.1 and compounded.** TestStore, ActivationSimulator, BatchSimulator, TestRunner, ResultFormatter, ChallengerDetector, HeuristicTestGenerator, ThresholdHistory, and BenchmarkReporter each ship with comprehensive unit tests. v1.2 is the release where this practice stopped being discipline and started being the reason the release could ship confidently.
- **Phase 14 → 15 → 16 → 17 → 18 layered cleanly.** Types (14.1) fed the store (14.2), the store fed the CLI (14.3); embeddings (v1.1) fed the simulator (15.1-15.2), which fed batch execution (15.3) and the `simulate` command (15.4); the simulator fed the runner (16), the runner fed the generators (17), and observations + ground truth fed calibration (18). No back-edits to earlier phases were required.
- **Calibration as preview-then-commit mirrors v1.0's bounded-learning philosophy.** Thresholds never mutate silently; every change is a snapshot, rollback is first-class, and the minimum-75-events guard refuses to calibrate from insufficient data. This is the v1.0 philosophy (3 corrections, 7-day cooldown, 20% max change) applied to the activation operating point.
- **Cross-device-link fix surfaced an honest portability bug.** The `EXDEV` error from `os.tmpdir()`-to-target `rename()` on split mount points is exactly the kind of bug that only shows up on real developer machines with separate `/tmp` volumes. Shipping the fallback (`5154ad9ff`) at v1.2 rather than v1.2.1 meant the test store was robust by the time generators started writing to it in Phase 17.

### What Could Be Better

- **18 requirements across 19 plans for a test infrastructure release is heavy.** Test infrastructure should be lean enough to not need its own extensive test suite. The complexity here reflects the non-trivial activation logic being tested, but the ratio of infrastructure code (12,185 insertions) to headline features (5 phases) is a lot for what is, in the v1.x line, still a plumbing release.
- **Simulator fidelity depends on the same embedding model as the runtime.** This is a feature until the embedding model changes — then simulator and runtime drift together and the fidelity metric cannot detect the drift. A later release should add a second-source check (different embedding model, held-out observations) that catches embedding-model regressions.
- **The 75-event minimum for calibration is a hardcoded floor.** The number was chosen by reasoning about the grid-search resolution rather than by simulation over real catalogs. Some skills with very rare activation may never hit 75 events, and the tool does not yet degrade gracefully to per-cluster calibration.
- **LLM-generated adversarial tests cost money and have no cost cap.** The `test generate --llm` path calls Claude Haiku per variant; there is no batch estimator and no `--max-calls` guard. A future release should warn on estimated cost before running — v1.1 took the same shortcut for activation scoring and v1.2 inherited it.
- **No integration test covering the full generate → run → calibrate loop yet.** Each phase has unit tests, but no end-to-end test asserts that a generated test suite, executed by the runner, produces calibration events that ThresholdOptimizer consumes correctly. This gluing becomes an explicit deliverable in v1.3's Documentation Overhaul when the examples are written.
- **Tag message under-counts commits (42 vs 53).** The tag message headlines 42 commits, but `git log v1.1..v1.2` returns 53. The delta is hook and chore commits (the SessionEnd hook at `700ce9d8a`, the snake_case fix at `c3c386171`, and a few chore/export commits) that ship inside the range but were not counted in the headlined total. The numeric discrepancy is small but the release-history scoring catches it, so later releases tightened the tag-message arithmetic.

## Lessons Learned

1. **Automated test case generation from observation patterns creates a flywheel.** Real usage produces observations, observations become test cases, test cases validate the system that produces observations. Phase 17's HeuristicTestGenerator is the component that closes the loop; without it, every test case is a manual artifact and the suite rots the moment a new skill ships.
2. **Benchmarking infrastructure at v1.2 sets a performance baseline early.** Without it, performance regressions from v1.3 onward would be invisible until they became painful. MccCalculator and BenchmarkReporter give every subsequent release a trustable "is the simulator still faithful?" reading, and the CI exit-1 guard at MCC < 85% means fidelity can never silently decay.
3. **Test infrastructure complexity is load-bearing when the thing being tested is non-deterministic activation.** 18 requirements across 19 plans feels heavy for "test infrastructure," but the thing being tested is a learned activation score with semantic embeddings and a configurable threshold. You cannot test that with a two-function assert library — you need generators, a simulator, a runner, a calibrator, and a fidelity metric.
4. **Atomic writes with a cross-device rename fallback is the real disk-persistence primitive.** `fs.rename()` through `os.tmpdir()` fails with EXDEV whenever the temp directory sits on a different mount than the target. The fix is to write the temp file inside the target directory, then rename. This is the kind of bug that only shows up in the wild and whose fix belongs in v1.2, not a later patch.
5. **F1 chooses the operating point; MCC verifies the model against reality.** Using only F1 optimizes the threshold but cannot tell you whether the simulator still reflects the runtime. Using only MCC tells you fidelity but not where to set the dial. Shipping both — F1 in the optimizer, MCC in the benchmark — means v1.2 has two independent measurements that together pin down both "where" and "how trustworthy."
6. **Simulator and runtime must share the embedding pipeline or simulation becomes a second system.** Phase 15's ActivationSimulator calls the exact EmbeddingService v1.1 shipped. Any simulator that embedded with its own pipeline would diverge from the runtime silently; shipping one embedding path and two consumers (runtime + simulator) keeps fidelity honest at the cost of coupling the two.
7. **Preview-then-commit calibration mirrors v1.0's bounded learning.** The `--preview` flag, the 75-event minimum, versioned snapshots, and `rollback` support turn threshold tuning into an auditable workflow. A threshold that can change silently is a threshold that can drift; a threshold that only changes through a preview-confirm-snapshot workflow is one you can trust in production.
8. **Negative tests matter as much as positive tests.** CrossSkillGenerator exists because activating the right skill is not enough — you also have to _not_ activate the wrong skill. A positive-only suite will ship with two skills that both think the same prompt belongs to them, and the conflict will only surface under real traffic. Shipping negative generation at v1.2 closed the gap before it opened.
9. **Opt-in LLM test generation must degrade gracefully, not fail.** The LLMTestGenerator reuses v1.1's dynamic-import pattern for `@anthropic-ai/sdk`: no key, no module load, no dependency-closure cost. A CLI surface that works without Anthropic credentials is a CLI surface that works in CI, in offline environments, and in other people's projects that depend on skill-creator.
10. **Interactive review workflows belong in the generator, not the runner.** ReviewWorkflow lives in Phase 17, alongside the generators — not in the runner. Generated tests are proposals that need human approval; executed tests are facts that do not. Keeping the accept/edit/reject surface close to generation (and out of the batch runner) means CI can run the suite non-interactively while local authoring stays conversational.
11. **Versioned snapshots beat mutations, everywhere.** `~/.gsd-skill/calibration/thresholds.json` stores every calibration as an indexed snapshot with `currentIndex` pointing at the active one. Rollback moves the index; it does not delete history. This is the same pattern v1.0 chose for pattern storage (append-only JSONL) and it is the correct pattern for any audited state the system mutates over time.
12. **Tag-message arithmetic is a release-history discipline.** v1.2's tag message says 42 commits; `git log` shows 53. The mismatch is small and explainable but still a data-quality incident in the release-history corpus. Later releases started computing commit / file / insertion / deletion counts from the range itself rather than from an author-written summary, and the discipline traces back to noticing this discrepancy at v1.2.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Foundation — the 6-step Observe → Detect → Suggest → Apply → Learn → Compose loop v1.2 adds testing over |
| [v1.1](../v1.1/) | Predecessor — Semantic Conflict Detection; v1.2's ActivationSimulator reuses v1.1's EmbeddingService |
| [v1.3](../v1.3/) | Successor — Documentation Overhaul; the end-to-end examples gap v1.2 retrospective flagged is where v1.3 lands |
| [v1.4](../v1.4/) | Agent Teams — test generators feed the cross-agent validation surface |
| [v1.5](../v1.5/) | Pattern Discovery — deepens the Observe → Detect pipeline that HeuristicTestGenerator consumes |
| [v1.8](../v1.8/) | Capability-Aware Planning — activation scoring gets surfaced into planning, so v1.2's calibration matters more |
| [v1.8.1](../v1.8.1/) | Audit Remediation — flags the embedding cold-start cost v1.1 and v1.2 share |
| [v1.10](../v1.10/) | Security Hardening — pays down dependency-closure and atomic-write debt v1.2 started handling |
| [v1.25](../v1.25/) | Ecosystem Integration — test infrastructure becomes part of the 20-node dependency DAG |
| [v1.49](../v1.49/) | Mega-release — v1.2's TestRunner and calibration remain load-bearing at v1.49 |
| `src/testing/` | TestStore, TestRunner, ResultFormatter, ResultStore, ReviewWorkflow and their tests |
| `src/testing/generators/` | HeuristicTestGenerator, CrossSkillGenerator, LLMTestGenerator, TestGenerator orchestrator |
| `src/simulation/` | ActivationSimulator, BatchSimulator, ChallengerDetector, ConfidenceCategorizer, ExplanationGenerator, HintGenerator |
| `src/calibration/` | CalibrationStore, ThresholdOptimizer, ThresholdHistory, MccCalculator, BenchmarkReporter and their tests |
| `src/cli/commands/calibrate.ts` | CLI handler for `calibrate`, `benchmark`, `calibrate rollback`, `calibrate history` |
| `src/cli.ts` | Command router for `test`, `simulate`, `calibrate`, `benchmark` aliases |
| `~/.gsd-skill/calibration/thresholds.json` | Versioned threshold history (per-user persistent state) |
| `.planning/MILESTONES.md` | Canonical v1.2 milestone detail referenced by the tag message |
| `docs/release-notes/v1.2/chapter/03-retrospective.md` | Chapter-file retrospective (preserved) |
| `docs/release-notes/v1.2/chapter/04-lessons.md` | Chapter-file lessons (3 extracted lessons retained) |

## Engine Position

v1.2 sits two steps past the zero-point in the v1.x line. v1.0 defined the 6-step adaptive loop; v1.1 put a validation layer (ConflictDetector + ActivationScorer) around the Apply step; v1.2 put a _measurement_ layer around the same Apply step. Where v1.1 gave the operator two numbers (conflict risk, activation likelihood), v1.2 gives the operator five (accuracy, FPR, precision, recall, F1) plus a fidelity metric (MCC) that verifies simulator-versus-reality correlation. Every release from v1.3 onward that touches activation ends up sitting on top of v1.2's TestRunner and calibration stack — the `test run` CLI becomes the standard gate for skill changes, and `calibrate` becomes the standard response to observed activation drift. The per-component `.test.ts` discipline v1.1 established becomes a scorable quality property at v1.2; by the time v1.25 Ecosystem Integration ships its 20-node dependency DAG, the testing and calibration modules are load-bearing nodes in that graph. In the v1.x line, v1.2 is the release that turned skill quality from a claim into a measurement — and every subsequent release inherits the measurement.

## Files

- `src/testing/test-store.ts` + `.test.ts` — JSONL-backed CRUD with atomic writes and EXDEV fallback (Phase 14.2)
- `src/testing/test-runner.ts` + `.test.ts` — suite orchestrator producing accuracy / FPR / precision / recall / F1 (Phase 16.1-16.2)
- `src/testing/result-formatter.ts` + `.test.ts` — terminal + JSON renderers for CI integration (Phase 16.3)
- `src/testing/result-store.ts` — JSONL persistence for run results (Phase 16.1)
- `src/testing/review-workflow.ts` — interactive `@clack/prompts` accept/edit/reject flow (Phase 17.4)
- `src/testing/generators/heuristic-test-generator.ts` — regex + NLP positive-case extraction from observations (Phase 17.1)
- `src/testing/generators/cross-skill-generator.ts` — negative-case generation across skill boundaries (Phase 17.2)
- `src/testing/generators/llm-test-generator.ts` — optional Claude Haiku adversarial variants via dynamic import (Phase 17.3)
- `src/testing/generators/test-generator.ts` — orchestrator composing all three generator paths (Phase 17.3)
- `src/simulation/activation-simulator.ts` + `.test.ts` — embedding-driven activation prediction (Phase 15.1)
- `src/simulation/batch-simulator.ts` + `.test.ts` — parallel suite simulation with progress bar (Phase 15.3)
- `src/simulation/challenger-detector.ts` + `.test.ts` — runner-up-proximity flagging for differentiation weakness (Phase 15.2)
- `src/simulation/confidence-categorizer.ts` — strong / marginal / skip bucketing of simulator output (Phase 15.1)
- `src/simulation/explanation-generator.ts` and `hint-generator.ts` — human-readable rationale for simulator decisions (Phase 15.2)
- `src/calibration/calibration-store.ts` + `.test.ts` — observation-event ingestion (Phase 18.1)
- `src/calibration/threshold-optimizer.ts` + `.test.ts` — F1 grid-search operating-point selection (Phase 18.2)
- `src/calibration/threshold-history.ts` + `.test.ts` — versioned snapshots + rollback at `~/.gsd-skill/calibration/thresholds.json` (Phase 18.2)
- `src/calibration/mcc-calculator.ts` + `.test.ts` — Matthews Correlation Coefficient for simulator fidelity (Phase 18.3)
- `src/calibration/benchmark-reporter.ts` + `.test.ts` — metric bundle with recommendations, terminal + JSON (Phase 18.3)
- `src/cli/commands/calibrate.ts` — `calibrate` / `benchmark` / `calibrate rollback` / `calibrate history` handler (Phase 18.4)
- `src/cli.ts` — command router wiring `test`, `simulate`, `calibrate`, `benchmark` with aliases and help text
- `src/index.ts` — library barrel export for the calibration module (Phase 18.4)
- `docs/release-notes/v1.2/chapter/00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` — chapter files (preserved)
- `.planning/MILESTONES.md` — canonical v1.2 milestone detail referenced by the tag

---

_v1.2 shipped 2026-02-05 on commits `700ce9d8a..82fc12f11` — 53 commits, 53 files, 12,185 insertions, 2 deletions across phases 14-18. Tag message: "v1.2 Skill Quality Assurance." Full test-CRUD, activation simulator, batch runner, automated generators, and F1/MCC calibration installed as the skill-quality-assurance layer on top of the v1.0 loop and v1.1 validation layer._
