import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditCommand } from './audit.js';

// Shared mock functions
const mockRead = vi.fn();
const mockExists = vi.fn();
const mockGetHistory = vi.fn();
const mockGetVersionContent = vi.fn();
const mockCompareVersions = vi.fn();
const mockComputeDrift = vi.fn();
const mockDetect = vi.fn();

vi.mock('../../storage/skill-store.js', () => {
  return {
    SkillStore: class MockSkillStore {
      read = mockRead;
      exists = mockExists;
    },
  };
});

vi.mock('../../learning/version-manager.js', () => {
  return {
    VersionManager: class MockVersionManager {
      getHistory = mockGetHistory;
      getVersionContent = mockGetVersionContent;
      compareVersions = mockCompareVersions;
    },
  };
});

vi.mock('../../learning/drift-tracker.js', () => {
  return {
    DriftTracker: class MockDriftTracker {
      computeDrift = mockComputeDrift;
    },
  };
});

vi.mock('../../learning/contradiction-detector.js', () => {
  return {
    ContradictionDetector: class MockContradictionDetector {
      detect = mockDetect;
    },
  };
});

vi.mock('../../learning/feedback-store.js', () => {
  return {
    FeedbackStore: class MockFeedbackStore {},
  };
});

describe('auditCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return exit code 1 when no skill name provided', async () => {
    const exitCode = await auditCommand(undefined, {});
    expect(exitCode).toBe(1);
  });

  it('should return exit code 1 when skill not found', async () => {
    mockRead.mockRejectedValue(new Error('Skill not found'));

    const exitCode = await auditCommand('nonexistent-skill', {});
    expect(exitCode).toBe(1);
  });

  it('should return exit code 0 and output version history for existing skill', async () => {
    mockRead.mockResolvedValue({
      metadata: { name: 'my-skill', description: 'A test skill' },
      body: 'Skill body content',
      path: '/fake/skills/my-skill/SKILL.md',
    });

    mockGetHistory.mockResolvedValue([
      { hash: 'abc123', shortHash: 'abc12', date: new Date('2025-02-01'), message: 'v2 update' },
      { hash: 'def456', shortHash: 'def45', date: new Date('2025-01-01'), message: 'initial' },
    ]);
    mockGetVersionContent.mockResolvedValue('original content');
    mockCompareVersions.mockResolvedValue('diff output');

    mockComputeDrift.mockResolvedValue({
      originalContent: 'original',
      currentContent: 'current',
      cumulativeDriftPercent: 15.3,
      thresholdExceeded: false,
      threshold: 60,
    });

    mockDetect.mockResolvedValue({
      contradictions: [],
      hasConflicts: false,
      summary: 'No contradictions detected',
    });

    const exitCode = await auditCommand('my-skill', {});

    expect(exitCode).toBe(0);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
    expect(output).toContain('my-skill');
  });

  it('should output cumulative drift percentage', async () => {
    mockRead.mockResolvedValue({
      metadata: { name: 'drift-skill', description: 'Test' },
      body: 'Body',
      path: '/fake/skills/drift-skill/SKILL.md',
    });

    mockGetHistory.mockResolvedValue([]);
    mockGetVersionContent.mockResolvedValue('');
    mockCompareVersions.mockResolvedValue('');

    mockComputeDrift.mockResolvedValue({
      originalContent: 'original',
      currentContent: 'current',
      cumulativeDriftPercent: 42.7,
      thresholdExceeded: false,
      threshold: 60,
    });

    mockDetect.mockResolvedValue({
      contradictions: [],
      hasConflicts: false,
      summary: 'No contradictions detected',
    });

    const exitCode = await auditCommand('drift-skill', {});

    expect(exitCode).toBe(0);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
    expect(output).toContain('42.7%');
  });

  it('should output contradiction warnings if contradictions exist', async () => {
    mockRead.mockResolvedValue({
      metadata: { name: 'conflict-skill', description: 'Test' },
      body: 'Body',
      path: '/fake/skills/conflict-skill/SKILL.md',
    });

    mockGetHistory.mockResolvedValue([]);
    mockGetVersionContent.mockResolvedValue('');
    mockCompareVersions.mockResolvedValue('');

    mockComputeDrift.mockResolvedValue({
      originalContent: '',
      currentContent: '',
      cumulativeDriftPercent: 0,
      thresholdExceeded: false,
      threshold: 60,
    });

    mockDetect.mockResolvedValue({
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
    });

    const exitCode = await auditCommand('conflict-skill', {});

    expect(exitCode).toBe(0);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
    expect(output).toMatch(/contradiction|conflict|reversal/i);
  });
});
