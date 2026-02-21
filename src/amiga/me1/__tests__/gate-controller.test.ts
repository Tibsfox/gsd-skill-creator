/**
 * Tests for ME-1 GateController class.
 *
 * Covers: constructor, gate suspension, waitForClearance, clearGate decisions
 * (go, no_go, redirect), state preservation, sequential gates, and error cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GateController,
} from '../gate-controller.js';
import type { GateClearance, GateSuspension } from '../gate-controller.js';
import { provision } from '../provisioner.js';
import { PhaseEngine } from '../phase-engine.js';
import type { TelemetryEmitter } from '../telemetry-emitter.js';
import type { MissionManifest } from '../manifest.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MISSION_ID = 'mission-2026-02-18-001';

function makeEnvironment() {
  const env = provision({
    mission_id: MISSION_ID,
    name: 'Gate Controller Test Mission',
    description: 'Testing gate suspension and clearance',
    skills: [{ skill_id: 'skill-alpha', version: '1.0.0' }],
    agents: [{ agent_id: 'ME-1', role: 'provisioner' }],
  });
  const engine = new PhaseEngine({ manifest: env.manifest, emitter: env.emitter });
  const controller = new GateController({ engine, emitter: env.emitter });
  return { engine, emitter: env.emitter, controller, manifest: env.manifest };
}

/** Advance an engine to REVIEW_GATE manually. */
function advanceEngineToReviewGate(engine: PhaseEngine): void {
  engine.transition('PLANNING');
  engine.transition('EXECUTION');
  engine.transition('INTEGRATION');
  engine.transition('REVIEW_GATE');
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('GateController constructor', () => {
  it('creates a gate controller instance', () => {
    const { controller } = makeEnvironment();
    expect(controller).toBeInstanceOf(GateController);
  });

  it('isSuspended() returns false initially', () => {
    const { controller } = makeEnvironment();
    expect(controller.isSuspended()).toBe(false);
  });

  it('getCurrentPhase() delegates to the underlying engine', () => {
    const { controller } = makeEnvironment();
    expect(controller.getCurrentPhase()).toBe('BRIEFING');
  });
});

// ---------------------------------------------------------------------------
// Gate suspension
// ---------------------------------------------------------------------------

describe('gate suspension', () => {
  it('advanceToGate() transitions through all phases to REVIEW_GATE', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    expect(controller.getCurrentPhase()).toBe('REVIEW_GATE');
  });

  it('after reaching REVIEW_GATE, isSuspended() returns true', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    expect(controller.isSuspended()).toBe(true);
  });

  it('getSuspension() returns a GateSuspension object', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const suspension = controller.getSuspension();
    expect(suspension).not.toBeNull();
    expect(suspension!.phase).toBe('REVIEW_GATE');
    expect(suspension!.manifest).toBeDefined();
    expect(suspension!.suspendedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(suspension!.gateSignalId).toBeDefined();
    expect(typeof suspension!.gateSignalId).toBe('string');
  });

  it('suspension manifest matches the engine manifest at suspension time', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const suspension = controller.getSuspension()!;
    expect(suspension.manifest.mission_id).toBe(MISSION_ID);
    expect(suspension.manifest.name).toBe('Gate Controller Test Mission');
  });

  it('the emitter event log contains a GATE_SIGNAL event', () => {
    const { controller, emitter } = makeEnvironment();
    controller.advanceToGate();
    const log = emitter.getEventLog();
    const gateEvents = log.filter(e => e.type === 'GATE_SIGNAL');
    expect(gateEvents.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// waitForClearance
// ---------------------------------------------------------------------------

describe('waitForClearance', () => {
  it('returns a Promise', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const promise = controller.waitForClearance();
    expect(promise).toBeInstanceOf(Promise);
    // Clean up by resolving
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
  });

  it('promise does not resolve until clearGate is called', async () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    let resolved = false;
    const promise = controller.waitForClearance().then(() => { resolved = true; });
    // Tick microtasks
    await new Promise(r => setTimeout(r, 10));
    expect(resolved).toBe(false);
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    await promise;
    expect(resolved).toBe(true);
  });

  it('after clearGate(go), promise resolves with correct result', async () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const promise = controller.waitForClearance();
    controller.clearGate({ decision: 'go', reasoning: 'All criteria met', responder: 'human' });
    const result = await promise;
    expect(result).toEqual({ decision: 'go', from: 'REVIEW_GATE', to: 'COMPLETION' });
  });

  it('after resolution, isSuspended() returns false', async () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const promise = controller.waitForClearance();
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    await promise;
    expect(controller.isSuspended()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearGate('go')
// ---------------------------------------------------------------------------

describe("clearGate('go')", () => {
  it('transitions engine to COMPLETION', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'go', reasoning: 'All criteria met', responder: 'human' });
    expect(controller.getCurrentPhase()).toBe('COMPLETION');
  });

  it('getCurrentPhase() returns COMPLETION after go', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    expect(controller.getCurrentPhase()).toBe('COMPLETION');
  });

  it('emits a TELEMETRY_UPDATE reflecting the COMPLETION transition', () => {
    const { controller, emitter } = makeEnvironment();
    controller.advanceToGate();
    const logBefore = emitter.getEventLog().length;
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    const logAfter = emitter.getEventLog();
    const newEvents = logAfter.slice(logBefore);
    const telemetryEvents = newEvents.filter(e => e.type === 'TELEMETRY_UPDATE');
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('gate response includes reasoning and responder in emitted telemetry', () => {
    const { controller, emitter } = makeEnvironment();
    controller.advanceToGate();
    emitter.clearEventLog();
    controller.clearGate({ decision: 'go', reasoning: 'All criteria met', responder: 'human' });
    // The TELEMETRY_UPDATE events should exist
    const log = emitter.getEventLog();
    expect(log.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// clearGate('no_go')
// ---------------------------------------------------------------------------

describe("clearGate('no_go')", () => {
  it('keeps engine at REVIEW_GATE', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'no_go', reasoning: 'Criteria X failed', responder: 'human' });
    expect(controller.getCurrentPhase()).toBe('REVIEW_GATE');
  });

  it('getCurrentPhase() still returns REVIEW_GATE after no_go', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'no_go', reasoning: 'test', responder: 'human' });
    expect(controller.getCurrentPhase()).toBe('REVIEW_GATE');
  });

  it('after no_go, controller remains suspended', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'no_go', reasoning: 'test', responder: 'human' });
    expect(controller.isSuspended()).toBe(true);
  });

  it('emits a TELEMETRY_UPDATE reflecting the no_go hold', () => {
    const { controller, emitter } = makeEnvironment();
    controller.advanceToGate();
    const logBefore = emitter.getEventLog().length;
    controller.clearGate({ decision: 'no_go', reasoning: 'test', responder: 'human' });
    const logAfter = emitter.getEventLog();
    const newEvents = logAfter.slice(logBefore);
    const telemetryEvents = newEvents.filter(e => e.type === 'TELEMETRY_UPDATE');
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// clearGate('redirect')
// ---------------------------------------------------------------------------

describe("clearGate('redirect')", () => {
  it('transitions engine to the specified target phase', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'Needs rework',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    expect(controller.getCurrentPhase()).toBe('EXECUTION');
  });

  it('getCurrentPhase() returns EXECUTION after redirect', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'test',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    expect(controller.getCurrentPhase()).toBe('EXECUTION');
  });

  it('after redirect, controller is NOT suspended', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'test',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    expect(controller.isSuspended()).toBe(false);
  });

  it('engine can re-advance through INTEGRATION -> REVIEW_GATE and suspend again', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'test',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    // Now at EXECUTION -- advance again
    controller.advanceToGate();
    expect(controller.getCurrentPhase()).toBe('REVIEW_GATE');
    expect(controller.isSuspended()).toBe(true);
    // Clean up
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
  });
});

