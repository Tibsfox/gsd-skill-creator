import { describe, it, expect } from 'vitest';
import { translateTransition, formatAdvice, type MediationAdvice } from './cluster-translator.js';
import type { SequenceRecord } from './sequence-recorder.js';

function makeRecord(overrides: Partial<SequenceRecord> = {}): SequenceRecord {
  return {
    sequenceId: 'arc-test',
    step: 1,
    operationType: 'BUILD',
    agent: 'test',
    clusterSource: 'bridge-zone',
    clusterTarget: 'bridge-zone',
    transitionDistance: 0,
    failureRisks: [],
    riskConfidence: 0,
    timestamp: Date.now(),
    feedbackRef: 'op-1',
    ...overrides,
  };
}

describe('ClusterTranslator', () => {
  describe('translateTransition', () => {
    it('returns no advice for intra-cluster operations', () => {
      const record = makeRecord({
        clusterSource: 'creative-nexus',
        clusterTarget: 'creative-nexus',
        transitionDistance: 0,
      });
      expect(translateTransition(record)).toEqual([]);
    });

    it('returns critical advice for direct Creative <-> Rigor transition', () => {
      const record = makeRecord({
        clusterSource: 'creative-nexus',
        clusterTarget: 'rigor-spine',
        transitionDistance: 0.972,
      });
      const advice = translateTransition(record);
      expect(advice).toHaveLength(1);
      expect(advice[0].severity).toBe('critical');
      expect(advice[0].risk).toBe('communication-failure');
      expect(advice[0].action).toBe('mediate');
    });

    it('returns info for Creative <-> Bridge transition', () => {
      const record = makeRecord({
        clusterSource: 'creative-nexus',
        clusterTarget: 'bridge-zone',
        transitionDistance: 0.410,
      });
      const advice = translateTransition(record);
      expect(advice).toHaveLength(1);
      expect(advice[0].severity).toBe('info');
      expect(advice[0].action).toBe('continue');
    });

    it('returns warning for Bridge <-> Rigor transition', () => {
      const record = makeRecord({
        clusterSource: 'bridge-zone',
        clusterTarget: 'rigor-spine',
        transitionDistance: 0.570,
      });
      const advice = translateTransition(record);
      expect(advice).toHaveLength(1);
      expect(advice[0].severity).toBe('warning');
      expect(advice[0].action).toBe('verify');
    });

    it('handles reverse direction (Rigor -> Creative)', () => {
      const record = makeRecord({
        clusterSource: 'rigor-spine',
        clusterTarget: 'creative-nexus',
        transitionDistance: 0.972,
      });
      const advice = translateTransition(record);
      expect(advice).toHaveLength(1);
      expect(advice[0].severity).toBe('critical');
      expect(advice[0].action).toBe('mediate');
    });
  });

  describe('formatAdvice', () => {
    const advice: MediationAdvice = {
      risk: 'communication-failure',
      severity: 'critical',
      learnerMessage: 'This is a big shift.',
      maintainerMessage: 'Direct Creative Nexus -> Rigor Spine transition.',
      action: 'mediate',
      transition: { source: 'creative-nexus', target: 'rigor-spine', distance: 0.972 },
    };

    it('formats L0 as learner message only', () => {
      expect(formatAdvice(advice, 'L0')).toBe('This is a big shift.');
    });

    it('formats L1 with cluster names and action', () => {
      const result = formatAdvice(advice, 'L1');
      expect(result).toContain('Creative Nexus');
      expect(result).toContain('Rigor Spine');
      expect(result).toContain('mediate');
    });

    it('formats L2 with full technical detail', () => {
      const result = formatAdvice(advice, 'L2');
      expect(result).toContain('CRITICAL');
      expect(result).toContain('0.972');
      expect(result).toContain('communication-failure');
    });
  });
});
