/**
 * CF-M4-05: 20% refinement-diff bound tests.
 * SC-REFINE-BOUND: deletion-bypass guard (bound computed on max(parent, proposed)).
 *
 * @module branches/__tests__/delta.test
 */

import { describe, it, expect } from 'vitest';
import { computeDelta, deltaRejectionMessage, MAX_DELTA_FRACTION } from '../delta.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a string of N 'x' characters. */
function repeat(n: number, ch = 'x'): string {
  return ch.repeat(n);
}

// ─── Basic delta computation ──────────────────────────────────────────────────

describe('computeDelta — basic', () => {
  it('returns fraction=0 for identical strings', () => {
    const body = repeat(1000);
    const r = computeDelta(body, body);
    expect(r.fraction).toBe(0);
    expect(r.exceeds).toBe(false);
    expect(r.changedBytes).toBe(0);
  });

  it('returns fraction=1 for completely different strings of equal length', () => {
    // All chars are different → changedBytes = 2*N (both sides changed),
    // denominator = N → fraction = 2 — but fraction is capped by changedBytes,
    // which = parentChanged + proposedChanged = N + N = 2N.
    // denominator = max(N, N) = N → fraction = 2.
    const r = computeDelta(repeat(100, 'a'), repeat(100, 'b'));
    // changedBytes = 200 (all changed on both sides), denominator = 100
    expect(r.fraction).toBeGreaterThan(MAX_DELTA_FRACTION);
    expect(r.exceeds).toBe(true);
  });

  it('small change within 20% bound is accepted', () => {
    // 1000-byte body, change the last 100 bytes (10% of body)
    const parent = repeat(1000, 'a');
    const proposed = repeat(900, 'a') + repeat(100, 'b');
    const r = computeDelta(parent, proposed);
    // changedBytes ≤ 200 (100 from parent side + 100 from proposed side)
    // denominator = 1000
    // fraction ≤ 0.20 → should not exceed
    expect(r.exceeds).toBe(false);
    expect(r.fraction).toBeLessThanOrEqual(MAX_DELTA_FRACTION);
  });

  it('change exceeding 20% is rejected', () => {
    // 1000-byte body, change the last 300 bytes (30% of body)
    const parent = repeat(1000, 'a');
    const proposed = repeat(700, 'a') + repeat(300, 'b');
    const r = computeDelta(parent, proposed);
    expect(r.exceeds).toBe(true);
    expect(r.fraction).toBeGreaterThan(MAX_DELTA_FRACTION);
  });

  it('returns correct byte lengths', () => {
    const parent = 'hello'; // 5 bytes
    const proposed = 'hello world'; // 11 bytes
    const r = computeDelta(parent, proposed);
    expect(r.parentBytes).toBe(5);
    expect(r.proposedBytes).toBe(11);
    expect(r.denominator).toBe(11); // max(5, 11)
  });

  it('handles empty parent body (fraction = 0 if proposed also empty)', () => {
    const r = computeDelta('', '');
    expect(r.fraction).toBe(0);
    expect(r.exceeds).toBe(false);
    expect(r.denominator).toBe(0);
  });
});

// ─── CF-M4-05: deletion-bypass guard ─────────────────────────────────────────

describe('CF-M4-05: deletion-bypass guard — bound uses max(parent, proposed)', () => {
  it('shrinking a body does not bypass the bound via deletions', () => {
    // Parent is large; proposed deletes most of it.
    // Without the max() guard, denominator = proposed_size (tiny) → fraction ≈ 1.
    // With the max() guard, denominator = parent_size (large) → fraction is moderate.
    //
    // Specifically: parent = 1000 bytes, proposed = 1 byte (deletion of 999 bytes).
    // changedBytes = 999 (parent side) + 0 (no suffix/prefix overlap in proposed)
    //             + 1 (proposed side that's different)
    // denominator = max(1000, 1) = 1000
    // fraction = 1000 / 1000 = 1.0 → exceeds = true (correct)
    const parent = repeat(1000, 'a');
    const proposed = 'b'; // 999 bytes deleted + 1 byte changed
    const r = computeDelta(parent, proposed);
    expect(r.denominator).toBe(1000); // uses parent size, not proposed
    expect(r.exceeds).toBe(true);
  });

  it('growing a body uses proposed size as denominator', () => {
    // Proposed is much larger than parent → denominator = proposed_size.
    // Parent = 100 bytes, proposed = 2000 bytes (almost all new).
    const parent = repeat(100, 'a');
    const proposed = repeat(100, 'a') + repeat(1900, 'b'); // 100 common prefix
    const r = computeDelta(parent, proposed);
    expect(r.denominator).toBe(2000); // max(100, 2000) = 2000
    // changedBytes = 0 (parent changed) + 1900 (proposed changed) = 1900
    // fraction = 1900 / 2000 = 0.95 → exceeds
    expect(r.exceeds).toBe(true);
  });

  it('modest growth within bound is accepted when denominator is proposed size', () => {
    // Parent = 1000 bytes, proposed = 1100 bytes, only 100 new bytes added at end.
    const parent = repeat(1000, 'a');
    const proposed = repeat(1000, 'a') + repeat(100, 'b');
    const r = computeDelta(parent, proposed);
    expect(r.denominator).toBe(1100); // max(1000, 1100)
    // changedBytes = 0 (parent) + 100 (proposed new suffix) = 100
    // fraction = 100 / 1100 ≈ 0.091 → within 20%
    expect(r.exceeds).toBe(false);
    expect(r.fraction).toBeLessThanOrEqual(0.10);
  });
});

// ─── MAX_DELTA_FRACTION ───────────────────────────────────────────────────────

describe('MAX_DELTA_FRACTION constant', () => {
  it('is exactly 0.20', () => {
    expect(MAX_DELTA_FRACTION).toBe(0.20);
  });
});

// ─── deltaRejectionMessage ────────────────────────────────────────────────────

describe('deltaRejectionMessage', () => {
  it('includes SC-REFINE-BOUND tag', () => {
    const r = computeDelta(repeat(1000, 'a'), repeat(1000, 'b'));
    const msg = deltaRejectionMessage(r);
    expect(msg).toContain('SC-REFINE-BOUND');
  });

  it('includes percentage of the change', () => {
    const parent = repeat(1000, 'a');
    const proposed = repeat(600, 'a') + repeat(400, 'b');
    const r = computeDelta(parent, proposed);
    const msg = deltaRejectionMessage(r);
    // Should contain some percentage
    expect(msg).toMatch(/\d+\.\d+%/);
  });

  it('mentions the 20% limit', () => {
    const r = computeDelta(repeat(1000, 'a'), repeat(1000, 'b'));
    const msg = deltaRejectionMessage(r);
    expect(msg).toContain('20%');
  });
});

// ─── UTF-8 multi-byte characters ─────────────────────────────────────────────

describe('computeDelta — UTF-8 multi-byte', () => {
  it('measures bytes not char codes for multi-byte characters', () => {
    // '€' is 3 bytes in UTF-8.
    const parent = 'hello'; // 5 bytes
    const proposed = 'héllo'; // 6 bytes (é = 2 bytes)
    const r = computeDelta(parent, proposed);
    expect(r.parentBytes).toBe(5);
    expect(r.proposedBytes).toBe(6);
    // denominator = max(5, 6) = 6
    expect(r.denominator).toBe(6);
  });
});
