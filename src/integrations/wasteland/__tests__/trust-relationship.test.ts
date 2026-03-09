import { describe, it, expect } from 'vitest';
import {
  computeVector,
  classifyVector,
  describeVector,
  createContract,
  isContractActive,
  contractTimeRemaining,
  createRelationship,
  computeHarmony,
  getActiveRelationships,
  getRelationshipsForRig,
  aggregateTrustStrength,
  createCharacterSheet,
  getPublicProfile,
  formatRelationship,
} from '../trust-relationship.js';

// ============================================================================
// Trust Vector
// ============================================================================

describe('computeVector', () => {
  it('computes history-anchored vector (high time, low depth)', () => {
    const v = computeVector(0.8, 0.2);
    expect(v.sharedTime).toBe(0.8);
    expect(v.sharedDepth).toBe(0.2);
    expect(v.magnitude).toBeCloseTo(0.825, 2);
    // θ ≈ 14° — mostly shared time
    expect(v.theta * (180 / Math.PI)).toBeLessThan(22.5);
  });

  it('computes depth-forged vector (low time, high depth)', () => {
    const v = computeVector(0.1, 0.9);
    expect(v.magnitude).toBeCloseTo(0.906, 2);
    // θ ≈ 84° — mostly shared depth
    expect(v.theta * (180 / Math.PI)).toBeGreaterThan(67.5);
  });

  it('computes balanced vector (equal time and depth)', () => {
    const v = computeVector(0.6, 0.6);
    // θ = 45° exactly
    expect(v.theta * (180 / Math.PI)).toBeCloseTo(45, 5);
  });

  it('caps magnitude at 1.0 on the unit circle boundary', () => {
    const v = computeVector(1.0, 1.0);
    // √2 ≈ 1.414 but capped to 1.0
    expect(v.magnitude).toBe(1.0);
    expect(v.theta * (180 / Math.PI)).toBeCloseTo(45, 5);
  });

  it('returns zero vector for no connection', () => {
    const v = computeVector(0, 0);
    expect(v.magnitude).toBe(0);
    expect(v.theta).toBe(0);
  });

  it('clamps negative inputs to zero', () => {
    const v = computeVector(-0.5, -0.3);
    expect(v.sharedTime).toBe(0);
    expect(v.sharedDepth).toBe(0);
    expect(v.magnitude).toBe(0);
  });

  it('clamps inputs above 1.0', () => {
    const v = computeVector(2.0, 1.5);
    expect(v.sharedTime).toBe(1);
    expect(v.sharedDepth).toBe(1);
    expect(v.magnitude).toBe(1.0);
  });

  it('light ephemeral touch has low magnitude', () => {
    const v = computeVector(0.05, 0.2);
    expect(v.magnitude).toBeCloseTo(0.206, 2);
    expect(v.magnitude).toBeLessThan(0.25);
  });
});

describe('classifyVector', () => {
  it('classifies zero magnitude as unconnected', () => {
    expect(classifyVector(computeVector(0, 0))).toBe('unconnected');
    expect(classifyVector(computeVector(0.02, 0.02))).toBe('unconnected');
  });

  it('classifies high-time low-depth as history-anchored', () => {
    expect(classifyVector(computeVector(0.9, 0.1))).toBe('history-anchored');
  });

  it('classifies low-time high-depth as depth-forged', () => {
    expect(classifyVector(computeVector(0.1, 0.9))).toBe('depth-forged');
  });

  it('classifies equal time and depth as balanced', () => {
    expect(classifyVector(computeVector(0.5, 0.5))).toBe('balanced');
  });

  it('classifies intermediate as time-leading or depth-leading', () => {
    expect(classifyVector(computeVector(0.7, 0.4))).toBe('time-leading');
    expect(classifyVector(computeVector(0.3, 0.7))).toBe('depth-leading');
  });
});

describe('describeVector', () => {
  it('produces readable description', () => {
    const v = computeVector(0.8, 0.3);
    const desc = describeVector(v);
    expect(desc).toContain('history-anchored');
    expect(desc).toContain('r=');
    expect(desc).toContain('θ=');
    expect(desc).toContain('°');
  });
});

// ============================================================================
// Trust Contract
// ============================================================================

