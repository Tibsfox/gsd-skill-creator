/**
 * Integration tests for the workflow CLI lifecycle.
 *
 * Tests the composed pipeline (parser -> validator -> runner -> store) against
 * real file I/O in temp directories. No mocks of internal modules -- all
 * interactions are via real WorkflowRunStore, WorkStateReader/Writer, etc.
 *
 * Covers:
 * 1. Full lifecycle: create YAML -> run -> status (all steps complete)
 * 2. Crash recovery: partial run -> resume -> picks up from last completed
 * 3. Extends composition: parent + child merge with override
 * 4. Validation failures: circular deps, unknown skills
 * 5. List workflows: multiple YAML files parsed with correct metadata
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, readdir, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseWorkflowFile,
  parseWorkflowYaml,
  validateWorkflow,
  WorkflowRunner,
  WorkflowRunStore,
  WorkflowDAG,
  resolveExtends,
} from '../../skill-workflows/index.js';
import type { WorkflowDefinition } from '../../skill-workflows/index.js';
import { WorkStateReader } from '../../orchestrator/work-state/work-state-reader.js';
import { WorkStateWriter } from '../../orchestrator/work-state/work-state-writer.js';

// ============================================================================
// Test helpers
// ============================================================================

let tempDir: string;
let workflowDir: string;
let patternsDir: string;
let hooksDir: string;
let workStatePath: string;

async function dumpYaml(obj: Record<string, unknown>): Promise<string> {
  const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
  return (yaml as any).dump(obj, { indent: 2, lineWidth: 120, noRefs: true });
}

async function writeWorkflow(name: string, def: Record<string, unknown>): Promise<string> {
  const content = await dumpYaml(def);
  const filePath = join(workflowDir, `${name}.workflow.yaml`);
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

function createRunner(overrides: {
  skillExists?: (name: string) => Promise<boolean>;
} = {}): WorkflowRunner {
  const runStore = new WorkflowRunStore(patternsDir);
  const workStateReader = new WorkStateReader(workStatePath);
  const workStateWriter = new WorkStateWriter(workStatePath);

  return new WorkflowRunner({
    runStore,
    workStateReader,
    workStateWriter,
    skillExists: overrides.skillExists ?? (async () => true),
    loadWorkflow: async (name: string) => {
      const filePath = join(workflowDir, `${name}.workflow.yaml`);
      return parseWorkflowFile(filePath);
    },
  });
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'workflow-test-'));
  workflowDir = join(tempDir, '.claude', 'workflows');
  patternsDir = join(tempDir, '.planning', 'patterns');
  hooksDir = join(tempDir, '.planning', 'hooks');
  workStatePath = join(hooksDir, 'current-work.yaml');

  await mkdir(workflowDir, { recursive: true });
  await mkdir(patternsDir, { recursive: true });
  await mkdir(hooksDir, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================================
// 1. Full lifecycle: create -> run -> status
// ============================================================================

describe('Full lifecycle: create -> run -> status', () => {
  it('creates, runs, and reports status for a 3-step workflow', async () => {
    // 1. Write a workflow YAML with 3 steps
    await writeWorkflow('deploy', {
      name: 'deploy',
      version: 1,
      description: 'Deploy pipeline',
      steps: [
        { id: 'lint', skill: 'linter' },
        { id: 'test', skill: 'tester', needs: ['lint'] },
        { id: 'build', skill: 'builder', needs: ['test'] },
      ],
    });

    // 2. Parse and validate
    const def = await parseWorkflowFile(join(workflowDir, 'deploy.workflow.yaml'));
    expect(def).not.toBeNull();
    expect(def!.name).toBe('deploy');
    expect(def!.steps).toHaveLength(3);

    const validation = await validateWorkflow(def!, async () => true);
    expect(validation.valid).toBe(true);
    expect(validation.executionOrder).toEqual(['lint', 'test', 'build']);

    // 3. Create runner and start
    const runner = createRunner();
    const { runId, steps } = await runner.start('deploy');
    expect(runId).toBeTruthy();
    expect(steps).toEqual(['lint', 'test', 'build']);

    // 4. Verify WorkState has workflow set
    const wsReader = new WorkStateReader(workStatePath);
    const stateAfterStart = await wsReader.read();
    expect(stateAfterStart).not.toBeNull();
    expect(stateAfterStart!.workflow).not.toBeNull();
    expect(stateAfterStart!.workflow!.name).toBe('deploy');

    // 5. Complete each step in order
    for (const stepId of steps) {
      await runner.advanceStep(runId, stepId);
      await runner.completeStep(runId, stepId);
    }

    // 6. Verify JSONL has all entries
    const runStore = new WorkflowRunStore(patternsDir);
    const entries = await runStore.getRunEntries(runId);
    // 3 started + 3 completed = 6 entries
    expect(entries.length).toBe(6);

    const completedSteps = await runStore.getCompletedSteps(runId);
    expect(completedSteps).toEqual(expect.arrayContaining(['lint', 'test', 'build']));

    // 7. Verify WorkState.workflow is null after last step
    const stateAfterDone = await wsReader.read();
    expect(stateAfterDone).not.toBeNull();
    expect(stateAfterDone!.workflow).toBeNull();

    // 8. Check status shows all completed
    const latestRun = await runStore.getLatestRun('deploy');
    expect(latestRun).not.toBeNull();
    expect(latestRun!.runId).toBe(runId);
  });
});

// ============================================================================
// 2. Crash recovery: start -> partial complete -> resume
// ============================================================================

describe('Crash recovery: partial run -> resume', () => {
  it('resumes from last completed step after simulated crash', async () => {
    await writeWorkflow('deploy', {
      name: 'deploy',
      version: 1,
      steps: [
        { id: 'lint', skill: 'linter' },
        { id: 'test', skill: 'tester', needs: ['lint'] },
        { id: 'build', skill: 'builder', needs: ['test'] },
      ],
    });

    // Start the workflow
    const runner1 = createRunner();
    const { runId, steps } = await runner1.start('deploy');
    expect(steps).toEqual(['lint', 'test', 'build']);

    // Complete only step 1 (lint)
    await runner1.advanceStep(runId, 'lint');
    await runner1.completeStep(runId, 'lint');

    // Verify WorkState shows lint completed
    const wsReader = new WorkStateReader(workStatePath);
    const midState = await wsReader.read();
    expect(midState!.workflow!.completed_steps).toEqual(['lint']);
    expect(midState!.workflow!.current_step).toBe('test');

    // Create a NEW runner (simulating fresh session / crash recovery)
    const runner2 = createRunner();
    const resumeResult = await runner2.resume();

    expect(resumeResult).not.toBeNull();
    expect(resumeResult!.runId).toBe(runId);
    expect(resumeResult!.remainingSteps).toEqual(['test', 'build']);

    // Complete remaining steps
    for (const stepId of resumeResult!.remainingSteps) {
      await runner2.advanceStep(resumeResult!.runId, stepId);
      await runner2.completeStep(resumeResult!.runId, stepId);
    }

    // Verify all steps complete
    const runStore = new WorkflowRunStore(patternsDir);
    const completedSteps = await runStore.getCompletedSteps(runId);
    expect(completedSteps).toEqual(expect.arrayContaining(['lint', 'test', 'build']));

    // Verify WorkState.workflow is null after completion
    const finalState = await wsReader.read();
    expect(finalState!.workflow).toBeNull();
  });
});

// ============================================================================
// 3. Extends composition: child overrides parent
// ============================================================================

describe('Extends composition: child overrides parent', () => {
  it('merges parent and child steps with override', async () => {
    // Write parent workflow: steps A, B, C
    await writeWorkflow('parent', {
      name: 'parent',
      version: 1,
      steps: [
        { id: 'A', skill: 'skill-a', description: 'Parent A' },
        { id: 'B', skill: 'skill-b', description: 'Parent B' },
        { id: 'C', skill: 'skill-c', needs: ['B'] },
      ],
    });

    // Write child workflow: extends parent, overrides B, adds D
    await writeWorkflow('child', {
      name: 'child',
      version: 1,
      extends: 'parent',
      steps: [
        { id: 'B', skill: 'better-b', description: 'Child B override' },
        { id: 'D', skill: 'skill-d', needs: ['C'] },
      ],
    });

    // Load both workflows
    const loadWorkflow = async (name: string): Promise<WorkflowDefinition | null> => {
      const filePath = join(workflowDir, `${name}.workflow.yaml`);
      return parseWorkflowFile(filePath);
    };

    const childDef = await loadWorkflow('child');
    expect(childDef).not.toBeNull();
    expect(childDef!.extends).toBe('parent');

    // Resolve extends
    const result = await resolveExtends(childDef!, loadWorkflow);
    expect('error' in result).toBe(false);

    if (!('error' in result)) {
      const { resolved, chain } = result;

      // Chain should be root-first: parent -> child
      expect(chain).toEqual(['parent', 'child']);

      // Merged steps should have A (parent), B (child override), C (parent), D (child)
      const stepIds = resolved.steps.map((s) => s.id);
      expect(stepIds).toContain('A');
      expect(stepIds).toContain('B');
      expect(stepIds).toContain('C');
      expect(stepIds).toContain('D');

      // B should be the child's version
      const stepB = resolved.steps.find((s) => s.id === 'B')!;
      expect(stepB.skill).toBe('better-b');
      expect(stepB.description).toBe('Child B override');

      // Validate the merged result
      const validation = await validateWorkflow(resolved, async () => true);
      expect(validation.valid).toBe(true);
    }
  });
});

// ============================================================================
// 4. Validation failures
// ============================================================================

describe('Validation failures', () => {
  it('detects circular dependencies', async () => {
    const circularDef: WorkflowDefinition = {
      name: 'circular',
      version: 1,
      extends: null,
      steps: [
        { id: 'A', skill: 'skill-a', needs: ['B'] },
        { id: 'B', skill: 'skill-b', needs: ['A'] },
      ],
    };

    const validation = await validateWorkflow(circularDef, async () => true);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some((e) => e.includes('Circular'))).toBe(true);
  });

  it('detects non-existent skills', async () => {
    const def: WorkflowDefinition = {
      name: 'missing-skills',
      version: 1,
      extends: null,
      steps: [
        { id: 'A', skill: 'nonexistent-skill', needs: [] },
      ],
    };

    // skillExists returns false for all skills
    const validation = await validateWorkflow(def, async () => false);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('unknown skill'))).toBe(true);
  });

  it('detects unknown needs references', async () => {
    const def: WorkflowDefinition = {
      name: 'bad-refs',
      version: 1,
      extends: null,
      steps: [
        { id: 'A', skill: 'skill-a', needs: ['Z'] },
      ],
    };

    const validation = await validateWorkflow(def, async () => true);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('unknown step "Z"'))).toBe(true);
  });
});

// ============================================================================
// 5. List workflows
// ============================================================================

describe('List workflows', () => {
  it('lists multiple workflow YAML files with metadata', async () => {
    // Write 2 workflow YAML files
    await writeWorkflow('deploy', {
      name: 'deploy',
      version: 1,
      description: 'Deploy pipeline',
      steps: [
        { id: 'lint', skill: 'linter' },
        { id: 'build', skill: 'builder', needs: ['lint'] },
      ],
    });

    await writeWorkflow('test-suite', {
      name: 'test-suite',
      version: 1,
      description: 'Test suite runner',
      steps: [
        { id: 'unit', skill: 'unit-tester' },
        { id: 'integration', skill: 'int-tester' },
        { id: 'e2e', skill: 'e2e-tester', needs: ['unit', 'integration'] },
      ],
    });

    // Read them via readdir + parse
    const entries = await readdir(workflowDir);
    const yamlFiles = entries.filter((f) => f.endsWith('.workflow.yaml'));
    expect(yamlFiles).toHaveLength(2);

    const workflows: Array<{
      name: string;
      description?: string;
      steps: number;
    }> = [];

    for (const file of yamlFiles) {
      const filePath = join(workflowDir, file);
      const def = await parseWorkflowFile(filePath);
      if (def) {
        workflows.push({
          name: def.name,
          description: def.description,
          steps: def.steps.length,
        });
      }
    }

    expect(workflows).toHaveLength(2);

    const deploy = workflows.find((w) => w.name === 'deploy');
    expect(deploy).toBeDefined();
    expect(deploy!.description).toBe('Deploy pipeline');
    expect(deploy!.steps).toBe(2);

    const testSuite = workflows.find((w) => w.name === 'test-suite');
    expect(testSuite).toBeDefined();
    expect(testSuite!.description).toBe('Test suite runner');
    expect(testSuite!.steps).toBe(3);
  });

  it('handles empty workflow directory gracefully', async () => {
    const entries = await readdir(workflowDir);
    const yamlFiles = entries.filter((f) => f.endsWith('.workflow.yaml'));
    expect(yamlFiles).toHaveLength(0);
  });
});
