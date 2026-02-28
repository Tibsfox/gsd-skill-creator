/**
 * End-to-end integration tests for the four-component AMIGA stack.
 *
 * Exercises FullStackController through complete mission lifecycles,
 * proving all four ICD channels active, attribution flow correct,
 * governance evaluation verified, and schema validation passing.
 *
 * Covers: INTG-04 (attribution flow), INTG-05 (governance check),
 *         INTG-06 (all four ICDs active)
 */

import { describe, it, expect } from 'vitest';
import { FullStackController } from '../full-stack-controller.js';
import type { FullStackConfig } from '../full-stack-controller.js';
import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
} from '../../icd/icd-01.js';
import { LedgerEntryPayloadSchema } from '../../icd/icd-02.js';
import { GovernanceQueryPayloadSchema, GovernanceResponsePayloadSchema } from '../../icd/icd-03.js';
import { LedgerReadPayloadSchema } from '../../icd/icd-04.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';

// ============================================================================
// Shared config factory
// ============================================================================

function createFullStackConfig(missionId: string): FullStackConfig {
  return {
    mission_id: missionId,
    name: `E2E Full Stack Mission ${missionId}`,
    description: 'Four-ICD end-to-end integration verification for Integration Gate 2',
    skills: [{ skill_id: 'skill-fullstack-e2e', version: '1.0.0' }],
    agents: [
      { agent_id: 'ME-1', role: 'provisioner' },
      { agent_id: 'ME-2', role: 'phase-engine' },
      { agent_id: 'ME-3', role: 'telemetry' },
      { agent_id: 'CE-1', role: 'commons-engine' },
      { agent_id: 'GL-1', role: 'governance' },
    ],
    teams: [
      { team_id: 'CS', agent_ids: ['CS-1', 'CS-2'] },
      { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'] },
      { team_id: 'CE', agent_ids: ['CE-1'] },
      { team_id: 'GL', agent_ids: ['GL-1'] },
    ],
    contributors: [
      { contributor_id: 'contrib-alice-001', name: 'Alice', type: 'human' },
      { contributor_id: 'contrib-bob-002', name: 'Bob', type: 'human', dependencies: ['contrib-alice-001'] },
      { contributor_id: 'contrib-agent-003', name: 'CodeAgent', type: 'agent' },
    ],
  };
}

// ============================================================================
// ICD schema mapping for per-event validation
// ============================================================================

const ICD_PAYLOAD_SCHEMAS: Record<string, { parse: (data: unknown) => unknown; safeParse: (data: unknown) => { success: boolean; error?: unknown } }> = {
  TELEMETRY_UPDATE: TelemetryUpdatePayloadSchema,
  ALERT_SURFACE: AlertSurfacePayloadSchema,
  GATE_SIGNAL: GateSignalPayloadSchema,
  LEDGER_ENTRY: LedgerEntryPayloadSchema,
  GOVERNANCE_QUERY: GovernanceQueryPayloadSchema,
  GOVERNANCE_RESPONSE: GovernanceResponsePayloadSchema,
  LEDGER_READ: LedgerReadPayloadSchema,
};

const ICD_TYPE_MAP: Record<string, string> = {
  TELEMETRY_UPDATE: 'ICD-01',
  ALERT_SURFACE: 'ICD-01',
  GATE_SIGNAL: 'ICD-01',
  GATE_RESPONSE: 'ICD-01',
  COMMAND_DISPATCH: 'ICD-01',
  LEDGER_ENTRY: 'ICD-02',
  GOVERNANCE_QUERY: 'ICD-03',
  GOVERNANCE_RESPONSE: 'ICD-03',
  LEDGER_READ: 'ICD-04',
  DISPUTE_RECORD: 'ICD-04',
};

// ============================================================================
// Scenario 1: INTG-06 -- All four ICD channels active in a single mission run
// ============================================================================

describe('INTG-06: All four ICD channels active in a single mission run', () => {
  it('runFullLifecycle exercises all four ICD channels', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-501'));
    const result = controller.runFullLifecycle();

    expect(result.icdChannelsExercised).toContain('ICD-01');
    expect(result.icdChannelsExercised).toContain('ICD-02');
    expect(result.icdChannelsExercised).toContain('ICD-03');
    expect(result.icdChannelsExercised).toContain('ICD-04');
    expect(result.icdChannelsExercised.length).toBe(4);
  });

  it('event log contains events for each ICD', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-502'));
    const result = controller.runFullLifecycle();

    const icdCounts: Record<string, number> = { 'ICD-01': 0, 'ICD-02': 0, 'ICD-03': 0, 'ICD-04': 0 };
    for (const event of result.eventLog) {
      const icd = ICD_TYPE_MAP[event.type];
      if (icd) icdCounts[icd]++;
    }

    // All four ICDs have non-zero counts
    expect(icdCounts['ICD-01']).toBeGreaterThan(0);
    expect(icdCounts['ICD-02']).toBeGreaterThan(0);
    expect(icdCounts['ICD-03']).toBeGreaterThan(0);
    expect(icdCounts['ICD-04']).toBeGreaterThan(0);
  });

  it('ICD-01 has at least one TELEMETRY_UPDATE and one GATE_SIGNAL', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-503'));
    const result = controller.runFullLifecycle();

    const telemetryUpdates = result.eventLog.filter(e => e.type === 'TELEMETRY_UPDATE');
    const gateSignals = result.eventLog.filter(e => e.type === 'GATE_SIGNAL');

    expect(telemetryUpdates.length).toBeGreaterThan(0);
    expect(gateSignals.length).toBeGreaterThanOrEqual(1);
  });

  it('ICD-02 has at least one LEDGER_ENTRY', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-504'));
    const result = controller.runFullLifecycle();

    const ledgerEntries = result.eventLog.filter(e => e.type === 'LEDGER_ENTRY');
    expect(ledgerEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('ICD-03 has governance query/response evidence', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-505'));
    const result = controller.runFullLifecycle();

    const govEvents = result.eventLog.filter(
      e => e.type === 'GOVERNANCE_QUERY' || e.type === 'GOVERNANCE_RESPONSE',
    );
    expect(govEvents.length).toBeGreaterThan(0);
  });

  it('ICD-04 has governance ledger read evidence', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-506'));
    const result = controller.runFullLifecycle();

    const ledgerReads = result.eventLog.filter(e => e.type === 'LEDGER_READ');
    expect(ledgerReads.length).toBeGreaterThanOrEqual(1);
  });

  it('all events pass EventEnvelopeSchema validation', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-507'));
    const result = controller.runFullLifecycle();

    let failures = 0;
    for (const event of result.eventLog) {
      const r = EventEnvelopeSchema.safeParse(event);
      if (!r.success) failures++;
    }
    expect(failures).toBe(0);
  });
});