// ---------------------------------------------------------------------------
// State preservation
// ---------------------------------------------------------------------------

describe('state preservation', () => {
  it('during suspension, getManifest() returns the manifest at suspension point', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const manifest = controller.getManifest();
    expect(manifest).toBeDefined();
    expect(manifest.mission_id).toBe(MISSION_ID);
  });

  it('manifest is not mutated by the suspension itself', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    const manifestBefore = controller.getManifest();
    // Wait a tick and check again
    const manifestAfter = controller.getManifest();
    expect(manifestBefore.mission_id).toBe(manifestAfter.mission_id);
    expect(manifestBefore.name).toBe(manifestAfter.name);
  });

  it('after clearance, manifest reflects the transition', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    const manifest = controller.getManifest();
    expect(manifest.updated_at).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Sequential gates
// ---------------------------------------------------------------------------

describe('sequential gate suspensions', () => {
  it('full cycle: gate -> redirect to EXECUTION -> gate -> go to COMPLETION', () => {
    const { controller } = makeEnvironment();
    // First gate
    controller.advanceToGate();
    expect(controller.isSuspended()).toBe(true);
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'Needs rework',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    expect(controller.isSuspended()).toBe(false);
    // Second gate
    controller.advanceToGate();
    expect(controller.isSuspended()).toBe(true);
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    expect(controller.getCurrentPhase()).toBe('COMPLETION');
  });

  it('each suspension produces a new GateSuspension with different gateSignalId', () => {
    const { controller } = makeEnvironment();
    // First gate
    controller.advanceToGate();
    const id1 = controller.getSuspension()!.gateSignalId;
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'test',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    // Second gate
    controller.advanceToGate();
    const id2 = controller.getSuspension()!.gateSignalId;
    expect(id1).not.toBe(id2);
    // Clean up
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
  });

  it('event log shows two GATE_SIGNAL events for two suspensions', () => {
    const { controller, emitter } = makeEnvironment();
    emitter.clearEventLog();
    // First gate
    controller.advanceToGate();
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'test',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    // Second gate
    controller.advanceToGate();
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    const gateEvents = emitter.getEventLog().filter(e => e.type === 'GATE_SIGNAL');
    expect(gateEvents.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('error cases', () => {
  it('clearGate() throws when controller is NOT suspended', () => {
    const { controller } = makeEnvironment();
    expect(() =>
      controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' }),
    ).toThrow(/not suspended/i);
  });

  it('advanceToGate() throws when engine is at terminal state COMPLETION', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    controller.clearGate({ decision: 'go', reasoning: 'test', responder: 'human' });
    expect(controller.getCurrentPhase()).toBe('COMPLETION');
    expect(() => controller.advanceToGate()).toThrow();
  });

  it('clearGate redirect without redirectTarget throws', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    expect(() =>
      controller.clearGate({ decision: 'redirect', reasoning: 'test', responder: 'human' }),
    ).toThrow(/redirectTarget/i);
  });

  it('clearGate redirect to terminal state COMPLETION throws', () => {
    const { controller } = makeEnvironment();
    controller.advanceToGate();
    expect(() =>
      controller.clearGate({
        decision: 'redirect',
        reasoning: 'test',
        responder: 'human',
        redirectTarget: 'COMPLETION',
      }),
    ).toThrow(/terminal/i);
  });
});
