/**
 * Trust Federation Tests
 *
 * Tests cross-instance trust protocol: clock skew tolerance,
 * burn calendar, data sovereignty, attestations, and federated
 * bridge potential.
 */

import { describe, it, expect } from 'vitest';
import {
  // Clock skew
  DEFAULT_CLOCK_SKEW_MS,
  withinClockSkew,
  adjustForClockOffset,
  measureClockOffset,
  // Burn calendar
  eventTTLFromCalendar,
  isDuringEvent,
  findActiveEvent,
  findNextEvent,
  // Data sovereignty
  PUBLIC_EXPORT_FIELDS,
  PRIVATE_EXPORT_FIELDS,
  filterForExport,
  containsPrivateFields,
  // Attestations
  createAttestation,
  magnitudeToBucket,
  createBridgeAttestation,
  DEFAULT_MAX_ATTESTATION_AGE_MS,
  validateAttestation,
  // Federated bridges
  computeFederatedBridges,
} from '../trust-federation.js';
import type {
  BurnEvent,
  BridgeAttestation,
} from '../trust-federation.js';

// ============================================================================
// Clock Skew Tolerance
// ============================================================================

describe('clock skew tolerance', () => {
  it('default tolerance is 5 minutes', () => {
    expect(DEFAULT_CLOCK_SKEW_MS).toBe(5 * 60 * 1000);
  });

  it('withinClockSkew: identical timestamps are within tolerance', () => {
    const t = new Date('2026-08-25T12:00:00Z');
    expect(withinClockSkew(t, t)).toBe(true);
  });

  it('withinClockSkew: 3 minutes apart is within default tolerance', () => {
    const local = new Date('2026-08-25T12:00:00Z');
    const remote = new Date('2026-08-25T12:03:00Z');
    expect(withinClockSkew(local, remote)).toBe(true);
  });

  it('withinClockSkew: 10 minutes apart exceeds default tolerance', () => {
    const local = new Date('2026-08-25T12:00:00Z');
    const remote = new Date('2026-08-25T12:10:00Z');
    expect(withinClockSkew(local, remote)).toBe(false);
  });

  it('withinClockSkew: custom tolerance', () => {
    const local = new Date('2026-08-25T12:00:00Z');
    const remote = new Date('2026-08-25T12:10:00Z');
    expect(withinClockSkew(local, remote, 15 * 60 * 1000)).toBe(true);
  });

  it('withinClockSkew: works in both directions', () => {
    const local = new Date('2026-08-25T12:03:00Z');
    const remote = new Date('2026-08-25T12:00:00Z');
    expect(withinClockSkew(local, remote)).toBe(true);
  });

  it('adjustForClockOffset: corrects positive offset (remote ahead)', () => {
    const remote = new Date('2026-08-25T12:00:30Z'); // 30s ahead
    const adjusted = adjustForClockOffset(remote, 30_000);
    expect(adjusted.toISOString()).toBe('2026-08-25T12:00:00.000Z');
  });

  it('adjustForClockOffset: corrects negative offset (remote behind)', () => {
    const remote = new Date('2026-08-25T11:59:30Z'); // 30s behind
    const adjusted = adjustForClockOffset(remote, -30_000);
    expect(adjusted.toISOString()).toBe('2026-08-25T12:00:00.000Z');
  });

  it('measureClockOffset: computes offset from NTP-like exchange', () => {
    const localSend = new Date('2026-08-25T12:00:00.000Z');
    const remoteReceive = new Date('2026-08-25T12:00:01.000Z'); // remote 1s ahead
    const localReceive = new Date('2026-08-25T12:00:00.200Z'); // 200ms RTT
    // Local midpoint: 12:00:00.100
    // Remote: 12:00:01.000
    // Offset: 900ms (remote ahead by 900ms)
    expect(measureClockOffset(localSend, remoteReceive, localReceive)).toBe(900);
  });

  it('measureClockOffset: zero offset when clocks match', () => {
    const localSend = new Date('2026-08-25T12:00:00.000Z');
    const remoteReceive = new Date('2026-08-25T12:00:00.100Z');
    const localReceive = new Date('2026-08-25T12:00:00.200Z');
    // Midpoint: 12:00:00.100 — matches remote
    expect(measureClockOffset(localSend, remoteReceive, localReceive)).toBe(0);
  });
});

// ============================================================================
// Burn Calendar
// ============================================================================

