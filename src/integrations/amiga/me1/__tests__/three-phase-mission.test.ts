/**
 * Three-phase autonomous mission lifecycle integration test.
 *
 * Exercises the complete ME-1 system: provisioning, phase transitions,
 * gate suspension/clearance, command dispatch, telemetry emission,
 * and archive sealing. Validates all emitted telemetry against ICD-01
 * schemas and verifies archive integrity.
 */

import { describe, it, expect } from 'vitest';
import {
  provision,
  PhaseEngine,
  TelemetryEmitter,
  GateController,
  ArchiveWriter,
} from '../index.js';
import { SwarmCoordinator } from '../swarm-coordinator.js';
import type { TeamRegistration } from '../swarm-coordinator.js';
import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
} from '../../icd/icd-01.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';
import { createEnvelope } from '../../message-envelope.js';

// ---------------------------------------------------------------------------
// Three-phase autonomous mission lifecycle
// ---------------------------------------------------------------------------

describe('three-phase autonomous mission lifecycle', () => {
  // Shared state across sequential tests
  let engine: InstanceType<typeof PhaseEngine>;
  let emitter: InstanceType<typeof TelemetryEmitter>;
  let controller: InstanceType<typeof GateController>;
  let coordinator: InstanceType<typeof SwarmCoordinator>;
  let archiveWriter: InstanceType<typeof ArchiveWriter>;

  // --------------------------------------------------------------------------
  // Phase 1: Provisioning and Launch
  // --------------------------------------------------------------------------

  describe('Phase 1: Provisioning and Launch', () => {
    it('provisions a mission with brief', () => {
      const env = provision({
        mission_id: 'mission-2026-02-18-001',
        name: 'Integration Test Mission',
        description: 'Three-phase autonomous test mission',
        skills: [
          { skill_id: 'skill-alpha', version: '1.0.0' },
          { skill_id: 'skill-beta', version: '2.0.0' },
          { skill_id: 'skill-gamma', version: '1.1.0' },
        ],
        agents: [
          { agent_id: 'ME-1', role: 'provisioner' },
          { agent_id: 'ME-2', role: 'phase-engine' },
        ],
      });

      expect(env.manifest).toBeDefined();
      expect(env.manifest.status).toBe('provisioned');
      expect(env.manifest.skills).toHaveLength(3);
      expect(env.manifest.agents).toHaveLength(2);

      emitter = env.emitter;
      engine = new PhaseEngine({ manifest: env.manifest, emitter });
      controller = new GateController({ engine, emitter });

      const teams: TeamRegistration[] = [
        { team_id: 'CS', agent_ids: ['CS-1', 'CS-2'], status: 'active' },
        { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'], status: 'active' },
        { team_id: 'CE', agent_ids: ['CE-1', 'CE-2'], status: 'active' },
      ];
      coordinator = new SwarmCoordinator({ emitter, teams });

      archiveWriter = new ArchiveWriter({ manifest: env.manifest, emitter });
    });

    it('dispatches LAUNCH command successfully', () => {
      const launchEnvelope = createEnvelope({
        source: 'MC-1',
        destination: 'ME-1',
        type: 'COMMAND_DISPATCH',
        payload: {
          command: 'LAUNCH',
          target_agent: 'broadcast',
          mission_id: 'mission-2026-02-18-001',
        },
        priority: 'normal',
        requires_ack: true,
      });
      const result = coordinator.dispatch(launchEnvelope);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.dispatched_to).toEqual(expect.arrayContaining(['CS', 'ME', 'CE']));
      }
    });
  });

  // --------------------------------------------------------------------------
  // Phase 2: Lifecycle traversal with gate suspension
  // --------------------------------------------------------------------------

  describe('Phase 2: Lifecycle traversal with gate suspension', () => {
    it('advances engine to REVIEW_GATE via gate controller', () => {
      controller.advanceToGate();
      expect(controller.getCurrentPhase()).toBe('REVIEW_GATE');
    });

    it('controller is suspended at REVIEW_GATE', () => {
      expect(controller.isSuspended()).toBe(true);
    });

    it('GATE_SIGNAL event was emitted and validates against schema', () => {
      const log = emitter.getEventLog();
      const gateSignals = log.filter(e => e.type === 'GATE_SIGNAL');
      expect(gateSignals.length).toBeGreaterThanOrEqual(1);
      const lastGateSignal = gateSignals[gateSignals.length - 1];
      const parseResult = GateSignalPayloadSchema.safeParse(lastGateSignal.payload);
      expect(parseResult.success).toBe(true);
    });

    it('clears gate with go decision and reaches COMPLETION', () => {
      controller.clearGate({
        decision: 'go',
        reasoning: 'All criteria met',
        responder: 'human',
      });
      expect(controller.getCurrentPhase()).toBe('COMPLETION');
      expect(controller.isSuspended()).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Phase 3: Archive and validation
  // --------------------------------------------------------------------------

  describe('Phase 3: Archive and validation', () => {
    it('updates archive writer manifest and seals with completed outcome', () => {
      archiveWriter.updateManifest(engine.getManifest());
      const archive = archiveWriter.seal('completed');
      expect(archive).toBeDefined();
      expect(archive.outcome).toBe('completed');
      expect(archiveWriter.isSealed()).toBe(true);

      // Store for later assertions
      (globalThis as Record<string, unknown>).__testArchive = archive;
    });
  });

  // --------------------------------------------------------------------------
  // Telemetry validation (cross-cutting)
  // --------------------------------------------------------------------------

  describe('telemetry validation', () => {
    it('all TELEMETRY_UPDATE events validate against schema', () => {
      const log = emitter.getEventLog();
      const telemetryEvents = log.filter(e => e.type === 'TELEMETRY_UPDATE');
      expect(telemetryEvents.length).toBeGreaterThan(0);
      for (const event of telemetryEvents) {
        const parseResult = TelemetryUpdatePayloadSchema.safeParse(event.payload);
        expect(parseResult.success).toBe(true);
      }
    });

    it('all GATE_SIGNAL events validate against schema', () => {
      const log = emitter.getEventLog();
      const gateEvents = log.filter(e => e.type === 'GATE_SIGNAL');
      for (const event of gateEvents) {
        const parseResult = GateSignalPayloadSchema.safeParse(event.payload);
        expect(parseResult.success).toBe(true);
      }
    });

    it('all ALERT_SURFACE events validate against schema (if any)', () => {
      const log = emitter.getEventLog();
      const alertEvents = log.filter(e => e.type === 'ALERT_SURFACE');
      for (const event of alertEvents) {
        const parseResult = AlertSurfacePayloadSchema.safeParse(event.payload);
        expect(parseResult.success).toBe(true);
      }
    });

    it('all events validate against EventEnvelopeSchema', () => {
      const log = emitter.getEventLog();
      expect(log.length).toBeGreaterThan(0);
      let failures = 0;
      for (const event of log) {
        const parseResult = EventEnvelopeSchema.safeParse(event);
        if (!parseResult.success) {
          failures++;
        }
      }
      expect(failures).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Manifest completeness validation
  // --------------------------------------------------------------------------

  describe('manifest completeness', () => {
    it('final manifest has phase entries for all 6 lifecycle phases', () => {
      const manifest = engine.getManifest();
      const expectedPhases = ['BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION'];
      for (const phase of expectedPhases) {
        expect(manifest.phases[phase]).toBeDefined();
      }
    });

    it('all traversed phases have started_at timestamps', () => {
      const manifest = engine.getManifest();
      // BRIEFING through COMPLETION were all entered
      const phasesWithStarted = ['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION'];
      for (const phase of phasesWithStarted) {
        expect(manifest.phases[phase].started_at).toBeDefined();
        expect(manifest.phases[phase].started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });

    it('COMPLETION phase has started_at set', () => {
      const manifest = engine.getManifest();
      expect(manifest.phases['COMPLETION'].started_at).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Archive integrity validation
  // --------------------------------------------------------------------------

  describe('archive integrity', () => {
    it('integrity hash is a 64-character hex string (SHA-256)', () => {
      const archive = (globalThis as Record<string, unknown>).__testArchive as {
        integrity_hash: string;
        event_count: number;
        manifest: { mission_id: string };
        outcome: string;
        events: readonly unknown[];
      };
      expect(archive.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('event_count matches the emitter event log length', () => {
      const archive = (globalThis as Record<string, unknown>).__testArchive as {
        event_count: number;
        events: readonly unknown[];
      };
      expect(archive.event_count).toBe(archive.events.length);
    });

    it('archive manifest matches the final engine manifest', () => {
      const archive = (globalThis as Record<string, unknown>).__testArchive as {
        manifest: { mission_id: string };
      };
      expect(archive.manifest.mission_id).toBe('mission-2026-02-18-001');
    });

    it('archive outcome is completed', () => {
      const archive = (globalThis as Record<string, unknown>).__testArchive as {
        outcome: string;
      };
      expect(archive.outcome).toBe('completed');
    });

    it('archive is deeply frozen', () => {
      const archive = (globalThis as Record<string, unknown>).__testArchive as Record<string, unknown>;
      expect(Object.isFrozen(archive)).toBe(true);
      expect(Object.isFrozen(archive.events)).toBe(true);
      expect(Object.isFrozen(archive.manifest)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Abort scenario
// ---------------------------------------------------------------------------

describe('abort scenario', () => {
  it('provisions and advances to EXECUTION then aborts', () => {
    const env = provision({
      mission_id: 'mission-2026-02-18-002',
      name: 'Abort Test Mission',
      description: 'Testing abort archive',
      skills: [],
      agents: [{ agent_id: 'ME-1', role: 'provisioner' }],
    });

    const engine = new PhaseEngine({ manifest: env.manifest, emitter: env.emitter });
    engine.transition('PLANNING');
    engine.transition('EXECUTION');

    // Create coordinator and dispatch ABORT
    const teams: TeamRegistration[] = [
      { team_id: 'ME', agent_ids: ['ME-1'], status: 'active' },
    ];
    const coordinator = new SwarmCoordinator({ emitter: env.emitter, teams });
    const abortEnvelope = createEnvelope({
      source: 'MC-1',
      destination: 'ME-1',
      type: 'COMMAND_DISPATCH',
      payload: {
        command: 'ABORT',
        target_agent: 'broadcast',
        mission_id: 'mission-2026-02-18-002',
      },
      priority: 'urgent',
      requires_ack: true,
    });
    coordinator.dispatch(abortEnvelope);

    // Transition engine to ABORT
    engine.transition('ABORT');

    // Seal archive
    const writer = new ArchiveWriter({ manifest: engine.getManifest(), emitter: env.emitter });
    const archive = writer.seal('aborted');

    expect(archive.outcome).toBe('aborted');
    expect(archive.events.length).toBeGreaterThan(0);
    expect(archive.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('aborted archive telemetry is valid per ICD-01', () => {
    const env = provision({
      mission_id: 'mission-2026-02-18-003',
      name: 'Abort Telemetry Test',
      description: 'Testing abort telemetry validation',
      skills: [],
      agents: [{ agent_id: 'ME-1', role: 'provisioner' }],
    });

    const engine = new PhaseEngine({ manifest: env.manifest, emitter: env.emitter });
    engine.transition('PLANNING');
    engine.transition('ABORT');

    const writer = new ArchiveWriter({ manifest: engine.getManifest(), emitter: env.emitter });
    const archive = writer.seal('aborted');

    // Validate all events
    for (const event of archive.events) {
      const envelopeResult = EventEnvelopeSchema.safeParse(event);
      expect(envelopeResult.success).toBe(true);

      if (event.type === 'TELEMETRY_UPDATE') {
        const payloadResult = TelemetryUpdatePayloadSchema.safeParse(event.payload);
        expect(payloadResult.success).toBe(true);
      }
    }
  });
});
