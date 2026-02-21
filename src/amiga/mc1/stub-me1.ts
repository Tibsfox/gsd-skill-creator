/**
 * Stub ME-1 telemetry emitter with configurable event sequences.
 *
 * Provides a deterministic, pull-based event source that emits valid ICD-01
 * TELEMETRY_UPDATE, ALERT_SURFACE, and GATE_SIGNAL events wrapped in
 * EventEnvelope objects. Used for testing MC-1 components (dashboard,
 * command parser) without a real ME-1 implementation.
 *
 * Sequence factories:
 * - createNominalSequence: 6 TELEMETRY_UPDATE events, BRIEFING through COMPLETION
 * - createAdvisorySequence: telemetry + advisory alert + telemetry
 * - createGateSequence: telemetry + human_review gate signal + telemetry
 * - createFullLifecycleSequence: all event types in realistic mission order
 */

import { createEnvelope } from '../message-envelope.js';
import type { EventEnvelope } from '../message-envelope.js';
import type {
  TelemetryUpdatePayload,
  AlertSurfacePayload,
  GateSignalPayload,
} from '../icd/icd-01.js';
import type { PhaseStatus } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Discriminated union of event descriptors that StubME1 can emit.
 */
export type StubEvent =
  | { type: 'TELEMETRY_UPDATE'; payload: TelemetryUpdatePayload }
  | { type: 'ALERT_SURFACE'; payload: AlertSurfacePayload }
  | { type: 'GATE_SIGNAL'; payload: GateSignalPayload };

/**
 * Configuration for a StubME1 instance.
 */
export interface StubME1Config {
  /** Mission identifier in mission-YYYY-MM-DD-NNN format. */
  mission_id: string;
  /** Ordered sequence of events to emit. */
  events: StubEvent[];
}

// ============================================================================
// StubME1 Class
// ============================================================================

/**
 * Stub Mission Environment emitter.
 *
 * Wraps a configured event sequence and provides a pull-based iterator
 * interface. Each call to next() returns the next event wrapped in a
 * valid EventEnvelope with source=ME-1, destination=MC-1.
 */
export class StubME1 {
  private readonly config: StubME1Config;
  private cursor: number = 0;

  constructor(config: StubME1Config) {
    this.config = config;
  }

  /**
   * Return the next event in the sequence wrapped in an EventEnvelope,
   * or null when the sequence is exhausted.
   */
  next(): EventEnvelope | null {
    if (this.cursor >= this.config.events.length) {
      return null;
    }

    const event = this.config.events[this.cursor++];

    return createEnvelope({
      source: 'ME-1',
      destination: 'MC-1',
      type: event.type,
      payload: { ...event.payload } as Record<string, unknown>,
      requires_ack: event.type === 'GATE_SIGNAL',
    });
  }

  /** Reset the internal cursor to replay the sequence from the beginning. */
  reset(): void {
    this.cursor = 0;
  }

  /** Number of events remaining in the sequence. */
  get remaining(): number {
    return Math.max(0, this.config.events.length - this.cursor);
  }

  /** Total number of events in the sequence. */
  get total(): number {
    return this.config.events.length;
  }

  /** Drain all remaining events into an array. */
  drain(): EventEnvelope[] {
    const results: EventEnvelope[] = [];
    let event = this.next();
    while (event !== null) {
      results.push(event);
      event = this.next();
    }
    return results;
  }
}

// ============================================================================
// Helper: create a telemetry payload
// ============================================================================

function makeTelemetry(
  missionId: string,
  phase: PhaseStatus,
  progress: number,
  teamStatus: Record<string, { status: 'green' | 'amber' | 'red'; agent_count: number }>,
  checkpoints: Array<{ name: string; completed: boolean; timestamp?: string }>,
  resources: { cpu_percent: number; memory_mb: number; active_agents: number } = {
    cpu_percent: 25,
    memory_mb: 512,
    active_agents: 9,
  },
): StubEvent {
  const payload: TelemetryUpdatePayload = {
    mission_id: missionId,
    phase,
    progress,
    team_status: teamStatus,
    checkpoints,
    resources,
  };
  return { type: 'TELEMETRY_UPDATE', payload };
}

/** Default green team status for all 3 teams. */
function greenTeams(): Record<string, { status: 'green'; agent_count: number }> {
  return {
    CS: { status: 'green', agent_count: 3 },
    ME: { status: 'green', agent_count: 3 },
    CE: { status: 'green', agent_count: 3 },
  };
}

// ============================================================================
// Sequence Factories
// ============================================================================

/**
 * Create a nominal sequence of 6 TELEMETRY_UPDATE events covering
 * BRIEFING through COMPLETION with increasing progress.
 */
export function createNominalSequence(missionId: string): StubME1Config {
  const phases: Array<{ phase: PhaseStatus; progress: number; checkpoint: string }> = [
    { phase: 'BRIEFING', progress: 0, checkpoint: 'briefing-complete' },
    { phase: 'PLANNING', progress: 20, checkpoint: 'planning-complete' },
    { phase: 'EXECUTION', progress: 50, checkpoint: 'execution-started' },
    { phase: 'INTEGRATION', progress: 75, checkpoint: 'integration-verified' },
    { phase: 'REVIEW_GATE', progress: 90, checkpoint: 'review-passed' },
    { phase: 'COMPLETION', progress: 100, checkpoint: 'mission-complete' },
  ];

  const events: StubEvent[] = phases.map(({ phase, progress, checkpoint }) =>
    makeTelemetry(
      missionId,
      phase,
      progress,
      greenTeams(),
      [{ name: checkpoint, completed: true, timestamp: '2026-02-18T10:00:00Z' }],
    ),
  );

  return { mission_id: missionId, events };
}

