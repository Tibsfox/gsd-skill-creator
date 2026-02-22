---
phase: 306-rules-engine
plan: "02"
subsystem: brainstorm
tags: [osborn-rules, evaluative-detection, black-hat, violation-logging, tdd, false-positive-prevention]

# Dependency graph
requires:
  - phase: 306-rules-engine
    plan: "01"
    provides: "RulesEngine scaffold with canActivateAgent, getActiveRules, generateRuleReminder, stubs for checkMessage/getViolations"
provides:
  - "checkMessage() with two-stage evaluative content detection (hard-block + constructive-context)"
  - "Black Hat constraint blocking hat_color: 'black' during Diverge with violation_type: 'timing'"
  - "getViolations() returning accumulated RuleViolation[] per session_id"
  - "DEFAULT_RULES_ENGINE_CONFIG with 15 evaluative patterns and 10 encouragement patterns"
  - "50-sentence corpus verified: true positive rate >= 90%, false positive rate < 5%"
affects: [307-session-manager, 310-integration, 311-integration-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Two-stage filter: hard-block match THEN constructive-context allowlist", "Per-session violation accumulation via Map<string, RuleViolation[]>"]

key-files:
  created: []
  modified:
    - src/brainstorm/core/rules-engine.ts
    - src/brainstorm/core/rules-engine.test.ts

key-decisions:
  - "Two-stage evaluative detection: Stage 1 substring match against hard-block patterns, Stage 2 constructive-context allowlist prevents false positives"
  - "Black Hat constraint checked BEFORE evaluative content -- timing violation takes precedence over content violation"
  - "Per-session violation storage via Map<string, RuleViolation[]> -- accumulates, never resets"
  - "system sender resolved to facilitator AgentRole in violation records"

patterns-established:
  - "Two-stage content filter: match first, then check for redeeming context before blocking"
  - "Violation accumulation pattern: Map keyed by session_id, push to array, never clear"

requirements-completed: [RULES-03, RULES-04, RULES-05]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 306 Plan 02: RulesEngine -- Two-Stage Evaluative Detection, Black Hat Constraint, Violation Logging Summary

**Two-stage evaluative content detection (hard-block + constructive-context allowlist) with Black Hat timing constraint and per-session violation logging, verified by 50-sentence corpus at <5% false positive rate**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T18:40:13Z
- **Completed:** 2026-02-22T18:43:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- checkMessage() blocks evaluative content during Diverge via two-stage detection (15 hard-block patterns, 10 constructive-context allowlist patterns)
- Black Hat constraint blocks hat_color: 'black' during Diverge with violation_type: 'timing' (checked before content)
- Per-session violation logging with getViolations() returning accumulated RuleViolation[] records
- 50-sentence corpus verified: true positive rate >= 90%, false positive rate < 5%
- 53 rules-engine tests passing, 91 total brainstorm tests (zero regression)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Failing tests for evaluative detection, Black Hat, violations** - `d338433` (test)
2. **Task 2: GREEN -- Implement checkMessage + getViolations** - `d35a4db` (feat)

_TDD plan: RED commit (failing tests) followed by GREEN commit (passing implementation)_

## Files Created/Modified
- `src/brainstorm/core/rules-engine.ts` - Complete RulesEngine with checkMessage(), getViolations(), two-stage detection, Black Hat constraint (359 lines, min 200)
- `src/brainstorm/core/rules-engine.test.ts` - Full test suite: 53 tests covering RULES-01 through RULES-06, 50-sentence corpus (565 lines, min 200)

## Decisions Made
- Two-stage evaluative detection: Stage 1 uses simple toLowerCase().includes() substring matching against 15 hard-block patterns; Stage 2 checks for constructive-context patterns that redeem evaluative vocabulary -- per RESEARCH.md, no NLP library needed
- Black Hat constraint checked BEFORE evaluative content detection -- if a message has hat_color: 'black' during Diverge, it is blocked as a timing violation regardless of content
- Per-session violation storage uses Map<string, RuleViolation[]> with push-to-array semantics -- violations accumulate and are never cleared (queryable history)
- 'system' sender (not a valid AgentRole) resolved to 'facilitator' in violation records as fallback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RulesEngine is now feature-complete for v1.32: canActivateAgent (Critic gate), getActiveRules, generateRuleReminder, checkMessage (two-stage evaluative detection + Black Hat), getViolations (accumulated logging)
- Phase 307 (Session Manager) can import and use the complete IRulesEngine interface
- All 91 brainstorm tests pass, TypeScript compiles cleanly

## Self-Check: PASSED

- FOUND: src/brainstorm/core/rules-engine.ts (359 lines, min 200)
- FOUND: src/brainstorm/core/rules-engine.test.ts (565 lines, min 200)
- FOUND: commit d338433 (RED)
- FOUND: commit d35a4db (GREEN)

---
*Phase: 306-rules-engine*
*Completed: 2026-02-22*
