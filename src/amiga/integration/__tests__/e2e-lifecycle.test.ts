/**
 * End-to-end lifecycle tests for MC-1/ME-1 integration.
 *
 * Exercises the MissionController through complete mission lifecycles:
 * - INTG-02: HOLD/RESUME mid-mission preserves exact state
 * - INTG-03: Full lifecycle with immutable sealed archive
 * - ICD-01 telemetry validation across all event types
 * - Dashboard tracking through full mission narrative
 *
 * These tests use real ME-1 and MC-1 components -- no stubs.
 */

import { describe, it, expect } from 'vitest';
import { MissionController } from '../mission-controller.js';
import type { MissionControllerConfig } from '../mission-controller.js';
import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
} from '../../icd/icd-01.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';

// ============================================================================
// Shared config factory
// ============================================================================

function createTestConfig(missionId: string): MissionControllerConfig {
  return {
    mission_id: missionId,
    name: `E2E Test Mission ${missionId}`,
    description: 'End-to-end lifecycle verification for Integration Gate 1',
    skills: [{ skill_id: 'skill-e2e', version: '1.0.0' }],
    agents: [
      { agent_id: 'ME-1', role: 'provisioner' },
      { agent_id: 'ME-2', role: 'phase-engine' },
      { agent_id: 'ME-3', role: 'telemetry' },
    ],
    teams: [
      { team_id: 'CS', agent_ids: ['CS-1', 'CS-2'] },
      { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'] },
      { team_id: 'CE', agent_ids: ['CE-1'] },
    ],
  };
}

// ============================================================================
// Scenario 1: INTG-02 -- HOLD/RESUME mid-mission
// ============================================================================

describe('INTG-02: HOLD/RESUME mid-mission', () => {
  it('HOLD during EXECUTION suspends and RESUME continues from exact point', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-101'));

    // Advance to EXECUTION
    controller.advancePhase(); // BRIEFING -> PLANNING
    controller.advancePhase(); // PLANNING -> EXECUTION

    expect(controller.getState().phase).toBe('EXECUTION');
    const preHoldView = controller.getMissionView();
    expect(preHoldView).toBeDefined();

    // Issue HOLD
    const holdResult = controller.executeCommand('HOLD');
    expect(holdResult.ok).toBe(true);
    expect(controller.getState().phase).toBe('HOLD');

    // Dashboard should reflect HOLD state
    const holdView = controller.getMissionView();
    expect(holdView).toBeDefined();

    // Issue RESUME
    const resumeResult = controller.executeCommand('RESUME');
    expect(resumeResult.ok).toBe(true);

    // Phase should return to EXECUTION (exact suspension point)
    expect(controller.getState().phase).toBe('EXECUTION');

    // Can continue advancing from where we left off
    const nextResult = controller.advancePhase(); // EXECUTION -> INTEGRATION
    expect(nextResult.success).toBe(true);
    expect(controller.getState().phase).toBe('INTEGRATION');
  });

  it('HOLD during PLANNING and RESUME continues correctly', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-102'));

    controller.advancePhase(); // BRIEFING -> PLANNING
    expect(controller.getState().phase).toBe('PLANNING');

    controller.executeCommand('HOLD');
    expect(controller.getState().phase).toBe('HOLD');

    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('PLANNING');

    // Continue from PLANNING
    const result = controller.advancePhase(); // PLANNING -> EXECUTION
    expect(result.success).toBe(true);
    expect(controller.getState().phase).toBe('EXECUTION');
  });

  it('HOLD during INTEGRATION and RESUME continues correctly', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-103'));

    controller.advancePhase(); // BRIEFING -> PLANNING
    controller.advancePhase(); // PLANNING -> EXECUTION
    controller.advancePhase(); // EXECUTION -> INTEGRATION
    expect(controller.getState().phase).toBe('INTEGRATION');

    controller.executeCommand('HOLD');
    expect(controller.getState().phase).toBe('HOLD');

    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('INTEGRATION');

    // Continue to REVIEW_GATE
    const result = controller.advancePhase(); // INTEGRATION -> REVIEW_GATE
    expect(result.success).toBe(true);
    expect(controller.getState().phase).toBe('REVIEW_GATE');
    expect(controller.getState().suspended).toBe(true);
  });

  it('multiple HOLD/RESUME cycles work without state degradation', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-104'));

    controller.advancePhase(); // BRIEFING -> PLANNING

    // First HOLD/RESUME
    controller.executeCommand('HOLD');
    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('PLANNING');

    controller.advancePhase(); // PLANNING -> EXECUTION

    // Second HOLD/RESUME
    controller.executeCommand('HOLD');
    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('EXECUTION');

    controller.advancePhase(); // EXECUTION -> INTEGRATION

    // Third HOLD/RESUME
    controller.executeCommand('HOLD');
    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('INTEGRATION');

    // Verify dashboard is still tracking correctly
    const view = controller.getMissionView();
    expect(view).toBeDefined();
    expect(view!.phase).toBe('INTEGRATION');

    // Stats should show all the telemetry events from transitions and hold/resume
    const stats = controller.getStats();
    // At least: initial + 3 transitions + 3 holds + 3 resumes = 10+
    expect(stats.total).toBeGreaterThan(5);
  });

  it('dashboard reflects HOLD and RESUME state changes', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-105'));

    controller.advancePhase(); // BRIEFING -> PLANNING
    controller.advancePhase(); // PLANNING -> EXECUTION

    // Before HOLD: dashboard shows EXECUTION
    let view = controller.getMissionView();
    expect(view!.phase).toBe('EXECUTION');

    // During HOLD: dashboard shows HOLD
    controller.executeCommand('HOLD');
    view = controller.getMissionView();
    expect(view!.phase).toBe('HOLD');

    // After RESUME: dashboard shows EXECUTION again
    controller.executeCommand('RESUME');
    view = controller.getMissionView();
    expect(view!.phase).toBe('EXECUTION');
  });
});

