/**
 * Mind-Body Calibration Tests
 *
 * Tests for registerMindBodyModels (calibration wiring) and
 * PatternDetector (5-pattern detection from journal data).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CalibrationDelta } from '../../../rosetta-core/types.js';
import { CalibrationEngine } from '../../../calibration/engine.js';
import {
  registerMindBodyModels,
  consistencyModel,
  preferenceModel,
  energyModel,
} from './mind-body-calibration.js';
import { PatternDetector } from './pattern-detector.js';
import type { DetectedPattern } from './pattern-detector.js';
import type { JournalEntry, MindBodyWingId } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a minimal delta store for engine construction. */
function makeDeltaStore() {
  const deltas: CalibrationDelta[] = [];
  return {
    save: async (d: CalibrationDelta) => { deltas.push(d); },
    getHistory: async () => [...deltas],
  };
}

/** Create a journal entry for a given date offset from today. */
function makeEntry(daysAgo: number, overrides: Partial<JournalEntry> = {}): JournalEntry {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return {
    date,
    durationMinutes: 15,
    modules: ['yoga'] as MindBodyWingId[],
    energyBefore: 3 as const,
    energyAfter: 4 as const,
    ...overrides,
  };
}

/** Create N entries, all with the same module, for consecutive days. */
function makeModuleEntries(count: number, module: MindBodyWingId): JournalEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeEntry(count - 1 - i, { modules: [module] }),
  );
}

/** Find a pattern by type in results. */
function findPattern(patterns: DetectedPattern[], type: string): DetectedPattern | undefined {
  return patterns.find((p) => p.type === type);
}

// ─── Calibration Wiring Tests ───────────────────────────────────────────────

describe('registerMindBodyModels', () => {
  it('registers all 3 models without throwing', () => {
    const engine = new CalibrationEngine(makeDeltaStore());
    expect(() => registerMindBodyModels(engine)).not.toThrow();
  });

  it('throws if models already registered', () => {
    const engine = new CalibrationEngine(makeDeltaStore());
    registerMindBodyModels(engine);
    expect(() => registerMindBodyModels(engine)).toThrow(/already registered/);
  });

  it('consistency model has correct domain', () => {
    expect(consistencyModel.domain).toBe('mind-body-consistency');
    expect(consistencyModel.parameters.length).toBeGreaterThan(0);
  });

  it('preference model has correct domain', () => {
    expect(preferenceModel.domain).toBe('mind-body-preference');
    expect(preferenceModel.parameters.length).toBeGreaterThan(0);
  });

  it('energy model has correct domain', () => {
    expect(energyModel.domain).toBe('mind-body-energy');
    expect(energyModel.parameters.length).toBeGreaterThan(0);
  });

  it('all models implement computeAdjustment', () => {
    const delta = { category: 'test', magnitude: 1.0, direction: 'over' as const };
    expect(typeof consistencyModel.computeAdjustment(delta)).toBe('object');
    expect(typeof preferenceModel.computeAdjustment(delta)).toBe('object');
    expect(typeof energyModel.computeAdjustment(delta)).toBe('object');
  });

  it('all models implement confidence', () => {
    const delta = { category: 'test', magnitude: 1.0, direction: 'under' as const };
    expect(consistencyModel.confidence(delta)).toBeGreaterThanOrEqual(0);
    expect(consistencyModel.confidence(delta)).toBeLessThanOrEqual(1);
    expect(preferenceModel.confidence(delta)).toBeGreaterThanOrEqual(0);
    expect(preferenceModel.confidence(delta)).toBeLessThanOrEqual(1);
    expect(energyModel.confidence(delta)).toBeGreaterThanOrEqual(0);
    expect(energyModel.confidence(delta)).toBeLessThanOrEqual(1);
  });
});

// ─── PatternDetector Tests ──────────────────────────────────────────────────

