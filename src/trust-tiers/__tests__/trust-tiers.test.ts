/**
 * Four-tier Skill Trust Framework tests — Phase 711 (v1.49.570).
 *
 * Validates assignTier, canPromote, evaluateGate, auditCartridges, and
 * requiresHumanReviewOnPromote across the tier matrix.
 *
 * Covers: CONV-13, CONV-14.
 */

import { describe, it, expect } from 'vitest';
import {
  assignTier,
  canPromote,
  evaluateGate,
  requiresHumanReviewOnPromote,
  auditCartridges,
  TIER_RANK,
  JIANG_2026_VULNERABILITY_BASELINE,
} from '../index.js';
import type { TrustSignals, CartridgeTrustRecord } from '../index.js';

function baseSignals(overrides: Partial<TrustSignals> = {}): TrustSignals {
  return {
    provenance: 'first-party',
    audited: true,
    signatureVerified: true,
    sourceCorpus: 'library',
    correctionHistory: 0,
    ageDays: 30,
    vulnerabilityReports: 0,
    ...overrides,
  };
}

describe('trust-tiers: TIER_RANK + baseline constants', () => {
  it('TIER_RANK orders T1 < T2 < T3 < T4', () => {
    expect(TIER_RANK.T1).toBeLessThan(TIER_RANK.T2);
    expect(TIER_RANK.T2).toBeLessThan(TIER_RANK.T3);
    expect(TIER_RANK.T3).toBeLessThan(TIER_RANK.T4);
  });

  it('JIANG_2026_VULNERABILITY_BASELINE is 26.1', () => {
    expect(JIANG_2026_VULNERABILITY_BASELINE).toBe(26.1);
  });
});

describe('trust-tiers: assignTier base rules', () => {
  it('first-party + audited → T1', () => {
    const r = assignTier(baseSignals({ audited: true, provenance: 'first-party' }));
    expect(r.tier).toBe('T1');
    expect(r.rationale.some((s) => s.includes('T1'))).toBe(true);
  });

  it('first-party + unaudited → T2', () => {
    const r = assignTier(baseSignals({ audited: false, provenance: 'first-party' }));
    expect(r.tier).toBe('T2');
  });

  it('third-party + audited + signatureVerified → T3', () => {
    const r = assignTier(baseSignals({
      provenance: 'third-party',
      audited: true,
      signatureVerified: true,
    }));
    expect(r.tier).toBe('T3');
  });

  it('third-party + audited + !signatureVerified → T4', () => {
    const r = assignTier(baseSignals({
      provenance: 'third-party',
      audited: true,
      signatureVerified: false,
    }));
    expect(r.tier).toBe('T4');
  });

  it('third-party + !audited → T4', () => {
    const r = assignTier(baseSignals({ provenance: 'third-party', audited: false }));
    expect(r.tier).toBe('T4');
  });

  it('unknown provenance → T4 regardless of other signals', () => {
    const r = assignTier(baseSignals({
      provenance: 'unknown',
      audited: true,
      signatureVerified: true,
    }));
    expect(r.tier).toBe('T4');
  });
});

describe('trust-tiers: assignTier vulnerability demotion', () => {
  it('vulnerabilityReports > 0 demotes T1 → T2', () => {
    const r = assignTier(baseSignals({ vulnerabilityReports: 2 }));
    expect(r.tier).toBe('T2');
    expect(r.demoted).toBe(true);
  });

  it('vulnerabilityReports > 0 demotes T3 → T4', () => {
    const r = assignTier(baseSignals({
      provenance: 'third-party',
      audited: true,
      signatureVerified: true,
      vulnerabilityReports: 1,
    }));
    expect(r.tier).toBe('T4');
    expect(r.demoted).toBe(true);
  });

  it('vulnerabilityReports > 0 cannot demote below T4', () => {
    const r = assignTier(baseSignals({
      provenance: 'unknown',
      vulnerabilityReports: 5,
    }));
    expect(r.tier).toBe('T4');
    expect(r.demoted).toBe(false); // already at floor, no demotion happened
  });
});

