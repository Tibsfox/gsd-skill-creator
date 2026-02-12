import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditCommand } from './audit.js';

// Mock all dependencies
vi.mock('../../storage/skill-store.js');
vi.mock('../../learning/version-manager.js');
vi.mock('../../learning/drift-tracker.js');
vi.mock('../../learning/contradiction-detector.js');
vi.mock('../../learning/feedback-store.js');

describe('auditCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return exit code 1 when no skill name provided', async () => {
    const exitCode = await auditCommand(undefined, {});
    expect(exitCode).toBe(1);
  });

  it('should return exit code 1 when skill not found', async () => {
    const { SkillStore } = await import('../../storage/skill-store.js');
    vi.mocked(SkillStore).mockImplementation(() => ({
      read: vi.fn().mockRejectedValue(new Error('Skill not found')),
      exists: vi.fn().mockResolvedValue(false),
    }) as any);

    const exitCode = await auditCommand('nonexistent-skill', {});
    expect(exitCode).toBe(1);
  });

  it('should return exit code 0 and output version history for existing skill', async () => {
    // This test will fail because the stub always returns 1
    const { SkillStore } = await import('../../storage/skill-store.js');
    vi.mocked(SkillStore).mockImplementation(() => ({
      read: vi.fn().mockResolvedValue({
        metadata: { name: 'my-skill', description: 'A test skill' },
        body: 'Skill body content',
        path: '/fake/skills/my-skill/SKILL.md',
      }),
      exists: vi.fn().mockResolvedValue(true),
    }) as any);

    const { VersionManager } = await import('../../learning/version-manager.js');
    vi.mocked(VersionManager).mockImplementation(() => ({
      getHistory: vi.fn().mockResolvedValue([
        { hash: 'abc123', shortHash: 'abc12', date: new Date('2025-02-01'), message: 'v2 update' },
        { hash: 'def456', shortHash: 'def45', date: new Date('2025-01-01'), message: 'initial' },
      ]),
      getVersionContent: vi.fn().mockResolvedValue('original content'),
      compareVersions: vi.fn().mockResolvedValue('diff output'),
    }) as any);

    const { DriftTracker } = await import('../../learning/drift-tracker.js');
    vi.mocked(DriftTracker).mockImplementation(() => ({
      computeDrift: vi.fn().mockResolvedValue({
        originalContent: 'original',
        currentContent: 'current',
        cumulativeDriftPercent: 15.3,
        thresholdExceeded: false,
        threshold: 60,
      }),
    }) as any);

    const { ContradictionDetector } = await import('../../learning/contradiction-detector.js');
    vi.mocked(ContradictionDetector).mockImplementation(() => ({
      detect: vi.fn().mockResolvedValue({
        contradictions: [],
        hasConflicts: false,
        summary: 'No contradictions detected',
      }),
    }) as any);

    const { FeedbackStore } = await import('../../learning/feedback-store.js');
    vi.mocked(FeedbackStore).mockImplementation(() => ({}) as any);

    const exitCode = await auditCommand('my-skill', {});

    expect(exitCode).toBe(0);
    // Should output skill info and history
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toContain('my-skill');
  });

  it('should output cumulative drift percentage', async () => {
    const { SkillStore } = await import('../../storage/skill-store.js');
    vi.mocked(SkillStore).mockImplementation(() => ({
      read: vi.fn().mockResolvedValue({
        metadata: { name: 'drift-skill', description: 'Test' },
        body: 'Body',
        path: '/fake/skills/drift-skill/SKILL.md',
      }),
    }) as any);

    const { VersionManager } = await import('../../learning/version-manager.js');
    vi.mocked(VersionManager).mockImplementation(() => ({
      getHistory: vi.fn().mockResolvedValue([]),
      getVersionContent: vi.fn().mockResolvedValue(''),
      compareVersions: vi.fn().mockResolvedValue(''),
    }) as any);

    const { DriftTracker } = await import('../../learning/drift-tracker.js');
    vi.mocked(DriftTracker).mockImplementation(() => ({
      computeDrift: vi.fn().mockResolvedValue({
        originalContent: 'original',
        currentContent: 'current',
        cumulativeDriftPercent: 42.7,
        thresholdExceeded: false,
        threshold: 60,
      }),
    }) as any);

    const { ContradictionDetector } = await import('../../learning/contradiction-detector.js');
    vi.mocked(ContradictionDetector).mockImplementation(() => ({
      detect: vi.fn().mockResolvedValue({
        contradictions: [],
        hasConflicts: false,
        summary: 'No contradictions detected',
      }),
    }) as any);

    const { FeedbackStore } = await import('../../learning/feedback-store.js');
    vi.mocked(FeedbackStore).mockImplementation(() => ({}) as any);

    const exitCode = await auditCommand('drift-skill', {});

    expect(exitCode).toBe(0);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toContain('42.7%');
  });

  it('should output contradiction warnings if contradictions exist', async () => {
    const { SkillStore } = await import('../../storage/skill-store.js');
    vi.mocked(SkillStore).mockImplementation(() => ({
      read: vi.fn().mockResolvedValue({
        metadata: { name: 'conflict-skill', description: 'Test' },
        body: 'Body',
        path: '/fake/skills/conflict-skill/SKILL.md',
      }),
    }) as any);

    const { VersionManager } = await import('../../learning/version-manager.js');
    vi.mocked(VersionManager).mockImplementation(() => ({
      getHistory: vi.fn().mockResolvedValue([]),
      getVersionContent: vi.fn().mockResolvedValue(''),
      compareVersions: vi.fn().mockResolvedValue(''),
    }) as any);

    const { DriftTracker } = await import('../../learning/drift-tracker.js');
    vi.mocked(DriftTracker).mockImplementation(() => ({
      computeDrift: vi.fn().mockResolvedValue({
        originalContent: '',
        currentContent: '',
        cumulativeDriftPercent: 0,
        thresholdExceeded: false,
        threshold: 60,
      }),
    }) as any);

    const { ContradictionDetector } = await import('../../learning/contradiction-detector.js');
    vi.mocked(ContradictionDetector).mockImplementation(() => ({
      detect: vi.fn().mockResolvedValue({
        contradictions: [
          {
            correction1: { id: '1', original: 'use tabs', corrected: 'use spaces' },
            correction2: { id: '2', original: 'use spaces', corrected: 'use tabs' },
            field: 'body',
            description: 'Correction reversal detected',
            severity: 'conflict',
          },
        ],
        hasConflicts: true,
        summary: 'Found 1 contradiction(s): 1 conflict(s)',
      }),
    }) as any);

    const { FeedbackStore } = await import('../../learning/feedback-store.js');
    vi.mocked(FeedbackStore).mockImplementation(() => ({}) as any);

    const exitCode = await auditCommand('conflict-skill', {});

    expect(exitCode).toBe(0);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/contradiction|conflict/i);
  });
});
