/**
 * Integration tests for the test CLI command.
 *
 * Tests the `test run` subcommand for executing test cases against skills.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as p from '@clack/prompts';

// Mock dependencies before importing the module under test
vi.mock('@clack/prompts', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
  },
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  isCancel: vi.fn(() => false),
}));

vi.mock('../../testing/index.js', () => ({
  TestStore: vi.fn(function(this: any) {
    this.count = vi.fn();
    this.list = vi.fn();
    this.add = vi.fn();
    this.delete = vi.fn();
    this.update = vi.fn();
    this.get = vi.fn();
  }),
  TestRunner: vi.fn(function(this: any) {
    this.runForSkill = vi.fn();
  }),
  ResultStore: vi.fn(function(this: any) {
    this.list = vi.fn();
    this.append = vi.fn();
    this.getLatest = vi.fn();
  }),
  ResultFormatter: vi.fn(function(this: any) {
    this.formatTerminal = vi.fn(() => 'Terminal output');
    this.formatJSON = vi.fn(() => '{"result": "json"}');
  }),
}));

vi.mock('../../storage/skill-store.js', () => ({
  SkillStore: vi.fn(function(this: any) {
    this.list = vi.fn();
    this.read = vi.fn();
  }),
}));

// Import after mocking
import { testCommand } from './test.js';
import { TestStore, TestRunner, ResultStore, ResultFormatter } from '../../testing/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import type { TestRunResult, RunMetrics } from '../../types/test-run.js';

describe('test run command', () => {
  let mockTestStore: { count: ReturnType<typeof vi.fn>; list: ReturnType<typeof vi.fn> };
  let mockRunner: { runForSkill: ReturnType<typeof vi.fn> };
  let mockSkillStore: { list: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let mockResultStore: { list: ReturnType<typeof vi.fn> };
  let mockFormatter: { formatTerminal: ReturnType<typeof vi.fn>; formatJSON: ReturnType<typeof vi.fn> };

  // Helper to create a test run result
  function createTestRunResult(overrides: Partial<TestRunResult> = {}): TestRunResult {
    const defaultMetrics: RunMetrics = {
      total: 5,
      passed: 4,
      failed: 1,
      accuracy: 80,
      falsePositiveRate: 10,
      truePositives: 3,
      trueNegatives: 1,
      falsePositives: 1,
      falseNegatives: 0,
      edgeCaseCount: 0,
      precision: 0.75,
      recall: 1.0,
      f1Score: 0.857,
    };

    return {
      skillName: 'test-skill',
      runAt: '2026-01-01T00:00:00.000Z',
      duration: 100,
      metrics: overrides.metrics ?? defaultMetrics,
      results: [],
      positiveResults: [],
      negativeResults: [],
      edgeCaseResults: [],
      hints: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock instances
    mockTestStore = {
      count: vi.fn().mockResolvedValue(5),
      list: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(TestStore).mockImplementation(function() { return mockTestStore; });

    mockRunner = {
      runForSkill: vi.fn().mockResolvedValue(createTestRunResult()),
    };
    vi.mocked(TestRunner).mockImplementation(function() { return mockRunner; });

    mockSkillStore = {
      list: vi.fn().mockResolvedValue(['test-skill', 'other-skill']),
      read: vi.fn().mockResolvedValue({
        metadata: { name: 'test-skill', description: 'Test skill' },
        body: 'Test body',
        path: '/test/path',
      }),
    };
    vi.mocked(SkillStore).mockImplementation(function() { return mockSkillStore; });

    mockResultStore = {
      list: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(ResultStore).mockImplementation(function() { return mockResultStore; });

    mockFormatter = {
      formatTerminal: vi.fn().mockReturnValue('Terminal output'),
      formatJSON: vi.fn().mockReturnValue('{"result": "json"}'),
    };
    vi.mocked(ResultFormatter).mockImplementation(function() { return mockFormatter; });

    // Ensure CI env is not set by default
    delete process.env.CI;
  });

  describe('basic execution', () => {
    it('shows usage when no skill name provided', async () => {
      const exitCode = await testCommand(['run']);
      expect(exitCode).toBe(1);
      expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    });

    it('runs tests for a single skill', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill']);

      expect(mockRunner.runForSkill).toHaveBeenCalledWith('test-skill', expect.objectContaining({
        threshold: 0.75,
        storeResults: true,
      }));
      expect(mockFormatter.formatTerminal).toHaveBeenCalled();
      expect(exitCode).toBe(0);
    });

    it('returns exit code 1 when tests fail', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 2 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill']);

      expect(exitCode).toBe(1);
    });

    it('skips skills with no tests', async () => {
      mockTestStore.count.mockResolvedValue(0);

      const exitCode = await testCommand(['run', 'test-skill']);

      expect(mockRunner.runForSkill).not.toHaveBeenCalled();
      expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining('no test cases'));
      expect(exitCode).toBe(0);
    });
  });

  describe('--all flag', () => {
    it('runs tests for all skills', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', '--all']);

      expect(mockSkillStore.list).toHaveBeenCalled();
      expect(mockRunner.runForSkill).toHaveBeenCalledTimes(2); // two skills
      expect(exitCode).toBe(0);
    });

    it('handles --all with no skills', async () => {
      mockSkillStore.list.mockResolvedValue([]);

      const exitCode = await testCommand(['run', '--all']);

      expect(mockRunner.runForSkill).not.toHaveBeenCalled();
      expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining('No skills found'));
      expect(exitCode).toBe(0);
    });

    it('supports -a short form', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', '-a']);

      expect(mockSkillStore.list).toHaveBeenCalled();
    });
  });

  describe('output modes', () => {
    it('defaults to terminal output', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill']);

      expect(mockFormatter.formatTerminal).toHaveBeenCalledWith(result, expect.objectContaining({
        verbose: false,
        showHints: true,
      }));
    });

    it('uses --verbose flag for confidence scores', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill', '--verbose']);

      expect(mockFormatter.formatTerminal).toHaveBeenCalledWith(result, expect.objectContaining({
        verbose: true,
      }));
    });

    it('supports -v short form for verbose', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill', '-v']);

      expect(mockFormatter.formatTerminal).toHaveBeenCalledWith(result, expect.objectContaining({
        verbose: true,
      }));
    });

    it('uses --json=compact for machine output', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill', '--json=compact']);

      expect(mockFormatter.formatJSON).toHaveBeenCalledWith(result, 'compact');
    });

    it('uses --json=pretty for human-readable JSON', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill', '--json=pretty']);

      expect(mockFormatter.formatJSON).toHaveBeenCalledWith(result, 'pretty');
    });

    it('rejects invalid --json value', async () => {
      const exitCode = await testCommand(['run', 'test-skill', '--json=invalid']);

      expect(exitCode).toBe(1);
      expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Invalid --json value'));
    });
  });

  describe('CI auto-detection', () => {
    it('auto-selects compact JSON when CI=true', async () => {
      process.env.CI = 'true';
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill']);

      expect(mockFormatter.formatJSON).toHaveBeenCalledWith(result, 'compact');
    });

    it('uses terminal output when CI is not set', async () => {
      delete process.env.CI;
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill']);

      expect(mockFormatter.formatTerminal).toHaveBeenCalled();
    });

    it('explicit --json overrides CI auto-detection', async () => {
      process.env.CI = 'true';
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill', '--json=pretty']);

      expect(mockFormatter.formatJSON).toHaveBeenCalledWith(result, 'pretty');
    });
  });

  describe('threshold flags', () => {
    it('uses custom --threshold value', async () => {
      const result = createTestRunResult({ metrics: { ...createTestRunResult().metrics, failed: 0 } });
      mockRunner.runForSkill.mockResolvedValue(result);

      await testCommand(['run', 'test-skill', '--threshold=0.8']);

      expect(mockRunner.runForSkill).toHaveBeenCalledWith('test-skill', expect.objectContaining({
        threshold: 0.8,
      }));
    });

    it('fails when accuracy below --min-accuracy', async () => {
      const result = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 85, failed: 0 },
      });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill', '--min-accuracy=90']);

      expect(exitCode).toBe(1);
      expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Accuracy 85.0% below minimum 90%'));
    });

    it('passes when accuracy meets --min-accuracy', async () => {
      const result = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 95, failed: 0 },
      });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill', '--min-accuracy=90']);

      expect(exitCode).toBe(0);
    });

    it('fails when FPR exceeds --max-false-positive', async () => {
      const result = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, falsePositiveRate: 10, failed: 0 },
      });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill', '--max-false-positive=5']);

      expect(exitCode).toBe(1);
      expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('False positive rate 10.0% exceeds maximum 5%'));
    });

    it('passes when FPR within --max-false-positive', async () => {
      const result = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, falsePositiveRate: 3, failed: 0 },
      });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill', '--max-false-positive=5']);

      expect(exitCode).toBe(0);
    });

    it('can combine multiple threshold flags', async () => {
      const result = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 95, falsePositiveRate: 3, failed: 0 },
      });
      mockRunner.runForSkill.mockResolvedValue(result);

      const exitCode = await testCommand(['run', 'test-skill', '--min-accuracy=90', '--max-false-positive=5']);

      expect(exitCode).toBe(0);
    });
  });

  describe('error handling', () => {
    it('handles skill not found error', async () => {
      mockRunner.runForSkill.mockRejectedValue(new Error('Skill "nonexistent" not found'));

      const exitCode = await testCommand(['run', 'nonexistent']);

      expect(exitCode).toBe(1);
      expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Error testing nonexistent'));
    });

    it('handles generic errors gracefully', async () => {
      mockRunner.runForSkill.mockRejectedValue(new Error('Something went wrong'));

      const exitCode = await testCommand(['run', 'test-skill']);

      expect(exitCode).toBe(1);
    });
  });

  describe('regression comparison', () => {
    it('shows regression warning when accuracy drops', async () => {
      // Set up previous run with higher accuracy
      const previousRun = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 90 },
      });
      const currentRun = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 80, failed: 0 },
      });

      // ResultStore.list returns history including current run
      mockResultStore.list.mockResolvedValue([previousRun, currentRun]);
      mockRunner.runForSkill.mockResolvedValue(currentRun);

      await testCommand(['run', 'test-skill']);

      expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining('Regression detected'));
    });

    it('shows improvement message when accuracy increases', async () => {
      // Set up previous run with lower accuracy
      const previousRun = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 80 },
      });
      const currentRun = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 90, failed: 0 },
      });

      mockResultStore.list.mockResolvedValue([previousRun, currentRun]);
      mockRunner.runForSkill.mockResolvedValue(currentRun);

      await testCommand(['run', 'test-skill']);

      expect(p.log.success).toHaveBeenCalledWith(expect.stringContaining('Improvement'));
    });

    it('does not show regression/improvement for small changes', async () => {
      const previousRun = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 85 },
      });
      const currentRun = createTestRunResult({
        metrics: { ...createTestRunResult().metrics, accuracy: 83, failed: 0 },
      });

      mockResultStore.list.mockResolvedValue([previousRun, currentRun]);
      mockRunner.runForSkill.mockResolvedValue(currentRun);

      await testCommand(['run', 'test-skill']);

      // Neither regression nor improvement should be called
      expect(p.log.warn).not.toHaveBeenCalledWith(expect.stringContaining('Regression'));
      expect(p.log.success).not.toHaveBeenCalledWith(expect.stringContaining('Improvement'));
    });
  });
});