/**
 * Create an advisory sequence: telemetry -> advisory alert -> telemetry.
 */
export function createAdvisorySequence(missionId: string): StubME1Config {
  const events: StubEvent[] = [
    makeTelemetry(
      missionId,
      'EXECUTION',
      50,
      greenTeams(),
      [{ name: 'execution-started', completed: true, timestamp: '2026-02-18T11:00:00Z' }],
    ),
    {
      type: 'ALERT_SURFACE',
      payload: {
        alert_level: 'advisory',
        source_agent: 'ME-2',
        message: 'Resource pressure detected: memory usage above 80%',
        category: 'resource',
        resolution: 'Consider scaling active agents',
      } satisfies AlertSurfacePayload,
    },
    makeTelemetry(
      missionId,
      'EXECUTION',
      55,
      {
        CS: { status: 'green', agent_count: 3 },
        ME: { status: 'amber', agent_count: 3 },
        CE: { status: 'green', agent_count: 3 },
      },
      [
        { name: 'execution-started', completed: true, timestamp: '2026-02-18T11:00:00Z' },
        { name: 'resource-advisory', completed: false },
      ],
    ),
  ];

  return { mission_id: missionId, events };
}

/**
 * Create a gate sequence: telemetry -> human_review gate signal -> telemetry.
 */
export function createGateSequence(missionId: string): StubME1Config {
  const deadlineDate = new Date('2026-02-18T13:00:00Z');

  const events: StubEvent[] = [
    makeTelemetry(
      missionId,
      'INTEGRATION',
      75,
      greenTeams(),
      [{ name: 'integration-verified', completed: true, timestamp: '2026-02-18T12:00:00Z' }],
    ),
    {
      type: 'GATE_SIGNAL',
      payload: {
        gate_type: 'human_review',
        blocking_phase: 'REVIEW_GATE',
        criteria: [
          { name: 'code-review-complete', met: true, evidence: 'All PRs reviewed' },
          { name: 'test-coverage-met', met: true, evidence: 'Coverage at 85%' },
        ],
        deadline: deadlineDate.toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
      } satisfies GateSignalPayload,
    },
    makeTelemetry(
      missionId,
      'REVIEW_GATE',
      90,
      greenTeams(),
      [
        { name: 'integration-verified', completed: true, timestamp: '2026-02-18T12:00:00Z' },
        { name: 'gate-review-started', completed: true, timestamp: '2026-02-18T12:30:00Z' },
      ],
    ),
  ];

  return { mission_id: missionId, events };
}

/**
 * Create a full lifecycle sequence combining nominal progression with
 * advisory and gate events interspersed. At least 9 events covering
 * all dashboard states.
 */
export function createFullLifecycleSequence(missionId: string): StubME1Config {
  const deadlineDate = new Date('2026-02-18T15:00:00Z');

  const events: StubEvent[] = [
    // BRIEFING
    makeTelemetry(missionId, 'BRIEFING', 0, greenTeams(), [
      { name: 'briefing-complete', completed: true, timestamp: '2026-02-18T09:00:00Z' },
    ]),
    // PLANNING
    makeTelemetry(missionId, 'PLANNING', 20, greenTeams(), [
      { name: 'briefing-complete', completed: true, timestamp: '2026-02-18T09:00:00Z' },
      { name: 'planning-complete', completed: true, timestamp: '2026-02-18T09:30:00Z' },
    ]),
    // EXECUTION
    makeTelemetry(missionId, 'EXECUTION', 40, greenTeams(), [
      { name: 'execution-started', completed: true, timestamp: '2026-02-18T10:00:00Z' },
    ]),
    // Advisory alert mid-execution
    {
      type: 'ALERT_SURFACE',
      payload: {
        alert_level: 'advisory',
        source_agent: 'ME-2',
        message: 'Agent ME-3 reporting elevated latency',
        category: 'agent',
      } satisfies AlertSurfacePayload,
    },
    // EXECUTION continued
    makeTelemetry(
      missionId,
      'EXECUTION',
      60,
      {
        CS: { status: 'green', agent_count: 3 },
        ME: { status: 'amber', agent_count: 3 },
        CE: { status: 'green', agent_count: 3 },
      },
      [{ name: 'execution-midpoint', completed: true, timestamp: '2026-02-18T10:30:00Z' }],
    ),
    // INTEGRATION
    makeTelemetry(missionId, 'INTEGRATION', 75, greenTeams(), [
      { name: 'integration-verified', completed: true, timestamp: '2026-02-18T11:00:00Z' },
    ]),
    // Gate signal
    {
      type: 'GATE_SIGNAL',
      payload: {
        gate_type: 'human_review',
        blocking_phase: 'REVIEW_GATE',
        criteria: [
          { name: 'integration-tests-pass', met: true, evidence: 'All 42 tests green' },
          { name: 'no-critical-alerts', met: true, evidence: 'Advisory resolved' },
        ],
        deadline: deadlineDate.toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
      } satisfies GateSignalPayload,
    },
    // REVIEW_GATE
    makeTelemetry(missionId, 'REVIEW_GATE', 90, greenTeams(), [
      { name: 'review-passed', completed: true, timestamp: '2026-02-18T12:00:00Z' },
    ]),
    // COMPLETION
    makeTelemetry(missionId, 'COMPLETION', 100, greenTeams(), [
      { name: 'mission-complete', completed: true, timestamp: '2026-02-18T12:30:00Z' },
    ]),
  ];

  return { mission_id: missionId, events };
}
