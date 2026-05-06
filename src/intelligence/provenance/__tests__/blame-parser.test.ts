/**
 * blame-parser — porcelain edge-case coverage (v1.49.607 W1 Track B).
 */
import { describe, it, expect } from 'vitest';
import { parseBlamePorcelain } from '../blame-parser.js';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

describe('blame-parser', () => {
  it('returns empty array for empty input', () => {
    expect(parseBlamePorcelain('')).toEqual([]);
  });

  it('parses a single-line blame block', () => {
    const out = [
      `${SHA_A} 1 1 1`,
      'author Alice',
      'author-mail <alice@example.com>',
      'author-time 1700000000',
      'author-tz +0000',
      'committer Alice',
      'committer-mail <alice@example.com>',
      'committer-time 1700000000',
      'committer-tz +0000',
      'summary initial',
      'filename src/a.ts',
      '\thello',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(1);
    expect(result[0].line_no).toBe(1);
    expect(result[0].commit_sha).toBe(SHA_A);
    expect(result[0].original_line_no).toBe(1);
    expect(result[0].original_file_path).toBe('src/a.ts');
  });

  it('parses a multi-line block with shorthand headers reusing filename', () => {
    const out = [
      `${SHA_A} 1 1 3`,
      'author A',
      'filename src/x.ts',
      '\tline-1',
      `${SHA_A} 2 2`,
      '\tline-2',
      `${SHA_A} 3 3`,
      '\tline-3',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(3);
    expect(result.map((b) => b.line_no)).toEqual([1, 2, 3]);
    // Every line should resolve back to src/x.ts via the shorthand reuse.
    for (const b of result) {
      expect(b.original_file_path).toBe('src/x.ts');
      expect(b.commit_sha).toBe(SHA_A);
    }
  });

  it('detects -CCC cross-file rename (filename differs from current path)', () => {
    const out = [
      `${SHA_A} 5 1 1`,
      'author A',
      'filename src/old.ts',
      '\tmoved code',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(1);
    expect(result[0].original_line_no).toBe(5);
    expect(result[0].original_file_path).toBe('src/old.ts');
  });

  it('handles a UTF-8 BOM at the start of the stream', () => {
    const out = [
      `﻿${SHA_A} 1 1 1`,
      'filename src/a.ts',
      '\tcontent',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(1);
    expect(result[0].commit_sha).toBe(SHA_A);
  });

  it('preserves CR inside the blamed content line without breaking parsing', () => {
    const out = [
      `${SHA_A} 1 1 1`,
      'filename src/a.ts',
      '\tline-with-cr\r',
      `${SHA_A} 2 2`,
      '\tnext',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(2);
    expect(result[0].line_no).toBe(1);
    expect(result[1].line_no).toBe(2);
  });

  it('switches commit sha mid-stream and tracks per-commit filename', () => {
    const out = [
      `${SHA_A} 1 1 1`,
      'filename src/a.ts',
      '\tline-A',
      `${SHA_B} 7 2 1`,
      'filename src/b.ts',
      '\tline-B',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(2);
    expect(result[0].commit_sha).toBe(SHA_A);
    expect(result[0].original_file_path).toBe('src/a.ts');
    expect(result[1].commit_sha).toBe(SHA_B);
    expect(result[1].original_line_no).toBe(7);
    expect(result[1].original_file_path).toBe('src/b.ts');
  });

  it('rejects header lines that are not 40-hex SHA prefixed', () => {
    const out = [
      `not-a-sha 1 1 1`,
      'filename src/a.ts',
      '\tcontent',
      '',
    ].join('\n');

    expect(parseBlamePorcelain(out)).toEqual([]);
  });

  it('tolerates absence of author-mail metadata (only filename + content required)', () => {
    const out = [
      `${SHA_A} 10 1 1`,
      'filename src/a.ts',
      '\tcontent',
      '',
    ].join('\n');

    const result = parseBlamePorcelain(out);
    expect(result.length).toBe(1);
    expect(result[0].original_line_no).toBe(10);
  });
});
