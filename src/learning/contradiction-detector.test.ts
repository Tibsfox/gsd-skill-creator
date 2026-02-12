import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContradictionDetector } from './contradiction-detector.js';
import { FeedbackStore } from './feedback-store.js';
import type { FeedbackEvent } from '../types/learning.js';

vi.mock('./feedback-store.js');

function makeFeedback(overrides: Partial<FeedbackEvent>): FeedbackEvent {
  return {
    id: 'test-' + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
    type: 'correction',
    skillName: 'test-skill',
    sessionId: 'session-1',
    ...overrides,
  };
}

describe('ContradictionDetector', () => {
  let feedbackStore: FeedbackStore;
  let detector: ContradictionDetector;

  beforeEach(() => {
    feedbackStore = new FeedbackStore('/fake/patterns');
    detector = new ContradictionDetector(feedbackStore);
  });

  it('should return no contradictions when corrections are consistent', async () => {
    // All corrections change "foo" to "bar" -- consistent
    const corrections = [
      makeFeedback({ original: 'use foo', corrected: 'use bar' }),
      makeFeedback({ original: 'use foo', corrected: 'use bar' }),
      makeFeedback({ original: 'use foo', corrected: 'use bar' }),
    ];
    vi.mocked(feedbackStore.getCorrections).mockResolvedValue(corrections);

    const result = await detector.detect('test-skill');

    expect(result.contradictions).toHaveLength(0);
    expect(result.hasConflicts).toBe(false);
  });

  it('should detect direct reversal contradiction', async () => {
    // Correction 1: "use tabs" -> "use spaces"
    // Correction 2: "use spaces" -> "use tabs" (reversal!)
    const corrections = [
      makeFeedback({ original: 'use tabs', corrected: 'use spaces' }),
      makeFeedback({ original: 'use spaces', corrected: 'use tabs' }),
    ];
    vi.mocked(feedbackStore.getCorrections).mockResolvedValue(corrections);

    const result = await detector.detect('test-skill');

    expect(result.contradictions.length).toBeGreaterThanOrEqual(1);
    expect(result.hasConflicts).toBe(true);
    const conflict = result.contradictions.find(c => c.severity === 'conflict');
    expect(conflict).toBeDefined();
    expect(conflict!.description).toContain('reversal');
  });

  it('should detect contradiction when A changes X->Y and B changes Y->X', async () => {
    const corrections = [
      makeFeedback({ original: 'always semicolons', corrected: 'never semicolons' }),
      makeFeedback({ original: 'never semicolons', corrected: 'always semicolons' }),
    ];
    vi.mocked(feedbackStore.getCorrections).mockResolvedValue(corrections);

    const result = await detector.detect('test-skill');

    expect(result.contradictions.length).toBeGreaterThanOrEqual(1);
    const conflict = result.contradictions.find(c => c.severity === 'conflict');
    expect(conflict).toBeDefined();
  });

  it('should return hasConflicts=true when severity conflict exists', async () => {
    const corrections = [
      makeFeedback({ original: 'prefer classes', corrected: 'prefer functions' }),
      makeFeedback({ original: 'prefer functions', corrected: 'prefer classes' }),
    ];
    vi.mocked(feedbackStore.getCorrections).mockResolvedValue(corrections);

    const result = await detector.detect('test-skill');

    expect(result.hasConflicts).toBe(true);
  });

  it('should return empty result for skill with no corrections', async () => {
    vi.mocked(feedbackStore.getCorrections).mockResolvedValue([]);

    const result = await detector.detect('test-skill');

    expect(result.contradictions).toHaveLength(0);
    expect(result.hasConflicts).toBe(false);
    expect(result.summary).toContain('No contradictions');
  });

  it('should generate meaningful summary string', async () => {
    const corrections = [
      makeFeedback({ original: 'use var', corrected: 'use const' }),
      makeFeedback({ original: 'use const', corrected: 'use var' }),
    ];
    vi.mocked(feedbackStore.getCorrections).mockResolvedValue(corrections);

    const result = await detector.detect('test-skill');

    expect(result.summary).toMatch(/contradiction/i);
    expect(result.summary).toMatch(/conflict/i);
  });
});
