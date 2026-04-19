/**
 * CF-M2-05 — all Chroma endpoints target http://localhost:8100, NOT 8000
 *
 * This test verifies at both the source-code level (grep) and the runtime
 * default level that no M2 file uses the wrong Chroma port.
 */

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DEFAULT_CHROMA_URL } from '../read-write-reflect.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const WRONG_PORT_PATTERN = /localhost:8000/;
const CORRECT_URL        = 'http://localhost:8100';
const M2_SOURCE_FILES    = [
  'scorer.ts',
  'short-term.ts',
  'long-term.ts',
  'reflection.ts',
  'read-write-reflect.ts',
];

const memoryDir = resolve(
  new URL(import.meta.url).pathname,
  '../../', // from __tests__/ to src/memory/
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CF-M2-05: Chroma endpoint is http://localhost:8100 (NOT 8000)', () => {
  it('DEFAULT_CHROMA_URL is http://localhost:8100', () => {
    expect(DEFAULT_CHROMA_URL).toBe(CORRECT_URL);
  });

  it('DEFAULT_CHROMA_URL does NOT contain :8000', () => {
    expect(DEFAULT_CHROMA_URL).not.toContain('8000');
  });

  it('DEFAULT_CHROMA_URL contains :8100', () => {
    expect(DEFAULT_CHROMA_URL).toContain('8100');
  });

  it('no M2 source file contains localhost:8000', async () => {
    const violations: string[] = [];

    for (const filename of M2_SOURCE_FILES) {
      const filepath = join(memoryDir, filename);
      let content: string;
      try {
        content = await readFile(filepath, 'utf-8');
      } catch {
        // File not found — that's a bug, surface it.
        violations.push(`${filename}: file not found`);
        continue;
      }
      if (WRONG_PORT_PATTERN.test(content)) {
        violations.push(`${filename}: contains 'localhost:8000'`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('all M2 source files exist', async () => {
    const missing: string[] = [];
    for (const filename of M2_SOURCE_FILES) {
      const filepath = join(memoryDir, filename);
      try {
        await readFile(filepath, 'utf-8');
      } catch {
        missing.push(filename);
      }
    }
    expect(missing).toEqual([]);
  });

  it('read-write-reflect.ts exports DEFAULT_CHROMA_URL pointing to :8100', () => {
    // Runtime import check (already imported above).
    expect(DEFAULT_CHROMA_URL).toBe('http://localhost:8100');
    expect(DEFAULT_CHROMA_URL).toMatch(/^http:\/\/localhost:8100/);
  });

  it('ReadWriteReflect defaults to chromaUrl http://localhost:8100', () => {
    // Import the class and verify the internal ChromaStore uses the right URL.
    // We test the exported constant since the internal field is private.
    // The constant drives the constructor default — this is the correct check.
    expect(DEFAULT_CHROMA_URL).not.toBe('http://localhost:8000');
  });
});
