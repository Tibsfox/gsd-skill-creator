/**
 * TDD tests for the work decomposer.
 *
 * Tests decomposeWork() extraction of subtasks, dependency inference,
 * shared resource detection, critical path identification, and
 * maximum parallelism computation from VisionAnalysis input.
 *
 * @module staging/resource/decomposer.test
 */

import { describe, it, expect } from 'vitest';
import { decomposeWork } from './decomposer.js';
import type { VisionAnalysis, ParallelDecomposition } from './types.js';

/**
 * Helper to create a minimal VisionAnalysis with given requirements.
 */
function makeAnalysis(
  reqs: Array<{ description: string; category: string }>,
  overallComplexity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
): VisionAnalysis {
  return {
    requirements: reqs.map((r, i) => ({
      id: `req-${String(i + 1).padStart(3, '0')}`,
      description: r.description,
      category: r.category,
      confidence: 0.8,
    })),
    complexity: [],
    ambiguities: [],
    dependencies: [],
    overallComplexity,
    summary: 'Test analysis',
  };
}

describe('decomposeWork', () => {
  it('creates one subtask from a single requirement', () => {
    const analysis = makeAnalysis([
      { description: 'Build user login page', category: 'authentication' },
    ]);

    const result: ParallelDecomposition = decomposeWork(analysis);

    expect(result.subtasks).toHaveLength(1);
    expect(result.subtasks[0].id).toBe('task-0');
    expect(result.subtasks[0].description).toBe('Build user login page');
    expect(result.subtasks[0].dependencies).toEqual([]);
    expect(result.criticalPath).toEqual(['task-0']);
    expect(result.maxParallelism).toBe(1);
  });

  it('creates independent subtasks for requirements in different categories', () => {
    const analysis = makeAnalysis([
      { description: 'Build authentication module', category: 'authentication' },
      { description: 'Create data visualization charts', category: 'ui-rendering' },
      { description: 'Set up email notification service', category: 'notifications' },
    ]);

    const result = decomposeWork(analysis);

    expect(result.subtasks).toHaveLength(3);

    // All should be independent (different categories)
    for (const task of result.subtasks) {
      expect(task.dependencies).toEqual([]);
    }

    // All independent = max parallelism equals count
    expect(result.maxParallelism).toBe(3);
  });

  it('infers sequential dependencies for requirements in the same category', () => {
    const analysis = makeAnalysis([
      { description: 'Design database schema for users', category: 'data-storage' },
      { description: 'Implement user CRUD operations', category: 'data-storage' },
      { description: 'Add caching layer for user queries', category: 'data-storage' },
    ]);

    const result = decomposeWork(analysis);

    expect(result.subtasks).toHaveLength(3);

    // Later tasks in same category depend on earlier ones
    expect(result.subtasks[0].dependencies).toEqual([]);
    expect(result.subtasks[1].dependencies).toContain('task-0');
    expect(result.subtasks[2].dependencies).toContain('task-1');

    // Sequential = max parallelism is 1
    expect(result.maxParallelism).toBe(1);
  });

  it('detects shared resources for subtasks in the same category', () => {
    const analysis = makeAnalysis([
      { description: 'Create user registration form', category: 'authentication' },
      { description: 'Implement password reset flow', category: 'authentication' },
      { description: 'Build dashboard charts', category: 'ui-rendering' },
    ]);

    const result = decomposeWork(analysis);

    // Both auth tasks share the 'authentication' resource
    const authTasks = result.subtasks.filter(
      (t) => t.sharedResources.includes('authentication'),
    );
    expect(authTasks.length).toBe(2);

    // Dashboard task should not share authentication resource
    const dashTask = result.subtasks.find(
      (t) => t.description.includes('dashboard'),
    );
    expect(dashTask).toBeDefined();
    expect(dashTask!.sharedResources).not.toContain('authentication');

    // Shared resources at decomposition level should include 'authentication'
    expect(result.sharedResources).toContain('authentication');
  });

  it('identifies the critical path as the longest dependency chain', () => {
    const analysis = makeAnalysis([
      { description: 'Set up project infrastructure', category: 'infrastructure' },
      { description: 'Configure CI/CD pipeline', category: 'infrastructure' },
      { description: 'Build authentication module', category: 'authentication' },
    ]);

    const result = decomposeWork(analysis);

    // Infrastructure has a chain of 2 (task-0 -> task-1)
    // Authentication is independent
    // Critical path is the infrastructure chain
    expect(result.criticalPath.length).toBeGreaterThanOrEqual(2);
    expect(result.criticalPath).toContain('task-0');
    expect(result.criticalPath).toContain('task-1');
  });

  it('propagates complexity from matching complexity signals', () => {
    const analysis: VisionAnalysis = {
      requirements: [
        { id: 'req-001', description: 'Implement concurrent data processor', category: 'data-processing', confidence: 0.9 },
        { id: 'req-002', description: 'Build simple static page', category: 'ui', confidence: 0.9 },
      ],
      complexity: [
        { signal: 'concurrent-access', level: 'high', evidence: 'concurrent data processor' },
      ],
      ambiguities: [],
      dependencies: [],
      overallComplexity: 'high',
      summary: 'Test',
    };

    const result = decomposeWork(analysis);

    // Task mentioning 'concurrent' should get higher complexity
    const dataTask = result.subtasks.find(
      (t) => t.description.includes('concurrent'),
    );
    expect(dataTask).toBeDefined();
    expect(dataTask!.estimatedComplexity).toBe('high');
  });

  it('returns empty decomposition for no requirements', () => {
    const analysis = makeAnalysis([]);

    const result = decomposeWork(analysis);

    expect(result.subtasks).toEqual([]);
    expect(result.criticalPath).toEqual([]);
    expect(result.maxParallelism).toBe(0);
    expect(result.sharedResources).toEqual([]);
  });

  it('correctly computes maxParallelism for mixed independent and dependent tasks', () => {
    const analysis = makeAnalysis([
      { description: 'Design database schema', category: 'data-storage' },
      { description: 'Build API endpoints on schema', category: 'data-storage' },
      { description: 'Create frontend dashboard', category: 'ui-rendering' },
      { description: 'Set up monitoring alerts', category: 'monitoring' },
    ]);

    const result = decomposeWork(analysis);

    expect(result.subtasks).toHaveLength(4);

    // data-storage tasks are sequential (task-0 -> task-1)
    // ui-rendering and monitoring are independent
    // At widest point: task-1, task-2, task-3 can potentially run
    // But task-1 depends on task-0, so at level 0: task-0, task-2, task-3 (3)
    // At level 1: task-1 (1)
    // Max parallelism = 3
    expect(result.maxParallelism).toBe(3);
  });

  it('makes foundation/setup category requirements dependency roots', () => {
    const analysis = makeAnalysis([
      { description: 'Set up project foundation and tooling', category: 'foundation' },
      { description: 'Build authentication module', category: 'authentication' },
      { description: 'Create data pipeline', category: 'data-processing' },
    ]);

    const result = decomposeWork(analysis);

    // Foundation task should be a dependency root
    const foundationTask = result.subtasks.find(
      (t) => t.description.includes('foundation'),
    );
    expect(foundationTask).toBeDefined();
    expect(foundationTask!.dependencies).toEqual([]);

    // Other tasks should depend on the foundation task
    const authTask = result.subtasks.find(
      (t) => t.description.includes('authentication'),
    );
    expect(authTask).toBeDefined();
    expect(authTask!.dependencies).toContain('task-0');

    const dataTask = result.subtasks.find(
      (t) => t.description.includes('data pipeline'),
    );
    expect(dataTask).toBeDefined();
    expect(dataTask!.dependencies).toContain('task-0');
  });
});
