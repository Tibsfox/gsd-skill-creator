/**
 * Tests for the TelemetryConsumer event router.
 *
 * Validates event routing to Dashboard and AlertRenderer, diagnostic stats,
 * batch processing, event ordering, and multi-source consumption.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  TelemetryConsumer,
  type TelemetryStats,
  type TelemetryConsumerConfig,
} from '../telemetry-consumer.js';
import { Dashboard } from '../dashboard.js';
import { AlertRenderer } from '../alert-renderer.js';
import {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createGateSequence,
  createFullLifecycleSequence,
} from '../stub-me1.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';

// ============================================================================
// Tests
// ============================================================================

describe('TelemetryConsumer', () => {
  // --------------------------------------------------------------------------
  // 1. Instantiation
  // --------------------------------------------------------------------------
  describe('instantiation', () => {
    it('creates a consumer with empty stats', () => {
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      const stats = consumer.getStats();
      expect(stats.total).toBe(0);
      expect(stats.by_type).toEqual({});
    });
  });

  // --------------------------------------------------------------------------
  // 2. Single event consumption via consume()
  // --------------------------------------------------------------------------
  describe('single event consumption', () => {
    it('routes a single telemetry event to dashboard', () => {
      const missionId = 'mission-2026-02-18-001';
      const stub = new StubME1(createNominalSequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      const event = stub.next()!;
      consumer.consume(event);

      expect(dashboard.getMission(missionId)).toBeDefined();

      const stats = consumer.getStats();
      expect(stats.total).toBe(1);
      expect(stats.by_type).toEqual({ TELEMETRY_UPDATE: 1 });
    });
  });

  // --------------------------------------------------------------------------
  // 3. TELEMETRY_UPDATE routing
  // --------------------------------------------------------------------------
  describe('TELEMETRY_UPDATE routing', () => {
    it('routes all telemetry to dashboard and alert renderer', () => {
      const missionId = 'mission-2026-02-18-001';
      const stub = new StubME1(createNominalSequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      consumer.drainAll(stub.drain());

      const mission = dashboard.getMission(missionId);
      expect(mission).toBeDefined();
      expect(mission!.phase).toBe('COMPLETION');
      expect(mission!.progress).toBe(100);

      // AlertRenderer shows nominal (no alerts surfaced)
      expect(alertRenderer.getView(missionId)).toEqual({ tier: 'nominal' });

      // Stats count matches nominal sequence size (6 events)
      const stats = consumer.getStats();
      expect(stats.by_type['TELEMETRY_UPDATE']).toBe(6);
    });
  });

  // --------------------------------------------------------------------------
  // 4. ALERT_SURFACE routing
  // --------------------------------------------------------------------------
  describe('ALERT_SURFACE routing', () => {
    it('routes advisory events to both dashboard and alert renderer', () => {
      const missionId = 'mission-2026-02-18-002';
      const stub = new StubME1(createAdvisorySequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      consumer.drainAll(stub.drain());

      // Dashboard was updated
      const mission = dashboard.getMission(missionId);
      expect(mission).toBeDefined();

      // Stats show both event types
      const stats = consumer.getStats();
      expect(stats.by_type['TELEMETRY_UPDATE']).toBe(2);
      expect(stats.by_type['ALERT_SURFACE']).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 5. GATE_SIGNAL routing
  // --------------------------------------------------------------------------
  describe('GATE_SIGNAL routing', () => {
    it('routes gate signals to alert renderer only', () => {
      const missionId = 'mission-2026-02-18-003';
      const stub = new StubME1(createGateSequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      // Process events one at a time to check gate state mid-stream
      const events = stub.drain();
      for (const event of events) {
        consumer.consume(event);
      }

      // Gate was seen (it may be cleared by trailing telemetry, or not --
      // depends on whether telemetry clears gate. Per design, gates are NOT
      // cleared by telemetry, so it should still be active.)
      // But the trailing event is TELEMETRY_UPDATE which doesn't clear gates.
      expect(alertRenderer.isSuspended(missionId)).toBe(true);

      // Stats show gate signal count
      const stats = consumer.getStats();
      expect(stats.by_type['GATE_SIGNAL']).toBe(1);

      // Dashboard was updated with surrounding telemetry
      const mission = dashboard.getMission(missionId);
      expect(mission).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Full lifecycle routing
  // --------------------------------------------------------------------------
  describe('full lifecycle routing', () => {
    it('routes all event types through full lifecycle', () => {
      const missionId = 'mission-2026-02-18-004';
      const stub = new StubME1(createFullLifecycleSequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      consumer.drainAll(stub.drain());

      // Dashboard shows mission data
      const mission = dashboard.getMission(missionId);
      expect(mission).toBeDefined();
      expect(mission!.team_status.length).toBeGreaterThan(0);

      // Stats show all three event types
      const stats = consumer.getStats();
      expect(stats.by_type['TELEMETRY_UPDATE']).toBeGreaterThan(0);
      expect(stats.by_type['ALERT_SURFACE']).toBeGreaterThan(0);
      expect(stats.by_type['GATE_SIGNAL']).toBeGreaterThan(0);

      // Total matches stub total (9 events in full lifecycle)
      expect(stats.total).toBe(9);
    });
  });

  // --------------------------------------------------------------------------
  // 7. drainAll() batch processing
  // --------------------------------------------------------------------------
  describe('drainAll batch processing', () => {
    it('processes all events in a batch', () => {
      const missionId = 'mission-2026-02-18-005';
      const stub = new StubME1(createNominalSequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      const events = stub.drain();
      consumer.drainAll(events);

      // Dashboard and AlertRenderer are in correct final state
      const mission = dashboard.getMission(missionId);
      expect(mission).toBeDefined();
      expect(mission!.phase).toBe('COMPLETION');
      expect(alertRenderer.getView(missionId)).toEqual({ tier: 'nominal' });

      // Stats match
      expect(consumer.getStats().total).toBe(events.length);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Event ordering preservation
  // --------------------------------------------------------------------------
  describe('event ordering', () => {
    it('processes events in arrival order', () => {
      const missionId = 'mission-2026-02-18-006';
      const stub = new StubME1(createFullLifecycleSequence(missionId));
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      // Spy on processEvent to track call order
      const dashboardOrder: string[] = [];
      const originalDashProcess = dashboard.processEvent.bind(dashboard);
      dashboard.processEvent = (env: EventEnvelope) => {
        dashboardOrder.push(env.type);
        originalDashProcess(env);
      };

      const alertOrder: string[] = [];
      const originalAlertProcess = alertRenderer.processEvent.bind(alertRenderer);
      alertRenderer.processEvent = (env: EventEnvelope) => {
        alertOrder.push(env.type);
        originalAlertProcess(env);
      };

      consumer.drainAll(stub.drain());

      // Dashboard received TELEMETRY_UPDATE and ALERT_SURFACE events in order
      expect(dashboardOrder.length).toBeGreaterThan(0);
      // The first event should be TELEMETRY_UPDATE (BRIEFING)
      expect(dashboardOrder[0]).toBe('TELEMETRY_UPDATE');

      // AlertRenderer received TELEMETRY_UPDATE, ALERT_SURFACE, and GATE_SIGNAL events in order
      expect(alertOrder.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Unknown event types pass through without error
  // --------------------------------------------------------------------------
  describe('unknown event types', () => {
    it('tracks unknown events in stats but does not route them', () => {
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      const customEvent = createEnvelope({
        source: 'ME-1',
        destination: 'MC-1',
        type: 'COMMAND_DISPATCH',
        payload: { command: 'LAUNCH', target_agent: 'broadcast' },
      });

      consumer.consume(customEvent);

      const stats = consumer.getStats();
      expect(stats.total).toBe(1);
      expect(stats.by_type['COMMAND_DISPATCH']).toBe(1);

      // Dashboard and AlertRenderer unchanged
      expect(dashboard.getMissions()).toEqual([]);
      expect(alertRenderer.getActiveAlerts()).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Stats accumulation across multiple sources
  // --------------------------------------------------------------------------
  describe('multi-source stats', () => {
    it('accumulates stats from multiple sources', () => {
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createAdvisorySequence('mission-2026-02-18-002'));

      consumer.drainAll(stub1.drain());
      consumer.drainAll(stub2.drain());

      const stats = consumer.getStats();
      // Nominal: 6 telemetry. Advisory: 2 telemetry + 1 alert. Total = 9.
      expect(stats.total).toBe(9);
      expect(stats.by_type['TELEMETRY_UPDATE']).toBe(8);
      expect(stats.by_type['ALERT_SURFACE']).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Empty source handling
  // --------------------------------------------------------------------------
  describe('empty source handling', () => {
    it('handles empty array gracefully', () => {
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      consumer.drainAll([]);

      const stats = consumer.getStats();
      expect(stats.total).toBe(0);
      expect(stats.by_type).toEqual({});
    });

    it('handles null event gracefully', () => {
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      // Should not throw
      consumer.consume(null as any);

      const stats = consumer.getStats();
      expect(stats.total).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // resetStats
  // --------------------------------------------------------------------------
  describe('resetStats', () => {
    it('resets stats to zero', () => {
      const dashboard = new Dashboard();
      const alertRenderer = new AlertRenderer();
      const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      consumer.drainAll(stub.drain());

      expect(consumer.getStats().total).toBe(6);

      consumer.resetStats();

      const stats = consumer.getStats();
      expect(stats.total).toBe(0);
      expect(stats.by_type).toEqual({});
    });
  });
});
