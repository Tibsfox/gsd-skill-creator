/**
 * Integration tests for MissionController.
 *
 * Validates that real ME-1 components (TelemetryEmitter, PhaseEngine,
 * GateController, SwarmCoordinator) wire correctly to real MC-1 components
 * (Dashboard, AlertRenderer, TelemetryConsumer) via the onEmit callback
 * bridge -- no stubs.
 *
 * Covers: INTG-01 (MC-1 dashboard shows real-time telemetry from live ME-1)
 */

import { describe, it, expect } from 'vitest';
import { MissionController } from '../mission-controller.js';
import type { MissionControllerConfig } from '../mission-controller.js';
import {
  TelemetryUpdatePayloadSchema,
  GateSignalPayloadSchema,
} from '../../icd/icd-01.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';

// ============================================================================
// Shared test config
// ============================================================================

function createTestConfig(missionId: string): MissionControllerConfig {
  return {
    mission_id: missionId,
    name: `Test Mission ${missionId}`,
    description: 'Integration harness verification',
    skills: [
      { skill_id: 'skill-integration-alpha', version: '1.0.0' },
    ],
    agents: [
      { agent_id: 'ME-1', role: 'provisioner' },
      { agent_id: 'ME-2', role: 'phase-engine' },
    ],
    teams: [
      { team_id: 'CS', agent_ids: ['CS-1', 'CS-2'] },
      { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'] },
    ],
  };
}

// ============================================================================
// 1. Construction and provisioning
// ============================================================================

describe('MissionController', () => {
  describe('construction and provisioning', () => {
    it('creates a controller without error', () => {
      const config = createTestConfig('mission-2026-02-18-001');
      const controller = new MissionController(config);
      expect(controller).toBeDefined();
    });

    it('getState returns initial state at BRIEFING', () => {
      const config = createTestConfig('mission-2026-02-18-001');
      const controller = new MissionController(config);
      const state = controller.getState();

      expect(state.phase).toBe('BRIEFING');
      expect(state.suspended).toBe(false);
      expect(state.missionId).toBe('mission-2026-02-18-001');
      expect(state.completed).toBe(false);
      expect(state.aborted).toBe(false);
    });

    it('dashboard is populated after construction (initial telemetry emitted)', () => {
      const config = createTestConfig('mission-2026-02-18-001');
      const controller = new MissionController(config);
      const view = controller.getDashboardView();

      expect(view.total_missions).toBe(1);
      expect(view.active_missions).toBe(1);

      const mission = controller.getMissionView();
      expect(mission).toBeDefined();
      expect(mission!.mission_id).toBe('mission-2026-02-18-001');
      expect(mission!.phase).toBe('BRIEFING');
    });
  });

  // ==========================================================================
  // 2. Live telemetry flows to Dashboard after phase transition (INTG-01 core)
  // ==========================================================================

  describe('live telemetry flows to Dashboard (INTG-01)', () => {
    it('dashboard updates after BRIEFING -> PLANNING transition', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-002'));

      const result = controller.advancePhase();
      expect(result.success).toBe(true);

      const mission = controller.getMissionView();
      expect(mission).toBeDefined();
      expect(mission!.phase).toBe('PLANNING');
      expect(mission!.progress).toBeGreaterThan(0);
    });

    it('dashboard updates after PLANNING -> EXECUTION transition', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-003'));

      controller.advancePhase(); // BRIEFING -> PLANNING
      controller.advancePhase(); // PLANNING -> EXECUTION

      const mission = controller.getMissionView();
      expect(mission).toBeDefined();
      expect(mission!.phase).toBe('EXECUTION');
    });

    it('team status lights are present in the dashboard view', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-004'));
      const mission = controller.getMissionView();
      expect(mission).toBeDefined();
      // Initial telemetry includes team_status from config
      expect(mission!.team_status.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 3. Dashboard tracks real mission state across full traversal
  // ==========================================================================

  describe('dashboard tracks mission state across full traversal', () => {
    it('tracks phase changes through BRIEFING -> PLANNING -> EXECUTION -> INTEGRATION', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-005'));

      const phases = ['PLANNING', 'EXECUTION', 'INTEGRATION'];
      for (const expectedPhase of phases) {
        controller.advancePhase();
        const mission = controller.getMissionView();
        expect(mission).toBeDefined();
        expect(mission!.phase).toBe(expectedPhase);
        expect(mission!.mission_id).toBe('mission-2026-02-18-005');
      }
    });

    it('stats show increasing TELEMETRY_UPDATE counts', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-006'));

      controller.advancePhase(); // BRIEFING -> PLANNING
      controller.advancePhase(); // PLANNING -> EXECUTION
      controller.advancePhase(); // EXECUTION -> INTEGRATION

      const stats = controller.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_type['TELEMETRY_UPDATE']).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 4. AlertRenderer receives gate signals from live PhaseEngine
  // ==========================================================================

  describe('AlertRenderer receives gate signals', () => {
    it('gate view appears at REVIEW_GATE', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-007'));

      controller.advancePhase(); // -> PLANNING
      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE

      const alertView = controller.getAlertView();
      expect(alertView.tier).toBe('gate');

      if (alertView.tier === 'gate') {
        expect(alertView.buttons).toEqual(['go', 'no_go', 'redirect']);
        expect(alertView.criteria.length).toBeGreaterThan(0);
      }
    });

    it('controller is suspended at REVIEW_GATE', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-008'));

      controller.advancePhase(); // -> PLANNING
      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE

      expect(controller.getState().suspended).toBe(true);
    });
  });

  // ==========================================================================
  // 5. Telemetry validation -- all events conform to ICD-01
  // ==========================================================================

  describe('telemetry validation against ICD-01', () => {
    it('all emitted events pass schema validation', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-009'));

      controller.advancePhase(); // -> PLANNING
      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE

      const events = controller.getEventLog();
      expect(events.length).toBeGreaterThan(0);

      let envelopeFailures = 0;
      let payloadFailures = 0;

      for (const event of events) {
        const envelopeResult = EventEnvelopeSchema.safeParse(event);
        if (!envelopeResult.success) envelopeFailures++;

        if (event.type === 'TELEMETRY_UPDATE') {
          const result = TelemetryUpdatePayloadSchema.safeParse(event.payload);
          if (!result.success) payloadFailures++;
        } else if (event.type === 'GATE_SIGNAL') {
          const result = GateSignalPayloadSchema.safeParse(event.payload);
          if (!result.success) payloadFailures++;
        }
      }

      expect(envelopeFailures).toBe(0);
      expect(payloadFailures).toBe(0);
    });
  });

  // ==========================================================================
  // 6. Unified command interface
  // ==========================================================================

  describe('unified command interface', () => {
    it('STATUS command returns successful result', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-010'));
      const result = controller.executeCommand('STATUS');
      expect(result.ok).toBe(true);
    });

    it('HOLD puts mission in HOLD state', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-011'));
      controller.advancePhase(); // -> PLANNING

      const holdResult = controller.executeCommand('HOLD');
      expect(holdResult.ok).toBe(true);
      expect(controller.getState().phase).toBe('HOLD');
    });

    it('RESUME after HOLD returns to previous phase', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-012'));
      controller.advancePhase(); // -> PLANNING

      controller.executeCommand('HOLD');
      expect(controller.getState().phase).toBe('HOLD');

      const resumeResult = controller.executeCommand('RESUME');
      expect(resumeResult.ok).toBe(true);
      expect(controller.getState().phase).toBe('PLANNING');
    });

    it('LAUNCH works at initialization', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-013'));
      const result = controller.executeCommand('LAUNCH');
      expect(result.ok).toBe(true);
    });

    it('invalid commands return error results with suggestions', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-014'));
      const result = controller.executeCommand('INVALID_COMMAND');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 7. Stats and diagnostics
  // ==========================================================================

  describe('stats and diagnostics', () => {
    it('getStats returns event counts by type', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-015'));
      controller.advancePhase();
      controller.advancePhase();

      const stats = controller.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_type['TELEMETRY_UPDATE']).toBeGreaterThan(0);
    });

    it('stats total matches sum of type counts', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-016'));
      controller.advancePhase();
      controller.advancePhase();
      controller.advancePhase();

      const stats = controller.getStats();
      const sumByType = Object.values(stats.by_type).reduce((a, b) => a + b, 0);
      expect(stats.total).toBe(sumByType);
    });
  });

  // ==========================================================================
  // 8. Multiple phase advance and dashboard sync
  // ==========================================================================

  describe('multiple phase advance and dashboard sync', () => {
    it('dashboard view updates at every phase', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-017'));

      controller.advancePhase(); // -> PLANNING
      let mission = controller.getMissionView();
      expect(mission!.phase).toBe('PLANNING');

      controller.advancePhase(); // -> EXECUTION
      mission = controller.getMissionView();
      expect(mission!.phase).toBe('EXECUTION');

      controller.advancePhase(); // -> INTEGRATION
      mission = controller.getMissionView();
      expect(mission!.phase).toBe('INTEGRATION');
    });

    it('elapsed_time increases with transitions', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-018'));

      const initialMission = controller.getMissionView();
      const initialElapsed = initialMission!.elapsed_time;

      controller.advancePhase();
      controller.advancePhase();
      controller.advancePhase();

      const finalMission = controller.getMissionView();
      // Elapsed time should be >= initial (timestamps are very close in tests)
      expect(finalMission!.elapsed_time).toBeGreaterThanOrEqual(initialElapsed);
    });
  });

  // ==========================================================================
  // 9. Component graph is fully connected (no orphans)
  // ==========================================================================

  describe('component graph is fully connected', () => {
    it('dashboard updates automatically on transition without manual consume call', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-019'));

      // Only call advancePhase -- do NOT manually call consumer.consume()
      controller.advancePhase(); // BRIEFING -> PLANNING

      // Dashboard should have updated automatically via the onEmit bridge
      const mission = controller.getMissionView();
      expect(mission).toBeDefined();
      expect(mission!.phase).toBe('PLANNING');
    });

    it('alert renderer receives gate signal automatically on REVIEW_GATE transition', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-020'));

      controller.advancePhase(); // -> PLANNING
      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE

      // Alert view should have updated automatically via the onEmit bridge
      const alertView = controller.getAlertView();
      expect(alertView.tier).toBe('gate');
    });
  });

  // ==========================================================================
  // 10. Error handling
  // ==========================================================================

  describe('error handling', () => {
    it('advancePhase from COMPLETION returns error', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-021'));

      controller.advancePhase(); // -> PLANNING
      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE

      // Clear gate to reach COMPLETION
      controller.clearGate({
        decision: 'go',
        reasoning: 'Test clearance',
        responder: 'human',
      });

      expect(controller.getState().phase).toBe('COMPLETION');

      const result = controller.advancePhase();
      expect(result.success).toBe(false);
    });

    it('advancePhase from ABORT returns error', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-022'));

      controller.advancePhase(); // -> PLANNING
      controller.executeCommand('ABORT');
      expect(controller.getState().phase).toBe('ABORT');

      const result = controller.advancePhase();
      expect(result.success).toBe(false);
    });

    it('invalid command returns parse error with suggestions', () => {
      const controller = new MissionController(createTestConfig('mission-2026-02-18-023'));
      const result = controller.executeCommand('INVALID_COMMAND');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.suggestions.length).toBeGreaterThan(0);
      }
    });
  });
});
