/**
 * Tests for workflow validator.
 *
 * Covers:
 * - Valid workflow with all skills existing returns valid=true with executionOrder
 * - Workflow referencing non-existent skill returns valid=false with skill error
 * - Workflow with needs referencing non-existent step returns valid=false
 * - Workflow with circular steps returns valid=false with cycle error
 * - Multiple errors collected in single validation run
 * - Empty needs array is valid (root step)
 * - Validator with skillExists always returning true passes skill check
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow } from './workflow-validator.js';
import type { WorkflowDefinition } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

const alwaysExists = async (_name: string): Promise<boolean> => true;
const neverExists = async (_name: string): Promise<boolean> => false;

function makeWorkflow(steps: WorkflowDefinition['steps']): WorkflowDefinition {
  return {
    name: 'test-workflow',
    version: 1,
    extends: null,
    steps,
  };
}

// ============================================================================
// Valid workflows
// ============================================================================

describe('validateWorkflow - valid cases', () => {
  it('returns valid=true with executionOrder for valid workflow', async () => {
    const workflow = makeWorkflow([
      { id: 'lint', skill: 'linter', needs: [] },
      { id: 'test', skill: 'tester', needs: ['lint'] },
      { id: 'deploy', skill: 'deployer', needs: ['test'] },
    ]);

    const result = await validateWorkflow(workflow, alwaysExists);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.executionOrder).toEqual(['lint', 'test', 'deploy']);
  });

  it('returns valid=true with skillExists always returning true', async () => {
    const workflow = makeWorkflow([
      { id: 'a', skill: 'skill-a', needs: [] },
      { id: 'b', skill: 'skill-b', needs: ['a'] },
    ]);

    const result = await validateWorkflow(workflow, alwaysExists);
    expect(result.valid).toBe(true);
    expect(result.executionOrder).toEqual(['a', 'b']);
  });

  it('returns valid=true for single root step with empty needs', async () => {
    const workflow = makeWorkflow([
      { id: 'solo', skill: 'solo-skill', needs: [] },
    ]);

    const result = await validateWorkflow(workflow, alwaysExists);
    expect(result.valid).toBe(true);
    expect(result.executionOrder).toEqual(['solo']);
  });
});

// ============================================================================
// Missing skill references
// ============================================================================

describe('validateWorkflow - skill errors', () => {
  it('returns error for non-existent skill', async () => {
    const workflow = makeWorkflow([
      { id: 'lint', skill: 'code-linter', needs: [] },
    ]);

    const result = await validateWorkflow(workflow, neverExists);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Step "lint" references unknown skill "code-linter"',
    );
  });

  it('returns errors for multiple missing skills', async () => {
    const workflow = makeWorkflow([
      { id: 'a', skill: 'missing-a', needs: [] },
      { id: 'b', skill: 'missing-b', needs: ['a'] },
    ]);

    const result = await validateWorkflow(workflow, neverExists);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Step "a" references unknown skill "missing-a"');
    expect(result.errors).toContain('Step "b" references unknown skill "missing-b"');
  });

  it('selectively reports only missing skills', async () => {
    const existingSkills = new Set(['real-skill']);
    const selectiveExists = async (name: string) => existingSkills.has(name);

    const workflow = makeWorkflow([
      { id: 'a', skill: 'real-skill', needs: [] },
      { id: 'b', skill: 'fake-skill', needs: ['a'] },
    ]);

    const result = await validateWorkflow(workflow, selectiveExists);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('fake-skill');
  });
});

// ============================================================================
// Missing step references in needs
// ============================================================================

describe('validateWorkflow - needs errors', () => {
  it('returns error for needs referencing non-existent step', async () => {
    const workflow = makeWorkflow([
      { id: 'deploy', skill: 'deployer', needs: ['bild'] },
    ]);

    const result = await validateWorkflow(workflow, alwaysExists);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Step "deploy" needs unknown step "bild"',
    );
  });

  it('returns errors for multiple invalid needs', async () => {
    const workflow = makeWorkflow([
      { id: 'deploy', skill: 'deployer', needs: ['missing1', 'missing2'] },
    ]);

    const result = await validateWorkflow(workflow, alwaysExists);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Step "deploy" needs unknown step "missing1"');
    expect(result.errors).toContain('Step "deploy" needs unknown step "missing2"');
  });
});

// ============================================================================
// Circular dependencies
// ============================================================================

describe('validateWorkflow - cycle errors', () => {
  it('returns error for circular step dependencies', async () => {
    const workflow = makeWorkflow([
      { id: 'lint', skill: 'linter', needs: ['test'] },
      { id: 'test', skill: 'tester', needs: ['lint'] },
    ]);

    const result = await validateWorkflow(workflow, alwaysExists);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Circular dependency'))).toBe(true);
    expect(result.executionOrder).toBeNull();
  });
});

// ============================================================================
// Multiple error types combined
// ============================================================================

describe('validateWorkflow - combined errors', () => {
  it('collects errors from needs, skills, and cycles in one run', async () => {
    const workflow = makeWorkflow([
      { id: 'a', skill: 'missing-skill', needs: ['nonexistent'] },
      { id: 'b', skill: 'real-skill', needs: ['a'] },
    ]);

    const selectiveExists = async (name: string) => name === 'real-skill';
    const result = await validateWorkflow(workflow, selectiveExists);

    expect(result.valid).toBe(false);
    // Should have at least: unknown step "nonexistent" + unknown skill "missing-skill"
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.errors.some(e => e.includes('nonexistent'))).toBe(true);
    expect(result.errors.some(e => e.includes('missing-skill'))).toBe(true);
  });
});
