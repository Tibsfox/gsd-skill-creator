/**
 * Tests for the STATE.md parser.
 *
 * Covers:
 * - Current position extraction with all fields
 * - Phase status suffix (-- COMPLETE)
 * - Decisions, blockers, pending todos extraction
 * - Session continuity fields
 * - Null return for empty/invalid input
 * - Decimal phase numbers in position
 * - Progress percentage extraction
 */

import { describe, it, expect } from 'vitest';
import { parseState } from './state-parser.js';

// ============================================================================
// Fixtures
// ============================================================================

const COMPLETE_STATE = `# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Skills, agents, and teams must match official Claude Code patterns
**Current focus:** Phase 36 complete, ready for Phase 37 or 38

## Current Position

Phase: 36 of 44 (Discovery Foundation) -- COMPLETE
Plan: 3 of 3 in current phase (phase complete)
Status: Phase complete
Last activity: 2026-02-08 — Completed 36-03-PLAN.md (auto-detection, error tolerance, integration tests)

Progress: [███░░░░░░░] 14% (3/22 plans)

## Shipped Milestones

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-9 | 29 | Complete | 2026-01-31 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.7 init]: GSD core is source of truth, orchestrator adapts dynamically
- [v1.7 init]: Dynamic filesystem discovery over manifest (adapts to any GSD version)
- [36-01]: Null-return parsing pattern (parsers return null for malformed input, callers filter)
- [36-02]: Agent filtering by gsd-* filename prefix (not content-based)

### Pending Todos

- Investigate performance of large discovery runs
- Add integration test for edge case with missing frontmatter

### Blockers/Concerns

- Zod v4 has breaking changes with .default({}) on nested objects
- Need to verify compatibility with Node 18

## Session Continuity

Last session: 2026-02-08
Stopped at: Phase 36 complete. Ready for Phase 37 (State Reading) or Phase 38 (Intent Classification)
Resume file: .planning/ROADMAP.md

---
*Updated: 2026-02-08 after 36-03 completion (Phase 36 complete)*
`;

const STATE_NO_STATUS_SUFFIX = `# Project State

## Current Position

Phase: 3 of 10 (Testing Framework)
Plan: 1 of 4
Status: In progress
Last activity: 2026-01-20 — Working on test infrastructure

Progress: [██░░░░░░░░] 25% (5/20 plans)

## Accumulated Context

### Decisions

- Use vitest for all testing

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-20
Stopped at: Mid-plan, test infrastructure
Resume file: .planning/phases/03-testing/03-01-PLAN.md
`;

const STATE_DECIMAL_PHASE = `# Project State

## Current Position

Phase: 2.1 of 10 (Hotfix)
Plan: 1 of 1
Status: In progress
Last activity: 2026-01-18

Progress: [█░░░░░░░░░] 10% (2/20 plans)

## Accumulated Context

### Decisions

- Applied hotfix for edge case

### Blockers/Concerns

None.

### Pending Todos

None.

## Session Continuity

Last session: 2026-01-18
Stopped at: Hotfix in progress
Resume file: .planning/phases/02.1-hotfix/02.1-01-PLAN.md
`;

// ============================================================================
// Core parsing
// ============================================================================

describe('parseState', () => {
  it('parses complete STATE.md with all sections populated', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.position).toBeDefined();
    expect(result!.decisions).toBeInstanceOf(Array);
    expect(result!.blockers).toBeInstanceOf(Array);
    expect(result!.pendingTodos).toBeInstanceOf(Array);
    expect(result!.sessionContinuity).toBeDefined();
  });

  it('extracts current position with all fields', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.position).toMatchObject({
      phase: 36,
      totalPhases: 44,
      phaseName: 'Discovery Foundation',
      phaseStatus: 'COMPLETE',
      plan: 3,
      totalPlans: 3,
      status: 'Phase complete',
      progressPercent: 14,
      lastActivity: '2026-02-08 — Completed 36-03-PLAN.md (auto-detection, error tolerance, integration tests)',
    });
  });

  it('handles -- COMPLETE suffix on Phase line', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.position.phaseStatus).toBe('COMPLETE');
  });

  it('handles missing status suffix on Phase line (just Phase: 3 of 10 (Name))', () => {
    const result = parseState(STATE_NO_STATUS_SUFFIX);
    expect(result).not.toBeNull();
    expect(result!.position).toMatchObject({
      phase: 3,
      totalPhases: 10,
      phaseName: 'Testing Framework',
      phaseStatus: null,
      plan: 1,
      totalPlans: 4,
    });
  });

  it('extracts decisions as string array', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.decisions).toHaveLength(4);
    expect(result!.decisions[0]).toBe('[v1.7 init]: GSD core is source of truth, orchestrator adapts dynamically');
    expect(result!.decisions[3]).toBe('[36-02]: Agent filtering by gsd-* filename prefix (not content-based)');
  });

  it('returns empty arrays when Blockers/Concerns is "None."', () => {
    const result = parseState(STATE_NO_STATUS_SUFFIX);
    expect(result).not.toBeNull();
    expect(result!.blockers).toHaveLength(0);
    expect(result!.pendingTodos).toHaveLength(0);
  });

  it('extracts blockers when present', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.blockers).toHaveLength(2);
    expect(result!.blockers[0]).toBe('Zod v4 has breaking changes with .default({}) on nested objects');
  });

  it('extracts pending todos when present', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.pendingTodos).toHaveLength(2);
    expect(result!.pendingTodos[0]).toBe('Investigate performance of large discovery runs');
  });

  it('extracts session continuity fields', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.sessionContinuity).toMatchObject({
      lastSession: '2026-02-08',
      stoppedAt: 'Phase 36 complete. Ready for Phase 37 (State Reading) or Phase 38 (Intent Classification)',
      resumeFile: '.planning/ROADMAP.md',
    });
  });

  it('returns null for empty input', () => {
    expect(parseState('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(parseState('  \n\t  ')).toBeNull();
  });

  it('returns null for content without Current Position section', () => {
    const content = `# Project State

## Some Other Section

Just some text without a position section.
`;
    expect(parseState(content)).toBeNull();
  });

  it('handles decimal phase number in position (Phase: 2.1 of 10)', () => {
    const result = parseState(STATE_DECIMAL_PHASE);
    expect(result).not.toBeNull();
    expect(result!.position.phase).toBe(2.1);
    expect(result!.position.totalPhases).toBe(10);
    expect(result!.position.phaseName).toBe('Hotfix');
  });

  it('handles percentage extraction from progress bar line', () => {
    const result = parseState(COMPLETE_STATE);
    expect(result).not.toBeNull();
    expect(result!.position.progressPercent).toBe(14);
  });

  it('handles progress bar with different percentage', () => {
    const result = parseState(STATE_NO_STATUS_SUFFIX);
    expect(result).not.toBeNull();
    expect(result!.position.progressPercent).toBe(25);
  });
});
