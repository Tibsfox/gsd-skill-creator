/**
 * Tests for workflow extends composition.
 *
 * Covers:
 * - Workflow with no extends returns as-is
 * - Child overrides parent step with same id
 * - Child adds new step not in parent
 * - Circular extends (A extends B extends A) returns error
 * - Missing parent returns error
 * - Deep chain (A extends B extends C) resolves correctly
 * - maxDepth exceeded returns error
 */

import { describe, it, expect } from 'vitest';
import { resolveExtends } from './workflow-extends.js';
import type { WorkflowDefinition } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeWorkflow(
  name: string,
  steps: WorkflowDefinition['steps'],
  extendsName: string | null = null,
): WorkflowDefinition {
  return {
    name,
    version: 1,
    extends: extendsName,
    steps,
  };
}

type WorkflowMap = Record<string, WorkflowDefinition>;

function makeLoader(workflows: WorkflowMap) {
  return async (name: string): Promise<WorkflowDefinition | null> => {
    return workflows[name] ?? null;
  };
}

// ============================================================================
// No extends
// ============================================================================

describe('resolveExtends - no extends', () => {
  it('returns workflow as-is when extends is null', async () => {
    const wf = makeWorkflow('base', [
      { id: 'lint', skill: 'linter', needs: [] },
    ]);

    const result = await resolveExtends(wf, makeLoader({}));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.name).toBe('base');
      expect(result.resolved.steps).toHaveLength(1);
      expect(result.chain).toEqual(['base']);
    }
  });
});

// ============================================================================
// Child overrides parent
// ============================================================================

describe('resolveExtends - override', () => {
  it('child overrides parent step with same id', async () => {
    const parent = makeWorkflow('parent', [
      { id: 'lint', skill: 'old-linter', description: 'old lint', needs: [] },
      { id: 'test', skill: 'tester', needs: ['lint'] },
    ]);

    const child = makeWorkflow('child', [
      { id: 'lint', skill: 'new-linter', description: 'new lint', needs: [] },
    ], 'parent');

    const result = await resolveExtends(child, makeLoader({ parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      const lintStep = result.resolved.steps.find(s => s.id === 'lint');
      expect(lintStep!.skill).toBe('new-linter');
      expect(lintStep!.description).toBe('new lint');
      // Parent's test step should still be present
      const testStep = result.resolved.steps.find(s => s.id === 'test');
      expect(testStep).toBeDefined();
      expect(testStep!.skill).toBe('tester');
    }
  });

  it('child adds new step not in parent', async () => {
    const parent = makeWorkflow('parent', [
      { id: 'lint', skill: 'linter', needs: [] },
    ]);

    const child = makeWorkflow('child', [
      { id: 'deploy', skill: 'deployer', needs: ['lint'] },
    ], 'parent');

    const result = await resolveExtends(child, makeLoader({ parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.steps).toHaveLength(2);
      const ids = result.resolved.steps.map(s => s.id);
      expect(ids).toContain('lint');
      expect(ids).toContain('deploy');
    }
  });
});

// ============================================================================
// Error cases
// ============================================================================

describe('resolveExtends - errors', () => {
  it('circular extends returns error', async () => {
    const a = makeWorkflow('a', [
      { id: 'step-a', skill: 'skill-a', needs: [] },
    ], 'b');

    const b = makeWorkflow('b', [
      { id: 'step-b', skill: 'skill-b', needs: [] },
    ], 'a');

    const result = await resolveExtends(a, makeLoader({ a, b }));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('ircular');
    }
  });

  it('missing parent returns error', async () => {
    const child = makeWorkflow('child', [
      { id: 'step', skill: 'skill', needs: [] },
    ], 'nonexistent');

    const result = await resolveExtends(child, makeLoader({}));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('nonexistent');
    }
  });

  it('maxDepth exceeded returns error', async () => {
    const a = makeWorkflow('a', [
      { id: 's', skill: 'sk', needs: [] },
    ], 'b');

    const b = makeWorkflow('b', [
      { id: 's', skill: 'sk', needs: [] },
    ], 'c');

    const c = makeWorkflow('c', [
      { id: 's', skill: 'sk', needs: [] },
    ]);

    const result = await resolveExtends(a, makeLoader({ a, b, c }), 1);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('depth');
    }
  });
});

// ============================================================================
// Deep chain
// ============================================================================

describe('resolveExtends - deep chain', () => {
  it('resolves A extends B extends C correctly', async () => {
    const c = makeWorkflow('c', [
      { id: 'lint', skill: 'base-linter', needs: [] },
      { id: 'test', skill: 'base-tester', needs: ['lint'] },
    ]);

    const b = makeWorkflow('b', [
      { id: 'lint', skill: 'better-linter', needs: [] },
      { id: 'build', skill: 'builder', needs: ['lint'] },
    ], 'c');

    const a = makeWorkflow('a', [
      { id: 'deploy', skill: 'deployer', needs: ['build'] },
    ], 'b');

    const result = await resolveExtends(a, makeLoader({ a, b, c }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.chain).toEqual(['c', 'b', 'a']);

      // C provides lint (base-linter) and test
      // B overrides lint (better-linter) and adds build
      // A adds deploy
      const steps = result.resolved.steps;
      const lintStep = steps.find(s => s.id === 'lint');
      expect(lintStep!.skill).toBe('better-linter'); // B overrode C

      const testStep = steps.find(s => s.id === 'test');
      expect(testStep!.skill).toBe('base-tester'); // from C, not overridden

      const buildStep = steps.find(s => s.id === 'build');
      expect(buildStep!.skill).toBe('builder'); // from B

      const deployStep = steps.find(s => s.id === 'deploy');
      expect(deployStep!.skill).toBe('deployer'); // from A

      expect(steps).toHaveLength(4);
    }
  });
});
