/**
 * Tests for Aminet .readme file parser.
 *
 * Covers:
 * - Parse complete .readme with all fields populated
 * - Parse minimal .readme with only Short field
 * - Parse multi-value Requires field (comma-separated)
 * - Parse multi-value Architecture field (semicolon-separated)
 * - Parse Author with email in parentheses
 * - Parse free-form description body after blank-line separator
 * - Handle Windows-style CRLF line endings mixed with LF
 * - Handle header continuation lines (leading whitespace)
 * - Handle unknown header fields preserved in rawHeader
 * - Handle empty input -> throw descriptive error
 * - Handle .readme with no blank separator (header only, no body)
 * - Case-insensitive field matching
 */

import { describe, it, expect } from 'vitest';
import { parseReadme } from './readme-parser.js';

// ============================================================================
// Complete .readme parsing
// ============================================================================

describe('parseReadme', () => {
  it('parses complete .readme with all fields populated', () => {
    const content = [
      'Short:    ProTracker v3.62b - The ultimate MOD tracker',
      'Uploader: lars@amiga.de',
      'Author:   Lars Hamre',
      'Type:     mus/edit',
      'Version:  3.62b',
      'Requires: OS 2.0+, 68000',
      'Architecture: m68k-amigaos',
      '',
      'This is the famous ProTracker, the most widely used',
      'Amiga MOD tracker.',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.short).toBe('ProTracker v3.62b - The ultimate MOD tracker');
    expect(result.author).toBe('Lars Hamre');
    expect(result.uploader).toBe('lars@amiga.de');
    expect(result.type).toBe('mus/edit');
    expect(result.version).toBe('3.62b');
    expect(result.requires).toEqual(['OS 2.0+', '68000']);
    expect(result.architecture).toEqual(['m68k-amigaos']);
    expect(result.description).toBe(
      'This is the famous ProTracker, the most widely used\nAmiga MOD tracker.',
    );
    expect(result.rawHeader).toEqual({
      short: 'ProTracker v3.62b - The ultimate MOD tracker',
      uploader: 'lars@amiga.de',
      author: 'Lars Hamre',
      type: 'mus/edit',
      version: '3.62b',
      requires: 'OS 2.0+, 68000',
      architecture: 'm68k-amigaos',
    });
  });

  // ==========================================================================
  // Minimal .readme (only Short field)
  // ==========================================================================

  it('parses .readme with only Short field (minimal valid)', () => {
    const content = 'Short: A simple tool';

    const result = parseReadme(content);

    expect(result.short).toBe('A simple tool');
    expect(result.author).toBeNull();
    expect(result.uploader).toBeNull();
    expect(result.type).toBeNull();
    expect(result.version).toBeNull();
    expect(result.requires).toEqual([]);
    expect(result.architecture).toEqual([]);
    expect(result.description).toBe('');
  });

  // ==========================================================================
  // Multi-value Requires field
  // ==========================================================================

  it('parses multi-value Requires with commas', () => {
    const content = [
      'Short: AGA Demo',
      'Requires: OS 3.0+, 68020+, AGA, 2MB chip',
      '',
      'Cool demo.',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.requires).toEqual(['OS 3.0+', '68020+', 'AGA', '2MB chip']);
  });

  // ==========================================================================
  // Multi-value Architecture field with semicolons
  // ==========================================================================

  it('parses multi-value Architecture with semicolons', () => {
    const content = [
      'Short: Cross-platform tool',
      'Architecture: m68k-amigaos; ppc-amigaos',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.architecture).toEqual(['m68k-amigaos', 'ppc-amigaos']);
  });

  it('parses multi-value Architecture with commas', () => {
    const content = [
      'Short: Cross-platform tool',
      'Architecture: m68k-amigaos, ppc-amigaos, generic',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.architecture).toEqual([
      'm68k-amigaos',
      'ppc-amigaos',
      'generic',
    ]);
  });

  // ==========================================================================
  // Author with email
  // ==========================================================================

  it('parses Author with email in parentheses', () => {
    const content = [
      'Short: Some tool',
      'Author: John Smith (john@example.com)',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.author).toBe('John Smith (john@example.com)');
  });

  // ==========================================================================
  // Free-form description body
  // ==========================================================================

  it('parses free-form description after blank line separator', () => {
    const content = [
      'Short: Test package',
      '',
      'Line one of description.',
      '',
      'Line three after inner blank line.',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.description).toBe(
      'Line one of description.\n\nLine three after inner blank line.',
    );
  });

  // ==========================================================================
  // CRLF line endings
  // ==========================================================================

  it('handles Windows-style CRLF line endings mixed with LF', () => {
    const content =
      'Short:    Windows readme\r\n' +
      'Author:   Bill\r\n' +
      '\r\n' +
      'Body text with CRLF.\r\n' +
      'Second line with LF.\n';

    const result = parseReadme(content);

    expect(result.short).toBe('Windows readme');
    expect(result.author).toBe('Bill');
    expect(result.description).toBe(
      'Body text with CRLF.\nSecond line with LF.',
    );
  });

  // ==========================================================================
  // Header continuation lines
  // ==========================================================================

  it('handles header field with continuation line (leading whitespace)', () => {
    const content = [
      'Short: A tool with a very long short description',
      '  that continues on the next line',
      'Author: Someone',
      '',
      'Body.',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.short).toBe(
      'A tool with a very long short description that continues on the next line',
    );
    expect(result.author).toBe('Someone');
  });

  // ==========================================================================
  // Unknown header fields
  // ==========================================================================

  it('preserves unknown header fields in rawHeader without failing', () => {
    const content = [
      'Short: Test',
      'Replaces: old-tool',
      'Kurz: Ein Werkzeug',
      '',
      'Body.',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.short).toBe('Test');
    expect(result.rawHeader['replaces']).toBe('old-tool');
    expect(result.rawHeader['kurz']).toBe('Ein Werkzeug');
  });

  // ==========================================================================
  // Empty input
  // ==========================================================================

  it('throws descriptive error on empty input', () => {
    expect(() => parseReadme('')).toThrow('Missing required Short field');
  });

  it('throws descriptive error on whitespace-only input', () => {
    expect(() => parseReadme('   \n  \n  ')).toThrow(
      'Missing required Short field',
    );
  });

  // ==========================================================================
  // No blank separator (header only, no body)
  // ==========================================================================

  it('handles .readme with no blank separator (header only)', () => {
    const content = [
      'Short: Header-only readme',
      'Author: Test',
      'Type: dev/misc',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.short).toBe('Header-only readme');
    expect(result.author).toBe('Test');
    expect(result.type).toBe('dev/misc');
    expect(result.description).toBe('');
  });

  // ==========================================================================
  // Case-insensitive field matching
  // ==========================================================================

  it('matches field names case-insensitively', () => {
    const content = [
      'short: lowercase',
      'AUTHOR: UPPERCASE',
      'Type: MixedCase',
      'version: 1.0',
    ].join('\n');

    const result = parseReadme(content);

    expect(result.short).toBe('lowercase');
    expect(result.author).toBe('UPPERCASE');
    expect(result.type).toBe('MixedCase');
    expect(result.version).toBe('1.0');
  });

  it('stores rawHeader keys in lowercase', () => {
    const content = 'Short: test\nAUTHOR: Bob';
    const result = parseReadme(content);

    expect(result.rawHeader['short']).toBe('test');
    expect(result.rawHeader['author']).toBe('Bob');
    // Uppercase keys should not exist
    expect(result.rawHeader['Short']).toBeUndefined();
    expect(result.rawHeader['AUTHOR']).toBeUndefined();
  });
});
