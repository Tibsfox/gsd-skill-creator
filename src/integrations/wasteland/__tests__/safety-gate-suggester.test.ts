/**
 * Tests for Safety Gate Suggester — gate generation, performance tracking, promotion.
 */

import { describe, it, expect } from 'vitest';
import {
  generatePreGate,
  generatePostGate,
} from '../safety-gate-suggester.js';
import type { FailureSignature, ClusterResult } from '../types.js';

function makeSig(overrides: Partial<FailureSignature> = {}): FailureSignature {
  return {
    id: 'sig-1',
    failureClass: 'timeout',
    taskType: 'build',
    conditions: {},
    preventativeAction: 'Add timeout check',
    occurrences: 5,
    lastSeen: '2026-03-27T00:00:00Z',
    ...overrides,
  };
}

const CLUSTERS: ClusterResult[] = [
  { id: 'c1', archetype: 'builder', size: 2, members: ['a1', 'a2'], centroid: { build: 0.9 } },
];

describe('generatePreGate', () => {
  it('generates a pre-execution gate from failure signature', () => {
    const gate = generatePreGate(makeSig(), CLUSTERS);
    expect(gate.id).toContain('gate-pre');
    expect(gate.type).toBe('pre-execution');
    expect(gate.name).toContain('timeout');
    expect(gate.name).toContain('build');
    expect(gate.sourceFailureSignatures).toContain('sig-1');
  });

  it('starts with human-approval automation level', () => {
    const gate = generatePreGate(makeSig(), CLUSTERS);
    expect(gate.automationLevel).toBe('human-approval');
  });

  it('includes check function', () => {
    const gate = generatePreGate(makeSig(), CLUSTERS);
    expect(gate.check).toBeDefined();
    expect(typeof gate.check).toBe('function');
  });

  it('handles safety-violation failure class', () => {
    const gate = generatePreGate(makeSig({ failureClass: 'safety-violation' }), CLUSTERS);
    expect(gate.automationLevel).toBe('human-approval');
  });
});

describe('generatePostGate', () => {
  it('generates a post-execution gate', () => {
    const gate = generatePostGate(makeSig());
    expect(gate.id).toContain('gate-post');
    expect(gate.type).toBe('post-execution');
  });

  it('check function evaluates deliverables', () => {
    const gate = generatePostGate(makeSig());
    const pass = gate.check!('task-1', 'agent-1', { deliverables: ['file.ts'], qualityScore: 0.8 });
    expect(pass.pass).toBe(true);
  });

  it('check function fails without deliverables', () => {
    const gate = generatePostGate(makeSig());
    const fail = gate.check!('task-1', 'agent-1', { qualityScore: 0.8 });
    expect(fail.pass).toBe(false);
    expect(fail.reason).toContain('Missing deliverables');
  });
});
