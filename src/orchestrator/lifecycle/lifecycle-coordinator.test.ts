/**
 * Tests for the LifecycleCoordinator service.
 *
 * Verifies that the coordinator correctly wires state -> stage ->
 * artifacts -> suggestion, producing the right NextStepSuggestion
 * for each lifecycle scenario.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LifecycleCoordinator } from './lifecycle-coordinator.js';
import type { ProjectState } from '../state/types.js';

// ============================================================================
// Fixtures
// ============================================================================

let tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lifecycle-coord-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

/** Helper to create a minimal ProjectState with overrides */
function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    initialized: true,
    config: {} as ProjectState['config'],
    position: null,
    phases: [],
    plansByPhase: {},
    project: null,
    state: null,
    hasRoadmap: false,
    hasState: false,
    hasProject: false,
    hasConfig: false,
    ...overrides,
  };
}

// ============================================================================
// LifecycleCoordinator
// ============================================================================

describe('LifecycleCoordinator', () => {
  it('suggests gsd:new-project for uninitialized state', async () => {
    const planningDir = createTempDir();
    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({ initialized: false });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:new-project');
    expect(result.stage).toBe('uninitialized');
  });

  it('suggests gsd:new-milestone for initialized state without roadmap', async () => {
    const planningDir = createTempDir();
    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({ initialized: true, hasRoadmap: false });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:new-milestone');
    expect(result.stage).toBe('initialized');
  });

  it('suggests gsd:execute-phase for phase with PLAN files but no SUMMARY files', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phaseDir, { recursive: true });

    // Create PLAN files but no SUMMARY files
    writeFileSync(join(phaseDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(phaseDir, '39-02-PLAN.md'), '# Plan 2');

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
      ],
      plansByPhase: {
        '39': [
          { id: '39-01', complete: false },
          { id: '39-02', complete: false },
        ],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:execute-phase');
    expect(result.primary.args).toBe('39');
    expect(result.stage).toBe('executing');
  });

  it('suggests gsd:audit-milestone when all phases are complete', async () => {
    const planningDir = createTempDir();
    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: true },
        { number: '37', name: 'State', complete: true },
        { number: '38', name: 'Intent', complete: true },
      ],
      plansByPhase: {},
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:audit-milestone');
    expect(result.stage).toBe('milestone-end');
  });

  it('completedCommand flows through to context', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phaseDir, { recursive: true });

    writeFileSync(join(phaseDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(phaseDir, '39-02-PLAN.md'), '# Plan 2');

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
      ],
      plansByPhase: {
        '39': [
          { id: '39-01', complete: false },
          { id: '39-02', complete: false },
        ],
      },
    });

    const result = await coordinator.suggestNextStep(state, 'plan-phase');

    expect(result.context).toMatch(/plan-phase/i);
    expect(result.primary.command).toBe('gsd:execute-phase');
  });

  it('suggests gsd:discuss-phase for phase with no plans and no context', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '40-cli');
    mkdirSync(phaseDir, { recursive: true });

    // Empty directory -- no artifacts
    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '40', name: 'CLI', complete: false, directory: '40-cli' },
      ],
      plansByPhase: {
        '40': [],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:discuss-phase');
    expect(result.primary.args).toBe('40');
  });

  it('suggests gsd:plan-phase for phase with context but no plans', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '40-cli');
    mkdirSync(phaseDir, { recursive: true });

    writeFileSync(join(phaseDir, '40-CONTEXT.md'), '# Context');

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '40', name: 'CLI', complete: false, directory: '40-cli' },
      ],
      plansByPhase: {},
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:plan-phase');
    expect(result.primary.args).toBe('40');
  });

  it('suggests gsd:verify-work when all plans executed but no UAT', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phaseDir, { recursive: true });

    writeFileSync(join(phaseDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(phaseDir, '39-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(phaseDir, '39-01-SUMMARY.md'), '# Summary 1');
    writeFileSync(join(phaseDir, '39-02-SUMMARY.md'), '# Summary 2');

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
      ],
      plansByPhase: {
        '39': [
          { id: '39-01', complete: true },
          { id: '39-02', complete: true },
        ],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:verify-work');
    expect(result.primary.args).toBe('39');
  });

  it('handles phase with no directory by using empty artifacts', async () => {
    const planningDir = createTempDir();
    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '50', name: 'Future Phase', complete: false },
        // No directory field set
      ],
      plansByPhase: {},
    });

    const result = await coordinator.suggestNextStep(state);

    // No directory means no artifacts found -> discuss
    expect(result.primary.command).toBe('gsd:discuss-phase');
  });
});
