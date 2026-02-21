/**
 * Tests for CE-1 invocation recorder.
 *
 * Covers: event-driven LEDGER_ENTRY capture, non-LEDGER_ENTRY filtering,
 * AttributionLedger integration, ICD-02 field preservation, dependency tree
 * with depth decay, diagnostics, start/stop lifecycle, and error handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvocationRecorder } from '../invocation-recorder.js';
import type { InvocationRecorderConfig, RecorderStats } from '../invocation-recorder.js';
import { AttributionLedger } from '../attribution-ledger.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';
import type { LedgerEntryPayload } from '../../icd/icd-02.js';

// ============================================================================
// Test Helpers
// ============================================================================

function makeLedgerEntryEnvelope(overrides?: Partial<LedgerEntryPayload>): EventEnvelope {
  const payload = {
    mission_id: 'mission-2026-02-18-001',
    contributor_id: 'contrib-skill-author-abc',
    agent_id: 'CE-3',
    skill_name: 'test-skill',
    phase: 'EXECUTION',
    timestamp: '2026-02-18T10:00:00Z',
    context_weight: 0.8,
    dependency_tree: [
      { contributor_id: 'contrib-dep-one', depth: 0, decay_factor: 1.0 },
      { contributor_id: 'contrib-dep-two', depth: 1, decay_factor: 0.5 },
    ],
    ...overrides,
  };
  return createEnvelope({
    source: 'ME-3',
    destination: 'CE-1',
    type: 'LEDGER_ENTRY',
    payload: payload as Record<string, unknown>,
    priority: 'normal',
    requires_ack: false,
  });
}

function makeTelemetryEnvelope(): EventEnvelope {
  return createEnvelope({
    source: 'ME-3',
    destination: 'MC-1',
    type: 'TELEMETRY_UPDATE',
    payload: {
      mission_id: 'mission-2026-02-18-001',
      phase: 'EXECUTION',
      progress: 0.5,
      team_status: {},
      checkpoints: [],
      resources: { cpu_percent: 10, memory_mb: 100, active_agents: 3 },
    },
    priority: 'normal',
    requires_ack: false,
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('InvocationRecorder', () => {
  let ledger: AttributionLedger;
  let recorder: InvocationRecorder;

  beforeEach(() => {
    ledger = new AttributionLedger();
    recorder = new InvocationRecorder({ ledger });
  });

  // ==========================================================================
  // Constructor and Lifecycle Tests
  // ==========================================================================

  describe('constructor and lifecycle', () => {
    it('creates a recorder in stopped state', () => {
      expect(recorder.isRecording()).toBe(false);
    });

    it('isRecording() returns false initially', () => {
      expect(recorder.isRecording()).toBe(false);
    });

    it('start() sets recording to true', () => {
      recorder.start();
      expect(recorder.isRecording()).toBe(true);
    });

    it('stop() sets recording back to false', () => {
      recorder.start();
      recorder.stop();
      expect(recorder.isRecording()).toBe(false);
    });

    it('start() when already recording throws', () => {
      recorder.start();
      expect(() => recorder.start()).toThrow('Recorder already started');
    });

    it('stop() when not recording throws', () => {
      expect(() => recorder.stop()).toThrow('Recorder not started');
    });
  });

  // ==========================================================================
  // Event-Driven Capture Tests (CMON-03)
  // ==========================================================================

  describe('event-driven capture', () => {
    it('records LEDGER_ENTRY events to the ledger', () => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
      expect(ledger.count()).toBe(1);
    });

    it('ignores non-LEDGER_ENTRY events', () => {
      recorder.start();
      recorder.handleEvent(makeTelemetryEnvelope());
      expect(ledger.count()).toBe(0);
    });

    it('records multiple LEDGER_ENTRY events', () => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
      recorder.handleEvent(makeLedgerEntryEnvelope({ contributor_id: 'contrib-second-person' }));
      recorder.handleEvent(makeLedgerEntryEnvelope({ contributor_id: 'contrib-third-person' }));
      expect(ledger.count()).toBe(3);
    });

    it('ignores events before start()', () => {
      recorder.handleEvent(makeLedgerEntryEnvelope());
      expect(ledger.count()).toBe(0);
    });

    it('ignores events after stop()', () => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
      recorder.stop();
      recorder.handleEvent(makeLedgerEntryEnvelope({ contributor_id: 'contrib-after-stop' }));
      expect(ledger.count()).toBe(1);
    });
  });

  // ==========================================================================
  // Integration with Event Bus (CMON-03 -- no ME-1 modification)
  // ==========================================================================

  describe('event bus integration', () => {
    it('works event-driven via handleEvent without modifying ME-1', () => {
      // Simulate the event bus wiring: events arrive at recorder.handleEvent
      recorder.start();

      // Simulate a LEDGER_ENTRY envelope arriving from the event bus
      const ledgerEnvelope = makeLedgerEntryEnvelope();
      recorder.handleEvent(ledgerEnvelope);

      expect(ledger.count()).toBe(1);
      const entries = ledger.getAll();
      expect(entries[0].mission_id).toBe('mission-2026-02-18-001');
    });

    it('filters event types correctly in bus scenario', () => {
      recorder.start();

      // Telemetry event -> ignored
      recorder.handleEvent(makeTelemetryEnvelope());
      // LEDGER_ENTRY event -> captured
      recorder.handleEvent(makeLedgerEntryEnvelope());

      expect(ledger.count()).toBe(1);
    });
  });

  // ==========================================================================
  // Payload Field Capture Tests (CMON-04)
  // ==========================================================================

  describe('payload field capture', () => {
    beforeEach(() => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
    });

    it('captures context_weight from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].context_weight).toBe(0.8);
    });

    it('captures timestamp from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].timestamp).toBe('2026-02-18T10:00:00Z');
    });

    it('captures phase from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].phase).toBe('EXECUTION');
    });

    it('captures agent_id from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].agent_id).toBe('CE-3');
    });

    it('captures skill_name from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].skill_name).toBe('test-skill');
    });

    it('captures mission_id from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].mission_id).toBe('mission-2026-02-18-001');
    });

    it('captures contributor_id from payload', () => {
      const entries = ledger.getAll();
      expect(entries[0].contributor_id).toBe('contrib-skill-author-abc');
    });
  });

  // ==========================================================================
  // Dependency Tree with Depth Decay Tests (CMON-04)
  // ==========================================================================

  describe('dependency tree with depth decay', () => {
    beforeEach(() => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
    });

    it('captures dependency_tree array with 2 nodes', () => {
      const entries = ledger.getAll();
      expect(entries[0].dependency_tree).toHaveLength(2);
    });

    it('first node has correct contributor_id, depth, and decay_factor', () => {
      const entries = ledger.getAll();
      const node0 = entries[0].dependency_tree[0];
      expect(node0.contributor_id).toBe('contrib-dep-one');
      expect(node0.depth).toBe(0);
      expect(node0.decay_factor).toBe(1.0);
    });

    it('second node has correct contributor_id, depth, and decay_factor', () => {
      const entries = ledger.getAll();
      const node1 = entries[0].dependency_tree[1];
      expect(node1.contributor_id).toBe('contrib-dep-two');
      expect(node1.depth).toBe(1);
      expect(node1.decay_factor).toBe(0.5);
    });

    it('records entry with empty dependency tree', () => {
      recorder.handleEvent(makeLedgerEntryEnvelope({
        dependency_tree: [],
        contributor_id: 'contrib-no-deps-one',
      }));
      const entries = ledger.query({ contributor_id: 'contrib-no-deps-one' });
      expect(entries[0].dependency_tree).toHaveLength(0);
    });

    it('preserves deep tree depth/decay values', () => {
      recorder.handleEvent(makeLedgerEntryEnvelope({
        dependency_tree: [
          { contributor_id: 'contrib-deep-one', depth: 0, decay_factor: 1.0 },
          { contributor_id: 'contrib-deep-two', depth: 1, decay_factor: 0.5 },
          { contributor_id: 'contrib-deep-three', depth: 2, decay_factor: 0.25 },
          { contributor_id: 'contrib-deep-four', depth: 3, decay_factor: 0.125 },
        ],
        contributor_id: 'contrib-deep-tree-one',
      }));
      const entries = ledger.query({ contributor_id: 'contrib-deep-tree-one' });
      expect(entries[0].dependency_tree).toHaveLength(4);
      expect(entries[0].dependency_tree[3].depth).toBe(3);
      expect(entries[0].dependency_tree[3].decay_factor).toBe(0.125);
    });
  });

  // ==========================================================================
  // Diagnostics Tests
  // ==========================================================================

  describe('diagnostics', () => {
    it('returns zero stats on fresh recorder', () => {
      const stats = recorder.getStats();
      expect(stats.totalEventsReceived).toBe(0);
      expect(stats.ledgerEntriesCaptured).toBe(0);
    });

    it('tracks total events and captured entries correctly', () => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
      recorder.handleEvent(makeLedgerEntryEnvelope({ contributor_id: 'contrib-second-person' }));
      recorder.handleEvent(makeTelemetryEnvelope());
      const stats = recorder.getStats();
      expect(stats.totalEventsReceived).toBe(3);
      expect(stats.ledgerEntriesCaptured).toBe(2);
    });

    it('stats are not reset by stop/start cycles', () => {
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope());
      recorder.stop();
      recorder.start();
      recorder.handleEvent(makeLedgerEntryEnvelope({ contributor_id: 'contrib-second-person' }));
      const stats = recorder.getStats();
      expect(stats.totalEventsReceived).toBe(2);
      expect(stats.ledgerEntriesCaptured).toBe(2);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('does not throw on invalid LEDGER_ENTRY payload, increments error count', () => {
      recorder.start();
      const badEnvelope = createEnvelope({
        source: 'ME-3',
        destination: 'CE-1',
        type: 'LEDGER_ENTRY',
        payload: { invalid: 'missing required fields' },
        priority: 'normal',
        requires_ack: false,
      });
      expect(() => recorder.handleEvent(badEnvelope)).not.toThrow();
      const stats = recorder.getStats();
      expect(stats.errors).toBe(1);
      expect(ledger.count()).toBe(0);
    });

    it('does not append invalid payloads to the ledger', () => {
      recorder.start();
      const badEnvelope = createEnvelope({
        source: 'ME-3',
        destination: 'CE-1',
        type: 'LEDGER_ENTRY',
        payload: { mission_id: 'bad-format' },
        priority: 'normal',
        requires_ack: false,
      });
      recorder.handleEvent(badEnvelope);
      expect(ledger.count()).toBe(0);
    });

    it('does not throw when ledger is sealed, increments error count', () => {
      recorder.start();
      ledger.seal();
      expect(() => recorder.handleEvent(makeLedgerEntryEnvelope())).not.toThrow();
      const stats = recorder.getStats();
      expect(stats.errors).toBe(1);
    });
  });
});
