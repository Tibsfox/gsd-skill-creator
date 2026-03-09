/**
 * Trust Registration Tests
 *
 * Tests the registration pipeline: handle generation, PII validation,
 * Welcome Home badge issuance, atomic registration flow, and SQL generation.
 *
 * Includes 6 safety-critical tests (SC-1 through SC-6) that verify
 * privacy invariants and structural isolation from the stamp/escalation engine.
 */

import { describe, it, expect } from 'vitest';
import {
  generateRigHandle,
  validateDisplayName,
  issueWelcomeHomeBadge,
  register,
  generateRegistrationSQL,
  announceArrival,
  WELCOME_BADGES_DDL,
} from '../trust-registration.js';
import type {
  RegistrationDataProvider,
  RegistrationResult,
  WelcomeHomeBadge,
} from '../trust-registration.js';

// ============================================================================
// Mock Provider
// ============================================================================

function createMockProvider(overrides: Partial<RegistrationDataProvider> = {}): RegistrationDataProvider & {
  _registrations: RegistrationResult[];
} {
  const state = {
    _registrations: [] as RegistrationResult[],
    _maxSuffixes: new Map<string, number>(),
    _handles: new Set<string>(),
  };

  return {
    _registrations: state._registrations,
    handleExists: overrides.handleExists ?? (async (handle: string) => state._handles.has(handle)),
    getMaxSuffix: overrides.getMaxSuffix ?? (async (totem: string) => state._maxSuffixes.get(totem) ?? 0),
    registerRig: overrides.registerRig ?? (async (result: RegistrationResult) => {
      if (state._handles.has(result.handle)) {
        throw new Error(`Handle already exists: ${result.handle}`);
      }
      state._handles.add(result.handle);
      state._registrations.push(result);
    }),
  };
}

// ============================================================================
// Schema DDL
// ============================================================================

describe('WELCOME_BADGES_DDL', () => {
  it('creates the welcome_badges table', () => {
    expect(WELCOME_BADGES_DDL).toContain('CREATE TABLE IF NOT EXISTS welcome_badges');
    expect(WELCOME_BADGES_DDL).toContain('handle');
    expect(WELCOME_BADGES_DDL).toContain('badge_id');
    expect(WELCOME_BADGES_DDL).toContain('issued_at');
    expect(WELCOME_BADGES_DDL).toContain('message');
  });

  // SC: safety-critical — DDL must not contain stamp columns
  it('SC-1: DDL has no quality/reliability/creativity columns', () => {
    expect(WELCOME_BADGES_DDL).not.toContain('quality');
    expect(WELCOME_BADGES_DDL).not.toContain('reliability');
    expect(WELCOME_BADGES_DDL).not.toContain('creativity');
    expect(WELCOME_BADGES_DDL).not.toContain('promotion_weight');
    expect(WELCOME_BADGES_DDL).not.toContain('valence');
  });
});

// ============================================================================
// Handle Generation
// ============================================================================

describe('generateRigHandle', () => {
  it('returns handle in totem-NNN format', () => {
    const { handle } = generateRigHandle('fox', 42);
    expect(handle).toBe('fox-042');
  });

  it('pads single-digit suffix to 3 digits', () => {
    const { handle } = generateRigHandle('cedar', 1);
    expect(handle).toBe('cedar-001');
  });

  it('pads double-digit suffix to 3 digits', () => {
    const { handle } = generateRigHandle('raven', 42);
    expect(handle).toBe('raven-042');
  });

  it('does not pad 3-digit suffix', () => {
    const { handle } = generateRigHandle('owl', 999);
    expect(handle).toBe('owl-999');
  });

  it('generates a UUID alongside the handle', () => {
    const { uuid } = generateRigHandle('fox', 1);
    expect(uuid).toBeTruthy();
    expect(uuid.length).toBeGreaterThan(10);
  });

  it('throws on empty totem', () => {
    expect(() => generateRigHandle('', 1)).toThrow('lowercase letters only');
  });

  it('throws on totem with non-lowercase-alpha characters', () => {
    expect(() => generateRigHandle('Fox', 1)).toThrow('lowercase letters only');
    expect(() => generateRigHandle('fox-2', 1)).toThrow('lowercase letters only');
    expect(() => generateRigHandle('fox42', 1)).toThrow('lowercase letters only');
  });
});

// ============================================================================
// Display Name Validation
// ============================================================================

