import { describe, it, expect } from 'vitest';
import { generateGapReport } from '../../../src/dogfood/verification/gap-report-generator.js';
import type { GapRecord, GapType, GapSeverity } from '../../../src/dogfood/verification/types.js';
import { GAP_TYPES, GAP_SEVERITIES } from '../../../src/dogfood/verification/types.js';

// --- Helpers ---

let gapCounter = 0;

function makeGap(overrides: Partial<GapRecord> = {}): GapRecord {
  gapCounter++;
  return {
    id: `gap-test-${gapCounter}`,
    type: 'missing-in-ecosystem' as GapType,
    severity: 'minor' as GapSeverity,
    concept: 'test concept',
    textbookSource: 'Chapter 1',
    ecosystemSource: 'test-doc.md',
    textbookClaim: 'Textbook says X',
    ecosystemClaim: 'Ecosystem says Y',
    analysis: 'Test analysis',
    suggestedResolution: 'Test resolution',
    affectsComponents: ['test-component'],
    ...overrides,
  };
}

// --- Tests ---

describe('gap-report-generator', () => {
  describe('generateGapReport', () => {
    it('merges gaps from three tracks into single list', () => {
      const trackA = [
        makeGap({ concept: 'a1' }), makeGap({ concept: 'a2' }),
        makeGap({ concept: 'a3' }), makeGap({ concept: 'a4' }), makeGap({ concept: 'a5' }),
      ];
      const trackB = [makeGap({ concept: 'b1' }), makeGap({ concept: 'b2' }), makeGap({ concept: 'b3' })];
      const trackC = [makeGap({ concept: 'c1' }), makeGap({ concept: 'c2' })];

      const report = generateGapReport({ trackA, trackB, trackC });

      expect(report.result.gaps).toHaveLength(10);
    });

    it('deduplicates gaps with same concept and same type', () => {
      const trackA = [
        makeGap({ concept: 'calculus', type: 'incomplete', analysis: 'Track A analysis' }),
      ];
      const trackB = [
        makeGap({ concept: 'calculus', type: 'incomplete', analysis: 'Track B analysis' }),
      ];
      const trackC: GapRecord[] = [];

      const report = generateGapReport({ trackA, trackB, trackC });

      // Should deduplicate: same concept + same type = 1 record
      const calculusGaps = report.result.gaps.filter(g => g.concept === 'calculus');
      expect(calculusGaps).toHaveLength(1);
    });

    it('preserves both track sources when deduplicating', () => {
      const trackA = [
        makeGap({
          concept: 'calculus',
          type: 'incomplete',
          analysis: 'Track A found incomplete coverage',
        }),
      ];
      const trackB = [
        makeGap({
          concept: 'calculus',
          type: 'incomplete',
          analysis: 'Track B also found incomplete coverage',
        }),
      ];
      const trackC: GapRecord[] = [];

      const report = generateGapReport({ trackA, trackB, trackC });

      const calcGap = report.result.gaps.find(g => g.concept === 'calculus');
      expect(calcGap).toBeDefined();
      expect(calcGap!.analysis).toContain('Track A');
      expect(calcGap!.analysis).toContain('Track B');
    });

    it('counts gaps by type in statistics', () => {
      const trackA = [
        makeGap({ type: 'verified' }),
        makeGap({ type: 'verified', concept: 'different1' }),
        makeGap({ type: 'incomplete' }),
      ];

      const report = generateGapReport({ trackA, trackB: [], trackC: [] });

      expect(report.result.statistics.byType['verified']).toBe(2);
      expect(report.result.statistics.byType['incomplete']).toBe(1);
    });

    it('counts gaps by severity in statistics', () => {
      const trackA = [
        makeGap({ severity: 'critical', concept: 'sev-c1' }),
        makeGap({ severity: 'critical', concept: 'sev-c2' }),
        makeGap({ severity: 'minor', concept: 'sev-c3' }),
      ];

      const report = generateGapReport({ trackA, trackB: [], trackC: [] });

      expect(report.result.statistics.bySeverity['critical']).toBe(2);
      expect(report.result.statistics.bySeverity['minor']).toBe(1);
    });

    it('counts gaps by document in statistics', () => {
      const trackA = [
        makeGap({ ecosystemSource: 'gsd-mathematical-foundations-conversation.md', concept: 'c1' }),
        makeGap({ ecosystemSource: 'gsd-mathematical-foundations-conversation.md', concept: 'c2' }),
        makeGap({ ecosystemSource: 'gsd-silicon-layer-spec.md', concept: 'c3' }),
      ];

      const report = generateGapReport({ trackA, trackB: [], trackC: [] });

      expect(report.result.statistics.byDocument['gsd-mathematical-foundations-conversation.md']).toBe(2);
      expect(report.result.statistics.byDocument['gsd-silicon-layer-spec.md']).toBe(1);
    });

    it('total equals number of gaps after deduplication', () => {
      const trackA = [
        makeGap({ concept: 'alpha', type: 'verified' }),
        makeGap({ concept: 'beta', type: 'incomplete' }),
      ];
      const trackB = [
        makeGap({ concept: 'alpha', type: 'verified' }), // duplicate
        makeGap({ concept: 'gamma', type: 'minor' as GapType }),
      ];

      const report = generateGapReport({ trackA, trackB, trackC: [] });

      expect(report.result.statistics.total).toBe(report.result.gaps.length);
    });

    it('handles empty gap list', () => {
      const report = generateGapReport({ trackA: [], trackB: [], trackC: [] });

      expect(report.result.gaps).toHaveLength(0);
      expect(report.result.statistics.total).toBe(0);

      // All type counts should be 0
      for (const type of GAP_TYPES) {
        expect(report.result.statistics.byType[type]).toBe(0);
      }

      // All severity counts should be 0
      for (const severity of GAP_SEVERITIES) {
        expect(report.result.statistics.bySeverity[severity]).toBe(0);
      }
    });

    it('gap IDs are unique after deduplication', () => {
      const trackA = [makeGap(), makeGap({ concept: 'c2' }), makeGap({ concept: 'c3' })];
      const trackB = [makeGap({ concept: 'c4' }), makeGap({ concept: 'c5' })];

      const report = generateGapReport({ trackA, trackB, trackC: [] });

      const ids = report.result.gaps.map(g => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('returns VerificationResult with gaps and statistics', () => {
      const trackA = [makeGap()];

      const report = generateGapReport({ trackA, trackB: [], trackC: [] });

      expect(report.result).toBeDefined();
      expect(report.result.gaps).toBeDefined();
      expect(report.result.statistics).toBeDefined();
      expect(report.trackSources).toBeDefined();
      expect(report.trackSources.trackA).toBe('Concept Coverage Audit');
      expect(report.trackSources.trackB).toBe('Cross-Document Consistency');
      expect(report.trackSources.trackC).toBe('Eight-Layer Progression');
      expect(report.generatedAt).toBeDefined();
    });

    it('VERIFY-06: no duplicate gaps in output', () => {
      const trackA = [
        makeGap({ concept: 'topology', type: 'missing-in-ecosystem' }),
        makeGap({ concept: 'algebra', type: 'verified' }),
      ];
      const trackB = [
        makeGap({ concept: 'topology', type: 'missing-in-ecosystem' }), // duplicate
        makeGap({ concept: 'topology', type: 'incomplete' }), // different type = not duplicate
      ];
      const trackC = [
        makeGap({ concept: 'algebra', type: 'verified' }), // duplicate
      ];

      const report = generateGapReport({ trackA, trackB, trackC });

      // Check that every (concept, type) pair appears at most once
      const pairs = report.result.gaps.map(g => `${g.concept}|${g.type}`);
      const uniquePairs = new Set(pairs);
      expect(uniquePairs.size).toBe(pairs.length);
    });

    it('VERIFY-07: statistics summary complete', () => {
      const trackA = [makeGap({ type: 'verified' })];

      const report = generateGapReport({ trackA, trackB: [], trackC: [] });

      // byType has entry for all 8 types
      for (const type of GAP_TYPES) {
        expect(report.result.statistics.byType[type]).toBeDefined();
        expect(typeof report.result.statistics.byType[type]).toBe('number');
      }

      // bySeverity has entry for all 4 severities
      for (const severity of GAP_SEVERITIES) {
        expect(report.result.statistics.bySeverity[severity]).toBeDefined();
        expect(typeof report.result.statistics.bySeverity[severity]).toBe('number');
      }
    });
  });
});