describe('PatternDetector', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
  });

  describe('minimum entry threshold', () => {
    it('returns empty array for fewer than 5 entries', () => {
      const entries = [makeEntry(0), makeEntry(1), makeEntry(2), makeEntry(3)];
      expect(detector.detectPatterns(entries)).toEqual([]);
    });

    it('returns empty array for 0 entries', () => {
      expect(detector.detectPatterns([])).toEqual([]);
    });

    it('begins detecting at 5 entries', () => {
      const entries = makeModuleEntries(5, 'yoga');
      const patterns = detector.detectPatterns(entries);
      // At least one pattern is expected
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('consistency pattern', () => {
    it('detects consistent practice days', () => {
      // All entries on the same day of the week (consecutive Mondays)
      const entries: JournalEntry[] = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7)); // Every 7 days = same weekday
        date.setHours(12, 0, 0, 0);
        entries.push({
          date,
          durationMinutes: 15,
          modules: ['yoga'],
          energyBefore: 3,
          energyAfter: 4,
        });
      }

      const patterns = detector.detectPatterns(entries);
      const consistency = findPattern(patterns, 'consistency');
      expect(consistency).toBeDefined();
      expect(consistency!.confidence).toBeGreaterThan(0);
      expect(consistency!.confidence).toBeLessThanOrEqual(1);
      expect(consistency!.suggestion.length).toBeGreaterThan(0);
    });
  });

  describe('preference pattern', () => {
    it('detects repeated module as preference', () => {
      // 8 yoga entries, 2 breath entries
      const entries = [
        ...makeModuleEntries(8, 'yoga'),
        makeEntry(9, { modules: ['breath'] }),
        makeEntry(10, { modules: ['breath'] }),
      ];

      const patterns = detector.detectPatterns(entries);
      const preference = findPattern(patterns, 'preference');
      expect(preference).toBeDefined();
      expect(preference!.description).toContain('Yoga');
      expect(preference!.confidence).toBeGreaterThan(0);
      expect(preference!.confidence).toBeLessThanOrEqual(1);
      expect(preference!.suggestion.length).toBeGreaterThan(0);
    });
  });

  describe('avoidance pattern', () => {
    it('detects never-used modules', () => {
      // Only yoga and breath used, many other modules available
      const entries = [
        ...makeModuleEntries(10, 'yoga'),
        makeEntry(11, { modules: ['breath'] }),
        makeEntry(12, { modules: ['breath'] }),
        makeEntry(13, { modules: ['yoga'] }),
        makeEntry(14, { modules: ['breath'] }),
        makeEntry(15, { modules: ['yoga'] }),
      ];

      const patterns = detector.detectPatterns(entries);
      const avoidance = findPattern(patterns, 'avoidance');
      expect(avoidance).toBeDefined();
      expect(avoidance!.confidence).toBeGreaterThan(0);
      expect(avoidance!.confidence).toBeLessThanOrEqual(1);
      expect(avoidance!.suggestion.length).toBeGreaterThan(0);
    });

    it('avoidance suggestion uses constructive language', () => {
      const entries = makeModuleEntries(15, 'yoga');
      const patterns = detector.detectPatterns(entries);
      const avoidance = findPattern(patterns, 'avoidance');
      if (avoidance) {
        const lower = avoidance.suggestion.toLowerCase();
        expect(lower).not.toContain('should');
        expect(lower).not.toContain('must');
        expect(lower).not.toContain('need to');
        expect(lower).not.toContain('failing');
      }
    });
  });

  describe('energy pattern', () => {
    it('detects high energy after specific module', () => {
      const entries: JournalEntry[] = [
        // Yoga gives high energy
        makeEntry(0, { modules: ['yoga'], energyBefore: 2, energyAfter: 5 }),
        makeEntry(1, { modules: ['yoga'], energyBefore: 2, energyAfter: 5 }),
        makeEntry(2, { modules: ['yoga'], energyBefore: 3, energyAfter: 5 }),
        // Pilates gives lower energy
        makeEntry(3, { modules: ['pilates'], energyBefore: 3, energyAfter: 2 }),
        makeEntry(4, { modules: ['pilates'], energyBefore: 3, energyAfter: 2 }),
        makeEntry(5, { modules: ['pilates'], energyBefore: 3, energyAfter: 2 }),
      ];

      const patterns = detector.detectPatterns(entries);
      const energy = findPattern(patterns, 'energy');
      expect(energy).toBeDefined();
      expect(energy!.description.toLowerCase()).toContain('yoga');
      expect(energy!.confidence).toBeGreaterThan(0);
      expect(energy!.confidence).toBeLessThanOrEqual(1);
      expect(energy!.suggestion.length).toBeGreaterThan(0);
    });
  });

  describe('growth pattern', () => {
    it('detects increasing durations', () => {
      // Durations grow from 10 to 30 over time
      const entries: JournalEntry[] = [
        makeEntry(9, { durationMinutes: 10 }),
        makeEntry(8, { durationMinutes: 10 }),
        makeEntry(7, { durationMinutes: 12 }),
        makeEntry(6, { durationMinutes: 15 }),
        makeEntry(5, { durationMinutes: 15 }),
        makeEntry(4, { durationMinutes: 20 }),
        makeEntry(3, { durationMinutes: 25 }),
        makeEntry(2, { durationMinutes: 25 }),
        makeEntry(1, { durationMinutes: 30 }),
        makeEntry(0, { durationMinutes: 30 }),
      ];

      const patterns = detector.detectPatterns(entries);
      const growth = findPattern(patterns, 'growth');
      expect(growth).toBeDefined();
      expect(growth!.description).toContain('increased');
      expect(growth!.confidence).toBeGreaterThan(0);
      expect(growth!.confidence).toBeLessThanOrEqual(1);
      expect(growth!.suggestion.length).toBeGreaterThan(0);
    });

    it('does not detect growth when durations are flat', () => {
      const entries = makeModuleEntries(10, 'yoga'); // all 15 min
      const patterns = detector.detectPatterns(entries);
      const growth = findPattern(patterns, 'growth');
      expect(growth).toBeUndefined();
    });
  });

  describe('pattern properties', () => {
    it('all patterns have confidence between 0 and 1', () => {
      const entries = [
        ...makeModuleEntries(8, 'yoga'),
        makeEntry(9, { modules: ['breath'], energyAfter: 5 }),
        makeEntry(10, { modules: ['pilates'], energyAfter: 1 }),
        makeEntry(11, { durationMinutes: 5 }),
        makeEntry(12, { durationMinutes: 30 }),
      ];

      const patterns = detector.detectPatterns(entries);
      for (const pattern of patterns) {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('all patterns have non-empty suggestion', () => {
      const entries = [
        ...makeModuleEntries(8, 'yoga'),
        makeEntry(9, { modules: ['breath'] }),
        makeEntry(10, { modules: ['pilates'], energyAfter: 1 }),
        makeEntry(11, { durationMinutes: 5 }),
        makeEntry(12, { durationMinutes: 30 }),
      ];

      const patterns = detector.detectPatterns(entries);
      for (const pattern of patterns) {
        expect(pattern.suggestion.length).toBeGreaterThan(0);
      }
    });

    it('all patterns have non-empty description', () => {
      const entries = makeModuleEntries(10, 'tai-chi');
      const patterns = detector.detectPatterns(entries);
      for (const pattern of patterns) {
        expect(pattern.description.length).toBeGreaterThan(0);
      }
    });
  });
});
