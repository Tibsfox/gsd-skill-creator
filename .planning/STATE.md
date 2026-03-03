---
gsd_state_version: 1.0
milestone: v1.49
milestone_name: milestone
status: Plan 51-03 executed — EvalViewer and CLI eval command (Phase 51 complete)
stopped_at: Completed 51-03-PLAN.md
last_updated: "2026-03-03T17:34:32.000Z"
last_activity: 2026-03-03 — Plan 51-03 (eval viewer CLI command with multi-model support) executed
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Skills are discovered from real patterns and proved against mathematical foundations — the unit circle isn't metaphor, it's architecture.

## Current Position

Phase: 51 (Multi-Model Evaluation) — COMPLETE (3 of 3 plans done)
Plan: 51-03 complete
Status: Plan 51-03 executed — EvalViewer and CLI eval command (Phase 51 complete)
Last activity: 2026-03-03 — Plan 51-03 (eval viewer CLI command with multi-model support) executed

```
Progress: [██████████] 100% (6 of 6 plans across active phases done)
```

## Performance Metrics

- Phases defined: 5 (Phases 50-54)
- Requirements mapped: 37/37
- Plans complete: 6 (Phase 50: 50-01, 50-02, 50-03; Phase 51: 51-01, 51-02, 51-03)
- Tests added this milestone: 283 (137 from Phase 50 + 54 from Plan 51-01 + 45 from Plan 51-02 + 47 from Plan 51-03)
- Duration 50-01: 7 min
- Duration 50-02: 4 min
- Duration 50-03: 12 min
- Duration 51-01: 4 min (258s)
- Duration 51-02: 5 min (328s)
- Duration 51-03: 9 min (549s)

## Accumulated Context

### Milestone Overview

v1.49.15 Self-Improving Mesh Architecture — "The Space Between"

5 phases mapping to 5 waves (strictly sequential at wave level):
- Phase 50 = Wave 1: Model Abstraction Layer (`chips/`, ChipRegistry, CLI integration)
- Phase 51 = Wave 2: Multi-Model Evaluation (benchmark schema, grader calibration, thresholds, eval viewer)
- Phase 52 = Wave 3: MCP Infrastructure (LLM Wrapper, Mesh Discovery, DACP transport, fidelity adaptation)
- Phase 53 = Wave 4: Mesh Orchestration (Coordinator agent, VTM planning, cross-model optimization, cost routing)
- Phase 54 = Wave 5: Context & Integration (context preservation, git worktrees, Skill Creator MCP Server)

### Key Decisions from Plan 51-03

- padRight() strips ANSI codes for column alignment -- escape sequences inflate str.length; stripping before padding ensures columns align correctly with colorized cells
- vi.fn().mockImplementation(function() {...}) required for class constructor mocks in Vitest v4 -- arrow functions fail "is not a constructor" check
- formatLegacyFallback() returns empty string (not null) -- allows unconditional concatenation without null checks in callers
- IMP-04 ratio 1.675:1 (1821 test lines / 1087 source lines) -- below 3:1 target; documented transparently with per-file breakdown

### Key Decisions from Plan 51-02

- BENCHMARK_PASS_ACCURACY_THRESHOLD=50 separates benchmark pass/fail from skill activation threshold -- accuracy below 50% means model fails more tests than it passes
- Failed chips produce ModelBenchmarkRun error entries (never throw) -- partial multi-model results more useful than an exception when one chip is unavailable
- ModelAwareGrader.buildCapabilityProfile returns null (not throws) for missing/broken chips -- CHIP-06 null-return pattern; enrichGradingPrompt and generateModelHints accept null safely
- Tier derivation: LOCAL_SMALL_CONTEXT_THRESHOLD=8192, CLOUD_CONTEXT_THRESHOLD=100000, gap 8192-99999 is local-large -- matches common local model context windows
- enrichGradingPrompt appends (not replaces): basePrompt always preserved in output, model context appended as new sentence

### Key Decisions from Plan 51-01

- model field uses z.string().default('unknown') not optional -- parsed objects always have model string set, eliminating undefined checks in all downstream consumers
- THRESHOLD_EQUALITY_TOLERANCE = 0.001 absorbs IEEE 754 rounding in pass rate ratios (7/10 = 0.6999...) without masking meaningful differences at 100-test scale
- DEFAULT_PASS_RATE_THRESHOLD canonical in types.ts, re-exported from thresholds-config.ts per plan spec
- ThresholdsConfigLoader requires explicit loadFromFile() before getThresholdForChip() -- matches ChipRegistry two-step pattern; callers control IO timing
- CHIP-06 pattern applied to ThresholdsConfigLoader: only ENOENT silently returns default; EACCES/malformed JSON/Zod failures all propagate

