/**
 * v1.49.637 C3 — R14 passphrase-quality (zxcvbn) validator tests.
 *
 * Covers the validator at `src/keystore/passphrase-quality.ts`:
 *   - rejection of weak passphrases (score < default threshold)
 *   - acceptance of strong passphrases (score >= 3)
 *   - boundary behavior at score 2 and score 3
 *   - env-var override (`SC_PASSPHRASE_MIN_SCORE`) lowering and raising
 *   - error message format (rejected passphrase NEVER echoed)
 *
 * The zxcvbn scores used here were probed live against the installed
 * `@zxcvbn-ts/core@^3.0.4` + `@zxcvbn-ts/language-en@^3.0.2` packages
 * during C3 implementation (W1A.T3). If a future zxcvbn-ts release
 * changes scoring for any fixture, update the fixture rather than the
 * threshold.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  validatePassphraseQuality,
  assertPassphraseQuality,
  formatRejectionMessage,
  PassphraseQualityError,
  DEFAULT_MIN_SCORE,
  ENV_VAR_OVERRIDE,
} from '../passphrase-quality.js';

// Save + restore the env var across tests so override tests don't leak.
let savedEnvVar: string | undefined;
beforeEach(() => {
  savedEnvVar = process.env[ENV_VAR_OVERRIDE];
  delete process.env[ENV_VAR_OVERRIDE];
});
afterEach(() => {
  if (savedEnvVar === undefined) delete process.env[ENV_VAR_OVERRIDE];
  else process.env[ENV_VAR_OVERRIDE] = savedEnvVar;
});

describe('validatePassphraseQuality — default threshold (score >= 3)', () => {
  it('rejects weak passphrase (score 1: "password123") at default threshold', () => {
    const r = validatePassphraseQuality('password123');
    expect(r.accepted).toBe(false);
    expect(r.score).toBe(1);
    expect(r.requiredScore).toBe(DEFAULT_MIN_SCORE);
    expect(r.feedback.suggestions.length).toBeGreaterThan(0);
  });

  it('accepts strong passphrase (score 4: "correct horse battery staple stadium electric")', () => {
    const r = validatePassphraseQuality(
      'correct horse battery staple stadium electric',
    );
    expect(r.accepted).toBe(true);
    expect(r.score).toBe(4);
  });

  it('accepts at exact boundary (score 3: "rocket banana")', () => {
    const r = validatePassphraseQuality('rocket banana');
    expect(r.score).toBe(3);
    expect(r.accepted).toBe(true);
  });

  it('rejects at boundary-minus-one (score 2: "sunset42") at default; accepts under minScore=2', () => {
    const rDefault = validatePassphraseQuality('sunset42');
    expect(rDefault.score).toBe(2);
    expect(rDefault.accepted).toBe(false);

    const rOverride = validatePassphraseQuality('sunset42', { minScore: 2 });
    expect(rOverride.score).toBe(2);
    expect(rOverride.accepted).toBe(true);
  });
});

describe('validatePassphraseQuality — SC_PASSPHRASE_MIN_SCORE env-var override', () => {
  it('SC_PASSPHRASE_MIN_SCORE=0 accepts even score-0 passphrase ("a")', () => {
    process.env[ENV_VAR_OVERRIDE] = '0';
    const r = validatePassphraseQuality('a');
    expect(r.score).toBe(0);
    expect(r.requiredScore).toBe(0);
    expect(r.accepted).toBe(true);
  });

  it('SC_PASSPHRASE_MIN_SCORE=4 rejects score-3 passphrase ("rocket banana")', () => {
    process.env[ENV_VAR_OVERRIDE] = '4';
    const r = validatePassphraseQuality('rocket banana');
    expect(r.score).toBe(3);
    expect(r.requiredScore).toBe(4);
    expect(r.accepted).toBe(false);
  });

  it('invalid env-var value falls back to default (warning + DEFAULT_MIN_SCORE)', () => {
    process.env[ENV_VAR_OVERRIDE] = 'not-a-number';
    const r = validatePassphraseQuality('password123');
    // Falls back to DEFAULT_MIN_SCORE=3; password123 scores 1; still rejected.
    expect(r.requiredScore).toBe(DEFAULT_MIN_SCORE);
    expect(r.accepted).toBe(false);
  });

  it('out-of-range env-var value (negative) falls back to default', () => {
    process.env[ENV_VAR_OVERRIDE] = '-1';
    const r = validatePassphraseQuality('password123');
    expect(r.requiredScore).toBe(DEFAULT_MIN_SCORE);
  });

  it('out-of-range env-var value (>4) falls back to default', () => {
    process.env[ENV_VAR_OVERRIDE] = '5';
    const r = validatePassphraseQuality('password123');
    expect(r.requiredScore).toBe(DEFAULT_MIN_SCORE);
  });
});

describe('error-message format', () => {
  it('formatRejectionMessage includes score + required + suggestions but NEVER the passphrase', () => {
    const SECRET = 'password123';
    const r = validatePassphraseQuality(SECRET);
    expect(r.accepted).toBe(false);
    const msg = formatRejectionMessage(r);
    expect(msg).toContain(`Score: ${r.score}`);
    expect(msg).toContain(`required: >= ${r.requiredScore}`);
    expect(msg).toContain('Suggestions:');
    // SECURITY INVARIANT: the rejected passphrase MUST NOT appear in the message.
    expect(msg).not.toContain(SECRET);
    // Override hint uses `keystore migrate` (not `keystore enroll` — that
    // subcommand does not exist; design verdict NIT #2).
    expect(msg).toContain('keystore migrate');
    expect(msg).not.toContain('keystore enroll');
  });

  it('PassphraseQualityError carries structured result and message without the passphrase', () => {
    const SECRET = 'password123';
    const err = (() => {
      try {
        assertPassphraseQuality(SECRET);
        return null;
      } catch (e) {
        return e as PassphraseQualityError;
      }
    })();
    expect(err).toBeInstanceOf(PassphraseQualityError);
    expect(err!.score).toBe(1);
    expect(err!.requiredScore).toBe(DEFAULT_MIN_SCORE);
    expect(err!.suggestions.length).toBeGreaterThan(0);
    expect(err!.message).not.toContain(SECRET);
    // Programmatic result must not have a `passphrase` field at all.
    expect((err!.result as unknown as Record<string, unknown>).passphrase).toBeUndefined();
  });

  it('assertPassphraseQuality returns silently on accept', () => {
    expect(() =>
      assertPassphraseQuality(
        'correct horse battery staple stadium electric',
      ),
    ).not.toThrow();
  });
});
