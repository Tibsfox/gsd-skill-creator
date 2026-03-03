---
phase: "51"
plan: "02"
subsystem: eval
tags: [multi-model, evaluation, benchmark, grader, capability-profile, tdd, thresholds]
dependency_graph:
  requires:
    - "src/eval/types.ts (ModelBenchmarkRun, ModelSummary, MultiModelBenchmark, ThresholdsConfigSchema -- from Plan 51-01)"
    - "src/eval/thresholds-config.ts (ThresholdsConfigLoader -- from Plan 51-01)"
    - "src/chips/chip-test-runner.ts (ChipTestRunner, ChipTestRunResult, ChipRunOptions -- from Phase 50)"
    - "src/chips/chip-registry.ts (ChipRegistry -- from Phase 50)"
    - "src/chips/types.ts (ChipCapabilities, ModelChip -- from Phase 50)"
  provides:
    - "src/eval/multi-model-benchmark.ts (MultiModelBenchmarkRunner, BENCHMARK_PASS_ACCURACY_THRESHOLD)"
    - "src/eval/model-aware-grader.ts (ModelAwareGrader, ModelCapabilityProfile, LOCAL_SMALL_CONTEXT_THRESHOLD, CLOUD_CONTEXT_THRESHOLD)"
    - "src/eval/index.ts (barrel updated with all Plan 51-02 exports)"
  affects:
    - "Phase 51 plans 03-04 (CLI eval command, eval viewer -- depend on MultiModelBenchmarkRunner)"
    - "Phase 53 (Mesh Orchestration -- multi-model comparison data feeds cost routing)"
tech-stack:
  added: []
  patterns:
    - "TDD: RED (failing test commit) -> GREEN (implementation commit)"
    - "CHIP-06 error boundary: null return for missing chip/capabilities error, never throws"
    - "Tier derivation: pure function from maxContextLength -> 'local-small' | 'local-large' | 'cloud'"
    - "Try/catch per chip: failed chip produces error ModelBenchmarkRun without blocking other chips"
    - "EVAL-06 backward compat: chipName undefined -> model='unknown', counted in legacyRunCount"
key-files:
  created:
    - src/eval/multi-model-benchmark.ts
    - src/eval/multi-model-benchmark.test.ts
    - src/eval/model-aware-grader.ts
    - src/eval/model-aware-grader.test.ts
  modified:
    - src/eval/index.ts
key-decisions:
  - "BENCHMARK_PASS_ACCURACY_THRESHOLD=50: separate from skill activation threshold (similarity scores). 50% minimum accuracy bar -- below this, model fails more tests than it passes. Defined as named constant per IMP-03."
  - "Failed chip produces ModelBenchmarkRun with passed=false and hints=['Chip unavailable: <message>'] -- allows partial results without masking that the chip failed. Never throws."
  - "buildCapabilityProfile returns null (not throws) for missing chip or capabilities() error -- follows CHIP-06 null-return pattern; callers can always safely use the null-profile fallback path."
  - "Tier derivation is a pure function: LOCAL_SMALL_CONTEXT_THRESHOLD=8192, CLOUD_CONTEXT_THRESHOLD=100000. Gap (8192-99999) is local-large."
  - "enrichGradingPrompt appends model context as new paragraph after basePrompt -- non-destructive, original prompt preserved in output."
  - "generateModelHints deduplicates generic hints from failedTests.explanation using Set -- prevents duplicate hint entries when multiple tests fail for the same reason."
patterns-established:
  - "Error-as-run pattern: chip failures become ModelBenchmarkRun entries (passed=false), not exceptions"
  - "Null-profile fallback: all ModelAwareGrader methods accept null profile and degrade gracefully"
requirements-completed: [EVAL-02, EVAL-03]
duration: 5m 28s
completed: "2026-03-03"
---

# Phase 51 Plan 02: Multi-Model Benchmark Runner and Model-Aware Grader Summary

**MultiModelBenchmarkRunner producing config x model matrix with per-chip pass rates, and ModelAwareGrader generating tier-specific improvement hints (local-small, local-large, cloud) from ChipCapabilities.**

## Performance

- **Duration:** 5m 28s
- **Started:** 2026-03-03T17:23:23Z
- **Completed:** 2026-03-03T17:28:51Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 5 (3 created, 1 created+modified, 1 modified)

## Accomplishments

- MultiModelBenchmarkRunner: runs ChipTestRunner across multiple chip backends, collects results into configuration x model matrix with per-model passRate/avgAccuracy/avgF1/thresholdStatus
- Failed chips produce ModelBenchmarkRun error entries (never throw), preserving results for all other chips -- resilient multi-model orchestration
- ModelAwareGrader: builds capability profiles from ChipRegistry, enriches grading prompts with model context, generates tier-specific hints (local-small: context-length and tool-calling guidance; local-large: moderate-context guidance; cloud: prompt-specificity guidance)
- 45 new tests (20 multi-model-benchmark + 25 model-aware-grader), all passing alongside 86 pre-existing eval tests (131 total)

