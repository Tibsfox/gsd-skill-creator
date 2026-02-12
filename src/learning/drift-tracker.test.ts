import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DriftTracker, DriftThresholdError } from './drift-tracker.js';
import { VersionManager } from './version-manager.js';
import { SkillStore } from '../storage/skill-store.js';
import { DEFAULT_DRIFT_THRESHOLD } from '../types/learning.js';
import type { SkillVersion } from '../types/learning.js';
import type { Skill } from '../types/skill.js';

// Mock VersionManager and SkillStore
vi.mock('./version-manager.js');
vi.mock('../storage/skill-store.js');

describe('DriftTracker', () => {
  let versionManager: VersionManager;
  let skillStore: SkillStore;
  let tracker: DriftTracker;

  beforeEach(() => {
    versionManager = new VersionManager();
    skillStore = new SkillStore('/fake/skills');
    tracker = new DriftTracker(versionManager, skillStore);
  });

  describe('computeDrift', () => {
    it('should return 0% drift for skill with no version history', async () => {
      // No history entries means no previous version to compare
      vi.mocked(versionManager.getHistory).mockResolvedValue([]);

      const result = await tracker.computeDrift('test-skill');

      expect(result.cumulativeDriftPercent).toBe(0);
      expect(result.thresholdExceeded).toBe(false);
    });

    it('should return 0% drift for skill with single version', async () => {
      // Single version = original, no drift possible
      const singleVersion: SkillVersion = {
        hash: 'abc123full',
        shortHash: 'abc123',
        date: new Date('2025-01-01'),
        message: 'initial commit',
      };
      vi.mocked(versionManager.getHistory).mockResolvedValue([singleVersion]);

      const result = await tracker.computeDrift('test-skill');

      expect(result.cumulativeDriftPercent).toBe(0);
      expect(result.thresholdExceeded).toBe(false);
    });

    it('should return correct drift percentage after content change', async () => {
      // Two versions: original and current
      const versions: SkillVersion[] = [
        { hash: 'newer', shortHash: 'new', date: new Date('2025-02-01'), message: 'update' },
        { hash: 'oldest', shortHash: 'old', date: new Date('2025-01-01'), message: 'initial' },
      ];
      vi.mocked(versionManager.getHistory).mockResolvedValue(versions);

      // Original content at oldest commit
      const originalContent = '---\nname: test-skill\n---\nThis is the original skill body content for testing drift.';
      vi.mocked(versionManager.getVersionContent).mockResolvedValue(originalContent);

      // Current content has significant changes
      const currentBody = 'This is a completely rewritten skill body with new content.';
      vi.mocked(skillStore.read).mockResolvedValue({
        metadata: { name: 'test-skill', description: 'Test' },
        body: currentBody,
        path: '/fake/skills/test-skill/SKILL.md',
      } as Skill);

      const result = await tracker.computeDrift('test-skill');

      // Drift should be > 0 since content changed
      expect(result.cumulativeDriftPercent).toBeGreaterThan(0);
      expect(result.originalContent).toBeDefined();
      expect(result.currentContent).toBe(currentBody);
    });

    it('should handle skill not found gracefully', async () => {
      const versions: SkillVersion[] = [
        { hash: 'newer', shortHash: 'new', date: new Date('2025-02-01'), message: 'update' },
        { hash: 'oldest', shortHash: 'old', date: new Date('2025-01-01'), message: 'initial' },
      ];
      vi.mocked(versionManager.getHistory).mockResolvedValue(versions);
      vi.mocked(versionManager.getVersionContent).mockResolvedValue('---\nname: test\n---\noriginal');
      vi.mocked(skillStore.read).mockRejectedValue(new Error('Skill not found'));

      await expect(tracker.computeDrift('nonexistent-skill')).rejects.toThrow();
    });
  });

  describe('checkThreshold', () => {
    it('should return thresholdExceeded=false when drift < 60%', async () => {
      // Set up a small drift scenario
      const versions: SkillVersion[] = [
        { hash: 'newer', shortHash: 'new', date: new Date('2025-02-01'), message: 'update' },
        { hash: 'oldest', shortHash: 'old', date: new Date('2025-01-01'), message: 'initial' },
      ];
      vi.mocked(versionManager.getHistory).mockResolvedValue(versions);

      // Original and current are very similar (small drift)
      const originalContent = '---\nname: test-skill\n---\nThis is a long skill body that has a lot of content here and stays mostly the same.';
      vi.mocked(versionManager.getVersionContent).mockResolvedValue(originalContent);

      vi.mocked(skillStore.read).mockResolvedValue({
        metadata: { name: 'test-skill', description: 'Test' },
        body: 'This is a long skill body that has a lot of content here and stays mostly unchanged.',
        path: '/fake/skills/test-skill/SKILL.md',
      } as Skill);

      const result = await tracker.checkThreshold('test-skill');

      expect(result.thresholdExceeded).toBe(false);
      expect(result.threshold).toBe(DEFAULT_DRIFT_THRESHOLD);
      expect(result.cumulativeDriftPercent).toBeLessThan(60);
    });

    it('should return thresholdExceeded=true when drift >= 60%', async () => {
      const versions: SkillVersion[] = [
        { hash: 'newer', shortHash: 'new', date: new Date('2025-02-01'), message: 'update' },
        { hash: 'oldest', shortHash: 'old', date: new Date('2025-01-01'), message: 'initial' },
      ];
      vi.mocked(versionManager.getHistory).mockResolvedValue(versions);

      // Original content
      const originalContent = '---\nname: test-skill\n---\nShort original.';
      vi.mocked(versionManager.getVersionContent).mockResolvedValue(originalContent);

      // Current content is completely different (high drift)
      vi.mocked(skillStore.read).mockResolvedValue({
        metadata: { name: 'test-skill', description: 'Test' },
        body: 'Entirely new content that shares almost nothing with the original text whatsoever in any way shape or form.',
        path: '/fake/skills/test-skill/SKILL.md',
      } as Skill);

      const result = await tracker.checkThreshold('test-skill');

      expect(result.thresholdExceeded).toBe(true);
      expect(result.threshold).toBe(DEFAULT_DRIFT_THRESHOLD);
      expect(result.cumulativeDriftPercent).toBeGreaterThanOrEqual(60);
    });

    it('should use custom threshold when provided', async () => {
      const versions: SkillVersion[] = [
        { hash: 'newer', shortHash: 'new', date: new Date('2025-02-01'), message: 'update' },
        { hash: 'oldest', shortHash: 'old', date: new Date('2025-01-01'), message: 'initial' },
      ];
      vi.mocked(versionManager.getHistory).mockResolvedValue(versions);

      // Moderate change (~30-40% drift)
      const originalContent = '---\nname: test-skill\n---\nThis is the original content of the skill body.';
      vi.mocked(versionManager.getVersionContent).mockResolvedValue(originalContent);

      vi.mocked(skillStore.read).mockResolvedValue({
        metadata: { name: 'test-skill', description: 'Test' },
        body: 'This is the modified content with some different words added here.',
        path: '/fake/skills/test-skill/SKILL.md',
      } as Skill);

      // Use a very low custom threshold (10%) so drift exceeds it
      const result = await tracker.checkThreshold('test-skill', 10);

      expect(result.threshold).toBe(10);
      expect(result.thresholdExceeded).toBe(true);
    });
  });

  describe('DriftThresholdError', () => {
    it('should contain drift result and descriptive message', () => {
      const driftResult = {
        originalContent: 'original',
        currentContent: 'current',
        cumulativeDriftPercent: 65.3,
        thresholdExceeded: true,
        threshold: 60,
      };

      const error = new DriftThresholdError(driftResult);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DriftThresholdError');
      expect(error.driftResult).toBe(driftResult);
      expect(error.message).toContain('65.3%');
      expect(error.message).toContain('60%');
      expect(error.message).toContain('halted');
    });
  });
});