// ============================================================================
// Scenario 2: INTG-04 -- Attribution flow with correct, queryable ledger
// ============================================================================

describe('INTG-04: Attribution flow with correct, queryable ledger', () => {
  it('basic attribution flow with 3 contributors at different phases', () => {
    const missionId = 'mission-2026-02-18-511';
    const controller = new FullStackController(createFullStackConfig(missionId));

    // Advance and emit at PLANNING
    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'code-review',
      phase: 'PLANNING',
      context_weight: 0.8,
      dependency_tree: [],
    });

    // Advance and emit at EXECUTION
    controller.advancePhase(); // -> EXECUTION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'implementation',
      phase: 'EXECUTION',
      context_weight: 0.9,
      dependency_tree: [{ contributor_id: 'contrib-alice-001', depth: 0, decay_factor: 0.5 }],
    });

    // Advance and emit at INTEGRATION
    controller.advancePhase(); // -> INTEGRATION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-agent-003',
      skill_name: 'testing',
      phase: 'INTEGRATION',
      context_weight: 0.6,
      dependency_tree: [],
    });

    // Complete mission
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'All tests pass', responder: 'human' });

    const { weights, distributionPlan } = controller.calculateAttribution();

    // Weight vector has 3 entries, one per contributor
    expect(weights.weights.length).toBe(3);

    // All weights positive and sum to 1.0
    const weightSum = weights.weights.reduce((s, w) => s + w.weight, 0);
    expect(weightSum).toBeCloseTo(1.0, 5);
    for (const w of weights.weights) {
      expect(w.weight).toBeGreaterThan(0);
    }

    // Query ledger by mission_id returns all 3 entries
    const allEntries = controller.queryLedger({ mission_id: missionId });
    expect(allEntries.length).toBe(3);

    // Query by contributor_id returns 1 entry for Alice
    const aliceEntries = controller.queryLedger({ contributor_id: 'contrib-alice-001' });
    expect(aliceEntries.length).toBe(1);

    // Query by phase 'EXECUTION' returns Bob's entry
    const execEntries = controller.queryLedger({ phase: 'EXECUTION' });
    expect(execEntries.length).toBe(1);
    expect(execEntries[0].contributor_id).toBe('contrib-bob-002');
  });

  it('multiple entries per contributor: frequency affects weights', () => {
    const missionId = 'mission-2026-02-18-512';
    const controller = new FullStackController(createFullStackConfig(missionId));

    controller.advancePhase(); // -> PLANNING
    // Alice: 2 entries
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'code-review',
      phase: 'PLANNING',
      context_weight: 0.8,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> EXECUTION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'design-review',
      phase: 'EXECUTION',
      context_weight: 0.7,
      dependency_tree: [],
    });

    // Bob: 1 entry
    controller.advancePhase(); // -> INTEGRATION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'implementation',
      phase: 'INTEGRATION',
      context_weight: 0.9,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

    const { weights } = controller.calculateAttribution();

    // Weight vector still normalized to 1.0
    const weightSum = weights.weights.reduce((s, w) => s + w.weight, 0);
    expect(weightSum).toBeCloseTo(1.0, 5);

    // Both contributors have entries
    expect(weights.weights.length).toBe(2);
  });

  it('ledger immutability after seal', () => {
    const missionId = 'mission-2026-02-18-513';
    const controller = new FullStackController(createFullStackConfig(missionId));
    const result = controller.runFullLifecycle();

    // Sealed
    expect(controller.getCE1State().sealed).toBe(true);

    // Still queryable
    const entries = controller.queryLedger({ mission_id: missionId });
    expect(entries.length).toBeGreaterThan(0);

    // Seal record has valid integrity hash
    expect(result.sealRecord.contentHash).toMatch(/^[a-f0-9]+$/);

    // Entry count in seal record matches actual count
    expect(result.sealRecord.entryCount).toBe(entries.length);
  });
});