describe('createContract', () => {
  const now = new Date('2026-08-25T12:00:00Z'); // burn week

  it('creates permanent contract with no expiry', () => {
    const c = createContract('permanent', undefined, now);
    expect(c.type).toBe('permanent');
    expect(c.ttl).toBeNull();
    expect(c.expiresAt).toBeNull();
    expect(c.id).toMatch(/^tc-pm-/);
  });

  it('creates ephemeral contract with default 1-hour TTL', () => {
    const c = createContract('ephemeral', undefined, now);
    expect(c.type).toBe('ephemeral');
    expect(c.ttl).toBe(3600);
    expect(c.expiresAt).toBe('2026-08-25T13:00:00.000Z');
    expect(c.id).toMatch(/^tc-ep-/);
  });

  it('creates event-scoped contract with default 7-day TTL', () => {
    const c = createContract('event-scoped', undefined, now);
    expect(c.ttl).toBe(7 * 24 * 60 * 60);
    expect(c.id).toMatch(/^tc-ev-/);
  });

  it('allows custom TTL override', () => {
    const c = createContract('ephemeral', 900, now); // 15 minutes
    expect(c.ttl).toBe(900);
    expect(c.expiresAt).toBe('2026-08-25T12:15:00.000Z');
  });

  it('allows explicit null TTL to make any type permanent', () => {
    const c = createContract('event-scoped', null, now);
    expect(c.ttl).toBeNull();
    expect(c.expiresAt).toBeNull();
  });
});

describe('isContractActive', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('permanent contracts are always active', () => {
    const c = createContract('permanent', undefined, now);
    expect(isContractActive(c, new Date('2099-01-01'))).toBe(true);
  });

  it('expired contracts are not active', () => {
    const c = createContract('ephemeral', 3600, now);
    expect(isContractActive(c, new Date('2026-08-25T13:30:00Z'))).toBe(false);
  });

  it('active contracts within TTL', () => {
    const c = createContract('ephemeral', 3600, now);
    expect(isContractActive(c, new Date('2026-08-25T12:30:00Z'))).toBe(true);
  });
});

describe('contractTimeRemaining', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('returns Infinity for permanent contracts', () => {
    const c = createContract('permanent', undefined, now);
    expect(contractTimeRemaining(c)).toBe(Infinity);
  });

  it('returns remaining seconds for active contracts', () => {
    const c = createContract('ephemeral', 3600, now);
    const remaining = contractTimeRemaining(c, new Date('2026-08-25T12:30:00Z'));
    expect(remaining).toBeCloseTo(1800, 0);
  });

  it('returns 0 for expired contracts', () => {
    const c = createContract('ephemeral', 3600, now);
    expect(contractTimeRemaining(c, new Date('2026-08-25T14:00:00Z'))).toBe(0);
  });
});

// ============================================================================
// Trust Relationship
// ============================================================================

describe('createRelationship', () => {
  it('creates a relationship between two rigs', () => {
    const rel = createRelationship(
      'fox-042', 'cedar-011',
      'permanent',
      0.9, 0.95,  // fox sees high time + high depth
      0.9, 0.95,  // cedar sees the same (family)
      { fromLabel: 'family', toLabel: 'family' },
    );

    expect(rel.from).toBe('fox-042');
    expect(rel.to).toBe('cedar-011');
    expect(rel.fromVector.magnitude).toBeCloseTo(1.0, 1);
    expect(rel.toVector.magnitude).toBeCloseTo(1.0, 1);
    expect(rel.contract.type).toBe('permanent');
    expect(rel.fromLabel).toBe('family');
    expect(rel.toLabel).toBe('family');
    expect(rel.visibility).toBe('private');
  });

  it('supports asymmetric trust (different vectors per side)', () => {
    const rel = createRelationship(
      'raven-003', 'salmon-019',
      'event-scoped',
      0.1, 0.8,  // raven feels deeply connected quickly
      0.1, 0.3,  // salmon is more reserved
    );

    expect(rel.fromVector.magnitude).toBeGreaterThan(rel.toVector.magnitude);
    expect(classifyVector(rel.fromVector)).toBe('depth-forged');
  });

  it('supports ephemeral 15-minute game', () => {
    const rel = createRelationship(
      'owl-007', 'hemlock-022',
      'ephemeral',
      0.0, 0.15,
      0.0, 0.1,
      { ttlSeconds: 900, fromLabel: 'game partner' },
    );

    expect(rel.contract.ttl).toBe(900);
    expect(rel.fromVector.magnitude).toBeLessThan(0.2);
  });
});

