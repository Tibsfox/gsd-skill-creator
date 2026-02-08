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

// ============================================================================
// Next-phase resolution
// ============================================================================

describe('LifecycleCoordinator - next-phase resolution', () => {
  it('advances to next incomplete phase when current phase is fully done', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');

    // Current phase (39) is fully complete
    const phase39Dir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phase39Dir, { recursive: true });
    writeFileSync(join(phase39Dir, '39-01-PLAN.md'), '# Plan');
    writeFileSync(join(phase39Dir, '39-01-SUMMARY.md'), '# Summary');
    writeFileSync(join(phase39Dir, '39-UAT.md'), '# UAT');

    // Next phase (40) exists but is incomplete
    const phase40Dir = join(phasesDir, '40-cli');
    mkdirSync(phase40Dir, { recursive: true });

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
        { number: '40', name: 'CLI', complete: false, directory: '40-cli' },
      ],
      plansByPhase: {
        '39': [{ id: '39-01', complete: true }],
        '40': [],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    // Should suggest discuss/plan for phase 40, not phase 39
    expect(result.primary.args).toBe('40');
    expect(result.context).toMatch(/40|next phase/i);
  });

  it('suggests audit-milestone when current phase is last and fully done', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');

    const phase39Dir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phase39Dir, { recursive: true });
    writeFileSync(join(phase39Dir, '39-01-PLAN.md'), '# Plan');
    writeFileSync(join(phase39Dir, '39-01-SUMMARY.md'), '# Summary');
    writeFileSync(join(phase39Dir, '39-UAT.md'), '# UAT');

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
        // No next phase
      ],
      plansByPhase: {
        '39': [{ id: '39-01', complete: true }],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:audit-milestone');
  });

  it('uses array order not arithmetic for non-sequential phase numbers', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');

    // Phase 36 is done
    const phase36Dir = join(phasesDir, '36-discovery');
    mkdirSync(phase36Dir, { recursive: true });
    writeFileSync(join(phase36Dir, '36-01-PLAN.md'), '# Plan');
    writeFileSync(join(phase36Dir, '36-01-SUMMARY.md'), '# Summary');
    writeFileSync(join(phase36Dir, '36-UAT.md'), '# UAT');

    // Phase 39 is next (skipping 37, 38)
    const phase39Dir = join(phasesDir, '39-lifecycle');
    mkdirSync(phase39Dir, { recursive: true });

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: false, directory: '36-discovery' },
        { number: '37', name: 'State', complete: true },
        { number: '39', name: 'Lifecycle', complete: false, directory: '39-lifecycle' },
      ],
      plansByPhase: {
        '36': [{ id: '36-01', complete: true }],
        '39': [],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    // Should resolve to phase 39 (next incomplete after 36), not phase 37 (arithmetic)
    expect(result.primary.args).toBe('39');
  });
});

// ============================================================================
// Phase mutation commands
// ============================================================================

describe('LifecycleCoordinator - phase mutation commands', () => {
  it('gsd:insert-phase returns plan-phase suggestion', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phaseDir, { recursive: true });
    writeFileSync(join(phaseDir, '39-01-PLAN.md'), '# Plan');

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
      ],
      plansByPhase: {
        '39': [{ id: '39-01', complete: false }],
      },
    });

    const result = await coordinator.suggestNextStep(state, 'gsd:insert-phase');

    expect(result.primary.command).toBe('gsd:plan-phase');
    expect(result.context).toMatch(/inserted/i);
  });

  it('gsd:add-phase returns plan-phase suggestion', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '40-cli');
    mkdirSync(phaseDir, { recursive: true });

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '40', name: 'CLI', complete: false, directory: '40-cli' },
      ],
      plansByPhase: { '40': [] },
    });

    const result = await coordinator.suggestNextStep(state, 'gsd:add-phase');

    expect(result.primary.command).toBe('gsd:plan-phase');
    expect(result.context).toMatch(/added/i);
  });
});

// ============================================================================
// Integration test with filesystem fixture
// ============================================================================

describe('LifecycleCoordinator - integration', () => {
  it('full flow: state -> stage -> scan -> suggest for partially executed phase', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phaseDir, { recursive: true });

    // Create realistic fixture: plan 1 done, plan 2 not done
    writeFileSync(join(phaseDir, '39-01-PLAN.md'), '---\nphase: 39\nplan: "01"\n---\n# Plan 1');
    writeFileSync(join(phaseDir, '39-01-SUMMARY.md'), '---\nphase: 39\nplan: "01"\n---\n# Summary 1');
    writeFileSync(join(phaseDir, '39-02-PLAN.md'), '---\nphase: 39\nplan: "02"\n---\n# Plan 2');
    // No 39-02-SUMMARY.md -> plan 2 is unexecuted

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
          { id: '39-02', complete: false },
        ],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    // Should suggest execute-phase 39 because 39-02 has no summary
    expect(result.primary.command).toBe('gsd:execute-phase');
    expect(result.primary.args).toBe('39');
    expect(result.primary.clearContext).toBe(true);
    expect(result.stage).toBe('executing');
    expect(result.context).toMatch(/1.*2|remaining/i);
  });

  it('full flow: complete phase with UAT advances to next phase', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');

    // Phase 39 fully complete
    const phase39Dir = join(phasesDir, '39-lifecycle-coordination');
    mkdirSync(phase39Dir, { recursive: true });
    writeFileSync(join(phase39Dir, '39-01-PLAN.md'), '# Plan');
    writeFileSync(join(phase39Dir, '39-01-SUMMARY.md'), '# Summary');
    writeFileSync(join(phase39Dir, '39-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(phase39Dir, '39-02-SUMMARY.md'), '# Summary 2');
    writeFileSync(join(phase39Dir, '39-UAT.md'), '# UAT');

    // Phase 40 exists but not started
    const phase40Dir = join(phasesDir, '40-cli');
    mkdirSync(phase40Dir, { recursive: true });

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '39', name: 'Lifecycle Coordination', complete: false, directory: '39-lifecycle-coordination' },
        { number: '40', name: 'CLI', complete: false, directory: '40-cli' },
      ],
      plansByPhase: {
        '39': [
          { id: '39-01', complete: true },
          { id: '39-02', complete: true },
        ],
        '40': [],
      },
    });

    const result = await coordinator.suggestNextStep(state);

    // Should suggest discussing phase 40
    expect(result.primary.command).toBe('gsd:discuss-phase');
    expect(result.primary.args).toBe('40');
  });

  it('empty phase directory suggests discuss-phase', async () => {
    const planningDir = createTempDir();
    const phasesDir = join(planningDir, 'phases');
    const phaseDir = join(phasesDir, '41-testing');
    mkdirSync(phaseDir, { recursive: true });
    // Directory exists but is completely empty

    const coordinator = new LifecycleCoordinator(planningDir);
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '41', name: 'Testing', complete: false, directory: '41-testing' },
      ],
      plansByPhase: { '41': [] },
    });

    const result = await coordinator.suggestNextStep(state);

    expect(result.primary.command).toBe('gsd:discuss-phase');
    expect(result.primary.args).toBe('41');
  });
});