describe('trust-tiers: assignTier usage promotion', () => {
  it('correctionHistory >= 3 + ageDays >= 7 promotes T2 → T1', () => {
    const r = assignTier(baseSignals({
      audited: false,
      correctionHistory: 5,
      ageDays: 30,
    }));
    expect(r.tier).toBe('T1');
    expect(r.promoted).toBe(true);
  });

  it('correctionHistory >= 3 but ageDays < 7 does not promote (age gate)', () => {
    const r = assignTier(baseSignals({
      audited: false,
      correctionHistory: 5,
      ageDays: 3,
    }));
    expect(r.tier).toBe('T2');
    expect(r.promoted).toBe(false);
  });

  it('correctionHistory < 3 does not promote even with high age', () => {
    const r = assignTier(baseSignals({
      audited: false,
      correctionHistory: 2,
      ageDays: 365,
    }));
    expect(r.tier).toBe('T2');
    expect(r.promoted).toBe(false);
  });

  it('demotion prevents promotion (demotion takes precedence)', () => {
    const r = assignTier(baseSignals({
      audited: false,
      correctionHistory: 5,
      ageDays: 30,
      vulnerabilityReports: 1,
    }));
    // Starts at T2 (first-party, unaudited); vuln demotes to T3; promotion is suppressed
    expect(r.tier).toBe('T3');
    expect(r.demoted).toBe(true);
    expect(r.promoted).toBe(false);
  });
});

describe('trust-tiers: canPromote', () => {
  it('T4 → T3 requires audit + signature', () => {
    const allowed = canPromote('T4', 'T3', baseSignals({
      provenance: 'third-party',
      audited: true,
      signatureVerified: true,
    }));
    expect(allowed.allowed).toBe(true);

    const blocked = canPromote('T4', 'T3', baseSignals({
      provenance: 'third-party',
      audited: false,
      signatureVerified: false,
    }));
    expect(blocked.allowed).toBe(false);
    expect(blocked.requirementsUnmet).toContain('audited=true');
    expect(blocked.requirementsUnmet).toContain('signatureVerified=true');
  });

  it('T3 → T2 requires first-party provenance', () => {
    const blocked = canPromote('T3', 'T2', baseSignals({ provenance: 'third-party' }));
    expect(blocked.allowed).toBe(false);

    const allowed = canPromote('T3', 'T2', baseSignals({ provenance: 'first-party' }));
    expect(allowed.allowed).toBe(true);
  });

  it('T2 → T1 requires audited=true', () => {
    const blocked = canPromote('T2', 'T1', baseSignals({ audited: false }));
    expect(blocked.allowed).toBe(false);
    expect(blocked.requirementsUnmet).toContain('audited=true');

    const allowed = canPromote('T2', 'T1', baseSignals({ audited: true }));
    expect(allowed.allowed).toBe(true);
  });

  it('skip-tier promotion is forbidden (T4 → T2)', () => {
    const r = canPromote('T4', 'T2', baseSignals({ provenance: 'first-party' }));
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('skip-tier');
  });

  it('promoting to a lower-trust tier (higher rank) is forbidden', () => {
    const r = canPromote('T2', 'T3', baseSignals());
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('lower-trust tier');
  });

  it('from===to is a no-op and returns allowed=false', () => {
    const r = canPromote('T2', 'T2', baseSignals());
    expect(r.allowed).toBe(false);
  });
});

describe('trust-tiers: evaluateGate action matrix', () => {
  it('T1 permits all actions without sandbox', () => {
    for (const action of ['load', 'execute', 'modify', 'share'] as const) {
      const d = evaluateGate('T1', action);
      expect(d.allowed).toBe(true);
      expect(d.requiresSandbox).toBe(false);
    }
  });

  it('T2 permits load/execute, sandboxes share, blocks modify', () => {
    expect(evaluateGate('T2', 'load').allowed).toBe(true);
    expect(evaluateGate('T2', 'execute').allowed).toBe(true);
    expect(evaluateGate('T2', 'modify').allowed).toBe(false);
    const share = evaluateGate('T2', 'share');
    expect(share.allowed).toBe(true);
    expect(share.requiresSandbox).toBe(true);
  });

  it('T3 permits load/execute/share, blocks modify', () => {
    expect(evaluateGate('T3', 'load').allowed).toBe(true);
    expect(evaluateGate('T3', 'execute').allowed).toBe(true);
    expect(evaluateGate('T3', 'modify').allowed).toBe(false);
    expect(evaluateGate('T3', 'share').allowed).toBe(true);
  });

  it('T4 sandboxes load/execute, blocks modify/share', () => {
    const load = evaluateGate('T4', 'load');
    expect(load.allowed).toBe(true);
    expect(load.requiresSandbox).toBe(true);
    const execute = evaluateGate('T4', 'execute');
    expect(execute.allowed).toBe(true);
    expect(execute.requiresSandbox).toBe(true);
    expect(evaluateGate('T4', 'modify').allowed).toBe(false);
    expect(evaluateGate('T4', 'share').allowed).toBe(false);
  });
});

