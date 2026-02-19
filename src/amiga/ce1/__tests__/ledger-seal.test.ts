/**
 * Tests for the CE-1 ledger seal guard.
 *
 * Covers sealing, immutability enforcement, hash generation,
 * distribution plan freezing, and error cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerSealGuard } from '../ledger-seal.js';
import type { SealRecord, SealResult } from '../ledger-seal.js';
import { AttributionLedger } from '../attribution-ledger.js';
import { WeightingEngine } from '../weighting-engine.js';
import type { WeightVector } from '../weighting-engine.js';
import { DividendCalculator } from '../dividend-calculator.js';
import type { DistributionPlan } from '../dividend-calculator.js';

// ============================================================================
// Test Fixtures
// ============================================================================

let ledger: AttributionLedger;
let weightVector: WeightVector;
let distributionPlan: DistributionPlan;

beforeEach(() => {
  ledger = new AttributionLedger();
  // Add entries for 3 contributors
  ledger.append({
    mission_id: 'mission-2026-02-18-001',
    contributor_id: 'contrib-alice',
    agent_id: 'CE-1',
    skill_name: 'core-logic',
    phase: 'EXECUTION',
    timestamp: '2026-02-18T10:00:00Z',
    context_weight: 0.9,
    dependency_tree: [
      { contributor_id: 'contrib-bob01', depth: 0, decay_factor: 1.0 },
    ],
  });
  ledger.append({
    mission_id: 'mission-2026-02-18-001',
    contributor_id: 'contrib-bob01',
    agent_id: 'ME-1',
    skill_name: 'infra-setup',
    phase: 'PLANNING',
    timestamp: '2026-02-18T09:00:00Z',
    context_weight: 0.6,
    dependency_tree: [],
  });
  ledger.append({
    mission_id: 'mission-2026-02-18-001',
    contributor_id: 'contrib-carol',
    agent_id: 'GL-1',
    skill_name: 'review-check',
    phase: 'REVIEW_GATE',
    timestamp: '2026-02-18T11:00:00Z',
    context_weight: 0.7,
    dependency_tree: [],
  });

  const engine = new WeightingEngine();
  weightVector = engine.calculateWeights(ledger.getAll());

  const calculator = new DividendCalculator();
  distributionPlan = calculator.calculate(weightVector);
});

// ============================================================================
// Tests
// ============================================================================

describe('LedgerSealGuard', () => {
  // --------------------------------------------------------------------------
  // Seal operation tests
  // --------------------------------------------------------------------------

  describe('seal operation', () => {
    it('creates a guard in unsealed state', () => {
      const guard = new LedgerSealGuard(ledger);
      expect(guard.isSealed()).toBe(false);
    });

    it('isSealed returns false before sealing', () => {
      const guard = new LedgerSealGuard(ledger);
      expect(guard.isSealed()).toBe(false);
    });

    it('seal succeeds and returns a SealResult', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('sealRecord');
    });

    it('after seal, guard.isSealed() returns true', () => {
      const guard = new LedgerSealGuard(ledger);
      guard.seal(distributionPlan);
      expect(guard.isSealed()).toBe(true);
    });

    it('after seal, ledger.isSealed() is also true', () => {
      const guard = new LedgerSealGuard(ledger);
      guard.seal(distributionPlan);
      expect(ledger.isSealed()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Seal record tests
  // --------------------------------------------------------------------------

  describe('seal record', () => {
    it('SealRecord has missionId matching the mission', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.missionId).toBe('mission-2026-02-18-001');
    });

    it('SealRecord has sealedAt ISO 8601 timestamp', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.sealedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('SealRecord has entryCount matching ledger count', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.entryCount).toBe(3);
    });

    it('SealRecord has contentHash as non-empty hex string', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.contentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('SealRecord has distributionPlanHash as non-empty hex string', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.distributionPlanHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('SealRecord has sealedDistributionPlan', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.sealedDistributionPlan).toBeDefined();
      expect(result.sealRecord.sealedDistributionPlan.missionId).toBe(
        'mission-2026-02-18-001',
      );
    });
  });

  // --------------------------------------------------------------------------
  // Content hash tests
  // --------------------------------------------------------------------------

  describe('content hash', () => {
    it('content hash is deterministic for identical ledgers', () => {
      // Create two identical ledgers
      const ledger1 = new AttributionLedger();
      const ledger2 = new AttributionLedger();
      const payload = {
        mission_id: 'mission-2026-02-18-001' as const,
        contributor_id: 'contrib-alice',
        agent_id: 'CE-1' as const,
        skill_name: 'test',
        phase: 'EXECUTION' as const,
        timestamp: '2026-02-18T10:00:00Z',
        context_weight: 0.8,
        dependency_tree: [] as { contributor_id: string; depth: number; decay_factor: number }[],
      };
      ledger1.append(payload);
      ledger2.append(payload);

      const engine = new WeightingEngine();
      const wv1 = engine.calculateWeights(ledger1.getAll());
      const wv2 = engine.calculateWeights(ledger2.getAll());
      const calc = new DividendCalculator();
      const plan1 = calc.calculate(wv1);
      const plan2 = calc.calculate(wv2);

      const guard1 = new LedgerSealGuard(ledger1);
      const guard2 = new LedgerSealGuard(ledger2);
      const result1 = guard1.seal(plan1);
      const result2 = guard2.seal(plan2);

      expect(result1.sealRecord.contentHash).toBe(
        result2.sealRecord.contentHash,
      );
    });

    it('modifying a single entry produces a different hash', () => {
      const ledger1 = new AttributionLedger();
      const ledger2 = new AttributionLedger();

      ledger1.append({
        mission_id: 'mission-2026-02-18-001',
        contributor_id: 'contrib-alice',
        agent_id: 'CE-1',
        skill_name: 'test',
        phase: 'EXECUTION',
        timestamp: '2026-02-18T10:00:00Z',
        context_weight: 0.8,
        dependency_tree: [],
      });
      ledger2.append({
        mission_id: 'mission-2026-02-18-001',
        contributor_id: 'contrib-alice',
        agent_id: 'CE-1',
        skill_name: 'test',
        phase: 'EXECUTION',
        timestamp: '2026-02-18T10:00:00Z',
        context_weight: 0.5, // Different context_weight
        dependency_tree: [],
      });

      const engine = new WeightingEngine();
      const calc = new DividendCalculator();

      const guard1 = new LedgerSealGuard(ledger1);
      const guard2 = new LedgerSealGuard(ledger2);
      const result1 = guard1.seal(
        calc.calculate(engine.calculateWeights(ledger1.getAll())),
      );
      const result2 = guard2.seal(
        calc.calculate(engine.calculateWeights(ledger2.getAll())),
      );

      expect(result1.sealRecord.contentHash).not.toBe(
        result2.sealRecord.contentHash,
      );
    });

    it('content hash covers all entry fields', () => {
      // If we change any field, the hash should differ
      const ledger1 = new AttributionLedger();
      const ledger2 = new AttributionLedger();

      ledger1.append({
        mission_id: 'mission-2026-02-18-001',
        contributor_id: 'contrib-alice',
        agent_id: 'CE-1',
        skill_name: 'test',
        phase: 'EXECUTION',
        timestamp: '2026-02-18T10:00:00Z',
        context_weight: 0.8,
        dependency_tree: [],
      });
      ledger2.append({
        mission_id: 'mission-2026-02-18-001',
        contributor_id: 'contrib-alice',
        agent_id: 'CE-1',
        skill_name: 'different-skill', // Different skill_name
        phase: 'EXECUTION',
        timestamp: '2026-02-18T10:00:00Z',
        context_weight: 0.8,
        dependency_tree: [],
      });

      const engine = new WeightingEngine();
      const calc = new DividendCalculator();

      const guard1 = new LedgerSealGuard(ledger1);
      const guard2 = new LedgerSealGuard(ledger2);
      const result1 = guard1.seal(
        calc.calculate(engine.calculateWeights(ledger1.getAll())),
      );
      const result2 = guard2.seal(
        calc.calculate(engine.calculateWeights(ledger2.getAll())),
      );

      expect(result1.sealRecord.contentHash).not.toBe(
        result2.sealRecord.contentHash,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Distribution plan freezing tests
  // --------------------------------------------------------------------------

  describe('distribution plan freezing', () => {
    it('after seal, sealedDistributionPlan.sealed is true', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.sealRecord.sealedDistributionPlan.sealed).toBe(true);
    });

    it('after seal, distribution plan is deeply frozen', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(Object.isFrozen(result.sealRecord.sealedDistributionPlan)).toBe(
        true,
      );
      expect(
        Object.isFrozen(result.sealRecord.sealedDistributionPlan.tiers),
      ).toBe(true);
    });

    it('attempting to modify sealedDistributionPlan throws in strict mode', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(() => {
        (result.sealRecord.sealedDistributionPlan as any).missionId =
          'tampered';
      }).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Immutability enforcement tests (CMON-08)
  // --------------------------------------------------------------------------

  describe('immutability enforcement', () => {
    it('after seal, ledger.append throws', () => {
      const guard = new LedgerSealGuard(ledger);
      guard.seal(distributionPlan);
      expect(() =>
        ledger.append({
          mission_id: 'mission-2026-02-18-001',
          contributor_id: 'contrib-dave1',
          agent_id: 'CE-1',
          skill_name: 'new-skill',
          phase: 'EXECUTION',
          timestamp: '2026-02-18T12:00:00Z',
          context_weight: 0.5,
          dependency_tree: [],
        }),
      ).toThrow('Cannot append: ledger is sealed');
    });

    it('after seal, calling guard.seal again throws', () => {
      const guard = new LedgerSealGuard(ledger);
      guard.seal(distributionPlan);
      expect(() => guard.seal(distributionPlan)).toThrow(
        'Mission already sealed',
      );
    });

    it('after seal, ledger.getAll still works', () => {
      const guard = new LedgerSealGuard(ledger);
      guard.seal(distributionPlan);
      const entries = ledger.getAll();
      expect(entries).toHaveLength(3);
    });

    it('after seal, ledger.query still works', () => {
      const guard = new LedgerSealGuard(ledger);
      guard.seal(distributionPlan);
      const results = ledger.query({ contributor_id: 'contrib-alice' });
      expect(results).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Error handling tests
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('creating guard on already-sealed ledger throws', () => {
      ledger.seal();
      expect(() => new LedgerSealGuard(ledger)).toThrow(
        'Ledger is already sealed',
      );
    });

    it('sealing with mismatched missionId throws', () => {
      const guard = new LedgerSealGuard(ledger);
      // Create a plan with a different missionId
      const mismatchedPlan: DistributionPlan = {
        ...distributionPlan,
        missionId: 'mission-2026-02-18-999',
      };
      expect(() => guard.seal(mismatchedPlan)).toThrow(
        'Distribution plan mission ID does not match ledger entries',
      );
    });
  });

  // --------------------------------------------------------------------------
  // Edge case tests
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('sealing an empty ledger succeeds', () => {
      const emptyLedger = new AttributionLedger();
      const guard = new LedgerSealGuard(emptyLedger);
      const emptyWV = new WeightingEngine().calculateWeights([]);
      const emptyPlan = new DividendCalculator().calculate(emptyWV);
      const result = guard.seal(emptyPlan);
      expect(result.success).toBe(true);
      expect(result.sealRecord.entryCount).toBe(0);
      expect(result.sealRecord.contentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('SealResult has success: true on successful seal', () => {
      const guard = new LedgerSealGuard(ledger);
      const result = guard.seal(distributionPlan);
      expect(result.success).toBe(true);
    });
  });
});