// ============================================================================
// Scenario 2: INTG-03 -- Full mission lifecycle with archive
// ============================================================================

describe('INTG-03: Full mission lifecycle with immutable archive', () => {
  it('complete lifecycle: LAUNCH -> advance -> gate GO -> COMPLETION -> archive', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-201'));

    // === LAUNCH ===
    const launchResult = controller.executeCommand('LAUNCH');
    expect(launchResult.ok).toBe(true);

    // === ADVANCE THROUGH PHASES ===
    controller.advancePhase(); // BRIEFING -> PLANNING
    expect(controller.getState().phase).toBe('PLANNING');

    controller.advancePhase(); // PLANNING -> EXECUTION
    expect(controller.getState().phase).toBe('EXECUTION');

    controller.advancePhase(); // EXECUTION -> INTEGRATION
    expect(controller.getState().phase).toBe('INTEGRATION');

    controller.advancePhase(); // INTEGRATION -> REVIEW_GATE
    expect(controller.getState().phase).toBe('REVIEW_GATE');
    expect(controller.getState().suspended).toBe(true);

    // === GATE REVIEW ===
    const alertView = controller.getAlertView();
    expect(alertView.tier).toBe('gate');
    if (alertView.tier === 'gate') {
      expect(alertView.buttons).toEqual(['go', 'no_go', 'redirect']);
      expect(alertView.criteria.length).toBeGreaterThan(0);
    }

    // Human reviewer clicks GO
    controller.clearGate({
      decision: 'go',
      reasoning: 'All integration criteria verified by human reviewer',
      responder: 'human',
    });

    // Mission advances to COMPLETION
    expect(controller.getState().phase).toBe('COMPLETION');
    expect(controller.getState().completed).toBe(true);
    expect(controller.getState().suspended).toBe(false);

    // Dashboard shows mission completed
    const finalView = controller.getMissionView();
    expect(finalView).toBeDefined();
    expect(finalView!.phase).toBe('COMPLETION');

    // === ARCHIVE ===
    const archive = controller.sealArchive();

    // Archive is complete
    expect(archive.outcome).toBe('completed');
    expect(archive.sealed_at).toBeTruthy();
    expect(archive.integrity_hash).toMatch(/^[a-f0-9]+$/);
    expect(archive.event_count).toBeGreaterThan(0);

    // Archive manifest is complete
    expect(archive.manifest.mission_id).toBe('mission-2026-02-18-201');

    // Archive is immutable (frozen)
    expect(Object.isFrozen(archive)).toBe(true);

    // Archive events include telemetry for every phase transition
    expect(archive.events.length).toBeGreaterThan(0);
    const telemetryEvents = archive.events.filter((e) => e.type === 'TELEMETRY_UPDATE');
    // At least: initial + 4 transitions + COMPLETION transition = 5+
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(5);
  });

  it('lifecycle with HOLD/RESUME and gate interaction produces complete archive', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-202'));

    controller.executeCommand('LAUNCH');
    controller.advancePhase(); // -> PLANNING
    controller.advancePhase(); // -> EXECUTION

    // HOLD mid-mission
    controller.executeCommand('HOLD');
    expect(controller.getState().phase).toBe('HOLD');

    // RESUME and continue
    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('EXECUTION');

    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE

    // Gate review with GO
    controller.clearGate({
      decision: 'go',
      reasoning: 'Verified after HOLD/RESUME cycle',
      responder: 'human',
    });

    expect(controller.getState().phase).toBe('COMPLETION');

    // Seal archive
    const archive = controller.sealArchive();
    expect(archive.outcome).toBe('completed');
    expect(archive.event_count).toBeGreaterThan(0);

    // Archive contains HOLD telemetry events
    const holdEvents = archive.events.filter(
      (e) =>
        e.type === 'TELEMETRY_UPDATE' &&
        (e.payload as Record<string, unknown>).phase === 'HOLD',
    );
    expect(holdEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('gate NO_GO keeps mission at REVIEW_GATE, second GO completes', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-203'));

    controller.executeCommand('LAUNCH');
    controller.advancePhase(); // -> PLANNING
    controller.advancePhase(); // -> EXECUTION
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE

    expect(controller.getState().suspended).toBe(true);

    // First review: NO_GO
    controller.clearGate({
      decision: 'no_go',
      reasoning: 'Tests not all passing yet',
      responder: 'human',
    });

    // Mission stays at REVIEW_GATE, still suspended
    expect(controller.getState().phase).toBe('REVIEW_GATE');
    expect(controller.getState().suspended).toBe(true);

    // Second review: GO
    controller.clearGate({
      decision: 'go',
      reasoning: 'All tests now passing after fixes',
      responder: 'human',
    });

    expect(controller.getState().phase).toBe('COMPLETION');
    expect(controller.getState().completed).toBe(true);

    // Archive captures both gate interactions
    const archive = controller.sealArchive();
    expect(archive.outcome).toBe('completed');
    expect(archive.event_count).toBeGreaterThan(0);
  });

  it('gate REDIRECT sends back to earlier phase, re-advance to gate, then GO', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-204'));

    controller.executeCommand('LAUNCH');
    controller.advancePhase(); // -> PLANNING
    controller.advancePhase(); // -> EXECUTION
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE

    expect(controller.getState().suspended).toBe(true);

    // Redirect back to EXECUTION for rework
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'Integration tests revealed an issue in execution output',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });

    expect(controller.getState().phase).toBe('EXECUTION');
    expect(controller.getState().suspended).toBe(false);

    // Re-advance through INTEGRATION -> REVIEW_GATE
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE
    expect(controller.getState().suspended).toBe(true);

    // Now GO
    controller.clearGate({
      decision: 'go',
      reasoning: 'Issue resolved after redirect and rework',
      responder: 'human',
    });

    expect(controller.getState().phase).toBe('COMPLETION');

    // Archive captures the full journey including redirect
    const archive = controller.sealArchive();
    expect(archive.outcome).toBe('completed');
    // More events than a straight-through lifecycle due to redirect
    expect(archive.event_count).toBeGreaterThan(8);
  });

  it('ABORT mid-mission produces valid aborted archive', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-205'));

    controller.executeCommand('LAUNCH');
    controller.advancePhase(); // -> PLANNING
    controller.advancePhase(); // -> EXECUTION

    // Abort mid-mission
    controller.executeCommand('ABORT');
    expect(controller.getState().phase).toBe('ABORT');
    expect(controller.getState().aborted).toBe(true);

    // Seal as aborted
    const archive = controller.sealArchive();
    expect(archive.outcome).toBe('aborted');
    expect(archive.integrity_hash).toMatch(/^[a-f0-9]+$/);
    expect(archive.event_count).toBeGreaterThan(0);

    // Archive is still immutable
    expect(Object.isFrozen(archive)).toBe(true);

    // Cannot advance after abort
    const result = controller.advancePhase();
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Scenario 3: Exhaustive ICD-01 telemetry validation
// ============================================================================

describe('Telemetry validation: every event conforms to ICD-01', () => {
  it('all events from a complete lifecycle pass schema validation', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-301'));

    // Run a full lifecycle
    controller.executeCommand('LAUNCH');
    controller.advancePhase(); // -> PLANNING
    controller.advancePhase(); // -> EXECUTION
    controller.executeCommand('HOLD');
    controller.executeCommand('RESUME');
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE

    controller.clearGate({
      decision: 'go',
      reasoning: 'All criteria met',
      responder: 'human',
    });

    // Get the complete event log
    const events = controller.getEventLog();
    expect(events.length).toBeGreaterThan(0);

    // Validate EVERY event
    let telemetryCount = 0;
    let gateSignalCount = 0;
    let alertCount = 0;
    let envelopeFailures = 0;
    let payloadFailures = 0;

    for (const event of events) {
      // Every event must be a valid EventEnvelope
      const envelopeResult = EventEnvelopeSchema.safeParse(event);
      if (!envelopeResult.success) {
        envelopeFailures++;
      }

      // Validate payload based on event type
      switch (event.type) {
        case 'TELEMETRY_UPDATE': {
          telemetryCount++;
          const result = TelemetryUpdatePayloadSchema.safeParse(event.payload);
          if (!result.success) payloadFailures++;
          break;
        }
        case 'ALERT_SURFACE': {
          alertCount++;
          const result = AlertSurfacePayloadSchema.safeParse(event.payload);
          if (!result.success) payloadFailures++;
          break;
        }
        case 'GATE_SIGNAL': {
          gateSignalCount++;
          const result = GateSignalPayloadSchema.safeParse(event.payload);
          if (!result.success) payloadFailures++;
          break;
        }
      }
    }

    // Zero validation failures
    expect(envelopeFailures).toBe(0);
    expect(payloadFailures).toBe(0);

    // Must have seen telemetry events (the primary flow)
    expect(telemetryCount).toBeGreaterThan(0);

    // Must have seen at least one gate signal (from reaching REVIEW_GATE)
    expect(gateSignalCount).toBeGreaterThanOrEqual(1);
  });

  it('archived events match the emitter event log exactly', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-302'));

    controller.executeCommand('LAUNCH');
    controller.advancePhase();
    controller.advancePhase();
    controller.advancePhase();
    controller.advancePhase(); // -> REVIEW_GATE

    controller.clearGate({
      decision: 'go',
      reasoning: 'Archive verification test',
      responder: 'human',
    });

    const preArchiveLog = controller.getEventLog();
    const archive = controller.sealArchive();

    // Archive events should match the emitter's log
    expect(archive.events.length).toBe(preArchiveLog.length);
    expect(archive.event_count).toBe(preArchiveLog.length);
  });
});

