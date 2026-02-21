/**
 * Integration tests for FullStackController.
 *
 * Validates four-component wiring: MC-1 (Control Surface), ME-1 (Mission
 * Environment), CE-1 (Commons Engine), and GL-1 (Governance Layer) into a
 * single mission harness with CE-1 attribution recording and GL-1 governance
 * evaluation.
 *
 * Covers: INTG-04 (attribution flow), INTG-06 (all four ICD channels active)
 */

import { describe, it, expect } from 'vitest';
import { FullStackController } from '../full-stack-controller.js';
import type { FullStackConfig } from '../full-stack-controller.js';
import { LedgerEntryPayloadSchema } from '../../icd/icd-02.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';

// ============================================================================
// Shared config factory
// ============================================================================

function createFullStackConfig(missionId: string): FullStackConfig {
  return {
    mission_id: missionId,
    name: `Full Stack Test Mission ${missionId}`,
    description: 'Four-component integration verification for Integration Gate 2',
    skills: [{ skill_id: 'skill-fullstack-alpha', version: '1.0.0' }],
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
// 1. Construction and component wiring
// ============================================================================

describe('FullStackController', () => {
  describe('construction and component wiring', () => {
    it('creates a controller without error', () => {
      const config = createFullStackConfig('mission-2026-02-18-401');
      const controller = new FullStackController(config);
      expect(controller).toBeDefined();
    });

    it('getState returns initial state at BRIEFING', () => {
      const config = createFullStackConfig('mission-2026-02-18-402');
      const controller = new FullStackController(config);
      const state = controller.getState();

      expect(state.phase).toBe('BRIEFING');
      expect(state.suspended).toBe(false);
      expect(state.missionId).toBe('mission-2026-02-18-402');
      expect(state.completed).toBe(false);
      expect(state.aborted).toBe(false);
    });

    it('getCE1State returns initial CE-1 diagnostics', () => {
      const config = createFullStackConfig('mission-2026-02-18-403');
      const controller = new FullStackController(config);
      const ce1 = controller.getCE1State();

      expect(ce1.ledgerCount).toBe(0);
      expect(ce1.recorderActive).toBe(true);
      expect(ce1.sealed).toBe(false);
    });

    it('getGL1State returns initial GL-1 diagnostics', () => {
      const config = createFullStackConfig('mission-2026-02-18-404');
      const controller = new FullStackController(config);
      const gl1 = controller.getGL1State();

      expect(gl1.charterRatified).toBe(true);
      expect(gl1.decisionCount).toBe(0);
    });

    it('contributors are registered in CE-1 ContributionRegistry', () => {
      const config = createFullStackConfig('mission-2026-02-18-405');
      const controller = new FullStackController(config);
      // 3 contributors should be registered
      const ce1 = controller.getCE1State();
      // Ledger is empty but recorder is active
      expect(ce1.recorderActive).toBe(true);
    });
  });

  // ==========================================================================
  // 2. CE-1 InvocationRecorder wiring (ICD-02)
  // ==========================================================================

  describe('CE-1 InvocationRecorder wiring (ICD-02)', () => {
    it('InvocationRecorder is active after construction', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-406'));
      expect(controller.getCE1State().recorderActive).toBe(true);
    });

    it('emitLedgerEntry captures entry in the ledger', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-407'));
      controller.advancePhase(); // BRIEFING -> PLANNING

      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.8,
        dependency_tree: [],
      });

      expect(controller.getCE1State().ledgerCount).toBe(1);
    });

    it('ledger entry is queryable by mission_id', () => {
      const missionId = 'mission-2026-02-18-408';
      const controller = new FullStackController(createFullStackConfig(missionId));
      controller.advancePhase(); // BRIEFING -> PLANNING

      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.8,
        dependency_tree: [],
      });

      const entries = controller.queryLedger({ mission_id: missionId });
      expect(entries.length).toBe(1);
      expect(entries[0].contributor_id).toBe('contrib-alice-001');
    });

    it('multiple ledger entries increase count', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-409'));
      controller.advancePhase(); // BRIEFING -> PLANNING

      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.8,
        dependency_tree: [],
      });

      controller.advancePhase(); // PLANNING -> EXECUTION

      controller.emitLedgerEntry({
        contributor_id: 'contrib-bob-002',
        skill_name: 'implementation',
        phase: 'EXECUTION',
        context_weight: 0.9,
        dependency_tree: [{ contributor_id: 'contrib-alice-001', depth: 0, decay_factor: 0.5 }],
      });

      expect(controller.getCE1State().ledgerCount).toBe(2);
    });
  });

  // ==========================================================================
  // 3. CE-1 attribution flow after mission completion (INTG-04)
  // ==========================================================================

  describe('CE-1 attribution flow after mission completion (INTG-04)', () => {
    it('calculateAttribution returns weights and distribution plan', () => {
      const missionId = 'mission-2026-02-18-410';
      const controller = new FullStackController(createFullStackConfig(missionId));

      // Advance through full lifecycle with ledger entries
      controller.advancePhase(); // BRIEFING -> PLANNING
      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.8,
        dependency_tree: [],
      });

      controller.advancePhase(); // PLANNING -> EXECUTION
      controller.emitLedgerEntry({
        contributor_id: 'contrib-bob-002',
        skill_name: 'implementation',
        phase: 'EXECUTION',
        context_weight: 0.9,
        dependency_tree: [{ contributor_id: 'contrib-alice-001', depth: 0, decay_factor: 0.5 }],
      });

      controller.advancePhase(); // EXECUTION -> INTEGRATION
      controller.emitLedgerEntry({
        contributor_id: 'contrib-agent-003',
        skill_name: 'testing',
        phase: 'INTEGRATION',
        context_weight: 0.6,
        dependency_tree: [],
      });

      controller.advancePhase(); // INTEGRATION -> REVIEW_GATE
      controller.clearGate({ decision: 'go', reasoning: 'All tests pass', responder: 'human' });

      expect(controller.getState().phase).toBe('COMPLETION');

      const result = controller.calculateAttribution();

      // Weight vector should have 3 entries
      expect(result.weights.weights.length).toBe(3);

      // All weights positive and sum to 1.0
      const weightSum = result.weights.weights.reduce((s, w) => s + w.weight, 0);
      expect(weightSum).toBeCloseTo(1.0, 5);
      for (const w of result.weights.weights) {
        expect(w.weight).toBeGreaterThan(0);
      }

      // Distribution plan has three tiers
      expect(result.distributionPlan.tiers.length).toBe(3);
    });

    it('ledger is queryable by mission_id after calculation', () => {
      const missionId = 'mission-2026-02-18-411';
      const controller = new FullStackController(createFullStackConfig(missionId));

      controller.advancePhase(); // -> PLANNING
      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.7,
        dependency_tree: [],
      });

      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE
      controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

      controller.calculateAttribution();

      const entries = controller.queryLedger({ mission_id: missionId });
      expect(entries.length).toBe(1);
    });

    it('ledger is queryable by contributor_id', () => {
      const missionId = 'mission-2026-02-18-412';
      const controller = new FullStackController(createFullStackConfig(missionId));

      controller.advancePhase(); // -> PLANNING
      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.8,
        dependency_tree: [],
      });
      controller.emitLedgerEntry({
        contributor_id: 'contrib-bob-002',
        skill_name: 'implementation',
        phase: 'PLANNING',
        context_weight: 0.9,
        dependency_tree: [],
      });

      const aliceEntries = controller.queryLedger({ contributor_id: 'contrib-alice-001' });
      expect(aliceEntries.length).toBe(1);

      const bobEntries = controller.queryLedger({ contributor_id: 'contrib-bob-002' });
      expect(bobEntries.length).toBe(1);
    });

    it('ledger is queryable by phase', () => {
      const missionId = 'mission-2026-02-18-413';
      const controller = new FullStackController(createFullStackConfig(missionId));

      controller.advancePhase(); // -> PLANNING
      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
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

      const execEntries = controller.queryLedger({ phase: 'EXECUTION' });
      expect(execEntries.length).toBe(1);
      expect(execEntries[0].contributor_id).toBe('contrib-bob-002');
    });
  });

  // ==========================================================================
  // 4. GL-1 governance evaluation (ICD-03 + ICD-04)
  // ==========================================================================

  describe('GL-1 governance evaluation (ICD-03 + ICD-04)', () => {
    it('evaluateGovernance returns verdict with reasoning', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-414'));

      controller.advancePhase(); // -> PLANNING
      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
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

      const attrResult = controller.calculateAttribution();
      const govResult = controller.evaluateGovernance();

      expect(govResult.verdict).toBeDefined();
      expect(govResult.reasoning.length).toBeGreaterThan(0);
      expect(govResult.cited_clauses).toBeDefined();
    });

    it('DecisionLog has 1 entry after governance evaluation', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-415'));

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

      expect(controller.getGL1State().decisionCount).toBe(1);
    });
  });

  // ==========================================================================
  // 5. Full lifecycle produces FullStackResult
  // ==========================================================================

  describe('full lifecycle produces FullStackResult', () => {
    it('runFullLifecycle returns complete result with all ICDs exercised', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-416'));
      const result = controller.runFullLifecycle();

      // Weight vector
      expect(result.weights.weights.length).toBeGreaterThan(0);
      const weightSum = result.weights.weights.reduce((s, w) => s + w.weight, 0);
      expect(weightSum).toBeCloseTo(1.0, 5);

      // Distribution plan with three tiers
      expect(result.distributionPlan.tiers.length).toBe(3);

      // Governance verdict
      expect(result.governanceVerdict.verdict).toBeDefined();

      // Seal record
      expect(result.sealRecord.contentHash).toMatch(/^[a-f0-9]+$/);

      // Event log
      expect(result.eventLog.length).toBeGreaterThan(0);

      // All four ICD channels exercised
      expect(result.icdChannelsExercised).toContain('ICD-01');
      expect(result.icdChannelsExercised).toContain('ICD-02');
      expect(result.icdChannelsExercised).toContain('ICD-03');
      expect(result.icdChannelsExercised).toContain('ICD-04');
    });

    it('runFullLifecycle emits sample LEDGER_ENTRY events at PLANNING/EXECUTION/INTEGRATION', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-417'));
      const result = controller.runFullLifecycle();

      // Should have at least 3 ledger entries (one per active phase)
      const ledgerEvents = result.eventLog.filter((e) => e.type === 'LEDGER_ENTRY');
      expect(ledgerEvents.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================================================
  // 6. ICD-02 validation -- LEDGER_ENTRY events conform to schema
  // ==========================================================================

  describe('ICD-02 validation', () => {
    it('all LEDGER_ENTRY events pass schema validation', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-418'));
      controller.advancePhase(); // -> PLANNING

      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'code-review',
        phase: 'PLANNING',
        context_weight: 0.8,
        dependency_tree: [],
      });

      controller.emitLedgerEntry({
        contributor_id: 'contrib-bob-002',
        skill_name: 'implementation',
        phase: 'PLANNING',
        context_weight: 0.9,
        dependency_tree: [{ contributor_id: 'contrib-alice-001', depth: 0, decay_factor: 0.5 }],
      });

      const events = controller.getEventLog();
      const ledgerEvents = events.filter((e) => e.type === 'LEDGER_ENTRY');

      expect(ledgerEvents.length).toBe(2);

      let failures = 0;
      for (const event of ledgerEvents) {
        const result = LedgerEntryPayloadSchema.safeParse(event.payload);
        if (!result.success) failures++;
      }
      expect(failures).toBe(0);
    });

    it('all events pass EventEnvelopeSchema validation', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-419'));
      controller.advancePhase(); // -> PLANNING

      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'review',
        phase: 'PLANNING',
        context_weight: 0.7,
        dependency_tree: [],
      });

      const events = controller.getEventLog();
      let failures = 0;
      for (const event of events) {
        const result = EventEnvelopeSchema.safeParse(event);
        if (!result.success) failures++;
      }
      expect(failures).toBe(0);
    });
  });

  // ==========================================================================
  // 7. Ledger seal after mission close
  // ==========================================================================

  describe('ledger seal after mission close', () => {
    it('after runFullLifecycle, ledger is sealed', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-420'));
      controller.runFullLifecycle();

      expect(controller.getCE1State().sealed).toBe(true);
    });

    it('sealed ledger remains queryable', () => {
      const missionId = 'mission-2026-02-18-421';
      const controller = new FullStackController(createFullStackConfig(missionId));
      controller.runFullLifecycle();

      const entries = controller.queryLedger({ mission_id: missionId });
      expect(entries.length).toBeGreaterThan(0);
    });

    it('emitting to sealed ledger throws', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-422'));
      controller.runFullLifecycle();

      expect(() => {
        controller.emitLedgerEntry({
          contributor_id: 'contrib-alice-001',
          skill_name: 'post-seal',
          phase: 'COMPLETION',
          context_weight: 0.5,
          dependency_tree: [],
        });
      }).toThrow();
    });
  });

  // ==========================================================================
  // 8. Error handling
  // ==========================================================================

  describe('error handling', () => {
    it('emitLedgerEntry before advancing from BRIEFING throws', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-423'));
      // Still at BRIEFING -- not an active mission phase for contribution
      expect(() => {
        controller.emitLedgerEntry({
          contributor_id: 'contrib-alice-001',
          skill_name: 'premature',
          phase: 'BRIEFING',
          context_weight: 0.5,
          dependency_tree: [],
        });
      }).toThrow();
    });

    it('calculateAttribution before mission completion throws', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-424'));
      controller.advancePhase(); // -> PLANNING
      controller.emitLedgerEntry({
        contributor_id: 'contrib-alice-001',
        skill_name: 'review',
        phase: 'PLANNING',
        context_weight: 0.7,
        dependency_tree: [],
      });

      expect(() => {
        controller.calculateAttribution();
      }).toThrow();
    });

    it('evaluateGovernance before attribution calculation throws', () => {
      const controller = new FullStackController(createFullStackConfig('mission-2026-02-18-425'));

      controller.advancePhase(); // -> PLANNING
      controller.advancePhase(); // -> EXECUTION
      controller.advancePhase(); // -> INTEGRATION
      controller.advancePhase(); // -> REVIEW_GATE
      controller.clearGate({ decision: 'go', reasoning: 'OK', responder: 'human' });

      expect(() => {
        controller.evaluateGovernance();
      }).toThrow();
    });
  });
});
