import { describe, it, expect } from 'vitest';
import { BatchSimulator } from './batch-simulator.js';

describe('BatchSimulator', () => {
  describe('runTestSuite', () => {
    it('should process multiple prompts efficiently', async () => {
      const simulator = new BatchSimulator();
      const prompts = [
        'commit my changes',
        'run database migrations',
        'create a new component',
      ];
      const skills = [
        { name: 'git-commit', description: 'Commit changes to git repository' },
        { name: 'prisma-migrate', description: 'Run database migrations' },
        { name: 'react-component', description: 'Create React components' },
      ];

      const result = await simulator.runTestSuite(prompts, skills);

      expect(result.results).toHaveLength(3);
      expect(result.stats.total).toBe(3);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle empty prompts array', async () => {
      const simulator = new BatchSimulator();
      const result = await simulator.runTestSuite([], [
        { name: 'test', description: 'test' },
      ]);

      expect(result.results).toHaveLength(0);
      expect(result.stats.total).toBe(0);
    });

    it('should handle empty skills array', async () => {
      const simulator = new BatchSimulator();
      const result = await simulator.runTestSuite(['test prompt'], []);

      expect(result.results).toHaveLength(0);
    });

    it('should call progress callback during execution', async () => {
      const progressCalls: number[] = [];
      const simulator = new BatchSimulator({
        onProgress: (progress) => progressCalls.push(progress.current),
      });

      const prompts = ['prompt 1', 'prompt 2', 'prompt 3'];
      const skills = [{ name: 'test', description: 'test skill' }];

      await simulator.runTestSuite(prompts, skills);

      expect(progressCalls).toContain(1);
      expect(progressCalls).toContain(2);
      expect(progressCalls).toContain(3);
    });

    it('should compute correct statistics', async () => {
      const simulator = new BatchSimulator({ threshold: 0.3 }); // Low threshold for testing
      const prompts = [
        'commit changes to git', // Should match git-commit
        'random unrelated text', // Should not match
      ];
      const skills = [
        { name: 'git-commit', description: 'Commit changes to git repository with message' },
      ];

      const result = await simulator.runTestSuite(prompts, skills);

      expect(result.stats.total).toBe(2);
      // At least one should activate with low threshold
      expect(result.stats.activations).toBeGreaterThanOrEqual(1);
    });
  });

  describe('runCrossSkill', () => {
    it('should analyze single prompt against all skills', async () => {
      const simulator = new BatchSimulator();
      const prompt = 'run database migrations';
      const skills = [
        { name: 'git-commit', description: 'Commit changes to git' },
        { name: 'prisma-migrate', description: 'Run database migrations with Prisma' },
        { name: 'docker-deploy', description: 'Deploy with Docker containers' },
      ];

      const result = await simulator.runCrossSkill(prompt, skills);

      expect(result.prompt).toBe(prompt);
      expect(result.allPredictions).toHaveLength(3);
      // Prisma-migrate should be most similar
      expect(result.allPredictions[0].skillName).toBe('prisma-migrate');
    });
  });

  describe('filterResults', () => {
    it('should filter by verbosity setting', async () => {
      const allSimulator = new BatchSimulator({ verbosity: 'all' });
      const failuresSimulator = new BatchSimulator({ verbosity: 'failures' });
      const summarySimulator = new BatchSimulator({ verbosity: 'summary' });

      const mockResults = [
        { winner: { skillName: 'a' } } as any,
        { winner: null } as any,
        { winner: { skillName: 'b' } } as any,
      ];

      expect(allSimulator.filterResults(mockResults)).toHaveLength(3);
      expect(failuresSimulator.filterResults(mockResults)).toHaveLength(1);
      expect(summarySimulator.filterResults(mockResults)).toHaveLength(0);
    });
  });

  describe('performance', () => {
    it('should complete batch processing in reasonable time', async () => {
      const simulator = new BatchSimulator();
      const prompts = Array.from({ length: 20 }, (_, i) => `test prompt ${i}`);
      const skills = [
        { name: 'skill-a', description: 'First test skill for performance testing' },
        { name: 'skill-b', description: 'Second test skill for performance testing' },
      ];

      // Run batch
      const batchStart = Date.now();
      await simulator.runTestSuite(prompts, skills);
      const batchDuration = Date.now() - batchStart;

      // The batch should complete in reasonable time
      expect(batchDuration).toBeLessThan(30000); // 30 seconds max
    });
  });
});