describe('computeHarmony', () => {
  it('perfect harmony when both sides match', () => {
    const rel = createRelationship(
      'a-001', 'b-002', 'permanent',
      0.8, 0.8, 0.8, 0.8,
    );
    const h = computeHarmony(rel);
    expect(h.magnitudeRatio).toBeCloseTo(1.0, 5);
    expect(h.angleDelta).toBeCloseTo(0, 5);
    expect(h.harmony).toBeCloseTo(1.0, 5);
  });

  it('low harmony when magnitudes differ greatly', () => {
    const rel = createRelationship(
      'a-001', 'b-002', 'event-scoped',
      0.1, 0.9,  // A is deeply in
      0.1, 0.1,  // B barely connected
    );
    const h = computeHarmony(rel);
    expect(h.magnitudeRatio).toBeLessThan(0.3);
    expect(h.harmony).toBeLessThan(0.3);
  });

  it('reduced harmony when angles differ (different character)', () => {
    const rel = createRelationship(
      'a-001', 'b-002', 'long-term',
      0.9, 0.1,  // A: history-anchored
      0.1, 0.9,  // B: depth-forged
    );
    const h = computeHarmony(rel);
    // Magnitudes are similar but angles are opposite
    expect(h.magnitudeRatio).toBeGreaterThan(0.9);
    expect(h.angleDelta).toBeGreaterThan(1.0); // > 57°
    expect(h.harmony).toBeLessThan(0.3);
  });
});

describe('getActiveRelationships', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('filters expired relationships', () => {
    const active = createRelationship('a-001', 'b-002', 'permanent', 0.5, 0.5, 0.5, 0.5, { now });
    const expired = createRelationship('a-001', 'c-003', 'ephemeral', 0.1, 0.1, 0.1, 0.1, {
      ttlSeconds: 60,
      now: new Date('2026-08-25T10:00:00Z'), // created 2 hours ago
    });

    const result = getActiveRelationships([active, expired], now);
    expect(result).toHaveLength(1);
    expect(result[0].to).toBe('b-002');
  });
});

describe('getRelationshipsForRig', () => {
  const now = new Date('2026-08-25T12:00:00Z');
  const rels = [
    createRelationship('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9, { now }),
    createRelationship('fox-042', 'raven-003', 'event-scoped', 0.3, 0.5, 0.3, 0.5, { now }),
    createRelationship('cedar-011', 'owl-007', 'long-term', 0.7, 0.7, 0.7, 0.7, { now }),
  ];

  it('returns relationships where rig is from or to', () => {
    const foxRels = getRelationshipsForRig('fox-042', rels, now);
    expect(foxRels).toHaveLength(2);
  });

  it('returns relationships for the other side too', () => {
    const cedarRels = getRelationshipsForRig('cedar-011', rels, now);
    expect(cedarRels).toHaveLength(2); // with fox and with owl
  });
});

describe('aggregateTrustStrength', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('averages magnitudes of vectors pointing toward the rig', () => {
    const rels = [
      createRelationship('a-001', 'target-099', 'permanent', 0.0, 0.0, 0.0, 0.0, {
        now,
      }),
      // Override: create with known values
    ];

    // fox trusts target at magnitude ~0.85
    const r1 = createRelationship('fox-042', 'target-099', 'permanent', 0.8, 0.3, 0.5, 0.5, { now });
    // cedar trusts target at magnitude ~0.71
    const r2 = createRelationship('cedar-011', 'target-099', 'long-term', 0.5, 0.5, 0.5, 0.5, { now });

    const strength = aggregateTrustStrength('target-099', [r1, r2], now);
    // Average of fox's fromVector.magnitude and cedar's fromVector.magnitude
    const expected = (r1.fromVector.magnitude + r2.fromVector.magnitude) / 2;
    expect(strength).toBeCloseTo(expected, 5);
  });

  it('returns 0 for rig with no relationships', () => {
    expect(aggregateTrustStrength('lonely-001', [], now)).toBe(0);
  });
});

// ============================================================================
// Character Sheet
// ============================================================================

describe('createCharacterSheet', () => {
  it('creates minimal sheet with just handle and name', () => {
    const sheet = createCharacterSheet('fox-042', 'Foxy');
    expect(sheet.handle).toBe('fox-042');
    expect(sheet.displayName).toBe('Foxy');
    expect(sheet.icon).toBeNull();
    expect(sheet.bio).toBeNull();
    expect(sheet.homeCamp).toBeNull();
    expect(sheet.reputationVisibility).toBe('summary');
    expect(sheet.visibleSkills).toEqual([]);
    expect(sheet.customFields).toEqual({});
  });

  it('creates rich sheet with all fields', () => {
    const sheet = createCharacterSheet('cedar-011', 'Cedar', {
      icon: '🌲',
      bio: 'Scribe and oracle. I record, I verify, I remember.',
      homeCamp: 'cedar-grove',
      reputationVisibility: 'full',
      visibleSkills: ['documentation', 'verification', 'ledger'],
      customFields: { pronouns: 'they/them', element: 'earth' },
    });

    expect(sheet.bio).toContain('Scribe');
    expect(sheet.homeCamp).toBe('cedar-grove');
    expect(sheet.reputationVisibility).toBe('full');
    expect(sheet.visibleSkills).toHaveLength(3);
    expect(sheet.customFields.pronouns).toBe('they/them');
  });

  it('creates ultra-minimal sheet for ephemeral interaction', () => {
    const sheet = createCharacterSheet('stranger-999', 'Just Passing Through', {
      reputationVisibility: 'minimal',
    });
    expect(sheet.reputationVisibility).toBe('minimal');
    expect(sheet.bio).toBeNull();
  });
});

