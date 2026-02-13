import { describe, it, expect } from 'vitest';
import { PipelineSchema } from '../schema.js';
import type { Pipeline, MoveInstruction } from '../types.js';
import type { FeedbackRecord, LibraryEntry } from './types.js';
import {
  FeedbackEngine,
  DEFAULT_FEEDBACK_CONFIG,
  type FeedbackEngineConfig,
  type RefinementResult,
} from './feedback.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Factory for creating a minimal valid Pipeline.
 * Override metadata fields and provide custom MOVE instruction names.
 */
function makeList(overrides: {
  name?: string;
  confidence?: number;
  version?: number;
  moveSkills?: string[];
} = {}): Pipeline {
  const {
    name = 'test-list',
    confidence = 0.7,
    version = 1,
    moveSkills = ['git-commit'],
  } = overrides;

  const moveInstructions: MoveInstruction[] = moveSkills.map((skill) => ({
    type: 'move' as const,
    target: 'skill' as const,
    name: skill,
    mode: 'full' as const,
  }));

  return {
    metadata: {
      name,
      confidence,
      priority: 30,
      version,
    },
    instructions: [
      { type: 'wait' as const, event: 'phase-start' as const },
      ...moveInstructions,
    ],
  };
}

/**
 * Factory for creating a minimal valid LibraryEntry.
 * Wraps a Pipeline with default metadata.
 */
function makeEntry(overrides: {
  list?: Pipeline;
  workflowType?: string;
  version?: number;
  accuracy?: number;
  executionCount?: number;
  feedbackHistory?: FeedbackRecord[];
} = {}): LibraryEntry {
  const now = Date.now();
  const {
    list = makeList(),
    workflowType = 'test-workflow',
    version = 1,
    accuracy = 0,
    executionCount = 0,
    feedbackHistory = [],
  } = overrides;

  return {
    list,
    workflowType,
    version,
    createdAt: now - 86400_000,
    updatedAt: now,
    accuracy,
    executionCount,
    feedbackHistory,
  };
}

/**
 * Helper to create a FeedbackRecord for seeding feedbackHistory.
 */