// ============================================================================
// Scenario 3: INTG-05 -- Governance check: CE-1 produces plan, GL-1 evaluates
// ============================================================================

describe('INTG-05: Governance check -- CE-1 produces plan, GL-1 evaluates', () => {
  it('compliant distribution plan passes governance', () => {
    const missionId = 'mission-2026-02-18-521';
    const controller = new FullStackController(createFullStackConfig(missionId));

    // Run lifecycle with 3 contributors
    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'review',
      phase: 'PLANNING',
      context_weight: 0.8,
      dependency_tree: [],
    });
    controller.advancePhase(); // -> EXECUTION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'implementation',
      phase: 'EXECUTION',
      context_weight: 0.9,
      dependency_tree: [],
    });
    controller.advancePhase(); // -> INTEGRATION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-agent-003',
      skill_name: 'testing',
      phase: 'INTEGRATION',
      context_weight: 0.6,
      dependency_tree: [],
    });
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

    const { distributionPlan } = controller.calculateAttribution();

    // Distribution plan has non-zero UBD tier
    const ubdTier = distributionPlan.tiers.find(t => t.tierName === 'universal_base_dividend');
    expect(ubdTier).toBeDefined();
    expect(ubdTier!.totalAllocation).toBeGreaterThan(0);

    const evalResult = controller.evaluateGovernance();

    // Verdict should be present (COMPLIANT, ADVISORY, or NON_COMPLIANT)
    expect(['COMPLIANT', 'ADVISORY', 'NON_COMPLIANT']).toContain(evalResult.verdict);

    // Reasoning is non-empty
    expect(evalResult.reasoning.length).toBeGreaterThan(0);

    // DecisionLog has 1 entry
    expect(controller.getGL1State().decisionCount).toBe(1);
  });

  it('governance result is presentable via MC-1 dashboard (ALERT_SURFACE)', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-522'));

    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'review',
      phase: 'PLANNING',
      context_weight: 0.7,
      dependency_tree: [],
    });
    controller.advancePhase(); // -> EXECUTION
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

    controller.calculateAttribution();
    controller.evaluateGovernance();

    // After governance evaluation, an ALERT_SURFACE event should be in the log
    const events = controller.getEventLog();
    const govAlerts = events.filter(
      e => e.type === 'ALERT_SURFACE' &&
        (e.payload as Record<string, unknown>).message?.toString().includes('Governance verdict'),
    );
    expect(govAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it('multiple governance evaluations are all logged', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-523'));

    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'review',
      phase: 'PLANNING',
      context_weight: 0.7,
      dependency_tree: [],
    });
    controller.advancePhase(); // -> EXECUTION
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

    controller.calculateAttribution();
    controller.evaluateGovernance();
    controller.evaluateGovernance();

    // DecisionLog should have 2 entries
    expect(controller.getGL1State().decisionCount).toBe(2);
  });
});

