/**
 * HB-02 AgentDoG — `How` axis tests.
 */

import { describe, it, expect } from 'vitest';
import {
  captureHowAxis,
  ESCALATION_PATTERNS,
  VULNERABILITY_VECTORS,
} from '../how.js';

describe('AgentDoG — How axis', () => {
  it('enumerates all named vulnerability vectors', () => {
    expect(VULNERABILITY_VECTORS).toContain('prompt-injection');
    expect(VULNERABILITY_VECTORS).toContain('metadata-poisoning');
    expect(VULNERABILITY_VECTORS).toContain('function-hijacking');
    expect(VULNERABILITY_VECTORS).toContain('capability-overreach');
    expect(VULNERABILITY_VECTORS).toContain('data-exfiltration');
    expect(VULNERABILITY_VECTORS).toContain('credential-leak');
    expect(VULNERABILITY_VECTORS).toContain('unknown');
  });

  it('enumerates all named escalation patterns', () => {
    expect(ESCALATION_PATTERNS).toContain('lateral');
    expect(ESCALATION_PATTERNS).toContain('vertical');
    expect(ESCALATION_PATTERNS).toContain('persistence');
    expect(ESCALATION_PATTERNS).toContain('cross-session');
    expect(ESCALATION_PATTERNS).toContain('cross-project');
    expect(ESCALATION_PATTERNS).toContain('none');
    expect(ESCALATION_PATTERNS).toContain('unknown');
  });

  it('captures known vector + escalation verbatim', () => {
    const h = captureHowAxis({
      vulnerabilityVector: 'prompt-injection',
      escalationPattern: 'cross-session',
    });
    expect(h.vulnerabilityVector).toBe('prompt-injection');
    expect(h.escalationPattern).toBe('cross-session');
  });

  it('falls back to "unknown" on unrecognized values', () => {
    const h = captureHowAxis({
      vulnerabilityVector: 'made-up-vector',
      escalationPattern: 'made-up-pattern',
    });
    expect(h.vulnerabilityVector).toBe('unknown');
    expect(h.escalationPattern).toBe('unknown');
  });

  it('falls back to "unknown" on missing/non-string inputs', () => {
    const h = captureHowAxis({});
    expect(h.vulnerabilityVector).toBe('unknown');
    expect(h.escalationPattern).toBe('unknown');
  });

  it('captured axis is frozen (immutable)', () => {
    const h = captureHowAxis({ vulnerabilityVector: 'prompt-injection' });
    expect(Object.isFrozen(h)).toBe(true);
  });
});