describe('trust-tiers: requiresHumanReviewOnPromote', () => {
  it('returns true for any promotion into T1', () => {
    expect(requiresHumanReviewOnPromote('T2', 'T1')).toBe(true);
  });

  it('returns true for T3 → T2 and T4 → T2 (third-party crossing to first-party)', () => {
    expect(requiresHumanReviewOnPromote('T3', 'T2')).toBe(true);
    expect(requiresHumanReviewOnPromote('T4', 'T2')).toBe(true);
  });

  it('returns false for T4 → T3 (intra-third-party promotion)', () => {
    expect(requiresHumanReviewOnPromote('T4', 'T3')).toBe(false);
  });

  it('returns false for non-promotions (same tier or demotion)', () => {
    expect(requiresHumanReviewOnPromote('T2', 'T2')).toBe(false);
    expect(requiresHumanReviewOnPromote('T1', 'T2')).toBe(false);
  });
});

describe('trust-tiers: auditCartridges', () => {
  it('returns zeros for empty cartridge list', () => {
    const report = auditCartridges([]);
    expect(report.totalCartridges).toBe(0);
    expect(report.byTier.T1).toBe(0);
    expect(report.byTier.T4).toBe(0);
    expect(report.t4Cartridges).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it('counts cartridges by tier', () => {
    const cartridges: CartridgeTrustRecord[] = [
      { cartridgeId: 'a', tier: 'T1', signals: baseSignals() },
      { cartridgeId: 'b', tier: 'T2', signals: baseSignals({ audited: false }) },
      { cartridgeId: 'c', tier: 'T4', signals: baseSignals({ provenance: 'unknown' }) },
      { cartridgeId: 'd', tier: 'T4', signals: baseSignals({ provenance: 'unknown' }) },
    ];
    const report = auditCartridges(cartridges);
    expect(report.totalCartridges).toBe(4);
    expect(report.byTier.T1).toBe(1);
    expect(report.byTier.T2).toBe(1);
    expect(report.byTier.T4).toBe(2);
    expect(report.t4Cartridges).toEqual(['c', 'd']);
  });

  it('warns when T4 fraction >= 50%', () => {
    const cartridges: CartridgeTrustRecord[] = [
      { cartridgeId: 'a', tier: 'T4', signals: baseSignals({ provenance: 'unknown' }) },
      { cartridgeId: 'b', tier: 'T4', signals: baseSignals({ provenance: 'unknown' }) },
      { cartridgeId: 'c', tier: 'T1', signals: baseSignals() },
    ];
    const report = auditCartridges(cartridges);
    const t4Warning = report.warnings.find((w) => w.includes('T4'));
    expect(t4Warning).toBeTruthy();
  });

  it('warns when vulnerability fraction exceeds Jiang 2026 baseline of 26.1%', () => {
    const cartridges: CartridgeTrustRecord[] = [
      { cartridgeId: 'a', tier: 'T1', signals: baseSignals({ vulnerabilityReports: 1 }) },
      { cartridgeId: 'b', tier: 'T1', signals: baseSignals({ vulnerabilityReports: 1 }) },
      { cartridgeId: 'c', tier: 'T1', signals: baseSignals() },
    ];
    // 2/3 = 66.7% > 26.1%
    const report = auditCartridges(cartridges);
    const vulnWarning = report.warnings.find((w) => w.includes('Jiang 2026 baseline'));
    expect(vulnWarning).toBeTruthy();
  });

  it('healthScore = 1 for all-T1 + audited + no-vuln fleet', () => {
    const cartridges: CartridgeTrustRecord[] = [
      { cartridgeId: 'a', tier: 'T1', signals: baseSignals() },
      { cartridgeId: 'b', tier: 'T1', signals: baseSignals() },
    ];
    const report = auditCartridges(cartridges);
    expect(report.healthScore).toBeCloseTo(1, 3);
  });

  it('healthScore < 1 when any vuln/unaudited/T4 is present', () => {
    const cartridges: CartridgeTrustRecord[] = [
      { cartridgeId: 'a', tier: 'T4', signals: baseSignals({ provenance: 'unknown', audited: false }) },
    ];
    const report = auditCartridges(cartridges);
    expect(report.healthScore).toBeLessThan(1);
  });
});
