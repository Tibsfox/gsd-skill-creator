/**
 * Signal Classification tests -- RED phase.
 *
 * Tests for SIGNAL_WEIGHTS constant and classifySignals function.
 * Verifies correct categorization of deterministic commands as concrete,
 * semantic clusters as abstract, and mixed signals as both.
 */

import { describe, it, expect } from 'vitest';
import {
  SIGNAL_WEIGHTS,
  classifySignals,
  type ObservationSignal,
  type SignalClassification,
} from './signal-classification.js';

describe('SIGNAL_WEIGHTS', () => {
  const ALL_SIGNAL_TYPES = [
    'bash_deterministic',
    'file_change_single',
    'tool_exact_sequence',
    'phase_execute',
    'file_change_multi',
    'workflow_repetition',
    'command_with_args',
    'semantic_cluster',
    'cross_project_pattern',
    'intent_description',
    'phase_research',
    'high_variance_output',
  ] as const;

  it('has entries for all 12 signal types', () => {
    for (const type of ALL_SIGNAL_TYPES) {
      expect(SIGNAL_WEIGHTS).toHaveProperty(type);
    }
    expect(Object.keys(SIGNAL_WEIGHTS)).toHaveLength(12);
  });

  it('concrete-heavy signals have concrete > 0 and abstract === 0', () => {
    const concreteTypes = [
      'bash_deterministic',
      'file_change_single',
      'tool_exact_sequence',
      'phase_execute',
    ];
    for (const type of concreteTypes) {
      expect(SIGNAL_WEIGHTS[type].concrete).toBeGreaterThan(0);
      expect(SIGNAL_WEIGHTS[type].abstract).toBe(0);
    }
  });

  it('abstract-heavy signals have concrete === 0 and abstract > 0', () => {
    const abstractTypes = [
      'semantic_cluster',
      'cross_project_pattern',
      'intent_description',
      'phase_research',
      'high_variance_output',
    ];
    for (const type of abstractTypes) {
      expect(SIGNAL_WEIGHTS[type].concrete).toBe(0);
      expect(SIGNAL_WEIGHTS[type].abstract).toBeGreaterThan(0);
    }
  });

  it('mixed signals have both concrete > 0 and abstract > 0', () => {
    const mixedTypes = [
      'file_change_multi',
      'workflow_repetition',
      'command_with_args',
    ];
    for (const type of mixedTypes) {
      expect(SIGNAL_WEIGHTS[type].concrete).toBeGreaterThan(0);
      expect(SIGNAL_WEIGHTS[type].abstract).toBeGreaterThan(0);
    }
  });
});

describe('classifySignals', () => {
  it('all concrete signals: totalConcrete=9, totalAbstract=0, theta~0', () => {
    const signals: ObservationSignal[] = [
      { type: 'bash_deterministic' },
      { type: 'bash_deterministic' },
      { type: 'bash_deterministic' },
    ];
    const result = classifySignals(signals);
    expect(result.totalConcrete).toBe(9); // 3 * concrete weight 3
    expect(result.totalAbstract).toBe(0);
    expect(result.theta).toBeCloseTo(0, 5);
  });

  it('all abstract signals: totalConcrete=0, totalAbstract=6, theta~PI/2', () => {
    const signals: ObservationSignal[] = [
      { type: 'semantic_cluster' },
      { type: 'semantic_cluster' },
    ];
    const result = classifySignals(signals);
    expect(result.totalConcrete).toBe(0);
    expect(result.totalAbstract).toBe(6); // 2 * abstract weight 3
    expect(result.theta).toBeCloseTo(Math.PI / 2, 5);
  });

  it('mixed signals: totalConcrete=3, totalAbstract=3, theta~PI/4', () => {
    const signals: ObservationSignal[] = [
      { type: 'bash_deterministic' },
      { type: 'semantic_cluster' },
    ];
    const result = classifySignals(signals);
    expect(result.totalConcrete).toBe(3);
    expect(result.totalAbstract).toBe(3);
    expect(result.theta).toBeCloseTo(Math.PI / 4, 5);
  });

  it('empty signals array: totalConcrete=0, totalAbstract=0, theta=0', () => {
    const result = classifySignals([]);
    expect(result.totalConcrete).toBe(0);
    expect(result.totalAbstract).toBe(0);
    expect(result.theta).toBe(0);
  });

  it('unknown signal type is ignored', () => {
    const signals: ObservationSignal[] = [
      { type: 'bash_deterministic' },
      { type: 'unknown_type_xyz' },
    ];
    const result = classifySignals(signals);
    expect(result.totalConcrete).toBe(3);
    expect(result.totalAbstract).toBe(0);
    expect(result.theta).toBeCloseTo(0, 5);
  });

  it('signal count multiplier works correctly', () => {
    const signals: ObservationSignal[] = [
      { type: 'bash_deterministic', count: 5 },
    ];
    const result = classifySignals(signals);
    expect(result.totalConcrete).toBe(15); // 5 * concrete weight 3
    expect(result.totalAbstract).toBe(0);
  });

  it('signalBreakdown tracks per-type counts correctly', () => {
    const signals: ObservationSignal[] = [
      { type: 'bash_deterministic' },
      { type: 'bash_deterministic' },
      { type: 'semantic_cluster' },
    ];
    const result = classifySignals(signals);
    expect(result.signalBreakdown).toEqual({
      bash_deterministic: 2,
      semantic_cluster: 1,
    });
  });

  it('signalBreakdown accumulates count from signal.count', () => {
    const signals: ObservationSignal[] = [
      { type: 'bash_deterministic', count: 3 },
      { type: 'semantic_cluster', count: 2 },
    ];
    const result = classifySignals(signals);
    expect(result.signalBreakdown).toEqual({
      bash_deterministic: 3,
      semantic_cluster: 2,
    });
  });
});