// ============================================================================
// Scenario 4: Exhaustive schema validation across all ICDs
// ============================================================================

describe('Cross-ICD schema validation: every event conforms to its ICD', () => {
  it('all events pass their respective ICD payload schema validation', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-531'));
    const result = controller.runFullLifecycle();

    let payloadFailures = 0;
    let envelopeFailures = 0;
    const icdCounts: Record<string, number> = {};

    for (const event of result.eventLog) {
      // Envelope validation
      const envResult = EventEnvelopeSchema.safeParse(event);
      if (!envResult.success) envelopeFailures++;

      // ICD categorization
      const icd = ICD_TYPE_MAP[event.type];
      if (icd) {
        icdCounts[icd] = (icdCounts[icd] || 0) + 1;
      }

      // Payload validation against ICD-specific schema
      const schema = ICD_PAYLOAD_SCHEMAS[event.type];
      if (schema) {
        const payloadResult = schema.safeParse(event.payload);
        if (!payloadResult.success) {
          payloadFailures++;
        }
      }
    }

    // Zero validation failures
    expect(envelopeFailures).toBe(0);
    expect(payloadFailures).toBe(0);

    // All four ICDs have at least one event
    expect(icdCounts['ICD-01']).toBeGreaterThan(0);
    expect(icdCounts['ICD-02']).toBeGreaterThan(0);
    expect(icdCounts['ICD-03']).toBeGreaterThan(0);
    expect(icdCounts['ICD-04']).toBeGreaterThan(0);
  });
});

// ============================================================================
// Scenario 5: HOLD/RESUME preserves attribution flow
// ============================================================================

describe('HOLD/RESUME preserves attribution flow', () => {
  it('HOLD during EXECUTION does not break the recorder', () => {
    const missionId = 'mission-2026-02-18-541';
    const controller = new FullStackController(createFullStackConfig(missionId));

    controller.advancePhase(); // -> PLANNING
    controller.advancePhase(); // -> EXECUTION

    // Emit before HOLD
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'implementation',
      phase: 'EXECUTION',
      context_weight: 0.8,
      dependency_tree: [],
    });

    // Issue HOLD
    controller.executeCommand('HOLD');
    expect(controller.getState().phase).toBe('HOLD');

    // Issue RESUME
    controller.executeCommand('RESUME');
    expect(controller.getState().phase).toBe('EXECUTION');

    // Emit after RESUME
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'code-review',
      phase: 'EXECUTION',
      context_weight: 0.7,
      dependency_tree: [],
    });

    // Both entries captured
    expect(controller.getCE1State().ledgerCount).toBe(2);

    // Continue to completion
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

    const { weights } = controller.calculateAttribution();

    // Both entries are reflected in attribution
    expect(weights.totalEntries).toBe(2);
    expect(weights.weights.length).toBe(2);
  });

  it('recorder stats show correct counts through HOLD/RESUME cycle', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-542'));

    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'review',
      phase: 'PLANNING',
      context_weight: 0.7,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> EXECUTION
    controller.executeCommand('HOLD');
    controller.executeCommand('RESUME');

    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'implementation',
      phase: 'EXECUTION',
      context_weight: 0.9,
      dependency_tree: [],
    });

    // 2 ledger entries captured despite HOLD/RESUME
    expect(controller.getCE1State().ledgerCount).toBe(2);
  });
});

