/**
 * @file Lessons-learned catalog builder and pattern detector tests
 * @description Tests buildLessonsCatalog and flagRecurringPatterns functions
 *              for cumulative catalog building and recurring pattern detection.
 */
import { describe, expect, it } from 'vitest';
import { buildLessonsCatalog, flagRecurringPatterns } from '../../../src/tools/commands/lessons-chain/chain-catalog.js';
import { DEFAULT_CHAIN_CONFIG } from '../../../src/tools/commands/lessons-chain/chain-types.js';
import type { ChainConfig, LessonEntry } from '../../../src/tools/commands/lessons-chain/chain-types.js';

function makeLessonEntry(overrides: Partial<LessonEntry> = {}): LessonEntry {
  return {
    id: 'L1',
    title: 'Test Lesson',
    observation: 'Observed something',
    connection: 'Connected to foundation',
    actionItem: 'Do something next',
    recurrenceCount: 1,
    firstSeenMilestone: 'v1.50.14',
    tags: ['test'],
    ...overrides,
  };
}

describe('buildLessonsCatalog', () => {
  it('should populate milestoneRange from input', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [],
    });
    expect(result.milestoneRange).toEqual({ from: 'v1.50.14', to: 'v1.50.20' });
  });

  it('should return empty catalog when lessonsByMilestone is empty', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [],
    });
    expect(result.entries).toEqual([]);
    expect(result.totalLessons).toBe(0);
    expect(result.uniquePatterns).toBe(0);
    expect(result.promotedPatterns).toEqual([]);
  });

  it('should accumulate entries from multiple milestones', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1' })],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [makeLessonEntry({ id: 'L2', tags: ['pacing'] })],
        },
        {
          milestoneId: 'v1.50.16',
          lessons: [makeLessonEntry({ id: 'L3', tags: ['enforcement'] })],
        },
      ],
    });
    expect(result.entries).toHaveLength(3);
    expect(result.totalLessons).toBe(3);
  });

  it('should merge duplicate lesson ids by summing recurrenceCount', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 1 })],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 2 })],
        },
      ],
    });
    expect(result.entries).toHaveLength(1);
    const mergedEntry = result.entries[0];
    expect(mergedEntry.recurrenceCount).toBe(3);
  });

  it('should keep earliest firstSeenMilestone when merging', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', firstSeenMilestone: 'v1.50.14' })],
        },
        {
          milestoneId: 'v1.50.16',
          lessons: [makeLessonEntry({ id: 'L1', firstSeenMilestone: 'v1.50.16' })],
        },
      ],
    });
    const mergedEntry = result.entries[0];
    expect(mergedEntry.firstSeenMilestone).toBe('v1.50.14');
  });

  it('should count totalLessons as merged entry count', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1' }),
            makeLessonEntry({ id: 'L2' }),
          ],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [
            makeLessonEntry({ id: 'L1' }), // duplicate, will merge
            makeLessonEntry({ id: 'L3' }),
          ],
        },
      ],
    });
    // L1 merged, L2, L3 = 3 total
    expect(result.totalLessons).toBe(3);
  });

  it('should count uniquePatterns as distinct tags across all entries', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', tags: ['pacing', 'enforcement'] })],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [makeLessonEntry({ id: 'L2', tags: ['pacing', 'batch'] })],
        },
      ],
    });
    // Tags: pacing, enforcement, batch = 3 unique
    expect(result.uniquePatterns).toBe(3);
  });

  it('should initially have empty promotedPatterns', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 99 })],
        },
      ],
    });
    expect(result.promotedPatterns).toEqual([]);
  });

  it('should handle single milestone with entries correctly', () => {
    const lessons = [
      makeLessonEntry({ id: 'L1' }),
      makeLessonEntry({ id: 'L2', tags: ['other'] }),
    ];
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.14' },
      lessonsByMilestone: [{ milestoneId: 'v1.50.14', lessons }],
    });
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].id).toBe('L1');
    expect(result.entries[1].id).toBe('L2');
  });

  it('should preserve lesson fields through merge (title, observation, connection, actionItem)', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.15' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', title: 'Old Title' })],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [makeLessonEntry({ id: 'L1', title: 'New Title', observation: 'Updated obs' })],
        },
      ],
    });
    const entry = result.entries[0];
    // Most recent occurrence fields preserved
    expect(entry.title).toBe('New Title');
    expect(entry.observation).toBe('Updated obs');
  });

  // Adversarial: empty lessons array for a milestone does not break
  it('should handle milestone with empty lessons array', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        { milestoneId: 'v1.50.14', lessons: [makeLessonEntry({ id: 'L1' })] },
        { milestoneId: 'v1.50.15', lessons: [] },
        { milestoneId: 'v1.50.16', lessons: [makeLessonEntry({ id: 'L2' })] },
      ],
    });
    expect(result.entries).toHaveLength(2);
    expect(result.totalLessons).toBe(2);
  });

  // Adversarial: three milestones with overlapping ids
  it('should correctly merge across three milestones with overlapping ids', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.16' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 1, tags: ['a'] })],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 1, tags: ['b'] })],
        },
        {
          milestoneId: 'v1.50.16',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 1, tags: ['c'] })],
        },
      ],
    });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].recurrenceCount).toBe(3);
    // Tags merged: a, b, c
    expect(result.entries[0].tags).toContain('a');
    expect(result.entries[0].tags).toContain('b');
    expect(result.entries[0].tags).toContain('c');
  });

  // Adversarial: tags accumulate correctly in uniquePatterns
  it('should count merged tags correctly in uniquePatterns', () => {
    const result = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.15' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', tags: ['tag1', 'tag2'] })],
        },
        {
          milestoneId: 'v1.50.15',
          lessons: [makeLessonEntry({ id: 'L1', tags: ['tag2', 'tag3'] })],
        },
      ],
    });
    // After merge: L1 has tags [tag1, tag2, tag3]
    expect(result.uniquePatterns).toBe(3);
  });
});

