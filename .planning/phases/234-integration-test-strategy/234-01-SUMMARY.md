---
phase: 234-integration-test-strategy
plan: 01
subsystem: testing
tags: [zod, vitest, contract-testing, json-schema, integration-testing]

# Dependency graph
requires:
  - phase: 231-ecosystem-dependency-map
    provides: "48-edge DAG defining all cross-component boundaries"
  - phase: 232-shared-eventdispatcher-specification
    provides: "EventEnvelope canonical wire format, 6 subscriber profiles"
  - phase: 233-dependency-philosophy
    provides: "4-tier layer model for boundary classification"
provides:
  - "Contract testing approach (Zod .toJSONSchema() + Vitest)"
  - "Pact rejection rationale with 5 documented reasons"
  - "6 priority integration flows with specific I/O at every boundary"
  - "8 implemented boundary schemas with import paths"
  - ".contract.test.ts file convention"
affects: [234-02, 234-03, 235-known-issues-triage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Structural contracts via .toJSONSchema() snapshot comparison"
    - "Semantic contracts via .safeParse() with intentionally invalid input"
    - ".contract.test.ts suffix within existing __tests__/ directories"
    - "Two contract types (structural + semantic) required per boundary"

key-files:
  created:
    - ".planning/specs/integration-test-strategy/contract-testing-approach.md"
  modified: []

key-decisions:
  - "Zod + Vitest over Pact: 5 reasons (HTTP-focus, broker overhead, MQ mismatch, schema duplication, same-process)"
  - ".contract.test.ts in __tests__/ not separate __contracts__/ directory"
  - "expect.schemaMatching deferred: not in Vitest 4.0.18 stable, use .parse() directly"
  - "Console adapter uses 'broadcast' as interim source until AGENT_OR_SPECIAL_PATTERN regex extended"

patterns-established:
  - "Structural contract: schema.toJSONSchema() + toMatchSnapshot()"
  - "Semantic contract: .safeParse() expecting failure on intentionally invalid input"
  - "Boundary inventory table format: name, source/target schema, import path, .passthrough() status"

requirements-completed: [INTTEST-01, INTTEST-02, INTTEST-03]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 234 Plan 01: Contract Testing Approach Summary

**Zod .toJSONSchema() + Vitest contract testing strategy with Pact rejection, 6 priority flows with I/O, and 8 boundary schemas inventoried**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T18:34:33Z
- **Completed:** 2026-02-19T18:39:25Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments

- Defined contract testing approach using Zod .toJSONSchema() + Vitest with 5 reasons why it fits the ecosystem
- Documented 5 explicit reasons for rejecting Pact plus 2 other rejected alternatives (ajv + manual schemas, TypeScript types alone)
- Specified 6 priority integration flows (Console ingestion, Staging pipeline, AMIGA bus, Chipset Copper, Orchestrator state, Skill validation) with concrete JSON input/output at every boundary crossing
- Inventoried 8 implemented boundary schemas with Zod schema names, import paths, .passthrough() status, and edge inventory cross-references
- Documented 3 aspirational boundaries with reasons why they are not yet testable
- Established .contract.test.ts file convention within existing __tests__/ directories

## Task Commits

Each task was committed atomically:

1. **Task 1: Contract testing approach with Pact rejection rationale** - `5c2794c` (docs)

## Files Created/Modified

- `.planning/specs/integration-test-strategy/contract-testing-approach.md` - 779-line contract testing strategy document covering approach, priority flows, and boundary inventory

## Decisions Made

- **Zod + Vitest over Pact:** 5 documented reasons (HTTP-focused architecture, broker infrastructure overhead, Message Pact targets MQ not filesystem, Zod schemas already exist, single-repo same-process boundary)
- **File convention:** `.contract.test.ts` suffix within existing `__tests__/` directories (lower friction than a separate `__contracts__/` directory)
- **expect.schemaMatching deferred:** Announced for Vitest 4 but NOT in 4.0.18 stable; strategy uses `.parse()` directly
- **Console adapter interim source:** Uses `broadcast` as EventEnvelope source until `AGENT_OR_SPECIAL_PATTERN` regex is extended to accept `console:dashboard`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Contract testing approach is defined; plans 234-02 and 234-03 can layer semantic test cases, freshness policies, fixture structure, and audit mechanisms on top
- All 6 priority flows documented with specific I/O at every boundary -- ready for test case design
- Boundary schema inventory provides the complete reference for where to write `.contract.test.ts` files

## Self-Check: PASSED

- FOUND: `.planning/specs/integration-test-strategy/contract-testing-approach.md`
- FOUND: `.planning/phases/234-integration-test-strategy/234-01-SUMMARY.md`
- FOUND: commit `5c2794c`

---
*Phase: 234-integration-test-strategy*
*Completed: 2026-02-19*
