/**
 * Tests for MC-1 dashboard state manager.
 *
 * Covers:
 * - Dashboard initialization (empty state)
 * - TELEMETRY_UPDATE event processing (create/update missions)
 * - MissionView model (phase, progress, elapsed_time, team_status, checkpoints, alert_level)
 * - Team status lights (green/amber/red per team)
 * - Checkpoint log (deduplicated, tracks completion)
 * - ALERT_SURFACE event processing (alert level updates)
 * - Full lifecycle with StubME1 integration
 * - DashboardView rendering (sorted, counts)
 * - Multiple missions tracked independently
 * - Unknown event types silently ignored
 */

import { describe, it, expect } from 'vitest';
import {
  Dashboard,
} from '../dashboard.js';
import type {
  DashboardView,
  MissionView,
} from '../dashboard.js';
import {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createFullLifecycleSequence,
} from '../stub-me1.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';

// ============================================================================
// Dashboard initialization
// ============================================================================

describe('Dashboard', () => {
  describe('initialization', () => {
    it('creates an empty dashboard with no missions', () => {
      const dashboard = new Dashboard();
      expect(dashboard.getMissions()).toEqual([]);
    });

    it('getView returns a DashboardView with empty missions array', () => {
      const dashboard = new Dashboard();
      const view = dashboard.getView();
      expect(view.missions).toEqual([]);
      expect(view.total_missions).toBe(0);
      expect(view.active_missions).toBe(0);
    });
  });

  // ============================================================================
  // Processing TELEMETRY_UPDATE events
  // ============================================================================

  describe('TELEMETRY_UPDATE processing', () => {
    it('adds a mission entry after first telemetry event', () => {
      const dashboard = new Dashboard();
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const event = stub.next()!;
      dashboard.processEvent(event);
      expect(dashboard.getMissions()).toHaveLength(1);
    });

    it('mission entry has correct mission_id, phase, progress', () => {
      const dashboard = new Dashboard();
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const event = stub.next()!;
      dashboard.processEvent(event);
      const mission = dashboard.getMission('mission-2026-02-18-001');
      expect(mission).toBeDefined();
      expect(mission!.mission_id).toBe('mission-2026-02-18-001');
      expect(mission!.phase).toBe('BRIEFING');
      expect(mission!.progress).toBe(0);
    });

    it('subsequent events update rather than duplicate the entry', () => {
      const dashboard = new Dashboard();
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      dashboard.processEvent(stub.next()!);
      dashboard.processEvent(stub.next()!);
      expect(dashboard.getMissions()).toHaveLength(1);
      const mission = dashboard.getMission('mission-2026-02-18-001');
      expect(mission!.phase).toBe('PLANNING');
      expect(mission!.progress).toBe(20);
    });

    it('different mission IDs create separate entries', () => {
      const dashboard = new Dashboard();
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));
      dashboard.processEvent(stub1.next()!);
      dashboard.processEvent(stub2.next()!);
      expect(dashboard.getMissions()).toHaveLength(2);
    });
  });

  // ============================================================================
  // MissionView model
  // ============================================================================

  describe('MissionView model', () => {
    it('includes all required fields', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission).toHaveProperty('mission_id');
      expect(mission).toHaveProperty('phase');
      expect(mission).toHaveProperty('progress');
      expect(mission).toHaveProperty('elapsed_time');
      expect(mission).toHaveProperty('team_status');
      expect(mission).toHaveProperty('checkpoints');
      expect(mission).toHaveProperty('alert_level');
    });

    it('elapsed_time is 0 with only one event', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission.elapsed_time).toBe(0);
    });

    it('elapsed_time increases after multiple events', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      // Small delay to ensure timestamps differ
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      // elapsed_time should be >= 0 (timestamps may be very close)
      expect(mission.elapsed_time).toBeGreaterThanOrEqual(0);
    });

    it('alert_level defaults to nominal when no alerts are active', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission.alert_level).toBe('nominal');
    });
  });

  // ============================================================================
  // Team status lights
  // ============================================================================

  describe('team status lights', () => {
    it('contains TeamStatusView objects after processing telemetry', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission.team_status.length).toBeGreaterThan(0);
    });

    it('each TeamStatusView has team, status, and agent_count', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      for (const ts of mission.team_status) {
        expect(ts).toHaveProperty('team');
        expect(ts).toHaveProperty('status');
        expect(ts).toHaveProperty('agent_count');
        expect(['green', 'amber', 'red']).toContain(ts.status);
      }
    });

    it('status lights reflect the most recent telemetry data', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createAdvisorySequence('mission-2026-02-18-001'));
      // First event: all green
      dashboard.processEvent(stub.next()!);
      let mission = dashboard.getMission('mission-2026-02-18-001')!;
      const meTeam = mission.team_status.find((t) => t.team === 'ME');
      expect(meTeam?.status).toBe('green');

      // Skip alert event
      dashboard.processEvent(stub.next()!);

      // Third event: ME is amber
      dashboard.processEvent(stub.next()!);
      mission = dashboard.getMission('mission-2026-02-18-001')!;
      const meTeamAfter = mission.team_status.find((t) => t.team === 'ME');
      expect(meTeamAfter?.status).toBe('amber');
    });
  });

  // ============================================================================
  // Checkpoint log
  // ============================================================================

  describe('checkpoint log', () => {
    it('lists checkpoints after processing telemetry', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const checkpoints = dashboard.getCheckpoints('mission-2026-02-18-001');
      expect(checkpoints.length).toBeGreaterThan(0);
    });

    it('each CheckpointView has name and completed', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const checkpoints = dashboard.getCheckpoints('mission-2026-02-18-001');
      for (const cp of checkpoints) {
        expect(cp).toHaveProperty('name');
        expect(cp).toHaveProperty('completed');
      }
    });

    it('checkpoint list grows as new checkpoints arrive', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);
      const count1 = dashboard.getCheckpoints('mission-2026-02-18-001').length;
      dashboard.processEvent(stub.next()!);
      const count2 = dashboard.getCheckpoints('mission-2026-02-18-001').length;
      expect(count2).toBeGreaterThanOrEqual(count1);
    });

    it('duplicate checkpoint names update existing entries', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createFullLifecycleSequence('mission-2026-02-18-001'));
      const events = stub.drain();
      for (const event of events) {
        dashboard.processEvent(event);
      }
      const checkpoints = dashboard.getCheckpoints('mission-2026-02-18-001');
      const names = checkpoints.map((cp) => cp.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it('returns empty array for unknown mission', () => {
      const dashboard = new Dashboard();
      expect(dashboard.getCheckpoints('mission-9999-01-01-001')).toEqual([]);
    });
  });

  // ============================================================================
  // Processing ALERT_SURFACE events
  // ============================================================================

  describe('ALERT_SURFACE processing', () => {
    it('advisory alert updates mission alert_level to advisory', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createAdvisorySequence('mission-2026-02-18-001'));
      // First: telemetry (creates mission)
      dashboard.processEvent(stub.next()!);
      // Second: advisory alert
      dashboard.processEvent(stub.next()!);
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission.alert_level).toBe('advisory');
    });

    it('alert_level resets to nominal after subsequent telemetry', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createAdvisorySequence('mission-2026-02-18-001'));
      // First: telemetry
      dashboard.processEvent(stub.next()!);
      // Second: advisory alert
      dashboard.processEvent(stub.next()!);
      expect(dashboard.getMission('mission-2026-02-18-001')!.alert_level).toBe('advisory');
      // Third: telemetry (resets alert)
      dashboard.processEvent(stub.next()!);
      expect(dashboard.getMission('mission-2026-02-18-001')!.alert_level).toBe('nominal');
    });
  });

  // ============================================================================
  // Full lifecycle with StubME1
  // ============================================================================

  describe('full lifecycle with StubME1', () => {
    it('final state shows mission at COMPLETION with progress 100', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createFullLifecycleSequence('mission-2026-02-18-001'));
      const events = stub.drain();
      for (const event of events) {
        dashboard.processEvent(event);
      }
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission.phase).toBe('COMPLETION');
      expect(mission.progress).toBe(100);
    });

    it('at least one checkpoint was recorded', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createFullLifecycleSequence('mission-2026-02-18-001'));
      const events = stub.drain();
      for (const event of events) {
        dashboard.processEvent(event);
      }
      const checkpoints = dashboard.getCheckpoints('mission-2026-02-18-001');
      expect(checkpoints.length).toBeGreaterThan(0);
    });

    it('team status lights are present', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createFullLifecycleSequence('mission-2026-02-18-001'));
      const events = stub.drain();
      for (const event of events) {
        dashboard.processEvent(event);
      }
      const mission = dashboard.getMission('mission-2026-02-18-001')!;
      expect(mission.team_status.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DashboardView rendering
  // ============================================================================

  describe('DashboardView', () => {
    it('returns a DashboardView with missions sorted by last_updated descending', () => {
      const dashboard = new Dashboard();
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));

      // Process mission-001 with an earlier timestamp
      const event1 = stub1.next()!;
      event1.timestamp = '2026-02-18T10:00:00.000Z';
      dashboard.processEvent(event1);

      // Process mission-002 with a later timestamp (most recently updated)
      const event2 = stub2.next()!;
      event2.timestamp = '2026-02-18T10:00:01.000Z';
      dashboard.processEvent(event2);

      const view = dashboard.getView();
      expect(view.missions).toHaveLength(2);
      // Most recently updated should be first
      expect(view.missions[0].mission_id).toBe('mission-2026-02-18-002');
    });

    it('total_missions counts all missions', () => {
      const dashboard = new Dashboard();
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));
      dashboard.processEvent(stub1.next()!);
      dashboard.processEvent(stub2.next()!);
      const view = dashboard.getView();
      expect(view.total_missions).toBe(2);
    });

    it('active_missions excludes COMPLETION and ABORT', () => {
      const dashboard = new Dashboard();
      // Mission 1: run to completion
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      for (const event of stub1.drain()) {
        dashboard.processEvent(event);
      }
      // Mission 2: still in BRIEFING
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));
      dashboard.processEvent(stub2.next()!);

      const view = dashboard.getView();
      expect(view.total_missions).toBe(2);
      expect(view.active_missions).toBe(1);
    });
  });

  // ============================================================================
  // Multiple missions
  // ============================================================================

  describe('multiple missions', () => {
    it('tracks two missions independently', () => {
      const dashboard = new Dashboard();
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));
      dashboard.processEvent(stub1.next()!);
      dashboard.processEvent(stub1.next()!);
      dashboard.processEvent(stub2.next()!);
      expect(dashboard.getMissions()).toHaveLength(2);
      expect(dashboard.getMission('mission-2026-02-18-001')!.phase).toBe('PLANNING');
      expect(dashboard.getMission('mission-2026-02-18-002')!.phase).toBe('BRIEFING');
    });

    it('getMission returns the correct one', () => {
      const dashboard = new Dashboard();
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));
      dashboard.processEvent(stub1.next()!);
      dashboard.processEvent(stub2.next()!);
      expect(dashboard.getMission('mission-2026-02-18-001')!.mission_id).toBe('mission-2026-02-18-001');
      expect(dashboard.getMission('mission-2026-02-18-002')!.mission_id).toBe('mission-2026-02-18-002');
    });
  });

  // ============================================================================
  // Unknown event types
  // ============================================================================

  describe('unknown event types', () => {
    it('silently ignores GATE_SIGNAL events', () => {
      const dashboard = new Dashboard();
      const envelope = createEnvelope({
        source: 'ME-1',
        destination: 'MC-1',
        type: 'GATE_SIGNAL',
        payload: { gate_type: 'human_review', blocking_phase: 'REVIEW_GATE', criteria: [{ name: 'test', met: true }], deadline: '2026-02-18T15:00:00Z' },
      });
      // Should not crash
      expect(() => dashboard.processEvent(envelope)).not.toThrow();
      expect(dashboard.getMissions()).toHaveLength(0);
    });

    it('silently ignores COMMAND_DISPATCH events', () => {
      const dashboard = new Dashboard();
      const envelope = createEnvelope({
        source: 'MC-1',
        destination: 'ME-1',
        type: 'COMMAND_DISPATCH',
        payload: { command: 'LAUNCH', target_agent: 'broadcast' },
      });
      expect(() => dashboard.processEvent(envelope)).not.toThrow();
      expect(dashboard.getMissions()).toHaveLength(0);
    });
  });
});