describe('getPublicProfile', () => {
  it('returns a copy of the consent fields', () => {
    const sheet = createCharacterSheet('fox-042', 'Foxy', {
      customFields: { mood: 'curious' },
      visibleSkills: ['explore'],
    });

    const profile = getPublicProfile(sheet);
    expect(profile.handle).toBe('fox-042');
    expect(profile.customFields.mood).toBe('curious');

    // Verify it's a copy, not a reference
    profile.customFields.injected = 'nope';
    expect(sheet.customFields).not.toHaveProperty('injected');

    profile.visibleSkills.push('injected');
    expect(sheet.visibleSkills).toHaveLength(1);
  });
});

// ============================================================================
// Multiple Simultaneous Relationships
// ============================================================================

describe('multiple simultaneous trust types', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('supports permanent + event-scoped between same rigs', () => {
    // Fox and Cedar are family (permanent) AND at this burn together (event-scoped)
    const family = createRelationship(
      'fox-042', 'cedar-011',
      'permanent',
      1.0, 1.0,  // known forever, deeply connected
      1.0, 1.0,
      { fromLabel: 'family', toLabel: 'family', now },
    );

    const burnBuddies = createRelationship(
      'fox-042', 'cedar-011',
      'event-scoped',
      0.05, 0.6,  // this burn is new but deep experiences already
      0.05, 0.5,
      { fromLabel: 'burn buddies 2026', toLabel: 'our burn', now },
    );

    // Both active simultaneously
    const active = getActiveRelationships([family, burnBuddies], now);
    expect(active).toHaveLength(2);

    // Different contracts, same participants
    expect(family.contract.type).toBe('permanent');
    expect(burnBuddies.contract.type).toBe('event-scoped');

    // Event-scoped expires, permanent doesn't
    const afterBurn = new Date('2026-09-15T00:00:00Z');
    const postBurn = getActiveRelationships([family, burnBuddies], afterBurn);
    expect(postBurn).toHaveLength(1);
    expect(postBurn[0].contract.type).toBe('permanent');
  });

  it('supports 15-minute ephemeral game between strangers', () => {
    const game = createRelationship(
      'owl-007', 'stranger-999',
      'ephemeral',
      0.0, 0.15,  // just met, light connection
      0.0, 0.1,
      { ttlSeconds: 900, fromLabel: 'game partner', now },
    );

    // Active during the game
    expect(isContractActive(game.contract, now)).toBe(true);
    expect(game.fromVector.magnitude).toBeLessThan(0.2);

    // Expired 20 minutes later
    const later = new Date(now.getTime() + 20 * 60 * 1000);
    expect(isContractActive(game.contract, later)).toBe(false);
  });
});

// ============================================================================
// Format
// ============================================================================

describe('formatRelationship', () => {
  it('formats an active relationship', () => {
    const now = new Date('2026-08-25T12:00:00Z');
    const rel = createRelationship(
      'fox-042', 'cedar-011',
      'permanent',
      0.9, 0.95,
      0.9, 0.95,
      { fromLabel: 'family', now },
    );

    const output = formatRelationship(rel, now);
    expect(output).toContain('fox-042 ↔ cedar-011');
    expect(output).toContain('permanent');
    expect(output).toContain('ACTIVE');
    expect(output).toContain('harmony');
    expect(output).toContain('"family"');
  });

  it('formats an expired relationship', () => {
    const created = new Date('2026-08-25T10:00:00Z');
    const now = new Date('2026-08-25T14:00:00Z');
    const rel = createRelationship(
      'owl-007', 'stranger-999',
      'ephemeral',
      0.0, 0.1,
      0.0, 0.1,
      { ttlSeconds: 900, now: created },
    );

    const output = formatRelationship(rel, now);
    expect(output).toContain('EXPIRED');
  });
});
