import { describe, it, expect } from 'vitest';
import { generateActionItems } from '../../../src/retro/action-generator.js';
import type { CalibrationDelta, ChangelogEntry } from '../../../src/retro/types.js';
import type { ObservationSummary } from '../../../src/retro/observation-harvester.js';

describe('action-generator', () => {
  describe('calibration action items', () => {
    it('generates action items from over-estimates', () => {
      const deltas: CalibrationDelta[] = [
        {
          metric_name: 'wall_time_minutes',
          estimated: 90,
          actual: 135,
          ratio: 1.5,
          direction: 'over',
        },
      ];

      const items = generateActionItems({ deltas });

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('calibration');
      expect(items[0].priority).toBe('high');
      expect(items[0].description).toContain('Reduce');
      expect(items[0].description).toContain('wall_time_minutes');
    });

    it('generates action items from under-estimates', () => {
      const deltas: CalibrationDelta[] = [
        {
          metric_name: 'total_tokens',
          estimated: 100000,
          actual: 60000,
          ratio: 0.6,
          direction: 'under',
        },
      ];

      const items = generateActionItems({ deltas });

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('calibration');
      expect(items[0].priority).toBe('high');
      expect(items[0].description).toContain('Increase');
      expect(items[0].description).toContain('total_tokens');
    });

    it('skips accurate calibration deltas', () => {
      const deltas: CalibrationDelta[] = [
        {
          metric_name: 'sessions',
          estimated: 3,
          actual: 3,
          ratio: 1.0,
          direction: 'accurate',
        },
      ];

      const items = generateActionItems({ deltas });

      expect(items).toHaveLength(0);
    });
  });

  describe('changelog action items', () => {
    it('generates action items for LEVERAGE_NOW features', () => {
      const changelog: ChangelogEntry[] = [
        {
          name: 'Agent Teams',
          classification: 'LEVERAGE_NOW',
          impact: 'Multi-agent support available',
          action: 'Integrate into executor pipeline',
        },
      ];

      const items = generateActionItems({ deltas: [], changelog });

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('changelog');
      expect(items[0].priority).toBe('high');
      expect(items[0].description).toContain('Adopt');
      expect(items[0].description).toContain('Agent Teams');
    });

    it('generates action items for PLAN_FOR features', () => {
      const changelog: ChangelogEntry[] = [
        {
          name: 'MCP v2',
          classification: 'PLAN_FOR',
          impact: 'Better tool integration',
          action: 'Review migration guide',
        },
      ];

      const items = generateActionItems({ deltas: [], changelog });

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('changelog');
      expect(items[0].priority).toBe('medium');
      expect(items[0].description).toContain('Plan for');
      expect(items[0].description).toContain('MCP v2');
    });
  });

  describe('observation action items', () => {
    it('generates action items from skill suggestions', () => {
      const observations: ObservationSummary = {
        new_patterns: [],
        skill_suggestions: ['auto-format on save'],
        promotion_candidates: [],
      };

      const items = generateActionItems({ deltas: [], observations });

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('observation');
      expect(items[0].priority).toBe('medium');
      expect(items[0].description).toContain('Create skill for');
      expect(items[0].description).toContain('auto-format on save');
    });

    it('generates action items from promotion candidates', () => {
      const observations: ObservationSummary = {
        new_patterns: [],
        skill_suggestions: [],
        promotion_candidates: ['pattern-x'],
      };

      const items = generateActionItems({ deltas: [], observations });

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('observation');
      expect(items[0].priority).toBe('low');
      expect(items[0].description).toContain('Evaluate promotion');
      expect(items[0].description).toContain('pattern-x');
    });
  });

  describe('combined and sorted', () => {
    it('combines all sources and sorts by priority', () => {
      const deltas: CalibrationDelta[] = [
        {
          metric_name: 'wall_time',
          estimated: 90,
          actual: 135,
          ratio: 1.5,
          direction: 'over',
        },
      ];

      const changelog: ChangelogEntry[] = [
        {
          name: 'New Feature',
          classification: 'PLAN_FOR',
          impact: 'Some impact',
          action: 'Review',
        },
      ];

      const observations: ObservationSummary = {
        new_patterns: ['wave-pattern'],
        skill_suggestions: ['auto-lint'],
        promotion_candidates: ['skill-y'],
      };

      const items = generateActionItems({ deltas, changelog, observations });

      // Should have: 1 calibration (high) + 1 changelog (medium) + 1 skill suggestion (medium) + 1 promotion (low)
      // new_patterns don't generate action items
      expect(items).toHaveLength(4);

      // Sorted: high first, then medium, then low
      expect(items[0].priority).toBe('high');
      expect(items[1].priority).toBe('medium');
      expect(items[2].priority).toBe('medium');
      expect(items[3].priority).toBe('low');
    });
  });
});
