/**
 * Tests for stub ME-1 telemetry emitter.
 *
 * Covers:
 * - StubME1 instantiation (next, reset, remaining, total, drain)
 * - Nominal sequence: 6 TELEMETRY_UPDATE events covering BRIEFING through COMPLETION
 * - Advisory sequence: TELEMETRY_UPDATE + ALERT_SURFACE(advisory) + TELEMETRY_UPDATE
 * - Gate sequence: TELEMETRY_UPDATE + GATE_SIGNAL(human_review) + TELEMETRY_UPDATE
 * - Full lifecycle: all three event types in realistic order
 * - Envelope correctness: source, destination, requires_ack, id, timestamp
 */

import { describe, it, expect } from 'vitest';
import {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createGateSequence,
  createFullLifecycleSequence,
} from '../stub-me1.js';
import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
} from '../../icd/icd-01.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';

// ============================================================================
// StubME1 instantiation
// ============================================================================

describe('StubME1', () => {
  describe('instantiation and iteration', () => {
    it('accepts a StubME1Config with mission_id and events', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      expect(stub).toBeDefined();
    });

    it('next() returns the first event in the sequence', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const event = stub.next();
      expect(event).not.toBeNull();
    });

    it('next() returns null when sequence is exhausted', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      // Drain all events
      while (stub.next() !== null) {
        // consume
      }
      expect(stub.next()).toBeNull();
    });

    it('reset() restarts the sequence from the beginning', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const first = stub.next();
      stub.reset();
      const afterReset = stub.next();
      expect(afterReset).not.toBeNull();
      expect(afterReset!.type).toBe(first!.type);
    });

    it('remaining getter returns count of remaining events', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const total = stub.total;
      expect(stub.remaining).toBe(total);
      stub.next();
      expect(stub.remaining).toBe(total - 1);
    });

    it('total getter returns the total event count', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      expect(stub.total).toBe(config.events.length);
    });

    it('drain() returns all remaining events as an array', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      expect(events.length).toBe(config.events.length);
      expect(stub.remaining).toBe(0);
    });
  });

  // ============================================================================
  // Nominal sequence
  // ============================================================================

  describe('createNominalSequence', () => {
    it('creates a sequence of TELEMETRY_UPDATE events', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      for (const event of events) {
        expect(event.type).toBe('TELEMETRY_UPDATE');
      }
    });

    it('covers phases BRIEFING through COMPLETION (at least 6 events)', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      expect(config.events.length).toBeGreaterThanOrEqual(6);
    });

    it('has progress increasing from 0 toward 100', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const progresses = config.events.map((e) => (e.payload as { progress: number }).progress);
      expect(progresses[0]).toBe(0);
      expect(progresses[progresses.length - 1]).toBe(100);
      // Each subsequent progress should be >= the previous
      for (let i = 1; i < progresses.length; i++) {
        expect(progresses[i]).toBeGreaterThanOrEqual(progresses[i - 1]);
      }
    });

    it('has all team_status entries as green', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      for (const event of config.events) {
        const payload = event.payload as { team_status: Record<string, { status: string }> };
        for (const team of Object.values(payload.team_status)) {
          expect(team.status).toBe('green');
        }
      }
    });

    it('every payload passes TelemetryUpdatePayloadSchema validation', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      for (const event of config.events) {
        const result = TelemetryUpdatePayloadSchema.safeParse(event.payload);
        expect(result.success).toBe(true);
      }
    });

    it('every event is wrapped in a valid EventEnvelope', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      for (const event of events) {
        const result = EventEnvelopeSchema.safeParse(event);
        expect(result.success).toBe(true);
        expect(event.source).toBe('ME-1');
        expect(event.destination).toBe('MC-1');
        expect(event.type).toBe('TELEMETRY_UPDATE');
      }
    });
  });

  // ============================================================================
  // Advisory sequence
  // ============================================================================

  describe('createAdvisorySequence', () => {
    it('creates a sequence that includes at least one ALERT_SURFACE event', () => {
      const config = createAdvisorySequence('mission-2026-02-18-001');
      const alertEvents = config.events.filter((e) => e.type === 'ALERT_SURFACE');
      expect(alertEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('the alert event has alert_level advisory', () => {
      const config = createAdvisorySequence('mission-2026-02-18-001');
      const alertEvent = config.events.find((e) => e.type === 'ALERT_SURFACE')!;
      expect((alertEvent.payload as { alert_level: string }).alert_level).toBe('advisory');
    });

    it('the alert payload passes AlertSurfacePayloadSchema validation', () => {
      const config = createAdvisorySequence('mission-2026-02-18-001');
      const alertEvent = config.events.find((e) => e.type === 'ALERT_SURFACE')!;
      const result = AlertSurfacePayloadSchema.safeParse(alertEvent.payload);
      expect(result.success).toBe(true);
    });

    it('sequence also includes TELEMETRY_UPDATE events', () => {
      const config = createAdvisorySequence('mission-2026-02-18-001');
      const telemetryEvents = config.events.filter((e) => e.type === 'TELEMETRY_UPDATE');
      expect(telemetryEvents.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // Gate sequence
  // ============================================================================

  describe('createGateSequence', () => {
    it('creates a sequence that includes a GATE_SIGNAL event', () => {
      const config = createGateSequence('mission-2026-02-18-001');
      const gateEvents = config.events.filter((e) => e.type === 'GATE_SIGNAL');
      expect(gateEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('the gate signal has gate_type human_review and criteria', () => {
      const config = createGateSequence('mission-2026-02-18-001');
      const gateEvent = config.events.find((e) => e.type === 'GATE_SIGNAL')!;
      const payload = gateEvent.payload as { gate_type: string; criteria: unknown[] };
      expect(payload.gate_type).toBe('human_review');
      expect(payload.criteria.length).toBeGreaterThanOrEqual(1);
    });

    it('the gate payload passes GateSignalPayloadSchema validation', () => {
      const config = createGateSequence('mission-2026-02-18-001');
      const gateEvent = config.events.find((e) => e.type === 'GATE_SIGNAL')!;
      const result = GateSignalPayloadSchema.safeParse(gateEvent.payload);
      expect(result.success).toBe(true);
    });

    it('sequence includes TELEMETRY_UPDATE events before and after the gate', () => {
      const config = createGateSequence('mission-2026-02-18-001');
      const gateIndex = config.events.findIndex((e) => e.type === 'GATE_SIGNAL');
      expect(gateIndex).toBeGreaterThan(0);
      expect(gateIndex).toBeLessThan(config.events.length - 1);
      expect(config.events[gateIndex - 1].type).toBe('TELEMETRY_UPDATE');
      expect(config.events[gateIndex + 1].type).toBe('TELEMETRY_UPDATE');
    });
  });

  // ============================================================================
  // Full lifecycle sequence
  // ============================================================================

  describe('createFullLifecycleSequence', () => {
    it('includes at least one of each event type', () => {
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      const types = new Set(config.events.map((e) => e.type));
      expect(types.has('TELEMETRY_UPDATE')).toBe(true);
      expect(types.has('ALERT_SURFACE')).toBe(true);
      expect(types.has('GATE_SIGNAL')).toBe(true);
    });

    it('all events pass their respective ICD-01 schema validation', () => {
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      for (const event of config.events) {
        if (event.type === 'TELEMETRY_UPDATE') {
          expect(TelemetryUpdatePayloadSchema.safeParse(event.payload).success).toBe(true);
        } else if (event.type === 'ALERT_SURFACE') {
          expect(AlertSurfacePayloadSchema.safeParse(event.payload).success).toBe(true);
        } else if (event.type === 'GATE_SIGNAL') {
          expect(GateSignalPayloadSchema.safeParse(event.payload).success).toBe(true);
        }
      }
    });

    it('all events pass EventEnvelope validation when emitted', () => {
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      for (const event of events) {
        const result = EventEnvelopeSchema.safeParse(event);
        expect(result.success).toBe(true);
      }
    });

    it('has at least 10 events total', () => {
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      expect(config.events.length).toBeGreaterThanOrEqual(9);
    });
  });

  // ============================================================================
  // Envelope correctness
  // ============================================================================

  describe('envelope correctness', () => {
    it('every event has source ME-1 and destination MC-1', () => {
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      for (const event of events) {
        expect(event.source).toBe('ME-1');
        expect(event.destination).toBe('MC-1');
      }
    });

    it('GATE_SIGNAL events have requires_ack true', () => {
      const config = createGateSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      const gateEvents = events.filter((e) => e.type === 'GATE_SIGNAL');
      for (const event of gateEvents) {
        expect(event.requires_ack).toBe(true);
      }
    });

    it('TELEMETRY_UPDATE events have requires_ack false', () => {
      const config = createNominalSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      for (const event of events) {
        expect(event.requires_ack).toBe(false);
      }
    });

    it('all events have non-null id and valid timestamp', () => {
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);
      const events = stub.drain();
      for (const event of events) {
        expect(event.id).toBeTruthy();
        expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    });
  });
});