## Task Commits

Each task was committed atomically with TDD commits:

1. **Task 1: MultiModelBenchmarkRunner (RED)** - `07b87556` (test)
2. **Task 1: MultiModelBenchmarkRunner (GREEN)** - `6b1dcc7f` (feat)
3. **Task 2: ModelAwareGrader (RED)** - `b0a56805` (test)
4. **Task 2: ModelAwareGrader + barrel (GREEN)** - `99f41cc0` (feat)

_Note: TDD tasks have two commits each (test -> feat)_

## Files Created/Modified

- `src/eval/multi-model-benchmark.ts` - MultiModelBenchmarkRunner: orchestrates ChipTestRunner across chips, converts ChipTestRunResult to ModelBenchmarkRun, computes per-model ModelSummary, handles chip failures
- `src/eval/multi-model-benchmark.test.ts` - 20 tests: empty chips, single chip, two chips, legacy runs, failed chips, mutation isolation
- `src/eval/model-aware-grader.ts` - ModelAwareGrader: buildCapabilityProfile (null-safe), enrichGradingPrompt (non-destructive), generateModelHints (tier-specific + deduped generic)
- `src/eval/model-aware-grader.test.ts` - 25 tests: all three tiers, boundary values (8191/8192, 99999/100000), null profile fallbacks, enrichment format, hint deduplication
- `src/eval/index.ts` - Barrel updated: exports MultiModelBenchmarkRunner, ModelAwareGrader, ModelCapabilityProfile, and all new constants

## Decisions Made

1. **BENCHMARK_PASS_ACCURACY_THRESHOLD=50** is distinct from the skill activation threshold (0-1 similarity score). It represents "does this model pass more tests than it fails?" -- a minimum quality bar. Named constant per IMP-03 pattern.

2. **Failed chips produce error runs, never throw**: `benchmarkSkill(['ollama', 'anthropic'])` where ollama is unavailable returns a 2-run result with ollama.passed=false and a "Chip unavailable: ..." hint. Anthropic's run is unaffected. This matches the evaluation use case: partial results are more useful than an exception.

3. **buildCapabilityProfile returns null for missing/broken chips**: follows CHIP-06 null-return pattern established in Phase 50. Callers use null-profile fallback path. Never throws -- broken capabilities query doesn't interrupt grading.

4. **Tier boundaries at 8192 and 100000**: LOCAL_SMALL_CONTEXT_THRESHOLD=8192 (common small model limit: 4k-8k), CLOUD_CONTEXT_THRESHOLD=100000 (cloud models: Claude 200k, GPT-4 Turbo 128k, Gemini 1.5 1M). The 8192-99999 gap covers local-large (Llama 32k, etc.).

5. **enrichGradingPrompt appends, does not replace**: basePrompt is always included in the output, model context is appended as a new sentence. This preserves the original grading instructions while adding capability awareness.

6. **Hint deduplication via Set**: multiple failed tests with the same explanation produce only one generic hint. Prevents noise when a systematic issue causes many tests to fail with the same message.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `src/cli/commands/eval.ts` (Expected 5 arguments, got 1) and `src/retrieval/corrective-rag.test.ts` (sessionId type mismatch) were noted but are out-of-scope -- they predate Phase 51 and are unrelated to the eval type system. No new TypeScript errors were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MultiModelBenchmarkRunner and ModelAwareGrader complete -- Phase 51 Plan 03 (CLI eval command) can integrate MultiModelBenchmarkRunner for `--chips` flag support
- ModelAwareGrader.enrichGradingPrompt is ready for ChipTestRunner grading flow integration
- All 131 eval tests passing, no regressions

---
*Phase: 51-multi-model-evaluation*
*Completed: 2026-03-03*

## Self-Check: PASSED

Files verified on disk:
- FOUND: src/eval/multi-model-benchmark.ts
- FOUND: src/eval/multi-model-benchmark.test.ts
- FOUND: src/eval/model-aware-grader.ts
- FOUND: src/eval/model-aware-grader.test.ts
- FOUND: src/eval/index.ts (modified)

Commits verified:
- FOUND: 07b87556 (test RED - multi-model-benchmark)
- FOUND: 6b1dcc7f (feat GREEN - multi-model-benchmark)
- FOUND: b0a56805 (test RED - model-aware-grader)
- FOUND: 99f41cc0 (feat GREEN - model-aware-grader + barrel)