describe('validateDisplayName', () => {
  it('valid playa name passes', () => {
    expect(validateDisplayName('Foxy')).toEqual({ valid: true });
    expect(validateDisplayName('Desert Fox')).toEqual({ valid: true });
    expect(validateDisplayName('Cedar-7')).toEqual({ valid: true });
    expect(validateDisplayName('Raven42')).toEqual({ valid: true });
  });

  it('unicode characters pass', () => {
    expect(validateDisplayName('Aguila')).toEqual({ valid: true });
    expect(validateDisplayName('Bjorn')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    const result = validateDisplayName('');
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only', () => {
    const result = validateDisplayName('   ');
    expect(result.valid).toBe(false);
  });

  it('rejects name longer than 128 chars', () => {
    const result = validateDisplayName('a'.repeat(129));
    expect(result.valid).toBe(false);
  });

  // SC: safety-critical — PII email guard
  it('SC-2: rejects @ symbol (email/social handle pattern)', () => {
    const result = validateDisplayName('user@example.com');
    expect(result.valid).toBe(false);
    expect((result as { reason: string }).reason).toContain('email');
  });

  it('rejects URL with https://', () => {
    const result = validateDisplayName('https://example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects URL with www.', () => {
    const result = validateDisplayName('check out www.mysite.com');
    expect(result.valid).toBe(false);
  });

  // SC: safety-critical — PII phone guard
  it('SC-3: rejects phone pattern 555-867-5309', () => {
    const result = validateDisplayName('call me 555-867-5309');
    expect(result.valid).toBe(false);
    expect((result as { reason: string }).reason).toContain('phone');
  });

  it('rejects phone pattern with dots', () => {
    const result = validateDisplayName('555.867.5309');
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// Welcome Home Badge
// ============================================================================

describe('issueWelcomeHomeBadge', () => {
  const now = new Date('2026-08-25T18:00:00Z');

  it('returns badge with correct badgeId', () => {
    const badge = issueWelcomeHomeBadge('fox-042', now);
    expect(badge.badgeId).toBe('welcome-home');
  });

  it('icon is exactly [H]', () => {
    const badge = issueWelcomeHomeBadge('fox-042', now);
    expect(badge.icon).toBe('[H]');
  });

  it('message is exactly "You showed up. That\'s enough."', () => {
    const badge = issueWelcomeHomeBadge('fox-042', now);
    expect(badge.message).toBe("You showed up. That's enough.");
  });

  it('issuedAt is a UTC Z-suffix timestamp', () => {
    const badge = issueWelcomeHomeBadge('fox-042', now);
    expect(badge.issuedAt).toMatch(/Z$/);
    expect(badge.issuedAt).toBe('2026-08-25T18:00:00.000Z');
  });

  it('handle matches input', () => {
    const badge = issueWelcomeHomeBadge('cedar-011', now);
    expect(badge.handle).toBe('cedar-011');
  });

  // SC: safety-critical — badge is NOT a stamp
  it('SC-4: badge has no quality field', () => {
    const badge = issueWelcomeHomeBadge('fox-042', now) as unknown as Record<string, unknown>;
    expect(badge).not.toHaveProperty('quality');
    expect(badge).not.toHaveProperty('reliability');
    expect(badge).not.toHaveProperty('creativity');
    expect(badge).not.toHaveProperty('promotionWeight');
    expect(badge).not.toHaveProperty('valence');
    expect(badge).not.toHaveProperty('stampType');
  });
});

// ============================================================================
// Registration Flow
// ============================================================================

describe('register', () => {
  const now = new Date('2026-08-25T18:00:00Z');

  it('returns RegistrationResult with handle in totem-NNN format', async () => {
    const provider = createMockProvider();
    const result = await register({ totem: 'fox', now }, provider);
    expect(result.handle).toBe('fox-001');
    expect(result.handle).toMatch(/^[a-z]+-\d{3}$/);
  });

  // SC: safety-critical — trust level is always 1
  it('SC-5: trust level is always 1 on registration', async () => {
    const provider = createMockProvider();
    const result = await register({ totem: 'cedar', now }, provider);
    expect(result.trustLevel).toBe(1);
  });

  it('badge is issued and attached to result', async () => {
    const provider = createMockProvider();
    const result = await register({ totem: 'raven', now }, provider);
    expect(result.badge.badgeId).toBe('welcome-home');
    expect(result.badge.handle).toBe(result.handle);
    expect(result.badge.issuedAt).toBe(result.registeredAt);
  });

  it('provider.registerRig is called exactly once', async () => {
    let callCount = 0;
    const provider = createMockProvider({
      registerRig: async () => { callCount++; },
    });
    await register({ totem: 'owl', now }, provider);
    expect(callCount).toBe(1);
  });

  it('suffix increments from getMaxSuffix return value', async () => {
    const provider = createMockProvider({
      getMaxSuffix: async () => 41,
    });
    const result = await register({ totem: 'fox', now }, provider);
    expect(result.handle).toBe('fox-042');
  });

  it('uses display name when provided', async () => {
    const provider = createMockProvider();
    const result = await register({ totem: 'fox', displayName: 'Desert Fox', now }, provider);
    expect(result.handle).toBe('fox-001');
    // Display name is on the character sheet, not the result — but registration should not throw
  });

  it('registeredAt is UTC Z-suffix', async () => {
    const provider = createMockProvider();
    const result = await register({ totem: 'fox', now }, provider);
    expect(result.registeredAt).toMatch(/Z$/);
    expect(result.registeredAt).toBe('2026-08-25T18:00:00.000Z');
  });

  it('throws on empty totem', async () => {
    const provider = createMockProvider();
    await expect(register({ totem: '', now }, provider)).rejects.toThrow('lowercase letters only');
  });

  it('throws on totem with uppercase letters', async () => {
    const provider = createMockProvider();
    await expect(register({ totem: 'Fox', now }, provider)).rejects.toThrow('lowercase letters only');
  });

  it('throws on displayName that fails PII check', async () => {
    const provider = createMockProvider();
    await expect(register({ totem: 'fox', displayName: 'user@test.com', now }, provider))
      .rejects.toThrow('email');
  });

  it('throws descriptively when provider fails', async () => {
    const provider = createMockProvider({
      registerRig: async () => { throw new Error('Dolt connection refused'); },
    });
    await expect(register({ totem: 'fox', now }, provider))
      .rejects.toThrow('Dolt connection refused');
  });

  it('throws when totem is full (999 handles taken)', async () => {
    const provider = createMockProvider({
      getMaxSuffix: async () => 999,
    });
    await expect(register({ totem: 'fox', now }, provider)).rejects.toThrow('full');
  });
});

// ============================================================================
// SQL Generation
// ============================================================================

describe('generateRegistrationSQL', () => {
  const result: RegistrationResult = {
    handle: 'fox-042',
    uuid: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
    trustLevel: 1,
    registeredAt: '2026-08-25T18:00:00.000Z',
    badge: {
      handle: 'fox-042',
      badgeId: 'welcome-home',
      icon: '[H]',
      message: "You showed up. That's enough.",
      issuedAt: '2026-08-25T18:00:00.000Z',
    },
  };

  it('generates INSERT for rigs table with trust_level=1', () => {
    const sql = generateRegistrationSQL(result);
    expect(sql).toContain('INSERT INTO rigs');
    expect(sql).toContain("'fox-042'");
    expect(sql).toContain(', 1, ');
    expect(sql).toContain("'participant'");
  });

  it('generates INSERT for welcome_badges table', () => {
    const sql = generateRegistrationSQL(result);
    expect(sql).toContain('INSERT INTO welcome_badges');
    expect(sql).toContain("'welcome-home'");
  });

  it('trust_level_changed_at equals registered_at on first registration', () => {
    const sql = generateRegistrationSQL(result);
    // Both timestamp positions should have the same value
    const matches = sql.match(/2026-08-25T18:00:00\.000Z/g);
    expect(matches).not.toBeNull();
    // At least 3: registered_at, trust_level_changed_at, and badge issued_at
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });

  it('SQL-escapes handle values', () => {
    const evilResult: RegistrationResult = {
      ...result,
      handle: "o'malley-001",
      badge: { ...result.badge, handle: "o'malley-001" },
    };
    const sql = generateRegistrationSQL(evilResult);
    expect(sql).toContain("o''malley-001");
  });

  it('includes arrival comment header', () => {
    const sql = generateRegistrationSQL(result);
    expect(sql).toContain('-- Arrival: fox-042');
  });
});

// ============================================================================
// Bell Mechanism
// ============================================================================

describe('announceArrival', () => {
  // SC: safety-critical — arrival event carries no identity
  it('SC-6: announcement contains no handle or display name', () => {
    const announcement = announceArrival();
    expect(announcement).toBe('~ someone arrived');
    expect(announcement).not.toContain('fox');
    expect(announcement).not.toContain('042');
    expect(announcement).not.toContain('handle');
    expect(announcement).not.toContain('name');
  });

  it('returns a fixed string — no parameterization', () => {
    const a1 = announceArrival();
    const a2 = announceArrival();
    expect(a1).toBe(a2);
  });
});
