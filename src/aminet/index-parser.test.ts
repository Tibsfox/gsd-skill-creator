/**
 * Tests for the Aminet INDEX parser.
 *
 * Validates fixed-width column parsing of the Aminet INDEX format,
 * including single-line extraction, header/blank line skipping,
 * lenient error handling, multi-line batching, and JSON cache I/O.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { parseIndexLine, parseAminetIndex, writeIndexCache, readIndexCache } from './index-parser.js';

describe('parseIndexLine', () => {
  it('parses a single well-formed line', () => {
    const line = 'ProTracker36.lha  mus/edit    234K  10 Ultimate MOD tracker';
    const result = parseIndexLine(line);

    expect(result).not.toBeNull();
    expect(result!.filename).toBe('ProTracker36.lha');
    expect(result!.directory).toBe('mus/edit');
    expect(result!.category).toBe('mus');
    expect(result!.subcategory).toBe('edit');
    expect(result!.sizeKb).toBe(234);
    expect(result!.ageDays).toBe(10);
    expect(result!.description).toBe('Ultimate MOD tracker');
    expect(result!.fullPath).toBe('mus/edit/ProTracker36.lha');
  });

  it('parses category/subcategory from directory path', () => {
    const line = 'AGADemo.lha  demo/aga   1.2M   5 AGA demo';
    const result = parseIndexLine(line);

    expect(result).not.toBeNull();
    expect(result!.category).toBe('demo');
    expect(result!.subcategory).toBe('aga');
    expect(result!.sizeKb).toBe(1200);
    expect(result!.ageDays).toBe(5);
  });

  it('parses large M-suffix sizes correctly', () => {
    const line = 'BigApp.lha  util/misc  12.3M 100 Big application';
    const result = parseIndexLine(line);

    expect(result).not.toBeNull();
    expect(result!.sizeKb).toBeCloseTo(12300, 0);
    expect(result!.ageDays).toBe(100);
  });

  it('parses zero age', () => {
    const line = 'NewFile.lha  dev/c       45K   0 Just uploaded';
    const result = parseIndexLine(line);

    expect(result).not.toBeNull();
    expect(result!.ageDays).toBe(0);
    expect(result!.description).toBe('Just uploaded');
  });

  it('handles descriptions with special characters', () => {
    const line = 'Sp\u00e9cial.lha  text/misc   99K   3 F\u00fcr \u00e4lle & "everyone" (v2.0)';
    const result = parseIndexLine(line);

    expect(result).not.toBeNull();
    expect(result!.filename).toBe('Sp\u00e9cial.lha');
    expect(result!.description).toBe('F\u00fcr \u00e4lle & "everyone" (v2.0)');
  });

  it('skips header lines starting with |', () => {
    const line = '| File                  Dir       Size Age Description';
    const result = parseIndexLine(line);
    expect(result).toBeNull();
  });

  it('skips separator lines with dashes', () => {
    const line = '|---------+----------|---+---+------';
    const result = parseIndexLine(line);
    expect(result).toBeNull();
  });

  it('skips blank lines', () => {
    expect(parseIndexLine('')).toBeNull();
    expect(parseIndexLine('   ')).toBeNull();
    expect(parseIndexLine('\t')).toBeNull();
  });

  it('returns null for malformed lines (lenient)', () => {
    // Line with only one token -- missing columns
    const result = parseIndexLine('orphan');
    expect(result).toBeNull();
  });

  it('computes fullPath correctly', () => {
    const line = 'MyTool.lha  dev/debug   12K   7 A debug tool';
    const result = parseIndexLine(line);

    expect(result).not.toBeNull();
    expect(result!.fullPath).toBe('dev/debug/MyTool.lha');
  });
});

describe('parseAminetIndex', () => {
  it('parses multiple well-formed lines', () => {
    const lines = [
      '| File                  Dir       Size Age Description',
      '|---------+----------|---+---+------',
      'Pkg1.lha  util/misc   100K  10 First package',
      'Pkg2.lha  dev/c       200K  20 Second package',
      'Pkg3.lha  mus/play    300K  30 Third package',
      'Pkg4.lha  gfx/edit    400K  40 Fourth package',
      'Pkg5.lha  comm/net    500K  50 Fifth package',
      'Pkg6.lha  text/doc    600K  60 Sixth package',
      'Pkg7.lha  game/shoot  700K  70 Seventh package',
      'Pkg8.lha  biz/dbase   800K  80 Eighth package',
      'Pkg9.lha  disk/misc   900K  90 Ninth package',
      'PkgA.lha  hard/drivr  999K  99 Tenth package',
    ];
    const content = lines.join('\n');
    const result = parseAminetIndex(content);

    expect(result.packages).toHaveLength(10);
    expect(result.parseErrors).toBe(0);
    expect(result.totalLines).toBe(12);
    expect(result.parsedAt).toBeTruthy();
    // Verify ISO 8601 format
    expect(() => new Date(result.parsedAt)).not.toThrow();
  });

  it('counts parse errors for malformed lines', () => {
    const content = [
      'Good.lha  util/misc  100K  10 Good line',
      'bad-line-missing-fields',
      'Also.lha  dev/c      200K  20 Also good',
    ].join('\n');
    const result = parseAminetIndex(content);

    expect(result.packages).toHaveLength(2);
    expect(result.parseErrors).toBe(1);
    expect(result.totalLines).toBe(3);
  });

  it('handles empty input', () => {
    const result = parseAminetIndex('');
    expect(result.packages).toHaveLength(0);
    expect(result.parseErrors).toBe(0);
  });
});

describe('index cache I/O', () => {
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = join(tmpdir(), `aminet-test-cache-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(cacheDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('writes and reads INDEX.json cache', async () => {
    const index = {
      packages: [
        {
          filename: 'Test.lha',
          directory: 'util/misc',
          category: 'util',
          subcategory: 'misc',
          sizeKb: 100,
          ageDays: 5,
          description: 'Test package',
          fullPath: 'util/misc/Test.lha',
        },
      ],
      parseErrors: 0,
      totalLines: 1,
      parsedAt: new Date().toISOString(),
    };

    await writeIndexCache(index, cacheDir);

    const cachePath = join(cacheDir, 'INDEX.json');
    expect(existsSync(cachePath)).toBe(true);

    const loaded = await readIndexCache(cacheDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.packages).toHaveLength(1);
    expect(loaded!.packages[0].filename).toBe('Test.lha');
    expect(loaded!.parseErrors).toBe(0);
  });

  it('returns null when cache does not exist', async () => {
    const result = await readIndexCache(join(cacheDir, 'nonexistent'));
    expect(result).toBeNull();
  });
});

describe('performance', () => {
  it('parses 84,000 entries in under 10 seconds (NFR-02)', () => {
    // Generate a synthetic INDEX with 84,000 realistic entries
    const categories = ['util', 'dev', 'mus', 'gfx', 'game', 'comm', 'text', 'biz', 'disk', 'hard'];
    const subcategories = ['misc', 'edit', 'play', 'show', 'shoot', 'net', 'doc', 'dbase', 'cdrom', 'drivr'];
    const lineCount = 84_000;

    const lines: string[] = [];
    // Add header
    lines.push('| File                  Dir       Size Age Description');
    lines.push('|---------+----------|---+---+------');

    for (let i = 0; i < lineCount; i++) {
      const cat = categories[i % categories.length];
      const sub = subcategories[i % subcategories.length];
      const size = ((i % 999) + 1);
      const age = i % 365;
      lines.push(`pkg${i}.lha  ${cat}/${sub}  ${size}K  ${age} Package number ${i} for Amiga`);
    }

    const content = lines.join('\n');

    const start = performance.now();
    const result = parseAminetIndex(content);
    const elapsed = performance.now() - start;

    // Log for CI visibility
    console.log(`  INDEX parse: ${lineCount} entries in ${elapsed.toFixed(1)}ms`);

    // All synthetic entries should parse successfully
    expect(result.packages).toHaveLength(lineCount);
    expect(result.parseErrors).toBe(0);
    expect(result.totalLines).toBe(lineCount + 2); // +2 for header lines

    // Must complete in under 10 seconds (NFR-02)
    expect(elapsed).toBeLessThan(10_000);
  });
});