describe('burn calendar', () => {
  const burningMan2026: BurnEvent = {
    id: 'bm-2026',
    name: 'Burning Man 2026',
    startsAt: '2026-08-23T00:00:00Z',
    endsAt: '2026-08-30T00:00:00Z',
    hostInstanceId: 'center-camp',
  };

  const afrikaburn2026: BurnEvent = {
    id: 'ab-2026',
    name: 'AfrikaBurn 2026',
    startsAt: '2026-04-27T00:00:00Z',
    endsAt: '2026-05-03T00:00:00Z',
  };

  const calendar = [burningMan2026, afrikaburn2026];

  it('eventTTLFromCalendar: returns seconds until event ends', () => {
    const now = new Date('2026-08-25T12:00:00Z');
    const ttl = eventTTLFromCalendar(burningMan2026, now);
    // Aug 30 00:00 - Aug 25 12:00 = 4.5 days = 388800s
    expect(ttl).toBe(388800);
  });

  it('eventTTLFromCalendar: returns 0 for ended event', () => {
    const now = new Date('2026-09-01T00:00:00Z');
    expect(eventTTLFromCalendar(burningMan2026, now)).toBe(0);
  });

  it('eventTTLFromCalendar: covers full event when called before start', () => {
    const now = new Date('2026-08-20T00:00:00Z');
    const ttl = eventTTLFromCalendar(burningMan2026, now);
    // Aug 30 - Aug 20 = 10 days = 864000s
    expect(ttl).toBe(864000);
  });

  it('isDuringEvent: true during event', () => {
    expect(isDuringEvent(burningMan2026, new Date('2026-08-25T12:00:00Z'))).toBe(true);
  });

  it('isDuringEvent: false before event', () => {
    expect(isDuringEvent(burningMan2026, new Date('2026-08-22T23:59:59Z'))).toBe(false);
  });

  it('isDuringEvent: false after event', () => {
    expect(isDuringEvent(burningMan2026, new Date('2026-08-30T00:00:01Z'))).toBe(false);
  });

  it('isDuringEvent: true at exact start', () => {
    expect(isDuringEvent(burningMan2026, new Date('2026-08-23T00:00:00Z'))).toBe(true);
  });

  it('isDuringEvent: true at exact end', () => {
    expect(isDuringEvent(burningMan2026, new Date('2026-08-30T00:00:00Z'))).toBe(true);
  });

  it('findActiveEvent: returns active event', () => {
    const result = findActiveEvent(calendar, new Date('2026-08-25T12:00:00Z'));
    expect(result?.id).toBe('bm-2026');
  });

  it('findActiveEvent: returns null when no event active', () => {
    expect(findActiveEvent(calendar, new Date('2026-06-15T00:00:00Z'))).toBeNull();
  });

  it('findNextEvent: returns next upcoming event', () => {
    const result = findNextEvent(calendar, new Date('2026-01-01T00:00:00Z'));
    expect(result?.id).toBe('ab-2026'); // AfrikaBurn is first chronologically
  });

  it('findNextEvent: returns BM when AfrikaBurn is past', () => {
    const result = findNextEvent(calendar, new Date('2026-05-15T00:00:00Z'));
    expect(result?.id).toBe('bm-2026');
  });

  it('findNextEvent: returns null when all events are past', () => {
    expect(findNextEvent(calendar, new Date('2027-01-01T00:00:00Z'))).toBeNull();
  });
});

// ============================================================================
// Data Sovereignty
// ============================================================================

describe('data sovereignty', () => {
  it('PUBLIC_EXPORT_FIELDS includes handle and trust_level', () => {
    expect(PUBLIC_EXPORT_FIELDS).toContain('handle');
    expect(PUBLIC_EXPORT_FIELDS).toContain('trust_level');
  });

  it('PRIVATE_EXPORT_FIELDS includes trust vector components', () => {
    expect(PRIVATE_EXPORT_FIELDS).toContain('from_time');
    expect(PRIVATE_EXPORT_FIELDS).toContain('from_depth');
    expect(PRIVATE_EXPORT_FIELDS).toContain('to_time');
    expect(PRIVATE_EXPORT_FIELDS).toContain('to_depth');
    expect(PRIVATE_EXPORT_FIELDS).toContain('from_label');
    expect(PRIVATE_EXPORT_FIELDS).toContain('to_label');
    expect(PRIVATE_EXPORT_FIELDS).toContain('visibility');
  });

  it('filterForExport: keeps only allowed fields', () => {
    const record = {
      handle: 'fox-042',
      trust_level: 2,
      from_time: 0.8,
      from_depth: 0.6,
      secret_field: 'classified',
    };
    const filtered = filterForExport(record, PUBLIC_EXPORT_FIELDS);
    expect(filtered).toEqual({
      handle: 'fox-042',
      trust_level: 2,
    });
  });

  it('filterForExport: returns empty object when no fields match', () => {
    const record = { from_time: 0.8, from_depth: 0.6 };
    const filtered = filterForExport(record, PUBLIC_EXPORT_FIELDS);
    expect(Object.keys(filtered)).toHaveLength(0);
  });

  it('containsPrivateFields: detects private fields', () => {
    const record = { handle: 'fox-042', from_time: 0.8, from_label: 'family' };
    const result = containsPrivateFields(record);
    expect(result.safe).toBe(false);
    expect(result.found).toContain('from_time');
    expect(result.found).toContain('from_label');
  });

  it('containsPrivateFields: passes clean records', () => {
    const record = { handle: 'fox-042', trust_level: 2, registered_at: '2026-08-25T00:00:00Z' };
    const result = containsPrivateFields(record);
    expect(result.safe).toBe(true);
    expect(result.found).toHaveLength(0);
  });
});

