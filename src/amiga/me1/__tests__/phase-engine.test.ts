/**
 * Tests for ME-1 PhaseEngine class.
 *
 * Covers: constructor, happy-path lifecycle transitions, invalid transitions,
 * terminal states, HOLD/ABORT, entry criteria enforcement, telemetry emission,
 * manifest updates, and exported constants.
 */

import { describe, it, expect } from 'vitest';
import { PhaseEngine, PHASE_ORDER, VALID_TRANSITIONS } from '../phase-engine.js';
import type { PhaseTransitionResult } from '../phase-engine.js';
import { TelemetryEmitter } from '../telemetry-emitter.js';
import { createManifest } from '../manifest.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MISSION_ID = 'mission-2026-02-18-001';

function makeEngine() {
  const manifest = createManifest({
    mission_id: MISSION_ID,
    name: 'Test Mission',
    description: 'Phase engine test mission',
  });
  const emitter = new TelemetryEmitter({ mission_id: MISSION_ID });
  return { engine: new PhaseEngine({ manifest, emitter }), emitter };
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('PhaseEngine constructor', () => {
  it('creates a phase engine instance', () => {
    const { engine } = makeEngine();
    expect(engine).toBeInstanceOf(PhaseEngine);
  });

  it('initial current phase is BRIEFING', () => {
    const { engine } = makeEngine();
    expect(engine.getCurrentPhase()).toBe('BRIEFING');
  });

  it('getCurrentPhase returns BRIEFING', () => {
    const { engine } = makeEngine();
    expect(engine.getCurrentPhase()).toBe('BRIEFING');
  });
});

// ---------------------------------------------------------------------------
// Happy-path transitions (full lifecycle)
// ---------------------------------------------------------------------------

describe('happy-path transitions', () => {
  it('BRIEFING -> PLANNING succeeds', () => {
    const { engine } = makeEngine();
    const result = engine.transition('PLANNING');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.from).toBe('BRIEFING');
      expect(result.to).toBe('PLANNING');
    }
  });

  it('after transition getCurrentPhase returns PLANNING', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    expect(engine.getCurrentPhase()).toBe('PLANNING');
  });

  it('PLANNING -> EXECUTION succeeds', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    const result = engine.transition('EXECUTION');
    expect(result.success).toBe(true);
  });

  it('EXECUTION -> INTEGRATION succeeds', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('EXECUTION');
    const result = engine.transition('INTEGRATION');
    expect(result.success).toBe(true);
  });

  it('INTEGRATION -> REVIEW_GATE succeeds', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('EXECUTION');
    engine.transition('INTEGRATION');
    const result = engine.transition('REVIEW_GATE');
    expect(result.success).toBe(true);
  });

  it('REVIEW_GATE -> COMPLETION succeeds', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('EXECUTION');
    engine.transition('INTEGRATION');
    engine.transition('REVIEW_GATE');
    const result = engine.transition('COMPLETION');
    expect(result.success).toBe(true);
  });

  it('full lifecycle traversal: BRIEFING through COMPLETION', () => {
    const { engine } = makeEngine();
    const phases = ['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION'];
    for (const phase of phases) {
      const result = engine.transition(phase);
      expect(result.success).toBe(true);
    }
    expect(engine.getCurrentPhase()).toBe('COMPLETION');
  });
});

// ---------------------------------------------------------------------------
// Invalid transitions
// ---------------------------------------------------------------------------

describe('invalid transitions', () => {
  it('BRIEFING -> EXECUTION fails (must go through PLANNING)', () => {
    const { engine } = makeEngine();
    const result = engine.transition('EXECUTION');
    expect(result.success).toBe(false);
  });

  it('BRIEFING -> COMPLETION fails (cannot skip phases)', () => {
    const { engine } = makeEngine();
    const result = engine.transition('COMPLETION');
    expect(result.success).toBe(false);
  });

  it('PLANNING -> BRIEFING fails (cannot go backwards)', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    const result = engine.transition('BRIEFING');
    expect(result.success).toBe(false);
  });

  it('result has error string with descriptive message', () => {
    const { engine } = makeEngine();
    const result = engine.transition('EXECUTION') as { success: false; error: string };
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Terminal states
// ---------------------------------------------------------------------------

describe('terminal states', () => {
  it('COMPLETION is terminal -- cannot transition out', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('EXECUTION');
    engine.transition('INTEGRATION');
    engine.transition('REVIEW_GATE');
    engine.transition('COMPLETION');
    const result = engine.transition('BRIEFING');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/terminal/i);
    }
  });

  it('ABORT is terminal -- any transition fails', () => {
    const { engine } = makeEngine();
    engine.transition('ABORT');
    const result = engine.transition('BRIEFING');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/terminal/i);
    }
  });
});

// ---------------------------------------------------------------------------
// HOLD and ABORT
// ---------------------------------------------------------------------------

