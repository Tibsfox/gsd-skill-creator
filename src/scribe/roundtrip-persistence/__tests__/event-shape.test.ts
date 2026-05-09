/**
 * Component 05 — event-shape.ts unit tests.
 *
 * 12 tests covering validateRoundTripPayload() + buildLabel():
 *
 *  1. Valid full payload passes validation
 *  2. Valid minimal payload (no optional fields) passes
 *  3. Non-object payload is rejected
 *  4. Missing direction is rejected
 *  5. Invalid direction value is rejected
 *  6. Missing sourceLanguage is rejected
 *  7. Empty sourceLanguage string is rejected
 *  8. Missing targetLanguage is rejected
 *  9. Bad sourceSha (non-hex) is rejected
 * 10. Bad targetSha (wrong length) is rejected
 * 11. Bad svgSha is rejected
 * 12. Invalid emittedAt is rejected
 * 13. Valid extras object passes
 * 14. extras as array is rejected
 * 15. buildLabel with exampleId
 * 16. buildLabel without exampleId
 *
 * No PG_TEST gating — these are pure unit tests with no database dependency.
 */

import { describe, it, expect } from 'vitest';
import {
  validateRoundTripPayload,
  isValidPayload,
  buildLabel,
} from '../event-shape.js';

// Canonical valid SHA-1 hex fixture (40 chars, lower-hex)
const SHA = 'a'.repeat(40);
const SHA2 = 'b'.repeat(40);
const SHA3 = 'c'.repeat(40);

const VALID_PAYLOAD = {
  direction: 'forward',
  sourceLanguage: 'typescript',
  targetLanguage: 'verilog',
  sourceSha: SHA,
  targetSha: SHA2,
  svgSha: SHA3,
};

// ---------------------------------------------------------------------------
// Test 1 — Valid full payload passes
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: valid full payload', () => {
  it('passes with all required + optional fields present', () => {
    const result = validateRoundTripPayload({
      ...VALID_PAYLOAD,
      emittedAt: '2026-05-09T12:00:00Z',
      extras: { exampleId: 'add' },
    });
    expect(result.ok).toBe(true);
    if (isValidPayload(result)) {
      expect(result.payload.direction).toBe('forward');
      expect(result.payload.sourceSha).toBe(SHA);
      expect(result.payload.extras?.['exampleId']).toBe('add');
    }
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Valid minimal payload passes
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: valid minimal payload', () => {
  it('passes with only required fields', () => {
    const result = validateRoundTripPayload(VALID_PAYLOAD);
    expect(result.ok).toBe(true);
    if (isValidPayload(result)) {
      expect(result.payload.emittedAt).toBeUndefined();
      expect(result.payload.extras).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Non-object payload is rejected
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: non-object', () => {
  it('rejects null', () => {
    const result = validateRoundTripPayload(null);
    expect(result.ok).toBe(false);
  });

  it('rejects a string', () => {
    const result = validateRoundTripPayload('roundtrip');
    expect(result.ok).toBe(false);
  });

  it('rejects an array', () => {
    const result = validateRoundTripPayload([VALID_PAYLOAD]);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Missing direction is rejected
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: direction', () => {
  it('rejects missing direction', () => {
    const { direction: _, ...rest } = VALID_PAYLOAD;
    const result = validateRoundTripPayload(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/direction/);
  });

  // Test 5 — Invalid direction
  it('rejects unknown direction value', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, direction: 'sideways' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/direction/);
  });

  it('accepts reverse direction', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, direction: 'reverse' });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 6 — Missing sourceLanguage is rejected
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: sourceLanguage', () => {
  it('rejects missing sourceLanguage', () => {
    const { sourceLanguage: _, ...rest } = VALID_PAYLOAD;
    const result = validateRoundTripPayload(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/sourceLanguage/);
  });

  // Test 7 — Invalid sourceLanguage (not in closed set)
  it('rejects sourceLanguage not in SourceLanguage closed set', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, sourceLanguage: 'cobol' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/sourceLanguage/);
  });
});

// ---------------------------------------------------------------------------
// Test 8 — Missing targetLanguage is rejected
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: targetLanguage', () => {
  it('rejects missing targetLanguage', () => {
    const { targetLanguage: _, ...rest } = VALID_PAYLOAD;
    const result = validateRoundTripPayload(rest);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests 9-11 — SHA field validation
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: SHA fields', () => {
  it('rejects bad sourceSha (non-hex chars)', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, sourceSha: 'zz' + SHA.slice(2) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/sourceSha/);
  });

  it('rejects sourceSha with wrong length (39 chars)', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, sourceSha: SHA.slice(1) });
    expect(result.ok).toBe(false);
  });

  it('rejects bad targetSha', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, targetSha: 'not-a-sha' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/targetSha/);
  });

  it('rejects bad svgSha (number instead of string)', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, svgSha: 12345 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/svgSha/);
  });

  it('accepts uppercase hex SHA', () => {
    const upperSha = SHA.toUpperCase();
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, sourceSha: upperSha });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 12 — Invalid emittedAt
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: emittedAt', () => {
  it('rejects non-string emittedAt', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, emittedAt: 12345 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/emittedAt/);
  });

  it('rejects invalid ISO-8601 string', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, emittedAt: 'not-a-date' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/emittedAt/);
  });

  it('accepts valid ISO-8601 emittedAt', () => {
    const result = validateRoundTripPayload({
      ...VALID_PAYLOAD,
      emittedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 13-14 — extras
// ---------------------------------------------------------------------------

describe('validateRoundTripPayload: extras', () => {
  it('accepts a valid extras object', () => {
    const result = validateRoundTripPayload({
      ...VALID_PAYLOAD,
      extras: { exampleId: 'mux', stageMs: 42 },
    });
    expect(result.ok).toBe(true);
  });

  it('rejects extras as an array', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, extras: [1, 2, 3] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/extras/);
  });

  it('rejects extras as a primitive', () => {
    const result = validateRoundTripPayload({ ...VALID_PAYLOAD, extras: 'string-extra' });
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests 15-16 — buildLabel
// ---------------------------------------------------------------------------

describe('buildLabel', () => {
  it('includes exampleId in label when present in extras', () => {
    const meta = { ...VALID_PAYLOAD, direction: 'forward' as const, extras: { exampleId: 'add' } };
    const label = buildLabel(meta as Parameters<typeof buildLabel>[0]);
    expect(label).toBe('roundtrip(add): forward');
  });

  it('omits exampleId placeholder when extras is absent', () => {
    const meta = { ...VALID_PAYLOAD, direction: 'reverse' as const };
    const label = buildLabel(meta as Parameters<typeof buildLabel>[0]);
    expect(label).toBe('roundtrip: reverse');
  });

  it('omits exampleId placeholder when extras has no exampleId', () => {
    const meta = {
      ...VALID_PAYLOAD,
      direction: 'forward' as const,
      extras: { stageMs: 10 },
    };
    const label = buildLabel(meta as Parameters<typeof buildLabel>[0]);
    expect(label).toBe('roundtrip: forward');
  });
});