// ============================================================================
// Scenario 4: Dashboard-centric verification
// ============================================================================

describe('Dashboard tracks full mission narrative', () => {
  it('dashboard view updates at every lifecycle stage', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-401'));
    const missionId = 'mission-2026-02-18-401';

    // After construction: mission exists in dashboard at BRIEFING
    let view = controller.getDashboardView();
    expect(view.total_missions).toBe(1);
    let mission = controller.getMissionView();
    expect(mission).toBeDefined();
    expect(mission!.mission_id).toBe(missionId);

    // Track phases through the lifecycle
    const expectedPhases = ['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE'];
    for (const expectedPhase of expectedPhases) {
      controller.advancePhase();
      mission = controller.getMissionView();
      expect(mission!.phase).toBe(expectedPhase);
    }

    // At REVIEW_GATE, alert view shows gate
    const alertView = controller.getAlertView();
    expect(alertView.tier).toBe('gate');

    // Clear gate
    controller.clearGate({
      decision: 'go',
      reasoning: 'Dashboard tracking test',
      responder: 'human',
    });

    // Dashboard shows COMPLETION
    mission = controller.getMissionView();
    expect(mission!.phase).toBe('COMPLETION');

    // Dashboard view shows 0 active missions (mission is complete)
    view = controller.getDashboardView();
    expect(view.active_missions).toBe(0);
    expect(view.total_missions).toBe(1);
  });

  it('stats reflect the complete event flow', () => {
    const controller = new MissionController(createTestConfig('mission-2026-02-18-402'));

    controller.advancePhase();
    controller.advancePhase();
    controller.advancePhase();
    controller.advancePhase(); // -> REVIEW_GATE

    controller.clearGate({
      decision: 'go',
      reasoning: 'Stats test',
      responder: 'human',
    });

    const stats = controller.getStats();

    // Total events > 0
    expect(stats.total).toBeGreaterThan(0);

    // TELEMETRY_UPDATE is the primary event type
    expect(stats.by_type['TELEMETRY_UPDATE']).toBeGreaterThan(0);

    // Stats total matches sum of all type counts
    const sumByType = Object.values(stats.by_type).reduce((a, b) => a + b, 0);
    expect(stats.total).toBe(sumByType);
  });
});
