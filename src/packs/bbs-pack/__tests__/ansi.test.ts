/**
 * ANSI tokenization tests.
 *
 * Validates tokenizeAnsi for SGR, cursor, erase, and mixed input.
 * Includes integration test with real .ans binary fixture.
 *
 * Covers requirement: BBS-02 (shared ANSI parsing utility).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenizeAnsi } from '../shared/ansi.js';
import { decodeCp437 } from '../shared/cp437.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, '../../../data/bbs/fixtures');

// ============================================================================
// Plain Text
// ============================================================================

describe('plain text', () => {
  it('returns single text token for no-escape input', () => {
    const tokens = tokenizeAnsi('hello world');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('text');
    expect(tokens[0].raw).toBe('hello world');
  });

  it('returns empty array for empty string', () => {
    const tokens = tokenizeAnsi('');
    expect(tokens).toHaveLength(0);
  });
});

// ============================================================================
// SGR Sequences
// ============================================================================

describe('SGR sequences', () => {
  it('parses \\x1B[31m as sgr with params [31]', () => {
    const tokens = tokenizeAnsi('\x1B[31m');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('sgr');
    expect(tokens[0].params).toEqual([31]);
  });

  it('parses \\x1B[1;33m as sgr with params [1, 33]', () => {
    const tokens = tokenizeAnsi('\x1B[1;33m');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('sgr');
    expect(tokens[0].params).toEqual([1, 33]);
  });

  it('parses \\x1B[0m as sgr with params [0]', () => {
    const tokens = tokenizeAnsi('\x1B[0m');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('sgr');
    expect(tokens[0].params).toEqual([0]);
  });

  it('preserves raw escape sequence string', () => {
    const tokens = tokenizeAnsi('\x1B[31m');
    expect(tokens[0].raw).toBe('\x1B[31m');
  });
});

// ============================================================================
// Cursor and Erase
// ============================================================================

describe('cursor and erase', () => {
  it('parses \\x1B[10;20H as cursor token', () => {
    const tokens = tokenizeAnsi('\x1B[10;20H');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('cursor');
    expect(tokens[0].params).toEqual([10, 20]);
  });

  it('parses \\x1B[2J as erase token', () => {
    const tokens = tokenizeAnsi('\x1B[2J');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('erase');
    expect(tokens[0].params).toEqual([2]);
  });

  it('parses \\x1B[K as erase token', () => {
    const tokens = tokenizeAnsi('\x1B[K');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('erase');
    // Empty params string yields [0] (default)
    expect(tokens[0].params).toEqual([0]);
  });

  it('parses \\x1B[5A as cursor token (cursor up)', () => {
    const tokens = tokenizeAnsi('\x1B[5A');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('cursor');
    expect(tokens[0].params).toEqual([5]);
  });
});

// ============================================================================
// Mixed Input
// ============================================================================

describe('mixed input', () => {
  it('preserves all characters in mixed text+escape input', () => {
    const input = 'Hello\x1B[31m World\x1B[0m!';
    const tokens = tokenizeAnsi(input);

    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toEqual({ type: 'text', raw: 'Hello' });
    expect(tokens[1].type).toBe('sgr');
    expect(tokens[1].params).toEqual([31]);
    expect(tokens[2]).toEqual({ type: 'text', raw: ' World' });
    expect(tokens[3].type).toBe('sgr');
    expect(tokens[3].params).toEqual([0]);
    expect(tokens[4]).toEqual({ type: 'text', raw: '!' });
  });

  it('concatenated raw strings equal original input', () => {
    const input = 'Hello\x1B[31m World\x1B[0m!';
    const tokens = tokenizeAnsi(input);
    const reconstructed = tokens.map((t) => t.raw).join('');
    expect(reconstructed).toBe(input);
  });

  it('handles consecutive escape sequences with no text between', () => {
    const input = '\x1B[1m\x1B[31m';
    const tokens = tokenizeAnsi(input);
    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('sgr');
    expect(tokens[1].type).toBe('sgr');
  });
});

// ============================================================================
// Real Fixture Integration
// ============================================================================

describe('real fixture integration', () => {
  // Note: ANSI escape sequences use ASCII ESC (0x1B) which CP437 maps to
  // U+2190 (left arrow). The tokenizer must run on the raw string (latin1)
  // before CP437 decode. CP437 decode is for display; tokenization is for
  // parsing the control structure.

  it('tokenizes raw .ans fixture (latin1) without errors', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    // Read as latin1 to preserve ESC bytes as \x1B
    const asString = raw.toString('latin1');
    const tokens = tokenizeAnsi(asString);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('fixture contains at least one sgr token', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const asString = raw.toString('latin1');
    const tokens = tokenizeAnsi(asString);
    const sgrTokens = tokens.filter((t) => t.type === 'sgr');
    expect(sgrTokens.length).toBeGreaterThan(0);
  });

  it('fixture contains at least one text token', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const asString = raw.toString('latin1');
    const tokens = tokenizeAnsi(asString);
    const textTokens = tokens.filter((t) => t.type === 'text');
    expect(textTokens.length).toBeGreaterThan(0);
  });

  it('fixture text tokens include "BBS TEST ART"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const asString = raw.toString('latin1');
    const tokens = tokenizeAnsi(asString);
    const allText = tokens.filter((t) => t.type === 'text').map((t) => t.raw).join('');
    expect(allText).toContain('BBS TEST ART');
  });

  it('CP437 decode produces renderable Unicode from fixture', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const decoded = decodeCp437(raw);
    // After CP437 decode, ESC becomes left arrow, but the text content survives
    expect(decoded).toContain('BBS TEST ART');
    expect(decoded).toContain('\u2591'); // light shade from 0xB0
  });
});
