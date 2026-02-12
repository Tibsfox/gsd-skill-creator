/**
 * Tests for the STATE.md transition detector.
 *
 * Covers:
 * - parseStateMd: extracting phase, status, plan, blockers, last_activity
 * - detectStateTransitions: detecting phase completions, phase starts,
 *   blocker add/resolve, status changes, multi-change scenarios, first scan
 */

import { describe, it, expect } from 'vitest';
import { detectStateTransitions, parseStateMd } from './state-transition-detector.js';

// ============================================================================
// Sample STATE.md content for tests (mirrors real GSD STATE.md format)
// ============================================================================

const FULL_STATE_MD = `# State

## Current Position

Phase: 86 -- Wrapper Commands (COMPLETE)
Plan: 02 of 2 complete
Status: Phase 86 complete
Last activity: 2026-02-12 -- Phase 86 verified

Progress: [=====_] 5/6 phases

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

## Accumulated Context

### Config
- Mode: yolo

### Decisions
- Phase numbering starts at 82

### Blockers
- (none)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans completed | 13 |

## Session Continuity

Last: 2026-02-12 -- Phase 86 complete
Stopped at: Phase 86 complete
Next action: Execute plan 87-01
`;

const IN_PROGRESS_STATE_MD = `# State

## Current Position

Phase: 87 -- Passive Monitoring (EXECUTING)
Plan: 1 of 3 complete
Status: Executing plan 87-01 complete, 87-02 next
Last activity: 2026-02-12 -- Plan 87-01 complete

Progress: [=====_] 5/6 phases

## Accumulated Context

### Blockers
- (none)

## Session Continuity

Last: 2026-02-12 -- Plan 87-01 complete
Next action: Execute plan 87-02
`;

const STATE_WITH_BLOCKERS = `# State

## Current Position

Phase: 85 -- Session Start (EXECUTING)
Plan: 1 of 3 complete
Status: Blocked on API key
Last activity: 2026-02-11 -- Plan 85-01 started

### Blockers
- API key not available for external service
- Waiting for team review of schema changes
`;

const EMPTY_STATE_MD = '';

// ============================================================================
// parseStateMd
// ============================================================================

describe('parseStateMd', () => {
  it('extracts phase number and name', () => {
    const result = parseStateMd(FULL_STATE_MD);

    expect(result.phase).toBeDefined();
    expect(result.phase).toContain('86');
  });

  it('extracts status', () => {
    const result = parseStateMd(FULL_STATE_MD);

    expect(result.status).toBeDefined();
    expect(result.status).toContain('Phase 86 complete');
  });

  it('extracts plan progress', () => {
    const result = parseStateMd(FULL_STATE_MD);

    expect(result.plan).toBeDefined();
    expect(result.plan).toContain('02 of 2');
  });

  it('extracts blockers when present', () => {
    const result = parseStateMd(STATE_WITH_BLOCKERS);

    expect(result.blockers).toBeDefined();
    expect(result.blockers).toContain('API key not available');
  });

  it('returns empty blockers when none exist', () => {
    const result = parseStateMd(FULL_STATE_MD);

    // "(none)" should result in empty string for blockers
    expect(result.blockers === '' || result.blockers === undefined).toBe(true);
  });

  it('handles missing STATE.md content', () => {
    const result = parseStateMd(EMPTY_STATE_MD);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    // Should have no keys or keys with undefined/empty values
    expect(Object.keys(result).length).toBe(0);
  });

  it('extracts last activity line', () => {
    const result = parseStateMd(FULL_STATE_MD);

    expect(result.last_activity).toBeDefined();
    expect(result.last_activity).toContain('Phase 86 verified');
  });
});

// ============================================================================
// detectStateTransitions
// ============================================================================

describe('detectStateTransitions', () => {
  it('detects phase completion', () => {
    const previousState: Record<string, string> = {
      phase: '86 -- Wrapper Commands (EXECUTING)',
      status: 'Executing plan 86-02',
      plan: '01 of 2 complete',
      blockers: '',
    };

    const transitions = detectStateTransitions(previousState, FULL_STATE_MD);

    expect(transitions.length).toBeGreaterThan(0);
    const phaseComplete = transitions.find(
      (t) => t.transition_type === 'phase_complete',
    );
    expect(phaseComplete).toBeDefined();
  });

  it('detects new phase started', () => {
    const previousState: Record<string, string> = {
      phase: '86 -- Wrapper Commands (COMPLETE)',
      status: 'Phase 86 complete',
      plan: '02 of 2 complete',
      blockers: '',
    };

    const transitions = detectStateTransitions(
      previousState,
      IN_PROGRESS_STATE_MD,
    );

    const phaseStarted = transitions.find(
      (t) => t.transition_type === 'phase_started',
    );
    expect(phaseStarted).toBeDefined();
    expect(phaseStarted!.current_value).toContain('87');
  });

  it('detects new blocker added', () => {
    const previousState: Record<string, string> = {
      phase: '85 -- Session Start (EXECUTING)',
      status: 'Executing plan 85-01',
      plan: '1 of 3 complete',
      blockers: '',
    };

    const transitions = detectStateTransitions(
      previousState,
      STATE_WITH_BLOCKERS,
    );

    const blockerAdded = transitions.find(
      (t) => t.transition_type === 'blocker_added',
    );
    expect(blockerAdded).toBeDefined();
    expect(blockerAdded!.current_value).toContain('API key');
  });

  it('detects blocker resolved', () => {
    const previousState: Record<string, string> = {
      phase: '87 -- Passive Monitoring (EXECUTING)',
      status: 'Executing plan 87-01',
      plan: '1 of 3 complete',
      blockers: 'API key not available',
    };

    const transitions = detectStateTransitions(
      previousState,
      IN_PROGRESS_STATE_MD,
    );

    const blockerResolved = transitions.find(
      (t) => t.transition_type === 'blocker_resolved',
    );
    expect(blockerResolved).toBeDefined();
    expect(blockerResolved!.previous_value).toContain('API key');
  });

  it('detects status change', () => {
    const previousState: Record<string, string> = {
      phase: '87 -- Passive Monitoring (EXECUTING)',
      status: 'Planning phase 87',
      plan: '0 of 3 complete',
      blockers: '',
    };

    const transitions = detectStateTransitions(
      previousState,
      IN_PROGRESS_STATE_MD,
    );

    const statusChange = transitions.find(
      (t) => t.transition_type === 'status_change',
    );
    expect(statusChange).toBeDefined();
  });

  it('returns empty array when nothing changed', () => {
    // Parse the current state and re-use it as "previous"
    const currentState = parseStateMd(IN_PROGRESS_STATE_MD);

    const transitions = detectStateTransitions(
      currentState,
      IN_PROGRESS_STATE_MD,
    );

    expect(transitions).toEqual([]);
  });

  it('handles null previous state (first scan)', () => {
    const transitions = detectStateTransitions(null, IN_PROGRESS_STATE_MD);

    // First scan is a baseline capture -- no transitions
    expect(transitions).toEqual([]);
  });

  it('returns multiple transitions when several things changed', () => {
    const previousState: Record<string, string> = {
      phase: '85 -- Session Start (EXECUTING)',
      status: 'Executing plan 85-01',
      plan: '0 of 3 complete',
      blockers: '',
    };

    // Current state has phase 87 AND blockers -- multiple changes
    const transitions = detectStateTransitions(
      previousState,
      IN_PROGRESS_STATE_MD,
    );

    // Should detect at least phase_started (85 -> 87) and status_change
    expect(transitions.length).toBeGreaterThanOrEqual(2);
  });
});
