/**
 * tools/ship-review/__tests__/write-attestation.test.mjs
 *
 * node:test unit tests for the pure validation logic in write-attestation.mjs.
 * Tests use injected fixtures — no real git operations.
 *
 * Run: node --test tools/ship-review/__tests__/write-attestation.test.mjs
 * (auto-discovered + run by pre-tag-gate step 2.7 via check-tools-test-coverage.mjs)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAttestation } from '../write-attestation.mjs';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const HEAD_SHA = 'aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111';
const PREV_SHA = 'bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222';
const OLD_SHA  = 'cccc3333cccc3333cccc3333cccc3333cccc3333';
const TAG_SHA  = 'dddd4444dddd4444dddd4444dddd4444dddd4444';

/**
 * Ancestor mock: models a simple linear chain
 *   OLD_SHA → PREV_SHA → HEAD_SHA
 *   TAG_SHA is a sibling of PREV_SHA (ancestor of HEAD_SHA, NOT of PREV_SHA by our model)
 *
 * isAncestorOf(a, b) = true when a comes before b in the chain (or a === b).
 * For our linear test fixture:
 *   isAncestorOf(OLD_SHA, X)  = true for any X except OLD_SHA itself (below)
 *   isAncestorOf(PREV_SHA, HEAD_SHA) = true
 *   isAncestorOf(HEAD_SHA, HEAD_SHA) = true
 *   isAncestorOf(HEAD_SHA, PREV_SHA) = false  (HEAD is not an ancestor of PREV)
 *   isAncestorOf(TAG_SHA, HEAD_SHA) = true (TAG is on main, which HEAD has merged)
 */
function makeIsAncestorOf(headSha) {
  return function isAncestorOf(ancestor, descendant) {
    if (ancestor === descendant) return true;
    if (ancestor === OLD_SHA) return true;       // oldest — ancestor of everything
    if (ancestor === PREV_SHA && descendant === headSha) return true;
    if (ancestor === TAG_SHA && descendant === headSha) return true;
    return false;
  };
}

const isAncestorOf = makeIsAncestorOf(HEAD_SHA);

function makeAttestation(overrides = {}) {
  return {
    reviewedHead: HEAD_SHA,
    mode: 'full',
    writtenAt: '2026-06-10T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Check 1 — required fields + mode enum
// ---------------------------------------------------------------------------

describe('validateAttestation — check 1: required fields', () => {
  it('accepts a valid full-mode attestation', () => {
    const { valid } = validateAttestation(
      makeAttestation(),
      HEAD_SHA,
      TAG_SHA,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('accepts mode "scaled"', () => {
    const { valid } = validateAttestation(
      makeAttestation({ reviewedHead: PREV_SHA, mode: 'scaled' }),
      HEAD_SHA,
      null,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('accepts mode "content"', () => {
    const { valid } = validateAttestation(
      makeAttestation({ reviewedHead: PREV_SHA, mode: 'content' }),
      HEAD_SHA,
      null,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('rejects null attestation', () => {
    const { valid, reason } = validateAttestation(null, HEAD_SHA, null, isAncestorOf);
    assert.equal(valid, false);
    assert.match(reason, /not a JSON object/);
  });

  it('rejects missing reviewedHead', () => {
    const { valid, reason } = validateAttestation(
      makeAttestation({ reviewedHead: undefined }),
      HEAD_SHA, null, isAncestorOf,
    );
    assert.equal(valid, false);
    assert.match(reason, /reviewedHead/);
  });

  it('rejects invalid mode', () => {
    const { valid, reason } = validateAttestation(
      makeAttestation({ mode: 'unknown' }),
      HEAD_SHA, null, isAncestorOf,
    );
    assert.equal(valid, false);
    assert.match(reason, /invalid mode/);
  });

  it('rejects missing writtenAt', () => {
    const { valid, reason } = validateAttestation(
      makeAttestation({ writtenAt: undefined }),
      HEAD_SHA, null, isAncestorOf,
    );
    assert.equal(valid, false);
    assert.match(reason, /writtenAt/);
  });
});

// ---------------------------------------------------------------------------
// Check 2 — reviewedHead is ancestor of HEAD
// ---------------------------------------------------------------------------

describe('validateAttestation — check 2: reviewedHead must be ancestor of HEAD', () => {
  it('passes when reviewedHead === HEAD (reviewed at exactly HEAD)', () => {
    const { valid } = validateAttestation(
      makeAttestation({ reviewedHead: HEAD_SHA }),
      HEAD_SHA,
      null,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('passes when reviewedHead is an older ancestor of HEAD', () => {
    const { valid } = validateAttestation(
      makeAttestation({ reviewedHead: PREV_SHA }),
      HEAD_SHA,
      null,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('fails when reviewedHead is NOT an ancestor of HEAD', () => {
    // HEAD_SHA is not an ancestor of PREV_SHA in our fixture
    const { valid, reason } = validateAttestation(
      makeAttestation({ reviewedHead: HEAD_SHA }),
      PREV_SHA,      // HEAD is actually PREV; HEAD_SHA is a descendant, not ancestor
      null,
      isAncestorOf,
    );
    assert.equal(valid, false);
    assert.match(reason, /not an ancestor of HEAD/);
  });
});

// ---------------------------------------------------------------------------
// Check 3 — reviewedHead NOT ancestor of latest tag (freshness)
// ---------------------------------------------------------------------------

describe('validateAttestation — check 3: freshness (not stale from prior ship)', () => {
  it('skips check 3 when no tag exists (latestTagSha null)', () => {
    // PREV_SHA is an ancestor of HEAD but we pass null for tag → check 3 skipped
    const { valid } = validateAttestation(
      makeAttestation({ reviewedHead: PREV_SHA }),
      HEAD_SHA,
      null,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('passes when reviewedHead is NOT an ancestor of latest tag', () => {
    // HEAD_SHA is NOT an ancestor of TAG_SHA in our fixture (HEAD comes after TAG)
    // But in our isAncestorOf fixture, isAncestorOf(HEAD_SHA, TAG_SHA) = false
    const { valid } = validateAttestation(
      makeAttestation({ reviewedHead: HEAD_SHA }),
      HEAD_SHA,
      TAG_SHA,
      isAncestorOf,
    );
    assert.equal(valid, true);
  });

  it('fails when reviewedHead IS an ancestor of latest tag (stale from prior ship)', () => {
    // OLD_SHA is an ancestor of TAG_SHA in our fixture (isAncestorOf(OLD_SHA, TAG_SHA) = true)
    // This simulates an attestation written for the PREVIOUS ship.
    const { valid, reason } = validateAttestation(
      makeAttestation({ reviewedHead: OLD_SHA }),
      HEAD_SHA,
      TAG_SHA,
      isAncestorOf,
    );
    assert.equal(valid, false);
    assert.match(reason, /prior ship/);
  });
});
