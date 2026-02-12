import { describe, it, expect } from 'vitest';
import {
  evaluateConfirmationGate,
  CONFIRMATION_REQUIRED_COMMANDS,
  ConfirmationGateConfig,
} from './confirmation-gate.js';

// ============================================================================
// Confirmation Gate Tests
// ============================================================================

describe('CONFIRMATION_REQUIRED_COMMANDS', () => {
  it('is a Set containing gsd:execute-phase', () => {
    expect(CONFIRMATION_REQUIRED_COMMANDS).toBeInstanceOf(Set);
    expect(CONFIRMATION_REQUIRED_COMMANDS.has('gsd:execute-phase')).toBe(true);
  });

  it('contains gsd:complete-milestone', () => {
    expect(CONFIRMATION_REQUIRED_COMMANDS.has('gsd:complete-milestone')).toBe(true);
  });
});

describe('evaluateConfirmationGate', () => {
  describe('destructive commands (always confirm)', () => {
    it('requires confirmation for complete-milestone in YOLO mode', () => {
      const result = evaluateConfirmationGate('gsd:complete-milestone', 'yolo', 0.9);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('destructive');
    });

    it('requires confirmation for complete-milestone in interactive mode', () => {
      const result = evaluateConfirmationGate('gsd:complete-milestone', 'interactive', 0.9);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('destructive');
    });

    it('requires confirmation for remove-phase regardless of mode', () => {
      const result = evaluateConfirmationGate('gsd:remove-phase', 'yolo', 0.95);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('destructive');
    });
  });

  describe('execute-phase confirmation gate', () => {
    it('requires confirmation for execute-phase in interactive mode', () => {
      const result = evaluateConfirmationGate('gsd:execute-phase', 'interactive', 0.9);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('confirmation');
    });

    it('proceeds for execute-phase in YOLO mode with high confidence', () => {
      const result = evaluateConfirmationGate('gsd:execute-phase', 'yolo', 0.9);
      expect(result.action).toBe('proceed');
      expect(result.gateType).toBe('routing');
    });

    it('requires confirmation for execute-phase in YOLO mode with LOW confidence', () => {
      const result = evaluateConfirmationGate('gsd:execute-phase', 'yolo', 0.3);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('low-confidence');
    });
  });

  describe('low-confidence gate (higher priority than confirmation)', () => {
    it('low-confidence overrides confirmation gate for execute-phase', () => {
      const result = evaluateConfirmationGate('gsd:execute-phase', 'interactive', 0.3);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('low-confidence');
    });
  });

  describe('regular commands (no special confirmation)', () => {
    it('proceeds for plan-phase in YOLO mode', () => {
      const result = evaluateConfirmationGate('gsd:plan-phase', 'yolo', 0.9);
      expect(result.action).toBe('proceed');
      expect(result.gateType).toBe('routing');
    });

    it('confirms for plan-phase in interactive mode', () => {
      const result = evaluateConfirmationGate('gsd:plan-phase', 'interactive', 0.9);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('routing');
    });

    it('proceeds for progress in YOLO mode', () => {
      const result = evaluateConfirmationGate('gsd:progress', 'yolo', 0.85);
      expect(result.action).toBe('proceed');
    });
  });

  describe('gate priority order', () => {
    it('destructive > confirmation: complete-milestone destructive overrides confirmation', () => {
      // complete-milestone is both destructive AND in confirmation set
      // destructive should win
      const result = evaluateConfirmationGate('gsd:complete-milestone', 'interactive', 0.9);
      expect(result.gateType).toBe('destructive');
    });

    it('low-confidence > confirmation: low confidence overrides confirmation gate', () => {
      const result = evaluateConfirmationGate('gsd:execute-phase', 'interactive', 0.2);
      expect(result.gateType).toBe('low-confidence');
    });
  });

  describe('custom config', () => {
    it('accepts custom confirmation commands set', () => {
      const config: ConfirmationGateConfig = {
        confirmationCommands: new Set(['gsd:custom-cmd']),
      };
      const result = evaluateConfirmationGate('gsd:custom-cmd', 'interactive', 0.9, config);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('confirmation');
    });

    it('custom config does not affect destructive gate', () => {
      const config: ConfirmationGateConfig = {
        confirmationCommands: new Set(['gsd:custom-cmd']),
      };
      const result = evaluateConfirmationGate('gsd:remove-phase', 'yolo', 0.9, config);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('destructive');
    });

    it('accepts custom low-confidence threshold', () => {
      const config: ConfirmationGateConfig = {
        lowConfidenceThreshold: 0.8,
      };
      const result = evaluateConfirmationGate('gsd:plan-phase', 'yolo', 0.7, config);
      expect(result.action).toBe('confirm');
      expect(result.gateType).toBe('low-confidence');
    });
  });
});