describe('flagRecurringPatterns', () => {
  it('should return promotedPatterns with ids of entries meeting threshold', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1', recurrenceCount: 3 }),
            makeLessonEntry({ id: 'L2', recurrenceCount: 1 }),
            makeLessonEntry({ id: 'L3', recurrenceCount: 5 }),
          ],
        },
      ],
    });
    const result = flagRecurringPatterns(DEFAULT_CHAIN_CONFIG, catalog);
    expect(result.promotedPatterns).toContain('L1');
    expect(result.promotedPatterns).toContain('L3');
    expect(result.promotedPatterns).not.toContain('L2');
  });

  it('should return empty promotedPatterns when no entries meet threshold', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1', recurrenceCount: 1 }),
            makeLessonEntry({ id: 'L2', recurrenceCount: 2 }),
          ],
        },
      ],
    });
    const result = flagRecurringPatterns(DEFAULT_CHAIN_CONFIG, catalog);
    expect(result.promotedPatterns).toEqual([]);
  });

  it('should NOT mutate the input catalog', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 5 })],
        },
      ],
    });
    const originalPromoted = [...catalog.promotedPatterns];
    flagRecurringPatterns(DEFAULT_CHAIN_CONFIG, catalog);
    expect(catalog.promotedPatterns).toEqual(originalPromoted);
  });

  it('should respect configurable threshold (not hardcoded to 3)', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1', recurrenceCount: 2 }),
            makeLessonEntry({ id: 'L2', recurrenceCount: 5 }),
          ],
        },
      ],
    });

    // With threshold 1, both should be promoted
    const lowThreshold: ChainConfig = { ...DEFAULT_CHAIN_CONFIG, patternPromotionThreshold: 1 };
    const lowResult = flagRecurringPatterns(lowThreshold, catalog);
    expect(lowResult.promotedPatterns).toContain('L1');
    expect(lowResult.promotedPatterns).toContain('L2');

    // With threshold 10, neither should be promoted
    const highThreshold: ChainConfig = { ...DEFAULT_CHAIN_CONFIG, patternPromotionThreshold: 10 };
    const highResult = flagRecurringPatterns(highThreshold, catalog);
    expect(highResult.promotedPatterns).toEqual([]);
  });

  it('should preserve other catalog fields unchanged', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1', recurrenceCount: 5, tags: ['a', 'b'] }),
            makeLessonEntry({ id: 'L2', recurrenceCount: 1, tags: ['c'] }),
          ],
        },
      ],
    });
    const result = flagRecurringPatterns(DEFAULT_CHAIN_CONFIG, catalog);
    expect(result.milestoneRange).toEqual(catalog.milestoneRange);
    expect(result.entries).toEqual(catalog.entries);
    expect(result.totalLessons).toBe(catalog.totalLessons);
    expect(result.uniquePatterns).toBe(catalog.uniquePatterns);
  });

  // Adversarial: different thresholds produce different promoted patterns
  it('should produce different promoted patterns for same catalog with different thresholds', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 3 })],
        },
      ],
    });
    const low: ChainConfig = { ...DEFAULT_CHAIN_CONFIG, patternPromotionThreshold: 2 };
    const high: ChainConfig = { ...DEFAULT_CHAIN_CONFIG, patternPromotionThreshold: 5 };
    const lowResult = flagRecurringPatterns(low, catalog);
    const highResult = flagRecurringPatterns(high, catalog);
    expect(lowResult.promotedPatterns).not.toEqual(highResult.promotedPatterns);
  });

  // Adversarial: threshold of 0 promotes all entries
  it('should promote all entries when threshold is 0', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1', recurrenceCount: 0 }),
            makeLessonEntry({ id: 'L2', recurrenceCount: 1 }),
          ],
        },
      ],
    });
    const config: ChainConfig = { ...DEFAULT_CHAIN_CONFIG, patternPromotionThreshold: 0 };
    const result = flagRecurringPatterns(config, catalog);
    expect(result.promotedPatterns).toContain('L1');
    expect(result.promotedPatterns).toContain('L2');
  });

  // Adversarial: empty catalog entries
  it('should return empty promotedPatterns for empty catalog', () => {
    const catalog = buildLessonsCatalog({
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      lessonsByMilestone: [],
    });
    const result = flagRecurringPatterns(DEFAULT_CHAIN_CONFIG, catalog);
    expect(result.promotedPatterns).toEqual([]);
  });
});