describe('HOLD and ABORT', () => {
  it('HOLD succeeds from BRIEFING', () => {
    const { engine } = makeEngine();
    const result = engine.transition('HOLD');
    expect(result.success).toBe(true);
    expect(engine.getCurrentPhase()).toBe('HOLD');
  });

  it('HOLD succeeds from any active phase', () => {
    for (const startPhase of ['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE']) {
      const { engine } = makeEngine();
      // Navigate to startPhase
      const phases = ['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE'];
      for (const p of phases) {
        if (p === startPhase) break;
        engine.transition(p);
      }
      if (startPhase !== 'BRIEFING') engine.transition(startPhase);
      const result = engine.transition('HOLD');
      expect(result.success).toBe(true);
    }
  });

  it('resume returns to the phase before HOLD', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('HOLD');
    expect(engine.getCurrentPhase()).toBe('HOLD');
    const result = engine.resume();
    expect(result.success).toBe(true);
    expect(engine.getCurrentPhase()).toBe('PLANNING');
  });

  it('ABORT succeeds from any active phase', () => {
    const { engine } = makeEngine();
    const result = engine.transition('ABORT');
    expect(result.success).toBe(true);
    expect(engine.getCurrentPhase()).toBe('ABORT');
  });

  it('ABORT succeeds from HOLD', () => {
    const { engine } = makeEngine();
    engine.transition('HOLD');
    const result = engine.transition('ABORT');
    expect(result.success).toBe(true);
    expect(engine.getCurrentPhase()).toBe('ABORT');
  });
});

// ---------------------------------------------------------------------------
// Entry criteria enforcement
// ---------------------------------------------------------------------------

describe('entry criteria enforcement', () => {
  it('setEntryCriteria sets criteria for a phase', () => {
    const { engine } = makeEngine();
    engine.setEntryCriteria('PLANNING', [{ name: 'Brief reviewed', met: false }]);
    // Should not throw
    expect(true).toBe(true);
  });

  it('transition fails when entry criteria are not all met', () => {
    const { engine } = makeEngine();
    engine.setEntryCriteria('PLANNING', [{ name: 'Brief reviewed', met: false }]);
    const result = engine.transition('PLANNING');
    expect(result.success).toBe(false);
  });

  it('error message includes unmet criteria names', () => {
    const { engine } = makeEngine();
    engine.setEntryCriteria('PLANNING', [{ name: 'Brief reviewed', met: false }]);
    const result = engine.transition('PLANNING') as { success: false; error: string };
    expect(result.error).toContain('Brief reviewed');
  });

  it('transition succeeds after marking criterion as met', () => {
    const { engine } = makeEngine();
    engine.setEntryCriteria('PLANNING', [{ name: 'Brief reviewed', met: false }]);
    engine.markCriterionMet('PLANNING', 'Brief reviewed');
    const result = engine.transition('PLANNING');
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Telemetry emission
// ---------------------------------------------------------------------------

describe('telemetry emission', () => {
  it('successful transition emits a TELEMETRY_UPDATE', () => {
    const { engine, emitter } = makeEngine();
    emitter.clearEventLog();
    engine.transition('PLANNING');
    const log = emitter.getEventLog();
    const telemetryEvents = log.filter(e => e.type === 'TELEMETRY_UPDATE');
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('REVIEW_GATE transition emits a GATE_SIGNAL', () => {
    const { engine, emitter } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('EXECUTION');
    engine.transition('INTEGRATION');
    emitter.clearEventLog();
    engine.transition('REVIEW_GATE');
    const log = emitter.getEventLog();
    const gateEvents = log.filter(e => e.type === 'GATE_SIGNAL');
    expect(gateEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('failed transitions do NOT emit telemetry events', () => {
    const { engine, emitter } = makeEngine();
    emitter.clearEventLog();
    engine.transition('EXECUTION'); // invalid from BRIEFING
    const log = emitter.getEventLog();
    expect(log).toHaveLength(0);
  });

  it('HOLD emits a TELEMETRY_UPDATE', () => {
    const { engine, emitter } = makeEngine();
    emitter.clearEventLog();
    engine.transition('HOLD');
    const log = emitter.getEventLog();
    const telemetryEvents = log.filter(e => e.type === 'TELEMETRY_UPDATE');
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('ABORT emits a TELEMETRY_UPDATE', () => {
    const { engine, emitter } = makeEngine();
    emitter.clearEventLog();
    engine.transition('ABORT');
    const log = emitter.getEventLog();
    const telemetryEvents = log.filter(e => e.type === 'TELEMETRY_UPDATE');
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Manifest updates
// ---------------------------------------------------------------------------

describe('manifest updates', () => {
  it('after transition getManifest reflects updated phase status', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    const manifest = engine.getManifest();
    // The current phase should reflect the transition
    expect(manifest.phases['PLANNING']).toBeDefined();
  });

  it('phase entry has started_at after transitioning into it', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    const manifest = engine.getManifest();
    expect(manifest.phases['PLANNING'].started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('phase entry has completed_at after transitioning out of it', () => {
    const { engine } = makeEngine();
    engine.transition('PLANNING');
    engine.transition('EXECUTION');
    const manifest = engine.getManifest();
    expect(manifest.phases['PLANNING'].completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ---------------------------------------------------------------------------
// PHASE_ORDER and VALID_TRANSITIONS exports
// ---------------------------------------------------------------------------

describe('exported constants', () => {
  it('PHASE_ORDER is the canonical lifecycle order', () => {
    expect([...PHASE_ORDER]).toEqual([
      'BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION',
    ]);
  });

  it('VALID_TRANSITIONS defines transitions from each state', () => {
    expect(VALID_TRANSITIONS).toBeDefined();
    expect(VALID_TRANSITIONS.get('BRIEFING')).toBeDefined();
    expect(VALID_TRANSITIONS.get('COMPLETION')).toEqual([]);
    expect(VALID_TRANSITIONS.get('ABORT')).toEqual([]);
  });
});
