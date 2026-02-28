/**
 * PhaseController test suite.
 *
 * TDD RED phase: tests written to verify PhaseController behavior.
 * Covers SESS-02 (phase ordering), SESS-03 (agent activation matrix),
 * SESS-05 (timer via TechniqueTransition), SESS-06 (facilitator announcements).
 *
 * Integration tests: Uses real SessionManager + real RulesEngine
 * (not mocks). Each test uses an isolated temp directory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SessionManager } from './session-manager.js';
import { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from './rules-engine.js';
import { PhaseController } from './phase-controller.js';
import type { TechniqueTransition } from './phase-controller.js';
import type { SessionPhase } from '../shared/types.js';

// ============================================================================
// Test setup
// ============================================================================

let testDir: string;
let sessionManager: SessionManager;
let rulesEngine: RulesEngine;
let controller: PhaseController;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brainstorm-test-'));
  sessionManager = new SessionManager({ brainstormDir: testDir });
  rulesEngine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  controller = new PhaseController(sessionManager, rulesEngine);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

/**
 * Create a session and activate it (status: active) via setActiveTechnique.
 * Returns the session id.
 */
async function createActiveSession(): Promise<string> {
  const session = await sessionManager.createSession('Test problem');
  await sessionManager.setActiveTechnique(session.id, 'freewriting');
  return session.id;
}

// ============================================================================
// Phase ordering (SESS-02)
// ============================================================================

describe('PhaseController -- Phase Ordering (SESS-02)', () => {
  it('canTransitionTo: explore -> diverge is allowed', async () => {
    const id = await createActiveSession();
    const result = await controller.canTransitionTo(id, 'diverge');
    expect(result.allowed).toBe(true);
  });

  it('canTransitionTo: explore -> organize is NOT allowed (skip)', async () => {
    const id = await createActiveSession();
    const result = await controller.canTransitionTo(id, 'organize');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
    // Reason should mention skip or next
    expect(
      result.reason!.toLowerCase().includes('skip') ||
        result.reason!.toLowerCase().includes('must') ||
        result.reason!.toLowerCase().includes('next'),
    ).toBe(true);
  });

  it('canTransitionTo: diverge -> explore is NOT allowed (backward)', async () => {
    const id = await createActiveSession();
    // Transition to diverge first
    await controller.transitionTo(id, 'diverge');
    const result = await controller.canTransitionTo(id, 'explore');
    expect(result.allowed).toBe(false);
  });
});

// ============================================================================
// Phase transitions with agent activation (SESS-03, SESS-06)
// ============================================================================

describe('PhaseController -- Phase Transitions (SESS-03, SESS-06)', () => {
  it('transitionTo: explore -> diverge returns complete PhaseTransitionResult', async () => {
    const id = await createActiveSession();
    const result = await controller.transitionTo(id, 'diverge');

    expect(result.success).toBe(true);
    expect(result.from_phase).toBe('explore');
    expect(result.to_phase).toBe('diverge');
    expect(result.agents_activated).toContain('ideator');
    expect(result.facilitator_announcement).toBeTruthy();
    expect(result.facilitator_announcement).toContain('Diverge');
  });

  it('transitionTo: activates correct agents per matrix', async () => {
    const id = await createActiveSession();
    await controller.transitionTo(id, 'diverge');

    const session = await sessionManager.getSession(id);
    expect(session.active_agents).toContain('ideator');
    expect(session.active_agents).toContain('questioner');
    expect(session.active_agents).toContain('mapper');
    expect(session.active_agents).toContain('scribe');
    expect(session.active_agents).toContain('facilitator');
  });

  it('transitionTo: converge activates critic', async () => {
    const id = await createActiveSession();
    await controller.transitionTo(id, 'diverge');
    await controller.transitionTo(id, 'organize');
    await controller.transitionTo(id, 'converge');

    const session = await sessionManager.getSession(id);
    expect(session.active_agents).toContain('critic');
  });

  it('transitionTo: diverge HARD BLOCKS critic (SESS-03 defense-in-depth)', async () => {
    const id = await createActiveSession();
    await controller.transitionTo(id, 'diverge');

    // Attempt to manually activate critic during diverge
    const result = await controller.activateAgent(id, 'critic');
    expect(result.success).toBe(false);
    expect(result.reason).toBeDefined();
    expect(
      result.reason!.toLowerCase().includes('critic') ||
        result.reason!.toLowerCase().includes('converge') ||
        result.reason!.toLowerCase().includes('criticism'),
    ).toBe(true);
  });
});

// ============================================================================
// Agent matrix queries (SESS-03)
// ============================================================================

describe('PhaseController -- Agent Matrix (SESS-03)', () => {
  it('getActiveAgents diverge excludes critic', () => {
    const agents = controller.getActiveAgents('diverge', null);
    expect(agents).not.toContain('critic');
  });

  it('getActiveAgents converge includes critic', () => {
    const agents = controller.getActiveAgents('converge', null);
    expect(agents).toContain('critic');
  });

  it('getActiveAgents: scribe and facilitator always present for all phases', () => {
    const phases: SessionPhase[] = [
      'explore',
      'diverge',
      'organize',
      'converge',
      'act',
    ];
    for (const phase of phases) {
      const agents = controller.getActiveAgents(phase, null);
      expect(agents).toContain('scribe');
      expect(agents).toContain('facilitator');
    }
  });
});

// ============================================================================
// Facilitator announcements (SESS-06)
// ============================================================================

describe('PhaseController -- Facilitator Announcements (SESS-06)', () => {
  it('facilitator_announcement populated on every transition', async () => {
    const id = await createActiveSession();

    const phases: SessionPhase[] = [
      'diverge',
      'organize',
      'converge',
      'act',
    ];

    for (const phase of phases) {
      const result = await controller.transitionTo(id, phase);
      expect(result.success).toBe(true);
      expect(result.facilitator_announcement).toBeTruthy();
      expect(result.facilitator_announcement.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Technique transitions and timer (SESS-05)
// ============================================================================

describe('PhaseController -- Technique Transitions (SESS-05)', () => {
  it('TechniqueTransition resets timer to technique default', async () => {
    const id = await createActiveSession();

    // Set brainwriting-635 first (1_800_000ms)
    await controller.setTechniqueTimer(id, 'brainwriting-635');
    const beforeSwitch = await controller.getTimerState(id);
    expect(beforeSwitch.technique_timer!.total_ms).toBe(1_800_000);

    // Apply technique transition to rapid-ideation with reset-to-default
    const transition: TechniqueTransition = {
      session_id: id,
      from_technique: 'brainwriting-635',
      to_technique: 'rapid-ideation',
      timer_behavior: 'reset-to-default',
    };
    await controller.applyTechniqueTransition(transition);

    const afterSwitch = await controller.getTimerState(id);
    expect(afterSwitch.technique_timer!.total_ms).toBe(60_000);
  });

  it('applyTechniqueTransition with null to_technique clears timer', async () => {
    const id = await createActiveSession();
    await controller.setTechniqueTimer(id, 'rapid-ideation');

    // Verify timer exists
    const before = await controller.getTimerState(id);
    expect(before.technique_timer).not.toBeNull();

    // Clear technique
    const transition: TechniqueTransition = {
      session_id: id,
      from_technique: 'rapid-ideation',
      to_technique: null,
      timer_behavior: 'reset-to-default',
    };
    await controller.applyTechniqueTransition(transition);

    const after = await controller.getTimerState(id);
    expect(after.technique_timer).toBeNull();
  });
});