function makeFeedbackRecord(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    listName: 'test-list',
    workflowType: 'test-workflow',
    timestamp: Date.now(),
    predicted: ['git-commit'],
    actual: ['git-commit'],
    accuracy: 1.0,
    refined: false,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('FeedbackEngine', () => {
  // --------------------------------------------------------------------------
  // recordFeedback() tests
  // --------------------------------------------------------------------------

  describe('recordFeedback()', () => {
    it('creates a FeedbackRecord with accuracy 1.0 on perfect match', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: ['git-commit', 'lint-fix'] });
      const entry = makeEntry({ list });

      const record = engine.recordFeedback(entry, ['git-commit', 'lint-fix']);

      expect(record.accuracy).toBe(1.0);
      expect(record.predicted).toEqual(['git-commit', 'lint-fix']);
      expect(record.actual).toEqual(['git-commit', 'lint-fix']);
      expect(record.listName).toBe('test-list');
      expect(record.refined).toBe(false);
    });

    it('calculates Jaccard similarity for partial overlap', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: ['git-commit', 'lint-fix', 'test-runner'] });
      const entry = makeEntry({ list });

      const record = engine.recordFeedback(entry, ['git-commit', 'deploy']);

      // Intersection: ['git-commit'] (1), Union: ['git-commit', 'lint-fix', 'test-runner', 'deploy'] (4)
      expect(record.accuracy).toBe(0.25);
    });

    it('returns accuracy 0 when no overlap between predicted and actual', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: ['git-commit'] });
      const entry = makeEntry({ list });

      const record = engine.recordFeedback(entry, ['deploy']);

      expect(record.accuracy).toBe(0);
    });

    it('returns accuracy 1.0 when both predicted and actual are empty', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: [] });
      const entry = makeEntry({ list });

      const record = engine.recordFeedback(entry, []);

      expect(record.accuracy).toBe(1.0);
    });

    it('accumulates records on a LibraryEntry', () => {
      const engine = new FeedbackEngine();
      const entry = makeEntry();

      engine.recordFeedback(entry, ['git-commit']);
      engine.recordFeedback(entry, ['git-commit']);
      engine.recordFeedback(entry, ['git-commit']);

      expect(entry.feedbackHistory.length).toBe(3);
      expect(entry.executionCount).toBe(3);
    });

    it('updates entry accuracy to rolling average of feedback history', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: ['git-commit', 'lint-fix'] });
      const entry = makeEntry({ list });

      // First: predicted ['git-commit', 'lint-fix'], actual ['git-commit'] => Jaccard 1/2 = 0.5
      // But we need specific accuracy values. Use lists with targeted actual sets.
      // Perfect match list for controlled accuracy:
      const perfectList = makeList({ moveSkills: ['a', 'b', 'c', 'd', 'e'] });
      const entry2 = makeEntry({ list: perfectList });

      // Record 1: actual has 4/5 predicted + 0 extra => Jaccard = 4/5 = 0.8
      engine.recordFeedback(entry2, ['a', 'b', 'c', 'd']);
      expect(entry2.accuracy).toBeCloseTo(0.8, 5);

      // Record 2: actual has 3/5 predicted + 0 extra => Jaccard = 3/5 = 0.6
      engine.recordFeedback(entry2, ['a', 'b', 'c']);
      expect(entry2.accuracy).toBeCloseTo(0.7, 5); // avg of 0.8 and 0.6

      // Record 3: actual has 2/5 predicted + 0 extra => Jaccard = 2/5 = 0.4
      engine.recordFeedback(entry2, ['a', 'b']);
      expect(entry2.accuracy).toBeCloseTo(0.6, 5); // avg of 0.8, 0.6, 0.4
    });
  });

  // --------------------------------------------------------------------------
  // refine() tests
  // --------------------------------------------------------------------------

  describe('refine()', () => {
    it('boosts confidence when accuracy is consistently high', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ confidence: 0.7 });
      const entry = makeEntry({ list });

      // Record 5 feedbacks with high accuracy
      for (let i = 0; i < 5; i++) {
        entry.feedbackHistory.push(makeFeedbackRecord({ accuracy: 0.9 }));
      }
      entry.executionCount = 5;
      entry.accuracy = 0.9;

      const originalConfidence = entry.list.metadata.confidence!;
      const result = engine.refine(entry);

      expect(entry.list.metadata.confidence!).toBeGreaterThan(originalConfidence);
      expect(result.confidenceDelta).toBeGreaterThan(0);
    });

    it('degrades confidence when accuracy is consistently low', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ confidence: 0.7 });
      const entry = makeEntry({ list });

      // Record 5 feedbacks with low accuracy
      for (let i = 0; i < 5; i++) {
        entry.feedbackHistory.push(makeFeedbackRecord({ accuracy: 0.1 }));
      }
      entry.executionCount = 5;
      entry.accuracy = 0.1;

      const originalConfidence = entry.list.metadata.confidence!;
      const result = engine.refine(entry);

      expect(entry.list.metadata.confidence!).toBeLessThan(originalConfidence);
      expect(result.confidenceDelta).toBeLessThan(0);
    });

    it('adds MOVE instructions for consistently missed skills', () => {
      const engine = new FeedbackEngine({ addThreshold: 0.7 });
      const list = makeList({ moveSkills: ['git-commit'] });
      const entry = makeEntry({ list });

      // 4 feedbacks where actual includes 'lint-fix' (not predicted)
      for (let i = 0; i < 4; i++) {
        entry.feedbackHistory.push(
          makeFeedbackRecord({
            predicted: ['git-commit'],
            actual: ['git-commit', 'lint-fix'],
            accuracy: 0.5,
          }),
        );
      }
      entry.executionCount = 4;
      entry.accuracy = 0.5;

      const result = engine.refine(entry);

      const moveNames = entry.list.instructions
        .filter((i): i is MoveInstruction => i.type === 'move')
        .map((m) => m.name);
      expect(moveNames).toContain('lint-fix');
      expect(result.addedSkills).toContain('lint-fix');
    });

    it('removes MOVE instructions for consistently unused skills', () => {
      const engine = new FeedbackEngine({ removeThreshold: 0.8 });
      const list = makeList({ moveSkills: ['git-commit', 'lint-fix', 'unused-skill'] });
      const entry = makeEntry({ list });

      // 4 feedbacks where actual never includes 'unused-skill'
      for (let i = 0; i < 4; i++) {
        entry.feedbackHistory.push(
          makeFeedbackRecord({
            predicted: ['git-commit', 'lint-fix', 'unused-skill'],
            actual: ['git-commit', 'lint-fix'],
            accuracy: 2 / 3, // 2 overlap / 3 union
          }),
        );
      }
      entry.executionCount = 4;
      entry.accuracy = 2 / 3;

      const result = engine.refine(entry);

      const moveNames = entry.list.instructions
        .filter((i): i is MoveInstruction => i.type === 'move')
        .map((m) => m.name);
      expect(moveNames).not.toContain('unused-skill');
      expect(result.removedSkills).toContain('unused-skill');
    });

    it('increments the list version after refinement', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ version: 1, confidence: 0.5 });
      const entry = makeEntry({ list, version: 1 });

      // Provide enough feedback with low accuracy to trigger confidence change
      for (let i = 0; i < 5; i++) {
        entry.feedbackHistory.push(makeFeedbackRecord({ accuracy: 0.1 }));
      }
      entry.executionCount = 5;
      entry.accuracy = 0.1;

      engine.refine(entry);

      expect(entry.version).toBe(2);
      expect(entry.list.metadata.version).toBe(2);
    });

    it('does not modify if insufficient feedback (below threshold)', () => {
      const engine = new FeedbackEngine({ minFeedbackForRefinement: 3 });
      const list = makeList({ confidence: 0.7 });
      const entry = makeEntry({ list });

      // Only 1 feedback record
      entry.feedbackHistory.push(makeFeedbackRecord({ accuracy: 0.1 }));
      entry.executionCount = 1;
      entry.accuracy = 0.1;

      const result = engine.refine(entry);

      expect(result.refined).toBe(false);
      expect(result.confidenceDelta).toBe(0);
      expect(result.addedSkills).toEqual([]);
      expect(result.removedSkills).toEqual([]);
      expect(entry.list.metadata.confidence).toBe(0.7);
    });

    it('validates the refined list against PipelineSchema', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: ['git-commit'] });
      const entry = makeEntry({ list });

      // Add enough feedback to trigger refinement
      for (let i = 0; i < 4; i++) {
        entry.feedbackHistory.push(
          makeFeedbackRecord({
            predicted: ['git-commit'],
            actual: ['git-commit', 'lint-fix'],
            accuracy: 0.5,
          }),
        );
      }
      entry.executionCount = 4;
      entry.accuracy = 0.5;

      engine.refine(entry);

      const parsed = PipelineSchema.safeParse(entry.list);
      expect(parsed.success).toBe(true);
    });

    it('maintains at least one WAIT instruction even if all MOVEs removed', () => {
      const engine = new FeedbackEngine({ removeThreshold: 0.7, minFeedbackForRefinement: 3 });
      const list = makeList({ moveSkills: ['unused-a', 'unused-b'] });
      const entry = makeEntry({ list });

      // 4 feedbacks where no predicted skills were ever activated
      for (let i = 0; i < 4; i++) {
        entry.feedbackHistory.push(
          makeFeedbackRecord({
            predicted: ['unused-a', 'unused-b'],
            actual: [],
            accuracy: 0,
          }),
        );
      }
      entry.executionCount = 4;
      entry.accuracy = 0;

      engine.refine(entry);

      const waitInstructions = entry.list.instructions.filter((i) => i.type === 'wait');
      expect(waitInstructions.length).toBeGreaterThanOrEqual(1);
    });

    it('respects sliding window (maxHistory) for feedback records', () => {
      const engine = new FeedbackEngine({ maxHistory: 5 });
      const entry = makeEntry();

      // Record 8 feedbacks
      for (let i = 0; i < 8; i++) {
        engine.recordFeedback(entry, ['git-commit']);
      }

      expect(entry.feedbackHistory.length).toBe(5);
    });

    it('returns RefinementResult with complete details', () => {
      const engine = new FeedbackEngine();
      const list = makeList({ moveSkills: ['git-commit', 'unused-skill'], confidence: 0.5 });
      const entry = makeEntry({ list });

      // Provide feedback where unused-skill is never activated and new-skill is always activated
      for (let i = 0; i < 5; i++) {
        entry.feedbackHistory.push(
          makeFeedbackRecord({
            predicted: ['git-commit', 'unused-skill'],
            actual: ['git-commit', 'new-skill'],
            accuracy: 1 / 3, // 1 overlap / 3 union
          }),
        );
      }
      entry.executionCount = 5;
      entry.accuracy = 1 / 3;

      const result = engine.refine(entry);

      expect(typeof result.refined).toBe('boolean');
      expect(typeof result.confidenceDelta).toBe('number');
      expect(Array.isArray(result.addedSkills)).toBe(true);
      expect(Array.isArray(result.removedSkills)).toBe(true);
      expect(typeof result.newVersion).toBe('number');
    });
  });
});