// ============================================================================
// Attestation Creation
// ============================================================================

describe('attestation creation', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('createAttestation: produces correct structure', () => {
    const att = createAttestation('fox-042', 'center-camp', 2, 5, 0.6, 1, now);
    expect(att.handle).toBe('fox-042');
    expect(att.instanceId).toBe('center-camp');
    expect(att.trustLevel).toBe(2);
    expect(att.activeConnectionCount).toBe(5);
    expect(att.diversityScore).toBe(0.6);
    expect(att.bondCount).toBe(1);
    expect(att.attestedAt).toBe('2026-08-25T12:00:00.000Z');
  });

  it('magnitudeToBucket: weak for low magnitude', () => {
    expect(magnitudeToBucket(0.1)).toBe('weak');
    expect(magnitudeToBucket(0.32)).toBe('weak');
  });

  it('magnitudeToBucket: moderate for mid magnitude', () => {
    expect(magnitudeToBucket(0.33)).toBe('moderate');
    expect(magnitudeToBucket(0.5)).toBe('moderate');
    expect(magnitudeToBucket(0.66)).toBe('moderate');
  });

  it('magnitudeToBucket: strong for high magnitude', () => {
    expect(magnitudeToBucket(0.67)).toBe('strong');
    expect(magnitudeToBucket(0.9)).toBe('strong');
    expect(magnitudeToBucket(1.0)).toBe('strong');
  });

  it('createBridgeAttestation: coarsens magnitude to bucket', () => {
    const att = createBridgeAttestation('center-camp', 'fox-042', 'cedar-011', true, 0.85, now);
    expect(att.strengthBucket).toBe('strong');
    expect(att.active).toBe(true);
    expect(att.handleA).toBe('fox-042');
    expect(att.handleB).toBe('cedar-011');
  });

  it('createBridgeAttestation: weak bucket for low magnitude', () => {
    const att = createBridgeAttestation('center-camp', 'fox-042', 'anon-001', true, 0.1, now);
    expect(att.strengthBucket).toBe('weak');
  });
});

// ============================================================================
// Attestation Validation
// ============================================================================

describe('attestation validation', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('accepts fresh attestation', () => {
    const att = { attestedAt: '2026-08-25T11:30:00.000Z' }; // 30 min ago
    expect(validateAttestation(att, now).valid).toBe(true);
  });

  it('rejects attestation older than max age', () => {
    const att = { attestedAt: '2026-08-24T00:00:00.000Z' }; // 36 hours ago
    const result = validateAttestation(att, now);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('too old');
  });

  it('accepts attestation within clock skew window (future)', () => {
    const att = { attestedAt: '2026-08-25T12:03:00.000Z' }; // 3 min in future
    expect(validateAttestation(att, now).valid).toBe(true);
  });

  it('rejects future attestation beyond clock skew', () => {
    const att = { attestedAt: '2026-08-25T12:10:00.000Z' }; // 10 min in future
    const result = validateAttestation(att, now);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('future timestamp');
  });

  it('rejects invalid timestamp', () => {
    const att = { attestedAt: 'not-a-date' };
    const result = validateAttestation(att, now);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('invalid');
  });

  it('respects custom max age', () => {
    const att = { attestedAt: '2026-08-25T10:00:00.000Z' }; // 2 hours ago
    // Default 24h — valid
    expect(validateAttestation(att, now).valid).toBe(true);
    // Custom 1h — invalid
    const result = validateAttestation(att, now, 60 * 60 * 1000);
    expect(result.valid).toBe(false);
  });

  it('default max age is 24 hours', () => {
    expect(DEFAULT_MAX_ATTESTATION_AGE_MS).toBe(24 * 60 * 60 * 1000);
  });
});

