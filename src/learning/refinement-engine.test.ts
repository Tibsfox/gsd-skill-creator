import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { RefinementEngine } from './refinement-engine.js';
import { FeedbackStore } from './feedback-store.js';
import { SkillStore } from '../storage/skill-store.js';
import { Skill, SkillMetadata, getExtension } from '../types/skill.js';

describe('RefinementEngine', () => {
  const testDir = join(tmpdir(), `refinement-engine-test-${Date.now()}`);
  const skillsDir = join(testDir, 'skills');
  const patternsDir = join(testDir, 'patterns');

  let feedbackStore: FeedbackStore;
  let skillStore: SkillStore;
  let engine: RefinementEngine;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(skillsDir, { recursive: true });
    await mkdir(patternsDir, { recursive: true });

    feedbackStore = new FeedbackStore(patternsDir);
    skillStore = new SkillStore(skillsDir);
    engine = new RefinementEngine(feedbackStore, skillStore);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createTestSkill(name: string, metadata?: Partial<SkillMetadata>): Promise<void> {
    const fullMetadata: SkillMetadata = {
      name,
      description: 'Test skill',
      version: 1,
      ...metadata,
    };
    await skillStore.create(name, fullMetadata, '# Test Skill\n\nThis is test content.');
  }

  describe('checkEligibility', () => {
    it('should return not eligible with no corrections', async () => {
      await createTestSkill('test-skill');

      const result = await engine.checkEligibility('test-skill');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('insufficient_feedback');
      expect(result.correctionsNeeded).toBe(3);
    });

    it('should return not eligible with only 2 corrections', async () => {
      await createTestSkill('test-skill');

      // Add 2 corrections
      await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: '1', original: 'a', corrected: 'b' });
      await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: '2', original: 'c', corrected: 'd' });

      const result = await engine.checkEligibility('test-skill');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('insufficient_feedback');
      expect(result.correctionsNeeded).toBe(1);
      expect(result.correctionCount).toBe(2);
    });

    it('should return eligible with 3+ corrections', async () => {
      await createTestSkill('test-skill');

      // Add 3 corrections
      await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: '1', original: 'a', corrected: 'b' });
      await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: '2', original: 'c', corrected: 'd' });
      await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: '3', original: 'e', corrected: 'f' });

      const result = await engine.checkEligibility('test-skill');

      expect(result.eligible).toBe(true);
      expect(result.correctionCount).toBe(3);
    });

    it('should return not eligible during cooldown period', async () => {
      // Create skill refined 3 days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      await createTestSkill('test-skill', {
        learning: { lastRefined: threeDaysAgo },
      });

      // Add enough corrections
      for (let i = 0; i < 5; i++) {
        await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: `${i}`, original: 'a', corrected: 'b' });
      }

      const result = await engine.checkEligibility('test-skill');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('cooldown');
      expect(result.daysRemaining).toBe(4); // 7 - 3 = 4 days remaining
    });

    it('should return eligible after cooldown period', async () => {
      // Create skill refined 8 days ago
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      await createTestSkill('test-skill', {
        learning: { lastRefined: eightDaysAgo },
      });

      // Add enough corrections
      for (let i = 0; i < 3; i++) {
        await feedbackStore.record({ type: 'correction', skillName: 'test-skill', sessionId: `${i}`, original: 'a', corrected: 'b' });
      }

      const result = await engine.checkEligibility('test-skill');

      expect(result.eligible).toBe(true);
    });
  });

  describe('validateChange', () => {
    it('should accept change within bounds (10%)', () => {
      const original = 'This is a test string with some content here.';
      const suggested = 'This is a test string with new content here.';

      const result = engine.validateChange(original, suggested);

      expect(result.valid).toBe(true);
      expect(result.changePercent).toBeLessThanOrEqual(20);
    });

    it('should reject change exceeding bounds (25%)', () => {
      const original = 'Short text';
      const suggested = 'This is a completely different longer text now';

      const result = engine.validateChange(original, suggested);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('exceeds_bounds');
      expect(result.changePercent).toBeGreaterThan(20);
    });

    it('should handle edge case of near 20% change', () => {
      // Use words so diffWords can calculate properly
      // Change only 1 word in a long sentence
      const original = 'This is a test string with many words here and more content follows after';
      const suggested = 'This is a test string with many words here and more content follows along';
      // "after" (5 chars) → "along" (5 chars) = 10 chars changed on 74 = ~14%

      const result = engine.validateChange(original, suggested);

      // Change should be within 20% bounds
      expect(result.changePercent).toBeLessThanOrEqual(20);
      expect(result.valid).toBe(true);
    });

    it('should handle empty strings', () => {
      const result = engine.validateChange('', '');
      expect(result.valid).toBe(true);
      expect(result.changePercent).toBe(0);
    });
  });

  describe('applyRefinement - user confirmation', () => {
    it('should throw error when userConfirmed is false', async () => {
      await createTestSkill('test-skill');

      const suggestion = {
        skillName: 'test-skill',
        currentVersion: 1,
        suggestedChanges: [],
        confidence: 0.8,
        basedOnCorrections: 3,
        preview: 'preview',
      };

      await expect(
        engine.applyRefinement('test-skill', suggestion, false)
      ).rejects.toThrow('User confirmation required for skill refinement');
    });

    it('should apply changes when userConfirmed is true', async () => {
      // Create skill with custom body where we can make a small proportional change
      const longBody = 'This is a very long test skill body with many words so that a small change will be under twenty percent of the total content length here.';
      const fullMetadata: SkillMetadata = {
        name: 'test-skill',
        description: 'Test skill',
        version: 1,
      };
      await skillStore.create('test-skill', fullMetadata, longBody);

      // Use a change that is within 20% bounds
      // Original is ~140 chars, changing 10 chars = ~7%
      const suggestion = {
        skillName: 'test-skill',
        currentVersion: 1,
        suggestedChanges: [{
          section: 'body' as const,
          original: 'very long test',  // 14 chars
          suggested: 'very nice test', // 14 chars, only 'long'→'nice' = 8 chars changed on 14 = ~57%
          reason: 'User correction',
        }],
        confidence: 0.8,
        basedOnCorrections: 3,
        preview: 'preview',
      };

      // Create engine with higher bounds limit for this test
      const testEngine = new RefinementEngine(feedbackStore, skillStore, {
        maxContentChangePercent: 60, // Allow up to 60% change per suggested change
      });

      const result = await testEngine.applyRefinement('test-skill', suggestion, true);

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(2);

      // Verify skill was updated
      const updatedSkill = await skillStore.read('test-skill');
      const ext = getExtension(updatedSkill!.metadata);
      expect(ext.version).toBe(2);
      expect(ext.learning?.lastRefined).toBeDefined();
      expect(updatedSkill?.body).toContain('very nice test');
    });
  });

  describe('generateSuggestion', () => {
    it('should return null when not eligible', async () => {
      await createTestSkill('test-skill');
      // No corrections added

      const suggestion = await engine.generateSuggestion('test-skill');

      expect(suggestion).toBeNull();
    });

    it('should generate suggestion with repeated patterns', async () => {
      await createTestSkill('test-skill');

      // Add same correction multiple times
      for (let i = 0; i < 3; i++) {
        await feedbackStore.record({
          type: 'correction',
          skillName: 'test-skill',
          sessionId: `${i}`,
          original: 'old text',
          corrected: 'new text',
        });
      }

      // Create engine with lower confidence threshold for testing
      const testEngine = new RefinementEngine(feedbackStore, skillStore, {
        minConfidence: 0.3,
      });

      const suggestion = await testEngine.generateSuggestion('test-skill');

      expect(suggestion).not.toBeNull();
      expect(suggestion!.skillName).toBe('test-skill');
      expect(suggestion!.basedOnCorrections).toBe(3);
      expect(suggestion!.suggestedChanges.length).toBeGreaterThan(0);
    });
  });

  describe('applyRefinement - cumulative drift check', () => {
    it('should reject refinement when cumulative drift exceeds 60% threshold', async () => {
      await createTestSkill('drifted-skill');

      const suggestion = {
        skillName: 'drifted-skill',
        currentVersion: 1,
        suggestedChanges: [{
          section: 'body' as const,
          original: 'test',
          suggested: 'best',
          reason: 'correction',
        }],
        confidence: 0.8,
        basedOnCorrections: 3,
        preview: 'preview',
      };

      // Create a mock DriftTracker that reports drift over threshold
      const mockDriftTracker = {
        checkThreshold: vi.fn().mockResolvedValue({
          originalContent: 'original',
          currentContent: 'current',
          cumulativeDriftPercent: 65.2,
          thresholdExceeded: true,
          threshold: 60,
        }),
        computeDrift: vi.fn(),
        computeDriftWithContent: vi.fn(),
      };

      // Create engine with drift tracker
      const engineWithDrift = new RefinementEngine(
        feedbackStore,
        skillStore,
        undefined,
        mockDriftTracker as any
      );

      const result = await engineWithDrift.applyRefinement('drifted-skill', suggestion, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('drift');
      expect(result.error).toContain('65.2%');
      expect(result.error).toContain('60%');
    });

    it('should allow refinement when cumulative drift is under 60%', async () => {
      const longBody = 'This is a very long test skill body with many words so that a small change will be under twenty percent of the total content length here.';
      const fullMetadata: SkillMetadata = {
        name: 'safe-skill',
        description: 'Test skill',
        version: 1,
      };
      await skillStore.create('safe-skill', fullMetadata, longBody);

      const suggestion = {
        skillName: 'safe-skill',
        currentVersion: 1,
        suggestedChanges: [{
          section: 'body' as const,
          original: 'very long test',
          suggested: 'very nice test',
          reason: 'correction',
        }],
        confidence: 0.8,
        basedOnCorrections: 3,
        preview: 'preview',
      };

      // Mock DriftTracker reports drift under threshold
      const mockDriftTracker = {
        checkThreshold: vi.fn().mockResolvedValue({
          originalContent: 'original',
          currentContent: 'current',
          cumulativeDriftPercent: 25.0,
          thresholdExceeded: false,
          threshold: 60,
        }),
        computeDrift: vi.fn(),
        computeDriftWithContent: vi.fn().mockResolvedValue({
          originalContent: 'original',
          currentContent: 'projected',
          cumulativeDriftPercent: 28.0,
          thresholdExceeded: false,
          threshold: 60,
        }),
      };

      const engineWithDrift = new RefinementEngine(
        feedbackStore,
        skillStore,
        { maxContentChangePercent: 60 },
        mockDriftTracker as any
      );

      const result = await engineWithDrift.applyRefinement('safe-skill', suggestion, true);

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(2);
    });

    it('should include drift percentage and threshold info in error message', async () => {
      await createTestSkill('drift-error-skill');

      const suggestion = {
        skillName: 'drift-error-skill',
        currentVersion: 1,
        suggestedChanges: [],
        confidence: 0.8,
        basedOnCorrections: 3,
        preview: 'preview',
      };

      const mockDriftTracker = {
        checkThreshold: vi.fn().mockResolvedValue({
          originalContent: 'original',
          currentContent: 'current',
          cumulativeDriftPercent: 72.5,
          thresholdExceeded: true,
          threshold: 60,
        }),
        computeDrift: vi.fn(),
        computeDriftWithContent: vi.fn(),
      };

      const engineWithDrift = new RefinementEngine(
        feedbackStore,
        skillStore,
        undefined,
        mockDriftTracker as any
      );

      const result = await engineWithDrift.applyRefinement('drift-error-skill', suggestion, true);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/72\.5%/);
      expect(result.error).toMatch(/60%/);
    });
  });

  describe('integration flow', () => {
    it('should complete full refinement flow', async () => {
      // Create skill
      await createTestSkill('flow-skill');

      // Add corrections with repeated pattern (very small change within 20% bounds)
      // Using long text so percentage is low
      const original = 'This is a long piece of text that contains many words and the test word appears here';
      const corrected = 'This is a long piece of text that contains many words and the best word appears here';

      for (let i = 0; i < 4; i++) {
        await feedbackStore.record({
          type: 'correction',
          skillName: 'flow-skill',
          sessionId: `session-${i}`,
          original,
          corrected,
        });
      }

      // Create engine with lower thresholds for testing
      const testEngine = new RefinementEngine(feedbackStore, skillStore, {
        minConfidence: 0.2,
      });

      // Check eligibility
      const eligibility = await testEngine.checkEligibility('flow-skill');
      expect(eligibility.eligible).toBe(true);

      // Generate suggestion
      const suggestion = await testEngine.generateSuggestion('flow-skill');
      expect(suggestion).not.toBeNull();

      // Validate changes are within bounds
      for (const change of suggestion!.suggestedChanges) {
        const validation = testEngine.validateChange(change.original, change.suggested);
        // This should be a small change
        expect(validation.changePercent).toBeLessThanOrEqual(20);
        expect(validation.valid).toBe(true);
      }

      // Apply with confirmation
      const result = await testEngine.applyRefinement('flow-skill', suggestion!, true);
      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(2);

      // Verify lastRefined is set
      const skill = await skillStore.read('flow-skill');
      const flowExt = getExtension(skill!.metadata);
      expect(flowExt.learning?.lastRefined).toBeDefined();
    });
  });
});
