/**
 * Tests for the HITL gate evaluator.
 *
 * Verifies that evaluateGate returns the correct GateDecision for all
 * three gate types (destructive, low-confidence, routing) across both
 * YOLO and interactive modes. Destructive and low-confidence gates are
 * never skippable regardless of mode.
 */

import { describe, it, expect } from 'vitest';
import { evaluateGate } from './gate-evaluator.js';
import { DEFAULT_DESTRUCTIVE_COMMANDS } from './types.js';
import type { GateDecision } from './types.js';

// ============================================================================
// DEFAULT_DESTRUCTIVE_COMMANDS
// ============================================================================

describe('DEFAULT_DESTRUCTIVE_COMMANDS', () => {
  it('includes gsd:remove-phase', () => {
    expect(DEFAULT_DESTRUCTIVE_COMMANDS.has('gsd:remove-phase')).toBe(true);
  });

  it('includes gsd:complete-milestone', () => {
    expect(DEFAULT_DESTRUCTIVE_COMMANDS.has('gsd:complete-milestone')).toBe(true);
  });

  it('is a Set<string>', () => {
    expect(DEFAULT_DESTRUCTIVE_COMMANDS).toBeInstanceOf(Set);
  });
});

// ============================================================================
// Destructive Gate
// ============================================================================

describe('evaluateGate - destructive gate', () => {
  it('returns action:confirm for destructive command in YOLO mode', () => {
    const result = evaluateGate('gsd:remove-phase', 'yolo', 0.95);
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('destructive');
    expect(result.skippedByYolo).toBe(false);
  });

  it('returns action:confirm for destructive command in interactive mode', () => {
    const result = evaluateGate('gsd:complete-milestone', 'interactive', 0.99);
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('destructive');
    expect(result.skippedByYolo).toBe(false);
  });

  it('never returns action:proceed for destructive commands regardless of confidence', () => {
    const result = evaluateGate('gsd:remove-phase', 'yolo', 1.0);
    expect(result.action).not.toBe('proceed');
  });

  it('uses custom destructiveCommands set when provided', () => {
    const custom = new Set(['gsd:nuke-everything']);
    const result = evaluateGate('gsd:nuke-everything', 'yolo', 0.99, {
      destructiveCommands: custom,
    });
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('destructive');
  });

  it('does not treat default destructive commands as destructive when overridden', () => {
    const custom = new Set(['gsd:nuke-everything']);
    const result = evaluateGate('gsd:remove-phase', 'yolo', 0.95, {
      destructiveCommands: custom,
    });
    // remove-phase is NOT in the custom set, so it should NOT be destructive
    expect(result.gateType).not.toBe('destructive');
  });

  it('includes a reason string', () => {
    const result = evaluateGate('gsd:remove-phase', 'yolo', 0.95);
    expect(result.reason).toBeTruthy();
    expect(typeof result.reason).toBe('string');
  });
});

// ============================================================================
// Low-Confidence Gate
// ============================================================================

describe('evaluateGate - low-confidence gate', () => {
  it('returns action:confirm when confidence is below default threshold (0.5)', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.3);
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('low-confidence');
    expect(result.skippedByYolo).toBe(false);
  });

  it('returns action:confirm when confidence is below default threshold in interactive mode', () => {
    const result = evaluateGate('gsd:plan-phase', 'interactive', 0.2);
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('low-confidence');
    expect(result.skippedByYolo).toBe(false);
  });

  it('never returns action:proceed for low-confidence regardless of mode', () => {
    const result = evaluateGate('gsd:progress', 'yolo', 0.1);
    expect(result.action).not.toBe('proceed');
  });

  it('uses custom lowConfidenceThreshold when provided', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.65, {
      lowConfidenceThreshold: 0.7,
    });
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('low-confidence');
  });

  it('treats confidence exactly at threshold as sufficient (not low)', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.5);
    // 0.5 is NOT below 0.5, so should NOT be low-confidence
    expect(result.gateType).not.toBe('low-confidence');
  });

  it('treats confidence of 0.49 as low-confidence', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.49);
    expect(result.gateType).toBe('low-confidence');
    expect(result.action).toBe('confirm');
  });

  it('includes a reason string', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.3);
    expect(result.reason).toBeTruthy();
    expect(typeof result.reason).toBe('string');
  });
});

// ============================================================================
// Routing Gate
// ============================================================================

describe('evaluateGate - routing gate', () => {
  it('returns action:proceed in YOLO mode with sufficient confidence', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.8);
    expect(result.action).toBe('proceed');
    expect(result.gateType).toBe('routing');
    expect(result.skippedByYolo).toBe(true);
  });

  it('returns action:confirm in interactive mode', () => {
    const result = evaluateGate('gsd:plan-phase', 'interactive', 0.8);
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('routing');
    expect(result.skippedByYolo).toBe(true);
  });

  it('returns action:confirm in interactive mode with perfect confidence', () => {
    const result = evaluateGate('gsd:progress', 'interactive', 1.0);
    expect(result.action).toBe('confirm');
    expect(result.gateType).toBe('routing');
  });

  it('returns action:proceed in YOLO at exactly threshold confidence', () => {
    const result = evaluateGate('gsd:progress', 'yolo', 0.5);
    expect(result.action).toBe('proceed');
    expect(result.gateType).toBe('routing');
    expect(result.skippedByYolo).toBe(true);
  });

  it('includes a reason string for YOLO proceed', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.9);
    expect(result.reason).toBeTruthy();
    expect(typeof result.reason).toBe('string');
  });

  it('includes a reason string for interactive confirm', () => {
    const result = evaluateGate('gsd:plan-phase', 'interactive', 0.9);
    expect(result.reason).toBeTruthy();
  });
});

// ============================================================================
// Gate Priority (first match wins)
// ============================================================================

describe('evaluateGate - gate priority', () => {
  it('destructive gate takes priority over low-confidence', () => {
    // Destructive command WITH low confidence -- destructive should win
    const result = evaluateGate('gsd:remove-phase', 'yolo', 0.1);
    expect(result.gateType).toBe('destructive');
  });

  it('destructive gate takes priority over routing', () => {
    const result = evaluateGate('gsd:remove-phase', 'yolo', 0.99);
    expect(result.gateType).toBe('destructive');
  });

  it('low-confidence gate takes priority over routing', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.3);
    expect(result.gateType).toBe('low-confidence');
  });
});

// ============================================================================
// GateDecision shape validation
// ============================================================================

describe('evaluateGate - GateDecision shape', () => {
  it('returns all required fields', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.8);
    expect(result).toHaveProperty('action');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('gateType');
    expect(result).toHaveProperty('skippedByYolo');
  });

  it('action is one of proceed/confirm/block', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.8);
    expect(['proceed', 'confirm', 'block']).toContain(result.action);
  });

  it('gateType is one of routing/destructive/low-confidence', () => {
    const r1 = evaluateGate('gsd:plan-phase', 'yolo', 0.8);
    const r2 = evaluateGate('gsd:remove-phase', 'yolo', 0.8);
    const r3 = evaluateGate('gsd:plan-phase', 'yolo', 0.1);
    expect(['routing', 'destructive', 'low-confidence']).toContain(r1.gateType);
    expect(['routing', 'destructive', 'low-confidence']).toContain(r2.gateType);
    expect(['routing', 'destructive', 'low-confidence']).toContain(r3.gateType);
  });

  it('skippedByYolo is boolean', () => {
    const result = evaluateGate('gsd:plan-phase', 'yolo', 0.8);
    expect(typeof result.skippedByYolo).toBe('boolean');
  });
});