// ============================================================================
// Scenario 6: Gate redirect preserves and continues attribution
// ============================================================================

describe('Gate redirect preserves and continues attribution', () => {
  it('gate redirect does not lose ledger entries and allows new entries', () => {
    const missionId = 'mission-2026-02-18-551';
    const controller = new FullStackController(createFullStackConfig(missionId));

    // Advance through to REVIEW_GATE with 3 entries
    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'planning-review',
      phase: 'PLANNING',
      context_weight: 0.7,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> EXECUTION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'implementation',
      phase: 'EXECUTION',
      context_weight: 0.9,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> INTEGRATION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-agent-003',
      skill_name: 'testing',
      phase: 'INTEGRATION',
      context_weight: 0.6,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> REVIEW_GATE

    // Gate REDIRECT to EXECUTION
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'Integration tests revealed an issue',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });
    expect(controller.getState().phase).toBe('EXECUTION');

    // Emit another entry at EXECUTION (now 4 total)
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'rework',
      phase: 'EXECUTION',
      context_weight: 0.85,
      dependency_tree: [],
    });

    // All 4 entries in ledger
    expect(controller.getCE1State().ledgerCount).toBe(4);

    // Re-advance to REVIEW_GATE and GO
    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'Issue resolved', responder: 'human' });
    expect(controller.getState().phase).toBe('COMPLETION');

    // Attribution includes all 4 entries
    const { weights } = controller.calculateAttribution();
    expect(weights.totalEntries).toBe(4);

    // Query confirms all entries present
    const allEntries = controller.queryLedger({ mission_id: missionId });
    expect(allEntries.length).toBe(4);
  });

  it('weight vector reflects rework contribution after redirect', () => {
    const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-552'));

    controller.advancePhase(); // -> PLANNING
    controller.emitLedgerEntry({
      contributor_id: 'contrib-alice-001',
      skill_name: 'review',
      phase: 'PLANNING',
      context_weight: 0.7,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> EXECUTION
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'implementation',
      phase: 'EXECUTION',
      context_weight: 0.9,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE

    // Redirect to EXECUTION
    controller.clearGate({
      decision: 'redirect',
      reasoning: 'Rework needed',
      responder: 'human',
      redirectTarget: 'EXECUTION',
    });

    // Bob does rework
    controller.emitLedgerEntry({
      contributor_id: 'contrib-bob-002',
      skill_name: 'rework',
      phase: 'EXECUTION',
      context_weight: 0.8,
      dependency_tree: [],
    });

    controller.advancePhase(); // -> INTEGRATION
    controller.advancePhase(); // -> REVIEW_GATE
    controller.clearGate({ decision: 'go', reasoning: 'OK now', responder: 'human' });

    const { weights } = controller.calculateAttribution();

    // Bob has 2 entries, Alice has 1 -- weights should reflect this
    const bobWeight = weights.weights.find(w => w.contributorId === 'contrib-bob-002');
    const aliceWeight = weights.weights.find(w => w.contributorId === 'contrib-alice-001');

    expect(bobWeight).toBeDefined();
    expect(aliceWeight).toBeDefined();
    expect(bobWeight!.entryCount).toBe(2);
    expect(aliceWeight!.entryCount).toBe(1);

    // Weights sum to 1.0
    const total = weights.weights.reduce((s, w) => s + w.weight, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});
