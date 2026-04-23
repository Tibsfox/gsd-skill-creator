/**
 * Adaptive-Systems Department Convergent Substrate concept tests -- Phase 707 (v1.49.570).
 * Covers: CONV-11 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import { twoGateGuardrail } from './index.js';

describe('Adaptive-Systems Department Convergent Substrate Concepts (Phase 707)', () => {
  it('twoGateGuardrail has id prefix adaptive-systems-', () => {
    expect(twoGateGuardrail.id.startsWith('adaptive-systems-')).toBe(true);
  });

  it('twoGateGuardrail has domain=adaptive-systems', () => {
    expect(twoGateGuardrail.domain).toBe('adaptive-systems');
  });

  it('twoGateGuardrail has non-trivial description mentioning tau and K[m]', () => {
    expect(twoGateGuardrail.description.length).toBeGreaterThan(200);
    expect(twoGateGuardrail.description).toMatch(/tau/i);
    expect(twoGateGuardrail.description).toContain('K[m]');
  });

  it('twoGateGuardrail has >=2 relationships', () => {
    expect(twoGateGuardrail.relationships.length).toBeGreaterThanOrEqual(2);
  });

  it('twoGateGuardrail has valid complexPlanePosition', () => {
    const pos = twoGateGuardrail.complexPlanePosition!;
    expect(pos).toBeDefined();
    const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
    expect(pos.magnitude).toBeCloseTo(expectedMag, 5);
  });

  it('twoGateGuardrail references at least one ai-computation concept (cross-dept)', () => {
    const crossDept = twoGateGuardrail.relationships.some(
      (r) => r.targetId.startsWith('ai-computation-')
    );
    expect(crossDept).toBe(true);
  });

  it('twoGateGuardrail references Agent Stability Index as monitoring hook', () => {
    const asiRef = twoGateGuardrail.relationships.some(
      (r) => r.targetId === 'adaptive-systems-agent-stability-index'
    );
    expect(asiRef).toBe(true);
  });
});
