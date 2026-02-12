import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestRunner, type RunOptions } from './test-runner.js';
import { TestStore } from './test-store.js';
import { ResultStore } from './result-store.js';
import { SkillStore } from '../storage/skill-store.js';
import { BatchSimulator } from '../simulation/batch-simulator.js';
import type { TestCase } from '../types/testing.js';
import type { SimulationResult, SkillPrediction } from '../types/simulation.js';
import type { Skill } from '../types/skill.js';
import type { BatchResult } from '../simulation/batch-simulator.js';

// Mock dependencies
vi.mock('./test-store.js');
vi.mock('./result-store.js');
vi.mock('../storage/skill-store.js');
vi.mock('../simulation/batch-simulator.js');

describe('TestRunner', () => {
  let mockTestStore: TestStore;
  let mockSkillStore: SkillStore;
  let mockResultStore: ResultStore;
  let runner: TestRunner;

  // Helper to create test cases
  function createTestCase(
    overrides: Partial<TestCase> = {}
  ): TestCase {
    return {
      id: `test-${Math.random().toString(36).slice(2)}`,
      prompt: 'Test prompt',
      expected: 'positive',
      createdAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  // Helper to create skill prediction
  function createPrediction(
    similarity: number,
    skillName: string = 'test-skill'
  ): SkillPrediction {
    return {
      skillName,
      similarity,
      confidence: similarity * 100,
      confidenceLevel: similarity >= 0.85 ? 'high' : similarity >= 0.7 ? 'medium' : similarity >= 0.5 ? 'low' : 'none',
      wouldActivate: similarity >= 0.75,
    };
  }

  // Helper to create simulation result
  function createSimResult(
    similarity: number,
    threshold: number = 0.75
  ): SimulationResult {
    const winner = similarity >= threshold ? createPrediction(similarity) : null;
    return {
      prompt: 'Test prompt',
      winner,
      challengers: [],
      allPredictions: [createPrediction(similarity)],
      explanation: winner ? `Activated at ${(similarity * 100).toFixed(1)}%` : 'No activation',
      method: 'heuristic',
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock instances
    mockTestStore = new TestStore('user');
    mockSkillStore = new SkillStore('.claude/skills');
    mockResultStore = new ResultStore('user');

    // Setup default mock implementations
    vi.mocked(mockTestStore.list).mockResolvedValue([]);
    vi.mocked(mockSkillStore.read).mockResolvedValue({
      metadata: { name: 'test-skill', description: 'Test skill description' },
      body: 'Test body',
      path: '/test/path',
    } as Skill);
    vi.mocked(mockResultStore.append).mockResolvedValue({
      id: 'snapshot-id',
      skillName: 'test-skill',
      runAt: '2026-01-01T00:00:00.000Z',
      duration: 100,
      metrics: { total: 0, passed: 0, failed: 0, accuracy: 0, falsePositiveRate: 0, truePositives: 0, trueNegatives: 0, falsePositives: 0, falseNegatives: 0, edgeCaseCount: 0, precision: 0, recall: 0, f1Score: 0 },
      results: [],
      positiveResults: [],
      negativeResults: [],
      edgeCaseResults: [],
      hints: [],
      threshold: 0.75,
    });

    // Mock BatchSimulator
    vi.mocked(BatchSimulator).mockImplementation(() => ({
      runTestSuite: vi.fn().mockResolvedValue({
        results: [],
        stats: { total: 0, activations: 0, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      }),
      runCrossSkill: vi.fn(),
      filterResults: vi.fn(),
      runTestSuiteWithProgress: vi.fn(),
    } as unknown as BatchSimulator));

    runner = new TestRunner(mockTestStore, mockSkillStore, mockResultStore, 'user');
  });

  describe('runForSkill', () => {
    it('should throw error when no test cases exist', async () => {
      vi.mocked(mockTestStore.list).mockResolvedValue([]);

      await expect(runner.runForSkill('test-skill')).rejects.toThrow(
        'No test cases found for skill "test-skill"'
      );
    });

    it('should load skill metadata', async () => {
      const testCases = [createTestCase()];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)],
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      await runner.runForSkill('test-skill');

      expect(mockSkillStore.read).toHaveBeenCalledWith('test-skill');
    });

    it('should return complete TestRunResult structure', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'negative', prompt: 'Negative prompt' }),
        createTestCase({ id: '3', expected: 'edge-case', prompt: 'Edge prompt' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Positive - should activate
          createSimResult(0.5), // Negative - should not activate
          createSimResult(0.7), // Edge case - borderline
        ],
        stats: { total: 3, activations: 1, closeCompetitions: 0, noActivations: 2 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.skillName).toBe('test-skill');
      expect(result.runAt).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.metrics).toBeDefined();
      expect(result.results).toHaveLength(3);
      expect(result.positiveResults).toHaveLength(1);
      expect(result.negativeResults).toHaveLength(1);
      expect(result.edgeCaseResults).toHaveLength(1);
      expect(result.hints).toBeDefined();
    });

    it('should call ResultStore.append when storeResults is true (default)', async () => {
      const testCases = [createTestCase()];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)],
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      await runner.runForSkill('test-skill');

      expect(mockResultStore.append).toHaveBeenCalled();
    });

    it('should skip ResultStore.append when storeResults is false', async () => {
      const testCases = [createTestCase()];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)],
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      await runner.runForSkill('test-skill', { storeResults: false });

      expect(mockResultStore.append).not.toHaveBeenCalled();
    });

    it('should use custom threshold when provided', async () => {
      const testCases = [createTestCase()];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const mockRunTestSuite = vi.fn().mockResolvedValue({
        results: [createSimResult(0.6, 0.5)],
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      });
      vi.mocked(BatchSimulator).mockImplementation((config) => {
        expect(config?.threshold).toBe(0.5);
        return {
          runTestSuite: mockRunTestSuite,
        } as unknown as BatchSimulator;
      });

      await runner.runForSkill('test-skill', { threshold: 0.5 });

      expect(BatchSimulator).toHaveBeenCalledWith(
        expect.objectContaining({ threshold: 0.5 })
      );
    });

    it('should track duration correctly', async () => {
      const testCases = [createTestCase()];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      // Simulate some delay in batch processing
      const batchResult: BatchResult = {
        results: [createSimResult(0.8)],
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return batchResult;
        }),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('evaluateTest (via runForSkill)', () => {
    it('should pass positive test when skill activates', async () => {
      const testCases = [createTestCase({ expected: 'positive' })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)], // Above threshold
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].wouldActivate).toBe(true);
      expect(result.results[0].explanation).toContain('Correctly activated');
    });

    it('should fail positive test when skill does not activate', async () => {
      const testCases = [createTestCase({ expected: 'positive' })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.5)], // Below threshold
        stats: { total: 1, activations: 0, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].wouldActivate).toBe(false);
      expect(result.results[0].explanation).toContain('Expected activation but');
    });

    it('should respect minConfidence threshold for positive tests', async () => {
      const testCases = [createTestCase({ expected: 'positive', minConfidence: 0.9 })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)], // Activates but below minConfidence
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].explanation).toContain('below required 90.0%');
    });

    it('should pass negative test when skill does not activate', async () => {
      const testCases = [createTestCase({ expected: 'negative' })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.5)], // Below threshold
        stats: { total: 1, activations: 0, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].wouldActivate).toBe(false);
      expect(result.results[0].explanation).toContain('Correctly did not activate');
    });

    it('should fail negative test when skill activates', async () => {
      const testCases = [createTestCase({ expected: 'negative', reason: 'belongs to other skill' })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)], // Above threshold
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].explanation).toContain('Should not activate');
      expect(result.results[0].explanation).toContain('belongs to other skill');
    });

    it('should respect maxConfidence threshold for negative tests', async () => {
      const testCases = [createTestCase({ expected: 'negative', maxConfidence: 0.85 })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)], // Activates but within maxConfidence
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].explanation).toContain('within acceptable threshold');
    });

    it('should always pass edge-case tests with borderline flag', async () => {
      const testCases = [createTestCase({ expected: 'edge-case' })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.76)], // Just above threshold
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].borderline).toBe(true);
      expect(result.results[0].explanation).toContain('Borderline');
    });

    it('should report edge-case not activating with borderline explanation', async () => {
      const testCases = [createTestCase({ expected: 'edge-case' })];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.7)], // Just below threshold
        stats: { total: 1, activations: 0, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].borderline).toBe(true);
      expect(result.results[0].explanation).toContain('Borderline: did not activate');
    });
  });

  describe('computeMetrics (via runForSkill)', () => {
    it('should calculate 100% accuracy when all tests pass', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'negative', prompt: 'Negative' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Positive passes
          createSimResult(0.5), // Negative passes (doesn't activate)
        ],
        stats: { total: 2, activations: 1, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.accuracy).toBe(100);
      expect(result.metrics.passed).toBe(2);
      expect(result.metrics.failed).toBe(0);
    });

    it('should calculate 0% accuracy when all tests fail', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'negative', prompt: 'Negative' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.5), // Positive fails (doesn't activate)
          createSimResult(0.8), // Negative fails (activates)
        ],
        stats: { total: 2, activations: 1, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.accuracy).toBe(0);
      expect(result.metrics.passed).toBe(0);
      expect(result.metrics.failed).toBe(2);
    });

    it('should calculate mixed accuracy correctly', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'positive', prompt: 'Positive 2' }),
        createTestCase({ id: '3', expected: 'negative', prompt: 'Negative' }),
        createTestCase({ id: '4', expected: 'negative', prompt: 'Negative 2' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Positive 1 passes
          createSimResult(0.5), // Positive 2 fails
          createSimResult(0.5), // Negative 1 passes
          createSimResult(0.8), // Negative 2 fails
        ],
        stats: { total: 4, activations: 2, closeCompetitions: 0, noActivations: 2 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.accuracy).toBe(50); // 2 passed / 4 total
      expect(result.metrics.passed).toBe(2);
      expect(result.metrics.failed).toBe(2);
    });

    it('should exclude edge cases from accuracy calculations', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'edge-case', prompt: 'Edge' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Positive passes
          createSimResult(0.76), // Edge case (always passes)
        ],
        stats: { total: 2, activations: 2, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      // Only 1 test counted (positive), not 2 (edge excluded)
      expect(result.metrics.total).toBe(1);
      expect(result.metrics.accuracy).toBe(100);
      expect(result.metrics.edgeCaseCount).toBe(1);
    });

    it('should calculate FPR as FP / (FP + TN)', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'negative' }),
        createTestCase({ id: '2', expected: 'negative', prompt: 'Negative 2' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Negative 1 fails (FP)
          createSimResult(0.5), // Negative 2 passes (TN)
        ],
        stats: { total: 2, activations: 1, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      // FPR = 1 / (1 + 1) = 50%
      expect(result.metrics.falsePositiveRate).toBe(50);
      expect(result.metrics.falsePositives).toBe(1);
      expect(result.metrics.trueNegatives).toBe(1);
    });

    it('should return FPR 0 when no negative tests exist', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)],
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.falsePositiveRate).toBe(0);
    });

    it('should track all confusion matrix values correctly', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }), // TP
        createTestCase({ id: '2', expected: 'positive', prompt: 'P2' }), // FN
        createTestCase({ id: '3', expected: 'negative', prompt: 'N1' }), // TN
        createTestCase({ id: '4', expected: 'negative', prompt: 'N2' }), // FP
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Positive activates = TP
          createSimResult(0.5), // Positive doesn't activate = FN
          createSimResult(0.5), // Negative doesn't activate = TN
          createSimResult(0.8), // Negative activates = FP
        ],
        stats: { total: 4, activations: 2, closeCompetitions: 0, noActivations: 2 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.truePositives).toBe(1);
      expect(result.metrics.falseNegatives).toBe(1);
      expect(result.metrics.trueNegatives).toBe(1);
      expect(result.metrics.falsePositives).toBe(1);
    });

    it('should compute precision, recall, and f1Score between 0 and 1', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'negative', prompt: 'Negative' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // Positive passes (TP)
          createSimResult(0.5), // Negative passes (TN)
        ],
        stats: { total: 2, activations: 1, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.precision).toBeGreaterThanOrEqual(0);
      expect(result.metrics.precision).toBeLessThanOrEqual(1);
      expect(result.metrics.recall).toBeGreaterThanOrEqual(0);
      expect(result.metrics.recall).toBeLessThanOrEqual(1);
      expect(result.metrics.f1Score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.f1Score).toBeLessThanOrEqual(1);
    });

    it('should compute perfect precision, recall, f1Score when all tests pass', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'positive' }),
        createTestCase({ id: '2', expected: 'positive', prompt: 'Positive 2' }),
        createTestCase({ id: '3', expected: 'negative', prompt: 'Negative' }),
        createTestCase({ id: '4', expected: 'negative', prompt: 'Negative 2' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.8), // TP
          createSimResult(0.8), // TP
          createSimResult(0.5), // TN
          createSimResult(0.5), // TN
        ],
        stats: { total: 4, activations: 2, closeCompetitions: 0, noActivations: 2 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.precision).toBe(1.0);
      expect(result.metrics.recall).toBe(1.0);
      expect(result.metrics.f1Score).toBe(1.0);
    });

    it('should compute precision=0, recall=0, f1Score=0 when only negative tests exist', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'negative' }),
        createTestCase({ id: '2', expected: 'negative', prompt: 'Negative 2' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.5), // TN
          createSimResult(0.5), // TN
        ],
        stats: { total: 2, activations: 0, closeCompetitions: 0, noActivations: 2 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.precision).toBe(0);
      expect(result.metrics.recall).toBe(0);
      expect(result.metrics.f1Score).toBe(0);
    });

    it('should handle empty scored results (only edge cases)', async () => {
      const testCases = [
        createTestCase({ id: '1', expected: 'edge-case' }),
        createTestCase({ id: '2', expected: 'edge-case', prompt: 'Edge 2' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [
          createSimResult(0.76),
          createSimResult(0.74),
        ],
        stats: { total: 2, activations: 1, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.metrics.total).toBe(0);
      expect(result.metrics.accuracy).toBe(0); // 0/0 = 0 by definition
      expect(result.metrics.edgeCaseCount).toBe(2);
    });
  });

  describe('hints collection', () => {
    it('should collect hints for false negatives', async () => {
      const testCases = [
        createTestCase({ expected: 'positive', prompt: 'commit my code changes' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.5)], // Doesn't activate - FN
        stats: { total: 1, activations: 0, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.hints.length).toBeGreaterThan(0);
      expect(result.hints.some(h => h.includes('Consider adding keywords'))).toBe(true);
    });

    it('should collect hints for false positives', async () => {
      const testCases = [
        createTestCase({ expected: 'negative', prompt: 'this should not match' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)], // Activates - FP
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.hints.length).toBeGreaterThan(0);
      expect(result.hints.some(h => h.includes('may be too broad'))).toBe(true);
    });

    it('should note challengers in hints', async () => {
      const testCases = [
        createTestCase({ expected: 'positive' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const simResult: SimulationResult = {
        ...createSimResult(0.5),
        challengers: [createPrediction(0.7, 'competitor-skill')],
      };
      const batchResult: BatchResult = {
        results: [simResult],
        stats: { total: 1, activations: 0, closeCompetitions: 1, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.hints.some(h => h.includes('Close competition'))).toBe(true);
    });

    it('should deduplicate similar hints', async () => {
      const testCases = [
        createTestCase({ expected: 'positive', prompt: 'same prompt pattern' }),
        createTestCase({ expected: 'positive', prompt: 'same prompt pattern' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.5), createSimResult(0.5)], // Both FN
        stats: { total: 2, activations: 0, closeCompetitions: 0, noActivations: 2 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      // Should be deduplicated since both have same prompt
      const keywordHints = result.hints.filter(h => h.includes('Consider adding keywords'));
      expect(keywordHints.length).toBe(1);
    });

    it('should not collect hints from passing tests', async () => {
      const testCases = [
        createTestCase({ expected: 'positive' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.8)], // Passes
        stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.hints).toHaveLength(0);
    });

    it('should not collect hints from edge cases', async () => {
      const testCases = [
        createTestCase({ expected: 'edge-case' }),
      ];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      const batchResult: BatchResult = {
        results: [createSimResult(0.5)], // Edge case always passes
        stats: { total: 1, activations: 0, closeCompetitions: 0, noActivations: 1 },
        duration: 100,
      };
      vi.mocked(BatchSimulator).mockImplementation(() => ({
        runTestSuite: vi.fn().mockResolvedValue(batchResult),
      } as unknown as BatchSimulator));

      const result = await runner.runForSkill('test-skill');

      expect(result.hints).toHaveLength(0);
    });
  });

  describe('progress callback', () => {
    it('should pass progress callback to BatchSimulator', async () => {
      const testCases = [createTestCase()];
      vi.mocked(mockTestStore.list).mockResolvedValue(testCases);

      let capturedCallback: ((p: { current: number; total: number }) => void) | undefined;
      vi.mocked(BatchSimulator).mockImplementation((config) => {
        capturedCallback = config?.onProgress as any;
        return {
          runTestSuite: vi.fn().mockResolvedValue({
            results: [createSimResult(0.8)],
            stats: { total: 1, activations: 1, closeCompetitions: 0, noActivations: 0 },
            duration: 100,
          }),
        } as unknown as BatchSimulator;
      });

      const progressUpdates: Array<{ current: number; total: number }> = [];
      await runner.runForSkill('test-skill', {
        onProgress: (p) => progressUpdates.push(p),
      });

      // Verify callback was passed
      expect(capturedCallback).toBeDefined();

      // Simulate callback being called
      capturedCallback!({ current: 1, total: 1, percent: 100 } as any);
      expect(progressUpdates).toHaveLength(1);
      expect(progressUpdates[0]).toEqual({ current: 1, total: 1 });
    });
  });
});