// ============================================================================
// Federated Bridge Potential
// ============================================================================

describe('federated bridge potential', () => {
  const now = new Date('2026-08-25T12:00:00Z');

  it('finds bridges through local peers via remote attestations', () => {
    const localMagnitudes = new Map([
      ['cedar-011', 0.9], // strong local connection to cedar
    ]);
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'afrikaburn',
        handleA: 'cedar-011',
        handleB: 'springbok-003',
        active: true,
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
    ];
    const directPeers = new Set(['cedar-011']); // cedar is direct

    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, directPeers);
    expect(bridges).toHaveLength(1);
    expect(bridges[0].from).toBe('fox-042');
    expect(bridges[0].through).toBe('cedar-011');
    expect(bridges[0].to).toBe('springbok-003');
    expect(bridges[0].potential).toBeCloseTo(0.9 * 0.8); // 0.9 local × 0.8 strong bucket
    expect(bridges[0].targetInstanceId).toBe('afrikaburn');
  });

  it('skips inactive attestations', () => {
    const localMagnitudes = new Map([['cedar-011', 0.9]]);
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'afrikaburn',
        handleA: 'cedar-011',
        handleB: 'springbok-003',
        active: false, // inactive
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
    ];
    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, new Set(['cedar-011']));
    expect(bridges).toHaveLength(0);
  });

  it('skips targets already directly connected', () => {
    const localMagnitudes = new Map([['cedar-011', 0.9]]);
    const directPeers = new Set(['cedar-011', 'springbok-003']); // already know springbok
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'afrikaburn',
        handleA: 'cedar-011',
        handleB: 'springbok-003',
        active: true,
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
    ];
    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, directPeers);
    expect(bridges).toHaveLength(0);
  });

  it('skips self-introductions', () => {
    const localMagnitudes = new Map([['cedar-011', 0.9]]);
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'afrikaburn',
        handleA: 'cedar-011',
        handleB: 'fox-042', // target is the focus rig itself
        active: true,
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
    ];
    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, new Set(['cedar-011']));
    expect(bridges).toHaveLength(0);
  });

  it('works with attestation where bridge is handleB', () => {
    const localMagnitudes = new Map([['raven-007', 0.7]]);
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'kiwiburn',
        handleA: 'kiwi-001',
        handleB: 'raven-007', // bridge is on the B side
        active: true,
        strengthBucket: 'moderate',
        attestedAt: now.toISOString(),
      },
    ];
    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, new Set(['raven-007']));
    expect(bridges).toHaveLength(1);
    expect(bridges[0].through).toBe('raven-007');
    expect(bridges[0].to).toBe('kiwi-001');
    expect(bridges[0].potential).toBeCloseTo(0.7 * 0.5); // 0.7 local × 0.5 moderate
  });

  it('sorts bridges by potential descending', () => {
    const localMagnitudes = new Map([
      ['cedar-011', 0.9],
      ['raven-007', 0.3],
    ]);
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'afrikaburn',
        handleA: 'raven-007',
        handleB: 'springbok-003',
        active: true,
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
      {
        instanceId: 'kiwiburn',
        handleA: 'cedar-011',
        handleB: 'kiwi-001',
        active: true,
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
    ];
    const directPeers = new Set(['cedar-011', 'raven-007']);
    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, directPeers);
    expect(bridges).toHaveLength(2);
    // Cedar bridge (0.9 * 0.8 = 0.72) should come first
    expect(bridges[0].through).toBe('cedar-011');
    // Raven bridge (0.3 * 0.8 = 0.24) second
    expect(bridges[1].through).toBe('raven-007');
  });

  it('handles empty inputs gracefully', () => {
    const bridges = computeFederatedBridges('fox-042', new Map(), [], new Set());
    expect(bridges).toHaveLength(0);
  });

  it('handles unknown local peers in attestations', () => {
    const localMagnitudes = new Map<string, number>(); // no local peers
    const remoteAttestations: BridgeAttestation[] = [
      {
        instanceId: 'afrikaburn',
        handleA: 'unknown-rig',
        handleB: 'springbok-003',
        active: true,
        strengthBucket: 'strong',
        attestedAt: now.toISOString(),
      },
    ];
    const bridges = computeFederatedBridges('fox-042', localMagnitudes, remoteAttestations, new Set());
    expect(bridges).toHaveLength(0);
  });
});