### Key Decisions from Plan 50-03

- ChipTestRunner delegates to standard TestRunner for backward compat path -- no logic duplication
- Grader prompt includes test.prompt + test.expected + chip response -- grader has full context for activation judgment
- GRADER_MAX_TOKENS=512 -- grader always returns compact JSON; keeps grading latency low
- Malformed grader JSON falls back to keyword matching, never throws -- asymmetric eval always completes
- --chip/--grader-chip wired in handleRun (test.ts), not cli.ts -- minimal change, no refactoring of test command architecture
- thresholds.md at project root (not .planning/) -- user-facing transparency document per IMP-03

### Key Decisions from Plan 50-02

- ChipsetFileSchema roles uses z.object partial() -- Zod v4 z.record(z.enum()) enforces all keys present; partial object schema gives correct subset-of-roles semantics
- ChipRegistry state committed atomically in loadFromFile() -- new Maps built fully before assignment to prevent partial state on validation failure
- createChipRegistry() factory separate from file loading -- callers control when loadFromFile() is called (critical for CLI flag path and test mock timing)
- CHIP-06: only ENOENT is silently swallowed; other fs errors propagate as-is

### Key Decisions from Plan 50-01

- Zod discriminated union on 'type' for ChipConfig -- openai-compatible requires baseUrl, anthropic does not
- Native fetch with AbortController (no axios) -- zero new dependencies added
- Anthropic capabilities() hardcoded (no model listing endpoint) -- no HTTP call in capabilities()
- Anthropic health() 401=unavailable, any other status=available (distinguishes auth vs payload errors)
- IMP-05 mapped: ADVN-03 -> MESH-05 (Phase 53), ADVN-04 -> CTXT-03/04 (Phase 54), EREG-01 -> MCP-02 (Phase 52)
- Test mock pattern: mockFetch.mockReset() in beforeEach + vi.stubGlobal + vi.unstubAllGlobals() in afterEach

### Key Decisions from Prior Milestones

- v1.49.14 shipped: 6 phases, 30 requirements, 353 tests, full supply chain immune system
- Maple-Foxy-Bells mission pack staged and ready (13 docs + retrospective improvement track)
- v1.49.14 retrospective lessons carried forward as IMP requirements:
  - IMP-01: Integration tests for every lifecycle auto-invocation (Phase 52)
  - IMP-02: Inter-wave integration review gates (Phase 53)
  - IMP-03: Threshold registry (thresholds.md) from Wave 1 onward (Phase 50)
  - IMP-04: Test-to-source ratio tracking per wave (Phase 51)
  - IMP-05: Cross-reference v1.49.14 v2 deferred items at planning time (Phase 50)
  - IMP-06: Pure-function enforcement for scoring and routing logic (Phase 53)
  - IMP-07: Append-only pattern for mesh event logs (Phase 52)
- 3 deferred v1.49.14 items relevant to mesh: ADVN-03 (cost analysis -> cost routing), ADVN-04 (auto PR -> mesh artifacts), EREG-01 (private registries -> mesh nodes)

### Architecture Constraints

- Backward compatibility: absence of chipset.json preserves existing behavior (CHIP-06)
- No executable code in DACP bundles — instructions and data only
- Mesh nodes are user-owned local hardware — no public network exposure
- Grader/analyzer always run on Claude (capable model judges)
- Context loss at mesh boundaries is a hard failure — task doesn't distribute if context can't be preserved

### IMP Requirement Distribution

| Requirement | Assigned Phase | When Applied |
|-------------|---------------|--------------|
| IMP-03 | Phase 50 | Start of Wave 1, grow per wave |
| IMP-05 | Phase 50 | Planning cross-reference, one-time |
| IMP-04 | Phase 51 | Wave 2 verification report |
| IMP-01 | Phase 52 | Wave 3 (lifecycle methods: heartbeat expiry, node eviction) |
| IMP-07 | Phase 52 | Wave 3 transport layer |
| IMP-02 | Phase 53 | Wave 3→4 boundary review gate |
| IMP-06 | Phase 53 | Scoring and routing pure functions |

## Session Continuity

Last session: 2026-03-03T17:34:32.000Z
Stopped at: Completed 51-03-PLAN.md

Phase 51 complete (all 3 plans done). Next milestone: Phase 52 (Wave 3: MCP Infrastructure).
To resume: read `.planning/ROADMAP.md` Phase 52 details, then execute `52-01-PLAN.md`.
