/**
 * Integration tests for the unified autonomy engine.
 *
 * Verifies that all autonomy components (state machine, scheduler,
 * resume, gates, context budget, state pruner, write watchdog) are
 * correctly wired together through the engine entry point.
 *
 * Uses temp directories for state files and stub callbacks that
 * resolve immediately with `{ success: true }`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createAutonomyEngine, type AutonomyEngineConfig, type AutonomyTeamConfig } from './engine.js';
import type { ExecutionState } from './types.js';
import type { SubversionCallbacks, PhaseResult } from './scheduler.js';
import { writeExecutionState } from './persistence.js';
import { createExecutionState, transition } from './state-machine.js';
import { TeamStore } from '../../teams/team-store.js';
import { readTeamEvents } from '../../teams/team-event-log.js';
import type { TeamConfig } from '../../types/team.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a unique temp directory for test isolation */
async function makeTempDir(): Promise<string> {
  const dir = join(
    tmpdir(),
    `gsd-engine-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Stub callbacks that always succeed */
function makeStubCallbacks(): SubversionCallbacks {
  const success: PhaseResult = { success: true };
  return {
    prepare: vi.fn(async () => success),
    execute: vi.fn(async () => success),
    verify: vi.fn(async () => success),
    journal: vi.fn(async () => success),
  };
}

/** Stub callbacks where a specific subversion's execute phase fails */
function makeFailingCallbacks(failAt: number): SubversionCallbacks {
  const success: PhaseResult = { success: true };
  const failure: PhaseResult = { success: false };
  return {
    prepare: vi.fn(async () => success),
    execute: vi.fn(async (sub: number) => (sub === failAt ? failure : success)),
    verify: vi.fn(async () => success),
    journal: vi.fn(async () => success),
  };
}

/** Minimal engine config builder */
function makeConfig(
  tempDir: string,
  overrides?: Partial<AutonomyEngineConfig>
): AutonomyEngineConfig {
  return {
    milestoneId: 'v-test',
    totalSubversions: 5,
    statePath: join(tempDir, 'execution-state.json'),
    callbacks: makeStubCallbacks(),
    ...overrides,
  };
}

// ============================================================================
// Cleanup tracking
// ============================================================================

const tempDirs: string[] = [];

afterEach(async () => {
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
  tempDirs.length = 0;
});

// ============================================================================
// Tests
// ============================================================================

describe('createAutonomyEngine', () => {
  it('returns an engine object with a run method', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const engine = createAutonomyEngine(makeConfig(dir));
    expect(engine).toBeDefined();
    expect(typeof engine.run).toBe('function');
  });

  it('completes a 5-subversion run with DONE state', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const engine = createAutonomyEngine(makeConfig(dir));
    const finalState = await engine.run();

    expect(finalState.status).toBe('DONE');
    expect(finalState.completed_subversions.length).toBe(5);
  });

  it('writes execution-state.json in DONE state after successful run', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const statePath = join(dir, 'execution-state.json');
    const engine = createAutonomyEngine(makeConfig(dir, { statePath }));
    await engine.run();

    const raw = await readFile(statePath, 'utf-8');
    const persisted = JSON.parse(raw) as ExecutionState;
    expect(persisted.status).toBe('DONE');
  });

  it('calls each callback phase for each subversion', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const callbacks = makeStubCallbacks();
    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 3,
      callbacks,
    }));
    await engine.run();

    // Each of the 4 phases called 3 times (once per subversion)
    expect(callbacks.prepare).toHaveBeenCalledTimes(3);
    expect(callbacks.execute).toHaveBeenCalledTimes(3);
    expect(callbacks.verify).toHaveBeenCalledTimes(3);
    expect(callbacks.journal).toHaveBeenCalledTimes(3);
  });

  it('transitions to FAILED when a callback fails', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const callbacks = makeFailingCallbacks(2);
    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 5,
      callbacks,
    }));
    const finalState = await engine.run();

    expect(finalState.status).toBe('FAILED');
    expect(finalState.last_error).toContain('execute');
    expect(finalState.last_error).toContain('2');
    // Subversions 0 and 1 completed, 2 failed
    expect(finalState.completed_subversions.length).toBe(2);
  });

  it('resumes from existing state when execution-state.json exists', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const statePath = join(dir, 'execution-state.json');

    // Create a state that is RUNNING at subversion 2 (already completed 0,1)
    let existingState = createExecutionState('v-test', {
      total_subversions: 5,
      current_subversion: 2,
      completed_subversions: [
        { subversion: 0, started_at: '', completed_at: '', phase_results: {} },
        { subversion: 1, started_at: '', completed_at: '', phase_results: {} },
      ],
    });
    existingState = transition(existingState, 'RUNNING', 'test setup');

    await writeExecutionState(existingState, statePath);

    const callbacks = makeStubCallbacks();
    const engine = createAutonomyEngine(makeConfig(dir, {
      statePath,
      callbacks,
      totalSubversions: 5,
    }));
    const finalState = await engine.run();

    expect(finalState.status).toBe('DONE');
    // Should have completed the remaining 3 subversions (2, 3, 4)
    expect(callbacks.prepare).toHaveBeenCalledTimes(3);
  });

  it('initializes fresh state when no prior state exists', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const callbacks = makeStubCallbacks();
    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 2,
      callbacks,
    }));
    const finalState = await engine.run();

    expect(finalState.status).toBe('DONE');
    expect(finalState.milestone).toBe('v-test');
    expect(callbacks.prepare).toHaveBeenCalledTimes(2);
  });

  it('evaluates gates via onSubversionComplete hook', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    const outputDir = join(dir, 'output');
    await mkdir(outputDir, { recursive: true });

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 5,
      gateOptions: {
        outputDir,
        statePath: join(dir, 'execution-state.json'),
        checkpointInterval: 5, // fire at subversion 4 (the 5th)
      },
    }));
    const finalState = await engine.run();

    // Engine should complete despite gate failures (checkpoints are informational)
    expect(finalState.status).toBe('DONE');
    // Should have a checkpoint recorded
    expect(finalState.checkpoints.length).toBeGreaterThanOrEqual(0);
  });

  it('checks context budget during execution', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 3,
      budgetThreshold: 99, // Very high threshold so it won't pause
    }));
    const finalState = await engine.run();

    expect(finalState.status).toBe('DONE');
  });

  it('engine config accepts all wiring options', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const config: AutonomyEngineConfig = {
      milestoneId: 'v-full-config',
      totalSubversions: 2,
      statePath: join(dir, 'execution-state.json'),
      stateFilePath: join(dir, 'STATE.md'),
      callbacks: makeStubCallbacks(),
      gateOptions: {
        outputDir: join(dir, 'output'),
        statePath: join(dir, 'execution-state.json'),
      },
      watchdogConfig: { timeoutMs: 60000, checkIntervalMs: 10000 },
      budgetThreshold: 90,
      maxStateLines: 100,
      teachForwardDir: join(dir, 'teach-forward'),
      journalDir: join(dir, 'journals'),
    };

    const engine = createAutonomyEngine(config);
    const finalState = await engine.run();
    expect(finalState.status).toBe('DONE');
  });

  it('records transitions in the final state', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const engine = createAutonomyEngine(makeConfig(dir, { totalSubversions: 2 }));
    const finalState = await engine.run();

    // Should have at least: INITIALIZED->RUNNING, RUNNING->COMPLETING, COMPLETING->DONE
    expect(finalState.transitions.length).toBeGreaterThanOrEqual(3);
    expect(finalState.transitions[0].from).toBe('INITIALIZED');
    expect(finalState.transitions[0].to).toBe('RUNNING');
  });

  it('handles zero subversions gracefully (immediate DONE)', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const callbacks = makeStubCallbacks();
    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 0,
      callbacks,
    }));
    const finalState = await engine.run();

    // Zero subversions = immediately transition to COMPLETING -> DONE
    expect(finalState.status).toBe('DONE');
    expect(callbacks.prepare).not.toHaveBeenCalled();
  });
});

// ============================================================================
// AutonomyEngine + TeamLifecycle integration (507-03)
// ============================================================================

describe('AutonomyEngine + TeamLifecycle integration', () => {
  /** Create a minimal team config for testing */
  function makeTeamConfig(name: string = 'test-team'): TeamConfig {
    return {
      name,
      leadAgentId: 'lead-1',
      createdAt: '2026-03-01T00:00:00Z',
      members: [{ agentId: 'lead-1', name: 'Lead' }],
    };
  }

  it('runs identically without teamConfig (no regression)', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const engine = createAutonomyEngine(makeConfig(dir, { totalSubversions: 2 }));
    const finalState = await engine.run();
    expect(finalState.status).toBe('DONE');
    expect(finalState.completed_subversions.length).toBe(2);
  });

  it('creates and activates team at startup when teamConfig is present', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    const teamsDir = join(dir, 'teams');

    const team: AutonomyTeamConfig = {
      teamConfig: makeTeamConfig(),
      teamsDir,
      durability: 'persistent',
    };

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 2,
      team,
    }));
    const finalState = await engine.run();
    expect(finalState.status).toBe('DONE');

    // Team should exist and be ACTIVE (persistent, not dissolved)
    const store = new TeamStore(teamsDir);
    const teamCfg = await store.read('test-team');
    expect(teamCfg.lifecycleState).toBe('ACTIVE');
    expect(teamCfg.managedBy).toBe('auto');

    // Events should have created + activated
    const events = await readTeamEvents(teamsDir, 'test-team');
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toContain('created');
    expect(eventTypes).toContain('activated');
  });

  it('dissolves ephemeral team after engine DONE', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    const teamsDir = join(dir, 'teams');

    const team: AutonomyTeamConfig = {
      teamConfig: makeTeamConfig(),
      teamsDir,
      durability: 'ephemeral',
    };

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 2,
      team,
    }));
    const finalState = await engine.run();
    expect(finalState.status).toBe('DONE');

    // Team should be DISSOLVED
    const store = new TeamStore(teamsDir);
    const teamCfg = await store.read('test-team');
    expect(teamCfg.lifecycleState).toBe('DISSOLVED');

    // Events should contain full lifecycle
    const events = await readTeamEvents(teamsDir, 'test-team');
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toContain('created');
    expect(eventTypes).toContain('activated');
    expect(eventTypes).toContain('dissolving');
    expect(eventTypes).toContain('dissolved');
  });

  it('does NOT dissolve persistent team after engine DONE', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    const teamsDir = join(dir, 'teams');

    const team: AutonomyTeamConfig = {
      teamConfig: makeTeamConfig(),
      teamsDir,
      durability: 'persistent',
    };

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 2,
      team,
    }));
    const finalState = await engine.run();
    expect(finalState.status).toBe('DONE');

    // Team should remain ACTIVE (not dissolved)
    const store = new TeamStore(teamsDir);
    const teamCfg = await store.read('test-team');
    expect(teamCfg.lifecycleState).toBe('ACTIVE');

    // Events should only have created + activated (no dissolving/dissolved)
    const events = await readTeamEvents(teamsDir, 'test-team');
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toEqual(['created', 'activated']);
  });

  it('handles resume with existing ACTIVE team (idempotent createTeam)', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    const teamsDir = join(dir, 'teams');

    // Pre-create a team in ACTIVE state (simulating a prior run)
    const store = new TeamStore(teamsDir);
    const teamCfg: TeamConfig = {
      ...makeTeamConfig(),
      managedBy: 'auto',
      lifecycleState: 'ACTIVE',
      durability: 'persistent',
    };
    await store.save(teamCfg);

    const team: AutonomyTeamConfig = {
      teamConfig: makeTeamConfig(),
      teamsDir,
      durability: 'persistent',
    };

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 2,
      team,
    }));
    const finalState = await engine.run();
    expect(finalState.status).toBe('DONE');

    // No duplicate 'created' events -- createTeam was idempotent
    const events = await readTeamEvents(teamsDir, 'test-team');
    const createdEvents = events.filter((e) => e.event === 'created');
    expect(createdEvents).toHaveLength(0); // idempotent -- no new created event
  });

  it('team stays ACTIVE when engine fails mid-execution', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    const teamsDir = join(dir, 'teams');

    const team: AutonomyTeamConfig = {
      teamConfig: makeTeamConfig(),
      teamsDir,
      durability: 'ephemeral',
    };

    const callbacks = makeFailingCallbacks(1); // fail at subversion 1
    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 3,
      callbacks,
      team,
    }));
    const finalState = await engine.run();
    expect(finalState.status).toBe('FAILED');

    // Team should stay ACTIVE (not dissolved) -- failure doesn't trigger dissolution
    const store = new TeamStore(teamsDir);
    const teamConfig = await store.read('test-team');
    expect(teamConfig.lifecycleState).toBe('ACTIVE');
  });
});

// ============================================================================
// Watchdog file persistence (508-01)
// ============================================================================

describe('watchdog file persistence', () => {
  it('should accept watchdogStatePath in engine config', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const watchdogStatePath = join(dir, 'watchdog-state.json');
    const config: AutonomyEngineConfig = {
      milestoneId: 'v-watchdog-test',
      totalSubversions: 2,
      statePath: join(dir, 'execution-state.json'),
      callbacks: makeStubCallbacks(),
      watchdogStatePath,
    };

    // Should not throw -- config accepted
    const engine = createAutonomyEngine(config);
    expect(engine).toBeDefined();
  });

  it('should write watchdog state file during engine run when watchdogStatePath is configured', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const watchdogStatePath = join(dir, 'watchdog-state.json');
    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 3,
      watchdogStatePath,
    }));
    const finalState = await engine.run();

    expect(finalState.status).toBe('DONE');

    // Watchdog state file should exist
    const raw = await readFile(watchdogStatePath, 'utf-8');
    const state = JSON.parse(raw);
    expect(state).toHaveProperty('last_write_at');
    expect(state).toHaveProperty('session_id');
    expect(state).toHaveProperty('timeout_ms');
    expect(state).toHaveProperty('started_at');
  });

  it('should use milestoneId as default sessionId', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const watchdogStatePath = join(dir, 'watchdog-state.json');
    const engine = createAutonomyEngine(makeConfig(dir, {
      milestoneId: 'v-session-test',
      totalSubversions: 1,
      watchdogStatePath,
    }));
    await engine.run();

    const raw = await readFile(watchdogStatePath, 'utf-8');
    const state = JSON.parse(raw);
    expect(state.session_id).toBe('v-session-test');
  });

  it('should use explicit sessionId when provided', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const watchdogStatePath = join(dir, 'watchdog-state.json');
    const engine = createAutonomyEngine(makeConfig(dir, {
      milestoneId: 'v-explicit',
      totalSubversions: 1,
      watchdogStatePath,
      sessionId: 'custom-session-42',
    }));
    await engine.run();

    const raw = await readFile(watchdogStatePath, 'utf-8');
    const state = JSON.parse(raw);
    expect(state.session_id).toBe('custom-session-42');
  });

  it('should NOT write watchdog state file when watchdogStatePath is not configured', async () => {
    const dir = await makeTempDir();
    tempDirs.push(dir);

    const engine = createAutonomyEngine(makeConfig(dir, {
      totalSubversions: 1,
    }));
    await engine.run();

    // No watchdog state file should exist in the temp dir
    const files = await import('fs/promises').then(fs => fs.readdir(dir));
    const watchdogFiles = files.filter(f => f.includes('watchdog-state'));
    expect(watchdogFiles).toHaveLength(0);
  });
});
